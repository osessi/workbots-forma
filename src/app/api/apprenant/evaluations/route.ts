// ===========================================
// API EVALUATIONS APPRENANT - GET /api/apprenant/evaluations
// ===========================================
// Corrections 447-450: QCM & Ateliers avec stats et module associé
// Récupère les évaluations de type QCM_MODULE et ATELIER_MODULE

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

    // Récupérer la formationId depuis la session
    let formationId: string | null = null;

    if (sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { formationId: true },
      });
      if (session) {
        formationId = session.formationId;
      }
    }

    // Fallback: récupérer depuis l'inscription LMS si pas de session
    if (!formationId) {
      const inscription = await prisma.lMSInscription.findFirst({
        where: { apprenantId },
      });
      if (inscription) {
        formationId = inscription.formationId;
      }
    }

    if (!formationId) {
      return NextResponse.json({
        evaluations: [],
        stats: { total: 0, aFaire: 0, enCours: 0, terminees: 0 },
      });
    }

    // Correction 447-450: Récupérer uniquement les QCM_MODULE et ATELIER_MODULE
    // avec les informations du module associé
    const evaluations = await prisma.evaluation.findMany({
      where: {
        formationId: formationId,
        isActive: true,
        type: {
          in: ["QCM_MODULE", "ATELIER_MODULE"],
        },
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

    // Récupérer les modules de la formation pour avoir leurs titres
    const modules = await prisma.module.findMany({
      where: { formationId },
      select: { id: true, titre: true, ordre: true },
      orderBy: { ordre: "asc" },
    });

    const modulesMap = new Map(modules.map((m) => [m.id, m]));

    // Correction 449: Formater les données avec module concerné
    const formattedEvaluations = evaluations.map((evaluation) => {
      const module = evaluation.moduleId ? modulesMap.get(evaluation.moduleId) : null;
      const resultat = evaluation.resultats[0];

      // Déterminer le statut : a_faire / en_cours / termine
      let statut: "a_faire" | "en_cours" | "termine" = "a_faire";
      if (resultat) {
        if (resultat.status === "termine" || resultat.status === "valide") {
          statut = "termine";
        } else if (resultat.status === "en_cours") {
          statut = "en_cours";
        }
      }

      return {
        id: evaluation.id,
        titre: evaluation.titre,
        type: evaluation.type, // QCM_MODULE ou ATELIER_MODULE
        description: evaluation.description,
        dureeEstimee: evaluation.dureeEstimee,
        scoreMinimum: evaluation.scoreMinimum,
        ordre: evaluation.ordre,
        // Correction 449: Module concerné
        module: module
          ? {
              id: module.id,
              titre: module.titre,
              ordre: module.ordre,
            }
          : null,
        // Statut simplifié
        statut,
        resultat: resultat
          ? {
              id: resultat.id,
              status: resultat.status,
              score: resultat.score,
              datePassage: resultat.completedAt?.toISOString() || null,
              tempsTotal: resultat.tempsPassé,
            }
          : null,
      };
    });

    // Correction 447: Stats adaptées (Total, À faire, En cours, Terminées)
    const total = formattedEvaluations.length;
    const aFaire = formattedEvaluations.filter((e) => e.statut === "a_faire").length;
    const enCours = formattedEvaluations.filter((e) => e.statut === "en_cours").length;
    const terminees = formattedEvaluations.filter((e) => e.statut === "termine").length;

    return NextResponse.json({
      evaluations: formattedEvaluations,
      stats: {
        total,
        aFaire,
        enCours,
        terminees,
      },
    });
  } catch (error) {
    console.error("Erreur API évaluations apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des évaluations" },
      { status: 500 }
    );
  }
}
