// ===========================================
// TOKEN REFRESH - Rafraîchissement des tokens OAuth
// ===========================================

import prisma from "@/lib/db/prisma";
import { VideoProvider } from "@prisma/client";

interface VideoIntegrationWithToken {
  id: string;
  provider: VideoProvider;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiry: Date | null;
}

interface RefreshResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

// Rafraîchir le token d'accès d'une intégration
export async function refreshAccessToken(
  integration: VideoIntegrationWithToken
): Promise<{ accessToken: string } | null> {
  if (!integration.refreshToken) {
    console.error("Pas de refresh token disponible pour", integration.provider);
    return null;
  }

  let refreshResult: RefreshResult | null = null;

  try {
    switch (integration.provider) {
      case VideoProvider.ZOOM:
        refreshResult = await refreshZoomToken(integration.refreshToken);
        break;
      case VideoProvider.GOOGLE_MEET:
        refreshResult = await refreshGoogleToken(integration.refreshToken);
        break;
      case VideoProvider.MICROSOFT_TEAMS:
        refreshResult = await refreshMicrosoftToken(integration.refreshToken);
        break;
      default:
        return null;
    }

    if (!refreshResult) {
      return null;
    }

    // Mettre à jour les tokens en base
    const newExpiry = new Date(Date.now() + refreshResult.expiresIn * 1000);

    await prisma.videoIntegration.update({
      where: { id: integration.id },
      data: {
        accessToken: refreshResult.accessToken,
        refreshToken: refreshResult.refreshToken || integration.refreshToken,
        tokenExpiry: newExpiry,
      },
    });

    return { accessToken: refreshResult.accessToken };
  } catch (error) {
    console.error("Erreur rafraîchissement token:", error);
    return null;
  }
}

// Rafraîchir un token Zoom
async function refreshZoomToken(refreshToken: string): Promise<RefreshResult | null> {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  const response = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    console.error("Erreur refresh Zoom:", await response.text());
    return null;
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

// Rafraîchir un token Google
async function refreshGoogleToken(refreshToken: string): Promise<RefreshResult | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    console.error("Erreur refresh Google:", await response.text());
    return null;
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    // Google ne retourne pas toujours un nouveau refresh token
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

// Rafraîchir un token Microsoft
async function refreshMicrosoftToken(refreshToken: string): Promise<RefreshResult | null> {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_TENANT_ID || "common";

  if (!clientId || !clientSecret) {
    return null;
  }

  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/OnlineMeetings.ReadWrite https://graph.microsoft.com/User.Read offline_access",
      }),
    }
  );

  if (!response.ok) {
    console.error("Erreur refresh Microsoft:", await response.text());
    return null;
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

// Vérifier si un token est expiré ou va expirer bientôt (5 minutes)
export function isTokenExpired(tokenExpiry: Date | null): boolean {
  if (!tokenExpiry) return true;

  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return tokenExpiry < fiveMinutesFromNow;
}
