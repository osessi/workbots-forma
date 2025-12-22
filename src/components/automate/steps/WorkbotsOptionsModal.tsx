"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Type,
  Users,
  Image,
  Loader2,
  Sparkles,
  ChevronDown,
  Wand2,
  Zap,
  Settings2,
  RefreshCw,
  Palette,
  AlertCircle,
} from "lucide-react";
import { GammaImageSource, GammaTheme } from "@/lib/gamma/types";

// Thèmes par défaut avec couleurs distinctes
interface DefaultTheme extends GammaTheme {
  colors?: { bg: string; accent: string; text: string };
}

const DEFAULT_THEMES: DefaultTheme[] = [
  {
    id: "default-light",
    name: "Clair",
    previewUrl: undefined,
    colors: { bg: "#FFFFFF", accent: "#4277FF", text: "#1F2937" }
  },
  {
    id: "default-dark",
    name: "Sombre",
    previewUrl: undefined,
    colors: { bg: "#1F2937", accent: "#60A5FA", text: "#F9FAFB" }
  },
  {
    id: "default-colorful",
    name: "Coloré",
    previewUrl: undefined,
    colors: { bg: "#FEF3C7", accent: "#F59E0B", text: "#78350F" }
  },
  {
    id: "default-minimal",
    name: "Minimal",
    previewUrl: undefined,
    colors: { bg: "#F3F4F6", accent: "#6B7280", text: "#374151" }
  },
];

interface WorkbotsOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (options: WorkbotsGenerationOptions) => void;
  formationTitre: string;
  modulesCount: number;
  isGenerating?: boolean;
  organizationColors?: {
    primary?: string;
    secondary?: string;
  };
}

export interface WorkbotsGenerationOptions {
  // Thème Gamma
  themeId: string;
  themeName: string;

  // Style
  tone: string;
  audience: string;
  imageSource: GammaImageSource;
  imageStyle: string;

  // Structure
  includeIntro: boolean;
  includeConclusion: boolean;
  cardsPerModule: number;

  // Interne (pas affiché)
  language: string;
}

const toneOptions = [
  { value: "professionnel, pédagogique, engageant", label: "Professionnel", icon: "💼" },
  { value: "dynamique, interactif, moderne", label: "Dynamique", icon: "⚡" },
  { value: "simple, accessible, clair", label: "Accessible", icon: "🎯" },
  { value: "inspirant, motivant, énergique", label: "Inspirant", icon: "🚀" },
];

const imageSourceOptions: { value: GammaImageSource; label: string; icon: string }[] = [
  { value: "unsplash", label: "Photos Pro", icon: "📸" },
  { value: "aiGenerated", label: "IA Générative", icon: "🤖" },
  { value: "pictographic", label: "Icônes", icon: "🎨" },
  { value: "none", label: "Sans images", icon: "📝" },
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
    themeId: "",
    themeName: "",
    tone: "professionnel, pédagogique, engageant",
    audience: "",
    imageSource: "unsplash",
    imageStyle: "moderne, professionnel",
    includeIntro: true,
    includeConclusion: true,
    cardsPerModule: 10,
    language: "fr",
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loadingThemes, setLoadingThemes] = useState(false);
  const [themesError, setThemesError] = useState<string | null>(null);
  const [themes, setThemes] = useState<DefaultTheme[]>([]);
  const [usingApiThemes, setUsingApiThemes] = useState(false);

  // Charger les thèmes depuis l'API Gamma
  useEffect(() => {
    const fetchThemes = async () => {
      if (!isOpen) return;

      try {
        setLoadingThemes(true);
        setThemesError(null);

        const response = await fetch("/api/gamma/themes");

        if (response.ok) {
          const data = await response.json();
          if (data.themes && Array.isArray(data.themes) && data.themes.length > 0) {
            // Utiliser les thèmes de l'API
            setThemes(data.themes);
            setUsingApiThemes(true);

            // Sélectionner le premier thème par défaut
            if (!options.themeId && data.themes.length > 0) {
              setOptions(prev => ({
                ...prev,
                themeId: data.themes[0].id,
                themeName: data.themes[0].name,
              }));
            }
          } else {
            // Fallback sur les thèmes par défaut
            setThemes(DEFAULT_THEMES);
            setUsingApiThemes(false);
            if (!options.themeId) {
              setOptions(prev => ({
                ...prev,
                themeId: DEFAULT_THEMES[0].id,
                themeName: DEFAULT_THEMES[0].name,
              }));
            }
          }
        } else {
          // Erreur API - utiliser fallback
          const errorData = await response.json().catch(() => ({}));
          setThemesError(errorData.error || "Impossible de charger les thèmes");
          setThemes(DEFAULT_THEMES);
          setUsingApiThemes(false);
          if (!options.themeId) {
            setOptions(prev => ({
              ...prev,
              themeId: DEFAULT_THEMES[0].id,
              themeName: DEFAULT_THEMES[0].name,
            }));
          }
        }
      } catch (error) {
        console.error("Erreur chargement thèmes:", error);
        setThemesError("Erreur de connexion");
        setThemes(DEFAULT_THEMES);
        setUsingApiThemes(false);
        if (!options.themeId) {
          setOptions(prev => ({
            ...prev,
            themeId: DEFAULT_THEMES[0].id,
            themeName: DEFAULT_THEMES[0].name,
          }));
        }
      } finally {
        setLoadingThemes(false);
      }
    };

    fetchThemes();
  }, [isOpen]);

  const handleGenerate = () => {
    onGenerate(options);
  };

  const selectTheme = (theme: DefaultTheme) => {
    setOptions((prev) => ({
      ...prev,
      themeId: theme.id,
      themeName: theme.name,
    }));
  };

  // Calculs pour l'affichage
  const actualModulesCount = modulesCount || 0;
  const estimatedSlides =
    (options.includeIntro ? 3 : 0) +
    actualModulesCount * options.cardsPerModule +
    (options.includeConclusion ? 3 : 0);
  const estimatedTime = Math.max(1, Math.ceil(actualModulesCount * 2)); // ~2 min par module

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-3xl shadow-2xl dark:bg-gray-900">
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
                  Workbots AI
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

          {/* Thèmes Gamma */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Palette size={16} />
                Thème de présentation
                {usingApiThemes && (
                  <span className="text-xs font-normal text-green-600 dark:text-green-400">
                    (Gamma)
                  </span>
                )}
              </label>
              {loadingThemes && (
                <RefreshCw size={14} className="animate-spin text-gray-400" />
              )}
            </div>

            {/* Message d'erreur si pas de clé API */}
            {themesError && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl dark:bg-amber-500/10 dark:border-amber-500/30">
                <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                  <AlertCircle size={14} />
                  <span>Workbots AI non configuré - Thèmes par défaut</span>
                </div>
              </div>
            )}

            {/* Grille de thèmes */}
            {loadingThemes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                <span className="ml-2 text-sm text-gray-500">Chargement des thèmes...</span>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {themes.slice(0, 8).map((theme) => {
                  const isSelected = options.themeId === theme.id;

                  return (
                    <button
                      key={theme.id}
                      onClick={() => selectTheme(theme)}
                      className={`group relative rounded-xl border-2 transition-all overflow-hidden ${
                        isSelected
                          ? "border-brand-500 ring-2 ring-brand-500/20 scale-[1.02]"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                      }`}
                    >
                      {/* Aperçu du thème */}
                      {theme.previewUrl ? (
                        <div className="h-20 bg-gray-100 dark:bg-gray-800">
                          <img
                            src={theme.previewUrl}
                            alt={theme.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback si l'image ne charge pas
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : theme.colors ? (
                        <div
                          className="h-20 p-2.5 flex flex-col justify-between"
                          style={{ backgroundColor: theme.colors.bg }}
                        >
                          {/* Mini slide preview */}
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-6 h-6 rounded-md flex items-center justify-center text-[8px] font-bold"
                              style={{ backgroundColor: theme.colors.accent, color: "#FFFFFF" }}
                            >
                              AB
                            </div>
                            <div className="flex-1 space-y-1">
                              <div
                                className="h-1 rounded-full w-full"
                                style={{ backgroundColor: theme.colors.text, opacity: 0.7 }}
                              />
                              <div
                                className="h-1 rounded-full w-3/4"
                                style={{ backgroundColor: theme.colors.text, opacity: 0.4 }}
                              />
                            </div>
                          </div>
                          <div className="space-y-1 mt-1">
                            <div className="flex gap-1">
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: theme.colors.accent }}
                              />
                              <div
                                className="h-1 rounded-full flex-1"
                                style={{ backgroundColor: theme.colors.text, opacity: 0.5 }}
                              />
                            </div>
                            <div className="flex gap-1">
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: theme.colors.accent }}
                              />
                              <div
                                className="h-1 rounded-full w-2/3"
                                style={{ backgroundColor: theme.colors.text, opacity: 0.5 }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-20 p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex flex-col justify-between">
                          <div className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate">
                            {theme.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-8 h-1.5 rounded bg-brand-500/60" />
                            <div className="w-4 h-1.5 rounded bg-gray-300 dark:bg-gray-600" />
                          </div>
                        </div>
                      )}

                      {/* Nom du thème */}
                      <div className="p-2 bg-white dark:bg-gray-800">
                        <p
                          className={`text-xs font-medium text-center truncate ${
                            isSelected
                              ? "text-brand-600 dark:text-brand-400"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {theme.name}
                        </p>
                      </div>

                      {/* Indicateur de sélection */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center shadow-lg">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Info sur les thèmes */}
            {themes.length > 8 && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {themes.length - 8} autres thèmes disponibles
              </p>
            )}
          </div>

          {/* Ton */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <Type size={16} />
              Ton de la présentation
            </label>
            <div className="grid grid-cols-2 gap-2">
              {toneOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setOptions({ ...options, tone: opt.value })}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    options.tone === opt.value
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                      : "border-gray-100 hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700"
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span
                    className={`text-sm font-medium ${
                      options.tone === opt.value
                        ? "text-brand-700 dark:text-brand-400"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Source d'images */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <Image size={16} />
              Style des visuels
            </label>
            <div className="grid grid-cols-4 gap-2">
              {imageSourceOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setOptions({ ...options, imageSource: opt.value })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    options.imageSource === opt.value
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                      : "border-gray-100 hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700"
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span
                    className={`text-xs font-medium text-center ${
                      options.imageSource === opt.value
                        ? "text-brand-700 dark:text-brand-400"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {opt.label}
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
                      Densité du contenu
                    </label>
                    <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                      {options.cardsPerModule} slides/module
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
                <div className="flex items-center gap-4">
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
              disabled={isGenerating || !options.themeId || actualModulesCount === 0}
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
