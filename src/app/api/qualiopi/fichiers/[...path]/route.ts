// ===========================================
// API: PROXY FICHIERS QUALIOPI
// GET /api/qualiopi/fichiers/[...path] - Télécharger un fichier
// Cette route proxy masque l'URL Supabase Storage
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// Bucket Supabase Storage
const STORAGE_BUCKET = "worksbots-forma-stockage";

// Helper pour créer le client Supabase
async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore
          }
        },
      },
    }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;

    if (!path || path.length === 0) {
      return NextResponse.json(
        { error: "Chemin du fichier requis" },
        { status: 400 }
      );
    }

    // Reconstruire le chemin du fichier
    const filePath = decodeURIComponent(path.join("/"));

    // Authentification
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son organisation
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que le fichier appartient à l'organisation de l'utilisateur
    // Le chemin est de la forme: preuves/{organizationId}/{numeroIndicateur}/{timestamp}_{filename}
    const pathParts = filePath.split("/");
    if (pathParts.length >= 2 && pathParts[0] === "preuves") {
      const fileOrgId = pathParts[1];
      if (fileOrgId !== dbUser.organizationId) {
        return NextResponse.json(
          { error: "Accès non autorisé" },
          { status: 403 }
        );
      }
    }

    // Télécharger le fichier depuis Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(filePath);

    if (error) {
      console.error("[Fichiers] Erreur download:", error);
      return NextResponse.json(
        { error: "Fichier non trouvé" },
        { status: 404 }
      );
    }

    // Déterminer le type MIME basé sur l'extension
    const extension = filePath.split(".").pop()?.toLowerCase() || "";
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      txt: "text/plain",
      csv: "text/csv",
    };

    const contentType = mimeTypes[extension] || "application/octet-stream";

    // Extraire le nom du fichier original
    const fileName = pathParts[pathParts.length - 1] || "fichier";
    // Retirer le timestamp du début (format: {timestamp}_{filename})
    const originalFileName = fileName.includes("_")
      ? fileName.substring(fileName.indexOf("_") + 1)
      : fileName;

    // Retourner le fichier avec les headers appropriés
    const arrayBuffer = await data.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${originalFileName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[API] GET /api/qualiopi/fichiers/[...path] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
