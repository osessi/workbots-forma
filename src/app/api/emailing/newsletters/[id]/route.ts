// ===========================================
// API NEWSLETTER - Détail/Modifier/Supprimer
// GET /api/emailing/newsletters/[id]
// PATCH /api/emailing/newsletters/[id]
// DELETE /api/emailing/newsletters/[id]
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

// GET - Détail newsletter avec abonnés et issues
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

    const newsletter = await prisma.newsletter.findFirst({
      where: {
        id,
        OR: [
          { organizationId: dbUser.organizationId },
          ...(dbUser.isSuperAdmin ? [{ organizationId: null }] : []),
        ],
      },
      include: {
        createdBy: {
          select: { firstName: true, lastName: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    if (!newsletter) {
      return NextResponse.json({ error: "Newsletter non trouvée" }, { status: 404 });
    }

    // Stats abonnés
    const subscriberStats = await prisma.newsletterSubscriber.groupBy({
      by: ["status"],
      where: { newsletterId: id },
      _count: { id: true },
    });

    const confirmedCount = await prisma.newsletterSubscriber.count({
      where: { newsletterId: id, isConfirmed: true, status: "ACTIVE" },
    });

    // Dernières issues
    const recentIssues = await prisma.newsletterIssue.findMany({
      where: { newsletterId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        subject: true,
        status: true,
        scheduledAt: true,
        sentAt: true,
        recipientCount: true,
        openedCount: true,
        clickedCount: true,
        createdAt: true,
      },
    });

    // Derniers abonnés
    const recentSubscribers = await prisma.newsletterSubscriber.findMany({
      where: { newsletterId: id },
      orderBy: { subscribedAt: "desc" },
      take: 10,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        isConfirmed: true,
        subscribedAt: true,
        source: true,
      },
    });

    return NextResponse.json({
      newsletter,
      stats: {
        total: subscriberStats.reduce((acc, s) => acc + s._count.id, 0),
        byStatus: subscriberStats.reduce((acc, s) => {
          acc[s.status] = s._count.id;
          return acc;
        }, {} as Record<string, number>),
        confirmed: confirmedCount,
        issueCount: recentIssues.length,
      },
      recentIssues,
      recentSubscribers,
    });
  } catch (error) {
    console.error("[API] GET /api/emailing/newsletters/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Modifier une newsletter
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

    const newsletter = await prisma.newsletter.findFirst({
      where: {
        id,
        OR: [
          { organizationId: dbUser.organizationId },
          ...(dbUser.isSuperAdmin ? [{ organizationId: null }] : []),
        ],
      },
    });

    if (!newsletter) {
      return NextResponse.json({ error: "Newsletter non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      description,
      fromName,
      fromEmail,
      replyTo,
      doubleOptIn,
      formEnabled,
      formTitle,
      formDescription,
      formFields,
      formStyle,
      confirmationTitle,
      confirmationMessage,
    } = body;

    const updated = await prisma.newsletter.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(fromName !== undefined && { fromName }),
        ...(fromEmail !== undefined && { fromEmail }),
        ...(replyTo !== undefined && { replyTo }),
        ...(doubleOptIn !== undefined && { doubleOptIn }),
        ...(formEnabled !== undefined && { formEnabled }),
        ...(formTitle !== undefined && { formTitle }),
        ...(formDescription !== undefined && { formDescription }),
        ...(formFields !== undefined && { formFields }),
        ...(formStyle !== undefined && { formStyle }),
        ...(confirmationTitle !== undefined && { confirmationTitle }),
        ...(confirmationMessage !== undefined && { confirmationMessage }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[API] PATCH /api/emailing/newsletters/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une newsletter
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

    const newsletter = await prisma.newsletter.findFirst({
      where: {
        id,
        OR: [
          { organizationId: dbUser.organizationId },
          ...(dbUser.isSuperAdmin ? [{ organizationId: null }] : []),
        ],
      },
    });

    if (!newsletter) {
      return NextResponse.json({ error: "Newsletter non trouvée" }, { status: 404 });
    }

    await prisma.newsletter.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/emailing/newsletters/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
