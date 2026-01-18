// ===========================================
// API EVALUATION - CRUD par ID
// ===========================================
// GET /api/evaluations/[id] - Récupérer une évaluation
// PATCH /api/evaluations/[id] - Modifier une évaluation
// DELETE /api/evaluations/[id] - Supprimer une évaluation

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

// GET - Récupérer une évaluation avec ses résultats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    // Récupérer l'évaluation avec vérification d'appartenance
    const evaluation = await prisma.evaluation.findFirst({
      where: {
        id,
        formation: {
          organizationId: user.organizationId,
        },
      },
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
        resultats: {
          include: {
            apprenant: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
              },
            },
          },
          orderBy: { completedAt: "desc" },
        },
      },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Évaluation non trouvée" }, { status: 404 });
    }

    // Calculer des statistiques
    const completedResultats = evaluation.resultats.filter(r => r.completedAt);
    const stats = {
      totalResultats: evaluation.resultats.length,
      completed: completedResultats.length,
      averageScore: completedResultats.length > 0
        ? completedResultats.reduce((acc, r) => acc + (r.score || 0), 0) / completedResultats.length
        : null,
      passRate: evaluation.scoreMinimum && completedResultats.length > 0
        ? (completedResultats.filter(r => (r.score || 0) >= (evaluation.scoreMinimum || 0)).length / completedResultats.length) * 100
        : null,
    };

    return NextResponse.json({
      evaluation,
      stats,
    });
  } catch (error) {
    console.error("Erreur récupération évaluation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'évaluation" },
      { status: 500 }
    );
  }
}

// PATCH - Modifier une évaluation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Vérifier que l'évaluation existe et appartient à l'organisation
    const existingEvaluation = await prisma.evaluation.findFirst({
      where: {
        id,
        formation: {
          organizationId: user.organizationId,
        },
      },
    });

    if (!existingEvaluation) {
      return NextResponse.json({ error: "Évaluation non trouvée" }, { status: 404 });
    }

    // Construire les données de mise à jour
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (body.titre !== undefined) updateData.titre = body.titre;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.dureeEstimee !== undefined) updateData.dureeEstimee = body.dureeEstimee ? parseInt(body.dureeEstimee) : null;
    if (body.contenu !== undefined) updateData.contenu = body.contenu;
    if (body.scoreMinimum !== undefined) updateData.scoreMinimum = body.scoreMinimum ? parseFloat(body.scoreMinimum) : null;
    if (body.nombreQuestions !== undefined) updateData.nombreQuestions = body.nombreQuestions ? parseInt(body.nombreQuestions) : null;
    if (body.tempsLimite !== undefined) updateData.tempsLimite = body.tempsLimite ? parseInt(body.tempsLimite) : null;
    if (body.melangerQuestions !== undefined) updateData.melangerQuestions = body.melangerQuestions;
    if (body.melangerReponses !== undefined) updateData.melangerReponses = body.melangerReponses;
    if (body.ordre !== undefined) updateData.ordre = body.ordre;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Mettre à jour l'évaluation
    const evaluation = await prisma.evaluation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Erreur modification évaluation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification de l'évaluation" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une évaluation (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que l'évaluation existe et appartient à l'organisation
    const existingEvaluation = await prisma.evaluation.findFirst({
      where: {
        id,
        formation: {
          organizationId: user.organizationId,
        },
      },
    });

    if (!existingEvaluation) {
      return NextResponse.json({ error: "Évaluation non trouvée" }, { status: 404 });
    }

    // Soft delete - désactiver l'évaluation
    await prisma.evaluation.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: "Évaluation désactivée" });
  } catch (error) {
    console.error("Erreur suppression évaluation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'évaluation" },
      { status: 500 }
    );
  }
}
