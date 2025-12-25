/**
 * PPTX Templates API - Next.js Proxy
 *
 * Proxies requests to the FastAPI backend for PPTX template management.
 * Provides:
 * - Template upload
 * - Template listing
 * - Template-based export generation
 */

import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.SLIDES_API_URL || 'http://localhost:8000';

// GET: List all templates
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const includeSystem = searchParams.get('includeSystem') !== 'false';

    let url = `${BACKEND_URL}/api/v1/ppt/pptx-templates/list?include_system=${includeSystem}`;
    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST: Upload a new template
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const response = await fetch(`${BACKEND_URL}/api/v1/ppt/pptx-templates/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error uploading template:', error);
    return NextResponse.json(
      { error: 'Failed to upload template' },
      { status: 500 }
    );
  }
}
