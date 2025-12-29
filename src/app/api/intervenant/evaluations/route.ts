// ===========================================
// API INTERVENANT EVALUATIONS - GET /api/intervenant/evaluations
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

function decodeIntervenantToken(token: string): { intervenantId: string; organizationId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));
    if (!decoded.intervenantId || !decoded.organizationId) return null;
    if (decoded.exp && decoded.exp < Date.now()) return null;
    return { intervenantId: decoded.intervenantId, organizationId: decoded.organizationId };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    const decoded = decodeIntervenantToken(token);
    if (!decoded) return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    if (!sessionId) return NextResponse.json({ error: "Session ID requis" }, { status: 400 });

    const { intervenantId, organizationId } = decoded;

    // Vérifier l'accès
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        organizationId,
        OR: [
          { formateurId: intervenantId },
          { coFormateurs: { some: { intervenantId } } },
        ],
      },
      select: { formationId: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
    }

    // Récupérer les évaluations de la formation
    const evaluations = await prisma.evaluation.findMany({
      where: {
        formationId: session.formationId,
        isActive: true,
      },
      include: {
        resultats: {
          select: {
            id: true,
            score: true,
            status: true,
          },
        },
      },
    });

    // Compter le nombre de participants pour la session
    const sessionClients = await prisma.sessionClient.findMany({
      where: { sessionId },
      include: {
        participants: {
          select: { id: true },
        },
      },
    });

    const nombreTotal = sessionClients.reduce((sum, c) => sum + c.participants.length, 0);

    const evaluationsData = evaluations.map(evaluation => ({
      id: evaluation.id,
      titre: evaluation.titre,
      type: evaluation.type,
      dateCreation: evaluation.createdAt.toISOString(),
      nombreReponses: evaluation.resultats.filter(r => r.status === "termine" || r.status === "valide").length,
      nombreTotal,
      moyenneScore: evaluation.resultats.length > 0
        ? evaluation.resultats.filter(r => r.score !== null).reduce((sum, r) => sum + (r.score || 0), 0) / evaluation.resultats.filter(r => r.score !== null).length
        : undefined,
    }));

    return NextResponse.json({ evaluations: evaluationsData });
  } catch (error) {
    console.error("Erreur API évaluations intervenant:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
