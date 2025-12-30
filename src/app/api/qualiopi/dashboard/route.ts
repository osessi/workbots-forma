// ===========================================
// API: DASHBOARD QUALIOPI
// GET /api/qualiopi/dashboard - Données du dashboard
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  analyserConformiteOrganisation,
  initialiserIndicateursOrganisation,
} from "@/lib/services/qualiopi";

export async function GET(request: NextRequest) {
  try {
    // Authentification
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son organisation
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const organizationId = dbUser.organizationId;

    // Initialiser les indicateurs si nécessaire
    await initialiserIndicateursOrganisation(organizationId);

    // Analyser la conformité
    const { score, analyses, alertes } = await analyserConformiteOrganisation(
      organizationId
    );

    // Récupérer les données supplémentaires
    const [
      prochainAudit,
      actionsEnCours,
      alertesNonLues,
      derniereConversation,
    ] = await Promise.all([
      // Prochain audit prévu
      prisma.auditQualiopi.findFirst({
        where: {
          organizationId,
          dateAudit: { gte: new Date() },
        },
        orderBy: { dateAudit: "asc" },
        select: {
          id: true,
          type: true,
          dateAudit: true,
          auditeur: true,
        },
      }),
      // Actions correctives en cours
      prisma.actionCorrective.count({
        where: {
          indicateur: {
            organizationId,
          },
          status: { in: ["A_FAIRE", "EN_COURS"] },
        },
      }),
      // Alertes non lues
      prisma.alerteQualiopi.count({
        where: {
          organizationId,
          estLue: false,
        },
      }),
      // Dernière conversation IA
      prisma.conversationQualiopi.findFirst({
        where: { organizationId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          titre: true,
          updatedAt: true,
        },
      }),
    ]);

    // Calculer les jours avant le prochain audit
    let joursAvantAudit = null;
    if (prochainAudit) {
      const diff = prochainAudit.dateAudit.getTime() - new Date().getTime();
      joursAvantAudit = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    // Formater les alertes prioritaires
    const alertesPrioritaires = alertes.slice(0, 5).map((a) => ({
      indicateur: a.indicateur,
      message: a.message,
      priorite: a.priorite,
    }));

    // Formater les indicateurs par critère
    const indicateursParCritere = score.scoreParCritere.map((c) => ({
      critere: c.critere,
      titre: c.titre,
      score: c.score,
      conformes: c.indicateursConformes,
      total: c.indicateursTotal,
    }));

    // Indicateurs non conformes ou à améliorer
    const indicateursAttention = analyses
      .filter((a) => a.status === "NON_CONFORME" || (a.status === "EN_COURS" && a.score < 50))
      .slice(0, 5)
      .map((a) => ({
        numero: a.numero,
        libelle: a.libelle,
        score: a.score,
        status: a.status,
        problemes: a.problemes,
      }));

    return NextResponse.json({
      // Scores globaux
      scoreGlobal: score.scoreGlobal,
      indicateursConformes: score.indicateursConformes,
      indicateursTotal: score.indicateursTotal,

      // Détail par critère
      indicateursParCritere,

      // Prochain audit
      prochainAudit: prochainAudit
        ? {
            ...prochainAudit,
            joursRestants: joursAvantAudit,
          }
        : null,

      // Alertes et actions
      alertesPrioritaires,
      alertesNonLues,
      actionsEnCours,

      // Indicateurs à traiter
      indicateursAttention,

      // Dernière activité IA
      derniereConversation,
    });
  } catch (error) {
    console.error("[API] GET /api/qualiopi/dashboard error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
