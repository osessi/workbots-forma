"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Loader2,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  MessageSquare,
  FileText,
  Calendar,
  ChevronRight,
  Target,
  Sparkles,
  ArrowRight,
  Play,
} from "lucide-react";
import { toast } from "sonner";

// ===========================================
// TYPES
// ===========================================

interface DashboardData {
  scoreGlobal: number;
  indicateursConformes: number;
  indicateursTotal: number;
  indicateursParCritere: {
    critere: number;
    titre: string;
    score: number;
    conformes: number;
    total: number;
  }[];
  prochainAudit: {
    id: string;
    type: string;
    dateAudit: string;
    auditeur: string | null;
    joursRestants: number | null;
  } | null;
  alertesPrioritaires: {
    indicateur: number;
    message: string;
    priorite: string;
  }[];
  alertesNonLues: number;
  actionsEnCours: number;
  indicateursAttention: {
    numero: number;
    libelle: string;
    score: number;
    status: string;
    problemes: string[];
  }[];
  derniereConversation: {
    id: string;
    titre: string;
    updatedAt: string;
  } | null;
}

// ===========================================
// COMPOSANTS
// ===========================================

function ScoreCircle({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 80) return "#22C55E";
    if (score >= 60) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div className="relative w-32 h-32">
      <svg className="w-32 h-32 -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke={getColor(score)}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">
          {score}%
        </span>
      </div>
    </div>
  );
}

function CritereProgressBar({
  critere,
}: {
  critere: DashboardData["indicateursParCritere"][0];
}) {
  const getColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          C{critere.critere}. {critere.titre}
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          {critere.conformes}/{critere.total}
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(critere.score)} transition-all duration-500`}
          style={{ width: `${critere.score}%` }}
        />
      </div>
    </div>
  );
}

// ===========================================
// PAGE PRINCIPALE
// ===========================================

export default function QualiopiDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await fetch("/api/qualiopi/dashboard");
      if (!response.ok) throw new Error("Erreur de chargement");
      const result = await response.json();
      setData(result);
    } catch (error) {
      toast.error("Erreur lors du chargement du dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Erreur de chargement
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Impossible de charger les données Qualiopi
        </p>
        <button
          onClick={loadDashboard}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-7 w-7 text-blue-600" />
            Tableau de bord Qualiopi
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Suivez votre conformité au référentiel national qualité
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/automate/qualiopi/agent"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Sparkles className="h-4 w-4" />
            Agent IA
          </Link>
          <Link
            href="/automate/qualiopi/indicateurs"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <FileText className="h-4 w-4" />
            Indicateurs
          </Link>
        </div>
      </div>

      {/* Score global + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Score global */}
        <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
            Score global
          </h3>
          <ScoreCircle score={data.scoreGlobal} />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-green-600">
              {data.indicateursConformes}
            </span>{" "}
            / {data.indicateursTotal} indicateurs conformes
          </p>
        </div>

        {/* Stats cards */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Prochain audit */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Prochain audit
                </p>
                {data.prochainAudit ? (
                  <>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {data.prochainAudit.joursRestants} jours
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(data.prochainAudit.dateAudit).toLocaleDateString(
                        "fr-FR"
                      )}
                    </p>
                  </>
                ) : (
                  <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">
                    Non planifié
                  </p>
                )}
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          {/* Alertes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Alertes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {data.alertesNonLues}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  non lues
                </p>
              </div>
              <AlertTriangle
                className={`h-8 w-8 ${
                  data.alertesNonLues > 0 ? "text-amber-500" : "text-gray-400"
                }`}
              />
            </div>
          </div>

          {/* Actions en cours */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Actions
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {data.actionsEnCours}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  en cours
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Conformité par critère + Actions prioritaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conformité par critère */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Conformité par critère
            </h3>
            <Link
              href="/automate/qualiopi/indicateurs"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Voir tout <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {data.indicateursParCritere.map((critere) => (
              <CritereProgressBar key={critere.critere} critere={critere} />
            ))}
          </div>
        </div>

        {/* Actions prioritaires */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Indicateurs à traiter
            </h3>
            <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
              {data.indicateursAttention.length} prioritaires
            </span>
          </div>
          {data.indicateursAttention.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-300">
                Tous les indicateurs sont conformes !
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.indicateursAttention.map((ind) => (
                <Link
                  key={ind.numero}
                  href={`/automate/qualiopi/indicateurs/${ind.numero}`}
                  className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                          IND {ind.numero}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {ind.score}%
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                        {ind.libelle}
                      </p>
                      {ind.problemes.length > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {ind.problemes[0]}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Agent IA + Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent IA */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Agent IA Qualiopi
              </h3>
              <p className="text-white/80 text-sm mt-1">
                Posez vos questions sur la certification Qualiopi
              </p>
            </div>
          </div>

          {data.derniereConversation && (
            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <p className="text-xs text-white/60">Dernière conversation</p>
              <p className="text-sm font-medium mt-1">
                {data.derniereConversation.titre}
              </p>
            </div>
          )}

          <Link
            href="/automate/qualiopi/agent"
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-white text-purple-600 rounded-lg hover:bg-white/90 transition-colors font-medium"
          >
            <MessageSquare className="h-4 w-4" />
            Démarrer une conversation
          </Link>
        </div>

        {/* Simulation d'audit */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                Simulation d'audit
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Testez votre préparation avec une simulation
              </p>
            </div>
            <Play className="h-8 w-8 text-green-500" />
          </div>

          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              L'agent IA va analyser votre conformité et simuler un audit complet
              avec points forts, points à améliorer et recommandations.
            </p>
          </div>

          <Link
            href="/automate/qualiopi/audits"
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Lancer une simulation
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Alertes prioritaires */}
      {data.alertesPrioritaires.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
          <h3 className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5" />
            Alertes prioritaires
          </h3>
          <div className="space-y-2">
            {data.alertesPrioritaires.map((alerte, index) => (
              <Link
                key={index}
                href={`/automate/qualiopi/indicateurs/${alerte.indicateur}`}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded">
                    IND {alerte.indicateur}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {alerte.message}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
