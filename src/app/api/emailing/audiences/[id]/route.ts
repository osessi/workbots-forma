// ===========================================
// API EMAILING AUDIENCE - Détail/Modifier/Supprimer
// GET /api/emailing/audiences/[id]
// PATCH /api/emailing/audiences/[id]
// DELETE /api/emailing/audiences/[id]
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

// GET - Détail d'une audience avec contacts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const audience = await prisma.emailAudience.findFirst({
      where: {
        id,
        OR: [
          { organizationId: user.organizationId },
          ...(user.isSuperAdmin ? [{ organizationId: null }] : []),
        ],
      },
      include: {
        createdBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!audience) {
      return NextResponse.json({ error: "Audience non trouvée" }, { status: 404 });
    }

    // Filtre contacts
    const contactWhere: {
      audienceId: string;
      status?: "ACTIVE" | "UNSUBSCRIBED" | "BOUNCED" | "COMPLAINED" | "CLEANED";
      OR?: { email?: { contains: string; mode: "insensitive" }; firstName?: { contains: string; mode: "insensitive" }; lastName?: { contains: string; mode: "insensitive" } }[];
    } = {
      audienceId: id,
    };

    if (search) {
      contactWhere.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      contactWhere.status = status as "ACTIVE" | "UNSUBSCRIBED" | "BOUNCED" | "COMPLAINED" | "CLEANED";
    }

    // Contacts avec pagination
    const [contacts, totalContacts] = await Promise.all([
      prisma.emailAudienceContact.findMany({
        where: contactWhere,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          apprenant: {
            select: { id: true, nom: true, prenom: true },
          },
        },
      }),
      prisma.emailAudienceContact.count({ where: contactWhere }),
    ]);

    // Stats par statut
    const statsByStatus = await prisma.emailAudienceContact.groupBy({
      by: ["status"],
      where: { audienceId: id },
      _count: { id: true },
    });

    return NextResponse.json({
      audience,
      contacts,
      pagination: {
        page,
        limit,
        total: totalContacts,
        totalPages: Math.ceil(totalContacts / limit),
      },
      stats: {
        total: totalContacts,
        byStatus: statsByStatus.reduce((acc, s) => {
          acc[s.status] = s._count.id;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error("[API] GET /api/emailing/audiences/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Modifier une audience
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const audience = await prisma.emailAudience.findFirst({
      where: {
        id,
        OR: [
          { organizationId: user.organizationId },
          ...(user.isSuperAdmin ? [{ organizationId: null }] : []),
        ],
      },
    });

    if (!audience) {
      return NextResponse.json({ error: "Audience non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, isDynamic, criteria } = body;

    const updated = await prisma.emailAudience.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isDynamic !== undefined && { isDynamic }),
        ...(criteria !== undefined && { criteria }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[API] PATCH /api/emailing/audiences/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une audience
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const audience = await prisma.emailAudience.findFirst({
      where: {
        id,
        OR: [
          { organizationId: user.organizationId },
          ...(user.isSuperAdmin ? [{ organizationId: null }] : []),
        ],
      },
    });

    if (!audience) {
      return NextResponse.json({ error: "Audience non trouvée" }, { status: 404 });
    }

    // Supprimer (cascade supprime les contacts)
    await prisma.emailAudience.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/emailing/audiences/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
