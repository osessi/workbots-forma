/**
 * PPTX Template Detail API - Next.js Proxy
 *
 * Handles individual template operations:
 * - Get template details
 * - Delete template
 * - Re-analyze template
 */

import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.SLIDES_API_URL || 'http://localhost:8000';

// GET: Get template details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;

    const response = await fetch(
      `${BACKEND_URL}/api/v1/ppt/pptx-templates/${templateId}`
    );
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// DELETE: Delete template
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;

    const response = await fetch(
      `${BACKEND_URL}/api/v1/ppt/pptx-templates/${templateId}`,
      { method: 'DELETE' }
    );
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
