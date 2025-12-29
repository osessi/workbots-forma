// ===========================================
// API LIEUX - Alias vers /api/donnees/lieux
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// GET - Lister les lieux de formation
export async function GET(request: NextRequest) {
  try {
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
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    const lieux = await prisma.lieuFormation.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
        OR: search ? [
          { nom: { contains: search, mode: "insensitive" } },
          { lieuFormation: { contains: search, mode: "insensitive" } },
          { ville: { contains: search, mode: "insensitive" } },
        ] : undefined,
      },
      orderBy: { nom: "asc" },
    });

    return NextResponse.json(lieux);
  } catch (error) {
    console.error("Erreur récupération lieux:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des lieux" },
      { status: 500 }
    );
  }
}
