"use client";

import React, { useState, useMemo } from "react";
import { useRequireIntervenantAuth, useIntervenantPortal } from "@/context/IntervenantPortalContext";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Video,
  BookOpen,
} from "lucide-react";

export default function IntervenantCalendrierPage() {
  useRequireIntervenantAuth();
  const { sessions, isLoading } = useIntervenantPortal();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Navigation mensuelle
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Générer les jours du mois
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Ajuster pour commencer le lundi (1) au lieu de dimanche (0)
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days = [];

    // Jours du mois précédent
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Jours du mois courant
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Jours du mois suivant pour compléter la grille
    const remainingDays = 42 - days.length; // 6 semaines * 7 jours
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // Extraire toutes les journées de toutes les sessions
  const allJournees = useMemo(() => {
    const journees: Array<{
      date: Date;
      session: typeof sessions[0];
    }> = [];

    sessions.forEach(session => {
      if (session.journees) {
        session.journees.forEach(journee => {
          journees.push({
            date: new Date(journee.date),
            session,
          });
        });
      }
    });

    return journees;
  }, [sessions]);

  // Obtenir les événements pour un jour donné
  const getEventsForDay = (date: Date) => {
    return allJournees.filter(j => {
      const journeeDate = new Date(j.date);
      return (
        journeeDate.getDate() === date.getDate() &&
        journeeDate.getMonth() === date.getMonth() &&
        journeeDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Vérifier si c'est aujourd'hui
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Calendrier
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {sessions.length} session{sessions.length > 1 ? "s" : ""} de formation
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
          >
            Aujourd&apos;hui
          </button>
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mois et année */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
      </div>

      {/* Calendrier */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {dayNames.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7">
          {calendarDays.map((dayInfo, index) => {
            const events = getEventsForDay(dayInfo.date);
            const hasEvents = events.length > 0;
            const today = isToday(dayInfo.date);

            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 border-b border-r border-gray-100 dark:border-gray-700/50 ${
                  !dayInfo.isCurrentMonth ? "bg-gray-50 dark:bg-gray-800/50" : ""
                } ${index % 7 === 6 ? "border-r-0" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`w-7 h-7 flex items-center justify-center text-sm rounded-full ${
                      today
                        ? "bg-emerald-500 text-white font-bold"
                        : dayInfo.isCurrentMonth
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-400 dark:text-gray-600"
                    }`}
                  >
                    {dayInfo.date.getDate()}
                  </span>
                  {hasEvents && (
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  )}
                </div>

                {/* Événements */}
                <div className="space-y-1">
                  {events.slice(0, 2).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className="px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded truncate"
                      title={event.session.formation.titre}
                    >
                      {event.session.formation.titre}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <div className="px-2 text-xs text-gray-500 dark:text-gray-400">
                      +{events.length - 2} autre{events.length - 2 > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Liste des prochaines sessions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-500" />
          Prochaines sessions
        </h3>

        {sessions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            Aucune session planifiée
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
              >
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {session.formation.titre}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {session.dateDebut && session.dateFin ? (
                        <>
                          {new Date(session.dateDebut).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })} - {new Date(session.dateFin).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </>
                      ) : "Dates non définies"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {session.nombreApprenants}
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
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    session.statut === "EN_COURS"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                  }`}
                >
                  {session.statut === "EN_COURS" ? "En cours" : "Planifiée"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
