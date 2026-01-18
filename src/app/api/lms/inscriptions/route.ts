// ===========================================
// API LMS INSCRIPTIONS - Gestion des inscriptions et progression
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth/getCurrentUser";

// GET - Récupérer les inscriptions/progressions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formationId = searchParams.get("formationId");
    const apprenantId = searchParams.get("apprenantId");

    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Construire les filtres
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      organizationId: user.organizationId,
    };

    if (formationId) {
      where.formationId = formationId;
    }

    if (apprenantId) {
      where.apprenantId = apprenantId;
    }

    const inscriptions = await prisma.lMSInscription.findMany({
      where,
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
            modules: {
              select: {
                id: true,
                titre: true,
                ordre: true,
                duree: true,
              },
              orderBy: { ordre: "asc" },
            },
          },
        },
        apprenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        progressionModules: {
          include: {
            module: {
              select: {
                id: true,
                titre: true,
                ordre: true,
              },
            },
          },
          orderBy: {
            module: { ordre: "asc" },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculer les stats globales
    const stats = {
      total: inscriptions.length,
      enCours: inscriptions.filter((i) => i.statut === "EN_COURS").length,
      completes: inscriptions.filter((i) => i.statut === "COMPLETE").length,
      nonCommences: inscriptions.filter((i) => i.statut === "NON_COMMENCE").length,
      progressionMoyenne: inscriptions.length > 0
        ? Math.round(inscriptions.reduce((acc, i) => acc + i.progression, 0) / inscriptions.length)
        : 0,
    };

    return NextResponse.json({ inscriptions, stats });
  } catch (error) {
    console.error("Erreur récupération inscriptions LMS:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des inscriptions" },
      { status: 500 }
    );
  }
}

// POST - Créer une inscription
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
    const { formationId, apprenantId } = body;

    if (!formationId || !apprenantId) {
      return NextResponse.json(
        { error: "formationId et apprenantId sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que la formation existe
    const formation = await prisma.formation.findFirst({
      where: {
        id: formationId,
        organizationId: user.organizationId,
      },
      include: {
        modules: true,
      },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
    }

    // Vérifier que l'apprenant existe
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id: apprenantId,
        organizationId: user.organizationId,
      },
    });

    if (!apprenant) {
      return NextResponse.json({ error: "Apprenant non trouvé" }, { status: 404 });
    }

    // Créer l'inscription avec progression initiale des modules
    const inscription = await prisma.lMSInscription.create({
      data: {
        formationId,
        apprenantId,
        organizationId: user.organizationId,
        progressionModules: {
          create: formation.modules.map((module) => ({
            moduleId: module.id,
          })),
        },
      },
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
        apprenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        progressionModules: true,
      },
    });

    return NextResponse.json(inscription, { status: 201 });
  } catch (error) {
    console.error("Erreur création inscription LMS:", error);
    // Check for unique constraint violation
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Cet apprenant est déjà inscrit à cette formation" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de la création de l'inscription" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour la progression
export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const { inscriptionId, moduleId, progression, tempsPasse, scoreQuiz } = body;

    if (!inscriptionId) {
      return NextResponse.json({ error: "inscriptionId requis" }, { status: 400 });
    }

    // Vérifier l'inscription
    const inscription = await prisma.lMSInscription.findFirst({
      where: {
        id: inscriptionId,
        organizationId: user.organizationId,
      },
      include: {
        progressionModules: true,
      },
    });

    if (!inscription) {
      return NextResponse.json({ error: "Inscription non trouvée" }, { status: 404 });
    }

    // Si c'est une mise à jour d'un module spécifique
    if (moduleId) {
      const progressionModule = inscription.progressionModules.find(
        (p) => p.moduleId === moduleId
      );

      if (!progressionModule) {
        return NextResponse.json(
          { error: "Progression module non trouvée" },
          { status: 404 }
        );
      }

      const updateData: {
        progression?: number;
        statut?: "NON_COMMENCE" | "EN_COURS" | "COMPLETE";
        tempsPasse?: number;
        scoreQuiz?: number;
        tentativesQuiz?: { increment: number };
        dateDebut?: Date;
        dateFin?: Date;
      } = {};

      if (progression !== undefined) {
        updateData.progression = progression;
        if (progression === 0) {
          updateData.statut = "NON_COMMENCE";
        } else if (progression === 100) {
          updateData.statut = "COMPLETE";
          updateData.dateFin = new Date();
        } else {
          updateData.statut = "EN_COURS";
          if (!progressionModule.dateDebut) {
            updateData.dateDebut = new Date();
          }
        }
      }

      if (tempsPasse !== undefined) {
        updateData.tempsPasse = progressionModule.tempsPasse + tempsPasse;
      }

      if (scoreQuiz !== undefined) {
        updateData.scoreQuiz = scoreQuiz;
        updateData.tentativesQuiz = { increment: 1 };
      }

      await prisma.lMSProgressionModule.update({
        where: { id: progressionModule.id },
        data: updateData,
      });
    }

    // Recalculer la progression globale
    const allProgressions = await prisma.lMSProgressionModule.findMany({
      where: { inscriptionId },
    });

    const globalProgression = allProgressions.length > 0
      ? Math.round(
          allProgressions.reduce((acc, p) => acc + p.progression, 0) /
            allProgressions.length
        )
      : 0;

    const allCompleted = allProgressions.every((p) => p.statut === "COMPLETE");
    const anyStarted = allProgressions.some((p) => p.statut !== "NON_COMMENCE");

    const globalStatut = allCompleted
      ? "COMPLETE"
      : anyStarted
      ? "EN_COURS"
      : "NON_COMMENCE";

    const globalTempTotal = allProgressions.reduce((acc, p) => acc + p.tempsPasse, 0);
    const globalScore = allProgressions.filter((p) => p.scoreQuiz !== null).length > 0
      ? allProgressions
          .filter((p) => p.scoreQuiz !== null)
          .reduce((acc, p) => acc + (p.scoreQuiz || 0), 0) /
        allProgressions.filter((p) => p.scoreQuiz !== null).length
      : null;

    // Mettre à jour l'inscription
    const updatedInscription = await prisma.lMSInscription.update({
      where: { id: inscriptionId },
      data: {
        progression: globalProgression,
        statut: globalStatut,
        tempsTotal: globalTempTotal,
        noteFinale: globalScore,
        dateDebut: anyStarted && !inscription.dateDebut ? new Date() : undefined,
        dateFin: allCompleted ? new Date() : undefined,
      },
      include: {
        progressionModules: {
          include: {
            module: true,
          },
          orderBy: {
            module: { ordre: "asc" },
          },
        },
      },
    });

    return NextResponse.json(updatedInscription);
  } catch (error) {
    console.error("Erreur mise à jour progression LMS:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la progression" },
      { status: 500 }
    );
  }
}
