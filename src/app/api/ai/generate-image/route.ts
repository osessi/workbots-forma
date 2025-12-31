// ===========================================
// API ROUTE: GENERATION D'IMAGE IA (DALL-E)
// Génère une image personnalisée via OpenAI DALL-E
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Schema de validation de la requete
const RequestSchema = z.object({
  prompt: z.string().min(5, "Le prompt doit contenir au moins 5 caractères"),
  formationTitle: z.string().optional(),
  style: z.enum(["professional", "creative", "minimalist", "modern"]).optional().default("professional"),
  size: z.enum(["1024x1024", "1792x1024", "1024x1792"]).optional().default("1792x1024"),
});

// Interface pour la réponse OpenAI Images
interface OpenAIImageResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

// Génère un prompt optimisé pour DALL-E basé sur le contexte de formation
function generateOptimizedPrompt(
  userPrompt: string,
  formationTitle?: string,
  style: string = "professional"
): string {
  const styleDescriptions: Record<string, string> = {
    professional: "professional, corporate, clean design, business-like",
    creative: "creative, colorful, artistic, inspirational",
    minimalist: "minimalist, simple, elegant, white space",
    modern: "modern, contemporary, sleek, innovative",
  };

  const styleDesc = styleDescriptions[style] || styleDescriptions.professional;

  // Construire le prompt optimisé
  const basePrompt = formationTitle
    ? `A ${styleDesc} banner image for a training course about "${formationTitle}". ${userPrompt}`
    : `A ${styleDesc} banner image for professional training. ${userPrompt}`;

  // Ajouter des instructions pour éviter le texte et garantir la qualité
  return `${basePrompt}. No text, no letters, no words in the image. High quality, suitable for educational materials, horizontal landscape orientation, 16:9 aspect ratio.`;
}

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

    // Vérifier que la clé OpenAI est configurée
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "La génération d'images IA n'est pas configurée",
          fallbackMessage: "Utilisez la recherche d'images gratuites à la place",
        },
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

    const { prompt, formationTitle, style, size } = validationResult.data;

    // Générer le prompt optimisé
    const optimizedPrompt = generateOptimizedPrompt(prompt, formationTitle, style);

    // Appeler l'API OpenAI directement via fetch
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: optimizedPrompt,
        n: 1,
        size: size,
        quality: "standard",
        style: style === "creative" ? "vivid" : "natural",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", response.status, errorData);

      if (response.status === 429) {
        return NextResponse.json(
          { error: "Limite de requêtes atteinte. Réessayez plus tard." },
          { status: 429 }
        );
      }
      if (response.status === 400) {
        return NextResponse.json(
          { error: "Le prompt n'est pas valide pour la génération d'image." },
          { status: 400 }
        );
      }

      throw new Error(errorData.error?.message || "Erreur OpenAI");
    }

    const data: OpenAIImageResponse = await response.json();

    if (!data.data || data.data.length === 0 || !data.data[0].url) {
      throw new Error("Aucune image générée");
    }

    const generatedImage = data.data[0];

    return NextResponse.json({
      success: true,
      data: {
        url: generatedImage.url,
        revisedPrompt: generatedImage.revised_prompt,
        size: size,
        source: "dalle",
      },
    });
  } catch (error) {
    console.error("Erreur API generate-image:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la génération de l'image" },
      { status: 500 }
    );
  }
}
