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
            // Récupérer TOUTES les évaluations (QCM, ateliers, positionnement, évaluation finale)
            evaluations: {
              orderBy: { ordre: "asc" },
              include: {
                resultats: {
                  where: { apprenantId },
                  orderBy: { createdAt: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
        progressionModules: true,
      },
    });

    // Vérifier si l'apprenant a besoin du Module 0 (score positionnement < 10%)
    const SEUIL_ADAPTATION = 10;
    const positionnementEval = inscription?.formation?.evaluations?.find(e => e.type === "POSITIONNEMENT");
    const positionnementResultat = positionnementEval?.resultats?.[0];
    const needsModuleZero = positionnementResultat && positionnementResultat.score !== null && positionnementResultat.score < SEUIL_ADAPTATION;

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

    // Filtrer les modules selon les besoins de l'apprenant
    // Module 0 (isModuleZero: true) n'est affiché QUE si le score de positionnement < 10%
    const modulesFilters = inscription.formation.modules.filter((module) => {
      // Si c'est un Module 0, ne l'afficher que si l'apprenant en a besoin
      if (module.isModuleZero) {
        return needsModuleZero;
      }
      // Sinon, afficher tous les modules normaux
      return true;
    });

    // Calculer la progression par module
    const modulesAvecProgression = modulesFilters.map((module) => {
      const progression = inscription.progressionModules.find(
        (p) => p.moduleId === module.id
      );
      return {
        id: module.id,
        titre: module.titre,
        description: module.description,
        ordre: module.ordre,
        duree: module.duree,
        objectifs: [],
        contenu: module.contenu,
        progression: progression?.progression || 0,
        statut: progression?.statut || "NON_COMMENCE",
        isModuleZero: module.isModuleZero || false,
      };
    });

    // Calculer la progression globale (exclure Module 0 du calcul de progression)
    const modulesStandard = modulesAvecProgression.filter((m) => !m.isModuleZero);
    const modulesTermines = modulesStandard.filter(
      (m) => m.statut === "COMPLETE"
    ).length;
    const totalModules = modulesStandard.length;
    const progressionGlobale = totalModules > 0
      ? Math.round((modulesTermines / totalModules) * 100)
      : 0;

    // Calculer la durée totale (exclure Module 0)
    const dureeHeures = modulesStandard.reduce((sum, m) => sum + ((m.duree || 0) / 60), 0);

    // Récupérer les données de la fiche pédagogique
    const fichePedagogique = inscription.formation.fichePedagogique as {
      objectifs?: string[];
      contenu?: string;
      methodsPedagogiques?: string[];
      supportsPedagogiques?: Array<{ nom: string; url?: string; type: string }>;
      methodesEvaluation?: string[];
      accessibiliteHandicap?: string;
    } | null;

    // Récupérer les slides/supports par module
    const slidesData = inscription.formation.slidesData as Array<{
      moduleId?: string;
      moduleTitre?: string;
      exportUrl?: string;
      editUrl?: string;
      driveUrl?: string;
      status?: string;
    }> | null;

    // Mapper les évaluations pour l'apprenant (sans exposer les bonnes réponses sauf si déjà complété)
    const evaluationsApprenant = inscription.formation.evaluations.map((evaluation) => {
      const resultat = evaluation.resultats?.[0];
      const estComplete = resultat?.status === "termine" || resultat?.status === "valide";

      // Parser le contenu de l'évaluation
      const contenu = evaluation.contenu as {
        questions?: Array<{
          question: string;
          options?: string[];
          correctAnswer?: number;
          explanation?: string;
        }>;
        consignes?: string;
        objectifs?: string[];
        livrables?: string[];
        critereEvaluation?: string[];
      } | null;

      return {
        id: evaluation.id,
        type: evaluation.type,
        titre: evaluation.titre,
        description: evaluation.description,
        dureeEstimee: evaluation.dureeEstimee,
        nombreQuestions: evaluation.nombreQuestions,
        tempsLimite: evaluation.tempsLimite,
        scoreMinimum: evaluation.scoreMinimum,
        moduleId: evaluation.moduleId,
        ordre: evaluation.ordre,
        // Contenu des questions (masquer les réponses si pas encore complété)
        questions: contenu?.questions?.map((q) => ({
          question: q.question,
          options: q.options,
          // Ne montrer la bonne réponse que si l'évaluation est terminée
          correctAnswer: estComplete ? q.correctAnswer : undefined,
          explanation: estComplete ? q.explanation : undefined,
        })),
        // Pour les ateliers
        consignes: contenu?.consignes,
        objectifs: contenu?.objectifs,
        livrables: contenu?.livrables,
        critereEvaluation: contenu?.critereEvaluation,
        // Résultat de l'apprenant
        resultat: resultat ? {
          score: resultat.score,
          status: resultat.status,
          tentative: resultat.tentative,
          completedAt: resultat.completedAt,
          feedbackFormateur: resultat.feedbackFormateur,
        } : null,
      };
    });

    return NextResponse.json({
      formation: {
        id: inscription.formation.id,
        titre: inscription.formation.titre,
        description: inscription.formation.description,
        dureeHeures,
        objectifsPedagogiques: fichePedagogique?.objectifs || [],
        contenuPedagogique: fichePedagogique?.contenu || null,
        methodsPedagogiques: fichePedagogique?.methodsPedagogiques || [],
        supportsPedagogiques: fichePedagogique?.supportsPedagogiques || [],
        methodesEvaluation: fichePedagogique?.methodesEvaluation || [],
        accessibiliteHandicap: fichePedagogique?.accessibiliteHandicap || null,
        modalite: null,
        publicCible: null,
        prerequis: null,
        moyensPedagogiques: null,
        reference: null,
      },
      modules: modulesAvecProgression,
      // Slides/Supports par module
      slides: slidesData || [],
      // Évaluations disponibles pour l'apprenant
      evaluations: evaluationsApprenant,
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
