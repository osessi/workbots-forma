// ===========================================
// API GAMMA - Statut d'une génération
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { createGammaClient } from "@/lib/gamma";

// GET - Vérifier le statut d'une génération
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const generationId = searchParams.get("generationId");

    if (!generationId) {
      return NextResponse.json({ error: "generationId requis" }, { status: 400 });
    }

    // Vérifier l'authentification
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Récupérer la clé API Gamma depuis l'organisation
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { gammaApiKey: true },
    });
    const gammaApiKey = organization?.gammaApiKey || process.env.GAMMA_API_KEY;

    if (!gammaApiKey) {
      return NextResponse.json(
        { error: "Clé API Gamma non configurée" },
        { status: 400 }
      );
    }

    // Vérifier le statut
    const gammaClient = createGammaClient(gammaApiKey);
    const status = await gammaClient.checkStatus(generationId);

    return NextResponse.json({ status });
  } catch (error) {
    console.error("Erreur vérification statut Gamma:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la vérification du statut",
        message: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    );
  }
}
