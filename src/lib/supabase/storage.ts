import { createSupabaseAdminClient } from "./server";
import { getSupabaseBrowserClient } from "./client";

// Nom du bucket principal
export const STORAGE_BUCKET = "automate-files";

// Types
export interface UploadResult {
  path: string;
  publicUrl: string;
  size: number;
}

export interface FileUploadOptions {
  organizationId: string;
  category: string;
  formationId?: string;
  fileName?: string;
}

// ===========================================
// GÉNÉRATION DES CHEMINS
// ===========================================

/**
 * Génère le chemin de stockage pour un fichier
 * Structure: {orgId}/{category}/{formationId?}/{timestamp}_{filename}
 */
export function generateStoragePath(
  file: File,
  options: FileUploadOptions
): string {
  const { organizationId, category, formationId, fileName } = options;
  const timestamp = Date.now();
  const sanitizedName = sanitizeFileName(fileName || file.name);

  let path = `${organizationId}/${category}`;

  if (formationId) {
    path += `/${formationId}`;
  }

  path += `/${timestamp}_${sanitizedName}`;

  return path;
}

/**
 * Nettoie le nom de fichier pour le stockage
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[^a-zA-Z0-9.-]/g, "_") // Remplace les caractères spéciaux
    .replace(/_+/g, "_") // Évite les underscores multiples
    .toLowerCase();
}

// ===========================================
// UPLOAD (Côté Client)
// ===========================================

/**
 * Upload un fichier depuis le navigateur
 */
export async function uploadFileClient(
  file: File,
  options: FileUploadOptions
): Promise<UploadResult> {
  const supabase = getSupabaseBrowserClient();
  const path = generateStoragePath(file, options);

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Erreur upload: ${error.message}`);
  }

  // Récupère l'URL publique
  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);

  return {
    path: data.path,
    publicUrl,
    size: file.size,
  };
}

/**
 * Upload plusieurs fichiers
 */
export async function uploadFilesClient(
  files: File[],
  options: FileUploadOptions
): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map((file) => uploadFileClient(file, options))
  );
  return results;
}

// ===========================================
// UPLOAD (Côté Serveur)
// ===========================================

/**
 * Upload un fichier depuis le serveur (avec service role)
 */
export async function uploadFileServer(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  options: FileUploadOptions
): Promise<UploadResult> {
  const supabase = createSupabaseAdminClient();
  const path = generateStoragePath(
    { name: fileName } as File,
    { ...options, fileName }
  );

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Erreur upload serveur: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);

  return {
    path: data.path,
    publicUrl,
    size: buffer.length,
  };
}

// ===========================================
// SUPPRESSION
// ===========================================

/**
 * Supprime un fichier
 */
export async function deleteFile(path: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);

  if (error) {
    throw new Error(`Erreur suppression: ${error.message}`);
  }
}

/**
 * Supprime plusieurs fichiers
 */
export async function deleteFiles(paths: string[]): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);

  if (error) {
    throw new Error(`Erreur suppression multiple: ${error.message}`);
  }
}

// ===========================================
// TÉLÉCHARGEMENT
// ===========================================

/**
 * Génère une URL de téléchargement signée (valide 1h)
 */
export async function getSignedDownloadUrl(
  path: string,
  expiresIn = 3600
): Promise<string> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Erreur URL signée: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Télécharge un fichier en Buffer
 */
export async function downloadFile(path: string): Promise<Buffer> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(path);

  if (error) {
    throw new Error(`Erreur téléchargement: ${error.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ===========================================
// LISTING
// ===========================================

/**
 * Liste les fichiers d'un dossier
 */
export async function listFiles(
  folder: string,
  limit = 100,
  offset = 0
): Promise<{ name: string; id: string; metadata: Record<string, unknown> }[]> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(folder, {
      limit,
      offset,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (error) {
    throw new Error(`Erreur listing: ${error.message}`);
  }

  return data || [];
}

// ===========================================
// UTILITAIRES
// ===========================================

/**
 * Vérifie si un fichier existe
 */
export async function fileExists(path: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(path.split("/").slice(0, -1).join("/"), {
      search: path.split("/").pop(),
    });

  return (data?.length || 0) > 0;
}

/**
 * Copie un fichier
 */
export async function copyFile(
  sourcePath: string,
  destPath: string
): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .copy(sourcePath, destPath);

  if (error) {
    throw new Error(`Erreur copie: ${error.message}`);
  }
}

/**
 * Déplace un fichier
 */
export async function moveFile(
  sourcePath: string,
  destPath: string
): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .move(sourcePath, destPath);

  if (error) {
    throw new Error(`Erreur déplacement: ${error.message}`);
  }
}
