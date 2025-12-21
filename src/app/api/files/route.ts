// ===========================================
// API FILES - Gestion des fichiers du Drive
// ===========================================
// GET /api/files - Lister les fichiers
// POST /api/files - Uploader un fichier

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

// GET - Lister les fichiers
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    const category = searchParams.get("category");
    const formationId = searchParams.get("formationId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const whereClause: Record<string, unknown> = {
      organizationId: user.organizationId,
    };

    // Filtrer par dossier
    if (folderId) {
      whereClause.folderId = folderId;
    }

    // Filtrer par catégorie
    if (category) {
      whereClause.category = category;
    }

    // Filtrer par formation
    if (formationId) {
      whereClause.formationId = formationId;
    }

    const files = await prisma.file.findMany({
      where: whereClause,
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error("Erreur récupération fichiers:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des fichiers" },
      { status: 500 }
    );
  }
}

// POST - Créer un enregistrement de fichier (après upload Supabase)
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      originalName,
      mimeType,
      size,
      category,
      storagePath,
      publicUrl,
      formationId,
      folderId,
    } = body;

    if (!name || !storagePath) {
      return NextResponse.json(
        { error: "Nom et chemin de stockage requis" },
        { status: 400 }
      );
    }

    // Vérifier que le dossier appartient à l'organisation
    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          organizationId: user.organizationId,
        },
      });

      if (!folder) {
        return NextResponse.json({ error: "Dossier non trouvé" }, { status: 404 });
      }
    }

    // Vérifier que la formation appartient à l'organisation
    if (formationId) {
      const formation = await prisma.formation.findFirst({
        where: {
          id: formationId,
          organizationId: user.organizationId,
        },
      });

      if (!formation) {
        return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
      }
    }

    const file = await prisma.file.create({
      data: {
        name,
        originalName: originalName || name,
        mimeType: mimeType || "application/octet-stream",
        size: size || 0,
        category: category || "DOCUMENT",
        storagePath,
        publicUrl: publicUrl || null,
        organizationId: user.organizationId,
        userId: user.id,
        formationId: formationId || null,
        folderId: folderId || null,
      },
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(file, { status: 201 });
  } catch (error) {
    console.error("Erreur création fichier:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du fichier" },
      { status: 500 }
    );
  }
}
