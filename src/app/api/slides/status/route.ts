// ===========================================
// API SLIDES - Statut des générations
// Permet de vérifier les générations en cours/terminées
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// Timeout pour considérer une génération comme "stale" (5 minutes sans mise à jour)
const STALE_TIMEOUT_MS = 5 * 60 * 1000;

// GET - Récupérer les générations en cours et notifications
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
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

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Récupérer le paramètre formationId optionnel
    const { searchParams } = new URL(request.url);
    const formationId = searchParams.get("formationId");

    // Requête de base pour les générations de l'utilisateur
    const whereClause = {
      userId: user.id,
      ...(formationId && { formationId }),
    };

    // D'abord, marquer les générations "stale" comme échouées
    // (pas mises à jour depuis plus de 5 minutes et toujours en cours)
    const staleThreshold = new Date(Date.now() - STALE_TIMEOUT_MS);
    await prisma.slideGeneration.updateMany({
      where: {
        ...whereClause,
        status: {
          in: ["PENDING", "ENRICHMENT", "GENERATING", "FINALIZING"],
        },
        updatedAt: {
          lt: staleThreshold,
        },
      },
      data: {
        status: "FAILED",
        errorMessage: "Génération interrompue (timeout). Veuillez relancer la génération.",
      },
    });

    // Récupérer les générations en cours (non-stale)
    const activeGenerations = await prisma.slideGeneration.findMany({
      where: {
        ...whereClause,
        status: {
          in: ["PENDING", "ENRICHMENT", "GENERATING", "FINALIZING"],
        },
      },
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    // Récupérer les générations terminées récemment (dernières 24h) pour notifications
    const recentlyCompleted = await prisma.slideGeneration.findMany({
      where: {
        ...whereClause,
        status: "COMPLETED",
        completedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Dernières 24h
        },
      },
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
      },
      orderBy: { completedAt: "desc" },
      take: 10,
    });

    // Récupérer les générations échouées récentes (dernières 1h seulement)
    // Pour ne pas polluer l'interface avec de vieilles erreurs
    const recentlyFailed = await prisma.slideGeneration.findMany({
      where: {
        ...whereClause,
        status: "FAILED",
        updatedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // 1 heure au lieu de 24h
        },
      },
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 3, // Limiter à 3 erreurs max
    });

    return NextResponse.json({
      active: activeGenerations.map((g) => ({
        id: g.id,
        formationId: g.formationId,
        formationTitre: g.formation?.titre || "Formation",
        status: g.status,
        progress: g.progress,
        currentPhase: g.currentPhase,
        currentModuleIndex: g.currentModuleIndex,
        currentModuleName: g.currentModuleName,
        startedAt: g.startedAt,
      })),
      completed: recentlyCompleted.map((g) => ({
        id: g.id,
        formationId: g.formationId,
        formationTitre: g.formation?.titre || "Formation",
        completedAt: g.completedAt,
        moduleResults: g.moduleResults,
      })),
      failed: recentlyFailed.map((g) => ({
        id: g.id,
        formationId: g.formationId,
        formationTitre: g.formation?.titre || "Formation",
        errorMessage: g.errorMessage,
        updatedAt: g.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Erreur récupération statut slides:", error);
    return NextResponse.json(
      { error: "Erreur serveur", message: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une notification (marquer comme vue)
export async function DELETE(request: NextRequest) {
  try {
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

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const generationId = searchParams.get("id");

    if (!generationId) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    // Vérifier que c'est bien une génération de l'utilisateur
    const generation = await prisma.slideGeneration.findFirst({
      where: {
        id: generationId,
        userId: user.id,
      },
    });

    if (!generation) {
      return NextResponse.json({ error: "Génération non trouvée" }, { status: 404 });
    }

    // Supprimer (ou on pourrait juste la marquer comme "vue")
    await prisma.slideGeneration.delete({
      where: { id: generationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression notification:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
