// ===========================================
// API ÉVALUATION FINANCEUR - Gestion des évaluations financeur
// ===========================================
// POST /api/evaluation-financeur - Créer une évaluation financeur
// GET /api/evaluation-financeur - Lister les évaluations (filtrables)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth/getCurrentUser";

// POST - Créer une évaluation financeur
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
    const { sessionId, financeurId, expiresIn } = body;

    // Validation
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId est requis" }, { status: 400 });
    }

    if (!financeurId) {
      return NextResponse.json({ error: "financeurId est requis" }, { status: 400 });
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

    // Vérifier que le financeur existe et appartient à l'organisation
    const financeur = await prisma.financeur.findUnique({
      where: { id: financeurId },
      select: { organizationId: true },
    });

    if (!financeur || financeur.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Financeur non trouvé" }, { status: 404 });
    }

    // Vérifier s'il existe déjà une évaluation pour cette combinaison
    const existingEvaluation = await prisma.evaluationFinanceur.findUnique({
      where: {
        sessionId_financeurId: {
          sessionId: actualSessionId,
          financeurId,
        },
      },
    });

    if (existingEvaluation) {
      // Retourner l'évaluation existante avec toutes les infos
      const evaluation = await prisma.evaluationFinanceur.findUnique({
        where: { id: existingEvaluation.id },
        include: {
          financeur: {
            select: { id: true, nom: true, email: true, type: true },
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

    // Calculer l'expiration (par défaut 60 jours pour les financeurs)
    let expiresAt: Date | null = null;
    const days = expiresIn || 60;
    expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Créer l'évaluation
    const evaluation = await prisma.evaluationFinanceur.create({
      data: {
        organizationId: user.organizationId,
        sessionId: actualSessionId,
        financeurId,
        expiresAt,
        sentAt: new Date(),
      },
      include: {
        financeur: {
          select: { id: true, nom: true, email: true, type: true },
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
    console.error("Erreur création évaluation financeur:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de la création de l'évaluation: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// GET - Lister les évaluations financeur
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const status = searchParams.get("status");
    const financeurId = searchParams.get("financeurId");

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

    if (financeurId) {
      whereClause.financeurId = financeurId;
    }

    // Récupérer les évaluations
    const evaluations = await prisma.evaluationFinanceur.findMany({
      where: whereClause,
      distinct: ["id"],
      include: {
        financeur: {
          select: { id: true, nom: true, email: true, type: true },
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
    };

    return NextResponse.json({ evaluations, stats });
  } catch (error) {
    console.error("Erreur récupération évaluations financeur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des évaluations" },
      { status: 500 }
    );
  }
}
