"use client";

// ===========================================
// CRM PIPELINE - Tunnel de Vente Avancé
// ===========================================
// Inspiré de Digiforma avec colonnes personnalisables,
// filtres avancés et page de détail complète

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";

// Types
type CRMStage = string;

interface Opportunite {
  id: string;
  titre: string;
  description: string | null;
  stage: CRMStage;
  ordre: number;
  montantHT: number | null;
  probabilite: number;
  source: string;
  contactNom: string | null;
  contactEmail: string | null;
  contactTelephone: string | null;
  contactFonction: string | null;
  entreprise: { id: string; raisonSociale: string } | null;
  formation: { id: string; titre: string } | null;
  dateRelance: string | null;
  dateCloturePrevu: string | null;
  raisonPerte: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { nom: string; prenom: string } | null;
  _count?: { activites: number };
}

interface Entreprise {
  id: string;
  raisonSociale: string;
  siret: string | null;
  email: string | null;
  telephone: string | null;
}

interface Formation {
  id: string;
  titre: string;
  dureeHeures: number | null;
}

interface Stats {
  total: number;
  montantTotal: number;
  montantPondere: number;
  parStage: Record<string, { count: number; montant: number }>;
}

interface PipelineStage {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  ordre: number;
}

// Type pour les données du formulaire (différent de Opportunite car inclut les IDs des relations)
interface OpportuniteFormData {
  titre: string;
  description?: string | null;
  stage: string;
  montantHT: number;
  probabilite?: number;
  source?: string;
  entrepriseId?: string | null;
  formationId?: string | null;
  contactNom?: string | null;
  contactEmail?: string | null;
  contactTelephone?: string | null;
  contactFonction?: string | null;
  dateRelance?: string | null;
  dateCloturePrevu?: string | null;
  notes?: string | null;
  raisonPerte?: string | null;
}

// Configuration par défaut des colonnes
const DEFAULT_STAGES: PipelineStage[] = [
  { id: "A_TRAITER", label: "À traiter", color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-700", ordre: 0 },
  { id: "EN_COURS", label: "En cours", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30", ordre: 1 },
  { id: "PROPOSITION_ENVOYEE", label: "Proposition envoyée", color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30", ordre: 2 },
  { id: "RELANCE", label: "Relance", color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30", ordre: 3 },
  { id: "GAGNE", label: "Gagné", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30", ordre: 4 },
  { id: "PERDU", label: "Perdu", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30", ordre: 5 },
];

// Sources d'opportunités
const SOURCES = [
  { id: "SITE_WEB", label: "Site web" },
  { id: "BOUCHE_A_OREILLE", label: "Bouche à oreille" },
  { id: "RESEAUX_SOCIAUX", label: "Réseaux sociaux" },
  { id: "SALON_EVENEMENT", label: "Salon/Événement" },
  { id: "PARTENAIRE", label: "Partenaire" },
  { id: "DEMARCHAGE", label: "Démarchage" },
  { id: "CATALOGUE", label: "Catalogue en ligne" },
  { id: "AUTRE", label: "Autre" },
];

// Types de client
const CLIENT_TYPES = [
  { id: "ENTREPRISE", label: "Entreprise" },
  { id: "INDEPENDANT", label: "Indépendant" },
  { id: "PARTICULIER", label: "Particulier" },
];

// Icons
const LoaderIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 4v12M4 10h12" strokeLinecap="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 5L5 15M5 5l10 10" strokeLinecap="round" />
  </svg>
);

const EuroIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 4.5c-1-1.5-2.5-2-4-2-3 0-5 2.5-5 5.5s2 5.5 5 5.5c1.5 0 3-.5 4-2M2 7h7M2 9h7" strokeLinecap="round" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1" y="3" width="8" height="10" rx="1" />
    <rect x="9" y="6" width="4" height="7" rx="1" />
    <path d="M3 6h2M3 8h2M3 10h2" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1" y="2" width="12" height="11" rx="1.5" />
    <path d="M1 5h12M4 1v2M10 1v2" />
  </svg>
);

const DragIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" opacity="0.5">
    <circle cx="3" cy="2" r="1" />
    <circle cx="9" cy="2" r="1" />
    <circle cx="3" cy="6" r="1" />
    <circle cx="9" cy="6" r="1" />
    <circle cx="3" cy="10" r="1" />
    <circle cx="9" cy="10" r="1" />
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6" />
    <path d="M16 16l-4-4" strokeLinecap="round" />
  </svg>
);

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 4h14M4 9h10M6 14h6" strokeLinecap="round" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="9" cy="9" r="2" />
    <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.5 3.5l1.5 1.5M13 13l1.5 1.5M3.5 14.5l1.5-1.5M13 5l1.5-1.5" strokeLinecap="round" />
  </svg>
);

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="7" cy="4" r="2.5" />
    <path d="M2 13c0-2.5 2-4.5 5-4.5s5 2 5 4.5" strokeLinecap="round" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 5h12M6 5V3h6v2M7 8v5M11 8v5M4 5l1 10h8l1-10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MoveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 2v14M2 9h14M5 5l4-3 4 3M5 13l4 3 4-3M2 6l-1 3 1 3M16 6l1 3-1 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronIcon = ({ direction = "right" }: { direction?: "left" | "right" | "up" | "down" }) => {
  const rotations = { right: 0, down: 90, left: 180, up: 270 };
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: `rotate(${rotations[direction]}deg)` }}>
      <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Format currency
const formatCurrency = (amount: number | null) => {
  if (!amount) return "-";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatShortDate = (dateStr: string | null) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
};

// Composant Carte Opportunité draggable
function OpportuniteCard({
  opportunite,
  onClick,
}: {
  opportunite: Opportunite;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opportunite.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Handler pour le click qui ne se déclenche pas pendant le drag
  const handleClick = (e: React.MouseEvent) => {
    // Ne pas ouvrir le modal si on est en train de drag
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick();
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-600 transition-all cursor-grab active:cursor-grabbing touch-none group ${
        isDragging ? "z-50 shadow-xl ring-2 ring-brand-500" : ""
      }`}
      onClick={handleClick}
    >
      {/* Contenu de la carte */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {/* Titre et checkbox */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
              {opportunite.titre}
            </h4>
            <input
              type="checkbox"
              className="mt-0.5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Info entreprise ou contact */}
          {opportunite.entreprise ? (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600 dark:text-gray-400">
              <BuildingIcon />
              <span className="truncate font-medium">{opportunite.entreprise.raisonSociale}</span>
            </div>
          ) : opportunite.contactNom ? (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600 dark:text-gray-400">
              <UserIcon />
              <span className="truncate">{opportunite.contactNom}</span>
            </div>
          ) : null}

          {/* Formation liée */}
          {opportunite.formation && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              {opportunite.formation.titre}
            </p>
          )}

          {/* Dates */}
          {(opportunite.dateCloturePrevu || opportunite.dateRelance) && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
              <CalendarIcon />
              <span>
                {opportunite.dateCloturePrevu
                  ? formatShortDate(opportunite.dateCloturePrevu)
                  : formatShortDate(opportunite.dateRelance)}
              </span>
            </div>
          )}

          {/* Footer: montant et infos */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            {opportunite.montantHT ? (
              <span className="flex items-center gap-1 text-sm font-semibold text-green-600 dark:text-green-400">
                <EuroIcon />
                {formatCurrency(opportunite.montantHT)}
              </span>
            ) : (
              <span className="text-xs text-gray-400">-</span>
            )}

            <div className="flex items-center gap-2">
              {/* Commercial assigné */}
              {opportunite.user && (
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {opportunite.user.prenom?.charAt(0)}{opportunite.user.nom?.charAt(0)}
                </span>
              )}

              {/* Compteur activités */}
              {opportunite._count?.activites && opportunite._count.activites > 0 && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="6" cy="6" r="5" />
                    <path d="M6 3v3l2 1" strokeLinecap="round" />
                  </svg>
                  {opportunite._count.activites}
                </span>
              )}

              {/* Lien vers la page détail */}
              <Link
                href={`/crm/${opportunite.id}`}
                onClick={(e) => e.stopPropagation()}
                className="p-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                title="Voir les détails"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Composant Colonne avec zone droppable
function Column({
  stage,
  opportunites,
  stats,
  onCardClick,
  onAddClick,
}: {
  stage: PipelineStage;
  opportunites: Opportunite[];
  stats: { count: number; montant: number };
  onCardClick: (opp: Opportunite) => void;
  onAddClick: () => void;
}) {
  // Zone droppable pour la colonne entière
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div className="flex-shrink-0 w-80">
      {/* Header */}
      <div className={`${stage.bgColor} rounded-t-xl p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${stage.color.replace('text-', 'bg-')}`} />
            <h3 className={`font-semibold text-sm ${stage.color}`}>
              {stage.label}
            </h3>
            <span className="px-2 py-0.5 text-xs font-medium bg-white/60 dark:bg-black/20 rounded-full">
              {stats.count}
            </span>
          </div>
          <button
            onClick={onAddClick}
            className="p-1.5 hover:bg-white/50 dark:hover:bg-black/20 rounded-lg transition-colors"
            title="Ajouter une opportunité"
          >
            <PlusIcon />
          </button>
        </div>
        {stats.montant > 0 && (
          <p className="text-sm font-medium mt-1 opacity-80">
            {formatCurrency(stats.montant)}
          </p>
        )}
      </div>

      {/* Liste des cartes - Zone droppable */}
      <div
        ref={setNodeRef}
        className={`bg-gray-50/50 dark:bg-gray-900/50 rounded-b-xl p-2 min-h-[200px] max-h-[calc(100vh-380px)] overflow-y-auto transition-colors ${
          isOver ? "bg-brand-50 dark:bg-brand-900/20 ring-2 ring-brand-500 ring-inset" : ""
        }`}
      >
        <SortableContext
          items={opportunites.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {opportunites.map((opp) => (
              <OpportuniteCard
                key={opp.id}
                opportunite={opp}
                onClick={() => onCardClick(opp)}
              />
            ))}
          </div>
        </SortableContext>

        {opportunites.length === 0 && (
          <div className={`text-center py-8 text-sm ${isOver ? "text-brand-600" : "text-gray-400"}`}>
            <p>{isOver ? "Déposer ici" : "Aucune opportunité"}</p>
            {!isOver && (
              <button
                onClick={onAddClick}
                className="mt-2 text-brand-500 hover:text-brand-600 text-xs font-medium"
              >
                + Ajouter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Modal création/édition rapide
function OpportuniteModal({
  opportunite,
  stage,
  formations,
  onClose,
  onSave,
  onDelete,
  isLoading,
}: {
  opportunite: Opportunite | null;
  stage: string;
  formations: Formation[];
  onClose: () => void;
  onSave: (data: OpportuniteFormData) => void;
  onDelete?: () => void;
  isLoading: boolean;
}) {
  const [clientType, setClientType] = useState<"ENTREPRISE" | "INDEPENDANT" | "PARTICULIER">(
    opportunite?.entreprise ? "ENTREPRISE" : "PARTICULIER"
  );
  const [formData, setFormData] = useState({
    titre: opportunite?.titre || "",
    description: opportunite?.description || "",
    montantHT: opportunite?.montantHT?.toString() || "",
    probabilite: opportunite?.probabilite || 50,
    source: opportunite?.source || "AUTRE",
    entrepriseNom: opportunite?.entreprise?.raisonSociale || "",
    formationId: opportunite?.formation?.id || "",
    contactNom: opportunite?.contactNom || "",
    contactPrenom: "",
    contactEmail: opportunite?.contactEmail || "",
    contactTelephone: opportunite?.contactTelephone || "",
    contactFonction: opportunite?.contactFonction || "",
    dateRelance: opportunite?.dateRelance?.split("T")[0] || "",
    dateCloturePrevu: opportunite?.dateCloturePrevu?.split("T")[0] || "",
    notes: opportunite?.notes || "",
    raisonPerte: opportunite?.raisonPerte || "",
  });

  // Libellé du montant selon le type de client
  const getMontantLabel = () => {
    if (clientType === "PARTICULIER") return "Montant TTC";
    return "Montant HT";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      titre: formData.titre,
      description: formData.description || null,
      montantHT: parseFloat(formData.montantHT) || 0,
      probabilite: formData.probabilite,
      source: formData.source,
      stage: opportunite?.stage || stage,
      entrepriseId: null, // Plus de liaison BDD
      formationId: formData.formationId || null,
      contactNom: formData.contactNom || null,
      contactEmail: formData.contactEmail || null,
      contactTelephone: formData.contactTelephone || null,
      contactFonction: formData.contactFonction || null,
      dateRelance: formData.dateRelance || null,
      dateCloturePrevu: formData.dateCloturePrevu || null,
      notes: formData.notes || null,
      raisonPerte: formData.raisonPerte || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {opportunite ? "Modifier l'opportunité" : "Nouvelle opportunité"}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {opportunite ? "Modifiez les informations de l'opportunité" : "Créez une nouvelle opportunité commerciale"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Nom de l'opportunité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nom de l'opportunité *
            </label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="Ex: Formation Excel - Société ABC"
            />
          </div>

          {/* Type de client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Type de client
            </label>
            <div className="flex gap-3">
              {CLIENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setClientType(type.id as "ENTREPRISE" | "INDEPENDANT" | "PARTICULIER")}
                  className={`flex-1 py-2.5 px-4 rounded-xl border-2 font-medium text-sm transition-all ${
                    clientType === type.id
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                      : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                  }`}
                >
                  {type.id === "ENTREPRISE" ? "🏢" : type.id === "INDEPENDANT" ? "💼" : "👤"} {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nom entreprise (champ libre) - affiché uniquement pour Entreprise/Indépendant */}
          {(clientType === "ENTREPRISE" || clientType === "INDEPENDANT") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {clientType === "ENTREPRISE" ? "Nom de l'entreprise" : "Nom de l'activité"}
              </label>
              <input
                type="text"
                value={formData.entrepriseNom}
                onChange={(e) => setFormData({ ...formData, entrepriseNom: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder={clientType === "ENTREPRISE" ? "Nom de l'entreprise" : "Nom de l'activité / SIRET"}
              />
            </div>
          )}

          {/* Nom et Prénom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nom
              </label>
              <input
                type="text"
                value={formData.contactNom}
                onChange={(e) => setFormData({ ...formData, contactNom: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Nom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Prénom
              </label>
              <input
                type="text"
                value={formData.contactPrenom}
                onChange={(e) => setFormData({ ...formData, contactPrenom: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Prénom"
              />
            </div>
          </div>

          {/* Email et Téléphone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="email@exemple.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.contactTelephone}
                onChange={(e) => setFormData({ ...formData, contactTelephone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="06 12 34 56 78"
              />
            </div>
          </div>

          {/* Formation associée */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Formation associée
            </label>
            <select
              value={formData.formationId}
              onChange={(e) => setFormData({ ...formData, formationId: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">Sélectionner une formation...</option>
              {formations.map((f) => (
                <option key={f.id} value={f.id}>{f.titre}</option>
              ))}
            </select>
          </div>

          {/* Montant (HT ou TTC selon type) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {getMontantLabel()}
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.montantHT}
                onChange={(e) => setFormData({ ...formData, montantHT: e.target.value })}
                className="w-full px-4 py-2.5 pr-8 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {clientType === "PARTICULIER" ? "Montant toutes taxes comprises" : "Montant hors taxes"}
            </p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Date de relance
              </label>
              <input
                type="date"
                value={formData.dateRelance}
                onChange={(e) => setFormData({ ...formData, dateRelance: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Date de clôture prévue
              </label>
              <input
                type="date"
                value={formData.dateCloturePrevu}
                onChange={(e) => setFormData({ ...formData, dateCloturePrevu: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Source de l'opportunité
            </label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              {SOURCES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              placeholder="Notes internes sur l'opportunité..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-5 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          {opportunite && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              <TrashIcon />
              Supprimer
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !formData.titre}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-50 font-medium"
            >
              {isLoading && <LoaderIcon className="h-4 w-4" />}
              {opportunite ? "Enregistrer" : "Créer l'opportunité"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Modal de configuration du pipeline
function ConfigurationModal({
  stages,
  onClose,
  onSave,
}: {
  stages: PipelineStage[];
  onClose: () => void;
  onSave: (stages: PipelineStage[]) => void;
}) {
  const [editedStages, setEditedStages] = useState<PipelineStage[]>([...stages]);

  const handleAddStage = () => {
    const newStage: PipelineStage = {
      id: `STAGE_${Date.now()}`,
      label: "Nouvelle étape",
      color: "text-gray-600",
      bgColor: "bg-gray-100 dark:bg-gray-700",
      ordre: editedStages.length,
    };
    setEditedStages([...editedStages, newStage]);
  };

  const handleUpdateStage = (index: number, label: string) => {
    const updated = [...editedStages];
    updated[index] = { ...updated[index], label };
    setEditedStages(updated);
  };

  const handleDeleteStage = (index: number) => {
    if (editedStages.length <= 2) return; // Minimum 2 étapes
    const updated = editedStages.filter((_, i) => i !== index);
    setEditedStages(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full"
      >
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configuration du pipeline
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Personnalisez les étapes de votre tunnel de vente
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {editedStages.map((stage, index) => (
            <div
              key={stage.id}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
            >
              <DragIcon />
              <input
                type="text"
                value={stage.label}
                onChange={(e) => handleUpdateStage(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <button
                onClick={() => handleDeleteStage(index)}
                disabled={editedStages.length <= 2}
                className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg"
              >
                <TrashIcon />
              </button>
            </div>
          ))}

          <button
            onClick={handleAddStage}
            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 hover:text-brand-500 hover:border-brand-500 transition-colors text-sm font-medium"
          >
            + Ajouter une étape
          </button>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(editedStages)}
            className="px-5 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600"
          >
            Enregistrer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Page principale CRM Pipeline
export default function CRMPipelinePage() {
  const [opportunites, setOpportunites] = useState<Opportunite[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>(DEFAULT_STAGES);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Données pour les modaux
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);

  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState<string[]>([]);
  const [filterSource, setFilterSource] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Modaux
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    opportunite: Opportunite | null;
    stage: string;
  }>({
    isOpen: false,
    opportunite: null,
    stage: "A_TRAITER",
  });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [oppRes, entRes, formRes] = await Promise.all([
        fetch("/api/crm/opportunites"),
        fetch("/api/donnees/entreprises"),
        fetch("/api/formations"),
      ]);

      if (oppRes.ok) {
        const data = await oppRes.json();
        setOpportunites(data.opportunites || []);
        setStats(data.stats || null);
      }

      if (entRes.ok) {
        const data = await entRes.json();
        setEntreprises(data.entreprises || []);
      }

      if (formRes.ok) {
        const data = await formRes.json();
        setFormations(data.formations || []);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrage des opportunités
  const filteredOpportunites = useMemo(() => {
    return opportunites.filter((opp) => {
      // Recherche textuelle
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchTitle = opp.titre.toLowerCase().includes(query);
        const matchEntreprise = opp.entreprise?.raisonSociale.toLowerCase().includes(query);
        const matchContact = opp.contactNom?.toLowerCase().includes(query);
        if (!matchTitle && !matchEntreprise && !matchContact) return false;
      }

      // Filtre par stage
      if (filterStage.length > 0 && !filterStage.includes(opp.stage)) {
        return false;
      }

      // Filtre par source
      if (filterSource && opp.source !== filterSource) {
        return false;
      }

      return true;
    });
  }, [opportunites, searchQuery, filterStage, filterSource]);

  // Grouper par stage
  const opportunitesByStage = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage.id] = filteredOpportunites
        .filter((o) => o.stage === stage.id)
        .sort((a, b) => a.ordre - b.ordre);
      return acc;
    }, {} as Record<string, Opportunite[]>);
  }, [filteredOpportunites, stages]);

  // Stats par stage
  const statsByStage = useMemo(() => {
    return stages.reduce((acc, stage) => {
      const stageOpps = opportunitesByStage[stage.id] || [];
      acc[stage.id] = {
        count: stageOpps.length,
        montant: stageOpps.reduce((sum, o) => sum + (o.montantHT || 0), 0),
      };
      return acc;
    }, {} as Record<string, { count: number; montant: number }>);
  }, [opportunitesByStage, stages]);

  // Handlers drag & drop
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeOpp = opportunites.find((o) => o.id === activeId);
    const overOpp = opportunites.find((o) => o.id === overId);

    if (!activeOpp) return;

    if (overOpp && activeOpp.stage !== overOpp.stage) {
      setOpportunites((prev) =>
        prev.map((o) =>
          o.id === activeId ? { ...o, stage: overOpp.stage } : o
        )
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeOpp = opportunites.find((o) => o.id === activeId);
    if (!activeOpp) return;

    let newStage = activeOpp.stage;
    const overOpp = opportunites.find((o) => o.id === overId);

    if (overOpp) {
      newStage = overOpp.stage;
    } else {
      const isStageId = stages.some((s) => s.id === overId);
      if (isStageId) {
        newStage = overId;
      }
    }

    const stageOpps = opportunites
      .filter((o) => o.stage === newStage)
      .sort((a, b) => a.ordre - b.ordre);

    const newIndex = stageOpps.findIndex((o) => o.id === overId);

    if (activeOpp.stage !== newStage || newIndex >= 0) {
      try {
        await fetch("/api/crm/opportunites", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: activeId,
            stage: newStage,
            ordre: newIndex >= 0 ? newIndex : stageOpps.length,
          }),
        });
        loadData();
      } catch (error) {
        console.error("Erreur mise à jour:", error);
      }
    }
  };

  // Créer/modifier une opportunité
  const handleSave = async (data: OpportuniteFormData) => {
    setIsSaving(true);
    try {
      const method = modalState.opportunite ? "PATCH" : "POST";
      const body = modalState.opportunite
        ? { id: modalState.opportunite.id, ...data }
        : data;

      const res = await fetch("/api/crm/opportunites", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Erreur");

      setModalState({ isOpen: false, opportunite: null, stage: "A_TRAITER" });
      loadData();
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Supprimer une opportunité
  const handleDelete = async () => {
    if (!modalState.opportunite) return;
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette opportunité ?")) return;

    try {
      const res = await fetch(`/api/crm/opportunites?id=${modalState.opportunite.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Erreur");

      setModalState({ isOpen: false, opportunite: null, stage: "A_TRAITER" });
      loadData();
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  // Sauvegarder la configuration du pipeline
  const handleSaveConfig = (newStages: PipelineStage[]) => {
    setStages(newStages);
    setShowConfigModal(false);
    // TODO: Sauvegarder en base de données
  };

  const activeOpp = activeId ? opportunites.find((o) => o.id === activeId) : null;
  const activeFiltersCount = (filterStage.length > 0 ? 1 : 0) + (filterSource ? 1 : 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoaderIcon className="h-8 w-8 text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Tunnel de vente
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Suivez vos opportunités commerciales grâce à un pipeline en glisser-déposer.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.total || 0}
              </p>
              <p className="text-xs text-gray-500">Opportunités</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats?.montantTotal || 0)}
              </p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <Link
              href="/crm/dashboard"
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </Link>
            <button
              onClick={() => setModalState({ isOpen: true, opportunite: null, stage: "A_TRAITER" })}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 font-medium shadow-lg shadow-brand-500/25"
            >
              <PlusIcon />
              Nouvelle opportunité
            </button>
          </div>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Recherche */}
        <div className="relative flex-1 max-w-md">
          <SearchIcon />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Bouton filtres */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl font-medium transition-colors ${
            activeFiltersCount > 0
              ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
              : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          <FilterIcon />
          Filtres
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-brand-500 text-white rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Configuration */}
        <button
          onClick={() => setShowConfigModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <SettingsIcon />
          Configuration
        </button>
      </div>

      {/* Panneau de filtres déroulant */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-4">
              <div className="flex flex-wrap gap-4">
                {/* Filtre par stage */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Étape du pipeline
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {stages.map((stage) => (
                      <button
                        key={stage.id}
                        onClick={() => {
                          setFilterStage((prev) =>
                            prev.includes(stage.id)
                              ? prev.filter((s) => s !== stage.id)
                              : [...prev, stage.id]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          filterStage.includes(stage.id)
                            ? `${stage.bgColor} ${stage.color}`
                            : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600"
                        }`}
                      >
                        {stage.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtre par source */}
                <div className="w-48">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Source
                  </label>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Toutes</option>
                    {SOURCES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reset filtres */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => {
                    setFilterStage([]);
                    setFilterSource("");
                    setSearchQuery("");
                  }}
                  className="text-sm text-brand-500 hover:text-brand-600 font-medium"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pipeline Kanban */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 min-w-max">
            {stages.map((stage) => (
              <Column
                key={stage.id}
                stage={stage}
                opportunites={opportunitesByStage[stage.id] || []}
                stats={statsByStage[stage.id] || { count: 0, montant: 0 }}
                onCardClick={(opp) =>
                  setModalState({ isOpen: true, opportunite: opp, stage: opp.stage })
                }
                onAddClick={() =>
                  setModalState({ isOpen: true, opportunite: null, stage: stage.id })
                }
              />
            ))}
          </div>

          <DragOverlay>
            {activeOpp && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-brand-500 p-3 shadow-xl w-80 rotate-3">
                <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                  {activeOpp.titre}
                </h4>
                {activeOpp.entreprise && (
                  <p className="text-xs text-gray-500 mt-1">
                    {activeOpp.entreprise.raisonSociale}
                  </p>
                )}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modal création/édition */}
      <AnimatePresence>
        {modalState.isOpen && (
          <OpportuniteModal
            opportunite={modalState.opportunite}
            stage={modalState.stage}
            formations={formations}
            onClose={() => setModalState({ isOpen: false, opportunite: null, stage: "A_TRAITER" })}
            onSave={handleSave}
            onDelete={modalState.opportunite ? handleDelete : undefined}
            isLoading={isSaving}
          />
        )}
      </AnimatePresence>

      {/* Modal configuration */}
      <AnimatePresence>
        {showConfigModal && (
          <ConfigurationModal
            stages={stages}
            onClose={() => setShowConfigModal(false)}
            onSave={handleSaveConfig}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
