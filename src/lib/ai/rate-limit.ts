// ===========================================
// RATE LIMITING POUR LES APPELS IA
// ===========================================

// Store en memoire pour le rate limiting (en production, utiliser Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  maxRequests: number; // Nombre max de requetes
  windowMs: number; // Fenetre de temps en ms
}

// Configurations par defaut
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Generation de fiche - plus couteuse
  "generate-fiche": {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 10 par heure
  },
  // QCM
  "generate-qcm": {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 20 par heure
  },
  // Positionnement
  "generate-positionnement": {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 10 par heure
  },
  // Evaluation
  "generate-evaluation": {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 10 par heure
  },
  // Reformulation - plus legere
  reformulate: {
    maxRequests: 50,
    windowMs: 60 * 60 * 1000, // 50 par heure
  },
  // Limite globale par utilisateur
  global: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 100 par heure au total
  },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Verifie et applique le rate limiting
 */
export function checkRateLimit(
  userId: string,
  endpoint: string,
  config?: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = `${userId}:${endpoint}`;
  const limitConfig = config || RATE_LIMITS[endpoint] || RATE_LIMITS.global;

  // Recuperer ou creer l'entree
  let entry = rateLimitStore.get(key);

  // Si pas d'entree ou fenetre expiree, reinitialiser
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + limitConfig.windowMs,
    };
  }

  // Verifier si la limite est atteinte
  if (entry.count >= limitConfig.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  // Incrementer le compteur
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: limitConfig.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Verifie les limites globales et specifiques
 */
export function checkAllLimits(
  userId: string,
  endpoint: string
): RateLimitResult {
  // Verifier la limite globale d'abord
  const globalCheck = checkRateLimit(userId, "global");
  if (!globalCheck.allowed) {
    return globalCheck;
  }

  // Verifier la limite specifique
  const endpointCheck = checkRateLimit(userId, endpoint);
  if (!endpointCheck.allowed) {
    return endpointCheck;
  }

  // Retourner le minimum des deux
  return {
    allowed: true,
    remaining: Math.min(globalCheck.remaining, endpointCheck.remaining),
    resetTime: Math.min(globalCheck.resetTime, endpointCheck.resetTime),
  };
}

/**
 * Nettoie les entrees expirees (appeler periodiquement)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Nettoyer automatiquement toutes les 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

/**
 * Obtenir les stats de rate limit pour un utilisateur
 */
export function getRateLimitStats(userId: string): Record<string, { used: number; limit: number; resetIn: number }> {
  const now = Date.now();
  const stats: Record<string, { used: number; limit: number; resetIn: number }> = {};

  for (const [endpoint, config] of Object.entries(RATE_LIMITS)) {
    const key = `${userId}:${endpoint}`;
    const entry = rateLimitStore.get(key);

    if (entry && now < entry.resetTime) {
      stats[endpoint] = {
        used: entry.count,
        limit: config.maxRequests,
        resetIn: Math.ceil((entry.resetTime - now) / 1000),
      };
    } else {
      stats[endpoint] = {
        used: 0,
        limit: config.maxRequests,
        resetIn: 0,
      };
    }
  }

  return stats;
}
