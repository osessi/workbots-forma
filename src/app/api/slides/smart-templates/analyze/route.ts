/**
 * Smart Templates - Analyze Template Route
 * Uploads and analyzes a PPTX template to extract the design system
 */

import { NextResponse } from "next/server";

const BACKEND_URL = process.env.SLIDES_API_URL || "http://localhost:8000";

// POST /api/slides/smart-templates/analyze - Upload and analyze template
export async function POST(request: Request) {
  try {
    // Get the form data
    const formData = await request.formData();

    // Forward to backend with extended timeout (2 minutes for large files)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const response = await fetch(`${BACKEND_URL}/api/v1/ppt/smart-templates/analyze`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error analyzing template:", error);

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timed out - template analysis is taking too long" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Failed to analyze template" },
      { status: 500 }
    );
  }
}
