// ===========================================
// API Route: GET /api/workbots/status
// Check status of Workbots Slides generation
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Get user
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const formationId = searchParams.get("formationId");
    const generationId = searchParams.get("generationId");

    // Build query
    const whereClause: {
      userId: string;
      formationId?: string;
      id?: string;
    } = {
      userId: dbUser.id,
    };

    if (formationId) {
      whereClause.formationId = formationId;
    }

    if (generationId) {
      whereClause.id = generationId;
    }

    // Fetch generations
    const generations = await prisma.slideGeneration.findMany({
      where: whereClause,
      orderBy: { startedAt: "desc" },
      take: 50,
    });

    // Group by status
    const active = generations.filter(
      (g) =>
        g.status === "PENDING" ||
        g.status === "ENRICHMENT" ||
        g.status === "GENERATING" ||
        g.status === "FINALIZING"
    );

    const completed = generations.filter((g) => g.status === "COMPLETED");

    // Only show failed from last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const failed = generations.filter(
      (g) => g.status === "FAILED" && new Date(g.startedAt) > oneHourAgo
    );

    // Mark stale generations as failed (no update in 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    for (const gen of active) {
      if (new Date(gen.updatedAt) < fiveMinutesAgo) {
        await prisma.slideGeneration.update({
          where: { id: gen.id },
          data: {
            status: "FAILED",
            errorMessage: "Génération expirée (timeout)",
            completedAt: new Date(),
          },
        });
      }
    }

    // Format response
    const formatGeneration = (g: typeof generations[0]) => ({
      id: g.id,
      formationId: g.formationId,
      status: g.status,
      progress: g.progress,
      currentPhase: g.currentPhase,
      currentModuleIndex: g.currentModuleIndex,
      currentModuleName: g.currentModuleName,
      themeId: g.themeId,
      themeName: g.themeName,
      tone: g.tone,
      cardsPerModule: g.cardsPerModule,
      errorMessage: g.errorMessage,
      moduleResults: g.moduleResults,
      startedAt: g.startedAt.toISOString(),
      completedAt: g.completedAt?.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
    });

    return NextResponse.json({
      active: active.map(formatGeneration),
      completed: completed.slice(0, 10).map(formatGeneration),
      failed: failed.map(formatGeneration),
    });
  } catch (error) {
    console.error("Error in /api/workbots/status:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération du statut",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
