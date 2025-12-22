"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Brain,
  Layers,
  Wand2,
  CheckCircle,
  Loader2,
  Palette,
  Image,
  PresentationIcon,
  PartyPopper,
} from "lucide-react";

// Phases de génération
type GenerationPhase = "enrichment" | "generation" | "finalizing" | "complete";

interface GenerationProgressProps {
  isGenerating: boolean;
  phase: GenerationPhase;
  currentModuleIndex: number;
  totalModules: number;
  currentModuleName?: string;
  progressPercentage: number;
}

// Configuration des phases avec leurs étapes visuelles
const phaseConfig = {
  enrichment: {
    steps: [
      { id: 1, name: "Analyse", icon: Brain, description: "Analyse du contenu" },
      { id: 2, name: "Enrichissement", icon: Sparkles, description: "Enrichissement IA" },
    ],
    messages: [
      "Lecture des objectifs pédagogiques...",
      "Analyse des points clés du module...",
      "Identification des concepts importants...",
      "Ajout d'exemples pertinents...",
      "Création de transitions fluides...",
      "Optimisation pédagogique...",
    ],
  },
  generation: {
    steps: [
      { id: 3, name: "Structuration", icon: Layers, description: "Organisation des slides" },
      { id: 4, name: "Design", icon: Palette, description: "Application du thème" },
      { id: 5, name: "Visuels", icon: Image, description: "Sélection des images" },
    ],
    messages: [
      "Organisation des slides...",
      "Application du thème visuel...",
      "Mise en forme des contenus...",
      "Sélection des images...",
      "Harmonisation de la présentation...",
    ],
  },
  finalizing: {
    steps: [
      { id: 6, name: "Finalisation", icon: PresentationIcon, description: "Assemblage final" },
    ],
    messages: [
      "Assemblage des slides...",
      "Vérification de la cohérence...",
      "Export en cours...",
      "Préparation du téléchargement...",
    ],
  },
  complete: {
    steps: [],
    messages: ["Génération terminée !"],
  },
};

// Toutes les étapes pour l'affichage
const allSteps = [
  { id: 1, name: "Analyse", icon: Brain },
  { id: 2, name: "Enrichissement", icon: Sparkles },
  { id: 3, name: "Structuration", icon: Layers },
  { id: 4, name: "Design", icon: Palette },
  { id: 5, name: "Visuels", icon: Image },
  { id: 6, name: "Finalisation", icon: PresentationIcon },
];

// Couleurs de la marque
const brandColors = {
  primary: "#4277FF",
  secondary: "#8B5CF6",
};

export default function GenerationProgress({
  isGenerating,
  phase,
  currentModuleIndex,
  totalModules,
  currentModuleName,
  progressPercentage,
}: GenerationProgressProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [dots, setDots] = useState("");

  // Animer les points de suspension
  useEffect(() => {
    if (!isGenerating || phase === "complete") return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [isGenerating, phase]);

  // Changer les messages selon la phase
  useEffect(() => {
    if (!isGenerating || phase === "complete") return;
    const messages = phaseConfig[phase]?.messages || [];
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isGenerating, phase]);

  // Calculer l'étape visuelle actuelle basée sur la phase
  const getCurrentVisualStep = (): number => {
    switch (phase) {
      case "enrichment":
        return currentModuleIndex === 0 ? 1 : 2;
      case "generation":
        return 4; // Au milieu des étapes de génération
      case "finalizing":
        return 6;
      case "complete":
        return 7; // Toutes les étapes sont complètes
      default:
        return 1;
    }
  };

  const visualStep = getCurrentVisualStep();
  const currentMessages = phaseConfig[phase]?.messages || [];
  const currentMessage = currentMessages[messageIndex % currentMessages.length] || "";

  if (!isGenerating) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-xl p-8 mx-4">
        {/* Animation centrale */}
        <div className="relative flex flex-col items-center mb-8">
          {/* Cercles animés */}
          <div className="relative w-36 h-36">
            {/* Cercle extérieur qui pulse */}
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ backgroundColor: brandColors.primary }}
            />

            {/* Cercle de fond */}
            <div className="absolute inset-2 rounded-full bg-white/5" />

            {/* Cercle de progression */}
            <svg className="absolute inset-0 w-36 h-36 -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="66"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="4"
              />
              <circle
                cx="72"
                cy="72"
                r="66"
                fill="none"
                stroke="url(#progress-gradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${progressPercentage * 4.14} 414`}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient
                  id="progress-gradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={brandColors.primary} />
                  <stop offset="100%" stopColor={brandColors.secondary} />
                </linearGradient>
              </defs>
            </svg>

            {/* Icône centrale */}
            <div
              className="absolute inset-5 flex items-center justify-center rounded-full shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%)`,
              }}
            >
              {phase === "complete" ? (
                <PartyPopper className="w-12 h-12 text-white" />
              ) : (
                <Wand2 className="w-12 h-12 text-white animate-pulse" />
              )}
            </div>

            {/* Pourcentage */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">
              <span className="text-sm font-bold text-white">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          </div>

          {/* Texte principal */}
          <h2 className="mt-8 text-2xl font-bold text-white">Workbots AI</h2>
          <p className="mt-2 text-gray-400">
            {phase === "complete"
              ? "Génération terminée !"
              : `Génération en cours${dots}`}
          </p>
        </div>

        {/* Progression détaillée */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          {/* Module actuel */}
          {currentModuleName && phase !== "complete" && (
            <div className="mb-4 pb-4 border-b border-white/10">
              <p className="text-sm text-gray-400">
                {phase === "enrichment" ? "Module en cours d'enrichissement" : "En cours"}
              </p>
              <p className="mt-1 font-semibold text-white truncate">
                {currentModuleName}
              </p>
              {phase === "enrichment" && totalModules > 1 && (
                <p className="text-xs text-gray-500 mt-1">
                  Module {currentModuleIndex + 1} / {totalModules}
                </p>
              )}
            </div>
          )}

          {/* Étapes */}
          <div className="space-y-2">
            {allSteps.map((step) => {
              const isCompleted = visualStep > step.id;
              const isCurrent =
                visualStep === step.id ||
                (phase === "generation" && step.id >= 3 && step.id <= 5);
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className="flex items-center gap-3 py-1"
                >
                  {/* Icône - taille fixe */}
                  <div
                    className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-green-500"
                        : isCurrent
                        ? "bg-gradient-to-br from-brand-500 to-purple-500"
                        : "bg-white/5"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4 text-gray-500" />
                    )}
                  </div>

                  {/* Nom de l'étape - largeur fixe */}
                  <div className="w-32 flex-shrink-0">
                    <p
                      className={`text-sm font-medium transition-colors ${
                        isCompleted
                          ? "text-green-400"
                          : isCurrent
                          ? "text-white"
                          : "text-gray-500"
                      }`}
                    >
                      {step.name}
                    </p>
                  </div>

                  {/* Description ou message - flexible */}
                  <div className="flex-1 min-w-0">
                    {isCurrent && !isCompleted ? (
                      <p className="text-xs text-gray-400 truncate">
                        {currentMessage}
                      </p>
                    ) : null}
                  </div>

                  {/* Indicateur - largeur fixe */}
                  <div className="w-8 flex-shrink-0 text-right">
                    {isCompleted && <span className="text-xs font-medium text-green-400">OK</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Barre de progression globale */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Progression totale</span>
              <span className="font-semibold text-white">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${progressPercentage}%`,
                  background: `linear-gradient(90deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%)`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Message de patience */}
        {phase !== "complete" && (
          <p className="mt-6 text-center text-sm text-gray-500">
            La génération peut prendre quelques minutes selon le nombre de modules
          </p>
        )}
      </div>
    </div>
  );
}
