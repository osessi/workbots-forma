// ===========================================
// API INTERVENANT EMARGEMENTS - GET /api/intervenant/emargements
// ===========================================
// Récupère les journées et émargements d'une session

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Décoder et valider le token intervenant
function decodeIntervenantToken(token: string): { intervenantId: string; organizationId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));

    if (!decoded.intervenantId || !decoded.organizationId) {
      return null;
    }

    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }

    return {
      intervenantId: decoded.intervenantId,
      organizationId: decoded.organizationId,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    }

    const decoded = decodeIntervenantToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID requis" }, { status: 400 });
    }

    const { intervenantId, organizationId } = decoded;

    // Vérifier que l'intervenant a accès à cette session
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        organizationId,
        OR: [
          { formateurId: intervenantId },
          { coFormateurs: { some: { intervenantId } } },
        ],
      },
      include: {
        clients: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session non trouvée ou accès non autorisé" }, { status: 404 });
    }

    // Calculer le nombre total de participants
    const totalParticipants = session.clients.reduce(
      (sum, client) => sum + client.participants.length,
      0
    );

    // Récupérer les journées avec les feuilles d'émargement
    const journees = await prisma.sessionJourneeNew.findMany({
      where: { sessionId },
      include: {
        feuillesEmargement: {
          include: {
            signatures: {
              select: {
                id: true,
                periode: true,
                participantId: true,
              },
            },
          },
        },
      },
      orderBy: { date: "asc" },
    });

    // Transformer les données
    const journeesData = journees.map(journee => {
      const feuille = journee.feuillesEmargement[0];
      const signatures = feuille?.signatures || [];

      const signaturesMatin = signatures.filter(s => s.periode === "matin").length;
      const signaturesAprem = signatures.filter(s => s.periode === "aprem").length;

      return {
        id: journee.id,
        date: journee.date.toISOString(),
        heureDebutMatin: journee.heureDebutMatin,
        heureFinMatin: journee.heureFinMatin,
        heureDebutAprem: journee.heureDebutAprem,
        heureFinAprem: journee.heureFinAprem,
        feuilleId: feuille?.id,
        signaturesMatin,
        signaturesAprem,
        totalParticipants,
      };
    });

    return NextResponse.json({ journees: journeesData });
  } catch (error) {
    console.error("Erreur API émargements intervenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des émargements" },
      { status: 500 }
    );
  }
}
