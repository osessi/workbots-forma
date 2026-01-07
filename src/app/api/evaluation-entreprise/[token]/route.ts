// ===========================================
// API ÉVALUATION ENTREPRISE - Accès public via token QR
// ===========================================
// GET /api/evaluation-entreprise/[token] - Récupérer une évaluation par token (accès public)
// POST /api/evaluation-entreprise/[token] - Soumettre les réponses (accès public)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { QUESTIONS_EVALUATION_ENTREPRISE } from "@/lib/evaluation/questions-entreprise";

// GET - Récupérer les infos de l'évaluation (accès public via QR)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const evaluation = await prisma.evaluationEntreprise.findUnique({
      where: { token },
      include: {
        entreprise: {
          select: {
            id: true,
            raisonSociale: true,
            contactNom: true,
            contactPrenom: true,
            contactEmail: true,
            contactFonction: true,
          },
        },
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
            clients: {
              include: {
                participants: true,
              },
            },
          },
        },
        organization: {
          select: {
            name: true,
            logo: true,
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
        await prisma.evaluationEntreprise.update({
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

    // Préparer la réponse
    const response = {
      id: evaluation.id,
      token: evaluation.token,
      status: evaluation.status,
      organisme: {
        nom: evaluation.organization.name,
        logo: evaluation.organization.logo,
      },
      formation: {
        titre: evaluation.session.formation.titre,
      },
      session: {
        dateDebut,
        dateFin,
        nombreParticipants,
      },
      entreprise: {
        raisonSociale: evaluation.entreprise.raisonSociale,
        contactNom: evaluation.entreprise.contactNom,
        contactPrenom: evaluation.entreprise.contactPrenom,
        contactFonction: evaluation.entreprise.contactFonction,
      },
      questions: QUESTIONS_EVALUATION_ENTREPRISE,
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
    console.error("Erreur récupération évaluation entreprise:", error);
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
    const { nomContact, prenomContact, fonctionContact, reponses, partial } = body;

    // Récupérer l'évaluation
    const evaluation = await prisma.evaluationEntreprise.findUnique({
      where: { token },
      include: {
        entreprise: true,
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

    // Récupérer IP et User-Agent
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;

    // Préparer les données de réponse
    const reponseData: Record<string, unknown> = {
      nomContact: nomContact || null,
      prenomContact: prenomContact || null,
      fonctionContact: fonctionContact || null,
    };

    // Mapper les réponses aux champs de la table
    // Section 1: Préparation
    const preparationFields = ["analyseBesoins", "programmeAttentes", "modalitesLogistiques"];
    // Section 2: Qualité
    const qualiteFields = ["objectifsAtteints", "qualitePedagogique", "qualiteSupports", "reponseBesoinsOperationnels"];
    // Section 3: Suivi
    const suiviFields = ["qualiteCommunication", "documentsDelais", "suiviPostFormation"];
    // Section 4: Satisfaction
    const satisfactionFields = ["satisfactionGlobale", "recommandation", "nouvelleCollaboration"];
    // Section 5: Impact
    const impactFields = ["ameliorationCompetences", "impactActivite"];

    const allNoteFields = [...preparationFields, ...qualiteFields, ...suiviFields, ...satisfactionFields, ...impactFields];
    const noteFieldsWithValues: string[] = [];

    allNoteFields.forEach(field => {
      if (reponses[field] !== undefined && reponses[field] !== null) {
        const value = parseInt(reponses[field], 10);
        if (!isNaN(value) && value >= 0 && value <= 10) {
          reponseData[field] = value;
          noteFieldsWithValues.push(field);
        }
      }
    });

    // Ajouter les champs texte
    if (reponses.pointsForts) {
      reponseData.pointsForts = reponses.pointsForts;
    }
    if (reponses.pointsAmeliorer) {
      reponseData.pointsAmeliorer = reponses.pointsAmeliorer;
    }
    if (reponses.suggestionsAutres) {
      reponseData.suggestionsAutres = reponses.suggestionsAutres;
    }

    // Calculer les scores par section
    const calculateSectionAverage = (fields: string[]) => {
      const values = fields
        .filter(f => reponseData[f] !== undefined && reponseData[f] !== null)
        .map(f => reponseData[f] as number);
      if (values.length === 0) return null;
      return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
    };

    const scorePreparation = calculateSectionAverage(preparationFields);
    const scoreQualite = calculateSectionAverage(qualiteFields);
    const scoreSuivi = calculateSectionAverage(suiviFields);
    const scoreSatisfaction = calculateSectionAverage(satisfactionFields);
    const scoreImpact = calculateSectionAverage(impactFields);

    // Score moyen global
    let scoreMoyen: number | null = null;
    if (noteFieldsWithValues.length > 0) {
      const totalNotes = noteFieldsWithValues.reduce((acc, field) => {
        return acc + ((reponseData[field] as number) || 0);
      }, 0);
      scoreMoyen = Math.round((totalNotes / noteFieldsWithValues.length) * 10) / 10;
    }

    // Taux de satisfaction (sur 100)
    const tauxSatisfaction = scoreMoyen !== null ? Math.round(scoreMoyen * 10) : null;

    // Mettre à jour ou créer la réponse
    const now = new Date();

    if (evaluation.reponse) {
      // Mettre à jour la réponse existante
      await prisma.evaluationEntrepriseReponse.update({
        where: { id: evaluation.reponse.id },
        data: {
          ...reponseData,
          scoreMoyen,
          scorePreparation,
          scoreQualite,
          scoreSuivi,
          scoreSatisfaction,
          scoreImpact,
          tauxSatisfaction,
          ipAddress,
          userAgent,
        },
      });
    } else {
      // Créer une nouvelle réponse
      await prisma.evaluationEntrepriseReponse.create({
        data: {
          evaluationId: evaluation.id,
          ...reponseData,
          scoreMoyen,
          scorePreparation,
          scoreQualite,
          scoreSuivi,
          scoreSatisfaction,
          scoreImpact,
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

    await prisma.evaluationEntreprise.update({
      where: { id: evaluation.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      status: newStatus,
      scores: {
        global: scoreMoyen,
        preparation: scorePreparation,
        qualite: scoreQualite,
        suivi: scoreSuivi,
        satisfaction: scoreSatisfaction,
        impact: scoreImpact,
        tauxSatisfaction,
      },
      message: partial
        ? "Réponses enregistrées (partiel)"
        : "Évaluation complétée avec succès. Merci pour votre retour !",
    });
  } catch (error) {
    console.error("Erreur soumission évaluation entreprise:", error);
    return NextResponse.json(
      { error: "Erreur lors de la soumission" },
      { status: 500 }
    );
  }
}
