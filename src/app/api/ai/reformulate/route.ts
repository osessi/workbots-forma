// ===========================================
// API ROUTE: REFORMULATION / AMELIORATION
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateReformulation, isAIConfigured } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Schema de validation de la requete
const RequestSchema = z.object({
  texte: z.string().min(10, "Le texte doit contenir au moins 10 caracteres"),
  contexte: z.string().min(1, "Le contexte est requis"),
  style: z.enum(["formel", "accessible", "technique"]).optional(),
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

    // Generer la reformulation
    const result = await generateReformulation(validationResult.data);

    if (!result.success) {
      console.error("Erreur reformulation:", result.error);
      return NextResponse.json(
        { error: result.error || "Erreur lors de la reformulation" },
        { status: 500 }
      );
    }

    // Log pour monitoring
    console.log("Texte reformule:", {
      userId: user.id,
      style: validationResult.data.style || "formel",
      longueurOriginale: validationResult.data.texte.length,
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
    console.error("Erreur API reformulate:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
