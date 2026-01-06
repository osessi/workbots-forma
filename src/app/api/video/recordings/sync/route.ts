// ===========================================
// API SYNC RECORDINGS - /api/video/recordings/sync
// ===========================================
// Synchronisation des enregistrements depuis les providers (Zoom, etc.)

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import prisma from "@/lib/db/prisma";
import { VideoProvider, VideoMeetingStatus } from "@prisma/client";
import { refreshAccessToken, isTokenExpired } from "@/lib/video/token-refresh";
import { getZoomRecordings } from "@/lib/video/providers";

// POST - Synchroniser les enregistrements pour une réunion spécifique
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const { meetingId } = await request.json();

    if (!meetingId) {
      return NextResponse.json({ error: "ID de réunion requis" }, { status: 400 });
    }

    // Récupérer la réunion avec son intégration
    const meeting = await prisma.videoMeeting.findFirst({
      where: {
        id: meetingId,
        organizationId: user.organizationId,
      },
      include: {
        integration: true,
        recordings: true,
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Réunion non trouvée" }, { status: 404 });
    }

    // Ne synchroniser que les réunions terminées
    if (meeting.status !== VideoMeetingStatus.ENDED) {
      return NextResponse.json({
        message: "La réunion n'est pas encore terminée",
        recordings: meeting.recordings,
      });
    }

    // Vérifier si l'enregistrement était activé
    if (!meeting.enableRecording) {
      return NextResponse.json({
        message: "L'enregistrement n'était pas activé pour cette réunion",
        recordings: [],
      });
    }

    let accessToken = meeting.integration.accessToken;

    // Rafraîchir le token si nécessaire
    if (isTokenExpired(meeting.integration.tokenExpiry)) {
      const refreshed = await refreshAccessToken(meeting.integration);
      if (refreshed) {
        accessToken = refreshed.accessToken;
      } else {
        return NextResponse.json(
          { error: "Token expiré, veuillez reconnecter votre compte" },
          { status: 401 }
        );
      }
    }

    let newRecordings: Array<{
      id: string;
      title: string;
      fileUrl: string;
      duration: number | null;
    }> = [];

    // Synchroniser selon le provider
    switch (meeting.provider) {
      case VideoProvider.ZOOM:
        newRecordings = await syncZoomRecordings(
          accessToken,
          meeting.externalId,
          meeting.id,
          meeting.sessionId,
          user.organizationId,
          user.id
        );
        break;

      case VideoProvider.GOOGLE_MEET:
        // Google Meet n'a pas d'enregistrement cloud natif via l'API Calendar
        // Les enregistrements vont dans Google Drive, ce qui nécessite une autre intégration
        return NextResponse.json({
          message: "Les enregistrements Google Meet sont stockés dans Google Drive",
          recordings: meeting.recordings,
        });

      case VideoProvider.MICROSOFT_TEAMS:
        // Teams stocke les enregistrements dans OneDrive/SharePoint
        return NextResponse.json({
          message: "Les enregistrements Teams sont stockés dans OneDrive",
          recordings: meeting.recordings,
        });
    }

    // Récupérer tous les enregistrements mis à jour
    const updatedRecordings = await prisma.videoRecording.findMany({
      where: { meetingId: meeting.id },
      select: {
        id: true,
        title: true,
        fileUrl: true,
        duration: true,
        recordedAt: true,
        hasTranscription: true,
      },
    });

    return NextResponse.json({
      message: `${newRecordings.length} nouvel(s) enregistrement(s) synchronisé(s)`,
      recordings: updatedRecordings,
    });
  } catch (error) {
    console.error("Erreur sync recordings:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// Synchroniser les enregistrements Zoom
async function syncZoomRecordings(
  accessToken: string,
  zoomMeetingId: string,
  meetingId: string,
  sessionId: string | null,
  organizationId: string,
  userId: string
): Promise<Array<{ id: string; title: string; fileUrl: string; duration: number | null }>> {
  const newRecordings: Array<{ id: string; title: string; fileUrl: string; duration: number | null }> = [];

  try {
    const zoomRecordings = await getZoomRecordings(accessToken, zoomMeetingId);

    if (!zoomRecordings || !zoomRecordings.recording_files) {
      return newRecordings;
    }

    for (const file of zoomRecordings.recording_files) {
      // Vérifier si l'enregistrement existe déjà
      const existing = await prisma.videoRecording.findFirst({
        where: {
          externalId: file.id,
          meetingId,
        },
      });

      if (existing) {
        continue;
      }

      // Créer le nouvel enregistrement
      const recording = await prisma.videoRecording.create({
        data: {
          title: file.recording_type === "shared_screen_with_speaker_view"
            ? "Enregistrement avec partage d'écran"
            : file.recording_type === "speaker_view"
            ? "Vue intervenant"
            : file.recording_type === "gallery_view"
            ? "Vue galerie"
            : file.recording_type === "audio_only"
            ? "Audio uniquement"
            : `Enregistrement ${file.recording_type}`,
          provider: VideoProvider.ZOOM,
          externalId: file.id,
          fileUrl: file.download_url || file.play_url,
          duration: file.recording_end && file.recording_start
            ? Math.round((new Date(file.recording_end).getTime() - new Date(file.recording_start).getTime()) / 1000)
            : null,
          mimeType: file.file_type === "MP4" ? "video/mp4" : file.file_type === "M4A" ? "audio/mp4" : "video/mp4",
          fileSize: file.file_size ? BigInt(file.file_size) : null,
          recordedAt: file.recording_start ? new Date(file.recording_start) : new Date(),
          meetingId,
          sessionId,
          organizationId,
          uploadedById: userId,
        },
      });

      newRecordings.push({
        id: recording.id,
        title: recording.title,
        fileUrl: recording.fileUrl || "",
        duration: recording.duration,
      });
    }

    return newRecordings;
  } catch (error) {
    console.error("Erreur récupération enregistrements Zoom:", error);
    return newRecordings;
  }
}

// GET - Synchroniser tous les enregistrements des réunions terminées récemment
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Récupérer les réunions terminées dans les dernières 24h avec enregistrement activé
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const meetings = await prisma.videoMeeting.findMany({
      where: {
        organizationId: user.organizationId,
        status: VideoMeetingStatus.ENDED,
        enableRecording: true,
        actualEnd: {
          gte: oneDayAgo,
        },
        provider: VideoProvider.ZOOM, // Seulement Zoom pour l'instant
      },
      include: {
        integration: true,
        recordings: true,
      },
    });

    let totalSynced = 0;
    const errors: string[] = [];

    for (const meeting of meetings) {
      // Ignorer si déjà des enregistrements
      if (meeting.recordings.length > 0) {
        continue;
      }

      try {
        let accessToken = meeting.integration.accessToken;

        if (isTokenExpired(meeting.integration.tokenExpiry)) {
          const refreshed = await refreshAccessToken(meeting.integration);
          if (refreshed) {
            accessToken = refreshed.accessToken;
          } else {
            errors.push(`Token expiré pour la réunion ${meeting.title}`);
            continue;
          }
        }

        const newRecordings = await syncZoomRecordings(
          accessToken,
          meeting.externalId,
          meeting.id,
          meeting.sessionId,
          user.organizationId,
          user.id
        );

        totalSynced += newRecordings.length;
      } catch (error) {
        console.error(`Erreur sync réunion ${meeting.id}:`, error);
        errors.push(`Erreur pour la réunion ${meeting.title}`);
      }
    }

    return NextResponse.json({
      message: `${totalSynced} enregistrement(s) synchronisé(s)`,
      meetingsChecked: meetings.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Erreur GET sync recordings:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
