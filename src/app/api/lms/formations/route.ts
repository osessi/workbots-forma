
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// GET - Récupérer les formations publiées dans le LMS
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
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const publishedOnly = searchParams.get("published") !== "false";

    const formations = await prisma.formation.findMany({
      where: {
        organizationId: user.organizationId,
        isArchived: false,
        ...(publishedOnly ? { isPublished: true } : {}),
      },
      select: {
        id: true,
        titre: true,
        description: true,
        image: true,
        status: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true,
        modules: {
          select: {
            id: true,
            titre: true,
            ordre: true,
            duree: true,
            isModuleZero: true,
          },
          where: {
            isModuleZero: false, // Exclure Module 0 du LMS public (affichage conditionnel séparé)
          },
          orderBy: { ordre: "asc" },
        },
        _count: {
          select: {
            lmsInscriptions: true,
          },
        },
      },
      orderBy: { publishedAt: "desc" },
    });

    // Calculer les stats
    const stats = {
      total: formations.length,
      published: formations.filter((f) => f.isPublished).length,
      totalInscriptions: formations.reduce((acc, f) => acc + f._count.lmsInscriptions, 0),
    };

    return NextResponse.json({ formations, stats });
  } catch (error) {
    console.error("Erreur récupération formations LMS:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des formations" },
      { status: 500 }
    );
  }
}
