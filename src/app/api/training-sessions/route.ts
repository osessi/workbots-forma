// ===========================================
// API TRAINING SESSIONS - CRUD (Nouveau système)
// ===========================================
// POST /api/training-sessions - Créer une session pour une formation
// GET /api/training-sessions - Lister les sessions de l'organisation

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

// Générer une référence unique pour la session
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

// POST - Créer une nouvelle session
export async function POST(request: NextRequest) {
  try {
    // Authentification
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Utilisateur ou organisation non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const {
      formationId,
      nom,
      modalite = "PRESENTIEL",
      lieuId,
      lieuTexteLibre,
      lienConnexion,
      plateformeVisio,
      formateurId,
      tarifParDefautHT,
      tauxTVA = 20,
      notes,
      journees,
    } = body;

    if (!formationId) {
      return NextResponse.json({ error: "L'ID de la formation est requis" }, { status: 400 });
    }

    // Vérifier que la formation existe et appartient à l'organisation
    // Correction 433b: Récupérer toutes les données nécessaires pour le snapshot
    const formation = await prisma.formation.findFirst({
      where: {
        id: formationId,
        organizationId: user.organizationId,
      },
      include: {
        modules: {
          orderBy: { ordre: "asc" },
          select: {
            id: true,
            titre: true,
            description: true,
            ordre: true,
            duree: true,
            contenu: true,
            isModuleZero: true,
          },
        },
      },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
    }

    // Correction 433b: Préparer le snapshot des données Formation
    const snapshotModules = formation.modules.map(m => ({
      id: m.id,
      titre: m.titre,
      description: m.description,
      ordre: m.ordre,
      duree: m.duree,
      contenu: m.contenu,
      isModuleZero: m.isModuleZero,
    }));

    // Compter les sessions existantes pour cette formation cette année
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const existingSessionsCount = await prisma.session.count({
      where: {
        formationId,
        createdAt: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    // Générer la référence
    const reference = generateSessionReference(
      formation.titre,
      currentYear,
      existingSessionsCount + 1
    );

    // Créer la session avec ses journées dans une transaction
    const session = await prisma.$transaction(async (tx) => {
      // 1. Créer la session avec snapshot des données Formation
      const newSession = await tx.session.create({
        data: {
          reference,
          nom: nom || null,
          formationId,
          organizationId: user.organizationId!,
          status: "BROUILLON",
          modalite: modalite,
          lieuId: lieuId || null,
          lieuTexteLibre: lieuTexteLibre || null,
          lienConnexion: lienConnexion || null,
          plateformeVisio: plateformeVisio || null,
          formateurId: formateurId || null,
          tarifParDefautHT: tarifParDefautHT ? parseFloat(tarifParDefautHT) : null,
          tauxTVA: parseFloat(tauxTVA),
          notes: notes || null,
          // Correction 433b: Snapshot des données Formation
          snapshotFormationTitre: formation.titre,
          snapshotFormationDescription: formation.description,
          snapshotFichePedagogique: formation.fichePedagogique || undefined,
          snapshotEvaluationsData: formation.evaluationsData || undefined,
          snapshotModules: snapshotModules,
          snapshotSlidesData: formation.slidesData || undefined,
          snapshotCreatedAt: new Date(),
          journees: journees && journees.length > 0 ? {
            create: journees.map((j: { date: string; ordre?: number; heureDebutMatin?: string; heureFinMatin?: string; heureDebutAprem?: string; heureFinAprem?: string }, index: number) => ({
              ordre: j.ordre || index + 1,
              date: new Date(j.date),
              heureDebutMatin: j.heureDebutMatin || "09:00",
              heureFinMatin: j.heureFinMatin || "12:30",
              heureDebutAprem: j.heureDebutAprem || "14:00",
              heureFinAprem: j.heureFinAprem || "17:30",
            })),
          } : undefined,
        },
        include: {
          formation: {
            select: {
              id: true,
              titre: true,
            },
          },
          journees: {
            orderBy: { ordre: "asc" },
          },
          lieu: true,
          formateur: true,
        },
      });

      // 2. Mettre à jour les stats de la formation
      await tx.formation.update({
        where: { id: formationId },
        data: {
          totalSessions: { increment: 1 },
          lastSessionDate: new Date(),
        },
      });

      return newSession;
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Erreur création session:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session" },
      { status: 500 }
    );
  }
}

// GET - Lister les sessions de l'organisation
export async function GET(request: NextRequest) {
  try {
    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const formationId = searchParams.get("formationId");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Authentification
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Construire les filtres
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      organizationId: user.organizationId,
    };

    if (formationId) {
      where.formationId = formationId;
    }

    if (status) {
      where.status = status;
    }

    // Filtre par date (sur les journées)
    if (dateFrom || dateTo) {
      where.journees = {
        some: {
          date: {
            ...(dateFrom && { gte: new Date(dateFrom) }),
            ...(dateTo && { lte: new Date(dateTo) }),
          },
        },
      };
    }

    // Compter le total
    const total = await prisma.session.count({ where });

    // Récupérer les sessions
    const skip = (page - 1) * limit;
    const sessions = await prisma.session.findMany({
      where,
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
            image: true,
          },
        },
        journees: {
          orderBy: { ordre: "asc" },
        },
        lieu: true,
        formateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        clients: {
          include: {
            entreprise: {
              select: {
                id: true,
                raisonSociale: true,
              },
            },
            participants: {
              include: {
                apprenant: {
                  select: {
                    id: true,
                    nom: true,
                    prenom: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            clients: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Calculer le nombre total de participants par session
    const sessionsWithParticipantCount = sessions.map(session => {
      const totalParticipants = session.clients.reduce(
        (acc, client) => acc + client.participants.length,
        0
      );

      // Trouver la première et dernière date
      const dates = session.journees.map(j => j.date);
      const startDate = dates.length > 0 ? dates[0] : null;
      const endDate = dates.length > 0 ? dates[dates.length - 1] : null;

      return {
        ...session,
        totalParticipants,
        startDate,
        endDate,
      };
    });

    return NextResponse.json({
      data: sessionsWithParticipantCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + sessions.length < total,
      },
    });
  } catch (error) {
    console.error("Erreur récupération sessions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des sessions" },
      { status: 500 }
    );
  }
}
