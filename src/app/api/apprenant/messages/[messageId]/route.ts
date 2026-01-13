// ===========================================
// API: MESSAGE SPÉCIFIQUE APPRENANT
// PATCH - Marquer comme lu
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// Décoder et valider le token apprenant (encodé en base64url JSON)
function decodeApprenantToken(token: string): { apprenantId: string; organizationId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));

    if (!decoded.apprenantId || !decoded.organizationId) {
      return null;
    }

    // Vérifier expiration
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }

    return {
      apprenantId: decoded.apprenantId,
      organizationId: decoded.organizationId,
    };
  } catch {
    return null;
  }
}

// PATCH - Marquer un message comme lu par l'apprenant
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token requis" }, { status: 401 });
    }

    // Décoder le token
    const decoded = decodeApprenantToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
    }

    const { apprenantId, organizationId } = decoded;

    // Récupérer la notification
    const notification = await prisma.notification.findFirst({
      where: {
        id: messageId,
        organizationId: organizationId,
        resourceType: "apprenant",
        resourceId: apprenantId,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Message non trouvé" },
        { status: 404 }
      );
    }

    const currentMetadata = (notification.metadata as Record<string, unknown>) || {};
    const direction = currentMetadata.direction as string;

    if (direction === "outgoing") {
      // Message de l'organisme - marquer comme lu par l'apprenant
      await prisma.notification.update({
        where: { id: messageId },
        data: {
          metadata: {
            ...currentMetadata,
            readByApprenant: true,
            readByApprenantAt: new Date().toISOString(),
          },
        },
      });
    } else {
      // Message de l'apprenant - marquer les réponses comme lues
      // Correction 423: Aussi remettre hasNewReply à false
      await prisma.notification.update({
        where: { id: messageId },
        data: {
          metadata: {
            ...currentMetadata,
            repliesReadByApprenant: true,
            repliesReadByApprenantAt: new Date().toISOString(),
            hasNewReply: false, // Correction 423: Plus de nouvelle réponse
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] PATCH /api/apprenant/messages/[messageId] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
