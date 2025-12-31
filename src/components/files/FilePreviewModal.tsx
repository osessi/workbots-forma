"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { toProxyUrl, pathToProxyUrl } from "@/lib/supabase/storage-client";

// Import dynamique de l'éditeur TipTap
const DocumentEditor = dynamic(
  () => import("@/components/editor/DocumentEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-900 rounded-lg">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-brand-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-gray-500">Chargement de l&apos;éditeur...</span>
        </div>
      </div>
    ),
  }
);

// Icons
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 5L15 15M5 15L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 2.25L15.75 4.5M1.5 16.5L2.25 13.5L12.75 3L15 5.25L4.5 15.75L1.5 16.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.5 9C1.5 9 3.75 3.75 9 3.75C14.25 3.75 16.5 9 16.5 9C16.5 9 14.25 14.25 9 14.25C3.75 14.25 1.5 9 1.5 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SaveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V3.75C2.25 3.35218 2.40804 2.97064 2.68934 2.68934C2.97064 2.40804 3.35218 2.25 3.75 2.25H12L15.75 6V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.75 15.75V10.5H5.25V15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.25 2.25V6H11.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.25 7.5L9 11.25L12.75 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 11.25V2.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LoaderIcon = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

interface FileItem {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  publicUrl?: string | null;
  category: string;
  createdAt: string;
  formation?: {
    id: string;
    titre: string;
  } | null;
  folder?: {
    id: string;
    name: string;
  } | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface FilePreviewModalProps {
  file: FileItem;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (fileId: string, content: string) => Promise<void>;
}

export default function FilePreviewModal({
  file,
  isOpen,
  onClose,
  onSave,
}: FilePreviewModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [content, setContent] = useState<string>("");
  const [editedContent, setEditedContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger le contenu du fichier
  useEffect(() => {
    if (isOpen && file) {
      loadFileContent();
    }
  }, [isOpen, file]);

  const loadFileContent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Si le fichier est un HTML généré par le système
      if (file.mimeType === "text/html" && file.storagePath) {
        const response = await fetch(`/api/files/${file.id}/content`);
        if (response.ok) {
          const data = await response.json();
          setContent(data.content || "");
          setEditedContent(data.content || "");
        } else {
          // Contenu par défaut si pas encore sauvegardé
          setContent("<p>Contenu du fichier non disponible</p>");
          setEditedContent("<p>Contenu du fichier non disponible</p>");
        }
      } else if (file.publicUrl || file.storagePath) {
        // Fichier avec URL publique ou chemin de stockage
        // Convertir l'URL Supabase en URL proxy si nécessaire
        const fileUrl = file.publicUrl
          ? toProxyUrl(file.publicUrl) || file.publicUrl
          : pathToProxyUrl(file.storagePath);

        const response = await fetch(fileUrl);
        if (response.ok) {
          const text = await response.text();
          setContent(text);
          setEditedContent(text);
        }
      } else {
        setContent("<p>Aperçu non disponible pour ce type de fichier</p>");
      }
    } catch (err) {
      console.error("Erreur chargement fichier:", err);
      setError("Impossible de charger le contenu du fichier");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!onSave || !editedContent) return;

    setIsSaving(true);
    try {
      await onSave(file.id, editedContent);
      setContent(editedContent);
      setIsEditMode(false);
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      setError("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Impossible d'ouvrir la fenêtre. Vérifiez les popups bloqués.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${file.originalName || file.name}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1, h2, h3 { margin-top: 1.5em; margin-bottom: 0.5em; }
          table { border-collapse: collapse; width: 100%; margin: 1em 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
        </style>
      </head>
      <body>
        ${isEditMode ? editedContent : content}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }, 500);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const isHtmlFile = file.mimeType === "text/html";
  const canEdit = isHtmlFile && onSave;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-500/10">
              {isEditMode ? (
                <EditIcon />
              ) : (
                <EyeIcon />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {file.originalName || file.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isEditMode ? "Mode édition" : "Aperçu"} • {file.mimeType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Edit/Preview */}
            {canEdit && (
              <button
                onClick={() => {
                  if (isEditMode) {
                    // Reset au contenu original si on annule
                    setEditedContent(content);
                  }
                  setIsEditMode(!isEditMode);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isEditMode
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    : "bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
                }`}
              >
                {isEditMode ? <EyeIcon /> : <EditIcon />}
                {isEditMode ? "Aperçu" : "Modifier"}
              </button>
            )}

            {/* Sauvegarder (visible en mode edit) */}
            {isEditMode && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {isSaving ? <LoaderIcon /> : <SaveIcon />}
                Sauvegarder
              </button>
            )}

            {/* Télécharger PDF */}
            {isHtmlFile && (
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <DownloadIcon />
                PDF
              </button>
            )}

            {/* Fermer */}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full py-12">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin h-8 w-8 text-brand-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-gray-500 dark:text-gray-400">Chargement du fichier...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full py-12">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            </div>
          ) : isEditMode && isHtmlFile ? (
            <div className="h-full">
              <DocumentEditor
                initialContent={editedContent}
                onChange={(html) => setEditedContent(html)}
                placeholder="Commencez à écrire..."
              />
            </div>
          ) : (
            <div className="h-full overflow-auto p-6">
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
