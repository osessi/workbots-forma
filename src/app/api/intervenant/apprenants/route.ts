// ===========================================
// API INTERVENANT APPRENANTS - GET /api/intervenant/apprenants
// ===========================================
// Récupère la liste des apprenants d'une session

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

    // Vérifier expiration
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
    });

    if (!session) {
      return NextResponse.json({ error: "Session non trouvée ou accès non autorisé" }, { status: 404 });
    }

    // Récupérer les apprenants via les clients de la session
    const sessionWithParticipants = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        clients: {
          include: {
            participants: {
              include: {
                apprenant: {
                  select: {
                    id: true,
                    nom: true,
                    prenom: true,
                    email: true,
                    telephone: true,
                  },
                },
                signatures: {
                  select: {
                    id: true,
                    periode: true,
                  },
                },
              },
            },
            entreprise: {
              select: {
                raisonSociale: true,
              },
            },
          },
        },
        journees: {
          select: { id: true },
        },
      },
    });

    if (!sessionWithParticipants) {
      return NextResponse.json({ apprenants: [] });
    }

    // Transformer les données
    const apprenants = sessionWithParticipants.clients.flatMap(client =>
      client.participants.map(participant => {
        // Calculer le statut de présence
        const totalJournees = sessionWithParticipants.journees.length;
        const signaturesCount = participant.signatures.length;
        const expectedSignatures = totalJournees * 2; // matin + aprem

        let presenceStatus = "inconnu";
        if (expectedSignatures > 0) {
          const presenceRate = signaturesCount / expectedSignatures;
          if (presenceRate >= 0.9) presenceStatus = "present";
          else if (presenceRate >= 0.5) presenceStatus = "partiel";
          else if (signaturesCount === 0) presenceStatus = "inconnu";
          else presenceStatus = "absent";
        }

        return {
          id: participant.apprenant.id,
          nom: participant.apprenant.nom,
          prenom: participant.apprenant.prenom,
          email: participant.apprenant.email,
          telephone: participant.apprenant.telephone,
          entrepriseNom: client.entreprise?.raisonSociale,
          presenceStatus,
          progression: Math.round((signaturesCount / Math.max(expectedSignatures, 1)) * 100),
        };
      })
    );

    // Trier par nom
    apprenants.sort((a, b) => a.nom.localeCompare(b.nom));

    return NextResponse.json({ apprenants });
  } catch (error) {
    console.error("Erreur API apprenants intervenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des apprenants" },
      { status: 500 }
    );
  }
}
