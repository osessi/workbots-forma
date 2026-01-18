// ===========================================
// API: MESSAGE SPÉCIFIQUE APPRENANT
// PATCH - Marquer comme lu
// DELETE - Supprimer un message
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

// PATCH - Marquer un message comme lu/non lu
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { id: apprenantId, messageId } = await params;

    // Authentification
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { isRead } = body;

    // Mettre à jour le statut de lecture
    const notification = await prisma.notification.updateMany({
      where: {
        id: messageId,
        organizationId: user.organizationId,
        resourceType: "apprenant",
        resourceId: apprenantId,
      },
      data: {
        isRead: isRead ?? true,
        readAt: isRead ? new Date() : null,
      },
    });

    if (notification.count === 0) {
      return NextResponse.json(
        { error: "Message non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] PATCH /api/donnees/apprenants/[id]/messages/[messageId] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer un message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { id: apprenantId, messageId } = await params;

    // Authentification
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Supprimer le message
    const notification = await prisma.notification.deleteMany({
      where: {
        id: messageId,
        organizationId: user.organizationId,
        resourceType: "apprenant",
        resourceId: apprenantId,
      },
    });

    if (notification.count === 0) {
      return NextResponse.json(
        { error: "Message non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/donnees/apprenants/[id]/messages/[messageId] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
