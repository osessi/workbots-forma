// ===========================================
// API UPLOAD JUSTIFICATIF DIPLOME
// Qualiopi IND 17 - Upload du justificatif PDF
// ===========================================

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

const STORAGE_BUCKET = "worksbots-forma-stockage";
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf"];

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

// POST - Upload du justificatif PDF pour un diplôme
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; diplomeId: string }> }
) {
  try {
    const { id: intervenantId, diplomeId } = await params;

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

    // Vérifier que le diplôme existe et appartient à cet intervenant
    const diplome = await prisma.intervenantDiplome.findFirst({
      where: {
        id: diplomeId,
        intervenantId,
      },
    });

    if (!diplome) {
      return NextResponse.json(
        { error: "Diplôme non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer le fichier
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non autorisé. Seuls les PDF sont acceptés." },
        { status: 400 }
      );
    }

    // Vérifier la taille
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Le fichier ne doit pas dépasser 10 MB" },
        { status: 400 }
      );
    }

    // Générer le chemin de stockage
    const timestamp = Date.now();
    const sanitizedOrgId = user.organizationId.replace(/[^a-zA-Z0-9]/g, "_");
    const path = `intervenants-diplomes/${sanitizedOrgId}/${intervenantId}_${diplomeId}_${timestamp}.pdf`;

    // Convertir File en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    console.log("=== Upload Diplome Justificatif ===");
    console.log("Intervenant ID:", intervenantId);
    console.log("Diplome ID:", diplomeId);
    console.log("Path:", path);
    console.log("File size:", buffer.length);

    // Supprimer l'ancien fichier s'il existe
    if (diplome.fichierUrl) {
      const pathMatch = diplome.fichierUrl.match(/\/api\/fichiers\/(.+)$/);
      if (pathMatch) {
        const oldPath = pathMatch[1];
        await adminClient.storage.from(STORAGE_BUCKET).remove([oldPath]);
      }
    }

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

    // Mettre à jour le diplôme avec l'URL proxy
    await prisma.intervenantDiplome.update({
      where: { id: diplomeId },
      data: { fichierUrl: proxyUrl },
    });

    return NextResponse.json({
      success: true,
      url: proxyUrl,
      path: data.path,
    });
  } catch (error) {
    console.error("Diplome file upload error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de l'upload: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer le justificatif d'un diplôme
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; diplomeId: string }> }
) {
  try {
    const { id: intervenantId, diplomeId } = await params;

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

    // Vérifier que le diplôme existe et appartient à cet intervenant
    const diplome = await prisma.intervenantDiplome.findFirst({
      where: {
        id: diplomeId,
        intervenantId,
      },
    });

    if (!diplome) {
      return NextResponse.json(
        { error: "Diplôme non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer le fichier du storage
    if (diplome.fichierUrl) {
      const pathMatch = diplome.fichierUrl.match(/\/api\/fichiers\/(.+)$/);
      if (pathMatch) {
        const storagePath = pathMatch[1];
        console.log("Deleting diplome file from storage:", storagePath);

        const { error: deleteError } = await adminClient.storage
          .from(STORAGE_BUCKET)
          .remove([storagePath]);

        if (deleteError) {
          console.error("Storage delete error:", deleteError);
        }
      }
    }

    // Mettre à jour le diplôme pour supprimer l'URL
    await prisma.intervenantDiplome.update({
      where: { id: diplomeId },
      data: { fichierUrl: null },
    });

    return NextResponse.json({
      success: true,
      message: "Justificatif supprimé",
    });
  } catch (error) {
    console.error("Diplome file delete error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de la suppression: ${errorMessage}` },
      { status: 500 }
    );
  }
}
