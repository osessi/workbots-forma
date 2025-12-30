// ===========================================
// API: STATISTIQUES DES AUTOMATISATIONS
// GET /api/automatisations/stats - Dashboard stats
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WorkflowDashboardData, WorkflowStats } from "@/types/workflow";

// ===========================================
// GET - Statistiques du dashboard
// ===========================================

export async function GET(request: NextRequest) {
  try {
    // Authentification
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer l'utilisateur avec son organisation
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const organizationId = dbUser.organizationId;

    // Stats globales des workflows
    const [
      totalWorkflows,
      workflowsActifs,
      totalExecutions,
      executionsParStatut,
      tempsExecutionStats,
    ] = await Promise.all([
      // Total workflows
      prisma.workflow.count({
        where: { organizationId },
      }),

      // Workflows actifs
      prisma.workflow.count({
        where: { organizationId, actif: true },
      }),

      // Total exécutions
      prisma.workflowExecution.count({
        where: {
          workflow: { organizationId },
        },
      }),

      // Exécutions par statut
      prisma.workflowExecution.groupBy({
        by: ["statut"],
        where: {
          workflow: { organizationId },
        },
        _count: true,
      }),

      // Temps d'exécution moyen (exécutions terminées)
      prisma.workflowExecution.findMany({
        where: {
          workflow: { organizationId },
          statut: "TERMINEE",
          finAt: { not: null },
        },
        select: {
          debutAt: true,
          finAt: true,
        },
        take: 100,
        orderBy: { debutAt: "desc" },
      }),
    ]);

    // Calculer les stats par statut
    const statsParStatut = executionsParStatut.reduce((acc, s) => {
      acc[s.statut] = s._count;
      return acc;
    }, {} as Record<string, number>);

    const executionsReussies = statsParStatut["TERMINEE"] || 0;
    const executionsEchouees = statsParStatut["ERREUR"] || 0;
    const executionsEnCours = (statsParStatut["EN_COURS"] || 0) + (statsParStatut["EN_ATTENTE"] || 0) + (statsParStatut["PAUSE"] || 0);

    // Calculer le temps moyen d'exécution
    let tempsExecutionMoyen = 0;
    if (tempsExecutionStats.length > 0) {
      const totalDuree = tempsExecutionStats.reduce((acc, exec) => {
        if (exec.finAt) {
          return acc + (exec.finAt.getTime() - exec.debutAt.getTime());
        }
        return acc;
      }, 0);
      tempsExecutionMoyen = Math.round(totalDuree / tempsExecutionStats.length / 1000);
    }

    // Taux de réussite
    const tauxReussite = totalExecutions > 0
      ? Math.round((executionsReussies / totalExecutions) * 100)
      : 0;

    const stats: WorkflowStats = {
      totalWorkflows,
      workflowsActifs,
      totalExecutions,
      executionsReussies,
      executionsEchouees,
      executionsEnCours,
      tauxReussite,
      tempsExecutionMoyen,
    };

    // Exécutions récentes
    const executionsRecentes = await prisma.workflowExecution.findMany({
      where: {
        workflow: { organizationId },
      },
      include: {
        workflow: {
          select: { nom: true },
        },
      },
      orderBy: { debutAt: "desc" },
      take: 10,
    });

    const executionsRecentesFormatted = executionsRecentes.map((exec) => ({
      id: exec.id,
      workflowId: exec.workflowId,
      workflowNom: exec.workflow.nom,
      statut: exec.statut,
      progression: exec.progression,
      declencheurType: exec.declencheurType || "",
      debutAt: exec.debutAt,
      finAt: exec.finAt || undefined,
      duree: exec.finAt
        ? Math.round((exec.finAt.getTime() - exec.debutAt.getTime()) / 1000)
        : undefined,
      erreur: exec.erreur || undefined,
    }));

    // Workflows populaires (par nombre d'exécutions)
    const workflowsPopulaires = await prisma.workflow.findMany({
      where: { organizationId },
      select: {
        id: true,
        nom: true,
        nombreExecutions: true,
        nombreErreurs: true,
      },
      orderBy: { nombreExecutions: "desc" },
      take: 5,
    });

    const workflowsPopulairesFormatted = workflowsPopulaires.map((w) => ({
      id: w.id,
      nom: w.nom,
      nombreExecutions: w.nombreExecutions,
      tauxReussite: w.nombreExecutions > 0
        ? Math.round(((w.nombreExecutions - w.nombreErreurs) / w.nombreExecutions) * 100)
        : 0,
    }));

    // Activité par jour (7 derniers jours)
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const executionsParJour = await prisma.workflowExecution.findMany({
      where: {
        workflow: { organizationId },
        debutAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        debutAt: true,
        statut: true,
      },
    });

    // Grouper par jour
    const activiteParJourMap = new Map<string, { executions: number; reussites: number; echecs: number }>();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      activiteParJourMap.set(dateStr, { executions: 0, reussites: 0, echecs: 0 });
    }

    for (const exec of executionsParJour) {
      const dateStr = exec.debutAt.toISOString().split("T")[0];
      const day = activiteParJourMap.get(dateStr);
      if (day) {
        day.executions++;
        if (exec.statut === "TERMINEE") day.reussites++;
        if (exec.statut === "ERREUR") day.echecs++;
      }
    }

    const activiteParJour = Array.from(activiteParJourMap.entries())
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .reverse();

    // Construire la réponse
    const dashboardData: WorkflowDashboardData = {
      stats,
      executionsRecentes: executionsRecentesFormatted,
      workflowsPopulaires: workflowsPopulairesFormatted,
      activiteParJour,
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error("[API] GET /api/automatisations/stats error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
