// ===========================================
// API APPRENANT - CRUD par ID
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

// GET - Récupérer un apprenant
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
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        entreprise: true,
      },
    });

    if (!apprenant) {
      return NextResponse.json({ error: "Apprenant non trouvé" }, { status: 404 });
    }

    return NextResponse.json(apprenant);
  } catch (error) {
    console.error("Erreur récupération apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'apprenant" },
      { status: 500 }
    );
  }
}

// PUT - Modifier un apprenant
export async function PUT(
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
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const existing = await prisma.apprenant.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Apprenant non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const {
      nom,
      prenom,
      email,
      telephone,
      raisonSociale,
      siret,
      adresse,
      codePostal,
      ville,
      pays,
      statut,
      situationActuelle,
      entrepriseId,
      notes,
    } = body;

    // Vérifier l'entreprise si spécifiée
    if (entrepriseId) {
      const entreprise = await prisma.entreprise.findFirst({
        where: {
          id: entrepriseId,
          organizationId: user.organizationId,
        },
      });
      if (!entreprise) {
        return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
      }
    }

    const apprenant = await prisma.apprenant.update({
      where: { id },
      data: {
        nom,
        prenom,
        email,
        telephone,
        raisonSociale: statut === "INDEPENDANT" ? raisonSociale : null,
        siret: statut === "INDEPENDANT" ? siret : null,
        adresse,
        codePostal,
        ville,
        pays: pays || "France",
        statut,
        situationActuelle: statut === "PARTICULIER" ? situationActuelle : null,
        entrepriseId: statut === "SALARIE" ? entrepriseId : null,
        notes,
      },
      include: {
        entreprise: true,
      },
    });

    return NextResponse.json(apprenant);
  } catch (error) {
    console.error("Erreur modification apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification de l'apprenant" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un apprenant (soft delete)
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
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const existing = await prisma.apprenant.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Apprenant non trouvé" }, { status: 404 });
    }

    await prisma.apprenant.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'apprenant" },
      { status: 500 }
    );
  }
}
