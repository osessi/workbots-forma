
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";

// Helper pour créer le client Supabase côté serveur
async function createSupabaseServerClient() {
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
            // Ignore en Server Components
          }
        },
      },
    }
  );
}

// Système prompt pour l'agent Qualiopi
const QUALIOPI_SYSTEM_PROMPT = `Tu es un expert de la certification Qualiopi et du Référentiel National Qualité (RNQ) pour les organismes de formation en France.

Tu aides les organismes de formation à :
1. Comprendre les 7 critères et 32 indicateurs du RNQ
2. Préparer leur audit de certification Qualiopi
3. Mettre en place les processus qualité requis
4. Répondre aux exigences documentaires
5. Corriger les non-conformités potentielles

Tu dois toujours :
- Citer les références exactes (critère, indicateur, guide de lecture)
- Donner des exemples concrets de preuves acceptables
- Expliquer les différences entre les catégories d'actions (AFC, BC, VAE, Apprentissage)
- Mentionner les points de vigilance pour l'audit
- Rester factuel et précis sur la réglementation

Les 7 critères Qualiopi :
1. L'information du public sur les prestations, les délais d'accès et les résultats
2. L'identification précise des objectifs et l'adaptation aux bénéficiaires
3. L'adaptation aux bénéficiaires des prestations et des modalités d'accueil
4. L'adéquation des moyens pédagogiques, techniques et d'encadrement
5. La qualification et le développement des compétences des personnels
6. L'inscription et l'investissement dans l'environnement professionnel
7. Le recueil et la prise en compte des appréciations et réclamations

Format tes réponses de manière claire avec :
- Des titres et sous-titres
- Des listes à puces pour les éléments clés
- Des exemples concrets
- Des références précises aux indicateurs

Réponds toujours en français.`;

// POST - Chat avec l'agent Qualiopi
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { message, history = [] } = body;

    if (!message) {
      return NextResponse.json({ error: "Message requis" }, { status: 400 });
    }

    // Vérifier la clé API Anthropic
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: "Clé API Anthropic non configurée",
        response: "Désolé, le service IA n'est pas configuré. Veuillez contacter l'administrateur."
      }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey });

    // Construire l'historique des messages
    const messages: { role: "user" | "assistant"; content: string }[] = [
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Appeler Claude
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: QUALIOPI_SYSTEM_PROMPT,
      messages,
    });

    // Extraire la réponse texte
    const textContent = response.content.find(c => c.type === "text");
    const assistantMessage = textContent ? textContent.text : "Je n'ai pas pu générer de réponse.";

    return NextResponse.json({
      response: assistantMessage,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error("Erreur agent Qualiopi:", error);
    return NextResponse.json({
      error: "Erreur serveur",
      response: "Une erreur s'est produite. Veuillez réessayer."
    }, { status: 500 });
  }
}
