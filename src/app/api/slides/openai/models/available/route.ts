import { NextResponse } from 'next/server';

// Liste des modèles OpenAI disponibles (mis à jour décembre 2025)
const OPENAI_MODELS = [
  // GPT-5 series (latest flagship)
  'gpt-5',
  'gpt-5-mini',
  'gpt-5-turbo',
  // GPT-4.1 series
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  // O-series (reasoning models)
  'o4-mini',
  'o3',
  'o3-mini',
  'o1',
  'o1-mini',
  'o1-pro',
  // GPT-4o series
  'gpt-4o',
  'gpt-4o-mini',
  // GPT-4 series
  'gpt-4-turbo',
  'gpt-4',
  // GPT-3.5 series
  'gpt-3.5-turbo',
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { api_key } = body;

    if (!api_key) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Vérifier si la clé API semble valide
    if (api_key.startsWith('sk-')) {
      return NextResponse.json(OPENAI_MODELS);
    }

    return NextResponse.json(
      { error: 'Invalid API key format' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error checking OpenAI models:', error);
    return NextResponse.json(
      { error: 'Failed to check models' },
      { status: 500 }
    );
  }
}
