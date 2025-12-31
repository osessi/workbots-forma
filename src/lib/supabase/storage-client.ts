import { getSupabaseBrowserClient } from "./client";

// Nom du bucket principal
export const STORAGE_BUCKET = "worksbots-forma-stockage";

// ===========================================
// CONVERSION URL SUPABASE -> URL PROXY
// ===========================================

/**
 * Convertit une URL Supabase Storage en URL proxy locale
 * Cela masque l'URL Supabase aux utilisateurs finaux
 */
export function toProxyUrl(supabaseUrl: string | null | undefined): string | null {
  if (!supabaseUrl) return null;

  // Si c'est déjà une URL proxy, retourner telle quelle
  if (supabaseUrl.startsWith("/api/fichiers/") || supabaseUrl.startsWith("/api/qualiopi/fichiers/")) {
    return supabaseUrl;
  }

  // Extraire le chemin du fichier depuis l'URL Supabase
  // Format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file
  try {
    const url = new URL(supabaseUrl);
    const pathParts = url.pathname.split("/");

    // Trouver l'index du bucket name dans le path
    const bucketIndex = pathParts.findIndex(part => part === STORAGE_BUCKET);
    if (bucketIndex === -1) {
      // Si le bucket n'est pas trouvé, essayer d'extraire après "public/"
      const publicIndex = pathParts.findIndex(part => part === "public");
      if (publicIndex !== -1 && pathParts[publicIndex + 1]) {
        // path après "public/bucket-name/"
        const filePath = pathParts.slice(publicIndex + 2).join("/");
        if (filePath) {
          return `/api/fichiers/${filePath}`;
        }
      }
      return supabaseUrl; // Retourner l'URL originale si on ne peut pas la convertir
    }

    // Extraire le chemin après le bucket name
    const filePath = pathParts.slice(bucketIndex + 1).join("/");
    if (!filePath) return supabaseUrl;

    return `/api/fichiers/${filePath}`;
  } catch {
    // Si l'URL n'est pas valide, retourner telle quelle
    return supabaseUrl;
  }
}

/**
 * Convertit un chemin de stockage en URL proxy
 */
export function pathToProxyUrl(storagePath: string): string {
  return `/api/fichiers/${storagePath}`;
}

/**
 * Vérifie si une URL est une URL Supabase
 */
export function isSupabaseUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("supabase.co") || url.includes("supabase.io");
}

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

  // Retourne une URL proxy au lieu de l'URL Supabase publique
  const proxyUrl = pathToProxyUrl(data.path);

  return {
    path: data.path,
    publicUrl: proxyUrl, // URL proxy qui masque Supabase
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

    // Retourne une URL proxy au lieu de l'URL Supabase publique
    const proxyUrl = pathToProxyUrl(data.path);

    return { url: proxyUrl, error: null };
  } catch (err) {
    return { url: null, error: "Erreur lors de l'upload" };
  }
}
