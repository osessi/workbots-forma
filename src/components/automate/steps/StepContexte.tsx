"use client";
import React, { useState } from "react";

// Types
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
  onGenerateFiche?: (contexte: FormationData) => Promise<void>;
  isGenerating?: boolean;
}

// Icon pour enrichir
const WandIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 4V2M15 16V14M8 9H10M20 9H22M17.8 11.8L19 13M17.8 6.2L19 5M3 21L12 12M12.2 6.2L11 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon composant pour le spinner
const SpinnerIcon = () => (
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
  </svg>
);

const SparklesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L13.4302 8.31181C13.6047 8.92648 14.0735 9.39526 14.6882 9.56983L20 11L14.6882 12.4302C14.0735 12.6047 13.6047 13.0735 13.4302 13.6882L12 19L10.5698 13.6882C10.3953 13.0735 9.92648 12.6047 9.31181 12.4302L4 11L9.31181 9.56983C9.92648 9.39526 10.3953 8.92648 10.5698 8.31181L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const modaliteOptions = [
  { value: "presentiel", label: "Présentiel" },
  { value: "distanciel", label: "Distanciel" },
  { value: "mixte", label: "Mixte" },
];

const sessionOptions = [
  { value: "intra", label: "Intra-entreprise" },
  { value: "inter", label: "Inter-entreprises" },
];

export const StepContexte: React.FC<StepContexteProps> = ({
  data,
  onChange,
  onNext,
  onGenerateFiche,
  isGenerating = false,
}) => {
  const [isEnriching, setIsEnriching] = useState(false);

  const handleChange = (field: keyof FormationData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const handleGenerateClick = async () => {
    if (onGenerateFiche) {
      await onGenerateFiche(data);
    } else {
      onNext();
    }
  };

  // Enrichir la description avec l'IA
  const handleEnrichDescription = async () => {
    if (!data.description.trim() || data.description.trim().length < 10) {
      alert("Veuillez d'abord saisir une description de base (au moins 10 caracteres).");
      return;
    }

    setIsEnriching(true);
    try {
      const response = await fetch("/api/ai/enrich-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: data.description,
          modalite: data.modalite,
          dureeHeures: data.dureeHeures,
          dureeJours: data.dureeJours,
          nombreParticipants: data.nombreParticipants,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'enrichissement");
      }

      const result = await response.json();
      if (result.success && result.data?.enrichedDescription) {
        onChange({ ...data, description: result.data.enrichedDescription });
      }
    } catch (error) {
      console.error("Erreur enrichissement:", error);
      alert(error instanceof Error ? error.message : "Erreur lors de l'enrichissement de la description");
    } finally {
      setIsEnriching(false);
    }
  };

  // Verifier si le formulaire est valide pour la generation
  const canGenerate = data.description.trim().length >= 20;
  const canEnrich = data.description.trim().length >= 10;

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
              Tarifs <span className="text-xs text-amber-600 font-normal">(recommandé pour le catalogue public)</span>
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Entreprise (HT)</label>
                <input
                  type="text"
                  placeholder="Montant facturé à une entreprise"
                  value={data.tarifEntreprise || ""}
                  onChange={(e) => handleChange("tarifEntreprise", e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Indépendant (HT)</label>
                <input
                  type="text"
                  placeholder="Montant facturé à un indépendant"
                  value={data.tarifIndependant || ""}
                  onChange={(e) => handleChange("tarifIndependant", e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Particulier (TTC)</label>
                <input
                  type="text"
                  placeholder="Montant facturé à un particulier"
                  value={data.tarifParticulier || ""}
                  onChange={(e) => handleChange("tarifParticulier", e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite - Description */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Description de la formation
          </h3>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contenu de la formation
              </label>
              <button
                type="button"
                onClick={handleEnrichDescription}
                disabled={!canEnrich || isEnriching || isGenerating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30"
              >
                {isEnriching ? (
                  <>
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span>Enrichissement...</span>
                  </>
                ) : (
                  <>
                    <WandIcon />
                    <span>Enrichir</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <textarea
                placeholder="Decrivez le plus clairement possible la formation que vous avez en tete : de quoi il s'agit, ce que vous souhaitez y aborder, a qui elle s'adresse et dans quel but vous la mettez en place. Plus vous donnez d'elements, plus la fiche pedagogique generee correspondra a votre projet."
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
          onClick={handleGenerateClick}
          disabled={!canGenerate || isGenerating}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-brand-500 to-purple-500 rounded-lg hover:from-brand-600 hover:to-purple-600 transition-all shadow-lg shadow-brand-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <SpinnerIcon />
              <span>Generation en cours...</span>
            </>
          ) : (
            <>
              <SparklesIcon />
              <span>Generer la fiche pedagogique</span>
            </>
          )}
        </button>
      </div>

      {/* Message d'aide */}
      {!canGenerate && (
        <p className="text-sm text-amber-600 dark:text-amber-400 text-right">
          Veuillez decrire la formation en au moins 20 caracteres pour generer la fiche.
        </p>
      )}
    </div>
  );
};

export default StepContexte;
