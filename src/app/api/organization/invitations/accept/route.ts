// ===========================================
// API ROUTE - Accept Invitation
// ===========================================
// Accepte une invitation et ajoute l'utilisateur à l'organisation

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token } = body;

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

    // Vérifier si l'invitation est valide
    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cette invitation n'est plus valide" },
        { status: 400 }
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

    // Récupérer l'email de l'utilisateur
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true },
    });

    // Vérifier que l'email correspond
    if (invitation.email.toLowerCase() !== dbUser?.email?.toLowerCase()) {
      return NextResponse.json(
        { error: "Cette invitation est pour une autre adresse email" },
        { status: 403 }
      );
    }

    // Mettre à jour l'utilisateur avec l'organisation
    await prisma.user.update({
      where: { id: user.id },
      data: {
        organizationId: invitation.organizationId,
        role: invitation.role,
      },
    });

    // Marquer l'invitation comme acceptée
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    // Log de l'audit
    await prisma.auditLog.create({
      data: {
        action: "INVITATION_ACCEPTED",
        entity: "User",
        entityId: user.id,
        userId: user.id,
        organizationId: invitation.organizationId,
        details: {
          invitationId: invitation.id,
          role: invitation.role,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation acceptée avec succès",
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'acceptation de l'invitation" },
      { status: 500 }
    );
  }
}
