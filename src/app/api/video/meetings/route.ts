// ===========================================
// API VIDEO MEETINGS - /api/video/meetings
// ===========================================
// Gestion des réunions vidéo (Zoom, Google Meet, Teams)

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import prisma from "@/lib/db/prisma";
import { VideoProvider, VideoMeetingStatus } from "@prisma/client";
import { refreshAccessToken } from "@/lib/video/token-refresh";
import { createZoomMeeting, createGoogleMeetMeeting, createTeamsMeeting } from "@/lib/video/providers";

// GET - Liste des réunions
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const status = searchParams.get("status") as VideoMeetingStatus | null;
    const upcoming = searchParams.get("upcoming") === "true";

    // Construire les filtres
    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
    };

    if (sessionId) {
      where.sessionId = sessionId;
    }

    if (status) {
      where.status = status;
    }

    if (upcoming) {
      where.scheduledStart = {
        gte: new Date(),
      };
      where.status = {
        in: [VideoMeetingStatus.SCHEDULED, VideoMeetingStatus.IN_PROGRESS],
      };
    }

    const meetings = await prisma.videoMeeting.findMany({
      where,
      include: {
        session: {
          select: {
            id: true,
            formation: {
              select: {
                id: true,
                titre: true,
              },
            },
          },
        },
        integration: {
          select: {
            id: true,
            provider: true,
            accountEmail: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        participants: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            attended: true,
          },
        },
        recordings: {
          select: {
            id: true,
            title: true,
            duration: true,
            hasTranscription: true,
          },
        },
      },
      orderBy: {
        scheduledStart: "asc",
      },
    });

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error("Erreur GET video meetings:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle réunion
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      provider,
      scheduledStart,
      scheduledEnd,
      duration,
      sessionId,
      enableRecording,
      enableWaitingRoom,
      enableAutoRecord,
      participants,
    } = body;

    // Validation
    if (!title || !provider || !scheduledStart) {
      return NextResponse.json(
        { error: "Titre, provider et date de début requis" },
        { status: 400 }
      );
    }

    // Vérifier que le provider est valide
    if (!Object.values(VideoProvider).includes(provider)) {
      return NextResponse.json(
        { error: "Provider invalide" },
        { status: 400 }
      );
    }

    // Récupérer l'intégration active pour ce provider
    const integration = await prisma.videoIntegration.findFirst({
      where: {
        organizationId: user.organizationId,
        provider: provider as VideoProvider,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: `Aucune intégration ${provider} active. Veuillez connecter votre compte dans les paramètres.` },
        { status: 400 }
      );
    }

    // Rafraîchir le token si nécessaire
    let accessToken = integration.accessToken;
    if (integration.tokenExpiry && new Date(integration.tokenExpiry) < new Date()) {
      const refreshed = await refreshAccessToken(integration);
      if (!refreshed) {
        return NextResponse.json(
          { error: `Token ${provider} expiré. Veuillez reconnecter votre compte.` },
          { status: 401 }
        );
      }
      accessToken = refreshed.accessToken;
    }

    // Créer la réunion chez le provider
    let externalMeeting: { id: string; joinUrl: string; hostUrl?: string; password?: string };

    const meetingDetails = {
      title,
      description,
      scheduledStart: new Date(scheduledStart),
      scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : undefined,
      duration: duration || 60,
      enableRecording: enableRecording || false,
      enableWaitingRoom: enableWaitingRoom || false,
    };

    switch (provider) {
      case VideoProvider.ZOOM:
        externalMeeting = await createZoomMeeting(accessToken, meetingDetails);
        break;
      case VideoProvider.GOOGLE_MEET:
        externalMeeting = await createGoogleMeetMeeting(accessToken, meetingDetails);
        break;
      case VideoProvider.MICROSOFT_TEAMS:
        externalMeeting = await createTeamsMeeting(accessToken, meetingDetails);
        break;
      default:
        return NextResponse.json({ error: "Provider non supporté" }, { status: 400 });
    }

    // Créer la réunion en base de données
    const meeting = await prisma.videoMeeting.create({
      data: {
        title,
        description,
        provider: provider as VideoProvider,
        externalId: externalMeeting.id,
        joinUrl: externalMeeting.joinUrl,
        hostUrl: externalMeeting.hostUrl,
        password: externalMeeting.password,
        scheduledStart: new Date(scheduledStart),
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
        duration: duration || 60,
        enableRecording: enableRecording || false,
        enableWaitingRoom: enableWaitingRoom || false,
        enableAutoRecord: enableAutoRecord || false,
        sessionId: sessionId || null,
        integrationId: integration.id,
        createdById: user.id,
        organizationId: user.organizationId,
      },
    });

    // Ajouter les participants si fournis
    if (participants && Array.isArray(participants) && participants.length > 0) {
      await prisma.videoParticipant.createMany({
        data: participants.map((p: { email: string; name?: string; role?: string; apprenantId?: string; intervenantId?: string }) => ({
          meetingId: meeting.id,
          email: p.email,
          name: p.name || null,
          role: p.role || "attendee",
          apprenantId: p.apprenantId || null,
          intervenantId: p.intervenantId || null,
        })),
      });
    }

    // Récupérer la réunion complète
    const fullMeeting = await prisma.videoMeeting.findUnique({
      where: { id: meeting.id },
      include: {
        session: {
          select: {
            id: true,
            formation: {
              select: {
                id: true,
                titre: true,
              },
            },
          },
        },
        integration: {
          select: {
            id: true,
            provider: true,
            accountEmail: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        participants: true,
      },
    });

    return NextResponse.json({ meeting: fullMeeting });
  } catch (error) {
    console.error("Erreur POST video meeting:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
