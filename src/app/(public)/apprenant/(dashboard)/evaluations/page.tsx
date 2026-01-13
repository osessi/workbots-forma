"use client";

// ===========================================
// CORRECTIONS 442-456: Page "Évaluations"
// ===========================================
// 442-446: Onglet Progression
// 447-450: Onglet QCM & Ateliers
// 451-456: Onglet Satisfaction avec nouvelles tuiles et cartes

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import {
  Star,
  CheckCircle2,
  Clock,
  Play,
  AlertCircle,
  Loader2,
  FileQuestion,
  Target,
  ThermometerSun,
  Snowflake,
  Lock,
  TrendingUp,
  ClipboardCheck,
  Calendar,
  Eye,
  Wrench,
  BookOpen,
  Check,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

// =====================================
// TYPES
// =====================================

// Types pour QCM & Ateliers
interface EvaluationQCMAtelier {
  id: string;
  titre: string;
  type: "QCM_MODULE" | "ATELIER_MODULE";
  description: string | null;
  dureeEstimee: number | null;
  scoreMinimum: number | null;
  ordre: number;
  module: {
    id: string;
    titre: string;
    ordre: number;
  } | null;
  statut: "a_faire" | "en_cours" | "termine";
  resultat: {
    id: string;
    status: string;
    score: number | null;
    datePassage: string | null;
    tempsTotal: number | null;
  } | null;
}

interface EvaluationsQCMAtelierData {
  evaluations: EvaluationQCMAtelier[];
  stats: {
    total: number;
    aFaire: number;
    enCours: number;
    terminees: number;
  };
}

// Corrections 451-455: Types mis à jour pour Satisfaction
interface EvaluationSatisfaction {
  id: string | null;
  token: string | null;
  type: "CHAUD" | "FROID";
  titre: string;
  description: string;
  statut: "a_venir" | "disponible" | "complete";
  isAvailable: boolean;
  dateOuverture: string | null;
  dateCompletion: string | null;
  score: number | null;
  formationTitre: string | null;
}

interface EvaluationsSatisfactionData {
  evaluations: EvaluationSatisfaction[];
  stats: {
    total: number;
    disponibles: number;
    aFaire: number;
    completees: number;
  };
  session: {
    id: string;
    reference: string;
    nom: string | null;
    dateDebut: string | null;
    dateFin: string | null;
    formationTitre: string;
  } | null;
}

// Types pour Progression
interface EvaluationProgression {
  id: string;
  type: "positionnement" | "finale";
  titre: string;
  description: string;
  statut: "a_venir" | "disponible" | "complete";
  dateOuverture: string | null;
  dateCompletion: string | null;
  score: number | null;
  canAccess: boolean;
  evaluationId: string | null;
}

interface EvaluationsProgressionData {
  evaluations: EvaluationProgression[];
  stats: {
    total: number;
    disponibles: number;
    enAttente: number;
    completees: number;
  };
  session: {
    id: string;
    reference: string;
    nom: string | null;
    dateDebut: string | null;
    dateFin: string | null;
    formationTitre: string;
  } | null;
}

// =====================================
// COMPOSANT EVALUATION QCM/ATELIER CARD
// =====================================

function EvaluationQCMAtelierCard({
  evaluation,
  index,
  onMarkComplete,
  isMarking,
}: {
  evaluation: EvaluationQCMAtelier;
  index: number;
  onMarkComplete: (id: string) => void;
  isMarking: boolean;
}) {
  const isQCM = evaluation.type === "QCM_MODULE";
  const TypeIcon = isQCM ? FileQuestion : Wrench;

  const getStatusConfig = () => {
    switch (evaluation.statut) {
      case "termine":
        return {
          badge: isQCM && evaluation.resultat?.score !== null
            ? `${Math.round(evaluation.resultat.score)}%`
            : "Terminé",
          badgeClass: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400",
          cardBorder: "border-green-200 dark:border-green-500/30",
          iconBg: "bg-green-100 dark:bg-green-500/20",
          iconColor: "text-green-600 dark:text-green-400",
        };
      case "en_cours":
        return {
          badge: "En cours",
          badgeClass: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400",
          cardBorder: "border-blue-200 dark:border-blue-500/30",
          iconBg: isQCM ? "bg-brand-100 dark:bg-brand-500/20" : "bg-amber-100 dark:bg-amber-500/20",
          iconColor: isQCM ? "text-brand-600 dark:text-brand-400" : "text-amber-600 dark:text-amber-400",
        };
      default:
        return {
          badge: "À faire",
          badgeClass: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
          cardBorder: "border-gray-200 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500",
          iconBg: isQCM ? "bg-brand-100 dark:bg-brand-500/20" : "bg-amber-100 dark:bg-amber-500/20",
          iconColor: isQCM ? "text-brand-600 dark:text-brand-400" : "text-amber-600 dark:text-amber-400",
        };
    }
  };

  const config = getStatusConfig();

  const renderActionButton = () => {
    if (isQCM) {
      if (evaluation.statut === "termine") {
        return (
          <Link
            href={`/apprenant/evaluations/${evaluation.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Voir mes résultats
          </Link>
        );
      } else {
        return (
          <Link
            href={`/apprenant/evaluations/${evaluation.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white transition-colors"
          >
            <Play className="w-4 h-4" />
            {evaluation.statut === "en_cours" ? "Reprendre" : "Compléter"}
          </Link>
        );
      }
    } else {
      if (evaluation.statut === "termine") {
        return (
          <Link
            href={`/apprenant/evaluations/${evaluation.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Consulter
          </Link>
        );
      } else {
        return (
          <div className="flex items-center gap-2">
            <Link
              href={`/apprenant/evaluations/${evaluation.id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white transition-colors"
            >
              <Eye className="w-4 h-4" />
              {evaluation.statut === "en_cours" ? "Reprendre" : "Voir l'atelier"}
            </Link>
            <button
              onClick={() => onMarkComplete(evaluation.id)}
              disabled={isMarking}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMarking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Terminé
            </button>
          </div>
        );
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white dark:bg-gray-800 rounded-xl border overflow-hidden transition-all ${config.cardBorder}`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.iconBg}`}>
            <TypeIcon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-gray-900 dark:text-white">{evaluation.titre}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${config.badgeClass}`}>{config.badge}</span>
            </div>
            {evaluation.module && (
              <p className="text-sm text-brand-600 dark:text-brand-400 mb-1">
                Module {evaluation.module.ordre} – {evaluation.module.titre}
              </p>
            )}
            {evaluation.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{evaluation.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
              <span className={`px-2 py-0.5 rounded ${isQCM ? "bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400" : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"}`}>
                {isQCM ? "QCM" : "Atelier"}
              </span>
              {evaluation.dureeEstimee && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {evaluation.dureeEstimee} min
                </span>
              )}
              {isQCM && evaluation.scoreMinimum && (
                <span className="flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  Min. {evaluation.scoreMinimum}%
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">{renderActionButton()}</div>
        </div>
      </div>
      {isQCM && evaluation.statut === "termine" && evaluation.resultat?.score !== null && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${(evaluation.resultat.score ?? 0) >= (evaluation.scoreMinimum || 50) ? "bg-green-500" : "bg-red-500"}`}
                initial={{ width: 0 }}
                animate={{ width: `${evaluation.resultat.score ?? 0}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 w-12 text-right">
              {Math.round(evaluation.resultat.score ?? 0)}%
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// =====================================
// COMPOSANT EVALUATION SATISFACTION CARD (451-455)
// =====================================

function EvaluationSatisfactionCard({
  evaluation,
  index,
}: {
  evaluation: EvaluationSatisfaction;
  index: number;
}) {
  const isChaud = evaluation.type === "CHAUD";
  const TypeIcon = isChaud ? ThermometerSun : Snowflake;

  // Style selon le statut
  const getStatutConfig = () => {
    switch (evaluation.statut) {
      case "complete":
        return {
          bgClass: "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30",
          badgeClass: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400",
          badgeLabel: evaluation.score !== null ? `${evaluation.score}/10` : "Complétée",
          iconBg: "bg-green-100 dark:bg-green-500/20",
          iconColor: "text-green-600 dark:text-green-400",
        };
      case "disponible":
        return {
          bgClass: "bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/30",
          badgeClass: "bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400",
          badgeLabel: "Disponible",
          iconBg: isChaud
            ? "bg-orange-100 dark:bg-orange-500/20"
            : "bg-blue-100 dark:bg-blue-500/20",
          iconColor: isChaud
            ? "text-orange-600 dark:text-orange-400"
            : "text-blue-600 dark:text-blue-400",
        };
      default:
        return {
          bgClass: "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600",
          badgeClass: "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400",
          badgeLabel: "À venir",
          iconBg: "bg-gray-100 dark:bg-gray-700",
          iconColor: "text-gray-400 dark:text-gray-500",
        };
    }
  };

  const config = getStatutConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border overflow-hidden ${config.bgClass}`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icône type */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.iconBg}`}>
            <TypeIcon className={`w-6 h-6 ${config.iconColor}`} />
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {evaluation.titre}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${config.badgeClass}`}>
                {config.badgeLabel}
              </span>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {evaluation.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
              <span className={`px-2 py-0.5 rounded ${
                isChaud
                  ? "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400"
                  : "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400"
              }`}>
                {isChaud ? "Fin de formation" : "3 mois après"}
              </span>

              {evaluation.formationTitre && (
                <span>{evaluation.formationTitre}</span>
              )}

              {/* Date d'ouverture si à venir */}
              {evaluation.statut === "a_venir" && evaluation.dateOuverture && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Disponible le {new Date(evaluation.dateOuverture).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}

              {/* Date de complétion si complétée */}
              {evaluation.statut === "complete" && evaluation.dateCompletion && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Complétée le {new Date(evaluation.dateCompletion).toLocaleDateString("fr-FR")}
                </span>
              )}
            </div>
          </div>

          {/* Correction 454: Boutons CTA */}
          {evaluation.statut === "a_venir" ? (
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              Bientôt disponible
            </button>
          ) : evaluation.statut === "disponible" ? (
            <Link
              href={evaluation.token ? `/evaluation/${evaluation.token}` : "#"}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Répondre
            </Link>
          ) : (
            <Link
              href={evaluation.token ? `/evaluation/${evaluation.token}/results` : "#"}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Voir ma réponse
            </Link>
          )}
        </div>
      </div>

      {/* Barre de score si complétée */}
      {evaluation.statut === "complete" && evaluation.score !== null && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${(evaluation.score / 10) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 w-16 text-right">
              {evaluation.score}/10
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// =====================================
// COMPOSANT EVALUATION PROGRESSION CARD
// =====================================

function EvaluationProgressionCard({
  evaluation,
  index,
}: {
  evaluation: EvaluationProgression;
  index: number;
}) {
  const isPositionnement = evaluation.type === "positionnement";
  const TypeIcon = isPositionnement ? TrendingUp : ClipboardCheck;

  const getStatutConfig = () => {
    switch (evaluation.statut) {
      case "complete":
        return {
          bgClass: "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30",
          badgeClass: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400",
          badgeLabel: evaluation.score !== null ? `${Math.round(evaluation.score)}%` : "Complété",
          iconBg: "bg-green-100 dark:bg-green-500/20",
          iconColor: "text-green-600 dark:text-green-400",
        };
      case "disponible":
        return {
          bgClass: "bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/30",
          badgeClass: "bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400",
          badgeLabel: "Disponible",
          iconBg: isPositionnement ? "bg-purple-100 dark:bg-purple-500/20" : "bg-emerald-100 dark:bg-emerald-500/20",
          iconColor: isPositionnement ? "text-purple-600 dark:text-purple-400" : "text-emerald-600 dark:text-emerald-400",
        };
      default:
        return {
          bgClass: "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600",
          badgeClass: "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400",
          badgeLabel: "À venir",
          iconBg: "bg-gray-100 dark:bg-gray-700",
          iconColor: "text-gray-400 dark:text-gray-500",
        };
    }
  };

  const config = getStatutConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border overflow-hidden ${config.bgClass}`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.iconBg}`}>
            <TypeIcon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">{evaluation.titre}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${config.badgeClass}`}>{config.badgeLabel}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{evaluation.description}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
              <span className={`px-2 py-0.5 rounded ${isPositionnement ? "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400" : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"}`}>
                {isPositionnement ? "Début de formation" : "Fin de formation"}
              </span>
              {evaluation.statut === "a_venir" && evaluation.dateOuverture && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Disponible le {new Date(evaluation.dateOuverture).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              {evaluation.statut === "complete" && evaluation.dateCompletion && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Complété le {new Date(evaluation.dateCompletion).toLocaleDateString("fr-FR")}
                </span>
              )}
            </div>
          </div>
          {evaluation.statut === "a_venir" ? (
            <button disabled className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed">
              <Lock className="w-4 h-4" />
              Bientôt disponible
            </button>
          ) : evaluation.statut === "disponible" ? (
            <Link
              href={evaluation.evaluationId ? `/apprenant/evaluations/${evaluation.evaluationId}?sessionId=${evaluation.id.split("-")[0]}` : "#"}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white transition-colors"
            >
              <Play className="w-4 h-4" />
              Compléter
            </Link>
          ) : (
            <Link
              href={evaluation.evaluationId ? `/apprenant/evaluations/${evaluation.evaluationId}?sessionId=${evaluation.id.split("-")[0]}` : "#"}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Revoir mes réponses
            </Link>
          )}
        </div>
      </div>
      {evaluation.statut === "complete" && evaluation.score !== null && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full bg-green-500" initial={{ width: 0 }} animate={{ width: `${evaluation.score}%` }} transition={{ duration: 0.8, delay: 0.2 }} />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 w-12 text-right">{Math.round(evaluation.score)}%</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function EvaluationsPage() {
  const { token, selectedSession } = useApprenantPortal();
  const [activeTab, setActiveTab] = useState<"progression" | "qcm" | "satisfaction">("progression");
  const [qcmAtelierData, setQcmAtelierData] = useState<EvaluationsQCMAtelierData | null>(null);
  const [satisfactionData, setSatisfactionData] = useState<EvaluationsSatisfactionData | null>(null);
  const [progressionData, setProgressionData] = useState<EvaluationsProgressionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchEvaluations = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({ token });
      if (selectedSession?.sessionId) {
        params.append("sessionId", selectedSession.sessionId);
      }

      const [qcmRes, satisfactionRes, progressionRes] = await Promise.all([
        fetch(`/api/apprenant/evaluations?${params.toString()}`),
        fetch(`/api/apprenant/evaluation-satisfaction?${params.toString()}`),
        fetch(`/api/apprenant/evaluation-progression?${params.toString()}`),
      ]);

      if (!qcmRes.ok) throw new Error("Erreur lors du chargement des évaluations QCM");

      const qcmEvaluations = await qcmRes.json();
      setQcmAtelierData(qcmEvaluations);

      if (satisfactionRes.ok) {
        const satisfactionEvaluations = await satisfactionRes.json();
        setSatisfactionData(satisfactionEvaluations);
      }

      if (progressionRes.ok) {
        const progressionEvaluations = await progressionRes.json();
        setProgressionData(progressionEvaluations);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, [token, selectedSession?.sessionId]);

  const handleMarkComplete = async (evaluationId: string) => {
    if (!token) return;
    try {
      setMarkingId(evaluationId);
      const res = await fetch(`/api/apprenant/evaluations/${evaluationId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, sessionId: selectedSession?.sessionId || null }),
      });
      if (res.ok) await fetchEvaluations();
    } catch (error) {
      console.error("Erreur lors du marquage:", error);
    } finally {
      setMarkingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des évaluations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 dark:text-white font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // Correction 456: Calculer les badges pour chaque onglet
  const pendingProgression = progressionData?.stats.disponibles || 0;
  const pendingQcm = (qcmAtelierData?.stats.aFaire || 0) + (qcmAtelierData?.stats.enCours || 0);
  const pendingSatisfaction = satisfactionData?.stats.aFaire || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Évaluations</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Testez vos connaissances et donnez votre avis sur vos formations
        </p>
      </div>

      {/* Correction 456: Tabs avec badges */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <button
          onClick={() => setActiveTab("progression")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "progression"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Progression
          {pendingProgression > 0 && (
            <span className="px-1.5 py-0.5 bg-brand-500 text-white text-xs rounded-full min-w-[20px] text-center">
              {pendingProgression}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("qcm")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "qcm"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <FileQuestion className="w-4 h-4" />
          QCM & Ateliers
          {pendingQcm > 0 && (
            <span className="px-1.5 py-0.5 bg-brand-500 text-white text-xs rounded-full min-w-[20px] text-center">
              {pendingQcm}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("satisfaction")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "satisfaction"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Star className="w-4 h-4" />
          Satisfaction
          {pendingSatisfaction > 0 && (
            <span className="px-1.5 py-0.5 bg-brand-500 text-white text-xs rounded-full min-w-[20px] text-center">
              {pendingSatisfaction}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Onglet Progression */}
        {activeTab === "progression" && (
          <motion.div key="progression" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
            {progressionData?.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
                      <Star className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{progressionData.stats.total}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                      <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{progressionData.stats.disponibles}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Disponibles</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{progressionData.stats.enAttente}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">En attente</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{progressionData.stats.completees}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Complétées</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {progressionData?.evaluations && progressionData.evaluations.length > 0 ? (
              <div className="space-y-4">
                {progressionData.evaluations.map((evaluation, index) => (
                  <EvaluationProgressionCard key={evaluation.id} evaluation={evaluation} index={index} />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <TrendingUp className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Évaluations de progression</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {selectedSession
                    ? "Les évaluations de progression seront disponibles selon le calendrier de votre session."
                    : "Sélectionnez une session pour voir vos évaluations de progression."}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Onglet QCM & Ateliers */}
        {activeTab === "qcm" && (
          <motion.div key="qcm" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
            {qcmAtelierData?.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
                      <Star className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{qcmAtelierData.stats.total}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{qcmAtelierData.stats.aFaire}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">À faire</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                      <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{qcmAtelierData.stats.enCours}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">En cours</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{qcmAtelierData.stats.terminees}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Terminées</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {qcmAtelierData?.evaluations && qcmAtelierData.evaluations.length > 0 ? (
              <div className="space-y-4">
                {qcmAtelierData.evaluations.map((evaluation, index) => (
                  <EvaluationQCMAtelierCard key={evaluation.id} evaluation={evaluation} index={index} onMarkComplete={handleMarkComplete} isMarking={markingId === evaluation.id} />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <FileQuestion className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Aucun QCM ou atelier disponible pour le moment.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Onglet Satisfaction - Corrections 451-455 */}
        {activeTab === "satisfaction" && (
          <motion.div key="satisfaction" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            {/* Correction 451: Tuiles avec nouveaux libellés */}
            {satisfactionData?.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
                      <Star className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{satisfactionData.stats.total}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                      <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{satisfactionData.stats.disponibles}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Disponibles</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{satisfactionData.stats.aFaire}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">À faire</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{satisfactionData.stats.completees}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Complétées</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Correction 452: Toujours afficher les 2 cartes */}
            {satisfactionData?.evaluations && satisfactionData.evaluations.length > 0 ? (
              <div className="space-y-4">
                {satisfactionData.evaluations.map((evaluation, index) => (
                  <EvaluationSatisfactionCard key={`${evaluation.type}-${index}`} evaluation={evaluation} index={index} />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Star className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Enquêtes de satisfaction</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {selectedSession
                    ? "Les enquêtes de satisfaction (à chaud et à froid) seront disponibles selon le calendrier de votre session."
                    : "Sélectionnez une session pour voir vos enquêtes de satisfaction."}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
