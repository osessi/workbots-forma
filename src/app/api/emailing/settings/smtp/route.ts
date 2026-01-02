// ===========================================
// API EMAILING SMTP - Configuration SMTP
// POST /api/emailing/settings/smtp - Configurer SMTP
// POST /api/emailing/settings/smtp?action=test - Tester la connexion
// DELETE /api/emailing/settings/smtp - Supprimer la config
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
// POST - Configurer ou tester SMTP
// ===========================================

export async function POST(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    const body = await request.json();

    // Test de connexion SMTP
    if (action === "test") {
      const { provider, apiKey, fromEmail, testEmail } = body;

      if (provider === "RESEND") {
        try {
          const resend = new Resend(apiKey || process.env.RESEND_API_KEY);

          await resend.emails.send({
            from: fromEmail || "test@workbots.fr",
            to: testEmail || user.email || "",
            subject: "Test de configuration SMTP - WORKBOTS",
            html: `
              <h2>Configuration SMTP réussie</h2>
              <p>Ce message confirme que votre configuration SMTP fonctionne correctement.</p>
              <p>Envoyé depuis WORKBOTS Formation</p>
            `,
          });

          // Mettre à jour la date de test
          await prisma.emailSmtpConfig.updateMany({
            where: { organizationId: dbUser.organizationId },
            data: { lastTestedAt: new Date() },
          });

          return NextResponse.json({
            success: true,
            message: `Email de test envoyé à ${testEmail || user.email}`,
          });
        } catch (error) {
          console.error("SMTP test error:", error);
          return NextResponse.json({
            success: false,
            error: "Échec de l'envoi. Vérifiez vos paramètres.",
          }, { status: 400 });
        }
      }

      return NextResponse.json({
        error: "Provider non supporté",
      }, { status: 400 });
    }

    // Configurer SMTP
    const {
      provider = "RESEND",
      apiKey,
      host,
      port,
      username,
      password,
      fromEmail,
      fromName,
      replyTo,
      encryption,
    } = body;

    // Validation
    if (!fromEmail) {
      return NextResponse.json({
        error: "L'email d'expédition est requis",
      }, { status: 400 });
    }

    // Créer ou mettre à jour la config
    const smtpConfig = await prisma.emailSmtpConfig.upsert({
      where: { organizationId: dbUser.organizationId },
      update: {
        provider,
        apiKey: apiKey || undefined,
        host: host || undefined,
        port: port || undefined,
        username: username || undefined,
        password: password || undefined,
        fromEmail,
        fromName: fromName || "",
        replyTo: replyTo || undefined,
        secure: encryption === "ssl" || encryption === "tls",
        isDomainVerified: false, // Nécessite re-vérification
        updatedAt: new Date(),
      },
      create: {
        organizationId: dbUser.organizationId,
        provider,
        apiKey: apiKey || undefined,
        host: host || undefined,
        port: port || undefined,
        username: username || undefined,
        password: password || undefined,
        fromEmail,
        fromName: fromName || "",
        replyTo: replyTo || undefined,
        secure: encryption === "ssl" || encryption === "tls",
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      smtp: {
        id: smtpConfig.id,
        provider: smtpConfig.provider,
        fromEmail: smtpConfig.fromEmail,
        fromName: smtpConfig.fromName,
        replyTo: smtpConfig.replyTo,
        isDomainVerified: smtpConfig.isDomainVerified,
        isActive: smtpConfig.isActive,
      },
    });
  } catch (error) {
    console.error("[API] POST /api/emailing/settings/smtp error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// DELETE - Supprimer la configuration SMTP
// ===========================================

export async function DELETE() {
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

    await prisma.emailSmtpConfig.deleteMany({
      where: { organizationId: dbUser.organizationId },
    });

    return NextResponse.json({
      success: true,
      message: "Configuration SMTP supprimée",
    });
  } catch (error) {
    console.error("[API] DELETE /api/emailing/settings/smtp error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
