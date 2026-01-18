// ===========================================
// API Route: GET /api/workbots/download
// Download generated presentation files
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";

const SLIDES_API_URL = process.env.SLIDES_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json(
        { error: "Paramètre 'path' requis" },
        { status: 400 }
      );
    }

    // Convert the file path from absolute system path to backend static URL
    // /tmp/slides-api-data/exports/... -> /app_data/exports/...
    let apiPath = filePath;
    if (filePath.includes("/slides-api-data/")) {
      apiPath = filePath.replace(/.*\/slides-api-data\//, "/app_data/");
    } else if (filePath.startsWith("/tmp/")) {
      // Handle other tmp paths
      apiPath = filePath.replace("/tmp/", "/app_data/");
    }

    // Fetch the file from the slides backend
    const fileUrl = `${SLIDES_API_URL}${apiPath.startsWith("/") ? "" : "/"}${apiPath}`;
    console.log(`Downloading file from: ${fileUrl}`);

    const response = await fetch(fileUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Fichier non trouvé" },
        { status: 404 }
      );
    }

    // Get file content
    const fileBuffer = await response.arrayBuffer();
    const contentType =
      response.headers.get("content-type") ||
      "application/vnd.openxmlformats-officedocument.presentationml.presentation";

    // Extract filename from path
    const fileName = filePath.split("/").pop() || "presentation.pptx";

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": fileBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Error in /api/workbots/download:", error);
    return NextResponse.json(
      {
        error: "Erreur lors du téléchargement",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
