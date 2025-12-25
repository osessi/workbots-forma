"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Type,
  Users,
  Loader2,
  Sparkles,
  ChevronDown,
  Wand2,
  Zap,
  Settings2,
  FileText,
} from "lucide-react";
import WorkbotsTemplateSelector from "@/components/slides/WorkbotsTemplateSelector";
import {
  WorkbotsTemplate,
  WorkbotsTone,
  WorkbotsVerbosity,
} from "@/lib/workbots/types";

interface WorkbotsOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (options: WorkbotsGenerationOptions) => void;
  formationTitre: string;
  modulesCount: number;
  isGenerating?: boolean;
}

export interface WorkbotsGenerationOptions {
  // Template Workbots
  templateId: string;
  templateName: string;

  // Style
  tone: WorkbotsTone;
  verbosity: WorkbotsVerbosity;
  audience: string;

  // Structure
  includeIntro: boolean;
  includeConclusion: boolean;
  cardsPerModule: number;

  // Options
  language: string;
  includeTableOfContents: boolean;

  // Legacy compatibility (for Gamma transition)
  themeId: string;
  themeName: string;
  imageSource: string;
  imageStyle: string;
}

const toneOptions: { value: WorkbotsTone; label: string; icon: string; description: string }[] = [
  {
    value: "professional",
    label: "Professionnel",
    icon: "💼",
    description: "Formel et structuré",
  },
  {
    value: "educational",
    label: "Pédagogique",
    icon: "🎓",
    description: "Clair et didactique",
  },
  {
    value: "casual",
    label: "Décontracté",
    icon: "😊",
    description: "Accessible et léger",
  },
  {
    value: "sales_pitch",
    label: "Commercial",
    icon: "🚀",
    description: "Persuasif et dynamique",
  },
];

const verbosityOptions: { value: WorkbotsVerbosity; label: string; description: string }[] = [
  {
    value: "concise",
    label: "Synthétique",
    description: "Points clés uniquement",
  },
  {
    value: "standard",
    label: "Standard",
    description: "Équilibre texte/visuel",
  },
  {
    value: "text-heavy",
    label: "Détaillé",
    description: "Contenu riche et complet",
  },
];

export default function WorkbotsOptionsModal({
  isOpen,
  onClose,
  onGenerate,
  formationTitre,
  modulesCount,
  isGenerating = false,
}: WorkbotsOptionsModalProps) {
  const [options, setOptions] = useState<WorkbotsGenerationOptions>({
    templateId: "general",
    templateName: "Général",
    tone: "educational",
    verbosity: "standard",
    audience: "",
    includeIntro: true,
    includeConclusion: true,
    cardsPerModule: 10,
    language: "fr",
    includeTableOfContents: false,
    // Legacy compatibility
    themeId: "general",
    themeName: "Général",
    imageSource: "unsplash",
    imageStyle: "moderne, professionnel",
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      // Reset to defaults but keep template selection
      setShowAdvanced(false);
    }
  }, [isOpen]);

  const handleTemplateSelect = (template: WorkbotsTemplate) => {
    setOptions((prev) => ({
      ...prev,
      templateId: template.id,
      templateName: template.name,
      // Legacy compatibility
      themeId: template.id,
      themeName: template.name,
    }));
  };

  const handleGenerate = () => {
    onGenerate(options);
  };

  // Calculs pour l'affichage
  const actualModulesCount = modulesCount || 0;
  const estimatedSlides =
    (options.includeIntro ? 3 : 0) +
    actualModulesCount * options.cardsPerModule +
    (options.includeConclusion ? 3 : 0) +
    (options.includeTableOfContents ? 1 : 0);
  const estimatedTime = Math.max(1, Math.ceil(actualModulesCount * 1.5)); // ~1.5 min par module (plus rapide que Gamma)

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white rounded-3xl shadow-2xl dark:bg-gray-900">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 to-purple-500/20" />
          <div className="relative p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl shadow-lg bg-gradient-to-r from-brand-500 to-purple-500">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Workbots Slides
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Génération intelligente de présentations
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-xl transition-all dark:hover:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Formation info */}
          <div className="p-4 bg-gray-50 rounded-2xl dark:bg-gray-800/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">Formation</p>
            <p className="font-semibold text-gray-900 dark:text-white mt-1 truncate">
              {formationTitre || "Sans titre"}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-brand-100 text-brand-700 rounded-full dark:bg-brand-500/20 dark:text-brand-400">
                <Zap size={12} />
                {actualModulesCount} module{actualModulesCount > 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full dark:bg-purple-500/20 dark:text-purple-400">
                ~{estimatedSlides} slides
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full dark:bg-gray-700 dark:text-gray-400">
                ~{estimatedTime} min
              </span>
            </div>
          </div>

          {/* Template selector */}
          <WorkbotsTemplateSelector
            selectedTemplateId={options.templateId}
            onSelectTemplate={handleTemplateSelect}
          />

          {/* Ton */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <Type size={16} />
              Ton de la présentation
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {toneOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setOptions({ ...options, tone: opt.value })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    options.tone === opt.value
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                      : "border-gray-100 hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700"
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span
                    className={`text-xs font-medium ${
                      options.tone === opt.value
                        ? "text-brand-700 dark:text-brand-400"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    {opt.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Verbosité */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <FileText size={16} />
              Densité du contenu
            </label>
            <div className="grid grid-cols-3 gap-2">
              {verbosityOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setOptions({ ...options, verbosity: opt.value })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    options.verbosity === opt.value
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                      : "border-gray-100 hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700"
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      options.verbosity === opt.value
                        ? "text-brand-700 dark:text-brand-400"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                    {opt.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Audience (optionnel) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <Users size={16} />
              Audience cible
              <span className="text-xs font-normal text-gray-400">(optionnel)</span>
            </label>
            <input
              type="text"
              value={options.audience}
              onChange={(e) => setOptions({ ...options, audience: e.target.value })}
              placeholder="Ex: managers en reconversion, développeurs juniors..."
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white placeholder:text-gray-400"
            />
          </div>

          {/* Options avancées */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <Settings2 size={14} />
              <span>Options avancées</span>
              <ChevronDown
                size={14}
                className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}
              />
            </button>

            {showAdvanced && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl dark:bg-gray-800 space-y-4">
                {/* Slides par module */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Slides par module
                    </label>
                    <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                      {options.cardsPerModule} slides
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={20}
                    value={options.cardsPerModule}
                    onChange={(e) =>
                      setOptions({ ...options, cardsPerModule: parseInt(e.target.value) })
                    }
                    className="w-full accent-brand-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Synthétique (5)</span>
                    <span>Détaillé (20)</span>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.includeIntro}
                      onChange={(e) =>
                        setOptions({ ...options, includeIntro: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Introduction
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.includeConclusion}
                      onChange={(e) =>
                        setOptions({ ...options, includeConclusion: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Conclusion
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.includeTableOfContents}
                      onChange={(e) =>
                        setOptions({ ...options, includeTableOfContents: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Table des matières
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 p-6 bg-gray-50 border-t border-gray-100 dark:bg-gray-800/50 dark:border-gray-800">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Annuler
          </button>
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !options.templateId || actualModulesCount === 0}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-purple-500 rounded-xl transition-all shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Générer les slides
                </>
              )}
            </button>
            {actualModulesCount === 0 && !isGenerating && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Générez d'abord une fiche pédagogique
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
