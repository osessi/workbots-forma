// ===========================================
// API: INDICATEURS VALIDÉS QUALIOPI
// GET /api/qualiopi/indicateurs-valides - Liste des indicateurs conformes
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import {
  analyserConformiteOrganisation,
  initialiserIndicateursOrganisation,
  getIndicateur,
} from "@/lib/services/qualiopi";

export async function GET(request: NextRequest) {
  try {
    // Authentification
    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    const { data: { user } } = await supabase.auth.getUser();

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
    const result = await analyserConformiteOrganisation(organizationId);

    // Récupérer les preuves pour chaque indicateur
    const preuvesCount = await prisma.preuveIndicateur.groupBy({
      by: ["indicateurId"],
      where: {
        indicateur: {
          organizationId,
        },
      },
      _count: {
        id: true,
      },
    });

    // Récupérer les indicateurs de la BDD pour avoir les dates d'évaluation
    const indicateursDB = await prisma.indicateurConformite.findMany({
      where: { organizationId },
      select: {
        id: true,
        numeroIndicateur: true,
        derniereEvaluation: true,
      },
    });

    // Créer un map pour les preuves
    const preuvesMap = new Map<string, number>();
    preuvesCount.forEach((p) => {
      preuvesMap.set(p.indicateurId, p._count.id);
    });

    // Créer un map pour les dates d'évaluation
    const evaluationMap = new Map<number, { id: string; date: Date | null }>();
    indicateursDB.forEach((ind) => {
      evaluationMap.set(ind.numeroIndicateur, {
        id: ind.id,
        date: ind.derniereEvaluation,
      });
    });

    // Filtrer les indicateurs conformes avec les données enrichies
    const indicateursValides = result.analyses
      .filter((a) => a.status === "CONFORME")
      .map((a) => {
        const dbData = evaluationMap.get(a.numero);
        const indicateurRef = getIndicateur(a.numero);

        return {
          numero: a.numero,
          libelle: a.libelle,
          critere: a.critere,
          score: a.score,
          derniereEvaluation: dbData?.date?.toISOString() || null,
          preuvesCount: dbData?.id ? (preuvesMap.get(dbData.id) || 0) : 0,
          // Données RNQ V9
          niveauAttendu: indicateurRef?.niveauAttendu || "",
          nonConformite: indicateurRef?.nonConformite || { type: "majeure" },
        };
      })
      .sort((a, b) => a.numero - b.numero);

    return NextResponse.json({
      indicateursValides,
      indicateursConformes: result.score.indicateursConformes,
      indicateursTotal: result.score.indicateursTotal,
      scoreGlobal: result.score.scoreGlobal,
    });
  } catch (error) {
    console.error("[API] GET /api/qualiopi/indicateurs-valides error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
