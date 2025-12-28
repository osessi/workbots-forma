"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import {
  BookOpen,
  Clock,
  FileText,
  PenLine,
  Star,
  Calendar,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Play,
  User,
  Award,
  TrendingUp,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Types pour les données du dashboard
interface DashboardData {
  stats: {
    evaluationsEnAttente: number;
    documentsDisponibles: number;
    emargementsEnAttente: number;
    prochainsCréneaux: number;
  };
  progression: {
    global: number;
    statut: string;
    tempsTotal: number;
    modules: Array<{
      id: string;
      titre: string;
      ordre: number;
      duree: number | null;
      progression: number;
      statut: string;
    }>;
  } | null;
  actionsUrgentes: Array<{
    type: string;
    titre: string;
    description: string;
    action: string;
    actionUrl: string;
    priorite: "haute" | "moyenne" | "basse";
  }>;
  prochainsCreneaux: Array<{
    id: string;
    date: string;
    heureDebut: string;
    heureFin: string;
    sessionNom: string;
    lieu: string | null;
    formateur: string | null;
  }>;
  formateur: {
    id: string;
    nom: string;
    prenom: string;
    fonction: string | null;
    photoUrl: string | null;
    specialites: string[];
  } | null;
  formation: {
    id: string;
    titre: string;
    description: string | null;
    image: string | null;
    dureeHeures: number;
    nombreModules: number;
  } | null;
  evaluations: Array<{
    id: string;
    titre: string;
    type: string;
    description: string | null;
    dureeEstimee: number | null;
    resultat: {
      status: string;
      score: number | null;
      datePassage: string | null;
    } | null;
  }>;
}

// =====================================
// WIDGET: PROGRESSION CIRCULAIRE
// =====================================

function ProgressionWidget({ progression }: { progression: DashboardData["progression"] }) {
  const percentage = progression?.global || 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "EN_COURS":
        return "text-blue-500";
      case "TERMINE":
        return "text-green-500";
      case "NON_COMMENCE":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case "EN_COURS":
        return "En cours";
      case "TERMINE":
        return "Terminé";
      case "NON_COMMENCE":
        return "Non commencé";
      default:
        return statut;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Ma progression
        </h3>
        <Link
          href="/apprenant/suivi"
          className="text-sm text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
        >
          Détails
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex items-center gap-6">
        {/* Cercle de progression */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            {/* Cercle de fond */}
            <circle
              cx="56"
              cy="56"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-100 dark:text-gray-700"
            />
            {/* Cercle de progression */}
            <motion.circle
              cx="56"
              cy="56"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className="text-brand-500"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ strokeDasharray: circumference }}
            />
          </svg>
          {/* Pourcentage au centre */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <motion.span
                className="text-2xl font-bold text-gray-900 dark:text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {percentage}%
              </motion.span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Statut</span>
            <span className={`text-sm font-medium ${getStatusColor(progression?.statut || "")}`}>
              {getStatusLabel(progression?.statut || "NON_COMMENCE")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Temps passé</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {Math.round((progression?.tempsTotal || 0) / 60)}h
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Modules</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {progression?.modules.filter((m) => m.statut === "TERMINE").length || 0}/
              {progression?.modules.length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Barre de progression des modules */}
      {progression?.modules && progression.modules.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
            Progression par module
          </p>
          <div className="space-y-2">
            {progression.modules.slice(0, 4).map((module) => (
              <div key={module.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                    {module.titre}
                  </p>
                </div>
                <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-brand-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${module.progression}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-8 text-right">{module.progression}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================
// WIDGET: ACTIONS URGENTES
// =====================================

function ActionsUrgentesWidget({
  actions,
  stats,
}: {
  actions: DashboardData["actionsUrgentes"];
  stats: DashboardData["stats"];
}) {
  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case "haute":
        return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400";
      case "moyenne":
        return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400";
      case "basse":
        return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "emargement":
        return PenLine;
      case "evaluation":
        return Star;
      case "document":
        return FileText;
      default:
        return AlertCircle;
    }
  };

  // Si pas d'actions urgentes, afficher un message positif
  if (actions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Actions à faire
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Tout est à jour !
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Aucune action urgente pour le moment
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Actions à faire
        </h3>
        <span className="text-xs font-medium px-2 py-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-full">
          {actions.length} en attente
        </span>
      </div>

      <div className="space-y-3">
        {actions.map((action, index) => {
          const Icon = getTypeIcon(action.type);
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={action.actionUrl}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${getPriorityColor(
                    action.priorite
                  )}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {action.titre}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition-colors" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// =====================================
// WIDGET: PROCHAINS CRÉNEAUX
// =====================================

function ProchainsCreneauxWidget({
  creneaux,
}: {
  creneaux: DashboardData["prochainsCreneaux"];
}) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const isToday = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (dateStr: string) => {
    const date = new Date(dateStr);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Prochains créneaux
        </h3>
        <Link
          href="/apprenant/calendrier"
          className="text-sm text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
        >
          Calendrier
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {creneaux.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucun créneau à venir
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {creneaux.map((creneau, index) => (
            <motion.div
              key={creneau.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
            >
              {/* Date badge */}
              <div
                className={`flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                  isToday(creneau.date)
                    ? "bg-brand-500 text-white"
                    : isTomorrow(creneau.date)
                    ? "bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                <span className="text-xs font-medium uppercase">
                  {isToday(creneau.date)
                    ? "Auj."
                    : isTomorrow(creneau.date)
                    ? "Dem."
                    : new Date(creneau.date).toLocaleDateString("fr-FR", {
                        weekday: "short",
                      })}
                </span>
                <span className="text-lg font-bold">
                  {new Date(creneau.date).getDate()}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {creneau.sessionNom}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {creneau.heureDebut} - {creneau.heureFin}
                  </span>
                </div>
                {creneau.lieu && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                    {creneau.lieu}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================
// WIDGET: FORMATEUR
// =====================================

function FormateurWidget({
  formateur,
}: {
  formateur: DashboardData["formateur"];
}) {
  if (!formateur) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Votre formateur
      </h3>

      <div className="flex items-center gap-4">
        {/* Photo */}
        {formateur.photoUrl ? (
          <Image
            src={formateur.photoUrl}
            alt={`${formateur.prenom} ${formateur.nom}`}
            width={64}
            height={64}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xl font-semibold">
            {formateur.prenom[0]}
            {formateur.nom[0]}
          </div>
        )}

        {/* Info */}
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-white">
            {formateur.prenom} {formateur.nom}
          </p>
          {formateur.fonction && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formateur.fonction}
            </p>
          )}
          {formateur.specialites && formateur.specialites.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {formateur.specialites.slice(0, 3).map((spec, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full"
                >
                  {spec}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <Link
        href="/apprenant/intervenants"
        className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 rounded-xl transition-colors"
      >
        <User className="w-4 h-4" />
        Voir tous les intervenants
      </Link>
    </div>
  );
}

// =====================================
// WIDGET: FORMATION
// =====================================

function FormationWidget({
  formation,
}: {
  formation: DashboardData["formation"];
}) {
  if (!formation) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-6 text-white relative overflow-hidden">
      {/* Décoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative">
        <div className="flex items-start gap-4">
          {formation.image ? (
            <Image
              src={formation.image}
              alt={formation.titre}
              width={80}
              height={80}
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-10 h-10 text-white/80" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg leading-tight">{formation.titre}</h3>
            {formation.description && (
              <p className="text-white/80 text-sm mt-1 line-clamp-2">
                {formation.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/70" />
            <span className="text-sm">
              <span className="font-semibold">{formation.dureeHeures}h</span>{" "}
              <span className="text-white/70">de formation</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-white/70" />
            <span className="text-sm">
              <span className="font-semibold">{formation.nombreModules}</span>{" "}
              <span className="text-white/70">modules</span>
            </span>
          </div>
        </div>

        <Link
          href="/apprenant/programme"
          className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-brand-600 bg-white hover:bg-white/90 rounded-xl transition-colors"
        >
          <Play className="w-4 h-4" />
          Voir le programme
        </Link>
      </div>
    </div>
  );
}

// =====================================
// WIDGET: ÉVALUATIONS
// =====================================

function EvaluationsWidget({
  evaluations,
}: {
  evaluations: DashboardData["evaluations"];
}) {
  const getStatusBadge = (resultat: DashboardData["evaluations"][0]["resultat"]) => {
    if (!resultat) {
      return (
        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
          À faire
        </span>
      );
    }
    switch (resultat.status) {
      case "termine":
      case "valide":
        return (
          <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {resultat.score !== null ? `${resultat.score}%` : "Terminé"}
          </span>
        );
      case "en_cours":
        return (
          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-full">
            En cours
          </span>
        );
      default:
        return (
          <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full">
            En attente
          </span>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "QCM":
        return <Star className="w-4 h-4" />;
      case "ATELIER":
        return <Award className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Évaluations
        </h3>
        <Link
          href="/apprenant/evaluations"
          className="text-sm text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
        >
          Tout voir
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {evaluations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Star className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucune évaluation disponible
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {evaluations.slice(0, 4).map((evaluation, index) => (
            <motion.div
              key={evaluation.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={`/apprenant/evaluations/${evaluation.id}`}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  {getTypeIcon(evaluation.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {evaluation.titre}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {evaluation.type}
                    {evaluation.dureeEstimee && ` • ${evaluation.dureeEstimee} min`}
                  </p>
                </div>
                {getStatusBadge(evaluation.resultat)}
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================
// WIDGET: STATS RAPIDES
// =====================================

function StatsWidget({ stats }: { stats: DashboardData["stats"] }) {
  const items = [
    {
      label: "Émargements",
      value: stats.emargementsEnAttente,
      icon: PenLine,
      color: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",
      href: "/apprenant/emargements",
      badge: stats.emargementsEnAttente > 0,
    },
    {
      label: "Évaluations",
      value: stats.evaluationsEnAttente,
      icon: Star,
      color: "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400",
      href: "/apprenant/evaluations",
      badge: stats.evaluationsEnAttente > 0,
    },
    {
      label: "Documents",
      value: stats.documentsDisponibles,
      icon: FileText,
      color: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
      href: "/apprenant/documents",
      badge: false,
    },
    {
      label: "Créneaux",
      value: stats.prochainsCréneaux,
      icon: Calendar,
      color: "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400",
      href: "/apprenant/calendrier",
      badge: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-brand-500 dark:hover:border-brand-500 transition-colors group"
          >
            {item.badge && item.value > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {item.value > 9 ? "9+" : item.value}
              </span>
            )}
            <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mb-2`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {item.value}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {item.label}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function ApprenantDashboardPage() {
  const { token, apprenant, selectedInscription, setDashboardStats } = useApprenantPortal();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const params = new URLSearchParams({ token });
        if (selectedInscription?.id) {
          params.append("inscriptionId", selectedInscription.id);
        }

        const res = await fetch(`/api/apprenant/dashboard?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Erreur lors du chargement des données");
        }

        const data = await res.json();
        setDashboardData(data);

        // Mettre à jour les stats dans le contexte pour la sidebar
        if (data.stats) {
          setDashboardStats(data.stats);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [token, selectedInscription?.id, setDashboardStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement du dashboard...</p>
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
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bonjour {apprenant?.prenom} !
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Bienvenue dans votre espace de formation
          </p>
        </div>
        {dashboardData?.formation && (
          <Link
            href="/apprenant/programme"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl transition-colors"
          >
            <Play className="w-4 h-4" />
            Reprendre la formation
          </Link>
        )}
      </div>

      {/* Stats rapides */}
      {dashboardData && <StatsWidget stats={dashboardData.stats} />}

      {/* Formation card (si disponible) */}
      {dashboardData?.formation && (
        <FormationWidget formation={dashboardData.formation} />
      )}

      {/* Grille principale */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Colonne gauche */}
        <div className="space-y-6">
          {dashboardData && (
            <ProgressionWidget progression={dashboardData.progression} />
          )}
          {dashboardData && (
            <ActionsUrgentesWidget
              actions={dashboardData.actionsUrgentes}
              stats={dashboardData.stats}
            />
          )}
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          {dashboardData && (
            <ProchainsCreneauxWidget creneaux={dashboardData.prochainsCreneaux} />
          )}
          {dashboardData?.formateur && (
            <FormateurWidget formateur={dashboardData.formateur} />
          )}
          {dashboardData && (
            <EvaluationsWidget evaluations={dashboardData.evaluations} />
          )}
        </div>
      </div>
    </div>
  );
}
