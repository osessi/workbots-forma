// ===========================================
// API: GÉNÉRATION AUTOMATIQUE DE PREUVES
// POST /api/qualiopi/audit/generer-preuves - Génère les preuves manquantes
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

// Types de preuves pouvant être générées automatiquement
const TYPES_PREUVES_AUTO = {
  REGISTRE_FORMATIONS: {
    nom: "Registre des formations",
    description: "Liste complète des formations avec participants",
    indicateurs: [1, 2, 3],
  },
  FICHES_PEDAGOGIQUES: {
    nom: "Fiches pédagogiques",
    description: "Descriptifs détaillés des formations",
    indicateurs: [4, 5, 6],
  },
  EVALUATIONS_AMONT: {
    nom: "Évaluations préalables",
    description: "Tests de positionnement",
    indicateurs: [7, 8],
  },
  EMARGEMENTS: {
    nom: "Feuilles d'émargement",
    description: "Présences signées",
    indicateurs: [11, 12],
  },
  EVALUATIONS_ACQUIS: {
    nom: "Évaluations des acquis",
    description: "Résultats des évaluations",
    indicateurs: [11, 17],
  },
  SATISFACTION: {
    nom: "Enquêtes de satisfaction",
    description: "Retours apprenants à chaud et à froid",
    indicateurs: [30, 31, 32],
  },
  CV_FORMATEURS: {
    nom: "CV des formateurs",
    description: "Curriculum vitae et qualifications",
    indicateurs: [21, 22],
  },
  PROCEDURES_QUALITE: {
    nom: "Procédures qualité",
    description: "Documents de process qualité",
    indicateurs: [17, 18, 19],
  },
};

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
    const { indicateurs, typesPreuves } = body;

    const organizationId = dbUser.organizationId;

    // Récupérer les indicateurs avec leurs preuves existantes
    const indicateursDb = await prisma.indicateurConformite.findMany({
      where: {
        organizationId,
        ...(indicateurs && indicateurs.length > 0
          ? { numeroIndicateur: { in: indicateurs } }
          : {}),
      },
      include: {
        preuves: true,
      },
    });

    // Analyser les preuves manquantes
    const preuvesManquantes: Array<{
      indicateur: number;
      type: string;
      nom: string;
      description: string;
      peutGenerer: boolean;
      source: string;
    }> = [];

    const preuvesGenerees: Array<{
      indicateur: number;
      type: string;
      nom: string;
      statut: string;
    }> = [];

    for (const indicateur of indicateursDb) {
      const infoIndicateur = INDICATEURS_QUALIOPI.find(
        (i) => i.numero === indicateur.numeroIndicateur
      );

      if (!infoIndicateur) continue;

      // Vérifier chaque type de preuve
      for (const [typeKey, typeInfo] of Object.entries(TYPES_PREUVES_AUTO)) {
        if (!typeInfo.indicateurs.includes(indicateur.numeroIndicateur)) continue;

        // Vérifier si une preuve de ce type existe déjà
        const preuveExistante = indicateur.preuves.find(
          (p) => p.type === typeKey || p.nom.includes(typeInfo.nom)
        );

        if (!preuveExistante) {
          // Déterminer si on peut générer automatiquement
          const peutGenerer = await verifierSourcesDonnees(
            organizationId,
            typeKey
          );

          preuvesManquantes.push({
            indicateur: indicateur.numeroIndicateur,
            type: typeKey,
            nom: typeInfo.nom,
            description: typeInfo.description,
            peutGenerer,
            source: peutGenerer ? "Données existantes" : "À fournir manuellement",
          });

          // Si demandé et possible, générer la preuve
          if (
            peutGenerer &&
            (!typesPreuves || typesPreuves.includes(typeKey))
          ) {
            const preuveGeneree = await genererPreuve(
              organizationId,
              indicateur.id,
              indicateur.numeroIndicateur,
              typeKey,
              typeInfo
            );

            if (preuveGeneree) {
              preuvesGenerees.push({
                indicateur: indicateur.numeroIndicateur,
                type: typeKey,
                nom: preuveGeneree.nom,
                statut: "generee",
              });
            }
          }
        }
      }
    }

    // Mettre à jour le statut des indicateurs si des preuves ont été générées
    if (preuvesGenerees.length > 0) {
      const indicateursModifies = [...new Set(preuvesGenerees.map((p) => p.indicateur))];

      for (const numIndicateur of indicateursModifies) {
        const indicateur = await prisma.indicateurConformite.findFirst({
          where: {
            organizationId,
            numeroIndicateur: numIndicateur,
          },
          include: { preuves: true },
        });

        if (indicateur && indicateur.preuves.length > 0) {
          // Mettre à jour le statut si nécessaire
          if (indicateur.status === "A_EVALUER" || indicateur.status === "NON_CONFORME") {
            await prisma.indicateurConformite.update({
              where: { id: indicateur.id },
              data: {
                status: "EN_COURS",
                score: Math.min((indicateur.score || 0) + 20, 100),
                derniereEvaluation: new Date(),
              },
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      resume: {
        indicateursAnalyses: indicateursDb.length,
        preuvesManquantes: preuvesManquantes.length,
        preuvesGenerees: preuvesGenerees.length,
        preuvesAFournir: preuvesManquantes.filter((p) => !p.peutGenerer).length,
      },
      preuvesManquantes,
      preuvesGenerees,
      typesPreuvesDisponibles: Object.entries(TYPES_PREUVES_AUTO).map(
        ([key, value]) => ({
          type: key,
          ...value,
        })
      ),
    });
  } catch (error) {
    console.error("[API] POST /api/qualiopi/audit/generer-preuves error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Vérifier si les données sources existent pour générer une preuve
async function verifierSourcesDonnees(
  organizationId: string,
  typePreuve: string
): Promise<boolean> {
  switch (typePreuve) {
    case "REGISTRE_FORMATIONS": {
      const formations = await prisma.formation.count({
        where: { organizationId },
      });
      return formations > 0;
    }
    case "FICHES_PEDAGOGIQUES": {
      const fiches = await prisma.formation.count({
        where: {
          organizationId,
          fichePedagogiqueUrl: { not: null },
        },
      });
      return fiches > 0;
    }
    case "EVALUATIONS_AMONT": {
      const evaluations = await prisma.evaluationApprenant.count({
        where: {
          session: { formation: { organizationId } },
          type: "EVALUATION_PREALABLE",
        },
      });
      return evaluations > 0;
    }
    case "EMARGEMENTS": {
      const emargements = await prisma.emargement.count({
        where: { session: { formation: { organizationId } } },
      });
      return emargements > 0;
    }
    case "EVALUATIONS_ACQUIS": {
      const evaluations = await prisma.evaluationApprenant.count({
        where: {
          session: { formation: { organizationId } },
          type: { in: ["EVALUATION_FINALE", "EVALUATION_CONTINUE"] },
        },
      });
      return evaluations > 0;
    }
    case "SATISFACTION": {
      const satisfaction = await prisma.evaluationSatisfaction.count({
        where: { organizationId },
      });
      return satisfaction > 0;
    }
    case "CV_FORMATEURS": {
      const formateurs = await prisma.intervenant.count({
        where: {
          organizationId,
          cvUrl: { not: null },
        },
      });
      return formateurs > 0;
    }
    case "PROCEDURES_QUALITE": {
      const procedures = await prisma.procedure.count({
        where: { organizationId, isPublished: true },
      });
      return procedures > 0;
    }
    default:
      return false;
  }
}

// Générer une preuve automatiquement
async function genererPreuve(
  organizationId: string,
  indicateurId: string,
  numeroIndicateur: number,
  typePreuve: string,
  typeInfo: { nom: string; description: string }
): Promise<{ id: string; nom: string } | null> {
  try {
    // Créer l'entrée de preuve dans la base
    const dateStr = new Date().toISOString().split("T")[0];
    const nom = `${typeInfo.nom}_IND${numeroIndicateur.toString().padStart(2, "0")}_${dateStr}`;

    const preuve = await prisma.preuveQualiopi.create({
      data: {
        organizationId,
        indicateurId,
        numeroIndicateur,
        nom,
        type: typePreuve,
        description: `${typeInfo.description} - Généré automatiquement`,
        statut: "GENERE",
        dateCreation: new Date(),
        metadata: {
          genereAuto: true,
          dateGeneration: new Date().toISOString(),
          source: typePreuve,
        },
      },
    });

    return { id: preuve.id, nom: preuve.nom };
  } catch (error) {
    console.error(`Erreur génération preuve ${typePreuve}:`, error);
    return null;
  }
}
