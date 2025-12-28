// ===========================================
// API SUIVI PÉDAGOGIQUE - GET /api/apprenant/suivi
// ===========================================
// Récupère les données de suivi pédagogique pour l'apprenant

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
    // Récupérer le token depuis les query params
    const token = request.nextUrl.searchParams.get("token");
    const inscriptionId = request.nextUrl.searchParams.get("inscriptionId");

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

    // Récupérer l'inscription LMS avec les données de progression
    const inscription = await prisma.lMSInscription.findFirst({
      where: inscriptionId
        ? { id: inscriptionId, apprenantId }
        : { apprenantId },
      include: {
        formation: {
          include: {
            modules: {
              orderBy: { ordre: "asc" },
            },
          },
        },
        progressionModules: true,
      },
    });

    if (!inscription) {
      return NextResponse.json({
        progression: {
          global: 0,
          statut: "NON_COMMENCE",
          tempsTotal: 0,
          modulesTermines: 0,
          totalModules: 0,
        },
        modules: [],
        evaluations: { total: 0, reussies: 0, moyenneScore: null },
        presence: { joursPresents: 0, joursTotal: 0, tauxPresence: 0 },
        statistiques: { tempsHebdo: 0, dernierAcces: null, joursConsecutifs: 0 },
      });
    }

    // Calculer la progression par module
    const modules = inscription.formation.modules.map((module) => {
      const progression = inscription.progressionModules.find(
        (p) => p.moduleId === module.id
      );
      return {
        id: module.id,
        titre: module.titre,
        ordre: module.ordre,
        duree: module.duree,
        progression: progression?.progression || 0,
        statut: progression?.statut || "NON_COMMENCE",
        tempsConsacre: progression?.tempsConsacre || 0,
      };
    });

    const modulesTermines = modules.filter((m) => m.statut === "TERMINE").length;
    const totalModules = modules.length;

    // Récupérer les résultats d'évaluations
    const evaluations = await prisma.evaluationResultat.findMany({
      where: {
        apprenantId,
        evaluation: {
          formationId: inscription.formationId,
        },
      },
    });

    const evaluationsReussies = evaluations.filter(
      (e) => e.status === "valide" || e.status === "termine"
    ).length;

    const scoresEvaluations = evaluations
      .filter((e) => e.score !== null)
      .map((e) => e.score!);

    const moyenneScore = scoresEvaluations.length > 0
      ? Math.round(scoresEvaluations.reduce((a, b) => a + b, 0) / scoresEvaluations.length)
      : null;

    // Récupérer les données de présence (simplifié pour éviter les erreurs de relation)
    let joursTotal = 0;
    let joursPresents = 0;
    let tauxPresence = 0;

    try {
      const participations = await prisma.sessionParticipantNew.findMany({
        where: {
          apprenantId,
        },
        include: {
          signatures: true,
          client: {
            include: {
              session: {
                include: {
                  journees: true,
                },
              },
            },
          },
        },
      });

      for (const participation of participations) {
        if (participation.client?.session?.formationId === inscription.formationId) {
          const session = participation.client.session;
          joursTotal += session.journees?.length || 0;

          // Compter les jours où l'apprenant a signé au moins une fois
          const joursAvecSignature = new Set(
            participation.signatures?.map((s) => s.feuilleId) || []
          );
          joursPresents += joursAvecSignature.size;
        }
      }

      tauxPresence = joursTotal > 0
        ? Math.round((joursPresents / joursTotal) * 100)
        : 0;
    } catch (presenceError) {
      console.error("Erreur récupération présence:", presenceError);
      // Continuer sans les données de présence
    }

    // Calculer le temps passé cette semaine (simulation)
    const tempsHebdo = inscription.tempsTotal ? Math.min(inscription.tempsTotal * 0.3, 480) : 0;

    // Récupérer le nombre total d'évaluations de la formation
    const totalEvaluations = await prisma.evaluation.count({
      where: {
        formationId: inscription.formationId,
        isActive: true,
      },
    });

    return NextResponse.json({
      progression: {
        global: inscription.progression,
        statut: inscription.statut,
        tempsTotal: inscription.tempsTotal,
        modulesTermines,
        totalModules,
      },
      modules,
      evaluations: {
        total: totalEvaluations,
        reussies: evaluationsReussies,
        moyenneScore,
      },
      presence: {
        joursPresents,
        joursTotal,
        tauxPresence,
      },
      statistiques: {
        tempsHebdo: Math.round(tempsHebdo),
        dernierAcces: inscription.updatedAt?.toISOString() || null,
        joursConsecutifs: 0, // À implémenter avec un système de tracking
      },
    });
  } catch (error) {
    console.error("Erreur API suivi apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du suivi" },
      { status: 500 }
    );
  }
}
