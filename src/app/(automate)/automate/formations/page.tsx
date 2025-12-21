"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAutomate } from "@/context/AutomateContext";
import KanbanBoard from "@/components/formations/KanbanBoard";

// Icon Loader
const LoaderIcon = () => (
  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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

export default function MesFormationsPage() {
  const { formations, updateFormation, isLoadingFormations, refreshFormations } = useAutomate();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Rafraîchir les formations au montage
  useEffect(() => {
    refreshFormations();
  }, [refreshFormations]);

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

  const filteredFormations = formations.filter((formation) =>
    formation.titre.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            href="/automate/create"
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm hover:shadow-md whitespace-nowrap"
          >
            <PlusIcon />
            Créer une formation
          </Link>
        </div>

        {/* Barre de recherche + Toggle vue */}
        <div className="mt-6 flex items-center justify-between gap-4">
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
            className="rounded-xl border border-gray-200 bg-white overflow-hidden dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow group"
          >
            {/* Image */}
            <div className="relative aspect-video w-full overflow-hidden">
              <Image
                src={formation.image}
                alt={formation.titre}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Badge status */}
              {formation.status === "en_cours" && (
                <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full shadow-sm">
                  En cours
                </span>
              )}
              {formation.status === "brouillon" && (
                <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full shadow-sm">
                  Brouillon
                </span>
              )}
            </div>

            {/* Contenu */}
            <div className="p-4">
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
              <Link
                href={`/automate/create?id=${formation.id}`}
                className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm hover:shadow-md"
              >
                Éditer
              </Link>
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
                  href="/automate/create"
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
    </div>
  );
}
