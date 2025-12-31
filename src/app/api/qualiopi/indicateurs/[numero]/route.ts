// ===========================================
// API: INDICATEUR QUALIOPI SPÉCIFIQUE
// GET /api/qualiopi/indicateurs/[numero] - Détail d'un indicateur
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import {
  getIndicateur,
  getCritere,
  analyserIndicateurSpecifique,
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const { numero } = await params;
    const numeroInt = parseInt(numero);

    if (isNaN(numeroInt) || numeroInt < 1 || numeroInt > 32) {
      return NextResponse.json(
        { error: "Numéro d'indicateur invalide (1-32)" },
        { status: 400 }
      );
    }

    // Authentification
    const supabase = await getSupabaseClient();
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

    // Récupérer les données de référence
    const indicateurRef = getIndicateur(numeroInt);
    if (!indicateurRef) {
      return NextResponse.json(
        { error: "Indicateur non trouvé" },
        { status: 404 }
      );
    }

    const critereRef = getCritere(indicateurRef.critere);

    // Récupérer les données de la BDD
    const indicateurDB = await prisma.indicateurConformite.findUnique({
      where: {
        organizationId_numeroIndicateur: {
          organizationId,
          numeroIndicateur: numeroInt,
        },
      },
      include: {
        preuves: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            nom: true,
            description: true,
            documentId: true,
            sourceType: true,
            createdAt: true,
          },
        },
        actions: {
          orderBy: { createdAt: "desc" },
          include: {
            responsable: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Analyser l'indicateur avec l'IA
    const analyse = await analyserIndicateurSpecifique(organizationId, numeroInt);

    return NextResponse.json({
      // Données de référence
      numero: indicateurRef.numero,
      critere: {
        numero: critereRef?.numero,
        titre: critereRef?.titre,
        description: critereRef?.description,
      },
      libelle: indicateurRef.libelle,
      description: indicateurRef.description,
      exigences: indicateurRef.exigences,
      preuvesAttendues: indicateurRef.preuvesAttendues,
      sourcesVerification: indicateurRef.sourcesVerification,

      // État actuel
      status: indicateurDB?.status || "A_EVALUER",
      score: indicateurDB?.score || 0,
      derniereEvaluation: indicateurDB?.derniereEvaluation,
      prochainControle: indicateurDB?.prochainControle,
      notes: indicateurDB?.notes,

      // Preuves
      preuves: indicateurDB?.preuves || [],

      // Actions correctives
      actions: indicateurDB?.actions || [],

      // Analyse IA
      analyseIA: analyse.analyse,
      actionsRecommandees: analyse.actions,
    });
  } catch (error) {
    console.error("[API] GET /api/qualiopi/indicateurs/[numero] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// PATCH - Mettre à jour un indicateur
// ===========================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const { numero } = await params;
    const numeroInt = parseInt(numero);

    if (isNaN(numeroInt) || numeroInt < 1 || numeroInt > 32) {
      return NextResponse.json(
        { error: "Numéro d'indicateur invalide (1-32)" },
        { status: 400 }
      );
    }

    // Authentification
    const supabase = await getSupabaseClient();
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
    const body = await request.json();

    const { status, notes, prochainControle } = body;

    // Mettre à jour l'indicateur
    const indicateur = await prisma.indicateurConformite.update({
      where: {
        organizationId_numeroIndicateur: {
          organizationId,
          numeroIndicateur: numeroInt,
        },
      },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(prochainControle && { prochainControle: new Date(prochainControle) }),
        derniereEvaluation: new Date(),
      },
    });

    return NextResponse.json(indicateur);
  } catch (error) {
    console.error("[API] PATCH /api/qualiopi/indicateurs/[numero] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
