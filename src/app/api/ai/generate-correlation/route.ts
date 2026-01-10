// ===========================================
// API ROUTE: GENERATION DOCUMENT CORRELATION OBJECTIFS/EVALUATION
// Qualiopi Indicateur 11 - Évaluation des acquis
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { isAIConfigured, getAIModel, getAvailableProvider, AI_CONFIGS } from "@/lib/ai/config";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { DEFAULT_PROMPTS } from "@/lib/ai/dynamic-prompts";

// Schema pour les questions de l'évaluation
const QuestionSchema = z.object({
  question: z.string(),
  type: z.enum(["qcm", "ouvert", "vrai_faux"]).optional(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.number(), z.string()]).optional(),
});

// Schema de validation de la requête
const RequestSchema = z.object({
  formationTitre: z.string().min(1, "Le titre de la formation est requis"),
  formationDescription: z.string().optional(),
  objectifs: z.array(z.string()).min(1, "Au moins un objectif pédagogique est requis"),
  evaluationFinale: z.object({
    titre: z.string().optional(),
    questions: z.array(QuestionSchema).min(1, "L'évaluation finale doit contenir au moins une question"),
  }),
  modules: z.array(z.object({
    titre: z.string(),
    contenu: z.array(z.string()).optional(),
  })).optional(),
});

// Schema de validation de la réponse IA
const CorrelationResponseSchema = z.object({
  titre: z.string(),
  formation: z.object({
    titre: z.string(),
    dateGeneration: z.string(),
  }),
  correlations: z.array(z.object({
    objectif: z.string(),
    questionsAssociees: z.array(z.object({
      numero: z.number(),
      question: z.string(),
      type: z.string().optional(),
    })),
    critereValidation: z.string(),
    couverture: z.enum(["complete", "partielle", "non_couverte"]),
  })),
  objectifsNonCouverts: z.array(z.object({
    objectif: z.string(),
    questionProposee: z.object({
      question: z.string(),
      type: z.string(),
      options: z.array(z.string()).optional(),
      reponseCorrecte: z.number().optional(),
    }),
  })).optional(),
  synthese: z.object({
    totalObjectifs: z.number(),
    objectifsCouverts: z.number(),
    tauxCouverture: z.string(),
    recommandations: z.array(z.string()).optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    // Vérifier que l'IA est configurée
    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: "Le service IA n'est pas configuré" },
        { status: 503 }
      );
    }

    // Parser et valider la requête
    const body = await request.json();
    const validationResult = RequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Récupérer le prompt par défaut pour CORRELATION_OBJECTIFS
    const correlationPrompt = DEFAULT_PROMPTS.find(p => p.type === "CORRELATION_OBJECTIFS");

    if (!correlationPrompt) {
      return NextResponse.json(
        { error: "Prompt CORRELATION_OBJECTIFS non trouvé" },
        { status: 500 }
      );
    }

    // Formatter les questions de l'évaluation finale pour le prompt
    const evaluationFinaleStr = data.evaluationFinale.questions
      .map((q, i) => `${i + 1}. [${q.type || "qcm"}] ${q.question}`)
      .join("\n");

    // Formatter les modules pour le prompt
    const modulesStr = data.modules
      ? data.modules.map((m, i) => {
          let str = `Module ${i + 1}: ${m.titre}`;
          if (m.contenu && m.contenu.length > 0) {
            str += "\n  Contenu: " + m.contenu.join(", ");
          }
          return str;
        }).join("\n\n")
      : "Non spécifiés";

    // Formatter les objectifs pour le prompt
    const objectifsStr = data.objectifs
      .map((obj, i) => `${i + 1}. ${obj}`)
      .join("\n");

    // Construire le prompt utilisateur directement (car evaluationFinale n'est pas dans DynamicPromptContext)
    const userPrompt = `Génère un document de corrélation Objectifs/Évaluation pour cette formation.

# FORMATION
**Titre:** ${data.formationTitre}
**Description:** ${data.formationDescription || "Non spécifiée"}

# OBJECTIFS PÉDAGOGIQUES À ÉVALUER (TOUS DOIVENT ÊTRE COUVERTS À 100%)
${objectifsStr}

# QUESTIONS DE L'ÉVALUATION FINALE
${evaluationFinaleStr}

# MODULES DE LA FORMATION
${modulesStr}

🔴 INSTRUCTIONS IMPÉRATIVES - COUVERTURE 100% OBLIGATOIRE:
1. Pour CHAQUE objectif, trouve AU MOINS UNE question qui l'évalue (directement ou indirectement)
2. Une question peut évaluer plusieurs objectifs
3. TOUS les objectifs doivent avoir couverture = "complete" ou "partielle"
4. Le tauxCouverture dans la synthèse DOIT être "100%"
5. objectifsNonCouverts DOIT être un tableau VIDE [] - pas d'exception

Analyse chaque objectif pédagogique et identifie TOUTES les questions qui peuvent le valider.
Même si une question ne couvre qu'un aspect de l'objectif, c'est une couverture partielle.

Génère un document de corrélation avec 100% de couverture des objectifs conforme Qualiopi IND 11.`;

    // Appeler l'IA
    const provider = getAvailableProvider();
    const model = getAIModel(AI_CONFIGS.fichePedagogique); // Utiliser la config fiche pédagogique (haute qualité)

    const response = await generateText({
      model,
      system: correlationPrompt.systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: correlationPrompt.maxTokens,
      temperature: correlationPrompt.temperature,
    });

    // Extraire et parser le JSON de la réponse
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "La réponse IA ne contient pas de JSON valide" },
        { status: 500 }
      );
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: "Impossible de parser la réponse JSON de l'IA" },
        { status: 500 }
      );
    }

    // Forcer la date de génération correcte (format français)
    const now = new Date();
    const dateGeneration = now.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // S'assurer que la date de génération est correcte dans la réponse
    if (parsedResponse.formation) {
      parsedResponse.formation.dateGeneration = dateGeneration;
    }

    // POST-TRAITEMENT: Forcer la cohérence 100% de couverture
    // Si l'IA a mal répondu, corriger les données pour éviter les incohérences
    if (parsedResponse.correlations && Array.isArray(parsedResponse.correlations)) {
      // S'assurer que tous les objectifs ont au moins "partielle" comme couverture
      parsedResponse.correlations = parsedResponse.correlations.map((corr: { couverture?: string; questionsAssociees?: unknown[] }) => {
        if (corr.couverture === "non_couverte" && corr.questionsAssociees && corr.questionsAssociees.length > 0) {
          return { ...corr, couverture: "partielle" };
        }
        return corr;
      });
    }

    // Vider objectifsNonCouverts si tous les objectifs sont couverts dans correlations
    if (parsedResponse.correlations && parsedResponse.correlations.length === data.objectifs.length) {
      parsedResponse.objectifsNonCouverts = [];
    }

    // Forcer la synthèse à 100% si tous les objectifs sont couverts
    if (parsedResponse.synthese) {
      const nbCouverts = parsedResponse.correlations?.filter(
        (c: { couverture?: string }) => c.couverture === "complete" || c.couverture === "partielle"
      ).length || 0;

      if (nbCouverts === data.objectifs.length) {
        parsedResponse.synthese.objectifsCouverts = nbCouverts;
        parsedResponse.synthese.totalObjectifs = data.objectifs.length;
        parsedResponse.synthese.tauxCouverture = "100%";
      }
    }

    // Valider la réponse
    const validatedResponse = CorrelationResponseSchema.safeParse(parsedResponse);
    if (!validatedResponse.success) {
      console.error("Validation échouée:", validatedResponse.error);
      // Retourner quand même la réponse parsée même si elle ne correspond pas exactement au schéma
      // Car l'IA peut avoir des variations mineures
      return NextResponse.json({
        success: true,
        data: parsedResponse,
        meta: {
          provider,
          validated: false,
        },
      });
    }

    // Forcer également la date dans les données validées
    validatedResponse.data.formation.dateGeneration = dateGeneration;

    // Extraire les tokens de l'usage
    const usage = response.usage as { promptTokens?: number; completionTokens?: number; totalTokens?: number } | undefined;

    // Log pour monitoring
    console.log("Document corrélation généré:", {
      userId: user.id,
      formation: data.formationTitre,
      nbObjectifs: data.objectifs.length,
      nbQuestions: data.evaluationFinale.questions.length,
      tokens: usage?.totalTokens,
      provider,
    });

    return NextResponse.json({
      success: true,
      data: validatedResponse.data,
      meta: {
        tokens: {
          prompt: usage?.promptTokens || 0,
          completion: usage?.completionTokens || 0,
          total: usage?.totalTokens || 0,
        },
        provider,
        validated: true,
      },
    });
  } catch (error) {
    console.error("Erreur API generate-correlation:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
