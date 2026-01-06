// ===========================================
// API: Custom Domain Verify - Vérification DNS
// POST /api/settings/custom-domain/verify
// ===========================================

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import dns from "dns";
import { promisify } from "util";

const resolveCname = promisify(dns.resolveCname);
const resolveTxt = promisify(dns.resolveTxt);

// Helper pour créer le client Supabase
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

// Configuration
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") || "app.automate-forma.com";

interface DnsVerificationResult {
  cname: {
    verified: boolean;
    expected: string;
    found: string | null;
    error?: string;
  };
  txt: {
    verified: boolean;
    expected: string;
    found: string | null;
    error?: string;
  };
  allVerified: boolean;
}

// POST - Vérifier les enregistrements DNS
export async function POST(): Promise<NextResponse> {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur et son organisation
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { organization: true },
    });

    if (!dbUser?.organization) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Vérifier le rôle (admin requis)
    if (dbUser.role !== "ORG_ADMIN" && dbUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const customDomain = dbUser.organization.customDomain;

    if (!customDomain) {
      return NextResponse.json(
        { error: "Aucun domaine personnalisé configuré" },
        { status: 400 }
      );
    }

    const orgSlug = dbUser.organization.slug;
    const expectedTxtValue = `automate-forma-verify=${orgSlug}`;

    const result: DnsVerificationResult = {
      cname: {
        verified: false,
        expected: APP_DOMAIN,
        found: null,
      },
      txt: {
        verified: false,
        expected: expectedTxtValue,
        found: null,
      },
      allVerified: false,
    };

    // Vérifier le CNAME
    try {
      const cnameRecords = await resolveCname(customDomain);
      if (cnameRecords && cnameRecords.length > 0) {
        result.cname.found = cnameRecords[0];
        // Vérifier si le CNAME pointe vers notre domaine (avec ou sans point final)
        const normalizedCname = cnameRecords[0].replace(/\.$/, "").toLowerCase();
        const normalizedExpected = APP_DOMAIN.replace(/\.$/, "").toLowerCase();
        result.cname.verified = normalizedCname === normalizedExpected;
      }
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === "ENODATA" || error.code === "ENOTFOUND") {
        result.cname.error = "Enregistrement CNAME non trouvé";
      } else {
        result.cname.error = `Erreur DNS: ${error.message}`;
      }
    }

    // Vérifier le TXT (sur _automate-forma-verify.domain)
    const txtHostname = `_automate-forma-verify.${customDomain}`;
    try {
      const txtRecords = await resolveTxt(txtHostname);
      if (txtRecords && txtRecords.length > 0) {
        // Les enregistrements TXT sont retournés comme des tableaux de strings
        const allTxtValues = txtRecords.flat().join("");
        result.txt.found = allTxtValues;
        result.txt.verified = allTxtValues.includes(expectedTxtValue);
      }
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === "ENODATA" || error.code === "ENOTFOUND") {
        result.txt.error = "Enregistrement TXT non trouvé";
      } else {
        result.txt.error = `Erreur DNS: ${error.message}`;
      }
    }

    // Vérifier si tous les enregistrements sont validés
    result.allVerified = result.cname.verified && result.txt.verified;

    // Mettre à jour le statut de vérification dans la base de données
    if (result.allVerified) {
      await prisma.organization.update({
        where: { id: dbUser.organization.id },
        data: {
          customDomainVerified: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      domain: customDomain,
      verification: result,
    });
  } catch (error) {
    console.error("[API] POST /api/settings/custom-domain/verify error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
