// ===========================================
// API ÉVALUATION ENTREPRISE - Gestion des évaluations entreprise
// ===========================================
// POST /api/evaluation-entreprise - Créer une évaluation entreprise
// GET /api/evaluation-entreprise - Lister les évaluations (filtrables)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth/getCurrentUser";

// POST - Créer une évaluation entreprise
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const { sessionId, entrepriseId, expiresIn } = body;

    // Validation
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId est requis" }, { status: 400 });
    }

    if (!entrepriseId) {
      return NextResponse.json({ error: "entrepriseId est requis" }, { status: 400 });
    }

    // Vérifier que la session existe et appartient à l'organisation
    // Chercher d'abord dans Session (nouveau modèle), puis dans DocumentSession (ancien modèle)
    let sessionData: { organizationId: string } | null = null;
    let actualSessionId = sessionId;

    // D'abord essayer le nouveau modèle Session
    const newSession = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { organizationId: true },
    });

    if (newSession && newSession.organizationId === user.organizationId) {
      // C'est une Session, on doit trouver ou créer un DocumentSession associé
      let documentSession = await prisma.documentSession.findFirst({
        where: {
          trainingSessionId: sessionId,
          organizationId: user.organizationId,
        },
        select: { id: true },
      });

      if (!documentSession) {
        // Créer un DocumentSession lié à cette Session
        const session = await prisma.session.findUnique({
          where: { id: sessionId },
          include: { formation: true },
        });

        if (session) {
          documentSession = await prisma.documentSession.create({
            data: {
              organizationId: user.organizationId,
              formationId: session.formationId,
              trainingSessionId: sessionId,
              formateurId: session.formateurId,
              status: "BROUILLON",
            },
            select: { id: true },
          });
        }
      }

      if (documentSession) {
        actualSessionId = documentSession.id;
        sessionData = { organizationId: newSession.organizationId };
      }
    }

    // Si pas trouvé dans Session, essayer DocumentSession (rétrocompatibilité)
    if (!sessionData) {
      const oldSession = await prisma.documentSession.findUnique({
        where: { id: sessionId },
        select: { organizationId: true },
      });

      if (oldSession && oldSession.organizationId === user.organizationId) {
        sessionData = { organizationId: oldSession.organizationId };
      }
    }

    if (!sessionData) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
    }

    // Vérifier que l'entreprise existe et appartient à l'organisation
    const entreprise = await prisma.entreprise.findUnique({
      where: { id: entrepriseId },
      select: { organizationId: true },
    });

    if (!entreprise || entreprise.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
    }

    // Vérifier s'il existe déjà une évaluation pour cette combinaison
    const existingEvaluation = await prisma.evaluationEntreprise.findUnique({
      where: {
        sessionId_entrepriseId: {
          sessionId: actualSessionId,
          entrepriseId,
        },
      },
    });

    if (existingEvaluation) {
      // Retourner l'évaluation existante avec toutes les infos
      const evaluation = await prisma.evaluationEntreprise.findUnique({
        where: { id: existingEvaluation.id },
        include: {
          entreprise: {
            select: { id: true, raisonSociale: true, contactEmail: true, contactNom: true, contactPrenom: true },
          },
          session: {
            include: {
              formation: { select: { titre: true } },
            },
          },
          reponse: true,
        },
      });
      return NextResponse.json(evaluation);
    }

    // Calculer l'expiration (par défaut 90 jours pour les entreprises)
    let expiresAt: Date | null = null;
    const days = expiresIn || 90;
    expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Créer l'évaluation
    const evaluation = await prisma.evaluationEntreprise.create({
      data: {
        organizationId: user.organizationId,
        sessionId: actualSessionId,
        entrepriseId,
        expiresAt,
        sentAt: new Date(),
      },
      include: {
        entreprise: {
          select: { id: true, raisonSociale: true, contactEmail: true, contactNom: true, contactPrenom: true },
        },
        session: {
          include: {
            formation: { select: { titre: true } },
          },
        },
        reponse: true,
      },
    });

    return NextResponse.json(evaluation, { status: 201 });
  } catch (error) {
    console.error("Erreur création évaluation entreprise:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de la création de l'évaluation: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// GET - Lister les évaluations entreprise
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const status = searchParams.get("status");
    const entrepriseId = searchParams.get("entrepriseId");

    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Construire le filtre
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      organizationId: user.organizationId,
    };

    if (sessionId) {
      whereClause.sessionId = sessionId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (entrepriseId) {
      whereClause.entrepriseId = entrepriseId;
    }

    // Récupérer les évaluations
    const evaluations = await prisma.evaluationEntreprise.findMany({
      where: whereClause,
      distinct: ["id"],
      include: {
        entreprise: {
          select: { id: true, raisonSociale: true, contactEmail: true, contactNom: true, contactPrenom: true },
        },
        session: {
          include: {
            formation: { select: { id: true, titre: true } },
            journees: {
              orderBy: { date: "asc" },
              take: 1,
            },
          },
        },
        reponse: {
          select: {
            id: true,
            scoreMoyen: true,
            tauxSatisfaction: true,
            recommandation: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    // Calculer des statistiques
    const stats = {
      total: evaluations.length,
      pending: evaluations.filter(e => e.status === "PENDING").length,
      inProgress: evaluations.filter(e => e.status === "IN_PROGRESS").length,
      completed: evaluations.filter(e => e.status === "COMPLETED").length,
      expired: evaluations.filter(e => e.status === "EXPIRED").length,
      tauxMoyenSatisfaction: 0,
    };

    // Calculer le taux moyen de satisfaction des évaluations complétées
    const completedWithScore = evaluations.filter(
      e => e.status === "COMPLETED" && e.reponse?.tauxSatisfaction
    );
    if (completedWithScore.length > 0) {
      const totalSatisfaction = completedWithScore.reduce(
        (acc, e) => acc + (e.reponse?.tauxSatisfaction || 0),
        0
      );
      stats.tauxMoyenSatisfaction = Math.round(totalSatisfaction / completedWithScore.length);
    }

    return NextResponse.json({ evaluations, stats });
  } catch (error) {
    console.error("Erreur récupération évaluations entreprise:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des évaluations" },
      { status: 500 }
    );
  }
}
