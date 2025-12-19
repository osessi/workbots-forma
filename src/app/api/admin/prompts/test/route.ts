// ===========================================
// API ROUTE: TEST D'UN PROMPT (ADMIN)
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  isAIConfigured,
  generateWithContext,
  DynamicPromptContext,
} from "@/lib/ai";
import { generateTestContext } from "@/lib/templates/renderer";
import { templateContextToPromptContext } from "@/lib/ai/dynamic-prompts";

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

// Schema de validation
const TestPromptSchema = z.object({
  promptId: z.string().optional(),
  customSystemPrompt: z.string().optional(),
  customUserPrompt: z.string().optional(),
  context: z.any().optional(),
  useTestContext: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const isSuperAdmin = await isRealSuperAdmin();
    if (!isSuperAdmin || !user) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: "Le service IA n'est pas configure" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validationResult = TestPromptSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { promptId, customSystemPrompt, customUserPrompt, context, useTestContext } =
      validationResult.data;

    // Charger le prompt si un ID est fourni
    let prompt = null;
    if (promptId) {
      prompt = await prisma.aIPrompt.findUnique({ where: { id: promptId } });
      if (!prompt) {
        return NextResponse.json({ error: "Prompt non trouve" }, { status: 404 });
      }
    }

    // Construire le contexte
    let promptContext: DynamicPromptContext;
    if (context) {
      promptContext = context;
    } else if (useTestContext) {
      const testContext = generateTestContext();
      promptContext = templateContextToPromptContext(testContext);
    } else {
      promptContext = {
        formation: {
          titre: "Formation Test",
          description: "Description de test pour valider le prompt",
          duree: "2 jours (14h)",
          objectifs: ["Objectif 1", "Objectif 2", "Objectif 3"],
        },
        organisation: {
          nom: "Organisation Test",
          siret: "123 456 789 00012",
        },
        formateur: {
          nom: "Dupont",
          prenom: "Jean",
        },
      };
    }

    // Generer avec le prompt
    const result = await generateWithContext({
      promptType: prompt?.type || "FICHE_PEDAGOGIQUE",
      context: promptContext,
      customSystemPrompt: customSystemPrompt || prompt?.systemPrompt,
      customUserPrompt: customUserPrompt || prompt?.userPromptTemplate,
      userId: user.id,
    });

    return NextResponse.json({
      success: result.success,
      content: result.content,
      contentJson: result.contentJson,
      error: result.error,
      meta: {
        tokens: result.tokens,
        duration: result.duration,
        promptUsed: result.promptUsed,
      },
    });
  } catch (error) {
    console.error("Erreur API admin/prompts/test:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
