// ===========================================
// API VIDEO MEETING - /api/video/meetings/[id]
// ===========================================
// Gestion d'une réunion spécifique

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import prisma from "@/lib/db/prisma";
import { VideoProvider, VideoMeetingStatus } from "@prisma/client";
import { refreshAccessToken } from "@/lib/video/token-refresh";
import { deleteZoomMeeting, deleteGoogleMeetMeeting, deleteTeamsMeeting } from "@/lib/video/providers";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET - Détails d'une réunion
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const { id } = await params;

    const meeting = await prisma.videoMeeting.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
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
          include: {
            apprenant: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
              },
            },
            intervenant: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
              },
            },
          },
        },
        recordings: {
          select: {
            id: true,
            title: true,
            duration: true,
            fileUrl: true,
            hasTranscription: true,
            createdAt: true,
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Réunion non trouvée" }, { status: 404 });
    }

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error("Erreur GET video meeting:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une réunion
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, actualStart, actualEnd } = body;

    // Vérifier que la réunion existe
    const meeting = await prisma.videoMeeting.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Réunion non trouvée" }, { status: 404 });
    }

    // Construire les données de mise à jour
    const updateData: Record<string, unknown> = {};

    if (status && Object.values(VideoMeetingStatus).includes(status)) {
      updateData.status = status;

      // Mettre à jour automatiquement les timestamps
      if (status === VideoMeetingStatus.IN_PROGRESS && !meeting.actualStart) {
        updateData.actualStart = new Date();
      } else if (status === VideoMeetingStatus.ENDED && !meeting.actualEnd) {
        updateData.actualEnd = new Date();
      }
    }

    if (actualStart) {
      updateData.actualStart = new Date(actualStart);
    }

    if (actualEnd) {
      updateData.actualEnd = new Date(actualEnd);
    }

    const updatedMeeting = await prisma.videoMeeting.update({
      where: { id },
      data: updateData,
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
        participants: true,
      },
    });

    return NextResponse.json({ meeting: updatedMeeting });
  } catch (error) {
    console.error("Erreur PUT video meeting:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une réunion
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const { id } = await params;

    // Récupérer la réunion avec son intégration
    const meeting = await prisma.videoMeeting.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        integration: true,
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Réunion non trouvée" }, { status: 404 });
    }

    // Essayer de supprimer la réunion chez le provider
    try {
      let accessToken = meeting.integration.accessToken;

      // Rafraîchir le token si nécessaire
      if (meeting.integration.tokenExpiry && new Date(meeting.integration.tokenExpiry) < new Date()) {
        const refreshed = await refreshAccessToken(meeting.integration);
        if (refreshed) {
          accessToken = refreshed.accessToken;
        }
      }

      switch (meeting.provider) {
        case VideoProvider.ZOOM:
          await deleteZoomMeeting(accessToken, meeting.externalId);
          break;
        case VideoProvider.GOOGLE_MEET:
          await deleteGoogleMeetMeeting(accessToken, meeting.externalId);
          break;
        case VideoProvider.MICROSOFT_TEAMS:
          await deleteTeamsMeeting(accessToken, meeting.externalId);
          break;
      }
    } catch (providerError) {
      // Log l'erreur mais continuer la suppression en base
      console.error("Erreur suppression provider:", providerError);
    }

    // Supprimer les participants
    await prisma.videoParticipant.deleteMany({
      where: { meetingId: id },
    });

    // Supprimer la réunion en base
    await prisma.videoMeeting.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE video meeting:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
