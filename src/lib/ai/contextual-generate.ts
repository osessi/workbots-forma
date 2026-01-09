// ===========================================
// GENERATION IA CONTEXTUELLE AVEC PROMPTS DB
// ===========================================

import { generateText } from "ai";
import { prisma } from "@/lib/db/prisma";
import { AIPromptType } from "@prisma/client";
import { getAIModel, AIConfig, isAIConfigured, getAvailableProvider } from "./config";
import {
  DynamicPromptContext,
  injectVariablesInPrompt,
  getDefaultPrompt,
  validateRequiredVariables,
  DEFAULT_PROMPTS,
} from "./dynamic-prompts";
import { deductCredits, getCreditCost, hasEnoughCredits } from "@/lib/services/credits.service";

// ===========================================
// TYPES
// ===========================================

export interface ContextualGenerationInput {
  promptType: AIPromptType;
  context: DynamicPromptContext;
  customSystemPrompt?: string;
  customUserPrompt?: string;
  organizationId?: string;
  userId: string;
}

export interface ContextualGenerationResult {
  success: boolean;
  content?: string;
  contentHtml?: string;
  contentJson?: unknown;
  error?: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  duration?: number;
  promptUsed?: {
    id?: string;
    name: string;
    type: AIPromptType;
  };
}

// ===========================================
// RECUPERATION DU PROMPT
// ===========================================

async function getPromptForGeneration(
  promptType: AIPromptType,
  organizationId?: string
): Promise<{
  id?: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  requiredVariables: string[];
  model: string;
  temperature: number;
  maxTokens: number;
} | null> {
  // 1. Chercher un prompt personnalise pour l'organisation
  if (organizationId) {
    const orgPrompt = await prisma.aIPrompt.findFirst({
      where: {
        type: promptType,
        organizationId,
        isActive: true,
      },
    });

    if (orgPrompt) {
      return {
        id: orgPrompt.id,
        name: orgPrompt.name,
        systemPrompt: orgPrompt.systemPrompt,
        userPromptTemplate: orgPrompt.userPromptTemplate,
        requiredVariables: orgPrompt.requiredVariables,
        model: orgPrompt.model,
        temperature: orgPrompt.temperature,
        maxTokens: orgPrompt.maxTokens,
      };
    }
  }

  // 2. Chercher un prompt systeme global
  const systemPrompt = await prisma.aIPrompt.findFirst({
    where: {
      type: promptType,
      isSystem: true,
      isActive: true,
      organizationId: null,
    },
  });

  if (systemPrompt) {
    // Pour les prompts systeme, utiliser les DEFAULT_PROMPTS comme source de verite
    // car la base de donnees peut etre obsolete
    const defaultPrompt = getDefaultPrompt(promptType);
    if (defaultPrompt) {
      return {
        id: systemPrompt.id,
        name: defaultPrompt.name,
        systemPrompt: defaultPrompt.systemPrompt,
        userPromptTemplate: defaultPrompt.userPromptTemplate,
        requiredVariables: defaultPrompt.requiredVariables,
        model: defaultPrompt.model,
        temperature: defaultPrompt.temperature,
        maxTokens: defaultPrompt.maxTokens,
      };
    }
    // Fallback vers la base de donnees si pas de default prompt
    return {
      id: systemPrompt.id,
      name: systemPrompt.name,
      systemPrompt: systemPrompt.systemPrompt,
      userPromptTemplate: systemPrompt.userPromptTemplate,
      requiredVariables: systemPrompt.requiredVariables,
      model: systemPrompt.model,
      temperature: systemPrompt.temperature,
      maxTokens: systemPrompt.maxTokens,
    };
  }

  // 3. Utiliser le prompt par defaut code en dur
  const defaultPrompt = getDefaultPrompt(promptType);
  if (defaultPrompt) {
    return {
      name: defaultPrompt.name,
      systemPrompt: defaultPrompt.systemPrompt,
      userPromptTemplate: defaultPrompt.userPromptTemplate,
      requiredVariables: defaultPrompt.requiredVariables,
      model: defaultPrompt.model,
      temperature: defaultPrompt.temperature,
      maxTokens: defaultPrompt.maxTokens,
    };
  }

  return null;
}

// ===========================================
// FONCTION PRINCIPALE DE GENERATION
// ===========================================

export async function generateWithContext(
  input: ContextualGenerationInput
): Promise<ContextualGenerationResult> {
  const startTime = Date.now();

  // Verifier la configuration IA
  if (!isAIConfigured()) {
    return {
      success: false,
      error: "Le service IA n'est pas configuré. Ajoutez ANTHROPIC_API_KEY ou OPENAI_API_KEY.",
    };
  }

  // Vérifier les crédits disponibles si organisation fournie
  const creditCost = getCreditCost(input.promptType);
  if (input.organizationId) {
    const hasCredits = await hasEnoughCredits(input.organizationId, creditCost);
    if (!hasCredits) {
      return {
        success: false,
        error: "Crédits insuffisants. Veuillez recharger votre compte ou passer à un plan supérieur.",
      };
    }
  }

  try {
    // Recuperer le prompt
    const prompt = await getPromptForGeneration(input.promptType, input.organizationId);

    if (!prompt) {
      return {
        success: false,
        error: `Aucun prompt trouvé pour le type: ${input.promptType}`,
      };
    }

    // Utiliser les prompts personnalises si fournis
    const systemPrompt = input.customSystemPrompt || prompt.systemPrompt;
    const userPromptTemplate = input.customUserPrompt || prompt.userPromptTemplate;

    // Valider les variables requises
    const validation = validateRequiredVariables(input.context, prompt.requiredVariables);
    if (!validation.valid) {
      return {
        success: false,
        error: `Variables manquantes: ${validation.missing.join(", ")}`,
      };
    }

    // Injecter les variables dans le prompt utilisateur
    const userPrompt = injectVariablesInPrompt(userPromptTemplate, input.context);

    // Configuration IA
    const aiConfig: AIConfig = {
      provider: getAvailableProvider() || "anthropic",
      model: prompt.model,
      maxTokens: prompt.maxTokens,
      temperature: prompt.temperature,
    };

    // Generer avec l'IA
    const model = getAIModel(aiConfig);
    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: aiConfig.maxTokens,
      temperature: aiConfig.temperature,
    });

    const duration = Date.now() - startTime;
    const usage = result.usage as { promptTokens?: number; completionTokens?: number; totalTokens?: number } | undefined;

    // Logger la generation
    const aiLog = await prisma.aIGenerationLog.create({
      data: {
        promptId: prompt.id,
        promptType: input.promptType,
        userId: input.userId,
        organizationId: input.organizationId,
        inputContext: input.context as object,
        outputContent: { text: result.text },
        outputRaw: result.text,
        tokensPrompt: usage?.promptTokens || 0,
        tokensCompletion: usage?.completionTokens || 0,
        tokensTotal: usage?.totalTokens || 0,
        durationMs: duration,
        status: "success",
        provider: getAvailableProvider() || "anthropic",
        model: prompt.model,
      },
    });

    // Déduire les crédits après génération réussie
    if (input.organizationId) {
      await deductCredits({
        organizationId: input.organizationId,
        userId: input.userId,
        amount: creditCost,
        description: `Génération ${prompt.name}`,
        promptType: input.promptType,
        aiGenerationLogId: aiLog.id,
      });
    }

    // Parser le contenu si c'est du JSON
    let contentJson: unknown = undefined;
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        contentJson = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Pas de JSON valide, c'est OK
    }

    return {
      success: true,
      content: result.text,
      contentHtml: result.text, // Le contenu est deja du HTML dans la plupart des cas
      contentJson,
      tokens: {
        prompt: usage?.promptTokens || 0,
        completion: usage?.completionTokens || 0,
        total: usage?.totalTokens || 0,
      },
      duration,
      promptUsed: {
        id: prompt.id,
        name: prompt.name,
        type: input.promptType,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";

    // Logger l'erreur
    await prisma.aIGenerationLog.create({
      data: {
        promptType: input.promptType,
        userId: input.userId,
        organizationId: input.organizationId,
        inputContext: input.context as object,
        durationMs: duration,
        status: "error",
        errorMessage,
        provider: getAvailableProvider() || "anthropic",
      },
    });

    return {
      success: false,
      error: errorMessage,
      duration,
    };
  }
}

// ===========================================
// SEED DES PROMPTS PAR DEFAUT
// ===========================================

export async function seedDefaultPrompts(): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  for (const defaultPrompt of DEFAULT_PROMPTS) {
    const existing = await prisma.aIPrompt.findFirst({
      where: {
        type: defaultPrompt.type,
        isSystem: true,
        organizationId: null,
      },
    });

    if (existing) {
      await prisma.aIPrompt.update({
        where: { id: existing.id },
        data: {
          name: defaultPrompt.name,
          description: defaultPrompt.description,
          systemPrompt: defaultPrompt.systemPrompt,
          userPromptTemplate: defaultPrompt.userPromptTemplate,
          requiredVariables: defaultPrompt.requiredVariables,
          optionalVariables: defaultPrompt.optionalVariables,
          model: defaultPrompt.model,
          temperature: defaultPrompt.temperature,
          maxTokens: defaultPrompt.maxTokens,
          version: { increment: 1 },
        },
      });
      updated++;
    } else {
      await prisma.aIPrompt.create({
        data: {
          name: defaultPrompt.name,
          description: defaultPrompt.description,
          type: defaultPrompt.type,
          systemPrompt: defaultPrompt.systemPrompt,
          userPromptTemplate: defaultPrompt.userPromptTemplate,
          requiredVariables: defaultPrompt.requiredVariables,
          optionalVariables: defaultPrompt.optionalVariables,
          model: defaultPrompt.model,
          temperature: defaultPrompt.temperature,
          maxTokens: defaultPrompt.maxTokens,
          isSystem: true,
          organizationId: null,
        },
      });
      created++;
    }
  }

  return { created, updated };
}

// ===========================================
// CONVERSION CONTENU IA VERS TIPTAP JSON
// ===========================================

/**
 * Convertit du HTML genere par l'IA en JSON TipTap
 */
export function htmlToTiptapJson(html: string): object {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type TiptapNode = {
    type: string;
    attrs?: Record<string, unknown>;
    content?: TiptapNode[];
    text?: string;
    marks?: Array<{ type: string }>;
  };

  // Structure TipTap de base
  const doc: {
    type: string;
    content: TiptapNode[];
  } = {
    type: "doc",
    content: [],
  };

  // Parser simple du HTML vers TipTap
  // Note: En production, utiliser une librairie comme html-to-prosemirror
  const lines = html.split("\n").filter((line) => line.trim());

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("<h1>")) {
      doc.content.push({
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: trimmed.replace(/<\/?h1>/g, "") }],
      });
    } else if (trimmed.startsWith("<h2>")) {
      doc.content.push({
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: trimmed.replace(/<\/?h2>/g, "") }],
      });
    } else if (trimmed.startsWith("<h3>")) {
      doc.content.push({
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: trimmed.replace(/<\/?h3>/g, "") }],
      });
    } else if (trimmed.startsWith("<p>")) {
      doc.content.push({
        type: "paragraph",
        content: [{ type: "text", text: trimmed.replace(/<\/?p>/g, "") }],
      });
    } else if (trimmed.startsWith("<li>")) {
      // Ajouter a une liste existante ou en creer une
      const lastItem = doc.content[doc.content.length - 1];
      const listItemNode: TiptapNode = {
        type: "listItem",
        content: [
          { type: "paragraph", content: [{ type: "text", text: trimmed.replace(/<\/?li>/g, "") }] },
        ],
      };
      if (lastItem?.type === "bulletList" && lastItem.content) {
        lastItem.content.push(listItemNode);
      } else {
        doc.content.push({
          type: "bulletList",
          content: [listItemNode],
        });
      }
    } else if (trimmed && !trimmed.startsWith("<")) {
      // Texte brut
      doc.content.push({
        type: "paragraph",
        content: [{ type: "text", text: trimmed }],
      });
    }
  }

  return doc;
}
