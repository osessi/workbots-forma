"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Loader2, ExternalLink, FileDown } from "lucide-react";
import Link from "next/link";

interface ActiveGeneration {
  id: string;
  formationId: string;
  formationTitre: string;
  status: string;
  progress: number;
  currentPhase: string;
  currentModuleName?: string;
  startedAt: string;
}

interface CompletedGeneration {
  id: string;
  formationId: string;
  formationTitre: string;
  completedAt: string;
}

interface FailedGeneration {
  id: string;
  formationId: string;
  formationTitre: string;
  errorMessage?: string;
  updatedAt: string;
}

interface GenerationStatus {
  active: ActiveGeneration[];
  completed: CompletedGeneration[];
  failed: FailedGeneration[];
}

interface SlideGenerationNotificationsProps {
  // ID de la formation courante (optionnel)
  currentFormationId?: string;
  // Callback quand une génération est terminée
  onGenerationComplete?: (formationId: string) => void;
}

export default function SlideGenerationNotifications({
  currentFormationId,
  onGenerationComplete,
}: SlideGenerationNotificationsProps) {
  const [status, setStatus] = useState<GenerationStatus | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isPolling, setIsPolling] = useState(false);

  // Charger le statut
  const fetchStatus = useCallback(async () => {
    try {
      const url = currentFormationId
        ? `/api/slides/status?formationId=${currentFormationId}`
        : "/api/slides/status";

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);

        // Vérifier si une génération vient de se terminer
        if (data.completed && data.completed.length > 0) {
          data.completed.forEach((gen: CompletedGeneration) => {
            if (!dismissedIds.has(gen.id) && onGenerationComplete) {
              onGenerationComplete(gen.formationId);
            }
          });
        }
      }
    } catch (error) {
      console.error("Erreur récupération statut:", error);
    }
  }, [currentFormationId, dismissedIds, onGenerationComplete]);

  // Polling pour les mises à jour
  useEffect(() => {
    fetchStatus();

    // Si on a des générations actives, activer le polling
    const interval = setInterval(() => {
      fetchStatus();
    }, 3000); // Toutes les 3 secondes

    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Démarrer/arrêter le polling en fonction des générations actives
  useEffect(() => {
    if (status?.active && status.active.length > 0) {
      setIsPolling(true);
    } else {
      setIsPolling(false);
    }
  }, [status?.active]);

  // Dismiss une notification
  const dismissNotification = async (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    try {
      await fetch(`/api/slides/status?id=${id}`, { method: "DELETE" });
    } catch (error) {
      console.error("Erreur suppression notification:", error);
    }
  };

  // Pas de notifications à afficher
  if (!status) return null;

  const { active, completed, failed } = status;

  // Filtrer les notifications déjà dismissées
  const visibleCompleted = completed.filter((g) => !dismissedIds.has(g.id));
  const visibleFailed = failed.filter((g) => !dismissedIds.has(g.id));

  // Rien à afficher
  if (active.length === 0 && visibleCompleted.length === 0 && visibleFailed.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm">
      {/* Générations en cours */}
      {active.map((gen) => (
        <div
          key={gen.id}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 animate-in slide-in-from-right"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-brand-100 dark:bg-brand-500/20 rounded-lg">
              <Loader2 className="w-5 h-5 text-brand-600 dark:text-brand-400 animate-spin" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                Génération en cours
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {gen.formationTitre}
              </p>
              {gen.currentModuleName && (
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {gen.currentModuleName}
                </p>
              )}
              {/* Barre de progression */}
              <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${gen.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{gen.progress}%</p>
            </div>
          </div>
        </div>
      ))}

      {/* Générations terminées */}
      {visibleCompleted.map((gen) => (
        <div
          key={gen.id}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-green-200 dark:border-green-500/30 p-4 animate-in slide-in-from-right"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                Slides générés !
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {gen.formationTitre}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Link
                  href={`/create?id=${gen.formationId}&step=slides`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-brand-600 bg-brand-50 dark:bg-brand-500/10 dark:text-brand-400 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors"
                >
                  <ExternalLink size={12} />
                  Voir
                </Link>
              </div>
            </div>
            <button
              onClick={() => dismissNotification(gen.id)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}

      {/* Générations échouées */}
      {visibleFailed.map((gen) => (
        <div
          key={gen.id}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-red-200 dark:border-red-500/30 p-4 animate-in slide-in-from-right"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                Erreur de génération
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {gen.formationTitre}
              </p>
              {gen.errorMessage && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1 line-clamp-2">
                  {gen.errorMessage}
                </p>
              )}
            </div>
            <button
              onClick={() => dismissNotification(gen.id)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
