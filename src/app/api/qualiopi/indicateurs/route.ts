// ===========================================
// API: INDICATEURS QUALIOPI
// GET /api/qualiopi/indicateurs - Liste des indicateurs
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  INDICATEURS_QUALIOPI,
  CRITERES_QUALIOPI,
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

    // Paramètres de filtrage
    const { searchParams } = new URL(request.url);
    const critere = searchParams.get("critere");
    const status = searchParams.get("status");

    // Initialiser les indicateurs si nécessaire
    await initialiserIndicateursOrganisation(organizationId);

    // Analyser la conformité actuelle
    const { analyses } = await analyserConformiteOrganisation(organizationId);

    // Récupérer les indicateurs de la BDD avec les preuves et actions
    const indicateursDB = await prisma.indicateurConformite.findMany({
      where: { organizationId },
      include: {
        preuves: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        actions: {
          where: { status: { in: ["A_FAIRE", "EN_COURS"] } },
          take: 3,
        },
      },
    });

    // Combiner les données de référence avec l'analyse
    let indicateurs = INDICATEURS_QUALIOPI.map((ref) => {
      const analyse = analyses.find((a) => a.numero === ref.numero);
      const dbData = indicateursDB.find((i) => i.numeroIndicateur === ref.numero);

      return {
        numero: ref.numero,
        critere: ref.critere,
        libelle: ref.libelle,
        description: ref.description,
        exigences: ref.exigences,
        preuvesAttendues: ref.preuvesAttendues,
        // Données de conformité
        status: analyse?.status || "A_EVALUER",
        score: analyse?.score || 0,
        preuvesTrouvees: analyse?.preuvesTrouvees || [],
        problemes: analyse?.problemes || [],
        suggestions: analyse?.suggestions || [],
        // Données de la BDD
        derniereEvaluation: dbData?.derniereEvaluation,
        prochainControle: dbData?.prochainControle,
        notes: dbData?.notes,
        preuvesCount: dbData?.preuves.length || 0,
        actionsEnCours: dbData?.actions.length || 0,
      };
    });

    // Filtrer par critère si demandé
    if (critere) {
      indicateurs = indicateurs.filter((i) => i.critere === parseInt(critere));
    }

    // Filtrer par statut si demandé
    if (status) {
      indicateurs = indicateurs.filter((i) => i.status === status);
    }

    // Ajouter les informations des critères
    const criteres = CRITERES_QUALIOPI.map((c) => ({
      ...c,
      indicateursCount: indicateurs.filter((i) => i.critere === c.numero).length,
      conformesCount: indicateurs.filter(
        (i) => i.critere === c.numero && i.status === "CONFORME"
      ).length,
    }));

    return NextResponse.json({
      indicateurs,
      criteres,
      total: indicateurs.length,
      conformes: indicateurs.filter((i) => i.status === "CONFORME").length,
    });
  } catch (error) {
    console.error("[API] GET /api/qualiopi/indicateurs error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
