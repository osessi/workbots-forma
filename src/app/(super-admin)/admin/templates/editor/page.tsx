"use client";
// ===========================================
// PAGE EDITEUR DE TEMPLATE - STYLE WORD
// ===========================================

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { DocumentType, ClientType } from "@/lib/templates/types";
import { DOCUMENT_TYPES, generateTestContext, renderTemplate, DynamicVariableContext } from "@/lib/templates";

// Import dynamique de l'editeur (client-side only)
const DocumentEditor = dynamic(
  () => import("@/components/editor/DocumentEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-white dark:bg-gray-900 rounded-lg">
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

// Mapping entre types de document Prisma et types internes
const PRISMA_TO_INTERNAL_TYPE: Record<string, DocumentType> = {
  FICHE_PEDAGOGIQUE: "fiche_pedagogique",
  CONVENTION: "convention_formation",
  CONVOCATION: "convocation",
  ATTESTATION_PRESENCE: "attestation_presence",
  ATTESTATION_FIN: "attestation_fin_formation",
  EVALUATION_CHAUD: "evaluation_chaud",
  EVALUATION_FROID: "evaluation_froid",
  REGLEMENT_INTERIEUR: "reglement_interieur",
  CERTIFICAT: "certificat",
  AUTRE: "autre",
};

const INTERNAL_TO_PRISMA_TYPE: Record<string, string> = {
  fiche_pedagogique: "FICHE_PEDAGOGIQUE",
  convention_formation: "CONVENTION",
  convocation: "CONVOCATION",
  attestation_presence: "ATTESTATION_PRESENCE",
  attestation_fin_formation: "ATTESTATION_FIN",
  evaluation_chaud: "EVALUATION_CHAUD",
  evaluation_froid: "EVALUATION_FROID",
  reglement_interieur: "REGLEMENT_INTERIEUR",
  certificat: "CERTIFICAT",
  autre: "AUTRE",
};

// Dimensions A4 en mm converties en pixels (96 DPI)
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MM_TO_PX = 96 / 25.4;
const A4_WIDTH_PX = Math.round(A4_WIDTH_MM * MM_TO_PX);
const A4_HEIGHT_PX = Math.round(A4_HEIGHT_MM * MM_TO_PX);

// Marges en mm
const MARGIN_TOP_MM = 20;
const MARGIN_BOTTOM_MM = 20;
const MARGIN_LEFT_MM = 25;
const MARGIN_RIGHT_MM = 25;
const HEADER_HEIGHT_MM = 30;

export default function TemplateEditorPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id");

  // Etat du template
  const [templateName, setTemplateName] = useState("Nouveau template");
  const [documentType, setDocumentType] = useState<DocumentType>("convention_formation");
  const [clientType, setClientType] = useState<ClientType>("entreprise");

  // Contenus actuels - utiliser useState pour declencher les re-renders du preview
  const [currentContent, setCurrentContent] = useState("");
  const [currentHeader, setCurrentHeader] = useState("");
  const [currentFooter, setCurrentFooter] = useState("");

  // Contenus initiaux pour le chargement des editeurs (ne change pas apres chargement)
  const [initialContent, setInitialContent] = useState("");
  const [initialHeader, setInitialHeader] = useState("");
  const [initialFooter, setInitialFooter] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);

  // UI state
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!templateId);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Contexte de test avec le type de client selectionne
  const testContext = useMemo(() => {
    const baseContext = generateTestContext();
    return {
      ...baseContext,
      client: { type: clientType },
      // Ajouter les donnees d'independant si le type est independant
      independant: clientType === "independant" ? {
        civilite: "M.",
        nom: "DURAND",
        prenom: "Jean",
        nom_complet: "Jean DURAND",
        siret: "123 456 789 00012",
        adresse: "10 rue du Commerce",
        code_postal: "75011",
        ville: "Paris",
        adresse_complete: "10 rue du Commerce, 75011 Paris",
        email: "jean.durand@email.com",
        telephone: "06 98 76 54 32",
        activite: "Consultant informatique",
      } : undefined,
      // Ajouter les donnees de financeur si le type est financeur
      financeur: clientType === "financeur" ? {
        nom: "OPCO Atlas",
        siret: "852 963 741 00025",
        adresse: "30 rue de la Solidarite",
        code_postal: "75015",
        ville: "Paris",
        adresse_complete: "30 rue de la Solidarite, 75015 Paris",
        telephone: "01 45 67 89 00",
        email: "contact@opco-atlas.fr",
        representant: "Marie FINANCE",
        fonction_representant: "Charge de mission",
        numero_dossier: "DOSSIER-2025-001234",
      } : undefined,
    };
  }, [clientType]);

  // Contexte dynamique pour les variables numerotees (test avec 3 journees et 5 salaries)
  const dynamicContext: DynamicVariableContext = useMemo(() => ({
    nombreJournees: 3,
    nombreSalaries: 5,
  }), []);

  // Charger le template existant
  useEffect(() => {
    if (templateId) {
      fetchTemplate(templateId);
    } else {
      setDataLoaded(true);
    }
  }, [templateId]);

  const fetchTemplate = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/templates/${id}`);
      if (response.ok) {
        const template = await response.json();
        setTemplateName(template.name || "Sans nom");

        const internalType = template.documentType
          ? PRISMA_TO_INTERNAL_TYPE[template.documentType] || "convention_formation"
          : "convention_formation";
        setDocumentType(internalType);

        // Contenu principal
        if (template.content) {
          const str = typeof template.content === "string"
            ? template.content
            : JSON.stringify(template.content);
          setInitialContent(str);
          setCurrentContent(str);
        }

        // Header
        if (template.headerContent) {
          const str = typeof template.headerContent === "string"
            ? template.headerContent
            : JSON.stringify(template.headerContent);
          setInitialHeader(str);
          setCurrentHeader(str);
        }

        // Footer
        if (template.footerContent) {
          const str = typeof template.footerContent === "string"
            ? template.footerContent
            : JSON.stringify(template.footerContent);
          setInitialFooter(str);
          setCurrentFooter(str);
        }

        setDataLoaded(true);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers de changement - mettre a jour les states
  const handleContentChange = useCallback((newContent: string) => {
    setCurrentContent(newContent);
  }, []);

  const handleHeaderChange = useCallback((newContent: string) => {
    setCurrentHeader(newContent);
  }, []);

  const handleFooterChange = useCallback((newContent: string) => {
    setCurrentFooter(newContent);
  }, []);

  // Sauvegarder le template
  const handleSaveTemplate = async () => {
    setIsSaving(true);
    try {
      const content = currentContent;
      const headerContent = currentHeader;
      const footerContent = currentFooter;

      let contentToSave: Record<string, unknown> = {};
      try {
        contentToSave = content ? JSON.parse(content) : {};
      } catch {
        contentToSave = { raw: content };
      }

      let headerToSave: Record<string, unknown> | null = null;
      if (headerContent) {
        try {
          headerToSave = JSON.parse(headerContent);
        } catch {
          headerToSave = { raw: headerContent };
        }
      }

      let footerToSave: Record<string, unknown> | null = null;
      if (footerContent) {
        try {
          footerToSave = JSON.parse(footerContent);
        } catch {
          footerToSave = { raw: footerContent };
        }
      }

      const allContent = content + (headerContent || "") + (footerContent || "");
      const variableMatches = allContent.match(/\{\{([^}]+)\}\}/g) || [];
      const variables = [...new Set(variableMatches.map((m: string) => m.replace(/\{\{|\}\}/g, "").trim()))];

      const url = templateId
        ? `/api/admin/templates/${templateId}`
        : "/api/admin/templates";
      const method = templateId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          documentType: INTERNAL_TO_PRISMA_TYPE[documentType] || "CONVENTION",
          content: contentToSave,
          headerContent: headerToSave,
          footerContent: footerToSave,
          variables,
        }),
      });

      if (response.ok) {
        setLastSaved(new Date());
        const savedTemplate = await response.json();

        // Mettre a jour les contenus initiaux apres sauvegarde
        setInitialContent(content);
        setInitialHeader(headerContent);
        setInitialFooter(footerContent);

        if (!templateId && savedTemplate.id) {
          window.history.replaceState({}, "", `/admin/templates/editor?id=${savedTemplate.id}`);
        }
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };


  // Render HTML pour preview
  const renderPreviewHtml = useCallback((contentStr: string) => {
    if (!contentStr) return "";
    try {
      return renderTemplate(contentStr, testContext, { previewMode: false });
    } catch {
      return contentStr;
    }
  }, [testContext]);

  // HTML rendu pour le preview (memo pour performance)
  const previewHeaderHtml = useMemo(() => renderPreviewHtml(currentHeader), [currentHeader, renderPreviewHtml]);
  const previewContentHtml = useMemo(() => renderPreviewHtml(currentContent), [currentContent, renderPreviewHtml]);
  const previewFooterHtml = useMemo(() => renderPreviewHtml(currentFooter), [currentFooter, renderPreviewHtml]);

  // Références pour mesurer le contenu
  const measureRef = useRef<HTMLDivElement>(null);
  const [measuredPages, setMeasuredPages] = useState<string[]>([""]);

  // Diviser le contenu en sections basées sur les sauts de page manuels
  const manualSections = useMemo(() => {
    if (!previewContentHtml) return [""];

    // Utiliser un marqueur temporaire pour diviser
    const separator = "<!--PAGE_BREAK_SEPARATOR-->";
    const htmlWithSeparator = previewContentHtml
      .replace(/<div[^>]*class="[^"]*page-break[^"]*"[^>]*><\/div>/gi, separator)
      .replace(/<div[^>]*class="[^"]*page-break[^"]*"[^>]*>[^<]*<\/div>/gi, separator)
      .replace(/<div[^>]*data-type="page-break"[^>]*><\/div>/gi, separator)
      .replace(/<div[^>]*data-type="page-break"[^>]*>[^<]*<\/div>/gi, separator);

    const sections = htmlWithSeparator.split(separator).filter(section => section.trim() !== "");
    return sections.length > 0 ? sections : [""];
  }, [previewContentHtml]);

  // Hauteur disponible pour le contenu sur une page (en pixels)
  const contentHeightPx = useMemo(() => {
    const marginTop = MARGIN_TOP_MM * MM_TO_PX;
    const marginBottom = MARGIN_BOTTOM_MM * MM_TO_PX;
    const headerHeight = currentHeader ? HEADER_HEIGHT_MM * MM_TO_PX + 16 : 0; // +16 pour le padding
    const footerHeight = 40; // Hauteur estimée du footer avec numéro de page
    return A4_HEIGHT_PX - marginTop - marginBottom - headerHeight - footerHeight;
  }, [currentHeader]);

  // Mesurer et paginer le contenu automatiquement
  useEffect(() => {
    if (!isPreviewMode || !measureRef.current) return;

    const paginateContent = async () => {
      const allPages: string[] = [];

      for (let sectionIndex = 0; sectionIndex < manualSections.length; sectionIndex++) {
        const sectionHtml = manualSections[sectionIndex];

        // Créer un conteneur temporaire pour mesurer
        const tempContainer = document.createElement("div");
        tempContainer.style.cssText = `
          position: absolute;
          visibility: hidden;
          width: ${A4_WIDTH_PX - (MARGIN_LEFT_MM + MARGIN_RIGHT_MM) * MM_TO_PX}px;
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: 11pt;
          line-height: 1.6;
        `;
        tempContainer.innerHTML = sectionHtml;
        document.body.appendChild(tempContainer);

        const totalHeight = tempContainer.scrollHeight;

        if (totalHeight <= contentHeightPx) {
          // La section tient sur une page
          allPages.push(sectionHtml);
        } else {
          // La section doit être divisée en plusieurs pages
          // On divise par éléments de niveau supérieur (paragraphes, divs, etc.)
          const children = Array.from(tempContainer.children);
          let currentPageHtml = "";
          let currentHeight = 0;

          for (const child of children) {
            const childHeight = (child as HTMLElement).offsetHeight || 0;

            if (currentHeight + childHeight > contentHeightPx && currentPageHtml) {
              // Sauvegarder la page courante et commencer une nouvelle
              allPages.push(currentPageHtml);
              currentPageHtml = (child as HTMLElement).outerHTML;
              currentHeight = childHeight;
            } else {
              currentPageHtml += (child as HTMLElement).outerHTML;
              currentHeight += childHeight;
            }
          }

          // Ajouter la dernière page de cette section
          if (currentPageHtml) {
            allPages.push(currentPageHtml);
          }
        }

        document.body.removeChild(tempContainer);
      }

      setMeasuredPages(allPages.length > 0 ? allPages : [""]);
    };

    // Petit délai pour s'assurer que le DOM est prêt
    const timer = setTimeout(paginateContent, 100);
    return () => clearTimeout(timer);
  }, [isPreviewMode, manualSections, contentHeightPx]);

  // Mettre à jour le nombre total de pages
  useEffect(() => {
    setTotalPages(Math.max(1, measuredPages.length));
  }, [measuredPages]);

  // Scroll handler pour mettre à jour la page courante
  const handlePreviewScroll = useCallback(() => {
    if (previewContainerRef.current && totalPages > 1) {
      const scrollTop = previewContainerRef.current.scrollTop;
      const pageHeight = A4_HEIGHT_PX + 32; // hauteur de page + gap
      const currentPageNum = Math.max(1, Math.min(totalPages, Math.floor(scrollTop / pageHeight) + 1));
      setCurrentPage(currentPageNum);
    }
  }, [totalPages]);

  // Export PDF (utilise l'API print du navigateur)
  const handleExportPDF = useCallback(() => {
    setIsExporting(true);

    // Creer une fenetre d'impression avec le contenu
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Impossible d'ouvrir la fenetre d'impression. Verifiez les popups.");
      setIsExporting(false);
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${templateName}</title>
        <style>
          @page {
            size: A4;
            margin: ${MARGIN_TOP_MM}mm ${MARGIN_RIGHT_MM}mm ${MARGIN_BOTTOM_MM}mm ${MARGIN_LEFT_MM}mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #333;
          }
          .header {
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-top: 1px solid #ddd;
            padding-top: 10px;
            font-size: 10pt;
            color: #666;
          }
          .content {
            min-height: calc(100vh - 200px);
          }
          img { max-width: 100%; height: auto; }
          table { border-collapse: collapse; width: 100%; }
          td, th { border: 1px solid #ddd; padding: 8px; }
          /* Styles pour les paragraphes - préserver les espacements */
          p { margin: 0; padding: 0; min-height: 1.2em; }
          p:empty { min-height: 1.2em; }
          h1 { font-size: 18pt; font-weight: 700; margin: 0 0 16px 0; }
          h2 { font-size: 14pt; font-weight: 700; margin: 20px 0 10px 0; }
          h3, h4 { font-size: 12pt; font-weight: 700; margin: 16px 0 8px 0; }
          /* Saut de page pour l'impression */
          .page-break {
            display: block;
            page-break-after: always;
            break-after: page;
            height: 0;
            margin: 0;
            padding: 0;
            border: none;
            visibility: hidden;
          }
          @media print {
            .no-print { display: none; }
            .page-break {
              page-break-after: always !important;
              break-after: page !important;
            }
          }
        </style>
      </head>
      <body>
        ${previewHeaderHtml ? `<div class="header">${previewHeaderHtml}</div>` : ""}
        <div class="content">${previewContentHtml}</div>
        ${previewFooterHtml ? `<div class="footer">${previewFooterHtml}</div>` : ""}
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
  }, [templateName, previewHeaderHtml, previewContentHtml, previewFooterHtml]);

  // Export Word (HTML avec extension .doc)
  const handleExportWord = useCallback(() => {
    setIsExporting(true);

    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${templateName}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12pt; }
          .header { border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
          .footer { border-top: 1px solid #ccc; padding-top: 10px; margin-top: 20px; font-size: 10pt; }
          img { max-width: 100%; }
          table { border-collapse: collapse; width: 100%; }
          td, th { border: 1px solid #ccc; padding: 8px; }
          /* Styles pour les paragraphes - préserver les espacements */
          p { margin: 0; padding: 0; min-height: 1.2em; }
          p:empty { min-height: 1.2em; }
          h1 { font-size: 18pt; font-weight: bold; margin: 0 0 16px 0; }
          h2 { font-size: 14pt; font-weight: bold; margin: 20px 0 10px 0; }
          h3, h4 { font-size: 12pt; font-weight: bold; margin: 16px 0 8px 0; }
        </style>
      </head>
      <body>
        ${previewHeaderHtml ? `<div class="header">${previewHeaderHtml}</div>` : ""}
        <div class="content">${previewContentHtml}</div>
        ${previewFooterHtml ? `<div class="footer">${previewFooterHtml}</div>` : ""}
      </body>
      </html>
    `;

    const blob = new Blob([wordContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateName.replace(/\s+/g, "_")}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsExporting(false);
  }, [templateName, previewHeaderHtml, previewContentHtml, previewFooterHtml]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-brand-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span className="text-gray-500 dark:text-gray-400">Chargement du template...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-100 dark:bg-gray-950 -m-4 sm:-m-6 lg:-m-8 min-h-[calc(100vh-3.5rem)] lg:min-h-screen">
      {/* Header fixe */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/templates"
              className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10H5M5 10L10 5M5 10L10 15" />
              </svg>
            </Link>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="text-lg font-semibold bg-transparent border-none text-gray-900 dark:text-white focus:outline-none focus:ring-0"
                placeholder="Nom du template"
              />
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:border-brand-500"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.type} value={type.type}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selecteur de type de client pour le preview */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Type client:</span>
            <select
              value={clientType}
              onChange={(e) => setClientType(e.target.value as ClientType)}
              className="px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-600 rounded text-purple-700 dark:text-purple-300 focus:outline-none focus:border-purple-500"
            >
              <option value="entreprise">Entreprise</option>
              <option value="particulier">Particulier</option>
              <option value="independant">Independant</option>
              <option value="salarie">Salarie</option>
              <option value="financeur">Financeur (OPCO)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                {lastSaved.toLocaleTimeString()}
              </span>
            )}

            {/* Toggle Mode */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setIsPreviewMode(false)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  !isPreviewMode
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                Editer
              </button>
              <button
                onClick={() => setIsPreviewMode(true)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  isPreviewMode
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                Apercu
              </button>
            </div>

            {/* Export buttons */}
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Exporter en PDF"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M9 15v-2h6v2" />
                  <path d="M12 18v-5" />
                </svg>
              </button>
              <button
                onClick={handleExportWord}
                disabled={isExporting}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Exporter en Word"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M9 13h6" />
                  <path d="M9 17h6" />
                </svg>
              </button>
            </div>

            <button
              onClick={handleSaveTemplate}
              disabled={isSaving}
              className="px-4 py-2 text-white bg-brand-500 hover:bg-brand-600 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 ml-2"
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
          </div>
        </div>
      </div>

      {/* Zone principale - Les deux modes sont TOUJOURS rendus, on utilise CSS pour cacher */}
      <div className="flex-1 overflow-hidden relative" style={{ height: "calc(100vh - 80px)" }}>
        {/* MODE PREVIEW - toujours monte mais cache si pas en preview */}
        <div
          ref={previewContainerRef}
          onScroll={handlePreviewScroll}
          className={`absolute inset-0 overflow-auto bg-gray-300 dark:bg-gray-900 py-8 transition-opacity duration-200 ${
            isPreviewMode ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
          }`}
        >
          {/* Styles personnalises pour le preview document */}
          <style dangerouslySetInnerHTML={{ __html: `
            .document-preview-content {
              font-family: 'Georgia', 'Times New Roman', serif;
              font-size: 11pt;
              line-height: 1.6;
              color: #1a1a1a;
            }
            .document-preview-content h1 {
              font-size: 18pt;
              font-weight: 700;
              color: #111;
              margin: 0 0 16px 0;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .document-preview-content h2 {
              font-size: 13pt;
              font-weight: 700;
              color: #222;
              margin: 24px 0 12px 0;
              border-bottom: 1px solid #e5e5e5;
              padding-bottom: 6px;
            }
            .document-preview-content h3, .document-preview-content h4 {
              font-size: 11pt;
              font-weight: 700;
              color: #333;
              margin: 16px 0 8px 0;
            }
            .document-preview-content p {
              margin: 0;
              padding: 0;
              min-height: 1.2em;
              text-align: justify;
            }
            .document-preview-content p:not(:last-child) {
              margin-bottom: 0;
            }
            .document-preview-content p[style*="text-align: center"] {
              text-align: center !important;
            }
            /* Préserver les espacements/sauts de ligne */
            .document-preview-content p:empty,
            .document-preview-content p:only-child:empty {
              min-height: 1.2em;
            }
            .document-preview-content hr {
              border: none;
              border-top: 2px solid #333;
              margin: 20px 0;
            }
            .document-preview-content ul, .document-preview-content ol {
              margin: 10px 0;
              padding-left: 24px;
            }
            .document-preview-content li {
              margin: 4px 0;
            }
            .document-preview-content ul li::marker {
              color: #4277FF;
            }
            .document-preview-content strong {
              font-weight: 700;
            }
            .document-preview-content em {
              font-style: italic;
            }
            .document-preview-content .template-list {
              list-style: disc;
              margin: 8px 0;
              padding-left: 24px;
            }
            .document-preview-content .module-section {
              background: #f9f9f9;
              border-left: 3px solid #4277FF;
              padding: 12px 16px;
              margin: 12px 0;
              border-radius: 0 4px 4px 0;
            }
            .document-preview-content .module-section h4 {
              margin-top: 0;
              color: #4277FF;
            }
            .document-preview-content table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
            }
            .document-preview-content td, .document-preview-content th {
              border: 1px solid #ddd;
              padding: 8px 12px;
              text-align: left;
            }
            .document-preview-content th {
              background: #f5f5f5;
              font-weight: 700;
            }
            .document-preview-content img {
              max-width: 100%;
              height: auto;
            }
            /* Saut de page dans le preview */
            .document-preview-content .page-break {
              display: block;
              width: 100%;
              height: 40px;
              margin: 20px 0;
              border: none;
              background: linear-gradient(to bottom, transparent 0%, transparent 40%, #e5e7eb 40%, #e5e7eb 60%, transparent 60%, transparent 100%);
              position: relative;
            }
            .document-preview-content .page-break::before {
              content: "SAUT DE PAGE";
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              padding: 4px 12px;
              background: #6366f1;
              color: white;
              font-size: 8pt;
              font-weight: 600;
              border-radius: 12px;
              white-space: nowrap;
            }
            .document-header-content {
              font-family: 'Georgia', 'Times New Roman', serif;
              font-size: 10pt;
              color: #444;
            }
            .document-header-content img {
              max-height: 60px;
              width: auto;
              max-width: 180px;
            }
            .document-footer-content {
              font-family: 'Georgia', 'Times New Roman', serif;
              font-size: 9pt;
              color: #666;
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

          {/* Pages A4 avec pagination automatique + sauts de page manuels */}
          <div ref={measureRef} className="flex flex-col items-center gap-8 pb-8">
            {measuredPages.map((pageContent: string, pageIndex: number) => (
              <div
                key={pageIndex}
                className="bg-white shadow-2xl document-preview-content"
                style={{
                  width: `${A4_WIDTH_PX}px`,
                  minHeight: `${A4_HEIGHT_PX}px`,
                  padding: `${MARGIN_TOP_MM * MM_TO_PX}px ${MARGIN_RIGHT_MM * MM_TO_PX}px ${MARGIN_BOTTOM_MM * MM_TO_PX}px ${MARGIN_LEFT_MM * MM_TO_PX}px`,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {/* Header - seulement sur la première page */}
                {pageIndex === 0 && currentHeader && (
                  <div
                    className="border-b-2 border-gray-300 pb-3 mb-4 flex-shrink-0"
                    style={{ minHeight: `${HEADER_HEIGHT_MM * MM_TO_PX}px` }}
                  >
                    <div
                      className="document-header-content"
                      dangerouslySetInnerHTML={{ __html: previewHeaderHtml }}
                    />
                  </div>
                )}

                {/* Contenu de cette page spécifique */}
                <div
                  className="flex-1 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: pageContent }}
                />

                {/* Footer avec numéro de page */}
                <div className="page-footer flex-shrink-0">
                  <div
                    className="document-footer-content"
                    dangerouslySetInnerHTML={{ __html: previewFooterHtml }}
                  />
                  <div className="text-right font-medium text-gray-500">
                    Page {pageIndex + 1} / {totalPages}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Indicateur de page fixe */}
          {isPreviewMode && (
            <div className="fixed bottom-6 right-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg px-4 py-2 text-sm z-50 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
              <span className="text-gray-500">Page</span>
              <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-500">{totalPages}</span>
            </div>
          )}
        </div>

        {/* MODE EDITION - toujours monte mais cache si en preview */}
        <div className={`absolute inset-0 overflow-auto p-6 transition-opacity duration-200 ${
          isPreviewMode ? "opacity-0 pointer-events-none z-0" : "opacity-100 z-10"
        }`}>
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header Editor */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">En-tete (Header)</span>
                <span className="text-xs text-gray-400 ml-2">Logo, coordonnees...</span>
              </div>
              {dataLoaded && (
                <div className="p-4">
                  <DocumentEditor
                    key="header-editor"
                    initialContent={initialHeader}
                    documentType={documentType}
                    onChange={handleHeaderChange}
                    placeholder="En-tete du document..."
                    minHeight="100px"
                    showToolbar={true}
                    dynamicContext={dynamicContext}
                  />
                </div>
              )}
            </div>

            {/* Content Editor */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Contenu principal</span>
              </div>
              {dataLoaded && (
                <div className="p-4">
                  <DocumentEditor
                    key="content-editor"
                    initialContent={initialContent}
                    documentType={documentType}
                    onChange={handleContentChange}
                    placeholder="Redigez le contenu de votre template..."
                    minHeight="400px"
                    showToolbar={true}
                    dynamicContext={dynamicContext}
                  />
                </div>
              )}
            </div>

            {/* Footer Editor */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pied de page (Footer)</span>
                <span className="text-xs text-gray-400 ml-2">Mentions legales...</span>
              </div>
              {dataLoaded && (
                <div className="p-4">
                  <DocumentEditor
                    key="footer-editor"
                    initialContent={initialFooter}
                    documentType={documentType}
                    onChange={handleFooterChange}
                    placeholder="Pied de page..."
                    minHeight="80px"
                    showToolbar={true}
                    dynamicContext={dynamicContext}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
