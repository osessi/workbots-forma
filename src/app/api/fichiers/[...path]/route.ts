// ===========================================
// API: PROXY FICHIERS - Masque les URLs Supabase
// GET /api/fichiers/[...path] - Télécharger un fichier
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Bucket Supabase Storage
const STORAGE_BUCKET = "worksbots-forma-stockage";

// Client admin avec service role (bypass RLS) pour le téléchargement
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Helper pour créer le client Supabase (authentification)
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

    // Reconstruire le chemin du fichier (décoder chaque segment)
    const filePath = path.map(segment => decodeURIComponent(segment)).join("/");

    // Vérifier si c'est un chemin d'image publique (logos, signatures, cachets, avatars, photos intervenants)
    const isPublicImage = filePath.startsWith("logos/") ||
                          filePath.startsWith("signatures/") ||
                          filePath.startsWith("cachets/") ||
                          filePath.startsWith("avatars/") ||
                          filePath.startsWith("intervenants-photos/");

    // Pour les fichiers non-publics, vérifier l'authentification
    if (!isPublicImage) {
      const supabase = await getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }
    }

    // Télécharger le fichier depuis Supabase Storage avec le client admin (bypass RLS)
    const adminClient = getAdminClient();
    const { data, error } = await adminClient.storage
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
      html: "text/html",
      json: "application/json",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
      zip: "application/zip",
    };

    const contentType = mimeTypes[extension] || "application/octet-stream";

    // Extraire le nom du fichier original
    const pathParts = filePath.split("/");
    const fileName = pathParts[pathParts.length - 1] || "fichier";
    // Retirer le timestamp du début si présent (format: {timestamp}_{filename})
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
    console.error("[API] GET /api/fichiers/[...path] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
