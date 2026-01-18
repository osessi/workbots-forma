// ===========================================
// API EMAILING SETTINGS - Configuration
// GET /api/emailing/settings - Obtenir les paramètres
// PATCH /api/emailing/settings - Mettre à jour
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

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
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Configuration SMTP personnalisée
    const smtpConfig = await prisma.emailSmtpConfig.findUnique({
      where: { organizationId: user.organizationId },
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
      where: { organizationId: user.organizationId },
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
      where: { id: user.organizationId },
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
          { organizationId: user.organizationId },
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
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Vérifier les droits (admin ou owner)
    if (!["ADMIN", "OWNER", "SUPER_ADMIN", "ORG_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { defaultFromEmail, defaultFromName, defaultReplyTo } = body;

    // Mettre à jour ou créer la config SMTP
    const smtpConfig = await prisma.emailSmtpConfig.upsert({
      where: { organizationId: user.organizationId },
      update: {
        fromEmail: defaultFromEmail,
        fromName: defaultFromName,
        replyTo: defaultReplyTo,
        updatedAt: new Date(),
      },
      create: {
        organizationId: user.organizationId,
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
