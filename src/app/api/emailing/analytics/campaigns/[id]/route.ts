// ===========================================
// API EMAILING ANALYTICS CAMPAIGN - Stats détaillées d'une campagne
// GET /api/emailing/analytics/campaigns/[id]
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Récupérer la campagne
    const campaign = await prisma.emailCampaign.findFirst({
      where: {
        id,
        ...(dbUser.role === "SUPER_ADMIN" ? {} : { organizationId: dbUser.organizationId }),
      },
      include: {
        template: { select: { name: true } },
        audience: { select: { name: true, totalContacts: true } },
        analytics: true,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 });
    }

    // Récupérer les envois détaillés
    const sends = await prisma.emailCampaignSend.findMany({
      where: { campaignId: id },
      select: {
        id: true,
        email: true,
        status: true,
        sentAt: true,
        deliveredAt: true,
        openedAt: true,
        clickedAt: true,
        bouncedAt: true,
        openCount: true,
        clickCount: true,
      },
      orderBy: { sentAt: "desc" },
      take: 100,
    });

    // Statistiques d'engagement dans le temps
    const hourlyEngagement: Record<number, { opens: number; clicks: number }> = {};

    sends.forEach((send) => {
      if (send.openedAt) {
        const hour = send.openedAt.getHours();
        if (!hourlyEngagement[hour]) {
          hourlyEngagement[hour] = { opens: 0, clicks: 0 };
        }
        hourlyEngagement[hour].opens++;
      }
      if (send.clickedAt) {
        const hour = send.clickedAt.getHours();
        if (!hourlyEngagement[hour]) {
          hourlyEngagement[hour] = { opens: 0, clicks: 0 };
        }
        hourlyEngagement[hour].clicks++;
      }
    });

    // Distribution des statuts
    const statusDistribution = sends.reduce((acc, send) => {
      acc[send.status] = (acc[send.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Temps de lecture moyen (basé sur les ouvertures)
    const opensWithTime = sends.filter(s => s.openedAt && s.sentAt);
    const avgTimeToOpen = opensWithTime.length > 0
      ? Math.round(
          opensWithTime.reduce((acc, s) => {
            const diff = s.openedAt!.getTime() - s.sentAt!.getTime();
            return acc + diff;
          }, 0) / opensWithTime.length / 1000 / 60 // en minutes
        )
      : 0;

    // Domaines des destinataires
    const domainStats: Record<string, { sent: number; opened: number }> = {};
    sends.forEach((send) => {
      const domain = send.email.split("@")[1] || "unknown";
      if (!domainStats[domain]) {
        domainStats[domain] = { sent: 0, opened: 0 };
      }
      domainStats[domain].sent++;
      if (send.openedAt) domainStats[domain].opened++;
    });

    const topDomains = Object.entries(domainStats)
      .map(([domain, stats]) => ({
        domain,
        sent: stats.sent,
        opened: stats.opened,
        openRate: stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0,
      }))
      .sort((a, b) => b.sent - a.sent)
      .slice(0, 10);

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        status: campaign.status,
        type: campaign.type,
        templateName: campaign.template?.name,
        audienceName: campaign.audience?.name,
        audienceSize: campaign.audience?.totalContacts,
        scheduledAt: campaign.scheduledAt,
        sentAt: campaign.sentAt,
        completedAt: campaign.completedAt,
      },
      kpis: {
        totalSent: campaign.totalSent,
        totalDelivered: campaign.totalDelivered,
        totalOpened: campaign.totalOpened,
        totalClicked: campaign.totalClicked,
        totalBounced: campaign.totalBounced,
        totalUnsubscribed: campaign.totalUnsubscribed,
        openRate: campaign.openRate,
        clickRate: campaign.clickRate,
        bounceRate: campaign.totalSent > 0
          ? Math.round((campaign.totalBounced / campaign.totalSent) * 100)
          : 0,
        deliveryRate: campaign.totalSent > 0
          ? Math.round((campaign.totalDelivered / campaign.totalSent) * 100)
          : 0,
      },
      timing: {
        avgTimeToOpen: avgTimeToOpen, // minutes
        avgTimeToOpenFormatted: avgTimeToOpen > 60
          ? `${Math.round(avgTimeToOpen / 60)}h ${avgTimeToOpen % 60}min`
          : `${avgTimeToOpen}min`,
      },
      engagement: {
        byHour: Object.entries(hourlyEngagement)
          .map(([hour, stats]) => ({
            hour: parseInt(hour),
            ...stats,
          }))
          .sort((a, b) => a.hour - b.hour),
        statusDistribution,
      },
      topDomains,
      recentActivity: sends.slice(0, 20),
      abTest: campaign.abTestEnabled ? {
        variantA: campaign.analytics?.find(a => a.variant === "A"),
        variantB: campaign.analytics?.find(a => a.variant === "B"),
        winner: campaign.abWinner,
      } : null,
    });
  } catch (error) {
    console.error("[API] GET /api/emailing/analytics/campaigns/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
