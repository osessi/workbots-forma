// ===========================================
// API EMAIL STATUS - Récupérer le statut d'un email envoyé
// ===========================================
// Correction 570: GET /api/emails/[id]/status - Récupérer le statut et date d'ouverture d'un email

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: emailId } = await params;

    // Authentification (avec support impersonation)
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Récupérer l'email
    const sentEmail = await prisma.sentEmail.findFirst({
      where: {
        id: emailId,
        organizationId: user.organizationId,
      },
      select: {
        id: true,
        status: true,
        sentAt: true,
        deliveredAt: true,
        openedAt: true,
        clickedAt: true,
        toEmail: true,
        subject: true,
      },
    });

    if (!sentEmail) {
      return NextResponse.json({ error: "Email non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      id: sentEmail.id,
      status: sentEmail.status,
      sentAt: sentEmail.sentAt?.toISOString() || null,
      deliveredAt: sentEmail.deliveredAt?.toISOString() || null,
      openedAt: sentEmail.openedAt?.toISOString() || null,
      clickedAt: sentEmail.clickedAt?.toISOString() || null,
      toEmail: sentEmail.toEmail,
      subject: sentEmail.subject,
    });
  } catch (error) {
    console.error("Erreur récupération statut email:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du statut" },
      { status: 500 }
    );
  }
}
