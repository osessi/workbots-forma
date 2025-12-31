// ===========================================
// API: RECALCULER LES INDICATEURS QUALIOPI
// POST /api/qualiopi/indicateurs/calculer - Force le recalcul
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

    // Réinitialiser tous les indicateurs
    await initialiserIndicateursOrganisation(organizationId);

    // Recalculer la conformité
    const { score, analyses, alertes } = await analyserConformiteOrganisation(
      organizationId
    );

    // Mettre à jour les indicateurs dans la base
    for (const analyse of analyses) {
      await prisma.indicateurConformite.update({
        where: {
          organizationId_numeroIndicateur: {
            organizationId,
            numeroIndicateur: analyse.numero,
          },
        },
        data: {
          status: analyse.status,
          score: analyse.score,
          derniereEvaluation: new Date(),
        },
      });
    }

    // Créer des alertes si nécessaire
    const alertesCritiques = alertes.filter(
      (a) => a.priorite === "CRITIQUE" || a.priorite === "HAUTE"
    );

    for (const alerte of alertesCritiques) {
      // Vérifier si une alerte similaire existe déjà
      const existingAlerte = await prisma.alerteQualiopi.findFirst({
        where: {
          organizationId,
          indicateur: alerte.indicateur,
          estResolue: false,
        },
      });

      if (!existingAlerte) {
        await prisma.alerteQualiopi.create({
          data: {
            organizationId,
            type: "NON_CONFORMITE",
            priorite: alerte.priorite === "CRITIQUE" ? "CRITIQUE" : "HAUTE",
            titre: `Indicateur ${alerte.indicateur} non conforme`,
            message: alerte.message,
            indicateur: alerte.indicateur,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      score: {
        global: score.scoreGlobal,
        conformes: score.indicateursConformes,
        total: score.indicateursTotal,
      },
      alertesCreees: alertesCritiques.length,
      dateCalcul: new Date().toISOString(),
      resume: {
        conformes: analyses.filter((a) => a.status === "CONFORME").length,
        enCours: analyses.filter((a) => a.status === "EN_COURS").length,
        nonConformes: analyses.filter((a) => a.status === "NON_CONFORME").length,
        aEvaluer: analyses.filter((a) => a.status === "A_EVALUER").length,
      },
    });
  } catch (error) {
    console.error("[API] POST /api/qualiopi/indicateurs/calculer error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
