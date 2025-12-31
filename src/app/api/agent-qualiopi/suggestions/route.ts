// ===========================================
// API: AGENT IA QUALIOPI - SUGGESTIONS
// POST /api/agent-qualiopi/suggestions - Suggestions pour un indicateur
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { INDICATEURS_QUALIOPI } from "@/lib/services/qualiopi";

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

    const body = await request.json();
    const { indicateur: numeroIndicateur, contexte } = body;

    if (!numeroIndicateur || numeroIndicateur < 1 || numeroIndicateur > 32) {
      return NextResponse.json(
        { error: "Numéro d'indicateur invalide (1-32)" },
        { status: 400 }
      );
    }

    // Récupérer les informations de référence de l'indicateur
    const indicateurRef = INDICATEURS_QUALIOPI.find(
      (i) => i.numero === numeroIndicateur
    );

    if (!indicateurRef) {
      return NextResponse.json(
        { error: "Indicateur non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer l'état actuel de l'indicateur pour l'organisation
    const indicateurDB = await prisma.indicateurConformite.findUnique({
      where: {
        organizationId_numeroIndicateur: {
          organizationId: dbUser.organizationId,
          numeroIndicateur,
        },
      },
      include: {
        preuves: true,
        actions: {
          where: { status: { in: ["A_FAIRE", "EN_COURS"] } },
        },
      },
    });

    // Générer des suggestions basées sur le contexte
    const suggestions = generateSuggestions(
      indicateurRef,
      indicateurDB,
      contexte
    );

    // Exemples de preuves acceptées
    const exemplesPreuves = generateExemplesPreuves(numeroIndicateur);

    // Bonnes pratiques
    const bonnesPratiques = generateBonnesPratiques(numeroIndicateur);

    return NextResponse.json({
      indicateur: {
        numero: indicateurRef.numero,
        critere: indicateurRef.critere,
        libelle: indicateurRef.libelle,
        description: indicateurRef.description,
        exigences: indicateurRef.exigences,
        preuvesAttendues: indicateurRef.preuvesAttendues,
      },
      etatActuel: indicateurDB
        ? {
            status: indicateurDB.status,
            score: indicateurDB.score,
            preuvesCount: indicateurDB.preuves.length,
            actionsEnCours: indicateurDB.actions.length,
          }
        : null,
      suggestions,
      exemplesPreuves,
      bonnesPratiques,
    });
  } catch (error) {
    console.error("[API] POST /api/agent-qualiopi/suggestions error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Génère des suggestions personnalisées
function generateSuggestions(
  indicateurRef: (typeof INDICATEURS_QUALIOPI)[0],
  indicateurDB: {
    status: string;
    score: number;
    preuves: unknown[];
    actions: unknown[];
  } | null,
  contexte?: string
): Array<{
  type: "preuve" | "action" | "document" | "processus";
  titre: string;
  description: string;
  priorite: "HAUTE" | "MOYENNE" | "BASSE";
}> {
  const suggestions: Array<{
    type: "preuve" | "action" | "document" | "processus";
    titre: string;
    description: string;
    priorite: "HAUTE" | "MOYENNE" | "BASSE";
  }> = [];

  const preuvesCount = indicateurDB?.preuves.length || 0;
  const score = indicateurDB?.score || 0;

  // Si pas de preuves, suggérer d'en ajouter
  if (preuvesCount === 0) {
    suggestions.push({
      type: "preuve",
      titre: "Ajouter des preuves",
      description: `Aucune preuve n'a été ajoutée pour cet indicateur. Commencez par uploader des documents ou captures d'écran.`,
      priorite: "HAUTE",
    });
  }

  // Suggestions basées sur les preuves attendues
  for (const preuve of indicateurRef.preuvesAttendues || []) {
    suggestions.push({
      type: "preuve",
      titre: `Preuve suggérée : ${preuve}`,
      description: `Ce type de preuve est recommandé pour démontrer la conformité.`,
      priorite: preuvesCount < 2 ? "HAUTE" : "MOYENNE",
    });
  }

  // Si score faible, suggérer des actions
  if (score < 50) {
    suggestions.push({
      type: "action",
      titre: "Plan d'action recommandé",
      description: `Le score actuel (${score}%) nécessite des actions correctives. Créez un plan d'action pour améliorer la conformité.`,
      priorite: "HAUTE",
    });
  }

  // Suggestions spécifiques par indicateur
  const suggestionsSpecifiques = getSuggestionsSpecifiques(indicateurRef.numero);
  suggestions.push(...suggestionsSpecifiques);

  return suggestions;
}

// Suggestions spécifiques par indicateur
function getSuggestionsSpecifiques(
  numero: number
): Array<{
  type: "preuve" | "action" | "document" | "processus";
  titre: string;
  description: string;
  priorite: "HAUTE" | "MOYENNE" | "BASSE";
}> {
  const suggestionsMap: Record<
    number,
    Array<{
      type: "preuve" | "action" | "document" | "processus";
      titre: string;
      description: string;
      priorite: "HAUTE" | "MOYENNE" | "BASSE";
    }>
  > = {
    1: [
      {
        type: "document",
        titre: "Mettre à jour le catalogue",
        description: "Assurez-vous que le catalogue de formations est à jour avec toutes les informations obligatoires.",
        priorite: "HAUTE",
      },
    ],
    2: [
      {
        type: "processus",
        titre: "Afficher les indicateurs de résultats",
        description: "Publiez vos taux de satisfaction et de réussite sur votre site et catalogue.",
        priorite: "HAUTE",
      },
    ],
    9: [
      {
        type: "document",
        titre: "Référent handicap",
        description: "Désignez et communiquez les coordonnées du référent handicap.",
        priorite: "HAUTE",
      },
    ],
    17: [
      {
        type: "document",
        titre: "Fiches mission intervenants",
        description: "Créez des fiches mission pour chaque intervenant avec CV et justificatifs.",
        priorite: "MOYENNE",
      },
    ],
    31: [
      {
        type: "processus",
        titre: "Processus de réclamation",
        description: "Documentez votre processus de traitement des réclamations.",
        priorite: "MOYENNE",
      },
    ],
    32: [
      {
        type: "processus",
        titre: "Plan d'amélioration continue",
        description: "Établissez un plan d'amélioration basé sur les retours et évaluations.",
        priorite: "MOYENNE",
      },
    ],
  };

  return suggestionsMap[numero] || [];
}

// Exemples de preuves acceptées
function generateExemplesPreuves(numero: number): string[] {
  const exemplesMap: Record<number, string[]> = {
    1: [
      "Capture d'écran du catalogue en ligne",
      "PDF du programme de formation",
      "Page web des conditions d'accès",
    ],
    2: [
      "Tableau des indicateurs de résultats",
      "Rapport d'enquête satisfaction",
      "Statistiques de réussite",
    ],
    3: [
      "Questionnaire de positionnement complété",
      "Grille d'évaluation des prérequis",
    ],
    9: [
      "Fiche de poste du référent handicap",
      "Procédure d'accueil PSH",
      "Partenariats avec organismes spécialisés",
    ],
    17: [
      "CV des formateurs",
      "Diplômes et certifications",
      "Fiches mission signées",
    ],
    26: [
      "Manuel qualité",
      "Procédures documentées",
      "Revue de direction",
    ],
    31: [
      "Registre des réclamations",
      "Procédure de traitement",
      "Exemples de réponses",
    ],
    32: [
      "Plan d'amélioration",
      "Compte-rendu de revue qualité",
      "Actions correctives documentées",
    ],
  };

  return exemplesMap[numero] || [
    "Documents justificatifs",
    "Captures d'écran",
    "Procédures écrites",
  ];
}

// Bonnes pratiques
function generateBonnesPratiques(numero: number): string[] {
  const pratiquesCommunes = [
    "Datez tous vos documents",
    "Conservez une traçabilité des modifications",
    "Nommez vos fichiers de manière explicite",
  ];

  const pratiquesSpecifiques: Record<number, string[]> = {
    1: [
      "Mettez à jour le catalogue au moins une fois par an",
      "Incluez les tarifs, durées et modalités d'évaluation",
    ],
    2: [
      "Actualisez les indicateurs après chaque session",
      "Affichez les taux sur plusieurs années si disponibles",
    ],
    9: [
      "Formez le référent handicap régulièrement",
      "Documentez les adaptations réalisées",
    ],
    31: [
      "Répondez aux réclamations sous 48h",
      "Analysez les causes récurrentes",
    ],
  };

  return [...pratiquesCommunes, ...(pratiquesSpecifiques[numero] || [])];
}
