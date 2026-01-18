// ===========================================
// API: GESTION D'UN POSTE DE L'ORGANIGRAMME
// GET /api/organisation/organigramme/postes/[id] - Détails
// PATCH /api/organisation/organigramme/postes/[id] - Modifier
// DELETE /api/organisation/organigramme/postes/[id] - Supprimer
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { OrganigrammePosteType } from "@prisma/client";

// ===========================================
// GET - Détails d'un poste
// ===========================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
            photoUrl: true,
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
      return NextResponse.json(
        { error: "Poste non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(poste);
  } catch (error) {
    console.error("[API] GET /api/organisation/organigramme/postes/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// PATCH - Modifier un poste
// ===========================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Vérifier que le poste existe et appartient à l'organisation
    const existingPoste = await prisma.organigrammePoste.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existingPoste) {
      return NextResponse.json(
        { error: "Poste non trouvé" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Vérifier le nouveau parent s'il est fourni
    if (body.parentId !== undefined && body.parentId !== null) {
      // Empêcher de se définir soi-même comme parent
      if (body.parentId === id) {
        return NextResponse.json(
          { error: "Un poste ne peut pas être son propre parent" },
          { status: 400 }
        );
      }

      const parent = await prisma.organigrammePoste.findFirst({
        where: {
          id: body.parentId,
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
    if (body.intervenantId !== undefined && body.intervenantId !== null) {
      const intervenant = await prisma.intervenant.findFirst({
        where: {
          id: body.intervenantId,
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

    const poste = await prisma.organigrammePoste.update({
      where: { id },
      data: {
        ...(body.type !== undefined && { type: body.type as OrganigrammePosteType }),
        ...(body.titre !== undefined && { titre: body.titre }),
        ...(body.nom !== undefined && { nom: body.nom }),
        ...(body.prenom !== undefined && { prenom: body.prenom }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.telephone !== undefined && { telephone: body.telephone }),
        ...(body.photo !== undefined && { photo: body.photo }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.intervenantId !== undefined && { intervenantId: body.intervenantId }),
        ...(body.parentId !== undefined && { parentId: body.parentId }),
        ...(body.niveau !== undefined && { niveau: body.niveau }),
        ...(body.ordre !== undefined && { ordre: body.ordre }),
        ...(body.isVisible !== undefined && { isVisible: body.isVisible }),
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

    return NextResponse.json(poste);
  } catch (error) {
    console.error("[API] PATCH /api/organisation/organigramme/postes/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// DELETE - Supprimer un poste
// ===========================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Vérifier que le poste existe
    const poste = await prisma.organigrammePoste.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        children: true,
      },
    });

    if (!poste) {
      return NextResponse.json(
        { error: "Poste non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des enfants
    if (poste.children.length > 0) {
      return NextResponse.json(
        {
          error: "Ce poste a des sous-postes. Supprimez-les d'abord ou rattachez-les à un autre poste.",
          childrenCount: poste.children.length,
        },
        { status: 400 }
      );
    }

    await prisma.organigrammePoste.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/organisation/organigramme/postes/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
