"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Formation } from "@/context/AutomateContext";

// Icons
const DocumentIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.16667 1.16667H3.5C3.19058 1.16667 2.89383 1.28958 2.67504 1.50838C2.45625 1.72717 2.33333 2.02391 2.33333 2.33333V11.6667C2.33333 11.9761 2.45625 12.2728 2.67504 12.4916C2.89383 12.7104 3.19058 12.8333 3.5 12.8333H10.5C10.8094 12.8333 11.1062 12.7104 11.325 12.4916C11.5437 12.2728 11.6667 11.9761 11.6667 11.6667V4.66667L8.16667 1.16667Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.16667 1.16667V4.66667H11.6667" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.33333 8H12.6667M12.6667 8L8 3.33333M12.6667 8L8 12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface KanbanBoardProps {
  formations: Formation[];
  onEditTitle: (id: string, title: string) => void;
}

// Configuration des colonnes Kanban - 3 colonnes simplifiées
const KANBAN_COLUMNS = [
  {
    id: "en_cours",
    label: "En cours",
    color: "bg-yellow-50 dark:bg-yellow-500/10",
    headerColor: "bg-yellow-100 dark:bg-yellow-500/20",
    textColor: "text-yellow-700 dark:text-yellow-400",
    borderColor: "border-yellow-300 dark:border-yellow-500/30",
    badgeColor: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
  },
  {
    id: "complete",
    label: "Terminée",
    color: "bg-green-50 dark:bg-green-500/10",
    headerColor: "bg-green-100 dark:bg-green-500/20",
    textColor: "text-green-700 dark:text-green-400",
    borderColor: "border-green-300 dark:border-green-500/30",
    badgeColor: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  },
  {
    id: "published",
    label: "Publiée sur le catalogue",
    color: "bg-brand-50 dark:bg-brand-500/10",
    headerColor: "bg-brand-100 dark:bg-brand-500/20",
    textColor: "text-brand-700 dark:text-brand-400",
    borderColor: "border-brand-300 dark:border-brand-500/30",
    badgeColor: "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400",
  },
];

// Mapper le status de la formation vers la colonne Kanban
// Logique simplifiée : En cours (brouillon/en_cours) | Terminée (complete non publiée) | Publiée sur le catalogue
function mapStatusToColumn(status: string, estPublieCatalogue: boolean = false): string {
  // Si la formation est publiée sur le catalogue public
  if (estPublieCatalogue) {
    return "published";
  }

  // Si la formation est terminée mais pas encore publiée
  if (status === "complete") {
    return "complete";
  }

  // Tout le reste (brouillon, en_cours) = En cours
  return "en_cours";
}

export default function KanbanBoard({ formations }: KanbanBoardProps) {
  // Grouper les formations par colonne
  // Utilise estPublieCatalogue pour savoir si la formation est publiée sur le catalogue public
  const formationsByColumn = KANBAN_COLUMNS.reduce((acc, column) => {
    acc[column.id] = formations.filter(
      (f) => mapStatusToColumn(f.status, f.estPublieCatalogue || false) === column.id
    );
    return acc;
  }, {} as Record<string, Formation[]>);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
      {KANBAN_COLUMNS.map((column) => {
        const columnFormations = formationsByColumn[column.id] || [];

        return (
          <div
            key={column.id}
            className={`flex-shrink-0 w-80 rounded-xl border ${column.borderColor} ${column.color} overflow-hidden`}
          >
            {/* Header de la colonne */}
            <div className={`px-4 py-3 ${column.headerColor} border-b ${column.borderColor}`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold text-sm ${column.textColor}`}>
                  {column.label}
                </h3>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${column.badgeColor}`}>
                  {columnFormations.length}
                </span>
              </div>
            </div>

            {/* Liste des formations */}
            <div className="p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-350px)] overflow-y-auto">
              {columnFormations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Aucune formation
                  </p>
                </div>
              ) : (
                columnFormations.map((formation) => (
                  <div
                    key={formation.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    {/* Mini image */}
                    <div className="relative h-24 w-full overflow-hidden">
                      <Image
                        src={formation.image}
                        alt={formation.titre}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Contenu */}
                    <div className="p-3">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">
                        {formation.titre}
                      </h4>

                      {/* Méta-infos */}
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <span>{formation.dateCreation}</span>
                        {(formation.documentsCount || 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <DocumentIcon />
                            {formation.documentsCount} doc{(formation.documentsCount || 0) > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {/* Bouton éditer */}
                      <Link
                        href={`/create?id=${formation.id}`}
                        className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
                      >
                        Continuer
                        <ArrowRightIcon />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
