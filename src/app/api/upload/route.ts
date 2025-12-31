// ===========================================
// API ROUTE - Upload de fichiers génériques
// ===========================================
// Upload de fichiers (PDF, images) via le serveur (bypass RLS avec service role)

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

const STORAGE_BUCKET = "worksbots-forma-stockage";

// Types de fichiers autorisés
const ALLOWED_TYPES: Record<string, string[]> = {
  "certificat-qualiopi": ["application/pdf"],
  "referentiel-rs": ["application/pdf"], // Qualiopi IND 3 - Référentiel RS
  "document": ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  "image": ["image/jpeg", "image/png", "image/webp", "image/gif"],
  "organigramme-photo": ["image/jpeg", "image/png", "image/webp", "image/gif"], // Qualiopi IND 9
};

// Tailles maximales par type (en bytes)
const MAX_SIZES: Record<string, number> = {
  "certificat-qualiopi": 10 * 1024 * 1024, // 10MB
  "referentiel-rs": 10 * 1024 * 1024, // 10MB - Qualiopi IND 3
  "document": 20 * 1024 * 1024, // 20MB
  "image": 5 * 1024 * 1024, // 5MB
  "organigramme-photo": 5 * 1024 * 1024, // 5MB - Qualiopi IND 9
};

// Client admin avec service role (bypass RLS)
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

export async function POST(request: NextRequest) {
  try {
    // Client pour vérifier l'auth de l'utilisateur
    const cookieStore = await cookies();
    const authClient = createServerClient(
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
              // Ignore errors in Server Components
            }
          },
        },
      }
    );

    // Client admin pour le storage (bypass RLS)
    const adminClient = getAdminClient();

    // Vérifier l'authentification avec le client auth
    const { data: { user: supabaseUser }, error: authError } = await authClient.auth.getUser();

    if (authError || !supabaseUser) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer l'utilisateur et son organisation
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: { organizationId: true, email: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer le fichier
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = (formData.get("type") as string) || "document";

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    const allowedMimeTypes = ALLOWED_TYPES[type] || ALLOWED_TYPES["document"];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Type de fichier non autorisé. Types acceptés: ${allowedMimeTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Vérifier la taille
    const maxSize = MAX_SIZES[type] || MAX_SIZES["document"];
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Le fichier ne doit pas dépasser ${Math.round(maxSize / 1024 / 1024)}MB` },
        { status: 400 }
      );
    }

    // Générer le chemin
    const timestamp = Date.now();
    const ext = file.name.split(".").pop()?.toLowerCase() || (file.type === "application/pdf" ? "pdf" : "jpg");
    const sanitizedOrgId = user.organizationId.replace(/[^a-zA-Z0-9]/g, "_");

    // Déterminer le dossier selon le type
    let folder: string;
    switch (type) {
      case "certificat-qualiopi":
        folder = "certificats-qualiopi";
        break;
      case "referentiel-rs":
        folder = "referentiels-rs"; // Qualiopi IND 3
        break;
      case "organigramme-photo":
        folder = "organigramme-photos"; // Qualiopi IND 9
        break;
      case "image":
        folder = "images";
        break;
      default:
        folder = "documents";
    }

    const path = `${folder}/${sanitizedOrgId}/${timestamp}.${ext}`;

    // Convertir File en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    console.log("=== Upload File ===");
    console.log("Type:", type);
    console.log("Org ID:", user.organizationId);
    console.log("Path:", path);
    console.log("File size:", buffer.length);

    // Upload vers Supabase Storage avec le client admin (bypass RLS)
    const { data, error } = await adminClient.storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json(
        { error: `Erreur storage: ${error.message}` },
        { status: 500 }
      );
    }

    console.log("Upload success:", data.path);

    // Retourner une URL proxy au lieu de l'URL Supabase publique
    const proxyUrl = `/api/fichiers/${data.path}`;

    return NextResponse.json({
      success: true,
      url: proxyUrl,
      path: data.path,
    });
  } catch (error) {
    console.error("File upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de l'upload: ${errorMessage}` },
      { status: 500 }
    );
  }
}
