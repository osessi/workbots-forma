"use client";
// ===========================================
// WRAPPER POUR GENERATION DE DOCUMENTS
// ===========================================
// Ce composant gère la logique de génération et prévisualisation

import { useState, useCallback } from "react";
import { useDocumentGeneration, DOCUMENT_TYPES } from "@/hooks/useDocumentGeneration";
import DocumentPreviewModal from "./DocumentPreviewModal";

interface GeneratedDoc {
  id: string;
  type: string;
  titre: string;
  content: unknown;
  renderedContent: string;
  renderedHeader?: string;
  renderedFooter?: string;
}

interface DocumentGenerationWrapperProps {
  formationId: string;
  onSaveFormation?: () => Promise<string | null>;
  children: (props: {
    generateDocument: (documentType: string) => Promise<void>;
    isGenerating: boolean;
    generatingType: string | null;
  }) => React.ReactNode;
}

export default function DocumentGenerationWrapper({
  formationId,
  onSaveFormation,
  children,
}: DocumentGenerationWrapperProps) {
  const { generateDocument, saveDocument, isLoading: isGenerating } = useDocumentGeneration();
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<GeneratedDoc | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFormationId, setCurrentFormationId] = useState<string>(formationId);

  // Générer un document
  const handleGenerateDocument = useCallback(async (documentType: string) => {
    let effectiveFormationId = currentFormationId || formationId;

    // Si pas de formationId et callback de sauvegarde fourni, sauvegarder d'abord
    if (!effectiveFormationId && onSaveFormation) {
      setGeneratingType(documentType);
      const savedId = await onSaveFormation();
      if (!savedId) {
        setGeneratingType(null);
        return;
      }
      effectiveFormationId = savedId;
      setCurrentFormationId(savedId);
    }

    if (!effectiveFormationId) {
      alert("Aucune formation sélectionnée. Veuillez d'abord sauvegarder la formation.");
      return;
    }

    setGeneratingType(documentType);

    try {
      const result = await generateDocument(effectiveFormationId, documentType);

      if (result?.document) {
        setPreviewDocument(result.document);
        setIsModalOpen(true);
      } else {
        // Si pas de template disponible, afficher un message
        const typeLabel = DOCUMENT_TYPES.find(t => t.type === documentType)?.label || documentType;
        alert(`Aucun template disponible pour "${typeLabel}". Contactez votre administrateur pour créer un template.`);
      }
    } catch (error) {
      console.error("Erreur génération:", error);
      alert("Erreur lors de la génération du document");
    } finally {
      setGeneratingType(null);
    }
  }, [currentFormationId, formationId, onSaveFormation, generateDocument]);

  // Sauvegarder les modifications
  const handleSaveDocument = useCallback(async (content: string) => {
    if (!previewDocument?.id) return;

    const success = await saveDocument(previewDocument.id, content);
    if (success) {
      alert("Document sauvegardé avec succès");
    }
  }, [previewDocument, saveDocument]);

  // Fermer la modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setPreviewDocument(null);
  }, []);

  return (
    <>
      {children({
        generateDocument: handleGenerateDocument,
        isGenerating,
        generatingType,
      })}

      {/* Modal de prévisualisation */}
      <DocumentPreviewModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        document={previewDocument}
        onSave={handleSaveDocument}
      />
    </>
  );
}

// ===========================================
// COMPOSANT BOUTON DE GENERATION
// ===========================================

interface GenerateDocumentButtonProps {
  documentType: string;
  label: string;
  description?: string;
  onGenerate: () => void;
  isGenerating: boolean;
  isThisGenerating: boolean;
}

export function GenerateDocumentButton({
  documentType,
  label,
  description,
  onGenerate,
  isGenerating,
  isThisGenerating,
}: GenerateDocumentButtonProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
        {label}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
          {description}
        </p>
      )}
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isThisGenerating ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Génération en cours...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Générer {label.toLowerCase()}
          </>
        )}
      </button>
    </div>
  );
}

// ===========================================
// LISTE DES TYPES DE DOCUMENTS
// ===========================================

export const DOCUMENT_GENERATION_TYPES = [
  {
    type: "CONVENTION",
    label: "Convention de formation",
    description: "Document contractuel entre l'organisme et l'entreprise cliente.",
  },
  {
    type: "FICHE_PEDAGOGIQUE",
    label: "Fiche pédagogique",
    description: "Programme détaillé avec objectifs et contenu de la formation.",
  },
  {
    type: "CONVOCATION",
    label: "Convocation",
    description: "Invitation envoyée aux participants avec les informations pratiques.",
  },
  {
    type: "ATTESTATION_FIN",
    label: "Attestation de fin de formation",
    description: "Certificat remis aux participants à l'issue de la formation.",
  },
  {
    type: "ATTESTATION_PRESENCE",
    label: "Feuilles d'émargement",
    description: "Documents de présence à faire signer par les participants.",
  },
  {
    type: "EVALUATION_CHAUD",
    label: "Évaluation à chaud",
    description: "Questionnaire de satisfaction remis en fin de formation.",
  },
  {
    type: "EVALUATION_FROID",
    label: "Évaluation à froid",
    description: "Questionnaire envoyé plusieurs semaines après la formation.",
  },
  {
    type: "REGLEMENT_INTERIEUR",
    label: "Règlement intérieur",
    description: "Règles de fonctionnement applicables aux participants.",
  },
];
