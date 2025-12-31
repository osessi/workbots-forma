// ===========================================
// API EMAILING DASHBOARD - Statistiques globales
// GET /api/emailing/dashboard
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

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
      select: { id: true, organizationId: true, isSuperAdmin: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Paramètres
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";
    const global = searchParams.get("global") === "true" && dbUser.isSuperAdmin;

    // Calculer la date de début selon la période
    const now = new Date();
    let startDate: Date;
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
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Filtre organisation
    const orgFilter = global ? {} : { organizationId: dbUser.organizationId };

    // Stats emails envoyés (SentEmail)
    const [
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalBounced,
      totalFailed,
    ] = await Promise.all([
      prisma.sentEmail.count({
        where: { ...orgFilter, sentAt: { gte: startDate } },
      }),
      prisma.sentEmail.count({
        where: { ...orgFilter, status: "DELIVERED", sentAt: { gte: startDate } },
      }),
      prisma.sentEmail.count({
        where: { ...orgFilter, status: "OPENED", sentAt: { gte: startDate } },
      }),
      prisma.sentEmail.count({
        where: { ...orgFilter, status: "CLICKED", sentAt: { gte: startDate } },
      }),
      prisma.sentEmail.count({
        where: { ...orgFilter, status: "BOUNCED", sentAt: { gte: startDate } },
      }),
      prisma.sentEmail.count({
        where: { ...orgFilter, status: "FAILED", sentAt: { gte: startDate } },
      }),
    ]);

    // Stats campagnes
    const [
      totalCampaigns,
      activeCampaigns,
      campaignStats,
    ] = await Promise.all([
      prisma.emailCampaign.count({
        where: global ? {} : { organizationId: dbUser.organizationId },
      }),
      prisma.emailCampaign.count({
        where: {
          ...(global ? {} : { organizationId: dbUser.organizationId }),
          status: { in: ["SCHEDULED", "SENDING"] },
        },
      }),
      prisma.emailCampaign.aggregate({
        where: {
          ...(global ? {} : { organizationId: dbUser.organizationId }),
          sentAt: { gte: startDate },
        },
        _sum: {
          sentCount: true,
          deliveredCount: true,
          openedCount: true,
          clickedCount: true,
          bouncedCount: true,
          unsubscribedCount: true,
        },
      }),
    ]);

    // Stats audiences
    const [totalAudiences, totalContacts, activeContacts] = await Promise.all([
      prisma.emailAudience.count({
        where: global ? {} : { organizationId: dbUser.organizationId },
      }),
      prisma.emailAudienceContact.count({
        where: {
          audience: global ? {} : { organizationId: dbUser.organizationId },
        },
      }),
      prisma.emailAudienceContact.count({
        where: {
          audience: global ? {} : { organizationId: dbUser.organizationId },
          status: "ACTIVE",
        },
      }),
    ]);

    // Stats newsletters
    const [totalNewsletters, totalSubscribers, activeSubscribers] = await Promise.all([
      prisma.newsletter.count({
        where: global ? {} : { organizationId: dbUser.organizationId },
      }),
      prisma.newsletterSubscriber.count({
        where: {
          newsletter: global ? {} : { organizationId: dbUser.organizationId },
        },
      }),
      prisma.newsletterSubscriber.count({
        where: {
          newsletter: global ? {} : { organizationId: dbUser.organizationId },
          status: "ACTIVE",
          isConfirmed: true,
        },
      }),
    ]);

    // Évolution par jour (7 derniers jours)
    const dailyStats = await prisma.sentEmail.groupBy({
      by: ["sentAt"],
      where: {
        ...orgFilter,
        sentAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
      _count: { id: true },
    });

    // Emails par type
    const emailsByType = await prisma.sentEmail.groupBy({
      by: ["type"],
      where: { ...orgFilter, sentAt: { gte: startDate } },
      _count: { id: true },
    });

    // Derniers emails
    const recentEmails = await prisma.sentEmail.findMany({
      where: orgFilter,
      orderBy: { sentAt: "desc" },
      take: 10,
      select: {
        id: true,
        toEmail: true,
        toName: true,
        subject: true,
        type: true,
        status: true,
        sentAt: true,
      },
    });

    // Dernières campagnes
    const recentCampaigns = await prisma.emailCampaign.findMany({
      where: global ? {} : { organizationId: dbUser.organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        sentCount: true,
        openedCount: true,
        clickedCount: true,
        sentAt: true,
        createdAt: true,
      },
    });

    // Calculer les taux
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;

    return NextResponse.json({
      overview: {
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        totalBounced,
        totalFailed,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
        stats: {
          sent: campaignStats._sum.sentCount || 0,
          delivered: campaignStats._sum.deliveredCount || 0,
          opened: campaignStats._sum.openedCount || 0,
          clicked: campaignStats._sum.clickedCount || 0,
          bounced: campaignStats._sum.bouncedCount || 0,
          unsubscribed: campaignStats._sum.unsubscribedCount || 0,
        },
      },
      audiences: {
        total: totalAudiences,
        totalContacts,
        activeContacts,
      },
      newsletters: {
        total: totalNewsletters,
        totalSubscribers,
        activeSubscribers,
      },
      emailsByType: emailsByType.reduce((acc, item) => {
        acc[item.type] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      recentEmails,
      recentCampaigns,
      period,
      isGlobal: global,
    });
  } catch (error) {
    console.error("[API] GET /api/emailing/dashboard error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
