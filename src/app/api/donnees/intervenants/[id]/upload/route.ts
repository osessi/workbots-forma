// ===========================================
// API UPLOAD FICHIERS INTERVENANT
// Qualiopi IND 17 - Photo et CV
// ===========================================

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

const STORAGE_BUCKET = "worksbots-forma-stockage";

// Types de fichiers autorisés
const ALLOWED_TYPES: Record<string, string[]> = {
  photo: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  cv: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

// Tailles maximales par type (en bytes)
const MAX_SIZES: Record<string, number> = {
  photo: 5 * 1024 * 1024, // 5MB
  cv: 10 * 1024 * 1024, // 10MB
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: intervenantId } = await params;

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

    // Vérifier l'authentification
    const {
      data: { user: supabaseUser },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !supabaseUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur et son organisation
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'intervenant appartient à l'organisation
    const intervenant = await prisma.intervenant.findFirst({
      where: {
        id: intervenantId,
        organizationId: user.organizationId,
      },
    });

    if (!intervenant) {
      return NextResponse.json(
        { error: "Intervenant non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer le fichier
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = (formData.get("type") as string) || "photo"; // "photo" ou "cv"

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    const allowedMimeTypes = ALLOWED_TYPES[type];
    if (!allowedMimeTypes) {
      return NextResponse.json(
        { error: "Type de fichier non reconnu" },
        { status: 400 }
      );
    }

    if (!allowedMimeTypes.includes(file.type)) {
      const friendlyTypes =
        type === "photo"
          ? "JPG, PNG, WebP, GIF"
          : "PDF, Word (.doc, .docx)";
      return NextResponse.json(
        { error: `Type de fichier non autorisé. Types acceptés: ${friendlyTypes}` },
        { status: 400 }
      );
    }

    // Vérifier la taille
    const maxSize = MAX_SIZES[type];
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `Le fichier ne doit pas dépasser ${Math.round(maxSize / 1024 / 1024)}MB`,
        },
        { status: 400 }
      );
    }

    // Générer le chemin de stockage
    const timestamp = Date.now();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const sanitizedOrgId = user.organizationId.replace(/[^a-zA-Z0-9]/g, "_");
    const folder = type === "photo" ? "intervenants-photos" : "intervenants-cv";
    const path = `${folder}/${sanitizedOrgId}/${intervenantId}_${timestamp}.${ext}`;

    // Convertir File en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    console.log("=== Upload Intervenant File ===");
    console.log("Type:", type);
    console.log("Intervenant ID:", intervenantId);
    console.log("Path:", path);
    console.log("File size:", buffer.length);

    // Upload vers Supabase Storage
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

    // Mettre à jour l'intervenant avec l'URL proxy
    const updateData = type === "photo" ? { photoUrl: proxyUrl } : { cv: proxyUrl };

    await prisma.intervenant.update({
      where: { id: intervenantId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      url: proxyUrl,
      path: data.path,
      type,
    });
  } catch (error) {
    console.error("Intervenant file upload error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de l'upload: ${errorMessage}` },
      { status: 500 }
    );
  }
}
