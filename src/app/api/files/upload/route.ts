// ===========================================
// API FILES UPLOAD - Upload de fichiers dans le Drive
// ===========================================
// POST /api/files/upload - Upload un ou plusieurs fichiers

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

const STORAGE_BUCKET = "worksbots-forma-stockage";

// Types de fichiers autorisés
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

    // Vérifier l'authentification
    const { data: { user: supabaseUser }, error: authError } = await authClient.auth.getUser();

    if (authError || !supabaseUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur et son organisation
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: { id: true, organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Récupérer les données du formulaire
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const formationId = formData.get("formationId") as string | null;
    const apprenantId = formData.get("apprenantId") as string | null;
    const folderId = formData.get("folderId") as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Vérifier que le dossier cible existe (si spécifié)
    let targetFolderId = folderId;
    if (targetFolderId) {
      const folderExists = await prisma.folder.findFirst({
        where: {
          id: targetFolderId,
          organizationId: user.organizationId,
        },
      });
      if (!folderExists) {
        targetFolderId = null; // Ignorer si le dossier n'existe pas
      }
    }

    const uploadedFiles = [];
    const errors = [];

    for (const file of files) {
      // Vérifier le type de fichier
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        errors.push({ file: file.name, error: "Type de fichier non autorisé" });
        continue;
      }

      // Vérifier la taille
      if (file.size > MAX_FILE_SIZE) {
        errors.push({ file: file.name, error: "Fichier trop volumineux (max 10MB)" });
        continue;
      }

      try {
        // Générer le chemin de stockage
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
        const sanitizedOrgId = user.organizationId.replace(/[^a-zA-Z0-9]/g, "_");

        let folder = `drive/${sanitizedOrgId}`;
        if (formationId) {
          folder += `/formations/${formationId}`;
        }
        if (apprenantId) {
          folder += `/apprenants/${apprenantId}`;
        }

        const storagePath = `${folder}/${timestamp}_${sanitizedName}`;

        // Convertir File en ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Upload vers Supabase Storage
        const { data, error } = await adminClient.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, buffer, {
            contentType: file.type,
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          console.error("Storage upload error:", error);
          errors.push({ file: file.name, error: error.message });
          continue;
        }

        // Générer l'URL publique (proxy)
        const publicUrl = `/api/fichiers/${data.path}`;

        // Déterminer le dossier cible
        let finalFolderId: string | null = targetFolderId || null;

        // Si pas de dossier cible spécifié, utiliser la logique existante (formation/apprenant)
        if (!finalFolderId && formationId) {
          // Chercher ou créer le dossier de la formation
          let formationFolder = await prisma.folder.findFirst({
            where: {
              formationId,
              organizationId: user.organizationId,
              parentId: null,
            },
          });

          if (!formationFolder) {
            const formation = await prisma.formation.findUnique({
              where: { id: formationId },
              select: { titre: true },
            });

            formationFolder = await prisma.folder.create({
              data: {
                name: formation?.titre || "Formation",
                organizationId: user.organizationId,
                formationId,
              },
            });
          }

          finalFolderId = formationFolder.id;

          // Si apprenantId, créer/trouver le sous-dossier apprenant
          if (apprenantId) {
            let apprenantFolder = await prisma.folder.findFirst({
              where: {
                apprenantId,
                parentId: formationFolder.id,
                organizationId: user.organizationId,
              },
            });

            if (!apprenantFolder) {
              const apprenant = await prisma.apprenant.findUnique({
                where: { id: apprenantId },
                select: { nom: true, prenom: true },
              });

              apprenantFolder = await prisma.folder.create({
                data: {
                  name: apprenant ? `${apprenant.prenom} ${apprenant.nom}` : "Apprenant",
                  organizationId: user.organizationId,
                  parentId: formationFolder.id,
                  apprenantId,
                },
              });
            }

            finalFolderId = apprenantFolder.id;
          }
        }

        // Créer l'entrée File en base de données
        const fileRecord = await prisma.file.create({
          data: {
            name: `${timestamp}_${sanitizedName}`,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            storagePath: data.path,
            publicUrl,
            organizationId: user.organizationId,
            userId: user.id,
            folderId: finalFolderId,
            formationId,
            category: getCategoryFromMimeType(file.type),
          },
        });

        uploadedFiles.push({
          id: fileRecord.id,
          name: fileRecord.originalName,
          url: publicUrl,
        });
      } catch (err) {
        console.error("Error uploading file:", file.name, err);
        errors.push({ file: file.name, error: "Erreur lors de l'upload" });
      }
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload des fichiers" },
      { status: 500 }
    );
  }
}

// Helper pour déterminer la catégorie basée sur le type MIME
// Utilise les valeurs de l'enum FileCategory de Prisma
function getCategoryFromMimeType(mimeType: string): "FICHE_PEDAGOGIQUE" | "SLIDES" | "DOCUMENT" | "EVALUATION" | "SUPPORT_STAGIAIRE" | "IMAGE" | "AUTRE" {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "SLIDES";
  return "DOCUMENT";
}
