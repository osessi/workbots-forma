import { NextResponse } from 'next/server';

// Liste des modèles Anthropic disponibles (mis à jour décembre 2025)
const ANTHROPIC_MODELS = [
  // Claude 4.5 series (latest flagship)
  'claude-opus-4-5-20251101',
  'claude-sonnet-4-5-20251101',
  // Claude 4 series
  'claude-opus-4-20250514',
  'claude-sonnet-4-20250514',
  // Claude 3.5 series
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  // Claude 3 series
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
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

    // Vérifier si la clé API est valide en faisant une requête simple à Anthropic
    // Pour éviter les appels inutiles, on retourne directement la liste si la clé existe
    if (api_key.startsWith('sk-ant-')) {
      return NextResponse.json(ANTHROPIC_MODELS);
    }

    // Si la clé ne semble pas valide, retourner une erreur
    return NextResponse.json(
      { error: 'Invalid API key format' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error checking Anthropic models:', error);
    return NextResponse.json(
      { error: 'Failed to check models' },
      { status: 500 }
    );
  }
}
