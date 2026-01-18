// ===========================================
// API: ACTIONS CORRECTIVES D'UN INDICATEUR QUALIOPI
// POST /api/qualiopi/indicateurs/[numero]/actions - Créer une action
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const { numero } = await params;
    const numeroInt = parseInt(numero);

    if (isNaN(numeroInt) || numeroInt < 1 || numeroInt > 32) {
      return NextResponse.json(
        { error: "Numéro d'indicateur invalide (1-32)" },
        { status: 400 }
      );
    }

    // Authentification
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const organizationId = user.organizationId;
    const body = await request.json();

    const { titre, description, priorite, dateEcheance } = body;

    if (!titre) {
      return NextResponse.json(
        { error: "Titre requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'indicateur existe
    let indicateur = await prisma.indicateurConformite.findUnique({
      where: {
        organizationId_numeroIndicateur: {
          organizationId,
          numeroIndicateur: numeroInt,
        },
      },
    });

    // Si l'indicateur n'existe pas, le créer
    if (!indicateur) {
      // Calculer le critère (les indicateurs sont regroupés par critère 1-7)
      const critere = Math.min(7, Math.ceil(numeroInt / 5));
      indicateur = await prisma.indicateurConformite.create({
        data: {
          organizationId,
          numeroIndicateur: numeroInt,
          critere,
          libelle: `Indicateur ${numeroInt}`,
          status: "EN_COURS",
          score: 0,
        },
      });
    }

    // Créer l'action corrective
    const action = await prisma.actionCorrective.create({
      data: {
        indicateurId: indicateur.id,
        titre,
        description: description || null,
        priorite: priorite || "MOYENNE",
        status: "A_FAIRE",
        dateEcheance: dateEcheance ? new Date(dateEcheance) : null,
        responsableId: user.id,
      },
      include: {
        responsable: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/qualiopi/indicateurs/[numero]/actions error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET - Récupérer les actions d'un indicateur
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const { numero } = await params;
    const numeroInt = parseInt(numero);

    if (isNaN(numeroInt) || numeroInt < 1 || numeroInt > 32) {
      return NextResponse.json(
        { error: "Numéro d'indicateur invalide (1-32)" },
        { status: 400 }
      );
    }

    // Authentification
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const organizationId = user.organizationId;

    // Récupérer les actions
    const indicateur = await prisma.indicateurConformite.findUnique({
      where: {
        organizationId_numeroIndicateur: {
          organizationId,
          numeroIndicateur: numeroInt,
        },
      },
      include: {
        actions: {
          orderBy: { createdAt: "desc" },
          include: {
            responsable: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(indicateur?.actions || []);
  } catch (error) {
    console.error("[API] GET /api/qualiopi/indicateurs/[numero]/actions error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Mettre à jour une action
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const { numero } = await params;
    const numeroInt = parseInt(numero);

    // Authentification
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { actionId, status, titre, description, priorite, dateEcheance } = body;

    if (!actionId) {
      return NextResponse.json(
        { error: "ID de l'action requis" },
        { status: 400 }
      );
    }

    // Mettre à jour l'action
    const action = await prisma.actionCorrective.update({
      where: { id: actionId },
      data: {
        ...(status && { status }),
        ...(titre && { titre }),
        ...(description !== undefined && { description }),
        ...(priorite && { priorite }),
        ...(dateEcheance !== undefined && {
          dateEcheance: dateEcheance ? new Date(dateEcheance) : null
        }),
      },
      include: {
        responsable: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(action);
  } catch (error) {
    console.error("[API] PATCH /api/qualiopi/indicateurs/[numero]/actions error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
