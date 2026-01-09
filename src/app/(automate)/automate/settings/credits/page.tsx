"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, TrendingDown, TrendingUp, Clock, RefreshCw } from "lucide-react";

// Types
interface CreditData {
  credits: number;
  creditsFormatted: string;
  creditsMonthly: number;
  creditsUsedThisMonth: number;
  creditsResetAt: string;
  percentUsed: number;
  statusColor: "green" | "yellow" | "red";
  history?: CreditTransaction[];
}

interface CreditTransaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  user?: { name: string | null; email: string };
}

// Helpers
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatCredits = (credits: number): string => {
  if (credits >= 1000000) {
    return `${(credits / 1000000).toFixed(1)}M`;
  }
  if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}k`;
  }
  return credits.toLocaleString("fr-FR");
};

const getTransactionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    USAGE: "Utilisation",
    MONTHLY_RESET: "Reset mensuel",
    PURCHASE: "Achat",
    BONUS: "Bonus",
    ADJUSTMENT: "Ajustement",
    REFUND: "Remboursement",
  };
  return labels[type] || type;
};

const getTransactionTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    USAGE: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20",
    MONTHLY_RESET: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20",
    PURCHASE: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20",
    BONUS: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20",
    ADJUSTMENT: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20",
    REFUND: "text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-900/20",
  };
  return colors[type] || "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800";
};

export default function CreditsPage() {
  const [creditData, setCreditData] = useState<CreditData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/credits?history=true&limit=50");
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data = await res.json();
      setCreditData(data);
      setError(null);
    } catch (err) {
      setError("Impossible de charger les crédits");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const daysUntilReset = creditData
    ? Math.ceil((new Date(creditData.creditsResetAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error || !creditData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
            <p className="text-red-600 dark:text-red-400">{error || "Erreur inconnue"}</p>
            <button
              onClick={fetchCredits}
              className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/automate/settings"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Crédits IA
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Suivi de votre consommation de crédits d&apos;intelligence artificielle
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Main Balance Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${
                creditData.statusColor === "green"
                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : creditData.statusColor === "yellow"
                    ? "bg-amber-100 dark:bg-amber-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
              }`}>
                <Sparkles className={`w-8 h-8 ${
                  creditData.statusColor === "green"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : creditData.statusColor === "yellow"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                }`} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Solde actuel</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white">
                  {formatCredits(creditData.credits)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  sur {formatCredits(creditData.creditsMonthly)} crédits mensuels
                </p>
              </div>
            </div>
            <button
              onClick={fetchCredits}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Actualiser"
            >
              <RefreshCw className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500 dark:text-gray-400">
                Utilisés ce mois
              </span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {formatCredits(creditData.creditsUsedThisMonth)} ({creditData.percentUsed}%)
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  creditData.statusColor === "green"
                    ? "bg-emerald-500"
                    : creditData.statusColor === "yellow"
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${Math.min(creditData.percentUsed, 100)}%` }}
              />
            </div>
          </div>

          {/* Reset Info */}
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>
              Renouvellement dans <strong className="text-gray-700 dark:text-gray-300">{daysUntilReset} jours</strong>
              {" "}(le {new Date(creditData.creditsResetAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })})
            </span>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Historique des transactions
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Les 50 dernières opérations sur vos crédits
            </p>
          </div>

          {creditData.history && creditData.history.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {creditData.history.map((transaction) => (
                <div
                  key={transaction.id}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        transaction.amount > 0
                          ? "bg-emerald-100 dark:bg-emerald-900/30"
                          : "bg-red-100 dark:bg-red-900/30"
                      }`}>
                        {transaction.amount > 0 ? (
                          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {transaction.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTransactionTypeColor(transaction.type)}`}>
                            {getTransactionTypeLabel(transaction.type)}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {formatDate(transaction.createdAt)}
                          </span>
                          {transaction.user && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              • {transaction.user.name || transaction.user.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${
                        transaction.amount > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}>
                        {transaction.amount > 0 ? "+" : ""}{formatCredits(transaction.amount)}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Solde: {formatCredits(transaction.balanceAfter)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Sparkles className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Aucune transaction pour le moment
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Vos transactions apparaîtront ici lorsque vous utiliserez l&apos;IA
              </p>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-br from-brand-50 to-brand-100/50 dark:from-brand-900/20 dark:to-brand-800/10 rounded-2xl border border-brand-200 dark:border-brand-800/30 p-6">
          <h3 className="text-lg font-semibold text-brand-900 dark:text-brand-100">
            Comment fonctionnent les crédits ?
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-brand-700 dark:text-brand-300">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 flex-shrink-0" />
              <span>Chaque génération IA (fiches, évaluations, slides...) consomme des crédits</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 flex-shrink-0" />
              <span>Le coût varie selon la complexité de la génération (150 à 1500 crédits)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 flex-shrink-0" />
              <span>Vos crédits sont renouvelés automatiquement chaque mois selon votre plan</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 flex-shrink-0" />
              <span>Besoin de plus de crédits ? Contactez-nous pour augmenter votre quota</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
