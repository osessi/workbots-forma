// ===========================================
// SERVICE NOTIFICATIONS
// ===========================================
// Fonctions utilitaires pour créer des notifications

import { prisma } from "@/lib/db/prisma";

type NotificationType =
  | "PRE_INSCRIPTION"
  | "INSCRIPTION"
  | "SESSION_RAPPEL"
  | "FORMATION_MODIFIEE"
  | "DOCUMENT_GENERE"
  | "EVALUATION_COMPLETE"
  | "PAIEMENT_RECU"
  | "SYSTEME";

interface CreateNotificationParams {
  organizationId: string;
  userId?: string; // null = notification pour tous les admins
  type: NotificationType;
  titre: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Crée une notification dans la base de données
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        type: params.type,
        titre: params.titre,
        message: params.message,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        actionUrl: params.actionUrl,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
      },
    });

    return notification;
  } catch (error) {
    console.error("[NOTIFICATION] Erreur création notification:", error);
    throw error;
  }
}

/**
 * Crée une notification pour une nouvelle pré-inscription
 */
export async function notifyPreInscription(params: {
  organizationId: string;
  preInscriptionId: string;
  prenom: string;
  nom: string;
  formationTitre: string;
  situationHandicap?: boolean;
}) {
  const handicapInfo = params.situationHandicap
    ? " (Situation de handicap signalée)"
    : "";

  return createNotification({
    organizationId: params.organizationId,
    type: "PRE_INSCRIPTION",
    titre: "Nouvelle pré-inscription",
    message: `${params.prenom} ${params.nom} a demandé une pré-inscription à "${params.formationTitre}"${handicapInfo}`,
    resourceType: "preInscription",
    resourceId: params.preInscriptionId,
    actionUrl: `/pre-inscriptions?id=${params.preInscriptionId}`,
    metadata: {
      prenom: params.prenom,
      nom: params.nom,
      formationTitre: params.formationTitre,
      situationHandicap: params.situationHandicap,
    },
  });
}

/**
 * Crée une notification pour une inscription validée
 */
export async function notifyInscriptionValidee(params: {
  organizationId: string;
  apprenantId: string;
  prenom: string;
  nom: string;
  formationTitre: string;
  sessionId?: string;
}) {
  return createNotification({
    organizationId: params.organizationId,
    type: "INSCRIPTION",
    titre: "Inscription validée",
    message: `${params.prenom} ${params.nom} a été inscrit(e) à "${params.formationTitre}"`,
    resourceType: "apprenant",
    resourceId: params.apprenantId,
    actionUrl: params.sessionId
      ? `/sessions/${params.sessionId}/apprenants`
      : `/apprenants/${params.apprenantId}`,
    metadata: {
      prenom: params.prenom,
      nom: params.nom,
      formationTitre: params.formationTitre,
      sessionId: params.sessionId,
    },
  });
}

/**
 * Crée une notification pour un rappel de session
 */
export async function notifySessionRappel(params: {
  organizationId: string;
  sessionId: string;
  sessionNom: string;
  dateDebut: Date;
  nombreInscrits: number;
}) {
  const dateStr = params.dateDebut.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return createNotification({
    organizationId: params.organizationId,
    type: "SESSION_RAPPEL",
    titre: "Rappel de session",
    message: `La session "${params.sessionNom}" commence ${dateStr} (${params.nombreInscrits} inscrit${params.nombreInscrits > 1 ? "s" : ""})`,
    resourceType: "session",
    resourceId: params.sessionId,
    actionUrl: `/sessions/${params.sessionId}`,
    metadata: {
      sessionNom: params.sessionNom,
      dateDebut: params.dateDebut,
      nombreInscrits: params.nombreInscrits,
    },
  });
}

/**
 * Crée une notification pour un document généré
 */
export async function notifyDocumentGenere(params: {
  organizationId: string;
  userId?: string;
  documentType: string;
  documentNom: string;
  documentUrl: string;
}) {
  return createNotification({
    organizationId: params.organizationId,
    userId: params.userId,
    type: "DOCUMENT_GENERE",
    titre: "Document généré",
    message: `Le document "${params.documentNom}" a été généré avec succès`,
    resourceType: "document",
    actionUrl: params.documentUrl,
    metadata: {
      documentType: params.documentType,
      documentNom: params.documentNom,
    },
  });
}

/**
 * Crée une notification pour une évaluation complétée
 */
export async function notifyEvaluationComplete(params: {
  organizationId: string;
  evaluationId: string;
  apprenantNom: string;
  evaluationType: string;
  formationTitre: string;
  score?: number;
}) {
  const scoreInfo = params.score !== undefined ? ` (Score: ${params.score}%)` : "";

  return createNotification({
    organizationId: params.organizationId,
    type: "EVALUATION_COMPLETE",
    titre: "Évaluation complétée",
    message: `${params.apprenantNom} a terminé l'évaluation "${params.evaluationType}" de "${params.formationTitre}"${scoreInfo}`,
    resourceType: "evaluation",
    resourceId: params.evaluationId,
    actionUrl: `/evaluations/${params.evaluationId}/resultats`,
    metadata: {
      apprenantNom: params.apprenantNom,
      evaluationType: params.evaluationType,
      formationTitre: params.formationTitre,
      score: params.score,
    },
  });
}

/**
 * Crée une notification système
 */
export async function notifySystem(params: {
  organizationId: string;
  userId?: string;
  titre: string;
  message: string;
  actionUrl?: string;
}) {
  return createNotification({
    organizationId: params.organizationId,
    userId: params.userId,
    type: "SYSTEME",
    titre: params.titre,
    message: params.message,
    actionUrl: params.actionUrl,
  });
}
