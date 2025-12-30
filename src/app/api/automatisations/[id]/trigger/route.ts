// ===========================================
// API: DÉCLENCHER UN WORKFLOW
// POST /api/automatisations/[id]/trigger - Déclencher manuellement
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { triggerWorkflow } from "@/lib/queue/workflow-execution.queue";

// ===========================================
// SCHÉMA DE VALIDATION
// ===========================================

const triggerSchema = z.object({
  declencheurType: z.string().optional(),
  declencheurId: z.string().optional(),
  declencheurData: z.record(z.string(), z.unknown()).optional(),
  test: z.boolean().optional(), // Mode test: permet de déclencher même si inactif
});

// ===========================================
// POST - Déclencher un workflow
// ===========================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authentification
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer l'utilisateur avec son organisation
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que le workflow existe et appartient à l'organisation
    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        organizationId: dbUser.organizationId,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow non trouvé" },
        { status: 404 }
      );
    }

    // Parser les données
    const body = await request.json().catch(() => ({}));
    const data = triggerSchema.parse(body);

    // Vérifier si actif (sauf en mode test)
    if (!workflow.actif && !data.test) {
      return NextResponse.json(
        { error: "Le workflow est inactif" },
        { status: 400 }
      );
    }

    // Déclencher le workflow
    const executionId = await triggerWorkflow(
      id,
      data.declencheurType || "MANUEL",
      data.declencheurId || dbUser.id,
      {
        ...data.declencheurData,
        triggeredBy: dbUser.id,
        triggeredAt: new Date().toISOString(),
      }
    );

    if (!executionId) {
      return NextResponse.json(
        { error: "Impossible de déclencher le workflow" },
        { status: 500 }
      );
    }

    // Récupérer l'exécution créée
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
    });

    return NextResponse.json({
      success: true,
      executionId,
      execution,
    });

  } catch (error) {
    console.error("[API] POST /api/automatisations/[id]/trigger error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
