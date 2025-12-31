// ===========================================
// API: AGENT IA QUALIOPI - ANALYSER
// POST /api/agent-qualiopi/analyser - Analyse complète de conformité
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import {
  analyserConformiteOrganisation,
  initialiserIndicateursOrganisation,
} from "@/lib/services/qualiopi";

// Helper pour créer le client Supabase
async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
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
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

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

    const body = await request.json();
    const { indicateurs: indicateursSpecifiques, forceRefresh } = body;

    // Initialiser les indicateurs si nécessaire
    await initialiserIndicateursOrganisation(organizationId);

    // Analyser la conformité complète
    const { score, analyses, alertes } = await analyserConformiteOrganisation(
      organizationId
    );

    // Filtrer si des indicateurs spécifiques sont demandés
    let analysesFiltrees = analyses;
    if (indicateursSpecifiques && Array.isArray(indicateursSpecifiques)) {
      analysesFiltrees = analyses.filter((a) =>
        indicateursSpecifiques.includes(a.numero)
      );
    }

    // Générer des recommandations prioritaires
    const recommandations = generateRecommandations(analysesFiltrees, alertes);

    // Identifier les points forts
    const pointsForts = analysesFiltrees
      .filter((a) => a.status === "CONFORME" || a.score >= 80)
      .map((a) => ({
        indicateur: a.numero,
        libelle: a.libelle,
        score: a.score,
        preuvesCount: a.preuvesTrouvees?.length || 0,
      }));

    // Identifier les points faibles
    const pointsFaibles = analysesFiltrees
      .filter((a) => a.status === "NON_CONFORME" || a.score < 50)
      .map((a) => ({
        indicateur: a.numero,
        libelle: a.libelle,
        score: a.score,
        problemes: a.problemes || [],
        suggestions: a.suggestions || [],
      }));

    // Risques identifiés
    const risques = alertes
      .filter((a) => a.priorite === "HAUTE" || a.priorite === "CRITIQUE")
      .map((a) => ({
        indicateur: a.indicateur,
        message: a.message,
        priorite: a.priorite,
      }));

    // Mettre à jour la date de dernière analyse
    await prisma.indicateurConformite.updateMany({
      where: { organizationId },
      data: { derniereEvaluation: new Date() },
    });

    return NextResponse.json({
      // Score global
      score: {
        global: score.scoreGlobal,
        conformes: score.indicateursConformes,
        total: score.indicateursTotal,
        parCritere: score.scoreParCritere,
      },
      // Analyses détaillées
      analyses: analysesFiltrees.map((a) => ({
        numero: a.numero,
        critere: a.critere,
        libelle: a.libelle,
        status: a.status,
        score: a.score,
        preuvesTrouvees: a.preuvesTrouvees,
        problemes: a.problemes,
        suggestions: a.suggestions,
      })),
      // Synthèse
      synthese: {
        pointsForts,
        pointsFaibles,
        risques,
        recommandations,
      },
      // Statistiques
      stats: {
        totalIndicateurs: analysesFiltrees.length,
        conformes: analysesFiltrees.filter((a) => a.status === "CONFORME").length,
        enCours: analysesFiltrees.filter((a) => a.status === "EN_COURS").length,
        nonConformes: analysesFiltrees.filter((a) => a.status === "NON_CONFORME").length,
        aEvaluer: analysesFiltrees.filter((a) => a.status === "A_EVALUER").length,
      },
      // Métadonnées
      dateAnalyse: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API] POST /api/agent-qualiopi/analyser error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Génère des recommandations basées sur l'analyse
function generateRecommandations(
  analyses: Array<{
    numero: number;
    libelle: string;
    status: string;
    score: number;
    problemes?: string[];
    suggestions?: string[];
  }>,
  alertes: Array<{
    indicateur?: number;
    message: string;
    priorite: string;
  }>
): Array<{
  priorite: "HAUTE" | "MOYENNE" | "BASSE";
  indicateur?: number;
  action: string;
  impact: string;
}> {
  const recommandations: Array<{
    priorite: "HAUTE" | "MOYENNE" | "BASSE";
    indicateur?: number;
    action: string;
    impact: string;
  }> = [];

  // Recommandations basées sur les indicateurs non conformes
  for (const analyse of analyses) {
    if (analyse.status === "NON_CONFORME") {
      recommandations.push({
        priorite: "HAUTE",
        indicateur: analyse.numero,
        action: `Mettre en conformité l'indicateur ${analyse.numero} : ${analyse.libelle}`,
        impact: "Risque de non-conformité à l'audit",
      });
    } else if (analyse.status === "EN_COURS" && analyse.score < 50) {
      recommandations.push({
        priorite: "MOYENNE",
        indicateur: analyse.numero,
        action: `Améliorer l'indicateur ${analyse.numero} (score actuel: ${analyse.score}%)`,
        impact: "Amélioration du score global",
      });
    }
  }

  // Recommandations basées sur les alertes
  for (const alerte of alertes) {
    if (alerte.priorite === "CRITIQUE") {
      recommandations.push({
        priorite: "HAUTE",
        indicateur: alerte.indicateur,
        action: alerte.message,
        impact: "Action urgente requise",
      });
    }
  }

  // Trier par priorité
  const ordrepriorite = { HAUTE: 0, MOYENNE: 1, BASSE: 2 };
  return recommandations.sort(
    (a, b) => ordrepriorite[a.priorite] - ordrepriorite[b.priorite]
  );
}
