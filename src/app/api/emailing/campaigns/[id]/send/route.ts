// ===========================================
// API EMAILING CAMPAIGN SEND - Envoyer une campagne
// POST /api/emailing/campaigns/[id]/send
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

// Récupérer la config email
async function getEmailConfig(organizationId: string | null) {
  if (organizationId) {
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
  }

  return {
    provider: "resend",
    apiKey: process.env.RESEND_API_KEY!,
    fromName: process.env.EMAIL_FROM_NAME || "WORKBOTS Formation",
    fromEmail: process.env.EMAIL_FROM || "noreply@workbots.fr",
  };
}

// Envoyer via Resend
async function sendViaResend(options: {
  to: string;
  subject: string;
  html: string;
  from: string;
  replyTo?: string;
  apiKey: string;
}): Promise<{ success: boolean; resendId?: string; error?: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: options.from,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || "Erreur Resend" };
    }

    return { success: true, resendId: data.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

// Remplacer les variables
function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(regex, value || "");
  }
  return result;
}

export async function POST(
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

    const body = await request.json();
    const { testMode, testEmail } = body;

    // Récupérer la campagne
    const campaign = await prisma.emailCampaign.findFirst({
      where: {
        id,
        OR: [
          { organizationId: dbUser.organizationId },
          ...(dbUser.isSuperAdmin ? [{ organizationId: null }] : []),
        ],
      },
      include: {
        template: true,
        audience: true,
        organization: { select: { name: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 });
    }

    // Vérifications
    if (!campaign.audienceId && !testMode) {
      return NextResponse.json({ error: "Audience requise" }, { status: 400 });
    }

    if (!campaign.subject && !campaign.template?.subject) {
      return NextResponse.json({ error: "Sujet requis" }, { status: 400 });
    }

    if (!campaign.htmlContent && !campaign.template?.htmlContent) {
      return NextResponse.json({ error: "Contenu HTML requis" }, { status: 400 });
    }

    // Config email
    const config = await getEmailConfig(campaign.organizationId);

    const subject = campaign.subject || campaign.template?.subject || "";
    const htmlContent = campaign.htmlContent || campaign.template?.htmlContent || "";
    const fromName = campaign.fromName || config.fromName;
    const fromEmail = campaign.fromEmail || config.fromEmail;

    // Mode test - envoyer à une seule adresse
    if (testMode) {
      if (!testEmail) {
        return NextResponse.json({ error: "Email de test requis" }, { status: 400 });
      }

      const testVariables = {
        email: testEmail,
        prenom: "Test",
        nom: "Utilisateur",
        organisation_nom: campaign.organization?.name || "WORKBOTS",
      };

      const result = await sendViaResend({
        to: testEmail,
        subject: `[TEST] ${replaceVariables(subject, testVariables)}`,
        html: replaceVariables(htmlContent, testVariables),
        from: `${fromName} <${fromEmail}>`,
        replyTo: campaign.replyTo ?? undefined,
        apiKey: config.apiKey,
      });

      return NextResponse.json({
        success: result.success,
        testMode: true,
        email: testEmail,
        resendId: result.resendId,
        error: result.error,
      });
    }

    // Vérifier que la campagne peut être envoyée
    if (campaign.status === "SENT" || campaign.status === "SENDING") {
      return NextResponse.json(
        { error: "Cette campagne a déjà été envoyée" },
        { status: 400 }
      );
    }

    // Récupérer les contacts de l'audience
    const contacts = await prisma.emailAudienceContact.findMany({
      where: {
        audienceId: campaign.audienceId!,
        status: "ACTIVE",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        customFields: true,
      },
    });

    if (contacts.length === 0) {
      return NextResponse.json({ error: "Aucun contact actif dans l'audience" }, { status: 400 });
    }

    // Marquer la campagne comme en cours d'envoi
    await prisma.emailCampaign.update({
      where: { id },
      data: {
        status: "SENDING",
        totalRecipients: contacts.length,
      },
    });

    // Créer les envois
    const sendRecords = contacts.map((contact) => ({
      campaignId: id,
      email: contact.email,
      contactId: contact.id,
    }));

    await prisma.emailCampaignSend.createMany({
      data: sendRecords,
      skipDuplicates: true,
    });

    // Lancer l'envoi en arrière-plan
    // Note: En production, utiliser une queue (Bull, AWS SQS, etc.)
    // Ici, on simule un envoi progressif
    processCampaignSends(id, contacts, {
      subject,
      htmlContent,
      fromName,
      fromEmail,
      replyTo: campaign.replyTo,
      apiKey: config.apiKey,
      organizationName: campaign.organization?.name || "WORKBOTS",
      sendRate: campaign.sendRate,
    }).catch((err) => {
      console.error(`[Campaign ${id}] Erreur envoi:`, err);
    });

    return NextResponse.json({
      success: true,
      message: "Envoi démarré",
      totalRecipients: contacts.length,
      status: "SENDING",
    });
  } catch (error) {
    console.error("[API] POST /api/emailing/campaigns/[id]/send error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Traitement des envois en arrière-plan
async function processCampaignSends(
  campaignId: string,
  contacts: Array<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    customFields: unknown;
  }>,
  options: {
    subject: string;
    htmlContent: string;
    fromName: string;
    fromEmail: string;
    replyTo: string | null;
    apiKey: string;
    organizationName: string;
    sendRate: number | null;
  }
) {
  let sentCount = 0;
  let failedCount = 0;

  // Throttling: emails par heure
  const delayMs = options.sendRate ? Math.floor(3600000 / options.sendRate) : 100;

  for (const contact of contacts) {
    try {
      const variables = {
        email: contact.email,
        prenom: contact.firstName || "",
        nom: contact.lastName || "",
        firstname: contact.firstName || "",
        lastname: contact.lastName || "",
        organisation_nom: options.organizationName,
        ...(contact.customFields as Record<string, string> || {}),
      };

      const result = await sendViaResend({
        to: contact.email,
        subject: replaceVariables(options.subject, variables),
        html: replaceVariables(options.htmlContent, variables),
        from: `${options.fromName} <${options.fromEmail}>`,
        replyTo: options.replyTo || undefined,
        apiKey: options.apiKey,
      });

      await prisma.emailCampaignSend.update({
        where: {
          campaignId_email: {
            campaignId,
            email: contact.email,
          },
        },
        data: {
          status: result.success ? "SENT" : "FAILED",
          resendId: result.resendId,
          sentAt: result.success ? new Date() : undefined,
          errorMessage: result.error,
        },
      });

      if (result.success) {
        sentCount++;
      } else {
        failedCount++;
      }

      // Mettre à jour les stats de la campagne périodiquement
      if ((sentCount + failedCount) % 50 === 0) {
        await prisma.emailCampaign.update({
          where: { id: campaignId },
          data: { sentCount },
        });
      }

      // Throttling
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } catch (err) {
      console.error(`[Campaign ${campaignId}] Erreur envoi à ${contact.email}:`, err);
      failedCount++;
    }
  }

  // Finaliser la campagne
  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: "SENT",
      sentCount,
      sentAt: new Date(),
    },
  });

  console.log(`[Campaign ${campaignId}] Terminée: ${sentCount} envoyés, ${failedCount} échecs`);
}
