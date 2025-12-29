"use client";

import React from "react";
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
  ChevronRight,
  BookOpen,
  Star,
  FileText,
  Video,
  Building2,
} from "lucide-react";

export default function IntervenantAccueilPage() {
  useRequireIntervenantAuth();
  const { intervenant, dashboardStats, sessions, selectedSession, isLoading } = useIntervenantPortal();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  // Stats cards
  const statsCards = [
    {
      label: "Sessions en cours",
      value: dashboardStats?.sessionsEnCours || 0,
      icon: Briefcase,
      color: "emerald",
      href: "/intervenant/programme",
    },
    {
      label: "Apprenants",
      value: dashboardStats?.totalApprenants || 0,
      icon: Users,
      color: "blue",
      href: "/intervenant/apprenants",
    },
    {
      label: "Émargements en attente",
      value: dashboardStats?.emargementsEnAttente || 0,
      icon: PenLine,
      color: "amber",
      href: "/intervenant/emargements",
    },
    {
      label: "Sessions planifiées",
      value: dashboardStats?.sessionsAVenir || 0,
      icon: Calendar,
      color: "purple",
      href: "/intervenant/calendrier",
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
      amber: {
        bg: "bg-amber-50 dark:bg-amber-500/10",
        text: "text-amber-600 dark:text-amber-400",
        iconBg: "bg-amber-100 dark:bg-amber-500/20",
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
          {selectedSession && (
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-xs text-emerald-100 mb-1">Session en cours</p>
              <p className="font-semibold">{selectedSession.formation.titre}</p>
              <p className="text-sm text-emerald-100">
                {selectedSession.nombreApprenants} apprenant{selectedSession.nombreApprenants > 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const colorClasses = getColorClasses(stat.color);
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className={`${colorClasses.bg} rounded-xl p-4 hover:scale-[1.02] transition-transform`}
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
            </Link>
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
              href="/intervenant/programme"
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
              {sessions.slice(0, 4).map((session) => (
                <Link
                  key={session.id}
                  href={`/intervenant/programme?session=${session.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors"
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
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            session.status === "EN_COURS"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                          }`}
                        >
                          {session.status === "EN_COURS" ? "En cours" : "Planifiée"}
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

                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 self-center" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
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
          {selectedSession?.prochaineJournee && (
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-500/10 dark:to-emerald-600/10 rounded-xl p-4 border border-emerald-200 dark:border-emerald-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">
                  Prochaine session
                </h3>
              </div>
              <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">
                {formatDate(selectedSession.prochaineJournee.date)}
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                {selectedSession.prochaineJournee.heureDebutMatin} - {selectedSession.prochaineJournee.heureFinAprem}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                {selectedSession.formation.titre}
              </p>
            </div>
          )}

          {/* Info session sélectionnée */}
          {selectedSession && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gray-400" />
                Session active
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">{selectedSession.formation.titre}</span>
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  Réf: {selectedSession.reference}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  {selectedSession.nombreApprenants} participant{selectedSession.nombreApprenants > 1 ? "s" : ""}
                </p>
                {selectedSession.lieu && (
                  <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedSession.lieu.nom}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
