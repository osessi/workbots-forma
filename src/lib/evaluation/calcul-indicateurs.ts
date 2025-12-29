// ===========================================
// CALCUL DES INDICATEURS DE SATISFACTION - Qualiopi IND 2
// ===========================================
// Fonction utilitaire pour calculer et mettre à jour les indicateurs de satisfaction
// d'une formation à partir des évaluations à chaud

import { prisma } from "@/lib/db/prisma";

interface IndicateursResult {
  tauxSatisfaction: number | null;
  nombreAvis: number;
  nombreStagiaires: number;
  updated: boolean;
}

/**
 * Calcule et met à jour les indicateurs de satisfaction pour une formation
 * basé sur les évaluations à chaud complétées
 *
 * Formule: tauxSatisfaction = (moyenne des noteGlobale / 10) * 100
 *
 * @param formationId - ID de la formation
 * @param sessionId - (optionnel) ID de la session pour calcul partiel
 * @returns Les indicateurs calculés
 */
export async function calculerIndicateursSatisfaction(
  formationId: string,
  sessionId?: string
): Promise<IndicateursResult> {
  try {
    // Récupérer toutes les sessions de la formation
    const sessions = await prisma.documentSession.findMany({
      where: {
        formationId,
        ...(sessionId && { id: sessionId }),
      },
      select: { id: true },
    });

    const sessionIds = sessions.map(s => s.id);

    if (sessionIds.length === 0) {
      return {
        tauxSatisfaction: null,
        nombreAvis: 0,
        nombreStagiaires: 0,
        updated: false,
      };
    }

    // Récupérer les évaluations à chaud complétées avec leurs réponses
    const evaluations = await prisma.evaluationSatisfaction.findMany({
      where: {
        sessionId: { in: sessionIds },
        type: "CHAUD", // Seules les évaluations à chaud comptent pour Qualiopi
        status: "COMPLETED",
      },
      include: {
        reponse: {
          select: {
            noteGlobale: true,
            scoreMoyen: true,
          },
        },
      },
    });

    // Calculer le nombre d'avis
    const nombreAvis = evaluations.filter(e => e.reponse?.noteGlobale !== null).length;

    // Calculer la moyenne des notes globales
    let tauxSatisfaction: number | null = null;

    if (nombreAvis > 0) {
      const totalNotes = evaluations.reduce((sum, e) => {
        if (e.reponse?.noteGlobale != null) {
          return sum + e.reponse.noteGlobale;
        }
        return sum;
      }, 0);

      const moyenneNote = totalNotes / nombreAvis;
      // Convertir en pourcentage (note sur 10 -> pourcentage)
      tauxSatisfaction = Math.round((moyenneNote / 10) * 100);
    }

    // Calculer le nombre de stagiaires ayant participé
    const participations = await prisma.sessionParticipantNew.findMany({
      where: {
        client: {
          sessionId: { in: sessionIds },
        },
      },
      select: {
        apprenantId: true,
      },
    });

    const nombreStagiaires = new Set(participations.map(p => p.apprenantId)).size;

    // Mettre à jour ou créer les indicateurs dans la base
    const existingIndicateurs = await prisma.formationIndicateurs.findUnique({
      where: { formationId },
    });

    if (existingIndicateurs) {
      await prisma.formationIndicateurs.update({
        where: { formationId },
        data: {
          tauxSatisfaction,
          nombreAvis,
          nombreStagiaires,
          dernierCalcul: new Date(),
          annee: new Date().getFullYear(),
        },
      });
    } else {
      await prisma.formationIndicateurs.create({
        data: {
          formationId,
          tauxSatisfaction,
          nombreAvis,
          nombreStagiaires,
          dernierCalcul: new Date(),
          annee: new Date().getFullYear(),
        },
      });
    }

    return {
      tauxSatisfaction,
      nombreAvis,
      nombreStagiaires,
      updated: true,
    };
  } catch (error) {
    console.error("Erreur calcul indicateurs satisfaction:", error);
    return {
      tauxSatisfaction: null,
      nombreAvis: 0,
      nombreStagiaires: 0,
      updated: false,
    };
  }
}

/**
 * Calcule les indicateurs pour toutes les formations d'une organisation
 * Utile pour un recalcul batch ou un job CRON
 *
 * @param organizationId - ID de l'organisation
 * @returns Nombre de formations mises à jour
 */
export async function recalculerTousIndicateurs(
  organizationId: string
): Promise<{ updated: number; errors: number }> {
  let updated = 0;
  let errors = 0;

  try {
    // Récupérer toutes les formations de l'organisation
    const formations = await prisma.formation.findMany({
      where: { organizationId },
      select: { id: true },
    });

    for (const formation of formations) {
      const result = await calculerIndicateursSatisfaction(formation.id);
      if (result.updated) {
        updated++;
      } else {
        errors++;
      }
    }
  } catch (error) {
    console.error("Erreur recalcul tous indicateurs:", error);
    errors++;
  }

  return { updated, errors };
}

/**
 * Récupère les indicateurs d'une formation (avec calcul si nécessaire)
 *
 * @param formationId - ID de la formation
 * @param forceRecalcul - Forcer le recalcul même si les indicateurs existent
 * @returns Les indicateurs de la formation
 */
export async function getIndicateursFormation(
  formationId: string,
  forceRecalcul = false
): Promise<IndicateursResult> {
  // Vérifier si les indicateurs existent et sont récents
  if (!forceRecalcul) {
    const existing = await prisma.formationIndicateurs.findUnique({
      where: { formationId },
    });

    if (existing && existing.dernierCalcul) {
      // Si le dernier calcul date de moins de 24h, retourner les valeurs existantes
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (existing.dernierCalcul > dayAgo) {
        return {
          tauxSatisfaction: existing.tauxSatisfaction,
          nombreAvis: existing.nombreAvis,
          nombreStagiaires: existing.nombreStagiaires,
          updated: false,
        };
      }
    }
  }

  // Calculer les indicateurs
  return calculerIndicateursSatisfaction(formationId);
}
