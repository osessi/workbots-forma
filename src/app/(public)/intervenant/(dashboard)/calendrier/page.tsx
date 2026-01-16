"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRequireIntervenantAuth, useIntervenantPortal } from "@/context/IntervenantPortalContext";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Loader2,
  AlertCircle,
  Calendar as CalendarIcon,
  ClipboardCheck,
  CheckCircle2,
  ExternalLink,
  Monitor,
  Building,
  Sun,
  Moon,
} from "lucide-react";

// ===========================================
// Correction 522: Types d'événements calendrier intervenant
// ===========================================

interface CalendarEvent {
  id: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  sessionNom: string;
  sessionReference: string;
  sessionId: string;
  lieu: string | null;
  modalite: string | null;
  nombreApprenants: number;
  type: "formation" | "evaluation";
  evaluationType?: "formateur";
  evaluationLabel?: string;
  evaluationStatus?: "not_available" | "a_faire" | "en_cours" | "termine";
  evaluationUrl?: string;
  matin?: {
    heureDebut: string | null;
    heureFin: string | null;
    planned: boolean;
  };
  aprem?: {
    heureDebut: string | null;
    heureFin: string | null;
    planned: boolean;
  };
}

// ===========================================
// UTILITAIRES CALENDRIER
// ===========================================

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// ===========================================
// COMPOSANT JOUR
// ===========================================

function CalendarDay({
  day,
  events,
  isCurrentMonth,
  isToday,
  isSelected,
  onClick,
}: {
  day: number;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const formationEvents = events.filter(e => e.type === "formation");
  const evaluationEvents = events.filter(e => e.type === "evaluation");

  return (
    <button
      onClick={onClick}
      className={`
        relative h-12 md:h-20 p-1 text-sm rounded-lg transition-all
        ${isCurrentMonth ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-600"}
        ${isToday ? "bg-emerald-50 dark:bg-emerald-500/10 font-bold" : ""}
        ${isSelected ? "ring-2 ring-emerald-500" : ""}
        ${events.length > 0 ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" : ""}
      `}
    >
      <span
        className={`
          ${isToday ? "w-7 h-7 flex items-center justify-center rounded-full bg-emerald-500 text-white mx-auto" : ""}
        `}
      >
        {day}
      </span>

      {events.length > 0 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
          {formationEvents.length > 0 && (
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          )}
          {evaluationEvents.slice(0, 2).map((_, i) => (
            <div
              key={`eval-${i}`}
              className="w-1.5 h-1.5 rounded-full bg-amber-500"
            />
          ))}
        </div>
      )}
    </button>
  );
}

// ===========================================
// COMPOSANT ÉVÉNEMENT FORMATION
// ===========================================

function FormationEventCard({ event }: { event: CalendarEvent }) {
  const getModaliteIcon = () => {
    switch (event.modalite?.toLowerCase()) {
      case "presentiel":
        return <Building className="w-4 h-4" />;
      case "distanciel":
        return <Monitor className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-1 h-full min-h-[80px] rounded-full flex-shrink-0 bg-emerald-500" />

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
            {event.sessionNom}
          </h4>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Session : {event.sessionReference}
          </p>

          <div className="flex flex-col gap-2 mt-3 text-sm text-gray-600 dark:text-gray-300">
            {/* Demi-journées détaillées */}
            {event.matin?.planned && (
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Matin : {event.matin.heureDebut} - {event.matin.heureFin}</span>
              </div>
            )}
            {event.aprem?.planned && (
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>Après-midi : {event.aprem.heureDebut} - {event.aprem.heureFin}</span>
              </div>
            )}

            {/* Fallback si pas de détails demi-journées */}
            {!event.matin?.planned && !event.aprem?.planned && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{event.heureDebut} - {event.heureFin}</span>
              </div>
            )}

            {event.modalite && (
              <div className="flex items-center gap-2">
                {getModaliteIcon()}
                <span className="capitalize">{event.modalite}</span>
              </div>
            )}

            {event.lieu && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{event.lieu}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span>{event.nombreApprenants} apprenant{event.nombreApprenants > 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ===========================================
// COMPOSANT ÉVÉNEMENT ÉVALUATION FORMATEUR
// ===========================================

function EvaluationEventCard({ event }: { event: CalendarEvent }) {
  const getStatusBadge = () => {
    switch (event.evaluationStatus) {
      case "termine":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            Terminé
          </span>
        );
      case "en_cours":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
            En cours
          </span>
        );
      case "a_faire":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
            À compléter
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            Non disponible
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-1 h-full min-h-[60px] rounded-full flex-shrink-0 bg-amber-500" />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {event.evaluationLabel}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {event.sessionNom}
              </p>
            </div>
            {getStatusBadge()}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Évaluez la session et donnez votre retour sur le déroulement de la formation.
          </p>

          {event.evaluationStatus === "a_faire" && event.evaluationUrl && (
            <a
              href={event.evaluationUrl}
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium rounded-lg hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors text-sm"
            >
              <ClipboardCheck className="w-4 h-4" />
              Compléter l&apos;évaluation
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ===========================================
// PAGE PRINCIPALE - Correction 522-523
// ===========================================

export default function IntervenantCalendrierPage() {
  useRequireIntervenantAuth();
  const { selectedSession, token, isLoading: portalLoading } = useIntervenantPortal();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // État du calendrier
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);

  const fetchCalendar = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({ token });
      if (selectedSession?.id) {
        params.append("sessionId", selectedSession.id);
      }

      const res = await fetch(`/api/intervenant/calendrier?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Erreur lors du chargement du calendrier");
      }

      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [token, selectedSession?.id]);

  useEffect(() => {
    if (token) {
      fetchCalendar();
    }
  }, [token, fetchCalendar]);

  // Navigation
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today);
  };

  // Générer les jours du calendrier
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const daysInPrevMonth = getDaysInMonth(
    currentMonth === 0 ? currentYear - 1 : currentYear,
    currentMonth === 0 ? 11 : currentMonth - 1
  );

  const calendarDays: Array<{ day: number; month: number; year: number; isCurrentMonth: boolean }> = [];

  // Jours du mois précédent
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    calendarDays.push({
      day: daysInPrevMonth - i,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
    });
  }

  // Jours du mois actuel
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true,
    });
  }

  // Jours du mois suivant
  const remainingDays = 42 - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    calendarDays.push({
      day: i,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
    });
  }

  // Filtrer les événements pour la date sélectionnée
  const selectedDateEvents = selectedDate
    ? events.filter((event) => isSameDay(new Date(event.date), selectedDate))
    : [];

  const formationEvents = selectedDateEvents.filter(e => e.type === "formation");
  const evaluationEvents = selectedDateEvents.filter(e => e.type === "evaluation");

  // Obtenir les événements pour un jour donné
  const getEventsForDay = (day: number, month: number, year: number) => {
    const date = new Date(year, month, day);
    return events.filter((event) => isSameDay(new Date(event.date), date));
  };

  if (portalLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement du calendrier...</p>
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

  if (!selectedSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <CalendarIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Aucune session sélectionnée
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Veuillez sélectionner une session pour accéder au calendrier.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Calendrier
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Consultez votre planning et vos évaluations à venir.
          </p>
        </div>

        <button
          onClick={goToToday}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
        >
          <CalendarIcon className="w-4 h-4" />
          Aujourd&apos;hui
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendrier */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          {/* Navigation mois */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {MOIS[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* En-têtes jours */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {JOURS.map((jour) => (
              <div
                key={jour}
                className="h-10 flex items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                {jour}
              </div>
            ))}
          </div>

          {/* Grille jours */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dayInfo, index) => {
              const date = new Date(dayInfo.year, dayInfo.month, dayInfo.day);
              const isToday = isSameDay(date, today);
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const dayEvents = getEventsForDay(dayInfo.day, dayInfo.month, dayInfo.year);

              return (
                <CalendarDay
                  key={index}
                  day={dayInfo.day}
                  events={dayEvents}
                  isCurrentMonth={dayInfo.isCurrentMonth}
                  isToday={isToday}
                  isSelected={isSelected || false}
                  onClick={() => setSelectedDate(date)}
                />
              );
            })}
          </div>

          {/* Légende */}
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Formation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Évaluation</span>
            </div>
          </div>
        </div>

        {/* Événements du jour sélectionné */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-h-[600px] overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {selectedDate
              ? selectedDate.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
              : "Sélectionnez une date"}
          </h3>

          <AnimatePresence mode="wait">
            {selectedDateEvents.length > 0 ? (
              <motion.div
                key={selectedDate?.toISOString()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Section Formation */}
                {formationEvents.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Formation ({formationEvents.length})
                    </h4>
                    <div className="space-y-3">
                      {formationEvents.map((event) => (
                        <FormationEventCard key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Section Évaluations */}
                {evaluationEvents.length > 0 && (
                  <div className={formationEvents.length > 0 ? "mt-4 pt-4 border-t border-gray-200 dark:border-gray-700" : ""}>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4" />
                      Évaluations ({evaluationEvents.length})
                    </h4>
                    <div className="space-y-3">
                      {evaluationEvents.map((event) => (
                        <EvaluationEventCard key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <CalendarIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Aucun événement ce jour
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Correction 523: Bloc "Prochaines sessions" SUPPRIMÉ */}
    </div>
  );
}
