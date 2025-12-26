// ===========================================
// API DASHBOARD - Statistiques pour le tableau de bord
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

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
      include: {
        organization: {
          select: {
            maxFormations: true,
            maxStorageGb: true,
          },
        },
      },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Récupérer les stats en parallèle
    const [
      formationsCount,
      formationsByStatus,
      documentsCount,
      sessionsCount,
      entreprisesCount,
      apprenantsCount,
      opportunitesStats,
      recentFormations,
      formationsPerMonth,
    ] = await Promise.all([
      // Total formations
      prisma.formation.count({
        where: { organizationId: user.organizationId, isArchived: false },
      }),

      // Formations par statut
      prisma.formation.groupBy({
        by: ["status"],
        where: { organizationId: user.organizationId, isArchived: false },
        _count: { id: true },
      }),

      // Total documents générés
      prisma.sessionDocument.count({
        where: {
          session: { organizationId: user.organizationId },
          status: "generated",
        },
      }),

      // Sessions planifiées
      prisma.documentSession.count({
        where: { organizationId: user.organizationId },
      }),

      // Entreprises clientes
      prisma.entreprise.count({
        where: { organizationId: user.organizationId, isActive: true },
      }),

      // Apprenants
      prisma.apprenant.count({
        where: { organizationId: user.organizationId, isActive: true },
      }),

      // Stats CRM
      prisma.cRMOpportunite.aggregate({
        where: { organizationId: user.organizationId },
        _count: { id: true },
        _sum: { montantHT: true },
      }),

      // Formations récentes
      prisma.formation.findMany({
        where: { organizationId: user.organizationId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          titre: true,
          status: true,
          createdAt: true,
        },
      }),

      // Formations par mois (6 derniers mois)
      prisma.$queryRaw`
        SELECT
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
          COUNT(*) as count
        FROM "Formation"
        WHERE "organizationId" = ${user.organizationId}
          AND "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month ASC
      ` as Promise<{ month: string; count: bigint }[]>,
    ]);

    // Formater les stats par statut
    const statusStats = formationsByStatus.reduce(
      (acc, item) => {
        acc[item.status] = Number(item._count.id);
        return acc;
      },
      {} as Record<string, number>
    );

    // Formater les données mensuelles pour le graphique
    const monthlyData = formationsPerMonth.map((item) => ({
      month: new Date(item.month + "-01").toLocaleDateString("fr-FR", {
        month: "short",
      }),
      formations: Number(item.count),
    }));

    // Compléter avec les mois manquants
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString("fr-FR", { month: "short" });
      const existing = monthlyData.find((m) => m.month === monthKey);
      last6Months.push({
        month: monthKey,
        formations: existing?.formations || 0,
      });
    }

    return NextResponse.json({
      formations: {
        total: formationsCount,
        max: user.organization?.maxFormations || 50,
        byStatus: statusStats,
      },
      documents: {
        total: documentsCount,
      },
      sessions: {
        total: sessionsCount,
      },
      crm: {
        opportunites: Number(opportunitesStats._count.id),
        montantTotal: opportunitesStats._sum.montantHT || 0,
      },
      clients: {
        entreprises: entreprisesCount,
        apprenants: apprenantsCount,
      },
      recentFormations,
      chartData: last6Months,
    });
  } catch (error) {
    console.error("Erreur stats dashboard:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}
