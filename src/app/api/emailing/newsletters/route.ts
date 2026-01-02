// ===========================================
// API EMAILING NEWSLETTERS - Gestion newsletters
// GET /api/emailing/newsletters - Liste
// POST /api/emailing/newsletters - Créer
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

// GET - Liste des newsletters
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
    const global = searchParams.get("global") === "true" && dbUser.isSuperAdmin;

    const newsletters = await prisma.newsletter.findMany({
      where: global ? {} : { organizationId: dbUser.organizationId },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: {
            subscribers: true,
            issues: true,
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

    // Calculer les stats actifs
    const newslettersWithStats = await Promise.all(
      newsletters.map(async (nl) => {
        const activeCount = await prisma.newsletterSubscriber.count({
          where: {
            newsletterId: nl.id,
            status: "ACTIVE",
            isConfirmed: true,
          },
        });

        return {
          ...nl,
          subscriberCount: nl._count.subscribers,
          activeSubscribers: activeCount,
          issueCount: nl._count.issues,
        };
      })
    );

    return NextResponse.json({
      newsletters: newslettersWithStats,
      total: newsletters.length,
    });
  } catch (error) {
    console.error("[API] GET /api/emailing/newsletters error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une newsletter
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
      fromName,
      fromEmail,
      replyTo,
      doubleOptIn,
      formTitle,
      formDescription,
      formFields,
      formStyle,
      confirmationTitle,
      confirmationMessage,
      importFromApprenants,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    }

    const newsletter = await prisma.newsletter.create({
      data: {
        organizationId: dbUser.isSuperAdmin && !dbUser.organizationId ? null : dbUser.organizationId,
        name,
        description,
        fromName,
        fromEmail,
        replyTo,
        doubleOptIn: doubleOptIn !== false,
        formTitle: formTitle || `Inscription à ${name}`,
        formDescription,
        formFields,
        formStyle,
        confirmationTitle: confirmationTitle || "Inscription confirmée !",
        confirmationMessage: confirmationMessage || "Merci pour votre inscription.",
        createdById: dbUser.id,
      },
    });

    // Importer les apprenants si demandé
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
        },
      });

      if (apprenants.length > 0) {
        const crypto = await import("crypto");

        await prisma.newsletterSubscriber.createMany({
          data: apprenants.map((a) => ({
            newsletterId: newsletter.id,
            email: a.email!,
            firstName: a.prenom,
            lastName: a.nom,
            status: "ACTIVE",
            isConfirmed: true, // Auto-confirmé car import
            confirmedAt: new Date(),
            source: "import_apprenants",
            sourceId: a.id,
            apprenantId: a.id,
            unsubscribeToken: crypto.randomUUID(),
          })),
          skipDuplicates: true,
        });

        await prisma.newsletter.update({
          where: { id: newsletter.id },
          data: {
            subscriberCount: apprenants.length,
            activeCount: apprenants.length,
          },
        });
      }
    }

    return NextResponse.json(newsletter, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/emailing/newsletters error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
