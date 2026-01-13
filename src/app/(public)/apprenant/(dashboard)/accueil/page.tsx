"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Award,
  Download,
  ExternalLink,
  MessageSquare,
  MapPin,
  User,
  X,
  CalendarDays,
  Video,
  Building2,
  Info,
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
    certifications, // Qualiopi IND 3
    sessions, // Correction 427-428
  } = useApprenantPortal();

  // Correction 428: État pour le popup de détails session
  const [selectedSessionForDetails, setSelectedSessionForDetails] = useState<typeof sessions[0] | null>(null);

  // Correction 427: Calculs des compteurs orientés session
  const sessionStats = useMemo(() => {
    const now = new Date();

    // Sessions à venir = sessions avec au moins une journée dans le futur
    const sessionsAVenir = sessions.filter((s) => {
      const futureDates = s.journees.filter((j) => new Date(j.date) >= now);
      return futureDates.length > 0 && s.status !== "TERMINEE" && s.status !== "ANNULEE";
    });

    // Prochaine session = date de la prochaine journée
    let prochaineSessionDate: Date | null = null;
    let prochaineSessionLabel = "—";

    for (const session of sessions) {
      for (const journee of session.journees) {
        const journeeDate = new Date(journee.date);
        if (journeeDate >= now) {
          if (!prochaineSessionDate || journeeDate < prochaineSessionDate) {
            prochaineSessionDate = journeeDate;
          }
        }
      }
    }

    if (prochaineSessionDate) {
      const daysDiff = Math.ceil((prochaineSessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === 0) {
        prochaineSessionLabel = "Aujourd'hui";
      } else if (daysDiff === 1) {
        prochaineSessionLabel = "Demain";
      } else if (daysDiff <= 7) {
        prochaineSessionLabel = `Dans ${daysDiff}j`;
      } else {
        prochaineSessionLabel = prochaineSessionDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
      }
    }

    return {
      sessionsAVenir: sessionsAVenir.length,
      prochaineSession: prochaineSessionLabel,
      emargementsEnAttente: dashboardStats?.emargementsEnAttente || 0,
      messagesNonLus: dashboardStats?.messagesNonLus || 0,
    };
  }, [sessions, dashboardStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  // Calculs des stats LMS (conservés pour rétro-compatibilité)
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

  // Correction 426: Message de bienvenue simplifié
  const getGreeting = () => {
    return "Bonjour";
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

        {/* Correction 427: Stats rapides orientées session */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-3xl font-bold">{sessionStats.sessionsAVenir}</p>
            <p className="text-sm text-brand-100">Sessions à venir</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-3xl font-bold text-xl">{sessionStats.prochaineSession}</p>
            <p className="text-sm text-brand-100">Prochaine session</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 relative">
            <p className="text-3xl font-bold">{sessionStats.emargementsEnAttente}</p>
            <p className="text-sm text-brand-100">Émargements</p>
            {sessionStats.emargementsEnAttente > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse" />
            )}
          </div>
          <div className="bg-white/10 rounded-xl p-3 relative">
            <p className="text-3xl font-bold">{sessionStats.messagesNonLus}</p>
            <p className="text-sm text-brand-100">Messages</p>
            {sessionStats.messagesNonLus > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse" />
            )}
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

      {/* Correction 428: Mes sessions de formation */}
      {sessions.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700"
        >
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Mes sessions ({sessions.length})
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {sessions.map((session) => {
              // Calculer les dates min/max des journées
              const journeesSorted = [...session.journees].sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
              );
              const dateDebut = journeesSorted[0]?.date;
              const dateFin = journeesSorted[journeesSorted.length - 1]?.date;

              // Statut affiché
              const getStatusBadge = () => {
                switch (session.status) {
                  case "PLANIFIEE":
                    return { label: "Planifiée", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" };
                  case "EN_COURS":
                    return { label: "En cours", className: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" };
                  case "TERMINEE":
                    return { label: "Terminée", className: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400" };
                  case "ANNULEE":
                    return { label: "Annulée", className: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" };
                  default:
                    return { label: session.status, className: "bg-gray-100 text-gray-700" };
                }
              };
              const statusBadge = getStatusBadge();

              // Icône modalité
              const getModaliteIcon = () => {
                switch (session.modalite) {
                  case "PRESENTIEL":
                    return <Building2 className="w-3.5 h-3.5" />;
                  case "DISTANCIEL":
                    return <Video className="w-3.5 h-3.5" />;
                  case "MIXTE":
                    return <CalendarDays className="w-3.5 h-3.5" />;
                  default:
                    return <Calendar className="w-3.5 h-3.5" />;
                }
              };

              return (
                <div
                  key={session.participationId}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  {/* Header: image + titre */}
                  <div className="flex items-start gap-3 mb-3">
                    {session.formation.image ? (
                      <img
                        src={session.formation.image}
                        alt={session.formation.titre}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-white/70" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
                        {session.formation.titre}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {session.reference}
                      </p>
                    </div>
                  </div>

                  {/* Infos session */}
                  <div className="space-y-1.5 mb-3">
                    {/* Dates */}
                    {dateDebut && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {new Date(dateDebut).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          {dateFin && dateFin !== dateDebut && (
                            <> → {new Date(dateFin).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</>
                          )}
                        </span>
                        <span className="text-gray-400">
                          ({session.journees.length} jour{session.journees.length > 1 ? "s" : ""})
                        </span>
                      </div>
                    )}

                    {/* Modalité + Lieu */}
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      {getModaliteIcon()}
                      <span>
                        {session.modalite === "PRESENTIEL" ? "Présentiel" :
                         session.modalite === "DISTANCIEL" ? "Distanciel" :
                         session.modalite === "MIXTE" ? "Mixte" : session.modalite}
                      </span>
                      {session.lieu && (
                        <>
                          <span className="text-gray-300">•</span>
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate">{session.lieu.nom}</span>
                        </>
                      )}
                    </div>

                    {/* Formateur */}
                    {session.formateur && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>{session.formateur.prenom} {session.formateur.nom}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer: statut + bouton */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}>
                      {statusBadge.label}
                    </span>
                    <button
                      onClick={() => setSelectedSessionForDetails(session)}
                      className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                    >
                      <Info className="w-3.5 h-3.5" />
                      Voir les détails
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ) : inscriptions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center"
        >
          <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Aucune session disponible
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Vous n&apos;êtes inscrit à aucune session de formation pour le moment.
          </p>
        </motion.div>
      ) : null}

      {/* Qualiopi IND 3 - Mes certifications */}
      {certifications && certifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800"
        >
          <div className="p-5 border-b border-amber-200 dark:border-amber-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Mes certifications
              </h2>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {certifications.length} certification{certifications.length > 1 ? "s" : ""} obtenue{certifications.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="divide-y divide-amber-200 dark:divide-amber-700">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {cert.formationTitre}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm">
                    {cert.numeroFicheRS && (
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs">
                        {cert.numeroFicheRS}
                      </span>
                    )}
                    {cert.dateCertification && (
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        Obtenue le {new Date(cert.dateCertification).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                    {cert.numeroCertificat && (
                      <span className="text-gray-500 dark:text-gray-400 text-xs font-mono">
                        N° {cert.numeroCertificat}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {cert.lienFranceCompetences && (
                    <a
                      href={cert.lienFranceCompetences}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                      title="Voir sur France Compétences"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                  {cert.numeroCertificat && (
                    <a
                      href={`/api/apprenant/certificate/${cert.id}`}
                      className="p-2 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                      title="Télécharger le certificat"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Correction 428: Popup détails session */}
      <AnimatePresence>
        {selectedSessionForDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedSessionForDetails(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header du popup */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {selectedSessionForDetails.formation.image ? (
                    <img
                      src={selectedSessionForDetails.formation.image}
                      alt={selectedSessionForDetails.formation.titre}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-white/70" />
                    </div>
                  )}
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {selectedSessionForDetails.formation.titre}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedSessionForDetails.reference}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSessionForDetails(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenu du popup */}
              <div className="p-4 space-y-5">
                {/* Section: Informations générales */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-brand-500" />
                    Informations générales
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 space-y-2">
                    {selectedSessionForDetails.nom && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">Nom</span>
                        <span className="text-sm text-gray-900 dark:text-white">{selectedSessionForDetails.nom}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">Statut</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        selectedSessionForDetails.status === "PLANIFIEE" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" :
                        selectedSessionForDetails.status === "EN_COURS" ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" :
                        selectedSessionForDetails.status === "TERMINEE" ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400" :
                        selectedSessionForDetails.status === "ANNULEE" ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {selectedSessionForDetails.status === "PLANIFIEE" ? "Planifiée" :
                         selectedSessionForDetails.status === "EN_COURS" ? "En cours" :
                         selectedSessionForDetails.status === "TERMINEE" ? "Terminée" :
                         selectedSessionForDetails.status === "ANNULEE" ? "Annulée" :
                         selectedSessionForDetails.status}
                      </span>
                    </div>
                    {selectedSessionForDetails.entreprise && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">Entreprise</span>
                        <span className="text-sm text-gray-900 dark:text-white">{selectedSessionForDetails.entreprise.raisonSociale}</span>
                      </div>
                    )}
                    {selectedSessionForDetails.formateur && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">Formateur</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {selectedSessionForDetails.formateur.prenom} {selectedSessionForDetails.formateur.nom}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section: Modalité et lieu */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-500" />
                    Modalité et lieu
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">Format</span>
                      <div className="flex items-center gap-1.5">
                        {selectedSessionForDetails.modalite === "PRESENTIEL" ? (
                          <Building2 className="w-4 h-4 text-gray-400" />
                        ) : selectedSessionForDetails.modalite === "DISTANCIEL" ? (
                          <Video className="w-4 h-4 text-gray-400" />
                        ) : (
                          <CalendarDays className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-900 dark:text-white">
                          {selectedSessionForDetails.modalite === "PRESENTIEL" ? "Présentiel" :
                           selectedSessionForDetails.modalite === "DISTANCIEL" ? "Distanciel" :
                           selectedSessionForDetails.modalite === "MIXTE" ? "Mixte" :
                           selectedSessionForDetails.modalite}
                        </span>
                      </div>
                    </div>
                    {selectedSessionForDetails.lieu && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">Lieu</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {selectedSessionForDetails.lieu.nom}
                          {selectedSessionForDetails.lieu.ville && (
                            <span className="text-gray-500 dark:text-gray-400"> ({selectedSessionForDetails.lieu.ville})</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section: Planning des journées */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-500" />
                    Planning ({selectedSessionForDetails.journees.length} jour{selectedSessionForDetails.journees.length > 1 ? "s" : ""})
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl divide-y divide-gray-200 dark:divide-gray-600">
                    {[...selectedSessionForDetails.journees]
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((journee, idx) => (
                        <div key={journee.id} className="p-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                              {idx + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {new Date(journee.date).toLocaleDateString("fr-FR", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              })}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {journee.heureDebutMatin} - {journee.heureFinMatin} / {journee.heureDebutAprem} - {journee.heureFinAprem}
                            </p>
                          </div>
                          {/* Indicateur si la journée est passée ou à venir */}
                          {new Date(journee.date) < new Date() ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Description de la formation si disponible */}
                {selectedSessionForDetails.formation.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-brand-500" />
                      À propos de la formation
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                      {selectedSessionForDetails.formation.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer du popup */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSelectedSessionForDetails(null)}
                  className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
