// ===========================================
// API PREUVES RECLAMATION - Upload/Delete
// Qualiopi IND 31 - Pièces jointes des réclamations
// ===========================================

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

const STORAGE_BUCKET = "worksbots-forma-stockage";
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

interface PieceJointe {
  id: string;
  filename: string;
  url: string;
  type: string;
  uploadedAt: string;
}

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

// POST - Upload d'une preuve
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reclamationId } = await params;

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

    // Vérifier que la réclamation appartient à l'organisation
    const reclamation = await prisma.reclamation.findFirst({
      where: {
        id: reclamationId,
        organizationId: user.organizationId,
      },
    });

    if (!reclamation) {
      return NextResponse.json(
        { error: "Réclamation non trouvée" },
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
        { error: "Type de fichier non autorisé. PDF et images acceptés." },
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
    const fileId = `${timestamp}_${Math.random().toString(36).substring(7)}`;
    const sanitizedOrgId = user.organizationId.replace(/[^a-zA-Z0-9]/g, "_");
    const extension = file.name.split(".").pop() || "pdf";
    const path = `reclamations-preuves/${sanitizedOrgId}/${reclamationId}/${fileId}.${extension}`;

    // Convertir File en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload vers Supabase Storage
    const { data, error } = await adminClient.storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json(
        { error: `Erreur storage: ${error.message}` },
        { status: 500 }
      );
    }

    // URL proxy
    const proxyUrl = `/api/fichiers/${data.path}`;

    // Mettre à jour les pièces jointes
    const existingPieces = (reclamation.piecesJointes as PieceJointe[] | null) || [];
    const newPiece: PieceJointe = {
      id: fileId,
      filename: file.name,
      url: proxyUrl,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    };

    await prisma.reclamation.update({
      where: { id: reclamationId },
      data: {
        piecesJointes: [...existingPieces, newPiece],
      },
    });

    return NextResponse.json({
      success: true,
      piece: newPiece,
    });
  } catch (error) {
    console.error("Preuve upload error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de l'upload: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une preuve
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reclamationId } = await params;
    const { searchParams } = new URL(request.url);
    const pieceId = searchParams.get("pieceId");

    if (!pieceId) {
      return NextResponse.json(
        { error: "ID de la pièce requis" },
        { status: 400 }
      );
    }

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

    // Vérifier que la réclamation appartient à l'organisation
    const reclamation = await prisma.reclamation.findFirst({
      where: {
        id: reclamationId,
        organizationId: user.organizationId,
      },
    });

    if (!reclamation) {
      return NextResponse.json(
        { error: "Réclamation non trouvée" },
        { status: 404 }
      );
    }

    // Trouver la pièce à supprimer
    const existingPieces = (reclamation.piecesJointes as PieceJointe[] | null) || [];
    const pieceToDelete = existingPieces.find((p) => p.id === pieceId);

    if (!pieceToDelete) {
      return NextResponse.json(
        { error: "Pièce jointe non trouvée" },
        { status: 404 }
      );
    }

    // Supprimer le fichier du storage
    const pathMatch = pieceToDelete.url.match(/\/api\/fichiers\/(.+)$/);
    if (pathMatch) {
      const storagePath = pathMatch[1];
      await adminClient.storage.from(STORAGE_BUCKET).remove([storagePath]);
    }

    // Mettre à jour les pièces jointes
    const updatedPieces = existingPieces.filter((p) => p.id !== pieceId);

    await prisma.reclamation.update({
      where: { id: reclamationId },
      data: {
        piecesJointes: updatedPieces.length > 0 ? updatedPieces : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pièce jointe supprimée",
    });
  } catch (error) {
    console.error("Preuve delete error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de la suppression: ${errorMessage}` },
      { status: 500 }
    );
  }
}
