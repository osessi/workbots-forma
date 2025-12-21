"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface DatePickerProps {
  value: string; // Format YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  className?: string;
}

const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const DAYS_FR = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

export default function DatePicker({
  value,
  onChange,
  placeholder = "jj/mm/aaaa",
  minDate,
  maxDate,
  className = "",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"days" | "months" | "years">("days");
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse la valeur pour obtenir la date affichée (en évitant les problèmes de timezone)
  const parseLocalDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const selectedDate = value ? parseLocalDate(value) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normaliser à minuit

  // État pour la navigation dans le calendrier
  const [viewDate, setViewDate] = useState(() => {
    if (selectedDate) return new Date(selectedDate);
    return new Date();
  });

  // Fermer le calendrier quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setViewMode("days");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Formater la date pour l'affichage (sans problème de timezone)
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = parseLocalDate(dateStr);
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Obtenir les jours du mois affiché
  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Ajuster pour commencer par lundi (0 = lundi, 6 = dimanche)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days: (Date | null)[] = [];

    // Jours vides avant le premier jour du mois
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Jours du mois
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // Obtenir les années pour la sélection (plage de 12 ans)
  const getYearsRange = () => {
    const currentYear = viewDate.getFullYear();
    const startYear = Math.floor(currentYear / 12) * 12;
    return Array.from({ length: 12 }, (_, i) => startYear + i);
  };

  // Navigation
  const goToPrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const goToPrevYear = () => {
    setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1));
  };

  const goToNextYear = () => {
    setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1));
  };

  const goToPrevYearRange = () => {
    setViewDate(new Date(viewDate.getFullYear() - 12, viewDate.getMonth(), 1));
  };

  const goToNextYearRange = () => {
    setViewDate(new Date(viewDate.getFullYear() + 12, viewDate.getMonth(), 1));
  };

  // Sélection - formater en local pour éviter les problèmes de timezone
  const selectDay = (day: Date) => {
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, "0");
    const dayNum = String(day.getDate()).padStart(2, "0");
    const formatted = `${year}-${month}-${dayNum}`;
    onChange(formatted);
    setIsOpen(false);
    setViewMode("days");
  };

  const selectMonth = (month: number) => {
    setViewDate(new Date(viewDate.getFullYear(), month, 1));
    setViewMode("days");
  };

  const selectYear = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setViewMode("months");
  };

  // Vérifier si une date est sélectionnable
  const isDateSelectable = (date: Date) => {
    if (minDate) {
      const min = new Date(minDate);
      if (date < min) return false;
    }
    if (maxDate) {
      const max = new Date(maxDate);
      if (date > max) return false;
    }
    return true;
  };

  // Vérifier si c'est aujourd'hui
  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Vérifier si c'est la date sélectionnée
  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const days = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const yearsRange = getYearsRange();

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white cursor-pointer hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:border-gray-600"
      >
        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
        <span className={value ? "text-gray-900 dark:text-white" : "text-gray-400"}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
      </div>

      {/* Calendrier Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-3 w-[280px]">
          {/* Header navigation */}
          <div className="flex items-center justify-between mb-3">
            {viewMode === "days" && (
              <>
                <button
                  type="button"
                  onClick={goToPrevMonth}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("months")}
                  className="text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1 rounded-lg"
                >
                  {MONTHS_FR[viewDate.getMonth()]} {viewDate.getFullYear()}
                </button>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
                </button>
              </>
            )}

            {viewMode === "months" && (
              <>
                <button
                  type="button"
                  onClick={goToPrevYear}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("years")}
                  className="text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1 rounded-lg"
                >
                  {viewDate.getFullYear()}
                </button>
                <button
                  type="button"
                  onClick={goToNextYear}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
                </button>
              </>
            )}

            {viewMode === "years" && (
              <>
                <button
                  type="button"
                  onClick={goToPrevYearRange}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <ChevronsLeft size={18} className="text-gray-600 dark:text-gray-400" />
                </button>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {yearsRange[0]} - {yearsRange[yearsRange.length - 1]}
                </span>
                <button
                  type="button"
                  onClick={goToNextYearRange}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <ChevronsRight size={18} className="text-gray-600 dark:text-gray-400" />
                </button>
              </>
            )}
          </div>

          {/* Vue des jours */}
          {viewMode === "days" && (
            <>
              {/* En-têtes des jours */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAYS_FR.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Grille des jours */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="w-9 h-9" />;
                  }

                  const selectable = isDateSelectable(day);
                  const selected = isSelected(day);
                  const todayDate = isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={!selectable}
                      onClick={() => selectDay(day)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        selected
                          ? "bg-brand-500 text-white"
                          : todayDate
                          ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
                          : selectable
                          ? "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                          : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Vue des mois */}
          {viewMode === "months" && (
            <div className="grid grid-cols-3 gap-2">
              {MONTHS_FR.map((month, index) => {
                const isCurrentMonth =
                  index === today.getMonth() &&
                  viewDate.getFullYear() === today.getFullYear();
                const isSelectedMonth =
                  selectedDate &&
                  index === selectedDate.getMonth() &&
                  viewDate.getFullYear() === selectedDate.getFullYear();

                return (
                  <button
                    key={month}
                    type="button"
                    onClick={() => selectMonth(index)}
                    className={`py-2 px-1 rounded-lg text-sm font-medium transition-colors ${
                      isSelectedMonth
                        ? "bg-brand-500 text-white"
                        : isCurrentMonth
                        ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    {month.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          )}

          {/* Vue des années */}
          {viewMode === "years" && (
            <div className="grid grid-cols-3 gap-2">
              {yearsRange.map((year) => {
                const isCurrentYear = year === today.getFullYear();
                const isSelectedYear =
                  selectedDate && year === selectedDate.getFullYear();

                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => selectYear(year)}
                    className={`py-2 px-1 rounded-lg text-sm font-medium transition-colors ${
                      isSelectedYear
                        ? "bg-brand-500 text-white"
                        : isCurrentYear
                        ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          )}

          {/* Bouton Aujourd'hui */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, "0");
                const day = String(now.getDate()).padStart(2, "0");
                const todayStr = `${year}-${month}-${day}`;
                onChange(todayStr);
                setViewDate(now);
                setIsOpen(false);
                setViewMode("days");
              }}
              className="w-full py-2 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors"
            >
              Aujourd&apos;hui
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
