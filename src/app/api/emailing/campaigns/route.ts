// ===========================================
// API EMAILING CAMPAIGNS - Campagnes bulk
// GET /api/emailing/campaigns - Liste
// POST /api/emailing/campaigns - Créer
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { EmailCampaignStatus, EmailCampaignType } from "@prisma/client";

// GET - Liste des campagnes
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as EmailCampaignStatus | null;
    const type = searchParams.get("type") as EmailCampaignType | null;
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const global = searchParams.get("global") === "true" && user.isSuperAdmin;

    const where: {
      organizationId?: string | null;
      status?: EmailCampaignStatus;
      type?: EmailCampaignType;
      name?: { contains: string; mode: "insensitive" };
    } = global
      ? {}
      : { organizationId: user.organizationId };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const [campaigns, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          template: {
            select: { id: true, name: true },
          },
          audience: {
            select: { id: true, name: true, contactCount: true },
          },
          createdBy: {
            select: { firstName: true, lastName: true },
          },
          organization: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.emailCampaign.count({ where }),
    ]);

    // Stats par statut
    const statsByStatus = await prisma.emailCampaign.groupBy({
      by: ["status"],
      where: global ? {} : { organizationId: user.organizationId },
      _count: { id: true },
    });

    return NextResponse.json({
      campaigns: campaigns.map((c) => ({
        ...c,
        openRate: c.deliveredCount > 0 ? (c.openedCount / c.deliveredCount) * 100 : 0,
        clickRate: c.openedCount > 0 ? (c.clickedCount / c.openedCount) * 100 : 0,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        byStatus: statsByStatus.reduce((acc, s) => {
          acc[s.status] = s._count.id;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error("[API] GET /api/emailing/campaigns error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une campagne
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      type = "ONE_TIME",
      templateId,
      subject,
      htmlContent,
      textContent,
      audienceId,
      fromName,
      fromEmail,
      replyTo,
      scheduledAt,
      isAbTest,
      abTestConfig,
      sendRate,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    }

    if (!templateId && !htmlContent) {
      return NextResponse.json(
        { error: "Template ou contenu HTML requis" },
        { status: 400 }
      );
    }

    // Vérifier l'audience si fournie
    let totalRecipients = 0;
    if (audienceId) {
      const audience = await prisma.emailAudience.findFirst({
        where: {
          id: audienceId,
          OR: [
            { organizationId: user.organizationId },
            ...(user.isSuperAdmin ? [{ organizationId: null }] : []),
          ],
        },
      });

      if (!audience) {
        return NextResponse.json({ error: "Audience non trouvée" }, { status: 404 });
      }

      totalRecipients = audience.activeCount || 0;
    }

    // Vérifier le template si fourni
    if (templateId) {
      const template = await prisma.emailTemplate.findFirst({
        where: {
          id: templateId,
          OR: [
            { organizationId: user.organizationId },
            { isGlobal: true },
          ],
        },
      });

      if (!template) {
        return NextResponse.json({ error: "Template non trouvé" }, { status: 404 });
      }
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        organizationId: user.isSuperAdmin && !user.organizationId ? null : user.organizationId,
        name,
        description,
        type: type as EmailCampaignType,
        status: "DRAFT",
        templateId,
        subject,
        htmlContent,
        textContent,
        audienceId,
        fromName,
        fromEmail,
        replyTo,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        isAbTest: isAbTest || false,
        abTestConfig,
        sendRate,
        totalRecipients,
        createdById: user.id,
      },
      include: {
        template: { select: { id: true, name: true } },
        audience: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/emailing/campaigns error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
