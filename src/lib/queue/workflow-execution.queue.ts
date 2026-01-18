// ===========================================
// QUEUE D'EXÉCUTION DES WORKFLOWS
// Module 6 - Moteur d'Automatisation
// ===========================================

import { Queue, Worker, Job, QueueEvents } from "bullmq";
import { getRedisConnection, isRedisAvailable } from "./redis";
import { prisma } from "@/lib/db/prisma";
import {
  WorkflowExecutionStatus,
  WorkflowActionType,
  WorkflowTriggerType,
} from "@prisma/client";
import {
  WorkflowExecutionContext,
  WorkflowVariables,
  ActionConfig,
  ActionResult,
  TriggerConfig,
  DelaiActionConfig,
  ConditionActionConfig,
  WorkflowConditionConfig,
} from "@/types/workflow";

// ===========================================
// TYPES
// ===========================================

interface WorkflowJobData {
  workflowId: string;
  executionId: string;
  organizationId: string;
  declencheurType: string;
  declencheurId?: string;
  declencheurData?: Record<string, unknown>;
  etapeIndex?: number; // Pour reprendre à une étape spécifique (après délai)
}

interface WorkflowJobResult {
  success: boolean;
  executionId: string;
  etapesExecutees: number;
  erreur?: string;
}

// ===========================================
// CONFIGURATION DE LA QUEUE
// ===========================================

const QUEUE_NAME = "workflow-execution";

// Singleton de la queue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let workflowQueue: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let workflowWorker: any = null;
let workflowQueueEvents: QueueEvents | null = null;

/**
 * Obtenir ou créer la queue des workflows
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getWorkflowQueue(): Promise<any> {
  // Vérifier si Redis est disponible
  const redisAvailable = await isRedisAvailable();
  if (!redisAvailable) {
    console.log("[WorkflowQueue] Redis not available, queue disabled");
    return null;
  }

  if (!workflowQueue) {
    const connection = getRedisConnection();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    workflowQueue = new Queue(QUEUE_NAME, {
      connection: connection as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000, // 5 secondes
        },
        removeOnComplete: {
          age: 7 * 24 * 3600, // Garder 7 jours
          count: 1000, // Ou max 1000 jobs
        },
        removeOnFail: {
          age: 30 * 24 * 3600, // Garder 30 jours les échecs
        },
      },
    });

    console.log("[WorkflowQueue] Queue initialized");
  }

  return workflowQueue;
}

/**
 * Obtenir ou créer les événements de la queue
 */
export async function getWorkflowQueueEvents(): Promise<QueueEvents | null> {
  const redisAvailable = await isRedisAvailable();
  if (!redisAvailable) return null;

  if (!workflowQueueEvents) {
    const connection = getRedisConnection();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    workflowQueueEvents = new QueueEvents(QUEUE_NAME, { connection: connection as any });
  }

  return workflowQueueEvents;
}

// ===========================================
// WORKER D'EXÉCUTION
// ===========================================

/**
 * Démarrer le worker d'exécution des workflows
 */
export async function startWorkflowWorker(): Promise<Worker<WorkflowJobData, WorkflowJobResult> | null> {
  const redisAvailable = await isRedisAvailable();
  if (!redisAvailable) {
    console.log("[WorkflowWorker] Redis not available, worker disabled");
    return null;
  }

  if (!workflowWorker) {
    const connection = getRedisConnection();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    workflowWorker = new Worker(
      QUEUE_NAME,
      async (job: Job<WorkflowJobData>) => {
        return await processWorkflowJob(job);
      },
      {
        connection: connection as any,
        concurrency: 5, // 5 workflows en parallèle max
        limiter: {
          max: 100,
          duration: 60000, // 100 jobs par minute max
        },
      }
    );

    // Gestion des événements du worker
    workflowWorker.on("completed", async (job: Job<WorkflowJobData>, result: WorkflowJobResult) => {
      console.log(`[WorkflowWorker] Job ${job.id} completed:`, result);
      await updateWorkflowStats(job.data.workflowId, true);
    });

    workflowWorker.on("failed", async (job: Job<WorkflowJobData> | undefined, error: Error) => {
      console.error(`[WorkflowWorker] Job ${job?.id} failed:`, error.message);
      if (job) {
        await updateWorkflowStats(job.data.workflowId, false);
        await markExecutionFailed(job.data.executionId, error.message);
      }
    });

    workflowWorker.on("error", (error: Error) => {
      console.error("[WorkflowWorker] Worker error:", error);
    });

    console.log("[WorkflowWorker] Worker started");
  }

  return workflowWorker;
}

/**
 * Arrêter le worker
 */
export async function stopWorkflowWorker(): Promise<void> {
  if (workflowWorker) {
    await workflowWorker.close();
    workflowWorker = null;
    console.log("[WorkflowWorker] Worker stopped");
  }
}

// ===========================================
// TRAITEMENT D'UN JOB
// ===========================================

/**
 * Traiter un job de workflow
 */
async function processWorkflowJob(
  job: Job<WorkflowJobData>
): Promise<WorkflowJobResult> {
  const { workflowId, executionId, organizationId, declencheurType, declencheurId, declencheurData, etapeIndex = 0 } = job.data;

  console.log(`[WorkflowWorker] Processing workflow ${workflowId}, execution ${executionId}`);

  try {
    // Récupérer le workflow avec ses étapes
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        etapes: {
          orderBy: { ordre: "asc" },
        },
        organization: true,
      },
    });

    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (!workflow.actif) {
      throw new Error(`Workflow ${workflowId} is not active`);
    }

    // Mettre à jour le statut de l'exécution
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        statut: "EN_COURS",
        etapeActuelle: etapeIndex,
      },
    });

    // Construire le contexte d'exécution
    const context = await buildExecutionContext(
      workflowId,
      executionId,
      organizationId,
      declencheurType,
      declencheurId,
      declencheurData || {}
    );

    // Exécuter les étapes à partir de l'index donné
    let currentEtapeIndex = etapeIndex;
    let etapesExecutees = 0;

    for (let i = currentEtapeIndex; i < workflow.etapes.length; i++) {
      const etape = workflow.etapes[i];

      // Mettre à jour la progression
      const progression = Math.round(((i + 1) / workflow.etapes.length) * 100);
      await job.updateProgress(progression);

      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          etapeActuelle: i,
          progression,
        },
      });

      // Créer l'entrée d'exécution d'étape
      const executionEtape = await prisma.workflowExecutionEtape.create({
        data: {
          executionId,
          etapeId: etape.id,
          statut: "EN_COURS",
          debutAt: new Date(),
          entrees: context.variables as object,
        },
      });

      try {
        // Vérifier les conditions de l'étape
        if (etape.conditions) {
          const conditionsMet = await evaluateConditions(
            etape.conditions as unknown as WorkflowConditionConfig[],
            context
          );

          if (!conditionsMet) {
            // Marquer comme terminée (skipped)
            await prisma.workflowExecutionEtape.update({
              where: { id: executionEtape.id },
              data: {
                statut: "TERMINEE",
                finAt: new Date(),
                sorties: { skipped: true, reason: "Conditions not met" },
              },
            });

            // Logger
            await logWorkflow(workflowId, "info", `Étape ${etape.nom || etape.type} ignorée (conditions non remplies)`, executionId, etape.id);

            etapesExecutees++;
            continue;
          }
        }

        // Exécuter l'action
        const result = await executeAction(etape.type, etape.config as unknown as ActionConfig, context);

        // Gérer le cas du délai
        if (etape.type === "DELAI" && result.success) {
          const delaiConfig = etape.config as unknown as DelaiActionConfig;
          const delaiMs = calculateDelayMs(delaiConfig);

          // Planifier la reprise
          const queue = await getWorkflowQueue();
          if (queue) {
            await queue.add(
              `workflow-resume-${executionId}`,
              {
                ...job.data,
                etapeIndex: i + 1, // Reprendre à l'étape suivante
              },
              {
                delay: delaiMs,
                jobId: `resume-${executionId}-${i + 1}`,
              }
            );
          }

          // Mettre à jour l'exécution en pause
          await prisma.workflowExecution.update({
            where: { id: executionId },
            data: {
              statut: "PAUSE",
              prochaineExecution: new Date(Date.now() + delaiMs),
              delaiRestant: Math.round(delaiMs / 1000),
            },
          });

          await prisma.workflowExecutionEtape.update({
            where: { id: executionEtape.id },
            data: {
              statut: "TERMINEE",
              finAt: new Date(),
              sorties: { delayed: true, delaiMs },
            },
          });

          await logWorkflow(workflowId, "info", `Délai de ${delaiConfig.duree} ${delaiConfig.unite} programmé`, executionId, etape.id);

          // Retourner - le job sera repris après le délai
          return {
            success: true,
            executionId,
            etapesExecutees: etapesExecutees + 1,
          };
        }

        // Gérer le branchement conditionnel
        if (etape.type === "CONDITION" && result.success) {
          const conditionResult = result.data?.conditionResult as boolean;

          // Déterminer l'étape suivante
          const nextEtapeId = conditionResult
            ? etape.etapeSuivanteOuiId
            : etape.etapeSuivanteNonId;

          if (nextEtapeId) {
            // Trouver l'index de l'étape suivante
            const nextIndex = workflow.etapes.findIndex(e => e.id === nextEtapeId);
            if (nextIndex !== -1) {
              i = nextIndex - 1; // -1 car la boucle va incrémenter
            }
          }

          await prisma.workflowExecutionEtape.update({
            where: { id: executionEtape.id },
            data: {
              statut: "TERMINEE",
              finAt: new Date(),
              sorties: { conditionResult, nextEtapeId },
            },
          });

          await logWorkflow(workflowId, "info", `Condition évaluée: ${conditionResult ? 'Oui' : 'Non'}`, executionId, etape.id);

          etapesExecutees++;
          continue;
        }

        // Marquer l'étape comme terminée
        await prisma.workflowExecutionEtape.update({
          where: { id: executionEtape.id },
          data: {
            statut: result.success ? "TERMINEE" : "ERREUR",
            finAt: new Date(),
            sorties: result.data as object,
            erreur: result.error,
          },
        });

        // Si l'action a échoué et qu'on ne doit pas continuer
        if (!result.success && !etape.continuerSurErreur) {
          throw new Error(result.error || `Action ${etape.type} failed`);
        }

        // Ajouter les résultats au contexte pour les étapes suivantes
        context.resultatsEtapes[etape.id] = result.data;

        await logWorkflow(
          workflowId,
          result.success ? "info" : "warning",
          `Étape ${etape.nom || etape.type} ${result.success ? 'terminée' : 'échouée (continuer)'}`,
          executionId,
          etape.id
        );

        etapesExecutees++;

      } catch (etapeError) {
        // Gérer les réessais
        if (etape.nombreReessais > 0) {
          const currentTentative = (await prisma.workflowExecutionEtape.findFirst({
            where: { executionId, etapeId: etape.id },
            orderBy: { createdAt: "desc" },
          }))?.tentative || 1;

          if (currentTentative < etape.nombreReessais) {
            // Planifier un réessai
            const queue = await getWorkflowQueue();
            if (queue) {
              await queue.add(
                `workflow-retry-${executionId}-${etape.id}`,
                {
                  ...job.data,
                  etapeIndex: i,
                },
                {
                  delay: etape.delaiReessai * 1000,
                  jobId: `retry-${executionId}-${etape.id}-${currentTentative + 1}`,
                }
              );
            }

            await prisma.workflowExecutionEtape.update({
              where: { id: executionEtape.id },
              data: {
                statut: "EN_ATTENTE",
                erreur: etapeError instanceof Error ? etapeError.message : "Unknown error",
                tentative: currentTentative + 1,
              },
            });

            await logWorkflow(workflowId, "warning", `Réessai planifié (tentative ${currentTentative + 1}/${etape.nombreReessais})`, executionId, etape.id);

            return {
              success: true,
              executionId,
              etapesExecutees,
            };
          }
        }

        // Si on doit continuer sur erreur
        if (etape.continuerSurErreur) {
          await prisma.workflowExecutionEtape.update({
            where: { id: executionEtape.id },
            data: {
              statut: "ERREUR",
              finAt: new Date(),
              erreur: etapeError instanceof Error ? etapeError.message : "Unknown error",
            },
          });

          await logWorkflow(workflowId, "warning", `Étape ${etape.nom || etape.type} échouée mais continue`, executionId, etape.id);

          etapesExecutees++;
          continue;
        }

        // Sinon, propager l'erreur
        throw etapeError;
      }
    }

    // Workflow terminé avec succès
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        statut: "TERMINEE",
        progression: 100,
        finAt: new Date(),
      },
    });

    await logWorkflow(workflowId, "info", `Workflow terminé avec succès (${etapesExecutees} étapes)`, executionId);

    return {
      success: true,
      executionId,
      etapesExecutees,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        statut: "ERREUR",
        erreur: errorMessage,
        finAt: new Date(),
      },
    });

    await logWorkflow(workflowId, "error", `Workflow échoué: ${errorMessage}`, executionId);

    return {
      success: false,
      executionId,
      etapesExecutees: 0,
      erreur: errorMessage,
    };
  }
}

// ===========================================
// DÉCLENCHEMENT DE WORKFLOWS
// ===========================================

/**
 * Déclencher un workflow
 */
export async function triggerWorkflow(
  workflowId: string,
  declencheurType: string,
  declencheurId?: string,
  declencheurData?: Record<string, unknown>
): Promise<string | null> {
  const queue = await getWorkflowQueue();
  if (!queue) {
    console.log("[WorkflowTrigger] Queue not available, executing synchronously");
    // Exécution synchrone de fallback
    return await triggerWorkflowSync(workflowId, declencheurType, declencheurId, declencheurData);
  }

  // Récupérer le workflow
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  });

  if (!workflow || !workflow.actif) {
    console.log(`[WorkflowTrigger] Workflow ${workflowId} not found or inactive`);
    return null;
  }

  // Créer l'exécution
  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId,
      declencheurType,
      declencheurId,
      declencheurData: declencheurData as object,
      statut: "EN_ATTENTE",
    },
  });

  // Ajouter le job à la queue
  await queue.add(
    `workflow-${workflowId}`,
    {
      workflowId,
      executionId: execution.id,
      organizationId: workflow.organizationId,
      declencheurType,
      declencheurId,
      declencheurData,
    },
    {
      jobId: `exec-${execution.id}`,
    }
  );

  // Mettre à jour les stats
  await prisma.workflow.update({
    where: { id: workflowId },
    data: {
      derniereDeclenchement: new Date(),
      nombreExecutions: { increment: 1 },
    },
  });

  console.log(`[WorkflowTrigger] Workflow ${workflowId} triggered, execution ${execution.id}`);

  return execution.id;
}

/**
 * Déclencher tous les workflows pour un événement
 */
export async function triggerWorkflowsForEvent(
  organizationId: string,
  triggerType: WorkflowTriggerType,
  declencheurId?: string,
  declencheurData?: Record<string, unknown>
): Promise<string[]> {
  // Trouver tous les workflows actifs pour ce trigger
  const workflows = await prisma.workflow.findMany({
    where: {
      organizationId,
      actif: true,
      triggerType,
    },
  });

  const executionIds: string[] = [];

  for (const workflow of workflows) {
    // Vérifier les filtres du trigger
    if (workflow.triggerConfig) {
      const config = workflow.triggerConfig as TriggerConfig;

      // Filtrer par formation
      if (config.formationIds && config.formationIds.length > 0) {
        const formationId = declencheurData?.formationId as string;
        if (formationId && !config.formationIds.includes(formationId)) {
          continue;
        }
      }

      // Filtrer par session
      if (config.sessionIds && config.sessionIds.length > 0) {
        const sessionId = declencheurData?.sessionId as string;
        if (sessionId && !config.sessionIds.includes(sessionId)) {
          continue;
        }
      }
    }

    const executionId = await triggerWorkflow(
      workflow.id,
      triggerType,
      declencheurId,
      declencheurData
    );

    if (executionId) {
      executionIds.push(executionId);
    }
  }

  console.log(`[WorkflowTrigger] Triggered ${executionIds.length} workflows for ${triggerType}`);

  return executionIds;
}

/**
 * Exécution synchrone de fallback (sans Redis)
 */
async function triggerWorkflowSync(
  workflowId: string,
  declencheurType: string,
  declencheurId?: string,
  declencheurData?: Record<string, unknown>
): Promise<string | null> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: {
      etapes: { orderBy: { ordre: "asc" } },
    },
  });

  if (!workflow || !workflow.actif) {
    return null;
  }

  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId,
      declencheurType,
      declencheurId,
      declencheurData: declencheurData as object,
      statut: "EN_COURS",
    },
  });

  try {
    const context = await buildExecutionContext(
      workflowId,
      execution.id,
      workflow.organizationId,
      declencheurType,
      declencheurId,
      declencheurData || {}
    );

    for (const etape of workflow.etapes) {
      // Skip les délais en mode sync
      if (etape.type === "DELAI") {
        continue;
      }

      const result = await executeAction(etape.type, etape.config as unknown as ActionConfig, context);

      if (!result.success && !etape.continuerSurErreur) {
        throw new Error(result.error);
      }

      context.resultatsEtapes[etape.id] = result.data;
    }

    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        statut: "TERMINEE",
        progression: 100,
        finAt: new Date(),
      },
    });

    return execution.id;

  } catch (error) {
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        statut: "ERREUR",
        erreur: error instanceof Error ? error.message : "Unknown error",
        finAt: new Date(),
      },
    });

    return execution.id;
  }
}

// ===========================================
// HELPERS
// ===========================================

/**
 * Construire le contexte d'exécution
 */
async function buildExecutionContext(
  workflowId: string,
  executionId: string,
  organizationId: string,
  declencheurType: string,
  declencheurId?: string,
  declencheurData?: Record<string, unknown>
): Promise<WorkflowExecutionContext> {
  // Récupérer l'organisation
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  // Construire les variables de base
  const variables: WorkflowVariables = {
    organisation: {
      nom: organization?.name || "",
      nomCommercial: organization?.nomCommercial || undefined,
      email: organization?.email || undefined,
      telephone: organization?.telephone || undefined,
      adresse: organization?.adresse || undefined,
      logo: organization?.logo || undefined,
    },
    maintenant: new Date(),
  };

  // Enrichir avec les données du déclencheur
  if (declencheurData) {
    // Apprenant
    if (declencheurData.apprenantId) {
      const apprenant = await prisma.apprenant.findUnique({
        where: { id: declencheurData.apprenantId as string },
      });
      if (apprenant) {
        variables.apprenant = {
          id: apprenant.id,
          nom: apprenant.nom,
          prenom: apprenant.prenom,
          email: apprenant.email,
          telephone: apprenant.telephone || undefined,
        };
      }
    }

    // Formation
    if (declencheurData.formationId) {
      const formation = await prisma.formation.findUnique({
        where: { id: declencheurData.formationId as string },
      });
      if (formation) {
        variables.formation = {
          id: formation.id,
          titre: formation.titre,
          description: formation.description || undefined,
        };
      }
    }

    // Session
    if (declencheurData.sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: declencheurData.sessionId as string },
        include: {
          formateur: true,
          lieu: true,
        },
      });
      if (session) {
        variables.session = {
          id: session.id,
          lieu: session.lieu?.nom || session.lieuTexteLibre || undefined,
          formateur: session.formateur
            ? `${session.formateur.prenom} ${session.formateur.nom}`
            : undefined,
        };
      }
    }

    // Données personnalisées
    variables.custom = declencheurData;
  }

  return {
    workflowId,
    executionId,
    organizationId,
    declencheur: {
      type: declencheurType,
      id: declencheurId || "",
      data: declencheurData || {},
    },
    resultatsEtapes: {},
    variables,
  };
}

/**
 * Exécuter une action
 */
async function executeAction(
  type: WorkflowActionType,
  config: ActionConfig,
  context: WorkflowExecutionContext
): Promise<ActionResult> {
  // Import dynamique des handlers
  const { actionHandlers } = await import("./workflow-action-handlers");

  const handler = actionHandlers[type];
  if (!handler) {
    return {
      success: false,
      error: `No handler found for action type: ${type}`,
    };
  }

  try {
    return await handler(config, context);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Évaluer les conditions d'une étape
 */
async function evaluateConditions(
  conditions: WorkflowConditionConfig[],
  context: WorkflowExecutionContext
): Promise<boolean> {
  // Import dynamique des évaluateurs
  const { evaluateCondition } = await import("./workflow-condition-evaluators");

  for (const condition of conditions) {
    const result = await evaluateCondition(condition, context);
    if (!result) {
      return false; // AND logic by default
    }
  }

  return true;
}

/**
 * Calculer le délai en millisecondes
 */
function calculateDelayMs(config: DelaiActionConfig): number {
  const { duree, unite } = config;

  switch (unite) {
    case "minutes":
      return duree * 60 * 1000;
    case "heures":
      return duree * 60 * 60 * 1000;
    case "jours":
      return duree * 24 * 60 * 60 * 1000;
    case "semaines":
      return duree * 7 * 24 * 60 * 60 * 1000;
    default:
      return duree * 60 * 1000; // Default to minutes
  }
}

/**
 * Logger une entrée de workflow
 */
async function logWorkflow(
  workflowId: string,
  niveau: string,
  message: string,
  executionId?: string,
  etapeId?: string
): Promise<void> {
  await prisma.workflowLog.create({
    data: {
      workflowId,
      niveau,
      message,
      executionId,
      etapeId,
    },
  });
}

/**
 * Mettre à jour les statistiques du workflow
 */
async function updateWorkflowStats(workflowId: string, success: boolean): Promise<void> {
  await prisma.workflow.update({
    where: { id: workflowId },
    data: success
      ? {}
      : { nombreErreurs: { increment: 1 } },
  });
}

/**
 * Marquer une exécution comme échouée
 */
async function markExecutionFailed(executionId: string, error: string): Promise<void> {
  await prisma.workflowExecution.update({
    where: { id: executionId },
    data: {
      statut: "ERREUR",
      erreur: error,
      finAt: new Date(),
    },
  });
}

// ===========================================
// CRON SCHEDULER
// ===========================================

/**
 * Planifier les workflows CRON
 * À appeler au démarrage de l'application et périodiquement
 */
export async function scheduleCronWorkflows(): Promise<void> {
  const queue = await getWorkflowQueue();
  if (!queue) {
    console.log("[WorkflowCron] Queue not available");
    return;
  }

  // Récupérer tous les workflows CRON actifs
  const cronWorkflows = await prisma.workflow.findMany({
    where: {
      actif: true,
      triggerType: "CRON",
    },
  });

  for (const workflow of cronWorkflows) {
    const config = workflow.triggerConfig as { expression: string; timezone?: string } | null;
    if (!config?.expression) continue;

    // Ajouter un job répétable
    await queue.add(
      `cron-${workflow.id}`,
      {
        workflowId: workflow.id,
        executionId: "", // Sera créé au moment de l'exécution
        organizationId: workflow.organizationId,
        declencheurType: "CRON",
      },
      {
        repeat: {
          pattern: config.expression,
          tz: config.timezone || "Europe/Paris",
        },
        jobId: `cron-${workflow.id}`,
      }
    );

    console.log(`[WorkflowCron] Scheduled workflow ${workflow.id} with pattern ${config.expression}`);
  }
}

/**
 * Annuler une exécution en cours
 */
export async function cancelWorkflowExecution(executionId: string): Promise<boolean> {
  const execution = await prisma.workflowExecution.findUnique({
    where: { id: executionId },
  });

  if (!execution || execution.statut === "TERMINEE" || execution.statut === "ERREUR") {
    return false;
  }

  // Mettre à jour le statut
  await prisma.workflowExecution.update({
    where: { id: executionId },
    data: {
      statut: "ANNULEE",
      finAt: new Date(),
    },
  });

  // Supprimer les jobs planifiés
  const queue = await getWorkflowQueue();
  if (queue) {
    const jobs = await queue.getJobs(["delayed", "waiting"]);
    for (const job of jobs) {
      if (job.data.executionId === executionId) {
        await job.remove();
      }
    }
  }

  await logWorkflow(execution.workflowId, "info", "Exécution annulée", executionId);

  return true;
}
