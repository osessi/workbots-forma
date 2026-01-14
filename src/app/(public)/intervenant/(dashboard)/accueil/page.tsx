"use client";

// ===========================================
// CORRECTIONS 491-497: Tableau de bord intervenant
// ===========================================
// 491: Encart "Session en cours" - ne pas afficher si terminée
// 492: Tuiles stats = Sessions planifiées/en cours/terminées/total
// 494: Suppression bloc "Session active"
// 496: Badges statut sessions synchronisés avec dates
// 497: Pop-up détails session au clic

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRequireIntervenantAuth, useIntervenantPortal } from "@/context/IntervenantPortalContext";
import {
  Briefcase,
  Users,
  Calendar,
  PenLine,
  ArrowRight,
  Clock,
  MapPin,
  BookOpen,
  Star,
  FileText,
  Video,
  X,
  CheckCircle2,
  PlayCircle,
  CalendarClock,
  LayoutGrid,
} from "lucide-react";

// Types
interface SessionJournee {
  date: string;
  heureDebutMatin?: string | null;
  heureFinMatin?: string | null;
  heureDebutAprem?: string | null;
  heureFinAprem?: string | null;
}

interface SessionData {
  id: string;
  reference: string;
  nom?: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  status: string;
  nombreApprenants: number;
  formation: {
    titre: string;
    image?: string | null;
  };
  lieu?: {
    nom: string;
    typeLieu?: string | null;
    lienVisio?: string | null;
  } | null;
  journees?: SessionJournee[];
  prochaineJournee?: SessionJournee | null;
}

// Correction 496: Calculer le statut réel basé sur les dates
function getSessionRealStatus(session: SessionData): "planifiee" | "en_cours" | "terminee" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Utiliser les journées pour déterminer les vraies dates
  if (session.journees && session.journees.length > 0) {
    const sortedJournees = [...session.journees].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const premiereJournee = new Date(sortedJournees[0].date);
    premiereJournee.setHours(0, 0, 0, 0);
    const derniereJournee = new Date(sortedJournees[sortedJournees.length - 1].date);
    derniereJournee.setHours(23, 59, 59, 999);

    if (today > derniereJournee) {
      return "terminee";
    }
    if (today >= premiereJournee && today <= derniereJournee) {
      return "en_cours";
    }
    return "planifiee";
  }

  // Fallback sur dateDebut/dateFin
  if (session.dateDebut) {
    const dateDebut = new Date(session.dateDebut);
    dateDebut.setHours(0, 0, 0, 0);

    if (session.dateFin) {
      const dateFin = new Date(session.dateFin);
      dateFin.setHours(23, 59, 59, 999);

      if (today > dateFin) {
        return "terminee";
      }
      if (today >= dateDebut && today <= dateFin) {
        return "en_cours";
      }
    }

    if (today < dateDebut) {
      return "planifiee";
    }
  }

  // Fallback sur le status existant
  if (session.status === "EN_COURS") return "en_cours";
  if (session.status === "TERMINEE") return "terminee";
  return "planifiee";
}

// Correction 496: Badge config
function getStatusBadge(status: "planifiee" | "en_cours" | "terminee") {
  switch (status) {
    case "en_cours":
      return {
        label: "En cours",
        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
      };
    case "terminee":
      return {
        label: "Terminée",
        className: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400",
      };
    default:
      return {
        label: "Planifiée",
        className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
      };
  }
}

export default function IntervenantAccueilPage() {
  useRequireIntervenantAuth();
  const { intervenant, dashboardStats, sessions, isLoading } = useIntervenantPortal();

  // Correction 497: État pour la pop-up détails session
  const [selectedSessionDetails, setSelectedSessionDetails] = useState<SessionData | null>(null);

  // Correction 491 & 496: Calculer les stats réelles basées sur les dates
  const sessionStats = React.useMemo(() => {
    let planifiees = 0;
    let enCours = 0;
    let terminees = 0;

    for (const session of sessions) {
      const realStatus = getSessionRealStatus(session);
      if (realStatus === "planifiee") planifiees++;
      else if (realStatus === "en_cours") enCours++;
      else if (realStatus === "terminee") terminees++;
    }

    return {
      planifiees,
      enCours,
      terminees,
      total: sessions.length,
    };
  }, [sessions]);

  // Correction 491: Trouver la session réellement en cours pour le bandeau
  const sessionEnCoursReelle = React.useMemo(() => {
    for (const session of sessions) {
      const realStatus = getSessionRealStatus(session);
      if (realStatus === "en_cours") {
        return session;
      }
    }
    return null;
  }, [sessions]);

  // Trouver la vraie prochaine journée parmi toutes les sessions (dans le futur uniquement)
  const prochaineJourneeGlobale = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let prochaine: { session: SessionData; journee: SessionJournee } | null = null;

    for (const session of sessions) {
      if (session.prochaineJournee) {
        const journeeDate = new Date(session.prochaineJournee.date);
        journeeDate.setHours(0, 0, 0, 0);
        if (journeeDate > today) {
          if (!prochaine || journeeDate < new Date(prochaine.journee.date)) {
            prochaine = { session, journee: session.prochaineJournee };
          }
        }
      }
    }

    return prochaine;
  }, [sessions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  // Correction 492: Stats cards remplacées
  const statsCards = [
    {
      label: "Sessions planifiées",
      value: sessionStats.planifiees,
      icon: CalendarClock,
      color: "blue",
    },
    {
      label: "Sessions en cours",
      value: sessionStats.enCours,
      icon: PlayCircle,
      color: "emerald",
    },
    {
      label: "Sessions terminées",
      value: sessionStats.terminees,
      icon: CheckCircle2,
      color: "gray",
    },
    {
      label: "Total sessions",
      value: sessionStats.total,
      icon: LayoutGrid,
      color: "purple",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; iconBg: string }> = {
      emerald: {
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        text: "text-emerald-600 dark:text-emerald-400",
        iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
      },
      blue: {
        bg: "bg-blue-50 dark:bg-blue-500/10",
        text: "text-blue-600 dark:text-blue-400",
        iconBg: "bg-blue-100 dark:bg-blue-500/20",
      },
      gray: {
        bg: "bg-gray-50 dark:bg-gray-500/10",
        text: "text-gray-600 dark:text-gray-400",
        iconBg: "bg-gray-100 dark:bg-gray-500/20",
      },
      purple: {
        bg: "bg-purple-50 dark:bg-purple-500/10",
        text: "text-purple-600 dark:text-purple-400",
        iconBg: "bg-purple-100 dark:bg-purple-500/20",
      },
    };
    return colors[color] || colors.emerald;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Non défini";
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatDateLong = (date: Date | string | null) => {
    if (!date) return "Non défini";
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Correction 497: Fonction pour ouvrir la pop-up détails
  const handleOpenSessionDetails = (session: SessionData) => {
    setSelectedSessionDetails(session);
  };

  return (
    <div className="space-y-6">
      {/* En-tête de bienvenue */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Bonjour {intervenant?.prenom} !
            </h1>
            <p className="text-emerald-100">
              {intervenant?.fonction || "Formateur"}
              {intervenant?.specialites && intervenant.specialites.length > 0 && (
                <span className="ml-2">
                  - {intervenant.specialites.slice(0, 2).join(", ")}
                </span>
              )}
            </p>
          </div>
          {/* Correction 491: N'afficher que si une session est REELLEMENT en cours */}
          {sessionEnCoursReelle ? (
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-xs text-emerald-100 mb-1">Session en cours</p>
              <p className="font-semibold">{sessionEnCoursReelle.formation.titre}</p>
              <p className="text-sm text-emerald-100">
                {sessionEnCoursReelle.nombreApprenants} apprenant{sessionEnCoursReelle.nombreApprenants > 1 ? "s" : ""}
              </p>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-xs text-emerald-100 mb-1">Session en cours</p>
              <p className="font-medium text-emerald-50 italic">Aucune session en cours</p>
            </div>
          )}
        </div>
      </div>

      {/* Correction 492: Stats Grid avec nouvelles tuiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const colorClasses = getColorClasses(stat.color);
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`${colorClasses.bg} rounded-xl p-4`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${colorClasses.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${colorClasses.text}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Contenu principal */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sessions actives */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Mes sessions
            </h2>
            <Link
              href="/intervenant/calendrier"
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              Voir tout
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {sessions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
              <Briefcase className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                Aucune session active pour le moment
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 4).map((session) => {
                // Correction 496: Utiliser le statut réel
                const realStatus = getSessionRealStatus(session);
                const badge = getStatusBadge(realStatus);

                return (
                  // Correction 497: Au clic, ouvrir pop-up au lieu de rediriger
                  <button
                    key={session.id}
                    onClick={() => handleOpenSessionDetails(session)}
                    className="w-full text-left block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors"
                  >
                    <div className="flex gap-4">
                      {/* Image formation */}
                      <div className="flex-shrink-0">
                        {session.formation.image ? (
                          <Image
                            src={session.formation.image}
                            alt={session.formation.titre}
                            width={80}
                            height={80}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        )}
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {session.formation.titre}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {session.reference}
                            </p>
                          </div>
                          {/* Correction 496: Badge synchronisé */}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {session.nombreApprenants} apprenant{session.nombreApprenants > 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(session.dateDebut)}
                          </span>
                          {session.lieu && (
                            <span className="flex items-center gap-1">
                              {session.lieu.typeLieu === "DISTANCIEL" ? (
                                <Video className="w-4 h-4" />
                              ) : (
                                <MapPin className="w-4 h-4" />
                              )}
                              {session.lieu.nom}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar - Correction 494: Suppression du bloc "Session active" */}
        <div className="space-y-4">
          {/* Accès rapide */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Accès rapide
            </h3>
            <div className="space-y-2">
              <Link
                href="/intervenant/emargements"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <PenLine className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Émargements</p>
                  <p className="text-xs text-gray-500">Feuilles de présence</p>
                </div>
                {dashboardStats?.emargementsEnAttente !== undefined && dashboardStats.emargementsEnAttente > 0 && (
                  <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {dashboardStats.emargementsEnAttente}
                  </span>
                )}
              </Link>

              <Link
                href="/intervenant/apprenants"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Apprenants</p>
                  <p className="text-xs text-gray-500">Liste des participants</p>
                </div>
              </Link>

              <Link
                href="/intervenant/evaluations"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Évaluations</p>
                  <p className="text-xs text-gray-500">Résultats et suivis</p>
                </div>
              </Link>

              <Link
                href="/intervenant/documents"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Documents</p>
                  <p className="text-xs text-gray-500">Supports de formation</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Prochaine session */}
          {prochaineJourneeGlobale && (
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-500/10 dark:to-emerald-600/10 rounded-xl p-4 border border-emerald-200 dark:border-emerald-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">
                  Prochaine session
                </h3>
              </div>
              <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">
                {formatDate(prochaineJourneeGlobale.journee.date)}
              </p>
              <div className="text-sm text-emerald-700 dark:text-emerald-300 mt-1 space-y-0.5">
                <p>
                  Matin : {prochaineJourneeGlobale.journee.heureDebutMatin || "09:00"} – {prochaineJourneeGlobale.journee.heureFinMatin || "12:30"}
                </p>
                <p>
                  Après-midi : {prochaineJourneeGlobale.journee.heureDebutAprem || "14:00"} – {prochaineJourneeGlobale.journee.heureFinAprem || "17:30"}
                </p>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                {prochaineJourneeGlobale.session.formation.titre}
              </p>
            </div>
          )}

          {/* Correction 494: Bloc "Session active" SUPPRIMÉ */}
        </div>
      </div>

      {/* Correction 497: Pop-up détails session */}
      {selectedSessionDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedSessionDetails(null)}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Détails de la session
              </h3>
              <button
                onClick={() => setSelectedSessionDetails(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Formation */}
              <div className="flex gap-4">
                {selectedSessionDetails.formation.image ? (
                  <Image
                    src={selectedSessionDetails.formation.image}
                    alt={selectedSessionDetails.formation.titre}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {selectedSessionDetails.formation.titre}
                  </h4>
                  {selectedSessionDetails.nom && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {selectedSessionDetails.nom}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Réf: {selectedSessionDetails.reference}
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Dates de session
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Début</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDateLong(selectedSessionDetails.dateDebut)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Fin</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDateLong(selectedSessionDetails.dateFin)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Planning journées */}
              {selectedSessionDetails.journees && selectedSessionDetails.journees.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Planning des journées
                  </h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedSessionDetails.journees.map((journee, idx) => (
                      <div key={idx} className="text-sm">
                        <p className="font-medium text-gray-900 dark:text-white">
                          Jour {idx + 1} : {formatDateLong(journee.date)}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          Matin : {journee.heureDebutMatin || "09:00"} – {journee.heureFinMatin || "12:30"} |
                          Après-midi : {journee.heureDebutAprem || "14:00"} – {journee.heureFinAprem || "17:30"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Infos complémentaires */}
              <div className="grid grid-cols-2 gap-4">
                {/* Modalité */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Modalité</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                    {selectedSessionDetails.lieu?.typeLieu === "DISTANCIEL" ? (
                      <>
                        <Video className="w-4 h-4 text-blue-500" />
                        Distanciel
                      </>
                    ) : selectedSessionDetails.lieu?.typeLieu === "MIXTE" ? (
                      <>
                        <MapPin className="w-4 h-4 text-purple-500" />
                        Mixte
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        Présentiel
                      </>
                    )}
                  </p>
                </div>

                {/* Apprenants */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Apprenants</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                    <Users className="w-4 h-4 text-blue-500" />
                    {selectedSessionDetails.nombreApprenants} participant{selectedSessionDetails.nombreApprenants > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Lieu */}
              {selectedSessionDetails.lieu && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {selectedSessionDetails.lieu.typeLieu === "DISTANCIEL" ? "Lien visio" : "Lieu"}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedSessionDetails.lieu.lienVisio || selectedSessionDetails.lieu.nom}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelectedSessionDetails(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
