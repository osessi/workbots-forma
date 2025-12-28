"use client";

import React from "react";
import { motion } from "framer-motion";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Play,
  TrendingUp,
  Calendar,
  FileText,
  Star,
  PenLine,
  ArrowRight,
  GraduationCap,
  Loader2,
} from "lucide-react";

// =====================================
// PAGE ACCUEIL
// =====================================

export default function AccueilPage() {
  const {
    apprenant,
    organization,
    inscriptions,
    selectedInscription,
    isLoading,
    dashboardStats,
  } = useApprenantPortal();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  // Calculs des stats
  const totalFormations = inscriptions.length;
  const formationsEnCours = inscriptions.filter(i => i.statut === "EN_COURS").length;
  const formationsTerminees = inscriptions.filter(i => i.statut === "COMPLETE").length;
  const progressionMoyenne = totalFormations > 0
    ? Math.round(inscriptions.reduce((acc, i) => acc + i.progression, 0) / totalFormations)
    : 0;
  const tempsTotal = inscriptions.reduce((acc, i) => acc + (i.tempsTotal || 0), 0);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
  };

  // Obtenir l'heure pour le message de bienvenue
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  return (
    <div className="space-y-6">
      {/* Header avec message de bienvenue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              {getGreeting()}, {apprenant?.prenom} !
            </h1>
            <p className="text-brand-100">
              Bienvenue sur votre espace de formation {organization?.nomCommercial || organization?.name}
            </p>
          </div>
          <div className="hidden sm:block">
            <GraduationCap className="w-16 h-16 text-white/20" />
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-3xl font-bold">{totalFormations}</p>
            <p className="text-sm text-brand-100">Formations</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-3xl font-bold">{progressionMoyenne}%</p>
            <p className="text-sm text-brand-100">Progression</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-3xl font-bold">{formationsTerminees}</p>
            <p className="text-sm text-brand-100">Terminées</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-3xl font-bold">{formatDuration(tempsTotal)}</p>
            <p className="text-sm text-brand-100">Temps total</p>
          </div>
        </div>
      </motion.div>

      {/* Formation en cours */}
      {selectedInscription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Formation en cours
              </h2>
              <Link
                href="/apprenant/programme"
                className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                Voir le programme
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-start gap-4">
              {selectedInscription.formation.image ? (
                <img
                  src={selectedInscription.formation.image}
                  alt={selectedInscription.formation.titre}
                  className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-10 h-10 text-white/50" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedInscription.formation.titre}
                </h3>

                {/* Barre de progression */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Progression</span>
                    <span className="text-sm font-semibold text-brand-600">
                      {selectedInscription.progression}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedInscription.progression}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(selectedInscription.tempsTotal || 0)} passé
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedInscription.statut === "COMPLETE"
                      ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                      : selectedInscription.statut === "EN_COURS"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
                  }`}>
                    {selectedInscription.statut === "COMPLETE" ? "Terminée" :
                     selectedInscription.statut === "EN_COURS" ? "En cours" : "Non commencée"}
                  </span>
                </div>
              </div>

              <Link
                href="/apprenant/suivi"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors"
              >
                <Play className="w-4 h-4" />
                Continuer
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Actions rapides */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Accès rapide
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/apprenant/suivi"
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="font-medium text-gray-900 dark:text-white">Suivi</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ma progression</p>
          </Link>

          <Link
            href="/apprenant/emargements"
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all group relative"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <PenLine className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="font-medium text-gray-900 dark:text-white">Émargements</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Signer mes présences</p>
            {dashboardStats?.emargementsEnAttente ? (
              <span className="absolute top-3 right-3 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold rounded-full bg-red-500 text-white">
                {dashboardStats.emargementsEnAttente}
              </span>
            ) : null}
          </Link>

          <Link
            href="/apprenant/evaluations"
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all group relative"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="font-medium text-gray-900 dark:text-white">Évaluations</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Mes questionnaires</p>
            {dashboardStats?.evaluationsEnAttente ? (
              <span className="absolute top-3 right-3 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold rounded-full bg-red-500 text-white">
                {dashboardStats.evaluationsEnAttente}
              </span>
            ) : null}
          </Link>

          <Link
            href="/apprenant/documents"
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all group relative"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="font-medium text-gray-900 dark:text-white">Documents</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Mes fichiers</p>
            {dashboardStats?.documentsDisponibles ? (
              <span className="absolute top-3 right-3 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold rounded-full bg-brand-500 text-white">
                {dashboardStats.documentsDisponibles}
              </span>
            ) : null}
          </Link>
        </div>
      </motion.div>

      {/* Liste des formations si plusieurs */}
      {inscriptions.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700"
        >
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Mes formations ({inscriptions.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {inscriptions.map((inscription, index) => (
              <div
                key={inscription.id}
                className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-white/70" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {inscription.formation.titre}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full max-w-[120px]">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{ width: `${inscription.progression}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {inscription.progression}%
                    </span>
                  </div>
                </div>

                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  inscription.statut === "COMPLETE"
                    ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                    : inscription.statut === "EN_COURS"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
                }`}>
                  {inscription.statut === "COMPLETE" ? "Terminée" :
                   inscription.statut === "EN_COURS" ? "En cours" : "Non commencée"}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Message si aucune formation */}
      {inscriptions.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center"
        >
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Aucune formation disponible
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Vous n&apos;êtes inscrit à aucune formation pour le moment.
          </p>
        </motion.div>
      )}
    </div>
  );
}
