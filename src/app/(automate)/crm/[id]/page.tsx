"use client";

// ===========================================
// CRM - Page Détail Opportunité
// ===========================================
// Inspiré de Digiforma avec deux onglets:
// 1. Informations et session
// 2. Suivi de l'opportunité (activités/timeline)

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Types
interface Opportunite {
  id: string;
  titre: string;
  description: string | null;
  stage: string;
  ordre: number;
  montantHT: number | null;
  probabilite: number;
  source: string;
  contactNom: string | null;
  contactEmail: string | null;
  contactTelephone: string | null;
  contactFonction: string | null;
  entreprise: { id: string; raisonSociale: string; siret: string | null; contactEmail: string | null; contactTelephone: string | null } | null;
  formation: { id: string; titre: string } | null;
  dateRelance: string | null;
  dateCloturePrevu: string | null;
  raisonPerte: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; nom: string; prenom: string; email: string } | null;
}

interface Activite {
  id: string;
  type: string;
  titre: string;
  description: string | null;
  date: string;
  estFait: boolean;
  createdAt: string;
}

interface Entreprise {
  id: string;
  raisonSociale: string;
  siret: string | null;
  contactEmail: string | null;
  contactTelephone: string | null;
}

interface Formation {
  id: string;
  titre: string;
}

// Configuration des stages
const STAGES: Record<string, { label: string; color: string; bgColor: string }> = {
  ENTRANT: { label: "Entrant", color: "text-gray-600", bgColor: "bg-gray-100" },
  DISCUSSION: { label: "Discussion", color: "text-blue-600", bgColor: "bg-blue-100" },
  DEVIS: { label: "Devis", color: "text-purple-600", bgColor: "bg-purple-100" },
  CONVENTION: { label: "Convention", color: "text-orange-600", bgColor: "bg-orange-100" },
  FACTURE: { label: "Facture", color: "text-green-600", bgColor: "bg-green-100" },
  GAGNE: { label: "Gagné", color: "text-emerald-600", bgColor: "bg-emerald-100" },
  PERDU: { label: "Perdu", color: "text-red-600", bgColor: "bg-red-100" },
};

// Types d'activités
const ACTIVITY_TYPES = [
  { id: "APPEL", label: "Appel", icon: "phone" },
  { id: "EMAIL", label: "Email", icon: "mail" },
  { id: "REUNION", label: "Réunion", icon: "users" },
  { id: "TACHE", label: "Tâche", icon: "check" },
  { id: "NOTE", label: "Note", icon: "file" },
  { id: "RELANCE", label: "Relance", icon: "clock" },
];

// Sources
const SOURCES: Record<string, string> = {
  SITE_WEB: "Site web",
  BOUCHE_A_OREILLE: "Bouche à oreille",
  RESEAU_SOCIAL: "Réseau social",
  SALON: "Salon/Événement",
  PARTENAIRE: "Partenaire",
  PROSPECTION: "Prospection directe",
  AUTRE: "Autre",
};

// Helpers
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDateShort = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
};

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Icons
function ArrowLeftIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function EuroIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function getActivityIcon(type: string) {
  switch (type) {
    case "APPEL":
      return <PhoneIcon />;
    case "EMAIL":
      return <MailIcon />;
    case "REUNION":
      return <UsersIcon />;
    case "TACHE":
      return <CheckIcon />;
    case "NOTE":
      return <FileIcon />;
    case "RELANCE":
      return <ClockIcon />;
    default:
      return <FileIcon />;
  }
}

// Activity Modal Component
function ActivityModal({
  activite,
  onClose,
  onSave,
  isLoading,
}: {
  activite: Activite | null;
  onClose: () => void;
  onSave: (data: Partial<Activite>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    type: activite?.type || "NOTE",
    titre: activite?.titre || "",
    description: activite?.description || "",
    date: activite?.date?.split("T")[0] || new Date().toISOString().split("T")[0],
    estFait: activite?.estFait || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {activite ? "Modifier l'activité" : "Nouvelle activité"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type d'activité
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ACTIVITY_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.id })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                    formData.type === type.id
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  {getActivityIcon(type.id)}
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre *
            </label>
            <input
              type="text"
              required
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              placeholder="Ex: Appel de suivi avec le client"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
              placeholder="Notes additionnelles..."
            />
          </div>

          {/* Date et Statut */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.estFait}
                  onChange={(e) => setFormData({ ...formData, estFait: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Marquer comme fait
                </span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.titre}
              className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Enregistrement..." : activite ? "Modifier" : "Créer"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Main Page Component
export default function OpportuniteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const opportuniteId = params.id as string;

  const [activeTab, setActiveTab] = useState<"info" | "suivi">("info");
  const [opportunite, setOpportunite] = useState<Opportunite | null>(null);
  const [activites, setActivites] = useState<Activite[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activityModal, setActivityModal] = useState<{ isOpen: boolean; activite: Activite | null }>({
    isOpen: false,
    activite: null,
  });

  // Form state for editing
  const [editForm, setEditForm] = useState<Record<string, unknown>>({});

  // Load data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [oppRes, activitesRes, entreprisesRes, formationsRes] = await Promise.all([
        fetch(`/api/crm/opportunites?id=${opportuniteId}`),
        fetch(`/api/crm/activites?opportuniteId=${opportuniteId}`),
        fetch("/api/donnees/entreprises"),
        fetch("/api/formations"),
      ]);

      if (oppRes.ok) {
        const oppData = await oppRes.json();
        setOpportunite(oppData);
        setEditForm({
          titre: oppData.titre,
          description: oppData.description || "",
          stage: oppData.stage,
          montantHT: oppData.montantHT?.toString() || "",
          probabilite: oppData.probabilite,
          source: oppData.source,
          entrepriseId: oppData.entreprise?.id || "",
          formationId: oppData.formation?.id || "",
          contactNom: oppData.contactNom || "",
          contactEmail: oppData.contactEmail || "",
          contactTelephone: oppData.contactTelephone || "",
          contactFonction: oppData.contactFonction || "",
          dateRelance: oppData.dateRelance?.split("T")[0] || "",
          dateCloturePrevu: oppData.dateCloturePrevu?.split("T")[0] || "",
          notes: oppData.notes || "",
          raisonPerte: oppData.raisonPerte || "",
        });
      }

      if (activitesRes.ok) {
        const activitesData = await activitesRes.json();
        setActivites(activitesData.activites || []);
      }

      if (entreprisesRes.ok) {
        const entreprisesData = await entreprisesRes.json();
        setEntreprises(entreprisesData.entreprises || []);
      }

      if (formationsRes.ok) {
        const formationsData = await formationsRes.json();
        setFormations(formationsData.formations || []);
      }
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setIsLoading(false);
    }
  }, [opportuniteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save opportunity changes
  const handleSaveOpportunite = async () => {
    if (!opportunite) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/crm/opportunites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: opportunite.id,
          ...editForm,
          montantHT: parseFloat(editForm.montantHT as string) || 0,
          entrepriseId: (editForm.entrepriseId as string) || null,
          formationId: (editForm.formationId as string) || null,
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        loadData();
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete opportunity
  const handleDeleteOpportunite = async () => {
    if (!opportunite) return;
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette opportunité ?")) return;

    try {
      const res = await fetch(`/api/crm/opportunites?id=${opportunite.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/crm");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  // Activity CRUD
  const handleSaveActivity = async (data: Partial<Activite>) => {
    setIsSaving(true);
    try {
      const method = activityModal.activite ? "PATCH" : "POST";
      const body = activityModal.activite
        ? { id: activityModal.activite.id, ...data }
        : { ...data, opportuniteId };

      const res = await fetch("/api/crm/activites", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setActivityModal({ isOpen: false, activite: null });
        loadData();
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActivity = async (activite: Activite) => {
    try {
      await fetch("/api/crm/activites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activite.id, estFait: !activite.estFait }),
      });
      loadData();
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleDeleteActivity = async (activiteId: string) => {
    if (!confirm("Supprimer cette activité ?")) return;
    try {
      await fetch(`/api/crm/activites?id=${activiteId}`, {
        method: "DELETE",
      });
      loadData();
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  // Change stage
  const handleChangeStage = async (newStage: string) => {
    if (!opportunite) return;
    try {
      await fetch("/api/crm/opportunites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: opportunite.id, stage: newStage }),
      });
      loadData();
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!opportunite) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <p className="text-lg mb-4">Opportunité non trouvée</p>
        <Link href="/crm" className="text-brand-500 hover:text-brand-600">
          Retour au pipeline
        </Link>
      </div>
    );
  }

  const stageConfig = STAGES[opportunite.stage] || STAGES.ENTRANT;
  const montantPondere = (opportunite.montantHT || 0) * (opportunite.probabilite / 100);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/crm"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors"
        >
          <ArrowLeftIcon />
          <span>Retour au pipeline</span>
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${stageConfig.bgColor} ${stageConfig.color}`}>
                {stageConfig.label}
              </span>
              {opportunite.entreprise && (
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <BuildingIcon />
                  {opportunite.entreprise.raisonSociale}
                </span>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {opportunite.titre}
            </h1>
            {opportunite.formation && (
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Formation: {opportunite.formation.titre}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Stage selector */}
            <select
              value={opportunite.stage}
              onChange={(e) => handleChangeStage(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500"
            >
              {Object.entries(STAGES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleDeleteOpportunite}
              className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Supprimer"
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <EuroIcon />
              Montant HT
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(opportunite.montantHT || 0)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">
              Probabilité
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {opportunite.probabilite}%
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">
              Montant pondéré
            </div>
            <p className="text-xl font-bold text-brand-600">
              {formatCurrency(montantPondere)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <CalendarIcon />
              Date clôture prévue
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {opportunite.dateCloturePrevu
                ? formatDateShort(opportunite.dateCloturePrevu)
                : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b dark:border-gray-700">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === "info"
                ? "text-brand-600 dark:text-brand-400"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Informations et session
            {activeTab === "info" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("suivi")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === "suivi"
                ? "text-brand-600 dark:text-brand-400"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Suivi de l'opportunité
            {activites.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                {activites.length}
              </span>
            )}
            {activeTab === "suivi" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500"
              />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "info" ? (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6"
            >
              <div className="flex justify-end mb-6">
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveOpportunite}
                      disabled={isSaving}
                      className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {isSaving ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                  >
                    <EditIcon />
                    Modifier
                  </button>
                )}
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left Column - Opportunité Info */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">
                    Informations générales
                  </h3>

                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Titre
                        </label>
                        <input
                          type="text"
                          value={editForm.titre as string}
                          onChange={(e) => setEditForm({ ...editForm, titre: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          value={editForm.description as string}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Montant HT
                          </label>
                          <input
                            type="number"
                            value={editForm.montantHT as string}
                            onChange={(e) => setEditForm({ ...editForm, montantHT: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Probabilité (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editForm.probabilite as number}
                            onChange={(e) => setEditForm({ ...editForm, probabilite: parseInt(e.target.value) })}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Source
                        </label>
                        <select
                          value={editForm.source as string}
                          onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          {Object.entries(SOURCES).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Date relance
                          </label>
                          <input
                            type="date"
                            value={editForm.dateRelance as string}
                            onChange={(e) => setEditForm({ ...editForm, dateRelance: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Date clôture prévue
                          </label>
                          <input
                            type="date"
                            value={editForm.dateCloturePrevu as string}
                            onChange={(e) => setEditForm({ ...editForm, dateCloturePrevu: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Notes
                        </label>
                        <textarea
                          value={editForm.notes as string}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Description</span>
                        <p className="text-gray-900 dark:text-white mt-1">
                          {opportunite.description || <span className="text-gray-400 italic">Non renseignée</span>}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Source</span>
                          <p className="text-gray-900 dark:text-white mt-1">
                            {SOURCES[opportunite.source] || opportunite.source}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Créée le</span>
                          <p className="text-gray-900 dark:text-white mt-1">
                            {formatDate(opportunite.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Date relance</span>
                          <p className="text-gray-900 dark:text-white mt-1">
                            {opportunite.dateRelance ? formatDate(opportunite.dateRelance) : "-"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Date clôture prévue</span>
                          <p className="text-gray-900 dark:text-white mt-1">
                            {opportunite.dateCloturePrevu ? formatDate(opportunite.dateCloturePrevu) : "-"}
                          </p>
                        </div>
                      </div>

                      {opportunite.notes && (
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Notes</span>
                          <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
                            {opportunite.notes}
                          </p>
                        </div>
                      )}

                      {opportunite.stage === "PERDU" && opportunite.raisonPerte && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                          <span className="text-sm text-red-600 dark:text-red-400 font-medium">Raison de la perte</span>
                          <p className="text-red-700 dark:text-red-300 mt-1">
                            {opportunite.raisonPerte}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column - Contact & Entreprise */}
                <div className="space-y-6">
                  {/* Contact */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2 mb-4">
                      Contact
                    </h3>

                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Nom
                            </label>
                            <input
                              type="text"
                              value={editForm.contactNom as string}
                              onChange={(e) => setEditForm({ ...editForm, contactNom: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Fonction
                            </label>
                            <input
                              type="text"
                              value={editForm.contactFonction as string}
                              onChange={(e) => setEditForm({ ...editForm, contactFonction: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={editForm.contactEmail as string}
                            onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Téléphone
                          </label>
                          <input
                            type="tel"
                            value={editForm.contactTelephone as string}
                            onChange={(e) => setEditForm({ ...editForm, contactTelephone: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {opportunite.contactNom ? (
                          <>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600">
                                {opportunite.contactNom.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {opportunite.contactNom}
                                </p>
                                {opportunite.contactFonction && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {opportunite.contactFonction}
                                  </p>
                                )}
                              </div>
                            </div>
                            {opportunite.contactEmail && (
                              <a
                                href={`mailto:${opportunite.contactEmail}`}
                                className="flex items-center gap-2 text-brand-600 hover:text-brand-700 text-sm"
                              >
                                <MailIcon />
                                {opportunite.contactEmail}
                              </a>
                            )}
                            {opportunite.contactTelephone && (
                              <a
                                href={`tel:${opportunite.contactTelephone}`}
                                className="flex items-center gap-2 text-brand-600 hover:text-brand-700 text-sm"
                              >
                                <PhoneIcon />
                                {opportunite.contactTelephone}
                              </a>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-400 italic">Aucun contact renseigné</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Entreprise */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2 mb-4">
                      Entreprise
                    </h3>

                    {isEditing ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Entreprise associée
                        </label>
                        <select
                          value={editForm.entrepriseId as string}
                          onChange={(e) => setEditForm({ ...editForm, entrepriseId: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Aucune entreprise</option>
                          {entreprises.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.raisonSociale}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <>
                        {opportunite.entreprise ? (
                          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <BuildingIcon />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {opportunite.entreprise.raisonSociale}
                                </p>
                                {opportunite.entreprise.siret && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    SIRET: {opportunite.entreprise.siret}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1 text-sm">
                              {opportunite.entreprise.contactEmail && (
                                <a
                                  href={`mailto:${opportunite.entreprise.contactEmail}`}
                                  className="flex items-center gap-2 text-brand-600 hover:text-brand-700"
                                >
                                  <MailIcon />
                                  {opportunite.entreprise.contactEmail}
                                </a>
                              )}
                              {opportunite.entreprise.contactTelephone && (
                                <a
                                  href={`tel:${opportunite.entreprise.contactTelephone}`}
                                  className="flex items-center gap-2 text-brand-600 hover:text-brand-700"
                                >
                                  <PhoneIcon />
                                  {opportunite.entreprise.contactTelephone}
                                </a>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-400 italic">Aucune entreprise associée</p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Formation */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2 mb-4">
                      Formation associée
                    </h3>

                    {isEditing ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Formation
                        </label>
                        <select
                          value={editForm.formationId as string}
                          onChange={(e) => setEditForm({ ...editForm, formationId: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Aucune formation</option>
                          {formations.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.titre}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <>
                        {opportunite.formation ? (
                          <div className="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-lg">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {opportunite.formation.titre}
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-400 italic">Aucune formation associée</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="suivi"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6"
            >
              {/* Add activity button */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Historique des activités
                </h3>
                <button
                  onClick={() => setActivityModal({ isOpen: true, activite: null })}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors"
                >
                  <PlusIcon />
                  Ajouter une activité
                </button>
              </div>

              {/* Timeline */}
              {activites.length > 0 ? (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                  <div className="space-y-4">
                    {activites.map((activite, index) => (
                      <motion.div
                        key={activite.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative pl-12"
                      >
                        {/* Timeline dot */}
                        <div
                          className={`absolute left-2.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            activite.estFait
                              ? "bg-green-500 border-green-500 text-white"
                              : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {activite.estFait && (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        {/* Activity card */}
                        <div
                          className={`bg-white dark:bg-gray-800 rounded-xl border p-4 group hover:shadow-md transition-all ${
                            activite.estFait
                              ? "border-green-100 dark:border-green-800/30"
                              : "border-gray-100 dark:border-gray-700"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                activite.estFait
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                              }`}>
                                {getActivityIcon(activite.type)}
                              </div>
                              <div>
                                <p className={`font-medium ${
                                  activite.estFait
                                    ? "text-gray-500 dark:text-gray-400 line-through"
                                    : "text-gray-900 dark:text-white"
                                }`}>
                                  {activite.titre}
                                </p>
                                {activite.description && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {activite.description}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                  {formatDateTime(activite.date)}
                                </p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleToggleActivity(activite)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  activite.estFait
                                    ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                    : "text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                }`}
                                title={activite.estFait ? "Marquer comme non fait" : "Marquer comme fait"}
                              >
                                <CheckIcon />
                              </button>
                              <button
                                onClick={() => setActivityModal({ isOpen: true, activite })}
                                className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <EditIcon />
                              </button>
                              <button
                                onClick={() => handleDeleteActivity(activite.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <ClockIcon />
                  </div>
                  <p className="mb-2">Aucune activité enregistrée</p>
                  <p className="text-sm">
                    Commencez à suivre vos interactions avec cette opportunité
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Activity Modal */}
      <AnimatePresence>
        {activityModal.isOpen && (
          <ActivityModal
            activite={activityModal.activite}
            onClose={() => setActivityModal({ isOpen: false, activite: null })}
            onSave={handleSaveActivity}
            isLoading={isSaving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
