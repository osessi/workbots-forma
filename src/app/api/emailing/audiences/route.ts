// ===========================================
// API EMAILING AUDIENCES - Gestion des listes
// GET /api/emailing/audiences - Liste
// POST /api/emailing/audiences - Créer
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

// GET - Liste des audiences
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const global = searchParams.get("global") === "true" && user.isSuperAdmin;

    const where: {
      organizationId?: string | null;
      name?: { contains: string; mode: "insensitive" };
    } = global
      ? {}
      : { organizationId: user.organizationId };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const audiences = await prisma.emailAudience.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: {
            contacts: true,
            campaigns: true,
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Calculer les stats actifs pour chaque audience
    const audiencesWithStats = await Promise.all(
      audiences.map(async (audience) => {
        const activeCount = await prisma.emailAudienceContact.count({
          where: {
            audienceId: audience.id,
            status: "ACTIVE",
          },
        });

        return {
          ...audience,
          contactCount: audience._count.contacts,
          activeCount,
          campaignCount: audience._count.campaigns,
        };
      })
    );

    return NextResponse.json({
      audiences: audiencesWithStats,
      total: audiences.length,
    });
  } catch (error) {
    console.error("[API] GET /api/emailing/audiences error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une audience
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
      isDynamic,
      criteria,
      importFromApprenants, // Importer les apprenants existants
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    }

    // Créer l'audience
    const audience = await prisma.emailAudience.create({
      data: {
        organizationId: user.organizationId,
        name,
        description,
        isDynamic: isDynamic || false,
        criteria,
        createdById: user.id,
      },
    });

    // Si demandé, importer les apprenants de l'organisation
    if (importFromApprenants && user.organizationId) {
      const apprenants = await prisma.apprenant.findMany({
        where: {
          organizationId: user.organizationId,
          isActive: true,
          email: { not: undefined, notIn: [""] },
        },
        select: {
          id: true,
          email: true,
          prenom: true,
          nom: true,
          telephone: true,
        },
      });

      if (apprenants.length > 0) {
        await prisma.emailAudienceContact.createMany({
          data: apprenants.map((a) => ({
            audienceId: audience.id,
            email: a.email!,
            firstName: a.prenom,
            lastName: a.nom,
            phone: a.telephone,
            source: "apprenant",
            sourceId: a.id,
            apprenantId: a.id,
            status: "ACTIVE",
            optInAt: new Date(),
            optInSource: "import_apprenants",
          })),
          skipDuplicates: true,
        });

        // Mettre à jour le compteur
        await prisma.emailAudience.update({
          where: { id: audience.id },
          data: {
            contactCount: apprenants.length,
            activeCount: apprenants.length,
          },
        });
      }
    }

    return NextResponse.json(audience, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/emailing/audiences error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
