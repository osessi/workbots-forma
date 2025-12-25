/**
 * Smart Templates - Templates List Route
 */

import { NextResponse } from "next/server";

const BACKEND_URL = process.env.SLIDES_API_URL || "http://localhost:8000";

// GET /api/slides/smart-templates/templates - List all templates
export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/ppt/smart-templates/templates`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error listing templates:", error);
    return NextResponse.json(
      { error: "Failed to list templates" },
      { status: 500 }
    );
  }
}
