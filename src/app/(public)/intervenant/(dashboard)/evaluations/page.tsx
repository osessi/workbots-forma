"use client";

import React, { useState, useEffect } from "react";
import { useRequireIntervenantAuth, useIntervenantPortal } from "@/context/IntervenantPortalContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Users,
  CheckCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ChevronRight,
  FileText,
  BarChart3,
  ClipboardCheck,
  ExternalLink,
  XCircle,
  Play,
  Loader2,
} from "lucide-react";
import Link from "next/link";

// =====================================
// TYPES
// =====================================

interface Evaluation {
  id: string;
  titre: string;
  type: string;
  dateCreation: string;
  nombreReponses: number;
  nombreTotal: number;
  moyenneScore?: number;
}

interface EvaluationIntervenant {
  id: string;
  token: string;
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
  scoreMoyen: number | null;
  satisfactionGlobale: number | null;
}

interface EvaluationsIntervenantData {
  evaluations: EvaluationIntervenant[];
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    expired: number;
  };
}

// =====================================
// COMPOSANT EVALUATION INTERVENANT CARD
// =====================================

function EvaluationIntervenantCard({ evaluation, index }: { evaluation: EvaluationIntervenant; index: number }) {
  const getStatusConfig = () => {
    switch (evaluation.status) {
      case "COMPLETED":
        return {
          badge: evaluation.satisfactionGlobale !== null ? `${evaluation.satisfactionGlobale}/10` : "Terminé",
          badgeClass: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400",
          icon: CheckCircle2,
        };
      case "IN_PROGRESS":
        return {
          badge: "En cours",
          badgeClass: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400",
          icon: Play,
        };
      case "EXPIRED":
        return {
          badge: "Expiré",
          badgeClass: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400",
          icon: XCircle,
        };
      default:
        return {
          badge: "À compléter",
          badgeClass: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400",
          icon: Clock,
        };
    }
  };

  const config = getStatusConfig();
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
      className={`bg-white dark:bg-gray-800 rounded-xl border overflow-hidden transition-all ${
        evaluation.status === "EXPIRED"
          ? "border-red-200 dark:border-red-800 opacity-60"
          : "border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600"
      }`}
    >
      <div className="p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Icône */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isCompleted
              ? "bg-green-100 dark:bg-green-500/20"
              : "bg-purple-100 dark:bg-purple-500/20"
          }`}>
            <ClipboardCheck className={`w-6 h-6 ${
              isCompleted
                ? "text-green-600 dark:text-green-400"
                : "text-purple-600 dark:text-purple-400"
            }`} />
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                Évaluation de ma prestation
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${config.badgeClass}`}>
                {config.badge}
              </span>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {evaluation.formation.titre}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
              <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400">
                Qualiopi IND 2
              </span>
              {evaluation.session.dateDebut && (
                <span>
                  Session du {new Date(evaluation.session.dateDebut).toLocaleDateString("fr-FR")}
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
              href={`/evaluation-intervenant/${evaluation.token}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
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
      {isCompleted && evaluation.scoreMoyen !== null && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${(evaluation.scoreMoyen / 10) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 w-16 text-right">
              {evaluation.scoreMoyen.toFixed(1)}/10
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

export default function IntervenantEvaluationsPage() {
  useRequireIntervenantAuth();
  const { selectedSession, token, isLoading } = useIntervenantPortal();
  const [activeTab, setActiveTab] = useState<"qcm" | "satisfaction">("satisfaction");
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [intervenantData, setIntervenantData] = useState<EvaluationsIntervenantData | null>(null);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);
  const [loadingIntervenant, setLoadingIntervenant] = useState(false);

  useEffect(() => {
    if (selectedSession && token) {
      fetchEvaluations();
      fetchEvaluationsIntervenant();
    }
  }, [selectedSession, token]);

  const fetchEvaluations = async () => {
    if (!selectedSession || !token) return;

    setLoadingEvaluations(true);
    try {
      const res = await fetch(`/api/intervenant/evaluations?token=${token}&sessionId=${selectedSession.id}`);
      if (res.ok) {
        const data = await res.json();
        setEvaluations(data.evaluations || []);
      }
    } catch (error) {
      console.error("Erreur fetch évaluations:", error);
    } finally {
      setLoadingEvaluations(false);
    }
  };

  const fetchEvaluationsIntervenant = async () => {
    if (!selectedSession || !token) return;

    setLoadingIntervenant(true);
    try {
      const res = await fetch(`/api/intervenant/evaluation-intervenant?token=${token}&sessionId=${selectedSession.id}`);
      if (res.ok) {
        const data = await res.json();
        setIntervenantData(data);
      }
    } catch (error) {
      console.error("Erreur fetch évaluations intervenant:", error);
    } finally {
      setLoadingIntervenant(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!selectedSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Star className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Aucune session sélectionnée
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Veuillez sélectionner une session pour voir les évaluations.
        </p>
      </div>
    );
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "SATISFACTION": return "Satisfaction";
      case "POSITIONNEMENT": return "Positionnement";
      case "ACQUIS": return "Acquis";
      case "QCM": return "QCM";
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "SATISFACTION": return "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400";
      case "POSITIONNEMENT": return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
      case "ACQUIS": return "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400";
      case "QCM": return "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // Stats globales QCM
  const totalReponses = evaluations.reduce((sum, e) => sum + e.nombreReponses, 0);
  const totalAttendues = evaluations.reduce((sum, e) => sum + e.nombreTotal, 0);
  const tauxCompletion = totalAttendues > 0 ? Math.round((totalReponses / totalAttendues) * 100) : 0;

  // Compter les évaluations intervenant en attente
  const pendingIntervenant = (intervenantData?.stats.pending || 0) + (intervenantData?.stats.inProgress || 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Évaluations
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {selectedSession.formation.titre} - Suivi des évaluations
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <button
          onClick={() => setActiveTab("satisfaction")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "satisfaction"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          Mon évaluation
          {pendingIntervenant > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs rounded-full">
              {pendingIntervenant}
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
          <BarChart3 className="w-4 h-4" />
          Éval. apprenants
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "satisfaction" ? (
          <motion.div
            key="satisfaction"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Stats Satisfaction Intervenant */}
            {intervenantData?.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {intervenantData.stats.total}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-2 text-amber-500 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">En attente</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-600">
                    {intervenantData.stats.pending + intervenantData.stats.inProgress}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-2 text-green-500 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs">Complétées</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {intervenantData.stats.completed}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-2 text-red-500 mb-1">
                    <XCircle className="w-4 h-4" />
                    <span className="text-xs">Expirées</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {intervenantData.stats.expired}
                  </p>
                </div>
              </div>
            )}

            {/* Liste évaluations intervenant */}
            {loadingIntervenant ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : intervenantData?.evaluations && intervenantData.evaluations.length > 0 ? (
              <div className="space-y-4">
                {/* En attente en premier */}
                {intervenantData.evaluations
                  .filter(e => e.status === "PENDING" || e.status === "IN_PROGRESS")
                  .map((evaluation, index) => (
                    <EvaluationIntervenantCard key={`pending-${evaluation.id}`} evaluation={evaluation} index={index} />
                  ))}
                {/* Complétées ensuite */}
                {intervenantData.evaluations
                  .filter(e => e.status === "COMPLETED")
                  .map((evaluation, index) => (
                    <EvaluationIntervenantCard key={`completed-${evaluation.id}`} evaluation={evaluation} index={index} />
                  ))}
                {/* Expirées en dernier */}
                {intervenantData.evaluations
                  .filter(e => e.status === "EXPIRED")
                  .map((evaluation, index) => (
                    <EvaluationIntervenantCard key={`expired-${evaluation.id}`} evaluation={evaluation} index={index} />
                  ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                <ClipboardCheck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  Aucune évaluation de satisfaction pour cette session
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  L&apos;organisme de formation vous enverra un questionnaire après la session
                </p>
              </div>
            )}

            {/* Explication */}
            <div className="bg-purple-50 dark:bg-purple-500/10 rounded-xl p-4 border border-purple-100 dark:border-purple-500/20">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Star className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium text-purple-900 dark:text-purple-100 text-sm">
                    Évaluation Qualiopi - Indicateur 2
                  </h4>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    Cette évaluation permet de recueillir votre avis sur les conditions de formation
                    (organisation, coordination, supports) et la satisfaction globale de votre intervention.
                    Vos retours aident l&apos;organisme à améliorer ses prestations.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="qcm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Stats résumé QCM */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs">Évaluations</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {evaluations.length}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs">Réponses</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalReponses}/{totalAttendues}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-emerald-500 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs">Taux complétion</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">
                  {tauxCompletion}%
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-amber-500 mb-1">
                  <Star className="w-4 h-4" />
                  <span className="text-xs">Note moyenne</span>
                </div>
                <p className="text-2xl font-bold text-amber-600">
                  {evaluations.length > 0
                    ? (evaluations.filter(e => e.moyenneScore).reduce((sum, e) => sum + (e.moyenneScore || 0), 0) / evaluations.filter(e => e.moyenneScore).length || 0).toFixed(1)
                    : "-"
                  }
                </p>
              </div>
            </div>

            {/* Liste des évaluations QCM */}
            {loadingEvaluations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : evaluations.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                <Star className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  Aucune évaluation pour cette session
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {evaluations.map((evaluation) => {
                  const completionRate = evaluation.nombreTotal > 0
                    ? Math.round((evaluation.nombreReponses / evaluation.nombreTotal) * 100)
                    : 0;

                  return (
                    <div
                      key={evaluation.id}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors cursor-pointer"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Infos principales */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {evaluation.titre}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(evaluation.type)}`}>
                                {getTypeLabel(evaluation.type)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Progression */}
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Réponses</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {evaluation.nombreReponses}/{evaluation.nombreTotal}
                            </p>
                          </div>

                          {/* Barre de progression */}
                          <div className="w-32 hidden sm:block">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-500">Complétion</span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">{completionRate}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  completionRate === 100 ? "bg-green-500" :
                                  completionRate >= 50 ? "bg-emerald-500" : "bg-amber-500"
                                }`}
                                style={{ width: `${completionRate}%` }}
                              />
                            </div>
                          </div>

                          {/* Score moyen */}
                          {evaluation.moyenneScore !== undefined && (
                            <div className="text-center">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Score</p>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-amber-500" />
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                  {evaluation.moyenneScore.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          )}

                          <ChevronRight className="w-5 h-5 text-gray-300" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
