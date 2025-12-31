// ===========================================
// API: RAPPORT QUALIOPI
// GET /api/qualiopi/rapport - Générer un rapport
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { genererRapportConformite } from "@/lib/services/qualiopi";

export async function GET(request: NextRequest) {
  try {
    // Authentification
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

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son organisation
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Générer le rapport
    const rapport = await genererRapportConformite(dbUser.organizationId);

    return NextResponse.json({
      rapport,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API] GET /api/qualiopi/rapport error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
