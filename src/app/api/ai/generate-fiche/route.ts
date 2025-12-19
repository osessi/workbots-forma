// ===========================================
// API ROUTE: GENERATION FICHE PEDAGOGIQUE
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateFichePedagogique, isAIConfigured } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Schema de validation de la requete
const RequestSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
  thematique: z.string().min(1, "La thematique est requise"),
  duree: z.string().min(1, "La duree est requise"),
  publicCible: z.string().min(1, "Le public cible est requis"),
  objectifPrincipal: z.string().min(1, "L'objectif principal est requis"),
  contexte: z.string().optional(),
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

    // Generer la fiche pedagogique
    const result = await generateFichePedagogique(validationResult.data);

    if (!result.success) {
      console.error("Erreur generation fiche:", result.error);
      return NextResponse.json(
        { error: result.error || "Erreur lors de la generation" },
        { status: 500 }
      );
    }

    // Log pour monitoring (en production, utiliser un service de logging)
    console.log("Fiche pedagogique generee:", {
      userId: user.id,
      titre: validationResult.data.titre,
      tokens: result.tokens,
      retries: result.retries,
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
    console.error("Erreur API generate-fiche:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
