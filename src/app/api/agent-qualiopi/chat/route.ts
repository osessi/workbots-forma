// ===========================================
// API: AGENT IA QUALIOPI - CHAT
// POST /api/agent-qualiopi/chat - Chat avec l'agent
// GET /api/agent-qualiopi/chat - Historique conversations
// ===========================================
// Note: Cette route redirige vers /api/qualiopi/chat qui existe déjà
// Ce fichier sert d'alias pour maintenir la cohérence de l'API

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import {
  envoyerMessage,
  QUESTIONS_SUGGEREES,
} from "@/lib/services/qualiopi";

// Helper pour créer le client Supabase
async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore
          }
        },
      },
    }
  );
}

// ===========================================
// GET - Liste des conversations
// ===========================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      // Récupérer une conversation spécifique
      const conversation = await prisma.conversationQualiopi.findFirst({
        where: {
          id: conversationId,
          organizationId: dbUser.organizationId,
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
        organizationId: dbUser.organizationId,
        userId: dbUser.id,
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
    console.error("[API] GET /api/agent-qualiopi/chat error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// POST - Envoyer un message
// ===========================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
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

    // Vérifier la conversation si fournie
    if (conversationId) {
      const conversation = await prisma.conversationQualiopi.findFirst({
        where: {
          id: conversationId,
          organizationId: dbUser.organizationId,
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
      organizationId: dbUser.organizationId,
      userId: dbUser.id,
      conversationId,
    });

    // Récupérer l'ID de la conversation
    const conversation = await prisma.conversationQualiopi.findFirst({
      where: {
        organizationId: dbUser.organizationId,
        userId: dbUser.id,
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });

    return NextResponse.json({
      ...response,
      conversationId: conversation?.id,
    });
  } catch (error) {
    console.error("[API] POST /api/agent-qualiopi/chat error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
