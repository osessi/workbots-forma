"use client";

import React, { useState, useEffect } from "react";
import { useRequireIntervenantAuth, useIntervenantPortal } from "@/context/IntervenantPortalContext";
import {
  ClipboardList,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  BarChart3,
} from "lucide-react";

interface ApprenantSuivi {
  id: string;
  nom: string;
  prenom: string;
  progression: number;
  presenceRate: number;
  evaluationsCompletes: number;
  evaluationsTotal: number;
  statut: "excellent" | "bon" | "attention" | "critique";
}

export default function IntervenantSuiviPage() {
  useRequireIntervenantAuth();
  const { selectedSession, token, isLoading } = useIntervenantPortal();
  const [apprenantsSuivi, setApprenantsSuivi] = useState<ApprenantSuivi[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (selectedSession && token) {
      fetchSuivi();
    }
  }, [selectedSession, token]);

  const fetchSuivi = async () => {
    if (!selectedSession || !token) return;

    setLoadingData(true);
    try {
      const res = await fetch(`/api/intervenant/suivi?token=${token}&sessionId=${selectedSession.id}`);
      if (res.ok) {
        const data = await res.json();
        setApprenantsSuivi(data.apprenants || []);
      }
    } catch (error) {
      console.error("Erreur fetch suivi:", error);
    } finally {
      setLoadingData(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!selectedSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ClipboardList className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Aucune session sélectionnée
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Veuillez sélectionner une session pour voir le suivi pédagogique.
        </p>
      </div>
    );
  }

  const getStatutInfo = (statut: string) => {
    switch (statut) {
      case "excellent":
        return { icon: CheckCircle, color: "text-green-500", bg: "bg-green-100 dark:bg-green-500/20", label: "Excellent" };
      case "bon":
        return { icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-500/20", label: "Bon" };
      case "attention":
        return { icon: Clock, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-500/20", label: "Attention" };
      case "critique":
        return { icon: AlertCircle, color: "text-red-500", bg: "bg-red-100 dark:bg-red-500/20", label: "Critique" };
      default:
        return { icon: Clock, color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-700", label: "N/A" };
    }
  };

  // Stats globales
  const moyenneProgression = apprenantsSuivi.length > 0
    ? Math.round(apprenantsSuivi.reduce((sum, a) => sum + a.progression, 0) / apprenantsSuivi.length)
    : 0;

  const moyennePresence = apprenantsSuivi.length > 0
    ? Math.round(apprenantsSuivi.reduce((sum, a) => sum + a.presenceRate, 0) / apprenantsSuivi.length)
    : 0;

  const apprenantsEnDifficulte = apprenantsSuivi.filter(a => a.statut === "attention" || a.statut === "critique").length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Suivi pédagogique
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {selectedSession.formation.titre} - Progression des apprenants
        </p>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs">Apprenants</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {apprenantsSuivi.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Progression moy.</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {moyenneProgression}%
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs">Présence moy.</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {moyennePresence}%
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">En difficulté</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">
            {apprenantsEnDifficulte}
          </p>
        </div>
      </div>

      {/* Liste des apprenants */}
      {loadingData ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : apprenantsSuivi.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            Aucun apprenant inscrit à cette session
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* En-tête tableau */}
          <div className="hidden md:grid md:grid-cols-6 gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400">
            <div className="col-span-2">Apprenant</div>
            <div className="text-center">Progression</div>
            <div className="text-center">Présence</div>
            <div className="text-center">Évaluations</div>
            <div className="text-center">Statut</div>
          </div>

          {/* Lignes */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {apprenantsSuivi.map((apprenant) => {
              const statutInfo = getStatutInfo(apprenant.statut);
              const StatutIcon = statutInfo.icon;

              return (
                <div
                  key={apprenant.id}
                  className="flex flex-col md:grid md:grid-cols-6 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {/* Apprenant */}
                  <div className="col-span-2 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {apprenant.prenom[0]}{apprenant.nom[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {apprenant.prenom} {apprenant.nom}
                      </p>
                    </div>
                  </div>

                  {/* Progression */}
                  <div className="flex items-center justify-center md:justify-center">
                    <div className="w-full max-w-[120px]">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500 md:hidden">Progression</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{apprenant.progression}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            apprenant.progression >= 80 ? "bg-green-500" :
                            apprenant.progression >= 50 ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${apprenant.progression}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Présence */}
                  <div className="flex items-center justify-between md:justify-center">
                    <span className="text-gray-500 text-sm md:hidden">Présence</span>
                    <span className={`font-medium ${
                      apprenant.presenceRate >= 80 ? "text-green-600" :
                      apprenant.presenceRate >= 50 ? "text-amber-600" : "text-red-600"
                    }`}>
                      {apprenant.presenceRate}%
                    </span>
                  </div>

                  {/* Évaluations */}
                  <div className="flex items-center justify-between md:justify-center">
                    <span className="text-gray-500 text-sm md:hidden">Évaluations</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {apprenant.evaluationsCompletes}/{apprenant.evaluationsTotal}
                    </span>
                  </div>

                  {/* Statut */}
                  <div className="flex items-center justify-between md:justify-center">
                    <span className="text-gray-500 text-sm md:hidden">Statut</span>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full ${statutInfo.bg}`}>
                      <StatutIcon className={`w-4 h-4 ${statutInfo.color}`} />
                      <span className={`text-xs font-medium ${statutInfo.color}`}>
                        {statutInfo.label}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
