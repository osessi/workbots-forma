"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAutomate } from "@/context/AutomateContext";

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

export default function MesFormationsPage() {
  const { formations, updateFormation } = useAutomate();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");

  const handleStartEdit = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditedTitle(currentTitle);
  };

  const handleSaveTitle = (id: string) => {
    if (editedTitle.trim()) {
      updateFormation(id, { titre: editedTitle.trim() });
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

        {/* Barre de recherche */}
        <div className="mt-6">
          <div className="relative max-w-md">
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
        </div>
      </div>

      {/* Grille des formations - 3 colonnes max */}
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

      {/* Message si aucune formation */}
      {filteredFormations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Aucune formation trouvée pour "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  );
}
