// ===========================================
// API FORMATIONS - CRUD
// ===========================================
// POST /api/formations - Créer une formation
// GET /api/formations - Lister les formations de l'utilisateur

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// Générer une référence de session unique
function generateSessionReference(formationTitre: string, year: number, count: number): string {
  // Prendre les 4 premières lettres du titre en majuscules (sans accents)
  const prefix = formationTitre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .substring(0, 4)
    .toUpperCase();

  // Format: XXXX-2025-001
  return `${prefix || "FORM"}-${year}-${String(count).padStart(3, "0")}`;
}

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
    const { titre, description, fichePedagogique, modules, creationMode, contexteData } = body;

    if (!titre) {
      return NextResponse.json({ error: "Le titre est requis" }, { status: 400 });
    }

    // Valider le mode de création
    const validModes = ["AI", "MANUAL", "IMPORT"];
    const mode = validModes.includes(creationMode) ? creationMode : "AI";

    // Créer la formation avec ses modules dans une transaction
    const formation = await prisma.$transaction(async (tx) => {
      // 1. Créer la formation
      const newFormation = await tx.formation.create({
        data: {
          titre,
          description: description || null,
          fichePedagogique: fichePedagogique || {},
          contexteData: contexteData || null,
          creationMode: mode,
          userId: user.id,
          organizationId: user.organizationId!,
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
          organizationId: user.organizationId!,
          formationId: newFormation.id, // Lier le dossier à la formation
          folderType: "formation",
        },
      });

      // 3. Créer automatiquement une session initiale (Session 1)
      const currentYear = new Date().getFullYear();
      const reference = generateSessionReference(titre, currentYear, 1);

      await tx.session.create({
        data: {
          reference,
          nom: "Session 1",
          formationId: newFormation.id,
          organizationId: user.organizationId!,
          status: "BROUILLON",
          modalite: "PRESENTIEL",
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

// GET - Lister les formations de l'utilisateur avec pagination, filtres et tri
export async function GET(request: NextRequest) {
  try {
    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || ""; // BROUILLON, EN_COURS, TERMINEE, ARCHIVEE
    const sortBy = searchParams.get("sortBy") || "createdAt"; // createdAt, titre, status
    const sortOrder = searchParams.get("sortOrder") || "desc"; // asc, desc
    const showArchived = searchParams.get("showArchived") === "true";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

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

    // Construire les conditions de filtrage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      organizationId: user.organizationId,
    };

    // Filtre archivage
    if (!showArchived) {
      where.isArchived = false;
    }

    // Filtre par statut
    if (status && status !== "all") {
      where.status = status;
    }

    // Filtre par recherche texte
    if (search) {
      where.OR = [
        { titre: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filtre par date
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Construire le tri
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBy: any = {};
    if (sortBy === "titre") {
      orderBy.titre = sortOrder;
    } else if (sortBy === "status") {
      orderBy.status = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Compter le total pour la pagination
    const total = await prisma.formation.count({ where });

    // Récupérer les formations avec pagination
    const skip = (page - 1) * limit;
    const formations = await prisma.formation.findMany({
      where,
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
      orderBy,
      skip,
      take: limit,
    });

    return NextResponse.json({
      data: formations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + formations.length < total,
      },
    });
  } catch (error) {
    console.error("Erreur récupération formations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des formations" },
      { status: 500 }
    );
  }
}
