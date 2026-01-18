// ===========================================
// API FINANCEURS - CRUD
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

// POST - Créer un financeur
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
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

    if (!nom || !type) {
      return NextResponse.json({ error: "Le nom et le type sont requis" }, { status: 400 });
    }

    const financeur = await prisma.financeur.create({
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
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json(financeur, { status: 201 });
  } catch (error) {
    console.error("Erreur création financeur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du financeur" },
      { status: 500 }
    );
  }
}

// GET - Lister les financeurs
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type");

    const financeurs = await prisma.financeur.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
        ...(type ? { type: type as import("@prisma/client").FinanceurType } : {}),
        OR: search ? [
          { nom: { contains: search, mode: "insensitive" } },
        ] : undefined,
      },
      orderBy: { nom: "asc" },
    });

    return NextResponse.json(financeurs);
  } catch (error) {
    console.error("Erreur récupération financeurs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des financeurs" },
      { status: 500 }
    );
  }
}
