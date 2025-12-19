// ===========================================
// API ROUTE: STATUT DU SERVICE IA
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { isAIConfigured, getAvailableProvider } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getRateLimitStats } from "@/lib/ai/rate-limit";

export async function GET(request: NextRequest) {
  try {
    // Verifier l'authentification
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Non autorise" },
        { status: 401 }
      );
    }

    const configured = isAIConfigured();
    const provider = getAvailableProvider();
    const rateLimits = getRateLimitStats(user.id);

    return NextResponse.json({
      configured,
      provider,
      rateLimits,
      endpoints: {
        generateFiche: "/api/ai/generate-fiche",
        generateQcm: "/api/ai/generate-qcm",
        generatePositionnement: "/api/ai/generate-positionnement",
        generateEvaluation: "/api/ai/generate-evaluation",
        reformulate: "/api/ai/reformulate",
      },
    });
  } catch (error) {
    console.error("Erreur API ai/status:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
