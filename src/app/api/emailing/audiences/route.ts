// ===========================================
// API EMAILING AUDIENCES - Gestion des listes
// GET /api/emailing/audiences - Liste
// POST /api/emailing/audiences - Créer
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

// GET - Liste des audiences
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const global = searchParams.get("global") === "true" && dbUser.isSuperAdmin;

    const where: {
      organizationId?: string | null;
      name?: { contains: string; mode: "insensitive" };
    } = global
      ? {}
      : { organizationId: dbUser.organizationId };

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
        organizationId: dbUser.organizationId,
        name,
        description,
        isDynamic: isDynamic || false,
        criteria,
        createdById: dbUser.id,
      },
    });

    // Si demandé, importer les apprenants de l'organisation
    if (importFromApprenants && dbUser.organizationId) {
      const apprenants = await prisma.apprenant.findMany({
        where: {
          organizationId: dbUser.organizationId,
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
