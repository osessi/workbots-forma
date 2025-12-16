export type AvatarStyle = "lorelei" | "bottts" | "avataaars" | "funEmoji" | "thumbs" | "initials";

/**
 * Génère l'URL d'un avatar DiceBear via leur API
 * Utilise l'API HTTP au lieu du SDK pour éviter les problèmes de types
 * @param seed - Valeur unique pour générer un avatar consistant (email, userId)
 * @param style - Style d'avatar
 * @param size - Taille de l'avatar en pixels
 * @returns URL de l'avatar
 */
export function getAvatarUrl(
  seed: string,
  style: AvatarStyle = "lorelei",
  size: number = 128
): string {
  const encodedSeed = encodeURIComponent(seed);
  // Utiliser bottts-neutral au lieu de bottts
  const apiStyle = style === "bottts" ? "bottts-neutral" : style;
  return `https://api.dicebear.com/9.x/${apiStyle}/svg?seed=${encodedSeed}&size=${size}`;
}

/**
 * Alias pour compatibilité
 */
export function generateAvatar(
  seed: string,
  style: AvatarStyle = "lorelei",
  size: number = 128
): string {
  return getAvatarUrl(seed, style, size);
}
