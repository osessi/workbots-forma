// ===========================================
// API ROUTE: GENERATION EVALUATION FINALE
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateEvaluation, isAIConfigured } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Schema de validation de la requete
const ModuleSchema = z.object({
  titre: z.string().min(1),
  objectifs: z.array(z.string()).min(1),
});

const RequestSchema = z.object({
  formationTitre: z.string().min(1, "Le titre de la formation est requis"),
  modules: z.array(ModuleSchema).min(1, "Au moins un module est requis"),
  dureeEvaluation: z.string().optional(),
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

    // Generer l'evaluation
    const result = await generateEvaluation(validationResult.data);

    if (!result.success) {
      console.error("Erreur generation evaluation:", result.error);
      return NextResponse.json(
        { error: result.error || "Erreur lors de la generation" },
        { status: 500 }
      );
    }

    // Log pour monitoring
    console.log("Evaluation generee:", {
      userId: user.id,
      formation: validationResult.data.formationTitre,
      nbModules: validationResult.data.modules.length,
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
    console.error("Erreur API generate-evaluation:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
