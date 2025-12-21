"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import FilePreviewModal from "@/components/files/FilePreviewModal";

// Types pour les dossiers
interface Folder {
  id: string;
  name: string;
  color: string;
  folderType: string;
  parentId: string | null;
  formationId: string | null;
  entrepriseId: string | null;
  apprenantId: string | null;
  formation?: {
    id: string;
    titre: string;
    status: string;
  };
  entreprise?: {
    id: string;
    raisonSociale: string;
  };
  apprenant?: {
    id: string;
    nom: string;
    prenom: string;
  };
  _count: {
    files: number;
    children: number;
  };
  createdAt: string;
}

// Type pour les fichiers
interface FileItem {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  storagePath: string;
  publicUrl: string | null;
  formationId: string | null;
  folderId: string | null;
  createdAt: string;
  formation?: {
    id: string;
    titre: string;
  };
}

// Icons
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M9.16667 3.33333C5.94501 3.33333 3.33333 5.94501 3.33333 9.16667C3.33333 12.3883 5.94501 15 9.16667 15C12.3883 15 15 12.3883 15 9.16667C15 5.94501 12.3883 3.33333 9.16667 3.33333ZM1.66667 9.16667C1.66667 5.02453 5.02453 1.66667 9.16667 1.66667C13.3088 1.66667 16.6667 5.02453 16.6667 9.16667C16.6667 10.9378 16.0528 12.5654 15.0274 13.8565L18.0893 16.9107C18.4147 17.2362 18.4147 17.7638 18.0893 18.0893C17.7638 18.4147 17.2362 18.4147 16.9107 18.0893L13.8565 15.0274C12.5654 16.0528 10.9378 16.6667 9.16667 16.6667C5.02453 16.6667 1.66667 13.3088 1.66667 9.16667Z" fill="currentColor"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.33333 13.3333V14.1667C3.33333 15.5474 4.45262 16.6667 5.83333 16.6667H14.1667C15.5474 16.6667 16.6667 15.5474 16.6667 14.1667V13.3333M13.3333 6.66667L10 3.33333M10 3.33333L6.66667 6.66667M10 3.33333V12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FolderIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 10C5 8.34315 6.34315 7 8 7H14.3431C15.404 7 16.4214 7.42143 17.1716 8.17157L18.8284 9.82843C19.5786 10.5786 20.596 11 21.6569 11H32C33.6569 11 35 12.3431 35 14V30C35 31.6569 33.6569 33 32 33H8C6.34315 33 5 31.6569 5 30V10Z" fill="#FCD34D"/>
    <path d="M5 14H35V30C35 31.6569 33.6569 33 32 33H8C6.34315 33 5 31.6569 5 30V14Z" fill="#FBBF24"/>
  </svg>
);

const DotsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 10.8333C10.4602 10.8333 10.8333 10.4602 10.8333 10C10.8333 9.53976 10.4602 9.16667 10 9.16667C9.53976 9.16667 9.16667 9.53976 9.16667 10C9.16667 10.4602 9.53976 10.8333 10 10.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 5.83333C10.4602 5.83333 10.8333 5.46024 10.8333 5C10.8333 4.53976 10.4602 4.16667 10 4.16667C9.53976 4.16667 9.16667 4.53976 9.16667 5C9.16667 5.46024 9.53976 5.83333 10 5.83333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 15.8333C10.4602 15.8333 10.8333 15.4602 10.8333 15C10.8333 14.5398 10.4602 14.1667 10 14.1667C9.53976 14.1667 9.16667 14.5398 9.16667 15C9.16667 15.4602 9.53976 15.8333 10 15.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

// Media type icons with gradients
const PDFIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="2" width="14" height="18" rx="2" fill="#EF4444" opacity="0.15"/>
    <rect x="3" y="2" width="14" height="18" rx="2" stroke="#EF4444" strokeWidth="1.5"/>
    <path d="M12 2V6C12 7.10457 12.8954 8 14 8H17" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 13H13" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 16H11" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
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
    <path d="M7 12H13" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 15H11" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
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

// File type categories with icons and colors
const FILE_CATEGORIES = {
  fiches: {
    icon: <PDFIcon />,
    label: "Fiches pédagogiques",
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-500/10",
  },
  slides: {
    icon: <PPTIcon />,
    label: "Slides",
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-500/10",
  },
  documents: {
    icon: <DOCIcon />,
    label: "Documents",
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-500/10",
  },
  evaluations: {
    icon: <PDFIcon />,
    label: "Évaluations",
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-500/10",
  },
  supports: {
    icon: <DOCIcon />,
    label: "Supports stagiaires",
    color: "text-cyan-500",
    bgColor: "bg-cyan-50 dark:bg-cyan-500/10",
  },
  images: {
    icon: <ImageIcon />,
    label: "Images",
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-500/10",
  },
};

// Icon Loader
const LoaderIcon = () => (
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// Helper pour formater la taille des fichiers
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Helper pour formater la date
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Stats data (calculé dynamiquement plus tard)
const defaultStatsData = [
  { category: "fiches", count: 0, size: "0 MB", percentage: 0 },
  { category: "slides", count: 0, size: "0 MB", percentage: 0 },
  { category: "documents", count: 0, size: "0 MB", percentage: 0 },
  { category: "evaluations", count: 0, size: "0 MB", percentage: 0 },
  { category: "supports", count: 0, size: "0 MB", percentage: 0 },
  { category: "images", count: 0, size: "0 MB", percentage: 0 },
];

export default function FileManagerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "Mes fichiers" }
  ]);
  const [statsData, setStatsData] = useState(defaultStatsData);

  // Modal preview
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Charger les dossiers depuis l'API
  const fetchFolders = useCallback(async (parentId: string | null = null) => {
    setIsLoadingFolders(true);
    try {
      const params = new URLSearchParams();
      if (parentId) {
        params.append("parentId", parentId);
      } else {
        params.append("parentId", "root");
      }
      params.append("type", "formation"); // D'abord les dossiers de formation

      const response = await fetch(`/api/folders?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setFolders(data);
      }
    } catch (error) {
      console.error("Erreur chargement dossiers:", error);
    } finally {
      setIsLoadingFolders(false);
    }
  }, []);

  // Charger les fichiers depuis l'API
  const fetchFiles = useCallback(async (folderId: string | null = null) => {
    setIsLoadingFiles(true);
    try {
      const params = new URLSearchParams();
      if (folderId) {
        params.append("folderId", folderId);
      }
      if (selectedCategory) {
        params.append("category", selectedCategory);
      }

      const response = await fetch(`/api/files?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      }
    } catch (error) {
      console.error("Erreur chargement fichiers:", error);
      setFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [selectedCategory]);

  // Charger au montage
  useEffect(() => {
    fetchFolders(currentFolderId);
    fetchFiles(currentFolderId);
  }, [fetchFolders, fetchFiles, currentFolderId]);

  // Naviguer dans un dossier
  const navigateToFolder = (folder: Folder) => {
    setCurrentFolderId(folder.id);
    setBreadcrumb(prev => [...prev, { id: folder.id, name: folder.name }]);
  };

  // Naviguer vers un élément du breadcrumb
  const navigateToBreadcrumb = (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1);
    setBreadcrumb(newBreadcrumb);
    setCurrentFolderId(newBreadcrumb[newBreadcrumb.length - 1].id);
  };

  // Filtrer les fichiers par recherche
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (file.formation?.titre || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalStorage = 1024; // 1 GB total (à récupérer de l'organisation)
  const usedStorage = files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024); // En MB
  const freeStorage = Math.max(0, totalStorage - usedStorage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Gestionnaire de fichiers
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
              Importez et centralisez tous vos documents de formation (supports, conventions, documents signés…). Classez-les par formation puis par apprenant pour constituer et retrouver facilement le dossier complet de chaque participant.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm hover:shadow-md whitespace-nowrap">
            <UploadIcon />
            Importer un fichier
          </button>
        </div>
      </div>

      {/* Stats Cards - All Media */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-6">
          Vue d'ensemble
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statsData.map((stat) => {
            const category = FILE_CATEGORIES[stat.category as keyof typeof FILE_CATEGORIES];
            const isSelected = selectedCategory === stat.category;
            return (
              <button
                key={stat.category}
                onClick={() => setSelectedCategory(isSelected ? null : stat.category)}
                className={`p-4 rounded-xl border transition-all text-left ${
                  isSelected
                    ? "border-brand-300 bg-brand-50/50 dark:border-brand-500 dark:bg-brand-500/10"
                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-gray-600"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${category.bgColor} flex items-center justify-center mb-3`}>
                  {category.icon}
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {category.label}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.percentage}% utilisé
                  </span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {stat.count} fichiers
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all"
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: Folders + Storage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Folders */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Dossiers de formation
            </h2>
            <Link href="/automate/files/folders" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1">
              Voir tout
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>

          {/* Breadcrumb */}
          {breadcrumb.length > 1 && (
            <div className="flex items-center gap-2 mb-4 text-sm">
              {breadcrumb.map((item, index) => (
                <React.Fragment key={item.id || "root"}>
                  {index > 0 && <span className="text-gray-400">/</span>}
                  <button
                    onClick={() => navigateToBreadcrumb(index)}
                    className={`hover:text-brand-500 transition-colors ${
                      index === breadcrumb.length - 1
                        ? "text-gray-900 dark:text-white font-medium"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {item.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* État de chargement */}
          {isLoadingFolders ? (
            <div className="flex items-center justify-center py-8">
              <LoaderIcon />
              <span className="ml-2 text-sm text-gray-500">Chargement...</span>
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-8">
              <FolderIcon />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {currentFolderId ? "Ce dossier est vide" : "Aucun dossier de formation"}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Les dossiers sont créés automatiquement quand vous créez une formation
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => navigateToFolder(folder)}
                  className="p-4 rounded-xl border border-gray-200 bg-white hover:border-brand-300 hover:shadow-sm transition-all cursor-pointer dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-brand-500 group"
                >
                  <div className="flex items-start justify-between">
                    <FolderIcon />
                    <button
                      onClick={(e) => { e.stopPropagation(); }}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <DotsIcon />
                    </button>
                  </div>
                  <h3 className="mt-3 text-sm font-medium text-gray-900 dark:text-white truncate">
                    {folder.name}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {folder._count.files} fichier{folder._count.files !== 1 ? "s" : ""}
                      {folder._count.children > 0 && `, ${folder._count.children} sous-dossier${folder._count.children !== 1 ? "s" : ""}`}
                    </span>
                    {folder.formation?.status && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        folder.formation.status === "TERMINEE"
                          ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                          : folder.formation.status === "EN_COURS"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400"
                      }`}>
                        {folder.formation.status === "TERMINEE" ? "Terminée" :
                         folder.formation.status === "EN_COURS" ? "En cours" : "Brouillon"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Storage Details */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            Détails du stockage
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {freeStorage} MB d'espace libre
          </p>

          {/* Donut Chart */}
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-gray-100 dark:text-gray-800"
              />
              {/* Segments */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="12"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 * (1 - 0.35)}
                className="transition-all duration-500"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#F97316"
                strokeWidth="12"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 * 0.65}
                style={{ transform: `rotate(${35 * 3.6}deg)`, transformOrigin: 'center' }}
                className="transition-all duration-500"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#10B981"
                strokeWidth="12"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 * 0.80}
                style={{ transform: `rotate(${60 * 3.6}deg)`, transformOrigin: 'center' }}
                className="transition-all duration-500"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="12"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 * 0.90}
                style={{ transform: `rotate(${80 * 3.6}deg)`, transformOrigin: 'center' }}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {usedStorage} MB
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                sur {totalStorage} MB
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Documents</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Slides</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Images</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Évaluations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Files Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Fichiers récents
            {selectedCategory && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                — {FILE_CATEGORIES[selectedCategory as keyof typeof FILE_CATEGORIES]?.label}
              </span>
            )}
          </h2>
          <Link href="/automate/files/all" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1">
            Voir tout
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nom du fichier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Formation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Taille
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoadingFiles ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <LoaderIcon />
                      <span className="ml-2 text-sm text-gray-500">Chargement des fichiers...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredFiles.length === 0 ? null : (
                filteredFiles.map((file) => {
                  // Mapper les catégories Prisma vers les catégories UI
                  const categoryMap: Record<string, string> = {
                    "FICHE_PEDAGOGIQUE": "fiches",
                    "SLIDES": "slides",
                    "DOCUMENT": "documents",
                    "EVALUATION": "evaluations",
                    "SUPPORT_STAGIAIRE": "supports",
                    "IMAGE": "images",
                    "AUTRE": "documents",
                  };
                  const categoryKey = categoryMap[file.category] || "documents";
                  const category = FILE_CATEGORIES[categoryKey as keyof typeof FILE_CATEGORIES];

                  return (
                    <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg ${category?.bgColor || "bg-gray-100"} flex items-center justify-center`}>
                            {category?.icon || <DOCIcon />}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {file.originalName || file.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {file.formation?.titre || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${category?.bgColor || "bg-gray-100"} ${category?.color || "text-gray-600"}`}>
                          {category?.label || "Document"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(file.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {file.publicUrl && (
                            <a
                              href={file.publicUrl}
                              download={file.originalName}
                              className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors dark:hover:text-brand-400 dark:hover:bg-brand-500/10"
                              title="Télécharger"
                            >
                              <DownloadIcon />
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setPreviewFile(file);
                              setShowPreviewModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:text-blue-400 dark:hover:bg-blue-500/10"
                            title="Visualiser"
                          >
                            <EyeIcon />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:text-red-400 dark:hover:bg-red-500/10"
                            title="Supprimer"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredFiles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Aucun fichier trouvé
              {searchQuery && ` pour "${searchQuery}"`}
              {selectedCategory && ` dans la catégorie "${FILE_CATEGORIES[selectedCategory as keyof typeof FILE_CATEGORIES]?.label}"`}
            </p>
          </div>
        )}
      </div>

      {/* Modal de preview/edit */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setPreviewFile(null);
          }}
          onSave={async (fileId, content) => {
            const response = await fetch(`/api/files/${fileId}/content`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content }),
            });
            if (!response.ok) {
              throw new Error("Erreur lors de la sauvegarde");
            }
          }}
        />
      )}
    </div>
  );
}
