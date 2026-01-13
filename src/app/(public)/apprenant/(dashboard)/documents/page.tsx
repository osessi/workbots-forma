"use client";

// ===========================================
// CORRECTIONS 457-460: Page "Documents"
// ===========================================
// 457: Filtrer strictement par apprenant connecté (confidentialité)
// 458: Corriger affichage métadonnées parasites
// 459: Séparer Documents administratifs vs Supports de formation
// 460: Supports disponibles uniquement au début de session

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import {
  FileText,
  Download,
  Eye,
  File,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  FolderOpen,
  Briefcase,
  BookOpen,
  Lock,
  Calendar,
  Presentation,
} from "lucide-react";

// =====================================
// TYPES
// =====================================

interface Document {
  id: string;
  nom: string;
  description: string | null;
  type: string;
  url: string;
  taille: number | null;
  categorie: string | null;
  createdAt: string;
  categorieGlobale: "administratif" | "support";
  isAvailable: boolean;
  dateDisponibilite?: string | null;
}

interface DocumentsData {
  documents: Document[];
  documentsAdministratifs: Document[];
  supportsFormation: Document[];
  categories: string[];
  total: number;
  sessionStartDate: string | null;
}

// =====================================
// UTILITAIRES
// =====================================

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  const lowerType = type.toLowerCase();
  if (lowerType.includes("pdf") || lowerType.includes("fiche") || lowerType.includes("programme")) return FileText;
  if (lowerType.includes("xls") || lowerType.includes("csv") || lowerType.includes("sheet")) return FileSpreadsheet;
  if (lowerType.includes("image") || lowerType.includes("png") || lowerType.includes("jpg")) return FileImage;
  if (lowerType.includes("video") || lowerType.includes("mp4")) return FileVideo;
  if (lowerType.includes("slides") || lowerType.includes("ppt") || lowerType.includes("presentation")) return Presentation;
  return File;
}

function getFileColor(type: string) {
  const lowerType = type.toLowerCase();
  if (lowerType.includes("pdf") || lowerType.includes("fiche") || lowerType.includes("programme")) return "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400";
  if (lowerType.includes("xls") || lowerType.includes("csv") || lowerType.includes("sheet")) return "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400";
  if (lowerType.includes("image") || lowerType.includes("png") || lowerType.includes("jpg")) return "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400";
  if (lowerType.includes("video") || lowerType.includes("mp4")) return "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400";
  if (lowerType.includes("slides") || lowerType.includes("ppt") || lowerType.includes("presentation")) return "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400";
  return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400";
}

// =====================================
// COMPOSANT DOCUMENT CARD
// =====================================

function DocumentCard({ document, index }: { document: Document; index: number }) {
  const Icon = getFileIcon(document.type);
  const colorClass = getFileColor(document.type);
  const isSupport = document.categorieGlobale === "support";
  const isLocked = isSupport && !document.isAvailable;

  const handleDownload = () => {
    if (!isLocked) {
      window.open(document.url, "_blank");
    }
  };

  const handlePreview = () => {
    if (!isLocked) {
      window.open(document.url, "_blank");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white dark:bg-gray-800 rounded-xl border overflow-hidden transition-all group ${
        isLocked
          ? "border-gray-200 dark:border-gray-700 opacity-75"
          : "border-gray-200 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500"
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Icône */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isLocked ? "bg-gray-100 dark:bg-gray-700" : colorClass}`}>
            {isLocked ? (
              <Lock className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            ) : (
              <Icon className="w-6 h-6" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium truncate transition-colors ${
              isLocked
                ? "text-gray-500 dark:text-gray-400"
                : "text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400"
            }`}>
              {document.nom}
            </h3>
            {document.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                {document.description}
              </p>
            )}
            {/* Correction 458: Affichage métadonnées propre */}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-400 dark:text-gray-500">
              {/* Correction 460: Message de disponibilité pour les supports verrouillés */}
              {isLocked && document.dateDisponibilite ? (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Calendar className="w-3.5 h-3.5" />
                  Disponible à partir du {new Date(document.dateDisponibilite).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              ) : (
                <>
                  {/* Correction 458: Ne pas afficher le type s'il est vide ou "AUTRE" */}
                  {document.type && document.type !== "AUTRE" && (
                    <span className="uppercase">{document.type.replace(/_/g, " ")}</span>
                  )}
                  {/* Correction 458: Ne pas afficher la taille si elle est nulle ou 0 */}
                  {document.taille && document.taille > 0 && (
                    <>
                      {document.type && document.type !== "AUTRE" && <span>•</span>}
                      <span>{formatFileSize(document.taille)}</span>
                    </>
                  )}
                  {/* Catégorie seulement si elle existe et est différente du nom */}
                  {document.categorie && document.categorie !== document.nom && document.categorie !== "Autre document" && (
                    <>
                      {(document.type && document.type !== "AUTRE") || (document.taille && document.taille > 0) ? <span>•</span> : null}
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                        {document.categorie}
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          {!isLocked && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handlePreview}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Aperçu"
              >
                <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors"
                title="Télécharger"
              >
                <Download className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              </button>
            </div>
          )}

          {/* Badge verrouillé pour les supports non disponibles */}
          {isLocked && (
            <div className="flex-shrink-0">
              <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-medium rounded-lg flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Bientôt disponible
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function DocumentsPage() {
  const { token, selectedSession } = useApprenantPortal();
  const [data, setData] = useState<DocumentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // Correction 459: Onglet actif (administratif ou support)
  const [activeTab, setActiveTab] = useState<"administratif" | "support">("administratif");

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const params = new URLSearchParams({ token });
        if (selectedSession?.sessionId) {
          params.append("sessionId", selectedSession.sessionId);
        }

        const res = await fetch(`/api/apprenant/documents?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Erreur lors du chargement des documents");
        }

        const documentsData = await res.json();
        setData(documentsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [token, selectedSession?.sessionId]);

  // Correction 459: Sélectionner les documents selon l'onglet actif
  const currentDocuments = activeTab === "administratif"
    ? data?.documentsAdministratifs || []
    : data?.supportsFormation || [];

  // Filtrer les documents
  const filteredDocuments = currentDocuments.filter((doc) => {
    const matchesSearch = doc.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || doc.categorie === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Extraire les catégories pour l'onglet actif
  const currentCategories = [...new Set(currentDocuments.map((d) => d.categorie))].filter(Boolean) as string[];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 dark:text-white font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const adminCount = data?.documentsAdministratifs?.length || 0;
  const supportCount = data?.supportsFormation?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Documents
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {data?.total || 0} document{(data?.total || 0) > 1 ? "s" : ""} disponible{(data?.total || 0) > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Correction 459: Onglets Administratif / Supports */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <button
          onClick={() => {
            setActiveTab("administratif");
            setSelectedCategory(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "administratif"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Administratif
          {adminCount > 0 && (
            <span className={`px-1.5 py-0.5 text-xs rounded-full min-w-[20px] text-center ${
              activeTab === "administratif"
                ? "bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400"
                : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
            }`}>
              {adminCount}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab("support");
            setSelectedCategory(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "support"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Supports de formation
          {supportCount > 0 && (
            <span className={`px-1.5 py-0.5 text-xs rounded-full min-w-[20px] text-center ${
              activeTab === "support"
                ? "bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400"
                : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
            }`}>
              {supportCount}
            </span>
          )}
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Filtre par catégorie */}
          {currentCategories.length > 0 && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="pl-10 pr-8 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="">Toutes les catégories</option>
                {currentCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Liste des documents */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {filteredDocuments.length > 0 ? (
            <div className="grid gap-4">
              {filteredDocuments.map((document, index) => (
                <DocumentCard key={document.id} document={document} index={index} />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <FolderOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {activeTab === "administratif" ? "Documents administratifs" : "Supports de formation"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery || selectedCategory
                  ? "Aucun document ne correspond à votre recherche"
                  : activeTab === "administratif"
                    ? "Aucun document administratif disponible pour le moment."
                    : selectedSession
                      ? "Les supports de formation seront disponibles au début de votre session."
                      : "Sélectionnez une session pour voir les supports de formation."}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
