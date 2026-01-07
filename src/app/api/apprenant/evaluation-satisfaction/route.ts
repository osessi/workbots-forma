// ===========================================
// API ÉVALUATIONS SATISFACTION APPRENANT - GET /api/apprenant/evaluation-satisfaction
// ===========================================
// Récupère les évaluations de satisfaction (à chaud/à froid) pour l'apprenant
// Avec restrictions temporelles :
// - Éval à chaud : disponible 15 minutes avant la fin de la dernière journée
// - Éval à froid : débloquée 3 mois après la dernière journée

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Constantes de configuration
const EVAL_CHAUD_MINUTES_BEFORE_END = 15; // Minutes avant la fin de la session
const EVAL_FROID_MONTHS_AFTER = 3; // Mois après la fin de la session

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

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis les query params
    const token = request.nextUrl.searchParams.get("token");

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

    // Récupérer les évaluations de satisfaction de l'apprenant
    const evaluations = await prisma.evaluationSatisfaction.findMany({
      where: {
        apprenantId,
      },
      include: {
        session: {
          include: {
            formation: {
              select: {
                id: true,
                titre: true,
              },
            },
            journees: {
              orderBy: { date: "asc" },
            },
          },
        },
        reponse: {
          select: {
            noteGlobale: true,
            scoreMoyen: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const now = new Date();

    // Formater les données avec vérification des restrictions temporelles
    const formattedEvaluations = evaluations.map((evaluation) => {
      // Calculer les dates de la session
      const journees = evaluation.session.journees;
      const premiereJournee = journees[0]?.date || null;
      const derniereJournee = journees[journees.length - 1]?.date || null;

      // Calculer la date de fin de session (dernière journée à 17h30 par défaut)
      let dateFinSession: Date | null = null;
      if (derniereJournee) {
        dateFinSession = new Date(derniereJournee);
        dateFinSession.setHours(17, 30, 0, 0); // Heure de fin par défaut
      }

      // Calculer la disponibilité selon le type
      let isAvailable = true;
      let availableAt: Date | null = null;
      let availableMessage: string | null = null;

      if (evaluation.status !== "COMPLETED") {
        if (evaluation.type === "CHAUD" && dateFinSession) {
          // Éval à chaud : disponible 15 minutes avant la fin
          const availableTime = new Date(dateFinSession.getTime() - EVAL_CHAUD_MINUTES_BEFORE_END * 60 * 1000);
          isAvailable = now >= availableTime;
          if (!isAvailable) {
            availableAt = availableTime;
            availableMessage = `Disponible ${EVAL_CHAUD_MINUTES_BEFORE_END} minutes avant la fin de la session`;
          }
        } else if (evaluation.type === "FROID" && dateFinSession) {
          // Éval à froid : débloquée 3 mois après la fin
          const availableTime = new Date(dateFinSession);
          availableTime.setMonth(availableTime.getMonth() + EVAL_FROID_MONTHS_AFTER);
          isAvailable = now >= availableTime;
          if (!isAvailable) {
            availableAt = availableTime;
            availableMessage = `Disponible ${EVAL_FROID_MONTHS_AFTER} mois après la session`;
          }
        }
      }

      // Vérifier si expirée
      const isExpired = evaluation.expiresAt && now > evaluation.expiresAt;
      let effectiveStatus: string = evaluation.status;

      if (isExpired && evaluation.status !== "COMPLETED") {
        effectiveStatus = "EXPIRED";
      } else if (!isAvailable && evaluation.status === "PENDING") {
        effectiveStatus = "LOCKED"; // Nouveau statut pour évaluations pas encore disponibles
      }

      return {
        id: evaluation.id,
        token: evaluation.token,
        type: evaluation.type, // CHAUD ou FROID
        status: effectiveStatus,
        isAvailable,
        availableAt: availableAt?.toISOString() || null,
        availableMessage,
        formation: {
          id: evaluation.session.formation.id,
          titre: evaluation.session.formation.titre,
        },
        session: {
          id: evaluation.sessionId,
          dateDebut: premiereJournee,
          dateFin: derniereJournee,
        },
        expiresAt: evaluation.expiresAt?.toISOString() || null,
        completedAt: evaluation.completedAt?.toISOString() || null,
        score: evaluation.reponse?.noteGlobale || null,
        scoreMoyen: evaluation.reponse?.scoreMoyen || null,
      };
    });

    // Séparer par type
    const evaluationsChaud = formattedEvaluations.filter(e => e.type === "CHAUD");
    const evaluationsFroid = formattedEvaluations.filter(e => e.type === "FROID");

    // Stats
    const stats = {
      total: evaluations.length,
      pending: formattedEvaluations.filter(e => e.status === "PENDING").length,
      inProgress: formattedEvaluations.filter(e => e.status === "IN_PROGRESS").length,
      completed: formattedEvaluations.filter(e => e.status === "COMPLETED").length,
      expired: formattedEvaluations.filter(e => e.status === "EXPIRED").length,
      locked: formattedEvaluations.filter(e => e.status === "LOCKED").length,
      available: formattedEvaluations.filter(e => e.isAvailable && e.status !== "COMPLETED" && e.status !== "EXPIRED").length,
      chaud: evaluationsChaud.length,
      froid: evaluationsFroid.length,
    };

    return NextResponse.json({
      evaluations: formattedEvaluations,
      evaluationsChaud,
      evaluationsFroid,
      stats,
    });
  } catch (error) {
    console.error("Erreur API évaluations satisfaction apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des évaluations" },
      { status: 500 }
    );
  }
}
