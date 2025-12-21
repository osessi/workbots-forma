// ===========================================
// API FOLDERS - Gestion des dossiers du Drive
// ===========================================
// GET /api/folders - Lister les dossiers
// POST /api/folders - Créer un dossier

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// Helper pour authentifier l'utilisateur
async function authenticateUser() {
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
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: { organization: true },
  });

  return user;
}

// GET - Lister les dossiers
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId"); // null = dossiers racine
    const folderType = searchParams.get("type"); // formation, entreprise, apprenant, general
    const formationId = searchParams.get("formationId");

    const whereClause: Record<string, unknown> = {
      organizationId: user.organizationId,
    };

    // Filtrer par parent
    if (parentId === "root" || parentId === null || parentId === "") {
      whereClause.parentId = null;
    } else if (parentId) {
      whereClause.parentId = parentId;
    }

    // Filtrer par type
    if (folderType) {
      whereClause.folderType = folderType;
    }

    // Filtrer par formation
    if (formationId) {
      whereClause.formationId = formationId;
    }

    const folders = await prisma.folder.findMany({
      where: whereClause,
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
            status: true,
          },
        },
        entreprise: {
          select: {
            id: true,
            raisonSociale: true,
          },
        },
        apprenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        children: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            files: true,
            children: true,
          },
        },
      },
      orderBy: [
        { folderType: "asc" }, // formations en premier
        { name: "asc" },
      ],
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error("Erreur récupération dossiers:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des dossiers" },
      { status: 500 }
    );
  }
}

// POST - Créer un dossier
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { name, parentId, formationId, entrepriseId, apprenantId, color, folderType } = body;

    if (!name) {
      return NextResponse.json({ error: "Le nom du dossier est requis" }, { status: 400 });
    }

    // Vérifier que le parent appartient à la même organisation
    if (parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: parentId,
          organizationId: user.organizationId,
        },
      });

      if (!parentFolder) {
        return NextResponse.json({ error: "Dossier parent non trouvé" }, { status: 404 });
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        color: color || "#4277FF",
        parentId: parentId || null,
        formationId: formationId || null,
        entrepriseId: entrepriseId || null,
        apprenantId: apprenantId || null,
        folderType: folderType || "general",
        organizationId: user.organizationId,
      },
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
        _count: {
          select: {
            files: true,
            children: true,
          },
        },
      },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error("Erreur création dossier:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du dossier" },
      { status: 500 }
    );
  }
}
