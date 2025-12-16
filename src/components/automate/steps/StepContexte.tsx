"use client";
import React from "react";

interface FormationData {
  typeSession: string[];
  modalite: string;
  dureeHeures: string;
  dureeJours: string;
  nombreParticipants: string;
  tarifEntreprise: string;
  tarifIndependant: string;
  tarifParticulier: string;
  description: string;
}

interface StepContexteProps {
  data: FormationData;
  onChange: (data: FormationData) => void;
  onNext: () => void;
}

const modaliteOptions = [
  { value: "presentiel", label: "Présentiel" },
  { value: "distanciel", label: "Distanciel" },
  { value: "elearning", label: "E-learning" },
  { value: "mixte", label: "Mixte" },
];

const sessionOptions = [
  { value: "intra", label: "Intra-entreprise" },
  { value: "inter", label: "Inter-entreprises" },
];

export const StepContexte: React.FC<StepContexteProps> = ({ data, onChange, onNext }) => {
  const handleChange = (field: keyof FormationData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const handleSessionToggle = (value: string) => {
    const currentSessions = data.typeSession || [];
    if (currentSessions.includes(value)) {
      handleChange("typeSession", currentSessions.filter((s) => s !== value));
    } else {
      handleChange("typeSession", [...currentSessions, value]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne gauche - Informations de base */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Informations de base
          </h3>

          {/* Type de session */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type de session
            </label>
            <div className="flex flex-wrap gap-3">
              {sessionOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSessionToggle(option.value)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-lg border transition-all ${
                    (data.typeSession || []).includes(option.value)
                      ? "bg-brand-500 text-white border-brand-500"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:border-brand-300 hover:bg-brand-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:border-brand-500/50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Modalité */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Modalité de la formation
            </label>
            <select
              value={data.modalite || ""}
              onChange={(e) => handleChange("modalite", e.target.value)}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white appearance-none cursor-pointer"
            >
              <option value="" disabled>Sélectionnez une modalité</option>
              {modaliteOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

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

          {/* Nombre de participants */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de participants
            </label>
            <input
              type="text"
              placeholder="Nombre maximum de participants par session"
              value={data.nombreParticipants}
              onChange={(e) => handleChange("nombreParticipants", e.target.value)}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          {/* Informations tarifaires */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Informations tarifaires
            </label>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Montant facturé à une entreprise (en HT)"
                value={data.tarifEntreprise || ""}
                onChange={(e) => handleChange("tarifEntreprise", e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
              <input
                type="text"
                placeholder="Montant facturé à un indépendant (en HT)"
                value={data.tarifIndependant || ""}
                onChange={(e) => handleChange("tarifIndependant", e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
              <input
                type="text"
                placeholder="Montant facturé à un particulier (en TTC)"
                value={data.tarifParticulier || ""}
                onChange={(e) => handleChange("tarifParticulier", e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
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
                placeholder="Décrivez le plus clairement possible la formation que vous avez en tête : de quoi il s'agit, ce que vous souhaitez y aborder, à qui elle s'adresse et dans quel but vous la mettez en place. Plus vous donnez d'éléments, plus la fiche pédagogique générée correspondra à votre projet."
                value={data.description}
                onChange={(e) => handleChange("description", e.target.value)}
                maxLength={3000}
                rows={18}
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
