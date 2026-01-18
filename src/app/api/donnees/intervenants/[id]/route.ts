// ===========================================
// API INTERVENANT - CRUD par ID
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

// GET - Récupérer un intervenant
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

    const intervenant = await prisma.intervenant.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        diplomes: true, // Inclure les diplômes pour Qualiopi IND 17
      },
    });

    if (!intervenant) {
      return NextResponse.json({ error: "Intervenant non trouvé" }, { status: 404 });
    }

    return NextResponse.json(intervenant);
  } catch (error) {
    console.error("Erreur récupération intervenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'intervenant" },
      { status: 500 }
    );
  }
}

// PUT - Modifier un intervenant
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

    const existing = await prisma.intervenant.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Intervenant non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const {
      nom,
      prenom,
      email,
      telephone,
      fonction,
      specialites,
      structure,
      structureSiret,
      notes,
      // Nouveaux champs Qualiopi IND 17
      photoUrl,
      cv,
      biographie,
      anneesExperience,
      numeroDeclarationActivite,
    } = body;

    const intervenant = await prisma.intervenant.update({
      where: { id },
      data: {
        nom,
        prenom,
        email,
        telephone,
        fonction,
        specialites: specialites || [],
        structure,
        structureSiret,
        notes,
        // Qualiopi IND 17
        photoUrl,
        cv,
        biographie,
        anneesExperience: anneesExperience !== undefined ? (anneesExperience ? parseInt(anneesExperience) : null) : undefined,
        numeroDeclarationActivite,
      },
      include: {
        diplomes: true,
      },
    });

    return NextResponse.json(intervenant);
  } catch (error) {
    console.error("Erreur modification intervenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification de l'intervenant" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un intervenant (soft delete)
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

    const existing = await prisma.intervenant.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Intervenant non trouvé" }, { status: 404 });
    }

    await prisma.intervenant.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression intervenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'intervenant" },
      { status: 500 }
    );
  }
}
