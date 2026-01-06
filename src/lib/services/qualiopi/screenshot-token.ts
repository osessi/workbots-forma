// ===========================================
// TOKEN TEMPORAIRE POUR CAPTURES D'ÉCRAN
// Permet à Puppeteer d'accéder aux pages protégées
// ===========================================

import crypto from "crypto";

// Clé secrète pour signer les tokens (utilise une variable d'env ou génère une clé)
const SECRET_KEY = process.env.SCREENSHOT_SECRET_KEY || process.env.NEXTAUTH_SECRET || "screenshot-secret-key-change-in-production";

// Durée de validité du token en millisecondes (5 minutes)
const TOKEN_VALIDITY_MS = 5 * 60 * 1000;

export interface ScreenshotTokenPayload {
  organizationId: string;
  userId?: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Génère un token temporaire signé pour les captures d'écran
 */
export function generateScreenshotToken(organizationId: string, userId?: string): string {
  const now = Date.now();
  const payload: ScreenshotTokenPayload = {
    organizationId,
    userId,
    createdAt: now,
    expiresAt: now + TOKEN_VALIDITY_MS,
  };

  // Encoder le payload en base64
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");

  // Créer une signature HMAC
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(payloadBase64)
    .digest("base64url");

  // Retourner le token complet
  return `${payloadBase64}.${signature}`;
}

/**
 * Vérifie et décode un token de capture d'écran
 * Retourne null si le token est invalide ou expiré
 */
export function verifyScreenshotToken(token: string): ScreenshotTokenPayload | null {
  try {
    const [payloadBase64, signature] = token.split(".");

    if (!payloadBase64 || !signature) {
      console.warn("[ScreenshotToken] Invalid token format");
      return null;
    }

    // Vérifier la signature
    const expectedSignature = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(payloadBase64)
      .digest("base64url");

    if (signature !== expectedSignature) {
      console.warn("[ScreenshotToken] Invalid signature");
      return null;
    }

    // Décoder le payload
    const payload: ScreenshotTokenPayload = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf-8")
    );

    // Vérifier l'expiration
    if (Date.now() > payload.expiresAt) {
      console.warn("[ScreenshotToken] Token expired");
      return null;
    }

    return payload;
  } catch (error) {
    console.error("[ScreenshotToken] Error verifying token:", error);
    return null;
  }
}

/**
 * Génère l'URL avec le token pour une capture d'écran
 */
export function getScreenshotUrl(baseUrl: string, path: string, token: string): string {
  const url = new URL(path, baseUrl);
  url.searchParams.set("_screenshot_token", token);
  return url.toString();
}
