/**
 * Smart Templates - Get Thumbnails Route
 */

import { NextResponse } from "next/server";

const BACKEND_URL = process.env.SLIDES_API_URL || "http://localhost:8000";

// GET /api/slides/smart-templates/templates/[templateId]/thumbnails - Get all thumbnails
export async function GET(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/ppt/smart-templates/templates/${templateId}/thumbnails`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching thumbnails:", error);
    return NextResponse.json(
      { error: "Failed to fetch thumbnails" },
      { status: 500 }
    );
  }
}
