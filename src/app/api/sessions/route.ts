// ===========================================
// API SESSIONS - Liste des sessions documentaires
// ===========================================
// GET /api/sessions - Récupérer les sessions pour le calendrier

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// GET - Récupérer les sessions avec leurs journées
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const formationId = searchParams.get("formationId");

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

    // Construire les conditions de filtrage pour les journées
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const journeeWhere: any = {};

    if (dateFrom || dateTo) {
      journeeWhere.date = {};
      if (dateFrom) {
        journeeWhere.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        journeeWhere.date.lte = new Date(dateTo);
      }
    }

    // Construire les conditions de filtrage pour les sessions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionWhere: any = {
      organizationId: user.organizationId,
    };

    if (formationId) {
      sessionWhere.formationId = formationId;
    }

    // 1. Récupérer les sessions documentaires (ancien modèle)
    const documentSessions = await prisma.documentSession.findMany({
      where: sessionWhere,
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
        lieu: {
          select: {
            id: true,
            nom: true,
            typeLieu: true,
            lieuFormation: true,
          },
        },
        formateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        journees: {
          where: Object.keys(journeeWhere).length > 0 ? journeeWhere : undefined,
          orderBy: { date: "asc" },
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 2. Récupérer les nouvelles sessions (nouveau modèle Session)
    const trainingSessions = await prisma.session.findMany({
      where: sessionWhere,
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
        lieu: {
          select: {
            id: true,
            nom: true,
            typeLieu: true,
            lieuFormation: true,
          },
        },
        formateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        journees: {
          where: Object.keys(journeeWhere).length > 0 ? {
            date: journeeWhere.date
          } : undefined,
          orderBy: { date: "asc" },
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 3. Transformer les DocumentSession pour le calendrier
    const documentCalendarEvents = documentSessions.flatMap((session) => {
      return session.journees.map((journee) => ({
        id: `doc-${session.id}-${journee.id}`,
        sessionId: session.id,
        journeeId: journee.id,
        title: session.formation.titre,
        start: journee.date,
        heureDebutMatin: journee.heureDebutMatin,
        heureFinMatin: journee.heureFinMatin,
        heureDebutAprem: journee.heureDebutAprem,
        heureFinAprem: journee.heureFinAprem,
        modalite: session.modalite,
        lieu: session.lieu,
        formateur: session.formateur,
        status: session.status,
        participantsCount: session.clients.reduce(
          (acc, client) => acc + client.participants.length,
          0
        ),
        clients: session.clients.map((c) => ({
          id: c.id,
          typeClient: c.typeClient,
          entreprise: c.entreprise,
          participantsCount: c.participants.length,
        })),
        sessionType: "document" as const,
      }));
    });

    // 4. Transformer les Session (nouveau modèle) pour le calendrier
    const trainingCalendarEvents = trainingSessions.flatMap((session) => {
      return session.journees.map((journee) => ({
        id: `train-${session.id}-${journee.id}`,
        sessionId: session.id,
        journeeId: journee.id,
        title: session.formation.titre,
        start: journee.date,
        heureDebutMatin: journee.heureDebutMatin,
        heureFinMatin: journee.heureFinMatin,
        heureDebutAprem: journee.heureDebutAprem,
        heureFinAprem: journee.heureFinAprem,
        modalite: session.modalite,
        lieu: session.lieu,
        formateur: session.formateur,
        status: session.status,
        reference: session.reference,
        nom: session.nom,
        participantsCount: session.clients.reduce(
          (acc, client) => acc + client.participants.length,
          0
        ),
        clients: session.clients.map((c) => ({
          id: c.id,
          typeClient: c.typeClient,
          entreprise: c.entreprise,
          participantsCount: c.participants.length,
        })),
        sessionType: "training" as const,
      }));
    });

    // 5. Fusionner tous les événements
    const calendarEvents = [...documentCalendarEvents, ...trainingCalendarEvents]
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return NextResponse.json({
      sessions: [...documentSessions, ...trainingSessions],
      calendarEvents,
    });
  } catch (error) {
    console.error("Erreur récupération sessions:", error);
    // Retourner plus de détails en dev
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: "Erreur lors de la récupération des sessions", details: errorMessage },
      { status: 500 }
    );
  }
}
