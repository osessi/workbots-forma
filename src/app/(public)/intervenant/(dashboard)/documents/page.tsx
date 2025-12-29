"use client";

import React, { useState, useEffect } from "react";
import { useRequireIntervenantAuth, useIntervenantPortal } from "@/context/IntervenantPortalContext";
import {
  FileText,
  Download,
  Eye,
  Folder,
  Image as ImageIcon,
  File,
  Video,
  Search,
} from "lucide-react";

interface Document {
  id: string;
  nom: string;
  type: string;
  taille?: number;
  dateCreation: string;
  url?: string;
  categorie: string;
}

export default function IntervenantDocumentsPage() {
  useRequireIntervenantAuth();
  const { selectedSession, token, isLoading } = useIntervenantPortal();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategorie, setSelectedCategorie] = useState<string>("all");

  useEffect(() => {
    if (selectedSession && token) {
      fetchDocuments();
    }
  }, [selectedSession, token]);

  const fetchDocuments = async () => {
    if (!selectedSession || !token) return;

    setLoadingDocuments(true);
    try {
      const res = await fetch(`/api/intervenant/documents?token=${token}&sessionId=${selectedSession.id}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Erreur fetch documents:", error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!selectedSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Aucune session sélectionnée
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Veuillez sélectionner une session pour accéder aux documents.
        </p>
      </div>
    );
  }

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return ImageIcon;
    if (type.includes("video")) return Video;
    if (type.includes("pdf")) return FileText;
    return File;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "-";
    if (bytes < 1024) return bytes + " o";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko";
    return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
  };

  // Catégories disponibles
  const categories = [
    { id: "all", label: "Tous" },
    { id: "support", label: "Supports" },
    { id: "administratif", label: "Administratif" },
    { id: "ressource", label: "Ressources" },
  ];

  // Filtrer les documents
  const filteredDocuments = documents.filter(doc => {
    const matchSearch = doc.nom.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategorie = selectedCategorie === "all" || doc.categorie === selectedCategorie;
    return matchSearch && matchCategorie;
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Documents
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {selectedSession.formation.titre} - Supports et ressources
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Catégories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategorie(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategorie === cat.id
                  ? "bg-emerald-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des documents */}
      {loadingDocuments ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Folder className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery || selectedCategorie !== "all"
              ? "Aucun document ne correspond à vos critères"
              : "Aucun document disponible pour cette session"
            }
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredDocuments.map((doc) => {
              const FileIcon = getFileIcon(doc.type);

              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {/* Icône */}
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {doc.nom}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatFileSize(doc.taille)}</span>
                      <span>
                        {new Date(doc.dateCreation).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {doc.url && (
                      <>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="Voir"
                        >
                          <Eye className="w-5 h-5" />
                        </a>
                        <a
                          href={doc.url}
                          download
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Télécharger"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
