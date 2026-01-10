"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAutomate } from "@/context/AutomateContext";
import KanbanBoard from "@/components/formations/KanbanBoard";
import { FormationBadges } from "@/components/catalogue/FormationBadges";

// Icon Loader
const LoaderIcon = () => (
  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// Icon Filter
const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.25 4.5H15.75M4.5 9H13.5M6.75 13.5H11.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon Sort
const SortIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6L6 3M6 3L9 6M6 3V15M15 12L12 15M12 15L9 12M12 15V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon Archive
const ArchiveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.25 6V14.25C2.25 15.0784 2.92157 15.75 3.75 15.75H14.25C15.0784 15.75 15.75 15.0784 15.75 14.25V6M7.5 9H10.5M1.5 2.25H16.5V6H1.5V2.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon Chevron Down
const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon Trash
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 4H14M5.333 4V2.667C5.333 2.298 5.632 2 6 2H10C10.368 2 10.667 2.298 10.667 2.667V4M6.667 7.333V11.333M9.333 7.333V11.333M12.667 4V13.333C12.667 13.702 12.368 14 12 14H4C3.632 14 3.333 13.702 3.333 13.333V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon More (3 dots)
const MoreIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="3" r="1.5" fill="currentColor"/>
    <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
    <circle cx="8" cy="13" r="1.5" fill="currentColor"/>
  </svg>
);

// Icon Warning
const WarningIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 9V13M12 17H12.01M4.93 19H19.07C20.14 19 20.86 17.87 20.32 16.95L13.25 4.67C12.71 3.75 11.29 3.75 10.75 4.67L3.68 16.95C3.14 17.87 3.86 19 4.93 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon Plus
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon Search
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M9.16667 3.33333C5.94501 3.33333 3.33333 5.94501 3.33333 9.16667C3.33333 12.3883 5.94501 15 9.16667 15C12.3883 15 15 12.3883 15 9.16667C15 5.94501 12.3883 3.33333 9.16667 3.33333ZM1.66667 9.16667C1.66667 5.02453 5.02453 1.66667 9.16667 1.66667C13.3088 1.66667 16.6667 5.02453 16.6667 9.16667C16.6667 10.9378 16.0528 12.5654 15.0274 13.8565L18.0893 16.9107C18.4147 17.2362 18.4147 17.7638 18.0893 18.0893C17.7638 18.4147 17.2362 18.4147 16.9107 18.0893L13.8565 15.0274C12.5654 16.0528 10.9378 16.6667 9.16667 16.6667C5.02453 16.6667 1.66667 13.3088 1.66667 9.16667Z" fill="currentColor"/>
  </svg>
);

// Icon Check
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon Edit (Stylo)
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.5 1.75L12.25 3.5M1.16667 12.8333L1.75 10.5L9.91667 2.33333L11.6667 4.08333L3.5 12.25L1.16667 12.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon Close
const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.5 3.5L10.5 10.5M3.5 10.5L10.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon Grid
const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="2" y="11" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11" y="11" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

// Icon Kanban
const KanbanIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="7" y="2" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="12" y="2" width="4" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

type ViewMode = "grid" | "kanban";
type SortField = "createdAt" | "titre" | "status";
type SortOrder = "asc" | "desc";
type StatusFilter = "all" | "brouillon" | "en_cours" | "complete";

export default function MesFormationsPage() {
  const { formations, updateFormation, deleteFormation, isLoadingFormations, refreshFormations } = useAutomate();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Filtres et tri
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showArchived, setShowArchived] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Modal de confirmation de suppression
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; formationId: string | null; formationTitle: string }>({
    isOpen: false,
    formationId: null,
    formationTitle: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Menu d'actions ouvert
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Rafraîchir les formations au montage
  useEffect(() => {
    refreshFormations();
  }, [refreshFormations]);

  // Fermer le menu au clic extérieur
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMenuId]);

  const handleStartEdit = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditedTitle(currentTitle);
  };

  const handleSaveTitle = async (id: string) => {
    if (editedTitle.trim()) {
      setIsSaving(true);
      await updateFormation(id, { titre: editedTitle.trim() });
      setIsSaving(false);
    }
    setEditingId(null);
    setEditedTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      handleSaveTitle(id);
    } else if (e.key === "Escape") {
      setEditingId(null);
      setEditedTitle("");
    }
  };

  // Archiver/Désarchiver une formation
  const handleArchive = async (id: string, currentlyArchived: boolean) => {
    try {
      await fetch(`/api/formations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !currentlyArchived }),
      });
      refreshFormations();
    } catch (error) {
      console.error("Erreur lors de l'archivage:", error);
    }
    setOpenMenuId(null);
  };

  // Publier/Dépublier une formation dans le LMS
  const handlePublish = async (id: string) => {
    try {
      await fetch(`/api/formations/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      refreshFormations();
    } catch (error) {
      console.error("Erreur lors de la publication:", error);
    }
    setOpenMenuId(null);
  };

  // Publier/Dépublier une formation dans le catalogue public
  const handlePublishToCatalogue = async (id: string, currentlyPublished: boolean) => {
    try {
      await fetch(`/api/formations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estPublieCatalogue: !currentlyPublished }),
      });
      refreshFormations();
    } catch (error) {
      console.error("Erreur lors de la publication au catalogue:", error);
    }
    setOpenMenuId(null);
  };

  // Qualiopi IND 3 - Marquer/Démarquer comme formation certifiante
  const handleToggleCertifiante = async (id: string, currentlyCertifiante: boolean) => {
    try {
      await fetch(`/api/formations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCertifiante: !currentlyCertifiante }),
      });
      refreshFormations();
    } catch (error) {
      console.error("Erreur lors du changement de certification:", error);
    }
    setOpenMenuId(null);
  };

  // Ouvrir la modal de confirmation de suppression
  const openDeleteModal = (id: string, title: string) => {
    setDeleteModal({ isOpen: true, formationId: id, formationTitle: title });
    setOpenMenuId(null);
  };

  // Confirmer la suppression
  const handleConfirmDelete = async () => {
    if (!deleteModal.formationId) return;
    setIsDeleting(true);
    try {
      await deleteFormation(deleteModal.formationId);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, formationId: null, formationTitle: "" });
    }
  };

  // Fonction de filtrage et tri
  const filteredFormations = useCallback(() => {
    let result = [...formations];

    // Filtre par recherche texte
    if (searchQuery) {
      result = result.filter((formation) =>
        formation.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formation.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      result = result.filter((formation) => formation.status === statusFilter.toLowerCase());
    }

    // Filtre archivés : par défaut on affiche les non-archivées
    // Si showArchived est activé, on affiche UNIQUEMENT les archivées
    if (showArchived) {
      result = result.filter((formation) => formation.isArchived === true);
    } else {
      result = result.filter((formation) => formation.isArchived !== true);
    }

    // Tri
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "titre") {
        comparison = a.titre.localeCompare(b.titre);
      } else if (sortField === "status") {
        comparison = a.status.localeCompare(b.status);
      } else {
        // createdAt - on utilise dateCreation (string format)
        comparison = a.dateCreation.localeCompare(b.dateCreation);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [formations, searchQuery, statusFilter, sortField, sortOrder, showArchived])();

  // Labels pour les statuts
  const statusLabels: Record<StatusFilter, string> = {
    all: "Tous les statuts",
    brouillon: "Brouillon",
    en_cours: "En cours",
    complete: "Terminée",
  };

  // Labels pour le tri
  const sortLabels: Record<SortField, string> = {
    createdAt: "Date de création",
    titre: "Titre",
    status: "Statut",
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Mes formations
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Retrouvez ici toutes les formations que vous avez créées depuis vos débuts sur la plateforme.
            </p>
          </div>
          <Link
            href="/import"
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm hover:shadow-md whitespace-nowrap"
          >
            <PlusIcon />
            Créer une formation
          </Link>
        </div>

        {/* Barre de recherche + Filtres + Toggle vue */}
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-md flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Rechercher une formation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Bouton Filtres */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all ${
                  showFilters || statusFilter !== "all"
                    ? "bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-500/10 dark:border-brand-500/30 dark:text-brand-400"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <FilterIcon />
                <span className="hidden sm:inline">Filtres</span>
                {statusFilter !== "all" && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-brand-500 text-white rounded-full">1</span>
                )}
              </button>

              {/* Toggle Vue Grille / Kanban */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <GridIcon />
                  <span className="hidden sm:inline">Grille</span>
                </button>
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                    viewMode === "kanban"
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <KanbanIcon />
                  <span className="hidden sm:inline">Pipeline</span>
                </button>
              </div>
            </div>
          </div>

          {/* Panel de filtres avancés */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              {/* Filtre par statut */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Statut :</label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-700 dark:text-white cursor-pointer"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDownIcon />
                  </span>
                </div>
              </div>

              {/* Tri */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Trier par :</label>
                <div className="relative">
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-700 dark:text-white cursor-pointer"
                  >
                    {Object.entries(sortLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDownIcon />
                  </span>
                </div>
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600"
                  title={sortOrder === "asc" ? "Croissant" : "Décroissant"}
                >
                  <SortIcon />
                </button>
              </div>

              {/* Formations archivées */}
              <label className="flex items-center gap-2 cursor-pointer ml-auto">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <ArchiveIcon />
                  Formations archivées
                </span>
              </label>

              {/* Reset filtres */}
              {(statusFilter !== "all" || sortField !== "createdAt" || sortOrder !== "desc") && (
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setSortField("createdAt");
                    setSortOrder("desc");
                  }}
                  className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          )}

          {/* Indicateur de résultats */}
          {(searchQuery || statusFilter !== "all") && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredFormations.length} formation{filteredFormations.length > 1 ? "s" : ""} trouvée{filteredFormations.length > 1 ? "s" : ""}
              {searchQuery && <span> pour &quot;{searchQuery}&quot;</span>}
              {statusFilter !== "all" && <span> avec le statut &quot;{statusLabels[statusFilter]}&quot;</span>}
            </p>
          )}
        </div>
      </div>

      {/* État de chargement */}
      {isLoadingFormations && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <LoaderIcon />
            <span className="text-gray-500 dark:text-gray-400 text-sm">Chargement des formations...</span>
          </div>
        </div>
      )}

      {/* Vue Kanban */}
      {!isLoadingFormations && viewMode === "kanban" && filteredFormations.length > 0 && (
        <KanbanBoard
          formations={filteredFormations}
          onEditTitle={handleStartEdit}
        />
      )}

      {/* Grille des formations - 3 colonnes max */}
      {!isLoadingFormations && viewMode === "grid" && filteredFormations.length > 0 && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFormations.map((formation) => (
          <div
            key={formation.id}
            className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow group relative"
          >
            {/* Image */}
            <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
              <Image
                src={formation.image}
                alt={formation.titre}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Badge status */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {/* Badge Catalogue */}
                {formation.estPublieCatalogue && (
                  <span className="px-2.5 py-1 text-xs font-medium bg-blue-600 text-white rounded-full shadow-sm flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 3C2 2.44772 2.44772 2 3 2H6L7.5 4H13C13.5523 4 14 4.44772 14 5V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Catalogue
                  </span>
                )}
                {formation.isPublished ? (
                  <span className="px-2.5 py-1 text-xs font-medium bg-green-500 text-white rounded-full shadow-sm flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 8L6 12L14 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Publiée
                  </span>
                ) : (
                  <>
                    {formation.status === "en_cours" && (
                      <span className="px-2.5 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full shadow-sm">
                        En cours
                      </span>
                    )}
                    {formation.status === "brouillon" && (
                      <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full shadow-sm">
                        Brouillon
                      </span>
                    )}
                    {formation.status === "complete" && (
                      <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full shadow-sm">
                        Terminée
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Menu d'actions - bouton */}
              <div className="absolute top-3 left-3 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === formation.id ? null : formation.id);
                  }}
                  className="p-2 bg-white/90 hover:bg-white text-gray-600 hover:text-gray-900 rounded-lg shadow-sm transition-all opacity-0 group-hover:opacity-100"
                >
                  <MoreIcon />
                </button>
              </div>
            </div>

            {/* Dropdown menu - positionné au niveau de la carte, pas dans l'image */}
            {openMenuId === formation.id && (
              <div className="absolute top-12 left-3 w-52 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[100] dark:bg-gray-800 dark:border-gray-700" style={{ maxHeight: "300px", overflowY: "auto" }}>
                      {/* Créer une session */}
                      <Link
                        href={`/sessions?create=true&formationId=${formation.id}`}
                        onClick={() => setOpenMenuId(null)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        Créer une session
                      </Link>
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                      <button
                        onClick={() => handlePublish(formation.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 1V11M8 1L4 5M8 1L12 5M2 14H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {formation.isPublished ? "Dépublier du LMS" : "Publier dans le LMS"}
                      </button>
                      <button
                        onClick={() => handlePublishToCatalogue(formation.id, formation.estPublieCatalogue || false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2 3C2 2.44772 2.44772 2 3 2H6L7.5 4H13C13.5523 4 14 4.44772 14 5V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 7V11M6 9H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {formation.estPublieCatalogue ? "Retirer du catalogue" : "Publier au catalogue"}
                      </button>
                      {/* Qualiopi IND 3 - Marquer comme certifiante */}
                      <button
                        onClick={() => handleToggleCertifiante(formation.id, formation.isCertifiante || false)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${
                          formation.isCertifiante
                            ? "text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="8" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M5 8L3.5 14L8 12L12.5 14L11 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {formation.isCertifiante ? "Retirer certification" : "Marquer certifiante"}
                      </button>
                      <button
                        onClick={() => handleArchive(formation.id, formation.isArchived || false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <ArchiveIcon />
                        {formation.isArchived ? "Désarchiver" : "Archiver"}
                      </button>
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                      <button
                        onClick={() => openDeleteModal(formation.id, formation.titre)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        <TrashIcon />
                        Supprimer
                      </button>
                    </div>
                  )}

            {/* Contenu */}
            <div className="p-4">
              {/* Badges */}
              <div className="mb-3">
                <FormationBadges
                  formation={{
                    modalites: formation.modalites || [],
                    dureeHeures: formation.dureeHeures || 0,
                    dureeJours: formation.dureeJours,
                    isCertifiante: formation.isCertifiante || false,
                    numeroFicheRS: formation.numeroFicheRS,
                    estEligibleCPF: formation.estEligibleCPF,
                    accessibiliteHandicap: formation.accessibiliteHandicap,
                    indicateurs: formation.indicateurs,
                    nombreModules: formation.nombreModules || formation.modules?.length || 0,
                  }}
                  size="sm"
                />
              </div>

              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Nom de la formation
              </label>
              <div className="mb-4">
                {editingId === formation.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, formation.id)}
                      autoFocus
                      className="flex-1 px-3 py-2.5 text-sm border border-brand-300 rounded-lg bg-white text-gray-800 dark:border-brand-500 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                    <button
                      onClick={() => handleSaveTitle(formation.id)}
                      className="px-3 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                      title="Enregistrer"
                    >
                      <CheckIcon />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditedTitle("");
                      }}
                      className="px-3 py-2 text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 transition-colors"
                      title="Annuler"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={formation.titre}
                      readOnly
                      className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white cursor-default"
                    />
                    <button
                      onClick={() => handleStartEdit(formation.id, formation.titre)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-md transition-colors dark:hover:bg-brand-500/10"
                      title="Modifier le titre"
                    >
                      <EditIcon />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/create?id=${formation.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:scale-[0.98] transition-all dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <EditIcon />
                  Éditer
                </Link>
                <Link
                  href={`/sessions?create=true&formationId=${formation.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm hover:shadow-md"
                >
                  <PlusIcon />
                  Session
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Message si aucune formation */}
      {!isLoadingFormations && filteredFormations.length === 0 && (
        <div className="text-center py-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-white/[0.03] max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-brand-500">
                <path d="M12 6V12M12 12V18M12 12H18M12 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            {searchQuery ? (
              <p className="text-gray-500 dark:text-gray-400">
                Aucune formation trouvée pour &quot;{searchQuery}&quot;
              </p>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Aucune formation
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Créez votre première formation pour commencer
                </p>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-all"
                >
                  <PlusIcon />
                  Créer une formation
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeleteModal({ isOpen: false, formationId: null, formationTitle: "" })}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Icône d'avertissement */}
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
              <WarningIcon />
            </div>

            {/* Titre */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
              Supprimer cette formation ?
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
              Vous êtes sur le point de supprimer définitivement la formation
              <span className="font-medium text-gray-900 dark:text-white"> &quot;{deleteModal.formationTitle}&quot;</span>.
              Cette action est irréversible et supprimera également tous les documents, slides et fichiers associés.
            </p>

            {/* Boutons */}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, formationId: null, formationTitle: "" })}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <LoaderIcon />
                    Suppression...
                  </>
                ) : (
                  <>
                    <TrashIcon />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
