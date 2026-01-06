// ===========================================
// VIDEO PROVIDERS - Création de réunions
// ===========================================
// Fonctions pour créer des réunions sur Zoom, Google Meet et Microsoft Teams

interface MeetingDetails {
  title: string;
  description?: string;
  scheduledStart: Date;
  scheduledEnd?: Date;
  duration: number;
  enableRecording: boolean;
  enableWaitingRoom: boolean;
}

interface MeetingResult {
  id: string;
  joinUrl: string;
  hostUrl?: string;
  password?: string;
}

// ===========================================
// ZOOM
// ===========================================
export async function createZoomMeeting(
  accessToken: string,
  details: MeetingDetails
): Promise<MeetingResult> {
  const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: details.title,
      type: 2, // Scheduled meeting
      start_time: details.scheduledStart.toISOString(),
      duration: details.duration,
      timezone: "Europe/Paris",
      agenda: details.description || "",
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: !details.enableWaitingRoom,
        waiting_room: details.enableWaitingRoom,
        auto_recording: details.enableRecording ? "cloud" : "none",
        approval_type: 2, // No registration required
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Zoom API error:", error);
    throw new Error(`Erreur Zoom: ${response.status}`);
  }

  const data = await response.json();

  return {
    id: data.id.toString(),
    joinUrl: data.join_url,
    hostUrl: data.start_url,
    password: data.password || undefined,
  };
}

// ===========================================
// GOOGLE MEET
// ===========================================
export async function createGoogleMeetMeeting(
  accessToken: string,
  details: MeetingDetails
): Promise<MeetingResult> {
  // Google Meet nécessite de créer un événement Calendar avec une conférence
  const endTime = details.scheduledEnd || new Date(details.scheduledStart.getTime() + details.duration * 60 * 1000);

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: details.title,
        description: details.description || "",
        start: {
          dateTime: details.scheduledStart.toISOString(),
          timeZone: "Europe/Paris",
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: "Europe/Paris",
        },
        conferenceData: {
          createRequest: {
            requestId: `meeting-${Date.now()}`,
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Google Calendar API error:", error);
    throw new Error(`Erreur Google Meet: ${response.status}`);
  }

  const data = await response.json();

  // Extraire l'URL de la conférence
  const conferenceData = data.conferenceData;
  const meetUrl = conferenceData?.entryPoints?.find(
    (ep: { entryPointType: string }) => ep.entryPointType === "video"
  )?.uri || `https://meet.google.com/${conferenceData?.conferenceId}`;

  return {
    id: data.id,
    joinUrl: meetUrl,
  };
}

// ===========================================
// MICROSOFT TEAMS
// ===========================================
export async function createTeamsMeeting(
  accessToken: string,
  details: MeetingDetails
): Promise<MeetingResult> {
  const endTime = details.scheduledEnd || new Date(details.scheduledStart.getTime() + details.duration * 60 * 1000);

  const response = await fetch("https://graph.microsoft.com/v1.0/me/onlineMeetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subject: details.title,
      startDateTime: details.scheduledStart.toISOString(),
      endDateTime: endTime.toISOString(),
      lobbyBypassSettings: {
        scope: details.enableWaitingRoom ? "organizer" : "everyone",
        isDialInBypassEnabled: !details.enableWaitingRoom,
      },
      recordAutomatically: details.enableRecording,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Microsoft Graph API error:", error);
    throw new Error(`Erreur Microsoft Teams: ${response.status}`);
  }

  const data = await response.json();

  return {
    id: data.id,
    joinUrl: data.joinWebUrl,
  };
}

// ===========================================
// HELPERS
// ===========================================

// Supprimer une réunion Zoom
export async function deleteZoomMeeting(accessToken: string, meetingId: string): Promise<void> {
  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(`Erreur suppression Zoom: ${response.status}`);
  }
}

// Supprimer un événement Google Calendar
export async function deleteGoogleMeetMeeting(accessToken: string, eventId: string): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 204) {
    throw new Error(`Erreur suppression Google Meet: ${response.status}`);
  }
}

// Supprimer une réunion Teams (désactivation plutôt que suppression)
export async function deleteTeamsMeeting(accessToken: string, meetingId: string): Promise<void> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/onlineMeetings/${meetingId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 204) {
    throw new Error(`Erreur suppression Teams: ${response.status}`);
  }
}

// Récupérer les enregistrements Zoom
export async function getZoomRecordings(accessToken: string, meetingId: string) {
  const response = await fetch(
    `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null; // Pas d'enregistrement
    }
    throw new Error(`Erreur récupération enregistrements Zoom: ${response.status}`);
  }

  return response.json();
}
