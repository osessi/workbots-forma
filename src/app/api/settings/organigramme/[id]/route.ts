// ===========================================
// API ORGANIGRAMME - CRUD par ID (Qualiopi IND 9)
// ===========================================
// GET /api/settings/organigramme/[id] - Récupérer un poste
// PUT /api/settings/organigramme/[id] - Modifier un poste
// DELETE /api/settings/organigramme/[id] - Supprimer un poste

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { OrganigrammePosteType } from "@prisma/client";
import { authenticateUser } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET - Récupérer un poste spécifique
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const poste = await prisma.organigrammePoste.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        intervenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            fonction: true,
          },
        },
        parent: {
          select: {
            id: true,
            titre: true,
            nom: true,
            prenom: true,
          },
        },
        children: {
          orderBy: { ordre: "asc" },
        },
      },
    });

    if (!poste) {
      return NextResponse.json({ error: "Poste non trouvé" }, { status: 404 });
    }

    return NextResponse.json(poste);
  } catch (error) {
    console.error("Erreur récupération poste:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du poste" },
      { status: 500 }
    );
  }
}

// PUT - Modifier un poste
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que le poste existe
    const existing = await prisma.organigrammePoste.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Poste non trouvé" }, { status: 404 });
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
      niveau,
      ordre,
      parentId,
      isVisible,
    } = body;

    // Validation du type si fourni
    const validTypes: OrganigrammePosteType[] = [
      "DIRIGEANT",
      "REFERENT_HANDICAP",
      "REFERENT_PEDAGOGIQUE",
      "REFERENT_QUALITE",
      "FORMATEUR",
      "ADMINISTRATIF",
      "AUTRE",
    ];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Type de poste invalide" },
        { status: 400 }
      );
    }

    // Vérifier l'intervenant si spécifié
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

    // Vérifier le parent si spécifié (et empêcher la référence circulaire)
    if (parentId) {
      if (parentId === id) {
        return NextResponse.json(
          { error: "Un poste ne peut pas être son propre parent" },
          { status: 400 }
        );
      }

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

    const poste = await prisma.organigrammePoste.update({
      where: { id },
      data: {
        ...(type !== undefined && { type }),
        ...(titre !== undefined && { titre }),
        ...(nom !== undefined && { nom }),
        ...(prenom !== undefined && { prenom }),
        ...(email !== undefined && { email }),
        ...(telephone !== undefined && { telephone }),
        ...(photo !== undefined && { photo }),
        ...(description !== undefined && { description }),
        ...(intervenantId !== undefined && { intervenantId }),
        ...(niveau !== undefined && { niveau }),
        ...(ordre !== undefined && { ordre }),
        ...(parentId !== undefined && { parentId }),
        ...(isVisible !== undefined && { isVisible }),
      },
      include: {
        intervenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            fonction: true,
          },
        },
        parent: {
          select: {
            id: true,
            titre: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    return NextResponse.json(poste);
  } catch (error) {
    console.error("Erreur modification poste:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification du poste" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un poste
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que le poste existe
    const existing = await prisma.organigrammePoste.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        children: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Poste non trouvé" }, { status: 404 });
    }

    // Si le poste a des enfants, les rattacher au parent du poste supprimé
    if (existing.children.length > 0) {
      await prisma.organigrammePoste.updateMany({
        where: {
          parentId: id,
        },
        data: {
          parentId: existing.parentId, // Rattacher au grand-parent ou null
          niveau: existing.niveau, // Remonter d'un niveau
        },
      });
    }

    // Supprimer le poste
    await prisma.organigrammePoste.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression poste:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du poste" },
      { status: 500 }
    );
  }
}
