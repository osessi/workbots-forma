// ===========================================
// API ÉVALUATIONS SATISFACTION APPRENANT - GET /api/apprenant/evaluation-satisfaction
// ===========================================
// Corrections 451-455: Évaluations satisfaction avec nouvelles règles
// - Éval à chaud : disponible 2h avant la fin de la session (correction 453)
// - Éval à froid : disponible 3 mois après la fin de la session
// - Toujours afficher 2 cartes (à chaud + à froid) même si pas encore créées

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Correction 453: Constantes de configuration
const EVAL_CHAUD_HOURS_BEFORE_END = 2; // Heures avant la fin de la session
const EVAL_FROID_MONTHS_AFTER = 3; // Mois après la fin de la session

// Génère un token unique pour l'évaluation de satisfaction
function generateSatisfactionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

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

// Type pour les évaluations formatées
interface FormattedSatisfaction {
  id: string | null;
  token: string | null;
  type: "CHAUD" | "FROID";
  titre: string;
  description: string;
  statut: "a_venir" | "disponible" | "complete";
  isAvailable: boolean;
  dateOuverture: string | null;
  dateCompletion: string | null;
  score: number | null;
  formationTitre: string | null;
}

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis les query params
    const token = request.nextUrl.searchParams.get("token");
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

    if (!sessionId) {
      // Sans session sélectionnée, retourner des données vides avec stats par défaut
      return NextResponse.json({
        evaluations: [],
        stats: {
          total: 2,
          disponibles: 0,
          aFaire: 0,
          completees: 0,
        },
        session: null,
      });
    }

    // Récupérer la session avec ses journées
    const participation = await prisma.sessionParticipantNew.findFirst({
      where: {
        apprenantId,
        client: {
          sessionId,
        },
      },
      include: {
        client: {
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
          },
        },
      },
    });

    if (!participation || !participation.client?.session) {
      return NextResponse.json({
        evaluations: [],
        stats: {
          total: 2,
          disponibles: 0,
          aFaire: 0,
          completees: 0,
        },
        session: null,
      });
    }

    const session = participation.client.session;
    const journees = session.journees || [];
    const now = new Date();

    // Calculer la date de fin de session
    let dateFinSession: Date | null = null;
    if (journees.length > 0) {
      const derniereJournee = journees[journees.length - 1];
      dateFinSession = new Date(derniereJournee.date);
      const heureFinAprem = derniereJournee.heureFinAprem || "17:30";
      const [hFin, mFin] = heureFinAprem.split(":").map(Number);
      dateFinSession.setHours(hFin, mFin, 0, 0);
    }

    // Récupérer les évaluations de satisfaction existantes pour cette session
    const existingEvaluations = await prisma.evaluationSatisfaction.findMany({
      where: {
        apprenantId,
        sessionId,
      },
      include: {
        reponse: {
          select: {
            noteGlobale: true,
            scoreMoyen: true,
          },
        },
      },
    });

    // Créer un map par type
    let evalChaud = existingEvaluations.find(e => e.type === "CHAUD");
    let evalFroid = existingEvaluations.find(e => e.type === "FROID");

    // Récupérer l'organizationId depuis la session
    const sessionWithOrg = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { organizationId: true },
    });
    const organizationId = sessionWithOrg?.organizationId;

    // Correction 452-455: Construire les 2 évaluations (toujours affichées)
    const evaluations: FormattedSatisfaction[] = [];

    // === ÉVALUATION À CHAUD ===
    // Correction 453: Disponible 2h avant la fin de la session
    let chaudStatut: "a_venir" | "disponible" | "complete" = "a_venir";
    let chaudDateOuverture: Date | null = null;
    let chaudIsAvailable = false;

    if (dateFinSession) {
      chaudDateOuverture = new Date(dateFinSession);
      chaudDateOuverture.setHours(chaudDateOuverture.getHours() - EVAL_CHAUD_HOURS_BEFORE_END);

      if (evalChaud?.status === "COMPLETED") {
        chaudStatut = "complete";
        chaudIsAvailable = true;
      } else if (now >= chaudDateOuverture) {
        chaudStatut = "disponible";
        chaudIsAvailable = true;

        // Correction: Créer automatiquement l'évaluation si elle n'existe pas et qu'on a les permissions
        if (!evalChaud && organizationId) {
          const newToken = generateSatisfactionToken();
          evalChaud = await prisma.evaluationSatisfaction.create({
            data: {
              apprenantId,
              sessionId,
              organizationId,
              type: "CHAUD",
              token: newToken,
              status: "PENDING",
            },
            include: {
              reponse: {
                select: {
                  noteGlobale: true,
                  scoreMoyen: true,
                },
              },
            },
          });
        }
      }
    }

    evaluations.push({
      id: evalChaud?.id || null,
      token: evalChaud?.token || null,
      type: "CHAUD",
      titre: "Évaluation à chaud",
      description: "Donnez votre avis juste après la formation",
      statut: chaudStatut,
      isAvailable: chaudIsAvailable,
      dateOuverture: chaudDateOuverture?.toISOString() || null,
      dateCompletion: evalChaud?.completedAt?.toISOString() || null,
      score: evalChaud?.reponse?.noteGlobale || null,
      formationTitre: session.formation.titre,
    });

    // === ÉVALUATION À FROID ===
    // Correction 453: Disponible 3 mois après la fin de la session
    let froidStatut: "a_venir" | "disponible" | "complete" = "a_venir";
    let froidDateOuverture: Date | null = null;
    let froidIsAvailable = false;

    if (dateFinSession) {
      froidDateOuverture = new Date(dateFinSession);
      froidDateOuverture.setMonth(froidDateOuverture.getMonth() + EVAL_FROID_MONTHS_AFTER);

      if (evalFroid?.status === "COMPLETED") {
        froidStatut = "complete";
        froidIsAvailable = true;
      } else if (now >= froidDateOuverture) {
        froidStatut = "disponible";
        froidIsAvailable = true;

        // Correction: Créer automatiquement l'évaluation si elle n'existe pas
        if (!evalFroid && organizationId) {
          const newToken = generateSatisfactionToken();
          evalFroid = await prisma.evaluationSatisfaction.create({
            data: {
              apprenantId,
              sessionId,
              organizationId,
              type: "FROID",
              token: newToken,
              status: "PENDING",
            },
            include: {
              reponse: {
                select: {
                  noteGlobale: true,
                  scoreMoyen: true,
                },
              },
            },
          });
        }
      }
    }

    evaluations.push({
      id: evalFroid?.id || null,
      token: evalFroid?.token || null,
      type: "FROID",
      titre: "Évaluation à froid",
      description: "Évaluez l'impact de la formation 3 mois après",
      statut: froidStatut,
      isAvailable: froidIsAvailable,
      dateOuverture: froidDateOuverture?.toISOString() || null,
      dateCompletion: evalFroid?.completedAt?.toISOString() || null,
      score: evalFroid?.reponse?.noteGlobale || null,
      formationTitre: session.formation.titre,
    });

    // Correction 451: Stats avec nouveaux libellés
    const total = 2; // Toujours 2 (à chaud + à froid)
    const completees = evaluations.filter(e => e.statut === "complete").length;
    const disponibles = evaluations.filter(e => e.statut === "disponible").length;
    const aFaire = disponibles; // Disponibles mais pas encore complétées

    return NextResponse.json({
      evaluations,
      stats: {
        total,
        disponibles,
        aFaire,
        completees,
      },
      session: {
        id: session.id,
        reference: session.reference,
        nom: session.nom,
        dateDebut: journees[0]?.date?.toISOString() || null,
        dateFin: dateFinSession?.toISOString() || null,
        formationTitre: session.formation.titre,
      },
    });
  } catch (error) {
    console.error("Erreur API évaluations satisfaction apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des évaluations" },
      { status: 500 }
    );
  }
}
