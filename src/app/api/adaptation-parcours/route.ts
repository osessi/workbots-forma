// ===========================================
// API ADAPTATION DU PARCOURS - Qualiopi IND 10
// ===========================================
// POST /api/adaptation-parcours - Générer Module 0 + Fiche d'adaptabilité
// GET /api/adaptation-parcours - Récupérer les adaptations d'une formation

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_PROMPTS, injectVariablesInPrompt } from "@/lib/ai/dynamic-prompts";
import { authenticateUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Seuil de score pour déclencher l'adaptation (en pourcentage, équivalent 2/20)
const SEUIL_ADAPTATION = 10;

// GET - Récupérer les adaptations existantes pour une formation
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formationId = request.nextUrl.searchParams.get("formationId");
    if (!formationId) {
      return NextResponse.json(
        { error: "formationId requis" },
        { status: 400 }
      );
    }

    // Vérifier que la formation appartient à l'organisation
    const formation = await prisma.formation.findFirst({
      where: {
        id: formationId,
        organizationId: user.organizationId,
      },
      include: {
        modules: {
          where: { isModuleZero: true },
          orderBy: { ordre: "asc" },
        },
      },
    });

    if (!formation) {
      return NextResponse.json(
        { error: "Formation non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer les apprenants avec score de positionnement insuffisant
    const evaluationsPositionnement = await prisma.evaluation.findMany({
      where: {
        formationId,
        type: "POSITIONNEMENT",
      },
      include: {
        resultats: {
          where: {
            score: { lt: SEUIL_ADAPTATION },
            status: { in: ["termine", "valide", "echoue"] },
          },
          include: {
            apprenant: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Formater les données
    const apprenantsNecessitantAdaptation = evaluationsPositionnement.flatMap(
      (eval_) =>
        eval_.resultats.map((resultat) => ({
          apprenantId: resultat.apprenant.id,
          nom: resultat.apprenant.nom,
          prenom: resultat.apprenant.prenom,
          email: resultat.apprenant.email,
          scorePositionnement: resultat.score,
          dateEvaluation: resultat.completedAt,
          evaluationId: eval_.id,
        }))
    );

    return NextResponse.json({
      formation: {
        id: formation.id,
        titre: formation.titre,
      },
      moduleZero: formation.modules[0] || null,
      seuilAdaptation: SEUIL_ADAPTATION,
      apprenantsNecessitantAdaptation,
      nombreApprenantsAAdapter: apprenantsNecessitantAdaptation.length,
    });
  } catch (error) {
    console.error("Erreur récupération adaptations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des adaptations" },
      { status: 500 }
    );
  }
}

// POST - Générer le Module 0 et/ou la Fiche d'adaptabilité
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { formationId, apprenantId, action } = body;

    // action: "generate_module_zero" | "generate_fiche_adaptabilite" | "both"

    if (!formationId) {
      return NextResponse.json(
        { error: "formationId requis" },
        { status: 400 }
      );
    }

    // Récupérer la formation avec ses modules
    const formation = await prisma.formation.findFirst({
      where: {
        id: formationId,
        organizationId: user.organizationId,
      },
      include: {
        modules: {
          orderBy: { ordre: "asc" },
        },
        organization: true,
      },
    });

    if (!formation) {
      return NextResponse.json(
        { error: "Formation non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer les infos de l'organisation
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
    });

    // Récupérer le référent pédagogique depuis l'organigramme
    const referentPedagogique = await prisma.organigrammePoste.findFirst({
      where: {
        organizationId: user.organizationId,
        type: "REFERENT_PEDAGOGIQUE",
      },
    });

    const results: {
      moduleZero?: unknown;
      ficheAdaptabilite?: unknown;
    } = {};

    // Client Anthropic
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // 1. GÉNÉRATION MODULE 0
    if (action === "generate_module_zero" || action === "both") {
      // Vérifier si un Module 0 existe déjà
      const existingModuleZero = formation.modules.find((m) => m.isModuleZero);

      if (existingModuleZero) {
        results.moduleZero = {
          existing: true,
          module: existingModuleZero,
          message: "Un Module 0 existe déjà pour cette formation",
        };
      } else {
        // Générer le Module 0 avec l'IA
        const moduleZeroPrompt = DEFAULT_PROMPTS.find(
          (p) => p.type === "MODULE_ZERO"
        );

        if (!moduleZeroPrompt) {
          return NextResponse.json(
            { error: "Prompt MODULE_ZERO non trouvé" },
            { status: 500 }
          );
        }

        // Préparer le contexte
        const prerequisStr = formation.prerequis
          ? typeof formation.prerequis === "string"
            ? formation.prerequis
            : JSON.stringify(formation.prerequis)
          : "Aucun prérequis spécifié";

        // Convertir en tableau pour DynamicPromptContext
        const prerequisArray = prerequisStr.split("\n").filter(Boolean);

        const context = {
          formation: {
            titre: formation.titre,
            description: formation.description || "",
            prerequis: prerequisArray,
          },
          lacunes: "Lacunes identifiées lors du test de positionnement",
          objectifsPrealables: prerequisStr,
        };

        const userPrompt = injectVariablesInPrompt(
          moduleZeroPrompt.userPromptTemplate,
          context
        );

        // Appel à l'IA
        const aiResponse = await anthropic.messages.create({
          model: moduleZeroPrompt.model,
          max_tokens: moduleZeroPrompt.maxTokens,
          temperature: moduleZeroPrompt.temperature,
          system: moduleZeroPrompt.systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });

        // Extraire le JSON de la réponse
        const responseText =
          aiResponse.content[0].type === "text"
            ? aiResponse.content[0].text
            : "";

        let moduleZeroData;
        try {
          // Essayer de parser le JSON
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            moduleZeroData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("Pas de JSON trouvé dans la réponse");
          }
        } catch (parseError) {
          console.error("Erreur parsing JSON Module 0:", parseError);
          return NextResponse.json(
            { error: "Erreur lors de la génération du Module 0" },
            { status: 500 }
          );
        }

        // Créer le Module 0 en base
        const moduleZero = await prisma.module.create({
          data: {
            formationId: formation.id,
            titre: moduleZeroData.titre || "Module 0 - Mise à niveau",
            description: moduleZeroData.description || moduleZeroData.objectifGeneral,
            duree: moduleZeroData.dureeEstimee
              ? parseInt(moduleZeroData.dureeEstimee) * 60
              : 120, // Durée en minutes
            ordre: -1, // Avant tous les autres modules
            isModuleZero: true,
            contenu: moduleZeroData,
          },
        });

        results.moduleZero = {
          existing: false,
          module: moduleZero,
          message: "Module 0 généré avec succès",
        };
      }
    }

    // 2. GÉNÉRATION FICHE D'ADAPTABILITÉ (pour un apprenant spécifique)
    if (
      (action === "generate_fiche_adaptabilite" || action === "both") &&
      apprenantId
    ) {
      // Récupérer l'apprenant et son résultat de positionnement
      const apprenant = await prisma.apprenant.findFirst({
        where: {
          id: apprenantId,
          organizationId: user.organizationId,
        },
      });

      if (!apprenant) {
        return NextResponse.json(
          { error: "Apprenant non trouvé" },
          { status: 404 }
        );
      }

      // Récupérer le résultat de positionnement
      const evaluationPositionnement = await prisma.evaluation.findFirst({
        where: {
          formationId,
          type: "POSITIONNEMENT",
        },
        include: {
          resultats: {
            where: { apprenantId },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      const resultatPositionnement = evaluationPositionnement?.resultats[0];

      if (!resultatPositionnement) {
        return NextResponse.json(
          { error: "Aucun résultat de positionnement trouvé pour cet apprenant" },
          { status: 404 }
        );
      }

      // Générer la fiche d'adaptabilité avec l'IA
      const fichePrompt = DEFAULT_PROMPTS.find(
        (p) => p.type === "FICHE_ADAPTABILITE"
      );

      if (!fichePrompt) {
        return NextResponse.json(
          { error: "Prompt FICHE_ADAPTABILITE non trouvé" },
          { status: 500 }
        );
      }

      const fichePrerequisStr = formation.prerequis
        ? typeof formation.prerequis === "string"
          ? formation.prerequis
          : JSON.stringify(formation.prerequis)
        : "Aucun prérequis spécifié";

      // Convertir en tableau pour DynamicPromptContext
      const fichePrerequisArray = fichePrerequisStr.split("\n").filter(Boolean);

      const context = {
        apprenant: {
          nom: apprenant.nom,
          prenom: apprenant.prenom,
          email: apprenant.email,
        },
        formation: {
          titre: formation.titre,
          description: formation.description || "",
          prerequis: fichePrerequisArray,
        },
        scorePositionnement: resultatPositionnement.score?.toString() || "0",
        analyseReponses:
          "Analyse détaillée des réponses du test de positionnement",
        organisation: {
          nom: organization?.name || "",
          email: organization?.email || "",
        },
        referentPedagogique: referentPedagogique
          ? `${referentPedagogique.prenom} ${referentPedagogique.nom}`
          : "Le référent pédagogique",
      };

      const userPrompt = injectVariablesInPrompt(
        fichePrompt.userPromptTemplate,
        context
      );

      // Appel à l'IA
      const aiResponse = await anthropic.messages.create({
        model: fichePrompt.model,
        max_tokens: fichePrompt.maxTokens,
        temperature: fichePrompt.temperature,
        system: fichePrompt.systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      // Extraire le JSON de la réponse
      const responseText =
        aiResponse.content[0].type === "text"
          ? aiResponse.content[0].text
          : "";

      let ficheData;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          ficheData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Pas de JSON trouvé dans la réponse");
        }
      } catch (parseError) {
        console.error("Erreur parsing JSON Fiche Adaptabilité:", parseError);
        return NextResponse.json(
          { error: "Erreur lors de la génération de la fiche d'adaptabilité" },
          { status: 500 }
        );
      }

      results.ficheAdaptabilite = {
        apprenant: {
          id: apprenant.id,
          nom: apprenant.nom,
          prenom: apprenant.prenom,
          email: apprenant.email,
        },
        scorePositionnement: resultatPositionnement.score,
        fiche: ficheData,
        message: "Fiche d'adaptabilité générée avec succès",
      };
    }

    return NextResponse.json({
      success: true,
      formationId,
      ...results,
    });
  } catch (error) {
    console.error("Erreur génération adaptation:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de la génération: ${errorMessage}` },
      { status: 500 }
    );
  }
}
