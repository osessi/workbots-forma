// ===========================================
// API ROUTE: ENRICHIR UNE SECTION DE LA FICHE PEDAGOGIQUE
// ===========================================
// Correction 357: Enrichissement optionnel par section
// Sections enrichissables: description, objectifs, prerequis, publicVise, contenu

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { getAIModel, getAvailableProvider, isAIConfigured } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Sections autorisées pour l'enrichissement
const ENRICHABLE_SECTIONS = [
  "description",
  "objectifs",
  "prerequis",
  "publicVise",
  "contenu",
] as const;

type EnrichableSection = (typeof ENRICHABLE_SECTIONS)[number];

// Schema de validation
const RequestSchema = z.object({
  fieldName: z.enum(ENRICHABLE_SECTIONS),
  currentValue: z.union([z.string(), z.array(z.string())]),
  context: z.object({
    titre: z.string().optional(),
    description: z.string().optional(),
    objectifs: z.array(z.string()).optional(),
    contenu: z.string().optional(),
    publicVise: z.string().optional(),
    prerequis: z.string().optional(),
  }).optional(),
});

// Prompts spécifiques par section
const SECTION_PROMPTS: Record<EnrichableSection, { system: string; userTemplate: string }> = {
  description: {
    system: `Tu es un expert en ingénierie pédagogique Qualiopi.
Ta mission est d'enrichir la description d'une formation tout en conservant son contenu original.

Règles:
- Conserve le sujet et le sens de la description originale
- Améliore la clarté et la structure
- Ajoute des précisions pertinentes si nécessaire
- Assure la cohérence avec les objectifs et le contenu de la formation
- Garde un ton professionnel
- Maximum 500 caractères
- Retourne UNIQUEMENT le texte enrichi, sans formatage markdown`,
    userTemplate: `Description actuelle:
"{value}"

Contexte de la formation:
- Titre: {titre}
- Objectifs: {objectifs}
- Public visé: {publicVise}

Enrichis cette description pour qu'elle soit plus claire et cohérente avec les objectifs.`,
  },
  objectifs: {
    system: `Tu es un expert en ingénierie pédagogique Qualiopi (IND 5).
Ta mission est d'enrichir les objectifs pédagogiques d'une formation.

Règles importantes:
- Conserve les objectifs existants comme base
- Reformule pour qu'ils soient SMART (Spécifiques, Mesurables, Atteignables, Réalistes, Temporellement définis)
- Commence chaque objectif par un verbe d'action (Maîtriser, Développer, Appliquer, Analyser, etc.)
- Assure la cohérence entre objectifs, contenu et public visé
- 4 à 6 objectifs maximum
- Retourne UNIQUEMENT les objectifs, un par ligne, sans numérotation ni puces`,
    userTemplate: `Objectifs actuels:
{value}

Contexte:
- Titre: {titre}
- Description: {description}
- Contenu: {contenu}
- Public visé: {publicVise}

Enrichis ces objectifs pour qu'ils soient clairs, mesurables et cohérents avec le contenu.`,
  },
  prerequis: {
    system: `Tu es un expert en ingénierie pédagogique Qualiopi (IND 8).
Ta mission est d'enrichir les prérequis d'une formation.

Règles:
- Conserve les prérequis existants comme base
- Sois précis sur les compétences/connaissances requises
- Adapte au public visé
- Ajoute des prérequis techniques si pertinent
- Maximum 4-5 prérequis
- Retourne UNIQUEMENT les prérequis, un par ligne, sans puces`,
    userTemplate: `Prérequis actuels:
{value}

Contexte:
- Titre: {titre}
- Public visé: {publicVise}
- Objectifs: {objectifs}

Enrichis ces prérequis pour qu'ils soient clairs et adaptés au public.`,
  },
  publicVise: {
    system: `Tu es un expert en ingénierie pédagogique Qualiopi (IND 4).
Ta mission est d'enrichir la description du public visé.

Règles:
- Conserve le public cible existant
- Précise les profils, fonctions, secteurs concernés
- Assure la cohérence avec les prérequis et objectifs
- Maximum 3-4 catégories de public
- Retourne UNIQUEMENT la description du public, sans puces ni formatage`,
    userTemplate: `Public visé actuel:
{value}

Contexte:
- Titre: {titre}
- Prérequis: {prerequis}
- Objectifs: {objectifs}

Enrichis cette description du public pour qu'elle soit précise et cohérente.`,
  },
  contenu: {
    system: `Tu es un expert en ingénierie pédagogique Qualiopi (IND 5, IND 6).
Ta mission est d'enrichir le contenu de formation.

Règles:
- Conserve la structure et les thèmes existants
- Assure la cohérence entre contenu et objectifs pédagogiques
- Structure clairement les modules/parties
- Ajoute des précisions si nécessaire
- Retourne UNIQUEMENT le contenu enrichi, sans formatage markdown complexe`,
    userTemplate: `Contenu actuel:
{value}

Contexte:
- Titre: {titre}
- Objectifs: {objectifs}
- Public visé: {publicVise}

Enrichis ce contenu pour qu'il soit cohérent avec les objectifs et structuré clairement.`,
  },
};

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
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

    const { fieldName, currentValue, context } = validationResult.data;

    // Récupérer les prompts pour cette section
    const prompts = SECTION_PROMPTS[fieldName];

    // Construire le prompt utilisateur avec les valeurs
    const valueStr = Array.isArray(currentValue)
      ? currentValue.join("\n")
      : currentValue;

    let userPrompt = prompts.userTemplate
      .replace("{value}", valueStr)
      .replace("{titre}", context?.titre || "Non spécifié")
      .replace("{description}", context?.description || "Non spécifié")
      .replace("{objectifs}", context?.objectifs?.join(", ") || "Non spécifié")
      .replace("{contenu}", context?.contenu || "Non spécifié")
      .replace("{publicVise}", context?.publicVise || "Non spécifié")
      .replace("{prerequis}", context?.prerequis || "Non spécifié");

    // Générer avec l'IA
    const model = getAIModel({
      provider: getAvailableProvider() || "anthropic",
      model: "claude-sonnet-4-20250514",
      maxTokens: 1500,
      temperature: 0.6,
    });

    const result = await generateText({
      model,
      system: prompts.system,
      prompt: userPrompt,
      maxOutputTokens: 1500,
      temperature: 0.6,
    });

    // Log pour monitoring
    console.log("Section enrichie:", {
      userId: user.id,
      fieldName,
      originalLength: valueStr.length,
      enrichedLength: result.text.length,
    });

    // Pour les objectifs, retourner un tableau
    let enrichedValue: string | string[] = result.text.trim();
    if (fieldName === "objectifs") {
      enrichedValue = result.text
        .trim()
        .split("\n")
        .map((line) => line.replace(/^[-•*]\s*/, "").trim())
        .filter((line) => line.length > 0);
    }

    return NextResponse.json({
      success: true,
      enrichedValue,
    });
  } catch (error) {
    console.error("Erreur API enrich-section:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
