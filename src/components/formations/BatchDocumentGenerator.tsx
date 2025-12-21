"use client";
// ===========================================
// GENERATEUR DE DOCUMENTS PAR LOT
// ===========================================
// Interface pour generer tous les documents
// d'une formation en une seule operation

import { useState, useEffect, useCallback } from "react";
import { DocumentType } from "@/lib/templates/types";

// ===========================================
// TYPES
// ===========================================

interface DocumentTypeInfo {
  type: DocumentType;
  label: string;
  description: string;
  hasTemplate: boolean;
  isPerParticipant: boolean;
  expectedCount: number;
  generatedCount: number;
  isComplete: boolean;
}

interface Session {
  id: string;
  dateDebut: string;
  dateFin: string;
  participantsCount: number;
  participants: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  }[];
}

interface GenerationResult {
  type: DocumentType;
  success: boolean;
  documentId?: string;
  participantId?: string;
  participantName?: string;
  error?: string;
}

interface BatchDocumentGeneratorProps {
  formationId: string;
  onGenerated?: () => void;
  className?: string;
}

// ===========================================
// COMPOSANT PRINCIPAL
// ===========================================

export default function BatchDocumentGenerator({
  formationId,
  onGenerated,
  className = "",
}: BatchDocumentGeneratorProps) {
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeInfo[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Set<DocumentType>>(new Set());
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[] | null>(null);
  const [progress, setProgress] = useState(0);

  // Charger les informations
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/formations/${formationId}/generate-all`);
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data = await res.json();
      setDocumentTypes(data.documentTypes || []);
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [formationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Selectionner/deselectionner un type
  const toggleType = (type: DocumentType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Selectionner tous les types disponibles
  const selectAllTypes = () => {
    setSelectedTypes(
      new Set(
        documentTypes.filter((d) => d.hasTemplate && !d.isComplete).map((d) => d.type)
      )
    );
  };

  // Deselectionner tous
  const clearSelection = () => {
    setSelectedTypes(new Set());
  };

  // Selectionner/deselectionner un participant
  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(participantId)) {
        next.delete(participantId);
      } else {
        next.add(participantId);
      }
      return next;
    });
  };

  // Generer les documents
  const generateDocuments = async () => {
    if (selectedTypes.size === 0) return;

    setGenerating(true);
    setResults(null);
    setProgress(0);

    try {
      const res = await fetch(`/api/formations/${formationId}/generate-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentTypes: Array.from(selectedTypes),
          sessionId: selectedSession || undefined,
          participantIds:
            selectedParticipants.size > 0
              ? Array.from(selectedParticipants)
              : undefined,
        }),
      });

      if (!res.ok) throw new Error("Erreur lors de la génération");

      const data = await res.json();
      setResults(data.results || []);
      setProgress(100);

      // Rafraichir les donnees
      fetchData();
      onGenerated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setGenerating(false);
    }
  };

  // Obtenir les participants de la session selectionnee
  const currentSession = sessions.find((s) => s.id === selectedSession);
  const currentParticipants = currentSession?.participants || [];

  // Compter les documents a generer
  const estimatedCount = Array.from(selectedTypes).reduce((sum, type) => {
    const typeInfo = documentTypes.find((d) => d.type === type);
    if (!typeInfo) return sum;

    if (typeInfo.isPerParticipant) {
      const participantCount =
        selectedParticipants.size > 0
          ? selectedParticipants.size
          : currentSession
          ? currentSession.participantsCount
          : sessions.reduce((s, sess) => s + sess.participantsCount, 0);
      return sum + participantCount;
    }
    return sum + 1;
  }, 0);

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* En-tete */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
            <BatchIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Génération par lot
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Générez plusieurs documents en une seule opération
            </p>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button
              onClick={fetchData}
              className="mt-2 text-sm text-orange-500 hover:text-orange-600"
            >
              Réessayer
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Selection des types de documents */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Types de documents
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllTypes}
                    className="text-xs text-orange-500 hover:text-orange-600"
                  >
                    Tout sélectionner
                  </button>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <button
                    onClick={clearSelection}
                    className="text-xs text-gray-500 hover:text-gray-600"
                  >
                    Effacer
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {documentTypes.map((docType) => (
                  <DocumentTypeCard
                    key={docType.type}
                    docType={docType}
                    isSelected={selectedTypes.has(docType.type)}
                    onToggle={() => toggleType(docType.type)}
                  />
                ))}
              </div>
            </div>

            {/* Selection de session (optionnel) */}
            {sessions.length > 1 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Session (optionnel)
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedSession(null)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      selectedSession === null
                        ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Toutes les sessions
                  </button>
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSession(session.id)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        selectedSession === session.id
                          ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700"
                          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {new Date(session.dateDebut).toLocaleDateString("fr-FR")} ({session.participantsCount} participants)
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selection de participants (si session selectionnee) */}
            {selectedSession && currentParticipants.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Participants
                  </h4>
                  <span className="text-xs text-gray-500">
                    {selectedParticipants.size === 0
                      ? "Tous sélectionnés"
                      : `${selectedParticipants.size} sélectionné(s)`}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {currentParticipants.map((participant) => (
                    <label
                      key={participant.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedParticipants.size === 0 ||
                          selectedParticipants.has(participant.id)
                        }
                        onChange={() => toggleParticipant(participant.id)}
                        className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {participant.prenom} {participant.nom}
                        </p>
                        <p className="text-xs text-gray-500">{participant.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Resultats de generation */}
            {results && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Résultats de la génération
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {results.map((result, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 text-sm ${
                        result.success
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {result.success ? (
                        <CheckIcon className="w-4 h-4" />
                      ) : (
                        <XIcon className="w-4 h-4" />
                      )}
                      <span>
                        {documentTypes.find((d) => d.type === result.type)?.label}
                        {result.participantName && ` - ${result.participantName}`}
                        {result.error && `: ${result.error}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {selectedTypes.size > 0 && (
            <span>
              {selectedTypes.size} type{selectedTypes.size > 1 ? "s" : ""} • ~{estimatedCount} document{estimatedCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          onClick={generateDocuments}
          disabled={generating || selectedTypes.size === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <GenerateIcon className="w-4 h-4" />
              Générer les documents
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ===========================================
// CARTE DE TYPE DE DOCUMENT
// ===========================================

interface DocumentTypeCardProps {
  docType: DocumentTypeInfo;
  isSelected: boolean;
  onToggle: () => void;
}

function DocumentTypeCard({ docType, isSelected, onToggle }: DocumentTypeCardProps) {
  const isDisabled = !docType.hasTemplate;

  return (
    <button
      onClick={onToggle}
      disabled={isDisabled}
      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
        isDisabled
          ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
          : isSelected
          ? "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700"
      }`}
    >
      <div
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          isSelected
            ? "bg-orange-500 border-orange-500"
            : "border-gray-300 dark:border-gray-600"
        }`}
      >
        {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white">
            {docType.label}
          </span>
          {docType.isPerParticipant && (
            <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
              Par participant
            </span>
          )}
          {docType.isComplete && (
            <span className="px-1.5 py-0.5 text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">
              Complet
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {docType.description}
        </p>
        {!docType.hasTemplate && (
          <p className="text-xs text-red-500 mt-1">Aucun template disponible</p>
        )}
        {docType.generatedCount > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            {docType.generatedCount}/{docType.expectedCount} généré(s)
          </p>
        )}
      </div>
    </button>
  );
}

// ===========================================
// ICONES
// ===========================================

const BatchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="6" height="6" rx="1" />
    <rect x="9" y="3" width="6" height="6" rx="1" />
    <rect x="16" y="3" width="6" height="6" rx="1" />
    <rect x="2" y="12" width="6" height="6" rx="1" />
    <rect x="9" y="12" width="6" height="6" rx="1" />
    <rect x="16" y="12" width="6" height="6" rx="1" />
  </svg>
);

const GenerateIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
