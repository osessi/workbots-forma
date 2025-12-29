// ===========================================
// API ÉVALUATION INTERVENANT - GET /api/intervenant/evaluation-intervenant
// ===========================================
// Récupère les évaluations de satisfaction dédiées à l'intervenant (Qualiopi IND 2)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

function decodeIntervenantToken(token: string): { intervenantId: string; organizationId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));
    if (!decoded.intervenantId || !decoded.organizationId) return null;
    if (decoded.exp && decoded.exp < Date.now()) return null;
    return { intervenantId: decoded.intervenantId, organizationId: decoded.organizationId };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    // Note: sessionId n'est plus utilisé car on récupère toutes les évaluations de l'intervenant

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    }

    const decoded = decodeIntervenantToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }

    const { intervenantId } = decoded;

    // Récupérer TOUTES les évaluations de l'intervenant (sans filtre sessionId)
    // car les sessions du nouveau système (Session) et ancien système (DocumentSession) ont des IDs différents
    const evaluations = await prisma.evaluationIntervenant.findMany({
      where: {
        intervenantId,
      },
      distinct: ["id"], // Éviter les doublons
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
            id: true,
            scoreMoyen: true,
            satisfactionGlobale: true,
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
        scoreMoyen: evaluation.reponse?.scoreMoyen || null,
        satisfactionGlobale: evaluation.reponse?.satisfactionGlobale || null,
      };
    });

    // Stats
    const stats = {
      total: evaluations.length,
      pending: formattedEvaluations.filter(e => e.status === "PENDING").length,
      inProgress: formattedEvaluations.filter(e => e.status === "IN_PROGRESS").length,
      completed: formattedEvaluations.filter(e => e.status === "COMPLETED").length,
      expired: formattedEvaluations.filter(e => e.status === "EXPIRED").length,
    };

    return NextResponse.json({
      evaluations: formattedEvaluations,
      stats,
    });
  } catch (error) {
    console.error("Erreur API évaluation intervenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des évaluations" },
      { status: 500 }
    );
  }
}
