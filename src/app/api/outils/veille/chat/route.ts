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

    // Correction 408: Récupérer les articles de veille pour ce type
    // En priorité les articles des sources de l'organisation, sinon tous les articles du type
    const recentArticles = await prisma.veilleArticle.findMany({
      where: {
        type: type as VeilleType,
        // On récupère tous les articles du type (sources globales + sources org)
        // pour avoir un contexte riche pour l'IA
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
            organizationId: true,
          },
        },
      },
      orderBy: {
        datePublication: "desc",
      },
      take: 30, // Augmenté de 10 à 30 pour un meilleur contexte
    });

    // Correction 408: Construire le contexte des articles avec plus d'infos
    const articlesContext = recentArticles.length > 0
      ? `\n\n=== ${recentArticles.length} ARTICLES DE VEILLE DISPONIBLES ===\n${recentArticles.map((a, i) => `
[${i + 1}] ${a.titre}
Source: ${a.source.nom} | Date: ${a.datePublication.toLocaleDateString("fr-FR")}
${a.resumeIA ? `Résumé IA: ${a.resumeIA}` : (a.resume ? `Résumé: ${a.resume}` : "")}
${a.pointsCles && a.pointsCles.length > 0 ? `Points clés: ${a.pointsCles.join(", ")}` : ""}
${a.impactQualiopi ? `Impact Qualiopi: ${a.impactQualiopi}` : ""}
URL: ${a.url}
`).join("\n")}`
      : "\n\n⚠️ AUCUN ARTICLE DE VEILLE DISPONIBLE pour ce type. Informe l'utilisateur qu'il n'y a pas encore d'articles dans cette catégorie de veille.";

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
      // Correction 409: Générer un titre automatique basé sur le premier message
      const autoTitre = message.length > 50
        ? message.substring(0, 47) + "..."
        : message;

      conversation = await prisma.veilleConversation.create({
        data: {
          type: type as VeilleType,
          organizationId: user.organizationId,
          userId: user.id,
          titre: autoTitre,
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
    const search = searchParams.get("search"); // Correction 409: recherche
    const pinnedOnly = searchParams.get("pinnedOnly") === "true"; // Correction 409: filtre épinglés

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
    // Correction 409: Support de la recherche et du filtre épinglés
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      userId: user.id,
      organizationId: user.organizationId,
    };

    if (type) {
      whereClause.type = type;
    }

    if (pinnedOnly) {
      whereClause.isPinned = true;
    }

    // Correction 409: Recherche par titre ou contenu des messages
    if (search && search.trim()) {
      whereClause.OR = [
        { titre: { contains: search.trim(), mode: "insensitive" } },
        // Recherche dans le JSON des messages (fonctionne avec PostgreSQL)
        { messages: { string_contains: search.trim() } },
      ];
    }

    const conversations = await prisma.veilleConversation.findMany({
      where: whereClause,
      orderBy: [
        { isPinned: "desc" }, // Épinglés en premier
        { updatedAt: "desc" },
      ],
      take: 50, // Augmenté pour l'historique
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

// Correction 409: PATCH - Renommer ou épingler une conversation
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { conversationId, titre, isPinned } = body;

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

    // Mettre à jour la conversation
    const updateData: { titre?: string; isPinned?: boolean } = {};
    if (titre !== undefined) {
      updateData.titre = titre;
    }
    if (isPinned !== undefined) {
      updateData.isPinned = isPinned;
    }

    const updatedConversation = await prisma.veilleConversation.update({
      where: { id: conversationId },
      data: updateData,
    });

    return NextResponse.json(updatedConversation);
  } catch (error) {
    console.error("Erreur mise à jour conversation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
