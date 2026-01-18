// ===========================================
// API Route: POST /api/workbots/generate
// Generate presentation slides using Workbots Slides
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

const SLIDES_API_URL = process.env.SLIDES_API_URL || "http://localhost:8000";

// Extended timeout for generation
export const maxDuration = 300; // 5 minutes

interface GenerateRequestBody {
  formationId: string;
  formationTitre: string;
  modules: Array<{
    id: string;
    titre: string;
    contenu: string;
    objectifs?: string;
    numCards?: number;
  }>;
  templateId?: string;
  tone?: string;
  verbosity?: string;
  language?: string;
  cardsPerModule?: number;
  includeIntro?: boolean;
  includeConclusion?: boolean;
  exportAs?: "pptx" | "pdf";
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const body: GenerateRequestBody = await request.json();
    const {
      formationId,
      formationTitre,
      modules,
      templateId = "general",
      tone = "educational",
      verbosity = "standard",
      language = "French",
      cardsPerModule = 10,
      includeIntro = true,
      includeConclusion = true,
      exportAs = "pptx",
    } = body;

    // Validate formation exists and belongs to user's organization
    const formation = await prisma.formation.findFirst({
      where: {
        id: formationId,
        organizationId: user.organizationId,
      },
    });

    if (!formation) {
      return NextResponse.json(
        { error: "Formation non trouvée" },
        { status: 404 }
      );
    }

    // Create SlideGeneration record to track progress
    const slideGeneration = await prisma.slideGeneration.create({
      data: {
        formationId,
        status: "PENDING",
        progress: 0,
        currentPhase: "initialization",
        currentModuleIndex: 0,
        themeId: templateId,
        themeName: templateId,
        tone,
        cardsPerModule,
        userId: user.id,
        moduleResults: [],
      },
    });

    // Start background generation
    generateInBackground(
      slideGeneration.id,
      {
        formationId,
        formationTitre,
        modules,
        templateId,
        tone,
        verbosity,
        language,
        cardsPerModule,
        includeIntro,
        includeConclusion,
        exportAs,
      },
      user.organizationId
    ).catch((error) => {
      console.error("Background generation error:", error);
    });

    return NextResponse.json({
      success: true,
      generationId: slideGeneration.id,
      message: "Génération démarrée",
      status: "PENDING",
    });
  } catch (error) {
    console.error("Error in /api/workbots/generate:", error);
    return NextResponse.json(
      {
        error: "Erreur lors du démarrage de la génération",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

// ===========================================
// Background Generation Function
// ===========================================

async function generateInBackground(
  generationId: string,
  config: GenerateRequestBody,
  organizationId: string
) {
  const {
    formationId,
    formationTitre,
    modules,
    templateId,
    tone,
    verbosity,
    language,
    cardsPerModule,
    includeIntro,
    includeConclusion,
    exportAs,
  } = config;

  const moduleResults: Array<{
    moduleId: string;
    moduleTitre: string;
    presentationId?: string;
    exportUrl?: string;
    editUrl?: string;
    status: string;
    error?: string;
  }> = [];

  try {
    // Update status to ENRICHMENT
    await prisma.slideGeneration.update({
      where: { id: generationId },
      data: {
        status: "ENRICHMENT",
        progress: 5,
        currentPhase: "enrichment",
      },
    });

    // Calculate total steps
    let totalSteps = modules.length;
    if (includeIntro) totalSteps++;
    if (includeConclusion) totalSteps++;

    let currentStep = 0;

    // Generate intro if requested
    if (includeIntro) {
      currentStep++;
      const progress = Math.round((currentStep / totalSteps) * 80) + 10;

      await prisma.slideGeneration.update({
        where: { id: generationId },
        data: {
          status: "GENERATING",
          progress,
          currentPhase: "generation",
          currentModuleIndex: 0,
          currentModuleName: "Introduction",
        },
      });

      try {
        const introResult = await generateSlides({
          content: `# Introduction: ${formationTitre}\n\nCette formation couvre les modules suivants:\n${modules.map((m) => `- ${m.titre}`).join("\n")}`,
          nSlides: 2,
          template: templateId || "general",
          tone: tone || "educational",
          verbosity: verbosity || "standard",
          language: language || "French",
          exportAs: exportAs || "pptx",
        });

        moduleResults.push({
          moduleId: "intro",
          moduleTitre: "Introduction",
          presentationId: introResult.presentationId,
          exportUrl: introResult.path,
          editUrl: introResult.editPath,
          status: "completed",
        });
      } catch (error) {
        moduleResults.push({
          moduleId: "intro",
          moduleTitre: "Introduction",
          status: "failed",
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    // Generate slides for each module
    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      currentStep++;
      const progress = Math.round((currentStep / totalSteps) * 80) + 10;

      await prisma.slideGeneration.update({
        where: { id: generationId },
        data: {
          progress,
          currentModuleIndex: i + 1,
          currentModuleName: module.titre,
        },
      });

      try {
        // Build content with objectives
        let content = `# ${module.titre}\n\n${module.contenu}`;
        if (module.objectifs) {
          content += `\n\n## Objectifs pédagogiques\n${module.objectifs}`;
        }

        const moduleResult = await generateSlides({
          content,
          nSlides: module.numCards || cardsPerModule || 10,
          template: templateId || "general",
          tone: tone || "educational",
          verbosity: verbosity || "standard",
          language: language || "French",
          exportAs: exportAs || "pptx",
        });

        moduleResults.push({
          moduleId: module.id,
          moduleTitre: module.titre,
          presentationId: moduleResult.presentationId,
          exportUrl: moduleResult.path,
          editUrl: moduleResult.editPath,
          status: "completed",
        });
      } catch (error) {
        console.error(`Error generating slides for module ${module.titre}:`, error);
        moduleResults.push({
          moduleId: module.id,
          moduleTitre: module.titre,
          status: "failed",
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }

      // Small delay between modules to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Generate conclusion if requested
    if (includeConclusion) {
      currentStep++;
      const progress = Math.round((currentStep / totalSteps) * 80) + 10;

      await prisma.slideGeneration.update({
        where: { id: generationId },
        data: {
          progress,
          currentModuleName: "Conclusion",
        },
      });

      try {
        const conclusionResult = await generateSlides({
          content: `# Conclusion: ${formationTitre}\n\n## Récapitulatif\n${modules.map((m) => `- ${m.titre}: ${m.objectifs || m.contenu.substring(0, 100)}...`).join("\n")}\n\n## Prochaines étapes\nMerci pour votre participation à cette formation.`,
          nSlides: 2,
          template: templateId || "general",
          tone: tone || "educational",
          verbosity: verbosity || "standard",
          language: language || "French",
          exportAs: exportAs || "pptx",
        });

        moduleResults.push({
          moduleId: "conclusion",
          moduleTitre: "Conclusion",
          presentationId: conclusionResult.presentationId,
          exportUrl: conclusionResult.path,
          editUrl: conclusionResult.editPath,
          status: "completed",
        });
      } catch (error) {
        moduleResults.push({
          moduleId: "conclusion",
          moduleTitre: "Conclusion",
          status: "failed",
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    // Check if any module succeeded
    const hasSuccess = moduleResults.some((r) => r.status === "completed");
    const allFailed = moduleResults.every((r) => r.status === "failed");

    // Update final status
    await prisma.slideGeneration.update({
      where: { id: generationId },
      data: {
        status: allFailed ? "FAILED" : "COMPLETED",
        progress: 100,
        currentPhase: "complete",
        moduleResults: JSON.parse(JSON.stringify(moduleResults)),
        completedAt: new Date(),
        errorMessage: allFailed ? "Tous les modules ont échoué" : undefined,
      },
    });

    // Update Formation with slides data
    if (hasSuccess) {
      await prisma.formation.update({
        where: { id: formationId },
        data: {
          slidesGenerated: true,
          slidesData: JSON.parse(JSON.stringify(moduleResults)),
          slidesGeneratedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error("Generation failed:", error);
    await prisma.slideGeneration.update({
      where: { id: generationId },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Erreur inconnue",
        moduleResults: JSON.parse(JSON.stringify(moduleResults)),
        completedAt: new Date(),
      },
    });
  }
}

// ===========================================
// Helper: Generate slides via backend
// ===========================================

async function generateSlides(options: {
  content: string;
  nSlides: number;
  template: string;
  tone: string;
  verbosity: string;
  language: string;
  exportAs: string;
}): Promise<{ presentationId: string; path: string; editPath: string }> {
  const response = await fetch(
    `${SLIDES_API_URL}/api/v1/ppt/presentation/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: options.content,
        n_slides: options.nSlides,
        template: options.template,
        tone: options.tone,
        verbosity: options.verbosity,
        language: options.language,
        export_as: options.exportAs,
        include_title_slide: true,
        include_table_of_contents: false,
        web_search: false,
        trigger_webhook: false,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Generation failed: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    presentationId: data.presentation_id,
    path: data.path,
    editPath: data.edit_path,
  };
}
