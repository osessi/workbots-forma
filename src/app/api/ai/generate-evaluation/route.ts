// ===========================================
// API ROUTE: GENERATION EVALUATION FINALE
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateEvaluation, isAIConfigured } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Schema de validation de la requete
const ModuleSchema = z.object({
  titre: z.string(),
  contenu: z.array(z.string()).optional(),
  objectifs: z.array(z.string()).optional(),
});

const RequestSchema = z.object({
  formationTitre: z.string().min(1, "Le titre de la formation est requis"),
  modules: z.array(ModuleSchema).default([]),
  objectifs: z.array(z.string()).default([]),
  dureeEvaluation: z.string().optional(),
  regenerate: z.string().optional(), // Token pour forcer la régénération avec des questions différentes
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

    // Transformer les modules pour inclure des objectifs si non fournis
    const modulesWithObjectifs = data.modules.map(m => ({
      titre: m.titre,
      objectifs: m.objectifs?.length ? m.objectifs : (m.contenu?.length ? m.contenu.slice(0, 3) : [`Maitriser ${m.titre}`]),
    }));

    // Generer l'evaluation
    const result = await generateEvaluation({
      formationTitre: data.formationTitre,
      modules: modulesWithObjectifs,
      dureeEvaluation: data.dureeEvaluation,
      regenerateToken: data.regenerate, // Passer le token pour forcer la variation
    });

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
