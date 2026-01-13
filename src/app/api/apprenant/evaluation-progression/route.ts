// ===========================================
// API ÉVALUATIONS PROGRESSION APPRENANT - GET /api/apprenant/evaluation-progression
// ===========================================
// Corrections 442-446: Récupère les évaluations de progression pour la session sélectionnée
// - Test de positionnement (début de formation)
// - Évaluation finale (fin de formation)
//
// Règles d'activation :
// - Test de positionnement : disponible 7 jours avant le début de la session
// - Évaluation finale : disponible 2 heures avant la fin de la formation

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Constantes de configuration
const POSITIONNEMENT_DAYS_BEFORE = 7; // Jours avant le début de la session
const FINALE_HOURS_BEFORE_END = 2; // Heures avant la fin de la dernière journée

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
    // Récupérer le token depuis les query params
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

    const { apprenantId } = decoded;

    if (!sessionId) {
      return NextResponse.json({
        evaluations: [],
        stats: { total: 0, disponibles: 0, enAttente: 0, completees: 0 },
        session: null,
      });
    }

    // Récupérer la participation de l'apprenant à la session
    const participation = await prisma.sessionParticipantNew.findFirst({
      where: {
        apprenantId,
        client: {
          sessionId,
        },
      },
      include: {
        client: {
          include: {
            session: {
              include: {
                formation: {
                  select: {
                    id: true,
                    titre: true,
                    evaluationsData: true,
                  },
                },
                journees: {
                  orderBy: { date: "asc" },
                },
              },
            },
          },
        },
        // Résultats d'évaluation pour cet apprenant
        evaluationResultats: true,
      },
    });

    if (!participation || !participation.client?.session) {
      return NextResponse.json({
        evaluations: [],
        stats: { total: 0, disponibles: 0, enAttente: 0, completees: 0 },
        session: null,
      });
    }

    const session = participation.client.session;
    const journees = session.journees || [];

    // Calculer les dates de début et fin de session
    const now = new Date();
    let dateDebut: Date | null = null;
    let dateFin: Date | null = null;

    if (journees.length > 0) {
      // Première journée = début
      dateDebut = new Date(journees[0].date);
      const heureDebutMatin = journees[0].heureDebutMatin || "09:00";
      const [hDebut, mDebut] = heureDebutMatin.split(":").map(Number);
      dateDebut.setHours(hDebut, mDebut, 0, 0);

      // Dernière journée = fin
      const derniereJournee = journees[journees.length - 1];
      dateFin = new Date(derniereJournee.date);
      const heureFinAprem = derniereJournee.heureFinAprem || "17:30";
      const [hFin, mFin] = heureFinAprem.split(":").map(Number);
      dateFin.setHours(hFin, mFin, 0, 0);
    }

    // Récupérer les évaluations de type POSITIONNEMENT et FINALE liées à la formation
    const evaluationsFormation = await prisma.evaluation.findMany({
      where: {
        formationId: session.formation.id,
        type: {
          in: ["POSITIONNEMENT", "EVALUATION_FINALE"],
        },
      },
      include: {
        resultats: {
          where: {
            apprenantId,
            sessionId,
          },
        },
      },
    });

    // Créer un map des évaluations par type
    const evaluationPositionnement = evaluationsFormation.find((e) => e.type === "POSITIONNEMENT");
    const evaluationFinale = evaluationsFormation.find((e) => e.type === "EVALUATION_FINALE");

    // Construire les évaluations de progression
    interface EvaluationProgression {
      id: string;
      type: "positionnement" | "finale";
      titre: string;
      description: string;
      statut: "a_venir" | "disponible" | "complete";
      dateOuverture: string | null;
      dateCompletion: string | null;
      score: number | null;
      canAccess: boolean;
      evaluationId: string | null;
    }

    const evaluations: EvaluationProgression[] = [];

    // === TEST DE POSITIONNEMENT ===
    // Disponible 7 jours avant le début de la session
    let positionnementStatut: "a_venir" | "disponible" | "complete" = "a_venir";
    let positionnementDateOuverture: Date | null = null;
    let positionnementCanAccess = false;
    const positionnementResultat = evaluationPositionnement?.resultats?.[0];

    if (dateDebut) {
      positionnementDateOuverture = new Date(dateDebut);
      positionnementDateOuverture.setDate(positionnementDateOuverture.getDate() - POSITIONNEMENT_DAYS_BEFORE);

      if (positionnementResultat?.status === "termine" || positionnementResultat?.status === "valide") {
        positionnementStatut = "complete";
        positionnementCanAccess = true; // Pour revoir les réponses
      } else if (now >= positionnementDateOuverture) {
        positionnementStatut = "disponible";
        positionnementCanAccess = true;
      }
    }

    evaluations.push({
      id: `${sessionId}-positionnement`,
      type: "positionnement",
      titre: "Test de positionnement",
      description: "Évaluez vos connaissances avant le début de la formation",
      statut: positionnementStatut,
      dateOuverture: positionnementDateOuverture?.toISOString() || null,
      dateCompletion: positionnementResultat?.datePassage?.toISOString() || null,
      score: positionnementResultat?.score || null,
      canAccess: positionnementCanAccess,
      evaluationId: evaluationPositionnement?.id || null,
    });

    // === ÉVALUATION FINALE ===
    // Disponible 2 heures avant la fin de la dernière journée
    let finaleStatut: "a_venir" | "disponible" | "complete" = "a_venir";
    let finaleDateOuverture: Date | null = null;
    let finaleCanAccess = false;
    const finaleResultat = evaluationFinale?.resultats?.[0];

    if (dateFin) {
      finaleDateOuverture = new Date(dateFin);
      finaleDateOuverture.setHours(finaleDateOuverture.getHours() - FINALE_HOURS_BEFORE_END);

      if (finaleResultat?.status === "termine" || finaleResultat?.status === "valide") {
        finaleStatut = "complete";
        finaleCanAccess = true; // Pour revoir les réponses
      } else if (now >= finaleDateOuverture) {
        finaleStatut = "disponible";
        finaleCanAccess = true;
      }
    }

    evaluations.push({
      id: `${sessionId}-finale`,
      type: "finale",
      titre: "Évaluation finale",
      description: "Évaluez vos acquis à l'issue de la formation",
      statut: finaleStatut,
      dateOuverture: finaleDateOuverture?.toISOString() || null,
      dateCompletion: finaleResultat?.datePassage?.toISOString() || null,
      score: finaleResultat?.score || null,
      canAccess: finaleCanAccess,
      evaluationId: evaluationFinale?.id || null,
    });

    // Calculer les stats
    const total = 2;
    const completees = evaluations.filter((e) => e.statut === "complete").length;
    const disponibles = evaluations.filter((e) => e.statut === "disponible").length;
    const enAttente = total - completees;

    return NextResponse.json({
      evaluations,
      stats: {
        total,
        disponibles,
        enAttente,
        completees,
      },
      session: {
        id: session.id,
        reference: session.reference,
        nom: session.nom,
        dateDebut: dateDebut?.toISOString() || null,
        dateFin: dateFin?.toISOString() || null,
        formationTitre: session.formation.titre,
      },
    });
  } catch (error) {
    console.error("Erreur API évaluation-progression apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des évaluations de progression" },
      { status: 500 }
    );
  }
}
