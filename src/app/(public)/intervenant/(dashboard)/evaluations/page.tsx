"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRequireIntervenantAuth, useIntervenantPortal } from "@/context/IntervenantPortalContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Users,
  CheckCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  FileText,
  BarChart3,
  ClipboardCheck,
  ExternalLink,
  XCircle,
  Loader2,
  BookOpen,
  PenTool,
  Eye,
  FileCheck,
  ThermometerSun,
  Snowflake,
  Target,
  Award,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

// =====================================
// TYPES
// =====================================

interface QCMAtelier {
  id: string;
  titre: string;
  type: "QCM_MODULE" | "ATELIER_MODULE";
  moduleNom?: string;
  hasCorrige: boolean;
}

interface EvaluationIntervenant {
  id: string;
  token: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED" | "NOT_AVAILABLE";
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
  availableAt?: string | null;
}

interface ApprenantEvaluation {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  positionnement: { status: "completed" | "pending"; resultId?: string } | null;
  evaluationFinale: { status: "completed" | "pending"; resultId?: string; score?: number } | null;
  satisfactionChaud: { status: "completed" | "pending" | "not_available"; resultId?: string } | null;
  satisfactionFroid: { status: "completed" | "pending" | "not_available"; resultId?: string } | null;
}

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function IntervenantEvaluationsPage() {
  useRequireIntervenantAuth();
  const { selectedSession, token, isLoading } = useIntervenantPortal();

  // Correction 512: 3 onglets
  const [activeTab, setActiveTab] = useState<"qcm" | "satisfaction" | "apprenants">("qcm");

  // Sous-onglet pour Évaluations apprenants (correction 514)
  const [subTab, setSubTab] = useState<"progression" | "satisfaction">("progression");

  // États données
  const [qcmAteliers, setQcmAteliers] = useState<QCMAtelier[]>([]);
  const [intervenantEval, setIntervenantEval] = useState<EvaluationIntervenant | null>(null);
  const [apprenantsEvals, setApprenantsEvals] = useState<ApprenantEvaluation[]>([]);

  // États loading
  const [loadingQcm, setLoadingQcm] = useState(false);
  const [loadingIntervenant, setLoadingIntervenant] = useState(false);
  const [loadingApprenants, setLoadingApprenants] = useState(false);

  // Fetch QCM & Ateliers
  const fetchQcmAteliers = useCallback(async () => {
    if (!selectedSession || !token) return;
    setLoadingQcm(true);
    try {
      const res = await fetch(`/api/intervenant/evaluations/qcm-ateliers?token=${token}&sessionId=${selectedSession.id}`);
      if (res.ok) {
        const data = await res.json();
        setQcmAteliers(data.items || []);
      }
    } catch (error) {
      console.error("Erreur fetch QCM/Ateliers:", error);
    } finally {
      setLoadingQcm(false);
    }
  }, [selectedSession, token]);

  // Fetch Évaluation intervenant (satisfaction formateur)
  const fetchIntervenantEval = useCallback(async () => {
    if (!selectedSession || !token) return;
    setLoadingIntervenant(true);
    try {
      const res = await fetch(`/api/intervenant/evaluation-intervenant?token=${token}&sessionId=${selectedSession.id}`);
      if (res.ok) {
        const data = await res.json();
        // Filtrer pour la session sélectionnée
        const evalForSession = data.evaluations?.find(
          (e: EvaluationIntervenant) => e.session.id === selectedSession.id
        );
        setIntervenantEval(evalForSession || null);
      }
    } catch (error) {
      console.error("Erreur fetch évaluation intervenant:", error);
    } finally {
      setLoadingIntervenant(false);
    }
  }, [selectedSession, token]);

  // Fetch Évaluations apprenants
  const fetchApprenantsEvals = useCallback(async () => {
    if (!selectedSession || !token) return;
    setLoadingApprenants(true);
    try {
      const res = await fetch(`/api/intervenant/evaluations/apprenants?token=${token}&sessionId=${selectedSession.id}`);
      if (res.ok) {
        const data = await res.json();
        setApprenantsEvals(data.apprenants || []);
      }
    } catch (error) {
      console.error("Erreur fetch évaluations apprenants:", error);
    } finally {
      setLoadingApprenants(false);
    }
  }, [selectedSession, token]);

  useEffect(() => {
    if (selectedSession && token) {
      fetchQcmAteliers();
      fetchIntervenantEval();
      fetchApprenantsEvals();
    }
  }, [selectedSession, token, fetchQcmAteliers, fetchIntervenantEval, fetchApprenantsEvals]);

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

  // =====================================
  // CALCULS STATS
  // =====================================

  // Stats QCM & Ateliers (correction 513)
  const totalQcmAteliers = qcmAteliers.length;
  const nombreQcm = qcmAteliers.filter(q => q.type === "QCM_MODULE").length;
  const nombreAteliers = qcmAteliers.filter(q => q.type === "ATELIER_MODULE").length;
  const nombreCorriges = qcmAteliers.filter(q => q.hasCorrige).length;

  // Stats Satisfaction intervenant (corrections 512-513)
  const satisfactionTotal = intervenantEval ? 1 : 0;
  const satisfactionEnAttente = intervenantEval && (intervenantEval.status === "PENDING" || intervenantEval.status === "IN_PROGRESS" || intervenantEval.status === "NOT_AVAILABLE") ? 1 : 0;
  const satisfactionCompletees = intervenantEval && intervenantEval.status === "COMPLETED" ? 1 : 0;
  const satisfactionDisponibles = intervenantEval && (intervenantEval.status === "PENDING" || intervenantEval.status === "IN_PROGRESS") ? 1 : 0;

  // Stats Évaluations apprenants (correction 519)
  const nombreApprenants = apprenantsEvals.length;
  // Évaluations attendues = apprenants × 4 (positionnement, finale, à chaud, à froid)
  const evaluationsAttendues = nombreApprenants * 4;
  const reponsesRecues = apprenantsEvals.reduce((sum, a) => {
    let count = 0;
    if (a.positionnement?.status === "completed") count++;
    if (a.evaluationFinale?.status === "completed") count++;
    if (a.satisfactionChaud?.status === "completed") count++;
    if (a.satisfactionFroid?.status === "completed") count++;
    return sum + count;
  }, 0);
  const evaluationsEnAttente = evaluationsAttendues - reponsesRecues;

  // Stats progression (515)
  const positionnementCompletes = apprenantsEvals.filter(a => a.positionnement?.status === "completed").length;
  const evaluationFinaleCompletes = apprenantsEvals.filter(a => a.evaluationFinale?.status === "completed").length;

  // Stats satisfaction apprenants (517)
  const satisfactionChaudCompletes = apprenantsEvals.filter(a => a.satisfactionChaud?.status === "completed").length;
  const satisfactionFroidCompletes = apprenantsEvals.filter(a => a.satisfactionFroid?.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* En-tête - Correction 511: sous-titre générique */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Évaluations
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Suivez et gérez les évaluations de la session.
        </p>
      </div>

      {/* Tabs - Correction 512: 3 onglets */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <button
          onClick={() => setActiveTab("qcm")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "qcm"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">QCM & Ateliers</span>
          <span className="sm:hidden">QCM</span>
        </button>
        <button
          onClick={() => setActiveTab("satisfaction")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "satisfaction"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          Satisfaction
          {satisfactionEnAttente > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs rounded-full">
              {satisfactionEnAttente}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("apprenants")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "apprenants"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">Éval. apprenants</span>
          <span className="sm:hidden">Apprenants</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* =====================================
            ONGLET QCM & ATELIERS (Correction 513)
        ===================================== */}
        {activeTab === "qcm" && (
          <motion.div
            key="qcm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Tuiles stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs">Total</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalQcmAteliers}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-purple-500 mb-1">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs">QCM</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {nombreQcm}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-blue-500 mb-1">
                  <PenTool className="w-4 h-4" />
                  <span className="text-xs">Ateliers</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {nombreAteliers}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-green-500 mb-1">
                  <FileCheck className="w-4 h-4" />
                  <span className="text-xs">Corrigés</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {nombreCorriges}
                </p>
              </div>
            </div>

            {/* Liste QCM & Ateliers */}
            {loadingQcm ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : qcmAteliers.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  Aucun QCM ou atelier disponible pour cette session
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {qcmAteliers.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.type === "QCM_MODULE"
                          ? "bg-purple-100 dark:bg-purple-500/20"
                          : "bg-blue-100 dark:bg-blue-500/20"
                      }`}>
                        {item.type === "QCM_MODULE" ? (
                          <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        ) : (
                          <PenTool className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {item.titre}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            item.type === "QCM_MODULE"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                          }`}>
                            {item.type === "QCM_MODULE" ? "QCM" : "Atelier"}
                          </span>
                          {item.moduleNom && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Module : {item.moduleNom}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/intervenant/evaluations/view/${item.id}?token=${token}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Voir
                        </Link>
                        {item.hasCorrige && (
                          <Link
                            href={`/intervenant/evaluations/view/${item.id}/corrige?token=${token}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-500/20 hover:bg-green-200 dark:hover:bg-green-500/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-lg transition-colors"
                          >
                            <FileCheck className="w-4 h-4" />
                            Corrigé
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* =====================================
            ONGLET SATISFACTION (Corrections 512-513)
        ===================================== */}
        {activeTab === "satisfaction" && (
          <motion.div
            key="satisfaction"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Tuiles stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs">Total</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {satisfactionTotal}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-amber-500 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">En attente</span>
                </div>
                <p className="text-2xl font-bold text-amber-600">
                  {satisfactionEnAttente}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-green-500 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">Complétées</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {satisfactionCompletees}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-blue-500 mb-1">
                  <ExternalLink className="w-4 h-4" />
                  <span className="text-xs">Disponibles</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {satisfactionDisponibles}
                </p>
              </div>
            </div>

            {/* Carte évaluation formateur */}
            {loadingIntervenant ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : intervenantEval ? (
              <div className={`bg-white dark:bg-gray-800 rounded-xl border overflow-hidden ${
                intervenantEval.status === "COMPLETED"
                  ? "border-green-200 dark:border-green-800"
                  : intervenantEval.status === "NOT_AVAILABLE"
                  ? "border-gray-200 dark:border-gray-700 opacity-75"
                  : "border-amber-200 dark:border-amber-800"
              }`}>
                <div className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      intervenantEval.status === "COMPLETED"
                        ? "bg-green-100 dark:bg-green-500/20"
                        : "bg-purple-100 dark:bg-purple-500/20"
                    }`}>
                      <ClipboardCheck className={`w-6 h-6 ${
                        intervenantEval.status === "COMPLETED"
                          ? "text-green-600 dark:text-green-400"
                          : "text-purple-600 dark:text-purple-400"
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Évaluation formateur
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          intervenantEval.status === "COMPLETED"
                            ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400"
                            : intervenantEval.status === "NOT_AVAILABLE"
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                            : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                        }`}>
                          {intervenantEval.status === "COMPLETED" ? "Complétée" :
                           intervenantEval.status === "NOT_AVAILABLE" ? "Pas encore disponible" : "À compléter"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {intervenantEval.formation.titre}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-2">
                        <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400">
                          Qualiopi IND 2
                        </span>
                        {intervenantEval.status === "NOT_AVAILABLE" && intervenantEval.availableAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Disponible le {new Date(intervenantEval.availableAt).toLocaleDateString("fr-FR")} à {new Date(intervenantEval.availableAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                        {intervenantEval.completedAt && (
                          <span>
                            Complétée le {new Date(intervenantEval.completedAt).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bouton action */}
                    {intervenantEval.status === "COMPLETED" ? (
                      <Link
                        href={`/evaluation-intervenant/${intervenantEval.token}/view`}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Consulter
                      </Link>
                    ) : intervenantEval.status === "NOT_AVAILABLE" ? (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed">
                        <Clock className="w-4 h-4" />
                        Non disponible
                      </div>
                    ) : (
                      <Link
                        href={`/evaluation-intervenant/${intervenantEval.token}`}
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Compléter
                      </Link>
                    )}
                  </div>
                </div>

                {/* Score si complété */}
                {intervenantEval.status === "COMPLETED" && intervenantEval.satisfactionGlobale !== null && (
                  <div className="px-5 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Satisfaction globale :</span>
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-green-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${(intervenantEval.satisfactionGlobale / 10) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 w-16 text-right">
                        {intervenantEval.satisfactionGlobale.toFixed(1)}/10
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                <ClipboardCheck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  Aucune évaluation de satisfaction pour cette session
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  L&apos;évaluation sera disponible 1h avant la fin de la session
                </p>
              </div>
            )}

            {/* Explication Qualiopi */}
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
        )}

        {/* =====================================
            ONGLET ÉVALUATIONS APPRENANTS (Corrections 514-519)
        ===================================== */}
        {activeTab === "apprenants" && (
          <motion.div
            key="apprenants"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Tuiles stats (correction 519) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs">Apprenants</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {nombreApprenants}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-blue-500 mb-1">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs">Éval. attendues</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {evaluationsAttendues}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-green-500 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">Réponses reçues</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {reponsesRecues}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-amber-500 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">En attente</span>
                </div>
                <p className="text-2xl font-bold text-amber-600">
                  {evaluationsEnAttente}
                </p>
              </div>
            </div>

            {/* Sous-onglets Progression / Satisfaction (correction 514) */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <button
                onClick={() => setSubTab("progression")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  subTab === "progression"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Target className="w-4 h-4" />
                Progression
              </button>
              <button
                onClick={() => setSubTab("satisfaction")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  subTab === "satisfaction"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Star className="w-4 h-4" />
                Satisfaction
              </button>
            </div>

            {loadingApprenants ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : apprenantsEvals.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  Aucun apprenant inscrit à cette session
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {/* =====================================
                    SOUS-ONGLET PROGRESSION (Corrections 515-516)
                ===================================== */}
                {subTab === "progression" && (
                  <motion.div
                    key="progression"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Bloc Test de positionnement */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                Test de positionnement
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Évaluation initiale des connaissances
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              positionnementCompletes === nombreApprenants ? "text-green-600" : "text-amber-600"
                            }`}>
                              {positionnementCompletes}/{nombreApprenants} complétés
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {apprenantsEvals.map((apprenant) => (
                          <div key={`pos-${apprenant.id}`} className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {apprenant.prenom} {apprenant.nom}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{apprenant.email}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              {apprenant.positionnement?.status === "completed" ? (
                                <>
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-xs rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Complété
                                  </span>
                                  {apprenant.positionnement.resultId && (
                                    <Link
                                      href={`/intervenant/evaluations/resultat/${apprenant.positionnement.resultId}?token=${token}`}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors"
                                    >
                                      <Eye className="w-4 h-4" />
                                      Voir
                                    </Link>
                                  )}
                                </>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full">
                                  <Clock className="w-3 h-3" />
                                  Non complété
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bloc Évaluation finale */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                              <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                Évaluation finale
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Évaluation des acquis en fin de formation
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              evaluationFinaleCompletes === nombreApprenants ? "text-green-600" : "text-amber-600"
                            }`}>
                              {evaluationFinaleCompletes}/{nombreApprenants} complétés
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {apprenantsEvals.map((apprenant) => (
                          <div key={`finale-${apprenant.id}`} className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {apprenant.prenom} {apprenant.nom}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{apprenant.email}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              {apprenant.evaluationFinale?.status === "completed" ? (
                                <>
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-xs rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {apprenant.evaluationFinale.score !== undefined ? `${apprenant.evaluationFinale.score.toFixed(0)}%` : "Complété"}
                                  </span>
                                  {apprenant.evaluationFinale.resultId && (
                                    <Link
                                      href={`/intervenant/evaluations/resultat/${apprenant.evaluationFinale.resultId}?token=${token}&showCorrection=true`}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors"
                                    >
                                      <Eye className="w-4 h-4" />
                                      Voir
                                    </Link>
                                  )}
                                </>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full">
                                  <Clock className="w-3 h-3" />
                                  Non complété
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* =====================================
                    SOUS-ONGLET SATISFACTION (Correction 517)
                ===================================== */}
                {subTab === "satisfaction" && (
                  <motion.div
                    key="satisfaction-apprenants"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Bloc Évaluation à chaud */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-center justify-center">
                              <ThermometerSun className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                Évaluation à chaud
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Satisfaction immédiate en fin de formation
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              satisfactionChaudCompletes === nombreApprenants ? "text-green-600" : "text-amber-600"
                            }`}>
                              {satisfactionChaudCompletes}/{nombreApprenants} complétés
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {apprenantsEvals.map((apprenant) => (
                          <div key={`chaud-${apprenant.id}`} className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {apprenant.prenom} {apprenant.nom}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{apprenant.email}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              {apprenant.satisfactionChaud?.status === "completed" ? (
                                <>
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-xs rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Complété
                                  </span>
                                  {apprenant.satisfactionChaud.resultId && (
                                    <Link
                                      href={`/intervenant/evaluations/satisfaction/${apprenant.satisfactionChaud.resultId}?token=${token}`}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors"
                                    >
                                      <Eye className="w-4 h-4" />
                                      Voir
                                    </Link>
                                  )}
                                </>
                              ) : apprenant.satisfactionChaud?.status === "not_available" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full">
                                  <AlertCircle className="w-3 h-3" />
                                  Pas encore disponible
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs rounded-full">
                                  <Clock className="w-3 h-3" />
                                  Non complété
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bloc Évaluation à froid */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-500/20 rounded-lg flex items-center justify-center">
                              <Snowflake className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                Évaluation à froid
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Satisfaction 3 mois après la fin de la formation
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              satisfactionFroidCompletes === nombreApprenants ? "text-green-600" : "text-amber-600"
                            }`}>
                              {satisfactionFroidCompletes}/{nombreApprenants} complétés
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {apprenantsEvals.map((apprenant) => (
                          <div key={`froid-${apprenant.id}`} className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {apprenant.prenom} {apprenant.nom}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{apprenant.email}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              {apprenant.satisfactionFroid?.status === "completed" ? (
                                <>
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-xs rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Complété
                                  </span>
                                  {apprenant.satisfactionFroid.resultId && (
                                    <Link
                                      href={`/intervenant/evaluations/satisfaction/${apprenant.satisfactionFroid.resultId}?token=${token}`}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors"
                                    >
                                      <Eye className="w-4 h-4" />
                                      Voir
                                    </Link>
                                  )}
                                </>
                              ) : apprenant.satisfactionFroid?.status === "not_available" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full">
                                  <AlertCircle className="w-3 h-3" />
                                  À venir
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs rounded-full">
                                  <Clock className="w-3 h-3" />
                                  Non complété
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
