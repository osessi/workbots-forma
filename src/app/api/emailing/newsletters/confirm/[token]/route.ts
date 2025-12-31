// ===========================================
// API NEWSLETTER CONFIRM - Confirmer inscription
// GET /api/emailing/newsletters/confirm/[token]
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Trouver l'abonné
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { confirmToken: token },
      include: {
        newsletter: {
          select: {
            id: true,
            name: true,
            confirmationTitle: true,
            confirmationMessage: true,
          },
        },
      },
    });

    if (!subscriber) {
      // Rediriger vers une page d'erreur
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://workbots.fr";
      return NextResponse.redirect(`${baseUrl}/newsletter/error?reason=invalid_token`);
    }

    if (subscriber.isConfirmed) {
      // Déjà confirmé
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://workbots.fr";
      return NextResponse.redirect(
        `${baseUrl}/newsletter/confirmed?name=${encodeURIComponent(subscriber.newsletter.name)}&already=true`
      );
    }

    // Confirmer l'inscription
    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        isConfirmed: true,
        confirmedAt: new Date(),
        confirmToken: null, // Invalider le token
      },
    });

    // Mettre à jour le compteur
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

    // Rediriger vers une page de confirmation
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://workbots.fr";
    return NextResponse.redirect(
      `${baseUrl}/newsletter/confirmed?name=${encodeURIComponent(subscriber.newsletter.name)}`
    );
  } catch (error) {
    console.error("[API] GET /api/emailing/newsletters/confirm/[token] error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://workbots.fr";
    return NextResponse.redirect(`${baseUrl}/newsletter/error?reason=server_error`);
  }
}
