// ===========================================
// API COMPTAGE MESSAGES NON LUS - INTERVENANT
// ===========================================
// GET - Compter le nombre de réponses non lues par l'intervenant

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Décoder et valider le token intervenant
function decodeIntervenantToken(token: string): { intervenantId: string; organizationId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));

    if (!decoded.intervenantId || !decoded.organizationId) {
      return null;
    }

    // Vérifier expiration
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }

    return {
      intervenantId: decoded.intervenantId,
      organizationId: decoded.organizationId,
    };
  } catch {
    return null;
  }
}

// GET - Compter les réponses non lues
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") ||
                  request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    }

    const decoded = decodeIntervenantToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
    }

    const { intervenantId, organizationId } = decoded;

    // Compter les réponses non lues pour tous les messages de cet intervenant
    const count = await prisma.messageReponse.count({
      where: {
        organizationId,
        isReadByIntervenant: false,
        message: {
          intervenantId,
        },
      },
    });

    return NextResponse.json({ unreadCount: count });
  } catch (error) {
    console.error("[API] GET /api/intervenant/messages/unread-count error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
