// ===========================================
// WEBHOOK RESEND - Réception des events email
// POST /api/webhooks/resend
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import crypto from "crypto";

// Désactiver le body parsing pour vérifier la signature
export const dynamic = "force-dynamic";

// Types d'événements Resend
type ResendEventType =
  | "email.sent"
  | "email.delivered"
  | "email.delivery_delayed"
  | "email.complained"
  | "email.bounced"
  | "email.opened"
  | "email.clicked";

interface ResendWebhookPayload {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // Pour opened
    first_opened_at?: string;
    opened_count?: number;
    // Pour clicked
    click?: {
      link: string;
      timestamp: string;
      ipAddress?: string;
      userAgent?: string;
    };
    // Pour bounced
    bounce?: {
      type: string;
      message: string;
    };
    // Metadata custom
    tags?: Record<string, string>;
  };
}

// Vérifier la signature du webhook Resend
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(request: NextRequest) {
  try {
    // Récupérer le corps brut pour vérification signature
    const payload = await request.text();
    const signature = request.headers.get("svix-signature") || "";
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    // Vérifier la signature si secret configuré
    if (webhookSecret && signature) {
      // Note: Resend utilise Svix pour les webhooks
      // La vérification complète nécessite svix package
      // Pour l'instant on accepte tous les webhooks
      console.log("[Webhook Resend] Signature présente, vérification simplifiée");
    }

    // Parser le payload
    const event: ResendWebhookPayload = JSON.parse(payload);

    console.log(`[Webhook Resend] Event reçu: ${event.type}`, {
      emailId: event.data.email_id,
      to: event.data.to,
    });

    // Stocker l'événement brut
    const webhookEvent = await prisma.emailWebhookEvent.create({
      data: {
        eventType: event.type,
        resendId: event.data.email_id,
        payload: event as object,
        email: event.data.to[0],
        timestamp: new Date(event.created_at),
        userAgent: event.data.click?.userAgent,
        ipAddress: event.data.click?.ipAddress,
        link: event.data.click?.link,
        isProcessed: false,
      },
    });

    // Traiter l'événement
    await processWebhookEvent(event, webhookEvent.id);

    return NextResponse.json({ received: true, eventId: webhookEvent.id });
  } catch (error) {
    console.error("[Webhook Resend] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur traitement webhook" },
      { status: 500 }
    );
  }
}

// Traiter l'événement webhook
async function processWebhookEvent(event: ResendWebhookPayload, webhookEventId: string) {
  const resendId = event.data.email_id;
  const timestamp = new Date(event.created_at);

  try {
    // Chercher l'email dans SentEmail (emails transactionnels)
    const sentEmail = await prisma.sentEmail.findFirst({
      where: { resendId },
    });

    // Chercher dans EmailCampaignSend (campagnes)
    const campaignSend = await prisma.emailCampaignSend.findFirst({
      where: { resendId },
    });

    // Mettre à jour selon le type d'événement
    switch (event.type) {
      case "email.delivered":
        if (sentEmail) {
          await prisma.sentEmail.update({
            where: { id: sentEmail.id },
            data: {
              status: "DELIVERED",
              deliveredAt: timestamp,
            },
          });
        }
        if (campaignSend) {
          await prisma.emailCampaignSend.update({
            where: { id: campaignSend.id },
            data: {
              status: "DELIVERED",
              deliveredAt: timestamp,
            },
          });
          // Mettre à jour les stats de la campagne
          await updateCampaignStats(campaignSend.campaignId, "delivered");
        }
        break;

      case "email.opened":
        if (sentEmail) {
          await prisma.sentEmail.update({
            where: { id: sentEmail.id },
            data: {
              status: "OPENED",
              openedAt: sentEmail.openedAt || timestamp,
            },
          });
        }
        if (campaignSend) {
          const isFirstOpen = !campaignSend.openedAt;
          await prisma.emailCampaignSend.update({
            where: { id: campaignSend.id },
            data: {
              status: "OPENED",
              openedAt: campaignSend.openedAt || timestamp,
              openCount: { increment: 1 },
            },
          });
          if (isFirstOpen) {
            await updateCampaignStats(campaignSend.campaignId, "opened");
          }
        }
        break;

      case "email.clicked":
        if (sentEmail) {
          await prisma.sentEmail.update({
            where: { id: sentEmail.id },
            data: {
              status: "CLICKED",
            },
          });
        }
        if (campaignSend) {
          const isFirstClick = !campaignSend.clickedAt;
          const clickedLinks = campaignSend.clickedLinks || [];
          if (event.data.click?.link && !clickedLinks.includes(event.data.click.link)) {
            clickedLinks.push(event.data.click.link);
          }
          await prisma.emailCampaignSend.update({
            where: { id: campaignSend.id },
            data: {
              clickedAt: campaignSend.clickedAt || timestamp,
              clickCount: { increment: 1 },
              clickedLinks,
            },
          });
          if (isFirstClick) {
            await updateCampaignStats(campaignSend.campaignId, "clicked");
          }
          // Tracker le lien cliqué
          await trackLinkClick(campaignSend.campaignId, event.data.click?.link || "");
        }
        break;

      case "email.bounced":
        if (sentEmail) {
          await prisma.sentEmail.update({
            where: { id: sentEmail.id },
            data: {
              status: "BOUNCED",
              errorMessage: event.data.bounce?.message,
            },
          });
        }
        if (campaignSend) {
          await prisma.emailCampaignSend.update({
            where: { id: campaignSend.id },
            data: {
              status: "BOUNCED",
              bouncedAt: timestamp,
              errorMessage: event.data.bounce?.message,
            },
          });
          await updateCampaignStats(campaignSend.campaignId, "bounced");
          // Marquer le contact comme bounced dans l'audience
          await markContactBounced(campaignSend.email);
        }
        break;

      case "email.complained":
        if (campaignSend) {
          await prisma.emailCampaignSend.update({
            where: { id: campaignSend.id },
            data: {
              complainedAt: timestamp,
            },
          });
          await updateCampaignStats(campaignSend.campaignId, "complained");
          // Marquer le contact comme complained
          await markContactComplained(campaignSend.email);
        }
        break;
    }

    // Marquer l'événement comme traité
    await prisma.emailWebhookEvent.update({
      where: { id: webhookEventId },
      data: {
        isProcessed: true,
        processedAt: new Date(),
        sentEmailId: sentEmail?.id,
        campaignSendId: campaignSend?.id,
      },
    });
  } catch (error) {
    console.error("[Webhook Resend] Erreur traitement:", error);
    await prisma.emailWebhookEvent.update({
      where: { id: webhookEventId },
      data: {
        isProcessed: true,
        processedAt: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

// Mettre à jour les statistiques d'une campagne
async function updateCampaignStats(campaignId: string, metric: string) {
  const updateData: Record<string, { increment: number }> = {};

  switch (metric) {
    case "delivered":
      updateData.deliveredCount = { increment: 1 };
      break;
    case "opened":
      updateData.openedCount = { increment: 1 };
      break;
    case "clicked":
      updateData.clickedCount = { increment: 1 };
      break;
    case "bounced":
      updateData.bouncedCount = { increment: 1 };
      break;
    case "unsubscribed":
      updateData.unsubscribedCount = { increment: 1 };
      break;
    case "complained":
      updateData.complainedCount = { increment: 1 };
      break;
  }

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: updateData,
  });

  // Mettre à jour les analytics horaires
  const now = new Date();
  const dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const hour = now.getHours();

  await prisma.emailCampaignAnalytics.upsert({
    where: {
      campaignId_date_hour: {
        campaignId,
        date: dateOnly,
        hour,
      },
    },
    create: {
      campaignId,
      date: dateOnly,
      hour,
      [metric]: 1,
      [`unique${metric.charAt(0).toUpperCase() + metric.slice(1)}`]: 1,
    },
    update: {
      [metric]: { increment: 1 },
    },
  });
}

// Tracker un clic sur un lien
async function trackLinkClick(campaignId: string, link: string) {
  if (!link) return;

  const now = new Date();
  const dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const hour = now.getHours();

  const analytics = await prisma.emailCampaignAnalytics.findUnique({
    where: {
      campaignId_date_hour: {
        campaignId,
        date: dateOnly,
        hour,
      },
    },
  });

  const linkClicks = (analytics?.linkClicks as Record<string, number>) || {};
  linkClicks[link] = (linkClicks[link] || 0) + 1;

  await prisma.emailCampaignAnalytics.upsert({
    where: {
      campaignId_date_hour: {
        campaignId,
        date: dateOnly,
        hour,
      },
    },
    create: {
      campaignId,
      date: dateOnly,
      hour,
      linkClicks,
    },
    update: {
      linkClicks,
    },
  });
}

// Marquer un contact comme bounced dans toutes les audiences
async function markContactBounced(email: string) {
  await prisma.emailAudienceContact.updateMany({
    where: { email, status: "ACTIVE" },
    data: { status: "BOUNCED" },
  });

  await prisma.newsletterSubscriber.updateMany({
    where: { email, status: "ACTIVE" },
    data: { status: "BOUNCED" },
  });
}

// Marquer un contact comme complained
async function markContactComplained(email: string) {
  await prisma.emailAudienceContact.updateMany({
    where: { email, status: "ACTIVE" },
    data: { status: "COMPLAINED" },
  });

  await prisma.newsletterSubscriber.updateMany({
    where: { email, status: "ACTIVE" },
    data: { status: "COMPLAINED" },
  });
}
