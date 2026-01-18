// ===========================================
// API FINANCEUR - CRUD par ID
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

// GET - Récupérer un financeur
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

    const financeur = await prisma.financeur.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!financeur) {
      return NextResponse.json({ error: "Financeur non trouvé" }, { status: 404 });
    }

    return NextResponse.json(financeur);
  } catch (error) {
    console.error("Erreur récupération financeur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du financeur" },
      { status: 500 }
    );
  }
}

// PUT - Modifier un financeur
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

    const existing = await prisma.financeur.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Financeur non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const {
      nom,
      type,
      adresse,
      codePostal,
      ville,
      pays,
      email,
      telephone,
      siteWeb,
      notes,
    } = body;

    const financeur = await prisma.financeur.update({
      where: { id },
      data: {
        nom,
        type,
        adresse,
        codePostal,
        ville,
        pays: pays || "France",
        email,
        telephone,
        siteWeb,
        notes,
      },
    });

    return NextResponse.json(financeur);
  } catch (error) {
    console.error("Erreur modification financeur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification du financeur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un financeur (soft delete)
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

    const existing = await prisma.financeur.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Financeur non trouvé" }, { status: 404 });
    }

    await prisma.financeur.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression financeur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du financeur" },
      { status: 500 }
    );
  }
}
