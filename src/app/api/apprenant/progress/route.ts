
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// Fonction pour valider le token apprenant
async function validateApprenantToken(token: string) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const tokenData = JSON.parse(decoded);

    if (Date.now() > tokenData.exp) {
      return null;
    }

    return tokenData;
  } catch {
    return null;
  }
}

// POST - Mettre à jour la progression d'un module
export async function POST(request: NextRequest) {
  try {
    // Récupérer le token depuis le header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Token d'authentification requis" },
        { status: 401 }
      );
    }

    const tokenData = await validateApprenantToken(token);
    if (!tokenData) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { inscriptionId, moduleId, progression, completed } = body;

    if (!inscriptionId || !moduleId) {
      return NextResponse.json(
        { error: "inscriptionId et moduleId requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'inscription appartient à l'apprenant
    const inscription = await prisma.lMSInscription.findFirst({
      where: {
        id: inscriptionId,
        apprenantId: tokenData.apprenantId,
      },
      include: {
        formation: {
          include: {
            modules: true,
          },
        },
      },
    });

    if (!inscription) {
      return NextResponse.json(
        { error: "Inscription non trouvée" },
        { status: 404 }
      );
    }

    // Upsert la progression du module
    const progressionModule = await prisma.lMSProgressionModule.upsert({
      where: {
        inscriptionId_moduleId: {
          inscriptionId,
          moduleId,
        },
      },
      create: {
        inscriptionId,
        moduleId,
        progression: progression || 0,
        statut: completed ? "COMPLETE" : progression > 0 ? "EN_COURS" : "NON_COMMENCE",
        dateDebut: new Date(),
        dateFin: completed ? new Date() : null,
      },
      update: {
        progression: progression || undefined,
        statut: completed ? "COMPLETE" : progression > 0 ? "EN_COURS" : undefined,
        dateFin: completed ? new Date() : undefined,
      },
    });

    // Recalculer la progression globale de l'inscription
    const allProgressions = await prisma.lMSProgressionModule.findMany({
      where: { inscriptionId },
    });

    const totalModules = inscription.formation.modules.length;
    const avgProgression = totalModules > 0
      ? Math.round(
          allProgressions.reduce((acc, p) => acc + p.progression, 0) / totalModules
        )
      : 0;

    const allCompleted = allProgressions.length === totalModules &&
      allProgressions.every(p => p.statut === "COMPLETE");

    // Mettre à jour l'inscription
    await prisma.lMSInscription.update({
      where: { id: inscriptionId },
      data: {
        progression: avgProgression,
        statut: allCompleted ? "COMPLETE" : avgProgression > 0 ? "EN_COURS" : "NON_COMMENCE",
        dateDebut: inscription.dateDebut || new Date(),
        dateFin: allCompleted ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      moduleProgression: progressionModule,
      globalProgression: avgProgression,
    });
  } catch (error) {
    console.error("Erreur mise à jour progression:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la progression" },
      { status: 500 }
    );
  }
}
