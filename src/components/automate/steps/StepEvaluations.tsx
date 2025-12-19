"use client";
import React, { useState, useCallback } from "react";

// Types
interface Module {
  id: string;
  titre: string;
  contenu: string[];
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

interface StepEvaluationsProps {
  modules: Module[];
  formationTitre?: string;
  formationObjectifs?: string[];
  onNext: () => void;
  onPrevious: () => void;
  onGeneratePositionnement?: () => void;
  onGenerateEvaluationFinale?: () => void;
  onGenerateQCM?: (moduleId: string) => void;
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

// Composant apercu miniature d'evaluation
interface EvaluationPreviewProps {
  title: string;
  data: EvaluationData | null;
  isGenerating: boolean;
  onGenerate: () => void;
  onRegenerate: () => void;
  onViewAll: () => void;
  onDownload: () => void;
}

const EvaluationPreview: React.FC<EvaluationPreviewProps> = ({
  title,
  data,
  isGenerating,
  onGenerate,
  onRegenerate,
  onViewAll,
  onDownload,
}) => {
  if (isGenerating) {
    return (
      <div className="h-48 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
        <SpinnerIcon />
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Generation en cours...</p>
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
            title="Voir tout"
          >
            <EyeIcon />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 text-green-600 dark:text-green-400"
            title="Telecharger"
          >
            <DownloadIcon />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
            className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            title="Regenerer"
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
        Generer {title}
      </span>
      <span className="mt-1 flex items-center gap-1 text-xs text-gray-400 group-hover:text-brand-500">
        <SparklesIcon />
        Cliquez pour generer
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
              Telecharger
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

                {q.type === "qcm" && q.options && (
                  <div className="ml-11 space-y-2">
                    {q.options.map((option, optIdx) => (
                      <div
                        key={optIdx}
                        className={`flex items-start gap-2 p-2 rounded-lg ${
                          q.correctAnswer === optIdx
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-white dark:bg-gray-900'
                        }`}
                      >
                        <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs font-medium ${
                          q.correctAnswer === optIdx
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className={`text-sm ${
                          q.correctAnswer === optIdx
                            ? 'text-green-700 dark:text-green-400 font-medium'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {option}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {q.type === "vrai_faux" && (
                  <div className="ml-11 flex gap-2">
                    <span className={`px-3 py-1 rounded-lg text-sm ${
                      q.correctAnswer === "vrai" ? 'bg-green-100 text-green-700 font-medium dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      Vrai
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-sm ${
                      q.correctAnswer === "faux" ? 'bg-green-100 text-green-700 font-medium dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      Faux
                    </span>
                  </div>
                )}

                {q.type === "ouvert" && (
                  <div className="ml-11 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Reponse attendue:</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{q.correctAnswer || "Question ouverte"}</p>
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

export const StepEvaluations: React.FC<StepEvaluationsProps> = ({
  modules,
  formationTitre = "Formation",
  formationObjectifs = [],
  onNext,
  onPrevious,
}) => {
  // Etats pour les evaluations generees
  const [positionnement, setPositionnement] = useState<EvaluationData | null>(null);
  const [evaluationFinale, setEvaluationFinale] = useState<EvaluationData | null>(null);
  const [qcmByModule, setQcmByModule] = useState<Record<string, QCMData | null>>({});

  // Etats de chargement
  const [generatingPositionnement, setGeneratingPositionnement] = useState(false);
  const [generatingEvaluation, setGeneratingEvaluation] = useState(false);
  const [generatingQCM, setGeneratingQCM] = useState<Record<string, boolean>>({});
  const [generatingAllQCM, setGeneratingAllQCM] = useState(false);

  // Etat pour les questions QCM expandees (moduleId -> questionIndex[])
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, number[]>>({});

  // Etats pour les modals de visualisation
  const [viewingPositionnement, setViewingPositionnement] = useState(false);
  const [viewingEvaluation, setViewingEvaluation] = useState(false);

  // Fonction pour telecharger une evaluation en PDF
  const handleDownloadEvaluation = useCallback((evaluation: EvaluationData) => {
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
          .option { margin-bottom: 8px; padding: 8px 12px; background: white; border-radius: 6px; }
          .option-letter { display: inline-block; width: 22px; height: 22px; background: #e2e8f0; color: #64748b; border-radius: 50%; text-align: center; line-height: 22px; font-size: 12px; font-weight: 600; margin-right: 8px; }
          .correct { background: #dcfce7; border: 1px solid #86efac; }
          .correct .option-letter { background: #22c55e; color: white; }
          @media print {
            body { padding: 20px; }
            .question-block { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>${evaluation.titre}</h1>
        <p class="description">${evaluation.description}</p>

        ${evaluation.questions.map((q, i) => `
          <div class="question-block">
            <span class="question-number">${i + 1}</span>
            <span class="question-text">${q.question}</span>
            ${q.options ? `
              <div class="options">
                ${q.options.map((opt, idx) => `
                  <div class="option ${q.correctAnswer === idx ? 'correct' : ''}">
                    <span class="option-letter">${String.fromCharCode(65 + idx)}</span>
                    ${opt}
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
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
      alert("Veuillez autoriser les popups pour telecharger le PDF");
    }
  }, []);

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
      const response = await fetch("/api/ai/generate-positionnement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formationTitre,
          objectifs: formationObjectifs,
          modules: modules.map(m => ({ titre: m.titre, contenu: m.contenu })),
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la generation");
      }

      const data = await response.json();
      if (data.success && data.data) {
        setPositionnement({
          titre: "Test de positionnement",
          description: `Evaluation pre-formation pour ${formationTitre}`,
          questions: data.data.questions || [],
        });
      }
    } catch (error) {
      console.error("Erreur generation positionnement:", error);
      alert("Erreur lors de la generation du test de positionnement");
    } finally {
      setGeneratingPositionnement(false);
    }
  }, [formationTitre, formationObjectifs, modules]);

  // Generer l'evaluation finale
  const handleGenerateEvaluation = useCallback(async () => {
    setGeneratingEvaluation(true);
    try {
      const response = await fetch("/api/ai/generate-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formationTitre,
          objectifs: formationObjectifs,
          modules: modules.map(m => ({ titre: m.titre, contenu: m.contenu })),
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la generation");
      }

      const data = await response.json();
      if (data.success && data.data) {
        setEvaluationFinale({
          titre: "Evaluation finale",
          description: `Evaluation des acquis pour ${formationTitre}`,
          questions: data.data.questions || [],
        });
      }
    } catch (error) {
      console.error("Erreur generation evaluation:", error);
      alert("Erreur lors de la generation de l'evaluation finale");
    } finally {
      setGeneratingEvaluation(false);
    }
  }, [formationTitre, formationObjectifs, modules]);

  // Generer un QCM pour un module
  const handleGenerateQCM = useCallback(async (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    setGeneratingQCM(prev => ({ ...prev, [moduleId]: true }));
    try {
      const response = await fetch("/api/ai/generate-qcm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleTitre: module.titre,
          moduleContenu: module.contenu,
          objectifs: formationObjectifs,
          nombreQuestions: 5,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la generation");
      }

      const data = await response.json();
      if (data.success && data.data) {
        setQcmByModule(prev => ({
          ...prev,
          [moduleId]: {
            titre: `QCM - ${module.titre}`,
            questions: data.data.questions || [],
          },
        }));
      }
    } catch (error) {
      console.error("Erreur generation QCM:", error);
      alert(`Erreur lors de la generation du QCM pour ${module.titre}`);
    } finally {
      setGeneratingQCM(prev => ({ ...prev, [moduleId]: false }));
    }
  }, [modules, formationObjectifs]);

  // Generer tous les QCM
  const handleGenerateAllQCM = useCallback(async () => {
    setGeneratingAllQCM(true);
    for (const module of modules) {
      if (!qcmByModule[module.id]) {
        await handleGenerateQCM(module.id);
      }
    }
    setGeneratingAllQCM(false);
  }, [modules, qcmByModule, handleGenerateQCM]);

  // Telecharger un QCM individuel
  const handleDownloadQCM = useCallback((module: Module, qcm: QCMData) => {
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
          .correct { background: #dcfce7; border: 1px solid #86efac; }
          .correct .option-letter { background: #22c55e; color: white; }
          .explanation { margin-top: 10px; padding: 10px; background: #eff6ff; border-radius: 6px; font-size: 13px; color: #1e40af; }
          @media print {
            body { padding: 20px; }
            .question-block { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
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
                <div class="option ${q.correctAnswer === idx ? 'correct' : ''}">
                  <span class="option-letter">${String.fromCharCode(65 + idx)}</span>
                  ${opt}
                </div>
              `).join('')}
            </div>
            ${q.explanation ? `<div class="explanation"><strong>Explication :</strong> ${q.explanation}</div>` : ''}
          </div>
        `).join('')}
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
      alert("Veuillez autoriser les popups pour telecharger le PDF");
    }
  }, []);

  // Telecharger tous les QCM en un seul document
  const handleDownloadAllQCM = useCallback(() => {
    const modulesWithQCM = modules.filter(m => qcmByModule[m.id]);
    if (modulesWithQCM.length === 0) {
      alert("Aucun QCM genere. Veuillez d'abord generer les QCM.");
      return;
    }

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
          @media print {
            body { padding: 20px; }
            .question-block { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
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
      alert("Veuillez autoriser les popups pour telecharger le PDF");
    }
  }, [modules, qcmByModule, formationTitre]);

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
            Mesure le niveau de depart des participants avant la formation.
          </p>
          <EvaluationPreview
            title="le test"
            data={positionnement}
            isGenerating={generatingPositionnement}
            onGenerate={handleGeneratePositionnement}
            onRegenerate={handleGeneratePositionnement}
            onViewAll={() => setViewingPositionnement(true)}
            onDownload={() => positionnement && handleDownloadEvaluation(positionnement)}
          />
        </div>

        {/* Evaluation finale */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Evaluation finale
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Verifie les acquis des participants en fin de formation.
          </p>
          <EvaluationPreview
            title="l'evaluation"
            data={evaluationFinale}
            isGenerating={generatingEvaluation}
            onGenerate={handleGenerateEvaluation}
            onRegenerate={handleGenerateEvaluation}
            onViewAll={() => setViewingEvaluation(true)}
            onDownload={() => evaluationFinale && handleDownloadEvaluation(evaluationFinale)}
          />
        </div>
      </div>

      {/* QCM par module */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              QCM par module
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Generez des QCM pour chaque module de la formation
            </p>
          </div>
          <div className="flex items-center gap-2">
            {Object.values(qcmByModule).some(qcm => qcm !== null) && (
              <button
                onClick={handleDownloadAllQCM}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors dark:bg-green-900/20 dark:text-green-400"
              >
                <DownloadIcon />
                Telecharger tous les QCM
              </button>
            )}
            <button
              onClick={handleGenerateAllQCM}
              disabled={generatingAllQCM}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-500 to-purple-500 rounded-lg hover:from-brand-600 hover:to-purple-600 transition-all shadow-md disabled:opacity-50"
            >
              {generatingAllQCM ? (
                <>
                  <SpinnerIcon />
                  Generation en cours...
                </>
              ) : (
                <>
                  <SparklesIcon />
                  Generer tous les QCM
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {modules.map((module) => {
            const qcm = qcmByModule[module.id];
            const isGenerating = generatingQCM[module.id] || false;

            return (
              <div key={module.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0">
                {/* Titre du module */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                    {module.titre}
                  </h4>
                  {qcm ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <CheckCircleIcon />
                        {qcm.questions.length} questions
                      </span>
                      <button
                        onClick={() => handleDownloadQCM(module, qcm)}
                        className="p-2 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Telecharger le QCM"
                      >
                        <DownloadIcon />
                      </button>
                      <button
                        onClick={() => handleGenerateQCM(module.id)}
                        disabled={isGenerating}
                        className="p-2 text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Regenerer le QCM"
                      >
                        {isGenerating ? <SpinnerIcon /> : <RefreshIcon />}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleGenerateQCM(module.id)}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors dark:bg-brand-500/10 dark:text-brand-400 whitespace-nowrap disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <SpinnerIcon />
                          Generation...
                        </>
                      ) : (
                        <>
                          <SparklesIcon />
                          Generer le QCM
                        </>
                      )}
                    </button>
                  )}
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
                    <p className="text-sm text-gray-400 italic">Contenu non defini</p>
                  )}
                </div>

                {/* Apercu QCM si genere */}
                {qcm && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-brand-50 to-purple-50 dark:from-brand-900/10 dark:to-purple-900/10 rounded-lg border border-brand-200 dark:border-brand-800">
                    <h5 className="text-sm font-medium text-brand-700 dark:text-brand-300 mb-3">
                      Questions du QCM ({qcm.questions.length})
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Cliquez sur une question pour voir les options de reponse
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
          Generer les documents
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
    </div>
  );
};

export default StepEvaluations;
