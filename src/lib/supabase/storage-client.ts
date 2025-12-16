import { getSupabaseBrowserClient } from "./client";

// Nom du bucket principal
export const STORAGE_BUCKET = "worksbots-forma-stockage";

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
// UPLOAD AVATAR (Simplifié)
// ===========================================

export interface AvatarUploadResult {
  url: string | null;
  error: string | null;
}

/**
 * Upload un avatar utilisateur
 * Stocké dans: avatars/{userEmail}/{timestamp}_{filename}
 */
export async function uploadAvatarClient(
  file: File,
  userEmail: string
): Promise<AvatarUploadResult> {
  try {
    const supabase = getSupabaseBrowserClient();
    const timestamp = Date.now();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9]/g, "_");
    const path = `avatars/${sanitizedEmail}/${timestamp}.${ext}`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      return { url: null, error: error.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);

    return { url: publicUrl, error: null };
  } catch (err) {
    return { url: null, error: "Erreur lors de l'upload" };
  }
}
