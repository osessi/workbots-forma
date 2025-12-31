// ===========================================
// API NEWSLETTER SUBSCRIBE - Inscription publique
// POST /api/emailing/newsletters/subscribe
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import crypto from "crypto";

// Cette route est publique (pas d'authentification requise)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newsletterId, email, firstName, lastName, customFields } = body;

    if (!newsletterId || !email) {
      return NextResponse.json(
        { error: "newsletterId et email requis" },
        { status: 400 }
      );
    }

    // Valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    // Récupérer la newsletter
    const newsletter = await prisma.newsletter.findUnique({
      where: { id: newsletterId },
      include: {
        organization: {
          select: { name: true },
        },
      },
    });

    if (!newsletter) {
      return NextResponse.json({ error: "Newsletter non trouvée" }, { status: 404 });
    }

    if (!newsletter.formEnabled) {
      return NextResponse.json(
        { error: "Les inscriptions sont désactivées" },
        { status: 400 }
      );
    }

    // Vérifier si déjà inscrit
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: {
        newsletterId_email: {
          newsletterId,
          email: email.toLowerCase().trim(),
        },
      },
    });

    if (existing) {
      if (existing.status === "ACTIVE") {
        return NextResponse.json({
          success: true,
          message: "Vous êtes déjà inscrit(e) à cette newsletter.",
          alreadySubscribed: true,
        });
      }

      // Réactiver si désabonné
      if (existing.status === "UNSUBSCRIBED") {
        const confirmToken = newsletter.doubleOptIn ? crypto.randomUUID() : null;

        await prisma.newsletterSubscriber.update({
          where: { id: existing.id },
          data: {
            status: newsletter.doubleOptIn ? "ACTIVE" : "ACTIVE",
            isConfirmed: !newsletter.doubleOptIn,
            confirmedAt: !newsletter.doubleOptIn ? new Date() : null,
            confirmToken,
            unsubscribedAt: null,
            firstName: firstName || existing.firstName,
            lastName: lastName || existing.lastName,
          },
        });

        // Envoyer email de confirmation si double opt-in
        if (newsletter.doubleOptIn && confirmToken) {
          await sendConfirmationEmail(newsletter, email, confirmToken, firstName);
        }

        return NextResponse.json({
          success: true,
          message: newsletter.doubleOptIn
            ? "Un email de confirmation vous a été envoyé."
            : "Vous êtes réinscrit(e) à la newsletter !",
          requiresConfirmation: newsletter.doubleOptIn,
        });
      }
    }

    // Nouvelle inscription
    const confirmToken = newsletter.doubleOptIn ? crypto.randomUUID() : null;
    const unsubscribeToken = crypto.randomUUID();

    await prisma.newsletterSubscriber.create({
      data: {
        newsletterId,
        email: email.toLowerCase().trim(),
        firstName,
        lastName,
        status: "ACTIVE",
        isConfirmed: !newsletter.doubleOptIn,
        confirmedAt: !newsletter.doubleOptIn ? new Date() : null,
        confirmToken,
        unsubscribeToken,
        source: "form",
      },
    });

    // Mettre à jour les compteurs
    const [totalCount, activeCount] = await Promise.all([
      prisma.newsletterSubscriber.count({ where: { newsletterId } }),
      prisma.newsletterSubscriber.count({
        where: { newsletterId, status: "ACTIVE", isConfirmed: true },
      }),
    ]);

    await prisma.newsletter.update({
      where: { id: newsletterId },
      data: { subscriberCount: totalCount, activeCount },
    });

    // Envoyer email de confirmation si double opt-in
    if (newsletter.doubleOptIn && confirmToken) {
      await sendConfirmationEmail(newsletter, email, confirmToken, firstName);
    }

    return NextResponse.json({
      success: true,
      message: newsletter.doubleOptIn
        ? "Un email de confirmation vous a été envoyé. Vérifiez votre boîte mail."
        : newsletter.confirmationMessage || "Merci pour votre inscription !",
      requiresConfirmation: newsletter.doubleOptIn,
    });
  } catch (error) {
    console.error("[API] POST /api/emailing/newsletters/subscribe error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Envoyer l'email de confirmation
async function sendConfirmationEmail(
  newsletter: {
    id: string;
    name: string;
    fromName: string | null;
    fromEmail: string | null;
    organization: { name: string } | null;
  },
  email: string,
  confirmToken: string,
  firstName?: string
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[Newsletter] Pas de clé Resend configurée");
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://workbots.fr";
  const confirmUrl = `${baseUrl}/api/emailing/newsletters/confirm/${confirmToken}`;

  const fromName = newsletter.fromName || newsletter.organization?.name || "WORKBOTS";
  const fromEmail = newsletter.fromEmail || process.env.EMAIL_FROM || "noreply@workbots.fr";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Confirmez votre inscription</h1>
        </div>
        <div class="content">
          <p>Bonjour${firstName ? ` ${firstName}` : ""},</p>
          <p>Vous avez demandé à vous inscrire à la newsletter <strong>${newsletter.name}</strong>.</p>
          <p>Pour confirmer votre inscription, cliquez sur le bouton ci-dessous :</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${confirmUrl}" class="button">Confirmer mon inscription</a>
          </p>
          <p style="font-size: 12px; color: #6b7280;">
            Si vous n'avez pas demandé cette inscription, vous pouvez ignorer cet email.
          </p>
        </div>
        <div class="footer">
          <p>© ${fromName}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [email],
        subject: `Confirmez votre inscription à ${newsletter.name}`,
        html,
      }),
    });
  } catch (err) {
    console.error("[Newsletter] Erreur envoi email confirmation:", err);
  }
}
