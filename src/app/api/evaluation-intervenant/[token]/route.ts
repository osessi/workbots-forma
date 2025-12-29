// ===========================================
// API ÉVALUATION INTERVENANT - Accès public via token QR
// ===========================================
// GET /api/evaluation-intervenant/[token] - Récupérer une évaluation par token (accès public)
// POST /api/evaluation-intervenant/[token] - Soumettre les réponses (accès public)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { QUESTIONS_EVALUATION_INTERVENANT } from "@/lib/evaluation/questions-intervenant";

// GET - Récupérer les infos de l'évaluation (accès public via QR)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const evaluation = await prisma.evaluationIntervenant.findUnique({
      where: { token },
      include: {
        intervenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        session: {
          include: {
            formation: {
              select: {
                id: true,
                titre: true,
                fichePedagogique: true,
              },
            },
            lieu: {
              select: {
                nom: true,
                lieuFormation: true,
                ville: true,
              },
            },
            journees: {
              orderBy: { date: "asc" },
            },
            clients: {
              include: {
                participants: true,
              },
            },
          },
        },
        reponse: true,
      },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Évaluation non trouvée" }, { status: 404 });
    }

    // Vérifier si expirée
    if (evaluation.expiresAt && new Date() > evaluation.expiresAt) {
      // Mettre à jour le statut si nécessaire
      if (evaluation.status !== "EXPIRED") {
        await prisma.evaluationIntervenant.update({
          where: { id: evaluation.id },
          data: { status: "EXPIRED" },
        });
      }
      return NextResponse.json({ error: "Lien d'évaluation expiré" }, { status: 410 });
    }

    // Vérifier si déjà complétée
    if (evaluation.status === "COMPLETED") {
      return NextResponse.json({
        error: "Cette évaluation a déjà été complétée",
        completed: true,
        completedAt: evaluation.completedAt,
      }, { status: 410 });
    }

    // Préparer les dates de formation
    const journees = evaluation.session.journees;
    const dateDebut = journees.length > 0 ? journees[0].date : null;
    const dateFin = journees.length > 0 ? journees[journees.length - 1].date : null;

    // Calculer le nombre de participants
    const nombreParticipants = evaluation.session.clients.reduce(
      (acc, client) => acc + client.participants.length,
      0
    );

    // Extraire les objectifs de la fiche pédagogique
    const fichePedagogique = evaluation.session.formation.fichePedagogique as Record<string, unknown> | null;
    const objectifs = fichePedagogique?.objectifs || "";

    // Préparer la réponse
    const response = {
      id: evaluation.id,
      token: evaluation.token,
      status: evaluation.status,
      formation: {
        titre: evaluation.session.formation.titre,
        objectifs: objectifs,
      },
      session: {
        dateDebut,
        dateFin,
        lieu: evaluation.session.lieu?.nom || evaluation.session.lieu?.lieuFormation || "Non spécifié",
        nombreParticipants,
      },
      intervenant: {
        nom: evaluation.intervenant.nom,
        prenom: evaluation.intervenant.prenom,
      },
      questions: QUESTIONS_EVALUATION_INTERVENANT,
      // Inclure les réponses partielles si en cours
      existingReponse: evaluation.reponse ? {
        ...evaluation.reponse,
        // Ne pas exposer l'IP et user-agent
        ipAddress: undefined,
        userAgent: undefined,
      } : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur récupération évaluation intervenant:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Soumettre les réponses (accès public)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { email, reponses, partial } = body;

    // Récupérer l'évaluation
    const evaluation = await prisma.evaluationIntervenant.findUnique({
      where: { token },
      include: {
        intervenant: true,
        reponse: true,
      },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Évaluation non trouvée" }, { status: 404 });
    }

    // Vérifications
    if (evaluation.expiresAt && new Date() > evaluation.expiresAt) {
      return NextResponse.json({ error: "Lien d'évaluation expiré" }, { status: 410 });
    }

    if (evaluation.status === "COMPLETED") {
      return NextResponse.json({ error: "Évaluation déjà complétée" }, { status: 410 });
    }

    // Vérification email (optionnel mais recommandé)
    if (email && evaluation.intervenant.email &&
        evaluation.intervenant.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "Email non correspondant" },
        { status: 403 }
      );
    }

    // Récupérer IP et User-Agent
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;

    // Préparer les données de réponse
    const reponseData: Record<string, unknown> = {};
    const noteFields: string[] = [];

    // Mapper les réponses aux champs de la table
    const intervenantFields = [
      "organisationConditions", "organisationGroupe", "organisationCoordination", "organisationSupports",
      "contenueObjectifs", "contenuMethodes", "contenuParticipation",
      "objectifsAtteints", "valeurAjoutee", "satisfactionGlobale"
    ];

    intervenantFields.forEach(field => {
      if (reponses[field] !== undefined && reponses[field] !== null) {
        const value = parseInt(reponses[field], 10);
        if (!isNaN(value) && value >= 0 && value <= 10) {
          reponseData[field] = value;
          noteFields.push(field);
        }
      }
    });

    // Ajouter les suggestions
    if (reponses.suggestions) {
      reponseData.suggestions = reponses.suggestions;
    }

    // Calculer le score moyen
    let scoreMoyen: number | null = null;
    if (noteFields.length > 0) {
      const totalNotes = noteFields.reduce((acc, field) => {
        return acc + ((reponseData[field] as number) || 0);
      }, 0);
      scoreMoyen = Math.round((totalNotes / noteFields.length) * 10) / 10;
    }

    // Mettre à jour ou créer la réponse
    const now = new Date();

    if (evaluation.reponse) {
      // Mettre à jour la réponse existante
      await prisma.evaluationIntervenantReponse.update({
        where: { id: evaluation.reponse.id },
        data: {
          ...reponseData,
          scoreMoyen,
          ipAddress,
          userAgent,
        },
      });
    } else {
      // Créer une nouvelle réponse
      await prisma.evaluationIntervenantReponse.create({
        data: {
          evaluationId: evaluation.id,
          ...reponseData,
          scoreMoyen,
          ipAddress,
          userAgent,
        },
      });
    }

    // Mettre à jour le statut de l'évaluation
    const newStatus = partial ? "IN_PROGRESS" : "COMPLETED";
    const updateData: Record<string, unknown> = {
      status: newStatus,
    };

    if (!evaluation.startedAt) {
      updateData.startedAt = now;
    }

    if (!partial) {
      updateData.completedAt = now;
    }

    await prisma.evaluationIntervenant.update({
      where: { id: evaluation.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      status: newStatus,
      scoreMoyen,
      message: partial
        ? "Réponses enregistrées (partiel)"
        : "Évaluation complétée avec succès",
    });
  } catch (error) {
    console.error("Erreur soumission évaluation intervenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la soumission" },
      { status: 500 }
    );
  }
}
