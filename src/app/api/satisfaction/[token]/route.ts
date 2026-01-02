// ===========================================
// API: ACCÈS PUBLIC À UNE ENQUÊTE DE SATISFACTION
// GET /api/satisfaction/[token] - Récupérer l'enquête
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: "Token requis" },
        { status: 400 }
      );
    }

    // Récupérer l'enquête par token
    const enquete = await prisma.evaluationSatisfaction.findUnique({
      where: { token },
      include: {
        session: {
          select: {
            id: true,
            formation: {
              select: {
                titre: true,
                description: true,
              },
            },
          },
        },
        apprenant: {
          select: {
            prenom: true,
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

    if (!enquete) {
      return NextResponse.json(
        { error: "Enquête non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier l'expiration
    if (enquete.expiresAt && new Date() > enquete.expiresAt) {
      return NextResponse.json(
        { error: "Cette enquête a expiré" },
        { status: 410 }
      );
    }

    // Vérifier si déjà complétée
    if (enquete.status === "COMPLETED") {
      return NextResponse.json(
        {
          error: "Vous avez déjà répondu à cette enquête",
          completed: true,
        },
        { status: 409 }
      );
    }

    // Marquer comme IN_PROGRESS si PENDING
    if (enquete.status === "PENDING") {
      await prisma.evaluationSatisfaction.update({
        where: { token },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      id: enquete.id,
      type: enquete.type,
      prenom: enquete.apprenant.prenom,
      formation: {
        titre: enquete.session.formation.titre,
        description: enquete.session.formation.description,
      },
      session: {
        id: enquete.session.id,
      },
      organization: {
        name: enquete.organization.name,
        logo: enquete.organization.logo,
      },
      // Si une réponse partielle existe, la retourner
      reponsePartielle: enquete.reponse || null,
    });
  } catch (error) {
    console.error("[API] GET /api/satisfaction/[token] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
