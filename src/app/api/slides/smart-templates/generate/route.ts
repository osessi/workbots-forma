/**
 * Smart Templates - Generate Presentation Route
 * Generates a presentation using AI and a smart template
 */

import { NextResponse } from "next/server";

const BACKEND_URL = process.env.SLIDES_API_URL || "http://localhost:8000";

// POST /api/slides/smart-templates/generate - Generate presentation
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Forward to backend with extended timeout (3 minutes for AI generation)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000);

    const response = await fetch(`${BACKEND_URL}/api/v1/ppt/smart-templates/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error generating presentation:", error);

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timed out - generation is taking too long" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate presentation" },
      { status: 500 }
    );
  }
}
