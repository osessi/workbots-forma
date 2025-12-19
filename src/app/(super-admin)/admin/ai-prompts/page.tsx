"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AIPromptType } from "@prisma/client";

// Types
interface AIPrompt {
  id: string;
  name: string;
  description: string | null;
  type: AIPromptType;
  systemPrompt: string;
  userPromptTemplate: string;
  requiredVariables: string[];
  optionalVariables: string[];
  model: string;
  temperature: number;
  maxTokens: number;
  isActive: boolean;
  isSystem: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  organization?: { id: string; name: string } | null;
  _count?: { generationLogs: number };
}

// Labels pour les types de prompts
const PROMPT_TYPE_LABELS: Record<AIPromptType, string> = {
  FICHE_PEDAGOGIQUE: "Fiche Pedagogique",
  PROGRAMME_FORMATION: "Programme de Formation",
  CONVENTION: "Convention",
  CONTRAT_FORMATION: "Contrat de Formation",
  CONVOCATION: "Convocation",
  ATTESTATION_PRESENCE: "Attestation de Presence",
  ATTESTATION_FIN: "Attestation de Fin",
  EVALUATION_CHAUD: "Evaluation a Chaud",
  EVALUATION_FROID: "Evaluation a Froid",
  REGLEMENT_INTERIEUR: "Reglement Interieur",
  CERTIFICAT: "Certificat",
  QCM: "QCM",
  POSITIONNEMENT: "Test de Positionnement",
  EVALUATION_FINALE: "Evaluation Finale",
  REFORMULATION: "Reformulation",
  CUSTOM: "Personnalise",
};

// Couleurs par categorie de type
const TYPE_COLORS: Record<string, string> = {
  FICHE_PEDAGOGIQUE: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  PROGRAMME_FORMATION: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  CONVENTION: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  CONTRAT_FORMATION: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  CONVOCATION: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ATTESTATION_PRESENCE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  ATTESTATION_FIN: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CERTIFICAT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  EVALUATION_CHAUD: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  EVALUATION_FROID: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  REGLEMENT_INTERIEUR: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  QCM: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  POSITIONNEMENT: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  EVALUATION_FINALE: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  REFORMULATION: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  CUSTOM: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

// Icons
const SparklesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L13.4302 8.31181C13.6047 8.92648 14.0735 9.39526 14.6882 9.56983L20 11L14.6882 12.4302C14.0735 12.6047 13.6047 13.0735 13.4302 13.6882L12 19L10.5698 13.6882C10.3953 13.0735 9.92648 12.6047 9.31181 12.4302L4 11L9.31181 9.56983C9.92648 9.39526 10.3953 8.92648 10.5698 8.31181L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 2L19.5 4L21 4.5L19.5 5L19 7L18.5 5L17 4.5L18.5 4L19 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SeedIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2.5V17.5M10 2.5C10 2.5 5 5 5 10C5 15 10 17.5 10 17.5M10 2.5C10 2.5 15 5 15 10C15 15 10 17.5 10 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.3333 2.00004C11.5084 1.82494 11.7163 1.68605 11.9451 1.59129C12.1739 1.49653 12.4191 1.44775 12.6667 1.44775C12.9143 1.44775 13.1594 1.49653 13.3882 1.59129C13.617 1.68605 13.8249 1.82494 14 2.00004C14.1751 2.17513 14.314 2.38299 14.4088 2.61178C14.5035 2.84057 14.5523 3.08576 14.5523 3.33337C14.5523 3.58099 14.5035 3.82617 14.4088 4.05496C14.314 4.28375 14.1751 4.49161 14 4.66671L5 13.6667L1.33333 14.6667L2.33333 11L11.3333 2.00004Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 2L14 8L4 14V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LoadingSpinner = () => (
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
  </svg>
);

export default function AIPromptsPage() {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [selectedType, setSelectedType] = useState<AIPromptType | "ALL">("ALL");
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null);
  const [creatingPrompt, setCreatingPrompt] = useState(false);
  const [testingPrompt, setTestingPrompt] = useState<AIPrompt | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; content?: string; error?: string } | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Charger les prompts
  const fetchPrompts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/prompts?isSystem=true");
      if (response.ok) {
        const data = await response.json();
        setPrompts(data.prompts);
      }
    } catch (error) {
      console.error("Erreur chargement prompts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // Seeder les prompts par defaut
  const handleSeedPrompts = async () => {
    if (!confirm("Cela va creer/mettre a jour les prompts par defaut. Continuer ?")) return;

    try {
      setSeeding(true);
      const response = await fetch("/api/admin/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`${data.created} prompts crees, ${data.updated} mis a jour`);
        fetchPrompts();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error("Erreur seed:", error);
      alert("Erreur lors du seeding des prompts");
    } finally {
      setSeeding(false);
    }
  };

  // Creer un nouveau prompt
  const handleCreatePrompt = async (prompt: Omit<AIPrompt, "id" | "createdAt" | "updatedAt" | "version" | "_count">) => {
    try {
      const response = await fetch("/api/admin/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: prompt.name,
          description: prompt.description,
          type: prompt.type,
          systemPrompt: prompt.systemPrompt,
          userPromptTemplate: prompt.userPromptTemplate,
          requiredVariables: prompt.requiredVariables,
          optionalVariables: prompt.optionalVariables,
          model: prompt.model,
          temperature: prompt.temperature,
          maxTokens: prompt.maxTokens,
          isActive: prompt.isActive,
        }),
      });

      if (response.ok) {
        alert("Prompt cree avec succes");
        setCreatingPrompt(false);
        fetchPrompts();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error("Erreur creation:", error);
      alert("Erreur lors de la creation");
    }
  };

  // Sauvegarder un prompt
  const handleSavePrompt = async (prompt: AIPrompt) => {
    try {
      const response = await fetch(`/api/admin/prompts/${prompt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: prompt.name,
          description: prompt.description,
          systemPrompt: prompt.systemPrompt,
          userPromptTemplate: prompt.userPromptTemplate,
          requiredVariables: prompt.requiredVariables,
          optionalVariables: prompt.optionalVariables,
          model: prompt.model,
          temperature: prompt.temperature,
          maxTokens: prompt.maxTokens,
          isActive: prompt.isActive,
        }),
      });

      if (response.ok) {
        alert("Prompt sauvegarde avec succes");
        setEditingPrompt(null);
        fetchPrompts();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("Erreur lors de la sauvegarde");
    }
  };

  // Tester un prompt
  const handleTestPrompt = async (prompt: AIPrompt) => {
    try {
      setTestLoading(true);
      setTestResult(null);

      const response = await fetch("/api/admin/prompts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId: prompt.id,
          useTestContext: true,
        }),
      });

      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      console.error("Erreur test:", error);
      setTestResult({ success: false, error: "Erreur lors du test" });
    } finally {
      setTestLoading(false);
    }
  };

  // Filtrer les prompts
  const filteredPrompts = selectedType === "ALL"
    ? prompts
    : prompts.filter((p) => p.type === selectedType);

  // Grouper par type
  const promptsByType = filteredPrompts.reduce((acc, prompt) => {
    if (!acc[prompt.type]) acc[prompt.type] = [];
    acc[prompt.type].push(prompt);
    return acc;
  }, {} as Record<AIPromptType, AIPrompt[]>);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-500 dark:text-purple-400">
            <SparklesIcon />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Prompts IA
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerez les prompts systeme pour la generation de contenu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedPrompts}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {seeding ? <LoadingSpinner /> : <SeedIcon />}
            <span>Initialiser</span>
          </button>
          <button
            onClick={() => setCreatingPrompt(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25"
          >
            <PlusIcon />
            <span>Nouveau Prompt</span>
          </button>
        </div>
      </div>

      {/* Filtres par type */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedType("ALL")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedType === "ALL"
              ? "bg-purple-500 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          Tous ({prompts.length})
        </button>
        {Object.entries(PROMPT_TYPE_LABELS).map(([type, label]) => {
          const count = prompts.filter((p) => p.type === type).length;
          if (count === 0) return null;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type as AIPromptType)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedType === type
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Liste des prompts */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
          <span className="ml-3 text-gray-500">Chargement des prompts...</span>
        </div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <SparklesIcon />
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            Aucun prompt configure
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Cliquez sur Initialiser pour creer les prompts par defaut
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(promptsByType).map(([type, typePrompts]) => (
            <div key={type} className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-lg ${TYPE_COLORS[type]}`}>
                  {PROMPT_TYPE_LABELS[type as AIPromptType]}
                </span>
              </h2>

              <div className="grid gap-4">
                {typePrompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {prompt.name}
                          </h3>
                          {prompt.isSystem && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                              Systeme
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${prompt.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500"}`}>
                            {prompt.isActive ? "Actif" : "Inactif"}
                          </span>
                        </div>
                        {prompt.description && (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {prompt.description}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                            Modele: {prompt.model}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                            Temp: {prompt.temperature}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                            Max tokens: {prompt.maxTokens}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                            v{prompt.version}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingPrompt(prompt)}
                          className="p-2 text-gray-500 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => {
                            setTestingPrompt(prompt);
                            setTestResult(null);
                          }}
                          className="p-2 text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Tester"
                        >
                          <PlayIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'edition */}
      {editingPrompt && (
        <PromptEditModal
          prompt={editingPrompt}
          onSave={handleSavePrompt}
          onClose={() => setEditingPrompt(null)}
        />
      )}

      {/* Modal de creation */}
      {creatingPrompt && (
        <PromptCreateModal
          onSave={handleCreatePrompt}
          onClose={() => setCreatingPrompt(false)}
        />
      )}

      {/* Modal de test */}
      {testingPrompt && (
        <PromptTestModal
          prompt={testingPrompt}
          result={testResult}
          loading={testLoading}
          onTest={() => handleTestPrompt(testingPrompt)}
          onClose={() => {
            setTestingPrompt(null);
            setTestResult(null);
          }}
        />
      )}
    </div>
  );
}

// ===========================================
// MODAL D'EDITION
// ===========================================

interface PromptEditModalProps {
  prompt: AIPrompt;
  onSave: (prompt: AIPrompt) => void;
  onClose: () => void;
}

function PromptEditModal({ prompt, onSave, onClose }: PromptEditModalProps) {
  const [editedPrompt, setEditedPrompt] = useState<AIPrompt>(prompt);
  const [activeTab, setActiveTab] = useState<"system" | "user" | "config">("system");

  const handleChange = (field: keyof AIPrompt, value: unknown) => {
    setEditedPrompt((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Modifier le prompt
            </h2>
            <p className="text-sm text-gray-500">{PROMPT_TYPE_LABELS[prompt.type]}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 px-6">
          {[
            { id: "system", label: "Prompt Systeme" },
            { id: "user", label: "Template Utilisateur" },
            { id: "config", label: "Configuration" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "system" | "user" | "config")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-purple-500 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "system" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom du prompt
                </label>
                <input
                  type="text"
                  value={editedPrompt.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={editedPrompt.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prompt systeme
                </label>
                <textarea
                  value={editedPrompt.systemPrompt}
                  onChange={(e) => handleChange("systemPrompt", e.target.value)}
                  rows={15}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {activeTab === "user" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template du prompt utilisateur
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Utilisez {"{{variable.path}}"} pour injecter des variables dynamiques
                </p>
                <textarea
                  value={editedPrompt.userPromptTemplate}
                  onChange={(e) => handleChange("userPromptTemplate", e.target.value)}
                  rows={20}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Variables requises
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {editedPrompt.requiredVariables.map((v) => (
                      <span key={v} className="px-2 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Variables optionnelles
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {editedPrompt.optionalVariables.map((v) => (
                      <span key={v} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 rounded">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "config" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Modele IA
                  </label>
                  <select
                    value={editedPrompt.model}
                    onChange={(e) => handleChange("model", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                    <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                    <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tokens maximum
                  </label>
                  <input
                    type="number"
                    value={editedPrompt.maxTokens}
                    onChange={(e) => handleChange("maxTokens", parseInt(e.target.value))}
                    min={100}
                    max={32000}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Temperature: {editedPrompt.temperature}
                </label>
                <input
                  type="range"
                  value={editedPrompt.temperature}
                  onChange={(e) => handleChange("temperature", parseFloat(e.target.value))}
                  min={0}
                  max={2}
                  step={0.1}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Plus deterministe</span>
                  <span>Plus creatif</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editedPrompt.isActive}
                  onChange={(e) => handleChange("isActive", e.target.checked)}
                  className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                  Prompt actif
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(editedPrompt)}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// MODAL DE TEST
// ===========================================

interface PromptTestModalProps {
  prompt: AIPrompt;
  result: { success: boolean; content?: string; error?: string } | null;
  loading: boolean;
  onTest: () => void;
  onClose: () => void;
}

function PromptTestModal({ prompt, result, loading, onTest, onClose }: PromptTestModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Tester le prompt
            </h2>
            <p className="text-sm text-gray-500">{prompt.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ce test utilisera un contexte de donnees fictif pour generer du contenu avec ce prompt.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
                <span className="ml-3 text-gray-500">Generation en cours...</span>
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${result.success ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"}`}>
                  <p className={`text-sm font-medium ${result.success ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                    {result.success ? "Generation reussie" : "Erreur de generation"}
                  </p>
                </div>

                {result.content && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Resultat genere
                    </label>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-96 overflow-y-auto">
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: result.content }}
                      />
                    </div>
                  </div>
                )}

                {result.error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400">{result.error}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  Cliquez sur Lancer le test pour generer du contenu
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={onTest}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? <LoadingSpinner /> : <PlayIcon />}
            <span>Lancer le test</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// MODAL DE CREATION
// ===========================================

interface PromptCreateModalProps {
  onSave: (prompt: Omit<AIPrompt, "id" | "createdAt" | "updatedAt" | "version" | "_count">) => void;
  onClose: () => void;
}

function PromptCreateModal({ onSave, onClose }: PromptCreateModalProps) {
  const [newPrompt, setNewPrompt] = useState({
    name: "",
    description: "",
    type: "CUSTOM" as AIPromptType,
    systemPrompt: "Tu es un assistant specialise dans la creation de contenu de formation professionnelle.",
    userPromptTemplate: "",
    requiredVariables: [] as string[],
    optionalVariables: [] as string[],
    model: "claude-sonnet-4-20250514",
    temperature: 0.7,
    maxTokens: 4096,
    isActive: true,
    isSystem: true,
    organization: null,
  });
  const [activeTab, setActiveTab] = useState<"system" | "user" | "config">("system");

  const handleChange = (field: string, value: unknown) => {
    setNewPrompt((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Creer un nouveau prompt
            </h2>
            <p className="text-sm text-gray-500">Configurez un nouveau prompt IA</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 px-6">
          {[
            { id: "system", label: "Informations" },
            { id: "user", label: "Prompts" },
            { id: "config", label: "Configuration" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "system" | "user" | "config")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-purple-500 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "system" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom du prompt *
                </label>
                <input
                  type="text"
                  value={newPrompt.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Ex: Generation de programme de formation"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newPrompt.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Decrivez ce que fait ce prompt"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type de prompt *
                </label>
                <select
                  value={newPrompt.type}
                  onChange={(e) => handleChange("type", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {Object.entries(PROMPT_TYPE_LABELS).map(([type, label]) => (
                    <option key={type} value={type}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === "user" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prompt systeme
                </label>
                <textarea
                  value={newPrompt.systemPrompt}
                  onChange={(e) => handleChange("systemPrompt", e.target.value)}
                  rows={8}
                  placeholder="Instructions pour l'IA..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template du prompt utilisateur
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Utilisez {"{{variable.path}}"} pour injecter des variables dynamiques
                </p>
                <textarea
                  value={newPrompt.userPromptTemplate}
                  onChange={(e) => handleChange("userPromptTemplate", e.target.value)}
                  rows={12}
                  placeholder="Genere une fiche pedagogique pour la formation {{formation.titre}}..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {activeTab === "config" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Modele IA
                  </label>
                  <select
                    value={newPrompt.model}
                    onChange={(e) => handleChange("model", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                    <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                    <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tokens maximum
                  </label>
                  <input
                    type="number"
                    value={newPrompt.maxTokens}
                    onChange={(e) => handleChange("maxTokens", parseInt(e.target.value))}
                    min={100}
                    max={32000}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Temperature: {newPrompt.temperature}
                </label>
                <input
                  type="range"
                  value={newPrompt.temperature}
                  onChange={(e) => handleChange("temperature", parseFloat(e.target.value))}
                  min={0}
                  max={2}
                  step={0.1}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Plus deterministe</span>
                  <span>Plus creatif</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActiveNew"
                  checked={newPrompt.isActive}
                  onChange={(e) => handleChange("isActive", e.target.checked)}
                  className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                />
                <label htmlFor="isActiveNew" className="text-sm text-gray-700 dark:text-gray-300">
                  Prompt actif
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(newPrompt)}
            disabled={!newPrompt.name || !newPrompt.type}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors disabled:opacity-50"
          >
            Creer le prompt
          </button>
        </div>
      </div>
    </div>
  );
}
