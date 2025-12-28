// ===========================================
// API PROGRAMME APPRENANT - GET /api/apprenant/programme
// ===========================================
// Récupère le programme de formation avec les modules et la progression

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Décoder et valider le token apprenant
function decodeApprenantToken(token: string): { apprenantId: string; organizationId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));

    if (!decoded.apprenantId || !decoded.organizationId) {
      return null;
    }

    // Vérifier expiration
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }

    return {
      apprenantId: decoded.apprenantId,
      organizationId: decoded.organizationId,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis les query params
    const token = request.nextUrl.searchParams.get("token");
    const inscriptionId = request.nextUrl.searchParams.get("inscriptionId");

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 401 }
      );
    }

    // Décoder le token
    const decoded = decodeApprenantToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    const { apprenantId } = decoded;

    // Récupérer l'inscription LMS avec la formation et les modules
    const inscription = await prisma.lMSInscription.findFirst({
      where: inscriptionId
        ? { id: inscriptionId, apprenantId }
        : { apprenantId },
      include: {
        formation: {
          include: {
            modules: {
              orderBy: { ordre: "asc" },
            },
          },
        },
        progressionModules: true,
      },
    });

    if (!inscription) {
      return NextResponse.json({
        formation: null,
        modules: [],
        progression: {
          global: 0,
          modulesTermines: 0,
          totalModules: 0,
        },
      });
    }

    // Calculer la progression par module
    const modulesAvecProgression = inscription.formation.modules.map((module) => {
      const progression = inscription.progressionModules.find(
        (p) => p.moduleId === module.id
      );
      return {
        id: module.id,
        titre: module.titre,
        description: module.description,
        ordre: module.ordre,
        duree: module.duree,
        objectifs: module.objectifs || [],
        contenu: module.contenu,
        progression: progression?.progression || 0,
        statut: progression?.statut || "NON_COMMENCE",
      };
    });

    // Calculer la progression globale
    const modulesTermines = modulesAvecProgression.filter(
      (m) => m.statut === "TERMINE"
    ).length;
    const totalModules = modulesAvecProgression.length;
    const progressionGlobale = totalModules > 0
      ? Math.round((modulesTermines / totalModules) * 100)
      : 0;

    return NextResponse.json({
      formation: {
        id: inscription.formation.id,
        titre: inscription.formation.titre,
        description: inscription.formation.description,
        dureeHeures: inscription.formation.dureeHeures,
        objectifsPedagogiques: inscription.formation.objectifsPedagogiques || [],
      },
      modules: modulesAvecProgression,
      progression: {
        global: inscription.progression || progressionGlobale,
        modulesTermines,
        totalModules,
      },
    });
  } catch (error) {
    console.error("Erreur API programme apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du programme" },
      { status: 500 }
    );
  }
}
