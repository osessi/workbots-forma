// ===========================================
// API VEILLE ACTIONS - CRUD
// Corrections 402-407 : Exploitation de la veille
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// GET - Liste des actions de veille
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

    // Paramètres de filtrage
    const searchParams = request.nextUrl.searchParams;
    const typeVeille = searchParams.get("type");
    const statut = searchParams.get("statut");
    const search = searchParams.get("search");
    const personnesConcernees = searchParams.get("personne");

    // Construction du filtre
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      organizationId: user.organizationId,
    };

    if (typeVeille) {
      where.typeVeille = typeVeille;
    }

    if (statut) {
      where.statut = statut;
    }

    if (personnesConcernees) {
      where.personnesConcernees = {
        contains: personnesConcernees,
        mode: "insensitive",
      };
    }

    if (search) {
      where.OR = [
        { articleTitre: { contains: search, mode: "insensitive" } },
        { articleSource: { contains: search, mode: "insensitive" } },
        { analyse: { contains: search, mode: "insensitive" } },
        { actionAMettreEnPlace: { contains: search, mode: "insensitive" } },
      ];
    }

    const actions = await prisma.veilleAction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        preuves: {
          orderBy: { createdAt: "desc" },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Comptages pour les filtres
    const counts = await prisma.veilleAction.groupBy({
      by: ["statut"],
      where: { organizationId: user.organizationId },
      _count: true,
    });

    const countsByStatut = {
      total: actions.length,
      A_TRAITER: counts.find((c) => c.statut === "A_TRAITER")?._count || 0,
      EN_COURS: counts.find((c) => c.statut === "EN_COURS")?._count || 0,
      CLOTUREE: counts.find((c) => c.statut === "CLOTUREE")?._count || 0,
    };

    return NextResponse.json({
      actions,
      counts: countsByStatut,
    });
  } catch (error) {
    console.error("Erreur GET veille actions:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer une action de veille
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      veilleArticleId,
      articleTitre,
      articleUrl,
      articleSource,
      typeVeille,
      analyse,
      actionAMettreEnPlace,
      personnesConcernees,
      statut,
      dateCreation,
      dateCloture,
    } = body;

    // Validation
    if (!veilleArticleId || !articleTitre || !articleUrl || !articleSource || !typeVeille) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    // Vérifier que l'article existe
    const article = await prisma.veilleArticle.findUnique({
      where: { id: veilleArticleId },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Article non trouvé" },
        { status: 404 }
      );
    }

    // Créer l'action
    const action = await prisma.veilleAction.create({
      data: {
        organizationId: user.organizationId,
        veilleArticleId,
        articleTitre,
        articleUrl,
        articleSource,
        typeVeille,
        analyse,
        actionAMettreEnPlace,
        personnesConcernees,
        statut: statut || "A_TRAITER",
        dateCreation: dateCreation ? new Date(dateCreation) : new Date(),
        dateCloture: dateCloture ? new Date(dateCloture) : null,
        createdById: user.id,
      },
      include: {
        preuves: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    console.error("Erreur POST veille action:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
