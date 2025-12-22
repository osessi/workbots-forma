// ===========================================
// API GAMMA - Statut d'une génération
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { createGammaClient } from "@/lib/gamma";

// GET - Vérifier le statut d'une génération
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const generationId = searchParams.get("generationId");

    if (!generationId) {
      return NextResponse.json({ error: "generationId requis" }, { status: 400 });
    }

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

    // Vérifier le statut
    const gammaClient = createGammaClient(gammaApiKey);
    const status = await gammaClient.checkStatus(generationId);

    return NextResponse.json({ status });
  } catch (error) {
    console.error("Erreur vérification statut Gamma:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la vérification du statut",
        message: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    );
  }
}
