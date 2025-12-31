// ===========================================
// API EMAILING DOMAIN [ID] - Gestion d'un domaine
// GET /api/emailing/settings/domains/[id] - Détails du domaine
// POST /api/emailing/settings/domains/[id]?action=verify - Vérifier le domaine
// DELETE /api/emailing/settings/domains/[id] - Supprimer le domaine
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { Resend } from "resend";

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

// ===========================================
// GET - Détails d'un domaine
// ===========================================

export async function GET(
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
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const { id } = await params;

    const domain = await prisma.emailDomain.findFirst({
      where: {
        id,
        organizationId: dbUser.organizationId,
      },
    });

    if (!domain) {
      return NextResponse.json({ error: "Domaine non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      domain: {
        id: domain.id,
        domain: domain.domain,
        status: domain.status,
        dkimVerified: domain.dkimVerified,
        spfVerified: domain.spfVerified,
        dmarcVerified: domain.dmarcVerified,
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
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    const domain = await prisma.emailDomain.findFirst({
      where: {
        id,
        organizationId: dbUser.organizationId,
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
            // Mettre à jour les statuts
            const records = result.data.records || [];
            const dkimRecord = records.find((r: { type: string }) => r.type === "TXT" && r.name?.includes("_domainkey"));
            const spfRecord = records.find((r: { type: string; name: string }) => r.type === "TXT" && r.name === domain.domain);

            await prisma.emailDomain.update({
              where: { id: domain.id },
              data: {
                status: result.data.status === "verified" ? "VERIFIED" : domain.status,
                dkimVerified: dkimRecord?.status === "verified",
                spfVerified: spfRecord?.status === "verified",
                dnsRecords: records,
                verifiedAt: result.data.status === "verified" ? new Date() : null,
              },
            });

            return NextResponse.json({
              success: true,
              status: result.data.status,
              records: records,
              message: result.data.status === "verified"
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

    const domain = await prisma.emailDomain.findFirst({
      where: {
        id,
        organizationId: dbUser.organizationId,
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
