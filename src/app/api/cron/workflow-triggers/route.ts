// ===========================================
// API: CRON pour les déclencheurs de workflows
// GET /api/cron/workflow-triggers
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { runDailyTriggerChecks } from "@/lib/services/workflow-triggers";

// Clé secrète pour sécuriser l'endpoint CRON
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Endpoint pour exécuter les vérifications quotidiennes des workflows
 * À appeler via un service CRON externe (ex: Vercel Cron, Railway, etc.)
 *
 * Configuration recommandée: tous les jours à 8h00 UTC
 *
 * Exemple de configuration Vercel (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/workflow-triggers",
 *     "schedule": "0 8 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'autorisation
    const authHeader = request.headers.get("authorization");

    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[CRON] Starting workflow trigger checks...");

    // Exécuter les vérifications
    await runDailyTriggerChecks();

    console.log("[CRON] Workflow trigger checks completed");

    return NextResponse.json({
      success: true,
      message: "Workflow trigger checks completed",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[CRON] Error running workflow trigger checks:", error);

    return NextResponse.json(
      {
        error: "Failed to run trigger checks",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Permettre aussi les appels POST pour certains services CRON
export async function POST(request: NextRequest) {
  return GET(request);
}
