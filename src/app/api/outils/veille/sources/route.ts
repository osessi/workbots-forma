// ===========================================
// API VEILLE - Gestion des sources
// Super Admin uniquement ou sources par organisation
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { VeilleType } from "@prisma/client";

// GET - Récupérer les sources de veille
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

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Paramètres de requête
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") as VeilleType | null;
    const globalOnly = searchParams.get("globalOnly") === "true";

    // Construire la requête
    const whereClause: Record<string, unknown> = {};

    if (type) {
      whereClause.type = type;
    }

    // Super admin voit tout, autres utilisateurs voient sources globales + leurs sources org
    if (user.isSuperAdmin) {
      if (globalOnly) {
        whereClause.organizationId = null;
      }
    } else if (user.organizationId) {
      whereClause.OR = [
        { organizationId: null }, // Sources globales
        { organizationId: user.organizationId }, // Sources de l'organisation
      ];
    } else {
      whereClause.organizationId = null; // Que les sources globales
    }

    const sources = await prisma.veilleSource.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: [
        { type: "asc" },
        { nom: "asc" },
      ],
    });

    return NextResponse.json(sources);
  } catch (error) {
    console.error("Erreur récupération sources veille:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des sources" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle source (Super Admin pour globales, org admin pour sources org)
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

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const {
      type,
      nom,
      description,
      url,
      logoUrl,
      isRss,
      scrapeSelector,
      scrapeConfig,
      refreshInterval,
      isGlobal, // Si true et super admin, crée une source globale
    } = body;

    // Validation
    if (!type || !nom || !url) {
      return NextResponse.json(
        { error: "type, nom et url sont requis" },
        { status: 400 }
      );
    }

    // Vérifier les permissions
    if (isGlobal && !user.isSuperAdmin) {
      return NextResponse.json(
        { error: "Seul un super admin peut créer des sources globales" },
        { status: 403 }
      );
    }

    if (!isGlobal && !user.organizationId) {
      return NextResponse.json(
        { error: "Organisation requise pour créer une source" },
        { status: 400 }
      );
    }

    // Créer la source
    const source = await prisma.veilleSource.create({
      data: {
        type,
        nom,
        description: description || null,
        url,
        logoUrl: logoUrl || null,
        isRss: isRss !== false,
        scrapeSelector: scrapeSelector || null,
        scrapeConfig: scrapeConfig || null,
        refreshInterval: refreshInterval || 1440,
        organizationId: isGlobal ? null : user.organizationId,
        isActive: true,
      },
    });

    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    console.error("Erreur création source veille:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la source" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une source
export async function PUT(request: NextRequest) {
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

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    // Vérifier que la source existe et permissions
    const existingSource = await prisma.veilleSource.findUnique({
      where: { id },
    });

    if (!existingSource) {
      return NextResponse.json({ error: "Source non trouvée" }, { status: 404 });
    }

    // Vérifier les permissions
    if (existingSource.organizationId === null && !user.isSuperAdmin) {
      return NextResponse.json(
        { error: "Seul un super admin peut modifier les sources globales" },
        { status: 403 }
      );
    }

    if (existingSource.organizationId && existingSource.organizationId !== user.organizationId && !user.isSuperAdmin) {
      return NextResponse.json(
        { error: "Non autorisé à modifier cette source" },
        { status: 403 }
      );
    }

    // Mettre à jour
    const source = await prisma.veilleSource.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(source);
  } catch (error) {
    console.error("Erreur mise à jour source veille:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la source" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une source
export async function DELETE(request: NextRequest) {
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

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    // Vérifier que la source existe et permissions
    const existingSource = await prisma.veilleSource.findUnique({
      where: { id },
    });

    if (!existingSource) {
      return NextResponse.json({ error: "Source non trouvée" }, { status: 404 });
    }

    // Vérifier les permissions
    if (existingSource.organizationId === null && !user.isSuperAdmin) {
      return NextResponse.json(
        { error: "Seul un super admin peut supprimer les sources globales" },
        { status: 403 }
      );
    }

    if (existingSource.organizationId && existingSource.organizationId !== user.organizationId && !user.isSuperAdmin) {
      return NextResponse.json(
        { error: "Non autorisé à supprimer cette source" },
        { status: 403 }
      );
    }

    // Supprimer (les articles seront supprimés en cascade)
    await prisma.veilleSource.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression source veille:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la source" },
      { status: 500 }
    );
  }
}
