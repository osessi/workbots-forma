// ===========================================
// API EMAILING CONTACTS - Gestion des contacts d'une audience
// GET /api/emailing/audiences/[id]/contacts - Liste
// POST /api/emailing/audiences/[id]/contacts - Ajouter
// DELETE /api/emailing/audiences/[id]/contacts - Supprimer en masse
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

// POST - Ajouter des contacts
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: audienceId } = await params;
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

    // Vérifier l'accès à l'audience
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

    const body = await request.json();
    const { contacts, source } = body;

    // contacts peut être un seul contact ou un tableau
    const contactsArray = Array.isArray(contacts) ? contacts : [contacts];

    if (contactsArray.length === 0) {
      return NextResponse.json({ error: "Aucun contact fourni" }, { status: 400 });
    }

    let added = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const contact of contactsArray) {
      if (!contact.email) {
        errors.push(`Contact sans email ignoré`);
        skipped++;
        continue;
      }

      // Valider l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact.email)) {
        errors.push(`Email invalide: ${contact.email}`);
        skipped++;
        continue;
      }

      try {
        await prisma.emailAudienceContact.upsert({
          where: {
            audienceId_email: {
              audienceId,
              email: contact.email.toLowerCase().trim(),
            },
          },
          create: {
            audienceId,
            email: contact.email.toLowerCase().trim(),
            firstName: contact.firstName || contact.prenom,
            lastName: contact.lastName || contact.nom,
            phone: contact.phone || contact.telephone,
            customFields: contact.customFields,
            tags: contact.tags || [],
            source: source || "manual",
            sourceId: contact.sourceId,
            apprenantId: contact.apprenantId,
            status: "ACTIVE",
            optInAt: new Date(),
            optInSource: source || "manual",
          },
          update: {
            firstName: contact.firstName || contact.prenom,
            lastName: contact.lastName || contact.nom,
            phone: contact.phone || contact.telephone,
            customFields: contact.customFields,
            // Ne pas écraser les tags existants si pas fournis
            ...(contact.tags && { tags: contact.tags }),
          },
        });
        added++;
      } catch (err) {
        console.error(`Erreur ajout contact ${contact.email}:`, err);
        errors.push(`Erreur pour ${contact.email}`);
        skipped++;
      }
    }

    // Mettre à jour les compteurs de l'audience
    const [totalCount, activeCount] = await Promise.all([
      prisma.emailAudienceContact.count({ where: { audienceId } }),
      prisma.emailAudienceContact.count({ where: { audienceId, status: "ACTIVE" } }),
    ]);

    await prisma.emailAudience.update({
      where: { id: audienceId },
      data: { contactCount: totalCount, activeCount },
    });

    return NextResponse.json({
      success: true,
      added,
      skipped,
      total: totalCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[API] POST /api/emailing/audiences/[id]/contacts error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer des contacts
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: audienceId } = await params;
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

    const body = await request.json();
    const { contactIds, emails } = body;

    let deleted = 0;

    if (contactIds && contactIds.length > 0) {
      const result = await prisma.emailAudienceContact.deleteMany({
        where: {
          audienceId,
          id: { in: contactIds },
        },
      });
      deleted = result.count;
    } else if (emails && emails.length > 0) {
      const result = await prisma.emailAudienceContact.deleteMany({
        where: {
          audienceId,
          email: { in: emails.map((e: string) => e.toLowerCase().trim()) },
        },
      });
      deleted = result.count;
    } else {
      return NextResponse.json(
        { error: "Fournir contactIds ou emails" },
        { status: 400 }
      );
    }

    // Mettre à jour les compteurs
    const [totalCount, activeCount] = await Promise.all([
      prisma.emailAudienceContact.count({ where: { audienceId } }),
      prisma.emailAudienceContact.count({ where: { audienceId, status: "ACTIVE" } }),
    ]);

    await prisma.emailAudience.update({
      where: { id: audienceId },
      data: { contactCount: totalCount, activeCount },
    });

    return NextResponse.json({
      success: true,
      deleted,
      remaining: totalCount,
    });
  } catch (error) {
    console.error("[API] DELETE /api/emailing/audiences/[id]/contacts error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
