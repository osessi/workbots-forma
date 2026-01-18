// ===========================================
// API: ORGANIGRAMME DE L'ORGANISATION
// GET /api/organisation/organigramme - Liste des postes
// POST /api/organisation/organigramme - Créer un poste
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { OrganigrammePosteType } from "@prisma/client";

// ===========================================
// GET - Liste des postes de l'organigramme
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
    const visibleOnly = searchParams.get("visible") === "true";

    const whereClause: Record<string, unknown> = {
      organizationId: user.organizationId,
    };

    if (visibleOnly) {
      whereClause.isVisible = true;
    }

    const postes = await prisma.organigrammePoste.findMany({
      where: whereClause,
      include: {
        intervenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            photoUrl: true,
          },
        },
        children: {
          where: visibleOnly ? { isVisible: true } : {},
          orderBy: { ordre: "asc" },
        },
      },
      orderBy: [{ niveau: "asc" }, { ordre: "asc" }],
    });

    // Construire l'arbre hiérarchique
    const buildTree = (parentId: string | null): typeof postes => {
      return postes
        .filter((p) => p.parentId === parentId)
        .map((p) => ({
          ...p,
          children: buildTree(p.id),
        }));
    };

    const tree = buildTree(null);

    // Vérifier les postes obligatoires Qualiopi
    const postesObligatoires = [
      { type: "REFERENT_HANDICAP" as const, label: "Référent handicap" },
      { type: "REFERENT_PEDAGOGIQUE" as const, label: "Responsable pédagogique" },
    ];

    const postesManquants = postesObligatoires.filter(
      (po) => !postes.some((p) => p.type === po.type)
    );

    return NextResponse.json({
      postes,
      tree,
      postesManquants,
      stats: {
        total: postes.length,
        parType: Object.values(OrganigrammePosteType).map((type) => ({
          type,
          count: postes.filter((p) => p.type === type).length,
        })),
      },
    });
  } catch (error) {
    console.error("[API] GET /api/organisation/organigramme error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// POST - Créer un poste
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
    const {
      type,
      titre,
      nom,
      prenom,
      email,
      telephone,
      photo,
      description,
      intervenantId,
      parentId,
      niveau,
      ordre,
      isVisible,
    } = body;

    // Validation
    if (!titre || !nom || !prenom) {
      return NextResponse.json(
        { error: "Titre, nom et prénom sont requis" },
        { status: 400 }
      );
    }

    // Vérifier le parent s'il est fourni
    if (parentId) {
      const parent = await prisma.organigrammePoste.findFirst({
        where: {
          id: parentId,
          organizationId: user.organizationId,
        },
      });

      if (!parent) {
        return NextResponse.json(
          { error: "Poste parent non trouvé" },
          { status: 404 }
        );
      }
    }

    // Vérifier l'intervenant s'il est fourni
    if (intervenantId) {
      const intervenant = await prisma.intervenant.findFirst({
        where: {
          id: intervenantId,
          organizationId: user.organizationId,
        },
      });

      if (!intervenant) {
        return NextResponse.json(
          { error: "Intervenant non trouvé" },
          { status: 404 }
        );
      }
    }

    // Calculer le niveau automatiquement si non fourni
    let niveauFinal = niveau ?? 0;
    if (parentId && niveau === undefined) {
      const parent = await prisma.organigrammePoste.findUnique({
        where: { id: parentId },
        select: { niveau: true },
      });
      niveauFinal = (parent?.niveau ?? 0) + 1;
    }

    // Calculer l'ordre automatiquement si non fourni
    let ordreFinal = ordre ?? 0;
    if (ordre === undefined) {
      const maxOrdre = await prisma.organigrammePoste.aggregate({
        where: {
          organizationId: user.organizationId,
          niveau: niveauFinal,
          parentId: parentId || null,
        },
        _max: { ordre: true },
      });
      ordreFinal = (maxOrdre._max.ordre ?? -1) + 1;
    }

    const poste = await prisma.organigrammePoste.create({
      data: {
        organizationId: user.organizationId,
        type: type as OrganigrammePosteType || "AUTRE",
        titre,
        nom,
        prenom,
        email,
        telephone,
        photo,
        description,
        intervenantId,
        parentId,
        niveau: niveauFinal,
        ordre: ordreFinal,
        isVisible: isVisible ?? true,
      },
      include: {
        intervenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    return NextResponse.json(poste, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/organisation/organigramme error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
