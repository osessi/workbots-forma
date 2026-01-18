// ===========================================
// API: CALCULER LES DONNÉES DU BPF
// POST /api/bpf/[annee]/calculer - Calcul automatique depuis les données
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

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

    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const organizationId = user.organizationId;

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
            heureDebutMatin: true,
            heureFinMatin: true,
            heureDebutAprem: true,
            heureFinAprem: true,
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

      // Calculer les heures depuis les journées de session (horaires)
      // Helper pour convertir "HH:MM" en minutes depuis minuit
      const timeToMinutes = (time: string | null): number => {
        if (!time) return 0;
        const [h, m] = time.split(":").map(Number);
        return h * 60 + (m || 0);
      };

      let dureeMinutesTotal = 0;
      for (const j of session.journees) {
        // Matin: 09:00-12:30 = 3.5h par défaut
        const matinDebut = timeToMinutes(j.heureDebutMatin) || 9 * 60;
        const matinFin = timeToMinutes(j.heureFinMatin) || 12 * 60 + 30;
        const dureeMatin = Math.max(0, matinFin - matinDebut);

        // Après-midi: 14:00-17:30 = 3.5h par défaut
        const apremDebut = timeToMinutes(j.heureDebutAprem) || 14 * 60;
        const apremFin = timeToMinutes(j.heureFinAprem) || 17 * 60 + 30;
        const dureeAprem = Math.max(0, apremFin - apremDebut);

        dureeMinutesTotal += dureeMatin + dureeAprem;
      }
      // Si aucune journée, utiliser 7h par défaut
      const dureeHeures = session.journees.length > 0 ? dureeMinutesTotal / 60 : 7;
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
