// ===========================================
// API EMAILING DOMAINS - Gestion des domaines
// GET /api/emailing/settings/domains - Liste des domaines
// POST /api/emailing/settings/domains - Ajouter un domaine
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

// ===========================================
// GET - Liste des domaines
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

    const domains = await prisma.emailDomain.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: "desc" },
    });

    // Extraire les statuts de vérification depuis dnsRecords
    const extractVerificationStatus = (dnsRecords: unknown) => {
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
    };

    return NextResponse.json({
      domains: domains.map((d) => ({
        id: d.id,
        domain: d.domain,
        status: d.status,
        ...extractVerificationStatus(d.dnsRecords),
        dnsRecords: d.dnsRecords,
        createdAt: d.createdAt,
        verifiedAt: d.verifiedAt,
      })),
    });
  } catch (error) {
    console.error("[API] GET /api/emailing/settings/domains error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// POST - Ajouter un domaine
// ===========================================

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    if (!["ADMIN", "OWNER", "SUPER_ADMIN", "ORG_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json({ error: "Domaine requis" }, { status: 400 });
    }

    // Validation du format domaine
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ error: "Format de domaine invalide" }, { status: 400 });
    }

    // Vérifier si le domaine existe déjà
    const existing = await prisma.emailDomain.findFirst({
      where: {
        domain: domain.toLowerCase(),
        organizationId: user.organizationId,
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Ce domaine est déjà configuré" }, { status: 400 });
    }

    // Ajouter le domaine à Resend
    let resendDomain = null;
    let dnsRecords = null;

    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const result = await resend.domains.create({ name: domain.toLowerCase() });

      if (result.data) {
        resendDomain = result.data;
        dnsRecords = result.data.records;
      }
    } catch (resendError) {
      console.error("Resend domain creation error:", resendError);
      // Continuer sans Resend - l'utilisateur devra configurer manuellement
    }

    // Créer le domaine en base
    const emailDomain = await prisma.emailDomain.create({
      data: {
        organizationId: user.organizationId,
        domain: domain.toLowerCase(),
        resendDomainId: resendDomain?.id || null,
        status: "PENDING",
        dnsRecords: (dnsRecords || generateDefaultDnsRecords(domain)) as object,
      },
    });

    return NextResponse.json({
      success: true,
      domain: {
        id: emailDomain.id,
        domain: emailDomain.domain,
        status: emailDomain.status,
        dnsRecords: emailDomain.dnsRecords,
      },
      message: "Domaine ajouté. Configurez les enregistrements DNS pour le vérifier.",
    });
  } catch (error) {
    console.error("[API] POST /api/emailing/settings/domains error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Générer les enregistrements DNS par défaut
function generateDefaultDnsRecords(domain: string) {
  return [
    {
      type: "TXT",
      name: `resend._domainkey.${domain}`,
      value: "Pending verification",
      status: "pending",
      purpose: "DKIM",
    },
    {
      type: "TXT",
      name: domain,
      value: `v=spf1 include:resend.com ~all`,
      status: "pending",
      purpose: "SPF",
    },
    {
      type: "TXT",
      name: `_dmarc.${domain}`,
      value: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`,
      status: "pending",
      purpose: "DMARC",
    },
  ];
}
