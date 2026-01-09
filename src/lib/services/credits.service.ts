// ===========================================
// SERVICE DE GESTION DES CRÉDITS IA
// ===========================================

import { prisma } from "@/lib/db/prisma";
import { CreditTransactionType, AIPromptType } from "@prisma/client";

// ===========================================
// CONFIGURATION DES COÛTS EN CRÉDITS
// ===========================================

// Coût par type de génération (basé sur les tokens moyens consommés)
export const CREDIT_COSTS: Record<string, number> = {
  // Génération de contenu pédagogique
  FICHE_PEDAGOGIQUE: 1500,      // Fiche complète avec modules
  MODULE_ZERO: 400,             // Module de mise à niveau (petit JSON)
  FICHE_ADAPTABILITE: 300,      // Fiche personnalisée
  QCM: 600,                     // 6-12 questions
  TEST_POSITIONNEMENT: 800,     // 20 questions
  EVALUATION_FINALE: 800,       // 20 questions
  CORRELATION_OBJECTIFS: 500,   // Corrélation obj/eval
  CONVENTION: 400,              // Document convention
  ATTESTATION_FIN: 200,         // Attestation simple
  REFORMULATION: 150,           // Amélioration texte

  // Agent Qualiopi
  AGENT_QUALIOPI_MESSAGE: 200,  // Message conversationnel
  ANALYSE_INDICATEUR: 300,      // Analyse d'un indicateur
  SIMULATION_AUDIT: 800,        // Rapport d'audit complet
  RAPPORT_CONFORMITE: 1000,     // Rapport détaillé

  // Veille
  VEILLE_CHAT: 200,             // Message chat veille
  VEILLE_SCRAPE_ARTICLE: 100,   // Résumé d'un article

  // Slides (service Python)
  SLIDE_GENERATION: 150,        // Par slide

  // Images
  IMAGE_DALLE: 500,             // Image DALL-E 3

  // Divers
  ENRICHIR_DESCRIPTION: 150,    // Enrichissement texte
  DEFAULT: 200,                 // Coût par défaut
};

// Mapping AIPromptType vers clé CREDIT_COSTS
const PROMPT_TYPE_TO_COST_KEY: Partial<Record<AIPromptType, string>> = {
  FICHE_PEDAGOGIQUE: "FICHE_PEDAGOGIQUE",
  MODULE_ZERO: "MODULE_ZERO",
  FICHE_ADAPTABILITE: "FICHE_ADAPTABILITE",
  QCM: "QCM",
  POSITIONNEMENT: "TEST_POSITIONNEMENT",
  EVALUATION_FINALE: "EVALUATION_FINALE",
  CORRELATION_OBJECTIFS: "CORRELATION_OBJECTIFS",
  CONVENTION: "CONVENTION",
  ATTESTATION_FIN: "ATTESTATION_FIN",
  REFORMULATION: "REFORMULATION",
};

// ===========================================
// FONCTIONS PRINCIPALES
// ===========================================

/**
 * Récupère le solde de crédits d'une organisation
 */
export async function getCreditsBalance(organizationId: string): Promise<{
  credits: number;
  creditsMonthly: number;
  creditsUsedThisMonth: number;
  creditsResetAt: Date;
  percentUsed: number;
}> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      credits: true,
      creditsMonthly: true,
      creditsUsedThisMonth: true,
      creditsResetAt: true,
    },
  });

  if (!org) {
    throw new Error("Organisation non trouvée");
  }

  // Vérifier si on doit faire un reset mensuel
  const now = new Date();
  if (org.creditsResetAt < now) {
    // Reset mensuel automatique
    await resetMonthlyCredits(organizationId);
    return getCreditsBalance(organizationId); // Récupérer les nouvelles valeurs
  }

  const percentUsed = org.creditsMonthly > 0
    ? Math.round((org.creditsUsedThisMonth / org.creditsMonthly) * 100)
    : 0;

  return {
    credits: org.credits,
    creditsMonthly: org.creditsMonthly,
    creditsUsedThisMonth: org.creditsUsedThisMonth,
    creditsResetAt: org.creditsResetAt,
    percentUsed,
  };
}

/**
 * Vérifie si l'organisation a assez de crédits
 */
export async function hasEnoughCredits(
  organizationId: string,
  requiredCredits: number
): Promise<boolean> {
  const balance = await getCreditsBalance(organizationId);
  return balance.credits >= requiredCredits;
}

/**
 * Déduit des crédits après une génération IA
 */
export async function deductCredits(params: {
  organizationId: string;
  userId: string;
  amount: number;
  description: string;
  promptType?: AIPromptType;
  aiGenerationLogId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const { organizationId, userId, amount, description, promptType, aiGenerationLogId, metadata } = params;

  try {
    // Récupérer le solde actuel
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { credits: true, creditsUsedThisMonth: true },
    });

    if (!org) {
      return { success: false, newBalance: 0, error: "Organisation non trouvée" };
    }

    if (org.credits < amount) {
      return { success: false, newBalance: org.credits, error: "Crédits insuffisants" };
    }

    // Transaction atomique : déduire les crédits et créer la transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour les crédits
      const updatedOrg = await tx.organization.update({
        where: { id: organizationId },
        data: {
          credits: { decrement: amount },
          creditsUsedThisMonth: { increment: amount },
        },
        select: { credits: true },
      });

      // Créer la transaction
      await tx.creditTransaction.create({
        data: {
          organizationId,
          userId,
          type: CreditTransactionType.USAGE,
          amount: -amount,
          balanceBefore: org.credits,
          balanceAfter: updatedOrg.credits,
          description,
          aiGenerationLogId,
          metadata: promptType || metadata
            ? { promptType: promptType ?? null, ...(metadata ?? {}) }
            : undefined,
        },
      });

      return updatedOrg.credits;
    });

    return { success: true, newBalance: result };
  } catch (error) {
    console.error("Erreur déduction crédits:", error);
    return { success: false, newBalance: 0, error: "Erreur lors de la déduction" };
  }
}

/**
 * Ajoute des crédits (achat, bonus, etc.)
 */
export async function addCredits(params: {
  organizationId: string;
  userId?: string;
  amount: number;
  type: CreditTransactionType;
  description: string;
  metadata?: Record<string, string | number | boolean | null>;
}): Promise<{ success: boolean; newBalance: number }> {
  const { organizationId, userId, amount, type, description, metadata } = params;

  try {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { credits: true },
    });

    if (!org) {
      throw new Error("Organisation non trouvée");
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedOrg = await tx.organization.update({
        where: { id: organizationId },
        data: { credits: { increment: amount } },
        select: { credits: true },
      });

      await tx.creditTransaction.create({
        data: {
          organizationId,
          userId,
          type,
          amount,
          balanceBefore: org.credits,
          balanceAfter: updatedOrg.credits,
          description,
          metadata: metadata ?? undefined,
        },
      });

      return updatedOrg.credits;
    });

    return { success: true, newBalance: result };
  } catch (error) {
    console.error("Erreur ajout crédits:", error);
    return { success: false, newBalance: 0 };
  }
}

/**
 * Reset mensuel des crédits
 */
export async function resetMonthlyCredits(organizationId: string): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { credits: true, creditsMonthly: true, creditsUsedThisMonth: true },
  });

  if (!org) return;

  // Calculer la prochaine date de reset (1er du mois prochain)
  const nextReset = new Date();
  nextReset.setMonth(nextReset.getMonth() + 1);
  nextReset.setDate(1);
  nextReset.setHours(0, 0, 0, 0);

  // Reset : remettre les crédits au niveau du plan mensuel
  const newCredits = org.creditsMonthly;
  const creditsDiff = newCredits - org.credits;

  await prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: organizationId },
      data: {
        credits: newCredits,
        creditsUsedThisMonth: 0,
        creditsResetAt: nextReset,
      },
    });

    if (creditsDiff !== 0) {
      await tx.creditTransaction.create({
        data: {
          organizationId,
          type: CreditTransactionType.MONTHLY_RESET,
          amount: creditsDiff,
          balanceBefore: org.credits,
          balanceAfter: newCredits,
          description: "Reset mensuel des crédits",
          metadata: {
            previousUsed: org.creditsUsedThisMonth,
            monthlyAllowance: org.creditsMonthly,
          },
        },
      });
    }
  });
}

/**
 * Récupère l'historique des transactions
 */
export async function getCreditHistory(
  organizationId: string,
  limit: number = 50
): Promise<{
  transactions: Array<{
    id: string;
    type: CreditTransactionType;
    amount: number;
    balanceAfter: number;
    description: string;
    createdAt: Date;
    user?: { name: string | null; email: string };
  }>;
}> {
  const rawTransactions = await prisma.creditTransaction.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  });

  // Mapper les résultats pour combiner firstName + lastName en name
  const transactions = rawTransactions.map((t) => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    balanceAfter: t.balanceAfter,
    description: t.description,
    createdAt: t.createdAt,
    user: t.user
      ? {
          name: [t.user.firstName, t.user.lastName].filter(Boolean).join(" ") || null,
          email: t.user.email,
        }
      : undefined,
  }));

  return { transactions };
}

/**
 * Calcule le coût en crédits pour un type de génération
 */
export function getCreditCost(promptType: AIPromptType | string): number {
  // D'abord chercher dans le mapping
  const mappedKey = PROMPT_TYPE_TO_COST_KEY[promptType as AIPromptType];
  if (mappedKey && CREDIT_COSTS[mappedKey]) {
    return CREDIT_COSTS[mappedKey];
  }

  // Sinon chercher directement dans CREDIT_COSTS
  if (CREDIT_COSTS[promptType]) {
    return CREDIT_COSTS[promptType];
  }

  // Coût par défaut
  return CREDIT_COSTS.DEFAULT;
}

/**
 * Calcule le coût basé sur les tokens réels (alternative)
 * 1 token ≈ 1 crédit (ratio simple)
 */
export function calculateCreditFromTokens(tokensTotal: number): number {
  return Math.ceil(tokensTotal);
}

// ===========================================
// HELPERS
// ===========================================

/**
 * Formatte un nombre de crédits pour l'affichage
 */
export function formatCredits(credits: number): string {
  if (credits >= 1000000) {
    return `${(credits / 1000000).toFixed(1)}M`;
  }
  if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}k`;
  }
  return credits.toString();
}

/**
 * Retourne la couleur du badge selon le pourcentage utilisé
 */
export function getCreditStatusColor(percentUsed: number): "green" | "yellow" | "red" {
  if (percentUsed < 50) return "green";
  if (percentUsed < 80) return "yellow";
  return "red";
}
