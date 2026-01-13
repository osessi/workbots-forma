// ===========================================
// API: UPLOAD PIÈCES JOINTES MESSAGERIE APPRENANT
// POST - Upload de fichiers pour les messages
// ===========================================
// Correction 421: Ajout des pièces jointes dans la messagerie

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/db/prisma";

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

// Décoder et valider le token apprenant
function decodeApprenantToken(token: string): { apprenantId: string; organizationId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));

    if (!decoded.apprenantId || !decoded.organizationId) {
      return null;
    }

    // Vérifier expiration
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }

    return {
      apprenantId: decoded.apprenantId,
      organizationId: decoded.organizationId,
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Récupérer le token depuis les query params ou form data
    const { searchParams } = new URL(request.url);
    let token = searchParams.get("token");

    const formData = await request.formData();

    // Token peut aussi être dans formData
    if (!token) {
      token = formData.get("token") as string;
    }

    if (!token) {
      return NextResponse.json({ error: "Token requis" }, { status: 401 });
    }

    // Décoder le token
    const decoded = decodeApprenantToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
    }

    // Vérifier que l'apprenant existe
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id: decoded.apprenantId,
        organizationId: decoded.organizationId,
      },
    });

    if (!apprenant) {
      return NextResponse.json({ error: "Apprenant non trouvé" }, { status: 404 });
    }

    // Récupérer le fichier
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
    const sanitizedOrgId = decoded.organizationId.replace(/[^a-zA-Z0-9]/g, "_");

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
    console.error("[API] POST /api/apprenant/messages/upload error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
