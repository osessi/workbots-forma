// ===========================================
// API SLIDES - Génération avec SSE (Server-Sent Events)
// Progression en temps réel
// ===========================================

import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { createGammaClient, FormationSlidesConfig, ModuleSlideConfig } from "@/lib/gamma";
import { generateFreeText } from "@/lib/ai/generate";
import { ModuleGenerationResult } from "@/lib/gamma/types";

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

// Types pour les événements SSE
type SSEEventType =
  | "start"
  | "enrichment_start"
  | "enrichment_progress"
  | "enrichment_complete"
  | "generation_start"
  | "generation_progress"
  | "generation_complete"
  | "module_complete"
  | "finalizing"
  | "complete"
  | "error";

interface SSEEvent {
  type: SSEEventType;
  data: {
    message: string;
    moduleIndex?: number;
    moduleName?: string;
    totalModules?: number;
    progress?: number;
    result?: unknown;
    error?: string;
    generationId?: string;
  };
}

// Helper pour envoyer un événement SSE
function sendSSE(controller: ReadableStreamDefaultController, event: SSEEvent) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  controller.enqueue(new TextEncoder().encode(data));
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

  // Parser le JSON (gérer le cas où il y a du texte autour)
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

// POST - Générer les slides avec SSE pour la progression
export async function POST(request: NextRequest) {
  // Créer un stream pour SSE
  const stream = new ReadableStream({
    async start(controller) {
      // Variable pour suivre la génération (accessible dans le catch)
      let slideGenerationId: string | null = null;

      try {
        // Vérifier l'authentification
        const user = await authenticateUser();
        if (!user) {
          sendSSE(controller, {
            type: "error",
            data: { message: "Non autorisé", error: "Non autorisé" },
          });
          controller.close();
          return;
        }

        if (!user.organizationId) {
          sendSSE(controller, {
            type: "error",
            data: { message: "Organisation non trouvée", error: "Organisation non trouvée" },
          });
          controller.close();
          return;
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
          sendSSE(controller, {
            type: "error",
            data: { message: "Formation titre et modules requis", error: "Données manquantes" },
          });
          controller.close();
          return;
        }

        // Récupérer la clé API Gamma depuis l'organisation
        const organization = await prisma.organization.findUnique({
          where: { id: user.organizationId },
          select: { gammaApiKey: true },
        });
        const gammaApiKey = organization?.gammaApiKey || process.env.GAMMA_API_KEY;

        if (!gammaApiKey) {
          sendSSE(controller, {
            type: "error",
            data: { message: "Clé API Workbots non configurée", error: "Configuration manquante" },
          });
          controller.close();
          return;
        }

        const gammaClient = createGammaClient(gammaApiKey);
        const totalModules = modules.length;

        // Créer l'entrée SlideGeneration en BDD
        const slideGeneration = await prisma.slideGeneration.create({
          data: {
            formationId: formationId || "temp-" + Date.now(),
            userId: user.id,
            status: "PENDING",
            progress: 0,
            currentPhase: "enrichment",
            themeId,
            themeName: themeId ? "Thème sélectionné" : undefined,
            tone,
            cardsPerModule,
          },
        });

        // Sauvegarder l'ID pour le catch
        slideGenerationId = slideGeneration.id;

        // === ÉVÉNEMENT: Démarrage ===
        sendSSE(controller, {
          type: "start",
          data: {
            message: "Démarrage de la génération",
            totalModules,
            progress: 0,
            generationId: slideGeneration.id,
          },
        });

        // === PHASE 1: Enrichissement avec Claude ===
        await prisma.slideGeneration.update({
          where: { id: slideGeneration.id },
          data: { status: "ENRICHMENT", progress: 5, currentPhase: "enrichment" },
        });

        sendSSE(controller, {
          type: "enrichment_start",
          data: {
            message: "Enrichissement du contenu par l'IA",
            totalModules,
            progress: 5,
          },
        });

        const enrichedModules: EnrichedModule[] = [];
        const enrichmentProgressStep = 40 / totalModules; // 5-45%

        for (let i = 0; i < modules.length; i++) {
          const module = modules[i];

          const currentProgress = Math.round(5 + i * enrichmentProgressStep);
          await prisma.slideGeneration.update({
            where: { id: slideGeneration.id },
            data: { progress: currentProgress, currentModuleIndex: i, currentModuleName: module.titre },
          });

          sendSSE(controller, {
            type: "enrichment_progress",
            data: {
              message: `Enrichissement: ${module.titre}`,
              moduleIndex: i,
              moduleName: module.titre,
              totalModules,
              progress: currentProgress,
            },
          });

          try {
            const enriched = await enrichModuleContent(
              module,
              formationTitre,
              i,
              modules.length,
              tone,
              audience
            );
            enrichedModules.push(enriched);
          } catch (error) {
            console.error(`Erreur enrichissement module ${module.id}:`, error);
            // Utiliser le contenu original si l'enrichissement échoue
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

        sendSSE(controller, {
          type: "enrichment_complete",
          data: {
            message: "Enrichissement terminé",
            totalModules,
            progress: 45,
          },
        });

        // === PHASE 2: Génération avec Gamma ===
        await prisma.slideGeneration.update({
          where: { id: slideGeneration.id },
          data: { status: "GENERATING", progress: 50, currentPhase: "generation" },
        });

        sendSSE(controller, {
          type: "generation_start",
          data: {
            message: "Génération des présentations",
            totalModules,
            progress: 50,
          },
        });

        // Préparer les modules pour Gamma
        const modulesForGamma: ModuleSlideConfig[] = enrichedModules.map((m) => {
          let fullContent = "";

          if (m.transitions.intro) {
            fullContent += `${m.transitions.intro}\n\n`;
          }

          fullContent += m.contenu;

          if (m.keyPoints.length > 0) {
            fullContent += `\n\n## Points clés à retenir\n`;
            m.keyPoints.forEach((p) => {
              fullContent += `• ${p}\n`;
            });
          }

          if (m.examples.length > 0) {
            fullContent += `\n\n## Exemples pratiques\n`;
            m.examples.forEach((e) => {
              fullContent += `• ${e}\n`;
            });
          }

          if (m.transitions.outro) {
            fullContent += `\n\n${m.transitions.outro}`;
          }

          return {
            moduleId: m.id,
            moduleTitre: m.titre,
            contenu: fullContent,
            objectifs: m.objectifs,
            numCards: cardsPerModule,
          };
        });

        // Configuration Gamma
        const config: FormationSlidesConfig = {
          formationTitre,
          modules: modulesForGamma,
          themeId: themeId || undefined,
          language,
          tone,
          audience: audience || "professionnels en formation continue",
          imageSource,
          imageStyle,
          exportAs: "pptx",
          includeIntro,
          includeConclusion,
        };

        // Générer avec callback de progression
        const generationProgressStep = 40 / (totalModules + (includeIntro ? 1 : 0) + (includeConclusion ? 1 : 0)); // 50-90%
        let generationIndex = 0;

        const result = await gammaClient.generateFormationSlides(
          config,
          (moduleIndex: number, moduleResult: ModuleGenerationResult) => {
            generationIndex++;
            sendSSE(controller, {
              type: "generation_progress",
              data: {
                message: `Génération: ${moduleResult.moduleTitre}`,
                moduleIndex,
                moduleName: moduleResult.moduleTitre,
                totalModules: totalModules + (includeIntro ? 1 : 0) + (includeConclusion ? 1 : 0),
                progress: Math.round(50 + generationIndex * generationProgressStep),
              },
            });

            sendSSE(controller, {
              type: "module_complete",
              data: {
                message: `Module généré: ${moduleResult.moduleTitre}`,
                moduleIndex,
                moduleName: moduleResult.moduleTitre,
                result: moduleResult,
                progress: Math.round(50 + generationIndex * generationProgressStep),
              },
            });
          }
        );

        sendSSE(controller, {
          type: "generation_complete",
          data: {
            message: "Génération des slides terminée",
            progress: 90,
          },
        });

        // === PHASE 3: Finalisation ===
        await prisma.slideGeneration.update({
          where: { id: slideGeneration.id },
          data: { status: "FINALIZING", progress: 95, currentPhase: "finalizing" },
        });

        sendSSE(controller, {
          type: "finalizing",
          data: {
            message: "Sauvegarde et finalisation",
            progress: 95,
          },
        });

        // Sauvegarder les résultats
        const slidesData = result.modules.map((m) => ({
          moduleId: m.moduleId,
          moduleTitre: m.moduleTitre,
          generationId: m.generationId,
          gammaUrl: m.gammaUrl,
          exportUrl: m.exportUrl,
          status: m.status,
          error: m.error,
        }));

        // Sauvegarder dans la formation
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

        // Marquer la génération comme terminée
        await prisma.slideGeneration.update({
          where: { id: slideGeneration.id },
          data: {
            status: "COMPLETED",
            progress: 100,
            currentPhase: "complete",
            moduleResults: slidesData as unknown as import("@prisma/client").Prisma.InputJsonValue,
            completedAt: new Date(),
          },
        });

        // === ÉVÉNEMENT: Terminé ===
        sendSSE(controller, {
          type: "complete",
          data: {
            message: "Génération terminée avec succès !",
            progress: 100,
            generationId: slideGeneration.id,
            result: {
              success: true,
              result,
              enrichedModulesCount: enrichedModules.length,
            },
          },
        });

        controller.close();
      } catch (error) {
        console.error("Erreur génération slides:", error);

        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";

        // Ne pas stocker les erreurs de stream SSE comme erreurs de génération
        // Ces erreurs surviennent quand le client se déconnecte (refresh de page)
        const isStreamError = errorMessage.includes("Controller") ||
                              errorMessage.includes("closed") ||
                              errorMessage.includes("stream");

        // Marquer la génération comme échouée en BDD seulement si c'est une vraie erreur
        if (slideGenerationId && !isStreamError) {
          try {
            await prisma.slideGeneration.update({
              where: { id: slideGenerationId },
              data: {
                status: "FAILED",
                errorMessage: errorMessage,
              },
            });
          } catch (dbError) {
            console.error("Erreur mise à jour BDD après échec:", dbError);
          }
        }

        // Essayer d'envoyer l'erreur au client (peut échouer si stream fermé)
        try {
          sendSSE(controller, {
            type: "error",
            data: {
              message: "Erreur lors de la génération",
              error: errorMessage,
            },
          });
          controller.close();
        } catch {
          // Stream déjà fermé, ignorer
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
