// ===========================================
// API: UPLOAD PIÈCES JOINTES MESSAGERIE ORGANISME
// POST - Upload de fichiers pour les messages
// ===========================================
// Correction 421: Ajout des pièces jointes dans la messagerie côté organisme

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

const STORAGE_BUCKET = "worksbots-forma-stockage";

// Types de fichiers autorisés pour la messagerie
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// Taille max par fichier: 10 Mo
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
    const { id: apprenantId } = await params;

    // Authentification
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'apprenant existe et appartient à l'organisation
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id: apprenantId,
        organizationId: user.organizationId,
      },
    });

    if (!apprenant) {
      return NextResponse.json(
        { error: "Apprenant non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer le fichier
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Vérifier le type MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Type de fichier non autorisé. Types acceptés: PDF, Word, Excel, Images (JPG, PNG, GIF, WebP)",
        },
        { status: 400 }
      );
    }

    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Le fichier ne doit pas dépasser 10 Mo" },
        { status: 400 }
      );
    }

    // Générer le chemin de stockage
    const timestamp = Date.now();
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const sanitizedFileName = file.name
      .replace(/\.[^/.]+$/, "") // Retirer l'extension
      .replace(/[^a-zA-Z0-9_-]/g, "_") // Sanitize
      .substring(0, 50); // Limiter la longueur
    const sanitizedOrgId = user.organizationId.replace(/[^a-zA-Z0-9]/g, "_");

    const path = `messagerie/${sanitizedOrgId}/${timestamp}_${sanitizedFileName}.${ext}`;

    // Convertir File en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload vers Supabase Storage avec le client admin
    const adminClient = getAdminClient();
    const { data, error } = await adminClient.storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("[API] Upload pièce jointe messagerie error:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'upload du fichier" },
        { status: 500 }
      );
    }

    // Retourner l'URL proxy
    const proxyUrl = `/api/fichiers/${data.path}`;

    return NextResponse.json({
      success: true,
      attachment: {
        name: file.name,
        size: file.size,
        type: file.type,
        url: proxyUrl,
        path: data.path,
      },
    });
  } catch (error) {
    console.error("[API] POST /api/donnees/apprenants/[id]/messages/upload error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
