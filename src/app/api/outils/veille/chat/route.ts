// ===========================================
// API VEILLE - Agent IA Conversationnel
// Chat avec l'IA sur les actualités de veille
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { VeilleType } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// Prompts système par type de veille
const systemPrompts: Record<VeilleType, string> = {
  LEGALE: `Tu es un expert en veille légale et réglementaire pour les organismes de formation professionnelle en France.

Ton rôle est d'aider les responsables d'organismes de formation à comprendre:
- Les évolutions législatives et réglementaires (lois, décrets, arrêtés)
- Les textes de France Compétences et du Ministère du Travail
- Les impacts sur la certification Qualiopi (Indicateur 23)
- Les obligations légales des organismes de formation

Tu as accès aux derniers articles de veille fournis ci-dessous. Utilise-les pour répondre aux questions.

Sois précis, cite tes sources quand possible, et explique l'impact concret sur les pratiques de l'organisme de formation.`,

  METIER: `Tu es un expert en veille métiers et compétences pour les organismes de formation professionnelle en France.

Ton rôle est d'aider à comprendre:
- Les évolutions des métiers et des compétences attendues
- Les publications des OPCO et observatoires métiers
- Les tendances du marché de l'emploi (France Travail)
- Les nouvelles certifications et titres professionnels
- Les impacts sur les programmes de formation (Indicateur 24)

Tu as accès aux derniers articles de veille fournis ci-dessous. Utilise-les pour répondre aux questions.

Sois concret et donne des recommandations pratiques pour adapter l'offre de formation.`,

  INNOVATION: `Tu es un expert en innovation pédagogique pour les organismes de formation professionnelle.

Ton rôle est d'aider à comprendre:
- Les nouvelles méthodes et outils pédagogiques
- Les technologies EdTech émergentes
- Les tendances en digital learning
- Les bonnes pratiques d'ingénierie pédagogique
- Les impacts sur la qualité des formations (Indicateur 24)

Tu as accès aux derniers articles de veille fournis ci-dessous. Utilise-les pour répondre aux questions.

Sois enthousiaste mais réaliste sur l'adoption des innovations, en tenant compte des contraintes des OF.`,

  HANDICAP: `Tu es un expert en accessibilité et handicap pour les organismes de formation professionnelle.

Ton rôle est d'aider à comprendre:
- La réglementation sur l'accessibilité des formations
- Les aides de l'AGEFIPH et du FIPHFP
- Les bonnes pratiques d'accueil des personnes en situation de handicap
- L'adaptation des parcours de formation
- Les impacts sur la conformité Qualiopi (Indicateur 25)

Tu as accès aux derniers articles de veille fournis ci-dessous. Utilise-les pour répondre aux questions.

Sois sensible aux enjeux d'inclusion et donne des conseils pratiques et accessibles.`,
};

// POST - Envoyer un message au chat
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const { message, type, conversationId } = body;

    if (!message || !type) {
      return NextResponse.json(
        { error: "message et type sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que le type est valide
    if (!["LEGALE", "METIER", "INNOVATION", "HANDICAP"].includes(type)) {
      return NextResponse.json(
        { error: "Type de veille invalide" },
        { status: 400 }
      );
    }

    // Récupérer ou créer la conversation
    let conversation = conversationId
      ? await prisma.veilleConversation.findUnique({
          where: { id: conversationId },
        })
      : null;

    // Vérifier que la conversation appartient à l'utilisateur
    if (conversation && (conversation.userId !== user.id || conversation.organizationId !== user.organizationId)) {
      return NextResponse.json(
        { error: "Conversation non autorisée" },
        { status: 403 }
      );
    }

    // Récupérer les derniers articles pour ce type de veille
    const recentArticles = await prisma.veilleArticle.findMany({
      where: {
        type: type as VeilleType,
      },
      select: {
        titre: true,
        resume: true,
        resumeIA: true,
        pointsCles: true,
        impactQualiopi: true,
        url: true,
        datePublication: true,
        source: {
          select: {
            nom: true,
          },
        },
      },
      orderBy: {
        datePublication: "desc",
      },
      take: 10,
    });

    // Construire le contexte des articles
    const articlesContext = recentArticles.length > 0
      ? `\n\n=== DERNIERS ARTICLES DE VEILLE ===\n${recentArticles.map((a, i) => `
[${i + 1}] ${a.titre}
Source: ${a.source.nom} | Date: ${a.datePublication.toLocaleDateString("fr-FR")}
Résumé: ${a.resumeIA || a.resume || "N/A"}
Points clés: ${a.pointsCles.join(", ") || "N/A"}
Impact Qualiopi: ${a.impactQualiopi || "N/A"}
URL: ${a.url}
`).join("\n")}`
      : "\n\n(Aucun article de veille récent disponible pour ce type.)";

    // Construire l'historique des messages
    const existingMessages: ChatMessage[] = conversation
      ? (conversation.messages as unknown as ChatMessage[])
      : [];

    // Préparer les messages pour Claude
    const claudeMessages = [
      ...existingMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      {
        role: "user" as const,
        content: message,
      },
    ];

    // Appeler Claude
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const systemContent = `${systemPrompts[type as VeilleType]}${articlesContext}

Règles importantes:
- Réponds toujours en français
- Sois concis mais complet
- Cite les articles pertinents avec leur numéro [X] quand tu les utilises
- Si tu ne sais pas, dis-le honnêtement
- Pour les questions sur Qualiopi, mentionne l'indicateur concerné`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemContent,
      messages: claudeMessages,
    });

    const assistantContent = response.content[0];
    if (assistantContent.type !== "text") {
      return NextResponse.json(
        { error: "Réponse invalide de l'IA" },
        { status: 500 }
      );
    }

    const assistantMessage = assistantContent.text;

    // Mettre à jour l'historique
    const newMessages: ChatMessage[] = [
      ...existingMessages,
      {
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      },
      {
        role: "assistant",
        content: assistantMessage,
        timestamp: new Date().toISOString(),
      },
    ];

    // Limiter l'historique à 50 messages pour éviter des tokens excessifs
    const trimmedMessages = newMessages.slice(-50);

    // Sauvegarder la conversation
    if (conversation) {
      await prisma.veilleConversation.update({
        where: { id: conversation.id },
        data: {
          messages: JSON.parse(JSON.stringify(trimmedMessages)),
        },
      });
    } else {
      conversation = await prisma.veilleConversation.create({
        data: {
          type: type as VeilleType,
          organizationId: user.organizationId,
          userId: user.id,
          messages: JSON.parse(JSON.stringify(trimmedMessages)),
        },
      });
    }

    return NextResponse.json({
      conversationId: conversation.id,
      message: assistantMessage,
      articlesCount: recentArticles.length,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error("Erreur chat veille:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de la réponse" },
      { status: 500 }
    );
  }
}

// GET - Récupérer l'historique de conversation
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") as VeilleType | null;
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      // Récupérer une conversation spécifique
      const conversation = await prisma.veilleConversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation || conversation.userId !== user.id) {
        return NextResponse.json({ error: "Conversation non trouvée" }, { status: 404 });
      }

      return NextResponse.json(conversation);
    }

    // Récupérer les conversations de l'utilisateur
    const whereClause: Record<string, unknown> = {
      userId: user.id,
      organizationId: user.organizationId,
    };

    if (type) {
      whereClause.type = type;
    }

    const conversations = await prisma.veilleConversation.findMany({
      where: whereClause,
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Erreur récupération conversations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une conversation
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId requis" }, { status: 400 });
    }

    // Vérifier que la conversation appartient à l'utilisateur
    const conversation = await prisma.veilleConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.userId !== user.id) {
      return NextResponse.json({ error: "Conversation non trouvée" }, { status: 404 });
    }

    await prisma.veilleConversation.delete({
      where: { id: conversationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression conversation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
