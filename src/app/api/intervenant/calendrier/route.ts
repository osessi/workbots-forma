// ===========================================
// API CALENDRIER INTERVENANT - GET /api/intervenant/calendrier
// ===========================================
// Correction 522: Récupère les événements du calendrier pour l'intervenant
// - Créneaux de formation (journées)
// - Évaluation formateur (disponible après la fin de session)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Décoder et valider le token intervenant
function decodeIntervenantToken(token: string): { intervenantId: string; organizationId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));
    if (!decoded.intervenantId || !decoded.organizationId) return null;
    if (decoded.exp && decoded.exp < Date.now()) return null;
    return { intervenantId: decoded.intervenantId, organizationId: decoded.organizationId };
  } catch {
    return null;
  }
}

// Types d'événements calendrier
interface CalendarEvent {
  id: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  sessionNom: string;
  sessionReference: string;
  sessionId: string;
  lieu: string | null;
  modalite: string | null;
  nombreApprenants: number;
  type: "formation" | "evaluation";
  // Champs spécifiques aux évaluations
  evaluationType?: "formateur";
  evaluationLabel?: string;
  evaluationStatus?: "not_available" | "a_faire" | "en_cours" | "termine";
  evaluationUrl?: string;
  // Détails demi-journées
  matin?: {
    heureDebut: string | null;
    heureFin: string | null;
    planned: boolean;
  };
  aprem?: {
    heureDebut: string | null;
    heureFin: string | null;
    planned: boolean;
  };
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    }

    const decoded = decodeIntervenantToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
    }

    const { intervenantId, organizationId } = decoded;

    // Récupérer les sessions de l'intervenant (filtrées par sessionId si fourni)
    const sessions = await prisma.session.findMany({
      where: {
        organizationId,
        ...(sessionId ? { id: sessionId } : {}),
        OR: [
          { formateurId: intervenantId },
          { coFormateurs: { some: { intervenantId } } },
        ],
      },
      include: {
        journees: {
          orderBy: { date: "asc" },
        },
        lieu: true,
        formation: {
          select: { titre: true },
        },
        clients: {
          include: {
            participants: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (sessions.length === 0) {
      return NextResponse.json({ events: [] });
    }

    // Récupérer les évaluations intervenant pour ces sessions
    const evaluationsIntervenant = await prisma.evaluationIntervenant.findMany({
      where: {
        intervenantId,
        sessionId: { in: sessions.map(s => s.id) },
      },
      select: {
        id: true,
        sessionId: true,
        status: true,
        token: true,
        expiresAt: true,
      },
    });

    const evalBySessionId = new Map(evaluationsIntervenant.map(e => [e.sessionId, e]));

    // Construire la liste des événements
    const events: CalendarEvent[] = [];
    const now = new Date();

    for (const session of sessions) {
      const sessionName = session.nom || session.formation?.titre || `Session ${session.reference}`;
      const nombreApprenants = session.clients.reduce((sum, c) => sum + c.participants.length, 0);

      // Ajouter les journées de formation
      for (const journee of session.journees) {
        const hasMatinPlanned = !!(journee.heureDebutMatin && journee.heureFinMatin);
        const hasApremPlanned = !!(journee.heureDebutAprem && journee.heureFinAprem);

        events.push({
          id: journee.id,
          date: journee.date.toISOString(),
          heureDebut: journee.heureDebutMatin || journee.heureDebutAprem || "09:00",
          heureFin: journee.heureFinAprem || journee.heureFinMatin || "17:00",
          sessionNom: sessionName,
          sessionReference: session.reference,
          sessionId: session.id,
          lieu: session.lieu?.nom || null,
          modalite: session.modalite || null,
          nombreApprenants,
          type: "formation",
          matin: {
            heureDebut: journee.heureDebutMatin,
            heureFin: journee.heureFinMatin,
            planned: hasMatinPlanned,
          },
          aprem: {
            heureDebut: journee.heureDebutAprem,
            heureFin: journee.heureFinAprem,
            planned: hasApremPlanned,
          },
        });
      }

      // Ajouter l'évaluation formateur si la session a des journées
      if (session.journees.length > 0) {
        const lastDay = new Date(session.journees[session.journees.length - 1].date);
        const evalIntervenant = evalBySessionId.get(session.id);

        // L'évaluation est disponible après le dernier jour de la session
        const isAvailable = now >= lastDay;
        let evaluationStatus: "not_available" | "a_faire" | "en_cours" | "termine" = "not_available";

        if (evalIntervenant) {
          if (evalIntervenant.status === "COMPLETED") {
            evaluationStatus = "termine";
          } else if (evalIntervenant.status === "IN_PROGRESS") {
            evaluationStatus = "en_cours";
          } else if (isAvailable) {
            evaluationStatus = "a_faire";
          }
        } else if (isAvailable) {
          evaluationStatus = "a_faire";
        }

        // Date de l'évaluation = dernier jour de la session
        events.push({
          id: `eval-formateur-${session.id}`,
          date: lastDay.toISOString(),
          heureDebut: "00:00",
          heureFin: "23:59",
          sessionNom: sessionName,
          sessionReference: session.reference,
          sessionId: session.id,
          lieu: null,
          modalite: "En ligne",
          nombreApprenants,
          type: "evaluation",
          evaluationType: "formateur",
          evaluationLabel: "Évaluation formateur",
          evaluationStatus,
          evaluationUrl: evalIntervenant?.token
            ? `/intervenant/evaluations?evalToken=${evalIntervenant.token}`
            : "/intervenant/evaluations",
        });
      }
    }

    // Trier par date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Erreur API calendrier intervenant:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
