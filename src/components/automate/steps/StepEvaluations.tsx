"use client";
import React, { useState, useCallback, useEffect } from "react";

// Types
interface Module {
  id: string;
  titre: string;
  contenu: string[];
  isModuleZero?: boolean; // Qualiopi IND 10 - Module 0 de mise à niveau
}

interface QCMQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QCMData {
  titre: string;
  questions: QCMQuestion[];
}

// Type d'évaluation par module: QCM ou Atelier
type ModuleEvaluationType = "qcm" | "atelier";

interface AtelierData {
  titre: string;
  description: string;
  objectifs: string[];
  instructions: string[];
  exemplesRendu?: string[];
  dureeEstimee: string;
  critereEvaluation: string[];
}

interface EvaluationData {
  titre: string;
  description: string;
  questions: Array<{
    question: string;
    type: "qcm" | "ouvert" | "vrai_faux";
    options?: string[];
    correctAnswer?: number | string;
  }>;
}

// Type pour le document de corrélation Qualiopi IND 11
interface CorrelationQuestion {
  numero: number;
  question: string;
  type?: string;
}

interface CorrelationItem {
  objectif: string;
  questionsAssociees: CorrelationQuestion[];
  critereValidation: string;
  couverture: "complete" | "partielle" | "non_couverte";
}

interface QuestionProposee {
  question: string;
  type: string;
  options?: string[];
  reponseCorrecte?: number;
}

interface ObjectifNonCouvert {
  objectif: string;
  questionProposee: QuestionProposee;
}

interface CorrelationSynthese {
  totalObjectifs: number;
  objectifsCouverts: number;
  tauxCouverture: string;
  recommandations?: string[];
}

export interface CorrelationData {
  titre: string;
  formation: {
    titre: string;
    dateGeneration: string;
  };
  correlations: CorrelationItem[];
  objectifsNonCouverts?: ObjectifNonCouvert[];
  synthese: CorrelationSynthese;
}

// Type pour les données d'évaluations sauvegardées
export interface EvaluationsDataSaved {
  positionnement: EvaluationData | null;
  evaluationFinale: EvaluationData | null;
  qcmByModule: Record<string, QCMData | null>;
  atelierByModule: Record<string, AtelierData | null>;
  evaluationTypeByModule: Record<string, ModuleEvaluationType>;
  correlationDocument: CorrelationData | null; // Qualiopi IND 11
}

// Interface pour les données de l'organisation (Correction 358 - en-tête/pied de page PDF)
interface OrganisationData {
  nom: string;
  siret: string;
  nda: string; // Numéro de Déclaration d'Activité
  adresse: string;
  codePostal: string;
  ville: string;
  prefectureRegion: string; // Région d'enregistrement du NDA
  logoUrl?: string | null;
}

interface StepEvaluationsProps {
  modules: Module[];
  formationTitre?: string;
  formationObjectifs?: string[];
  // Données initiales (pour la persistance)
  initialData?: EvaluationsDataSaved;
  // Callback pour sauvegarder les changements
  onDataChange?: (data: EvaluationsDataSaved) => void;
  onNext: () => void;
  onPrevious: () => void;
  onGeneratePositionnement?: () => void;
  onGenerateEvaluationFinale?: () => void;
  onGenerateQCM?: (moduleId: string) => void;
  // Données de l'organisme pour l'en-tête et pied de page PDF (Correction 358)
  organisationData?: OrganisationData;
}

// Icons
const SparklesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L13.4302 8.31181C13.6047 8.92648 14.0735 9.39526 14.6882 9.56983L20 11L14.6882 12.4302C14.0735 12.6047 13.6047 13.0735 13.4302 13.6882L12 19L10.5698 13.6882C10.3953 13.0735 9.92648 12.6047 9.31181 12.4302L4 11L9.31181 9.56983C9.92648 9.39526 10.3953 8.92648 10.5698 8.31181L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 4V10H7M23 20V14H17M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
  </svg>
);

const FileIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="10" y1="9" x2="8" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronDownIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
  >
    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12.75V14.25C3 15.0784 3.67157 15.75 4.5 15.75H13.5C14.3284 15.75 15 15.0784 15 14.25V12.75M9 11.25V2.25M9 11.25L6 8.25M9 11.25L12 8.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Composant Question QCM cliquable
interface QCMQuestionItemProps {
  question: QCMQuestion;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const QCMQuestionItem: React.FC<QCMQuestionItemProps> = ({
  question,
  index,
  isExpanded,
  onToggle,
}) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header cliquable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
      >
        <div className="flex items-start gap-3 flex-1">
          <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-sm font-bold">
            {index + 1}
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-2">
            {question.question}
          </span>
        </div>
        <ChevronDownIcon isOpen={isExpanded} />
      </button>

      {/* Contenu expandable */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            {question.options.map((option, optIndex) => (
              <div
                key={optIndex}
                className={`flex items-start gap-2 p-2 rounded-lg ${
                  optIndex === question.correctAnswer
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-white dark:bg-gray-800'
                }`}
              >
                <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs font-medium ${
                  optIndex === question.correctAnswer
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {String.fromCharCode(65 + optIndex)}
                </span>
                <span className={`text-sm ${
                  optIndex === question.correctAnswer
                    ? 'text-green-700 dark:text-green-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {option}
                </span>
                {optIndex === question.correctAnswer && (
                  <span className="ml-auto text-green-500">
                    <CheckCircleIcon />
                  </span>
                )}
              </div>
            ))}
          </div>
          {question.explanation && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Explication:</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">{question.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Icon pour les réponses
const AnswersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Composant apercu miniature d'evaluation
interface EvaluationPreviewProps {
  title: string;
  data: EvaluationData | null;
  isGenerating: boolean;
  onGenerate: () => void;
  onRegenerate: () => void;
  onViewAll: () => void;
  onDownload: () => void;
  onDownloadAnswers?: () => void;
  // Correction 326 & 327: Personnalisation des info-bulles
  downloadLabel?: string;
  downloadAnswersLabel?: string;
}

const EvaluationPreview: React.FC<EvaluationPreviewProps> = ({
  title,
  data,
  isGenerating,
  onGenerate,
  onRegenerate,
  onViewAll,
  onDownload,
  onDownloadAnswers,
  downloadLabel = "Télécharger le test",
  downloadAnswersLabel = "Télécharger le test corrigé",
}) => {
  if (isGenerating) {
    return (
      <div className="h-48 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
        <SpinnerIcon />
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Génération en cours...</p>
      </div>
    );
  }

  if (data) {
    return (
      <div className="relative group">
        {/* Apercu miniature style document */}
        <div className="h-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={onViewAll}>
          {/* Header du document */}
          <div className="px-3 py-2 bg-gradient-to-r from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <CheckCircleIcon />
              <span className="text-xs font-medium text-brand-600 dark:text-brand-400 truncate">
                {data.titre}
              </span>
            </div>
          </div>
          {/* Contenu apercu */}
          <div className="p-3 space-y-2 overflow-hidden">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2">
              {data.description}
            </p>
            <div className="space-y-1">
              {data.questions.slice(0, 3).map((q, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-[10px] font-medium text-gray-400 w-4 flex-shrink-0">
                    {i + 1}.
                  </span>
                  <p className="text-[10px] text-gray-600 dark:text-gray-300 line-clamp-1">
                    {q.question}
                  </p>
                </div>
              ))}
              {data.questions.length > 3 && (
                <p className="text-[10px] text-gray-400 italic">
                  +{data.questions.length - 3} autres questions...
                </p>
              )}
            </div>
          </div>
        </div>
        {/* Boutons d'action */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onViewAll(); }}
            className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 text-brand-600 dark:text-brand-400"
            title="Visualiser"
          >
            <EyeIcon />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 text-green-600 dark:text-green-400"
            title={downloadLabel}
          >
            <DownloadIcon />
          </button>
          {onDownloadAnswers && (
            <button
              onClick={(e) => { e.stopPropagation(); onDownloadAnswers(); }}
              className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400"
              title={downloadAnswersLabel}
            >
              <AnswersIcon />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
            className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            title="Actualiser"
          >
            <RefreshIcon />
          </button>
        </div>
        {/* Indicateur clic pour voir */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
          Cliquez pour voir toutes les questions
        </div>
      </div>
    );
  }

  // Etat vide - bouton generer
  return (
    <button
      onClick={onGenerate}
      className="h-48 w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 transition-all group"
    >
      <div className="text-gray-400 dark:text-gray-500 group-hover:text-brand-500 transition-colors">
        <FileIcon />
      </div>
      <span className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-brand-600 dark:group-hover:text-brand-400">
        Générer {title}
      </span>
      <span className="mt-1 flex items-center gap-1 text-xs text-gray-400 group-hover:text-brand-500">
        <SparklesIcon />
        Cliquez pour générer
      </span>
    </button>
  );
};

// Modal pour afficher toutes les questions
interface EvaluationModalProps {
  data: EvaluationData;
  onClose: () => void;
  onDownload: () => void;
}

const EvaluationModal: React.FC<EvaluationModalProps> = ({ data, onClose, onDownload }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-gradient-to-r from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.titre}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {data.questions.length} questions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors dark:bg-green-900/20 dark:text-green-400"
            >
              <DownloadIcon />
              Télécharger
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {data.description}
          </p>

          <div className="space-y-4">
            {data.questions.map((q, i) => (
              <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3 mb-3">
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-sm font-bold">
                    {i + 1}
                  </span>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {q.question}
                  </p>
                </div>

                {q.options && q.options.length > 0 && (
                  <div className="ml-11 space-y-2">
                    {q.options.map((option, optIdx) => (
                      <div
                        key={optIdx}
                        className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                      >
                        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {option}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {q.type === "vrai_faux" && !q.options && (
                  <div className="ml-11 flex gap-2">
                    <span className="px-3 py-1 rounded-lg text-sm bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      Vrai
                    </span>
                    <span className="px-3 py-1 rounded-lg text-sm bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      Faux
                    </span>
                  </div>
                )}

                {q.type === "ouvert" && !q.options && (
                  <div className="ml-11 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Zone de réponse libre</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper pour mapper les données d'évaluation avec correctAnswer et corriger les accents
// Certaines données anciennes peuvent avoir reponseCorrecte au lieu de correctAnswer
// et des titres sans accents
const mapEvaluationData = (data: EvaluationData | null): EvaluationData | null => {
  if (!data) return null;

  // Corriger les titres sans accents (données anciennes)
  let titre = data.titre;
  let description = data.description;

  // Corriger "Evaluation" → "Évaluation" dans le titre et la description
  if (titre.includes("Evaluation") && !titre.includes("Évaluation")) {
    titre = titre.replace(/Evaluation/g, "Évaluation");
  }
  if (description.includes("Evaluation") && !description.includes("Évaluation")) {
    description = description.replace(/Evaluation/g, "Évaluation");
  }

  return {
    ...data,
    titre,
    description,
    questions: data.questions.map((q) => ({
      ...q,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      correctAnswer: q.correctAnswer ?? (q as any).reponseCorrecte,
    })),
  };
};

// Helper pour mapper les données QCM avec correctAnswer
// Certaines données anciennes peuvent avoir reponseCorrecte au lieu de correctAnswer
const mapQcmData = (qcmByModule: Record<string, QCMData | null>): Record<string, QCMData | null> => {
  const mapped: Record<string, QCMData | null> = {};
  for (const [moduleId, qcm] of Object.entries(qcmByModule)) {
    if (!qcm) {
      mapped[moduleId] = null;
      continue;
    }
    mapped[moduleId] = {
      ...qcm,
      questions: qcm.questions.map((q) => ({
        ...q,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        correctAnswer: q.correctAnswer ?? (q as any).reponseCorrecte,
      })),
    };
  }
  return mapped;
};

export const StepEvaluations: React.FC<StepEvaluationsProps> = ({
  modules,
  formationTitre = "Formation",
  formationObjectifs = [],
  initialData,
  onDataChange,
  onNext,
  onPrevious,
  organisationData,
}) => {
  // Etats pour les evaluations generees - initialisés avec les données sauvegardées si disponibles
  // On applique le mapping pour les données anciennes qui peuvent avoir reponseCorrecte au lieu de correctAnswer
  const [positionnement, setPositionnement] = useState<EvaluationData | null>(mapEvaluationData(initialData?.positionnement || null));
  const [evaluationFinale, setEvaluationFinale] = useState<EvaluationData | null>(mapEvaluationData(initialData?.evaluationFinale || null));
  const [qcmByModule, setQcmByModule] = useState<Record<string, QCMData | null>>(mapQcmData(initialData?.qcmByModule || {}));
  const [atelierByModule, setAtelierByModule] = useState<Record<string, AtelierData | null>>(initialData?.atelierByModule || {});
  const [evaluationTypeByModule, setEvaluationTypeByModule] = useState<Record<string, ModuleEvaluationType>>(initialData?.evaluationTypeByModule || {});
  const [correlationDocument, setCorrelationDocument] = useState<CorrelationData | null>(initialData?.correlationDocument || null);

  // Notifier le parent quand les données changent
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        positionnement,
        evaluationFinale,
        qcmByModule,
        atelierByModule,
        evaluationTypeByModule,
        correlationDocument,
      });
    }
  }, [positionnement, evaluationFinale, qcmByModule, atelierByModule, evaluationTypeByModule, correlationDocument, onDataChange]);

  // Etats de chargement
  const [generatingPositionnement, setGeneratingPositionnement] = useState(false);
  const [generatingEvaluation, setGeneratingEvaluation] = useState(false);
  const [generatingQCM, setGeneratingQCM] = useState<Record<string, boolean>>({});
  const [generatingAtelier, setGeneratingAtelier] = useState<Record<string, boolean>>({});
  const [generatingAllEvaluations, setGeneratingAllEvaluations] = useState(false);
  const [generatingCorrelation, setGeneratingCorrelation] = useState(false);

  // Etat pour les questions QCM expandees (moduleId -> questionIndex[])
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, number[]>>({});

  // Etats pour les modals de visualisation
  const [viewingPositionnement, setViewingPositionnement] = useState(false);
  const [viewingEvaluation, setViewingEvaluation] = useState(false);
  const [viewingCorrelation, setViewingCorrelation] = useState(false);

  // Helper pour générer l'en-tête et le pied de page PDF (Correction 358)
  const getPdfHeaderFooter = useCallback(() => {
    const dateGeneration = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const headerHtml = organisationData?.logoUrl ? `
      <div class="pdf-header">
        <img src="${organisationData.logoUrl}" alt="Logo" class="logo" />
      </div>
    ` : '';

    const footerHtml = organisationData ? `
      <div class="pdf-footer">
        <div class="footer-content">
          <strong>${organisationData.nom || ''}</strong> | ${organisationData.adresse || ''}, ${organisationData.codePostal || ''} ${organisationData.ville || ''}
        </div>
        <div class="footer-details">
          ${organisationData.siret ? `Numéro SIRET : ${organisationData.siret}` : ''}
          ${organisationData.nda ? ` | Numéro de déclaration d'activité : ${organisationData.nda}${organisationData.prefectureRegion ? ` (auprès de la région ${organisationData.prefectureRegion})` : ''}` : ''}
        </div>
        <div class="footer-date">Document généré le ${dateGeneration}</div>
      </div>
    ` : '';

    const headerFooterStyles = `
      .pdf-header {
        text-align: center;
        padding-bottom: 20px;
        margin-bottom: 20px;
        border-bottom: 1px solid #e2e8f0;
      }
      .pdf-header .logo {
        max-height: 60px;
        max-width: 200px;
        object-fit: contain;
      }
      .pdf-footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
        font-size: 11px;
        color: #64748b;
        text-align: center;
      }
      .pdf-footer .footer-content {
        margin-bottom: 5px;
      }
      .pdf-footer .footer-details {
        margin-bottom: 5px;
        font-size: 10px;
      }
      .pdf-footer .footer-date {
        font-size: 10px;
        font-style: italic;
        color: #94a3b8;
      }
      @media print {
        .pdf-footer {
          position: fixed;
          bottom: 20px;
          left: 0;
          right: 0;
        }
        body {
          padding-bottom: 100px;
        }
      }
    `;

    return { headerHtml, footerHtml, headerFooterStyles };
  }, [organisationData]);

  // Fonction pour telecharger une evaluation en PDF (VERSION NON CORRIGÉE - sans les bonnes réponses)
  const handleDownloadEvaluation = useCallback((evaluation: EvaluationData) => {
    const { headerHtml, footerHtml, headerFooterStyles } = getPdfHeaderFooter();

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${evaluation.titre}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
          }
          h1 { color: #1a1a2e; font-size: 24px; margin-bottom: 10px; border-bottom: 3px solid #6366f1; padding-bottom: 10px; }
          .description { color: #64748b; margin-bottom: 30px; font-size: 14px; }
          .question-block { margin-bottom: 25px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #6366f1; }
          .question-number { display: inline-block; width: 28px; height: 28px; background: #6366f1; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold; margin-right: 10px; font-size: 14px; }
          .question-text { font-weight: 600; color: #1e293b; display: inline; }
          .options { margin-top: 15px; padding-left: 40px; }
          .option { margin-bottom: 8px; padding: 8px 12px; background: white; border-radius: 6px; border: 1px solid #e2e8f0; }
          .option-letter { display: inline-block; width: 22px; height: 22px; background: #e2e8f0; color: #64748b; border-radius: 50%; text-align: center; line-height: 22px; font-size: 12px; font-weight: 600; margin-right: 8px; }
          .checkbox { display: inline-block; width: 16px; height: 16px; border: 2px solid #cbd5e1; border-radius: 3px; margin-right: 10px; vertical-align: middle; }
          .response-area { margin-top: 15px; padding: 15px; border: 1px dashed #cbd5e1; border-radius: 6px; min-height: 60px; background: #fafafa; }
          .response-label { font-size: 11px; color: #94a3b8; margin-bottom: 5px; }
          ${headerFooterStyles}
          @media print {
            body { padding: 20px; }
            .question-block { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${headerHtml}
        <h1>${evaluation.titre}</h1>
        <p class="description">${evaluation.description}</p>

        ${evaluation.questions.map((q, i) => `
          <div class="question-block">
            <span class="question-number">${i + 1}</span>
            <span class="question-text">${q.question}</span>
            ${q.options && q.options.length > 0 ? `
              <div class="options">
                ${q.options.map((opt, idx) => `
                  <div class="option">
                    <span class="checkbox"></span>
                    <span class="option-letter">${String.fromCharCode(65 + idx)}</span>
                    ${opt}
                  </div>
                `).join('')}
              </div>
            ` : q.type === 'vrai_faux' ? `
              <div class="options">
                <div class="option"><span class="checkbox"></span> Vrai</div>
                <div class="option"><span class="checkbox"></span> Faux</div>
              </div>
            ` : `
              <div class="response-area">
                <div class="response-label">Réponse :</div>
              </div>
            `}
          </div>
        `).join('')}
        ${footerHtml}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    } else {
      alert("Veuillez autoriser les popups pour télécharger le PDF");
    }
  }, [getPdfHeaderFooter]);

  // Fonction pour telecharger les reponses d'une evaluation (meme format que le test)
  const handleDownloadAnswers = useCallback((evaluation: EvaluationData) => {
    const { headerHtml, footerHtml, headerFooterStyles } = getPdfHeaderFooter();

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${evaluation.titre} - Corrige</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
          }
          h1 { color: #1a1a2e; font-size: 24px; margin-bottom: 10px; border-bottom: 3px solid #22c55e; padding-bottom: 10px; }
          .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 10px; }
          .description { color: #64748b; margin-bottom: 30px; font-size: 14px; }
          .question-block { margin-bottom: 25px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #22c55e; }
          .question-number { display: inline-block; width: 28px; height: 28px; background: #22c55e; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold; margin-right: 10px; font-size: 14px; }
          .question-text { font-weight: 600; color: #1e293b; display: inline; }
          .answer-section { margin-top: 15px; padding: 12px; background: #dcfce7; border-radius: 8px; border: 1px solid #86efac; }
          .answer-label { font-weight: 600; color: #166534; font-size: 12px; margin-bottom: 5px; }
          .answer-text { color: #15803d; font-size: 14px; }
          .options { margin-top: 15px; padding-left: 40px; }
          .option { margin-bottom: 8px; padding: 8px 12px; background: white; border-radius: 6px; border: 1px solid #e2e8f0; }
          .option-letter { display: inline-block; width: 22px; height: 22px; background: #e2e8f0; color: #64748b; border-radius: 50%; text-align: center; line-height: 22px; font-size: 12px; font-weight: 600; margin-right: 8px; }
          ${headerFooterStyles}
          @media print {
            body { padding: 20px; }
            .question-block { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${headerHtml}
        <h1>${evaluation.titre}<span class="badge">CORRIGÉ</span></h1>
        <p class="description">${evaluation.description}</p>

        ${evaluation.questions.map((q, i) => `
          <div class="question-block">
            <span class="question-number">${i + 1}</span>
            <span class="question-text">${q.question}</span>
            ${q.options ? `
              <div class="options">
                ${q.options.map((opt, idx) => `
                  <div class="option">
                    <span class="option-letter">${String.fromCharCode(65 + idx)}</span>
                    ${opt}
                  </div>
                `).join('')}
              </div>
            ` : ''}
            <div class="answer-section">
              <div class="answer-label">BONNE RÉPONSE :</div>
              <div class="answer-text">
                ${q.options && typeof q.correctAnswer === 'number'
                  ? `${String.fromCharCode(65 + q.correctAnswer)} - ${q.options[q.correctAnswer]}`
                  : q.correctAnswer || 'Non spécifié'
                }
              </div>
            </div>
          </div>
        `).join('')}
        ${footerHtml}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    } else {
      alert("Veuillez autoriser les popups pour télécharger le PDF");
    }
  }, [getPdfHeaderFooter]);

  // Toggle une question QCM
  const toggleQuestion = useCallback((moduleId: string, questionIndex: number) => {
    setExpandedQuestions(prev => {
      const current = prev[moduleId] || [];
      if (current.includes(questionIndex)) {
        return { ...prev, [moduleId]: current.filter(i => i !== questionIndex) };
      } else {
        return { ...prev, [moduleId]: [...current, questionIndex] };
      }
    });
  }, []);

  // Generer le test de positionnement
  const handleGeneratePositionnement = useCallback(async () => {
    setGeneratingPositionnement(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      // Ajouter un timestamp pour forcer une nouvelle génération (éviter cache + varier les questions)
      const regenerateToken = Date.now().toString();

      const response = await fetch("/api/ai/generate-positionnement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
        body: JSON.stringify({
          formationTitre,
          objectifs: formationObjectifs,
          modules: modules.map(m => ({ titre: m.titre, contenu: m.contenu })),
          regenerate: regenerateToken, // Force nouvelle génération avec questions différentes
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        // Mapper reponseCorrecte vers correctAnswer pour compatibilité
        const mappedQuestions = (data.data.questions || []).map((q: {
          question: string;
          options?: string[];
          reponseCorrecte?: number;
          correctAnswer?: number;
          type?: string;
          explication?: string;
        }) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer ?? q.reponseCorrecte,
          type: q.type || "qcm",
          explication: q.explication,
        }));
        setPositionnement({
          titre: "Test de positionnement",
          description: `Évaluation pré-formation pour ${formationTitre}`,
          questions: mappedQuestions,
        });
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Erreur generation positionnement:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      if (errorMessage.includes("abort")) {
        alert("Timeout: La génération a pris trop de temps. Réessayez.");
      } else {
        alert(`Erreur lors de la génération: ${errorMessage}`);
      }
    } finally {
      setGeneratingPositionnement(false);
    }
  }, [formationTitre, formationObjectifs, modules]);

  // Generer l'evaluation finale
  // Correction 359: L'évaluation finale utilise les questions du positionnement pour créer des questions "miroir"
  const handleGenerateEvaluation = useCallback(async () => {
    setGeneratingEvaluation(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      // Ajouter un timestamp pour forcer une nouvelle génération (éviter cache + varier les questions)
      const regenerateToken = Date.now().toString();

      // Correction 359: Préparer les questions du positionnement pour les questions miroir
      const positionnementQuestions = positionnement?.questions?.map(q => ({
        question: q.question,
        competenceEvaluee: (q as { competenceEvaluee?: string }).competenceEvaluee,
      })) || [];

      const response = await fetch("/api/ai/generate-evaluation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
        body: JSON.stringify({
          formationTitre,
          objectifs: formationObjectifs,
          modules: modules.map(m => ({ titre: m.titre, contenu: m.contenu })),
          regenerate: regenerateToken, // Force nouvelle génération avec questions différentes
          positionnementQuestions, // Correction 359: Questions du positionnement pour générer des questions miroir
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        // Mapper reponseCorrecte vers correctAnswer pour compatibilité
        const mappedQuestions = (data.data.questions || []).map((q: {
          question: string;
          options?: string[];
          reponseCorrecte?: number;
          correctAnswer?: number;
          type?: string;
          explication?: string;
        }) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer ?? q.reponseCorrecte,
          type: q.type || "qcm",
          explication: q.explication,
        }));
        setEvaluationFinale({
          titre: "Évaluation finale",
          description: `Évaluation des acquis pour ${formationTitre}`,
          questions: mappedQuestions,
        });
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Erreur generation evaluation:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      if (errorMessage.includes("abort")) {
        alert("Timeout: La génération a pris trop de temps. Réessayez.");
      } else {
        alert(`Erreur lors de la génération: ${errorMessage}`);
      }
    } finally {
      setGeneratingEvaluation(false);
    }
  }, [formationTitre, formationObjectifs, modules, positionnement]);

  // Generer un QCM pour un module
  const handleGenerateQCM = useCallback(async (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    setGeneratingQCM(prev => ({ ...prev, [moduleId]: true }));
    try {
      // Utiliser AbortController pour timeout (Safari peut avoir des problemes de timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout

      const response = await fetch("/api/ai/generate-qcm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache", // Eviter le cache Safari
        },
        body: JSON.stringify({
          moduleTitre: module.titre,
          moduleContenu: module.contenu,
          objectifs: formationObjectifs,
          nombreQuestions: 8, // ~8 questions par module
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        // Mapper reponseCorrecte vers correctAnswer pour compatibilité
        const mappedQuestions = (data.data.questions || []).map((q: {
          question: string;
          options: string[];
          reponseCorrecte?: number;
          correctAnswer?: number;
          explication?: string;
        }) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer ?? q.reponseCorrecte,
          explanation: q.explication,
        }));
        setQcmByModule(prev => ({
          ...prev,
          [moduleId]: {
            titre: `QCM - ${module.titre}`,
            questions: mappedQuestions,
          },
        }));
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Erreur generation QCM:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      if (errorMessage.includes("abort")) {
        alert(`Timeout: La génération du QCM a pris trop de temps. Réessayez.`);
      } else {
        alert(`Erreur lors de la génération du QCM: ${errorMessage}`);
      }
    } finally {
      setGeneratingQCM(prev => ({ ...prev, [moduleId]: false }));
    }
  }, [modules, formationObjectifs]);

  // Generer un atelier pour un module
  const handleGenerateAtelier = useCallback(async (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    setGeneratingAtelier(prev => ({ ...prev, [moduleId]: true }));
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const response = await fetch("/api/ai/generate-atelier", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          moduleTitre: module.titre,
          moduleContenu: module.contenu,
          formationTitre,
          objectifs: formationObjectifs,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        setAtelierByModule(prev => ({
          ...prev,
          [moduleId]: {
            titre: `Atelier - ${module.titre}`,
            description: data.data.description || "",
            objectifs: data.data.objectifs || [],
            instructions: data.data.instructions || [],
            exemplesRendu: data.data.exemplesRendu || [],
            dureeEstimee: data.data.dureeEstimee || "30 minutes",
            critereEvaluation: data.data.critereEvaluation || [],
          },
        }));
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Erreur generation atelier:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      if (errorMessage.includes("abort")) {
        alert(`Timeout: La génération de l'atelier a pris trop de temps. Réessayez.`);
      } else {
        alert(`Erreur lors de la génération de l'atelier: ${errorMessage}`);
      }
    } finally {
      setGeneratingAtelier(prev => ({ ...prev, [moduleId]: false }));
    }
  }, [modules, formationTitre, formationObjectifs]);

  // Changer le type d'évaluation pour un module
  const handleChangeEvaluationType = useCallback((moduleId: string, type: ModuleEvaluationType) => {
    setEvaluationTypeByModule(prev => ({ ...prev, [moduleId]: type }));
  }, []);

  // Generer toutes les évaluations (QCM ou Atelier selon le type choisi)
  const handleGenerateAllEvaluations = useCallback(async () => {
    setGeneratingAllEvaluations(true);
    for (const module of modules) {
      const evalType = evaluationTypeByModule[module.id] || "qcm";
      if (evalType === "qcm" && !qcmByModule[module.id]) {
        await handleGenerateQCM(module.id);
      } else if (evalType === "atelier" && !atelierByModule[module.id]) {
        await handleGenerateAtelier(module.id);
      }
    }
    setGeneratingAllEvaluations(false);
  }, [modules, evaluationTypeByModule, qcmByModule, atelierByModule, handleGenerateQCM, handleGenerateAtelier]);

  // Generer le document de corrélation Objectifs/Évaluation (Qualiopi IND 11)
  const handleGenerateCorrelation = useCallback(async () => {
    if (!evaluationFinale) {
      alert("Veuillez d'abord générer l'évaluation finale avant de créer le document de corrélation.");
      return;
    }
    if (formationObjectifs.length === 0) {
      alert("Aucun objectif pédagogique défini. Le document de corrélation nécessite des objectifs.");
      return;
    }

    setGeneratingCorrelation(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes timeout

      const response = await fetch("/api/ai/generate-correlation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          formationTitre,
          objectifs: formationObjectifs,
          evaluationFinale: {
            titre: evaluationFinale.titre,
            questions: evaluationFinale.questions.map((q) => ({
              question: q.question,
              type: q.type,
              options: q.options,
              correctAnswer: q.correctAnswer,
            })),
          },
          modules: modules.map((m) => ({
            titre: m.titre,
            contenu: m.contenu,
          })),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        setCorrelationDocument(data.data as CorrelationData);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Erreur génération corrélation:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      if (errorMessage.includes("abort")) {
        alert("Timeout: La génération a pris trop de temps. Réessayez.");
      } else {
        alert(`Erreur lors de la génération: ${errorMessage}`);
      }
    } finally {
      setGeneratingCorrelation(false);
    }
  }, [evaluationFinale, formationObjectifs, formationTitre, modules]);

  // Telecharger le document de corrélation en PDF
  const handleDownloadCorrelation = useCallback(() => {
    if (!correlationDocument) return;

    const { headerHtml, footerHtml, headerFooterStyles } = getPdfHeaderFooter();

    const getCouvertureBadge = (couverture: string) => {
      switch (couverture) {
        case "complete":
          return '<span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 11px;">Complète</span>';
        case "partielle":
          return '<span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 11px;">Partielle</span>';
        case "non_couverte":
          return '<span style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 12px; font-size: 11px;">Non couverte</span>';
        default:
          return '';
      }
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${correlationDocument.titre}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px;
          }
          .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #10b981; }
          .header h1 { color: #1a1a2e; font-size: 24px; margin-bottom: 10px; }
          .header .qualiopi-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          .header .meta { color: #64748b; font-size: 13px; margin-top: 15px; }
          .synthese { background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 1px solid #86efac; padding: 25px; border-radius: 12px; margin-bottom: 30px; }
          .synthese h2 { color: #166534; font-size: 18px; margin-bottom: 15px; }
          .synthese-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
          .synthese-item { text-align: center; padding: 15px; background: white; border-radius: 8px; }
          .synthese-item .value { font-size: 28px; font-weight: bold; color: #166534; }
          .synthese-item .label { font-size: 12px; color: #64748b; margin-top: 5px; }
          .correlations { margin-bottom: 30px; }
          .correlations h2 { color: #1e293b; font-size: 18px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
          .correlation-item { margin-bottom: 20px; padding: 20px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #10b981; }
          .objectif { font-weight: 600; color: #1e293b; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start; }
          .questions-list { margin: 10px 0 10px 20px; }
          .questions-list li { font-size: 13px; color: #475569; margin-bottom: 5px; }
          .critere { background: #eff6ff; padding: 10px 15px; border-radius: 6px; margin-top: 10px; }
          .critere-label { font-size: 11px; color: #3b82f6; font-weight: 600; text-transform: uppercase; }
          .critere-text { font-size: 13px; color: #1e40af; margin-top: 5px; }
          .non-couverts { background: #fff7ed; border: 1px solid #fed7aa; padding: 25px; border-radius: 12px; margin-bottom: 30px; }
          .non-couverts h2 { color: #c2410c; font-size: 18px; margin-bottom: 15px; }
          .proposition { background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #f97316; }
          .recommandations { background: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 12px; }
          .recommandations h3 { color: #0369a1; font-size: 16px; margin-bottom: 15px; }
          .recommandations ul { margin: 0; padding-left: 20px; }
          .recommandations li { font-size: 13px; color: #0c4a6e; margin-bottom: 8px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; }
          .footer p { font-size: 11px; color: #94a3b8; }
          ${headerFooterStyles}
          @media print {
            body { padding: 20px; }
            .correlation-item { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${headerHtml}
        <div class="header">
          <span class="qualiopi-badge">Qualiopi - Indicateur 11</span>
          <h1>${correlationDocument.titre}</h1>
          <p class="meta">
            Formation : <strong>${correlationDocument.formation.titre}</strong><br/>
            Document généré le : ${correlationDocument.formation.dateGeneration}
          </p>
        </div>

        <div class="synthese">
          <h2>Synthèse de la corrélation</h2>
          <div class="synthese-grid">
            <div class="synthese-item">
              <div class="value">${correlationDocument.synthese.totalObjectifs}</div>
              <div class="label">Objectifs pédagogiques</div>
            </div>
            <div class="synthese-item">
              <div class="value">${correlationDocument.synthese.objectifsCouverts}</div>
              <div class="label">Objectifs couverts</div>
            </div>
            <div class="synthese-item">
              <div class="value">${correlationDocument.synthese.tauxCouverture}</div>
              <div class="label">Taux de couverture</div>
            </div>
          </div>
        </div>

        <div class="correlations">
          <h2>Détail des corrélations</h2>
          ${correlationDocument.correlations.map((item, i) => `
            <div class="correlation-item">
              <div class="objectif">
                <span><strong>Objectif ${i + 1}:</strong> ${item.objectif}</span>
                ${getCouvertureBadge(item.couverture)}
              </div>
              ${item.questionsAssociees.length > 0 ? `
                <p style="font-size: 12px; color: #64748b; margin: 10px 0 5px 0;">Questions de l'évaluation associées :</p>
                <ul class="questions-list">
                  ${item.questionsAssociees.map(q => `
                    <li><strong>Q${q.numero}</strong> [${q.type || 'qcm'}] : ${q.question}</li>
                  `).join('')}
                </ul>
              ` : '<p style="font-size: 13px; color: #dc2626; margin: 10px 0;">Aucune question associée</p>'}
              <div class="critere">
                <div class="critere-label">Critère de validation</div>
                <div class="critere-text">${item.critereValidation}</div>
              </div>
            </div>
          `).join('')}
        </div>

        ${correlationDocument.objectifsNonCouverts && correlationDocument.objectifsNonCouverts.length > 0 ? `
          <div class="non-couverts">
            <h2>⚠️ Objectifs non couverts - Questions suggérées</h2>
            ${correlationDocument.objectifsNonCouverts.map(item => `
              <div class="proposition">
                <p style="font-weight: 600; color: #c2410c; margin-bottom: 10px;">Objectif : ${item.objectif}</p>
                <p style="font-size: 13px; color: #475569; margin-bottom: 5px;"><strong>Question suggérée :</strong></p>
                <p style="font-size: 14px; color: #1e293b; margin-bottom: 10px;">${item.questionProposee.question}</p>
                ${item.questionProposee.options ? `
                  <ul style="margin: 0; padding-left: 20px;">
                    ${item.questionProposee.options.map((opt, idx) => `
                      <li style="font-size: 13px; ${idx === item.questionProposee.reponseCorrecte ? 'color: #166534; font-weight: 600;' : 'color: #64748b;'}">${String.fromCharCode(65 + idx)}. ${opt} ${idx === item.questionProposee.reponseCorrecte ? '✓' : ''}</li>
                    `).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${correlationDocument.synthese.recommandations && correlationDocument.synthese.recommandations.length > 0 ? `
          <div class="recommandations">
            <h3>💡 Recommandations</h3>
            <ul>
              ${correlationDocument.synthese.recommandations.map(r => `<li>${r}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div class="footer">
          <p>Document généré conformément aux exigences Qualiopi - Indicateur 11<br/>
          "Le prestataire évalue l'atteinte par les publics bénéficiaires des objectifs de la prestation."</p>
        </div>
        ${footerHtml}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    } else {
      alert("Veuillez autoriser les popups pour télécharger le PDF");
    }
  }, [correlationDocument, getPdfHeaderFooter]);

  // Telecharger un QCM individuel (test vierge sans réponses)
  const handleDownloadQCM = useCallback((module: Module, qcm: QCMData) => {
    const { headerHtml, footerHtml, headerFooterStyles } = getPdfHeaderFooter();

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${qcm.titre}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
          }
          h1 { color: #1a1a2e; font-size: 22px; margin-bottom: 8px; border-bottom: 3px solid #6366f1; padding-bottom: 10px; }
          .module-title { color: #64748b; font-size: 14px; margin-bottom: 20px; }
          .module-content { background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
          .module-content h3 { font-size: 14px; color: #334155; margin-bottom: 10px; }
          .module-content ul { margin: 0; padding-left: 20px; }
          .module-content li { font-size: 13px; color: #475569; margin-bottom: 5px; }
          .question-block { margin-bottom: 25px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #6366f1; }
          .question-number { display: inline-block; width: 28px; height: 28px; background: #6366f1; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold; margin-right: 10px; font-size: 14px; }
          .question-text { font-weight: 600; color: #1e293b; display: inline; }
          .options { margin-top: 15px; padding-left: 40px; }
          .option { margin-bottom: 8px; padding: 8px 12px; background: white; border-radius: 6px; }
          .option-letter { display: inline-block; width: 22px; height: 22px; background: #e2e8f0; color: #64748b; border-radius: 50%; text-align: center; line-height: 22px; font-size: 12px; font-weight: 600; margin-right: 8px; }
          ${headerFooterStyles}
          @media print {
            body { padding: 20px; }
            .question-block { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${headerHtml}
        <h1>${qcm.titre}</h1>
        <p class="module-title">${module.titre}</p>

        <div class="module-content">
          <h3>Contenu du module :</h3>
          <ul>
            ${module.contenu.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>

        ${qcm.questions.map((q, i) => `
          <div class="question-block">
            <span class="question-number">${i + 1}</span>
            <span class="question-text">${q.question}</span>
            <div class="options">
              ${q.options.map((opt, idx) => `
                <div class="option">
                  <span class="option-letter">${String.fromCharCode(65 + idx)}</span>
                  ${opt}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
        ${footerHtml}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    } else {
      alert("Veuillez autoriser les popups pour télécharger le PDF");
    }
  }, [getPdfHeaderFooter]);

  // Telecharger le corrigé d'un QCM individuel (avec bonnes réponses)
  const handleDownloadQCMAnswers = useCallback((module: Module, qcm: QCMData) => {
    const { headerHtml, footerHtml, headerFooterStyles } = getPdfHeaderFooter();

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${qcm.titre} - Corrigé</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
          }
          h1 { color: #1a1a2e; font-size: 22px; margin-bottom: 8px; border-bottom: 3px solid #22c55e; padding-bottom: 10px; }
          .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 10px; }
          .module-title { color: #64748b; font-size: 14px; margin-bottom: 20px; }
          .module-content { background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
          .module-content h3 { font-size: 14px; color: #334155; margin-bottom: 10px; }
          .module-content ul { margin: 0; padding-left: 20px; }
          .module-content li { font-size: 13px; color: #475569; margin-bottom: 5px; }
          .question-block { margin-bottom: 25px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #22c55e; }
          .question-number { display: inline-block; width: 28px; height: 28px; background: #22c55e; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold; margin-right: 10px; font-size: 14px; }
          .question-text { font-weight: 600; color: #1e293b; display: inline; }
          .options { margin-top: 15px; padding-left: 40px; }
          .option { margin-bottom: 8px; padding: 8px 12px; background: white; border-radius: 6px; border: 1px solid #e2e8f0; }
          .option-letter { display: inline-block; width: 22px; height: 22px; background: #e2e8f0; color: #64748b; border-radius: 50%; text-align: center; line-height: 22px; font-size: 12px; font-weight: 600; margin-right: 8px; }
          .answer-section { margin-top: 15px; padding: 12px; background: #dcfce7; border-radius: 8px; border: 1px solid #86efac; }
          .answer-label { font-weight: 600; color: #166534; font-size: 12px; margin-bottom: 5px; }
          .answer-text { color: #15803d; font-size: 14px; }
          .explanation { margin-top: 10px; padding: 10px; background: #eff6ff; border-radius: 6px; font-size: 13px; color: #1e40af; }
          ${headerFooterStyles}
          @media print {
            body { padding: 20px; }
            .question-block { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${headerHtml}
        <h1>${qcm.titre} <span class="badge">CORRIGÉ</span></h1>
        <p class="module-title">${module.titre}</p>

        <div class="module-content">
          <h3>Contenu du module :</h3>
          <ul>
            ${module.contenu.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>

        ${qcm.questions.map((q, i) => `
          <div class="question-block">
            <span class="question-number">${i + 1}</span>
            <span class="question-text">${q.question}</span>
            <div class="options">
              ${q.options.map((opt, idx) => `
                <div class="option">
                  <span class="option-letter">${String.fromCharCode(65 + idx)}</span>
                  ${opt}
                </div>
              `).join('')}
            </div>
            <div class="answer-section">
              <div class="answer-label">BONNE RÉPONSE :</div>
              <div class="answer-text">
                ${typeof q.correctAnswer === 'number' && q.options[q.correctAnswer]
                  ? `${String.fromCharCode(65 + q.correctAnswer)} - ${q.options[q.correctAnswer]}`
                  : 'Non spécifié'
                }
              </div>
            </div>
            ${q.explanation ? `<div class="explanation"><strong>Explication :</strong> ${q.explanation}</div>` : ''}
          </div>
        `).join('')}
        ${footerHtml}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    } else {
      alert("Veuillez autoriser les popups pour télécharger le PDF");
    }
  }, [getPdfHeaderFooter]);

  // Telecharger tous les QCM en un seul document
  const handleDownloadAllQCM = useCallback(() => {
    const modulesWithQCM = modules.filter(m => qcmByModule[m.id]);
    if (modulesWithQCM.length === 0) {
      alert("Aucun QCM genere. Veuillez d'abord generer les QCM.");
      return;
    }

    const { headerHtml, footerHtml, headerFooterStyles } = getPdfHeaderFooter();

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>QCM - ${formationTitre}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
          }
          .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #6366f1; }
          .header h1 { color: #1a1a2e; font-size: 28px; margin-bottom: 10px; }
          .header p { color: #64748b; font-size: 14px; }
          .module-section { margin-bottom: 50px; page-break-before: always; }
          .module-section:first-of-type { page-break-before: avoid; }
          .module-header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 20px; border-radius: 12px; margin-bottom: 25px; }
          .module-header h2 { font-size: 18px; margin-bottom: 8px; }
          .module-header p { font-size: 13px; opacity: 0.9; }
          .module-content { background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
          .module-content h3 { font-size: 14px; color: #334155; margin-bottom: 10px; }
          .module-content ul { margin: 0; padding-left: 20px; }
          .module-content li { font-size: 13px; color: #475569; margin-bottom: 5px; }
          .question-block { margin-bottom: 25px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #6366f1; break-inside: avoid; }
          .question-number { display: inline-block; width: 28px; height: 28px; background: #6366f1; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold; margin-right: 10px; font-size: 14px; }
          .question-text { font-weight: 600; color: #1e293b; display: inline; }
          .options { margin-top: 15px; padding-left: 40px; }
          .option { margin-bottom: 8px; padding: 8px 12px; background: white; border-radius: 6px; }
          .option-letter { display: inline-block; width: 22px; height: 22px; background: #e2e8f0; color: #64748b; border-radius: 50%; text-align: center; line-height: 22px; font-size: 12px; font-weight: 600; margin-right: 8px; }
          .correct { background: #dcfce7; border: 1px solid #86efac; }
          .correct .option-letter { background: #22c55e; color: white; }
          .explanation { margin-top: 10px; padding: 10px; background: #eff6ff; border-radius: 6px; font-size: 13px; color: #1e40af; }
          .summary { background: #f0fdf4; border: 1px solid #86efac; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
          .summary h3 { color: #166534; font-size: 16px; margin-bottom: 10px; }
          .summary ul { margin: 0; padding-left: 20px; }
          .summary li { font-size: 14px; color: #15803d; margin-bottom: 5px; }
          ${headerFooterStyles}
          @media print {
            body { padding: 20px; }
            .question-block { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${headerHtml}
        <div class="header">
          <h1>Questionnaires a Choix Multiples</h1>
          <p>${formationTitre}</p>
        </div>

        <div class="summary">
          <h3>Sommaire des QCM</h3>
          <ul>
            ${modulesWithQCM.map((m, idx) => `
              <li><strong>Module ${idx + 1}</strong> : ${m.titre} (${qcmByModule[m.id]?.questions.length || 0} questions)</li>
            `).join('')}
          </ul>
        </div>

        ${modulesWithQCM.map((module, moduleIdx) => {
          const qcm = qcmByModule[module.id];
          if (!qcm) return '';
          return `
            <div class="module-section">
              <div class="module-header">
                <h2>Module ${moduleIdx + 1} : ${module.titre}</h2>
                <p>${qcm.questions.length} questions</p>
              </div>

              <div class="module-content">
                <h3>Contenu du module :</h3>
                <ul>
                  ${module.contenu.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>

              ${qcm.questions.map((q, qIdx) => `
                <div class="question-block">
                  <span class="question-number">${qIdx + 1}</span>
                  <span class="question-text">${q.question}</span>
                  <div class="options">
                    ${q.options.map((opt, optIdx) => `
                      <div class="option ${q.correctAnswer === optIdx ? 'correct' : ''}">
                        <span class="option-letter">${String.fromCharCode(65 + optIdx)}</span>
                        ${opt}
                      </div>
                    `).join('')}
                  </div>
                  ${q.explanation ? `<div class="explanation"><strong>Explication :</strong> ${q.explanation}</div>` : ''}
                </div>
              `).join('')}
            </div>
          `;
        }).join('')}
        ${footerHtml}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    } else {
      alert("Veuillez autoriser les popups pour télécharger le PDF");
    }
  }, [modules, qcmByModule, formationTitre, getPdfHeaderFooter]);

  // Telecharger un atelier individuel
  const handleDownloadAtelier = useCallback((module: Module, atelier: AtelierData) => {
    const { headerHtml, footerHtml, headerFooterStyles } = getPdfHeaderFooter();

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${atelier.titre}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
          }
          h1 { color: #1a1a2e; font-size: 22px; margin-bottom: 8px; border-bottom: 3px solid #f59e0b; padding-bottom: 10px; }
          .module-title { color: #64748b; font-size: 14px; margin-bottom: 20px; }
          .duree { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
          .description { background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 25px; font-size: 14px; color: #475569; }
          .section { margin-bottom: 25px; }
          .section h3 { font-size: 16px; color: #1e293b; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
          .section ul { margin: 0; padding-left: 20px; }
          .section li { font-size: 14px; color: #475569; margin-bottom: 8px; }
          .objectifs { background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; border-radius: 0 8px 8px 0; }
          .instructions { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 0 8px 8px 0; }
          .criteres { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 0 8px 8px 0; }
          ${headerFooterStyles}
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        ${headerHtml}
        <h1>${atelier.titre}</h1>
        <p class="module-title">${module.titre}</p>
        <span class="duree">${atelier.dureeEstimee}</span>

        <div class="description">
          ${atelier.description}
        </div>

        <div class="section">
          <h3>Objectifs de l'atelier</h3>
          <div class="objectifs">
            <ul>
              ${atelier.objectifs.map(obj => `<li>${obj}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div class="section">
          <h3>Instructions</h3>
          <div class="instructions">
            <ol style="padding-left: 20px; margin: 0;">
              ${atelier.instructions.map(inst => `<li style="margin-bottom: 10px;">${inst}</li>`).join('')}
            </ol>
          </div>
        </div>

        <div class="section">
          <h3>Critères d'évaluation</h3>
          <div class="criteres">
            <ul>
              ${atelier.critereEvaluation.map(crit => `<li>${crit}</li>`).join('')}
            </ul>
          </div>
        </div>
        ${footerHtml}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    } else {
      alert("Veuillez autoriser les popups pour télécharger le PDF");
    }
  }, [getPdfHeaderFooter]);

  // Telecharger un exemple de correction/rendu pour un atelier
  const handleDownloadAtelierCorrection = useCallback((module: Module, atelier: AtelierData) => {
    const { headerHtml, footerHtml, headerFooterStyles } = getPdfHeaderFooter();

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${atelier.titre} - Exemple de rendu</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
          }
          h1 { color: #1a1a2e; font-size: 22px; margin-bottom: 8px; border-bottom: 3px solid #22c55e; padding-bottom: 10px; }
          .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 10px; }
          .module-title { color: #64748b; font-size: 14px; margin-bottom: 20px; }
          .duree { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
          .intro { background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #86efac; }
          .intro-title { font-weight: 600; color: #166534; margin-bottom: 8px; }
          .intro-text { font-size: 14px; color: #15803d; }
          .section { margin-bottom: 25px; }
          .section h3 { font-size: 16px; color: #1e293b; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
          .section ul { margin: 0; padding-left: 20px; }
          .section li { font-size: 14px; color: #475569; margin-bottom: 8px; }
          .objectifs { background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; border-radius: 0 8px 8px 0; }
          .exemple-rendu { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; border-radius: 0 8px 8px 0; }
          .exemple-title { font-weight: 600; color: #166534; font-size: 15px; margin-bottom: 15px; }
          .exemple-step { background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #86efac; }
          .exemple-step-title { font-weight: 600; color: #166534; font-size: 14px; margin-bottom: 10px; }
          .exemple-step-content { font-size: 13px; color: #475569; }
          .evaluation { background: #dcfce7; border: 1px solid #86efac; padding: 15px; border-radius: 8px; margin-top: 25px; }
          .evaluation-title { font-weight: 600; color: #166534; margin-bottom: 10px; }
          .evaluation-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
          .check-icon { color: #22c55e; font-size: 16px; }
          ${headerFooterStyles}
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        ${headerHtml}
        <h1>${atelier.titre} <span class="badge">EXEMPLE DE RENDU</span></h1>
        <p class="module-title">${module.titre}</p>
        <span class="duree">${atelier.dureeEstimee}</span>

        <div class="intro">
          <div class="intro-title">Document destiné au formateur</div>
          <div class="intro-text">
            Ce document présente un exemple de rendu type pour cet atelier. Il peut servir de référence pour évaluer les travaux des apprenants ou comme support de correction collective.
          </div>
        </div>

        <div class="section">
          <h3>Objectifs à atteindre</h3>
          <div class="objectifs">
            <ul>
              ${atelier.objectifs.map(obj => `<li>${obj}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div class="section">
          <h3>Exemple de réalisation étape par étape</h3>
          <div class="exemple-rendu">
            ${atelier.instructions.map((inst, idx) => `
              <div class="exemple-step">
                <div class="exemple-step-title">Étape ${idx + 1}</div>
                <div class="exemple-step-content">
                  <strong>Instruction :</strong> ${inst}<br><br>
                  <strong>Rendu attendu :</strong> ${atelier.exemplesRendu && atelier.exemplesRendu[idx] ? atelier.exemplesRendu[idx] : `L'apprenant doit avoir complété cette étape en appliquant les connaissances acquises dans le module "${module.titre}".`}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="evaluation">
          <div class="evaluation-title">Grille de correction</div>
          ${atelier.critereEvaluation.map(crit => `
            <div class="evaluation-item">
              <span class="check-icon">✓</span>
              <span>${crit}</span>
            </div>
          `).join('')}
        </div>
        ${footerHtml}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    } else {
      alert("Veuillez autoriser les popups pour télécharger le PDF");
    }
  }, [getPdfHeaderFooter]);

  return (
    <div className="space-y-6">
      {/* Test de positionnement et Evaluation finale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test de positionnement */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Test de positionnement
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Mesure le niveau de départ des participants avant la formation.
          </p>
          <EvaluationPreview
            title="le test"
            data={positionnement}
            isGenerating={generatingPositionnement}
            onGenerate={handleGeneratePositionnement}
            onRegenerate={handleGeneratePositionnement}
            onViewAll={() => setViewingPositionnement(true)}
            onDownload={() => positionnement && handleDownloadEvaluation(positionnement)}
            onDownloadAnswers={() => positionnement && handleDownloadAnswers(positionnement)}
            downloadLabel="Télécharger le test"
            downloadAnswersLabel="Télécharger le test corrigé"
          />
        </div>

        {/* Evaluation finale */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Évaluation finale
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Vérifie les acquis des participants en fin de formation.
          </p>
          <EvaluationPreview
            title="l'évaluation"
            data={evaluationFinale}
            isGenerating={generatingEvaluation}
            onGenerate={handleGenerateEvaluation}
            onRegenerate={handleGenerateEvaluation}
            onViewAll={() => setViewingEvaluation(true)}
            onDownload={() => evaluationFinale && handleDownloadEvaluation(evaluationFinale)}
            onDownloadAnswers={() => evaluationFinale && handleDownloadAnswers(evaluationFinale)}
            downloadLabel="Télécharger l'évaluation"
            downloadAnswersLabel="Télécharger l'évaluation corrigée"
          />
        </div>
      </div>

      {/* Document de corrélation Objectifs/Évaluation - Qualiopi IND 11 */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 dark:border-emerald-800 dark:from-emerald-900/20 dark:to-teal-900/20">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-emerald-600 dark:text-emerald-400">
                <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Corrélation Objectifs / Évaluation
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-full">
                  Qualiopi IND 11
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Vérifie que chaque objectif pédagogique est bien couvert dans l&apos;évaluation finale.
              </p>
            </div>
          </div>
        </div>

        {generatingCorrelation ? (
          <div className="h-32 flex flex-col items-center justify-center bg-white/60 dark:bg-gray-800/40 rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-700">
            <SpinnerIcon />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Analyse en cours...</p>
          </div>
        ) : correlationDocument ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-emerald-200 dark:border-emerald-800 overflow-hidden">
            {/* Header du document */}
            <div className="p-4 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 border-b border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Document généré
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewingCorrelation(true)}
                    className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                    title="Voir le détail"
                  >
                    <EyeIcon />
                  </button>
                  <button
                    onClick={handleDownloadCorrelation}
                    className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    title="Télécharger PDF"
                  >
                    <DownloadIcon />
                  </button>
                  <button
                    onClick={handleGenerateCorrelation}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded-lg transition-colors"
                    title="Actualiser"
                  >
                    <RefreshIcon />
                  </button>
                </div>
              </div>
            </div>

            {/* Aperçu synthèse */}
            <div className="p-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {correlationDocument.synthese.totalObjectifs}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Objectifs</div>
                </div>
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {correlationDocument.synthese.objectifsCouverts}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Couverts</div>
                </div>
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {correlationDocument.synthese.tauxCouverture}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Couverture</div>
                </div>
              </div>

              {/* Liste des corrélations (aperçu) */}
              <div className="space-y-2">
                {correlationDocument.correlations.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1 mr-2">
                      {item.objectif}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                      item.couverture === "complete"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : item.couverture === "partielle"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {item.couverture === "complete" ? "Complet" : item.couverture === "partielle" ? "Partiel" : "Non couvert"}
                    </span>
                  </div>
                ))}
                {correlationDocument.correlations.length > 3 && (
                  <p className="text-xs text-gray-400 text-center">
                    +{correlationDocument.correlations.length - 3} autres objectifs...
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={handleGenerateCorrelation}
            disabled={!evaluationFinale || formationObjectifs.length === 0}
            className="w-full h-32 flex flex-col items-center justify-center bg-white/60 dark:bg-gray-800/40 rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-emerald-400 dark:text-emerald-500 group-hover:text-emerald-500 transition-colors">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              Générer le document de corrélation
            </span>
            {!evaluationFinale && (
              <span className="mt-1 text-xs text-orange-500">
                Générez d&apos;abord l&apos;évaluation finale
              </span>
            )}
            {evaluationFinale && formationObjectifs.length === 0 && (
              <span className="mt-1 text-xs text-orange-500">
                Aucun objectif pédagogique défini
              </span>
            )}
          </button>
        )}
      </div>

      {/* Évaluations par module (QCM ou Atelier) */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Évaluations par module
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sélectionnez un QCM ou un atelier pour valider les acquis de chaque module.
          </p>
        </div>

        <div className="space-y-6">
          {modules.map((module) => {
            const evalType = evaluationTypeByModule[module.id] || "qcm";
            const qcm = qcmByModule[module.id];
            const atelier = atelierByModule[module.id];
            const isGeneratingQCM = generatingQCM[module.id] || false;
            const isGeneratingAtelier = generatingAtelier[module.id] || false;
            const hasGenerated = evalType === "qcm" ? !!qcm : !!atelier;

            return (
              <div key={module.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0">
                {/* Header du module avec choix du type */}
                <div className="flex flex-col gap-4 mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                      {module.titre}
                    </h4>

                    {/* Sélecteur QCM / Atelier */}
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                      <button
                        onClick={() => handleChangeEvaluationType(module.id, "qcm")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                          evalType === "qcm"
                            ? "bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                      >
                        QCM
                      </button>
                      <button
                        onClick={() => handleChangeEvaluationType(module.id, "atelier")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                          evalType === "atelier"
                            ? "bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                      >
                        Atelier
                      </button>
                    </div>
                  </div>

                  {/* Bouton de génération */}
                  <div className="flex items-center justify-end gap-2">
                    {hasGenerated ? (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <CheckCircleIcon />
                          {evalType === "qcm" ? `${qcm?.questions.length} questions` : "Atelier généré"}
                        </span>
                        <button
                          onClick={() => evalType === "qcm" && qcm ? handleDownloadQCM(module, qcm) : atelier && handleDownloadAtelier(module, atelier)}
                          className="p-2 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title={evalType === "qcm" ? "Télécharger le QCM" : "Télécharger l'atelier"}
                        >
                          <DownloadIcon />
                        </button>
                        {/* Bouton corrigé pour QCM uniquement */}
                        {evalType === "qcm" && qcm && (
                          <button
                            onClick={() => handleDownloadQCMAnswers(module, qcm)}
                            className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                            title="Télécharger le QCM corrigé"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        {/* Bouton exemple de rendu pour Atelier uniquement */}
                        {evalType === "atelier" && atelier && (
                          <button
                            onClick={() => handleDownloadAtelierCorrection(module, atelier)}
                            className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                            title="Télécharger l'atelier corrigé"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => evalType === "qcm" ? handleGenerateQCM(module.id) : handleGenerateAtelier(module.id)}
                          disabled={isGeneratingQCM || isGeneratingAtelier}
                          className="p-2 text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Actualiser"
                        >
                          {(isGeneratingQCM || isGeneratingAtelier) ? <SpinnerIcon /> : <RefreshIcon />}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => evalType === "qcm" ? handleGenerateQCM(module.id) : handleGenerateAtelier(module.id)}
                        disabled={isGeneratingQCM || isGeneratingAtelier}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap disabled:opacity-50 ${
                          evalType === "qcm"
                            ? "text-brand-600 bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400"
                            : "text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400"
                        }`}
                      >
                        {(isGeneratingQCM || isGeneratingAtelier) ? (
                          <>
                            <SpinnerIcon />
                            Génération...
                          </>
                        ) : (
                          <>
                            <SparklesIcon />
                            Générer {evalType === "qcm" ? "le QCM" : "l'Atelier"}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Contenu du module */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                  {module.contenu.length > 0 ? (
                    <ul className="space-y-2">
                      {module.contenu.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="text-brand-500 mt-1">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Contenu non défini</p>
                  )}
                </div>

                {/* Aperçu QCM si généré et type = qcm */}
                {evalType === "qcm" && qcm && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-brand-50 to-purple-50 dark:from-brand-900/10 dark:to-purple-900/10 rounded-lg border border-brand-200 dark:border-brand-800">
                    <h5 className="text-sm font-medium text-brand-700 dark:text-brand-300 mb-3">
                      Questions du QCM ({qcm.questions.length})
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Cliquez sur une question pour voir les options de réponse
                    </p>
                    <div className="space-y-2">
                      {qcm.questions.map((q, i) => (
                        <QCMQuestionItem
                          key={i}
                          question={q}
                          index={i}
                          isExpanded={(expandedQuestions[module.id] || []).includes(i)}
                          onToggle={() => toggleQuestion(module.id, i)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Aperçu Atelier si généré et type = atelier */}
                {evalType === "atelier" && atelier && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-amber-700 dark:text-amber-300">
                        {atelier.titre}
                      </h5>
                      <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
                        {atelier.dureeEstimee}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {atelier.description}
                    </p>

                    {/* Objectifs */}
                    <div className="mb-3">
                      <h6 className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">Objectifs</h6>
                      <ul className="space-y-1">
                        {atelier.objectifs.slice(0, 3).map((obj, i) => (
                          <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            {obj}
                          </li>
                        ))}
                        {atelier.objectifs.length > 3 && (
                          <li className="text-xs text-gray-400 italic">+{atelier.objectifs.length - 3} autres objectifs...</li>
                        )}
                      </ul>
                    </div>

                    {/* Instructions */}
                    <div className="mb-3">
                      <h6 className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">Instructions</h6>
                      <ol className="space-y-1 list-decimal list-inside">
                        {atelier.instructions.slice(0, 3).map((inst, i) => (
                          <li key={i} className="text-xs text-gray-600 dark:text-gray-400">
                            {inst}
                          </li>
                        ))}
                        {atelier.instructions.length > 3 && (
                          <li className="text-xs text-gray-400 italic list-none ml-4">+{atelier.instructions.length - 3} autres étapes...</li>
                        )}
                      </ol>
                    </div>

                    {/* Critères d'évaluation */}
                    <div>
                      <h6 className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">Critères d'évaluation</h6>
                      <ul className="space-y-1">
                        {atelier.critereEvaluation.slice(0, 2).map((crit, i) => (
                          <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-amber-500">•</span>
                            {crit}
                          </li>
                        ))}
                        {atelier.critereEvaluation.length > 2 && (
                          <li className="text-xs text-gray-400 italic ml-4">+{atelier.critereEvaluation.length - 2} autres critères...</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Boutons navigation */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.6667 5L7.5 14.1667L3.33334 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Terminer
        </button>
      </div>

      {/* Modal Test de positionnement */}
      {viewingPositionnement && positionnement && (
        <EvaluationModal
          data={positionnement}
          onClose={() => setViewingPositionnement(false)}
          onDownload={() => handleDownloadEvaluation(positionnement)}
        />
      )}

      {/* Modal Evaluation finale */}
      {viewingEvaluation && evaluationFinale && (
        <EvaluationModal
          data={evaluationFinale}
          onClose={() => setViewingEvaluation(false)}
          onDownload={() => handleDownloadEvaluation(evaluationFinale)}
        />
      )}

      {/* Modal Document de corrélation */}
      {viewingCorrelation && correlationDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-emerald-200 dark:border-emerald-700">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {correlationDocument.titre}
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-full">
                    Qualiopi IND 11
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Formation : {correlationDocument.formation.titre}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadCorrelation}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors dark:bg-green-900/20 dark:text-green-400"
                >
                  <DownloadIcon />
                  Télécharger
                </button>
                <button
                  onClick={() => setViewingCorrelation(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Contenu scrollable */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Synthèse */}
              <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700">
                <h4 className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-3">Synthèse</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {correlationDocument.synthese.totalObjectifs}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Objectifs totaux</div>
                  </div>
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {correlationDocument.synthese.objectifsCouverts}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Objectifs couverts</div>
                  </div>
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {correlationDocument.synthese.tauxCouverture}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Taux de couverture</div>
                  </div>
                </div>
              </div>

              {/* Corrélations */}
              <div className="mb-6">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Détail des corrélations</h4>
                <div className="space-y-4">
                  {correlationDocument.correlations.map((item, i) => (
                    <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                            {i + 1}
                          </span>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {item.objectif}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.couverture === "complete"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : item.couverture === "partielle"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {item.couverture === "complete" ? "Couverture complète" : item.couverture === "partielle" ? "Couverture partielle" : "Non couvert"}
                        </span>
                      </div>

                      {item.questionsAssociees.length > 0 && (
                        <div className="ml-11 mb-3">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Questions associées :</p>
                          <ul className="space-y-2">
                            {item.questionsAssociees.map((q, qIdx) => (
                              <li key={qIdx} className="flex items-start gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg">
                                <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded">
                                  Q{q.numero}
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {q.question}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="ml-11 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Critère de validation :</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">{item.critereValidation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Objectifs non couverts */}
              {correlationDocument.objectifsNonCouverts && correlationDocument.objectifsNonCouverts.length > 0 && (
                <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-700">
                  <h4 className="text-base font-semibold text-orange-700 dark:text-orange-400 mb-4">
                    ⚠️ Objectifs non couverts - Questions suggérées
                  </h4>
                  <div className="space-y-4">
                    {correlationDocument.objectifsNonCouverts.map((item, i) => (
                      <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-orange-400">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
                          Objectif : {item.objectif}
                        </p>
                        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Question suggérée :</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{item.questionProposee.question}</p>
                          {item.questionProposee.options && (
                            <ul className="space-y-1">
                              {item.questionProposee.options.map((opt, optIdx) => (
                                <li key={optIdx} className={`text-sm ${
                                  optIdx === item.questionProposee.reponseCorrecte
                                    ? "text-green-600 dark:text-green-400 font-medium"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}. {opt}
                                  {optIdx === item.questionProposee.reponseCorrecte && " ✓"}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommandations */}
              {correlationDocument.synthese.recommandations && correlationDocument.synthese.recommandations.length > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                  <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-3">💡 Recommandations</h4>
                  <ul className="space-y-2">
                    {correlationDocument.synthese.recommandations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-300">
                        <span className="text-blue-400">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepEvaluations;
