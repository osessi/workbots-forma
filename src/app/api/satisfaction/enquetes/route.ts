// ===========================================
// API: ENQUÊTES DE SATISFACTION
// GET /api/satisfaction/enquetes - Liste des enquêtes
// POST /api/satisfaction/enquetes - Créer une enquête
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { EvaluationSatisfactionType } from "@prisma/client";
import { authenticateUser } from "@/lib/auth/getCurrentUser";

// ===========================================
// GET - Liste des enquêtes
// ===========================================

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const type = searchParams.get("type") as EvaluationSatisfactionType | null;
    const status = searchParams.get("status");

    // Construire le filtre
    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
    };

    if (sessionId) where.sessionId = sessionId;
    if (type) where.type = type;
    if (status) where.status = status;

    const enquetes = await prisma.evaluationSatisfaction.findMany({
      where,
      include: {
        session: {
          select: {
            id: true,
            formation: {
              select: {
                id: true,
                titre: true,
              },
            },
          },
        },
        apprenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        reponse: {
          select: {
            id: true,
            noteGlobale: true,
            scoreMoyen: true,
            tauxSatisfaction: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Statistiques globales
    const stats = await prisma.evaluationSatisfaction.groupBy({
      by: ["status", "type"],
      where: { organizationId: user.organizationId },
      _count: { id: true },
    });

    // Taux de satisfaction moyen
    const reponses = await prisma.evaluationSatisfactionReponse.findMany({
      where: {
        evaluation: {
          organizationId: user.organizationId,
        },
        tauxSatisfaction: { not: null },
      },
      select: { tauxSatisfaction: true },
    });

    const tauxMoyen = reponses.length > 0
      ? reponses.reduce((sum, r) => sum + (r.tauxSatisfaction || 0), 0) / reponses.length
      : 0;

    return NextResponse.json({
      enquetes,
      stats: {
        parStatut: stats.filter(s => s.type === "CHAUD").reduce((acc, s) => {
          acc[s.status] = s._count.id;
          return acc;
        }, {} as Record<string, number>),
        parType: {
          CHAUD: stats.filter(s => s.type === "CHAUD").reduce((sum, s) => sum + s._count.id, 0),
          FROID: stats.filter(s => s.type === "FROID").reduce((sum, s) => sum + s._count.id, 0),
        },
        tauxSatisfactionMoyen: Math.round(tauxMoyen * 10) / 10,
        totalReponses: reponses.length,
      },
    });
  } catch (error) {
    console.error("[API] GET /api/satisfaction/enquetes error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// POST - Créer une enquête
// ===========================================

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { sessionId, apprenantId, type } = body;

    if (!sessionId || !apprenantId || !type) {
      return NextResponse.json(
        { error: "sessionId, apprenantId et type sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que la session appartient à l'organisation
    const session = await prisma.documentSession.findFirst({
      where: {
        id: sessionId,
        organizationId: user.organizationId,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'apprenant existe
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id: apprenantId,
        organizationId: user.organizationId,
      },
    });

    if (!apprenant) {
      return NextResponse.json(
        { error: "Apprenant non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier qu'une enquête n'existe pas déjà
    const existing = await prisma.evaluationSatisfaction.findUnique({
      where: {
        sessionId_apprenantId_type: {
          sessionId,
          apprenantId,
          type,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Une enquête de ce type existe déjà pour cet apprenant sur cette session" },
        { status: 409 }
      );
    }

    // Créer l'enquête avec expiration à 30 jours
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const enquete = await prisma.evaluationSatisfaction.create({
      data: {
        organizationId: user.organizationId,
        sessionId,
        apprenantId,
        type,
        expiresAt,
      },
      include: {
        session: {
          select: {
            id: true,
          },
        },
        apprenant: {
          select: {
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(enquete, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/satisfaction/enquetes error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
