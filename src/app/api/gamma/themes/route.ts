// ===========================================
// API GAMMA - Liste des thèmes
// ===========================================

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { createGammaClient } from "@/lib/gamma";

// GET - Récupérer les thèmes Gamma disponibles
export async function GET() {
  try {
    // Vérifier l'authentification
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore
            }
          },
        },
      }
    );

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: { organization: true },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Récupérer la clé API Gamma
    const gammaApiKey = user.organization?.gammaApiKey || process.env.GAMMA_API_KEY;

    if (!gammaApiKey) {
      return NextResponse.json(
        { error: "Clé API Gamma non configurée" },
        { status: 400 }
      );
    }

    // Récupérer les thèmes
    const gammaClient = createGammaClient(gammaApiKey);
    const themes = await gammaClient.listThemes();

    return NextResponse.json({ themes });
  } catch (error) {
    console.error("Erreur récupération thèmes Gamma:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des thèmes",
        message: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    );
  }
}
