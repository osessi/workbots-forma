// ===========================================
// API ÉVALUATIONS SATISFACTION APPRENANT - GET /api/apprenant/evaluation-satisfaction
// ===========================================
// Récupère les évaluations de satisfaction (à chaud/à froid) pour l'apprenant

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
              take: 1,
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

    // Formater les données
    const formattedEvaluations = evaluations.map((evaluation) => {
      // Vérifier si expirée
      const isExpired = evaluation.expiresAt && new Date() > evaluation.expiresAt;
      const effectiveStatus = isExpired && evaluation.status !== "COMPLETED" ? "EXPIRED" : evaluation.status;

      return {
        id: evaluation.id,
        token: evaluation.token,
        type: evaluation.type, // CHAUD ou FROID
        status: effectiveStatus,
        formation: {
          id: evaluation.session.formation.id,
          titre: evaluation.session.formation.titre,
        },
        session: {
          id: evaluation.sessionId,
          dateDebut: evaluation.session.journees[0]?.date || null,
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
