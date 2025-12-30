// ===========================================
// API: WORKFLOW INDIVIDUEL
// GET /api/automatisations/[id] - Détails d'un workflow
// PATCH /api/automatisations/[id] - Mettre à jour un workflow
// DELETE /api/automatisations/[id] - Supprimer un workflow
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { WorkflowTriggerType, WorkflowCategory, WorkflowActionType, Prisma } from "@prisma/client";

// ===========================================
// SCHÉMAS DE VALIDATION
// ===========================================

const updateWorkflowEtapeSchema = z.object({
  id: z.string().optional(), // ID existant si mise à jour
  type: z.nativeEnum(WorkflowActionType),
  nom: z.string().optional(),
  description: z.string().optional(),
  config: z.record(z.string(), z.unknown()),
  ordre: z.number().int().min(0),
  positionX: z.number().optional().default(0),
  positionY: z.number().optional().default(0),
  conditions: z.array(z.object({
    type: z.string(),
    config: z.record(z.string(), z.unknown()),
  })).optional(),
  continuerSurErreur: z.boolean().optional().default(false),
  nombreReessais: z.number().int().min(0).optional().default(0),
  delaiReessai: z.number().int().min(0).optional().default(60),
  etapeSuivanteId: z.string().optional().nullable(),
  etapeSuivanteOuiId: z.string().optional().nullable(),
  etapeSuivanteNonId: z.string().optional().nullable(),
});

const updateWorkflowSchema = z.object({
  nom: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  icone: z.string().optional().nullable(),
  categorie: z.nativeEnum(WorkflowCategory).optional(),
  triggerType: z.nativeEnum(WorkflowTriggerType).optional(),
  triggerConfig: z.record(z.string(), z.unknown()).optional().nullable(),
  actif: z.boolean().optional(),
  etapes: z.array(updateWorkflowEtapeSchema).optional(),
});

// ===========================================
// GET - Détails d'un workflow
// ===========================================

export async function GET(
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
      select: { organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer le workflow
    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        organizationId: dbUser.organizationId,
      },
      include: {
        etapes: {
          orderBy: { ordre: "asc" },
        },
        executions: {
          orderBy: { debutAt: "desc" },
          take: 10,
          include: {
            etapesExecution: true,
          },
        },
        logs: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        _count: {
          select: { executions: true },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(workflow);

  } catch (error) {
    console.error("[API] GET /api/automatisations/[id] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// ===========================================
// PATCH - Mettre à jour un workflow
// ===========================================

export async function PATCH(
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
      select: { organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que le workflow existe et appartient à l'organisation
    const existingWorkflow = await prisma.workflow.findFirst({
      where: {
        id,
        organizationId: dbUser.organizationId,
      },
      include: {
        etapes: true,
      },
    });

    if (!existingWorkflow) {
      return NextResponse.json(
        { error: "Workflow non trouvé" },
        { status: 404 }
      );
    }

    // Parser et valider les données
    const body = await request.json();
    const data = updateWorkflowSchema.parse(body);

    // Mise à jour transactionnelle
    const updatedWorkflow = await prisma.$transaction(async (tx) => {
      // Mettre à jour les informations de base du workflow
      const workflowData: any = {};
      if (data.nom !== undefined) workflowData.nom = data.nom;
      if (data.description !== undefined) workflowData.description = data.description;
      if (data.icone !== undefined) workflowData.icone = data.icone;
      if (data.categorie !== undefined) workflowData.categorie = data.categorie;
      if (data.triggerType !== undefined) workflowData.triggerType = data.triggerType;
      if (data.triggerConfig !== undefined) workflowData.triggerConfig = data.triggerConfig;
      if (data.actif !== undefined) workflowData.actif = data.actif;

      await tx.workflow.update({
        where: { id },
        data: workflowData,
      });

      // Si les étapes sont fournies, mettre à jour
      if (data.etapes !== undefined) {
        // Supprimer les étapes qui ne sont plus dans la liste
        const etapeIds = data.etapes
          .filter((e) => e.id)
          .map((e) => e.id) as string[];

        await tx.workflowEtape.deleteMany({
          where: {
            workflowId: id,
            id: { notIn: etapeIds },
          },
        });

        // Créer ou mettre à jour les étapes
        for (const etape of data.etapes) {
          if (etape.id) {
            // Mise à jour
            await tx.workflowEtape.update({
              where: { id: etape.id },
              data: {
                type: etape.type,
                nom: etape.nom,
                description: etape.description,
                config: etape.config as Prisma.InputJsonValue,
                ordre: etape.ordre,
                positionX: etape.positionX,
                positionY: etape.positionY,
                conditions: etape.conditions as Prisma.InputJsonValue,
                continuerSurErreur: etape.continuerSurErreur,
                nombreReessais: etape.nombreReessais,
                delaiReessai: etape.delaiReessai,
                etapeSuivanteId: etape.etapeSuivanteId,
                etapeSuivanteOuiId: etape.etapeSuivanteOuiId,
                etapeSuivanteNonId: etape.etapeSuivanteNonId,
              },
            });
          } else {
            // Création
            await tx.workflowEtape.create({
              data: {
                workflowId: id,
                type: etape.type,
                nom: etape.nom,
                description: etape.description,
                config: etape.config as Prisma.InputJsonValue,
                ordre: etape.ordre,
                positionX: etape.positionX,
                positionY: etape.positionY,
                conditions: etape.conditions as Prisma.InputJsonValue,
                continuerSurErreur: etape.continuerSurErreur,
                nombreReessais: etape.nombreReessais,
                delaiReessai: etape.delaiReessai,
                etapeSuivanteId: etape.etapeSuivanteId,
                etapeSuivanteOuiId: etape.etapeSuivanteOuiId,
                etapeSuivanteNonId: etape.etapeSuivanteNonId,
              },
            });
          }
        }
      }

      // Retourner le workflow mis à jour
      return tx.workflow.findUnique({
        where: { id },
        include: {
          etapes: {
            orderBy: { ordre: "asc" },
          },
        },
      });
    });

    // Log
    await prisma.workflowLog.create({
      data: {
        workflowId: id,
        niveau: "info",
        message: `Workflow mis à jour`,
      },
    });

    return NextResponse.json(updatedWorkflow);

  } catch (error) {
    console.error("[API] PATCH /api/automatisations/[id] error:", error);

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

// ===========================================
// DELETE - Supprimer un workflow
// ===========================================

export async function DELETE(
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
      select: { organizationId: true },
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

    // Supprimer le workflow (cascade supprimera les étapes, exécutions, logs)
    await prisma.workflow.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[API] DELETE /api/automatisations/[id] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
