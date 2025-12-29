"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Play,
  Lock,
  ChevronDown,
  ChevronRight,
  FileText,
  Video,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Module {
  id: string;
  titre: string;
  description: string | null;
  ordre: number;
  duree: number | null;
  objectifs: string[];
  contenu: string | Record<string, unknown> | null;
  progression: number;
  statut: string;
}

interface ProgrammeData {
  formation: {
    id: string;
    titre: string;
    description: string | null;
    dureeHeures: number;
    objectifsPedagogiques: string[];
    modalite: string | null;
    publicCible: string | null;
    prerequis: string | null;
    moyensPedagogiques: string | null;
    reference: string | null;
  };
  modules: Module[];
  progression: {
    global: number;
    modulesTermines: number;
    totalModules: number;
  };
}

// =====================================
// COMPOSANT MODULE CARD
// =====================================

function ModuleCard({
  module,
  index,
  isExpanded,
  onToggle,
}: {
  module: Module;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const getStatusIcon = () => {
    switch (module.statut) {
      case "TERMINE":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "EN_COURS":
        return <Play className="w-5 h-5 text-brand-500" />;
      default:
        return <Lock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (module.statut) {
      case "TERMINE":
        return (
          <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full">
            Terminé
          </span>
        );
      case "EN_COURS":
        return (
          <span className="text-xs px-2 py-1 bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400 rounded-full">
            En cours
          </span>
        );
      default:
        return (
          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
            À venir
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header du module */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 md:p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        {/* Numéro & Status */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              module.statut === "TERMINE"
                ? "bg-green-100 dark:bg-green-500/20"
                : module.statut === "EN_COURS"
                ? "bg-brand-100 dark:bg-brand-500/20"
                : "bg-gray-100 dark:bg-gray-700"
            }`}
          >
            <span
              className={`text-lg font-bold ${
                module.statut === "TERMINE"
                  ? "text-green-600 dark:text-green-400"
                  : module.statut === "EN_COURS"
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-gray-400"
              }`}
            >
              {module.ordre}
            </span>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {module.titre}
            </h3>
            {getStatusBadge()}
          </div>
          {module.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
              {module.description}
            </p>
          )}
          {/* Barre de progression */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  module.statut === "TERMINE"
                    ? "bg-green-500"
                    : "bg-brand-500"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${module.progression}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
              {module.progression}%
            </span>
          </div>
        </div>

        {/* Durée & Chevron */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {module.duree && (
            <div className="hidden md:flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              {module.duree}h
            </div>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </motion.div>
        </div>
      </button>

      {/* Contenu expandable */}
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="px-4 md:px-6 pb-6 pt-2 border-t border-gray-100 dark:border-gray-700">
          {/* Description complète */}
          {module.description && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Description
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {module.description}
              </p>
            </div>
          )}

          {/* Objectifs */}
          {module.objectifs && module.objectifs.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Objectifs du module
              </h4>
              <ul className="space-y-1">
                {module.objectifs.map((obj, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                  >
                    <ChevronRight className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contenu */}
          {module.contenu && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Contenu
              </h4>
              {typeof module.contenu === "string" ? (
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                  {module.contenu}
                </p>
              ) : (
                <ul className="space-y-1">
                  {((module.contenu as { items?: string[] })?.items || []).map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                    >
                      <ChevronRight className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Actions */}
          {module.statut !== "NON_COMMENCE" && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors">
                  <Play className="w-4 h-4" />
                  {module.statut === "TERMINE" ? "Revoir" : "Continuer"}
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors">
                  <FileText className="w-4 h-4" />
                  Ressources
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function ProgrammePage() {
  const { token, selectedInscription } = useApprenantPortal();
  const [data, setData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  useEffect(() => {
    const fetchProgramme = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const params = new URLSearchParams({ token });
        if (selectedInscription?.id) {
          params.append("inscriptionId", selectedInscription.id);
        }

        const res = await fetch(`/api/apprenant/programme?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Erreur lors du chargement du programme");
        }

        const programmeData = await res.json();
        setData(programmeData);

        // Expand le module en cours par défaut
        const moduleEnCours = programmeData.modules?.find(
          (m: Module) => m.statut === "EN_COURS"
        );
        if (moduleEnCours) {
          setExpandedModules([moduleEnCours.id]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchProgramme();
  }, [token, selectedInscription?.id]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement du programme...</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Programme de formation
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {data?.formation?.titre || "Découvrez le contenu de votre formation"}
        </p>
      </div>

      {/* Progression globale */}
      {data?.progression && (
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Votre progression</h2>
              <p className="text-white/80 text-sm mt-1">
                {data.progression.modulesTermines} module{data.progression.modulesTermines > 1 ? "s" : ""} terminé{data.progression.modulesTermines > 1 ? "s" : ""} sur {data.progression.totalModules}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 md:w-48 h-3 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${data.progression.global}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <span className="text-xl font-bold">{data.progression.global}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Infos formation */}
      {data?.formation && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Informations sur la formation
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Durée */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Durée</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {data.formation.dureeHeures}h
              </p>
            </div>

            {/* Modalité */}
            {data.formation.modalite && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs font-medium">Modalité</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {data.formation.modalite === "PRESENTIEL" ? "Présentiel" :
                   data.formation.modalite === "DISTANCIEL" ? "Distanciel" :
                   data.formation.modalite === "MIXTE" ? "Mixte" : data.formation.modalite}
                </p>
              </div>
            )}

            {/* Référence */}
            {data.formation.reference && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-medium">Référence</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {data.formation.reference}
                </p>
              </div>
            )}
          </div>

          {/* Public cible */}
          {data.formation.publicCible && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Public cible
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {data.formation.publicCible}
              </p>
            </div>
          )}

          {/* Prérequis */}
          {data.formation.prerequis && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Prérequis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {data.formation.prerequis}
              </p>
            </div>
          )}

          {/* Moyens pédagogiques */}
          {data.formation.moyensPedagogiques && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Moyens pédagogiques
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                {data.formation.moyensPedagogiques}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Objectifs pédagogiques */}
      {data?.formation?.objectifsPedagogiques && data.formation.objectifsPedagogiques.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Objectifs pédagogiques
          </h2>
          <ul className="space-y-2">
            {data.formation.objectifsPedagogiques.map((obj, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-gray-600 dark:text-gray-300"
              >
                <CheckCircle2 className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
                {obj}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Liste des modules */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Modules de la formation
        </h2>
        {data?.modules && data.modules.length > 0 ? (
          <div className="space-y-4">
            {data.modules.map((module, index) => (
              <ModuleCard
                key={module.id}
                module={module}
                index={index}
                isExpanded={expandedModules.includes(module.id)}
                onToggle={() => toggleModule(module.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Aucun module disponible pour le moment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
