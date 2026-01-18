// ===========================================
// API SLIDES - Génération en arrière-plan
// Lance la génération et retourne immédiatement
// Le client poll /api/slides/status pour suivre
// Utilise Redis/BullMQ si disponible, sinon fallback
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { createGammaClient, FormationSlidesConfig, ModuleSlideConfig, GammaImageSource } from "@/lib/gamma";
import { generateFreeText } from "@/lib/ai/generate";
import {
  isRedisAvailable,
  addSlideGenerationJob,
  startSlideGenerationWorker,
  SlideGenerationJobData,
} from "@/lib/queue";

// Types pour les modules
interface ModuleInput {
  id: string;
  titre: string;
  contenu: string;
  objectifs?: string[];
  numCards?: number;
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

// Enrichir le contenu d'un module avec Claude
async function enrichModuleContent(
  module: ModuleInput,
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

// Fonction de génération asynchrone (fallback sans Redis)
async function runGenerationFallback(
  generationId: string,
  formationId: string | undefined,
  formationTitre: string,
  modules: ModuleInput[],
  gammaApiKey: string,
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
  }
) {
  const totalModules = modules.length;

  try {
    // === PHASE 1: Enrichissement avec Claude ===
    await prisma.slideGeneration.update({
      where: { id: generationId },
      data: { status: "ENRICHMENT", progress: 5, currentPhase: "enrichment" },
    });

    const enrichedModules: EnrichedModule[] = [];
    const enrichmentProgressStep = 40 / totalModules;

    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      const currentProgress = Math.round(5 + i * enrichmentProgressStep);

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
        console.error(`Erreur enrichissement module ${module.id}:`, error);
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
      await prisma.slideGeneration.update({
        where: { id: generationId },
        data: { progress, currentModuleIndex: moduleIndex },
      });
    });

    // === PHASE 3: Finalisation ===
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

    console.log(`[Fallback] Génération ${generationId} terminée avec succès`);
  } catch (error) {
    console.error(`[Fallback] Erreur génération ${generationId}:`, error);

    await prisma.slideGeneration.update({
      where: { id: generationId },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Erreur inconnue",
      },
    });
  }
}

// POST - Lancer la génération en arrière-plan
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Récupérer les paramètres
    const body = await request.json();
    const {
      formationId,
      formationTitre,
      modules,
      themeId,
      tone = "professionnel, pédagogique, engageant",
      audience = "",
      imageSource = "unsplash",
      imageStyle = "moderne, professionnel",
      includeIntro = true,
      includeConclusion = true,
      cardsPerModule = 10,
      language = "fr",
    } = body;

    if (!formationTitre || !modules || modules.length === 0) {
      return NextResponse.json(
        { error: "Formation titre et modules requis" },
        { status: 400 }
      );
    }

    // Récupérer la clé API Gamma depuis l'organisation
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { gammaApiKey: true },
    });
    const gammaApiKey = organization?.gammaApiKey || process.env.GAMMA_API_KEY;

    if (!gammaApiKey) {
      return NextResponse.json(
        { error: "Clé API Workbots non configurée" },
        { status: 400 }
      );
    }

    // Créer l'entrée SlideGeneration en BDD
    const slideGeneration = await prisma.slideGeneration.create({
      data: {
        formationId: formationId || "temp-" + Date.now(),
        userId: user.id,
        status: "PENDING",
        progress: 0,
        currentPhase: "starting",
        themeId,
        themeName: themeId ? "Thème sélectionné" : undefined,
        tone,
        cardsPerModule,
      },
    });

    // Vérifier si Redis est disponible
    const redisAvailable = await isRedisAvailable();

    if (redisAvailable) {
      // Utiliser la queue Redis/BullMQ
      console.log(`[Redis] Ajout du job ${slideGeneration.id} à la queue`);

      // Démarrer le worker s'il n'est pas déjà démarré
      const worker = startSlideGenerationWorker();

      // Ajouter le job à la queue
      const jobData: SlideGenerationJobData = {
        generationId: slideGeneration.id,
        formationId,
        formationTitre,
        modules,
        gammaApiKey,
        options: {
          themeId,
          tone,
          audience,
          imageSource,
          imageStyle,
          includeIntro,
          includeConclusion,
          cardsPerModule,
          language,
        },
      };

      const job = await addSlideGenerationJob(jobData);

      // Si le job a été ajouté avec succès
      if (job && worker) {
        return NextResponse.json({
          success: true,
          generationId: slideGeneration.id,
          message: "Génération lancée en arrière-plan (Redis)",
          mode: "redis",
        });
      }

      // Sinon fallback
      console.log(`[Redis] Job ou worker null, fallback pour ${slideGeneration.id}`);
    }

    // Fallback: exécuter en arrière-plan sans Redis
    console.log(`[Fallback] Exécution directe pour ${slideGeneration.id}`);

    // Lancer la génération (fire and forget)
    runGenerationFallback(
      slideGeneration.id,
      formationId,
      formationTitre,
      modules,
      gammaApiKey,
      {
        themeId,
        tone,
        audience,
        imageSource,
        imageStyle,
        includeIntro,
        includeConclusion,
        cardsPerModule,
        language,
      }
    ).catch((err) => {
      console.error("[Fallback] Erreur génération:", err);
    });

    return NextResponse.json({
      success: true,
      generationId: slideGeneration.id,
      message: "Génération lancée en arrière-plan",
      mode: "fallback",
    });
  } catch (error) {
    console.error("Erreur lancement génération:", error);
    return NextResponse.json(
      { error: "Erreur serveur", message: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
