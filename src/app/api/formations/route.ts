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
    const { titre, description, fichePedagogique, modules, creationMode, contexteData } = body;

    if (!titre) {
      return NextResponse.json({ error: "Le titre est requis" }, { status: 400 });
    }

    // Valider le mode de création
    const validModes = ["AI", "MANUAL", "IMPORT"];
    const mode = validModes.includes(creationMode) ? creationMode : "AI";

    // Extraire les champs de certification depuis contexteData
    const isCertifiante = contexteData?.isCertifiante || false;
    const numeroFicheRS = contexteData?.numeroFicheRS || null;
    const referentielRSUrl = contexteData?.referentielRSUrl || null;
    const lienFranceCompetences = contexteData?.lienFranceCompetences || null;

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
          // Qualiopi IND 3 - Formation certifiante
          isCertifiante: Boolean(isCertifiante),
          numeroFicheRS,
          referentielRSUrl,
          lienFranceCompetences,
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

      // Correction 356: Ne plus créer de session automatiquement
      // La création de session doit se faire uniquement via un bouton explicite
      // (depuis "Mes sessions" ou depuis la page de la formation)

      return newFormation;
    });

    return NextResponse.json(formation, { status: 201 });
  } catch (error) {
    console.error("Erreur création formation:", error);

    // Détailler l'erreur pour aider au debug
    let errorMessage = "Erreur lors de la création de la formation";

    if (error instanceof Error) {
      // Erreurs Prisma connues
      if (error.message.includes("Unique constraint")) {
        errorMessage = "Une formation avec ce titre existe déjà";
      } else if (error.message.includes("Foreign key constraint")) {
        errorMessage = "Référence invalide (utilisateur ou organisation)";
      } else if (error.message.includes("Invalid")) {
        errorMessage = `Données invalides: ${error.message}`;
      } else {
        // En développement, afficher le message complet
        errorMessage = process.env.NODE_ENV === "development"
          ? `Erreur: ${error.message}`
          : errorMessage;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
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
        trainingSessions: {
          select: {
            modalite: true,
          },
        },
        indicateurs: {
          select: {
            tauxSatisfaction: true,
            nombreAvis: true,
            nombreStagiaires: true,
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

    // Calculer les données supplémentaires pour chaque formation
    const formationsWithExtras = formations.map((f) => {
      // Calculer la durée totale en heures depuis les modules
      const totalMinutes = f.modules.reduce((sum, m) => sum + (m.duree || 0), 0);
      const dureeHeures = Math.ceil(totalMinutes / 60) || 0;
      const dureeJours = Math.ceil(dureeHeures / 7) || 0;

      // Extraire les modalités uniques depuis les sessions
      // LOGIQUE: Si au moins une session est MIXTE, la formation est MIXTE
      // Si sessions en présentiel ET distanciel, c'est aussi MIXTE
      const modalitesSet = new Set(f.trainingSessions.map(s => s.modalite));
      const hasPresen = modalitesSet.has("PRESENTIEL");
      const hasDistan = modalitesSet.has("DISTANCIEL");
      const hasMixte = modalitesSet.has("MIXTE");

      let modalites: string[] = [];
      if (hasMixte || (hasPresen && hasDistan)) {
        modalites = ["MIXTE"];
      } else {
        modalites = [...modalitesSet];
      }

      return {
        ...f,
        dureeHeures,
        dureeJours,
        modalites,
      };
    });

    return NextResponse.json({
      data: formationsWithExtras,
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
