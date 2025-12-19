// ===========================================
// API ROUTE: SYNCHRONISER LES PROMPTS IA
// ===========================================
// Met a jour les prompts systeme depuis les DEFAULT_PROMPTS

import { NextResponse } from "next/server";
import { seedDefaultPrompts } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function POST() {
  try {
    // Verifier l'authentification (n'importe quel utilisateur connecte peut synchroniser)
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    // Synchroniser les prompts
    const result = await seedDefaultPrompts();

    return NextResponse.json({
      success: true,
      message: `Prompts synchronises: ${result.created} crees, ${result.updated} mis a jour`,
      ...result,
    });
  } catch (error) {
    console.error("Erreur synchronisation prompts:", error);
    return NextResponse.json(
      { error: "Erreur lors de la synchronisation" },
      { status: 500 }
    );
  }
}
