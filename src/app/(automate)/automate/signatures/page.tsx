"use client";

// ===========================================
// SIGNATURES ÉLECTRONIQUES - Sélection de documents existants
// ===========================================
// Workflow: Sélectionner Formation → Apprenant → Documents → Envoyer/QR Code

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

// Types
interface Apprenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Formation {
  id: string;
  titre: string;
  status: string;
  sessions: {
    id: string;
    dateDebut: string;
    dateFin: string;
    participants: Apprenant[];
  }[];
}

interface GeneratedDocument {
  id: string;
  type: string;
  titre: string;
  status: string;
  createdAt: string;
  formationId: string;
  apprenantId?: string;
  apprenantNom?: string;
  signatureStatus?: "UNSIGNED" | "PENDING" | "SIGNED";
  signedAt?: string;
}

interface SignatureRequest {
  id: string;
  documentId: string;
  documentTitre: string;
  documentType: string;
  destinataireNom: string;
  destinataireEmail: string;
  status: "DRAFT" | "PENDING_SIGNATURE" | "SIGNED" | "EXPIRED";
  token: string;
  createdAt: string;
  sentAt?: string;
  signedAt?: string;
  signatureData?: {
    signataireName: string;
    ipAddress: string;
    signedAt: string;
  };
}

// Icons
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M9.16667 3.33333C5.94501 3.33333 3.33333 5.94501 3.33333 9.16667C3.33333 12.3883 5.94501 15 9.16667 15C12.3883 15 15 12.3883 15 9.16667C15 5.94501 12.3883 3.33333 9.16667 3.33333ZM1.66667 9.16667C1.66667 5.02453 5.02453 1.66667 9.16667 1.66667C13.3088 1.66667 16.6667 5.02453 16.6667 9.16667C16.6667 10.9378 16.0528 12.5654 15.0274 13.8565L18.0893 16.9107C18.4147 17.2362 18.4147 17.7638 18.0893 18.0893C17.7638 18.4147 17.2362 18.4147 16.9107 18.0893L13.8565 15.0274C12.5654 16.0528 10.9378 16.6667 9.16667 16.6667C5.02453 16.6667 1.66667 13.3088 1.66667 9.16667Z" fill="currentColor"/>
  </svg>
);

const FolderIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6C3 4.89543 3.89543 4 5 4H8.58579C9.11622 4 9.62493 4.21071 10 4.58579L11.4142 6H19C20.1046 6 21 6.89543 21 8V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V6Z" fill="#3B82F6"/>
    <path d="M3 8H21V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V8Z" fill="#60A5FA"/>
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 10C12.0711 10 13.75 8.32107 13.75 6.25C13.75 4.17893 12.0711 2.5 10 2.5C7.92893 2.5 6.25 4.17893 6.25 6.25C6.25 8.32107 7.92893 10 10 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.25 17.5C16.25 14.3934 13.4518 11.875 10 11.875C6.54822 11.875 3.75 14.3934 3.75 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FileTextIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.6667 1.66667H5.00004C4.55801 1.66667 4.13409 1.84226 3.82153 2.15482C3.50897 2.46738 3.33337 2.89131 3.33337 3.33334V16.6667C3.33337 17.1087 3.50897 17.5326 3.82153 17.8452C4.13409 18.1577 4.55801 18.3333 5.00004 18.3333H15C15.442 18.3333 15.866 18.1577 16.1785 17.8452C16.4911 17.5326 16.6667 17.1087 16.6667 16.6667V6.66667L11.6667 1.66667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.6666 1.66667V6.66667H16.6666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.3334 10.8333H6.66669" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.3334 14.1667H6.66669" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.5 2.5L9.16667 10.8333M17.5 2.5L11.6667 17.5L9.16667 10.8333M17.5 2.5L2.5 8.33333L9.16667 10.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const QrCodeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2.5" y="2.5" width="5.83333" height="5.83333" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="2.5" y="11.6667" width="5.83333" height="5.83333" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11.6667" y="2.5" width="5.83333" height="5.83333" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11.6667" y="11.6667" width="2.5" height="2.5" fill="currentColor"/>
    <rect x="15" y="11.6667" width="2.5" height="2.5" fill="currentColor"/>
    <rect x="11.6667" y="15" width="2.5" height="2.5" fill="currentColor"/>
    <rect x="15" y="15" width="2.5" height="2.5" fill="currentColor"/>
    <rect x="4.16667" y="4.16667" width="2.5" height="2.5" fill="currentColor"/>
    <rect x="4.16667" y="13.3333" width="2.5" height="2.5" fill="currentColor"/>
    <rect x="13.3333" y="4.16667" width="2.5" height="2.5" fill="currentColor"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.5 8.29V9C16.4991 10.6172 15.9754 12.191 15.007 13.4864C14.0386 14.7818 12.6775 15.7294 11.1265 16.1866C9.57557 16.6439 7.91794 16.5864 6.40333 16.0228C4.88872 15.4592 3.59793 14.4196 2.7223 13.0623C1.84666 11.705 1.43081 10.1022 1.53921 8.48918C1.64762 6.87614 2.27462 5.33878 3.32588 4.10041C4.37714 2.86204 5.79748 1.98592 7.37739 1.60896C8.95729 1.232 10.6142 1.37385 12.1087 2.0138" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.5 3L9 10.5075L6.75 8.2575" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9 4.5V9L12 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PrintIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.75 5.25V2.25H5.25V5.25M12.75 12.75H14.25C15.0784 12.75 15.75 12.0784 15.75 11.25V7.5C15.75 6.67157 15.0784 6 14.25 6H3.75C2.92157 6 2.25 6.67157 2.25 7.5V11.25C2.25 12.0784 2.92157 12.75 3.75 12.75H5.25M5.25 9.75H12.75V15.75H5.25V9.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 12V4C3 3.44772 3.44772 3 4 3H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
    <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LoaderIcon = () => (
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const PenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.1667 2.49998C14.3856 2.28111 14.6454 2.10749 14.9314 1.98903C15.2173 1.87057 15.5238 1.80963 15.8334 1.80963C16.1429 1.80963 16.4494 1.87057 16.7354 1.98903C17.0214 2.10749 17.2812 2.28111 17.5 2.49998C17.7189 2.71884 17.8925 2.97869 18.011 3.26466C18.1294 3.55063 18.1904 3.85716 18.1904 4.16665C18.1904 4.47613 18.1294 4.78266 18.011 5.06863C17.8925 5.35461 17.7189 5.61445 17.5 5.83331L6.25004 17.0833L1.66671 18.3333L2.91671 13.75L14.1667 2.49998Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Document types
const DOCTYPE_LABELS: Record<string, string> = {
  CONVENTION: "Convention de formation",
  CONVOCATION: "Convocation",
  ATTESTATION_FIN: "Attestation de fin de formation",
  ATTESTATION_PRESENCE: "Attestation de présence",
  PROGRAMME: "Programme de formation",
  REGLEMENT_INTERIEUR: "Règlement intérieur",
  DEVIS: "Devis",
  FACTURE: "Facture",
  EMARGEMENT: "Feuille d'émargement",
  AUTRE: "Autre document",
};

// Status colors
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Brouillon", color: "text-gray-600", bg: "bg-gray-100 dark:bg-gray-800", icon: null },
  PENDING_SIGNATURE: { label: "En attente", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30", icon: <ClockIcon /> },
  SIGNED: { label: "Signé", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30", icon: <CheckCircleIcon /> },
  EXPIRED: { label: "Expiré", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30", icon: null },
  CANCELLED: { label: "Annulé", color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-800", icon: null },
};

// Format date
const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Étapes du wizard
type WizardStep = "formation" | "apprenant" | "documents" | "confirm";

export default function SignaturesPage() {
  // États principaux
  const [formations, setFormations] = useState<Formation[]>([]);
  const [signatureRequests, setSignatureRequests] = useState<SignatureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // États du wizard
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>("formation");
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [selectedApprenant, setSelectedApprenant] = useState<Apprenant | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<GeneratedDocument[]>([]);
  const [availableDocuments, setAvailableDocuments] = useState<GeneratedDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // États QR Code / Envoi
  const [showQRModal, setShowQRModal] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  // État détails signature
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSignature, setSelectedSignature] = useState<SignatureRequest | null>(null);

  // Email personnalisé pour l'envoi
  const [customEmail, setCustomEmail] = useState<string>("");
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  // Charger les formations (avec sessions et participants)
  const fetchFormations = useCallback(async () => {
    try {
      // Récupérer toutes les formations non archivées
      const response = await fetch("/api/formations?limit=100");
      if (response.ok) {
        const result = await response.json();
        const formationsData = result.data || [];

        // Pour chaque formation, récupérer les sessions avec participants
        const formationsWithSessions = await Promise.all(
          formationsData.map(async (formation: { id: string; titre: string; status: string }) => {
            try {
              const sessionsResponse = await fetch(`/api/formations/${formation.id}/sessions`);
              if (sessionsResponse.ok) {
                const sessionsData = await sessionsResponse.json();
                return {
                  ...formation,
                  sessions: sessionsData.sessions || [],
                };
              }
            } catch {
              // Ignorer les erreurs de sessions
            }
            return { ...formation, sessions: [] };
          })
        );

        setFormations(formationsWithSessions);
      }
    } catch (error) {
      console.error("Erreur chargement formations:", error);
    }
  }, []);

  // Charger les demandes de signature
  const fetchSignatureRequests = useCallback(async () => {
    try {
      const response = await fetch("/api/signatures");
      if (response.ok) {
        const data = await response.json();
        setSignatureRequests(data.documents || []);
      }
    } catch (error) {
      console.error("Erreur chargement signatures:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFormations();
    fetchSignatureRequests();
  }, [fetchFormations, fetchSignatureRequests]);

  // Charger les documents d'un apprenant
  const fetchApprenantDocuments = async (formationId: string, apprenantId: string) => {
    setLoadingDocs(true);
    try {
      // Récupérer les documents générés depuis l'API
      const response = await fetch(`/api/formations/${formationId}/documents?apprenantId=${apprenantId}`);

      if (response.ok) {
        const data = await response.json();
        // Filtrer pour ne garder que les documents non signés
        const unsignedDocs = (data.documents || []).filter(
          (doc: GeneratedDocument) => doc.signatureStatus !== "SIGNED"
        );
        setAvailableDocuments(unsignedDocs);
      } else {
        // Fallback: documents types par défaut si pas de documents générés
        const defaultDocs: GeneratedDocument[] = [
          {
            id: `conv-${formationId}-${apprenantId}`,
            type: "CONVENTION",
            titre: "Convention de formation",
            status: "GENERATED",
            createdAt: new Date().toISOString(),
            formationId,
            apprenantId,
            signatureStatus: "UNSIGNED",
          },
          {
            id: `convoc-${formationId}-${apprenantId}`,
            type: "CONVOCATION",
            titre: "Convocation à la formation",
            status: "GENERATED",
            createdAt: new Date().toISOString(),
            formationId,
            apprenantId,
            signatureStatus: "UNSIGNED",
          },
          {
            id: `reglement-${formationId}-${apprenantId}`,
            type: "REGLEMENT_INTERIEUR",
            titre: "Règlement intérieur",
            status: "GENERATED",
            createdAt: new Date().toISOString(),
            formationId,
            apprenantId,
            signatureStatus: "UNSIGNED",
          },
        ];
        setAvailableDocuments(defaultDocs);
      }
    } catch (error) {
      console.error("Erreur chargement documents:", error);
      setAvailableDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Sélection formation
  const handleSelectFormation = (formation: Formation) => {
    setSelectedFormation(formation);
    setSelectedApprenant(null);
    setSelectedDocuments([]);
    setWizardStep("apprenant");
  };

  // Sélection apprenant
  const handleSelectApprenant = (apprenant: Apprenant) => {
    setSelectedApprenant(apprenant);
    setSelectedDocuments([]);
    if (selectedFormation) {
      fetchApprenantDocuments(selectedFormation.id, apprenant.id);
    }
    setWizardStep("documents");
  };

  // Toggle document sélection
  const toggleDocumentSelection = (doc: GeneratedDocument) => {
    setSelectedDocuments((prev) => {
      const exists = prev.find((d) => d.id === doc.id);
      if (exists) {
        return prev.filter((d) => d.id !== doc.id);
      }
      return [...prev, doc];
    });
  };

  // Store apprenant name for QR modal (before reset)
  const [qrApprenantName, setQRApprenantName] = useState<string>("");
  const [qrDocumentTitle, setQRDocumentTitle] = useState<string>("");

  // Créer la demande de signature et afficher QR
  const handleCreateSignatureRequest = async (sendEmail: boolean = false, confirmedEmail?: string) => {
    if (!selectedFormation || !selectedApprenant || selectedDocuments.length === 0) return;

    // Utiliser l'email confirmé ou celui de l'apprenant
    const destinataireEmail = confirmedEmail || selectedApprenant.email;

    // Stocker le nom avant le reset pour l'affichage dans le modal QR
    const apprenantFullName = `${selectedApprenant.firstName} ${selectedApprenant.lastName}`;
    const docTitle = selectedDocuments[0]?.titre || "Document à signer";

    setSending(true);
    try {
      // Créer la demande de signature pour chaque document
      for (const doc of selectedDocuments) {
        const response = await fetch("/api/signatures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titre: doc.titre,
            documentType: doc.type,
            contenuHtml: `<p>Document généré pour ${apprenantFullName}</p>`,
            destinataireNom: apprenantFullName,
            destinataireEmail: destinataireEmail,
            authMethod: "EMAIL_CODE",
            sendNow: sendEmail,
            formationId: selectedFormation.id,
            apprenantId: selectedApprenant.id,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const url = `${window.location.origin}/signer/${data.document.token}`;
          setSignatureUrl(url);

          if (!sendEmail) {
            // Stocker les infos pour le QR modal
            setQRApprenantName(apprenantFullName);
            setQRDocumentTitle(docTitle);
            setShowQRModal(true);
          }
        }
      }

      if (sendEmail) {
        alert(`Email de signature envoyé à ${destinataireEmail}`);
      }

      // Rafraîchir la liste
      fetchSignatureRequests();

      // Fermer le wizard et la modal de confirmation
      setShowWizard(false);
      setShowEmailConfirmation(false);
      resetWizard();
    } catch (error) {
      console.error("Erreur création signature:", error);
      alert("Erreur lors de la création de la demande de signature");
    } finally {
      setSending(false);
    }
  };

  // Reset wizard
  const resetWizard = () => {
    setWizardStep("formation");
    setSelectedFormation(null);
    setSelectedApprenant(null);
    setSelectedDocuments([]);
    setAvailableDocuments([]);
  };

  // Copier URL
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(signatureUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Erreur copie:", error);
    }
  };

  // Télécharger QR Code (convert SVG to PNG)
  const handleDownloadQR = () => {
    const svg = document.getElementById("signature-qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `signature-qr-${qrApprenantName.replace(/\s+/g, "-")}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Imprimer QR Code
  const handlePrintQR = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code Signature - ${qrDocumentTitle}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              text-align: center;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 8px;
            }
            p {
              color: #666;
              margin-bottom: 24px;
            }
            .qr-container {
              display: inline-block;
              padding: 24px;
              border: 2px solid #000;
              border-radius: 12px;
            }
            .instructions {
              margin-top: 24px;
              font-size: 14px;
              color: #666;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>${qrDocumentTitle}</h1>
          <p>Document à signer par ${qrApprenantName}</p>
          <div class="qr-container">
            ${document.getElementById("signature-qr-code-svg")?.outerHTML || ""}
          </div>
          <p class="instructions">
            Scannez ce QR code pour signer le document
          </p>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Obtenir tous les apprenants de la formation
  const getFormationApprenants = (formation: Formation): Apprenant[] => {
    const map = new Map<string, Apprenant>();
    formation.sessions.forEach((session) => {
      session.participants.forEach((p) => {
        if (!map.has(p.id)) {
          map.set(p.id, p);
        }
      });
    });
    return Array.from(map.values());
  };

  // Filtrer les formations
  const filteredFormations = formations.filter((f) =>
    f.titre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    total: signatureRequests.length,
    pending: signatureRequests.filter((s) => s.status === "PENDING_SIGNATURE").length,
    signed: signatureRequests.filter((s) => s.status === "SIGNED").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Signatures Électroniques
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Faites signer vos documents par QR code ou par email
            </p>
          </div>
          <button
            onClick={() => {
              resetWizard();
              setShowWizard(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm hover:shadow-md whitespace-nowrap"
          >
            <PenIcon />
            Faire signer un document
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10">
              <FileTextIcon />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              <p className="text-sm text-gray-500">Total demandes</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10">
              <ClockIcon />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">En attente</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-500/10">
              <CheckCircleIcon />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.signed}</p>
              <p className="text-sm text-gray-500">Signés</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des demandes de signature */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Demandes de signature</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoaderIcon />
            <span className="ml-2 text-sm text-gray-500">Chargement...</span>
          </div>
        ) : signatureRequests.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <PenIcon />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucune demande de signature
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Commencez par sélectionner un document à faire signer par un apprenant
            </p>
            <button
              onClick={() => {
                resetWizard();
                setShowWizard(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-all"
            >
              <PenIcon />
              Faire signer un document
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {signatureRequests.map((request) => {
              const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.DRAFT;
              return (
                <div
                  key={request.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                        <FileTextIcon />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {request.documentTitre}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500">
                            {request.destinataireNom}
                          </span>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <span className="text-sm text-gray-400">
                            {DOCTYPE_LABELS[request.documentType] || request.documentType}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full ${status.bg} ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>

                      <div className="flex items-center gap-1">
                        {request.status === "SIGNED" && (
                          <button
                            onClick={() => {
                              setSelectedSignature(request);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors"
                            title="Voir les détails"
                          >
                            <EyeIcon />
                          </button>
                        )}
                        {request.status === "PENDING_SIGNATURE" && (
                          <>
                            <button
                              onClick={() => {
                                const url = `${window.location.origin}/signer/${request.token}`;
                                setSignatureUrl(url);
                                setQRApprenantName(request.destinataireNom);
                                setQRDocumentTitle(request.documentTitre);
                                setShowQRModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors"
                              title="Afficher QR Code"
                            >
                              <QrCodeIcon />
                            </button>
                            <a
                              href={`/signer/${request.token}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors"
                              title="Ouvrir le lien"
                            >
                              <EyeIcon />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                    <span>Créé le {formatDate(request.createdAt)}</span>
                    {request.sentAt && <span>Envoyé le {formatDate(request.sentAt)}</span>}
                    {request.signedAt && <span className="text-green-600">Signé le {formatDateTime(request.signedAt)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowWizard(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Faire signer un document
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {wizardStep === "formation" && "Sélectionnez une formation"}
                    {wizardStep === "apprenant" && "Sélectionnez un apprenant"}
                    {wizardStep === "documents" && "Sélectionnez les documents à signer"}
                    {wizardStep === "confirm" && "Confirmez et choisissez le mode d'envoi"}
                  </p>
                </div>
                <button
                  onClick={() => setShowWizard(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <XIcon />
                </button>
              </div>

              {/* Breadcrumb */}
              <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 text-sm">
                <span className={wizardStep === "formation" ? "text-brand-600 font-medium" : "text-gray-500"}>
                  Formation
                </span>
                <ChevronRightIcon />
                <span className={wizardStep === "apprenant" ? "text-brand-600 font-medium" : "text-gray-500"}>
                  Apprenant
                </span>
                <ChevronRightIcon />
                <span className={wizardStep === "documents" ? "text-brand-600 font-medium" : "text-gray-500"}>
                  Documents
                </span>
                <ChevronRightIcon />
                <span className={wizardStep === "confirm" ? "text-brand-600 font-medium" : "text-gray-500"}>
                  Confirmation
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Étape 1: Sélection formation */}
                {wizardStep === "formation" && (
                  <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <SearchIcon />
                      </span>
                      <input
                        type="text"
                        placeholder="Rechercher une formation..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    {/* Formations grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredFormations.map((formation) => {
                        const apprenants = getFormationApprenants(formation);
                        return (
                          <button
                            key={formation.id}
                            onClick={() => handleSelectFormation(formation)}
                            className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-brand-300 hover:shadow-md transition-all text-left dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500"
                          >
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                              <FolderIcon />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {formation.titre}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {apprenants.length} apprenant{apprenants.length !== 1 ? "s" : ""} • {formation.sessions.length} session{formation.sessions.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <ChevronRightIcon />
                          </button>
                        );
                      })}
                    </div>

                    {filteredFormations.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        {searchQuery ? `Aucune formation trouvée pour "${searchQuery}"` : "Aucune formation disponible"}
                      </div>
                    )}
                  </div>
                )}

                {/* Étape 2: Sélection apprenant */}
                {wizardStep === "apprenant" && selectedFormation && (
                  <div className="space-y-4">
                    {/* Back button */}
                    <button
                      onClick={() => {
                        setWizardStep("formation");
                        setSelectedFormation(null);
                      }}
                      className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <ChevronLeftIcon />
                      Retour aux formations
                    </button>

                    {/* Formation sélectionnée */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30">
                      <FolderIcon />
                      <span className="font-medium text-brand-700 dark:text-brand-300">
                        {selectedFormation.titre}
                      </span>
                    </div>

                    {/* Apprenants */}
                    <div className="space-y-2">
                      {getFormationApprenants(selectedFormation).map((apprenant) => (
                        <button
                          key={apprenant.id}
                          onClick={() => handleSelectApprenant(apprenant)}
                          className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-brand-300 hover:shadow-md transition-all text-left dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500"
                        >
                          <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-brand-600">
                            <UserIcon />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {apprenant.firstName} {apprenant.lastName}
                            </p>
                            <p className="text-sm text-gray-500 truncate">{apprenant.email}</p>
                          </div>
                          <ChevronRightIcon />
                        </button>
                      ))}
                    </div>

                    {getFormationApprenants(selectedFormation).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Aucun apprenant inscrit à cette formation
                      </div>
                    )}
                  </div>
                )}

                {/* Étape 3: Sélection documents */}
                {wizardStep === "documents" && selectedFormation && selectedApprenant && (
                  <div className="space-y-4">
                    {/* Back button */}
                    <button
                      onClick={() => {
                        setWizardStep("apprenant");
                        setSelectedApprenant(null);
                        setSelectedDocuments([]);
                      }}
                      className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <ChevronLeftIcon />
                      Retour aux apprenants
                    </button>

                    {/* Selection résumé */}
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30 text-sm">
                        <FolderIcon />
                        <span className="text-brand-700 dark:text-brand-300">{selectedFormation.titre}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 text-sm">
                        <UserIcon />
                        <span className="text-purple-700 dark:text-purple-300">
                          {selectedApprenant.firstName} {selectedApprenant.lastName}
                        </span>
                      </div>
                    </div>

                    {/* Documents */}
                    {loadingDocs ? (
                      <div className="flex items-center justify-center py-8">
                        <LoaderIcon />
                        <span className="ml-2 text-sm text-gray-500">Chargement des documents...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Sélectionnez les documents à faire signer :
                        </p>
                        {availableDocuments.map((doc) => {
                          const isSelected = selectedDocuments.some((d) => d.id === doc.id);
                          return (
                            <button
                              key={doc.id}
                              onClick={() => toggleDocumentSelection(doc)}
                              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                                isSelected
                                  ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 shadow-sm"
                                  : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                              }`}
                            >
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected
                                  ? "border-brand-500 bg-brand-500 text-white"
                                  : "border-gray-300 dark:border-gray-600"
                              }`}>
                                {isSelected && <CheckCircleIcon />}
                              </div>
                              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                                <FileTextIcon />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {doc.titre}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {DOCTYPE_LABELS[doc.type] || doc.type} • {formatDate(doc.createdAt)}
                                </p>
                              </div>
                            </button>
                          );
                        })}

                        {availableDocuments.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            Aucun document disponible pour cet apprenant
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Étape 4: Confirmation */}
                {wizardStep === "confirm" && selectedFormation && selectedApprenant && selectedDocuments.length > 0 && (
                  <div className="space-y-6">
                    {/* Back button */}
                    <button
                      onClick={() => setWizardStep("documents")}
                      className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <ChevronLeftIcon />
                      Retour aux documents
                    </button>

                    {/* Récapitulatif */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Récapitulatif</h3>
                      </div>
                      <div className="p-4 space-y-4">
                        <div className="flex items-center gap-3">
                          <FolderIcon />
                          <div>
                            <p className="text-sm text-gray-500">Formation</p>
                            <p className="font-medium text-gray-900 dark:text-white">{selectedFormation.titre}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 flex items-center justify-center">
                            <UserIcon />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Destinataire</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedApprenant.firstName} {selectedApprenant.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{selectedApprenant.email}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Documents ({selectedDocuments.length})</p>
                          <div className="space-y-2">
                            {selectedDocuments.map((doc) => (
                              <div key={doc.id} className="flex items-center gap-2 text-sm">
                                <FileTextIcon />
                                <span className="text-gray-900 dark:text-white">{doc.titre}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => handleCreateSignatureRequest(false)}
                        disabled={sending}
                        className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-400 hover:bg-brand-50 dark:border-gray-600 dark:hover:border-brand-500 dark:hover:bg-brand-500/10 transition-all disabled:opacity-50"
                      >
                        <div className="p-3 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-600">
                          <QrCodeIcon />
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-gray-900 dark:text-white">Générer un QR Code</p>
                          <p className="text-sm text-gray-500 mt-1">Le signataire scanne pour signer</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setCustomEmail(selectedApprenant?.email || "");
                          setShowEmailConfirmation(true);
                        }}
                        disabled={sending}
                        className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 dark:border-gray-600 dark:hover:border-green-500 dark:hover:bg-green-500/10 transition-all disabled:opacity-50"
                      >
                        <div className="p-3 rounded-full bg-green-100 dark:bg-green-500/20 text-green-600">
                          <SendIcon />
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-gray-900 dark:text-white">Envoyer par email</p>
                          <p className="text-sm text-gray-500 mt-1">Confirmer l'adresse email</p>
                        </div>
                      </button>
                    </div>

                    {sending && (
                      <div className="flex items-center justify-center gap-2 text-brand-600">
                        <LoaderIcon />
                        <span>Création en cours...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {wizardStep === "documents" && selectedDocuments.length > 0 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedDocuments.length} document{selectedDocuments.length !== 1 ? "s" : ""} sélectionné{selectedDocuments.length !== 1 ? "s" : ""}
                    </p>
                    <button
                      onClick={() => setWizardStep("confirm")}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-all"
                    >
                      Continuer
                      <ChevronRightIcon />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal - Style émargement */}
      <AnimatePresence>
        {showQRModal && signatureUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  QR Code de signature
                </h2>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XIcon />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Document info */}
                <div className="text-center mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {qrDocumentTitle}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pour {qrApprenantName}
                  </p>
                </div>

                {/* QR Code SVG */}
                <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-200 flex items-center justify-center mb-4">
                  <QRCodeSVG
                    id="signature-qr-code-svg"
                    value={signatureUrl}
                    size={200}
                    level="H"
                    includeMargin
                    fgColor="#1e3a5f"
                  />
                </div>

                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-4">
                  Scannez ce QR code pour accéder au document et le signer
                </p>

                {/* Actions - Download & Print */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={handleDownloadQR}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <DownloadIcon />
                    Télécharger
                  </button>
                  <button
                    onClick={handlePrintQR}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <PrintIcon />
                    Imprimer
                  </button>
                </div>

                {/* URL direct */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Lien direct :
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={signatureUrl}
                      className="flex-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 text-gray-600 dark:text-gray-300"
                    />
                    <button
                      onClick={handleCopyUrl}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        copied
                          ? "text-green-600 bg-green-100 dark:bg-green-500/20"
                          : "text-white bg-brand-500 hover:bg-brand-600"
                      }`}
                    >
                      {copied ? "Copié !" : "Copier"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedSignature && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Détails de la signature
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <XIcon />
                </button>
              </div>

              <div className="space-y-4">
                {/* Document info */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-3 mb-3">
                    <FileTextIcon />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedSignature.documentTitre}
                      </p>
                      <p className="text-sm text-gray-500">
                        {DOCTYPE_LABELS[selectedSignature.documentType]}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Signature details */}
                {selectedSignature.signatureData && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-sm text-gray-500">Signataire</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedSignature.signatureData.signataireName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-sm text-gray-500">Date de signature</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDateTime(selectedSignature.signatureData.signedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-sm text-gray-500">Adresse IP</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                        {selectedSignature.signatureData.ipAddress || "N/A"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={() => window.open(`/api/signatures/${selectedSignature.id}/certificate`, "_blank")}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                  >
                    <DownloadIcon />
                    Certificat
                  </button>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Confirmation Modal */}
      <AnimatePresence>
        {showEmailConfirmation && selectedApprenant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowEmailConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Confirmer l'adresse email
                </h3>
                <button
                  onClick={() => setShowEmailConfirmation(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <XIcon />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Destinataire</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedApprenant.firstName} {selectedApprenant.lastName}
                  </p>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="email@exemple.com"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Vérifiez ou modifiez l'adresse email avant l'envoi
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={() => setShowEmailConfirmation(false)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleCreateSignatureRequest(true, customEmail)}
                    disabled={sending || !customEmail || !customEmail.includes("@")}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-green-500 rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <>
                        <LoaderIcon />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <SendIcon />
                        Envoyer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
