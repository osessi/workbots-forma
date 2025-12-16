// ===========================================
// API ROUTE - Upload Avatar
// ===========================================
// Upload d'avatar utilisateur via le serveur (contourne les problèmes RLS)

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

const STORAGE_BUCKET = "automate-files";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    // Vérifier l'authentification
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !supabaseUser) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer le fichier
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string || "avatar"; // avatar ou logo

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Vérifier le type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Le fichier doit être une image" },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "L'image ne doit pas dépasser 5MB" },
        { status: 400 }
      );
    }

    // Générer le chemin
    const timestamp = Date.now();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const sanitizedId = supabaseUser.id.replace(/[^a-zA-Z0-9]/g, "_");
    const folder = type === "logo" ? "logos" : "avatars";
    const path = `${folder}/${sanitizedId}/${timestamp}.${ext}`;

    // Convertir File en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
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

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    // Mettre à jour l'utilisateur dans Prisma si c'est un avatar
    if (type === "avatar") {
      await prisma.user.update({
        where: { supabaseId: supabaseUser.id },
        data: { avatar: publicUrl },
      });
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}
