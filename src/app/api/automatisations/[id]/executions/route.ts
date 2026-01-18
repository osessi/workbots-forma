// ===========================================
// API: EXÉCUTIONS D'UN WORKFLOW
// GET /api/automatisations/[id]/executions - Liste des exécutions
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

// ===========================================
// GET - Liste des exécutions
// ===========================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authentification
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que le workflow existe et appartient à l'organisation
    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les exécutions
    const executions = await prisma.workflowExecution.findMany({
      where: {
        workflowId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Limiter à 100 dernières exécutions
    });

    return NextResponse.json({
      executions,
      total: executions.length,
    });

  } catch (error) {
    console.error("[API] GET /api/automatisations/[id]/executions error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
