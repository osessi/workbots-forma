// ===========================================
// GOOGLE OAUTH CALLBACK - /api/video/oauth/google/callback
// ===========================================
// Gère le callback OAuth de Google après autorisation pour Google Meet

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
      console.error("Google OAuth error:", error);
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
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/video/oauth/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL("/automate/settings?tab=integrations&error=missing_config", request.url)
      );
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
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
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Google token exchange error:", errorData);
      return NextResponse.redirect(
        new URL("/automate/settings?tab=integrations&error=token_exchange_failed", request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Récupérer les infos de l'utilisateur Google
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    let accountEmail = "";
    let accountName = "";

    if (userResponse.ok) {
      const userData = await userResponse.json();
      accountEmail = userData.email || "";
      accountName = userData.name || "";
    }

    // Calculer la date d'expiration
    const tokenExpiry = new Date(Date.now() + expires_in * 1000);

    // Créer ou mettre à jour l'intégration
    await prisma.videoIntegration.upsert({
      where: {
        organizationId_provider_userId: {
          organizationId: user.organizationId,
          provider: VideoProvider.GOOGLE_MEET,
          userId: user.id,
        },
      },
      create: {
        provider: VideoProvider.GOOGLE_MEET,
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
      new URL("/automate/settings?tab=integrations&success=google_connected", request.url)
    );
  } catch (error) {
    console.error("Erreur Google OAuth callback:", error);
    return NextResponse.redirect(
      new URL("/automate/settings?tab=integrations&error=server_error", request.url)
    );
  }
}
