"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Loader2,
  AlertCircle,
  Calendar as CalendarIcon,
} from "lucide-react";

interface CalendarEvent {
  id: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  sessionNom: string;
  sessionReference: string;
  lieu: string | null;
  formateur: string | null;
  type: "formation" | "evaluation" | "autre";
}

interface CalendarData {
  events: CalendarEvent[];
}

// =====================================
// UTILITAIRES CALENDRIER
// =====================================

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
  return day === 0 ? 6 : day - 1; // Ajuster pour que lundi = 0
}

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// =====================================
// COMPOSANT JOUR
// =====================================

function CalendarDay({
  day,
  month,
  year,
  events,
  isCurrentMonth,
  isToday,
  isSelected,
  onClick,
}: {
  day: number;
  month: number;
  year: number;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const hasEvents = events.length > 0;

  return (
    <button
      onClick={onClick}
      className={`
        relative h-12 md:h-20 p-1 text-sm rounded-lg transition-all
        ${isCurrentMonth ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-600"}
        ${isToday ? "bg-brand-50 dark:bg-brand-500/10 font-bold" : ""}
        ${isSelected ? "ring-2 ring-brand-500" : ""}
        ${hasEvents ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" : ""}
      `}
    >
      <span
        className={`
          ${isToday ? "w-7 h-7 flex items-center justify-center rounded-full bg-brand-500 text-white mx-auto" : ""}
        `}
      >
        {day}
      </span>

      {/* Indicateurs d'événements */}
      {hasEvents && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
          {events.slice(0, 3).map((event, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${
                event.type === "formation"
                  ? "bg-brand-500"
                  : event.type === "evaluation"
                  ? "bg-amber-500"
                  : "bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}
    </button>
  );
}

// =====================================
// COMPOSANT ÉVÉNEMENT
// =====================================

function EventCard({ event }: { event: CalendarEvent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
    >
      <div className="flex items-start gap-3">
        {/* Badge type */}
        <div
          className={`w-2 h-full min-h-[60px] rounded-full flex-shrink-0 ${
            event.type === "formation"
              ? "bg-brand-500"
              : event.type === "evaluation"
              ? "bg-amber-500"
              : "bg-gray-400"
          }`}
        />

        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white">
            {event.sessionNom}
          </h4>

          <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {event.heureDebut} - {event.heureFin}
            </span>
            {event.lieu && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.lieu}
              </span>
            )}
            {event.formateur && (
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {event.formateur}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function CalendrierPage() {
  const { token, selectedInscription } = useApprenantPortal();
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // État du calendrier
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);

  useEffect(() => {
    const fetchCalendar = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const params = new URLSearchParams({ token });
        if (selectedInscription?.id) {
          params.append("inscriptionId", selectedInscription.id);
        }

        const res = await fetch(`/api/apprenant/calendrier?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Erreur lors du chargement du calendrier");
        }

        const calendarData = await res.json();
        setData(calendarData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, [token, selectedInscription?.id]);

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
    ? data?.events.filter((event) =>
        isSameDay(new Date(event.date), selectedDate)
      ) || []
    : [];

  // Obtenir les événements pour un jour donné
  const getEventsForDay = (day: number, month: number, year: number) => {
    const date = new Date(year, month, day);
    return data?.events.filter((event) => isSameDay(new Date(event.date), date)) || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto mb-4" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Calendrier
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Vos prochains créneaux de formation
          </p>
        </div>

        <button
          onClick={goToToday}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium rounded-lg hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors"
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
              const events = getEventsForDay(dayInfo.day, dayInfo.month, dayInfo.year);

              return (
                <CalendarDay
                  key={index}
                  day={dayInfo.day}
                  month={dayInfo.month}
                  year={dayInfo.year}
                  events={events}
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
              <div className="w-3 h-3 rounded-full bg-brand-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Formation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Évaluation</span>
            </div>
          </div>
        </div>

        {/* Événements du jour sélectionné */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
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
                className="space-y-3"
              >
                {selectedDateEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
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
    </div>
  );
}
