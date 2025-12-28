// ===========================================
// API NOTIFICATION - DELETE /api/notifications/[id]
// ===========================================
// Supprimer une notification individuelle

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// DELETE - Supprimer une notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que la notification appartient à l'organisation
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        OR: [
          { userId: user.id },
          { userId: null },
        ],
      },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification non trouvée" }, { status: 404 });
    }

    await prisma.notification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Notification supprimée" });
  } catch (error) {
    console.error("Erreur DELETE notification:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la notification" },
      { status: 500 }
    );
  }
}
