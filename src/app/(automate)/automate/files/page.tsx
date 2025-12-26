"use client";

// ===========================================
// MES FICHIERS - Design Style Google Drive
// ===========================================
// Structure: Formation > Apprenants > Documents
// Vue en grille avec dossiers visuels

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import FilePreviewModal from "@/components/files/FilePreviewModal";

// Import dynamique de l'éditeur TipTap
const DocumentEditor = dynamic(
  () => import("@/components/editor/DocumentEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-900 rounded-lg">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-brand-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span className="text-sm text-gray-500">Chargement de l&apos;éditeur...</span>
        </div>
      </div>
    ),
  }
);

// Types
interface ApprenantDoc {
  id: string;
  titre: string;
  type: string;
  status: string;
  isSigned?: boolean;
  signedAt?: string;
  createdAt: string;
  fileUrl?: string | null;
  mimeType?: string;
}

interface ApprenantNode {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  documents: ApprenantDoc[];
  signedDocuments: number;
  pendingDocuments: number;
}

interface SessionDoc {
  id: string;
  titre: string;
  type: string;
  status: string;
  createdAt: string;
  sessionId: string;
}

interface FileNode {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  storagePath: string;
  publicUrl: string | null;
  formationId: string | null;
  createdAt: string;
}

interface FormationNode {
  id: string;
  titre: string;
  status: string;
  apprenants: ApprenantNode[];
  apprenantsCount: number;
  sessionsCount: number;
  documentsCount: number;
  sessionDocuments: SessionDoc[];
  files: FileNode[];
}

interface TreeStats {
  totalFormations: number;
  totalApprenants: number;
  totalDocuments: number;
  signedDocuments: number;
  pendingDocuments: number;
}

// Navigation type
type ViewType = "formations" | "apprenants" | "documents";

interface Breadcrumb {
  label: string;
  onClick: () => void;
}

// Document type labels and icons
const DOCTYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  CONVENTION: { label: "Convention", color: "blue", icon: "📋" },
  CONTRAT_FORMATION: { label: "Contrat", color: "blue", icon: "📋" },
  CONVOCATION: { label: "Convocation", color: "purple", icon: "📬" },
  ATTESTATION_FIN: { label: "Attestation de fin", color: "green", icon: "🎓" },
  ATTESTATION_PRESENCE: { label: "Attestation de présence", color: "teal", icon: "✅" },
  EMARGEMENT: { label: "Feuille d'émargement", color: "orange", icon: "✍️" },
  CERTIFICAT: { label: "Certificat", color: "yellow", icon: "🏆" },
  CERTIFICAT_REALISATION: { label: "Certificat de réalisation", color: "yellow", icon: "🏆" },
  FACTURE: { label: "Facture", color: "red", icon: "💰" },
  DEVIS: { label: "Devis", color: "indigo", icon: "📄" },
  PROGRAMME: { label: "Programme", color: "purple", icon: "📚" },
  PROGRAMME_FORMATION: { label: "Programme", color: "purple", icon: "📚" },
  FICHE_PEDAGOGIQUE: { label: "Fiche pédagogique", color: "teal", icon: "📝" },
  REGLEMENT_INTERIEUR: { label: "Règlement intérieur", color: "orange", icon: "📖" },
  EVALUATION_CHAUD: { label: "Évaluation à chaud", color: "red", icon: "🔥" },
  EVALUATION_FROID: { label: "Évaluation à froid", color: "blue", icon: "❄️" },
  // Aliases et types génériques (couleur non grise)
  DOCUMENT: { label: "Document", color: "blue", icon: "📄" },
  AUTRE: { label: "Document", color: "indigo", icon: "📄" },
};

// Dimensions A4 pour la pagination
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MM_TO_PX = 96 / 25.4;
const A4_WIDTH_PX = Math.round(A4_WIDTH_MM * MM_TO_PX);
const A4_HEIGHT_PX = Math.round(A4_HEIGHT_MM * MM_TO_PX);
const MARGIN_MM = 20;
const FOOTER_HEIGHT_MM = 25;
// Hauteur disponible pour le contenu par page
const PAGE_CONTENT_HEIGHT_PX = A4_HEIGHT_PX - (MARGIN_MM * 2 + FOOTER_HEIGHT_MM) * MM_TO_PX;

// Document status configuration
const DOC_STATUS_CONFIG: Record<string, { label: string; bgClass: string; textClass: string }> = {
  SIGNED: { label: "Signé", bgClass: "bg-green-100 dark:bg-green-900/30", textClass: "text-green-700 dark:text-green-400" },
  PENDING_SIGNATURE: { label: "En attente", bgClass: "bg-amber-100 dark:bg-amber-900/30", textClass: "text-amber-700 dark:text-amber-400" },
  GENERATED: { label: "Généré", bgClass: "bg-blue-100 dark:bg-blue-900/30", textClass: "text-blue-700 dark:text-blue-400" },
  SENT: { label: "Envoyé", bgClass: "bg-purple-100 dark:bg-purple-900/30", textClass: "text-purple-700 dark:text-purple-400" },
  SAVED: { label: "Enregistré", bgClass: "bg-gray-100 dark:bg-gray-800", textClass: "text-gray-600 dark:text-gray-400" },
  PENDING: { label: "En cours", bgClass: "bg-orange-100 dark:bg-orange-900/30", textClass: "text-orange-700 dark:text-orange-400" },
  BROUILLON: { label: "Brouillon", bgClass: "bg-gray-100 dark:bg-gray-800", textClass: "text-gray-600 dark:text-gray-400" },
};

// Helper to get document status display
const getDocStatusDisplay = (doc: ApprenantDoc) => {
  if (doc.isSigned) {
    return DOC_STATUS_CONFIG.SIGNED;
  }
  const config = DOC_STATUS_CONFIG[doc.status];
  if (config) {
    return config;
  }
  return DOC_STATUS_CONFIG.BROUILLON;
};

// Formation status colors
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  BROUILLON: { label: "Brouillon", color: "text-gray-600", bg: "bg-gray-100", dot: "bg-gray-400" },
  PUBLIEE: { label: "Publiée", color: "text-blue-600", bg: "bg-blue-100", dot: "bg-blue-500" },
  EN_COURS: { label: "En cours", color: "text-amber-600", bg: "bg-amber-100", dot: "bg-amber-500" },
  TERMINEE: { label: "Terminée", color: "text-green-600", bg: "bg-green-100", dot: "bg-green-500" },
  ANNULEE: { label: "Annulée", color: "text-red-600", bg: "bg-red-100", dot: "bg-red-500" },
};

// Formatage
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Icons Components
const FolderClosedIcon = ({ className = "", color = "#3B82F6" }: { className?: string; color?: string }) => (
  <svg className={className} width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 20C8 14.477 12.477 10 18 10H28.343C30.808 10 33.172 11.024 34.879 12.879L38 16H62C67.523 16 72 20.477 72 26V60C72 65.523 67.523 70 62 70H18C12.477 70 8 65.523 8 60V20Z" fill={color} fillOpacity="0.2"/>
    <path d="M8 26H72V60C72 65.523 67.523 70 62 70H18C12.477 70 8 65.523 8 60V26Z" fill={color}/>
    <path d="M8 20C8 14.477 12.477 10 18 10H28.343C30.808 10 33.172 11.024 34.879 12.879L38 16H62C67.523 16 72 20.477 72 26H8V20Z" fill={color} fillOpacity="0.8"/>
  </svg>
);

const FolderOpenIcon = ({ className = "", color = "#3B82F6" }: { className?: string; color?: string }) => (
  <svg className={className} width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 20C8 14.477 12.477 10 18 10H28.343C30.808 10 33.172 11.024 34.879 12.879L38 16H62C67.523 16 72 20.477 72 26V30H8V20Z" fill={color} fillOpacity="0.8"/>
    <path d="M4 34C4 31.791 5.791 30 8 30H72C74.209 30 76 31.791 76 34V60C76 65.523 71.523 70 66 70H14C8.477 70 4 65.523 4 60V34Z" fill={color}/>
  </svg>
);

const UserFolderIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 20C8 14.477 12.477 10 18 10H28.343C30.808 10 33.172 11.024 34.879 12.879L38 16H62C67.523 16 72 20.477 72 26V60C72 65.523 67.523 70 62 70H18C12.477 70 8 65.523 8 60V20Z" fill="#F59E0B" fillOpacity="0.2"/>
    <path d="M8 26H72V60C72 65.523 67.523 70 62 70H18C12.477 70 8 65.523 8 60V26Z" fill="#F59E0B"/>
    <path d="M8 20C8 14.477 12.477 10 18 10H28.343C30.808 10 33.172 11.024 34.879 12.879L38 16H62C67.523 16 72 20.477 72 26H8V20Z" fill="#F59E0B" fillOpacity="0.8"/>
    {/* User icon inside */}
    <circle cx="40" cy="42" r="10" fill="white" fillOpacity="0.9"/>
    <path d="M28 62C28 54.268 33.372 48 40 48C46.628 48 52 54.268 52 62" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none"/>
  </svg>
);

const DocumentIcon = ({ type, className = "" }: { type: string; className?: string }) => {
  const config = DOCTYPE_CONFIG[type] || DOCTYPE_CONFIG.AUTRE;
  const colorMap: Record<string, string> = {
    blue: "#3B82F6",
    purple: "#8B5CF6",
    green: "#10B981",
    teal: "#14B8A6",
    orange: "#F97316",
    yellow: "#EAB308",
    red: "#EF4444",
    indigo: "#6366F1",
    gray: "#6B7280",
  };
  const color = colorMap[config.color] || colorMap.gray;

  return (
    <div className={`relative ${className}`}>
      <svg width="60" height="72" viewBox="0 0 60 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 4C0 1.79086 1.79086 0 4 0H38L60 22V68C60 70.2091 58.2091 72 56 72H4C1.79086 72 0 70.2091 0 68V4Z" fill="white"/>
        <path d="M38 0L60 22H42C39.7909 22 38 20.2091 38 18V0Z" fill={color} fillOpacity="0.3"/>
        <path d="M0 4C0 1.79086 1.79086 0 4 0H38L60 22V68C60 70.2091 58.2091 72 56 72H4C1.79086 72 0 70.2091 0 68V4Z" stroke={color} strokeWidth="2"/>
        <rect x="8" y="34" width="32" height="3" rx="1.5" fill={color} fillOpacity="0.3"/>
        <rect x="8" y="42" width="44" height="3" rx="1.5" fill={color} fillOpacity="0.3"/>
        <rect x="8" y="50" width="28" height="3" rx="1.5" fill={color} fillOpacity="0.3"/>
      </svg>
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-lg">{config.icon}</span>
    </div>
  );
};

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M9.16667 3.33333C5.94501 3.33333 3.33333 5.94501 3.33333 9.16667C3.33333 12.3883 5.94501 15 9.16667 15C12.3883 15 15 12.3883 15 9.16667C15 5.94501 12.3883 3.33333 9.16667 3.33333ZM1.66667 9.16667C1.66667 5.02453 5.02453 1.66667 9.16667 1.66667C13.3088 1.66667 16.6667 5.02453 16.6667 9.16667C16.6667 10.9378 16.0528 12.5654 15.0274 13.8565L18.0893 16.9107C18.4147 17.2362 18.4147 17.7638 18.0893 18.0893C17.7638 18.4147 17.2362 18.4147 16.9107 18.0893L13.8565 15.0274C12.5654 16.0528 10.9378 16.6667 9.16667 16.6667C5.02453 16.6667 1.66667 13.3088 1.66667 9.16667Z" fill="currentColor"/>
  </svg>
);

const GridIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="12" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="2" y="12" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="12" y="12" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const ListIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.25 6.75L9 1.5L15.75 6.75V15C15.75 15.3978 15.592 15.7794 15.3107 16.0607C15.0294 16.342 14.6478 16.5 14.25 16.5H3.75C3.35218 16.5 2.97064 16.342 2.68934 16.0607C2.40804 15.7794 2.25 15.3978 2.25 15V6.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12V13.5C3 14.3284 3.67157 15 4.5 15H13.5C14.3284 15 15 14.3284 15 13.5V12M9 11.25V3M9 11.25L6 8.25M9 11.25L12 8.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.5 9C1.5 9 3.75 3.75 9 3.75C14.25 3.75 16.5 9 16.5 9C16.5 9 14.25 14.25 9 14.25C3.75 14.25 1.5 9 1.5 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="9" r="2.25" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.75 2.25L8.25 9.75M15.75 2.25L10.5 15.75L8.25 9.75M15.75 2.25L2.25 7.5L8.25 9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.6666 7.38667V8C14.6658 9.43762 14.2003 10.8365 13.3395 11.9879C12.4787 13.1393 11.2688 13.9817 9.89019 14.3893C8.51161 14.7969 7.03811 14.7479 5.68957 14.2497C4.34102 13.7515 3.18969 12.8307 2.40723 11.6247C1.62476 10.4186 1.25311 8.99205 1.34769 7.55755C1.44227 6.12305 1.99806 4.75756 2.93211 3.66473C3.86615 2.57189 5.12849 1.81026 6.53074 1.49344C7.93299 1.17663 9.40041 1.32157 10.7133 1.90667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.6667 2.66667L8 9.34L6 7.34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 4V8L10.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.33333 13.3333V14.1667C3.33333 15.5474 4.45262 16.6667 5.83333 16.6667H14.1667C15.5474 16.6667 16.6667 15.5474 16.6667 14.1667V13.3333M13.3333 6.66667L10 3.33333M10 3.33333L6.66667 6.66667M10 3.33333V12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MoreIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="4" r="1.5" fill="currentColor"/>
    <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
    <circle cx="10" cy="16" r="1.5" fill="currentColor"/>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.3333 2.00004C11.5084 1.82494 11.7163 1.68605 11.9451 1.59129C12.1739 1.49653 12.4191 1.44775 12.6667 1.44775C12.9143 1.44775 13.1594 1.49653 13.3883 1.59129C13.6171 1.68605 13.825 1.82494 14 2.00004C14.1751 2.17513 14.314 2.383 14.4087 2.61182C14.5035 2.84064 14.5523 3.08582 14.5523 3.33337C14.5523 3.58092 14.5035 3.8261 14.4087 4.05492C14.314 4.28374 14.1751 4.49161 14 4.66671L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00004Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.75 3V6.75H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.25 15V11.25H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.2775 6.75C3.5858 5.86195 4.10436 5.06219 4.78789 4.4196C5.47143 3.77702 6.29962 3.30984 7.2021 3.05785C8.10458 2.80585 9.05394 2.77664 9.97037 2.97253C10.8868 3.16843 11.7422 3.58372 12.465 4.18125L15.75 6.75M2.25 11.25L5.535 13.8188C6.25778 14.4163 7.1132 14.8316 8.02963 15.0275C8.94606 15.2234 9.89542 15.1942 10.7979 14.9422C11.7004 14.6902 12.5286 14.223 13.2121 13.5804C13.8956 12.9378 14.4142 12.138 14.7225 11.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function FileManagerPage() {
  // State
  const [tree, setTree] = useState<FormationNode[]>([]);
  const [stats, setStats] = useState<TreeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Navigation state
  const [currentView, setCurrentView] = useState<ViewType>("formations");
  const [selectedFormation, setSelectedFormation] = useState<FormationNode | null>(null);
  const [selectedApprenant, setSelectedApprenant] = useState<ApprenantNode | null>(null);

  // Modal preview pour fichiers
  const [previewFile, setPreviewFile] = useState<FileNode | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Modal preview pour documents d'apprenants (avec TipTap)
  const [previewDoc, setPreviewDoc] = useState<ApprenantDoc | null>(null);
  const [showDocPreviewModal, setShowDocPreviewModal] = useState(false);
  const [docContent, setDocContent] = useState<string>("");
  const [editedDocContent, setEditedDocContent] = useState<string>("");
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingDoc, setIsSavingDoc] = useState(false);

  // Modal d'envoi par email
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendEmail, setSendEmail] = useState("");
  const [sendSubject, setSendSubject] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [isSendingDoc, setIsSendingDoc] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Pagination du document
  const [measuredPages, setMeasuredPages] = useState<string[]>([""]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Charger l'arborescence
  const fetchTree = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/files/tree");
      if (response.ok) {
        const data = await response.json();
        setTree(data.tree);
        setStats(data.stats);
        return data.tree; // Retourner les données pour usage ultérieur
      }
      return null;
    } catch (error) {
      console.error("Erreur chargement arborescence:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Rafraîchir et préserver la sélection
  const refreshAndPreserveSelection = useCallback(async () => {
    const newTree = await fetchTree();
    if (newTree && selectedFormation) {
      const updatedFormation = newTree.find((f: FormationNode) => f.id === selectedFormation.id);
      if (updatedFormation) {
        setSelectedFormation(updatedFormation);

        if (selectedApprenant) {
          const updatedApprenant = updatedFormation.apprenants.find((a: ApprenantNode) => a.id === selectedApprenant.id);
          if (updatedApprenant) {
            setSelectedApprenant(updatedApprenant);
          }
        }
      }
    }
  }, [fetchTree, selectedFormation, selectedApprenant]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // Navigation
  const navigateToFormation = (formation: FormationNode) => {
    setSelectedFormation(formation);
    setSelectedApprenant(null);
    setCurrentView("apprenants");
  };

  // Ouvrir un document dans le modal de preview
  const openDocumentPreview = async (doc: ApprenantDoc) => {
    setPreviewDoc(doc);
    setShowDocPreviewModal(true);
    setIsLoadingDoc(true);
    setIsEditMode(false);

    try {
      // Charger le contenu du fichier depuis l'API
      const response = await fetch(`/api/files/${doc.id}/content`);
      if (response.ok) {
        const data = await response.json();
        const content = data.content || "";
        setDocContent(content);
        setEditedDocContent(content);
      } else {
        // Si pas de contenu, afficher un message
        setDocContent("<p>Contenu non disponible pour ce document.</p>");
        setEditedDocContent("<p>Contenu non disponible pour ce document.</p>");
      }
    } catch (error) {
      console.error("Erreur chargement contenu:", error);
      setDocContent("<p>Erreur lors du chargement du contenu.</p>");
      setEditedDocContent("<p>Erreur lors du chargement du contenu.</p>");
    } finally {
      setIsLoadingDoc(false);
    }
  };

  // Effet pour paginer automatiquement le contenu du document
  useEffect(() => {
    if (isEditMode || !docContent || isLoadingDoc) return;

    const paginateContent = async () => {
      const content = docContent;
      if (!content || content.trim() === "") {
        setMeasuredPages([""]);
        setTotalPages(1);
        return;
      }

      // Créer un conteneur temporaire pour mesurer
      const tempContainer = window.document.createElement("div");
      tempContainer.className = "document-preview";
      tempContainer.style.cssText = `
        position: absolute;
        visibility: hidden;
        width: ${A4_WIDTH_PX - (MARGIN_MM * 2 * MM_TO_PX)}px;
        font-family: 'Georgia', 'Times New Roman', serif;
        font-size: 11pt;
        line-height: 1.6;
      `;

      // Ajouter les styles
      const styleElement = window.document.createElement("style");
      styleElement.textContent = `
        .document-preview h1 { font-size: 18pt; font-weight: 700; margin: 0 0 16px 0; }
        .document-preview h2 { font-size: 13pt; font-weight: 700; margin: 24px 0 12px 0; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; }
        .document-preview h3, .document-preview h4 { font-size: 11pt; font-weight: 700; margin: 16px 0 8px 0; }
        .document-preview p { margin: 0 0 10px 0; text-align: justify; }
        .document-preview ul, .document-preview ol { margin: 10px 0; padding-left: 24px; }
        .document-preview li { margin: 4px 0; }
        .document-preview table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        .document-preview td, .document-preview th { border: 1px solid #ddd; padding: 8px 12px; }
        .document-preview th { background: #f5f5f5; font-weight: 700; }
        .document-preview .module-section { background: #f9f9f9; border-left: 3px solid #4277FF; padding: 12px 16px; margin: 12px 0; }
      `;
      tempContainer.appendChild(styleElement);
      tempContainer.innerHTML += content;
      window.document.body.appendChild(tempContainer);

      // Force reflow
      tempContainer.offsetHeight;

      const totalHeight = tempContainer.scrollHeight;

      if (totalHeight <= PAGE_CONTENT_HEIGHT_PX) {
        // Le contenu tient sur une page
        setMeasuredPages([content]);
        setTotalPages(1);
      } else {
        // Le contenu doit être divisé en plusieurs pages
        const allPages: string[] = [];
        const children = Array.from(tempContainer.children).filter(el => el.tagName !== "STYLE");
        let currentPageHtml = "";
        let currentHeight = 0;

        for (const child of children) {
          const childHeight = (child as HTMLElement).offsetHeight || 0;

          if (currentHeight + childHeight > PAGE_CONTENT_HEIGHT_PX && currentPageHtml) {
            allPages.push(currentPageHtml);
            currentPageHtml = (child as HTMLElement).outerHTML;
            currentHeight = childHeight;
          } else {
            currentPageHtml += (child as HTMLElement).outerHTML;
            currentHeight += childHeight;
          }
        }

        if (currentPageHtml) {
          allPages.push(currentPageHtml);
        }

        setMeasuredPages(allPages.length > 0 ? allPages : [content]);
        setTotalPages(Math.max(1, allPages.length));
      }

      window.document.body.removeChild(tempContainer);
    };

    // Petit délai pour s'assurer que le DOM est prêt
    const timer = setTimeout(paginateContent, 100);
    return () => clearTimeout(timer);
  }, [docContent, isEditMode, isLoadingDoc]);

  // Sauvegarder les modifications du document
  const saveDocContent = async () => {
    if (!previewDoc) return;

    setIsSavingDoc(true);
    try {
      const response = await fetch(`/api/files/${previewDoc.id}/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editedDocContent }),
      });

      if (response.ok) {
        setDocContent(editedDocContent);
        setIsEditMode(false);
        // Rafraîchir la liste pour mettre à jour le statut
        refreshAndPreserveSelection();
      } else {
        alert("Erreur lors de la sauvegarde du document.");
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("Erreur lors de la sauvegarde du document.");
    } finally {
      setIsSavingDoc(false);
    }
  };

  // Télécharger un document en PDF (avec contenu déjà chargé)
  const downloadDocAsPDF = (doc: ApprenantDoc, content: string) => {
    if (!content || content.trim() === "") {
      alert("Le contenu du document n'est pas disponible.");
      return;
    }

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
        <style>
          @page { size: A4; margin: 20mm; }
          * { box-sizing: border-box; }
          body {
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1a1a1a;
            margin: 0;
            padding: 20px;
          }
          h1 {
            font-size: 18pt;
            font-weight: 700;
            color: #111;
            margin: 0 0 16px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          h2 {
            font-size: 13pt;
            font-weight: 700;
            color: #222;
            margin: 24px 0 12px 0;
            border-bottom: 1px solid #e5e5e5;
            padding-bottom: 6px;
          }
          h3, h4 {
            font-size: 11pt;
            font-weight: 700;
            color: #333;
            margin: 16px 0 8px 0;
          }
          p {
            margin: 0 0 10px 0;
            text-align: justify;
          }
          p[style*="text-align: center"] {
            text-align: center !important;
          }
          hr {
            border: none;
            border-top: 2px solid #333;
            margin: 20px 0;
          }
          ul, ol {
            margin: 10px 0;
            padding-left: 24px;
          }
          li {
            margin: 4px 0;
          }
          ul li::marker {
            color: #4277FF;
          }
          strong {
            font-weight: 700;
          }
          em {
            font-style: italic;
          }
          .module-section {
            background: #f9f9f9;
            border-left: 3px solid #4277FF;
            padding: 12px 16px;
            margin: 12px 0;
            border-radius: 0 4px 4px 0;
          }
          .module-section h4 {
            margin-top: 0;
            color: #4277FF;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
          }
          td, th {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
          }
          th {
            background: #f5f5f5;
            font-weight: 700;
          }
          img {
            max-width: 100%;
            height: auto;
          }
        </style>
      </head>
      <body>
        ${content}
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

  // Télécharger un document en PDF (charge le contenu d'abord)
  const downloadDocWithLoad = async (doc: ApprenantDoc) => {
    try {
      const response = await fetch(`/api/files/${doc.id}/content`);
      if (response.ok) {
        const data = await response.json();
        const content = data.content || "";
        if (content) {
          downloadDocAsPDF(doc, content);
        } else {
          alert("Le contenu du document n'est pas disponible.");
        }
      } else {
        alert("Erreur lors du chargement du document.");
      }
    } catch (error) {
      console.error("Erreur chargement document:", error);
      alert("Erreur lors du chargement du document.");
    }
  };

  // Ouvrir le modal d'envoi
  const openSendModal = (doc: ApprenantDoc) => {
    setSendEmail(selectedApprenant?.email || "");
    setSendSubject(`Document: ${doc.titre}`);
    setSendMessage(`Bonjour,\n\nVeuillez trouver ci-joint le document "${doc.titre}".\n\nCordialement`);
    setSendSuccess(false);
    setShowSendModal(true);
  };

  // Envoyer le document par email
  const sendDocument = async () => {
    if (!previewDoc || !sendEmail) return;

    setIsSendingDoc(true);
    try {
      // Charger le contenu si nécessaire
      let contentToSend = docContent;
      if (!contentToSend || contentToSend.trim() === "") {
        const contentResponse = await fetch(`/api/files/${previewDoc.id}/content`);
        if (contentResponse.ok) {
          const contentData = await contentResponse.json();
          contentToSend = contentData.content || "";
        }
      }

      const response = await fetch("/api/documents/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: previewDoc.id,
          email: sendEmail,
          subject: sendSubject,
          message: sendMessage,
          content: contentToSend,
        }),
      });

      if (response.ok) {
        setSendSuccess(true);
        // Rafraîchir la liste après envoi
        setTimeout(() => {
          setShowSendModal(false);
          refreshAndPreserveSelection();
        }, 2000);
      } else {
        const data = await response.json();
        alert(data.error || "Erreur lors de l'envoi du document.");
      }
    } catch (error) {
      console.error("Erreur envoi:", error);
      alert("Erreur lors de l'envoi du document.");
    } finally {
      setIsSendingDoc(false);
    }
  };

  const navigateToApprenant = (apprenant: ApprenantNode) => {
    setSelectedApprenant(apprenant);
    setCurrentView("documents");
  };

  const navigateBack = () => {
    if (currentView === "documents") {
      setSelectedApprenant(null);
      setCurrentView("apprenants");
    } else if (currentView === "apprenants") {
      setSelectedFormation(null);
      setCurrentView("formations");
    }
  };

  const navigateHome = () => {
    setSelectedFormation(null);
    setSelectedApprenant(null);
    setCurrentView("formations");
  };

  // Breadcrumbs
  const breadcrumbs: Breadcrumb[] = [
    { label: "Mes Fichiers", onClick: navigateHome },
  ];
  if (selectedFormation) {
    breadcrumbs.push({
      label: selectedFormation.titre,
      onClick: () => {
        setSelectedApprenant(null);
        setCurrentView("apprenants");
      }
    });
  }
  if (selectedApprenant) {
    breadcrumbs.push({
      label: `${selectedApprenant.prenom} ${selectedApprenant.nom}`,
      onClick: () => {}
    });
  }

  // Filtrer selon la recherche
  const filteredFormations = tree.filter((formation) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    if (formation.titre.toLowerCase().includes(query)) return true;
    if (formation.apprenants.some((a) =>
      `${a.prenom} ${a.nom}`.toLowerCase().includes(query) ||
      a.email.toLowerCase().includes(query)
    )) return true;
    return false;
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Mes Fichiers
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gérez vos documents organisés par formation et par apprenant
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats rapides */}
            {stats && (
              <div className="hidden lg:flex items-center gap-4 mr-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="text-gray-600 dark:text-gray-400">{stats.totalFormations} formations</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-gray-600 dark:text-gray-400">{stats.totalDocuments} documents</span>
                </div>
              </div>
            )}

            <button
              onClick={() => refreshAndPreserveSelection()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
              title="Actualiser"
            >
              <span className={isLoading ? "animate-spin" : ""}>
                <RefreshIcon />
              </span>
            </button>

            <button className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm hover:shadow-md">
              <UploadIcon />
              Importer
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm overflow-x-auto">
          <button
            onClick={navigateHome}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <HomeIcon />
          </button>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <ChevronRightIcon />
              <button
                onClick={crumb.onClick}
                className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  index === breadcrumbs.length - 1
                    ? "font-medium text-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {crumb.label}
              </button>
            </React.Fragment>
          ))}
        </nav>

        {/* Search and View toggle */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm"
            />
          </div>

          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              <GridIcon />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              <ListIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-24"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Chargement des fichiers...</p>
            </div>
          </motion.div>
        ) : currentView === "formations" ? (
          // Formations Grid
          <motion.div
            key="formations"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
          >
            {filteredFormations.length === 0 ? (
              <div className="text-center py-24">
                <FolderClosedIcon className="mx-auto mb-4" color="#CBD5E1" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? "Aucun résultat trouvé" : "Aucune formation avec documents"}
                </p>
                <Link
                  href="/automate/create"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  Créer une formation →
                </Link>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredFormations.map((formation) => (
                  <motion.button
                    key={formation.id}
                    variants={itemVariants}
                    onClick={() => navigateToFormation(formation)}
                    className="group flex flex-col items-center p-4 rounded-2xl border border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/50 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-700 dark:hover:bg-brand-500/10 transition-all duration-200 text-center"
                  >
                    <div className="relative mb-3 transform group-hover:scale-105 transition-transform">
                      <FolderClosedIcon />
                      {/* Badge count */}
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {formation.apprenantsCount}
                      </div>
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
                      {formation.titre}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[formation.status]?.dot || "bg-gray-400"}`}></span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formation.documentsCount} docs
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              // List view
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apprenants</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {filteredFormations.map((formation) => (
                      <motion.tr
                        key={formation.id}
                        variants={itemVariants}
                        onClick={() => navigateToFormation(formation)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <FolderClosedIcon className="w-10 h-10" />
                            <span className="font-medium text-gray-900 dark:text-white">{formation.titre}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[formation.status]?.bg || "bg-gray-100"} ${STATUS_CONFIG[formation.status]?.color || "text-gray-600"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[formation.status]?.dot || "bg-gray-400"}`}></span>
                            {STATUS_CONFIG[formation.status]?.label || formation.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formation.apprenantsCount}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formation.documentsCount}</td>
                        <td className="px-4 py-3 text-right">
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors">
                            <MoreIcon />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        ) : currentView === "apprenants" && selectedFormation ? (
          // Apprenants Grid
          <motion.div
            key="apprenants"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
          >
            {/* Formation header info */}
            <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-gray-800 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <FolderOpenIcon color="#3B82F6" className="w-12 h-12" />
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">{selectedFormation.titre}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedFormation.sessionsCount} session(s) • {selectedFormation.apprenantsCount} apprenant(s) • {selectedFormation.documentsCount} document(s)
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${STATUS_CONFIG[selectedFormation.status]?.bg || "bg-gray-100"} ${STATUS_CONFIG[selectedFormation.status]?.color || "text-gray-600"}`}>
                  {STATUS_CONFIG[selectedFormation.status]?.label || selectedFormation.status}
                </span>
              </div>
            </div>

            {selectedFormation.apprenants.length === 0 ? (
              <div className="text-center py-16">
                <UserFolderIcon className="mx-auto mb-4 w-20 h-20 opacity-50" />
                <p className="text-gray-500 dark:text-gray-400">Aucun apprenant inscrit à cette formation</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {/* Documents de session (folder spécial) */}
                {selectedFormation.sessionDocuments.length > 0 && (
                  <motion.div
                    variants={itemVariants}
                    className="flex flex-col items-center p-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/30"
                  >
                    <FolderClosedIcon className="mb-3" color="#6B7280" />
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 text-sm text-center mb-1">
                      Documents de session
                    </h3>
                    <span className="text-xs text-gray-500">
                      {selectedFormation.sessionDocuments.length} docs
                    </span>
                  </motion.div>
                )}

                {/* Apprenants */}
                {selectedFormation.apprenants.map((apprenant) => (
                  <motion.button
                    key={apprenant.id}
                    variants={itemVariants}
                    onClick={() => navigateToApprenant(apprenant)}
                    className="group flex flex-col items-center p-4 rounded-2xl border border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/50 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-amber-700 dark:hover:bg-amber-500/10 transition-all duration-200"
                  >
                    <div className="relative mb-3 transform group-hover:scale-105 transition-transform">
                      <UserFolderIcon />
                      {/* Badge documents */}
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {apprenant.documents.length}
                      </div>
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm text-center mb-0.5">
                      {apprenant.prenom} {apprenant.nom}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-full">
                      {apprenant.email}
                    </p>
                    {/* Status indicators */}
                    <div className="flex items-center gap-3 mt-2">
                      {apprenant.signedDocuments > 0 && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircleIcon /> {apprenant.signedDocuments}
                        </span>
                      )}
                      {apprenant.pendingDocuments > 0 && (
                        <span className="flex items-center gap-1 text-xs text-amber-600">
                          <ClockIcon /> {apprenant.pendingDocuments}
                        </span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              // List view
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apprenant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signés</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">En attente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {selectedFormation.apprenants.map((apprenant) => (
                      <motion.tr
                        key={apprenant.id}
                        variants={itemVariants}
                        onClick={() => navigateToApprenant(apprenant)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 font-medium">
                              {apprenant.prenom[0]}{apprenant.nom[0]}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {apprenant.prenom} {apprenant.nom}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{apprenant.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{apprenant.documents.length}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircleIcon /> {apprenant.signedDocuments}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-sm text-amber-600">
                            <ClockIcon /> {apprenant.pendingDocuments}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        ) : currentView === "documents" && selectedApprenant ? (
          // Documents Grid
          <motion.div
            key="documents"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
          >
            {/* Apprenant header info */}
            <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-gray-800 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 text-lg font-bold">
                    {selectedApprenant.prenom[0]}{selectedApprenant.nom[0]}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {selectedApprenant.prenom} {selectedApprenant.nom}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedApprenant.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircleIcon />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      {selectedApprenant.signedDocuments} signés
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <ClockIcon />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      {selectedApprenant.pendingDocuments} en attente
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {selectedApprenant.documents.length === 0 ? (
              <div className="text-center py-16">
                <DocumentIcon type="AUTRE" className="mx-auto mb-4 opacity-50" />
                <p className="text-gray-500 dark:text-gray-400">Aucun document pour cet apprenant</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {selectedApprenant.documents.map((doc) => {
                  const config = DOCTYPE_CONFIG[doc.type] || DOCTYPE_CONFIG.AUTRE;
                  return (
                    <motion.div
                      key={doc.id}
                      variants={itemVariants}
                      className="group relative flex flex-col items-center p-4 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700 transition-all duration-200"
                    >
                      {/* Status badge */}
                      {(() => {
                        const statusDisplay = getDocStatusDisplay(doc);
                        return (
                          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusDisplay.bgClass} ${statusDisplay.textClass}`}>
                            {statusDisplay.label}
                          </div>
                        );
                      })()}

                      <DocumentIcon type={doc.type} className="mb-3 transform group-hover:scale-105 transition-transform" />

                      <h3 className="font-medium text-gray-900 dark:text-white text-sm text-center line-clamp-2 mb-1">
                        {doc.titre}
                      </h3>
                      <span className="text-xs text-gray-500 mb-1">{config.label}</span>
                      <span className="text-xs text-gray-400">{formatDate(doc.createdAt)}</span>

                      {/* Actions on hover */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-white via-white dark:from-gray-900 dark:via-gray-900 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openDocumentPreview(doc)}
                            className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors dark:hover:bg-brand-900/20"
                            title="Voir"
                          >
                            <EyeIcon />
                          </button>
                          <button
                            onClick={() => downloadDocWithLoad(doc)}
                            className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors dark:hover:bg-brand-900/20"
                            title="Télécharger"
                          >
                            <DownloadIcon />
                          </button>
                          <button
                            onClick={() => {
                              setPreviewDoc(doc);
                              openSendModal(doc);
                            }}
                            className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors dark:hover:bg-brand-900/20"
                            title="Partager par email"
                          >
                            <SendIcon />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              // List view
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {selectedApprenant.documents.map((doc) => {
                      const config = DOCTYPE_CONFIG[doc.type] || DOCTYPE_CONFIG.AUTRE;
                      return (
                        <motion.tr
                          key={doc.id}
                          variants={itemVariants}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{config.icon}</span>
                              <span className="font-medium text-gray-900 dark:text-white">{doc.titre}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{config.label}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatDate(doc.createdAt)}</td>
                          <td className="px-4 py-3">
                            {(() => {
                              const statusDisplay = getDocStatusDisplay(doc);
                              return (
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusDisplay.bgClass} ${statusDisplay.textClass}`}>
                                  {doc.isSigned && <CheckCircleIcon />}
                                  {doc.status === "PENDING_SIGNATURE" && !doc.isSigned && <ClockIcon />}
                                  {statusDisplay.label}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openDocumentPreview(doc)}
                                className="p-1.5 text-gray-400 hover:text-brand-600 rounded transition-colors"
                                title="Voir"
                              >
                                <EyeIcon />
                              </button>
                              <button
                                onClick={() => downloadDocWithLoad(doc)}
                                className="p-1.5 text-gray-400 hover:text-brand-600 rounded transition-colors"
                                title="Télécharger"
                              >
                                <DownloadIcon />
                              </button>
                              <button
                                onClick={() => {
                                  setPreviewDoc(doc);
                                  openSendModal(doc);
                                }}
                                className="p-1.5 text-gray-400 hover:text-brand-600 rounded transition-colors"
                                title="Partager par email"
                              >
                                <SendIcon />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Stats footer */}
      {stats && currentView === "formations" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalFormations}</p>
            <p className="text-sm text-gray-500">Formations</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalApprenants}</p>
            <p className="text-sm text-gray-500">Apprenants</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalDocuments}</p>
            <p className="text-sm text-gray-500">Documents</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center gap-2">
              <CheckCircleIcon />
              <p className="text-3xl font-bold text-green-600">{stats.signedDocuments}</p>
            </div>
            <p className="text-sm text-gray-500">Signés</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center gap-2">
              <ClockIcon />
              <p className="text-3xl font-bold text-amber-600">{stats.pendingDocuments}</p>
            </div>
            <p className="text-sm text-gray-500">En attente</p>
          </div>
        </motion.div>
      )}

      {/* Modal de preview pour fichiers */}
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

      {/* Modal de preview pour documents d'apprenants avec TipTap */}
      <AnimatePresence>
        {showDocPreviewModal && previewDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowDocPreviewModal(false);
              setIsEditMode(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg ${isEditMode ? "bg-amber-50 dark:bg-amber-500/10" : "bg-brand-50 dark:bg-brand-500/10"}`}>
                    {isEditMode ? <EditIcon /> : <EyeIcon />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {previewDoc.titre}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isEditMode ? "Mode édition" : "Aperçu"} • {DOCTYPE_CONFIG[previewDoc.type]?.label || previewDoc.type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mode Aperçu / Éditer */}
                  <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button
                      onClick={() => {
                        if (isEditMode) {
                          setEditedDocContent(docContent);
                        }
                        setIsEditMode(false);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        !isEditMode
                          ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <EyeIcon />
                      <span>Aperçu</span>
                    </button>
                    <button
                      onClick={() => setIsEditMode(true)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        isEditMode
                          ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <EditIcon />
                      <span>Éditer</span>
                    </button>
                  </div>

                  {/* Bouton Sauvegarder (visible en mode édition) */}
                  {isEditMode && (
                    <button
                      onClick={saveDocContent}
                      disabled={isSavingDoc}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {isSavingDoc ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H10.6667L14 5.33333V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M11.3333 14V9.33333H4.66667V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M4.66667 2V5.33333H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <span className="hidden sm:inline">Sauvegarder</span>
                    </button>
                  )}

                  {/* Envoyer par email */}
                  <button
                    onClick={() => openSendModal(previewDoc)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors"
                  >
                    <SendIcon />
                    <span className="hidden sm:inline">Envoyer</span>
                  </button>

                  {/* Télécharger PDF */}
                  <button
                    onClick={() => downloadDocAsPDF(previewDoc, isEditMode ? editedDocContent : docContent)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <DownloadIcon />
                    <span className="hidden sm:inline">Télécharger PDF</span>
                  </button>

                  {/* Fermer */}
                  <button
                    onClick={() => {
                      setShowDocPreviewModal(false);
                      setIsEditMode(false);
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <XIcon />
                  </button>
                </div>
              </div>

              {/* Contenu */}
              <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-950">
                {isLoadingDoc ? (
                  <div className="flex items-center justify-center h-full py-12">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="animate-spin h-8 w-8 text-brand-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-gray-500 dark:text-gray-400">Chargement du document...</span>
                    </div>
                  </div>
                ) : isEditMode ? (
                  /* Mode édition avec TipTap */
                  <div className="h-full">
                    <DocumentEditor
                      initialContent={editedDocContent}
                      onChange={(html) => setEditedDocContent(html)}
                      placeholder="Commencez à écrire..."
                    />
                  </div>
                ) : (
                  /* Mode aperçu avec style document */
                  <>
                    {/* Styles CSS pour le document */}
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
                      .document-preview-content .page-footer {
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

                    <div
                      ref={scrollContainerRef}
                      className="flex flex-col items-center gap-8 py-8 overflow-auto"
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
                      {/* Pages A4 */}
                      {measuredPages.map((pageContent, pageIndex) => (
                        <div
                          key={pageIndex}
                          className="bg-white shadow-2xl document-preview-content"
                          style={{
                            width: `${A4_WIDTH_PX}px`,
                            minHeight: `${A4_HEIGHT_PX}px`,
                            padding: `${MARGIN_MM * MM_TO_PX}px`,
                            display: "flex",
                            flexDirection: "column",
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
                            <div></div>
                            <div className="text-right font-medium">
                              Page {pageIndex + 1} / {totalPages}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Indicateur de page fixe en bas */}
                    {totalPages > 1 && (
                      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center gap-3 z-10">
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
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal d'envoi par email */}
      <AnimatePresence>
        {showSendModal && previewDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSendModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-500/10">
                    <SendIcon />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Envoyer le document
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {previewDoc.titre}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                >
                  <XIcon />
                </button>
              </div>

              {/* Contenu */}
              <div className="p-6">
                {sendSuccess ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Document envoyé !
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400">
                      Le document a été envoyé à {sendEmail}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Email destinataire */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Email du destinataire *
                      </label>
                      <input
                        type="email"
                        value={sendEmail}
                        onChange={(e) => setSendEmail(e.target.value)}
                        placeholder="exemple@email.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    {/* Objet */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Objet
                      </label>
                      <input
                        type="text"
                        value={sendSubject}
                        onChange={(e) => setSendSubject(e.target.value)}
                        placeholder="Objet du message"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Message (optionnel)
                      </label>
                      <textarea
                        value={sendMessage}
                        onChange={(e) => setSendMessage(e.target.value)}
                        placeholder="Ajoutez un message personnalisé..."
                        rows={4}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-none"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setShowSendModal(false)}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={sendDocument}
                        disabled={!sendEmail || isSendingDoc}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSendingDoc ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span>Envoi en cours...</span>
                          </>
                        ) : (
                          <>
                            <SendIcon />
                            <span>Envoyer</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
