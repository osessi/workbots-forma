import { NextResponse } from 'next/server';

// Liste des modèles Google Gemini disponibles (mis à jour décembre 2025)
const GOOGLE_MODELS = [
  // Gemini 2.5 series (latest flagship)
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  // Gemini 2.0 series
  'gemini-2.0-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  // Gemini 1.5 series
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
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

    // Vérifier si la clé API semble valide (les clés Google commencent généralement par AIza)
    if (api_key.startsWith('AIza')) {
      return NextResponse.json(GOOGLE_MODELS);
    }

    return NextResponse.json(
      { error: 'Invalid API key format' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error checking Google models:', error);
    return NextResponse.json(
      { error: 'Failed to check models' },
      { status: 500 }
    );
  }
}
