// ===========================================
// API ROUTE - Verify Invitation
// ===========================================
// Vérifie si une invitation est valide

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token requis" },
        { status: 400 }
      );
    }

    // Récupérer l'invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier si l'invitation est expirée
    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "Cette invitation a expiré" },
        { status: 400 }
      );
    }

    // Vérifier le statut
    if (invitation.status !== "PENDING") {
      const statusMessages: Record<string, string> = {
        ACCEPTED: "Cette invitation a déjà été acceptée",
        EXPIRED: "Cette invitation a expiré",
        CANCELLED: "Cette invitation a été annulée",
      };
      return NextResponse.json(
        { error: statusMessages[invitation.status] || "Invitation invalide" },
        { status: 400 }
      );
    }

    // Récupérer les infos de l'organisation
    const organization = await prisma.organization.findUnique({
      where: { id: invitation.organizationId },
      select: {
        name: true,
        logo: true,
      },
    });

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        organizationName: organization?.name || "Organisation",
        organizationLogo: organization?.logo,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error verifying invitation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification de l'invitation" },
      { status: 500 }
    );
  }
}
