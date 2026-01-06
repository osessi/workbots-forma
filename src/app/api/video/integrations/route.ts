// ===========================================
// API VIDEO INTEGRATIONS - /api/video/integrations
// ===========================================
// Liste et gère les intégrations vidéo (Zoom, Google Meet, Teams)

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import prisma from "@/lib/db/prisma";
import { VideoProvider } from "@prisma/client";

// GET - Liste des intégrations de l'organisation
export async function GET() {
  try {
    const user = await getCurrentUser();

    // Debug: log des variables d'environnement (sans les secrets)
    console.log("[Video Integrations] Env check:", {
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      googleClientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20),
      hasZoomClientId: !!process.env.ZOOM_CLIENT_ID,
      hasMicrosoftClientId: !!process.env.MICROSOFT_CLIENT_ID,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    });

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Récupérer toutes les intégrations de l'organisation
    const integrations = await prisma.videoIntegration.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
      },
      select: {
        id: true,
        provider: true,
        accountEmail: true,
        accountName: true,
        isActive: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Préparer les URLs d'autorisation OAuth pour chaque provider
    const providers = [
      {
        id: "ZOOM",
        name: "Zoom",
        icon: "zoom",
        connected: integrations.some((i) => i.provider === VideoProvider.ZOOM),
        integration: integrations.find((i) => i.provider === VideoProvider.ZOOM) || null,
        authUrl: getZoomAuthUrl(),
      },
      {
        id: "GOOGLE_MEET",
        name: "Google Meet",
        icon: "google-meet",
        connected: integrations.some((i) => i.provider === VideoProvider.GOOGLE_MEET),
        integration: integrations.find((i) => i.provider === VideoProvider.GOOGLE_MEET) || null,
        authUrl: getGoogleMeetAuthUrl(),
      },
      {
        id: "MICROSOFT_TEAMS",
        name: "Microsoft Teams",
        icon: "microsoft-teams",
        connected: integrations.some((i) => i.provider === VideoProvider.MICROSOFT_TEAMS),
        integration: integrations.find((i) => i.provider === VideoProvider.MICROSOFT_TEAMS) || null,
        authUrl: getMicrosoftTeamsAuthUrl(),
      },
    ];

    return NextResponse.json({
      integrations,
      providers,
    });
  } catch (error) {
    console.error("Erreur GET video integrations:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Déconnecter une intégration
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get("id");

    if (!integrationId) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    // Vérifier que l'intégration appartient à l'organisation
    const integration = await prisma.videoIntegration.findFirst({
      where: {
        id: integrationId,
        organizationId: user.organizationId,
      },
    });

    if (!integration) {
      return NextResponse.json({ error: "Intégration non trouvée" }, { status: 404 });
    }

    // Désactiver l'intégration (soft delete)
    await prisma.videoIntegration.update({
      where: { id: integrationId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE video integration:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// Helpers pour générer les URLs OAuth
function getZoomAuthUrl(): string {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/video/oauth/zoom/callback`;

  if (!clientId) return "";

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
  });

  return `https://zoom.us/oauth/authorize?${params.toString()}`;
}

function getGoogleMeetAuthUrl(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/video/oauth/google/callback`;

  if (!clientId) return "";

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function getMicrosoftTeamsAuthUrl(): string {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/video/oauth/microsoft/callback`;

  if (!clientId) return "";

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "https://graph.microsoft.com/OnlineMeetings.ReadWrite https://graph.microsoft.com/User.Read offline_access",
    response_mode: "query",
  });

  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
}
