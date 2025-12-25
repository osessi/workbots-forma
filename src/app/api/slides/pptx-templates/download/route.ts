/**
 * PPTX Template Download API
 *
 * Downloads generated PPTX files.
 * Handles the path conversion between backend paths and accessible URLs.
 */

import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.SLIDES_API_URL || 'http://localhost:8000';

// GET: Download generated PPTX file
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'path parameter is required' },
        { status: 400 }
      );
    }

    // Convert the file path to download URL
    // Backend stores files in /tmp/slides-api-data/exports/...
    // We access them via /app_data/exports/...
    let downloadPath = filePath;

    // Handle different path formats
    if (filePath.includes('/tmp/slides-api-data/')) {
      downloadPath = filePath.replace('/tmp/slides-api-data/', '/app_data/');
    } else if (filePath.includes('/app_data/')) {
      downloadPath = filePath;
    } else {
      // Assume it's just the filename
      downloadPath = `/app_data/exports/${filePath}`;
    }

    // Fetch the file from the backend
    const response = await fetch(`${BACKEND_URL}${downloadPath}`);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Get the file content
    const fileBuffer = await response.arrayBuffer();
    const filename = filePath.split('/').pop() || 'presentation.pptx';

    // Return the file with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': fileBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
