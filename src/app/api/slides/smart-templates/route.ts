/**
 * Smart Templates API - Main Routes
 * Proxies requests to the FastAPI backend
 */

import { NextResponse } from "next/server";

const BACKEND_URL = process.env.SLIDES_API_URL || "http://localhost:8000";

// Proxy helper with extended timeout
async function proxyToBackend(
  path: string,
  options: RequestInit = {},
  timeout: number = 120000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// GET /api/slides/smart-templates - List templates (redirects to /templates)
export async function GET() {
  try {
    const response = await proxyToBackend("/api/v1/ppt/smart-templates/templates");
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error listing smart templates:", error);
    return NextResponse.json(
      { error: "Failed to list templates" },
      { status: 500 }
    );
  }
}
