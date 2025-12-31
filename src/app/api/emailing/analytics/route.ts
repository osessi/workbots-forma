// ===========================================
// API EMAILING ANALYTICS - Statistiques détaillées
// GET /api/emailing/analytics - Dashboard analytics complet
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

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

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true, role: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";
    const global = searchParams.get("global") === "true" && dbUser.role === "SUPER_ADMIN";

    // Calculer les dates de période
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const whereOrg = global ? {} : { organizationId: dbUser.organizationId };

    // ===========================================
    // KPIs globaux
    // ===========================================
    const [
      totalEmails,
      deliveredEmails,
      openedEmails,
      clickedEmails,
      bouncedEmails,
      complainedEmails,
    ] = await Promise.all([
      prisma.sentEmail.count({
        where: { ...whereOrg, sentAt: { gte: startDate } },
      }),
      prisma.sentEmail.count({
        where: { ...whereOrg, sentAt: { gte: startDate }, status: "DELIVERED" },
      }),
      prisma.sentEmail.count({
        where: { ...whereOrg, sentAt: { gte: startDate }, openedAt: { not: null } },
      }),
      prisma.sentEmail.count({
        where: { ...whereOrg, sentAt: { gte: startDate }, clickedAt: { not: null } },
      }),
      prisma.sentEmail.count({
        where: { ...whereOrg, sentAt: { gte: startDate }, status: "BOUNCED" },
      }),
      prisma.sentEmail.count({
        where: { ...whereOrg, sentAt: { gte: startDate }, status: "COMPLAINED" },
      }),
    ]);

    // ===========================================
    // Évolution dans le temps (par jour)
    // ===========================================
    const emailsOverTime = await prisma.sentEmail.groupBy({
      by: ["sentAt"],
      where: { ...whereOrg, sentAt: { gte: startDate } },
      _count: { id: true },
    });

    // Grouper par jour
    const dailyStats: Record<string, { sent: number; opened: number; clicked: number }> = {};
    const emails = await prisma.sentEmail.findMany({
      where: { ...whereOrg, sentAt: { gte: startDate } },
      select: { sentAt: true, openedAt: true, clickedAt: true },
    });

    emails.forEach((email) => {
      const day = email.sentAt.toISOString().split("T")[0];
      if (!dailyStats[day]) {
        dailyStats[day] = { sent: 0, opened: 0, clicked: 0 };
      }
      dailyStats[day].sent++;
      if (email.openedAt) dailyStats[day].opened++;
      if (email.clickedAt) dailyStats[day].clicked++;
    });

    const timeline = Object.entries(dailyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date,
        ...stats,
        openRate: stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0,
        clickRate: stats.opened > 0 ? Math.round((stats.clicked / stats.opened) * 100) : 0,
      }));

    // ===========================================
    // Stats par type d'email
    // ===========================================
    const statsByType = await prisma.sentEmail.groupBy({
      by: ["type"],
      where: { ...whereOrg, sentAt: { gte: startDate } },
      _count: { id: true },
    });

    const opensByType = await prisma.sentEmail.groupBy({
      by: ["type"],
      where: { ...whereOrg, sentAt: { gte: startDate }, openedAt: { not: null } },
      _count: { id: true },
    });

    const typeStats = statsByType.map((t) => {
      const opens = opensByType.find((o) => o.type === t.type)?._count.id || 0;
      return {
        type: t.type,
        sent: t._count.id,
        opened: opens,
        openRate: t._count.id > 0 ? Math.round((opens / t._count.id) * 100) : 0,
      };
    });

    // ===========================================
    // Top campagnes
    // ===========================================
    const topCampaigns = await prisma.emailCampaign.findMany({
      where: {
        ...whereOrg,
        status: "SENT",
        scheduledAt: { gte: startDate },
      },
      orderBy: { totalOpened: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        subject: true,
        totalSent: true,
        totalDelivered: true,
        totalOpened: true,
        totalClicked: true,
        openRate: true,
        clickRate: true,
        scheduledAt: true,
      },
    });

    // ===========================================
    // Performance des templates
    // ===========================================
    const templatePerformance = await prisma.emailTemplate.findMany({
      where: global ? {} : { organizationId: dbUser.organizationId },
      select: {
        id: true,
        name: true,
        category: true,
        usageCount: true,
        lastUsedAt: true,
      },
      orderBy: { usageCount: "desc" },
      take: 10,
    });

    // ===========================================
    // Audiences et engagement
    // ===========================================
    const audiences = await prisma.emailAudience.findMany({
      where: global ? {} : { organizationId: dbUser.organizationId },
      select: {
        id: true,
        name: true,
        totalContacts: true,
        activeContacts: true,
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
      orderBy: { totalContacts: "desc" },
      take: 10,
    });

    // ===========================================
    // Newsletters performance
    // ===========================================
    const newsletters = await prisma.newsletter.findMany({
      where: global ? {} : { organizationId: dbUser.organizationId },
      select: {
        id: true,
        name: true,
        activeCount: true,
        totalSent: true,
        totalOpened: true,
        totalClicked: true,
        averageOpenRate: true,
        averageClickRate: true,
      },
      orderBy: { activeCount: "desc" },
      take: 5,
    });

    // ===========================================
    // Réponse
    // ===========================================
    return NextResponse.json({
      period,
      global,
      kpis: {
        totalSent: totalEmails,
        delivered: deliveredEmails,
        opened: openedEmails,
        clicked: clickedEmails,
        bounced: bouncedEmails,
        complained: complainedEmails,
        deliveryRate: totalEmails > 0 ? Math.round((deliveredEmails / totalEmails) * 100) : 0,
        openRate: deliveredEmails > 0 ? Math.round((openedEmails / deliveredEmails) * 100) : 0,
        clickRate: openedEmails > 0 ? Math.round((clickedEmails / openedEmails) * 100) : 0,
        bounceRate: totalEmails > 0 ? Math.round((bouncedEmails / totalEmails) * 100) : 0,
        complaintRate: totalEmails > 0 ? Math.round((complainedEmails / totalEmails) * 1000) / 10 : 0,
      },
      timeline,
      byType: typeStats,
      topCampaigns,
      templatePerformance,
      audiences: audiences.map((a) => ({
        ...a,
        campaignCount: a._count.campaigns,
      })),
      newsletters,
      benchmarks: {
        industryOpenRate: 21.5,
        industryClickRate: 2.3,
        industryBounceRate: 0.4,
        industryUnsubscribeRate: 0.1,
      },
    });
  } catch (error) {
    console.error("[API] GET /api/emailing/analytics error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
