// ===========================================
// API CRM Dashboard - Statistiques & Analytics
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// GET - Récupérer les statistiques du dashboard
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";

    // Calculer la date de début selon la période
    let startDate: Date | null = null;
    const now = new Date();

    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "all":
      default:
        startDate = null;
        break;
    }

    // Construire le filtre de base
    const baseWhere = {
      organizationId: user.organizationId,
      ...(startDate ? { createdAt: { gte: startDate } } : {}),
    };

    // Récupérer toutes les opportunités
    const opportunites = await prisma.cRMOpportunite.findMany({
      where: baseWhere,
      include: {
        entreprise: {
          select: {
            raisonSociale: true,
          },
        },
      },
      orderBy: { montantHT: "desc" },
    });

    // Calculer les statistiques par stage
    const parStage: Record<string, { count: number; montant: number }> = {};
    let opportunitesGagnees = 0;
    let opportunitesPerdues = 0;
    let opportunitesEnCours = 0;

    opportunites.forEach((opp) => {
      if (!parStage[opp.stage]) {
        parStage[opp.stage] = { count: 0, montant: 0 };
      }
      parStage[opp.stage].count++;
      parStage[opp.stage].montant += opp.montantHT || 0;

      if (opp.stage === "GAGNE") {
        opportunitesGagnees++;
      } else if (opp.stage === "PERDU") {
        opportunitesPerdues++;
      } else {
        opportunitesEnCours++;
      }
    });

    // Calculer les statistiques par source
    const parSource: Record<string, { count: number; montant: number }> = {};
    opportunites.forEach((opp) => {
      if (!parSource[opp.source]) {
        parSource[opp.source] = { count: 0, montant: 0 };
      }
      parSource[opp.source].count++;
      parSource[opp.source].montant += opp.montantHT || 0;
    });

    // Calculer les totaux
    const totalOpportunites = opportunites.length;
    const montantTotal = opportunites.reduce((acc, o) => acc + (o.montantHT || 0), 0);
    const montantPondere = opportunites.reduce(
      (acc, o) => acc + ((o.montantHT || 0) * (o.probabilite / 100)),
      0
    );

    // Taux de conversion (gagnées / (gagnées + perdues))
    const tauxConversion = opportunitesGagnees + opportunitesPerdues > 0
      ? (opportunitesGagnees / (opportunitesGagnees + opportunitesPerdues)) * 100
      : 0;

    // Top 5 opportunités par montant
    const topOpportunites = opportunites
      .filter((o) => o.montantHT && o.stage !== "PERDU")
      .slice(0, 5)
      .map((o) => ({
        id: o.id,
        titre: o.titre,
        montantHT: o.montantHT || 0,
        probabilite: o.probabilite,
        stage: o.stage,
        entreprise: o.entreprise,
      }));

    // Activités récentes
    const activitesRecentes = await prisma.cRMActivite.findMany({
      where: {
        opportunite: {
          organizationId: user.organizationId,
        },
        ...(startDate ? { createdAt: { gte: startDate } } : {}),
      },
      include: {
        opportunite: {
          select: {
            id: true,
            titre: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: 5,
    });

    // Evolution (groupé par jour pour les 30 derniers jours)
    const evolution: { date: string; count: number; montant: number }[] = [];

    if (period !== "all") {
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayOpps = opportunites.filter((o) => {
          const oppDate = new Date(o.createdAt);
          return oppDate >= date && oppDate < nextDate;
        });

        evolution.push({
          date: date.toISOString().split("T")[0],
          count: dayOpps.length,
          montant: dayOpps.reduce((acc, o) => acc + (o.montantHT || 0), 0),
        });
      }
    }

    return NextResponse.json({
      totalOpportunites,
      montantTotal,
      montantPondere,
      tauxConversion,
      opportunitesGagnees,
      opportunitesPerdues,
      opportunitesEnCours,
      parStage,
      parSource,
      evolution,
      topOpportunites,
      activitesRecentes: activitesRecentes.map((a) => ({
        id: a.id,
        type: a.type,
        titre: a.titre,
        date: a.date.toISOString(),
        opportunite: a.opportunite,
      })),
    });
  } catch (error) {
    console.error("Erreur récupération stats dashboard:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
