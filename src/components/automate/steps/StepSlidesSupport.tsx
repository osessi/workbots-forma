"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  ExternalLink,
  CheckCircle,
  XCircle,
  Wand2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Clock,
  FileDown,
  Loader2,
  Save,
  FolderOpen,
} from "lucide-react";
import WorkbotsOptionsModal, { WorkbotsGenerationOptions } from "./WorkbotsOptionsModal";
import GenerationProgress from "./GenerationProgress";
import { WorkbotsModuleResult } from "@/lib/workbots/types";

interface Module {
  id: string;
  titre: string;
  contenu: string[];
  objectifs?: string[];
  isModuleZero?: boolean; // Qualiopi IND 10 - Module 0 de mise à niveau
}

interface SlidesData {
  moduleId: string;
  moduleTitre: string;
  generationId: string;
  exportUrl?: string;
  editUrl?: string;
  driveUrl?: string; // URL in internal Drive
  driveFileId?: string; // File ID in Drive
  status: "pending" | "completed" | "failed";
  error?: string;
}

interface StepSlidesSupportProps {
  modules: Module[];
  formationId?: string;
  formationTitre?: string;
  existingSlidesData?: SlidesData[];
  organizationColors?: {
    primary?: string;
    secondary?: string;
  };
  onNext: () => void;
  onPrevious: () => void;
  onSlidesGenerated?: (slidesData: SlidesData[]) => void;
}

// Phases de génération
type GenerationPhase = "enrichment" | "generation" | "finalizing" | "complete";

export const StepSlidesSupport: React.FC<StepSlidesSupportProps> = ({
  modules,
  formationId,
  formationTitre = "Formation",
  existingSlidesData,
  onNext,
  onPrevious,
  onSlidesGenerated,
}) => {
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState<string | null>(null);
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>("enrichment");
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentModuleName, setCurrentModuleName] = useState("");
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [slidesData, setSlidesData] = useState<SlidesData[]>(existingSlidesData || []);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Référence pour le polling interval
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mettre à jour les données si elles changent depuis les props
  useEffect(() => {
    if (existingSlidesData && existingSlidesData.length > 0) {
      setSlidesData(existingSlidesData);
    }
  }, [existingSlidesData]);

  // Vérifier s'il y a une génération en cours au montage
  useEffect(() => {
    const checkActiveGeneration = async () => {
      if (!formationId) return;

      try {
        const response = await fetch(`/api/workbots/status?formationId=${formationId}`);
        if (response.ok) {
          const data = await response.json();

          // S'il y a une génération en cours pour cette formation
          if (data.active && data.active.length > 0) {
            const activeGen = data.active[0];
            setIsGenerating(true);
            setProgressPercentage(activeGen.progress);
            setCurrentModuleName(activeGen.currentModuleName || "");
            setCurrentModuleIndex(activeGen.currentModuleIndex || 0);

            // Mapper le statut vers la phase
            const phaseMap: Record<string, GenerationPhase> = {
              PENDING: "enrichment",
              ENRICHMENT: "enrichment",
              GENERATING: "generation",
              FINALIZING: "finalizing",
            };
            setGenerationPhase(phaseMap[activeGen.status] || "enrichment");

            // Démarrer le polling pour suivre la progression
            pollGenerationStatus(formationId);
          }
          // S'il y a des slides récemment complétés
          else if (data.completed && data.completed.length > 0) {
            const completed = data.completed[0];
            if (completed.moduleResults) {
              const newSlidesData = mapModuleResults(completed.moduleResults);
              setSlidesData(newSlidesData);
            }
          }
          // S'il y a des générations échouées récentes (montrer l'erreur)
          else if (data.failed && data.failed.length > 0) {
            const failed = data.failed[0];
            const failedTime = new Date(failed.updatedAt).getTime();
            const now = Date.now();
            // N'afficher que si vraiment récent (2 minutes)
            if (now - failedTime < 2 * 60 * 1000) {
              const errorMsg = failed.errorMessage?.includes("timeout")
                ? "La génération précédente a été interrompue. Vous pouvez relancer la génération."
                : "La génération précédente a échoué. Vous pouvez réessayer.";
              setError(errorMsg);
            }
          }
        }
      } catch (error) {
        console.error("Erreur vérification génération en cours:", error);
      }
    };

    checkActiveGeneration();
  }, [formationId]);

  // Mapper les résultats de modules vers SlidesData
  const mapModuleResults = (results: WorkbotsModuleResult[]): SlidesData[] => {
    return results.map((r) => ({
      moduleId: r.moduleId,
      moduleTitre: r.moduleTitre,
      generationId: r.presentationId || "",
      exportUrl: r.exportUrl,
      editUrl: r.editUrl,
      status: r.status === "completed" ? "completed" : r.status === "failed" ? "failed" : "pending",
      error: r.error,
    }));
  };

  // Polling pour suivre une génération en cours
  const pollGenerationStatus = async (fId: string) => {
    // Nettoyer l'ancien interval si existant
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/workbots/status?formationId=${fId}`);
        if (response.ok) {
          const data = await response.json();

          if (data.active && data.active.length > 0) {
            const activeGen = data.active[0];
            setProgressPercentage(activeGen.progress);
            setCurrentModuleName(activeGen.currentModuleName || "");
            setCurrentModuleIndex(activeGen.currentModuleIndex || 0);

            const phaseMap: Record<string, GenerationPhase> = {
              PENDING: "enrichment",
              ENRICHMENT: "enrichment",
              GENERATING: "generation",
              FINALIZING: "finalizing",
            };
            setGenerationPhase(phaseMap[activeGen.status] || "enrichment");
          } else {
            // Plus de génération active, vérifier les complétées ou échouées
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }

            if (data.completed && data.completed.length > 0) {
              const completed = data.completed[0];
              if (completed.moduleResults) {
                const newSlidesData = mapModuleResults(completed.moduleResults);
                setSlidesData(newSlidesData);
                if (onSlidesGenerated) {
                  onSlidesGenerated(newSlidesData);
                }
              }
              setGenerationPhase("complete");
              setProgressPercentage(100);
              setTimeout(() => {
                setIsGenerating(false);
                setGenerationPhase("enrichment");
                setProgressPercentage(0);
              }, 2000);
            } else if (data.failed && data.failed.length > 0) {
              const failed = data.failed[0];
              setError(failed.errorMessage || "La génération a échoué. Veuillez réessayer.");
              setIsGenerating(false);
              setGenerationPhase("enrichment");
              setProgressPercentage(0);
            } else {
              setIsGenerating(false);
            }
          }
        }
      } catch (error) {
        console.error("Erreur polling:", error);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setIsGenerating(false);
      }
    }, 2000);

    // Cleanup après 10 minutes max
    setTimeout(() => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }, 10 * 60 * 1000);
  };

  // Cleanup du polling au démontage
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Toggle expansion d'un module
  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  // Lancer la génération avec Workbots
  const handleGenerateSlides = async (options: WorkbotsGenerationOptions) => {
    setIsGenerating(true);
    setError(null);
    setShowOptionsModal(false);
    setGenerationPhase("enrichment");
    setCurrentModuleIndex(0);
    setCurrentModuleName("Démarrage...");
    setProgressPercentage(0);

    try {
      // Préparer les modules pour l'API Workbots
      const modulesForApi = modules.map((m) => ({
        moduleId: m.id,
        moduleTitre: m.titre,
        contenu: m.contenu.join("\n"),
        objectifs: m.objectifs?.join("\n"),
        nSlides: options.cardsPerModule,
      }));

      const requestBody = {
        formationId,
        formationTitre,
        modules: modulesForApi,
        templateId: options.templateId,
        tone: options.tone,
        verbosity: options.verbosity,
        language: options.language,
        includeIntro: options.includeIntro,
        includeConclusion: options.includeConclusion,
        includeTableOfContents: options.includeTableOfContents,
        audience: options.audience,
      };

      // Lancer la génération en arrière-plan via l'API Workbots
      const response = await fetch("/api/workbots/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors du lancement de la génération");
      }

      const data = await response.json();
      console.log("Génération Workbots lancée:", data.generationId);

      // Démarrer le polling pour suivre la progression
      if (formationId) {
        pollGenerationStatus(formationId);
      }
    } catch (err) {
      console.error("Erreur génération slides:", err);
      setError(
        err instanceof Error ? err.message : "Erreur lors de la génération des slides"
      );
      setIsGenerating(false);
      setGenerationPhase("enrichment");
      setProgressPercentage(0);
    }
  };

  // Sauvegarder un fichier dans le Drive
  const handleSaveToDrive = async (slideData: SlidesData) => {
    if (!formationId || !slideData.exportUrl) return;

    setIsSavingToDrive(slideData.moduleId);
    setError(null);

    try {
      const response = await fetch("/api/workbots/save-to-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formationId,
          moduleId: slideData.moduleId,
          moduleTitre: slideData.moduleTitre,
          filePath: slideData.exportUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de la sauvegarde");
      }

      const data = await response.json();

      // Mettre à jour les données du slide avec les infos Drive
      setSlidesData((prev) =>
        prev.map((s) =>
          s.moduleId === slideData.moduleId
            ? {
                ...s,
                driveUrl: data.file.publicUrl,
                driveFileId: data.file.id,
              }
            : s
        )
      );
    } catch (err) {
      console.error("Erreur sauvegarde Drive:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setIsSavingToDrive(null);
    }
  };

  // Vérifier si des slides ont été générés
  const hasGeneratedSlides = slidesData.length > 0;
  const completedCount = slidesData.filter((s) => s.status === "completed").length;
  const allCompleted = hasGeneratedSlides && completedCount === slidesData.length;
  const savedToDriveCount = slidesData.filter((s) => s.driveFileId).length;

  // Obtenir le statut d'un module
  const getModuleSlideData = (moduleId: string) => {
    return slidesData.find((s) => s.moduleId === moduleId);
  };

  // Télécharger tous les PPTX
  const handleDownloadAll = async () => {
    if (!allCompleted) return;

    setIsDownloadingAll(true);
    setError(null);

    try {
      // Collecter les URLs de téléchargement dans l'ordre
      const exportUrls = slidesData
        .filter((s) => s.status === "completed" && s.exportUrl)
        .map((s) => ({
          moduleId: s.moduleId,
          moduleTitre: s.moduleTitre || `Module-${s.moduleId}`,
          exportUrl: s.exportUrl!,
        }));

      if (exportUrls.length === 0) {
        throw new Error("Aucun fichier à télécharger");
      }

      // Télécharger chaque fichier individuellement ou fusionner si API disponible
      for (const item of exportUrls) {
        const response = await fetch(`/api/workbots/download?path=${encodeURIComponent(item.exportUrl)}`);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          // Sécuriser le nom de fichier - utiliser un fallback si moduleTitre est vide
          const safeTitle = (item.moduleTitre || "presentation")
            .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\s-]/gi, "")
            .replace(/\s+/g, "-") || "presentation";
          a.download = `${safeTitle}.pptx`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          console.error(`Erreur téléchargement ${item.moduleTitre}: ${response.status}`);
        }
      }
    } catch (err) {
      console.error("Erreur téléchargement:", err);
      setError(
        err instanceof Error ? err.message : "Erreur lors du téléchargement"
      );
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // Sauvegarder tous dans le Drive
  const handleSaveAllToDrive = async () => {
    if (!allCompleted || !formationId) return;

    const unsavedSlides = slidesData.filter((s) => s.status === "completed" && !s.driveFileId);

    for (const slide of unsavedSlides) {
      await handleSaveToDrive(slide);
    }
  };

  return (
    <div className="space-y-6">
      {/* Animation de génération en plein écran */}
      {isGenerating && (
        <GenerationProgress
          isGenerating={isGenerating}
          phase={generationPhase}
          currentModuleIndex={currentModuleIndex}
          totalModules={modules.length}
          currentModuleName={currentModuleName}
          progressPercentage={progressPercentage}
        />
      )}

      {/* Header Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Slides & Support Apprenant
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Générez automatiquement des présentations PowerPoint pour chaque
              module de votre formation grâce à Workbots Slides.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {hasGeneratedSlides && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg dark:bg-green-500/10 dark:text-green-400">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">
                  {completedCount}/{slidesData.length} générés
                </span>
              </div>
            )}
            {savedToDriveCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg dark:bg-blue-500/10 dark:text-blue-400">
                <FolderOpen size={16} />
                <span className="text-sm font-medium">
                  {savedToDriveCount} dans Drive
                </span>
              </div>
            )}
            {allCompleted ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveAllToDrive}
                  disabled={savedToDriveCount === slidesData.length}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 disabled:opacity-50"
                >
                  <Save size={16} />
                  Sauvegarder tout
                </button>
                <button
                  onClick={handleDownloadAll}
                  disabled={isDownloadingAll}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-purple-500 rounded-xl hover:from-brand-600 hover:to-purple-600 transition-all shadow-lg shadow-brand-500/25 disabled:opacity-50"
                >
                  {isDownloadingAll ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Préparation...
                    </>
                  ) : (
                    <>
                      <FileDown size={16} />
                      Télécharger tout
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowOptionsModal(true)}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-purple-500 rounded-xl hover:from-brand-600 hover:to-purple-600 transition-all shadow-lg shadow-brand-500/25 disabled:opacity-50"
              >
                <Wand2 size={16} />
                Générer avec Workbots
              </button>
            )}
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl dark:bg-red-500/10 dark:border-red-500/30">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  Erreur de génération
                </p>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  {error}
                </p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 underline"
                >
                  Fermer ce message
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Liste des modules */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {formationTitre}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {modules.length} module{modules.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {modules.map((module, index) => {
            const slideData = getModuleSlideData(module.id);
            const isExpanded = expandedModules.has(module.id);
            // Calculer le numéro du module (0 pour Module 0, sinon index sans compter Module 0)
            const moduleNum = module.isModuleZero ? 0 : index - (modules.some(m => m.isModuleZero) ? 1 : 0) + 1;

            return (
              <div key={module.id} className="bg-white dark:bg-transparent">
                {/* Module header */}
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-semibold text-sm ${
                    module.isModuleZero
                      ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                      : "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                  }`}>
                    {moduleNum}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {module.titre}
                      </h4>
                      {module.isModuleZero && (
                        <>
                          <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-medium text-amber-700 bg-amber-100 rounded-full dark:bg-amber-500/20 dark:text-amber-300">
                            Mise à niveau
                          </span>
                          <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-medium text-blue-700 bg-blue-100 rounded-full dark:bg-blue-500/20 dark:text-blue-300">
                            Qualiopi - IND 10
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {module.contenu.length} points de contenu
                    </p>
                  </div>

                  {/* Status */}
                  {slideData && (
                    <div className="flex items-center gap-2">
                      {slideData.driveFileId && (
                        <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-blue-600 bg-blue-50 rounded-full dark:bg-blue-500/10 dark:text-blue-400">
                          <FolderOpen size={10} />
                          Drive
                        </span>
                      )}
                      {slideData.status === "completed" ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full dark:bg-green-500/10 dark:text-green-400">
                          <CheckCircle size={12} />
                          Généré
                        </span>
                      ) : slideData.status === "failed" ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-full dark:bg-red-500/10 dark:text-red-400">
                          <XCircle size={12} />
                          Erreur
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-yellow-700 bg-yellow-50 rounded-full dark:bg-yellow-500/10 dark:text-yellow-400">
                          <Clock size={12} />
                          En cours
                        </span>
                      )}
                    </div>
                  )}

                  {isExpanded ? (
                    <ChevronDown size={18} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={18} className="text-gray-400" />
                  )}
                </button>

                {/* Module content (expanded) */}
                {isExpanded && (
                  <div className="px-4 pb-4 pl-16">
                    {/* Contenu du module */}
                    <div className="p-4 bg-gray-50 rounded-xl dark:bg-gray-800/50 mb-4">
                      <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                        Contenu du module
                      </h5>
                      <ul className="space-y-1.5">
                        {module.contenu.map((item, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                          >
                            <span className="text-brand-500 mt-1">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actions si slide généré */}
                    {slideData && slideData.status === "completed" && (
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Bouton télécharger */}
                        {slideData.exportUrl && (
                          <a
                            href={`/api/workbots/download?path=${encodeURIComponent(slideData.exportUrl)}`}
                            download
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
                          >
                            <Download size={14} />
                            Télécharger PPTX
                          </a>
                        )}

                        {/* Bouton sauvegarder dans Drive */}
                        {!slideData.driveFileId && slideData.exportUrl && (
                          <button
                            onClick={() => handleSaveToDrive(slideData)}
                            disabled={isSavingToDrive === slideData.moduleId}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 disabled:opacity-50"
                          >
                            {isSavingToDrive === slideData.moduleId ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                Sauvegarde...
                              </>
                            ) : (
                              <>
                                <Save size={14} />
                                Sauvegarder dans Drive
                              </>
                            )}
                          </button>
                        )}

                        {/* Lien vers le fichier Drive */}
                        {slideData.driveUrl && (
                          <a
                            href={slideData.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20"
                          >
                            <ExternalLink size={14} />
                            Ouvrir depuis Drive
                          </a>
                        )}
                      </div>
                    )}

                    {/* Erreur */}
                    {slideData && slideData.status === "failed" && slideData.error && (
                      <div className="p-3 bg-red-50 rounded-lg dark:bg-red-500/10">
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {slideData.error}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info sur le support apprenant */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-500/30 dark:bg-blue-500/10">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-blue-100 rounded-xl dark:bg-blue-500/20">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-blue-900 dark:text-blue-300">
              Support Apprenant
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              Une fois les slides générés, vous pourrez créer un support apprenant
              au format PDF incluant les slides annotés, des espaces de prise de
              notes et un récapitulatif des points clés.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
        >
          Retour
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors shadow-sm"
        >
          Générer les évaluations
        </button>
      </div>

      {/* Modal Workbots Options */}
      <WorkbotsOptionsModal
        isOpen={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        onGenerate={handleGenerateSlides}
        formationTitre={formationTitre}
        modulesCount={modules.length}
        isGenerating={isGenerating}
      />
    </div>
  );
};

export default StepSlidesSupport;
