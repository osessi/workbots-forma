"use client";
import React, { useState } from "react";
import Link from "next/link";

// Icons
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M9.16667 3.33333C5.94501 3.33333 3.33333 5.94501 3.33333 9.16667C3.33333 12.3883 5.94501 15 9.16667 15C12.3883 15 15 12.3883 15 9.16667C15 5.94501 12.3883 3.33333 9.16667 3.33333ZM1.66667 9.16667C1.66667 5.02453 5.02453 1.66667 9.16667 1.66667C13.3088 1.66667 16.6667 5.02453 16.6667 9.16667C16.6667 10.9378 16.0528 12.5654 15.0274 13.8565L18.0893 16.9107C18.4147 17.2362 18.4147 17.7638 18.0893 18.0893C17.7638 18.4147 17.2362 18.4147 16.9107 18.0893L13.8565 15.0274C12.5654 16.0528 10.9378 16.6667 9.16667 16.6667C5.02453 16.6667 1.66667 13.3088 1.66667 9.16667Z" fill="currentColor"/>
  </svg>
);

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FolderIcon = ({ size = "large" }: { size?: "small" | "large" }) => (
  <svg width={size === "large" ? "48" : "24"} height={size === "large" ? "48" : "24"} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 10C5 8.34315 6.34315 7 8 7H14.3431C15.404 7 16.4214 7.42143 17.1716 8.17157L18.8284 9.82843C19.5786 10.5786 20.596 11 21.6569 11H32C33.6569 11 35 12.3431 35 14V30C35 31.6569 33.6569 33 32 33H8C6.34315 33 5 31.6569 5 30V10Z" fill="#FCD34D"/>
    <path d="M5 14H35V30C35 31.6569 33.6569 33 32 33H8C6.34315 33 5 31.6569 5 30V14Z" fill="#FBBF24"/>
  </svg>
);

const FolderPlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.33333 6.66667C3.33333 5.74619 4.07953 5 5 5H7.84314C8.37357 5 8.88228 5.21071 9.25736 5.58579L10.4142 6.74264C10.7893 7.11771 11.298 7.32843 11.8284 7.32843H15C15.9205 7.32843 16.6667 8.07462 16.6667 8.99509V14.1618C16.6667 15.0822 15.9205 15.8284 15 15.8284H5C4.07953 15.8284 3.33333 15.0822 3.33333 14.1618V6.66667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 10V14M8 12H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GridIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const ListIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const DotsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 10.8333C10.4602 10.8333 10.8333 10.4602 10.8333 10C10.8333 9.53976 10.4602 9.16667 10 9.16667C9.53976 9.16667 9.16667 9.53976 9.16667 10C9.16667 10.4602 9.53976 10.8333 10 10.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 5.83333C10.4602 5.83333 10.8333 5.46024 10.8333 5C10.8333 4.53976 10.4602 4.16667 10 4.16667C9.53976 4.16667 9.16667 4.53976 9.16667 5C9.16667 5.46024 9.53976 5.83333 10 5.83333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 15.8333C10.4602 15.8333 10.8333 15.4602 10.8333 15C10.8333 14.5398 10.4602 14.1667 10 14.1667C9.53976 14.1667 9.16667 14.5398 9.16667 15C9.16667 15.4602 9.53976 15.8333 10 15.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SortIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 5L5 2M5 2L8 5M5 2V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 11L11 14M11 14L8 11M11 14V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Mock folders data with more details
const mockFolders = [
  { id: "1", name: "Les bases de l'IA", filesCount: 12, size: "45.2 MB", lastModified: "10 déc. 2025", status: "active", color: "#FBBF24" },
  { id: "2", name: "Excel Avancé", filesCount: 8, size: "23.1 MB", lastModified: "9 déc. 2025", status: "active", color: "#10B981" },
  { id: "3", name: "Management d'équipe", filesCount: 5, size: "12.8 MB", lastModified: "8 déc. 2025", status: "active", color: "#3B82F6" },
  { id: "4", name: "Communication efficace", filesCount: 3, size: "8.4 MB", lastModified: "7 déc. 2025", status: "active", color: "#8B5CF6" },
  { id: "5", name: "Python pour débutants", filesCount: 15, size: "67.3 MB", lastModified: "6 déc. 2025", status: "active", color: "#EF4444" },
  { id: "6", name: "Marketing Digital", filesCount: 9, size: "34.5 MB", lastModified: "5 déc. 2025", status: "draft", color: "#F97316" },
  { id: "7", name: "Gestion de projet", filesCount: 7, size: "19.2 MB", lastModified: "4 déc. 2025", status: "active", color: "#06B6D4" },
  { id: "8", name: "Leadership", filesCount: 4, size: "11.6 MB", lastModified: "3 déc. 2025", status: "archived", color: "#EC4899" },
  { id: "9", name: "Power BI", filesCount: 11, size: "52.8 MB", lastModified: "2 déc. 2025", status: "active", color: "#14B8A6" },
  { id: "10", name: "SQL pour l'analyse", filesCount: 6, size: "28.9 MB", lastModified: "1 déc. 2025", status: "draft", color: "#A855F7" },
];

type ViewMode = "grid" | "list";
type SortBy = "name" | "date" | "size" | "files";

export default function FoldersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredFolders = mockFolders
    .filter((folder) =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "date":
          comparison = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
          break;
        case "size":
          comparison = parseFloat(a.size) - parseFloat(b.size);
          break;
        case "files":
          comparison = a.filesCount - b.filesCount;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const toggleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/automate/files"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
          >
            <BackIcon />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Dossiers de formation
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {filteredFolders.length} dossiers - Organisez vos fichiers par formation
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Rechercher un dossier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Trier par:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="date">Date</option>
                <option value="name">Nom</option>
                <option value="size">Taille</option>
                <option value="files">Fichiers</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className={`p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors dark:border-gray-700 dark:hover:bg-gray-800 ${sortOrder === "asc" ? "rotate-180" : ""}`}
              >
                <SortIcon />
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden dark:border-gray-700">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${viewMode === "grid" ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
              >
                <GridIcon />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${viewMode === "list" ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
              >
                <ListIcon />
              </button>
            </div>

            {/* New Folder */}
            <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm">
              <FolderPlusIcon />
              Nouveau dossier
            </button>
          </div>
        </div>
      </div>

      {/* Folders Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFolders.map((folder) => (
            <Link
              key={folder.id}
              href={`/automate/files/folders/${folder.id}`}
              className="group p-5 rounded-2xl border border-gray-200 bg-white hover:border-brand-300 hover:shadow-lg transition-all dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500"
            >
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-xl" style={{ backgroundColor: `${folder.color}20` }}>
                  <FolderIcon />
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all dark:hover:text-gray-300 dark:hover:bg-gray-700"
                >
                  <DotsIcon />
                </button>
              </div>

              <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white truncate">
                {folder.name}
              </h3>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {folder.filesCount} fichiers
                </span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {folder.size}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Modifié le {folder.lastModified}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    folder.status === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                      : folder.status === "draft"
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  }`}>
                    {folder.status === "active" ? "Actif" : folder.status === "draft" ? "Brouillon" : "Archivé"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                    Nom du dossier
                    {sortBy === "name" && <span className="text-brand-500">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <button onClick={() => toggleSort("files")} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                    Fichiers
                    {sortBy === "files" && <span className="text-brand-500">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <button onClick={() => toggleSort("size")} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                    Taille
                    {sortBy === "size" && <span className="text-brand-500">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <button onClick={() => toggleSort("date")} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                    Modifié
                    {sortBy === "date" && <span className="text-brand-500">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredFolders.map((folder) => (
                <tr key={folder.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/automate/files/folders/${folder.id}`} className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${folder.color}20` }}>
                        <FolderIcon size="small" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400">
                        {folder.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {folder.filesCount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {folder.size}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {folder.lastModified}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${
                      folder.status === "active"
                        ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                        : folder.status === "draft"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    }`}>
                      {folder.status === "active" ? "Actif" : folder.status === "draft" ? "Brouillon" : "Archivé"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors dark:hover:text-gray-300 dark:hover:bg-gray-700">
                      <DotsIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredFolders.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <FolderIcon />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Aucun dossier trouvé
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchQuery
              ? `Aucun résultat pour "${searchQuery}"`
              : "Commencez par créer un nouveau dossier pour organiser vos fichiers"}
          </p>
          <button className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm">
            <FolderPlusIcon />
            Créer un dossier
          </button>
        </div>
      )}
    </div>
  );
}
