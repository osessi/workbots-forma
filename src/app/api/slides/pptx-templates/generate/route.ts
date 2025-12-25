/**
 * PPTX Template Generate API - Next.js Proxy
 *
 * Generates a new PPTX presentation from a template.
 * This endpoint preserves the original template quality
 * while replacing content in placeholders.
 */

import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.SLIDES_API_URL || 'http://localhost:8000';

interface SlideContent {
  title?: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  image?: {
    url: string;
    prompt?: string;
  };
  speaker_notes?: string;
}

interface GenerateRequest {
  template_id: string;
  slides: SlideContent[];
  output_filename?: string;
  options?: Record<string, unknown>;
}

// POST: Generate presentation from template
export async function POST(request: Request) {
  try {
    const body: GenerateRequest = await request.json();

    // Validate required fields
    if (!body.template_id) {
      return NextResponse.json(
        { error: 'template_id is required' },
        { status: 400 }
      );
    }

    if (!body.slides || !Array.isArray(body.slides) || body.slides.length === 0) {
      return NextResponse.json(
        { error: 'slides array is required and must not be empty' },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/ppt/pptx-templates/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Return the download URL
    return NextResponse.json({
      success: true,
      file_path: data.file_path,
      download_url: `/api/slides/pptx-templates/download?path=${encodeURIComponent(data.file_path)}`,
      message: data.message,
    });
  } catch (error) {
    console.error('Error generating from template:', error);
    return NextResponse.json(
      { error: 'Failed to generate presentation from template' },
      { status: 500 }
    );
  }
}
