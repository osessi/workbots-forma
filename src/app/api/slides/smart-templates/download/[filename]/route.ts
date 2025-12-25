/**
 * Smart Templates - Download Generated Presentation
 */

import { NextResponse } from "next/server";

const BACKEND_URL = process.env.SLIDES_API_URL || "http://localhost:8000";

// GET /api/slides/smart-templates/download/[filename] - Download presentation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/ppt/smart-templates/download/${filename}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "File not found" },
        { status: response.status }
      );
    }

    // Get the blob data
    const blob = await response.blob();

    // Return as file response
    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error downloading presentation:", error);
    return NextResponse.json(
      { error: "Failed to download presentation" },
      { status: 500 }
    );
  }
}
