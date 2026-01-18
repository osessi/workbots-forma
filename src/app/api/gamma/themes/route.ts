// ===========================================
// API GAMMA - Liste des thèmes
// ===========================================

import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { createGammaClient } from "@/lib/gamma";

// GET - Récupérer les thèmes Gamma disponibles
export async function GET() {
  try {
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

    // Récupérer les thèmes
    const gammaClient = createGammaClient(gammaApiKey);
    const themes = await gammaClient.listThemes();

    return NextResponse.json({ themes });
  } catch (error) {
    console.error("Erreur récupération thèmes Gamma:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des thèmes",
        message: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    );
  }
}
