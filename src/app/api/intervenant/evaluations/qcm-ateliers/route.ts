// ===========================================
// API INTERVENANT QCM & ATELIERS - GET /api/intervenant/evaluations/qcm-ateliers
// ===========================================
// Correction 513: Récupère les QCM et ateliers disponibles pour la session

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

    // Vérifier l'accès à la session
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

    // Récupérer les QCM et Ateliers de la formation
    const evaluations = await prisma.evaluation.findMany({
      where: {
        formationId: session.formationId,
        isActive: true,
        type: {
          in: ["QCM_MODULE", "ATELIER_MODULE"],
        },
      },
      select: {
        id: true,
        titre: true,
        type: true,
        moduleId: true,
        contenu: true,
      },
      orderBy: { ordre: "asc" },
    });

    // Récupérer les noms des modules
    const moduleIds = evaluations.filter(e => e.moduleId).map(e => e.moduleId as string);
    const modules = await prisma.module.findMany({
      where: { id: { in: moduleIds } },
      select: { id: true, titre: true },
    });
    const moduleMap = new Map(modules.map(m => [m.id, m.titre]));

    // Formater les données
    const items = evaluations.map(evaluation => {
      // Vérifier si un corrigé existe (pour QCM: correctAnswer défini, pour Atelier: corrige défini)
      let hasCorrige = false;
      try {
        const contenu = evaluation.contenu as Record<string, unknown>;
        if (evaluation.type === "QCM_MODULE") {
          // Pour QCM: vérifier si les questions ont des correctAnswer
          const questions = contenu?.questions as Array<{ correctAnswer?: unknown }> || [];
          hasCorrige = questions.some(q => q.correctAnswer !== undefined);
        } else if (evaluation.type === "ATELIER_MODULE") {
          // Pour Atelier: vérifier si un corrigé/exemple de rendu existe
          hasCorrige = !!(contenu?.corrige || contenu?.exempleRendu);
        }
      } catch {
        hasCorrige = false;
      }

      return {
        id: evaluation.id,
        titre: evaluation.titre,
        type: evaluation.type as "QCM_MODULE" | "ATELIER_MODULE",
        moduleNom: evaluation.moduleId ? moduleMap.get(evaluation.moduleId) : undefined,
        hasCorrige,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Erreur API QCM/Ateliers intervenant:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
