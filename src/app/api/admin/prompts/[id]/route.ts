// ===========================================
// API ROUTE: GESTION PROMPT INDIVIDUEL (ADMIN)
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AIPromptType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Helper pour verifier si l'utilisateur reel est super admin (meme en impersonation)
async function isRealSuperAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  if (user.isImpersonating && user.impersonatedBy) {
    const realAdmin = await prisma.user.findUnique({
      where: { id: user.impersonatedBy.id },
      select: { isSuperAdmin: true },
    });
    return realAdmin?.isSuperAdmin ?? false;
  }
  return user.isSuperAdmin;
}

// Schema de validation pour la mise a jour
const UpdatePromptSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.nativeEnum(AIPromptType).optional(),
  systemPrompt: z.string().min(10).optional(),
  userPromptTemplate: z.string().min(10).optional(),
  requiredVariables: z.array(z.string()).optional(),
  optionalVariables: z.array(z.string()).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(100).max(32000).optional(),
  outputSchema: z.any().optional(),
  outputTemplate: z.any().optional(),
  isActive: z.boolean().optional(),
});

// GET: Obtenir un prompt specifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isSuperAdmin = await isRealSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { id } = await params;

    const prompt = await prisma.aIPrompt.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        _count: {
          select: { generationLogs: true },
        },
      },
    });

    if (!prompt) {
      return NextResponse.json({ error: "Prompt non trouve" }, { status: 404 });
    }

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error("Erreur API admin/prompts/[id] GET:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT: Mettre a jour un prompt
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isSuperAdmin = await isRealSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const validationResult = UpdatePromptSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Verifier que le prompt existe
    const existing = await prisma.aIPrompt.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Prompt non trouve" }, { status: 404 });
    }

    const data = validationResult.data;

    const prompt = await prisma.aIPrompt.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, prompt });
  } catch (error) {
    console.error("Erreur API admin/prompts/[id] PUT:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE: Supprimer un prompt
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isSuperAdmin = await isRealSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { id } = await params;

    // Verifier que le prompt existe
    const existing = await prisma.aIPrompt.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Prompt non trouve" }, { status: 404 });
    }

    // Empecher la suppression des prompts systeme
    if (existing.isSystem) {
      return NextResponse.json(
        { error: "Impossible de supprimer un prompt systeme. Desactivez-le plutot." },
        { status: 400 }
      );
    }

    await prisma.aIPrompt.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API admin/prompts/[id] DELETE:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
