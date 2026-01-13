// ===========================================
// API ROUTE: INDICATEURS DE FORMATION (Correction 363)
// Calcul du taux de progression Qualiopi IND 2
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Récupérer les indicateurs d'une formation (incluant le taux de progression)
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: formationId } = await params;

    // Vérifier que la formation appartient à l'organisation de l'utilisateur
    const formation = await prisma.formation.findFirst({
      where: {
        id: formationId,
        organizationId: user.organizationId,
      },
      include: {
        indicateurs: true,
      },
    });

    if (!formation) {
      return NextResponse.json(
        { error: "Formation non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: formation.indicateurs || {
        tauxSatisfaction: null,
        tauxProgression: null,
        nombreApprenantsProgression: 0,
        tauxReussite: null,
        tauxCertification: null,
        nombreStagiaires: 0,
        nombreAvis: 0,
      },
    });
  } catch (error) {
    console.error("Erreur récupération indicateurs:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST: Calculer/Mettre à jour le taux de progression (Correction 363)
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: formationId } = await params;

    // Vérifier que la formation appartient à l'organisation de l'utilisateur
    const formation = await prisma.formation.findFirst({
      where: {
        id: formationId,
        organizationId: user.organizationId,
      },
    });

    if (!formation) {
      return NextResponse.json(
        { error: "Formation non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer les évaluations de type POSITIONNEMENT et FINALE pour cette formation
    const evaluations = await prisma.evaluation.findMany({
      where: {
        formationId,
        type: {
          in: ["POSITIONNEMENT", "FINALE"],
        },
      },
      select: {
        id: true,
        type: true,
      },
    });

    const positionnementEval = evaluations.find(e => e.type === "POSITIONNEMENT");
    const finaleEval = evaluations.find(e => e.type === "FINALE");

    if (!positionnementEval || !finaleEval) {
      // Pas assez d'évaluations pour calculer la progression
      return NextResponse.json({
        success: true,
        data: {
          tauxProgression: null,
          nombreApprenantsProgression: 0,
          message: "Les évaluations de positionnement et finale sont nécessaires pour calculer le taux de progression",
        },
      });
    }

    // Récupérer les résultats des deux évaluations
    const resultatsPositionnement = await prisma.evaluationResultat.findMany({
      where: {
        evaluationId: positionnementEval.id,
        status: "termine",
        score: { not: null },
      },
      select: {
        apprenantId: true,
        score: true,
      },
    });

    const resultatsFinale = await prisma.evaluationResultat.findMany({
      where: {
        evaluationId: finaleEval.id,
        status: "termine",
        score: { not: null },
      },
      select: {
        apprenantId: true,
        score: true,
      },
    });

    // Créer un map pour les scores du positionnement
    const scoresPositionnement = new Map<string, number>();
    resultatsPositionnement.forEach(r => {
      if (r.score !== null) {
        scoresPositionnement.set(r.apprenantId, r.score);
      }
    });

    // Calculer la progression pour chaque apprenant ayant complété les deux évaluations
    const progressions: number[] = [];

    resultatsFinale.forEach(resultatFinale => {
      const scorePositionnement = scoresPositionnement.get(resultatFinale.apprenantId);
      if (scorePositionnement !== undefined && resultatFinale.score !== null) {
        // Calcul de la progression: (score finale - score positionnement)
        // On peut aussi calculer en pourcentage d'amélioration: ((finale - positionnement) / (100 - positionnement)) * 100
        const progression = resultatFinale.score - scorePositionnement;
        progressions.push(progression);
      }
    });

    let tauxProgression: number | null = null;
    const nombreApprenantsProgression = progressions.length;

    if (progressions.length > 0) {
      // Calculer la moyenne des progressions
      const somme = progressions.reduce((acc, val) => acc + val, 0);
      tauxProgression = Math.round((somme / progressions.length) * 10) / 10; // Arrondir à 1 décimale
    }

    // Mettre à jour ou créer les indicateurs de la formation
    const indicateurs = await prisma.formationIndicateurs.upsert({
      where: { formationId },
      update: {
        tauxProgression,
        nombreApprenantsProgression,
        dernierCalcul: new Date(),
      },
      create: {
        formationId,
        tauxProgression,
        nombreApprenantsProgression,
        dernierCalcul: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        tauxProgression: indicateurs.tauxProgression,
        nombreApprenantsProgression: indicateurs.nombreApprenantsProgression,
        dernierCalcul: indicateurs.dernierCalcul,
        detailCalcul: {
          nombreResultatsPositionnement: resultatsPositionnement.length,
          nombreResultatsFinale: resultatsFinale.length,
          nombreApprenantsComplets: progressions.length,
        },
      },
    });
  } catch (error) {
    console.error("Erreur calcul taux progression:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
