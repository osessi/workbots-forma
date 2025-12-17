"use client";
// ===========================================
// MODAL DE PREVIEW ET EDITION DE DOCUMENT
// ===========================================

import { useState, useCallback, useMemo, useRef, useEffect, Fragment } from "react";
import dynamic from "next/dynamic";
import { DocumentType } from "@/lib/templates/types";
import { renderTemplate, generateTestContext } from "@/lib/templates/renderer";

// Import dynamique de l'editeur (client-side only)
const DocumentEditor = dynamic(
  () => import("@/components/editor/DocumentEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-900 rounded-lg">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-brand-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span className="text-gray-500 text-sm">Chargement...</span>
        </div>
      </div>
    )
  }
);

// Dimensions A4
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MM_TO_PX = 96 / 25.4;
const A4_WIDTH_PX = Math.round(A4_WIDTH_MM * MM_TO_PX);
const A4_HEIGHT_PX = Math.round(A4_HEIGHT_MM * MM_TO_PX);
const MARGIN_MM = 20;
const CONTENT_HEIGHT_PX = A4_HEIGHT_PX - (MARGIN_MM * 2 * MM_TO_PX); // Hauteur utilisable pour le contenu

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id?: string;
    type: string;
    titre: string;
    content: unknown; // JSON TipTap
    renderedContent: string; // HTML
    renderedHeader?: string;
    renderedFooter?: string;
  } | null;
  onSave?: (content: string) => Promise<void>;
  onExportPDF?: () => void;
  onExportWord?: () => void;
}

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  document,
  onSave,
  onExportPDF,
  onExportWord,
}: DocumentPreviewModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [editedHeaderJson, setEditedHeaderJson] = useState("");
  const [editedFooterJson, setEditedFooterJson] = useState("");
  const [editedHeader, setEditedHeader] = useState("");
  const [editedFooter, setEditedFooter] = useState("");
  const [previewContent, setPreviewContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editingSection, setEditingSection] = useState<"content" | "header" | "footer">("content");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialiser le contenu editable
  useEffect(() => {
    if (document?.content) {
      const contentStr = typeof document.content === "string"
        ? document.content
        : JSON.stringify(document.content);
      setEditedContent(contentStr);
      setPreviewContent(document.renderedContent || "");
    }
    if (document?.renderedHeader) {
      setEditedHeader(document.renderedHeader);
      // Créer un JSON TipTap basique pour l'en-tête
      const headerJson = JSON.stringify({
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: document.renderedHeader.replace(/<[^>]*>/g, '') }] }]
      });
      setEditedHeaderJson(headerJson);
    }
    if (document?.renderedFooter) {
      setEditedFooter(document.renderedFooter);
      // Créer un JSON TipTap basique pour le pied de page
      const footerJson = JSON.stringify({
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: document.renderedFooter.replace(/<[^>]*>/g, '') }] }]
      });
      setEditedFooterJson(footerJson);
    }
  }, [document?.content, document?.renderedContent, document?.renderedHeader, document?.renderedFooter]);

  // Re-render le contenu quand on quitte le mode édition
  const handleSwitchToPreview = useCallback(() => {
    try {
      // Passer le contenu JSON en string - renderTemplate gère la conversion
      const testContext = generateTestContext();

      // Render du contenu principal
      const rendered = renderTemplate(editedContent, testContext);
      setPreviewContent(rendered);

      // Render de l'en-tête si modifié
      if (editedHeaderJson) {
        const renderedHeader = renderTemplate(editedHeaderJson, testContext);
        setEditedHeader(renderedHeader);
      }

      // Render du pied de page si modifié
      if (editedFooterJson) {
        const renderedFooter = renderTemplate(editedFooterJson, testContext);
        setEditedFooter(renderedFooter);
      }
    } catch (error) {
      console.error("Erreur rendering:", error);
      // Garder le contenu précédent si erreur
    }
    setIsEditMode(false);
  }, [editedContent, editedHeaderJson, editedFooterJson]);

  // Calculer le nombre de pages basé sur la hauteur du contenu
  useEffect(() => {
    if (!isEditMode) {
      // Attendre que le contenu soit rendu
      const timer = setTimeout(() => {
        // Créer un élément temporaire pour mesurer le contenu
        const tempDiv = window.document.createElement("div");
        tempDiv.style.cssText = `
          position: absolute;
          visibility: hidden;
          width: ${A4_WIDTH_PX - (MARGIN_MM * 2 * MM_TO_PX)}px;
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: 11pt;
          line-height: 1.6;
        `;
        tempDiv.innerHTML = previewContent || document?.renderedContent || "";
        window.document.body.appendChild(tempDiv);

        const contentHeight = tempDiv.scrollHeight;
        // Hauteur disponible pour le contenu (page - marges - header - footer)
        const availableHeight = A4_HEIGHT_PX - (MARGIN_MM * 2 * MM_TO_PX) - 100; // 100px pour header/footer
        const pages = Math.max(1, Math.ceil(contentHeight / availableHeight));

        window.document.body.removeChild(tempDiv);
        setTotalPages(pages);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [previewContent, editedHeader, editedFooter, isEditMode, document?.renderedContent]);

  // Fermer avec Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Handler de sauvegarde
  const handleSave = useCallback(async () => {
    if (!onSave || !editedContent) return;
    setIsSaving(true);
    try {
      await onSave(editedContent);
      setIsEditMode(false);
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  }, [onSave, editedContent]);

  // Export PDF - utilise le contenu édité (preview) pour correspondre exactement à l'aperçu
  const handleExportPDF = useCallback(() => {
    if (onExportPDF) {
      onExportPDF();
      return;
    }

    // Utiliser le contenu édité s'il existe, sinon le contenu original
    const headerContent = editedHeader || document?.renderedHeader || "";
    const bodyContent = previewContent || document?.renderedContent || "";
    const footerContent = editedFooter || document?.renderedFooter || "";

    // Export par defaut via print
    setIsExporting(true);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Impossible d'ouvrir la fenêtre d'impression");
      setIsExporting(false);
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${document?.titre || "Document"}</title>
        <style>
          @page { size: A4; margin: ${MARGIN_MM}mm; }
          * { box-sizing: border-box; }
          body {
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1a1a1a;
            margin: 0;
            padding: 0;
          }
          .header {
            border-bottom: 2px solid #ddd;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header img {
            max-width: 200px;
            height: auto;
          }
          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-top: 1px solid #ddd;
            padding-top: 10px;
            font-size: 9pt;
            color: #666;
          }
          img { max-width: 100%; height: auto; }
          table { border-collapse: collapse; width: 100%; margin: 15px 0; }
          td, th { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #f5f5f5; font-weight: 700; }
          h1 { font-size: 18pt; font-weight: 700; color: #111; margin: 0 0 16px 0; text-transform: uppercase; }
          h2 { font-size: 13pt; font-weight: 700; color: #222; margin: 24px 0 12px 0; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; }
          h3, h4 { font-size: 11pt; font-weight: 700; color: #333; margin: 16px 0 8px 0; }
          p { margin: 0 0 10px 0; text-align: justify; }
          ul, ol { margin: 10px 0; padding-left: 25px; }
          li { margin: 4px 0; }
          strong { font-weight: 700; }
          em { font-style: italic; }
          hr { border: none; border-top: 2px solid #333; margin: 20px 0; }
          .module-section {
            background: #f9f9f9;
            border-left: 3px solid #4277FF;
            padding: 12px 16px;
            margin: 12px 0;
          }
        </style>
      </head>
      <body>
        ${headerContent ? `<div class="header">${headerContent}</div>` : ""}
        <div class="content">${bodyContent}</div>
        ${footerContent ? `<div class="footer">${footerContent}</div>` : ""}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); }
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    setIsExporting(false);
  }, [document, onExportPDF, editedHeader, previewContent, editedFooter]);

  // Export Word - utilise le contenu édité (preview) pour correspondre exactement à l'aperçu
  const handleExportWord = useCallback(() => {
    if (onExportWord) {
      onExportWord();
      return;
    }

    // Utiliser le contenu édité s'il existe, sinon le contenu original
    const headerContent = editedHeader || document?.renderedHeader || "";
    const bodyContent = previewContent || document?.renderedContent || "";
    const footerContent = editedFooter || document?.renderedFooter || "";

    setIsExporting(true);
    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
      <head>
        <meta charset="utf-8">
        <title>${document?.titre || "Document"}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page { size: A4; margin: 2cm; }
          body {
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1a1a1a;
          }
          .header {
            border-bottom: 2px solid #ddd;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .header img {
            max-width: 200px;
            height: auto;
          }
          .footer {
            border-top: 1px solid #ccc;
            padding-top: 10px;
            margin-top: 20px;
            font-size: 9pt;
            color: #666;
          }
          img { max-width: 100%; height: auto; }
          table { border-collapse: collapse; width: 100%; margin: 15px 0; }
          td, th { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #f5f5f5; font-weight: bold; }
          h1 { font-size: 18pt; font-weight: bold; color: #111; margin: 0 0 16px 0; text-transform: uppercase; }
          h2 { font-size: 13pt; font-weight: bold; color: #222; margin: 24px 0 12px 0; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; }
          h3, h4 { font-size: 11pt; font-weight: bold; color: #333; margin: 16px 0 8px 0; }
          p { margin: 0 0 10px 0; text-align: justify; }
          ul, ol { margin: 10px 0; padding-left: 25px; }
          li { margin: 4px 0; }
          strong { font-weight: bold; }
          em { font-style: italic; }
          hr { border: none; border-top: 2px solid #333; margin: 20px 0; }
          .module-section {
            background: #f9f9f9;
            border-left: 3px solid #4277FF;
            padding: 12px 16px;
            margin: 12px 0;
          }
        </style>
      </head>
      <body>
        ${headerContent ? `<div class="header">${headerContent}</div>` : ""}
        <div class="content">${bodyContent}</div>
        ${footerContent ? `<div class="footer">${footerContent}</div>` : ""}
      </body>
      </html>
    `;

    const blob = new Blob([wordContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${(document?.titre || "document").replace(/\s+/g, "_")}.doc`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsExporting(false);
  }, [document, onExportWord, editedHeader, previewContent, editedFooter]);

  // Label du type de document
  const documentTypeLabel = useMemo(() => {
    const labels: Record<string, string> = {
      FICHE_PEDAGOGIQUE: "Programme de formation",
      PROGRAMME_FORMATION: "Programme de formation",
      CONVENTION: "Convention de formation",
      CONTRAT_FORMATION: "Contrat de formation",
      CONVOCATION: "Convocation",
      ATTESTATION_PRESENCE: "Feuille d'émargement",
      ATTESTATION_FIN: "Attestation de fin de formation",
      EVALUATION_CHAUD: "Évaluation à chaud",
      EVALUATION_FROID: "Évaluation à froid",
      REGLEMENT_INTERIEUR: "Règlement intérieur",
      CERTIFICAT: "Certificat",
      DEVIS: "Devis",
      FACTURE: "Facture",
    };
    return labels[document?.type || ""] || document?.type || "Document";
  }, [document?.type]);

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[95vw] h-[95vh] max-w-7xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-600 dark:text-brand-400">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {document.titre}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {documentTypeLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Edit/Preview */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mr-2">
              <button
                onClick={handleSwitchToPreview}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  !isEditMode
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                Aperçu
              </button>
              <button
                onClick={() => setIsEditMode(true)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  isEditMode
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                Éditer
              </button>
            </div>

            {/* Export PDF */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M12 18v-6M9 15l3 3 3-3" />
              </svg>
              PDF
            </button>

            {/* Export Word */}
            <button
              onClick={handleExportWord}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M9 13h6M9 17h6" />
              </svg>
              Word
            </button>

            {/* Sauvegarder (si en mode edit) */}
            {isEditMode && onSave && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                )}
                Sauvegarder
              </button>
            )}

            {/* Fermer */}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-colors ml-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto overflow-x-visible">
          {isEditMode ? (
            /* Mode Edition */
            <div className="h-full flex flex-col">
              {/* Onglets Header / Contenu / Footer */}
              <div className="flex-shrink-0 flex items-center gap-1 px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <button
                  onClick={() => setEditingSection("header")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    editingSection === "header"
                      ? "bg-brand-500 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  En-tête
                </button>
                <button
                  onClick={() => setEditingSection("content")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    editingSection === "content"
                      ? "bg-brand-500 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  Contenu principal
                </button>
                <button
                  onClick={() => setEditingSection("footer")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    editingSection === "footer"
                      ? "bg-brand-500 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  Pied de page
                </button>
              </div>

              {/* Zone d'édition */}
              <div className="flex-1 p-6 overflow-auto">
                <div className="max-w-4xl mx-auto">
                  {editingSection === "header" && (
                    <div>
                      <p className="text-sm text-gray-500 mb-3">En-tête du document (logo, coordonnées de l'organisme...)</p>
                      <DocumentEditor
                        initialContent={editedHeaderJson}
                        documentType={document.type as DocumentType}
                        onChange={setEditedHeaderJson}
                        placeholder="Ajoutez un logo, les coordonnées de votre organisme..."
                        minHeight="150px"
                        showToolbar={true}
                      />
                    </div>
                  )}
                  {editingSection === "content" && (
                    <DocumentEditor
                      initialContent={editedContent}
                      documentType={document.type as DocumentType}
                      onChange={setEditedContent}
                      placeholder="Éditez le contenu du document..."
                      minHeight="500px"
                      showToolbar={true}
                    />
                  )}
                  {editingSection === "footer" && (
                    <div>
                      <p className="text-sm text-gray-500 mb-3">Pied de page (numéro de page, mentions légales...)</p>
                      <DocumentEditor
                        initialContent={editedFooterJson}
                        documentType={document.type as DocumentType}
                        onChange={setEditedFooterJson}
                        placeholder="Ajoutez les mentions légales, numéro de page..."
                        minHeight="100px"
                        showToolbar={true}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Mode Preview - Style A4 avec pages séparées */
            <div
              ref={scrollContainerRef}
              className="h-full overflow-auto bg-gray-200 dark:bg-gray-950 py-8"
              onScroll={(e) => {
                // Calculer la page courante basée sur le scroll
                const scrollTop = e.currentTarget.scrollTop;
                const pageHeight = A4_HEIGHT_PX + 32; // hauteur de page + gap
                const page = Math.floor(scrollTop / pageHeight) + 1;
                if (page !== currentPage && page >= 1 && page <= totalPages) {
                  setCurrentPage(page);
                }
              }}
            >
              <div className="flex flex-col items-center gap-8">
                {/* Pages A4 */}
                <div
                  ref={contentRef}
                  className="document-pages"
                  style={{ width: `${A4_WIDTH_PX}px` }}
                >
                  {/* Styles pour le document */}
                  <style dangerouslySetInnerHTML={{ __html: `
                    .document-page {
                      background: white;
                      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                      position: relative;
                      page-break-after: always;
                      break-after: page;
                    }
                    .document-preview {
                      font-family: 'Georgia', 'Times New Roman', serif;
                      font-size: 11pt;
                      line-height: 1.6;
                      color: #1a1a1a;
                    }
                    .document-preview h1 {
                      font-size: 18pt;
                      font-weight: 700;
                      color: #111;
                      margin: 0 0 16px 0;
                      text-transform: uppercase;
                      letter-spacing: 1px;
                    }
                    .document-preview h2 {
                      font-size: 13pt;
                      font-weight: 700;
                      color: #222;
                      margin: 24px 0 12px 0;
                      border-bottom: 1px solid #e5e5e5;
                      padding-bottom: 6px;
                    }
                    .document-preview h3, .document-preview h4 {
                      font-size: 11pt;
                      font-weight: 700;
                      color: #333;
                      margin: 16px 0 8px 0;
                    }
                    .document-preview p {
                      margin: 0 0 10px 0;
                      text-align: justify;
                    }
                    .document-preview p[style*="text-align: center"] {
                      text-align: center !important;
                    }
                    .document-preview hr {
                      border: none;
                      border-top: 2px solid #333;
                      margin: 20px 0;
                    }
                    .document-preview ul, .document-preview ol {
                      margin: 10px 0;
                      padding-left: 24px;
                    }
                    .document-preview li {
                      margin: 4px 0;
                    }
                    .document-preview ul li::marker {
                      color: #4277FF;
                    }
                    .document-preview strong {
                      font-weight: 700;
                    }
                    .document-preview em {
                      font-style: italic;
                    }
                    .document-preview .template-list {
                      list-style: disc;
                      margin: 8px 0;
                      padding-left: 24px;
                    }
                    .document-preview .module-section {
                      background: #f9f9f9;
                      border-left: 3px solid #4277FF;
                      padding: 12px 16px;
                      margin: 12px 0;
                      border-radius: 0 4px 4px 0;
                    }
                    .document-preview .module-section h4 {
                      margin-top: 0;
                      color: #4277FF;
                    }
                    .document-preview table {
                      width: 100%;
                      border-collapse: collapse;
                      margin: 16px 0;
                    }
                    .document-preview td, .document-preview th {
                      border: 1px solid #ddd;
                      padding: 8px 12px;
                      text-align: left;
                    }
                    .document-preview th {
                      background: #f5f5f5;
                      font-weight: 700;
                    }
                    .document-preview img {
                      max-width: 100%;
                      height: auto;
                    }
                    .page-footer {
                      display: flex;
                      align-items: center;
                      justify-content: space-between;
                      border-top: 1px solid #ddd;
                      padding-top: 12px;
                      margin-top: auto;
                      font-size: 9pt;
                      color: #666;
                    }
                  ` }} />

                  {/* Génération des pages A4 séparées */}
                  {Array.from({ length: totalPages }, (_, pageIndex) => (
                    <div
                      key={pageIndex}
                      className="document-page document-preview"
                      style={{
                        width: `${A4_WIDTH_PX}px`,
                        height: `${A4_HEIGHT_PX}px`,
                        padding: `${MARGIN_MM * MM_TO_PX}px`,
                        display: "flex",
                        flexDirection: "column",
                        marginBottom: pageIndex < totalPages - 1 ? "32px" : "0",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {/* Header - seulement sur la première page */}
                      {pageIndex === 0 && (editedHeader || document.renderedHeader) && (
                        <div
                          className="border-b-2 border-gray-300 pb-4 mb-6 text-sm text-gray-600 flex-shrink-0"
                          dangerouslySetInnerHTML={{ __html: editedHeader || document.renderedHeader || "" }}
                        />
                      )}

                      {/* Contenu principal avec décalage pour chaque page */}
                      <div
                        className="document-content flex-1 overflow-hidden"
                        style={{
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: pageIndex === 0 ? 0 : `-${pageIndex * (A4_HEIGHT_PX - (MARGIN_MM * 2 * MM_TO_PX) - 100)}px`,
                            left: 0,
                            right: 0,
                          }}
                          dangerouslySetInnerHTML={{ __html: previewContent || document.renderedContent }}
                        />
                      </div>

                      {/* Footer avec numéro de page */}
                      <div className="page-footer flex-shrink-0">
                        <div
                          dangerouslySetInnerHTML={{ __html: editedFooter || document.renderedFooter || "" }}
                        />
                        <div className="text-right font-medium">
                          Page {pageIndex + 1} / {totalPages}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Indicateur de page fixe en bas */}
              <div className="fixed bottom-6 right-6 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center gap-3 z-10">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {currentPage}
                </span>
                <span className="text-sm text-gray-400 dark:text-gray-500">/</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {totalPages}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
