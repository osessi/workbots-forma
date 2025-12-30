// ===========================================
// SERVICE D'INTÉGRATION DES DÉCLENCHEURS
// Module 6 - Moteur d'Automatisation
// ===========================================

import { WorkflowTriggerType } from "@prisma/client";
import { triggerWorkflowsForEvent } from "@/lib/queue/workflow-execution.queue";

/**
 * Service centralisé pour déclencher les workflows
 * Intégré dans les différentes parties de l'application
 */

// ===========================================
// DÉCLENCHEURS D'INSCRIPTION
// ===========================================

/**
 * Déclencher les workflows lors d'une nouvelle pré-inscription
 */
export async function onPreInscription(
  organizationId: string,
  preInscriptionId: string,
  data: {
    formationId: string;
    apprenantNom: string;
    apprenantPrenom: string;
    apprenantEmail: string;
  }
): Promise<void> {
  await triggerWorkflowsForEvent(
    organizationId,
    "PRE_INSCRIPTION" as WorkflowTriggerType,
    preInscriptionId,
    {
      preInscriptionId,
      formationId: data.formationId,
      apprenantNom: data.apprenantNom,
      apprenantPrenom: data.apprenantPrenom,
      apprenantEmail: data.apprenantEmail,
    }
  );
}

/**
 * Déclencher les workflows lors d'une inscription confirmée à une session
 */
export async function onInscriptionSession(
  organizationId: string,
  inscriptionId: string,
  data: {
    sessionId: string;
    formationId: string;
    apprenantId: string;
  }
): Promise<void> {
  await triggerWorkflowsForEvent(
    organizationId,
    "INSCRIPTION_SESSION" as WorkflowTriggerType,
    inscriptionId,
    {
      inscriptionId,
      sessionId: data.sessionId,
      formationId: data.formationId,
      apprenantId: data.apprenantId,
    }
  );
}

// ===========================================
// DÉCLENCHEURS DE SESSION
// ===========================================

/**
 * Déclencher les workflows J-7 avant session
 * À appeler via un CRON quotidien
 */
export async function onSessionJMoins7(
  organizationId: string,
  sessionId: string,
  data: {
    formationId: string;
    apprenantIds: string[];
  }
): Promise<void> {
  // Déclencher pour chaque apprenant inscrit
  for (const apprenantId of data.apprenantIds) {
    await triggerWorkflowsForEvent(
      organizationId,
      "SESSION_J_MOINS_7" as WorkflowTriggerType,
      sessionId,
      {
        sessionId,
        formationId: data.formationId,
        apprenantId,
      }
    );
  }
}

/**
 * Déclencher les workflows J-1 avant session
 */
export async function onSessionJMoins1(
  organizationId: string,
  sessionId: string,
  data: {
    formationId: string;
    apprenantIds: string[];
  }
): Promise<void> {
  for (const apprenantId of data.apprenantIds) {
    await triggerWorkflowsForEvent(
      organizationId,
      "SESSION_J_MOINS_1" as WorkflowTriggerType,
      sessionId,
      {
        sessionId,
        formationId: data.formationId,
        apprenantId,
      }
    );
  }
}

/**
 * Déclencher les workflows au début d'une session
 */
export async function onSessionDebut(
  organizationId: string,
  sessionId: string,
  data: {
    formationId: string;
    apprenantIds: string[];
  }
): Promise<void> {
  for (const apprenantId of data.apprenantIds) {
    await triggerWorkflowsForEvent(
      organizationId,
      "SESSION_DEBUT" as WorkflowTriggerType,
      sessionId,
      {
        sessionId,
        formationId: data.formationId,
        apprenantId,
      }
    );
  }
}

/**
 * Déclencher les workflows à la fin d'une journée de formation
 */
export async function onSessionFinJournee(
  organizationId: string,
  sessionId: string,
  data: {
    formationId: string;
    apprenantIds: string[];
    journeeNumero: number;
  }
): Promise<void> {
  for (const apprenantId of data.apprenantIds) {
    await triggerWorkflowsForEvent(
      organizationId,
      "SESSION_FIN_JOURNEE" as WorkflowTriggerType,
      sessionId,
      {
        sessionId,
        formationId: data.formationId,
        apprenantId,
        journeeNumero: data.journeeNumero,
      }
    );
  }
}

/**
 * Déclencher les workflows à la fin d'une session
 */
export async function onSessionFin(
  organizationId: string,
  sessionId: string,
  data: {
    formationId: string;
    apprenantIds: string[];
  }
): Promise<void> {
  for (const apprenantId of data.apprenantIds) {
    await triggerWorkflowsForEvent(
      organizationId,
      "SESSION_FIN" as WorkflowTriggerType,
      sessionId,
      {
        sessionId,
        formationId: data.formationId,
        apprenantId,
      }
    );
  }
}

/**
 * Déclencher les workflows J+30 après fin de session
 * À appeler via un CRON quotidien
 */
export async function onSessionJPlus30(
  organizationId: string,
  sessionId: string,
  data: {
    formationId: string;
    apprenantIds: string[];
  }
): Promise<void> {
  for (const apprenantId of data.apprenantIds) {
    await triggerWorkflowsForEvent(
      organizationId,
      "SESSION_J_PLUS_30" as WorkflowTriggerType,
      sessionId,
      {
        sessionId,
        formationId: data.formationId,
        apprenantId,
      }
    );
  }
}

// ===========================================
// DÉCLENCHEURS D'ÉVALUATION
// ===========================================

/**
 * Déclencher les workflows lors de la complétion d'une évaluation
 */
export async function onEvaluationCompletee(
  organizationId: string,
  evaluationId: string,
  data: {
    formationId: string;
    sessionId?: string;
    apprenantId: string;
    typeEvaluation: string;
    score: number;
  }
): Promise<void> {
  await triggerWorkflowsForEvent(
    organizationId,
    "EVALUATION_COMPLETEE" as WorkflowTriggerType,
    evaluationId,
    {
      evaluationId,
      formationId: data.formationId,
      sessionId: data.sessionId,
      apprenantId: data.apprenantId,
      typeEvaluation: data.typeEvaluation,
      score: data.score,
    }
  );

  // Vérifier aussi le trigger de score faible
  // Le filtrage par seuil se fait dans la fonction triggerWorkflowsForEvent
  await triggerWorkflowsForEvent(
    organizationId,
    "SCORE_INFERIEUR_SEUIL" as WorkflowTriggerType,
    evaluationId,
    {
      evaluationId,
      formationId: data.formationId,
      sessionId: data.sessionId,
      apprenantId: data.apprenantId,
      typeEvaluation: data.typeEvaluation,
      score: data.score,
    }
  );
}

// ===========================================
// DÉCLENCHEURS DE DOCUMENTS
// ===========================================

/**
 * Déclencher les workflows pour un document non signé
 * À appeler via un CRON quotidien
 */
export async function onDocumentNonSigne(
  organizationId: string,
  documentId: string,
  data: {
    formationId?: string;
    sessionId?: string;
    apprenantId: string;
    typeDocument: string;
    joursDepuisEnvoi: number;
  }
): Promise<void> {
  await triggerWorkflowsForEvent(
    organizationId,
    "DOCUMENT_NON_SIGNE" as WorkflowTriggerType,
    documentId,
    {
      documentId,
      formationId: data.formationId,
      sessionId: data.sessionId,
      apprenantId: data.apprenantId,
      typeDocument: data.typeDocument,
      joursDepuisEnvoi: data.joursDepuisEnvoi,
    }
  );
}

/**
 * Déclencher les workflows lors de la génération d'un document
 */
export async function onDocumentGenere(
  organizationId: string,
  documentId: string,
  data: {
    formationId?: string;
    sessionId?: string;
    apprenantId?: string;
    typeDocument: string;
  }
): Promise<void> {
  await triggerWorkflowsForEvent(
    organizationId,
    "DOCUMENT_GENERE" as WorkflowTriggerType,
    documentId,
    {
      documentId,
      ...data,
    }
  );
}

/**
 * Déclencher les workflows lors de la réception d'une signature
 */
export async function onSignatureRecue(
  organizationId: string,
  signatureId: string,
  data: {
    documentId: string;
    formationId?: string;
    sessionId?: string;
    apprenantId?: string;
    typeDocument: string;
    signataire: string;
  }
): Promise<void> {
  await triggerWorkflowsForEvent(
    organizationId,
    "SIGNATURE_RECUE" as WorkflowTriggerType,
    signatureId,
    {
      signatureId,
      ...data,
    }
  );
}

// ===========================================
// DÉCLENCHEURS QUALITÉ
// ===========================================

/**
 * Déclencher les workflows lors de la réception d'une réclamation
 */
export async function onReclamationRecue(
  organizationId: string,
  reclamationId: string,
  data: {
    formationId?: string;
    apprenantId?: string;
    description: string;
    origine: string;
  }
): Promise<void> {
  await triggerWorkflowsForEvent(
    organizationId,
    "RECLAMATION_RECUE" as WorkflowTriggerType,
    reclamationId,
    {
      reclamationId,
      ...data,
    }
  );
}

/**
 * Déclencher les workflows lors de la création d'une action d'amélioration
 */
export async function onAmeliorationCreee(
  organizationId: string,
  ameliorationId: string,
  data: {
    formationId?: string;
    reclamationId?: string;
    titre: string;
    origine: string;
  }
): Promise<void> {
  await triggerWorkflowsForEvent(
    organizationId,
    "AMELIORATION_CREEE" as WorkflowTriggerType,
    ameliorationId,
    {
      ameliorationId,
      ...data,
    }
  );
}

// ===========================================
// CRON JOBS POUR LES DÉCLENCHEURS TEMPORELS
// ===========================================

import { prisma } from "@/lib/db/prisma";

/**
 * Exécuter les vérifications quotidiennes pour les déclencheurs temporels
 * À appeler via un CRON quotidien (ex: tous les jours à 8h)
 *
 * TODO: Refactoriser pour utiliser SessionJourneeNew au lieu de dateDebut/dateFin
 * La structure Session utilise des journées distinctes via SessionJourneeNew
 */
export async function runDailyTriggerChecks(): Promise<void> {
  console.log("[WorkflowTriggers] Running daily checks...");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // J-7 avant session - Utiliser la première journée de la session
  const jMoins7 = new Date(today);
  jMoins7.setDate(jMoins7.getDate() + 7);

  // Trouver les sessions qui ont leur première journée dans 7 jours
  const journeesJMoins7 = await prisma.sessionJourneeNew.findMany({
    where: {
      date: {
        gte: jMoins7,
        lt: new Date(jMoins7.getTime() + 24 * 60 * 60 * 1000),
      },
      ordre: 1, // Première journée seulement
    },
    include: {
      session: {
        include: {
          formation: true,
          clients: {
            include: {
              participants: {
                include: { apprenant: true }
              }
            }
          }
        }
      }
    }
  });

  for (const journee of journeesJMoins7) {
    const session = journee.session;
    if (!session.formation) continue;

    const apprenantIds = session.clients.flatMap(
      client => client.participants.map(p => p.apprenantId)
    );

    await onSessionJMoins7(
      session.organizationId,
      session.id,
      {
        formationId: session.formationId,
        apprenantIds,
      }
    );
  }

  console.log(`[WorkflowTriggers] J-7: ${journeesJMoins7.length} sessions`);

  // J-1 avant session
  const jMoins1 = new Date(today);
  jMoins1.setDate(jMoins1.getDate() + 1);

  const journeesJMoins1 = await prisma.sessionJourneeNew.findMany({
    where: {
      date: {
        gte: jMoins1,
        lt: new Date(jMoins1.getTime() + 24 * 60 * 60 * 1000),
      },
      ordre: 1, // Première journée seulement
    },
    include: {
      session: {
        include: {
          formation: true,
          clients: {
            include: {
              participants: {
                include: { apprenant: true }
              }
            }
          }
        }
      }
    }
  });

  for (const journee of journeesJMoins1) {
    const session = journee.session;
    if (!session.formation) continue;

    const apprenantIds = session.clients.flatMap(
      client => client.participants.map(p => p.apprenantId)
    );

    await onSessionJMoins1(
      session.organizationId,
      session.id,
      {
        formationId: session.formationId,
        apprenantIds,
      }
    );
  }

  console.log(`[WorkflowTriggers] J-1: ${journeesJMoins1.length} sessions`);

  // J+30 après fin de session (éval à froid) - Utiliser la dernière journée
  const jPlus30 = new Date(today);
  jPlus30.setDate(jPlus30.getDate() - 30);

  // Trouver les dernières journées de sessions qui se sont terminées il y a 30 jours
  const journeesJPlus30 = await prisma.sessionJourneeNew.findMany({
    where: {
      date: {
        gte: jPlus30,
        lt: new Date(jPlus30.getTime() + 24 * 60 * 60 * 1000),
      },
      session: {
        status: "TERMINEE"
      }
    },
    include: {
      session: {
        include: {
          formation: true,
          clients: {
            include: {
              participants: {
                include: { apprenant: true }
              }
            }
          },
          journees: {
            orderBy: { ordre: "desc" },
            take: 1
          }
        }
      }
    }
  });

  // Filtrer pour ne garder que les sessions où cette journée est la dernière
  const sessionsJPlus30Unique: typeof journeesJPlus30 = [];
  for (const journee of journeesJPlus30) {
    const lastJournee = journee.session.journees[0];
    if (lastJournee && lastJournee.id === journee.id) {
      sessionsJPlus30Unique.push(journee);
    }
  }

  for (const journee of sessionsJPlus30Unique) {
    const session = journee.session;
    if (!session.formation) continue;

    const apprenantIds = session.clients.flatMap(
      client => client.participants.map(p => p.apprenantId)
    );

    await onSessionJPlus30(
      session.organizationId,
      session.id,
      {
        formationId: session.formationId,
        apprenantIds,
      }
    );
  }

  console.log(`[WorkflowTriggers] J+30: ${sessionsJPlus30Unique.length} sessions`);

  // Documents non signés (après X jours)
  const documentsNonSignes = await prisma.signatureDocument.findMany({
    where: {
      status: "PENDING_SIGNATURE",
      createdAt: {
        lt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), // Plus de 3 jours
      },
    },
    include: {
      organization: true,
    },
  });

  for (const doc of documentsNonSignes) {
    const joursDepuisEnvoi = Math.floor(
      (today.getTime() - doc.createdAt.getTime()) / (24 * 60 * 60 * 1000)
    );

    await onDocumentNonSigne(
      doc.organizationId,
      doc.id,
      {
        typeDocument: doc.documentType || "AUTRE",
        joursDepuisEnvoi,
        apprenantId: doc.apprenantId || "",
      }
    );
  }

  console.log(`[WorkflowTriggers] Documents non signés: ${documentsNonSignes.length}`);

  console.log("[WorkflowTriggers] Daily checks completed");
}

// Export pour utilisation externe
export default {
  // Inscriptions
  onPreInscription,
  onInscriptionSession,

  // Sessions
  onSessionJMoins7,
  onSessionJMoins1,
  onSessionDebut,
  onSessionFinJournee,
  onSessionFin,
  onSessionJPlus30,

  // Évaluations
  onEvaluationCompletee,

  // Documents
  onDocumentNonSigne,
  onDocumentGenere,
  onSignatureRecue,

  // Qualité
  onReclamationRecue,
  onAmeliorationCreee,

  // CRON
  runDailyTriggerChecks,
};
