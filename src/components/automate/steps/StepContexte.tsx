"use client";
import React from "react";

interface FormationData {
  dureeHeures: string;
  dureeJours: string;
  modalite: string;
  tarif: string;
  nombreParticipants: string;
  description: string;
}

interface StepContexteProps {
  data: FormationData;
  onChange: (data: FormationData) => void;
  onNext: () => void;
}

export const StepContexte: React.FC<StepContexteProps> = ({ data, onChange, onNext }) => {
  const handleChange = (field: keyof FormationData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne gauche - Informations de base */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Informations de base
          </h3>

          {/* Durée */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Durée de la formation
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Durée en heures"
                value={data.dureeHeures}
                onChange={(e) => handleChange("dureeHeures", e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
              <input
                type="text"
                placeholder="Durée en jours"
                value={data.dureeJours}
                onChange={(e) => handleChange("dureeJours", e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Modalité */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Modalité de la formation
            </label>
            <input
              type="text"
              placeholder="Présentiel - Distanciel ..."
              value={data.modalite}
              onChange={(e) => handleChange("modalite", e.target.value)}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          {/* Tarif */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Informations tarifaires
            </label>
            <input
              type="text"
              placeholder="Tarif par apprenant (HT)"
              value={data.tarif}
              onChange={(e) => handleChange("tarif", e.target.value)}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          {/* Nombre de participants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de participants
            </label>
            <input
              type="text"
              placeholder="Nombre maximum de participants"
              value={data.nombreParticipants}
              onChange={(e) => handleChange("nombreParticipants", e.target.value)}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Colonne droite - Description */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Description de la formation
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contenu de la formation
            </label>
            <div className="relative">
              <textarea
                placeholder="Décrivez le plus clairement possible la formation que vous avez en tête : de quoi il s'agit, les principaux contenus que vous souhaitez aborder, le public visé et la raison pour laquelle vous voulez mettre en place cette formation (problèmes à résoudre, résultats attendus). Plus votre description est précise, plus la fiche pédagogique générée sera proche de ce que vous avez en tête."
                value={data.description}
                onChange={(e) => handleChange("description", e.target.value)}
                maxLength={3000}
                rows={14}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 resize-none"
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {data.description.length}/3000
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton suivant */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors shadow-sm"
        >
          Générer la fiche pédagogique
        </button>
      </div>
    </div>
  );
};

export default StepContexte;
