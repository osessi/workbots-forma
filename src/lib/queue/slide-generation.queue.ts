// ===========================================
// QUEUE DE GÉNÉRATION DE SLIDES
// Utilise BullMQ pour les jobs persistants
// ===========================================

import { Queue, Worker, Job } from "bullmq";
import { getRedisConnection } from "./redis";
import prisma from "@/lib/db/prisma";
import { createGammaClient, FormationSlidesConfig, ModuleSlideConfig, GammaImageSource } from "@/lib/gamma";
import { generateFreeText } from "@/lib/ai/generate";

// Nom de la queue
const QUEUE_NAME = "slide-generation";

// Types
export interface SlideGenerationJobData {
  generationId: string;
  formationId?: string;
  formationTitre: string;
  modules: {
    id: string;
    titre: string;
    contenu: string;
    objectifs?: string[];
    numCards?: number;
  }[];
  gammaApiKey: string;
  options: {
    themeId?: string;
    tone: string;
    audience: string;
    imageSource: string;
    imageStyle: string;
    includeIntro: boolean;
    includeConclusion: boolean;
    cardsPerModule: number;
    language: string;
  };
}

interface EnrichedModule {
  id: string;
  titre: string;
  contenu: string;
  objectifs: string[];
  keyPoints: string[];
  examples: string[];
  transitions: {
    intro: string;
    outro: string;
  };
}

// Queue singleton
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let slideQueue: any = null;

/**
 * Obtenir la queue de génération de slides
 * Retourne null si Redis n'est pas configuré
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSlideGenerationQueue(): any {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!slideQueue) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      slideQueue = new Queue(QUEUE_NAME, {
        connection: getRedisConnection() as any,
        defaultJobOptions: {
          removeOnComplete: { count: 100 }, // Garder les 100 derniers jobs complétés
          removeOnFail: { count: 50 }, // Garder les 50 derniers échecs
          attempts: 2, // 2 tentatives max
          backoff: {
            type: "exponential",
            delay: 5000, // 5 secondes entre les tentatives
          },
        },
      });
    } catch (error) {
      console.error("[Queue] Failed to create queue:", error);
      return null;
    }
  }
  return slideQueue;
}

/**
 * Ajouter un job de génération à la queue
 */
export async function addSlideGenerationJob(data: SlideGenerationJobData): Promise<Job<SlideGenerationJobData> | null> {
  const queue = getSlideGenerationQueue();
  if (!queue) {
    console.error("[Queue] Cannot add job - queue not available");
    return null;
  }
  const job = await queue.add("generate", data, {
    jobId: data.generationId, // Utiliser l'ID de génération comme ID de job
  });
  console.log(`[Queue] Job ajouté: ${job.id}`);
  return job;
}

// ============================================
// WORKER - Traitement des jobs
// ============================================

// Worker singleton
let slideWorker: Worker<SlideGenerationJobData> | null = null;

/**
 * Enrichir le contenu d'un module avec Claude
 */
async function enrichModuleContent(
  module: SlideGenerationJobData["modules"][0],
  formationTitre: string,
  moduleIndex: number,
  totalModules: number,
  tone: string,
  audience: string
): Promise<EnrichedModule> {
  const systemPrompt = `Tu es un expert en conception pédagogique spécialisé dans la création de présentations PowerPoint professionnelles pour la formation.
Tu dois enrichir le contenu des modules de formation pour créer des slides engageantes et pédagogiques.
Réponds TOUJOURS en JSON valide.`;

  const userPrompt = `Enrichis le contenu de ce module de formation pour créer une présentation PowerPoint de qualité professionnelle.

FORMATION: "${formationTitre}"
MODULE ${moduleIndex + 1}/${totalModules}: "${module.titre}"

CONTENU ACTUEL:
${module.contenu}

${module.objectifs ? `OBJECTIFS PÉDAGOGIQUES:\n${module.objectifs.join("\n")}` : ""}

TON SOUHAITÉ: ${tone}
AUDIENCE: ${audience || "professionnels en formation continue"}

INSTRUCTIONS:
1. Enrichis le contenu pour qu'il soit plus détaillé et pédagogique
2. Ajoute des exemples concrets et pertinents
3. Identifie les points clés à retenir
4. Crée des transitions fluides (intro et outro du module)
5. Assure-toi que le contenu est cohérent avec le reste de la formation
6. Le contenu doit pouvoir être divisé en ${module.numCards || 10} slides

Réponds UNIQUEMENT avec ce JSON (pas de texte avant ou après):
{
  "contenu_enrichi": "Le contenu enrichi et structuré avec des sections claires...",
  "objectifs": ["Objectif 1", "Objectif 2"],
  "points_cles": ["Point clé 1", "Point clé 2"],
  "exemples": ["Exemple concret 1", "Exemple concret 2"],
  "transition_intro": "Phrase d'introduction du module...",
  "transition_outro": "Phrase de conclusion/transition vers la suite..."
}`;

  const result = await generateFreeText(systemPrompt, userPrompt, {
    config: {
      maxTokens: 4096,
      temperature: 0.7,
    },
  });

  if (!result.success || !result.data) {
    throw new Error(result.error || "Erreur enrichissement module");
  }

  const jsonMatch = result.data.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("JSON non trouvé dans la réponse IA");
  }

  const enriched = JSON.parse(jsonMatch[0]);

  return {
    id: module.id,
    titre: module.titre,
    contenu: enriched.contenu_enrichi || module.contenu,
    objectifs: enriched.objectifs || module.objectifs || [],
    keyPoints: enriched.points_cles || [],
    examples: enriched.exemples || [],
    transitions: {
      intro: enriched.transition_intro || "",
      outro: enriched.transition_outro || "",
    },
  };
}

/**
 * Processeur de job de génération
 */
async function processSlideGenerationJob(job: Job<SlideGenerationJobData>): Promise<void> {
  const { generationId, formationId, formationTitre, modules, gammaApiKey, options } = job.data;
  const totalModules = modules.length;

  console.log(`[Worker] Traitement du job ${generationId}`);

  try {
    // === PHASE 1: Enrichissement avec Claude ===
    await job.updateProgress(5);
    await prisma.slideGeneration.update({
      where: { id: generationId },
      data: { status: "ENRICHMENT", progress: 5, currentPhase: "enrichment" },
    });

    const enrichedModules: EnrichedModule[] = [];
    const enrichmentProgressStep = 40 / totalModules;

    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      const currentProgress = Math.round(5 + i * enrichmentProgressStep);

      await job.updateProgress(currentProgress);
      await prisma.slideGeneration.update({
        where: { id: generationId },
        data: {
          progress: currentProgress,
          currentModuleIndex: i,
          currentModuleName: module.titre,
        },
      });

      try {
        const enriched = await enrichModuleContent(
          module,
          formationTitre,
          i,
          modules.length,
          options.tone,
          options.audience
        );
        enrichedModules.push(enriched);
      } catch (error) {
        console.error(`[Worker] Erreur enrichissement module ${module.id}:`, error);
        enrichedModules.push({
          id: module.id,
          titre: module.titre,
          contenu: module.contenu,
          objectifs: module.objectifs || [],
          keyPoints: [],
          examples: [],
          transitions: { intro: "", outro: "" },
        });
      }
    }

    // === PHASE 2: Génération avec Gamma ===
    await job.updateProgress(50);
    await prisma.slideGeneration.update({
      where: { id: generationId },
      data: { status: "GENERATING", progress: 50, currentPhase: "generation" },
    });

    const gammaClient = createGammaClient(gammaApiKey);

    const modulesForGamma: ModuleSlideConfig[] = enrichedModules.map((m) => {
      let fullContent = "";
      if (m.transitions.intro) fullContent += `${m.transitions.intro}\n\n`;
      fullContent += m.contenu;
      if (m.keyPoints.length > 0) {
        fullContent += `\n\n## Points clés à retenir\n`;
        m.keyPoints.forEach((p) => (fullContent += `• ${p}\n`));
      }
      if (m.examples.length > 0) {
        fullContent += `\n\n## Exemples pratiques\n`;
        m.examples.forEach((e) => (fullContent += `• ${e}\n`));
      }
      if (m.transitions.outro) fullContent += `\n\n${m.transitions.outro}`;

      return {
        moduleId: m.id,
        moduleTitre: m.titre,
        contenu: fullContent,
        objectifs: m.objectifs,
        numCards: options.cardsPerModule,
      };
    });

    const config: FormationSlidesConfig = {
      formationTitre,
      modules: modulesForGamma,
      themeId: options.themeId || undefined,
      language: options.language,
      tone: options.tone,
      audience: options.audience || "professionnels en formation continue",
      imageSource: options.imageSource as GammaImageSource,
      imageStyle: options.imageStyle,
      exportAs: "pptx",
      includeIntro: options.includeIntro,
      includeConclusion: options.includeConclusion,
    };

    const generationProgressStep =
      40 / (totalModules + (options.includeIntro ? 1 : 0) + (options.includeConclusion ? 1 : 0));
    let generationIndex = 0;

    const result = await gammaClient.generateFormationSlides(config, async (moduleIndex) => {
      generationIndex++;
      const progress = Math.round(50 + generationIndex * generationProgressStep);
      await job.updateProgress(progress);
      await prisma.slideGeneration.update({
        where: { id: generationId },
        data: { progress, currentModuleIndex: moduleIndex },
      });
    });

    // === PHASE 3: Finalisation ===
    await job.updateProgress(95);
    await prisma.slideGeneration.update({
      where: { id: generationId },
      data: { status: "FINALIZING", progress: 95, currentPhase: "finalizing" },
    });

    const slidesData = result.modules.map((m) => ({
      moduleId: m.moduleId,
      moduleTitre: m.moduleTitre,
      generationId: m.generationId,
      gammaUrl: m.gammaUrl,
      exportUrl: m.exportUrl,
      status: m.status,
      error: m.error,
    }));

    if (formationId) {
      await prisma.formation.update({
        where: { id: formationId },
        data: {
          slidesGenerated: true,
          slidesData: slidesData as unknown as import("@prisma/client").Prisma.InputJsonValue,
          slidesGeneratedAt: new Date(),
        },
      });
    }

    await job.updateProgress(100);
    await prisma.slideGeneration.update({
      where: { id: generationId },
      data: {
        status: "COMPLETED",
        progress: 100,
        currentPhase: "complete",
        moduleResults: slidesData as unknown as import("@prisma/client").Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    console.log(`[Worker] Job ${generationId} terminé avec succès`);
  } catch (error) {
    console.error(`[Worker] Erreur job ${generationId}:`, error);

    await prisma.slideGeneration.update({
      where: { id: generationId },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Erreur inconnue",
      },
    });

    throw error; // Re-throw pour que BullMQ puisse retry
  }
}

/**
 * Démarrer le worker de génération de slides
 * Retourne null si Redis n'est pas disponible
 */
export function startSlideGenerationWorker(): Worker<SlideGenerationJobData> | null {
  if (!process.env.REDIS_URL) {
    console.log("[Worker] Redis not configured - worker not started");
    return null;
  }

  if (slideWorker) {
    return slideWorker;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    slideWorker = new Worker<SlideGenerationJobData>(QUEUE_NAME, processSlideGenerationJob, {
      connection: getRedisConnection() as any,
      concurrency: 2, // 2 jobs en parallèle max
      limiter: {
        max: 5, // Max 5 jobs
        duration: 60000, // Par minute
      },
    });

    slideWorker.on("completed", (job) => {
      console.log(`[Worker] Job ${job.id} complété`);
    });

    slideWorker.on("failed", (job, err) => {
      console.error(`[Worker] Job ${job?.id} échoué:`, err.message);
    });

    slideWorker.on("error", (err) => {
      console.error("[Worker] Erreur worker:", err.message);
    });

    console.log("[Worker] Worker de génération de slides démarré");
    return slideWorker;
  } catch (error) {
    console.error("[Worker] Failed to start worker:", error);
    return null;
  }
}

/**
 * Arrêter le worker
 */
export async function stopSlideGenerationWorker(): Promise<void> {
  if (slideWorker) {
    await slideWorker.close();
    slideWorker = null;
    console.log("[Worker] Worker arrêté");
  }
}

/**
 * Obtenir le statut d'un job
 */
export async function getJobStatus(jobId: string) {
  const queue = getSlideGenerationQueue();
  if (!queue) {
    return null;
  }
  const job = await queue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress;

  return {
    id: job.id,
    state,
    progress,
    data: job.data,
    failedReason: job.failedReason,
    finishedOn: job.finishedOn,
    processedOn: job.processedOn,
  };
}
