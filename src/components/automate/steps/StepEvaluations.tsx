"use client";
import React from "react";

interface Module {
  id: string;
  titre: string;
  contenu: string[];
}

interface StepEvaluationsProps {
  modules: Module[];
  onNext: () => void;
  onPrevious: () => void;
  onGeneratePositionnement: () => void;
  onGenerateEvaluationFinale: () => void;
  onGenerateQCM: (moduleId: string) => void;
}

export const StepEvaluations: React.FC<StepEvaluationsProps> = ({
  modules,
  onNext,
  onPrevious,
  onGeneratePositionnement,
  onGenerateEvaluationFinale,
  onGenerateQCM,
}) => {
  return (
    <div className="space-y-6">
      {/* Test de positionnement et Évaluation finale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test de positionnement */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Test de positionnement
          </h3>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              Ce test, réalisé avant la formation, permet de mesurer le niveau de départ des participants et d'identifier leurs besoins.
            </p>
          </div>
          <button
            onClick={onGeneratePositionnement}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors dark:bg-brand-500/10 dark:text-brand-400"
          >
            Générer le test de positionnement
          </button>
        </div>

        {/* Évaluation finale */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Évaluation finale
          </h3>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              Cette évaluation, réalisée en fin de formation, permet de vérifier les acquis des participants et de mesurer l'atteinte des objectifs.
            </p>
          </div>
          <button
            onClick={onGenerateEvaluationFinale}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors dark:bg-brand-500/10 dark:text-brand-400"
          >
            Générer l'évaluation finale
          </button>
        </div>
      </div>

      {/* QCM par module */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="space-y-6">
          {modules.map((module) => (
            <div key={module.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0">
              {/* Titre du module avec bouton QCM */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {module.titre}
                </h3>
                <button
                  onClick={() => onGenerateQCM(module.id)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors dark:bg-brand-500/10 dark:text-brand-400 whitespace-nowrap"
                >
                  Générer le QCM
                </button>
              </div>

              {/* Contenu du module */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <ul className="space-y-2">
                  {module.contenu.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-brand-500 mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Boutons navigation */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors shadow-sm"
        >
          Générer les documents
        </button>
      </div>
    </div>
  );
};

export default StepEvaluations;
