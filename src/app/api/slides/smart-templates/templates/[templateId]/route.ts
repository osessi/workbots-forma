/**
 * Smart Templates - Individual Template Routes
 */

import { NextResponse } from "next/server";

const BACKEND_URL = process.env.SLIDES_API_URL || "http://localhost:8000";

// GET /api/slides/smart-templates/templates/[templateId] - Get template details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/ppt/smart-templates/templates/${templateId}/design-system`,
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
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// DELETE /api/slides/smart-templates/templates/[templateId] - Delete template
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/ppt/smart-templates/templates/${templateId}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
