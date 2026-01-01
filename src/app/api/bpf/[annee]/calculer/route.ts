// ===========================================
// API: CALCULER LES DONNÉES DU BPF
// POST /api/bpf/[annee]/calculer - Calcul automatique depuis les données
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// Helper pour créer le client Supabase
async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ annee: string }> }
) {
  try {
    const { annee: anneeStr } = await params;
    const annee = parseInt(anneeStr);

    if (isNaN(annee)) {
      return NextResponse.json(
        { error: "Année invalide" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const organizationId = dbUser.organizationId;

    // Définir la période de l'année
    const startDate = new Date(annee, 0, 1); // 1er janvier
    const endDate = new Date(annee, 11, 31, 23, 59, 59); // 31 décembre

    // Récupérer les sessions de l'année avec leurs participants
    const sessions = await prisma.session.findMany({
      where: {
        organizationId,
        journees: {
          some: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      include: {
        formation: {
          select: {
            id: true,
            fichePedagogique: true,
          },
        },
        journees: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            dureeMinutes: true,
          },
        },
        clients: {
          include: {
            participants: true,
          },
        },
      },
    });

    // Calculer les statistiques
    let nombreStagiaires = 0;
    let nombreHeuresFormation = 0;
    const nombreActions = sessions.length;

    // Répartition par type de public
    const repartitionPublic: Record<string, number> = {
      SALARIE: 0,
      INDEPENDANT: 0,
      PARTICULIER: 0,
      DEMANDEUR_EMPLOI: 0,
    };

    // Répartition par domaine
    const repartitionDomaine: Record<string, number> = {};

    for (const session of sessions) {
      // Compter les participants
      for (const client of session.clients) {
        const participantsCount = client.participants.length;
        nombreStagiaires += participantsCount;

        // Répartition par type de public
        const typeClient = client.typeClient || "PARTICULIER";
        if (repartitionPublic[typeClient] !== undefined) {
          repartitionPublic[typeClient] += participantsCount;
        }
      }

      // Calculer les heures depuis les journées de session
      const dureeMinutesTotal = session.journees.reduce(
        (sum, j) => sum + (j.dureeMinutes || 60),
        0
      );
      const dureeHeures = dureeMinutesTotal / 60;
      const participantsTotaux = session.clients.reduce(
        (sum, c) => sum + c.participants.length,
        0
      );
      nombreHeuresFormation += dureeHeures * participantsTotaux;

      // Répartition par domaine (depuis fichePedagogique si disponible)
      const fichePeda = session.formation.fichePedagogique as Record<string, unknown> | null;
      const domaine = (fichePeda?.domaine as string) || "Autre";
      repartitionDomaine[domaine] = (repartitionDomaine[domaine] || 0) + 1;
    }

    // Créer ou mettre à jour le BPF
    const bpf = await prisma.bilanPedagogiqueFinancier.upsert({
      where: {
        organizationId_annee: {
          organizationId,
          annee,
        },
      },
      update: {
        nombreStagiaires,
        nombreHeuresFormation,
        nombreActions,
        repartitionPublic,
        repartitionDomaine,
      },
      create: {
        organizationId,
        annee,
        nombreStagiaires,
        nombreHeuresFormation,
        nombreActions,
        repartitionPublic,
        repartitionDomaine,
        sectionA: {},
        repartitionFinancement: {},
      },
    });

    return NextResponse.json({
      bpf,
      calcul: {
        nombreStagiaires,
        nombreHeuresFormation,
        nombreActions,
        sessionsAnalysees: sessions.length,
        repartitionPublic,
        repartitionDomaine,
      },
    });
  } catch (error) {
    console.error("[API] POST /api/bpf/[annee]/calculer error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
