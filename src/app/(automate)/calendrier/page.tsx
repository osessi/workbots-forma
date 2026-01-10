"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import { EventClickArg } from "@fullcalendar/core";
import { QRCodeEmargement } from "@/components/emargement";

// Types
interface CalendarEvent {
  id: string;
  sessionId: string;
  journeeId: string;
  title: string;
  start: string;
  heureDebutMatin: string | null;
  heureFinMatin: string | null;
  heureDebutAprem: string | null;
  heureFinAprem: string | null;
  modalite: string;
  lieu: {
    id: string;
    nom: string;
    typeLieu: string;
    lieuFormation: string;
  } | null;
  formateur: {
    id: string;
    nom: string;
    prenom: string;
  } | null;
  status: string;
  participantsCount: number;
  clients: Array<{
    id: string;
    typeClient: string;
    entreprise: { id: string; raisonSociale: string } | null;
    participantsCount: number;
  }>;
}

interface Signature {
  id: string;
  signataire: "participant" | "formateur";
  periode: string;
  signedAt: string;
  signatureData?: string; // Image base64 de la signature manuscrite
  participant?: {
    apprenant: {
      nom: string;
      prenom: string;
      email: string;
    };
  } | null;
  intervenant?: {
    id: string;
    nom: string;
    prenom: string;
    email: string | null;
  } | null;
}

interface EmargementFeuille {
  id: string;
  token: string;
  status: string;
  journeeId: string;
  createdAt: string;
  expiresAt: string | null;
  journee: {
    date: string;
    session: {
      id: string;
      formation: { titre: string };
    };
  };
  _count: {
    signatures: number;
  };
  signatures?: Signature[];
}

// Icons
const LoaderIcon = () => (
  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 8.5a2 2 0 100-4 2 2 0 000 4z" />
    <path d="M13 6.5c0 4.5-5 7-5 7s-5-2.5-5-7a5 5 0 1110 0z" />
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="5" r="3" />
    <path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="6" cy="5" r="2.5" />
    <path d="M1 14c0-2.5 2-4.5 5-4.5s5 2 5 4.5" />
    <circle cx="12" cy="5" r="2" />
    <path d="M15 14c0-2-1.5-3.5-4-3.5" />
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6" />
    <path d="M8 4v4l2.5 2.5" />
  </svg>
);

const QRCodeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="6" height="6" rx="1" />
    <rect x="12" y="2" width="6" height="6" rx="1" />
    <rect x="2" y="12" width="6" height="6" rx="1" />
    <path d="M12 12h2v2h-2zM16 12h2v2h-2zM12 16h2v2h-2zM16 16h2v2h-2zM14 14h2v2h-2z" />
  </svg>
);

const VideoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1" y="3.5" width="10" height="9" rx="1.5" />
    <path d="M11 6.5l4-2v7l-4-2v-3z" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="3" width="16" height="15" rx="2" />
    <path d="M2 7h16M6 1v4M14 1v4" />
  </svg>
);

const ClipboardCheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="4" y="2" width="12" height="16" rx="2" />
    <path d="M8 1h4v2H8zM7 10l2 2 4-4" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6" />
    <path d="M5.5 8l2 2 3-3" />
  </svg>
);

const XCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6" />
    <path d="M6 6l4 4M10 6l-4 4" />
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="5" y="5" width="9" height="9" rx="1" />
    <path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
    <circle cx="8" cy="8" r="2" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 2v9m0 0l-3-3m3 3l3-3M3 12v1a1 1 0 001 1h8a1 1 0 001-1v-1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const getModaliteColor = (modalite: string) => {
  switch (modalite) {
    case "PRESENTIEL":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "DISTANCIEL":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    case "MIXTE":
      return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "brouillon":
      return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
    case "en_cours":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "termine":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
  }
};

// Couleurs pour les événements - fond léger, bordure foncée
const getEventColors = (modalite: string) => {
  switch (modalite) {
    case "PRESENTIEL":
      return { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" }; // Bleu
    case "DISTANCIEL":
      return { bg: "#f3e8ff", border: "#a855f7", text: "#7c3aed" }; // Violet
    case "MIXTE":
      return { bg: "#ccfbf1", border: "#14b8a6", text: "#0f766e" }; // Teal
    default:
      return { bg: "#f3f4f6", border: "#6b7280", text: "#374151" }; // Gris
  }
};

function CalendrierSessionsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"calendrier" | "emargement">(
    tabParam === "emargement" ? "emargement" : "calendrier"
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [feuillesEmargement, setFeuillesEmargement] = useState<EmargementFeuille[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFeuilles, setLoadingFeuilles] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedFeuille, setExpandedFeuille] = useState<string | null>(null);
  const [loadingSignatures, setLoadingSignatures] = useState<string | null>(null);
  const calendarRef = useRef<FullCalendar>(null);

  // Synchroniser l'onglet avec l'URL
  useEffect(() => {
    if (tabParam === "emargement") {
      setActiveTab("emargement");
    } else if (tabParam === "calendrier" || !tabParam) {
      setActiveTab("calendrier");
    }
  }, [tabParam]);

  // Charger les sessions
  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sessions");
      if (!res.ok) throw new Error("Erreur de chargement");

      const data = await res.json();
      setEvents(data.calendarEvents || []);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les feuilles d'émargement
  const loadFeuillesEmargement = useCallback(async () => {
    try {
      setLoadingFeuilles(true);
      const res = await fetch("/api/emargement");
      if (!res.ok) throw new Error("Erreur de chargement");

      const data = await res.json();
      setFeuillesEmargement(data.feuilles || []);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoadingFeuilles(false);
    }
  }, []);

  // Charger les signatures détaillées d'une feuille
  const loadSignatures = async (feuilleId: string, token: string) => {
    try {
      setLoadingSignatures(feuilleId);
      const res = await fetch(`/api/emargement/${token}`);
      if (!res.ok) throw new Error("Erreur de chargement");

      const data = await res.json();

      // Mettre à jour la feuille avec les signatures
      setFeuillesEmargement(prev => prev.map(f =>
        f.id === feuilleId
          ? { ...f, signatures: data.signatures || [] }
          : f
      ));
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoadingSignatures(null);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (activeTab === "emargement") {
      loadFeuillesEmargement();
    }
  }, [activeTab, loadFeuillesEmargement]);

  // Handler pour clic sur événement
  const handleEventClick = (clickInfo: EventClickArg) => {
    const eventId = clickInfo.event.id;
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
    }
  };

  // Copier le lien avec feedback
  const handleCopyLink = async (token: string, feuilleId: string) => {
    const url = `${window.location.origin}/emargement/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(feuilleId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Télécharger le PDF d'émargement pour une session
  const handleDownloadPDF = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/emargement/pdf/${sessionId}`);
      if (!res.ok) {
        throw new Error("Erreur lors de la génération du PDF");
      }
      const html = await res.text();

      // Ouvrir dans une nouvelle fenêtre pour impression/PDF
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        // Attendre le chargement complet puis déclencher l'impression
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      }
    } catch (error) {
      console.error("Erreur téléchargement PDF:", error);
      alert("Erreur lors de la génération du PDF");
    }
  };

  // Toggle expansion et charger signatures
  const toggleExpanded = (feuille: EmargementFeuille) => {
    if (expandedFeuille === feuille.id) {
      setExpandedFeuille(null);
    } else {
      setExpandedFeuille(feuille.id);
      if (!feuille.signatures) {
        loadSignatures(feuille.id, feuille.token);
      }
    }
  };

  // Formatter les horaires
  const formatHoraires = (event: CalendarEvent) => {
    const parts = [];
    if (event.heureDebutMatin && event.heureFinMatin) {
      parts.push(`Matin: ${event.heureDebutMatin} - ${event.heureFinMatin}`);
    }
    if (event.heureDebutAprem && event.heureFinAprem) {
      parts.push(`Après-midi: ${event.heureDebutAprem} - ${event.heureFinAprem}`);
    }
    return parts.length > 0 ? parts : ["Horaires non définis"];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoaderIcon />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec onglets */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {activeTab === "calendrier" ? "Calendrier des sessions" : "Feuilles d'émargement"}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {activeTab === "calendrier"
                  ? "Visualisez toutes vos sessions de formation planifiées"
                  : "Gérez et consultez les feuilles d'émargement de vos formations"
                }
              </p>
            </div>
            {activeTab === "calendrier" && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Présentiel</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-full">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-400">Distanciel</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 dark:bg-teal-900/20 rounded-full">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-sm shadow-teal-500/50" />
                  <span className="text-xs font-medium text-teal-700 dark:text-teal-400">Mixte</span>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("calendrier")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "calendrier"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <CalendarIcon />
              Calendrier
            </button>
            <button
              onClick={() => setActiveTab("emargement")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "emargement"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <ClipboardCheckIcon />
              Émargement
              {feuillesEmargement.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                  {feuillesEmargement.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="p-6">
          {activeTab === "calendrier" ? (
            /* Calendrier amélioré */
            <div className="calendar-modern">
              <style jsx global>{`
                /* Styles modernes pour le calendrier */
                .calendar-modern .fc {
                  font-family: inherit;
                }

                .calendar-modern .fc-theme-standard td,
                .calendar-modern .fc-theme-standard th {
                  border-color: #e5e7eb;
                }

                .dark .calendar-modern .fc-theme-standard td,
                .dark .calendar-modern .fc-theme-standard th {
                  border-color: #374151;
                }

                /* Header du calendrier */
                .calendar-modern .fc-toolbar-title {
                  font-size: 1.25rem !important;
                  font-weight: 600 !important;
                  color: #111827;
                }

                .dark .calendar-modern .fc-toolbar-title {
                  color: #f9fafb;
                }

                /* Boutons navigation */
                .calendar-modern .fc-button {
                  background: #f3f4f6 !important;
                  border: 1px solid #e5e7eb !important;
                  color: #374151 !important;
                  font-weight: 500 !important;
                  padding: 0.5rem 1rem !important;
                  border-radius: 0.5rem !important;
                  text-transform: capitalize !important;
                  box-shadow: none !important;
                  transition: all 0.15s ease !important;
                }

                .calendar-modern .fc-button:hover {
                  background: #e5e7eb !important;
                  border-color: #d1d5db !important;
                }

                .calendar-modern .fc-button-active {
                  background: #3b82f6 !important;
                  border-color: #3b82f6 !important;
                  color: white !important;
                }

                .dark .calendar-modern .fc-button {
                  background: #374151 !important;
                  border-color: #4b5563 !important;
                  color: #e5e7eb !important;
                }

                .dark .calendar-modern .fc-button:hover {
                  background: #4b5563 !important;
                }

                .dark .calendar-modern .fc-button-active {
                  background: #3b82f6 !important;
                  border-color: #3b82f6 !important;
                }

                /* En-têtes des jours */
                .calendar-modern .fc-col-header-cell {
                  background: #f9fafb;
                  padding: 0.75rem 0 !important;
                }

                .dark .calendar-modern .fc-col-header-cell {
                  background: #1f2937;
                }

                .calendar-modern .fc-col-header-cell-cushion {
                  font-weight: 600 !important;
                  color: #6b7280 !important;
                  text-transform: uppercase !important;
                  font-size: 0.75rem !important;
                  letter-spacing: 0.05em !important;
                }

                .dark .calendar-modern .fc-col-header-cell-cushion {
                  color: #9ca3af !important;
                }

                /* Cellules des jours */
                .calendar-modern .fc-daygrid-day {
                  transition: background-color 0.15s ease;
                }

                .calendar-modern .fc-daygrid-day:hover {
                  background: #f9fafb;
                }

                .dark .calendar-modern .fc-daygrid-day:hover {
                  background: #1f2937;
                }

                /* Numéros des jours */
                .calendar-modern .fc-daygrid-day-number {
                  padding: 0.5rem !important;
                  font-weight: 500 !important;
                  color: #374151 !important;
                }

                .dark .calendar-modern .fc-daygrid-day-number {
                  color: #d1d5db !important;
                }

                /* Date du jour - Style prononcé */
                .calendar-modern .fc-day-today {
                  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
                }

                .dark .calendar-modern .fc-day-today {
                  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.25) 100%) !important;
                }

                .calendar-modern .fc-day-today .fc-daygrid-day-number {
                  background: #3b82f6 !important;
                  color: white !important;
                  border-radius: 9999px !important;
                  width: 2rem !important;
                  height: 2rem !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  margin: 0.25rem !important;
                }

                /* Jours hors du mois */
                .calendar-modern .fc-day-other .fc-daygrid-day-number {
                  color: #9ca3af !important;
                }

                .dark .calendar-modern .fc-day-other .fc-daygrid-day-number {
                  color: #4b5563 !important;
                }

                /* Événements - IMPORTANT: bordure gauche colorée visible */
                .calendar-modern .fc-event {
                  border-radius: 0.375rem !important;
                  border: none !important;
                  border-left: 4px solid !important;
                  padding: 0.25rem 0.5rem !important;
                  font-size: 0.75rem !important;
                  font-weight: 500 !important;
                  cursor: pointer !important;
                  transition: transform 0.1s ease, box-shadow 0.1s ease !important;
                  margin-bottom: 2px !important;
                  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
                }

                .calendar-modern .fc-event:hover {
                  transform: translateY(-1px) !important;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                }

                /* Lien "plus d'événements" */
                .calendar-modern .fc-more-link {
                  color: #3b82f6 !important;
                  font-weight: 600 !important;
                  font-size: 0.75rem !important;
                }

                .calendar-modern .fc-more-link:hover {
                  color: #2563eb !important;
                  text-decoration: underline !important;
                }

                /* Popover pour les événements supplémentaires */
                .calendar-modern .fc-popover {
                  border-radius: 0.75rem !important;
                  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
                  border: 1px solid #e5e7eb !important;
                }

                .dark .calendar-modern .fc-popover {
                  background: #1f2937 !important;
                  border-color: #374151 !important;
                }

                .calendar-modern .fc-popover-header {
                  background: #f9fafb !important;
                  padding: 0.75rem 1rem !important;
                  border-radius: 0.75rem 0.75rem 0 0 !important;
                }

                .dark .calendar-modern .fc-popover-header {
                  background: #374151 !important;
                }

                /* Wrapper événement pour s'assurer que la bordure est visible */
                .calendar-modern .fc-daygrid-event-harness {
                  margin: 1px 2px !important;
                }
              `}</style>

              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale={frLocale}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                events={events.map((e) => {
                  const colors = getEventColors(e.modalite);
                  return {
                    id: e.id,
                    title: e.title,
                    start: e.start,
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    textColor: colors.text,
                    extendedProps: {
                      modalite: e.modalite,
                      participantsCount: e.participantsCount,
                    },
                  };
                })}
                eventClick={handleEventClick}
                eventContent={(eventInfo) => {
                  const participantsCount = eventInfo.event.extendedProps.participantsCount;
                  return (
                    <div className="flex items-center gap-1.5 w-full overflow-hidden py-0.5">
                      <span className="truncate font-medium">{eventInfo.event.title}</span>
                      <span className="flex-shrink-0 flex items-center gap-0.5 text-[10px] opacity-70">
                        <UsersIcon />
                        {participantsCount}
                      </span>
                    </div>
                  );
                }}
                height="auto"
                dayMaxEvents={3}
                moreLinkText={(num) => `+${num} sessions`}
                nowIndicator={true}
              />
            </div>
          ) : (
            /* Onglet Émargement */
            <div className="space-y-4">
              {loadingFeuilles ? (
                <div className="flex items-center justify-center py-12">
                  <LoaderIcon />
                </div>
              ) : feuillesEmargement.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <ClipboardCheckIcon />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Aucune feuille d&apos;émargement
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Les feuilles d&apos;émargement sont créées automatiquement lorsque vous générez un QR code depuis le calendrier.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feuillesEmargement.map((feuille) => (
                    <div
                      key={feuille.id}
                      className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all"
                    >
                      {/* Header de la feuille */}
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            feuille.status === "active"
                              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                          }`}>
                            {feuille.status === "active" ? <CheckCircleIcon /> : <XCircleIcon />}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {feuille.journee?.session?.formation?.titre || "Formation"}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {feuille.journee?.date
                                ? new Date(feuille.journee.date).toLocaleDateString("fr-FR", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })
                                : "Date non définie"
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {feuille._count?.signatures || 0} signature(s)
                            </p>
                            <p className={`text-xs ${
                              feuille.status === "active"
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-500 dark:text-gray-400"
                            }`}>
                              {feuille.status === "active" ? "Active" : "Fermée"}
                            </p>
                          </div>

                          {/* Bouton copier avec feedback */}
                          <button
                            onClick={() => handleCopyLink(feuille.token, feuille.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                              copiedId === feuille.id
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            }`}
                          >
                            {copiedId === feuille.id ? (
                              <>
                                <CheckIcon />
                                Lien copié !
                              </>
                            ) : (
                              <>
                                <CopyIcon />
                                Copier le lien
                              </>
                            )}
                          </button>

                          {/* Bouton télécharger PDF */}
                          <button
                            onClick={() => handleDownloadPDF(feuille.journee.session.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                            title="Télécharger la feuille d'émargement PDF"
                          >
                            <DownloadIcon />
                            PDF
                          </button>

                          {/* Bouton voir signatures */}
                          <button
                            onClick={() => toggleExpanded(feuille)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <EyeIcon />
                            Voir
                            <ChevronDownIcon />
                          </button>
                        </div>
                      </div>

                      {/* Liste des signatures (expandable) */}
                      {expandedFeuille === feuille.id && (
                        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800/30">
                          {loadingSignatures === feuille.id ? (
                            <div className="flex items-center justify-center py-4">
                              <LoaderIcon />
                            </div>
                          ) : feuille.signatures && feuille.signatures.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                Signatures enregistrées
                              </p>
                              <div className="grid gap-3">
                                {feuille.signatures.map((sig) => {
                                  const isFormateur = sig.signataire === "formateur";
                                  const displayName = isFormateur
                                    ? `${sig.intervenant?.prenom || ""} ${sig.intervenant?.nom || ""}`
                                    : `${sig.participant?.apprenant?.prenom || ""} ${sig.participant?.apprenant?.nom || ""}`;
                                  const displayEmail = isFormateur
                                    ? sig.intervenant?.email || ""
                                    : sig.participant?.apprenant?.email || "";
                                  const initials = isFormateur
                                    ? `${sig.intervenant?.prenom?.[0] || ""}${sig.intervenant?.nom?.[0] || ""}`
                                    : `${sig.participant?.apprenant?.prenom?.[0] || ""}${sig.participant?.apprenant?.nom?.[0] || ""}`;

                                  return (
                                    <div
                                      key={sig.id}
                                      className={`flex items-start justify-between p-4 rounded-lg border ${
                                        isFormateur
                                          ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                                          : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                                      }`}
                                    >
                                      <div className="flex items-start gap-3 flex-1">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                                          isFormateur
                                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                        }`}>
                                          {initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                              {displayName}
                                            </p>
                                            {isFormateur && (
                                              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400 rounded">
                                                Formateur
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {displayEmail}
                                          </p>
                                          <div className="flex items-center gap-2 mt-2">
                                            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                                              sig.periode === "matin"
                                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                                : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                                            }`}>
                                              {sig.periode === "matin" ? "Matin" : "Après-midi"}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                              {new Date(sig.signedAt).toLocaleString("fr-FR", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      {/* Prévisualisation de la signature */}
                                      {sig.signatureData && (
                                        <div className="ml-4 flex-shrink-0">
                                          <div className="w-24 h-16 border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-800 overflow-hidden">
                                            <img
                                              src={sig.signatureData}
                                              alt="Signature"
                                              className="w-full h-full object-contain"
                                            />
                                          </div>
                                          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-1">
                                            Signature
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                              Aucune signature enregistrée pour cette feuille.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Message si pas d'événements */}
      {events.length === 0 && !loading && activeTab === "calendrier" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 dark:border-gray-800 dark:bg-white/[0.03] text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <CalendarIcon />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune session planifiée
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Créez une session documentaire pour voir apparaître vos journées de formation ici.
          </p>
        </div>
      )}

      {/* Modal détails événement */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header avec couleur selon modalité */}
            <div className={`p-6 ${
              selectedEvent.modalite === "PRESENTIEL"
                ? "bg-gradient-to-r from-blue-500 to-blue-600"
                : selectedEvent.modalite === "DISTANCIEL"
                ? "bg-gradient-to-r from-purple-500 to-purple-600"
                : "bg-gradient-to-r from-teal-500 to-teal-600"
            }`}>
              <div className="flex items-start justify-between">
                <div className="text-white">
                  <h2 className="text-xl font-bold mb-1">
                    {selectedEvent.title}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {new Date(selectedEvent.start).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getModaliteColor(selectedEvent.modalite)}`}>
                  {selectedEvent.modalite === "PRESENTIEL" && "Présentiel"}
                  {selectedEvent.modalite === "DISTANCIEL" && "Distanciel"}
                  {selectedEvent.modalite === "MIXTE" && "Mixte"}
                </span>
                <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusColor(selectedEvent.status)}`}>
                  {selectedEvent.status === "brouillon" && "Brouillon"}
                  {selectedEvent.status === "en_cours" && "En cours"}
                  {selectedEvent.status === "termine" && "Terminé"}
                </span>
              </div>

              {/* Horaires */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="p-2 bg-white dark:bg-gray-600 rounded-lg shadow-sm">
                  <ClockIcon />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900 dark:text-white mb-1">Horaires</p>
                  {formatHoraires(selectedEvent).map((h, i) => (
                    <p key={i} className="text-gray-600 dark:text-gray-300">{h}</p>
                  ))}
                </div>
              </div>

              {/* Lieu */}
              {selectedEvent.lieu && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="p-2 bg-white dark:bg-gray-600 rounded-lg shadow-sm">
                    {selectedEvent.lieu.typeLieu === "VISIOCONFERENCE" ? (
                      <VideoIcon />
                    ) : (
                      <MapPinIcon />
                    )}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedEvent.lieu.nom}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      {selectedEvent.lieu.lieuFormation}
                    </p>
                  </div>
                </div>
              )}

              {/* Formateur */}
              {selectedEvent.formateur && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="p-2 bg-white dark:bg-gray-600 rounded-lg shadow-sm">
                    <UserIcon />
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Formateur</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedEvent.formateur.prenom} {selectedEvent.formateur.nom}
                    </p>
                  </div>
                </div>
              )}

              {/* Participants */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="p-2 bg-white dark:bg-gray-600 rounded-lg shadow-sm">
                  <UsersIcon />
                </div>
                <div className="text-sm">
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Participants</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedEvent.participantsCount} participant{selectedEvent.participantsCount > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Clients/Entreprises */}
              {selectedEvent.clients.length > 0 && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    Clients
                  </p>
                  <div className="space-y-2">
                    {selectedEvent.clients.map((client) => (
                      <div key={client.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">
                          {client.entreprise?.raisonSociale || client.typeClient}
                        </span>
                        <span className="px-2 py-0.5 bg-white dark:bg-gray-600 rounded text-gray-500 dark:text-gray-400 text-xs">
                          {client.participantsCount} pers.
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t dark:border-gray-700 flex gap-3">
              <button
                onClick={() => setShowQRCode(true)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl font-medium transition-all hover:shadow-lg ${
                  selectedEvent.modalite === "PRESENTIEL"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : selectedEvent.modalite === "DISTANCIEL"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-teal-600 hover:bg-teal-700"
                }`}
              >
                <QRCodeIcon />
                Générer QR Émargement
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      {showQRCode && selectedEvent && (
        <QRCodeEmargement
          journeeId={selectedEvent.journeeId}
          formationTitre={selectedEvent.title}
          journeeDate={selectedEvent.start}
          onClose={() => setShowQRCode(false)}
        />
      )}
    </div>
  );
}

// Composant wrapper avec Suspense pour useSearchParams
export default function CalendrierSessionsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    }>
      <CalendrierSessionsContent />
    </Suspense>
  );
}
