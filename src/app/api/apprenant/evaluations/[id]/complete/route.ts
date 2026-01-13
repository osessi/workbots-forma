// ===========================================
// API MARQUER EVALUATION TERMINÉE - POST /api/apprenant/evaluations/[id]/complete
// ===========================================
// Correction 450: Permet de marquer un atelier comme terminé

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: evaluationId } = await params;
    const body = await request.json();
    const { token, sessionId } = body;

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

    // Vérifier que l'évaluation existe
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
    });

    if (!evaluation) {
      return NextResponse.json(
        { error: "Évaluation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier si un résultat existe déjà
    const existingResultat = await prisma.evaluationResultat.findFirst({
      where: {
        evaluationId,
        apprenantId,
        sessionId: sessionId || undefined,
      },
    });

    if (existingResultat) {
      // Mettre à jour le résultat existant
      const updatedResultat = await prisma.evaluationResultat.update({
        where: { id: existingResultat.id },
        data: {
          status: "termine",
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        resultat: {
          id: updatedResultat.id,
          status: updatedResultat.status,
          datePassage: updatedResultat.completedAt?.toISOString() || null,
        },
      });
    } else {
      // Créer un nouveau résultat
      const newResultat = await prisma.evaluationResultat.create({
        data: {
          evaluationId,
          apprenantId,
          sessionId: sessionId || null,
          status: "termine",
          completedAt: new Date(),
          score: null, // Les ateliers n'ont pas de score
          reponses: {},
        },
      });

      return NextResponse.json({
        success: true,
        resultat: {
          id: newResultat.id,
          status: newResultat.status,
          datePassage: newResultat.completedAt?.toISOString() || null,
        },
      });
    }
  } catch (error) {
    console.error("Erreur API complete evaluation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'évaluation" },
      { status: 500 }
    );
  }
}
