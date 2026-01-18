// ===========================================
// API EMAILING DOMAIN [ID] - Gestion d'un domaine
// GET /api/emailing/settings/domains/[id] - Détails du domaine
// POST /api/emailing/settings/domains/[id]?action=verify - Vérifier le domaine
// DELETE /api/emailing/settings/domains/[id] - Supprimer le domaine
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { Resend } from "resend";

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
// GET - Détails d'un domaine
// ===========================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const { id } = await params;

    const domain = await prisma.emailDomain.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!domain) {
      return NextResponse.json({ error: "Domaine non trouvé" }, { status: 404 });
    }

    const verificationStatus = extractVerificationStatus(domain.dnsRecords);

    return NextResponse.json({
      domain: {
        id: domain.id,
        domain: domain.domain,
        status: domain.status,
        ...verificationStatus,
        dnsRecords: domain.dnsRecords,
        createdAt: domain.createdAt,
        verifiedAt: domain.verifiedAt,
      },
    });
  } catch (error) {
    console.error("[API] GET /api/emailing/settings/domains/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// POST - Actions sur le domaine (vérifier)
// ===========================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    const domain = await prisma.emailDomain.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!domain) {
      return NextResponse.json({ error: "Domaine non trouvé" }, { status: 404 });
    }

    if (action === "verify") {
      // Vérifier le domaine via Resend
      if (domain.resendDomainId) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          const result = await resend.domains.verify(domain.resendDomainId);

          if (result.data) {
            // Cast le résultat pour accéder aux propriétés
            const domainData = result.data as unknown as {
              status?: string;
              records?: Array<{ type: string; name?: string; value?: string; status?: string }>
            };
            const records = domainData.records || [];
            const domainStatus = domainData.status;

            await prisma.emailDomain.update({
              where: { id: domain.id },
              data: {
                status: domainStatus === "verified" ? "verified" : domain.status,
                dnsRecords: records as object,
                verifiedAt: domainStatus === "verified" ? new Date() : null,
              },
            });

            return NextResponse.json({
              success: true,
              status: domainStatus,
              records: records,
              message: domainStatus === "verified"
                ? "Domaine vérifié avec succès"
                : "Vérification en cours. Assurez-vous que les enregistrements DNS sont configurés.",
            });
          }
        } catch (resendError) {
          console.error("Resend verify error:", resendError);
          return NextResponse.json({
            success: false,
            error: "Erreur lors de la vérification. Réessayez plus tard.",
          }, { status: 400 });
        }
      }

      return NextResponse.json({
        success: false,
        error: "Impossible de vérifier ce domaine",
      }, { status: 400 });
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch (error) {
    console.error("[API] POST /api/emailing/settings/domains/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// DELETE - Supprimer un domaine
// ===========================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const domain = await prisma.emailDomain.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!domain) {
      return NextResponse.json({ error: "Domaine non trouvé" }, { status: 404 });
    }

    // Supprimer de Resend si possible
    if (domain.resendDomainId) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.domains.remove(domain.resendDomainId);
      } catch (resendError) {
        console.error("Resend domain removal error:", resendError);
        // Continuer même si Resend échoue
      }
    }

    // Supprimer de la base
    await prisma.emailDomain.delete({
      where: { id: domain.id },
    });

    return NextResponse.json({
      success: true,
      message: "Domaine supprimé",
    });
  } catch (error) {
    console.error("[API] DELETE /api/emailing/settings/domains/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
