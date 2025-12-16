"use client";
import React from "react";

interface Module {
  id: string;
  titre: string;
  contenu: string[];
}

interface StepSlidesSupportProps {
  modules: Module[];
  formationTitre?: string;
  onNext: () => void;
  onPrevious: () => void;
  onGeneratePowerPoint: (moduleId: string) => void;
  onGenerateSupport: (moduleId: string) => void;
}

export const StepSlidesSupport: React.FC<StepSlidesSupportProps> = ({
  modules,
  formationTitre = "Les bases de l'intelligence artificielle",
  onNext,
  onGeneratePowerPoint,
  onGenerateSupport,
}) => {
  // Générer pour tous les modules
  const handleGenerateAllPowerPoint = () => {
    modules.forEach((module) => onGeneratePowerPoint(module.id));
  };

  const handleGenerateAllSupport = () => {
    modules.forEach((module) => onGenerateSupport(module.id));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header avec titre et boutons globaux */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {formationTitre}
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateAllPowerPoint}
              className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-brand-600 bg-white border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors dark:bg-gray-800 dark:border-brand-500/30 dark:text-brand-400 dark:hover:bg-brand-500/10 whitespace-nowrap"
            >
              Générer le PowerPoint
            </button>
            <button
              onClick={handleGenerateAllSupport}
              className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors whitespace-nowrap"
            >
              Générer le support apprenant
            </button>
          </div>
        </div>

        {/* Liste des modules */}
        <div className="space-y-6">
          {modules.map((module) => (
            <div key={module.id}>
              {/* Titre du module */}
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                {module.titre}
              </h3>

              {/* Ligne de séparation sous le titre */}
              <div className="border-b border-gray-200 dark:border-gray-700 mb-4" />

              {/* Contenu du module */}
              {module.contenu.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 dark:bg-gray-800/50 dark:border-gray-700">
                  <ul className="space-y-2">
                    {module.contenu.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-brand-500 mt-0.5">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bouton navigation - un seul bouton */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors shadow-sm"
        >
          Générer les évaluations
        </button>
      </div>
    </div>
  );
};

export default StepSlidesSupport;
