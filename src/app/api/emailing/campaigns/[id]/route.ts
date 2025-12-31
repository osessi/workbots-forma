// ===========================================
// API EMAILING CAMPAIGN - Détail/Modifier/Supprimer
// GET /api/emailing/campaigns/[id]
// PATCH /api/emailing/campaigns/[id]
// DELETE /api/emailing/campaigns/[id]
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

// GET - Détail d'une campagne avec stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const campaign = await prisma.emailCampaign.findFirst({
      where: {
        id,
        OR: [
          { organizationId: dbUser.organizationId },
          ...(dbUser.isSuperAdmin ? [{ organizationId: null }] : []),
        ],
      },
      include: {
        template: true,
        audience: {
          include: {
            _count: { select: { contacts: true } },
          },
        },
        createdBy: {
          select: { firstName: true, lastName: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 });
    }

    // Stats des envois
    const sendStats = await prisma.emailCampaignSend.groupBy({
      by: ["status"],
      where: { campaignId: id },
      _count: { id: true },
    });

    // Top liens cliqués
    const topLinks = await prisma.emailCampaignAnalytics.findMany({
      where: { campaignId: id },
      select: { linkClicks: true },
    });

    const linkClicksAgg: Record<string, number> = {};
    for (const analytics of topLinks) {
      if (analytics.linkClicks) {
        const clicks = analytics.linkClicks as Record<string, number>;
        for (const [link, count] of Object.entries(clicks)) {
          linkClicksAgg[link] = (linkClicksAgg[link] || 0) + count;
        }
      }
    }

    // Derniers envois
    const recentSends = await prisma.emailCampaignSend.findMany({
      where: { campaignId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        email: true,
        status: true,
        sentAt: true,
        openedAt: true,
        clickedAt: true,
        openCount: true,
        clickCount: true,
      },
    });

    return NextResponse.json({
      campaign: {
        ...campaign,
        openRate: campaign.deliveredCount > 0
          ? Math.round((campaign.openedCount / campaign.deliveredCount) * 10000) / 100
          : 0,
        clickRate: campaign.openedCount > 0
          ? Math.round((campaign.clickedCount / campaign.openedCount) * 10000) / 100
          : 0,
        bounceRate: campaign.sentCount > 0
          ? Math.round((campaign.bouncedCount / campaign.sentCount) * 10000) / 100
          : 0,
      },
      stats: {
        byStatus: sendStats.reduce((acc, s) => {
          acc[s.status] = s._count.id;
          return acc;
        }, {} as Record<string, number>),
        topLinks: Object.entries(linkClicksAgg)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([link, count]) => ({ link, count })),
      },
      recentSends,
    });
  } catch (error) {
    console.error("[API] GET /api/emailing/campaigns/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Modifier une campagne
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const campaign = await prisma.emailCampaign.findFirst({
      where: {
        id,
        OR: [
          { organizationId: dbUser.organizationId },
          ...(dbUser.isSuperAdmin ? [{ organizationId: null }] : []),
        ],
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 });
    }

    // Ne pas modifier une campagne déjà envoyée
    if (campaign.status === "SENT" || campaign.status === "SENDING") {
      return NextResponse.json(
        { error: "Impossible de modifier une campagne en cours ou terminée" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      templateId,
      subject,
      htmlContent,
      textContent,
      audienceId,
      fromName,
      fromEmail,
      replyTo,
      scheduledAt,
      status,
      isAbTest,
      abTestConfig,
      sendRate,
    } = body;

    // Si changement d'audience, recalculer le nombre de destinataires
    let totalRecipients = campaign.totalRecipients;
    if (audienceId && audienceId !== campaign.audienceId) {
      const audience = await prisma.emailAudience.findFirst({
        where: {
          id: audienceId,
          OR: [
            { organizationId: dbUser.organizationId },
            ...(dbUser.isSuperAdmin ? [{ organizationId: null }] : []),
          ],
        },
      });

      if (!audience) {
        return NextResponse.json({ error: "Audience non trouvée" }, { status: 404 });
      }

      totalRecipients = audience.activeCount || 0;
    }

    const updated = await prisma.emailCampaign.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(templateId !== undefined && { templateId }),
        ...(subject !== undefined && { subject }),
        ...(htmlContent !== undefined && { htmlContent }),
        ...(textContent !== undefined && { textContent }),
        ...(audienceId !== undefined && { audienceId, totalRecipients }),
        ...(fromName !== undefined && { fromName }),
        ...(fromEmail !== undefined && { fromEmail }),
        ...(replyTo !== undefined && { replyTo }),
        ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
        ...(status !== undefined && { status }),
        ...(isAbTest !== undefined && { isAbTest }),
        ...(abTestConfig !== undefined && { abTestConfig }),
        ...(sendRate !== undefined && { sendRate }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[API] PATCH /api/emailing/campaigns/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une campagne
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const campaign = await prisma.emailCampaign.findFirst({
      where: {
        id,
        OR: [
          { organizationId: dbUser.organizationId },
          ...(dbUser.isSuperAdmin ? [{ organizationId: null }] : []),
        ],
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 });
    }

    // Ne pas supprimer une campagne en cours d'envoi
    if (campaign.status === "SENDING") {
      return NextResponse.json(
        { error: "Impossible de supprimer une campagne en cours d'envoi" },
        { status: 400 }
      );
    }

    await prisma.emailCampaign.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/emailing/campaigns/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
