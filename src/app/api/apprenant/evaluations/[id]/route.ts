// ===========================================
// API EVALUATION DETAILS - GET /api/apprenant/evaluations/[id]
// ===========================================
// Récupère les détails d'une évaluation spécifique pour l'apprenant

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.nextUrl.searchParams.get("token");
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 401 }
      );
    }

    const decoded = decodeApprenantToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    const { apprenantId, organizationId } = decoded;

    // Récupérer l'évaluation
    const evaluation = await prisma.evaluation.findFirst({
      where: {
        id,
        formation: {
          organizationId,
        },
        isActive: true,
      },
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
        module: {
          select: {
            id: true,
            titre: true,
            ordre: true,
          },
        },
        resultats: {
          where: {
            apprenantId,
            ...(sessionId ? { sessionId } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!evaluation) {
      return NextResponse.json(
        { error: "Évaluation non trouvée" },
        { status: 404 }
      );
    }

    // Parser le contenu
    const contenu = evaluation.contenu as {
      questions?: Array<{
        question: string;
        answers: string[];
        correctAnswer?: number;
        explanation?: string;
      }>;
      instructions?: string;
    } | null;

    // Retirer les réponses correctes si l'apprenant n'a pas encore terminé
    const resultat = evaluation.resultats[0];
    const isCompleted = resultat?.status === "termine" || resultat?.status === "valide";

    // Formatter les questions (sans les réponses correctes si pas terminé)
    const questions = contenu?.questions?.map((q, index) => ({
      index,
      question: q.question,
      answers: q.answers,
      // Ne montrer la réponse correcte que si terminé
      ...(isCompleted ? {
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      } : {}),
    })) || [];

    return NextResponse.json({
      evaluation: {
        id: evaluation.id,
        titre: evaluation.titre,
        type: evaluation.type,
        description: evaluation.description,
        dureeEstimee: evaluation.dureeEstimee,
        scoreMinimum: evaluation.scoreMinimum,
        instructions: contenu?.instructions || null,
        questionsCount: questions.length,
        questions,
        formation: evaluation.formation,
        module: evaluation.module,
      },
      resultat: resultat ? {
        id: resultat.id,
        status: resultat.status,
        score: resultat.score,
        reponses: resultat.reponses,
        tentative: resultat.tentative,
        completedAt: resultat.completedAt?.toISOString() || null,
      } : null,
      isCompleted,
      sessionId: sessionId || null,
    });
  } catch (error) {
    console.error("Erreur API évaluation details:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'évaluation" },
      { status: 500 }
    );
  }
}
