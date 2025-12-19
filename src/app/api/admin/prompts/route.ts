// ===========================================
// API ROUTE: GESTION DES PROMPTS IA (ADMIN)
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AIPromptType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { seedDefaultPrompts } from "@/lib/ai";

// Helper pour verifier si l'utilisateur reel est super admin (meme en impersonation)
async function isRealSuperAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  // Si en mode impersonation, verifier l'admin reel
  if (user.isImpersonating && user.impersonatedBy) {
    const realAdmin = await prisma.user.findUnique({
      where: { id: user.impersonatedBy.id },
      select: { isSuperAdmin: true },
    });
    return realAdmin?.isSuperAdmin ?? false;
  }
  return user.isSuperAdmin;
}

// Schema de validation pour la creation/mise a jour
const PromptSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  type: z.nativeEnum(AIPromptType),
  systemPrompt: z.string().min(10, "Le prompt systeme doit contenir au moins 10 caracteres"),
  userPromptTemplate: z.string().min(10, "Le template utilisateur doit contenir au moins 10 caracteres"),
  requiredVariables: z.array(z.string()).default([]),
  optionalVariables: z.array(z.string()).default([]),
  model: z.string().default("claude-sonnet-4-20250514"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(32000).default(4096),
  outputSchema: z.any().optional(),
  outputTemplate: z.any().optional(),
  isActive: z.boolean().default(true),
  organizationId: z.string().optional(),
});

// GET: Lister tous les prompts
export async function GET(request: NextRequest) {
  try {
    const isSuperAdmin = await isRealSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as AIPromptType | null;
    const organizationId = searchParams.get("organizationId");
    const isSystem = searchParams.get("isSystem") === "true";

    // Construire le filtre
    const where: {
      type?: AIPromptType;
      organizationId?: string | null;
      isSystem?: boolean;
    } = {};

    if (type) where.type = type;
    if (organizationId) where.organizationId = organizationId;
    if (isSystem) {
      where.isSystem = true;
      where.organizationId = null;
    }

    const prompts = await prisma.aIPrompt.findMany({
      where,
      orderBy: [{ type: "asc" }, { name: "asc" }],
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error("Erreur API admin/prompts GET:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST: Creer un nouveau prompt ou seeder les prompts par defaut
export async function POST(request: NextRequest) {
  try {
    const isSuperAdmin = await isRealSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json();

    // Action speciale: seeder les prompts par defaut
    if (body.action === "seed") {
      const result = await seedDefaultPrompts();
      return NextResponse.json({
        success: true,
        message: `${result.created} prompts crees, ${result.updated} mis a jour`,
        ...result,
      });
    }

    // Creer un nouveau prompt
    const validationResult = PromptSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const prompt = await prisma.aIPrompt.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        systemPrompt: data.systemPrompt,
        userPromptTemplate: data.userPromptTemplate,
        requiredVariables: data.requiredVariables,
        optionalVariables: data.optionalVariables,
        model: data.model,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
        outputSchema: data.outputSchema,
        outputTemplate: data.outputTemplate,
        isActive: data.isActive,
        isSystem: !data.organizationId,
        organizationId: data.organizationId || null,
      },
    });

    return NextResponse.json({ success: true, prompt }, { status: 201 });
  } catch (error) {
    console.error("Erreur API admin/prompts POST:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
