// ===========================================
// API ÉVALUATION SATISFACTION - Accès public via token QR
// ===========================================
// GET /api/evaluation-satisfaction/[token] - Récupérer une évaluation par token (accès public)
// POST /api/evaluation-satisfaction/[token] - Soumettre les réponses (accès public)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { QUESTIONS_EVALUATION_CHAUD, QUESTIONS_EVALUATION_FROID } from "@/lib/evaluation/questions-satisfaction";

// GET - Récupérer les infos de l'évaluation (accès public via QR)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const evaluation = await prisma.evaluationSatisfaction.findUnique({
      where: { token },
      include: {
        apprenant: {
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
            formateur: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
            journees: {
              orderBy: { date: "asc" },
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
        await prisma.evaluationSatisfaction.update({
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

    // Préparer les questions selon le type
    const questions = evaluation.type === "CHAUD"
      ? QUESTIONS_EVALUATION_CHAUD
      : QUESTIONS_EVALUATION_FROID;

    // Extraire les objectifs de la fiche pédagogique
    const fichePedagogique = evaluation.session.formation.fichePedagogique as Record<string, unknown> | null;
    const objectifs = fichePedagogique?.objectifs || "";

    // Préparer la réponse
    const response = {
      id: evaluation.id,
      token: evaluation.token,
      type: evaluation.type,
      status: evaluation.status,
      formation: {
        titre: evaluation.session.formation.titre,
        objectifs: objectifs,
      },
      session: {
        dateDebut,
        dateFin,
        lieu: evaluation.session.lieu?.nom || evaluation.session.lieu?.lieuFormation || "Non spécifié",
        formateur: evaluation.session.formateur
          ? `${evaluation.session.formateur.prenom} ${evaluation.session.formateur.nom}`
          : "Non spécifié",
      },
      apprenant: {
        nom: evaluation.apprenant.nom,
        prenom: evaluation.apprenant.prenom,
      },
      questions,
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
    console.error("Erreur récupération évaluation:", error);
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
    const evaluation = await prisma.evaluationSatisfaction.findUnique({
      where: { token },
      include: {
        apprenant: true,
        reponse: true,
        session: {
          select: {
            formationId: true,
          },
        },
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
    if (email && evaluation.apprenant.email.toLowerCase() !== email.toLowerCase()) {
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
    if (evaluation.type === "CHAUD") {
      // Évaluation à chaud
      const chaudFields = [
        "preparationInfos", "preparationMessages", "preparationPrerequis",
        "organisationCalendrier", "organisationConditions",
        "animationExplications", "animationEchanges", "animationAmbiance", "animationRythme",
        "contenuCoherence", "contenuUtilite", "contenuSupports", "contenuNiveau",
        "objectifsAtteints", "noteGlobale"
      ];

      chaudFields.forEach(field => {
        if (reponses[field] !== undefined && reponses[field] !== null) {
          const value = parseInt(reponses[field], 10);
          if (!isNaN(value) && value >= 0 && value <= 10) {
            reponseData[field] = value;
            noteFields.push(field);
          }
        }
      });
    } else {
      // Évaluation à froid
      const froidFields = [
        "noteGlobale", "froidAttentesInitiales",
        "froidCompetencesUtiles", "froidMiseEnPratique", "froidImpactTravail",
        "froidPertinenceActuelle", "froidUtiliteFuture",
        "froidObjectifsPratique", "recommandation"
      ];

      froidFields.forEach(field => {
        if (reponses[field] !== undefined && reponses[field] !== null) {
          const value = parseInt(reponses[field], 10);
          if (!isNaN(value) && value >= 0 && value <= 10) {
            reponseData[field] = value;
            noteFields.push(field);
          }
        }
      });
    }

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

    // Calculer le taux de satisfaction (basé sur la note globale)
    let tauxSatisfaction: number | null = null;
    if (reponseData.noteGlobale !== undefined) {
      tauxSatisfaction = (reponseData.noteGlobale as number) * 10; // Note/10 * 100 = %
    }

    // Mettre à jour ou créer la réponse
    const now = new Date();

    if (evaluation.reponse) {
      // Mettre à jour la réponse existante
      await prisma.evaluationSatisfactionReponse.update({
        where: { id: evaluation.reponse.id },
        data: {
          ...reponseData,
          scoreMoyen,
          tauxSatisfaction,
          ipAddress,
          userAgent,
        },
      });
    } else {
      // Créer une nouvelle réponse
      await prisma.evaluationSatisfactionReponse.create({
        data: {
          evaluationId: evaluation.id,
          ...reponseData,
          scoreMoyen,
          tauxSatisfaction,
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

    await prisma.evaluationSatisfaction.update({
      where: { id: evaluation.id },
      data: updateData,
    });

    // Si complété, mettre à jour les indicateurs de la formation
    if (!partial) {
      await updateFormationIndicateurs(evaluation.session.formationId);
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      scoreMoyen,
      tauxSatisfaction,
      message: partial
        ? "Réponses enregistrées (partiel)"
        : "Évaluation complétée avec succès",
    });
  } catch (error) {
    console.error("Erreur soumission évaluation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la soumission" },
      { status: 500 }
    );
  }
}

// Fonction pour mettre à jour les indicateurs de la formation
async function updateFormationIndicateurs(formationId: string) {
  try {
    // Récupérer toutes les évaluations complétées pour cette formation
    const evaluationsCompletees = await prisma.evaluationSatisfaction.findMany({
      where: {
        session: {
          formationId,
        },
        status: "COMPLETED",
        type: "CHAUD", // On utilise les évaluations à chaud pour le taux de satisfaction
      },
      include: {
        reponse: {
          select: {
            tauxSatisfaction: true,
            noteGlobale: true,
          },
        },
      },
    });

    if (evaluationsCompletees.length === 0) return;

    // Calculer le taux de satisfaction moyen
    const evaluationsAvecScore = evaluationsCompletees.filter(
      e => e.reponse?.tauxSatisfaction !== null
    );

    if (evaluationsAvecScore.length === 0) return;

    const tauxMoyen = evaluationsAvecScore.reduce(
      (acc, e) => acc + (e.reponse?.tauxSatisfaction || 0),
      0
    ) / evaluationsAvecScore.length;

    // Mettre à jour les indicateurs via upsert
    await prisma.formationIndicateurs.upsert({
      where: { formationId },
      update: {
        tauxSatisfaction: Math.round(tauxMoyen * 10) / 10,
        nombreAvis: evaluationsAvecScore.length,
        dernierCalcul: new Date(),
      },
      create: {
        formationId,
        tauxSatisfaction: Math.round(tauxMoyen * 10) / 10,
        nombreAvis: evaluationsAvecScore.length,
        dernierCalcul: new Date(),
      },
    });

    console.log(`Indicateurs mis à jour pour formation ${formationId}: taux=${tauxMoyen}%, avis=${evaluationsAvecScore.length}`);
  } catch (error) {
    console.error("Erreur mise à jour indicateurs formation:", error);
  }
}
