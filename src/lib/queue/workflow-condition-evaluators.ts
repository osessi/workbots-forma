// ===========================================
// ÉVALUATEURS DE CONDITIONS POUR LES WORKFLOWS
// Module 6 - Moteur d'Automatisation
// ===========================================

import { WorkflowConditionType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  WorkflowConditionConfig,
  WorkflowExecutionContext,
  FormationCertifianteConditionConfig,
  FormationModaliteConditionConfig,
  ScoreConditionConfig,
  ChampConditionConfig,
  ApprenantHandicapConditionConfig,
  ApprenantFinancementConditionConfig,
  FormulePersonnaliseeConditionConfig,
  ConditionSpecificConfig,
} from "@/types/workflow";

// ===========================================
// TYPE POUR LES ÉVALUATEURS
// ===========================================

type ConditionEvaluator = (
  config: ConditionSpecificConfig,
  context: WorkflowExecutionContext
) => Promise<boolean>;

// ===========================================
// ÉVALUATEUR: FORMATION CERTIFIANTE
// ===========================================

const evaluateFormationCertifiante: ConditionEvaluator = async (
  config: ConditionSpecificConfig,
  context: WorkflowExecutionContext
): Promise<boolean> => {
  const certConfig = config as FormationCertifianteConditionConfig;
  const formationId = context.variables.formation?.id;

  if (!formationId) {
    return false;
  }

  const formation = await prisma.formation.findUnique({
    where: { id: formationId },
    select: { isCertifiante: true },
  });

  if (!formation) {
    return false;
  }

  return formation.isCertifiante === certConfig.attendu;
};

// ===========================================
// ÉVALUATEUR: MODALITÉ DE FORMATION
// ===========================================

const evaluateFormationModalite: ConditionEvaluator = async (
  config: ConditionSpecificConfig,
  context: WorkflowExecutionContext
): Promise<boolean> => {
  const modaliteConfig = config as FormationModaliteConditionConfig;
  const sessionId = context.declencheur.data.sessionId as string;

  if (!sessionId) {
    return false;
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { modalite: true },
  });

  if (!session || !session.modalite) {
    return false;
  }

  return modaliteConfig.modalites.includes(session.modalite as any);
};

// ===========================================
// ÉVALUATEUR: SCORE
// ===========================================

const evaluateScoreInferieur: ConditionEvaluator = async (
  config: ConditionSpecificConfig,
  context: WorkflowExecutionContext
): Promise<boolean> => {
  const scoreConfig = config as ScoreConditionConfig;

  // Le score peut venir de l'évaluation dans le contexte
  const score = context.declencheur.data.score as number | undefined;

  if (score === undefined) {
    return false;
  }

  return score < scoreConfig.valeur;
};

const evaluateScoreSuperieur: ConditionEvaluator = async (
  config: ConditionSpecificConfig,
  context: WorkflowExecutionContext
): Promise<boolean> => {
  const scoreConfig = config as ScoreConditionConfig;

  const score = context.declencheur.data.score as number | undefined;

  if (score === undefined) {
    return false;
  }

  return score > scoreConfig.valeur;
};

// ===========================================
// ÉVALUATEUR: DOCUMENT MANQUANT
// ===========================================

const evaluateDocumentManquant: ConditionEvaluator = async (
  config: ConditionSpecificConfig,
  context: WorkflowExecutionContext
): Promise<boolean> => {
  // Vérifier si un document spécifique est manquant
  const formationId = context.variables.formation?.id;
  const sessionId = context.declencheur.data.sessionId as string;

  if (!formationId && !sessionId) {
    return false;
  }

  // TODO: Implémenter la vérification de documents manquants
  // selon les types de documents requis

  return true; // Par défaut, considérer qu'il manque des documents
};

// ===========================================
// ÉVALUATEUR: SIGNATURE EN ATTENTE
// ===========================================

const evaluateSignatureEnAttente: ConditionEvaluator = async (
  config: ConditionSpecificConfig,
  context: WorkflowExecutionContext
): Promise<boolean> => {
  const apprenantId = context.declencheur.data.apprenantId as string;
  const sessionId = context.declencheur.data.sessionId as string;

  if (!apprenantId || !sessionId) {
    return false;
  }

  // Vérifier s'il y a des documents en attente de signature
  const documentsEnAttente = await prisma.signatureDocument.count({
    where: {
      organizationId: context.organizationId,
      status: "PENDING_SIGNATURE",
      // Filtrer par apprenant/session si possible
    },
  });

  return documentsEnAttente > 0;
};

// ===========================================
// ÉVALUATEUR: APPRENANT EN SITUATION DE HANDICAP
// ===========================================

const evaluateApprenantHandicap: ConditionEvaluator = async (
  config: ConditionSpecificConfig,
  context: WorkflowExecutionContext
): Promise<boolean> => {
  const handicapConfig = config as ApprenantHandicapConditionConfig;
  const preInscriptionId = context.declencheur.data.preInscriptionId as string;

  if (!preInscriptionId) {
    // Si pas de pré-inscription, on cherche par apprenantId dans les pré-inscriptions
    const apprenantId = context.declencheur.data.apprenantId as string;
    if (!apprenantId) {
      return false;
    }

    const preInscription = await prisma.preInscription.findFirst({
      where: { apprenantId },
      select: { situationHandicap: true },
      orderBy: { createdAt: "desc" },
    });

    if (!preInscription) {
      return false;
    }

    return preInscription.situationHandicap === handicapConfig.enSituationDeHandicap;
  }

  const preInscription = await prisma.preInscription.findUnique({
    where: { id: preInscriptionId },
    select: { situationHandicap: true },
  });

  if (!preInscription) {
    return false;
  }

  return preInscription.situationHandicap === handicapConfig.enSituationDeHandicap;
};

// ===========================================
// ÉVALUATEUR: TYPE DE FINANCEMENT
// ===========================================

const evaluateApprenantFinancement: ConditionEvaluator = async (
  config: ConditionSpecificConfig,
  context: WorkflowExecutionContext
): Promise<boolean> => {
  const financementConfig = config as ApprenantFinancementConditionConfig;
  const preInscriptionId = context.declencheur.data.preInscriptionId as string;

  if (!preInscriptionId) {
    // Si pas de pré-inscription directe, on cherche par apprenantId
    const apprenantId = context.declencheur.data.apprenantId as string;
    if (!apprenantId) {
      return false;
    }

    const preInscription = await prisma.preInscription.findFirst({
      where: { apprenantId },
      select: { modeFinancement: true },
      orderBy: { createdAt: "desc" },
    });

    if (!preInscription || !preInscription.modeFinancement) {
      return false;
    }

    return financementConfig.typesFinancement.includes(preInscription.modeFinancement);
  }

  // Vérifier le type de financement de la pré-inscription
  const preInscription = await prisma.preInscription.findUnique({
    where: { id: preInscriptionId },
    select: { modeFinancement: true },
  });

  if (!preInscription || !preInscription.modeFinancement) {
    return false;
  }

  return financementConfig.typesFinancement.includes(preInscription.modeFinancement);
};

// ===========================================
// ÉVALUATEUR: CHAMP ÉGAL
// ===========================================

const evaluateChampEgal: ConditionEvaluator = async (
  config: ConditionSpecificConfig,
  context: WorkflowExecutionContext
): Promise<boolean> => {
  const champConfig = config as ChampConditionConfig;

  const valeurChamp = await getChampValue(
    champConfig.entite,
    champConfig.champ,
    context
  );

  return valeurChamp === champConfig.valeur;
};

// ===========================================
// ÉVALUATEUR: CHAMP CONTIENT
// ===========================================

const evaluateChampContient: ConditionEvaluator = async (
  config: ConditionSpecificConfig,
  context: WorkflowExecutionContext
): Promise<boolean> => {
  const champConfig = config as ChampConditionConfig;

  const valeurChamp = await getChampValue(
    champConfig.entite,
    champConfig.champ,
    context
  );

  if (typeof valeurChamp !== "string" || typeof champConfig.valeur !== "string") {
    return false;
  }

  return valeurChamp.toLowerCase().includes(champConfig.valeur.toLowerCase());
};

// ===========================================
// ÉVALUATEUR: CHAMP VIDE
// ===========================================

const evaluateChampVide: ConditionEvaluator = async (
  config: ConditionSpecificConfig,
  context: WorkflowExecutionContext
): Promise<boolean> => {
  const champConfig = config as ChampConditionConfig;

  const valeurChamp = await getChampValue(
    champConfig.entite,
    champConfig.champ,
    context
  );

  return valeurChamp === null || valeurChamp === undefined || valeurChamp === "";
};

// ===========================================
// ÉVALUATEUR: CHAMP NON VIDE
// ===========================================

const evaluateChampNonVide: ConditionEvaluator = async (
  config: ConditionSpecificConfig,
  context: WorkflowExecutionContext
): Promise<boolean> => {
  const champConfig = config as ChampConditionConfig;

  const valeurChamp = await getChampValue(
    champConfig.entite,
    champConfig.champ,
    context
  );

  return valeurChamp !== null && valeurChamp !== undefined && valeurChamp !== "";
};

// ===========================================
// ÉVALUATEUR: FORMULE PERSONNALISÉE
// ===========================================

const evaluateFormulePersonnalisee: ConditionEvaluator = async (
  config: ConditionSpecificConfig,
  context: WorkflowExecutionContext
): Promise<boolean> => {
  const formuleConfig = config as FormulePersonnaliseeConditionConfig;

  try {
    // Construire un contexte sécurisé pour l'évaluation
    const variables: Record<string, unknown> = {};

    for (const varName of formuleConfig.variables) {
      const parts = varName.split(".");
      let value: unknown = context.variables;

      for (const part of parts) {
        if (value && typeof value === "object" && part in value) {
          value = (value as Record<string, unknown>)[part];
        } else {
          value = undefined;
          break;
        }
      }

      variables[varName.replace(/\./g, "_")] = value;
    }

    // Évaluation sécurisée de la formule
    // Note: En production, il faudrait utiliser une lib sécurisée comme expr-eval
    const formule = formuleConfig.formule.replace(/\./g, "_");
    const func = new Function(...Object.keys(variables), `return ${formule};`);
    const result = func(...Object.values(variables));

    return Boolean(result);
  } catch (error) {
    console.error("[WorkflowCondition] Erreur évaluation formule:", error);
    return false;
  }
};

// ===========================================
// HELPER: RÉCUPÉRER LA VALEUR D'UN CHAMP
// ===========================================

async function getChampValue(
  entite: string,
  champ: string,
  context: WorkflowExecutionContext
): Promise<unknown> {
  let entityId: string | undefined;

  switch (entite) {
    case "apprenant":
      entityId = context.declencheur.data.apprenantId as string;
      if (!entityId) return undefined;

      const apprenant = await prisma.apprenant.findUnique({
        where: { id: entityId },
      });
      return apprenant ? (apprenant as Record<string, unknown>)[champ] : undefined;

    case "session":
      entityId = context.declencheur.data.sessionId as string;
      if (!entityId) return undefined;

      const session = await prisma.session.findUnique({
        where: { id: entityId },
      });
      return session ? (session as Record<string, unknown>)[champ] : undefined;

    case "formation":
      entityId = context.variables.formation?.id;
      if (!entityId) return undefined;

      const formation = await prisma.formation.findUnique({
        where: { id: entityId },
      });
      return formation ? (formation as Record<string, unknown>)[champ] : undefined;

    case "inscription":
      entityId = context.declencheur.data.inscriptionId as string;
      if (!entityId) return undefined;

      const inscription = await prisma.sessionParticipant.findUnique({
        where: { id: entityId },
      });
      return inscription ? (inscription as Record<string, unknown>)[champ] : undefined;

    default:
      return undefined;
  }
}

// ===========================================
// REGISTRY DES ÉVALUATEURS
// ===========================================

const conditionEvaluators: Record<WorkflowConditionType, ConditionEvaluator> = {
  FORMATION_CERTIFIANTE: evaluateFormationCertifiante,
  FORMATION_MODALITE: evaluateFormationModalite,
  SCORE_INFERIEUR: evaluateScoreInferieur,
  SCORE_SUPERIEUR: evaluateScoreSuperieur,
  DOCUMENT_MANQUANT: evaluateDocumentManquant,
  SIGNATURE_EN_ATTENTE: evaluateSignatureEnAttente,
  APPRENANT_HANDICAP: evaluateApprenantHandicap,
  APPRENANT_FINANCEMENT: evaluateApprenantFinancement,
  CHAMP_EGAL: evaluateChampEgal,
  CHAMP_CONTIENT: evaluateChampContient,
  CHAMP_VIDE: evaluateChampVide,
  CHAMP_NON_VIDE: evaluateChampNonVide,
  FORMULE_PERSONNALISEE: evaluateFormulePersonnalisee,
};

// ===========================================
// FONCTION PRINCIPALE D'ÉVALUATION
// ===========================================

/**
 * Évaluer une condition
 */
export async function evaluateCondition(
  condition: WorkflowConditionConfig,
  context: WorkflowExecutionContext
): Promise<boolean> {
  const evaluator = conditionEvaluators[condition.type];

  if (!evaluator) {
    console.error(`[WorkflowCondition] No evaluator found for type: ${condition.type}`);
    return false;
  }

  try {
    const result = await evaluator(condition.config, context);
    console.log(`[WorkflowCondition] ${condition.type} = ${result}`);
    return result;
  } catch (error) {
    console.error(`[WorkflowCondition] Error evaluating ${condition.type}:`, error);
    return false;
  }
}

/**
 * Évaluer plusieurs conditions avec un opérateur
 */
export async function evaluateConditions(
  conditions: WorkflowConditionConfig[],
  context: WorkflowExecutionContext,
  operator: "ET" | "OU" = "ET"
): Promise<boolean> {
  if (conditions.length === 0) {
    return true;
  }

  if (operator === "ET") {
    for (const condition of conditions) {
      const result = await evaluateCondition(condition, context);
      if (!result) return false;
    }
    return true;
  } else {
    for (const condition of conditions) {
      const result = await evaluateCondition(condition, context);
      if (result) return true;
    }
    return false;
  }
}

export default {
  evaluateCondition,
  evaluateConditions,
};
