import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Stockage de la configuration via cookies (en production, utiliser une base de données)

export async function GET() {
  // Récupérer la config depuis les cookies si elle existe
  const cookieStore = await cookies();
  const savedConfig = cookieStore.get('llm_config');

  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig.value);
      return NextResponse.json(config);
    } catch {
      // Si le parsing échoue, retourner la config par défaut
    }
  }

  // Configuration par défaut depuis .env
  const defaultConfig = {
    LLM: process.env.AI_PROVIDER || 'anthropic',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
    ANTHROPIC_MODEL: process.env.AI_MODEL || 'claude-sonnet-4-20250514',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    OPENAI_MODEL: 'gpt-4o',
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
    GOOGLE_MODEL: 'gemini-2.0-flash',
    OLLAMA_URL: process.env.OLLAMA_URL || 'http://localhost:11434',
    OLLAMA_MODEL: '',
    CUSTOM_LLM_URL: '',
    CUSTOM_LLM_API_KEY: '',
    CUSTOM_MODEL: '',
    DISABLE_IMAGE_GENERATION: false,
    IMAGE_PROVIDER: 'pexels',
    PEXELS_API_KEY: process.env.PEXELS_API_KEY || '',
    PIXABAY_API_KEY: '',
    COMFYUI_URL: '',
  };

  return NextResponse.json(defaultConfig);
}

export async function POST(request: Request) {
  try {
    const config = await request.json();

    // Sauvegarder la config dans un cookie (en production, utiliser une base de données)
    const response = NextResponse.json({ success: true });
    response.cookies.set('llm_config', JSON.stringify(config), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 an
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error saving config:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}
