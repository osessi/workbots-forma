// ===========================================
// API DASHBOARD APPRENANT - GET /api/apprenant/dashboard
// ===========================================
// Récupère toutes les données nécessaires pour le dashboard apprenant

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

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis les query params
    const token = request.nextUrl.searchParams.get("token");
    const inscriptionId = request.nextUrl.searchParams.get("inscriptionId");

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

    const { apprenantId, organizationId } = decoded;

    // Récupérer l'apprenant avec ses données
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id: apprenantId,
        organizationId,
      },
    });

    if (!apprenant) {
      return NextResponse.json(
        { error: "Apprenant non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer l'inscription LMS sélectionnée (ou la première)
    const inscription = await prisma.lMSInscription.findFirst({
      where: inscriptionId
        ? { id: inscriptionId, apprenantId }
        : { apprenantId },
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
            description: true,
            image: true,
            modules: {
              select: {
                id: true,
                titre: true,
                ordre: true,
                duree: true,
              },
              orderBy: { ordre: "asc" },
            },
            documents: true,
          },
        },
        progressionModules: true,
      },
    });

    if (!inscription) {
      return NextResponse.json({
        stats: {
          evaluationsEnAttente: 0,
          documentsDisponibles: 0,
          emargementsEnAttente: 0,
          prochainsCréneaux: 0,
        },
        progression: null,
        actionsUrgentes: [],
        prochainsCreneaux: [],
        formateur: null,
        formation: null,
      });
    }

    // Récupérer les évaluations QCM/Atelier en attente
    const evaluationsEnAttente = await prisma.evaluation.count({
      where: {
        formationId: inscription.formationId,
        isActive: true,
        resultats: {
          none: {
            apprenantId,
            status: { in: ["termine", "valide"] },
          },
        },
      },
    });

    // Récupérer les évaluations complètes pour affichage
    const evaluationsDetails = await prisma.evaluation.findMany({
      where: {
        formationId: inscription.formationId,
        isActive: true,
      },
      include: {
        resultats: {
          where: { apprenantId },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { ordre: "asc" },
    });

    // Récupérer les évaluations de satisfaction en attente (Qualiopi IND 2)
    const evaluationsSatisfactionEnAttente = await prisma.evaluationSatisfaction.findMany({
      where: {
        apprenantId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        session: {
          include: {
            formation: {
              select: { id: true, titre: true },
            },
            journees: {
              orderBy: { date: "asc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compter les documents disponibles
    const documentsDisponibles = inscription.formation.documents.length;

    // Récupérer les participations aux sessions pour émargements
    const sessionParticipations = await prisma.sessionParticipantNew.findMany({
      where: {
        apprenantId,
        client: {
          session: {
            formationId: inscription.formationId,
            status: { in: ["PLANIFIEE", "EN_COURS"] },
          },
        },
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
              },
            },
          },
        },
        signatures: true,
      },
    });

    // Calculer les émargements en attente
    let emargementsEnAttente = 0;
    const actionsUrgentes: Array<{
      type: string;
      titre: string;
      description: string;
      action: string;
      actionUrl: string;
      priorite: "haute" | "moyenne" | "basse";
    }> = [];

    // Calculer les émargements en attente à partir des signatures du participant
    for (const participation of sessionParticipations) {
      const signatureCount = participation.signatures?.length || 0;
      const journeeCount = participation.client.session.journees?.length || 0;
      // Chaque journée nécessite 2 signatures (matin + après-midi)
      const totalSignaturesNeeded = journeeCount * 2;
      if (signatureCount < totalSignaturesNeeded) {
        emargementsEnAttente += totalSignaturesNeeded - signatureCount;
      }
    }

    // Ajouter les actions urgentes
    if (emargementsEnAttente > 0) {
      actionsUrgentes.push({
        type: "emargement",
        titre: "Émargements en attente",
        description: `${emargementsEnAttente} signature${emargementsEnAttente > 1 ? "s" : ""} à effectuer`,
        action: "Signer",
        actionUrl: "/apprenant/emargements",
        priorite: "haute",
      });
    }

    if (evaluationsEnAttente > 0) {
      actionsUrgentes.push({
        type: "evaluation",
        titre: "Évaluations à compléter",
        description: `${evaluationsEnAttente} évaluation${evaluationsEnAttente > 1 ? "s" : ""} en attente`,
        action: "Compléter",
        actionUrl: "/apprenant/evaluations",
        priorite: "moyenne",
      });
    }

    // Ajouter les évaluations de satisfaction en attente (Qualiopi IND 2)
    if (evaluationsSatisfactionEnAttente.length > 0) {
      actionsUrgentes.push({
        type: "evaluation_satisfaction",
        titre: "Évaluations de satisfaction",
        description: `${evaluationsSatisfactionEnAttente.length} évaluation${evaluationsSatisfactionEnAttente.length > 1 ? "s" : ""} de satisfaction à compléter`,
        action: "Donner mon avis",
        actionUrl: "/apprenant/evaluations-satisfaction",
        priorite: "haute",
      });
    }

    // Récupérer les prochains créneaux
    const now = new Date();
    const prochainsCreneaux: Array<{
      id: string;
      date: string;
      heureDebut: string;
      heureFin: string;
      sessionNom: string;
      lieu: string | null;
      formateur: string | null;
    }> = [];

    for (const participation of sessionParticipations) {
      const session = participation.client.session;

      for (const journee of session.journees) {
        if (new Date(journee.date) >= now) {
          prochainsCreneaux.push({
            id: journee.id,
            date: journee.date.toISOString(),
            heureDebut: journee.heureDebutMatin || "09:00",
            heureFin: journee.heureFinAprem || "17:00",
            sessionNom: session.nom || `Session ${session.reference}`,
            lieu: session.lieu?.nom || null,
            formateur: session.formateur
              ? `${session.formateur.prenom} ${session.formateur.nom}`
              : null,
          });
        }
      }
    }

    // Trier par date et prendre les 5 prochains
    prochainsCreneaux.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const prochainsCréneauxLimités = prochainsCreneaux.slice(0, 5);

    // Récupérer le formateur principal
    const formateurPrincipal = sessionParticipations[0]?.client.session.formateur || null;

    // Calculer la progression par module
    const modulesAvecProgression = inscription.formation.modules.map((module) => {
      const progression = inscription.progressionModules.find(
        (p) => p.moduleId === module.id
      );
      return {
        id: module.id,
        titre: module.titre,
        ordre: module.ordre,
        duree: module.duree,
        progression: progression?.progression || 0,
        statut: progression?.statut || "NON_COMMENCE",
      };
    });

    return NextResponse.json({
      stats: {
        evaluationsEnAttente,
        evaluationsSatisfactionEnAttente: evaluationsSatisfactionEnAttente.length,
        documentsDisponibles,
        emargementsEnAttente,
        prochainsCréneaux: prochainsCréneauxLimités.length,
      },
      progression: {
        global: inscription.progression,
        statut: inscription.statut,
        tempsTotal: inscription.tempsTotal,
        modules: modulesAvecProgression,
      },
      actionsUrgentes,
      prochainsCreneaux: prochainsCréneauxLimités,
      formateur: formateurPrincipal
        ? {
            id: formateurPrincipal.id,
            nom: formateurPrincipal.nom,
            prenom: formateurPrincipal.prenom,
            fonction: formateurPrincipal.fonction,
            photoUrl: null, // À ajouter dans le modèle Prisma
            specialites: formateurPrincipal.specialites,
          }
        : null,
      formation: {
        id: inscription.formation.id,
        titre: inscription.formation.titre,
        description: inscription.formation.description,
        image: inscription.formation.image,
        dureeMinutes: inscription.formation.modules.reduce((sum, m) => sum + (m.duree || 0), 0),
        nombreModules: inscription.formation.modules.length,
      },
      evaluations: evaluationsDetails.map((e) => ({
        id: e.id,
        titre: e.titre,
        type: e.type,
        description: e.description,
        dureeEstimee: e.dureeEstimee,
        resultat: e.resultats[0] || null,
      })),
      // Évaluations de satisfaction en attente (Qualiopi IND 2)
      evaluationsSatisfaction: evaluationsSatisfactionEnAttente.map((e) => ({
        id: e.id,
        type: e.type,
        status: e.status,
        token: e.token,
        sessionId: e.sessionId,
        formationTitre: e.session?.formation?.titre || null,
        dateSession: e.session?.journees?.[0]?.date?.toISOString() || null,
        expiresAt: e.expiresAt?.toISOString() || null,
        createdAt: e.createdAt.toISOString(),
        // URL directe pour compléter l'évaluation
        evaluationUrl: `/evaluation-satisfaction/${e.token}`,
      })),
    });
  } catch (error) {
    console.error("Erreur API dashboard apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}
