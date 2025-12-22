// ===========================================
// API SLIDES - Génération avec enrichissement Claude + Gamma
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { createGammaClient, FormationSlidesConfig, ModuleSlideConfig } from "@/lib/gamma";
import { generateFreeText } from "@/lib/ai/generate";

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
6. Le contenu doit pouvoir être divisé en ${module.numCards || 8} slides

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

// POST - Générer les slides avec enrichissement
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore
            }
          },
        },
      }
    );

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: { organization: true },
    });

    if (!user || !user.organizationId) {
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

    // Récupérer la clé API Gamma
    const gammaApiKey = user.organization?.gammaApiKey || process.env.GAMMA_API_KEY;

    if (!gammaApiKey) {
      return NextResponse.json(
        { error: "Clé API Workbots non configurée" },
        { status: 400 }
      );
    }

    // Initialiser le client de génération
    const gammaClient = createGammaClient(gammaApiKey);

    // ÉTAPE 1: Enrichir chaque module avec Claude
    console.log("Enrichissement des modules avec Claude...");
    const enrichedModules: EnrichedModule[] = [];

    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      console.log(`Enrichissement module ${i + 1}/${modules.length}: ${module.titre}`);

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

    // ÉTAPE 2: Préparer la configuration pour Gamma
    console.log("Préparation pour Gamma...");

    // Construire le contenu enrichi pour chaque module
    const modulesForGamma: ModuleSlideConfig[] = enrichedModules.map((m) => {
      // Construire un contenu structuré avec les enrichissements
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

    // ÉTAPE 3: Générer les slides avec Gamma
    console.log("Génération des slides avec Gamma...");
    const result = await gammaClient.generateFormationSlides(config);

    // ÉTAPE 4: Sauvegarder les résultats en BDD
    if (formationId) {
      const slidesData = result.modules.map((m) => ({
        moduleId: m.moduleId,
        moduleTitre: m.moduleTitre,
        generationId: m.generationId,
        gammaUrl: m.gammaUrl,
        exportUrl: m.exportUrl,
        status: m.status,
        error: m.error,
      }));

      await prisma.formation.update({
        where: { id: formationId },
        data: {
          slidesGenerated: true,
          slidesData: slidesData as unknown as import("@prisma/client").Prisma.InputJsonValue,
          slidesGeneratedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      result,
      enrichedModulesCount: enrichedModules.length,
    });
  } catch (error) {
    console.error("Erreur génération slides:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la génération des slides",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
