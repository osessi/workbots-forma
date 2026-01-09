// ===========================================
// API CRÉDITS - Solde et Historique
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import {
  getCreditsBalance,
  getCreditHistory,
  formatCredits,
  getCreditStatusColor,
} from "@/lib/services/credits.service";

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

// GET - Récupérer le solde de crédits
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get("history") === "true";
    const historyLimit = parseInt(searchParams.get("limit") || "20");

    // Récupérer le solde
    const balance = await getCreditsBalance(dbUser.organizationId);

    // Formater pour l'affichage
    const response: {
      credits: number;
      creditsFormatted: string;
      creditsMonthly: number;
      creditsUsedThisMonth: number;
      creditsResetAt: Date;
      percentUsed: number;
      statusColor: "green" | "yellow" | "red";
      history?: Array<{
        id: string;
        type: string;
        amount: number;
        balanceAfter: number;
        description: string;
        createdAt: Date;
        user?: { name: string | null; email: string };
      }>;
    } = {
      ...balance,
      creditsFormatted: formatCredits(balance.credits),
      statusColor: getCreditStatusColor(balance.percentUsed),
    };

    // Ajouter l'historique si demandé
    if (includeHistory) {
      const { transactions } = await getCreditHistory(
        dbUser.organizationId,
        historyLimit
      );
      response.history = transactions;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur API crédits:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des crédits" },
      { status: 500 }
    );
  }
}
