// ===========================================
// API NEWSLETTER UNSUBSCRIBE - Désabonnement
// GET /api/emailing/newsletters/unsubscribe/[token]
// POST /api/emailing/newsletters/unsubscribe/[token] - Confirmer
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET - Afficher page de désabonnement ou désabonner directement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get("confirm") === "true";

    // Trouver l'abonné
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
      include: {
        newsletter: {
          select: { id: true, name: true },
        },
      },
    });

    if (!subscriber) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://workbots.fr";
      return NextResponse.redirect(`${baseUrl}/newsletter/error?reason=invalid_token`);
    }

    if (subscriber.status === "UNSUBSCRIBED") {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://workbots.fr";
      return NextResponse.redirect(
        `${baseUrl}/newsletter/unsubscribed?name=${encodeURIComponent(subscriber.newsletter.name)}&already=true`
      );
    }

    // Si confirmation demandée, désabonner
    if (confirm) {
      await prisma.newsletterSubscriber.update({
        where: { id: subscriber.id },
        data: {
          status: "UNSUBSCRIBED",
          unsubscribedAt: new Date(),
        },
      });

      // Mettre à jour les compteurs
      const activeCount = await prisma.newsletterSubscriber.count({
        where: {
          newsletterId: subscriber.newsletterId,
          status: "ACTIVE",
          isConfirmed: true,
        },
      });

      await prisma.newsletter.update({
        where: { id: subscriber.newsletterId },
        data: { activeCount },
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://workbots.fr";
      return NextResponse.redirect(
        `${baseUrl}/newsletter/unsubscribed?name=${encodeURIComponent(subscriber.newsletter.name)}`
      );
    }

    // Sinon, rediriger vers page de confirmation
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://workbots.fr";
    return NextResponse.redirect(
      `${baseUrl}/newsletter/unsubscribe?token=${token}&name=${encodeURIComponent(subscriber.newsletter.name)}&email=${encodeURIComponent(subscriber.email)}`
    );
  } catch (error) {
    console.error("[API] GET /api/emailing/newsletters/unsubscribe/[token] error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://workbots.fr";
    return NextResponse.redirect(`${baseUrl}/newsletter/error?reason=server_error`);
  }
}

// POST - Confirmer le désabonnement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
      include: {
        newsletter: { select: { id: true, name: true } },
      },
    });

    if (!subscriber) {
      return NextResponse.json({ error: "Token invalide" }, { status: 404 });
    }

    if (subscriber.status === "UNSUBSCRIBED") {
      return NextResponse.json({
        success: true,
        message: "Vous êtes déjà désabonné(e).",
        alreadyUnsubscribed: true,
      });
    }

    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribedAt: new Date(),
      },
    });

    // Mettre à jour les compteurs
    const activeCount = await prisma.newsletterSubscriber.count({
      where: {
        newsletterId: subscriber.newsletterId,
        status: "ACTIVE",
        isConfirmed: true,
      },
    });

    await prisma.newsletter.update({
      where: { id: subscriber.newsletterId },
      data: { activeCount },
    });

    return NextResponse.json({
      success: true,
      message: `Vous avez été désabonné(e) de ${subscriber.newsletter.name}.`,
    });
  } catch (error) {
    console.error("[API] POST /api/emailing/newsletters/unsubscribe/[token] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
