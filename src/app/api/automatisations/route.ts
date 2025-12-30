// ===========================================
// API: WORKFLOWS / AUTOMATISATIONS
// GET /api/automatisations - Liste des workflows
// POST /api/automatisations - Créer un workflow
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { WorkflowTriggerType, WorkflowCategory, WorkflowActionType, Prisma } from "@prisma/client";

// ===========================================
// SCHÉMAS DE VALIDATION
// ===========================================

const createWorkflowEtapeSchema = z.object({
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
  etapeSuivanteId: z.string().optional(),
  etapeSuivanteOuiId: z.string().optional(),
  etapeSuivanteNonId: z.string().optional(),
});

const createWorkflowSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  icone: z.string().optional(),
  categorie: z.nativeEnum(WorkflowCategory).optional().default("PERSONNALISE"),
  triggerType: z.nativeEnum(WorkflowTriggerType),
  triggerConfig: z.record(z.string(), z.unknown()).optional(),
  actif: z.boolean().optional().default(true),
  etapes: z.array(createWorkflowEtapeSchema).optional().default([]),
});

const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  actif: z.enum(["true", "false"]).optional(),
  categorie: z.nativeEnum(WorkflowCategory).optional(),
  triggerType: z.nativeEnum(WorkflowTriggerType).optional(),
  search: z.string().optional(),
});

// ===========================================
// GET - Liste des workflows
// ===========================================

export async function GET(request: NextRequest) {
  try {
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

    // Parser les paramètres de requête
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = querySchema.parse(searchParams);

    // Construire les filtres
    const where: any = {
      organizationId: dbUser.organizationId,
    };

    if (query.actif !== undefined) {
      where.actif = query.actif === "true";
    }

    if (query.categorie) {
      where.categorie = query.categorie;
    }

    if (query.triggerType) {
      where.triggerType = query.triggerType;
    }

    if (query.search) {
      where.OR = [
        { nom: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    // Pagination
    const skip = (query.page - 1) * query.pageSize;
    const take = query.pageSize;

    // Récupérer les workflows et le total
    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({
        where,
        include: {
          etapes: {
            orderBy: { ordre: "asc" },
          },
          _count: {
            select: { executions: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
      prisma.workflow.count({ where }),
    ]);

    return NextResponse.json({
      workflows,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    });

  } catch (error) {
    console.error("[API] GET /api/automatisations error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Paramètres invalides", details: error.issues },
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
// POST - Créer un workflow
// ===========================================

export async function POST(request: NextRequest) {
  try {
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

    // Parser et valider les données
    const body = await request.json();
    const data = createWorkflowSchema.parse(body);

    // Créer le workflow avec ses étapes
    const workflow = await prisma.workflow.create({
      data: {
        organizationId: dbUser.organizationId,
        nom: data.nom,
        description: data.description,
        icone: data.icone,
        categorie: data.categorie,
        triggerType: data.triggerType,
        triggerConfig: data.triggerConfig as Prisma.InputJsonValue | undefined,
        actif: data.actif,
        etapes: {
          create: data.etapes.map((etape) => ({
            type: etape.type,
            nom: etape.nom,
            description: etape.description,
            config: etape.config as Prisma.InputJsonValue,
            ordre: etape.ordre,
            positionX: etape.positionX,
            positionY: etape.positionY,
            conditions: etape.conditions as Prisma.InputJsonValue | undefined,
            continuerSurErreur: etape.continuerSurErreur,
            nombreReessais: etape.nombreReessais,
            delaiReessai: etape.delaiReessai,
            etapeSuivanteId: etape.etapeSuivanteId,
            etapeSuivanteOuiId: etape.etapeSuivanteOuiId,
            etapeSuivanteNonId: etape.etapeSuivanteNonId,
          })),
        },
      },
      include: {
        etapes: {
          orderBy: { ordre: "asc" },
        },
      },
    });

    // Log
    await prisma.workflowLog.create({
      data: {
        workflowId: workflow.id,
        niveau: "info",
        message: `Workflow "${workflow.nom}" créé`,
      },
    });

    return NextResponse.json(workflow, { status: 201 });

  } catch (error) {
    console.error("[API] POST /api/automatisations error:", error);

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
