"use client";
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  FileText,
  ChevronLeft,
  Download,
  Check,
  FileSignature,
  Mail,
  ClipboardList,
  Award,
  BookOpen,
  Receipt,
  Loader2,
  Calendar,
  Euro,
  Users,
  CheckCircle2,
  AlertCircle,
  Eye,
  Play,
  X,
  ChevronDown,
  ChevronRight,
  Edit3,
  Save,
  FolderOpen,
  FileCheck,
  Rocket,
  PartyPopper,
  MessageSquareText,
} from "lucide-react";
import {
  SessionClient,
  SessionTarif,
  SessionLieu,
  SessionFormateurs,
  FormationInfo,
} from "./types";
import { renderTemplate, generateTestContext } from "@/lib/templates/renderer";

// Import dynamique de l'éditeur TipTap (client-side only)
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
          <span className="text-gray-500 text-sm">Chargement de l&apos;éditeur...</span>
        </div>
      </div>
    )
  }
);

// Importer le type GeneratedDocument depuis types
import { GeneratedDocument } from "./types";

interface StepDocumentsProps {
  clients: SessionClient[];
  tarifs: SessionTarif[];
  lieu: SessionLieu;
  formateurs: SessionFormateurs;
  formation: FormationInfo;
  initialGeneratedDocs?: GeneratedDocument[]; // Documents déjà générés (persistés)
  onGeneratedDocsChange?: (docs: GeneratedDocument[]) => void; // Callback pour sauvegarder
  onPrev: () => void;
  onGenerate: (selectedDocs: string[]) => Promise<void>;
  onPublish?: () => void; // Callback optionnel quand on publie
}

type DocumentType =
  | "convention"
  | "contrat"
  | "convocation"
  | "attestation"
  | "certificat_realisation"
  | "emargement"
  | "facture";

// Types pour les évaluations en ligne (formulaires)
type EvaluationSatisfactionType = "CHAUD" | "FROID";
type EvaluationOtherType = "INTERVENANT" | "FINANCEUR";
type EvaluationType = EvaluationSatisfactionType | EvaluationOtherType;

interface CreatedEvaluation {
  id: string;
  type: EvaluationType;
  apprenantId?: string;
  apprenantName?: string;
  intervenantId?: string;
  intervenantName?: string;
  financeurId?: string;
  financeurName?: string;
  token: string;
  status: string;
}

interface DocumentConfig {
  id: DocumentType;
  label: string;
  description: string;
  icon: React.ReactNode;
  perClient: boolean;
  perApprenant: boolean;
  color: string;
  bgColor: string;
}

const documentsConfig: DocumentConfig[] = [
  {
    id: "convention",
    label: "Convention de formation",
    description: "Document contractuel pour les entreprises et indépendants (SIRET)",
    icon: <FileSignature size={20} />,
    perClient: true,
    perApprenant: false,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30",
  },
  {
    id: "contrat",
    label: "Contrat de formation",
    description: "Document contractuel pour les particuliers",
    icon: <FileText size={20} />,
    perClient: true,
    perApprenant: false,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/30",
  },
  {
    id: "convocation",
    label: "Convocation",
    description: "Invitation officielle pour chaque participant",
    icon: <Mail size={20} />,
    perClient: false,
    perApprenant: true,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/30",
  },
  {
    id: "emargement",
    label: "Feuille d'émargement",
    description: "Feuille de présence pour la session",
    icon: <ClipboardList size={20} />,
    perClient: false,
    perApprenant: false,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30",
  },
  {
    id: "attestation",
    label: "Attestation de formation",
    description: "Attestation de fin de formation par participant",
    icon: <Award size={20} />,
    perClient: false,
    perApprenant: true,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/30",
  },
  {
    id: "certificat_realisation",
    label: "Certificat de réalisation",
    description: "Document Qualiopi prouvant la réalisation de la formation (pour les financeurs)",
    icon: <FileCheck size={20} />,
    perClient: false,
    perApprenant: true,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-50 border-teal-200 dark:bg-teal-500/10 dark:border-teal-500/30",
  },
  {
    id: "facture",
    label: "Facture",
    description: "Facture par client",
    icon: <Receipt size={20} />,
    perClient: true,
    perApprenant: false,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30",
  },
];

// Configuration des évaluations en ligne (formulaires)
interface EvaluationConfig {
  id: EvaluationType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  targetType: "apprenant" | "intervenant" | "financeur";
}

// Évaluations de satisfaction (apprenants)
const evaluationsSatisfactionConfig: EvaluationConfig[] = [
  {
    id: "CHAUD",
    label: "Évaluation à chaud",
    description: "Questionnaire de satisfaction à remplir en fin de formation",
    icon: <MessageSquareText size={20} />,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 border-pink-200 dark:bg-pink-500/10 dark:border-pink-500/30",
    targetType: "apprenant",
  },
  {
    id: "FROID",
    label: "Évaluation à froid",
    description: "Questionnaire de suivi à remplir quelques semaines après la formation",
    icon: <MessageSquareText size={20} />,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-50 border-cyan-200 dark:bg-cyan-500/10 dark:border-cyan-500/30",
    targetType: "apprenant",
  },
];

// Évaluations autres (intervenants, financeurs)
const evaluationsOtherConfig: EvaluationConfig[] = [
  {
    id: "INTERVENANT",
    label: "Évaluation intervenant",
    description: "Questionnaire d'évaluation du formateur par les apprenants",
    icon: <MessageSquareText size={20} />,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50 border-violet-200 dark:bg-violet-500/10 dark:border-violet-500/30",
    targetType: "intervenant",
  },
  {
    id: "FINANCEUR",
    label: "Évaluation financeur",
    description: "Questionnaire de satisfaction pour les financeurs (OPCO, CPF, etc.)",
    icon: <MessageSquareText size={20} />,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30",
    targetType: "financeur",
  },
];

// Toutes les évaluations combinées
const evaluationsConfig: EvaluationConfig[] = [
  ...evaluationsSatisfactionConfig,
  ...evaluationsOtherConfig,
];

// Dimensions A4 en mm converties en pixels (96 DPI)
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MM_TO_PX = 96 / 25.4;
const A4_WIDTH_PX = Math.round(A4_WIDTH_MM * MM_TO_PX); // ~794px
const A4_HEIGHT_PX = Math.round(A4_HEIGHT_MM * MM_TO_PX); // ~1123px

// Marges en mm
const MARGIN_TOP_MM = 20;
const MARGIN_BOTTOM_MM = 20;
const MARGIN_LEFT_MM = 25;
const MARGIN_RIGHT_MM = 25;

// Styles CSS pour les documents PDF
const getDocumentStyles = () => `
  @page { size: A4; margin: 20mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a1a;
    margin: 0;
    padding: 0;
  }
  img { max-width: 100%; height: auto; }
  table { border-collapse: collapse; width: 100%; margin: 15px 0; }
  td, th { border: 1px solid #ddd; padding: 10px; text-align: left; }
  th { background: #f5f5f5; font-weight: 700; }
  h1 { font-size: 18pt; font-weight: 700; color: #111; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1px; }
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
    border-radius: 0 4px 4px 0;
  }
  .page-break {
    display: block;
    page-break-after: always;
    break-after: page;
    height: 0;
  }
  @media print {
    .page-break {
      page-break-after: always !important;
      break-after: page !important;
    }
  }
`;

// CSS pour le preview dans la modal
const previewStyles = `
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
    margin: 0 0 10px 0;
    text-align: justify;
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
  .document-preview-content strong {
    font-weight: 700;
  }
  .document-preview-content em {
    font-style: italic;
  }
  .document-preview-content .module-section {
    background: #f9f9f9;
    border-left: 3px solid #4277FF;
    padding: 12px 16px;
    margin: 12px 0;
    border-radius: 0 4px 4px 0;
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
`;

export default function StepDocuments({
  clients,
  tarifs,
  lieu,
  formateurs,
  formation,
  initialGeneratedDocs = [],
  onGeneratedDocsChange,
  onPrev,
  onPublish,
}: StepDocumentsProps) {
  // États - initialiser avec les documents existants
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>(initialGeneratedDocs);
  const [generatingDocType, setGeneratingDocType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modal de sélection pour documents multiples
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selectionModalType, setSelectionModalType] = useState<DocumentType | null>(null);
  const [selectedForGeneration, setSelectedForGeneration] = useState<Set<string>>(new Set());

  // Modal de preview
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<GeneratedDocument | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState<string>("");

  // Pagination du preview
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [measuredPages, setMeasuredPages] = useState<string[]>([""]);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  // Section dépliée
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Sauvegarde dans le Drive
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });

  // Publication de la formation
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Évaluations en ligne (formulaires)
  const [createdEvaluations, setCreatedEvaluations] = useState<CreatedEvaluation[]>([]);
  const [creatingEvalType, setCreatingEvalType] = useState<string | null>(null);
  const [expandedEvalSection, setExpandedEvalSection] = useState<string | null>(null);

  // Modal d'envoi email
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailDoc, setEmailDoc] = useState<GeneratedDocument | null>(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState<Set<string>>(new Set());

  // Synchroniser avec initialGeneratedDocs quand ils changent (rechargement)
  useEffect(() => {
    if (initialGeneratedDocs.length > 0 && generatedDocs.length === 0) {
      setGeneratedDocs(initialGeneratedDocs);
    }
  }, [initialGeneratedDocs]);

  // Notifier le parent quand les documents changent (pour persistence)
  // On utilise un effet qui surveille generatedDocs et notifie le parent
  const prevDocsLengthRef = useRef(initialGeneratedDocs.length);
  useEffect(() => {
    // Ne notifier que si le nombre de documents a changé (nouveau document généré)
    if (generatedDocs.length > prevDocsLengthRef.current && onGeneratedDocsChange) {
      onGeneratedDocsChange(generatedDocs);
      prevDocsLengthRef.current = generatedDocs.length;
    }
  }, [generatedDocs, onGeneratedDocsChange]);

  // Calculs pour le récap
  const totalApprenants = clients.reduce((acc, c) => acc + c.apprenants.length, 0);
  const totalTarif = tarifs.reduce((acc, t) => acc + (t.tarifHT || 0), 0);
  const totalFinance = tarifs.reduce((acc, t) => acc + (t.totalFinance || 0), 0);

  // Contenu pour la pagination (soit édité, soit original)
  const currentPreviewContent = useMemo(() => {
    if (!previewDoc) return "";
    return isEditMode && editedContent ? editedContent : previewDoc.renderedContent;
  }, [previewDoc, isEditMode, editedContent]);

  // Hauteur disponible pour le contenu sur une page (en pixels)
  const contentHeightPx = useMemo(() => {
    const marginTop = MARGIN_TOP_MM * MM_TO_PX;
    const marginBottom = MARGIN_BOTTOM_MM * MM_TO_PX;
    const footerHeight = 50; // Hauteur du footer avec numéro de page
    return A4_HEIGHT_PX - marginTop - marginBottom - footerHeight;
  }, []);

  // Diviser le contenu en sections basées sur les sauts de page manuels
  const manualSections = useMemo(() => {
    if (!currentPreviewContent) return [""];

    // Utiliser un marqueur temporaire pour diviser
    const separator = "<!--PAGE_BREAK_SEPARATOR-->";
    const htmlWithSeparator = currentPreviewContent
      .replace(/<div[^>]*class="[^"]*page-break[^"]*"[^>]*><\/div>/gi, separator)
      .replace(/<div[^>]*class="[^"]*page-break[^"]*"[^>]*>[^<]*<\/div>/gi, separator)
      .replace(/<div[^>]*data-type="page-break"[^>]*><\/div>/gi, separator)
      .replace(/<div[^>]*data-type="page-break"[^>]*>[^<]*<\/div>/gi, separator);

    const sections = htmlWithSeparator.split(separator).filter(section => section.trim() !== "");
    return sections.length > 0 ? sections : [""];
  }, [currentPreviewContent]);

  // Mesurer et paginer le contenu automatiquement
  useEffect(() => {
    if (!showPreviewModal || !currentPreviewContent) return;

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
      setTotalPages(Math.max(1, allPages.length));
    };

    // Petit délai pour s'assurer que le DOM est prêt
    const timer = setTimeout(paginateContent, 100);
    return () => clearTimeout(timer);
  }, [showPreviewModal, manualSections, contentHeightPx, currentPreviewContent]);

  // Scroll handler pour mettre à jour la page courante
  const handlePreviewScroll = useCallback(() => {
    if (previewContainerRef.current && totalPages > 1) {
      const scrollTop = previewContainerRef.current.scrollTop;
      const pageHeight = A4_HEIGHT_PX + 32; // hauteur de page + gap
      const currentPageNum = Math.max(1, Math.min(totalPages, Math.floor(scrollTop / pageHeight) + 1));
      setCurrentPage(currentPageNum);
    }
  }, [totalPages]);

  // Réinitialiser quand on ouvre une nouvelle preview
  useEffect(() => {
    if (showPreviewModal && previewDoc) {
      setCurrentPage(1);
      setIsEditMode(false);
      setEditedContent(previewDoc.renderedContent);
    }
  }, [showPreviewModal, previewDoc]);

  // Sauvegarder les modifications éditées (convertir JSON TipTap en HTML)
  const saveEditedContent = useCallback(() => {
    if (previewDoc && editedContent) {
      try {
        // Convertir le JSON TipTap en HTML via renderTemplate
        const testContext = generateTestContext();
        const renderedHtml = renderTemplate(editedContent, testContext);

        setGeneratedDocs((prev) =>
          prev.map((d) =>
            d.id === previewDoc.id
              ? { ...d, renderedContent: renderedHtml, jsonContent: editedContent }
              : d
          )
        );
        // Mettre à jour aussi le previewDoc
        setPreviewDoc((prev) => prev ? { ...prev, renderedContent: renderedHtml, jsonContent: editedContent } : null);
        setIsEditMode(false);
      } catch (error) {
        console.error("Erreur lors de la conversion:", error);
        // En cas d'erreur, sauvegarder le contenu brut
        setGeneratedDocs((prev) =>
          prev.map((d) =>
            d.id === previewDoc.id ? { ...d, renderedContent: editedContent } : d
          )
        );
        setPreviewDoc((prev) => prev ? { ...prev, renderedContent: editedContent } : null);
        setIsEditMode(false);
      }
    }
  }, [previewDoc, editedContent]);

  // Obtenir les destinataires pour un type de document
  // Convention = Entreprises + Indépendants (personnes avec SIRET)
  // Contrat = Particuliers uniquement (personnes sans SIRET)
  const getDestinataires = (docType: DocumentType) => {
    switch (docType) {
      case "convention":
        // Convention pour entreprises ET indépendants (ils ont un SIRET)
        return clients.filter((c) => c.type === "ENTREPRISE" || c.type === "INDEPENDANT").map((c) => ({
          id: c.id,
          uniqueKey: `convention-${c.id}`, // Clé unique pour React
          name: c.type === "ENTREPRISE"
            ? c.entreprise?.raisonSociale || "Entreprise"
            : c.apprenant ? `${c.apprenant.prenom} ${c.apprenant.nom}` : "Indépendant",
          type: "client" as const,
          clientType: c.type,
        }));
      case "contrat":
        // Contrat uniquement pour les particuliers (sans SIRET)
        return clients.filter((c) => c.type === "PARTICULIER").map((c) => ({
          id: c.id,
          uniqueKey: `contrat-${c.id}`, // Clé unique pour React
          name: c.apprenant ? `${c.apprenant.prenom} ${c.apprenant.nom}` : "Particulier",
          type: "client" as const,
          clientType: c.type,
        }));
      case "convocation":
      case "attestation":
        // Utiliser une combinaison client+apprenant pour éviter les doublons
        return clients.flatMap((c) =>
          c.apprenants.map((a, index) => ({
            id: a.id,
            uniqueKey: `${docType}-${c.id}-${a.id}-${index}`, // Clé unique pour React
            name: `${a.prenom} ${a.nom}`,
            type: "apprenant" as const,
            clientId: c.id,
            clientName: c.type === "ENTREPRISE" ? c.entreprise?.raisonSociale : undefined,
          }))
        );
      case "certificat_realisation":
        return clients.flatMap((c) =>
          c.apprenants.map((a, index) => ({
            id: a.id,
            uniqueKey: `certificat-${c.id}-${a.id}-${index}`, // Clé unique pour React
            name: `${a.prenom} ${a.nom}`,
            type: "apprenant" as const,
            clientId: c.id,
            clientName: c.type === "ENTREPRISE" ? c.entreprise?.raisonSociale : undefined,
          }))
        );
      case "facture":
        return clients.map((c) => ({
          id: c.id,
          uniqueKey: `facture-${c.id}`, // Clé unique pour React
          name: c.type === "ENTREPRISE" ? c.entreprise?.raisonSociale || "Entreprise" : c.apprenant ? `${c.apprenant.prenom} ${c.apprenant.nom}` : "Client",
          type: "client" as const,
          clientType: c.type,
        }));
      case "emargement":
        return [{ id: "session", uniqueKey: "emargement-session", name: "Session complète", type: "session" as const }];
      default:
        return [];
    }
  };

  // Créer une évaluation de satisfaction (CHAUD/FROID) pour un apprenant
  const createSatisfactionEvaluation = async (evalType: EvaluationSatisfactionType, apprenantId: string, apprenantName: string) => {
    if (!formation.sessionId) {
      setError("Aucune session associée. Veuillez d'abord planifier la session.");
      return;
    }

    setCreatingEvalType(`${evalType}-${apprenantId}`);
    setError(null);

    try {
      const response = await fetch("/api/evaluation-satisfaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: formation.sessionId,
          apprenantId,
          type: evalType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création de l'évaluation");
      }

      const result = await response.json();

      // Ajouter à la liste des évaluations créées
      setCreatedEvaluations((prev) => {
        const exists = prev.find((e) => e.id === result.id);
        if (exists) return prev;
        return [...prev, {
          id: result.id,
          type: evalType,
          apprenantId,
          apprenantName,
          token: result.token,
          status: result.status,
        }];
      });
    } catch (err) {
      console.error("Erreur création évaluation satisfaction:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la création de l'évaluation");
    } finally {
      setCreatingEvalType(null);
    }
  };

  // Créer une évaluation intervenant
  const createIntervenantEvaluation = async (intervenantId: string, intervenantName: string) => {
    if (!formation.sessionId) {
      setError("Aucune session associée. Veuillez d'abord planifier la session.");
      return;
    }

    setCreatingEvalType(`INTERVENANT-${intervenantId}`);
    setError(null);

    try {
      const response = await fetch("/api/evaluation-intervenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: formation.sessionId,
          intervenantId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création de l'évaluation intervenant");
      }

      const result = await response.json();

      // Ajouter à la liste des évaluations créées
      setCreatedEvaluations((prev) => {
        const exists = prev.find((e) => e.id === result.id);
        if (exists) return prev;
        return [...prev, {
          id: result.id,
          type: "INTERVENANT" as EvaluationType,
          intervenantId,
          intervenantName,
          token: result.token,
          status: result.status,
        }];
      });
    } catch (err) {
      console.error("Erreur création évaluation intervenant:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la création de l'évaluation");
    } finally {
      setCreatingEvalType(null);
    }
  };

  // Créer une évaluation financeur
  const createFinanceurEvaluation = async (financeurId: string, financeurName: string) => {
    if (!formation.sessionId) {
      setError("Aucune session associée. Veuillez d'abord planifier la session.");
      return;
    }

    setCreatingEvalType(`FINANCEUR-${financeurId}`);
    setError(null);

    try {
      const response = await fetch("/api/evaluation-financeur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: formation.sessionId,
          financeurId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création de l'évaluation financeur");
      }

      const result = await response.json();

      // Ajouter à la liste des évaluations créées
      setCreatedEvaluations((prev) => {
        const exists = prev.find((e) => e.id === result.id);
        if (exists) return prev;
        return [...prev, {
          id: result.id,
          type: "FINANCEUR" as EvaluationType,
          financeurId,
          financeurName,
          token: result.token,
          status: result.status,
        }];
      });
    } catch (err) {
      console.error("Erreur création évaluation financeur:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la création de l'évaluation");
    } finally {
      setCreatingEvalType(null);
    }
  };

  // Fonction générique pour créer une évaluation selon son type
  const createEvaluation = async (evalConfig: EvaluationConfig, targetId: string, targetName: string) => {
    if (evalConfig.targetType === "apprenant") {
      await createSatisfactionEvaluation(evalConfig.id as EvaluationSatisfactionType, targetId, targetName);
    } else if (evalConfig.targetType === "intervenant") {
      await createIntervenantEvaluation(targetId, targetName);
    } else if (evalConfig.targetType === "financeur") {
      await createFinanceurEvaluation(targetId, targetName);
    }
  };

  // Créer toutes les évaluations d'un type
  const createAllEvaluations = async (evalConfig: EvaluationConfig) => {
    if (!formation.sessionId) {
      setError("Aucune session associée. Veuillez d'abord planifier la session.");
      return;
    }

    if (evalConfig.targetType === "apprenant") {
      const allApprenants = clients.flatMap((c) =>
        c.apprenants.map((a) => ({
          id: a.id,
          name: `${a.prenom} ${a.nom}`,
        }))
      );

      for (const apprenant of allApprenants) {
        const alreadyCreated = createdEvaluations.find(
          (e) => e.type === evalConfig.id && e.apprenantId === apprenant.id
        );
        if (!alreadyCreated) {
          await createSatisfactionEvaluation(evalConfig.id as EvaluationSatisfactionType, apprenant.id, apprenant.name);
        }
      }
    } else if (evalConfig.targetType === "intervenant") {
      // Créer pour tous les formateurs de la session
      if (formateurs.formateurPrincipal) {
        const alreadyCreated = createdEvaluations.find(
          (e) => e.type === "INTERVENANT" && e.intervenantId === formateurs.formateurPrincipal?.id
        );
        if (!alreadyCreated) {
          await createIntervenantEvaluation(
            formateurs.formateurPrincipal.id,
            `${formateurs.formateurPrincipal.prenom} ${formateurs.formateurPrincipal.nom}`
          );
        }
      }
    } else if (evalConfig.targetType === "financeur") {
      // Créer pour tous les financeurs des tarifs
      // Le type SessionTarif n'a pas forcément financeur/financeurId, on skip cette logique pour l'instant
      // Cette partie sera mise à jour quand les financeurs seront ajoutés aux tarifs
      const financeurs: { id: string; name: string }[] = [];

      const uniqueFinanceurs = Array.from(
        new Map(financeurs.map((f) => [f.id, f])).values()
      );

      for (const financeur of uniqueFinanceurs) {
        const alreadyCreated = createdEvaluations.find(
          (e) => e.type === "FINANCEUR" && e.financeurId === financeur.id
        );
        if (!alreadyCreated) {
          await createFinanceurEvaluation(financeur.id, financeur.name);
        }
      }
    }
  };

  // Vérifier si une évaluation a été créée (selon le type de cible)
  const isEvalCreated = (evalConfig: EvaluationConfig, targetId: string) => {
    if (evalConfig.targetType === "apprenant") {
      return createdEvaluations.some((e) => e.type === evalConfig.id && e.apprenantId === targetId);
    } else if (evalConfig.targetType === "intervenant") {
      return createdEvaluations.some((e) => e.type === "INTERVENANT" && e.intervenantId === targetId);
    } else if (evalConfig.targetType === "financeur") {
      return createdEvaluations.some((e) => e.type === "FINANCEUR" && e.financeurId === targetId);
    }
    return false;
  };

  // Obtenir l'évaluation créée (selon le type de cible)
  const getCreatedEval = (evalConfig: EvaluationConfig, targetId: string) => {
    if (evalConfig.targetType === "apprenant") {
      return createdEvaluations.find((e) => e.type === evalConfig.id && e.apprenantId === targetId);
    } else if (evalConfig.targetType === "intervenant") {
      return createdEvaluations.find((e) => e.type === "INTERVENANT" && e.intervenantId === targetId);
    } else if (evalConfig.targetType === "financeur") {
      return createdEvaluations.find((e) => e.type === "FINANCEUR" && e.financeurId === targetId);
    }
    return undefined;
  };

  // Obtenir les cibles pour un type d'évaluation
  const getEvalTargets = (evalConfig: EvaluationConfig) => {
    if (evalConfig.targetType === "apprenant") {
      return clients.flatMap((c) =>
        c.apprenants.map((a, index) => ({
          id: a.id,
          uniqueKey: `${evalConfig.id}-${c.id}-${a.id}-${index}`,
          name: `${a.prenom} ${a.nom}`,
          clientId: c.id,
          clientName: c.type === "ENTREPRISE" ? c.entreprise?.raisonSociale : undefined,
        }))
      );
    } else if (evalConfig.targetType === "intervenant") {
      if (!formateurs.formateurPrincipal) return [];
      return [{
        id: formateurs.formateurPrincipal.id,
        uniqueKey: `INTERVENANT-${formateurs.formateurPrincipal.id}`,
        name: `${formateurs.formateurPrincipal.prenom} ${formateurs.formateurPrincipal.nom}`,
      }];
    } else if (evalConfig.targetType === "financeur") {
      // Pour l'instant, les financeurs ne sont pas dans SessionTarif
      // Cette partie sera mise à jour quand les financeurs seront ajoutés
      return [];
    }
    return [];
  };

  // Générer un document
  const generateDocument = async (docType: DocumentType, targetId: string, targetName: string) => {
    setGeneratingDocType(`${docType}-${targetId}`);
    setError(null);

    try {
      const response = await fetch("/api/documents/generate-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formation,
          clients: clients,
          tarifs: tarifs,
          lieu: lieu,
          formateurs: formateurs,
          selectedDocuments: [docType],
          targetId, // ID spécifique du client/apprenant
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la génération");
      }

      const result = await response.json();

      if (result.success && result.documents && result.documents.length > 0) {
        // Filtrer pour ne garder que le document du target
        const relevantDoc = result.documents.find((d: GeneratedDocument) =>
          d.clientId === targetId || d.apprenantId === targetId || (docType === "emargement" && d.type === "emargement")
        ) || result.documents[0];

        // Ajouter aux documents générés (éviter les doublons)
        setGeneratedDocs((prev) => {
          const exists = prev.find((d) => d.id === relevantDoc.id);
          if (exists) {
            return prev.map((d) => (d.id === relevantDoc.id ? relevantDoc : d));
          }
          return [...prev, relevantDoc];
        });

        // Ouvrir la preview automatiquement
        setPreviewDoc(relevantDoc);
        setShowPreviewModal(true);
      }
    } catch (err) {
      console.error("Erreur génération:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la génération");
    } finally {
      setGeneratingDocType(null);
    }
  };

  // Ouvrir la modal de sélection
  const openSelectionModal = (docType: DocumentType) => {
    const destinataires = getDestinataires(docType);
    if (destinataires.length === 1) {
      // Un seul destinataire, générer directement
      generateDocument(docType, destinataires[0].id, destinataires[0].name);
    } else {
      setSelectionModalType(docType);
      setSelectedForGeneration(new Set());
      setShowSelectionModal(true);
    }
  };

  // Générer les documents sélectionnés
  const generateSelectedDocuments = async () => {
    if (!selectionModalType || selectedForGeneration.size === 0) return;

    const destinataires = getDestinataires(selectionModalType);
    const selectedDestinataires = destinataires.filter((d) => selectedForGeneration.has(d.id));

    setShowSelectionModal(false);

    for (const dest of selectedDestinataires) {
      await generateDocument(selectionModalType, dest.id, dest.name);
    }
  };

  // Télécharger un document en PDF
  const downloadPDF = (doc: GeneratedDocument) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Impossible d'ouvrir la fenêtre. Vérifiez les popups bloqués.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${doc.titre}</title>
        <style>${getDocumentStyles()}</style>
      </head>
      <body>
        ${doc.renderedContent}
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

  // Ouvrir le modal d'envoi email
  const openEmailModal = (doc: GeneratedDocument) => {
    setEmailDoc(doc);
    // Pré-remplir l'email si disponible (apprenant ou contact entreprise)
    let defaultEmail = "";
    if (doc.apprenantId) {
      const apprenant = clients
        .flatMap(c => c.apprenants)
        .find(a => a.id === doc.apprenantId);
      defaultEmail = apprenant?.email || "";
    } else if (doc.clientId) {
      const client = clients.find(c => c.id === doc.clientId);
      if (client?.entreprise?.contactEmail) {
        defaultEmail = client.entreprise.contactEmail;
      } else if (client?.apprenant?.email) {
        defaultEmail = client.apprenant.email;
      }
    }
    setEmailAddress(defaultEmail);
    setEmailSubject(`Document: ${doc.titre}`);
    setEmailMessage("");
    setShowEmailModal(true);
  };

  // Envoyer un document par email
  const sendDocumentEmail = async () => {
    if (!emailDoc || !emailAddress) return;

    setIsSendingEmail(true);
    try {
      const response = await fetch("/api/documents/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: emailDoc.id,
          documentTitre: emailDoc.titre, // Envoyer le titre pour les documents non sauvegardés
          email: emailAddress,
          subject: emailSubject,
          message: emailMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'envoi");
      }

      // Marquer comme envoyé
      setEmailSent(prev => new Set([...prev, emailDoc.id]));
      setShowEmailModal(false);
      setEmailDoc(null);
      setEmailAddress("");
      setEmailSubject("");
      setEmailMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi de l'email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // État pour le téléchargement en masse
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });

  // Télécharger tous les documents en PDF (un par un en chaîne)
  // Utilise un Set pour éviter les doublons
  const downloadAllAsPDF = async () => {
    if (generatedDocs.length === 0) return;

    // Dédupliquer les documents par ID
    const uniqueDocs = Array.from(
      new Map(generatedDocs.map(doc => [doc.id, doc])).values()
    );

    if (uniqueDocs.length === 0) return;

    setIsDownloadingAll(true);
    setDownloadProgress({ current: 0, total: uniqueDocs.length });

    // Utiliser une seule fenêtre popup pour tous les documents
    for (let i = 0; i < uniqueDocs.length; i++) {
      const doc = uniqueDocs[i];
      setDownloadProgress({ current: i + 1, total: uniqueDocs.length });

      // Ouvrir une nouvelle fenêtre pour l'impression
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Veuillez autoriser les popups pour télécharger les documents.");
        break;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${doc.titre}</title>
          <style>${getDocumentStyles()}</style>
        </head>
        <body>
          ${doc.renderedContent}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();

      // Attendre que l'utilisateur ait fini avec ce document avant de passer au suivant
      await new Promise<void>((resolve) => {
        // Vérifier périodiquement si la fenêtre est fermée
        const checkInterval = setInterval(() => {
          if (printWindow.closed) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 500);

        // Timeout de sécurité après 60 secondes
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!printWindow.closed) {
            printWindow.close();
          }
          resolve();
        }, 60000);
      });

      // Petit délai entre chaque document
      if (i < uniqueDocs.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    setIsDownloadingAll(false);
    setDownloadProgress({ current: 0, total: 0 });
  };

  // Sauvegarder tous les documents dans le Drive
  const saveAllToDrive = async () => {
    if (generatedDocs.length === 0 || !formation.id) return;

    const unsavedDocs = generatedDocs.filter(d => !d.savedToDrive);
    if (unsavedDocs.length === 0) return;

    setIsSavingToDrive(true);
    setSaveProgress({ current: 0, total: unsavedDocs.length });

    for (let i = 0; i < unsavedDocs.length; i++) {
      const doc = unsavedDocs[i];
      setSaveProgress({ current: i + 1, total: unsavedDocs.length });

      try {
        // Trouver l'entrepriseId si le document est pour un client entreprise
        let entrepriseId: string | undefined;
        if (doc.clientId) {
          const client = clients.find(c => c.id === doc.clientId);
          if (client?.type === "ENTREPRISE" && client.entrepriseId) {
            entrepriseId = client.entrepriseId;
          }
        }

        const response = await fetch("/api/documents/save-to-drive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formationId: formation.id,
            documentType: doc.type,
            titre: doc.titre,
            content: doc.renderedContent,
            entrepriseId,
            apprenantId: doc.apprenantId,
          }),
        });

        if (response.ok) {
          // Marquer le document comme sauvegardé
          setGeneratedDocs(prev =>
            prev.map(d => d.id === doc.id ? { ...d, savedToDrive: true } : d)
          );
        }
      } catch (err) {
        console.error(`Erreur sauvegarde ${doc.titre}:`, err);
      }
    }

    setIsSavingToDrive(false);
    setSaveProgress({ current: 0, total: 0 });
  };

  // Compter les documents non sauvegardés
  const unsavedDocsCount = generatedDocs.filter(d => !d.savedToDrive).length;

  // Publier la formation
  const publishFormation = async () => {
    if (!formation.id) return;

    setIsPublishing(true);
    try {
      const response = await fetch(`/api/formations/${formation.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: true }),
      });

      if (response.ok) {
        setIsPublished(true);
        setShowSuccessModal(true);
        onPublish?.();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Erreur lors de la publication");
      }
    } catch (err) {
      console.error("Erreur publication:", err);
      setError("Erreur lors de la publication de la formation");
    } finally {
      setIsPublishing(false);
    }
  };

  // Vérifier si un document a été généré pour un destinataire
  const isDocGenerated = (docType: DocumentType, targetId: string) => {
    return generatedDocs.some((d) => {
      if (d.type !== docType) return false;
      // Documents pour toute la session
      if (docType === "emargement") return true;
      // Pour les documents par apprenant (convocation, attestation, certificat_realisation)
      if (["convocation", "attestation", "certificat_realisation"].includes(docType)) {
        return d.apprenantId === targetId;
      }
      // Pour les documents par client (convention, contrat, facture)
      return d.clientId === targetId;
    });
  };

  // Obtenir le document généré
  const getGeneratedDoc = (docType: DocumentType, targetId: string) => {
    return generatedDocs.find((d) => {
      if (d.type !== docType) return false;
      // Documents pour toute la session
      if (docType === "emargement") return true;
      // Pour les documents par apprenant (convocation, attestation, certificat_realisation)
      if (["convocation", "attestation", "certificat_realisation"].includes(docType)) {
        return d.apprenantId === targetId;
      }
      // Pour les documents par client (convention, contrat, facture)
      return d.clientId === targetId;
    });
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10">
            <FileText className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Documents à générer
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Générez les documents un par un et visualisez-les avant téléchargement
            </p>
          </div>
        </div>
      </div>

      {/* Récapitulatif de la session */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-500" />
          Récapitulatif de la session
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Users size={12} /> Clients
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {clients.length}
            </p>
            <p className="text-xs text-gray-400">
              {totalApprenants} apprenant{totalApprenants > 1 ? "s" : ""}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Euro size={12} /> Tarif total
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {totalTarif.toLocaleString("fr-FR")} €
            </p>
            {totalFinance > 0 && (
              <p className="text-xs text-green-500">
                dont {totalFinance.toLocaleString("fr-FR")} € financé
              </p>
            )}
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Calendar size={12} /> Dates
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {lieu.journees.length} jour{lieu.journees.length > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-gray-400">{lieu.modalite.toLowerCase()}</p>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <BookOpen size={12} /> Formation
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {formation.titre || "Formation"}
            </p>
            <p className="text-xs text-gray-400">{formation.dureeHeures}h</p>
          </div>
        </div>
      </div>

      {/* Types de documents */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Types de documents
        </h3>

        <div className="space-y-3">
          {documentsConfig.map((docConfig) => {
            const destinataires = getDestinataires(docConfig.id);
            if (destinataires.length === 0) return null;

            const isExpanded = expandedSection === docConfig.id;
            const generatedCount = destinataires.filter((d) => isDocGenerated(docConfig.id, d.id)).length;
            const allGenerated = generatedCount === destinataires.length;

            return (
              <div
                key={docConfig.id}
                className={`rounded-xl border overflow-hidden ${docConfig.bgColor}`}
              >
                {/* Header du type de document */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={() => setExpandedSection(isExpanded ? null : docConfig.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${docConfig.color} bg-white dark:bg-gray-800`}>
                      {docConfig.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${docConfig.color}`}>
                          {docConfig.label}
                        </p>
                        <span className="px-1.5 py-0.5 text-xs bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                          {destinataires.length} destinataire{destinataires.length > 1 ? "s" : ""}
                        </span>
                        {generatedCount > 0 && (
                          <span className="px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded flex items-center gap-1">
                            <Check size={10} />
                            {generatedCount} généré{generatedCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{docConfig.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!allGenerated && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openSelectionModal(docConfig.id);
                        }}
                        disabled={generatingDocType !== null}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${docConfig.color} bg-white dark:bg-gray-800 hover:opacity-80 disabled:opacity-50`}
                      >
                        {generatingDocType?.startsWith(docConfig.id) ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Play size={14} />
                        )}
                        Générer
                      </button>
                    )}
                    {isExpanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                  </div>
                </div>

                {/* Liste des destinataires (si déplié) */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-4 space-y-2">
                    {destinataires.map((dest) => {
                      const isGenerated = isDocGenerated(docConfig.id, dest.id);
                      const generatedDoc = getGeneratedDoc(docConfig.id, dest.id);
                      const isGenerating = generatingDocType === `${docConfig.id}-${dest.id}`;

                      return (
                        <div
                          key={dest.uniqueKey}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            isGenerated
                              ? "bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/30"
                              : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {isGenerated && <CheckCircle2 size={16} className="text-green-500" />}
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {dest.name}
                              </p>
                              {"clientName" in dest && dest.clientName && (
                                <p className="text-xs text-gray-500">{dest.clientName}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isGenerated && generatedDoc ? (
                              <>
                                <button
                                  onClick={() => {
                                    setPreviewDoc(generatedDoc);
                                    setShowPreviewModal(true);
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                                >
                                  <Eye size={12} />
                                  Voir
                                </button>
                                <button
                                  onClick={() => downloadPDF(generatedDoc)}
                                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
                                >
                                  <Download size={12} />
                                  PDF
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => generateDocument(docConfig.id, dest.id, dest.name)}
                                disabled={isGenerating}
                                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${docConfig.color} bg-white dark:bg-gray-700 border border-current hover:opacity-80 disabled:opacity-50`}
                              >
                                {isGenerating ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Play size={12} />
                                )}
                                Générer
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section Évaluations en ligne */}
      {formation.sessionId && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <MessageSquareText size={18} className="text-pink-500" />
            Évaluations en ligne (formulaires)
          </h3>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Les évaluations sont des formulaires en ligne accessibles via un lien ou QR code.
            Elles sont automatiquement visibles dans Catalogue → Évaluations.
          </p>

          <div className="space-y-3">
            {evaluationsConfig.map((evalConfig) => {
              const targets = getEvalTargets(evalConfig);
              if (targets.length === 0) return null;

              const isExpanded = expandedEvalSection === evalConfig.id;
              const createdCount = targets.filter((t) => isEvalCreated(evalConfig, t.id)).length;
              const allCreated = createdCount === targets.length;

              // Libellé selon le type de cible
              const targetLabel = evalConfig.targetType === "apprenant"
                ? `apprenant${targets.length > 1 ? "s" : ""}`
                : evalConfig.targetType === "intervenant"
                  ? `formateur${targets.length > 1 ? "s" : ""}`
                  : `financeur${targets.length > 1 ? "s" : ""}`;

              return (
                <div
                  key={evalConfig.id}
                  className={`rounded-xl border overflow-hidden ${evalConfig.bgColor}`}
                >
                  {/* Header du type d'évaluation */}
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => setExpandedEvalSection(isExpanded ? null : evalConfig.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${evalConfig.color} bg-white dark:bg-gray-800`}>
                        {evalConfig.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${evalConfig.color}`}>
                            {evalConfig.label}
                          </p>
                          <span className="px-1.5 py-0.5 text-xs bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                            {targets.length} {targetLabel}
                          </span>
                          {createdCount > 0 && (
                            <span className="px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded flex items-center gap-1">
                              <Check size={10} />
                              {createdCount} créé{createdCount > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{evalConfig.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!allCreated && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            createAllEvaluations(evalConfig);
                          }}
                          disabled={creatingEvalType !== null}
                          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${evalConfig.color} bg-white dark:bg-gray-800 hover:opacity-80 disabled:opacity-50`}
                        >
                          {creatingEvalType?.startsWith(evalConfig.id) ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Play size={14} />
                          )}
                          Créer tous
                        </button>
                      )}
                      {isExpanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                    </div>
                  </div>

                  {/* Liste des cibles (si déplié) */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-4 space-y-2">
                      {targets.map((target) => {
                        const isCreated = isEvalCreated(evalConfig, target.id);
                        const createdEval = getCreatedEval(evalConfig, target.id);
                        const isCreating = creatingEvalType === `${evalConfig.id}-${target.id}`;

                        // Déterminer le lien d'évaluation selon le type
                        const evalLink = evalConfig.targetType === "intervenant"
                          ? `/evaluation-intervenant/${createdEval?.token}`
                          : evalConfig.targetType === "financeur"
                            ? `/evaluation-financeur/${createdEval?.token}`
                            : `/evaluation/${createdEval?.token}`;

                        return (
                          <div
                            key={target.uniqueKey}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              isCreated
                                ? "bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/30"
                                : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {isCreated && <CheckCircle2 size={16} className="text-green-500" />}
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {target.name}
                                </p>
                                {"clientName" in target && (target as { clientName?: string }).clientName && (
                                  <p className="text-xs text-gray-500">{(target as { clientName?: string }).clientName}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {isCreated && createdEval ? (
                                <>
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full ${
                                    createdEval.status === "COMPLETED"
                                      ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                                      : createdEval.status === "IN_PROGRESS"
                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
                                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                                  }`}>
                                    <span className={`w-2 h-2 rounded-full ${
                                      createdEval.status === "COMPLETED"
                                        ? "bg-green-500"
                                        : createdEval.status === "IN_PROGRESS"
                                          ? "bg-yellow-500 animate-pulse"
                                          : "bg-gray-400"
                                    }`} />
                                    {createdEval.status === "COMPLETED" ? "Complété" :
                                     createdEval.status === "IN_PROGRESS" ? "En cours" : "En attente"}
                                  </span>
                                  <a
                                    href={evalLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                                  >
                                    <Eye size={12} />
                                    Voir
                                  </a>
                                </>
                              ) : (
                                <button
                                  onClick={() => createEvaluation(evalConfig, target.id, target.name)}
                                  disabled={isCreating}
                                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${evalConfig.color} bg-white dark:bg-gray-700 border border-current hover:opacity-80 disabled:opacity-50`}
                                >
                                  {isCreating ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <Play size={12} />
                                  )}
                                  Créer
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Message si pas de session pour les évaluations */}
      {!formation.sessionId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertCircle size={18} />
            <p className="text-sm font-medium">
              Planifiez la session pour pouvoir créer les évaluations en ligne
            </p>
          </div>
        </div>
      )}

      {/* Documents générés */}
      {generatedDocs.length > 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 dark:border-green-500/30 dark:bg-green-500/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
              <CheckCircle2 size={16} />
              {generatedDocs.length} document{generatedDocs.length > 1 ? "s" : ""} généré{generatedDocs.length > 1 ? "s" : ""}
            </h3>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Complet
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Partiel
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                En attente
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {generatedDocs.map((doc) => {
              const isSaved = doc.savedToDrive;
              const isSent = emailSent.has(doc.id);
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-500/30"
                >
                  {/* Pastille de statut */}
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isSaved && isSent
                        ? "bg-green-500"
                        : isSaved || isSent
                          ? "bg-yellow-500"
                          : "bg-gray-400"
                    }`}
                    title={
                      isSaved && isSent
                        ? "Sauvegardé et envoyé"
                        : isSaved
                          ? "Sauvegardé (non envoyé)"
                          : isSent
                            ? "Envoyé (non sauvegardé)"
                            : "En attente"
                    }
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 max-w-[180px] truncate">
                    {doc.titre}
                  </span>
                  <button
                    onClick={() => {
                      setPreviewDoc(doc);
                      setShowPreviewModal(true);
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    title="Prévisualiser"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => downloadPDF(doc)}
                    className="p-1 text-red-500 hover:text-red-600"
                    title="Télécharger PDF"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={() => openEmailModal(doc)}
                    className={`p-1 transition-colors ${
                      isSent
                        ? "text-green-500"
                        : "text-blue-500 hover:text-blue-600"
                    }`}
                    title={isSent ? "Email envoyé" : "Envoyer par email"}
                  >
                    {isSent ? <CheckCircle2 size={14} /> : <Mail size={14} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle size={18} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Boutons navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <ChevronLeft size={18} />
          Retour
        </button>

        <div className="flex items-center gap-3">
          {generatedDocs.length > 0 && (
            <>
              {/* Bouton Sauvegarder dans le Drive */}
              {formation.id && unsavedDocsCount > 0 && (
                <button
                  onClick={saveAllToDrive}
                  disabled={isSavingToDrive}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-green-500 rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isSavingToDrive ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sauvegarde {saveProgress.current}/{saveProgress.total}...
                    </>
                  ) : (
                    <>
                      <FolderOpen size={18} />
                      Sauvegarder dans le Drive ({unsavedDocsCount})
                    </>
                  )}
                </button>
              )}

              {/* Indicateur si tous sauvegardés */}
              {formation.id && unsavedDocsCount === 0 && generatedDocs.length > 0 && (
                <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-xl dark:bg-green-500/20 dark:text-green-400">
                  <Save size={16} />
                  Tous sauvegardés
                </span>
              )}

              {/* Bouton Télécharger PDF */}
              <button
                onClick={downloadAllAsPDF}
                disabled={isDownloadingAll}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {isDownloadingAll ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Téléchargement {downloadProgress.current}/{downloadProgress.total}...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Télécharger tous les PDF
                  </>
                )}
              </button>
            </>
          )}

          {/* Bouton Planifier la session */}
          {formation.sessionId && !isPublished && (
            <button
              onClick={() => {
                setIsPublished(true);
                onPublish?.();
              }}
              disabled={isPublishing}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-brand-500 to-purple-500 rounded-xl hover:from-brand-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Calendar size={18} />
              Planifier la session
            </button>
          )}

          {/* Badge Session planifiée */}
          {isPublished && (
            <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
              <CheckCircle2 size={16} />
              Session planifiée
            </span>
          )}
        </div>
      </div>

      {/* Modal de sélection des destinataires */}
      {showSelectionModal && selectionModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sélectionner les destinataires
              </h3>
              <button
                onClick={() => setShowSelectionModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {getDestinataires(selectionModalType).map((dest) => {
                const isSelected = selectedForGeneration.has(dest.id);
                const isAlreadyGenerated = isDocGenerated(selectionModalType, dest.id);

                return (
                  <button
                    key={dest.uniqueKey}
                    onClick={() => {
                      if (isAlreadyGenerated) return;
                      const newSet = new Set(selectedForGeneration);
                      if (isSelected) {
                        newSet.delete(dest.id);
                      } else {
                        newSet.add(dest.id);
                      }
                      setSelectedForGeneration(newSet);
                    }}
                    disabled={isAlreadyGenerated}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      isAlreadyGenerated
                        ? "border-green-300 bg-green-50 dark:bg-green-500/10 cursor-not-allowed"
                        : isSelected
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {dest.name}
                        </p>
                        {"clientName" in dest && dest.clientName && (
                          <p className="text-xs text-gray-500">{dest.clientName}</p>
                        )}
                      </div>
                      {isAlreadyGenerated ? (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded flex items-center gap-1">
                          <Check size={12} />
                          Déjà généré
                        </span>
                      ) : (
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? "bg-brand-500 border-brand-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button
                onClick={() => setShowSelectionModal(false)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={generateSelectedDocuments}
                disabled={selectedForGeneration.size === 0}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50"
              >
                Générer ({selectedForGeneration.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de preview avec pagination A4 */}
      {showPreviewModal && previewDoc && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[95vw] h-[95vh] max-w-6xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {previewDoc.titre}
                </h2>
                {previewDoc.clientName && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Client: {previewDoc.clientName}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Toggle Mode Édition / Aperçu */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setIsEditMode(false)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      !isEditMode
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    <Eye size={14} className="inline mr-1.5" />
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
                    <Edit3 size={14} className="inline mr-1.5" />
                    Éditer
                  </button>
                </div>

                {/* Bouton Sauvegarder (visible en mode édition) */}
                {isEditMode && (
                  <button
                    onClick={saveEditedContent}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Check size={16} />
                    Sauvegarder
                  </button>
                )}

                {/* Bouton Télécharger PDF */}
                <button
                  onClick={() => downloadPDF(previewDoc)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Download size={16} />
                  Télécharger PDF
                </button>

                {/* Bouton Fermer */}
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Styles pour le document */}
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
                margin: 0 0 10px 0;
                text-align: justify;
              }
              .document-preview-content p[style*="text-align: center"] {
                text-align: center !important;
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
              .document-preview-content .page-break {
                display: none;
              }
              .page-footer {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                border-top: 1px solid #ddd;
                padding-top: 12px;
                margin-top: auto;
                font-size: 9pt;
                color: #666;
              }
            ` }} />

            {/* Contenu - Mode Aperçu ou Mode Édition */}
            {isEditMode ? (
              /* Mode Édition avec TipTap */
              <div className="flex-1 overflow-auto p-6 bg-gray-100 dark:bg-gray-950">
                <div className="max-w-5xl mx-auto">
                  <DocumentEditor
                    initialContent={previewDoc.jsonContent || previewDoc.renderedContent}
                    onChange={(content) => setEditedContent(content)}
                    placeholder="Modifiez le contenu du document..."
                    minHeight="calc(100vh - 300px)"
                    showToolbar={true}
                  />
                </div>
              </div>
            ) : (
              /* Mode Aperçu avec pagination A4 */
              <div
                ref={previewContainerRef}
                onScroll={handlePreviewScroll}
                className="flex-1 overflow-auto bg-gray-300 dark:bg-gray-900 py-8"
              >
                {/* Pages A4 avec pagination automatique */}
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
                      {/* Contenu de cette page spécifique */}
                      <div
                        className="flex-1 overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: pageContent }}
                      />

                      {/* Footer avec numéro de page */}
                      <div className="page-footer flex-shrink-0">
                        <div className="text-right font-medium text-gray-500">
                          Page {pageIndex + 1} / {totalPages}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Indicateur de page fixe en bas à droite */}
                <div className="fixed bottom-6 right-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg px-4 py-2 text-sm z-50 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                  <span className="text-gray-500">Page</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-500">{totalPages}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal d'envoi par email */}
      {showEmailModal && emailDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Mail size={20} className="text-blue-500" />
                Envoyer par email
              </h3>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailDoc(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Document :</p>
                <p className="font-medium text-gray-900 dark:text-white">{emailDoc.titre}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email du destinataire *
                </label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="email@exemple.com"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sujet
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message personnalisé (optionnel)
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={3}
                  placeholder="Ajoutez un message personnalisé..."
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailDoc(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={sendDocumentEmail}
                disabled={!emailAddress || isSendingEmail}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Mail size={16} />
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de succès après publication */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md p-8 text-center animate-in fade-in zoom-in duration-300">
            {/* Confetti effect */}
            <div className="relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-6xl animate-bounce">
                🎉
              </div>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                <PartyPopper size={40} className="text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Formation publiée !
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Votre formation <span className="font-semibold text-brand-600">{formation.titre}</span> est maintenant disponible et prête à accueillir des apprenants.
            </p>

            <div className="space-y-3">
              <a
                href="/automate/formations"
                className="block w-full py-3 px-4 text-sm font-medium text-white bg-gradient-to-r from-brand-500 to-purple-500 rounded-xl hover:from-brand-600 hover:to-purple-600 transition-all"
              >
                Voir mes formations
              </a>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="block w-full py-3 px-4 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Continuer à éditer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
