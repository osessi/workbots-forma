// ===========================================
// CONFIGURATION IA MULTI-PROVIDER
// ===========================================

import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";

// Types pour la configuration
export type AIProvider = "anthropic" | "openai";

export interface AIConfig {
  provider: AIProvider;
  model: string;
  maxTokens: number;
  temperature: number;
}

// Configuration par defaut
export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: (process.env.AI_PROVIDER as AIProvider) || "anthropic",
  model: process.env.AI_MODEL || "claude-sonnet-4-20250514",
  maxTokens: 4096,
  temperature: 0.7,
};

// Configuration pour differents types de generation
export const AI_CONFIGS = {
  // Generation de fiche pedagogique - besoin de creativite
  fichePedagogique: {
    provider: "anthropic" as AIProvider,
    model: "claude-sonnet-4-20250514",
    maxTokens: 8192,
    temperature: 0.7,
  },
  // Generation de QCM - besoin de precision
  qcm: {
    provider: "anthropic" as AIProvider,
    model: "claude-sonnet-4-20250514",
    maxTokens: 4096,
    temperature: 0.5,
  },
  // Test de positionnement
  positionnement: {
    provider: "anthropic" as AIProvider,
    model: "claude-sonnet-4-20250514",
    maxTokens: 4096,
    temperature: 0.5,
  },
  // Evaluation finale
  evaluation: {
    provider: "anthropic" as AIProvider,
    model: "claude-sonnet-4-20250514",
    maxTokens: 4096,
    temperature: 0.5,
  },
  // Reformulation/amelioration de texte
  reformulation: {
    provider: "anthropic" as AIProvider,
    model: "claude-sonnet-4-20250514",
    maxTokens: 2048,
    temperature: 0.6,
  },
} as const;

// Creer le client Anthropic
export function createAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  return createAnthropic({
    apiKey,
  });
}

// Creer le client OpenAI
export function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return createOpenAI({
    apiKey,
  });
}

// Obtenir le provider selon la configuration
export function getAIProvider(config: AIConfig = DEFAULT_AI_CONFIG) {
  switch (config.provider) {
    case "anthropic":
      return createAnthropicClient();
    case "openai":
      return createOpenAIClient();
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}

// Obtenir le modele avec le provider
export function getAIModel(config: AIConfig = DEFAULT_AI_CONFIG) {
  const provider = getAIProvider(config);
  return provider(config.model);
}

// Verifier si l'IA est configuree
export function isAIConfigured(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
}

// Obtenir le provider disponible
export function getAvailableProvider(): AIProvider | null {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}
