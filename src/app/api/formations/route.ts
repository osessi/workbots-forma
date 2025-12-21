// ===========================================
// API FORMATIONS - CRUD
// ===========================================
// POST /api/formations - Créer une formation
// GET /api/formations - Lister les formations de l'utilisateur

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// POST - Créer une nouvelle formation
export async function POST(request: NextRequest) {
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

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'utilisateur et son organisation
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: { organization: true },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Utilisateur ou organisation non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const { titre, description, fichePedagogique, modules } = body;

    if (!titre) {
      return NextResponse.json({ error: "Le titre est requis" }, { status: 400 });
    }

    // Créer la formation avec ses modules dans une transaction
    const formation = await prisma.$transaction(async (tx) => {
      // 1. Créer la formation
      const newFormation = await tx.formation.create({
        data: {
          titre,
          description: description || null,
          fichePedagogique: fichePedagogique || {},
          userId: user.id,
          organizationId: user.organizationId,
          modules: modules && modules.length > 0 ? {
            create: modules.map((m: { titre: string; ordre: number; contenu?: object; duree?: number }) => ({
              titre: m.titre,
              ordre: m.ordre,
              contenu: m.contenu || {},
              duree: m.duree || null,
            })),
          } : undefined,
        },
        include: {
          modules: {
            orderBy: { ordre: "asc" },
          },
        },
      });

      // 2. Créer automatiquement un dossier Drive pour cette formation
      await tx.folder.create({
        data: {
          name: titre,
          color: "#4277FF", // Couleur par défaut
          organizationId: user.organizationId,
          formationId: newFormation.id, // Lier le dossier à la formation
          folderType: "formation",
        },
      });

      return newFormation;
    });

    return NextResponse.json(formation, { status: 201 });
  } catch (error) {
    console.error("Erreur création formation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la formation" },
      { status: 500 }
    );
  }
}

// GET - Lister les formations de l'utilisateur
export async function GET() {
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

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Récupérer les formations de l'organisation
    const formations = await prisma.formation.findMany({
      where: {
        organizationId: user.organizationId,
      },
      include: {
        modules: {
          orderBy: { ordre: "asc" },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            documents: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(formations);
  } catch (error) {
    console.error("Erreur récupération formations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des formations" },
      { status: 500 }
    );
  }
}
