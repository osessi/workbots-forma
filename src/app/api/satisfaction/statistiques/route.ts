// ===========================================
// API: STATISTIQUES DE SATISFACTION
// GET /api/satisfaction/statistiques - Statistiques globales
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth/getCurrentUser";

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const annee = searchParams.get("annee");
    const formationId = searchParams.get("formationId");

    // Construire le filtre pour les enquêtes complétées
    const whereClause: Record<string, unknown> = {
      organizationId: user.organizationId,
      status: "COMPLETED",
    };

    if (annee) {
      const startDate = new Date(parseInt(annee), 0, 1);
      const endDate = new Date(parseInt(annee), 11, 31, 23, 59, 59);
      whereClause.completedAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Récupérer toutes les réponses
    const enquetes = await prisma.evaluationSatisfaction.findMany({
      where: whereClause,
      include: {
        reponse: true,
        session: {
          select: {
            formation: {
              select: {
                id: true,
                titre: true,
              },
            },
          },
        },
      },
    });

    // Filtrer par formation si demandé
    let enquetesFiltrees = enquetes;
    if (formationId) {
      enquetesFiltrees = enquetes.filter(
        (e) => e.session.formation.id === formationId
      );
    }

    // Séparer les enquêtes à chaud et à froid
    const enquetesChaud = enquetesFiltrees.filter((e) => e.type === "CHAUD");
    const enquetesFroid = enquetesFiltrees.filter((e) => e.type === "FROID");

    // Calculer les moyennes pour les enquêtes à chaud
    const calculerMoyennes = (enquetes: typeof enquetesFiltrees) => {
      const reponses = enquetes.map((e) => e.reponse).filter(Boolean);
      if (reponses.length === 0) return null;

      const moyennes: Record<string, number | null> = {};
      const champs = [
        "preparationInfos", "preparationMessages", "preparationPrerequis",
        "organisationCalendrier", "organisationConditions",
        "animationExplications", "animationEchanges", "animationAmbiance", "animationRythme",
        "contenuCoherence", "contenuUtilite", "contenuSupports", "contenuNiveau",
        "objectifsAtteints", "noteGlobale",
        "froidAttentesInitiales", "froidCompetencesUtiles", "froidMiseEnPratique",
        "froidImpactTravail", "froidPertinenceActuelle", "froidUtiliteFuture",
        "froidObjectifsPratique", "recommandation",
      ];

      for (const champ of champs) {
        const valeurs = reponses
          .map((r) => (r as Record<string, unknown>)[champ] as number | null)
          .filter((v): v is number => v !== null && v !== undefined);

        moyennes[champ] = valeurs.length > 0
          ? Math.round((valeurs.reduce((a, b) => a + b, 0) / valeurs.length) * 10) / 10
          : null;
      }

      return moyennes;
    };

    const moyennesChaud = calculerMoyennes(enquetesChaud);
    const moyennesFroid = calculerMoyennes(enquetesFroid);

    // Taux de satisfaction global
    const reponsesAvecNote = enquetesFiltrees
      .map((e) => e.reponse?.tauxSatisfaction)
      .filter((v): v is number => v !== null && v !== undefined);

    const tauxSatisfactionGlobal = reponsesAvecNote.length > 0
      ? Math.round(reponsesAvecNote.reduce((a, b) => a + b, 0) / reponsesAvecNote.length)
      : null;

    // NPS (Net Promoter Score) basé sur la recommandation
    const recommandations = enquetesFroid
      .map((e) => e.reponse?.recommandation)
      .filter((v): v is number => v !== null && v !== undefined);

    let nps = null;
    if (recommandations.length > 0) {
      const promoteurs = recommandations.filter((r) => r >= 9).length;
      const detracteurs = recommandations.filter((r) => r <= 6).length;
      nps = Math.round(((promoteurs - detracteurs) / recommandations.length) * 100);
    }

    // Statistiques par formation
    const formationsMap = new Map<string, { titre: string; count: number; tauxMoyen: number[] }>();
    for (const enquete of enquetesFiltrees) {
      const formId = enquete.session.formation.id;
      const formTitre = enquete.session.formation.titre;
      const taux = enquete.reponse?.tauxSatisfaction;

      if (!formationsMap.has(formId)) {
        formationsMap.set(formId, { titre: formTitre, count: 0, tauxMoyen: [] });
      }

      const stats = formationsMap.get(formId)!;
      stats.count++;
      if (taux) stats.tauxMoyen.push(taux);
    }

    const parFormation = Array.from(formationsMap.entries()).map(([id, stats]) => ({
      formationId: id,
      titre: stats.titre,
      nombreReponses: stats.count,
      tauxSatisfaction: stats.tauxMoyen.length > 0
        ? Math.round(stats.tauxMoyen.reduce((a, b) => a + b, 0) / stats.tauxMoyen.length)
        : null,
    })).sort((a, b) => b.nombreReponses - a.nombreReponses);

    // Évolution sur les 12 derniers mois
    const evolution: { mois: string; chaud: number; froid: number; taux: number | null }[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const moisDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const moisFin = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const moisLabel = moisDate.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });

      const enquetesMois = enquetesFiltrees.filter((e) => {
        const date = e.completedAt;
        return date && date >= moisDate && date <= moisFin;
      });

      const tauxMois = enquetesMois
        .map((e) => e.reponse?.tauxSatisfaction)
        .filter((v): v is number => v !== null);

      evolution.push({
        mois: moisLabel,
        chaud: enquetesMois.filter((e) => e.type === "CHAUD").length,
        froid: enquetesMois.filter((e) => e.type === "FROID").length,
        taux: tauxMois.length > 0
          ? Math.round(tauxMois.reduce((a, b) => a + b, 0) / tauxMois.length)
          : null,
      });
    }

    return NextResponse.json({
      // Résumé global
      resume: {
        totalReponses: enquetesFiltrees.length,
        reponsesChaud: enquetesChaud.length,
        reponsesFroid: enquetesFroid.length,
        tauxSatisfactionGlobal,
        nps,
      },
      // Moyennes détaillées
      moyennes: {
        chaud: moyennesChaud,
        froid: moyennesFroid,
      },
      // Par formation
      parFormation,
      // Évolution
      evolution,
    });
  } catch (error) {
    console.error("[API] GET /api/satisfaction/statistiques error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
