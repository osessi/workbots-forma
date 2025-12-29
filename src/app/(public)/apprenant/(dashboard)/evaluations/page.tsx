"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import {
  Star,
  CheckCircle2,
  Clock,
  Play,
  Trophy,
  AlertCircle,
  Loader2,
  ArrowRight,
  FileQuestion,
  Target,
  Award,
  ThermometerSun,
  Snowflake,
  ExternalLink,
  XCircle,
} from "lucide-react";
import Link from "next/link";

// =====================================
// TYPES
// =====================================

interface Evaluation {
  id: string;
  titre: string;
  type: string;
  description: string | null;
  dureeEstimee: number | null;
  scoreMinimum: number | null;
  ordre: number;
  resultat: {
    id: string;
    status: string;
    score: number | null;
    datePassage: string | null;
    tempsTotal: number | null;
  } | null;
}

interface EvaluationsData {
  evaluations: Evaluation[];
  stats: {
    total: number;
    terminees: number;
    enAttente: number;
    moyenneScore: number | null;
  };
}

interface EvaluationSatisfaction {
  id: string;
  token: string;
  type: "CHAUD" | "FROID";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED";
  formation: {
    id: string;
    titre: string;
  };
  session: {
    id: string;
    dateDebut: string | null;
  };
  expiresAt: string | null;
  completedAt: string | null;
  score: number | null;
  scoreMoyen: number | null;
}

interface EvaluationsSatisfactionData {
  evaluations: EvaluationSatisfaction[];
  evaluationsChaud: EvaluationSatisfaction[];
  evaluationsFroid: EvaluationSatisfaction[];
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    expired: number;
    chaud: number;
    froid: number;
  };
}

// =====================================
// COMPOSANT EVALUATION QCM CARD
// =====================================

function EvaluationCard({ evaluation, index }: { evaluation: Evaluation; index: number }) {
  const getStatusConfig = () => {
    if (!evaluation.resultat) {
      return {
        badge: "À faire",
        badgeClass: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
        icon: Clock,
        iconClass: "text-gray-400",
      };
    }

    switch (evaluation.resultat.status) {
      case "termine":
      case "valide":
        return {
          badge: evaluation.resultat.score !== null ? `${evaluation.resultat.score}%` : "Terminé",
          badgeClass: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400",
          icon: CheckCircle2,
          iconClass: "text-green-500",
        };
      case "en_cours":
        return {
          badge: "En cours",
          badgeClass: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400",
          icon: Play,
          iconClass: "text-blue-500",
        };
      case "echoue":
        return {
          badge: `${evaluation.resultat.score}% - Échec`,
          badgeClass: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400",
          icon: AlertCircle,
          iconClass: "text-red-500",
        };
      default:
        return {
          badge: "En attente",
          badgeClass: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400",
          icon: Clock,
          iconClass: "text-amber-500",
        };
    }
  };

  const getTypeIcon = () => {
    switch (evaluation.type) {
      case "QCM":
        return FileQuestion;
      case "ATELIER":
        return Target;
      case "EXAMEN":
        return Award;
      default:
        return Star;
    }
  };

  const config = getStatusConfig();
  const TypeIcon = getTypeIcon();

  const isCompleted = evaluation.resultat?.status === "termine" || evaluation.resultat?.status === "valide";
  const canStart = !evaluation.resultat || evaluation.resultat.status === "en_cours";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-brand-500 dark:hover:border-brand-500 transition-all group"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icône type */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isCompleted
              ? "bg-green-100 dark:bg-green-500/20"
              : "bg-brand-100 dark:bg-brand-500/20"
          }`}>
            <TypeIcon className={`w-6 h-6 ${
              isCompleted
                ? "text-green-600 dark:text-green-400"
                : "text-brand-600 dark:text-brand-400"
            }`} />
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {evaluation.titre}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${config.badgeClass}`}>
                {config.badge}
              </span>
            </div>

            {evaluation.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                {evaluation.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                {evaluation.type}
              </span>
              {evaluation.dureeEstimee && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {evaluation.dureeEstimee} min
                </span>
              )}
              {evaluation.scoreMinimum && (
                <span className="flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  Min. {evaluation.scoreMinimum}%
                </span>
              )}
              {evaluation.resultat?.datePassage && (
                <span>
                  Passé le {new Date(evaluation.resultat.datePassage).toLocaleDateString("fr-FR")}
                </span>
              )}
            </div>
          </div>

          {/* Action */}
          <Link
            href={`/apprenant/evaluations/${evaluation.id}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              canStart
                ? "bg-brand-500 hover:bg-brand-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
            }`}
          >
            {canStart ? (
              <>
                <Play className="w-4 h-4" />
                {evaluation.resultat?.status === "en_cours" ? "Reprendre" : "Commencer"}
              </>
            ) : (
              <>
                Voir
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Link>
        </div>
      </div>

      {/* Barre de score si terminé */}
      {isCompleted && evaluation.resultat && evaluation.resultat.score !== null && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  (evaluation.resultat.score ?? 0) >= (evaluation.scoreMinimum || 50)
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${evaluation.resultat.score ?? 0}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 w-12 text-right">
              {evaluation.resultat.score ?? 0}%
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// =====================================
// COMPOSANT EVALUATION SATISFACTION CARD
// =====================================

function EvaluationSatisfactionCard({ evaluation, index }: { evaluation: EvaluationSatisfaction; index: number }) {
  const getStatusConfig = () => {
    switch (evaluation.status) {
      case "COMPLETED":
        return {
          badge: evaluation.score !== null ? `${evaluation.score}/10` : "Terminé",
          badgeClass: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400",
          icon: CheckCircle2,
          iconClass: "text-green-500",
        };
      case "IN_PROGRESS":
        return {
          badge: "En cours",
          badgeClass: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400",
          icon: Play,
          iconClass: "text-blue-500",
        };
      case "EXPIRED":
        return {
          badge: "Expiré",
          badgeClass: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400",
          icon: XCircle,
          iconClass: "text-red-500",
        };
      default:
        return {
          badge: "À compléter",
          badgeClass: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400",
          icon: Clock,
          iconClass: "text-amber-500",
        };
    }
  };

  const config = getStatusConfig();
  const TypeIcon = evaluation.type === "CHAUD" ? ThermometerSun : Snowflake;
  const typeColor = evaluation.type === "CHAUD" ? "orange" : "blue";

  const isCompleted = evaluation.status === "COMPLETED";
  const canFill = evaluation.status === "PENDING" || evaluation.status === "IN_PROGRESS";

  // Calculer les jours restants avant expiration
  const daysRemaining = evaluation.expiresAt
    ? Math.ceil((new Date(evaluation.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white dark:bg-gray-800 rounded-xl border overflow-hidden transition-all group ${
        evaluation.status === "EXPIRED"
          ? "border-red-200 dark:border-red-800 opacity-60"
          : "border-gray-200 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500"
      }`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icône type */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isCompleted
              ? "bg-green-100 dark:bg-green-500/20"
              : typeColor === "orange"
              ? "bg-orange-100 dark:bg-orange-500/20"
              : "bg-blue-100 dark:bg-blue-500/20"
          }`}>
            <TypeIcon className={`w-6 h-6 ${
              isCompleted
                ? "text-green-600 dark:text-green-400"
                : typeColor === "orange"
                ? "text-orange-600 dark:text-orange-400"
                : "text-blue-600 dark:text-blue-400"
            }`} />
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                Évaluation {evaluation.type === "CHAUD" ? "à chaud" : "à froid"}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${config.badgeClass}`}>
                {config.badge}
              </span>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {evaluation.formation.titre}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
              <span className={`px-2 py-0.5 rounded ${
                typeColor === "orange"
                  ? "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400"
                  : "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400"
              }`}>
                {evaluation.type === "CHAUD" ? "À chaud" : "À froid (3 mois)"}
              </span>
              {evaluation.session.dateDebut && (
                <span>
                  Formation du {new Date(evaluation.session.dateDebut).toLocaleDateString("fr-FR")}
                </span>
              )}
              {daysRemaining !== null && daysRemaining > 0 && canFill && (
                <span className={`flex items-center gap-1 ${
                  daysRemaining <= 7 ? "text-red-500" : ""
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  {daysRemaining} jour{daysRemaining > 1 ? "s" : ""} restant{daysRemaining > 1 ? "s" : ""}
                </span>
              )}
              {evaluation.completedAt && (
                <span>
                  Complété le {new Date(evaluation.completedAt).toLocaleDateString("fr-FR")}
                </span>
              )}
            </div>
          </div>

          {/* Action */}
          {canFill ? (
            <Link
              href={`/evaluation/${evaluation.token}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {evaluation.status === "IN_PROGRESS" ? "Reprendre" : "Compléter"}
            </Link>
          ) : evaluation.status === "COMPLETED" ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              Terminé
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              <XCircle className="w-4 h-4" />
              Expiré
            </div>
          )}
        </div>
      </div>

      {/* Barre de score si terminé */}
      {isCompleted && evaluation.score !== null && (
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
// PAGE PRINCIPALE
// =====================================

export default function EvaluationsPage() {
  const { token, selectedInscription } = useApprenantPortal();
  const [activeTab, setActiveTab] = useState<"qcm" | "satisfaction">("qcm");
  const [qcmData, setQcmData] = useState<EvaluationsData | null>(null);
  const [satisfactionData, setSatisfactionData] = useState<EvaluationsSatisfactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const params = new URLSearchParams({ token });
        if (selectedInscription?.id) {
          params.append("inscriptionId", selectedInscription.id);
        }

        // Fetch QCM evaluations et Satisfaction evaluations en parallèle
        const [qcmRes, satisfactionRes] = await Promise.all([
          fetch(`/api/apprenant/evaluations?${params.toString()}`),
          fetch(`/api/apprenant/evaluation-satisfaction?token=${token}`),
        ]);

        if (!qcmRes.ok) {
          throw new Error("Erreur lors du chargement des évaluations QCM");
        }
        if (!satisfactionRes.ok) {
          throw new Error("Erreur lors du chargement des évaluations de satisfaction");
        }

        const [qcmEvaluations, satisfactionEvaluations] = await Promise.all([
          qcmRes.json(),
          satisfactionRes.json(),
        ]);

        setQcmData(qcmEvaluations);
        setSatisfactionData(satisfactionEvaluations);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, [token, selectedInscription?.id]);

  // Déterminer quel onglet afficher par défaut selon les évaluations en attente
  useEffect(() => {
    if (satisfactionData && qcmData) {
      const hasPendingSatisfaction = satisfactionData.stats.pending > 0 || satisfactionData.stats.inProgress > 0;
      const hasPendingQcm = qcmData.stats.enAttente > 0;

      // Priorité aux évaluations de satisfaction si en attente
      if (hasPendingSatisfaction && !hasPendingQcm) {
        setActiveTab("satisfaction");
      }
    }
  }, [satisfactionData, qcmData]);

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

  const pendingSatisfaction = (satisfactionData?.stats.pending || 0) + (satisfactionData?.stats.inProgress || 0);
  const pendingQcm = qcmData?.stats.enAttente || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Évaluations
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Testez vos connaissances et donnez votre avis sur vos formations
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
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
            <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs rounded-full">
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
            <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs rounded-full">
              {pendingSatisfaction}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "qcm" ? (
          <motion.div
            key="qcm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Stats QCM */}
            {qcmData?.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
                      <Star className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {qcmData.stats.total}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {qcmData.stats.terminees}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Terminées</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {qcmData.stats.enAttente}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">En attente</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {qcmData.stats.moyenneScore !== null ? `${qcmData.stats.moyenneScore}%` : "—"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Moyenne</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Liste QCM */}
            {qcmData?.evaluations && qcmData.evaluations.length > 0 ? (
              <div className="space-y-4">
                {qcmData.evaluations.map((evaluation, index) => (
                  <EvaluationCard key={evaluation.id} evaluation={evaluation} index={index} />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <FileQuestion className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Aucune évaluation QCM disponible pour le moment
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="satisfaction"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Stats Satisfaction */}
            {satisfactionData?.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
                      <Star className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {satisfactionData.stats.total}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {satisfactionData.stats.completed}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Complétées</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                      <ThermometerSun className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {satisfactionData.stats.chaud}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">À chaud</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                      <Snowflake className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {satisfactionData.stats.froid}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">À froid</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Liste Satisfaction */}
            {satisfactionData?.evaluations && satisfactionData.evaluations.length > 0 ? (
              <div className="space-y-4">
                {/* En attente en premier */}
                {satisfactionData.evaluations
                  .filter(e => e.status === "PENDING" || e.status === "IN_PROGRESS")
                  .map((evaluation, index) => (
                    <EvaluationSatisfactionCard key={evaluation.id} evaluation={evaluation} index={index} />
                  ))}
                {/* Complétées ensuite */}
                {satisfactionData.evaluations
                  .filter(e => e.status === "COMPLETED")
                  .map((evaluation, index) => (
                    <EvaluationSatisfactionCard key={evaluation.id} evaluation={evaluation} index={index} />
                  ))}
                {/* Expirées en dernier */}
                {satisfactionData.evaluations
                  .filter(e => e.status === "EXPIRED")
                  .map((evaluation, index) => (
                    <EvaluationSatisfactionCard key={evaluation.id} evaluation={evaluation} index={index} />
                  ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Star className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Aucune évaluation de satisfaction disponible pour le moment
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Les évaluations seront disponibles après vos formations
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
