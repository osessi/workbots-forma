"use client";
// ===========================================
// HISTORIQUE DES VERSIONS DE TEMPLATE
// ===========================================
// Affiche l'historique des versions d'un template
// avec possibilite de previsualiser et restaurer

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// ===========================================
// TYPES
// ===========================================

interface TemplateVersion {
  id: string;
  templateId: string;
  version: number;
  content: unknown;
  headerContent: unknown | null;
  footerContent: unknown | null;
  changeNote: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

interface VersionHistoryProps {
  templateId: string;
  onRestore?: (version: TemplateVersion) => void;
  onPreview?: (version: TemplateVersion) => void;
  className?: string;
}

// ===========================================
// COMPOSANT PRINCIPAL
// ===========================================

export default function VersionHistory({
  templateId,
  onRestore,
  onPreview,
  className = "",
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingVersion, setSavingVersion] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [changeNote, setChangeNote] = useState("");

  // Charger les versions
  const fetchVersions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/templates/${templateId}/versions`);
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data = await res.json();
      setVersions(data.versions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  // Sauvegarder une nouvelle version
  const saveVersion = async () => {
    setSavingVersion(true);
    try {
      const res = await fetch(`/api/admin/templates/${templateId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeNote: changeNote || undefined }),
      });

      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");

      setShowSaveModal(false);
      setChangeNote("");
      fetchVersions();
    } catch (err) {
      console.error("Erreur sauvegarde version:", err);
    } finally {
      setSavingVersion(false);
    }
  };

  // Restaurer une version
  const restoreVersion = async (version: TemplateVersion) => {
    if (!confirm(`Restaurer la version ${version.version} ? L'état actuel sera sauvegardé.`)) {
      return;
    }

    setRestoringId(version.id);
    try {
      const res = await fetch(
        `/api/admin/templates/${templateId}/versions/${version.id}`,
        { method: "POST" }
      );

      if (!res.ok) throw new Error("Erreur lors de la restauration");

      const data = await res.json();
      onRestore?.(version);
      fetchVersions();
      alert(data.message || "Version restaurée avec succès");
    } catch (err) {
      console.error("Erreur restauration:", err);
      alert("Erreur lors de la restauration");
    } finally {
      setRestoringId(null);
    }
  };

  // Formater le nom de l'auteur
  const formatAuthor = (createdBy: TemplateVersion["createdBy"]) => {
    if (!createdBy) return "Système";
    if (createdBy.firstName || createdBy.lastName) {
      return `${createdBy.firstName || ""} ${createdBy.lastName || ""}`.trim();
    }
    return createdBy.email;
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* En-tete */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
            <HistoryIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Historique des versions
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {versions.length} version{versions.length > 1 ? "s" : ""} enregistrée{versions.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowSaveModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <SaveIcon className="w-4 h-4" />
          Sauvegarder version
        </button>
      </div>

      {/* Contenu */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button
              onClick={fetchVersions}
              className="mt-2 text-sm text-purple-500 hover:text-purple-600"
            >
              Réessayer
            </button>
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12">
            <HistoryIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Aucune version sauvegardée
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Sauvegardez une version pour garder un historique
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {versions.map((version, index) => (
              <div
                key={version.id}
                className="group p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        index === 0
                          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      v{version.version}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {version.changeNote || `Version ${version.version}`}
                        </span>
                        {index === 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">
                            Actuelle
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span>{formatAuthor(version.createdBy)}</span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(version.createdAt), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onPreview && (
                      <button
                        onClick={() => onPreview(version)}
                        className="p-2 text-gray-500 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        title="Prévisualiser"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    )}
                    {index !== 0 && (
                      <button
                        onClick={() => restoreVersion(version)}
                        disabled={restoringId === version.id}
                        className="p-2 text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Restaurer cette version"
                      >
                        {restoringId === version.id ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
                        ) : (
                          <RestoreIcon className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de sauvegarde */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Sauvegarder une version
              </h3>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Note de version (optionnel)
              </label>
              <input
                type="text"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="Ex: Ajout des mentions légales RGPD"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Cette note vous aidera à identifier la version plus tard
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setChangeNote("");
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={saveVersion}
                disabled={savingVersion}
                className="px-4 py-2 text-sm font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
              >
                {savingVersion ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <SaveIcon className="w-4 h-4" />
                    Sauvegarder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================
// ICONES
// ===========================================

const HistoryIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SaveIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const EyeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const RestoreIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);
