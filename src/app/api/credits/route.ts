// ===========================================
// API CRÉDITS - Solde et Historique
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";
import {
  getCreditsBalance,
  getCreditHistory,
  formatCredits,
  getCreditStatusColor,
  hasUnlimitedCredits,
} from "@/lib/services/credits.service";

// GET - Récupérer le solde de crédits
export async function GET(request: NextRequest) {
  try {
    // Authentification
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get("history") === "true";
    const historyLimit = parseInt(searchParams.get("limit") || "20");

    // Vérifier si crédits illimités
    const isUnlimited = await hasUnlimitedCredits(user.organizationId);

    // Récupérer le solde
    const balance = await getCreditsBalance(user.organizationId);

    // Formater pour l'affichage
    const response: {
      credits: number;
      creditsFormatted: string;
      creditsMonthly: number;
      creditsUsedThisMonth: number;
      creditsResetAt: Date;
      percentUsed: number;
      statusColor: "green" | "yellow" | "red";
      isUnlimited: boolean;
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
      creditsFormatted: isUnlimited ? "∞" : formatCredits(balance.credits),
      statusColor: isUnlimited ? "green" : getCreditStatusColor(balance.percentUsed),
      isUnlimited,
    };

    // Ajouter l'historique si demandé
    if (includeHistory) {
      const { transactions } = await getCreditHistory(
        user.organizationId,
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
