/**
 * Smart Templates - Update Layout Route
 * Updates a layout within a template's design system
 */

import { NextResponse } from "next/server";

const BACKEND_URL = process.env.SLIDES_API_URL || "http://localhost:8000";

// PUT /api/slides/smart-templates/templates/[templateId]/layouts - Update layout
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;

  try {
    const body = await request.json();

    const response = await fetch(
      `${BACKEND_URL}/api/v1/ppt/smart-templates/templates/${templateId}/layouts`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error updating layout:", error);
    return NextResponse.json(
      { error: "Failed to update layout" },
      { status: 500 }
    );
  }
}
