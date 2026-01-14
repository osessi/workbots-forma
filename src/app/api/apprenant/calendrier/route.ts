// ===========================================
// API CALENDRIER APPRENANT - GET /api/apprenant/calendrier
// ===========================================
// Récupère les événements du calendrier pour l'apprenant
// Correction 469-472: Ajout des 4 évaluations avec règles de dates

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Décoder et valider le token apprenant
function decodeApprenantToken(token: string): { apprenantId: string; organizationId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));

    if (!decoded.apprenantId || !decoded.organizationId) {
      return null;
    }

    // Vérifier expiration
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }

    return {
      apprenantId: decoded.apprenantId,
      organizationId: decoded.organizationId,
    };
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
  formateur: string | null;
  modalite: string | null;
  type: "formation" | "evaluation";
  // Correction 470: Champs spécifiques aux évaluations
  evaluationType?: "positionnement" | "finale" | "chaud" | "froid";
  evaluationLabel?: string;
  evaluationStatus?: "a_faire" | "en_cours" | "termine";
  evaluationUrl?: string;
}

// Correction 470: Calculer les dates des évaluations
function calculateEvaluationDates(journees: Array<{ date: Date }>) {
  if (journees.length === 0) return null;

  const firstDay = new Date(journees[0].date);
  const lastDay = new Date(journees[journees.length - 1].date);

  // Test de positionnement : J-7 avant le 1er jour
  const positionnement = new Date(firstDay);
  positionnement.setDate(positionnement.getDate() - 7);

  // Évaluation finale : le dernier jour de la session
  const finale = new Date(lastDay);

  // Évaluation à chaud : le dernier jour de la session
  const chaud = new Date(lastDay);

  // Évaluation à froid : J+3 mois après le dernier jour
  const froid = new Date(lastDay);
  froid.setMonth(froid.getMonth() + 3);

  return {
    positionnement,
    finale,
    chaud,
    froid,
    firstDay,
    lastDay,
  };
}

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis les query params
    const token = request.nextUrl.searchParams.get("token");
    // Correction 430: Utiliser sessionId au lieu de inscriptionId
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 401 }
      );
    }

    // Décoder le token
    const decoded = decodeApprenantToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    const { apprenantId } = decoded;

    // Correction 430: Récupérer les participations aux sessions filtrées par sessionId
    const participations = await prisma.sessionParticipantNew.findMany({
      where: {
        apprenantId,
        // Filtrer par sessionId si fourni
        ...(sessionId ? {
          client: {
            sessionId: sessionId,
          },
        } : {}),
      },
      include: {
        client: {
          include: {
            session: {
              include: {
                journees: {
                  orderBy: { date: "asc" },
                },
                formateur: true,
                lieu: true,
                formation: {
                  select: {
                    titre: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (participations.length === 0) {
      return NextResponse.json({ events: [] });
    }

    // Construire la liste des événements
    const events: CalendarEvent[] = [];

    for (const participation of participations) {
      const session = participation.client.session;
      const evalDates = calculateEvaluationDates(session.journees);

      // Note: Le statut des évaluations est défini à "a_faire" par défaut
      // car le modèle evaluationResponses n'existe pas encore dans le schéma

      // Ajouter les journées de formation
      for (const journee of session.journees) {
        events.push({
          id: journee.id,
          date: journee.date.toISOString(),
          heureDebut: journee.heureDebutMatin || "09:00",
          heureFin: journee.heureFinAprem || "17:00",
          sessionNom: session.nom || session.formation?.titre || `Session ${session.reference}`,
          sessionReference: session.reference,
          sessionId: session.id,
          lieu: session.lieu?.nom || null,
          formateur: session.formateur
            ? `${session.formateur.prenom} ${session.formateur.nom}`
            : null,
          modalite: session.modalite || null,
          type: "formation",
        });
      }

      // Correction 470: Ajouter les 4 évaluations si on a des dates
      if (evalDates) {
        const sessionName = session.nom || session.formation?.titre || `Session ${session.reference}`;

        // 1. Test de positionnement (J-7)
        events.push({
          id: `eval-positionnement-${session.id}`,
          date: evalDates.positionnement.toISOString(),
          heureDebut: "00:00",
          heureFin: "23:59",
          sessionNom: sessionName,
          sessionReference: session.reference,
          sessionId: session.id,
          lieu: null,
          formateur: null,
          modalite: "En ligne",
          type: "evaluation",
          evaluationType: "positionnement",
          evaluationLabel: "Test de positionnement",
          evaluationStatus: "a_faire",
          evaluationUrl: `/apprenant/evaluations?type=positionnement&sessionId=${session.id}`,
        });

        // 2. Évaluation finale (dernier jour)
        events.push({
          id: `eval-finale-${session.id}`,
          date: evalDates.finale.toISOString(),
          heureDebut: "00:00",
          heureFin: "23:59",
          sessionNom: sessionName,
          sessionReference: session.reference,
          sessionId: session.id,
          lieu: null,
          formateur: null,
          modalite: "En ligne",
          type: "evaluation",
          evaluationType: "finale",
          evaluationLabel: "Évaluation finale",
          evaluationStatus: "a_faire",
          evaluationUrl: `/apprenant/evaluations?type=finale&sessionId=${session.id}`,
        });

        // 3. Évaluation à chaud (dernier jour)
        events.push({
          id: `eval-chaud-${session.id}`,
          date: evalDates.chaud.toISOString(),
          heureDebut: "00:00",
          heureFin: "23:59",
          sessionNom: sessionName,
          sessionReference: session.reference,
          sessionId: session.id,
          lieu: null,
          formateur: null,
          modalite: "En ligne",
          type: "evaluation",
          evaluationType: "chaud",
          evaluationLabel: "Évaluation à chaud",
          evaluationStatus: "a_faire",
          evaluationUrl: `/apprenant/evaluations?type=chaud&sessionId=${session.id}`,
        });

        // 4. Évaluation à froid (J+3 mois)
        events.push({
          id: `eval-froid-${session.id}`,
          date: evalDates.froid.toISOString(),
          heureDebut: "00:00",
          heureFin: "23:59",
          sessionNom: sessionName,
          sessionReference: session.reference,
          sessionId: session.id,
          lieu: null,
          formateur: null,
          modalite: "En ligne",
          type: "evaluation",
          evaluationType: "froid",
          evaluationLabel: "Évaluation à froid",
          evaluationStatus: "a_faire",
          evaluationUrl: `/apprenant/evaluations?type=froid&sessionId=${session.id}`,
        });
      }
    }

    // Trier par date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Erreur API calendrier apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du calendrier" },
      { status: 500 }
    );
  }
}
