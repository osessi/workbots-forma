// ===========================================
// API BLOCS REUTILISABLES
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET - Liste des blocs (systeme + organisation)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Recuperer l'utilisateur et son organisation
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { organization: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    // Construire la requete
    const whereClause: Record<string, unknown> = {
      isActive: true,
      OR: [
        { isSystem: true },
        ...(dbUser.organizationId ? [{ organizationId: dbUser.organizationId }] : []),
      ],
    };

    if (category) {
      whereClause.category = category;
    }

    const blocks = await prisma.reusableBlock.findMany({
      where: whereClause,
      orderBy: [
        { isSystem: "desc" },
        { usageCount: "desc" },
        { updatedAt: "desc" },
      ],
    });

    return NextResponse.json({ blocks });
  } catch (error) {
    console.error("Erreur liste blocs:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de la récupération des blocs: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// POST - Créer un bloc
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { organization: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Verifier les droits admin ou membre d'une organisation
    // Les utilisateurs normaux peuvent aussi créer des blocs pour leur organisation
    const canCreate = dbUser.isSuperAdmin || dbUser.role === "ORG_ADMIN" || dbUser.organizationId;
    if (!canCreate) {
      return NextResponse.json({ error: "Non autorisé - vous devez appartenir à une organisation" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, content, category, tags, isSystem } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: "Nom et contenu requis" },
        { status: 400 }
      );
    }

    // Determiner si c'est un bloc systeme
    // Pour un superAdmin sans organisation, creer automatiquement un bloc systeme
    const shouldBeSystem = dbUser.isSuperAdmin && (isSystem || !dbUser.organizationId);

    // Pour un bloc non-systeme, on a besoin d'une organisation
    if (!shouldBeSystem && !dbUser.organizationId) {
      return NextResponse.json(
        { error: "Vous devez appartenir à une organisation pour créer un bloc" },
        { status: 400 }
      );
    }

    const block = await prisma.reusableBlock.create({
      data: {
        name,
        description: description || null,
        content,
        category: category || "general",
        tags: tags || [],
        isSystem: shouldBeSystem,
        organizationId: shouldBeSystem ? null : dbUser.organizationId,
      },
    });

    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    console.error("Erreur création bloc:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de la création du bloc: ${errorMessage}` },
      { status: 500 }
    );
  }
}
