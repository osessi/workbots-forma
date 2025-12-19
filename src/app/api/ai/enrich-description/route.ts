// ===========================================
// API ROUTE: ENRICHIR DESCRIPTION FORMATION
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { getAIModel, getAvailableProvider, isAIConfigured } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Schema de validation de la requete
const RequestSchema = z.object({
  description: z.string().min(10, "La description doit contenir au moins 10 caracteres"),
  modalite: z.string().optional(),
  dureeHeures: z.string().optional(),
  dureeJours: z.string().optional(),
  nombreParticipants: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Verifier l'authentification
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Non autorise" },
        { status: 401 }
      );
    }

    // Verifier que l'IA est configuree
    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: "Le service IA n'est pas configure" },
        { status: 503 }
      );
    }

    // Parser et valider la requete
    const body = await request.json();
    const validationResult = RequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Construire le contexte pour l'enrichissement
    const contextParts: string[] = [];
    if (data.modalite) {
      const modaliteLabels: Record<string, string> = {
        presentiel: "Presentiel",
        distanciel: "Distanciel",
        elearning: "E-learning",
        mixte: "Formation mixte",
      };
      contextParts.push(`Modalite: ${modaliteLabels[data.modalite] || data.modalite}`);
    }
    if (data.dureeHeures) {
      contextParts.push(`Duree: ${data.dureeHeures} heures`);
    }
    if (data.dureeJours) {
      contextParts.push(`Soit ${data.dureeJours} jours`);
    }
    if (data.nombreParticipants) {
      contextParts.push(`Nombre de participants: ${data.nombreParticipants}`);
    }

    const contextInfo = contextParts.length > 0
      ? `\n\nInformations complementaires sur la formation:\n${contextParts.join("\n")}`
      : "";

    // Prompt systeme pour l'enrichissement
    const systemPrompt = `Tu es un expert en ingenierie pedagogique et en creation de formations professionnelles.
Ta mission est d'enrichir et developper une description de formation fournie par l'utilisateur.

Regles importantes:
- Conserve le sujet et le theme de la formation fournie
- Developpe la description avec des details pertinents
- Ajoute des elements sur les competences visees
- Mentionne le public cible si ce n'est pas fait
- Structure le texte de maniere professionnelle
- Garde un ton professionnel mais accessible
- Ne depasse pas 2500 caracteres
- Retourne UNIQUEMENT le texte enrichi, sans introduction ni explication
- N'utilise pas de formatage markdown, juste du texte simple`;

    const userPrompt = `Description de formation a enrichir:
"${data.description}"${contextInfo}

Enrichis cette description en la developpant de maniere professionnelle tout en conservant son essence et son sujet principal.`;

    // Generer avec l'IA
    const model = getAIModel({
      provider: getAvailableProvider() || "anthropic",
      model: "claude-sonnet-4-20250514",
      maxTokens: 2000,
      temperature: 0.7,
    });

    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 2000,
      temperature: 0.7,
    });

    // Log pour monitoring
    console.log("Description enrichie:", {
      userId: user.id,
      originalLength: data.description.length,
      enrichedLength: result.text.length,
      provider: getAvailableProvider(),
    });

    return NextResponse.json({
      success: true,
      data: {
        enrichedDescription: result.text.trim(),
      },
    });
  } catch (error) {
    console.error("Erreur API enrich-description:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
