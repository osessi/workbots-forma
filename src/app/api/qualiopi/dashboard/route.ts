// ===========================================
// API: DASHBOARD QUALIOPI
// GET /api/qualiopi/dashboard - Données du dashboard
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import {
  analyserConformiteOrganisation,
  initialiserIndicateursOrganisation,
} from "@/lib/services/qualiopi";

export async function GET(request: NextRequest) {
  try {
    // Authentification
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log("[Qualiopi Dashboard] Cookies count:", allCookies.length);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return allCookies;
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore
            }
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log("[Qualiopi Dashboard] Auth result:", {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message
    });

    if (!user) {
      return NextResponse.json({
        error: "Non authentifié",
        details: authError?.message || "No user session found"
      }, { status: 401 });
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

    console.log("[Qualiopi Dashboard] OrganizationId:", organizationId);

    // Essayer d'initialiser les indicateurs (avec fallback)
    let score = {
      scoreGlobal: 0,
      indicateursConformes: 0,
      indicateursTotal: 32,
      scoreParCritere: [
        { critere: 1, titre: "Information", score: 0, indicateursConformes: 0, indicateursTotal: 3 },
        { critere: 2, titre: "Objectifs", score: 0, indicateursConformes: 0, indicateursTotal: 4 },
        { critere: 3, titre: "Adaptation", score: 0, indicateursConformes: 0, indicateursTotal: 5 },
        { critere: 4, titre: "Moyens", score: 0, indicateursConformes: 0, indicateursTotal: 6 },
        { critere: 5, titre: "Qualification", score: 0, indicateursConformes: 0, indicateursTotal: 6 },
        { critere: 6, titre: "Environnement", score: 0, indicateursConformes: 0, indicateursTotal: 5 },
        { critere: 7, titre: "Recueil", score: 0, indicateursConformes: 0, indicateursTotal: 3 },
      ]
    };
    let analyses: any[] = [];
    let alertes: any[] = [];

    try {
      // Initialiser les indicateurs si nécessaire
      await initialiserIndicateursOrganisation(organizationId);
      console.log("[Qualiopi Dashboard] Indicateurs initialisés");

      // Analyser la conformité
      const result = await analyserConformiteOrganisation(organizationId);
      score = result.score;
      analyses = result.analyses;
      alertes = result.alertes;
      console.log("[Qualiopi Dashboard] Analyse effectuée, score:", score.scoreGlobal);
    } catch (serviceError: any) {
      console.error("[Qualiopi Dashboard] Service error (using defaults):", serviceError?.message);
      // On continue avec les valeurs par défaut
    }

    // Récupérer les données supplémentaires (avec gestion d'erreur individuelle)
    let prochainAudit = null;
    let actionsEnCours = 0;
    let alertesNonLues = 0;
    let derniereConversation = null;

    try {
      prochainAudit = await prisma.auditQualiopi.findFirst({
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
      });
    } catch (e) {
      console.error("[Qualiopi Dashboard] Error fetching audit:", e);
    }

    try {
      actionsEnCours = await prisma.actionCorrective.count({
        where: {
          indicateur: {
            organizationId,
          },
          status: { in: ["A_FAIRE", "EN_COURS"] },
        },
      });
    } catch (e) {
      console.error("[Qualiopi Dashboard] Error counting actions:", e);
    }

    try {
      alertesNonLues = await prisma.alerteQualiopi.count({
        where: {
          organizationId,
          estLue: false,
        },
      });
    } catch (e) {
      console.error("[Qualiopi Dashboard] Error counting alertes:", e);
    }

    try {
      derniereConversation = await prisma.conversationQualiopi.findFirst({
        where: { organizationId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          titre: true,
          updatedAt: true,
        },
      });
    } catch (e) {
      console.error("[Qualiopi Dashboard] Error fetching conversation:", e);
    }

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

    // Indicateurs validés (conformes)
    const indicateursValides = analyses
      .filter((a) => a.status === "CONFORME")
      .map((a) => ({
        numero: a.numero,
        libelle: a.libelle,
        critere: a.critere,
      }));

    // Indicateurs détaillés par critère pour le modal
    const indicateursDetailles: Record<number, any[]> = {};
    for (let critere = 1; critere <= 7; critere++) {
      indicateursDetailles[critere] = analyses
        .filter((a) => a.critere === critere)
        .map((a) => ({
          numero: a.numero,
          libelle: a.libelle,
          status: a.status,
          score: a.score,
        }));
    }

    console.log("[Qualiopi Dashboard] Returning response");

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

      // Alertes et actions - utiliser le max entre la DB et les alertes générées
      alertesPrioritaires,
      alertesNonLues: Math.max(alertesNonLues, alertesPrioritaires.length),
      actionsEnCours,

      // Indicateurs à traiter
      indicateursAttention,

      // Indicateurs validés (conformes)
      indicateursValides,

      // Indicateurs détaillés par critère pour le modal
      indicateursDetailles,

      // Dernière activité IA
      derniereConversation,
    });
  } catch (error: any) {
    console.error("[API] GET /api/qualiopi/dashboard error:", error);
    console.error("[API] Error stack:", error?.stack);
    return NextResponse.json({
      error: "Erreur serveur",
      message: error?.message || "Unknown error",
      details: process.env.NODE_ENV === "development" ? error?.stack : undefined
    }, { status: 500 });
  }
}
