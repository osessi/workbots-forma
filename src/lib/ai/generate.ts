// ===========================================
// FONCTIONS DE GENERATION IA AVEC RETRY
// ===========================================

import { generateText } from "ai";
import { z } from "zod";
import {
  AIConfig,
  AI_CONFIGS,
  getAIModel,
  getAvailableProvider,
  isAIConfigured,
} from "./config";
import {
  SYSTEM_PROMPTS,
  FichePedagogiqueSchema,
  QCMSchema,
  TestPositionnementSchema,
  EvaluationFinaleSchema,
  ReformulationSchema,
  generateFichePedagogiquePrompt,
  generateQCMPrompt,
  generatePositionnementPrompt,
  generateEvaluationPrompt,
  generateReformulationPrompt,
  type FichePedagogiqueInput,
  type QCMInput,
  type PositionnementInput,
  type EvaluationInput,
  type ReformulationInput,
  type FichePedagogique,
  type QCM,
  type TestPositionnement,
  type EvaluationFinale,
  type Reformulation,
} from "./prompts";

// ===========================================
// TYPES ET INTERFACES
// ===========================================

export interface GenerationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  retries?: number;
  provider?: string;
}

export interface GenerationOptions {
  maxRetries?: number;
  retryDelay?: number;
  fallbackToOtherProvider?: boolean;
}

const DEFAULT_OPTIONS: GenerationOptions = {
  maxRetries: 3,
  retryDelay: 1000,
  fallbackToOtherProvider: true,
};

// ===========================================
// FONCTION UTILITAIRE DE RETRY
// ===========================================

async function withRetry<T>(
  fn: () => Promise<T>,
  options: GenerationOptions = DEFAULT_OPTIONS
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000 } = options;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Tentative ${attempt}/${maxRetries} echouee:`, lastError.message);

      if (attempt < maxRetries) {
        // Attendre avec backoff exponentiel
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// ===========================================
// FONCTION GENERIQUE DE GENERATION
// ===========================================

async function generateWithAI<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodSchema<T>,
  config: AIConfig,
  options: GenerationOptions = DEFAULT_OPTIONS
): Promise<GenerationResult<T>> {
  if (!isAIConfigured()) {
    return {
      success: false,
      error: "Aucun provider IA configure. Ajoutez ANTHROPIC_API_KEY ou OPENAI_API_KEY.",
    };
  }

  let retries = 0;
  const provider = getAvailableProvider();

  try {
    const result = await withRetry(
      async () => {
        retries++;
        const model = getAIModel(config);

        const response = await generateText({
          model,
          system: systemPrompt,
          prompt: userPrompt,
          maxOutputTokens: config.maxTokens,
          temperature: config.temperature,
        });

        return response;
      },
      options
    );

    // Parser le JSON de la reponse
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: "La reponse ne contient pas de JSON valide",
        retries,
        provider: provider || undefined,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = schema.parse(parsed);

    // Extraire les tokens de l'usage
    const usage = result.usage as { promptTokens?: number; completionTokens?: number; totalTokens?: number } | undefined;

    return {
      success: true,
      data: validated,
      tokens: {
        prompt: usage?.promptTokens || 0,
        completion: usage?.completionTokens || 0,
        total: usage?.totalTokens || 0,
      },
      retries,
      provider: provider || undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";

    // Si c'est une erreur Zod, formater le message
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation echouee: ${error.issues.map((e) => e.message).join(", ")}`,
        retries,
        provider: provider || undefined,
      };
    }

    return {
      success: false,
      error: message,
      retries,
      provider: provider || undefined,
    };
  }
}

// ===========================================
// FONCTIONS DE GENERATION SPECIFIQUES
// ===========================================

export async function generateFichePedagogique(
  input: FichePedagogiqueInput,
  options?: GenerationOptions
): Promise<GenerationResult<FichePedagogique>> {
  const prompt = generateFichePedagogiquePrompt(input);
  return generateWithAI(
    SYSTEM_PROMPTS.fichePedagogique,
    prompt,
    FichePedagogiqueSchema,
    AI_CONFIGS.fichePedagogique,
    options
  );
}

export async function generateQCM(
  input: QCMInput,
  options?: GenerationOptions
): Promise<GenerationResult<QCM>> {
  const prompt = generateQCMPrompt(input);
  return generateWithAI(
    SYSTEM_PROMPTS.qcm,
    prompt,
    QCMSchema,
    AI_CONFIGS.qcm,
    options
  );
}

export async function generatePositionnement(
  input: PositionnementInput,
  options?: GenerationOptions
): Promise<GenerationResult<TestPositionnement>> {
  const prompt = generatePositionnementPrompt(input);
  return generateWithAI(
    SYSTEM_PROMPTS.positionnement,
    prompt,
    TestPositionnementSchema,
    AI_CONFIGS.positionnement,
    options
  );
}

export async function generateEvaluation(
  input: EvaluationInput,
  options?: GenerationOptions
): Promise<GenerationResult<EvaluationFinale>> {
  const prompt = generateEvaluationPrompt(input);
  return generateWithAI(
    SYSTEM_PROMPTS.evaluation,
    prompt,
    EvaluationFinaleSchema,
    AI_CONFIGS.evaluation,
    options
  );
}

export async function generateReformulation(
  input: ReformulationInput,
  options?: GenerationOptions
): Promise<GenerationResult<Reformulation>> {
  const prompt = generateReformulationPrompt(input);
  return generateWithAI(
    SYSTEM_PROMPTS.reformulation,
    prompt,
    ReformulationSchema,
    AI_CONFIGS.reformulation,
    options
  );
}

// ===========================================
// FONCTION POUR GENERATION TEXTE LIBRE
// ===========================================

export async function generateFreeText(
  systemPrompt: string,
  userPrompt: string,
  options?: GenerationOptions & { config?: Partial<AIConfig> }
): Promise<GenerationResult<string>> {
  if (!isAIConfigured()) {
    return {
      success: false,
      error: "Aucun provider IA configure",
    };
  }

  const config: AIConfig = {
    ...AI_CONFIGS.reformulation,
    ...options?.config,
  };

  let retries = 0;
  const provider = getAvailableProvider();

  try {
    const result = await withRetry(
      async () => {
        retries++;
        const model = getAIModel(config);

        return generateText({
          model,
          system: systemPrompt,
          prompt: userPrompt,
          maxOutputTokens: config.maxTokens,
          temperature: config.temperature,
        });
      },
      options
    );

    // Extraire les tokens de l'usage
    const usage = result.usage as { promptTokens?: number; completionTokens?: number; totalTokens?: number } | undefined;

    return {
      success: true,
      data: result.text,
      tokens: {
        prompt: usage?.promptTokens || 0,
        completion: usage?.completionTokens || 0,
        total: usage?.totalTokens || 0,
      },
      retries,
      provider: provider || undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return {
      success: false,
      error: message,
      retries,
      provider: provider || undefined,
    };
  }
}
