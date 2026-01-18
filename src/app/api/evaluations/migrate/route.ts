// ===========================================
// API EVALUATIONS - Migration JSON vers Table
// ===========================================
// POST /api/evaluations/migrate - Migrer les évaluations d'une formation

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

// Types pour le JSON d'évaluations existant
interface QuestionQCM {
  question: string;
  options: string[];
  correctAnswer: number;
  explication?: string;
}

interface EvaluationJSON {
  titre?: string;
  questions?: QuestionQCM[];
  type?: string;
  moduleId?: string;
  moduleTitre?: string;
  description?: string;
  duree?: number;
}

interface EvaluationsData {
  positionnement?: EvaluationJSON;
  finale?: EvaluationJSON;
  modules?: EvaluationJSON[];
  ateliers?: EvaluationJSON[];
}

// POST - Migrer les évaluations JSON d'une formation vers la table Evaluation
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { formationId } = body;

    if (!formationId) {
      return NextResponse.json({ error: "L'ID de la formation est requis" }, { status: 400 });
    }

    // Récupérer la formation avec ses évaluations JSON
    const formation = await prisma.formation.findFirst({
      where: {
        id: formationId,
        organizationId: user.organizationId,
      },
      select: {
        id: true,
        titre: true,
        evaluationsData: true,
      },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
    }

    const evaluationsData = formation.evaluationsData as EvaluationsData | null;

    if (!evaluationsData) {
      return NextResponse.json({
        message: "Aucune évaluation JSON à migrer",
        migrated: 0,
      });
    }

    // Vérifier si des évaluations existent déjà
    const existingCount = await prisma.evaluation.count({
      where: { formationId },
    });

    if (existingCount > 0) {
      return NextResponse.json({
        message: "Des évaluations existent déjà pour cette formation",
        existingCount,
        migrated: 0,
      });
    }

    const evaluationsToCreate = [];
    let ordre = 0;

    // 1. Migrer l'évaluation de positionnement
    if (evaluationsData.positionnement?.questions) {
      evaluationsToCreate.push({
        formationId,
        type: "POSITIONNEMENT" as const,
        titre: evaluationsData.positionnement.titre || "Évaluation de positionnement",
        description: "Test de positionnement pour évaluer les connaissances initiales des apprenants",
        contenu: {
          questions: evaluationsData.positionnement.questions.map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explication: q.explication || null,
          })),
        },
        scoreMinimum: null,
        nombreQuestions: evaluationsData.positionnement.questions.length,
        melangerQuestions: true,
        melangerReponses: true,
        ordre: ordre++,
      });
    }

    // 2. Migrer les QCM par module
    if (evaluationsData.modules && Array.isArray(evaluationsData.modules)) {
      for (const moduleEval of evaluationsData.modules) {
        if (moduleEval.questions) {
          evaluationsToCreate.push({
            formationId,
            type: "QCM_MODULE" as const,
            moduleId: moduleEval.moduleId || null,
            titre: moduleEval.titre || moduleEval.moduleTitre || "QCM Module",
            description: moduleEval.description || null,
            dureeEstimee: moduleEval.duree || null,
            contenu: {
              questions: moduleEval.questions.map(q => ({
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explication: q.explication || null,
              })),
            },
            scoreMinimum: 70,
            nombreQuestions: moduleEval.questions.length,
            melangerQuestions: true,
            melangerReponses: true,
            ordre: ordre++,
          });
        }
      }
    }

    // 3. Migrer les ateliers par module
    if (evaluationsData.ateliers && Array.isArray(evaluationsData.ateliers)) {
      for (const atelier of evaluationsData.ateliers) {
        evaluationsToCreate.push({
          formationId,
          type: "ATELIER_MODULE" as const,
          moduleId: atelier.moduleId || null,
          titre: atelier.titre || "Atelier pratique",
          description: atelier.description || null,
          dureeEstimee: atelier.duree || null,
          contenu: JSON.parse(JSON.stringify(atelier)),
          scoreMinimum: null,
          nombreQuestions: null,
          melangerQuestions: false,
          melangerReponses: false,
          ordre: ordre++,
        });
      }
    }

    // 4. Migrer l'évaluation finale
    if (evaluationsData.finale?.questions) {
      evaluationsToCreate.push({
        formationId,
        type: "FINALE" as const,
        titre: evaluationsData.finale.titre || "Évaluation finale",
        description: "Évaluation finale pour valider les acquis de la formation",
        contenu: {
          questions: evaluationsData.finale.questions.map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explication: q.explication || null,
          })),
        },
        scoreMinimum: 70,
        nombreQuestions: evaluationsData.finale.questions.length,
        melangerQuestions: true,
        melangerReponses: true,
        ordre: ordre++,
      });
    }

    // Créer les évaluations
    if (evaluationsToCreate.length > 0) {
      await prisma.evaluation.createMany({
        data: evaluationsToCreate,
      });
    }

    return NextResponse.json({
      message: "Migration réussie",
      migrated: evaluationsToCreate.length,
      details: {
        positionnement: evaluationsData.positionnement ? 1 : 0,
        modules: evaluationsData.modules?.length || 0,
        ateliers: evaluationsData.ateliers?.length || 0,
        finale: evaluationsData.finale ? 1 : 0,
      },
    });
  } catch (error) {
    console.error("Erreur migration évaluations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la migration des évaluations" },
      { status: 500 }
    );
  }
}
