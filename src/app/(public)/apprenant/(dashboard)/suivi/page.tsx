"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import {
  BarChart3,
  Clock,
  CheckCircle2,
  Play,
  TrendingUp,
  Calendar,
  Award,
  Target,
  Loader2,
  AlertCircle,
  BookOpen,
} from "lucide-react";

interface Module {
  id: string;
  titre: string;
  ordre: number;
  duree: number | null;
  progression: number;
  statut: string;
  tempsConsacre: number;
}

interface SuiviData {
  progression: {
    global: number;
    statut: string;
    tempsTotal: number;
    modulesTermines: number;
    totalModules: number;
  };
  modules: Module[];
  evaluations: {
    total: number;
    reussies: number;
    moyenneScore: number | null;
  };
  presence: {
    joursPresents: number;
    joursTotal: number;
    tauxPresence: number;
  };
  statistiques: {
    tempsHebdo: number;
    dernierAcces: string | null;
    joursConsecutifs: number;
  };
}

// =====================================
// COMPOSANT STAT CARD
// =====================================

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          {subValue && (
            <p className="text-xs text-brand-600 dark:text-brand-400 mt-0.5">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================
// COMPOSANT MODULE PROGRESSION
// =====================================

function ModuleProgressionCard({ module, index }: { module: Module; index: number }) {
  const getStatusConfig = () => {
    switch (module.statut) {
      case "TERMINE":
        return {
          bg: "bg-green-100 dark:bg-green-500/20",
          text: "text-green-600 dark:text-green-400",
          icon: CheckCircle2,
          label: "Terminé",
        };
      case "EN_COURS":
        return {
          bg: "bg-brand-100 dark:bg-brand-500/20",
          text: "text-brand-600 dark:text-brand-400",
          icon: Play,
          label: "En cours",
        };
      default:
        return {
          bg: "bg-gray-100 dark:bg-gray-700",
          text: "text-gray-500 dark:text-gray-400",
          icon: Clock,
          label: "À venir",
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
    >
      {/* Numéro */}
      <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
        <span className={`font-bold ${config.text}`}>{module.ordre}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-gray-900 dark:text-white truncate">
            {module.titre}
          </h4>
          <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          {module.duree && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {module.duree}h prévues
            </span>
          )}
          {module.tempsConsacre > 0 && (
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {Math.round(module.tempsConsacre / 60)}h passées
            </span>
          )}
        </div>
      </div>

      {/* Progression */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-24 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              module.statut === "TERMINE" ? "bg-green-500" : "bg-brand-500"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${module.progression}%` }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 w-10 text-right">
          {module.progression}%
        </span>
      </div>
    </motion.div>
  );
}

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function SuiviPage() {
  const { token, selectedInscription } = useApprenantPortal();
  const [data, setData] = useState<SuiviData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuivi = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const params = new URLSearchParams({ token });
        if (selectedInscription?.id) {
          params.append("inscriptionId", selectedInscription.id);
        }

        const res = await fetch(`/api/apprenant/suivi?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Erreur lors du chargement du suivi");
        }

        const suiviData = await res.json();
        setData(suiviData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchSuivi();
  }, [token, selectedInscription?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement du suivi...</p>
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

  const progressionPercentage = data?.progression?.global || 0;
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (progressionPercentage / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Suivi pédagogique
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Suivez votre progression et vos performances
        </p>
      </div>

      {/* Progression globale */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Cercle de progression */}
          <div className="relative w-32 h-32 mx-auto md:mx-0 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="60"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-white/20"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="60"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className="text-white"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ strokeDasharray: circumference }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-3xl font-bold">{progressionPercentage}%</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-4">Progression globale</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-white/70 text-sm">Modules</p>
                <p className="text-lg font-semibold">
                  {data?.progression?.modulesTermines || 0}/{data?.progression?.totalModules || 0}
                </p>
              </div>
              <div>
                <p className="text-white/70 text-sm">Temps total</p>
                <p className="text-lg font-semibold">
                  {Math.round((data?.progression?.tempsTotal || 0) / 60)}h
                </p>
              </div>
              <div>
                <p className="text-white/70 text-sm">Évaluations</p>
                <p className="text-lg font-semibold">
                  {data?.evaluations?.reussies || 0}/{data?.evaluations?.total || 0}
                </p>
              </div>
              <div>
                <p className="text-white/70 text-sm">Présence</p>
                <p className="text-lg font-semibold">
                  {data?.presence?.tauxPresence || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          label="Temps cette semaine"
          value={`${Math.round((data?.statistiques?.tempsHebdo || 0) / 60)}h`}
          color="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={Calendar}
          label="Jours consécutifs"
          value={data?.statistiques?.joursConsecutifs || 0}
          subValue="de connexion"
          color="bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400"
        />
        <StatCard
          icon={Target}
          label="Score moyen"
          value={data?.evaluations?.moyenneScore !== null ? `${data?.evaluations?.moyenneScore}%` : "—"}
          color="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          icon={Award}
          label="Taux présence"
          value={`${data?.presence?.tauxPresence || 0}%`}
          subValue={`${data?.presence?.joursPresents || 0}/${data?.presence?.joursTotal || 0} jours`}
          color="bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400"
        />
      </div>

      {/* Progression par module */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Progression par module
          </h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              Terminé
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-brand-500" />
              En cours
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
              À venir
            </span>
          </div>
        </div>

        {data?.modules && data.modules.length > 0 ? (
          <div className="space-y-3">
            {data.modules.map((module, index) => (
              <ModuleProgressionCard key={module.id} module={module} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucun module disponible
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
