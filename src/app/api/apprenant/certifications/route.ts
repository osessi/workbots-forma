// ===========================================
// API CERTIFICATIONS APPRENANT - GET /api/apprenant/certifications
// ===========================================
// Corrections 477-482: Attestation et Diplôme de fin de formation
// Retourne la disponibilité de l'attestation et du diplôme pour la session

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Décoder et valider le token apprenant
function decodeApprenantToken(token: string): { apprenantId: string; organizationId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));

    if (!decoded.apprenantId || !decoded.organizationId) {
      return null;
    }

    // Vérifier expiration
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }

    return {
      apprenantId: decoded.apprenantId,
      organizationId: decoded.organizationId,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token et sessionId depuis les query params
    const token = request.nextUrl.searchParams.get("token");
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 401 }
      );
    }

    // Décoder le token
    const decoded = decodeApprenantToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    const { apprenantId, organizationId } = decoded;

    // Récupérer les participations aux sessions
    const whereClause = sessionId
      ? { apprenantId, client: { sessionId } }
      : { apprenantId, client: { session: { organizationId } } };

    const participations = await prisma.sessionParticipantNew.findMany({
      where: whereClause,
      include: {
        client: {
          include: {
            session: {
              include: {
                journees: {
                  orderBy: { date: "asc" },
                  // Récupérer toutes les journées pour calculer période début/fin
                },
                formation: {
                  select: {
                    id: true,
                    titre: true,
                    evaluations: {
                      where: {
                        type: "EVALUATION_FINALE",
                        isActive: true,
                      },
                    },
                  },
                },
                organization: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        apprenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });

    if (participations.length === 0) {
      return NextResponse.json({
        attestation: null,
        diplome: null,
      });
    }

    // Prendre la première participation (session sélectionnée ou première)
    const participation = participations[0];
    const session = participation.client.session;
    const formation = session.formation;
    const apprenant = participation.apprenant;

    // Calculer la disponibilité de l'attestation
    // L'attestation est disponible 1h avant la fin de la dernière journée
    const journees = session.journees;
    const derniereJournee = journees.length > 0 ? journees[journees.length - 1] : null;
    const premiereJournee = journees.length > 0 ? journees[0] : null;
    let attestationDisponible = false;
    let attestationDateDisponibilite: Date | null = null;

    if (derniereJournee) {
      // Construire la date/heure de fin de session (heure de fin après-midi)
      const heureFinAprem = derniereJournee.heureFinAprem || "17:30";
      const [heureH, heureM] = heureFinAprem.split(":").map(Number);

      const dateFinSession = new Date(derniereJournee.date);
      dateFinSession.setHours(heureH, heureM, 0, 0);

      // L'attestation est disponible 1h avant la fin
      attestationDateDisponibilite = new Date(dateFinSession.getTime() - 60 * 60 * 1000);
      attestationDisponible = new Date() >= attestationDateDisponibilite;
    }

    // Calculer la disponibilité du diplôme
    // Le diplôme est disponible si l'apprenant a passé l'évaluation finale avec au moins 50%
    let diplomeDisponible = false;
    let diplomeScore: number | null = null;
    let diplomeScoreMinimum = 50; // Score minimum requis (%)

    if (formation.evaluations.length > 0) {
      const evaluationFinale = formation.evaluations[0];

      // Chercher le résultat de l'apprenant pour cette évaluation
      const resultat = await prisma.evaluationResultat.findFirst({
        where: {
          evaluationId: evaluationFinale.id,
          apprenantId,
          status: { in: ["termine", "valide"] },
        },
        orderBy: {
          tentative: "desc",
        },
      });

      if (resultat && resultat.score !== null) {
        diplomeScore = resultat.score;
        // Utiliser le score minimum de l'évaluation si défini, sinon 50%
        diplomeScoreMinimum = evaluationFinale.scoreMinimum || 50;
        diplomeDisponible = resultat.score >= diplomeScoreMinimum;
      }
    }

    // Construire la réponse
    return NextResponse.json({
      attestation: {
        disponible: attestationDisponible,
        dateDisponibilite: attestationDateDisponibilite?.toISOString() || null,
        sessionId: session.id,
        sessionReference: session.reference,
        sessionNom: session.nom,
        formationTitre: formation.titre,
        apprenant: {
          nom: apprenant.nom,
          prenom: apprenant.prenom,
        },
        organisme: session.organization?.name || null,
        periode: derniereJournee && premiereJournee
          ? {
              debut: premiereJournee.date.toISOString(),
              fin: derniereJournee.date.toISOString(),
            }
          : null,
      },
      diplome: {
        disponible: diplomeDisponible,
        score: diplomeScore,
        scoreMinimum: diplomeScoreMinimum,
        sessionId: session.id,
        sessionReference: session.reference,
        sessionNom: session.nom,
        formationTitre: formation.titre,
        apprenant: {
          nom: apprenant.nom,
          prenom: apprenant.prenom,
        },
        organisme: session.organization?.name || null,
        dateObtention: diplomeDisponible ? new Date().toISOString() : null,
      },
    });
  } catch (error) {
    console.error("Erreur API certifications apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des certifications" },
      { status: 500 }
    );
  }
}
