// ===========================================
// HOOK DE GENERATION DE DOCUMENTS
// ===========================================

import { useState, useCallback } from "react";

interface GeneratedDocument {
  id: string;
  type: string;
  titre: string;
  version: number;
  content: unknown;
  renderedContent: string;
  renderedHeader: string;
  renderedFooter: string;
  generatedAt: string;
}

interface GenerationResult {
  success: boolean;
  document: GeneratedDocument;
  template: {
    id: string;
    name: string;
  };
  context: Record<string, unknown>;
}

interface UseDocumentGenerationReturn {
  isLoading: boolean;
  error: string | null;
  generatedDocument: GeneratedDocument | null;
  generateDocument: (formationId: string, documentType: string, templateId?: string) => Promise<GenerationResult | null>;
  saveDocument: (documentId: string, content: string) => Promise<boolean>;
  clearDocument: () => void;
}

export function useDocumentGeneration(): UseDocumentGenerationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedDocument, setGeneratedDocument] = useState<GeneratedDocument | null>(null);

  // Générer un document
  const generateDocument = useCallback(async (
    formationId: string,
    documentType: string,
    templateId?: string
  ): Promise<GenerationResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formationId,
          documentType,
          templateId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la génération");
      }

      const result = await response.json();
      setGeneratedDocument(result.document);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
      console.error("Erreur génération document:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sauvegarder un document modifié
  const saveDocument = useCallback(async (
    documentId: string,
    content: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: JSON.parse(content) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la sauvegarde");
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
      console.error("Erreur sauvegarde document:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset
  const clearDocument = useCallback(() => {
    setGeneratedDocument(null);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    generatedDocument,
    generateDocument,
    saveDocument,
    clearDocument,
  };
}

// Types de documents disponibles
export const DOCUMENT_TYPES = [
  { type: "FICHE_PEDAGOGIQUE", label: "Programme de formation", description: "Document détaillant le programme et les objectifs" },
  { type: "CONVENTION", label: "Convention de formation", description: "Contrat entre l'organisme et l'entreprise" },
  { type: "CONTRAT_FORMATION", label: "Contrat de formation", description: "Contrat pour les particuliers" },
  { type: "CONVOCATION", label: "Convocation", description: "Invitation envoyée aux participants" },
  { type: "ATTESTATION_PRESENCE", label: "Feuille d'émargement", description: "Document de présence à signer" },
  { type: "ATTESTATION_FIN", label: "Attestation de fin de formation", description: "Certificat de réalisation" },
  { type: "EVALUATION_CHAUD", label: "Évaluation à chaud", description: "Questionnaire de satisfaction immédiat" },
  { type: "EVALUATION_FROID", label: "Évaluation à froid", description: "Questionnaire différé" },
  { type: "REGLEMENT_INTERIEUR", label: "Règlement intérieur", description: "Règles de fonctionnement" },
  { type: "CERTIFICAT", label: "Certificat", description: "Certificat de compétences" },
] as const;

export type DocumentTypeKey = typeof DOCUMENT_TYPES[number]["type"];
