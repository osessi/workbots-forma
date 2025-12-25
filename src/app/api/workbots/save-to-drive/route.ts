// ===========================================
// API Route: POST /api/workbots/save-to-drive
// Save generated presentation to Drive storage
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { uploadFileServer } from "@/lib/supabase/storage";

const SLIDES_API_URL = process.env.SLIDES_API_URL || "http://localhost:8000";

interface SaveToDriveRequest {
  formationId: string;
  moduleId: string;
  moduleTitre: string;
  filePath: string; // Path from backend
  fileName?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Get user and organization
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { organization: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const body: SaveToDriveRequest = await request.json();
    const { formationId, moduleId, moduleTitre, filePath, fileName } = body;

    // Validate formation
    const formation = await prisma.formation.findFirst({
      where: {
        id: formationId,
        organizationId: dbUser.organizationId,
      },
      include: {
        folder: true,
      },
    });

    if (!formation) {
      return NextResponse.json(
        { error: "Formation non trouvée" },
        { status: 404 }
      );
    }

    // Get or create formation folder
    let formationFolder = formation.folder;
    if (!formationFolder) {
      formationFolder = await prisma.folder.create({
        data: {
          name: formation.titre,
          organizationId: dbUser.organizationId,
          formationId: formation.id,
          folderType: "formation",
          color: "#3B82F6",
        },
      });

      // Note: The folder already has formationId, so the relation is established from Folder side
    }

    // Convert the file path from absolute system path to backend static URL
    // /tmp/slides-api-data/exports/... -> /app_data/exports/...
    let apiPath = filePath;
    if (filePath.includes("/slides-api-data/")) {
      apiPath = filePath.replace(/.*\/slides-api-data\//, "/app_data/");
    } else if (filePath.startsWith("/tmp/")) {
      apiPath = filePath.replace("/tmp/", "/app_data/");
    }

    // Download file from slides backend
    const fileUrl = `${SLIDES_API_URL}${apiPath.startsWith("/") ? "" : "/"}${apiPath}`;
    console.log(`Downloading file for save-to-drive from: ${fileUrl}`);
    const response = await fetch(fileUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Fichier non trouvé sur le serveur de génération" },
        { status: 404 }
      );
    }

    const fileBuffer = Buffer.from(await response.arrayBuffer());
    const contentType =
      response.headers.get("content-type") ||
      "application/vnd.openxmlformats-officedocument.presentationml.presentation";

    // Generate filename
    const sanitizedModuleName = moduleTitre
      .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\s-]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);

    const finalFileName =
      fileName || `slides_${sanitizedModuleName}_${Date.now()}.pptx`;

    // Upload to Supabase Storage
    const uploadResult = await uploadFileServer(
      fileBuffer,
      finalFileName,
      contentType,
      {
        organizationId: dbUser.organizationId,
        category: "SLIDES",
        formationId: formationId,
        fileName: finalFileName,
      }
    );

    if (!uploadResult.path || !uploadResult.publicUrl) {
      return NextResponse.json(
        { error: "Erreur lors de l'upload vers le stockage" },
        { status: 500 }
      );
    }

    // Create File record in database
    const file = await prisma.file.create({
      data: {
        name: finalFileName,
        originalName: finalFileName,
        mimeType: contentType,
        size: fileBuffer.length,
        category: "SLIDES",
        storagePath: uploadResult.path,
        publicUrl: uploadResult.publicUrl,
        organizationId: dbUser.organizationId,
        userId: dbUser.id,
        formationId: formation.id,
        folderId: formationFolder.id,
      },
    });

    return NextResponse.json({
      success: true,
      file: {
        id: file.id,
        name: file.name,
        publicUrl: file.publicUrl,
        storagePath: file.storagePath,
        size: file.size,
      },
      message: "Fichier sauvegardé dans le Drive",
    });
  } catch (error) {
    console.error("Error in /api/workbots/save-to-drive:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la sauvegarde",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
