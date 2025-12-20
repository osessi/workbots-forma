// ===========================================
// API ROUTE - Upload Avatar
// ===========================================
// Upload d'avatar utilisateur via le serveur (bypass RLS avec service role)

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

const STORAGE_BUCKET = "worksbots-forma-stockage";

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
    const folder = type === "logo" ? "logos" : type === "signature" ? "signatures" : "avatars";
    const path = `${folder}/${sanitizedId}/${timestamp}.${ext}`;

    // Convertir File en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    console.log("=== Upload Avatar ===");
    console.log("User ID:", supabaseUser.id);
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

    // Récupérer l'URL publique avec le client admin
    const { data: { publicUrl } } = adminClient.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    // Mettre à jour dans Prisma selon le type
    if (type === "avatar") {
      await prisma.user.update({
        where: { supabaseId: supabaseUser.id },
        data: { avatar: publicUrl },
      });
    } else if (type === "logo" || type === "signature") {
      // Récupérer l'utilisateur pour avoir son organizationId
      const user = await prisma.user.findUnique({
        where: { supabaseId: supabaseUser.id },
        select: { organizationId: true, email: true },
      });

      if (user?.organizationId) {
        // Mettre à jour l'organisation existante
        await prisma.organization.update({
          where: { id: user.organizationId },
          data: type === "logo" ? { logo: publicUrl } : { signature: publicUrl },
        });
      } else {
        // Créer une organisation pour l'utilisateur s'il n'en a pas
        const slug = user?.email?.split("@")[0]?.replace(/[^a-z0-9]/gi, "-").toLowerCase() || `org-${Date.now()}`;
        const newOrg = await prisma.organization.create({
          data: {
            name: "Mon entreprise",
            slug: slug,
            ...(type === "logo" ? { logo: publicUrl } : { signature: publicUrl }),
          },
        });
        // Associer l'organisation à l'utilisateur
        await prisma.user.update({
          where: { supabaseId: supabaseUser.id },
          data: { organizationId: newOrg.id },
        });
        console.log("Created new organization for user:", newOrg.id);
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de l'upload: ${errorMessage}` },
      { status: 500 }
    );
  }
}
