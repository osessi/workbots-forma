// ===========================================
// API EVALUATIONS APPRENANT - GET /api/apprenant/evaluations
// ===========================================
// Récupère les évaluations disponibles pour l'apprenant

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

    // Récupérer l'inscription pour avoir la formation
    const inscription = await prisma.lMSInscription.findFirst({
      where: inscriptionId
        ? { id: inscriptionId, apprenantId }
        : { apprenantId },
    });

    if (!inscription) {
      return NextResponse.json({
        evaluations: [],
        stats: { total: 0, terminees: 0, enAttente: 0, moyenneScore: null },
      });
    }

    // Récupérer les évaluations de la formation
    const evaluations = await prisma.evaluation.findMany({
      where: {
        formationId: inscription.formationId,
        isActive: true,
      },
      include: {
        resultats: {
          where: { apprenantId },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { ordre: "asc" },
    });

    // Formater les données
    const formattedEvaluations = evaluations.map((evaluation) => ({
      id: evaluation.id,
      titre: evaluation.titre,
      type: evaluation.type,
      description: evaluation.description,
      dureeEstimee: evaluation.dureeEstimee,
      scoreMinimum: evaluation.scoreMinimum,
      ordre: evaluation.ordre,
      resultat: evaluation.resultats[0]
        ? {
            id: evaluation.resultats[0].id,
            status: evaluation.resultats[0].status,
            score: evaluation.resultats[0].score,
            datePassage: evaluation.resultats[0].completedAt?.toISOString() || null,
            tempsTotal: evaluation.resultats[0].tempsPassé,
          }
        : null,
    }));

    // Calculer les stats
    const terminees = formattedEvaluations.filter(
      (e) => e.resultat?.status === "termine" || e.resultat?.status === "valide"
    ).length;
    const scores = formattedEvaluations
      .filter((e) => e.resultat?.score !== null && e.resultat?.score !== undefined)
      .map((e) => e.resultat!.score!);
    const moyenneScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

    return NextResponse.json({
      evaluations: formattedEvaluations,
      stats: {
        total: evaluations.length,
        terminees,
        enAttente: evaluations.length - terminees,
        moyenneScore,
      },
    });
  } catch (error) {
    console.error("Erreur API évaluations apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des évaluations" },
      { status: 500 }
    );
  }
}
