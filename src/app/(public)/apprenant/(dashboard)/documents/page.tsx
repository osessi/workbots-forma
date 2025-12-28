"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";

interface Document {
  id: string;
  nom: string;
  description: string | null;
  type: string;
  url: string;
  taille: number | null;
  categorie: string | null;
  createdAt: string;
}

interface DocumentsData {
  documents: Document[];
  categories: string[];
}

// =====================================
// UTILITAIRES
// =====================================

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  const lowerType = type.toLowerCase();
  if (lowerType.includes("pdf")) return FileText;
  if (lowerType.includes("xls") || lowerType.includes("csv") || lowerType.includes("sheet")) return FileSpreadsheet;
  if (lowerType.includes("image") || lowerType.includes("png") || lowerType.includes("jpg")) return FileImage;
  if (lowerType.includes("video") || lowerType.includes("mp4")) return FileVideo;
  return File;
}

function getFileColor(type: string) {
  const lowerType = type.toLowerCase();
  if (lowerType.includes("pdf")) return "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400";
  if (lowerType.includes("xls") || lowerType.includes("csv") || lowerType.includes("sheet")) return "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400";
  if (lowerType.includes("image") || lowerType.includes("png") || lowerType.includes("jpg")) return "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400";
  if (lowerType.includes("video") || lowerType.includes("mp4")) return "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400";
  return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400";
}

// =====================================
// COMPOSANT DOCUMENT CARD
// =====================================

function DocumentCard({ document, index }: { document: Document; index: number }) {
  const Icon = getFileIcon(document.type);
  const colorClass = getFileColor(document.type);

  const handleDownload = () => {
    window.open(document.url, "_blank");
  };

  const handlePreview = () => {
    window.open(document.url, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-brand-500 dark:hover:border-brand-500 transition-all group"
    >
      <div className="flex items-start gap-4">
        {/* Icône */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {document.nom}
          </h3>
          {document.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
              {document.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
            <span>{document.type.toUpperCase()}</span>
            <span>•</span>
            <span>{formatFileSize(document.taille)}</span>
            {document.categorie && (
              <>
                <span>•</span>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                  {document.categorie}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
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
      </div>
    </motion.div>
  );
}

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function DocumentsPage() {
  const { token, selectedInscription } = useApprenantPortal();
  const [data, setData] = useState<DocumentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const params = new URLSearchParams({ token });
        if (selectedInscription?.id) {
          params.append("inscriptionId", selectedInscription.id);
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
  }, [token, selectedInscription?.id]);

  // Filtrer les documents
  const filteredDocuments = data?.documents.filter((doc) => {
    const matchesSearch = doc.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || doc.categorie === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Documents
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {data?.documents.length || 0} document{(data?.documents.length || 0) > 1 ? "s" : ""} disponible{(data?.documents.length || 0) > 1 ? "s" : ""}
          </p>
        </div>
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
          {data?.categories && data.categories.length > 0 && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="pl-10 pr-8 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="">Toutes les catégories</option>
                {data.categories.map((cat) => (
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
      {filteredDocuments.length > 0 ? (
        <div className="grid gap-4">
          {filteredDocuments.map((document, index) => (
            <DocumentCard key={document.id} document={document} index={index} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery || selectedCategory
              ? "Aucun document ne correspond à votre recherche"
              : "Aucun document disponible pour le moment"}
          </p>
        </div>
      )}
    </div>
  );
}
