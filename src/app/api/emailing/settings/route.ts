// ===========================================
// API EMAILING SETTINGS - Configuration
// GET /api/emailing/settings - Obtenir les paramètres
// PATCH /api/emailing/settings - Mettre à jour
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

// Extraire les statuts de vérification depuis dnsRecords
function extractVerificationStatus(dnsRecords: unknown) {
  const records = dnsRecords as Array<{ type?: string; name?: string; status?: string }> | null;
  if (!records || !Array.isArray(records)) {
    return { dkimVerified: false, spfVerified: false, dmarcVerified: false };
  }

  const dkimRecord = records.find((r) => r.type === "TXT" && r.name?.includes("_domainkey"));
  const spfRecord = records.find((r) => r.type === "TXT" && !r.name?.includes("_domainkey") && !r.name?.includes("_dmarc"));
  const dmarcRecord = records.find((r) => r.type === "TXT" && r.name?.includes("_dmarc"));

  return {
    dkimVerified: dkimRecord?.status === "verified",
    spfVerified: spfRecord?.status === "verified",
    dmarcVerified: dmarcRecord?.status === "verified",
  };
}

// ===========================================
// GET - Obtenir les paramètres emailing
// ===========================================

export async function GET() {
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

    // Configuration SMTP personnalisée
    const smtpConfig = await prisma.emailSmtpConfig.findUnique({
      where: { organizationId: dbUser.organizationId },
      select: {
        id: true,
        provider: true,
        fromEmail: true,
        fromName: true,
        replyTo: true,
        isDomainVerified: true,
        isActive: true,
        createdAt: true,
        lastTestedAt: true,
        // Ne pas exposer les credentials
      },
    });

    // Domaines configurés
    const domains = await prisma.emailDomain.findMany({
      where: { organizationId: dbUser.organizationId },
      select: {
        id: true,
        domain: true,
        status: true,
        dnsRecords: true,
        createdAt: true,
        verifiedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Organisation pour infos générales
    const organization = await prisma.organization.findUnique({
      where: { id: dbUser.organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        adresse: true,
      },
    });

    // Templates par défaut
    const defaultTemplates = await prisma.emailTemplate.findMany({
      where: {
        OR: [
          { organizationId: dbUser.organizationId },
          { isGlobal: true },
        ],
      },
      select: {
        id: true,
        name: true,
        category: true,
        isGlobal: true,
      },
      take: 10,
    });

    return NextResponse.json({
      smtp: smtpConfig ? {
        ...smtpConfig,
        isVerified: smtpConfig.isDomainVerified,
      } : null,
      domains: domains.map((d) => ({
        ...d,
        ...extractVerificationStatus(d.dnsRecords),
      })),
      organization,
      defaultTemplates,
      limits: {
        emailsPerDay: 10000,
        emailsPerHour: 1000,
        contactsPerAudience: 50000,
        campaignsPerMonth: 100,
      },
      features: {
        customSmtp: true,
        customDomain: true,
        abTesting: true,
        sequences: true,
        webhooks: true,
      },
    });
  } catch (error) {
    console.error("[API] GET /api/emailing/settings error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// PATCH - Mettre à jour les paramètres
// ===========================================

export async function PATCH(request: NextRequest) {
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

    // Vérifier les droits (admin ou owner)
    if (!["ADMIN", "OWNER", "SUPER_ADMIN"].includes(dbUser.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { defaultFromEmail, defaultFromName, defaultReplyTo } = body;

    // Mettre à jour ou créer la config SMTP
    const smtpConfig = await prisma.emailSmtpConfig.upsert({
      where: { organizationId: dbUser.organizationId },
      update: {
        fromEmail: defaultFromEmail,
        fromName: defaultFromName,
        replyTo: defaultReplyTo,
        updatedAt: new Date(),
      },
      create: {
        organizationId: dbUser.organizationId,
        provider: "resend",
        fromEmail: defaultFromEmail || "",
        fromName: defaultFromName || "",
        replyTo: defaultReplyTo,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      smtp: {
        id: smtpConfig.id,
        fromEmail: smtpConfig.fromEmail,
        fromName: smtpConfig.fromName,
        replyTo: smtpConfig.replyTo,
        isActive: smtpConfig.isActive,
      },
    });
  } catch (error) {
    console.error("[API] PATCH /api/emailing/settings error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
