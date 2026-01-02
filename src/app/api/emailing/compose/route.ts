// ===========================================
// API EMAILING COMPOSE - Envoyer un email
// POST /api/emailing/compose - Composer et envoyer
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

// Récupérer la config email de l'organisation
async function getEmailConfig(organizationId: string) {
  // D'abord vérifier si l'org a une config SMTP personnalisée
  const smtpConfig = await prisma.emailSmtpConfig.findUnique({
    where: { organizationId },
  });

  if (smtpConfig?.isActive && smtpConfig.apiKey) {
    return {
      provider: smtpConfig.provider,
      apiKey: smtpConfig.apiKey,
      fromName: smtpConfig.fromName || "WORKBOTS",
      fromEmail: smtpConfig.fromEmail || "noreply@workbots.fr",
    };
  }

  // Sinon utiliser la config globale (Resend par défaut)
  return {
    provider: "resend",
    apiKey: process.env.RESEND_API_KEY!,
    fromName: process.env.EMAIL_FROM_NAME || "WORKBOTS Formation",
    fromEmail: process.env.EMAIL_FROM || "noreply@workbots.fr",
  };
}

// Envoyer via Resend
async function sendViaResend(options: {
  to: string[];
  subject: string;
  html: string;
  from: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: string }>;
  apiKey: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      reply_to: options.replyTo,
      attachments: options.attachments,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erreur envoi Resend");
  }

  return data.id;
}

// Remplacer les variables dans le contenu
function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(regex, value || "");
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: {
        id: true,
        organizationId: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const {
      to, // string ou array d'emails
      toName,
      subject,
      htmlContent,
      textContent,
      templateId,
      variables,
      replyTo,
      attachmentIds, // IDs de fichiers du Drive
      scheduledAt,
      type = "OTHER",
      // Références optionnelles
      apprenantId,
      sessionId,
      formationId,
    } = body;

    // Validation
    if (!to || (!htmlContent && !templateId)) {
      return NextResponse.json(
        { error: "Champs requis: to, et (htmlContent ou templateId)" },
        { status: 400 }
      );
    }

    const recipients = Array.isArray(to) ? to : [to];

    // Si template, récupérer le contenu
    let finalSubject = subject;
    let finalHtml = htmlContent;

    if (templateId) {
      const template = await prisma.emailTemplate.findFirst({
        where: {
          id: templateId,
          OR: [
            { organizationId: dbUser.organizationId },
            { isGlobal: true },
          ],
        },
      });

      if (!template) {
        return NextResponse.json({ error: "Template non trouvé" }, { status: 404 });
      }

      finalSubject = subject || template.subject;
      finalHtml = template.htmlContent;
    }

    // Remplacer les variables
    const allVariables = {
      ...variables,
      organisation_nom: (await prisma.organization.findUnique({
        where: { id: dbUser.organizationId },
        select: { name: true },
      }))?.name || "",
      expediteur_nom: `${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim(),
      date_envoi: new Date().toLocaleDateString("fr-FR"),
    };

    finalSubject = replaceVariables(finalSubject, allVariables);
    finalHtml = replaceVariables(finalHtml, allVariables);

    // Récupérer les pièces jointes depuis le Drive
    let attachments: Array<{ filename: string; content: string }> = [];
    if (attachmentIds && attachmentIds.length > 0) {
      const files = await prisma.file.findMany({
        where: {
          id: { in: attachmentIds },
          organizationId: dbUser.organizationId,
        },
        select: {
          id: true,
          name: true,
          publicUrl: true,
          mimeType: true,
        },
      });

      // Pour chaque fichier, récupérer le contenu
      for (const file of files) {
        if (!file.publicUrl) continue;
        try {
          const response = await fetch(file.publicUrl);
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          attachments.push({
            filename: file.name,
            content: base64,
          });
        } catch (err) {
          console.error(`Erreur chargement fichier ${file.id}:`, err);
        }
      }
    }

    // Si envoi programmé
    if (scheduledAt && new Date(scheduledAt) > new Date()) {
      // Créer une campagne programmée pour un seul destinataire
      const campaign = await prisma.emailCampaign.create({
        data: {
          organizationId: dbUser.organizationId,
          name: `Email à ${recipients[0]}`,
          type: "ONE_TIME",
          status: "SCHEDULED",
          subject: finalSubject,
          htmlContent: finalHtml,
          scheduledAt: new Date(scheduledAt),
          totalRecipients: recipients.length,
          createdById: dbUser.id,
        },
      });

      // Créer les envois
      for (const email of recipients) {
        await prisma.emailCampaignSend.create({
          data: {
            campaignId: campaign.id,
            email,
          },
        });
      }

      return NextResponse.json({
        success: true,
        scheduled: true,
        scheduledAt,
        campaignId: campaign.id,
        message: `Email programmé pour le ${new Date(scheduledAt).toLocaleString("fr-FR")}`,
      });
    }

    // Envoi immédiat
    const config = await getEmailConfig(dbUser.organizationId);
    const results: Array<{ email: string; success: boolean; id?: string; error?: string }> = [];

    for (const recipientEmail of recipients) {
      try {
        const resendId = await sendViaResend({
          to: [recipientEmail],
          subject: finalSubject,
          html: finalHtml,
          from: `${config.fromName} <${config.fromEmail}>`,
          replyTo: replyTo || dbUser.email,
          attachments: attachments.length > 0 ? attachments : undefined,
          apiKey: config.apiKey,
        });

        // Stocker l'email envoyé
        await prisma.sentEmail.create({
          data: {
            organizationId: dbUser.organizationId,
            toEmail: recipientEmail,
            toName: toName || undefined,
            subject: finalSubject,
            htmlContent: finalHtml,
            textContent,
            type,
            status: "SENT",
            resendId,
            sentByUserId: dbUser.id,
            sentBySystem: false,
            apprenantId,
            sessionId,
            formationId,
            attachments: attachments.length > 0
              ? attachments.map((a) => ({ filename: a.filename }))
              : undefined,
          },
        });

        results.push({ email: recipientEmail, success: true, id: resendId });
      } catch (error) {
        console.error(`Erreur envoi à ${recipientEmail}:`, error);

        // Stocker l'échec
        await prisma.sentEmail.create({
          data: {
            organizationId: dbUser.organizationId,
            toEmail: recipientEmail,
            toName: toName || undefined,
            subject: finalSubject,
            htmlContent: finalHtml,
            type,
            status: "FAILED",
            errorMessage: error instanceof Error ? error.message : "Erreur inconnue",
            sentByUserId: dbUser.id,
            sentBySystem: false,
          },
        });

        results.push({
          email: recipientEmail,
          success: false,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: failCount === 0,
      sent: successCount,
      failed: failCount,
      results,
      message:
        failCount === 0
          ? `${successCount} email(s) envoyé(s) avec succès`
          : `${successCount} envoyé(s), ${failCount} échec(s)`,
    });
  } catch (error) {
    console.error("[API] POST /api/emailing/compose error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
