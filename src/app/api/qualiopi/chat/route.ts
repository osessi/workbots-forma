// ===========================================
// API: CHAT AGENT IA QUALIOPI
// POST /api/qualiopi/chat - Envoyer un message
// GET /api/qualiopi/chat - Historique des conversations
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";
import {
  envoyerMessage,
  QUESTIONS_SUGGEREES,
} from "@/lib/services/qualiopi";

// ===========================================
// GET - Liste des conversations
// ===========================================

export async function GET(request: NextRequest) {
  try {
    // Authentification
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Paramètres
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      // Récupérer une conversation spécifique avec ses messages
      const conversation = await prisma.conversationQualiopi.findFirst({
        where: {
          id: conversationId,
          organizationId: user.organizationId,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation non trouvée" },
          { status: 404 }
        );
      }

      return NextResponse.json(conversation);
    }

    // Lister les conversations
    const conversations = await prisma.conversationQualiopi.findMany({
      where: {
        organizationId: user.organizationId,
        userId: user.id,
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        titre: c.titre,
        updatedAt: c.updatedAt,
        dernierMessage: c.messages[0]?.contenu.substring(0, 100) || null,
      })),
      questionsSuggerees: QUESTIONS_SUGGEREES,
    });
  } catch (error) {
    console.error("[API] GET /api/qualiopi/chat error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// POST - Envoyer un message
// ===========================================

export async function POST(request: NextRequest) {
  try {
    // Authentification
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { message, conversationId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message requis" },
        { status: 400 }
      );
    }

    // Vérifier que la conversation appartient à l'utilisateur si fournie
    if (conversationId) {
      const conversation = await prisma.conversationQualiopi.findFirst({
        where: {
          id: conversationId,
          organizationId: user.organizationId,
        },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation non trouvée" },
          { status: 404 }
        );
      }
    }

    // Envoyer le message à l'agent IA
    const response = await envoyerMessage(message, {
      organizationId: user.organizationId,
      userId: user.id,
      conversationId,
    });

    // Récupérer l'ID de la conversation (nouvelle ou existante)
    const conversation = await prisma.conversationQualiopi.findFirst({
      where: {
        organizationId: user.organizationId,
        userId: user.id,
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });

    return NextResponse.json({
      ...response,
      conversationId: conversation?.id,
    });
  } catch (error) {
    console.error("[API] POST /api/qualiopi/chat error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// DELETE - Supprimer une conversation
// ===========================================

export async function DELETE(request: NextRequest) {
  try {
    // Authentification
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "ID de conversation requis" },
        { status: 400 }
      );
    }

    // Vérifier que la conversation appartient à l'utilisateur
    const conversation = await prisma.conversationQualiopi.findFirst({
      where: {
        id: conversationId,
        organizationId: user.organizationId,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation non trouvée" },
        { status: 404 }
      );
    }

    // Supprimer la conversation (cascade sur les messages)
    await prisma.conversationQualiopi.delete({
      where: { id: conversationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/qualiopi/chat error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
