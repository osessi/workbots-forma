// ===========================================
// API GAMMA - Génération de slides
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { createGammaClient, FormationSlidesConfig, ModuleSlideConfig } from "@/lib/gamma";

// POST - Générer les slides pour une formation
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

    // Récupérer les paramètres de la requête
    const body = await request.json();
    const {
      formationId,
      formationTitre,
      modules,
      themeId,
      language = "fr",
      tone = "professionnel, pédagogique, engageant",
      audience,
      imageSource = "unsplash",
      imageStyle = "moderne, professionnel",
      exportAs = "pptx",
      includeIntro = true,
      includeConclusion = true,
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
        {
          error: "Clé API Gamma non configurée",
          message: "Veuillez configurer votre clé API Gamma dans les paramètres de l'organisation ou dans les variables d'environnement."
        },
        { status: 400 }
      );
    }

    // Créer le client Gamma
    const gammaClient = createGammaClient(gammaApiKey);

    // Préparer la configuration
    const config: FormationSlidesConfig = {
      formationTitre,
      modules: modules.map((m: { id: string; titre: string; contenu: string; objectifs?: string[]; numCards?: number }) => ({
        moduleId: m.id,
        moduleTitre: m.titre,
        contenu: m.contenu,
        objectifs: m.objectifs,
        numCards: m.numCards || 8,
      })) as ModuleSlideConfig[],
      themeId,
      language,
      tone,
      audience,
      imageSource,
      imageStyle,
      exportAs,
      includeIntro,
      includeConclusion,
    };

    // Lancer la génération
    const result = await gammaClient.generateFormationSlides(config);

    // Sauvegarder les résultats en base de données si formationId fourni
    if (formationId) {
      // Mettre à jour la formation avec les URLs des slides générés
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
    });
  } catch (error) {
    console.error("Erreur génération slides Gamma:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la génération des slides",
        message: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    );
  }
}
