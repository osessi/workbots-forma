// ===========================================
// MICROSOFT OAUTH CALLBACK - /api/video/oauth/microsoft/callback
// ===========================================
// Gère le callback OAuth de Microsoft après autorisation pour Teams

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import prisma from "@/lib/db/prisma";
import { VideoProvider } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    // Vérifier l'utilisateur connecté
    const user = await getCurrentUser();

    if (!user || !user.organizationId) {
      return NextResponse.redirect(
        new URL("/automate/settings?tab=integrations&error=not_authenticated", request.url)
      );
    }

    if (error) {
      console.error("Microsoft OAuth error:", error);
      return NextResponse.redirect(
        new URL("/automate/settings?tab=integrations&error=oauth_denied", request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/automate/settings?tab=integrations&error=no_code", request.url)
      );
    }

    // Échanger le code contre un access token
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/video/oauth/microsoft/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL("/automate/settings?tab=integrations&error=missing_config", request.url)
      );
    }

    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
          scope: "https://graph.microsoft.com/OnlineMeetings.ReadWrite https://graph.microsoft.com/User.Read offline_access",
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Microsoft token exchange error:", errorData);
      return NextResponse.redirect(
        new URL("/automate/settings?tab=integrations&error=token_exchange_failed", request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Récupérer les infos de l'utilisateur Microsoft
    const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    let accountEmail = "";
    let accountName = "";

    if (userResponse.ok) {
      const userData = await userResponse.json();
      accountEmail = userData.mail || userData.userPrincipalName || "";
      accountName = userData.displayName || "";
    }

    // Calculer la date d'expiration
    const tokenExpiry = new Date(Date.now() + expires_in * 1000);

    // Créer ou mettre à jour l'intégration
    await prisma.videoIntegration.upsert({
      where: {
        organizationId_provider_userId: {
          organizationId: user.organizationId,
          provider: VideoProvider.MICROSOFT_TEAMS,
          userId: user.id,
        },
      },
      create: {
        provider: VideoProvider.MICROSOFT_TEAMS,
        accessToken: access_token,
        refreshToken: refresh_token || null,
        tokenExpiry,
        accountEmail,
        accountName,
        isActive: true,
        organizationId: user.organizationId,
        userId: user.id,
      },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token || null,
        tokenExpiry,
        accountEmail,
        accountName,
        isActive: true,
      },
    });

    return NextResponse.redirect(
      new URL("/automate/settings?tab=integrations&success=microsoft_connected", request.url)
    );
  } catch (error) {
    console.error("Erreur Microsoft OAuth callback:", error);
    return NextResponse.redirect(
      new URL("/automate/settings?tab=integrations&error=server_error", request.url)
    );
  }
}
