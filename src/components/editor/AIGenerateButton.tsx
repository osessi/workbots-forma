"use client";
// ===========================================
// BOUTON DE GENERATION IA POUR L'EDITEUR
// ===========================================

import { useState, useRef, useEffect, useCallback } from "react";
import { Editor } from "@tiptap/react";
import { AIPromptType } from "@prisma/client";
import { DynamicVariableContext } from "@/lib/templates/variables";

interface AIGenerateButtonProps {
  editor: Editor | null;
  documentType?: string;
  dynamicContext?: DynamicVariableContext;
  /** Contexte de formation pour la generation */
  formationId?: string;
  /** Callback apres generation reussie */
  onGenerated?: (content: string) => void;
}

// Interface pour les prompts charges depuis l'API admin
interface AdminPrompt {
  id: string;
  name: string;
  type: AIPromptType;
  description: string | null;
  isActive: boolean;
}

// Types de prompts disponibles par type de document
const PROMPT_TYPES_BY_DOCUMENT: Record<string, AIPromptType[]> = {
  fiche_pedagogique: ["FICHE_PEDAGOGIQUE", "PROGRAMME_FORMATION"],
  programme_formation: ["PROGRAMME_FORMATION", "FICHE_PEDAGOGIQUE"],
  convention_formation: ["CONVENTION", "CONTRAT_FORMATION"],
  contrat_formation: ["CONTRAT_FORMATION", "CONVENTION"],
  convocation: ["CONVOCATION"],
  attestation_presence: ["ATTESTATION_PRESENCE"],
  attestation_fin_formation: ["ATTESTATION_FIN"],
  attestation_fin: ["ATTESTATION_FIN"],
  certificat: ["CERTIFICAT"],
  evaluation_chaud: ["EVALUATION_CHAUD"],
  evaluation_froid: ["EVALUATION_FROID"],
  reglement_interieur: ["REGLEMENT_INTERIEUR"],
  feuille_emargement: ["ATTESTATION_PRESENCE"],
  devis: ["CONVENTION"],
  facture: ["CONVENTION"],
};

// Labels des types de prompts
const PROMPT_TYPE_LABELS: Record<AIPromptType, string> = {
  FICHE_PEDAGOGIQUE: "Fiche Pedagogique",
  PROGRAMME_FORMATION: "Programme",
  CONVENTION: "Convention",
  CONTRAT_FORMATION: "Contrat Formation",
  CONVOCATION: "Convocation",
  ATTESTATION_PRESENCE: "Attestation Presence",
  ATTESTATION_FIN: "Attestation Fin",
  CERTIFICAT: "Certificat",
  EVALUATION_CHAUD: "Evaluation Chaud",
  EVALUATION_FROID: "Evaluation Froid",
  REGLEMENT_INTERIEUR: "Reglement Interieur",
  QCM: "QCM",
  POSITIONNEMENT: "Positionnement",
  EVALUATION_FINALE: "Evaluation Finale",
  REFORMULATION: "Reformulation",
  CUSTOM: "Personnalise",
};

// Mode d'insertion
type InsertMode = "replace" | "append" | "insert";

export default function AIGenerateButton({
  editor,
  documentType,
  dynamicContext,
  formationId,
  onGenerated,
}: AIGenerateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPromptType, setSelectedPromptType] = useState<AIPromptType | null>(null);
  const [insertMode, setInsertMode] = useState<InsertMode>("replace");
  const [customPrompt, setCustomPrompt] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Etats pour les prompts admin
  const [adminPrompts, setAdminPrompts] = useState<AdminPrompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  // Charger les prompts actifs depuis l'admin
  const loadAdminPrompts = useCallback(async () => {
    setLoadingPrompts(true);
    try {
      const response = await fetch("/api/admin/prompts?isSystem=true");
      if (response.ok) {
        const data = await response.json();
        setAdminPrompts(data.prompts?.filter((p: AdminPrompt) => p.isActive) || []);
      }
    } catch (error) {
      console.error("Erreur chargement prompts:", error);
    } finally {
      setLoadingPrompts(false);
    }
  }, []);

  // Obtenir les prompts disponibles filtres par type de document
  const getAvailablePrompts = useCallback(() => {
    const relevantTypes = documentType
      ? PROMPT_TYPES_BY_DOCUMENT[documentType] || []
      : [];

    if (adminPrompts.length > 0) {
      // Si on a des prompts admin, les filtrer par type de document
      const filtered = relevantTypes.length > 0
        ? adminPrompts.filter(p => relevantTypes.includes(p.type))
        : adminPrompts;
      return filtered;
    }
    return [];
  }, [adminPrompts, documentType]);

  // Selectionner un prompt admin
  const handleSelectPrompt = (prompt: AdminPrompt) => {
    setSelectedPromptId(prompt.id);
    setSelectedPromptType(prompt.type);
  };

  // Charger les prompts quand le dropdown s'ouvre
  useEffect(() => {
    if (isOpen && adminPrompts.length === 0) {
      loadAdminPrompts();
    }
  }, [isOpen, adminPrompts.length, loadAdminPrompts]);

  // Calculer la position du dropdown
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const dropdownWidth = 400;

      let left = rect.left;
      if (left + dropdownWidth > viewportWidth - 16) {
        left = viewportWidth - dropdownWidth - 16;
      }

      setDropdownPosition({
        top: rect.bottom + 4,
        left: Math.max(8, left),
      });
    }
  }, [isOpen]);

  // Obtenir les types de prompts disponibles
  const availablePromptTypes = documentType
    ? PROMPT_TYPES_BY_DOCUMENT[documentType] || Object.keys(PROMPT_TYPE_LABELS) as AIPromptType[]
    : Object.keys(PROMPT_TYPE_LABELS) as AIPromptType[];

  // Generer le contenu
  const handleGenerate = async () => {
    if (!selectedPromptType && !selectedPromptId) {
      setError("Veuillez selectionner un type de contenu");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedContent(null);

    try {
      const requestBody: Record<string, unknown> = {
        promptType: selectedPromptType,
        formationId,
        customUserPrompt: customPrompt || undefined,
        outputFormat: "html",
        context: dynamicContext ? {
          formation: {
            titre: "Formation",
            dureeHeures: dynamicContext.nombreJournees ? dynamicContext.nombreJournees * 7 : undefined,
          },
          participants: dynamicContext.nombreSalaries
            ? Array.from({ length: dynamicContext.nombreSalaries }, (_, i) => ({
                nom: `Salarie ${i + 1}`,
                prenom: `Prenom ${i + 1}`,
              }))
            : undefined,
        } : undefined,
      };

      // Ajouter l'ID du prompt si un prompt admin specifique est selectionne
      if (selectedPromptId) {
        requestBody.promptId = selectedPromptId;
      }

      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la generation");
      }

      if (data.success && data.content) {
        setGeneratedContent(data.content);
      } else {
        throw new Error(data.error || "Contenu genere vide");
      }
    } catch (err) {
      console.error("Erreur generation IA:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsGenerating(false);
    }
  };

  // Inserer le contenu dans l'editeur
  const handleInsert = () => {
    if (!editor || !generatedContent) return;

    switch (insertMode) {
      case "replace":
        editor.commands.setContent(generatedContent);
        break;
      case "append":
        editor.commands.focus("end");
        editor.commands.insertContent("<hr/>" + generatedContent);
        break;
      case "insert":
        editor.commands.insertContent(generatedContent);
        break;
    }

    onGenerated?.(generatedContent);
    handleClose();
  };

  // Fermer et reinitialiser
  const handleClose = () => {
    setIsOpen(false);
    setGeneratedContent(null);
    setError(null);
    setCustomPrompt("");
    setShowAdvanced(false);
    setSelectedPromptId(null);
    setSelectedPromptType(null);
  };

  if (!editor) return null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Generer avec l'IA"
        className={`
          p-2 rounded-lg transition-all flex items-center gap-1
          ${isOpen
            ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
          }
        `}
      >
        <SparklesIcon />
        <span className="text-xs font-medium hidden sm:inline">IA</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[9998]" onClick={handleClose} />

          {/* Dropdown */}
          <div
            className="fixed bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[9999] w-[400px] max-h-[80vh] overflow-hidden flex flex-col"
            style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="flex items-center gap-2">
                <SparklesIcon />
                <span className="font-semibold text-gray-900 dark:text-white">
                  Generation IA
                </span>
              </div>
              <button
                onClick={handleClose}
                className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
              >
                <XIcon />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!generatedContent ? (
                <>
                  {/* Selection du prompt */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type de contenu a generer
                    </label>

                    {loadingPrompts ? (
                      <div className="flex items-center justify-center py-6">
                        <LoadingSpinner />
                        <span className="ml-2 text-sm text-gray-500">Chargement des prompts...</span>
                      </div>
                    ) : getAvailablePrompts().length > 0 ? (
                      /* Prompts admin disponibles */
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {getAvailablePrompts().map((prompt) => (
                          <button
                            key={prompt.id}
                            onClick={() => handleSelectPrompt(prompt)}
                            className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${
                              selectedPromptId === prompt.id
                                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{prompt.name}</span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                                {PROMPT_TYPE_LABELS[prompt.type]}
                              </span>
                            </div>
                            {prompt.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {prompt.description}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      /* Fallback: types de base */
                      <div className="grid grid-cols-2 gap-2">
                        {availablePromptTypes.map((type) => (
                          <button
                            key={type}
                            onClick={() => {
                              setSelectedPromptType(type);
                              setSelectedPromptId(null);
                            }}
                            className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                              selectedPromptType === type && !selectedPromptId
                                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {PROMPT_TYPE_LABELS[type]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mode d'insertion */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mode d'insertion
                    </label>
                    <div className="flex gap-2">
                      {[
                        { value: "replace", label: "Remplacer", icon: <ReplaceIcon /> },
                        { value: "append", label: "Ajouter", icon: <AppendIcon /> },
                        { value: "insert", label: "Inserer", icon: <InsertIcon /> },
                      ].map(({ value, label, icon }) => (
                        <button
                          key={value}
                          onClick={() => setInsertMode(value as InsertMode)}
                          className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg border transition-all ${
                            insertMode === value
                              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {icon}
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Options avancees */}
                  <div>
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <ChevronIcon className={showAdvanced ? "rotate-90" : ""} />
                      Options avancees
                    </button>

                    {showAdvanced && (
                      <div className="mt-3 space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Instructions supplementaires (optionnel)
                          </label>
                          <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="Ex: Ajouter des exemples concrets, utiliser un ton plus formel..."
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Erreur */}
                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                      {error}
                    </div>
                  )}
                </>
              ) : (
                /* Preview du contenu genere */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Apercu du contenu genere
                    </span>
                    <button
                      onClick={() => setGeneratedContent(null)}
                      className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      Regenerer
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: generatedContent }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>

              {!generatedContent ? (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedPromptType}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <LoadingSpinner />
                      Generation...
                    </>
                  ) : (
                    <>
                      <SparklesIcon />
                      Generer
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleInsert}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg transition-all"
                >
                  <CheckIcon />
                  Inserer dans le document
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ===========================================
// ICONES
// ===========================================

const SparklesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3L13.4302 8.31181C13.6047 8.92648 14.0735 9.39526 14.6882 9.56983L20 11L14.6882 12.4302C14.0735 12.6047 13.6047 13.0735 13.4302 13.6882L12 19L10.5698 13.6882C10.3953 13.0735 9.92648 12.6047 9.31181 12.4302L4 11L9.31181 9.56983C9.92648 9.39526 10.3953 8.92648 10.5698 8.31181L12 3Z" />
    <path d="M19 2L19.5 4L21 4.5L19.5 5L19 7L18.5 5L17 4.5L18.5 4L19 2Z" />
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const ReplaceIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

const AppendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const InsertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12h6M12 9v6" />
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const ChevronIcon = ({ className = "" }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${className}`}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const LoadingSpinner = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
  </svg>
);
