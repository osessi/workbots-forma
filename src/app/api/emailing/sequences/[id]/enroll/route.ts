// ===========================================
// API EMAILING SEQUENCE ENROLL - Inscrire des contacts
// POST /api/emailing/sequences/[id]/enroll - Inscrire des contacts
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

export async function POST(
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

    if (!["ADMIN", "OWNER", "SUPER_ADMIN"].includes(dbUser.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;

    // Vérifier la séquence
    const sequence = await prisma.emailSequence.findFirst({
      where: {
        id,
        organizationId: dbUser.organizationId,
        status: "ACTIVE",
      },
      include: {
        steps: { orderBy: { order: "asc" }, take: 1 },
      },
    });

    if (!sequence) {
      return NextResponse.json({
        error: "Séquence non trouvée ou inactive",
      }, { status: 404 });
    }

    if (sequence.steps.length === 0) {
      return NextResponse.json({
        error: "La séquence n'a pas d'étapes configurées",
      }, { status: 400 });
    }

    const body = await request.json();
    const { contacts, audienceId, apprenantIds } = body;

    const enrollments: Array<{
      email: string;
      name: string;
      apprenantId?: string;
    }> = [];

    // Option 1: Liste de contacts directs
    if (contacts && Array.isArray(contacts)) {
      contacts.forEach((contact: { email: string; name?: string }) => {
        if (contact.email) {
          enrollments.push({
            email: contact.email.toLowerCase(),
            name: contact.name || "",
          });
        }
      });
    }

    // Option 2: Depuis une audience
    if (audienceId) {
      const audienceContacts = await prisma.emailAudienceContact.findMany({
        where: {
          audienceId,
          status: "ACTIVE",
        },
        select: { email: true, firstName: true, lastName: true },
      });

      audienceContacts.forEach((c) => {
        enrollments.push({
          email: c.email.toLowerCase(),
          name: `${c.firstName || ""} ${c.lastName || ""}`.trim(),
        });
      });
    }

    // Option 3: Depuis des apprenants
    if (apprenantIds && Array.isArray(apprenantIds)) {
      const apprenants = await prisma.apprenant.findMany({
        where: {
          id: { in: apprenantIds },
          organizationId: dbUser.organizationId,
        },
        select: { id: true, email: true, prenom: true, nom: true },
      });

      apprenants.forEach((a) => {
        if (a.email) {
          enrollments.push({
            email: a.email.toLowerCase(),
            name: `${a.prenom || ""} ${a.nom || ""}`.trim(),
            apprenantId: a.id,
          });
        }
      });
    }

    if (enrollments.length === 0) {
      return NextResponse.json({
        error: "Aucun contact à inscrire",
      }, { status: 400 });
    }

    // Vérifier les doublons
    const existingEnrollments = await prisma.emailSequenceEnrollment.findMany({
      where: {
        sequenceId: id,
        contactEmail: { in: enrollments.map((e) => e.email) },
        status: { in: ["ACTIVE", "PAUSED"] },
      },
      select: { contactEmail: true },
    });

    const existingEmails = new Set(existingEnrollments.map((e) => e.contactEmail));
    const newEnrollments = enrollments.filter((e) => !existingEmails.has(e.email));

    if (newEnrollments.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Tous les contacts sont déjà inscrits",
        enrolled: 0,
        skipped: enrollments.length,
      });
    }

    // Calculer la date du premier envoi
    const firstStep = sequence.steps[0];
    const firstSendDate = new Date();
    firstSendDate.setDate(firstSendDate.getDate() + (firstStep.delayDays || 0));
    firstSendDate.setHours(firstSendDate.getHours() + (firstStep.delayHours || 0));

    // Créer les inscriptions
    await prisma.emailSequenceEnrollment.createMany({
      data: newEnrollments.map((e) => ({
        sequenceId: id,
        contactEmail: e.email,
        contactName: e.name,
        apprenantId: e.apprenantId,
        status: "ACTIVE",
        currentStep: 1,
        nextSendAt: firstSendDate,
        metadata: {},
      })),
    });

    return NextResponse.json({
      success: true,
      enrolled: newEnrollments.length,
      skipped: enrollments.length - newEnrollments.length,
      nextSendAt: firstSendDate.toISOString(),
    });
  } catch (error) {
    console.error("[API] POST /api/emailing/sequences/[id]/enroll error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
