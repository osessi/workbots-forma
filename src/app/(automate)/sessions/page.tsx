"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image"; // Correction 538
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Types
interface Formation {
  id: string;
  titre: string;
  dureeHeures: number | null;
  dureeJours: number | null; // Correction 366
}

interface Session {
  id: string;
  reference: string;
  nom: string | null;
  status: string;
  modalite: string;
  formation: {
    id: string;
    titre: string;
    image: string | null; // Correction 538: Image de la formation
  };
  lieu: {
    id: string;
    nom: string;
    typeLieu: string;
  } | null;
  formateur: {
    id: string;
    nom: string;
    prenom: string;
  } | null;
  journees: Array<{
    id: string;
    date: string;
    ordre: number;
  }>;
  clients: Array<{
    id: string;
    typeClient: string;
    entreprise: { id: string; raisonSociale: string } | null;
    participants: Array<{
      id: string;
      apprenant: { id: string; nom: string; prenom: string } | null;
    }>;
  }>;
  createdAt: string;
}

interface Intervenant {
  id: string;
  nom: string;
  prenom: string;
}

interface LieuFormation {
  id: string;
  nom: string;
  typeLieu: string;
}

// Icons
const LoaderIcon = () => (
  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M9.16667 3.33333C5.94501 3.33333 3.33333 5.94501 3.33333 9.16667C3.33333 12.3883 5.94501 15 9.16667 15C12.3883 15 15 12.3883 15 9.16667C15 5.94501 12.3883 3.33333 9.16667 3.33333ZM1.66667 9.16667C1.66667 5.02453 5.02453 1.66667 9.16667 1.66667C13.3088 1.66667 16.6667 5.02453 16.6667 9.16667C16.6667 10.9378 16.0528 12.5654 15.0274 13.8565L18.0893 16.9107C18.4147 17.2362 18.4147 17.7638 18.0893 18.0893C17.7638 18.4147 17.2362 18.4147 16.9107 18.0893L13.8565 15.0274C12.5654 16.0528 10.9378 16.6667 9.16667 16.6667C5.02453 16.6667 1.66667 13.3088 1.66667 9.16667Z" fill="currentColor"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 5L15 15M5 15L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="3" width="12" height="11" rx="1.5" />
    <path d="M2 6h12M5 1v3M11 1v3" />
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

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 8.5a2 2 0 100-4 2 2 0 000 4z" />
    <path d="M13 6.5c0 4.5-5 7-5 7s-5-2.5-5-7a5 5 0 1110 0z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 4h12M5.33 4V2.67c0-.37.3-.67.67-.67h4c.37 0 .67.3.67.67V4M6.67 7.33v4M9.33 7.33v4M12.67 4v9.33c0 .37-.3.67-.67.67H4c-.37 0-.67-.3-.67-.67V4" />
  </svg>
);

// Correction 538: Icône pour le fallback de la vignette
const BookIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

// Status badge colors
const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  BROUILLON: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", dot: "bg-gray-400" },
  PLANIFIEE: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  EN_COURS: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400", dot: "bg-orange-500" },
  TERMINEE: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400", dot: "bg-green-500" },
  ANNULEE: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
};

const statusLabels: Record<string, string> = {
  BROUILLON: "Brouillon",
  PLANIFIEE: "Planifiée",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
};

const modaliteLabels: Record<string, string> = {
  PRESENTIEL: "Présentiel",
  DISTANCIEL: "Distanciel",
  MIXTE: "Mixte",
};

function SessionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [lieux, setLieux] = useState<LieuFormation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    formationId: "",
    nom: "",
    modalite: "PRESENTIEL",
    lieuId: "",
    salleVirtuelleId: "", // Correction 370: pour modalité Mixte
    lienConnexion: "",
    formateurId: "",
    journees: [{ date: "", heureDebutMatin: "09:00", heureFinMatin: "12:30", heureDebutAprem: "14:00", heureFinAprem: "17:30" }],
  });

  // Correction 399: Stocker l'apprenant et pré-inscription pour pré-remplissage
  const [pendingApprenantId, setPendingApprenantId] = useState<string | null>(null);
  const [pendingPreinscriptionId, setPendingPreinscriptionId] = useState<string | null>(null);

  // Check URL params for auto-opening create modal
  useEffect(() => {
    const shouldCreate = searchParams.get("create") === "true";
    const formationIdFromUrl = searchParams.get("formationId");
    // Correction 399: Récupérer les paramètres de pré-remplissage
    const apprenantIdFromUrl = searchParams.get("apprenantId");
    const preinscriptionIdFromUrl = searchParams.get("preinscriptionId");

    if (formationIdFromUrl || apprenantIdFromUrl) {
      setShowCreateModal(true);
      if (formationIdFromUrl) {
        setFormData(prev => ({ ...prev, formationId: formationIdFromUrl }));
      }
      // Correction 399: Stocker pour utilisation après création
      if (apprenantIdFromUrl) {
        setPendingApprenantId(apprenantIdFromUrl);
      }
      if (preinscriptionIdFromUrl) {
        setPendingPreinscriptionId(preinscriptionIdFromUrl);
      }
      // Clean up URL params
      router.replace("/sessions", { scroll: false });
    }
  }, [searchParams, router]);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/training-sessions");
      if (!res.ok) throw new Error("Erreur lors du chargement des sessions");
      const data = await res.json();
      // L'API retourne data.data, pas data.sessions
      setSessions(data.data || data.sessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch formations
  const fetchFormations = useCallback(async () => {
    try {
      const res = await fetch("/api/formations");
      if (!res.ok) return;
      const data = await res.json();
      setFormations(data.data || data.formations || []);
    } catch {
      // Ignore
    }
  }, []);

  // Fetch intervenants
  const fetchIntervenants = useCallback(async () => {
    try {
      const res = await fetch("/api/intervenants");
      if (!res.ok) return;
      const data = await res.json();
      setIntervenants(data || []);
    } catch {
      // Ignore
    }
  }, []);

  // Fetch lieux
  const fetchLieux = useCallback(async () => {
    try {
      const res = await fetch("/api/lieux");
      if (!res.ok) return;
      const data = await res.json();
      setLieux(data || []);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchFormations();
    fetchIntervenants();
    fetchLieux();
  }, [fetchSessions, fetchFormations, fetchIntervenants, fetchLieux]);

  // Add journee
  const addJournee = () => {
    setFormData(prev => ({
      ...prev,
      journees: [...prev.journees, { date: "", heureDebutMatin: "09:00", heureFinMatin: "12:30", heureDebutAprem: "14:00", heureFinAprem: "17:30" }],
    }));
  };

  // Remove journee
  const removeJournee = (index: number) => {
    if (formData.journees.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      journees: prev.journees.filter((_, i) => i !== index),
    }));
  };

  // Update journee
  const updateJournee = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      journees: prev.journees.map((j, i) => i === index ? { ...j, [field]: value } : j),
    }));
  };

  // Correction 366: Calculer le total des heures planifiées
  const calculateTotalHours = useCallback(() => {
    let totalMinutes = 0;
    formData.journees.forEach(journee => {
      // Calculer heures du matin
      if (journee.heureDebutMatin && journee.heureFinMatin) {
        const [debutH, debutM] = journee.heureDebutMatin.split(':').map(Number);
        const [finH, finM] = journee.heureFinMatin.split(':').map(Number);
        totalMinutes += (finH * 60 + finM) - (debutH * 60 + debutM);
      }
      // Calculer heures de l'après-midi
      if (journee.heureDebutAprem && journee.heureFinAprem) {
        const [debutH, debutM] = journee.heureDebutAprem.split(':').map(Number);
        const [finH, finM] = journee.heureFinAprem.split(':').map(Number);
        totalMinutes += (finH * 60 + finM) - (debutH * 60 + debutM);
      }
    });
    return Math.round(totalMinutes / 60 * 10) / 10; // Arrondi à 1 décimale
  }, [formData.journees]);

  // Correction 366: Obtenir la formation sélectionnée
  const selectedFormation = formations.find(f => f.id === formData.formationId);
  const totalHeuresPlanifiees = calculateTotalHours();
  const nombreJoursPlanifies = formData.journees.filter(j => j.date).length;

  // Create session
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.formationId) {
      setCreateError("Veuillez sélectionner une formation");
      return;
    }
    if (!formData.journees.some(j => j.date)) {
      setCreateError("Veuillez ajouter au moins une journée");
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/training-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formationId: formData.formationId,
          nom: formData.nom || undefined,
          modalite: formData.modalite,
          lieuId: formData.lieuId || undefined,
          lienConnexion: formData.lienConnexion || undefined,
          formateurId: formData.formateurId || undefined,
          journees: formData.journees.filter(j => j.date).map((j, i) => ({
            ordre: i + 1,
            date: j.date,
            heureDebutMatin: j.heureDebutMatin,
            heureFinMatin: j.heureFinMatin,
            heureDebutAprem: j.heureDebutAprem,
            heureFinAprem: j.heureFinAprem,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création");
      }

      // Rediriger vers la page de configuration pour compléter les infos
      // (clients, participants, tarifs, documents)
      const sessionId = data.id;
      if (sessionId) {
        // Correction 399: Passer les paramètres de pré-remplissage si présents
        let configureUrl = `/sessions/${sessionId}/configure`;
        const params = new URLSearchParams();
        if (pendingApprenantId) {
          params.set("apprenantId", pendingApprenantId);
          setPendingApprenantId(null);
        }
        if (pendingPreinscriptionId) {
          params.set("preinscriptionId", pendingPreinscriptionId);
          setPendingPreinscriptionId(null);
        }
        if (params.toString()) {
          configureUrl += `?${params.toString()}`;
        }
        router.push(configureUrl);
      } else {
        // Fallback: fermer le modal et rafraîchir
        setFormData({
          formationId: "",
          nom: "",
          modalite: "PRESENTIEL",
          lieuId: "",
          salleVirtuelleId: "", // Correction 370
          lienConnexion: "",
          formateurId: "",
          journees: [{ date: "", heureDebutMatin: "09:00", heureFinMatin: "12:30", heureDebutAprem: "14:00", heureFinAprem: "17:30" }],
        });
        setShowCreateModal(false);
        fetchSessions();
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setCreating(false);
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch =
      session.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.formation.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.nom?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get participant count
  const getParticipantCount = (session: Session) => {
    return session.clients.reduce((acc, client) => acc + client.participants.length, 0);
  };

  // Open delete modal
  const openDeleteModal = (e: React.MouseEvent, session: Session) => {
    e.preventDefault();
    e.stopPropagation();
    setSessionToDelete(session);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  // Delete session
  const handleDelete = async () => {
    if (!sessionToDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/training-sessions/${sessionToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      // Fermer le modal et rafraîchir la liste
      setShowDeleteModal(false);
      setSessionToDelete(null);
      fetchSessions();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setDeleting(false);
    }
  };

  // Get date range
  const getDateRange = (journees: Session["journees"]) => {
    if (journees.length === 0) return "Non planifiée";
    const sorted = [...journees].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first = format(new Date(sorted[0].date), "d MMM", { locale: fr });
    const last = format(new Date(sorted[sorted.length - 1].date), "d MMM yyyy", { locale: fr });
    if (sorted.length === 1) return format(new Date(sorted[0].date), "d MMMM yyyy", { locale: fr });
    return `${first} - ${last}`;
  };

  // Correction 371: Formater les clients et participants pour l'affichage sur la carte
  const getClientsParticipantsLabel = (session: Session): string => {
    if (!session.clients || session.clients.length === 0) {
      return "Aucun client/participant";
    }

    const labels: string[] = [];

    session.clients.forEach(client => {
      if (client.typeClient === "ENTREPRISE" && client.entreprise) {
        // Entreprise : afficher le nom de l'entreprise
        labels.push(client.entreprise.raisonSociale);
      } else if (client.typeClient === "INDEPENDANT" || client.typeClient === "PARTICULIER") {
        // Indépendant ou Particulier : afficher les noms des participants
        client.participants.forEach(p => {
          if (p.apprenant) {
            labels.push(`${p.apprenant.prenom} ${p.apprenant.nom.toUpperCase()}`);
          }
        });
      }
    });

    if (labels.length === 0) {
      return "Aucun client/participant";
    }

    // Limiter à 3 éléments pour éviter un affichage trop long
    if (labels.length <= 3) {
      return labels.join(", ");
    }
    return `${labels.slice(0, 2).join(", ")} +${labels.length - 2}`;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sessions de formation</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Suivez et organisez vos sessions de formation.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl transition-colors"
        >
          <PlusIcon />
          Nouvelle session
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Rechercher une session..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 pr-10 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-no-repeat bg-[right_0.75rem_center] bg-[length:16px_16px]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
        >
          <option value="all">Tous les statuts</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Sessions list */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <CalendarIcon />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune session</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm || statusFilter !== "all"
              ? "Aucune session ne correspond à vos critères"
              : "Créez votre première session de formation"}
          </p>
          {!searchTerm && statusFilter === "all" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl transition-colors"
            >
              <PlusIcon />
              Créer une session
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSessions.map((session) => {
            const statusStyle = statusColors[session.status] || statusColors.BROUILLON;
            return (
              <div
                key={session.id}
                className="group relative block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl hover:border-brand-300 dark:hover:border-brand-700 transition-colors overflow-hidden"
              >
                <Link
                  href={`/sessions/${session.id}`}
                  className="flex"
                >
                  {/* Correction 538: Vignette de la formation */}
                  <div className="hidden sm:flex w-32 h-full flex-shrink-0">
                    {session.formation.image ? (
                      <div className="relative w-full h-full min-h-[140px]">
                        <Image
                          src={session.formation.image}
                          alt={session.formation.titre}
                          fill
                          className="object-cover"
                          sizes="128px"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full min-h-[140px] bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/30 flex items-center justify-center">
                        <div className="text-brand-400 dark:text-brand-500">
                          <BookIcon />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-mono text-gray-500 dark:text-gray-400">{session.reference}</span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                            {statusLabels[session.status]}
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            {modaliteLabels[session.modalite]}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {session.formation.titre}
                        </h3>
                        {session.nom && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{session.nom}</p>
                        )}
                        {/* Correction 371: Affichage clients & participants */}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span className="font-medium text-gray-600 dark:text-gray-300">Clients & participants :</span>{' '}
                          <span className={getClientsParticipantsLabel(session) === "Aucun client/participant" ? "italic text-gray-400" : ""}>
                            {getClientsParticipantsLabel(session)}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon />
                          <span>{getDateRange(session.journees)}</span>
                          {session.journees.length > 1 && (
                            <span className="text-xs">({session.journees.length} jours)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <UsersIcon />
                          <span>{getParticipantCount(session)} participant{getParticipantCount(session) > 1 ? "s" : ""}</span>
                        </div>
                        {session.lieu && (
                          <div className="flex items-center gap-1.5">
                            <MapPinIcon />
                            <span>{session.lieu.nom}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
                {/* Delete button - hidden for completed sessions */}
                {session.status !== "TERMINEE" && (
                  <button
                    onClick={(e) => openDeleteModal(e, session)}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Supprimer la session"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nouvelle session</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-6">
              {createError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
                  {createError}
                </div>
              )}

              {/* Formation selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formation <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.formationId}
                  onChange={(e) => setFormData(prev => ({ ...prev, formationId: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                >
                  <option value="">Sélectionner une formation</option>
                  {formations.map((f) => (
                    <option key={f.id} value={f.id}>{f.titre}</option>
                  ))}
                </select>
              </div>

              {/* Session name (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom de la session (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                  placeholder="Ex. : Nom de l'entreprise du client – 10 Janvier 2026"
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Modalite */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Modalité
                </label>
                <div className="flex gap-3">
                  {Object.entries(modaliteLabels).map(([value, label]) => (
                    <label key={value} className="flex-1">
                      <input
                        type="radio"
                        name="modalite"
                        value={value}
                        checked={formData.modalite === value}
                        onChange={(e) => setFormData(prev => ({ ...prev, modalite: e.target.value }))}
                        className="sr-only"
                      />
                      <div className={`p-3 text-center border rounded-xl cursor-pointer transition-colors ${
                        formData.modalite === value
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}>
                        {label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Lieu / Lien de connexion selon la modalité */}
              {/* Correction 370: Gestion des 3 modalités */}
              {formData.modalite === "PRESENTIEL" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lieu
                  </label>
                  <select
                    value={formData.lieuId}
                    onChange={(e) => setFormData(prev => ({ ...prev, lieuId: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Sélectionner un lieu</option>
                    {lieux.filter(l => l.typeLieu !== "VISIOCONFERENCE").map((l) => (
                      <option key={l.id} value={l.id}>{l.nom}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.modalite === "DISTANCIEL" && (
                <div className="space-y-4">
                  {/* Sélection d'une salle virtuelle existante */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Salle virtuelle
                    </label>
                    <select
                      value={formData.lieuId}
                      onChange={(e) => setFormData(prev => ({ ...prev, lieuId: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">Sélectionner une salle virtuelle</option>
                      {lieux.filter(l => l.typeLieu === "VISIOCONFERENCE").map((l) => (
                        <option key={l.id} value={l.id}>{l.nom}</option>
                      ))}
                    </select>
                  </div>
                  {/* Ou saisie libre du lien */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ou lien de connexion
                    </label>
                    <input
                      type="url"
                      value={formData.lienConnexion}
                      onChange={(e) => setFormData(prev => ({ ...prev, lienConnexion: e.target.value }))}
                      placeholder="https://meet.google.com/... ou https://zoom.us/..."
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Laissez vide si vous avez sélectionné une salle virtuelle
                    </p>
                  </div>
                </div>
              )}

              {/* Correction 370: Modalité MIXTE - afficher les deux volets */}
              {formData.modalite === "MIXTE" && (
                <div className="space-y-4">
                  {/* Lieu présentiel */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Lieu (présentiel)
                    </label>
                    <select
                      value={formData.lieuId}
                      onChange={(e) => setFormData(prev => ({ ...prev, lieuId: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">Sélectionner un lieu</option>
                      {lieux.filter(l => l.typeLieu !== "VISIOCONFERENCE").map((l) => (
                        <option key={l.id} value={l.id}>{l.nom}</option>
                      ))}
                    </select>
                  </div>

                  {/* Accès distanciel */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Accès distanciel
                    </label>
                    <div className="space-y-3">
                      <select
                        value={formData.salleVirtuelleId}
                        onChange={(e) => setFormData(prev => ({ ...prev, salleVirtuelleId: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="">Sélectionner une salle virtuelle</option>
                        {lieux.filter(l => l.typeLieu === "VISIOCONFERENCE").map((l) => (
                          <option key={l.id} value={l.id}>{l.nom}</option>
                        ))}
                      </select>
                      <div className="text-center text-xs text-gray-500 dark:text-gray-400">ou</div>
                      <input
                        type="url"
                        value={formData.lienConnexion}
                        onChange={(e) => setFormData(prev => ({ ...prev, lienConnexion: e.target.value }))}
                        placeholder="https://meet.google.com/... ou https://zoom.us/..."
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Formateur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formateur
                </label>
                <select
                  value={formData.formateurId}
                  onChange={(e) => setFormData(prev => ({ ...prev, formateurId: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Sélectionner un formateur</option>
                  {intervenants.map((i) => (
                    <option key={i.id} value={i.id}>{i.prenom} {i.nom}</option>
                  ))}
                </select>
              </div>

              {/* Journées */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Journées de formation <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addJournee}
                    className="text-sm text-brand-500 hover:text-brand-600 font-medium"
                  >
                    + Ajouter une journée
                  </button>
                </div>

                {/* Correction 366: Affichage durée cible + contrôle cohérence */}
                {selectedFormation && (selectedFormation.dureeHeures || selectedFormation.dureeJours) && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="text-sm text-blue-800 dark:text-blue-300">
                        <span className="font-medium">Durée de la formation :</span>{' '}
                        {selectedFormation.dureeJours && <span>{selectedFormation.dureeJours} jour{selectedFormation.dureeJours > 1 ? 's' : ''}</span>}
                        {selectedFormation.dureeJours && selectedFormation.dureeHeures && <span> / </span>}
                        {selectedFormation.dureeHeures && <span>{selectedFormation.dureeHeures} h</span>}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {/* Indicateur Jours */}
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            selectedFormation.dureeJours
                              ? nombreJoursPlanifies === selectedFormation.dureeJours
                                ? 'bg-green-500'
                                : 'bg-red-500'
                              : 'bg-gray-400'
                          }`} />
                          <span className={`${
                            selectedFormation.dureeJours
                              ? nombreJoursPlanifies === selectedFormation.dureeJours
                                ? 'text-green-700 dark:text-green-400'
                                : 'text-red-700 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {nombreJoursPlanifies} jour{nombreJoursPlanifies > 1 ? 's' : ''}
                            {selectedFormation.dureeJours && ` / ${selectedFormation.dureeJours}`}
                          </span>
                        </div>
                        {/* Indicateur Heures */}
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            selectedFormation.dureeHeures
                              ? totalHeuresPlanifiees === selectedFormation.dureeHeures
                                ? 'bg-green-500'
                                : 'bg-red-500'
                              : 'bg-gray-400'
                          }`} />
                          <span className={`${
                            selectedFormation.dureeHeures
                              ? totalHeuresPlanifiees === selectedFormation.dureeHeures
                                ? 'text-green-700 dark:text-green-400'
                                : 'text-red-700 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {totalHeuresPlanifiees} h
                            {selectedFormation.dureeHeures && ` / ${selectedFormation.dureeHeures} h`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {formData.journees.map((journee, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Jour {index + 1}</span>
                        {formData.journees.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeJournee(index)}
                            className="p-1 text-red-500 hover:text-red-600"
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        <div className="sm:col-span-1">
                          <input
                            type="date"
                            value={journee.date}
                            onChange={(e) => updateJournee(index, "date", e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                            required
                          />
                        </div>
                        <div>
                          <input
                            type="time"
                            value={journee.heureDebutMatin}
                            onChange={(e) => updateJournee(index, "heureDebutMatin", e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                          />
                          <span className="text-xs text-gray-500">Début matin</span>
                        </div>
                        <div>
                          <input
                            type="time"
                            value={journee.heureFinMatin}
                            onChange={(e) => updateJournee(index, "heureFinMatin", e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                          />
                          <span className="text-xs text-gray-500">Fin matin</span>
                        </div>
                        <div>
                          <input
                            type="time"
                            value={journee.heureDebutAprem}
                            onChange={(e) => updateJournee(index, "heureDebutAprem", e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                          />
                          <span className="text-xs text-gray-500">Début après-midi</span>
                        </div>
                        <div>
                          <input
                            type="time"
                            value={journee.heureFinAprem}
                            onChange={(e) => updateJournee(index, "heureFinAprem", e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                          />
                          <span className="text-xs text-gray-500">Fin après-midi</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
                >
                  {creating && <LoaderIcon />}
                  Créer la session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && sessionToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                  <TrashIcon />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Supprimer la session
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {sessionToDelete.reference}
                  </p>
                </div>
              </div>

              {getParticipantCount(sessionToDelete) > 0 ? (
                <div className="p-3 mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <p className="text-amber-700 dark:text-amber-400 font-medium mb-1">
                    Attention : cette session contient {getParticipantCount(sessionToDelete)} participant{getParticipantCount(sessionToDelete) > 1 ? "s" : ""}
                  </p>
                  <p className="text-amber-600 dark:text-amber-500 text-sm">
                    La suppression entraînera également la suppression de tous les participants et clients associés.
                  </p>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Êtes-vous sûr de vouloir supprimer cette session ?
                </p>
              )}
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                Cette action est irréversible.
              </p>

              {deleteError && (
                <div className="p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                  {deleteError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSessionToDelete(null);
                    setDeleteError(null);
                  }}
                  className="px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  disabled={deleting}
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
                >
                  {deleting && <LoaderIcon />}
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading fallback
function SessionsPageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoaderIcon />
    </div>
  );
}

// Main export with Suspense for useSearchParams
export default function SessionsPage() {
  return (
    <Suspense fallback={<SessionsPageLoader />}>
      <SessionsPageContent />
    </Suspense>
  );
}
