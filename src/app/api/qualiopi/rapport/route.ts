// ===========================================
// API: RAPPORT QUALIOPI
// GET /api/qualiopi/rapport - Générer un rapport
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { genererRapportConformite } from "@/lib/services/qualiopi";

export async function GET(request: NextRequest) {
  try {
    // Authentification
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Générer le rapport
    const rapport = await genererRapportConformite(user.organizationId);

    return NextResponse.json({
      rapport,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API] GET /api/qualiopi/rapport error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
