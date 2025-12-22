// ===========================================
// CONFIGURATION REDIS
// ===========================================

import Redis from "ioredis";

// Connection Redis singleton
let redisConnection: Redis | null = null;
let redisAvailabilityChecked = false;
let redisIsAvailable = false;

/**
 * Obtenir la connexion Redis
 * Utilise REDIS_URL si disponible, sinon localhost
 */
export function getRedisConnection(): Redis {
  if (!redisConnection) {
    const redisUrl = process.env.REDIS_URL;

    // Si pas de REDIS_URL configuré, ne pas créer de connexion
    if (!redisUrl) {
      throw new Error("REDIS_URL not configured");
    }

    redisConnection = new Redis(redisUrl, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      lazyConnect: true, // Ne pas connecter immédiatement
      retryStrategy: (times: number) => {
        if (times > 3) {
          console.error("[Redis] Connection failed after 3 retries");
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000); // Backoff
      },
    });

    // Limiter le spam de logs d'erreur
    let errorLogged = false;
    redisConnection.on("error", (err) => {
      if (!errorLogged) {
        console.error("[Redis] Connection error:", err.message);
        errorLogged = true;
      }
    });

    redisConnection.on("connect", () => {
      console.log("[Redis] Connected successfully");
      errorLogged = false;
    });
  }

  return redisConnection;
}

/**
 * Fermer la connexion Redis
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
    redisAvailabilityChecked = false;
    redisIsAvailable = false;
  }
}

/**
 * Vérifier si Redis est disponible
 * Cache le résultat pour éviter de spam les connexions
 */
export async function isRedisAvailable(): Promise<boolean> {
  // Si pas de REDIS_URL, pas de Redis
  if (!process.env.REDIS_URL) {
    return false;
  }

  // Si déjà vérifié, retourner le cache
  if (redisAvailabilityChecked) {
    return redisIsAvailable;
  }

  try {
    const redis = getRedisConnection();
    await redis.connect();
    const result = await redis.ping();
    redisIsAvailable = result === "PONG";
    redisAvailabilityChecked = true;
    console.log(`[Redis] Availability check: ${redisIsAvailable ? "OK" : "FAILED"}`);
    return redisIsAvailable;
  } catch (error) {
    console.error("[Redis] Not available:", error instanceof Error ? error.message : "Unknown error");
    redisAvailabilityChecked = true;
    redisIsAvailable = false;
    return false;
  }
}
