"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Target,
  Sparkles,
  ChevronRight,
  Plus,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

// ===========================================
// TYPES
// ===========================================

interface IndicateurDetail {
  numero: number;
  critere: {
    numero: number;
    titre: string;
    description: string;
  };
  libelle: string;
  description: string;
  exigences: string[];
  preuvesAttendues: string[];
  sourcesVerification: {
    type: string;
    champs?: string[];
    description: string;
  }[];
  status: string;
  score: number;
  derniereEvaluation: string | null;
  prochainControle: string | null;
  notes: string | null;
  preuves: {
    id: string;
    type: string;
    nom: string;
    description: string | null;
    createdAt: string;
  }[];
  actions: {
    id: string;
    titre: string;
    description: string | null;
    priorite: string;
    status: string;
    dateEcheance: string | null;
    responsable: {
      id: string;
      firstName: string | null;
      lastName: string | null;
    } | null;
  }[];
  analyseIA: string;
  actionsRecommandees: string[];
}

// ===========================================
// COMPOSANTS
// ===========================================

function StatusBadge({ status, score }: { status: string; score: number }) {
  const config: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    CONFORME: {
      label: "Conforme",
      color: "text-green-700 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      icon: CheckCircle2,
    },
    NON_CONFORME: {
      label: "Non conforme",
      color: "text-red-700 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      icon: XCircle,
    },
    EN_COURS: {
      label: "En cours",
      color: "text-blue-700 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      icon: Clock,
    },
    A_EVALUER: {
      label: "À évaluer",
      color: "text-gray-700 dark:text-gray-300",
      bgColor: "bg-gray-100 dark:bg-gray-700",
      icon: AlertTriangle,
    },
  };

  const { label, color, bgColor, icon: Icon } = config[status] || config.A_EVALUER;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${bgColor}`}>
      <Icon className={`h-6 w-6 ${color}`} />
      <div>
        <p className={`font-semibold ${color}`}>{label}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Score: {score}%</p>
      </div>
    </div>
  );
}

function PreuveCard({ preuve }: { preuve: IndicateurDetail["preuves"][0] }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white text-sm">
          {preuve.nom}
        </p>
        {preuve.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {preuve.description}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {new Date(preuve.createdAt).toLocaleDateString("fr-FR")}
        </p>
      </div>
      <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
        {preuve.type}
      </span>
    </div>
  );
}

function ActionCard({ action }: { action: IndicateurDetail["actions"][0] }) {
  const prioriteColors: Record<string, string> = {
    CRITIQUE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    HAUTE: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    MOYENNE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    BASSE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <Target className="h-5 w-5 text-purple-500 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-gray-900 dark:text-white text-sm">
            {action.titre}
          </p>
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              prioriteColors[action.priorite] || prioriteColors.MOYENNE
            }`}
          >
            {action.priorite}
          </span>
        </div>
        {action.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {action.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          {action.dateEcheance && (
            <span>
              Échéance: {new Date(action.dateEcheance).toLocaleDateString("fr-FR")}
            </span>
          )}
          {action.responsable && (
            <span>
              {action.responsable.firstName} {action.responsable.lastName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================
// PAGE PRINCIPALE
// ===========================================

export default function IndicateurDetailPage() {
  const router = useRouter();
  const params = useParams();
  const numero = parseInt(params.numero as string);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<IndicateurDetail | null>(null);
  const [showAnalyse, setShowAnalyse] = useState(false);

  useEffect(() => {
    if (!isNaN(numero) && numero >= 1 && numero <= 32) {
      loadIndicateur();
    } else {
      router.push("/automate/qualiopi/indicateurs");
    }
  }, [numero]);

  const loadIndicateur = async () => {
    try {
      const response = await fetch(`/api/qualiopi/indicateurs/${numero}`);
      if (!response.ok) throw new Error("Erreur de chargement");
      const result = await response.json();
      setData(result);
    } catch (error) {
      toast.error("Erreur lors du chargement de l'indicateur");
      router.push("/automate/qualiopi/indicateurs");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push("/automate/qualiopi/indicateurs")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mt-1"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                Indicateur {data.numero}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Critère {data.critere.numero}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.libelle}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
              {data.description}
            </p>
          </div>
        </div>
      </div>

      {/* Status et navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatusBadge status={data.status} score={data.score} />

        <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <Clock className="h-6 w-6 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Dernière évaluation</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {data.derniereEvaluation
                ? new Date(data.derniereEvaluation).toLocaleDateString("fr-FR")
                : "Non évalué"}
            </p>
          </div>
        </div>

        <Link
          href={`/automate/qualiopi/agent?indicateur=${numero}`}
          className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6" />
            <div>
              <p className="font-medium">Demander à l'agent IA</p>
              <p className="text-xs text-white/80">Obtenir de l'aide</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exigences */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Exigences du référentiel
          </h2>
          <ul className="space-y-2">
            {data.exigences.map((exigence, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{exigence}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Preuves attendues */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Preuves attendues
          </h2>
          <ul className="space-y-2">
            {data.preuvesAttendues.map((preuve, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <FileText className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{preuve}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Preuves fournies */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Preuves fournies ({data.preuves.length})
          </h2>
          <button className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700">
            <Plus className="h-4 w-4" />
            Ajouter une preuve
          </button>
        </div>

        {data.preuves.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucune preuve fournie</p>
            <p className="text-sm mt-1">
              Ajoutez des preuves pour démontrer votre conformité
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.preuves.map((preuve) => (
              <PreuveCard key={preuve.id} preuve={preuve} />
            ))}
          </div>
        )}
      </div>

      {/* Actions correctives */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Actions correctives ({data.actions.length})
          </h2>
          <button className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700">
            <Plus className="h-4 w-4" />
            Nouvelle action
          </button>
        </div>

        {data.actions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucune action en cours</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.actions.map((action) => (
              <ActionCard key={action.id} action={action} />
            ))}
          </div>
        )}
      </div>

      {/* Analyse IA */}
      <div className="mt-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
        <button
          onClick={() => setShowAnalyse(!showAnalyse)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Analyse IA
            </h2>
          </div>
          <ChevronRight
            className={`h-5 w-5 text-gray-400 transition-transform ${
              showAnalyse ? "rotate-90" : ""
            }`}
          />
        </button>

        {showAnalyse && (
          <div className="mt-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{data.analyseIA}</ReactMarkdown>
            </div>

            {data.actionsRecommandees.length > 0 && (
              <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Actions recommandées
                </h3>
                <ul className="space-y-1">
                  {data.actionsRecommandees.map((action, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <Target className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation vers indicateurs adjacents */}
      <div className="mt-6 flex items-center justify-between">
        {numero > 1 ? (
          <Link
            href={`/automate/qualiopi/indicateurs/${numero - 1}`}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Indicateur {numero - 1}
          </Link>
        ) : (
          <div />
        )}

        {numero < 32 && (
          <Link
            href={`/automate/qualiopi/indicateurs/${numero + 1}`}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Indicateur {numero + 1}
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
