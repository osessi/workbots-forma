// ===========================================
// API ROUTE: GENERATION TEST DE POSITIONNEMENT
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generatePositionnement, isAIConfigured } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Schema de validation de la requete
const RequestSchema = z.object({
  formationTitre: z.string().min(1, "Le titre de la formation est requis"),
  objectifs: z.array(z.string()).min(1, "Au moins un objectif est requis"),
  prerequis: z.array(z.string()),
  publicCible: z.string().min(1, "Le public cible est requis"),
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

    // Generer le test de positionnement
    const result = await generatePositionnement(validationResult.data);

    if (!result.success) {
      console.error("Erreur generation positionnement:", result.error);
      return NextResponse.json(
        { error: result.error || "Erreur lors de la generation" },
        { status: 500 }
      );
    }

    // Log pour monitoring
    console.log("Test positionnement genere:", {
      userId: user.id,
      formation: validationResult.data.formationTitre,
      nbQuestions: result.data?.questions.length,
      tokens: result.tokens,
      provider: result.provider,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: {
        tokens: result.tokens,
        provider: result.provider,
      },
    });
  } catch (error) {
    console.error("Erreur API generate-positionnement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
