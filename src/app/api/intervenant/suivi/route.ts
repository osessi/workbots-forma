// ===========================================
// API INTERVENANT SUIVI - GET /api/intervenant/suivi
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
      include: {
        journees: { select: { id: true } },
        clients: {
          include: {
            participants: {
              include: {
                apprenant: {
                  select: {
                    id: true,
                    nom: true,
                    prenom: true,
                  },
                },
                signatures: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
    }

    const totalJournees = session.journees.length;
    const expectedSignatures = totalJournees * 2; // matin + aprem

    // Récupérer les évaluations complétées
    const evaluations = await prisma.evaluation.findMany({
      where: {
        formationId: session.formationId,
        isActive: true,
      },
      select: { id: true },
    });

    const totalEvaluations = evaluations.length;

    // Construire les données de suivi pour chaque apprenant
    const apprenants = session.clients.flatMap(client =>
      client.participants.map(participant => {
        const signaturesCount = participant.signatures.length;
        const presenceRate = expectedSignatures > 0
          ? Math.round((signaturesCount / expectedSignatures) * 100)
          : 0;

        // Progression simulée (basée sur la présence)
        const progression = presenceRate;

        // Déterminer le statut
        let statut: "excellent" | "bon" | "attention" | "critique";
        if (presenceRate >= 90) statut = "excellent";
        else if (presenceRate >= 70) statut = "bon";
        else if (presenceRate >= 50) statut = "attention";
        else statut = "critique";

        return {
          id: participant.apprenant.id,
          nom: participant.apprenant.nom,
          prenom: participant.apprenant.prenom,
          progression,
          presenceRate,
          evaluationsCompletes: 0, // À implémenter avec les vrais résultats
          evaluationsTotal: totalEvaluations,
          statut,
        };
      })
    );

    // Trier par nom
    apprenants.sort((a, b) => a.nom.localeCompare(b.nom));

    return NextResponse.json({ apprenants });
  } catch (error) {
    console.error("Erreur API suivi intervenant:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
