// ===========================================
// API DIPLOMES INTERVENANT - CRUD
// Qualiopi IND 17 - Gestion des diplômes et certifications
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

// GET - Lister les diplômes d'un intervenant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authentification
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Vérifier que l'intervenant appartient à l'organisation
    const intervenant = await prisma.intervenant.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!intervenant) {
      return NextResponse.json({ error: "Intervenant non trouvé" }, { status: 404 });
    }

    const diplomes = await prisma.intervenantDiplome.findMany({
      where: { intervenantId: id },
      orderBy: { anneeObtention: "desc" },
    });

    return NextResponse.json(diplomes);
  } catch (error) {
    console.error("Erreur récupération diplômes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des diplômes" },
      { status: 500 }
    );
  }
}

// POST - Ajouter un diplôme à un intervenant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authentification
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Vérifier que l'intervenant appartient à l'organisation
    const intervenant = await prisma.intervenant.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!intervenant) {
      return NextResponse.json({ error: "Intervenant non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const { intitule, organisme, anneeObtention, niveau, fichierUrl } = body;

    if (!intitule) {
      return NextResponse.json({ error: "L'intitulé du diplôme est requis" }, { status: 400 });
    }

    const diplome = await prisma.intervenantDiplome.create({
      data: {
        intervenantId: id,
        intitule,
        organisme,
        anneeObtention: anneeObtention ? parseInt(anneeObtention) : null,
        niveau,
        fichierUrl,
      },
    });

    return NextResponse.json(diplome, { status: 201 });
  } catch (error) {
    console.error("Erreur création diplôme:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du diplôme" },
      { status: 500 }
    );
  }
}
