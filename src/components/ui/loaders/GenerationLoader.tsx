"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  FileText,
  Presentation,
  ClipboardCheck,
  FileDown,
  Sparkles,
  Brain,
  Wand2,
  Loader2
} from "lucide-react";

// Types de génération supportés
export type GenerationType = "fiche" | "slides" | "qcm" | "pdf" | "evaluations" | "documents" | "generic";

interface GenerationLoaderProps {
  type: GenerationType;
  isLoading: boolean;
  progress?: number; // 0-100
  customMessages?: string[];
  title?: string;
  subtitle?: string;
  className?: string;
}

// Messages par type de génération
const messagesByType: Record<GenerationType, string[]> = {
  fiche: [
    "Analyse du contexte de formation...",
    "Identification des objectifs pédagogiques...",
    "Structuration du contenu...",
    "Définition des prérequis...",
    "Rédaction des modules...",
    "Finalisation de la fiche pédagogique..."
  ],
  slides: [
    "Préparation du contenu...",
    "Création de la structure des slides...",
    "Génération des visuels...",
    "Mise en forme du design...",
    "Ajout des animations...",
    "Exportation de la présentation..."
  ],
  qcm: [
    "Analyse du contenu du module...",
    "Identification des points clés...",
    "Génération des questions...",
    "Création des réponses...",
    "Validation pédagogique...",
    "Finalisation du QCM..."
  ],
  pdf: [
    "Préparation du document...",
    "Mise en page du contenu...",
    "Ajout des en-têtes...",
    "Génération des tableaux...",
    "Optimisation du rendu...",
    "Export PDF en cours..."
  ],
  evaluations: [
    "Analyse des objectifs...",
    "Création du positionnement...",
    "Génération des évaluations...",
    "Calibrage des questions...",
    "Validation des critères...",
    "Finalisation..."
  ],
  documents: [
    "Préparation des templates...",
    "Collecte des informations...",
    "Génération des documents...",
    "Mise en forme finale...",
    "Vérification de la qualité...",
    "Documents prêts !"
  ],
  generic: [
    "Traitement en cours...",
    "Analyse des données...",
    "Génération du contenu...",
    "Optimisation...",
    "Presque terminé...",
    "Finalisation..."
  ]
};

// Icônes par type
const iconsByType: Record<GenerationType, React.ReactNode> = {
  fiche: <FileText className="w-8 h-8" />,
  slides: <Presentation className="w-8 h-8" />,
  qcm: <ClipboardCheck className="w-8 h-8" />,
  pdf: <FileDown className="w-8 h-8" />,
  evaluations: <Brain className="w-8 h-8" />,
  documents: <FileText className="w-8 h-8" />,
  generic: <Wand2 className="w-8 h-8" />
};

// Couleurs par type
const colorsByType: Record<GenerationType, { bg: string; text: string; ring: string }> = {
  fiche: { bg: "bg-blue-100 dark:bg-blue-500/20", text: "text-blue-600 dark:text-blue-400", ring: "stroke-blue-500" },
  slides: { bg: "bg-purple-100 dark:bg-purple-500/20", text: "text-purple-600 dark:text-purple-400", ring: "stroke-purple-500" },
  qcm: { bg: "bg-green-100 dark:bg-green-500/20", text: "text-green-600 dark:text-green-400", ring: "stroke-green-500" },
  pdf: { bg: "bg-red-100 dark:bg-red-500/20", text: "text-red-600 dark:text-red-400", ring: "stroke-red-500" },
  evaluations: { bg: "bg-amber-100 dark:bg-amber-500/20", text: "text-amber-600 dark:text-amber-400", ring: "stroke-amber-500" },
  documents: { bg: "bg-indigo-100 dark:bg-indigo-500/20", text: "text-indigo-600 dark:text-indigo-400", ring: "stroke-indigo-500" },
  generic: { bg: "bg-brand-100 dark:bg-brand-500/20", text: "text-brand-600 dark:text-brand-400", ring: "stroke-brand-500" }
};

// Titres par défaut par type
const titlesByType: Record<GenerationType, string> = {
  fiche: "Génération de la fiche pédagogique",
  slides: "Création des slides",
  qcm: "Génération du QCM",
  pdf: "Export PDF",
  evaluations: "Génération des évaluations",
  documents: "Génération des documents",
  generic: "Génération en cours"
};

export function GenerationLoader({
  type,
  isLoading,
  progress,
  customMessages,
  title,
  subtitle,
  className
}: GenerationLoaderProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const messages = customMessages || messagesByType[type];
  const colors = colorsByType[type];
  const icon = iconsByType[type];
  const defaultTitle = titlesByType[type];

  // Rotation des messages
  useEffect(() => {
    if (!isLoading) {
      setCurrentMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isLoading, messages.length]);

  // Si progress est défini, utiliser le message correspondant
  useEffect(() => {
    if (progress !== undefined && isLoading) {
      const messageIndex = Math.min(
        Math.floor((progress / 100) * messages.length),
        messages.length - 1
      );
      setCurrentMessageIndex(messageIndex);
    }
  }, [progress, messages.length, isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`flex flex-col items-center justify-center p-8 ${className || ""}`}
        >
          {/* Cercle de progression animé */}
          <div className="relative mb-6">
            {/* Cercle de fond */}
            <svg className="w-24 h-24" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Cercle de progression */}
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className={colors.ring}
                style={{
                  transformOrigin: "center",
                  transform: "rotate(-90deg)"
                }}
                initial={{ pathLength: 0 }}
                animate={{
                  pathLength: progress !== undefined ? progress / 100 : 1,
                  transition: progress !== undefined
                    ? { duration: 0.5, ease: "easeOut" }
                    : {
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }
                }}
                strokeDasharray="264"
                strokeDashoffset={progress !== undefined ? 264 - (264 * progress) / 100 : 0}
              />
            </svg>

            {/* Icône centrale */}
            <motion.div
              className={`absolute inset-0 flex items-center justify-center ${colors.text}`}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [1, 0.8, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {icon}
            </motion.div>

            {/* Particules Sparkles */}
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-5 h-5 text-yellow-500" />
            </motion.div>
          </div>

          {/* Titre */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {title || defaultTitle}
          </h3>

          {/* Sous-titre optionnel */}
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {subtitle}
            </p>
          )}

          {/* Message rotatif */}
          <div className="h-6 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentMessageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-gray-600 dark:text-gray-400 text-center"
              >
                {messages[currentMessageIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Barre de progression (si disponible) */}
          {progress !== undefined && (
            <div className="w-64 mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progression</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${colors.ring.replace("stroke-", "bg-")}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Loader simple pour les actions rapides
interface SimpleLoaderProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

export function SimpleLoader({ size = "md", color, className }: SimpleLoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  return (
    <Loader2
      className={`animate-spin ${sizeClasses[size]} ${color || "text-brand-500"} ${className || ""}`}
    />
  );
}

// Loader avec overlay pour bloquer l'interface
interface OverlayLoaderProps {
  isLoading: boolean;
  type?: GenerationType;
  message?: string;
}

export function OverlayLoader({ isLoading, type = "generic", message }: OverlayLoaderProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
        >
          <GenerationLoader
            type={type}
            isLoading={isLoading}
            subtitle={message}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
