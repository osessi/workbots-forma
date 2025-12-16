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

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.33333 13.3333V14.1667C3.33333 15.5474 4.45262 16.6667 5.83333 16.6667H14.1667C15.5474 16.6667 16.6667 15.5474 16.6667 14.1667V13.3333M13.3333 6.66667L10 3.33333M10 3.33333L6.66667 6.66667M10 3.33333V12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 5.83333H17.5M5 10H15M7.5 14.1667H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.25 4.5H15.75M7.5 8.25V12.75M10.5 8.25V12.75M3 4.5L3.75 14.25C3.75 15.0784 4.42157 15.75 5.25 15.75H12.75C13.5784 15.75 14.25 15.0784 14.25 14.25L15 4.5M6.75 4.5V2.25C6.75 1.83579 7.08579 1.5 7.5 1.5H10.5C10.9142 1.5 11.25 1.83579 11.25 2.25V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.5 9C1.5 9 3.75 3.75 9 3.75C14.25 3.75 16.5 9 16.5 9C16.5 9 14.25 14.25 9 14.25C3.75 14.25 1.5 9 1.5 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12V13.5C3 14.3284 3.67157 15 4.5 15H13.5C14.3284 15 15 14.3284 15 13.5V12M9 11.25V3M9 11.25L6 8.25M9 11.25L12 8.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Media type icons
const PDFIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="2" width="14" height="18" rx="2" fill="#EF4444" opacity="0.15"/>
    <rect x="3" y="2" width="14" height="18" rx="2" stroke="#EF4444" strokeWidth="1.5"/>
    <path d="M12 2V6C12 7.10457 12.8954 8 14 8H17" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 13H13M7 16H11" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const PPTIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="2" width="14" height="18" rx="2" fill="#F97316" opacity="0.15"/>
    <rect x="3" y="2" width="14" height="18" rx="2" stroke="#F97316" strokeWidth="1.5"/>
    <path d="M12 2V6C12 7.10457 12.8954 8 14 8H17" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="7" y="10" width="6" height="6" rx="1" stroke="#F97316" strokeWidth="1.5"/>
  </svg>
);

const DOCIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="2" width="14" height="18" rx="2" fill="#3B82F6" opacity="0.15"/>
    <rect x="3" y="2" width="14" height="18" rx="2" stroke="#3B82F6" strokeWidth="1.5"/>
    <path d="M12 2V6C12 7.10457 12.8954 8 14 8H17" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 12H13M7 15H11" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="16" rx="2" fill="#10B981" opacity="0.15"/>
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="#10B981" strokeWidth="1.5"/>
    <circle cx="8" cy="9" r="2" stroke="#10B981" strokeWidth="1.5"/>
    <path d="M21 16L16 11L8 20" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Categories
const FILE_CATEGORIES = {
  fiches: { icon: <PDFIcon />, label: "Fiches pédagogiques", color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-500/10" },
  slides: { icon: <PPTIcon />, label: "Slides", color: "text-orange-500", bgColor: "bg-orange-50 dark:bg-orange-500/10" },
  documents: { icon: <DOCIcon />, label: "Documents", color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-500/10" },
  evaluations: { icon: <PDFIcon />, label: "Évaluations", color: "text-purple-500", bgColor: "bg-purple-50 dark:bg-purple-500/10" },
  supports: { icon: <DOCIcon />, label: "Supports stagiaires", color: "text-cyan-500", bgColor: "bg-cyan-50 dark:bg-cyan-500/10" },
  images: { icon: <ImageIcon />, label: "Images", color: "text-green-500", bgColor: "bg-green-50 dark:bg-green-500/10" },
};

// Extended mock data
const allFiles = [
  { id: "1", name: "Fiche_IA_Bases.pdf", category: "fiches", size: "1.2 MB", date: "10 déc. 2025", formation: "Les bases de l'IA", author: "Olivier K." },
  { id: "2", name: "Slides_Module1.pptx", category: "slides", size: "8.5 MB", date: "9 déc. 2025", formation: "Les bases de l'IA", author: "Olivier K." },
  { id: "3", name: "Convention_Entreprise_ABC.pdf", category: "documents", size: "245 KB", date: "8 déc. 2025", formation: "Les bases de l'IA", author: "Olivier K." },
  { id: "4", name: "QCM_Module2.pdf", category: "evaluations", size: "156 KB", date: "7 déc. 2025", formation: "Les bases de l'IA", author: "Olivier K." },
  { id: "5", name: "Support_Stagiaire_Module1.pdf", category: "supports", size: "3.2 MB", date: "6 déc. 2025", formation: "Les bases de l'IA", author: "Olivier K." },
  { id: "6", name: "Fiche_Excel_Avance.pdf", category: "fiches", size: "980 KB", date: "5 déc. 2025", formation: "Excel Avancé", author: "Olivier K." },
  { id: "7", name: "Attestation_Formation.pdf", category: "documents", size: "125 KB", date: "4 déc. 2025", formation: "Excel Avancé", author: "Olivier K." },
  { id: "8", name: "Image_Couverture.png", category: "images", size: "2.1 MB", date: "3 déc. 2025", formation: "Excel Avancé", author: "Olivier K." },
  { id: "9", name: "Fiche_Management.pdf", category: "fiches", size: "1.8 MB", date: "2 déc. 2025", formation: "Management d'équipe", author: "Olivier K." },
  { id: "10", name: "Slides_Leadership.pptx", category: "slides", size: "12.3 MB", date: "1 déc. 2025", formation: "Leadership", author: "Olivier K." },
  { id: "11", name: "QCM_Final_Excel.pdf", category: "evaluations", size: "340 KB", date: "30 nov. 2025", formation: "Excel Avancé", author: "Olivier K." },
  { id: "12", name: "Support_Communication.pdf", category: "supports", size: "4.5 MB", date: "29 nov. 2025", formation: "Communication efficace", author: "Olivier K." },
  { id: "13", name: "Logo_Formation.png", category: "images", size: "890 KB", date: "28 nov. 2025", formation: "Marketing Digital", author: "Olivier K." },
  { id: "14", name: "Convention_Client_XYZ.pdf", category: "documents", size: "198 KB", date: "27 nov. 2025", formation: "Gestion de projet", author: "Olivier K." },
  { id: "15", name: "Slides_Python_Intro.pptx", category: "slides", size: "9.7 MB", date: "26 nov. 2025", formation: "Python pour débutants", author: "Olivier K." },
];

type ViewMode = "grid" | "list";

export default function AllFilesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const filesPerPage = 10;

  // Get unique formations
  const formations = [...new Set(allFiles.map(f => f.formation))];

  // Filter files
  const filteredFiles = allFiles.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.formation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || file.category === selectedCategory;
    const matchesFormation = !selectedFormation || file.formation === selectedFormation;
    return matchesSearch && matchesCategory && matchesFormation;
  });

  // Pagination
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);
  const paginatedFiles = filteredFiles.slice((currentPage - 1) * filesPerPage, currentPage * filesPerPage);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedFiles.length === paginatedFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(paginatedFiles.map(f => f.id));
    }
  };

  const toggleSelectFile = (id: string) => {
    setSelectedFiles(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedFormation(null);
    setSearchQuery("");
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
              Tous les fichiers
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {filteredFiles.length} fichiers
              {(selectedCategory || selectedFormation) && " (filtrés)"}
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Rechercher un fichier..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory || ""}
              onChange={(e) => { setSelectedCategory(e.target.value || null); setCurrentPage(1); }}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-700 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="">Toutes les catégories</option>
              {Object.entries(FILE_CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>{cat.label}</option>
              ))}
            </select>

            {/* Formation Filter */}
            <select
              value={selectedFormation || ""}
              onChange={(e) => { setSelectedFormation(e.target.value || null); setCurrentPage(1); }}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-700 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="">Toutes les formations</option>
              {formations.map((formation) => (
                <option key={formation} value={formation}>{formation}</option>
              ))}
            </select>

            {/* Clear Filters */}
            {(selectedCategory || selectedFormation || searchQuery) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden dark:border-gray-700">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
              >
                <GridIcon />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
              >
                <ListIcon />
              </button>
            </div>

            {/* Upload Button */}
            <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm">
              <UploadIcon />
              Importer
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 p-3 bg-brand-50 dark:bg-brand-500/10 rounded-xl flex items-center justify-between">
            <span className="text-sm text-brand-700 dark:text-brand-300">
              {selectedFiles.length} fichier{selectedFiles.length > 1 ? "s" : ""} sélectionné{selectedFiles.length > 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm text-brand-600 hover:bg-brand-100 rounded-lg transition-colors dark:text-brand-400 dark:hover:bg-brand-500/20">
                Télécharger
              </button>
              <button className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-red-400 dark:hover:bg-red-500/10">
                Supprimer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Files List/Grid */}
      {viewMode === "list" ? (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-4 text-left">
                  <button
                    onClick={toggleSelectAll}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedFiles.length === paginatedFiles.length && paginatedFiles.length > 0
                        ? "bg-brand-500 border-brand-500 text-white"
                        : "border-gray-300 dark:border-gray-600 hover:border-brand-500"
                    }`}
                  >
                    {selectedFiles.length === paginatedFiles.length && paginatedFiles.length > 0 && <CheckIcon />}
                  </button>
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nom du fichier
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Formation
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Taille
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {paginatedFiles.map((file) => {
                const category = FILE_CATEGORIES[file.category as keyof typeof FILE_CATEGORIES];
                const isSelected = selectedFiles.includes(file.id);
                return (
                  <tr key={file.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${isSelected ? "bg-brand-50/50 dark:bg-brand-500/5" : ""}`}>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleSelectFile(file.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-brand-500 border-brand-500 text-white"
                            : "border-gray-300 dark:border-gray-600 hover:border-brand-500"
                        }`}
                      >
                        {isSelected && <CheckIcon />}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${category.bgColor} flex items-center justify-center`}>
                          {category.icon}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white block">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            par {file.author}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {file.formation}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${category.bgColor} ${category.color}`}>
                        {category.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {file.size}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {file.date}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors dark:hover:text-brand-400 dark:hover:bg-brand-500/10" title="Télécharger">
                          <DownloadIcon />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:text-blue-400 dark:hover:bg-blue-500/10" title="Visualiser">
                          <EyeIcon />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:text-red-400 dark:hover:bg-red-500/10" title="Supprimer">
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {paginatedFiles.map((file) => {
            const category = FILE_CATEGORIES[file.category as keyof typeof FILE_CATEGORIES];
            const isSelected = selectedFiles.includes(file.id);
            return (
              <div
                key={file.id}
                className={`group p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10"
                    : "border-gray-200 bg-white hover:border-brand-300 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500"
                }`}
                onClick={() => toggleSelectFile(file.id)}
              >
                <div className={`w-14 h-14 rounded-xl ${category.bgColor} flex items-center justify-center mx-auto mb-3`}>
                  {category.icon}
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white text-center truncate" title={file.name}>
                  {file.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1 truncate">
                  {file.formation}
                </p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                  <span className="text-xs text-gray-400">{file.size}</span>
                  <span className="text-xs text-gray-400">{file.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-2xl dark:bg-white/[0.03] dark:border-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Affichage de {((currentPage - 1) * filesPerPage) + 1} à {Math.min(currentPage * filesPerPage, filteredFiles.length)} sur {filteredFiles.length} fichiers
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Précédent
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                  currentPage === page
                    ? "bg-brand-500 text-white"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredFiles.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <FilterIcon />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Aucun fichier trouvé
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Aucun fichier ne correspond à vos critères de recherche
          </p>
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-brand-600 bg-brand-50 rounded-xl hover:bg-brand-100 active:scale-[0.98] transition-all dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
          >
            Effacer les filtres
          </button>
        </div>
      )}
    </div>
  );
}
