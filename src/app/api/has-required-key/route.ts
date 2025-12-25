import { NextResponse } from 'next/server';

export async function GET() {
  // Vérifie si les clés API nécessaires sont présentes dans les variables d'environnement
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  const hasGoogleKey = !!process.env.GOOGLE_API_KEY;
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;

  // Pour la création de templates custom, on a besoin d'au moins une clé LLM
  // OpenAI ou Google sont préférés pour le traitement des layouts
  const hasKey = hasOpenAIKey || hasGoogleKey || hasAnthropicKey;

  return NextResponse.json({
    hasKey,
    keys: {
      openai: hasOpenAIKey,
      google: hasGoogleKey,
      anthropic: hasAnthropicKey
    }
  });
}
