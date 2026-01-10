"use client";
import React, { useState, useCallback } from "react";

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
  // Qualiopi IND 3 - Certification
  isCertifiante: boolean;
  numeroFicheRS: string;
  referentielRSUrl: string;
  lienFranceCompetences: string;
  // Éligibilité CPF
  estEligibleCPF: boolean;
}

interface StepContexteProps {
  data: FormationData;
  onChange: (data: FormationData) => void;
  onNext: () => void;
  onGenerateFiche?: (contexte: FormationData) => Promise<void>;
  isGenerating?: boolean;
  hasAdvancedProgress?: boolean; // True si la formation a déjà des slides/évaluations générés
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

// Composant d'upload pour le référentiel RS (Qualiopi IND 3)
function ReferentielRSUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError("Le fichier est trop volumineux (max 10 MB)");
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Seuls les fichiers PDF sont acceptés");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "referentiel-rs");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  }, [onChange]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        Référentiel RS (PDF)
      </label>
      <div className="space-y-2">
        {value ? (
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="flex-1 text-sm text-green-700 dark:text-green-300 truncate">
              Référentiel uploadé
            </span>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-600 dark:text-green-400 hover:underline"
            >
              Voir
            </a>
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-red-500 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <label className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors ${
            isUploading
              ? "border-brand-400 bg-brand-50 dark:bg-brand-900/10"
              : "border-gray-300 dark:border-gray-600 cursor-pointer hover:border-brand-400 dark:hover:border-brand-500"
          }`}>
            {isUploading ? (
              <>
                <SpinnerIcon />
                <span className="text-sm text-brand-600 dark:text-brand-400 mt-2">
                  Upload en cours...
                </span>
              </>
            ) : (
              <>
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Cliquer pour uploader le référentiel PDF
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  PDF uniquement, max 10 MB
                </span>
              </>
            )}
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </label>
        )}
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Uploadez le référentiel RS pour extraire automatiquement les compétences visées et les aligner avec vos objectifs pédagogiques.
      </p>
    </div>
  );
}

// Icône d'alerte pour la modal
const AlertTriangleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.57 20.73C2.88 20.91 3.23 21 3.59 21H20.41C20.77 21 21.12 20.91 21.43 20.73C21.74 20.56 22 20.3 22.18 20C22.36 19.7 22.45 19.36 22.45 19C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.27 3.32 12.96 3.15C12.65 2.98 12.31 2.89 11.96 2.89C11.61 2.89 11.27 2.98 10.96 3.15C10.65 3.32 10.39 3.56 10.21 3.86H10.29Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Modal de confirmation pour régénération
function RegenerationConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        {/* Icône d'alerte */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30">
          <div className="text-amber-600 dark:text-amber-400">
            <AlertTriangleIcon />
          </div>
        </div>

        {/* Titre */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-3">
          Attention
        </h3>

        {/* Message */}
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6 leading-relaxed">
          Vous êtes sur le point de régénérer la fiche pédagogique. Cette action remplacera la fiche pédagogique actuelle et peut rendre les slides et les évaluations déjà générés incohérents.
          <br /><br />
          Après régénération, vous devrez probablement régénérer les slides et les évaluations pour rester aligné avec la nouvelle fiche pédagogique.
          <br /><br />
          <strong>Souhaitez-vous continuer ?</strong>
        </p>

        {/* Boutons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}

export const StepContexte: React.FC<StepContexteProps> = ({
  data,
  onChange,
  onNext,
  onGenerateFiche,
  isGenerating = false,
  hasAdvancedProgress = false,
}) => {
  const [isEnriching, setIsEnriching] = useState(false);
  const [showRegenerationModal, setShowRegenerationModal] = useState(false);

  const handleChange = (field: keyof FormationData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const handleGenerateClick = async () => {
    // Si la formation a déjà des slides/évaluations, demander confirmation
    if (hasAdvancedProgress && onGenerateFiche) {
      setShowRegenerationModal(true);
      return;
    }

    if (onGenerateFiche) {
      await onGenerateFiche(data);
    } else {
      onNext();
    }
  };

  const handleConfirmRegeneration = async () => {
    setShowRegenerationModal(false);
    if (onGenerateFiche) {
      await onGenerateFiche(data);
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

          {/* Section Certification (Qualiopi IND 3) */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.isCertifiante || false}
                  onChange={(e) => handleChange("isCertifiante", e.target.checked as unknown as string)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
              </label>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Formation certifiante
              </span>
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full dark:bg-amber-900/30 dark:text-amber-400">
                Qualiopi IND 3
              </span>
            </div>

            {/* Éligible CPF */}
            <div className="flex items-center gap-2 mb-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.estEligibleCPF || false}
                  onChange={(e) => handleChange("estEligibleCPF", e.target.checked as unknown as string)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
              </label>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Éligible CPF
              </span>
            </div>

            {data.isCertifiante && (
              <div className="space-y-4 pl-2 border-l-2 border-brand-200 dark:border-brand-800">
                {/* Numéro fiche RS */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Numéro de fiche RS/RNCP
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: RS6563"
                    value={data.numeroFicheRS || ""}
                    onChange={(e) => handleChange("numeroFicheRS", e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                  />
                </div>

                {/* Lien France Compétences */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Lien de la fiche France Compétences
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.francecompetences.fr/recherche/rs/RS6563/"
                    value={data.lienFranceCompetences || ""}
                    onChange={(e) => handleChange("lienFranceCompetences", e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <a
                      href="https://www.francecompetences.fr/recherche-resultats/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-500 hover:underline"
                    >
                      Rechercher sur France Compétences
                    </a>
                  </p>
                </div>

                {/* Upload référentiel RS (PDF) */}
                <ReferentielRSUpload
                  value={data.referentielRSUrl || ""}
                  onChange={(url) => handleChange("referentielRSUrl", url)}
                />
              </div>
            )}
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
                placeholder="Décrivez le plus clairement possible la formation que vous avez en tête : de quoi il s'agit, ce que vous souhaitez y aborder, à qui elle s'adresse et dans quel but vous la mettez en place. Plus vous donnez d'éléments, plus la fiche pédagogique générée correspondra à votre projet."
                value={data.description}
                onChange={(e) => handleChange("description", e.target.value)}
                maxLength={3000}
                rows={18}
                className="w-full px-4 py-3 pb-8 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 resize-none"
              />
              <div className="absolute bottom-2 right-3 text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 px-1 rounded">
                {data.description.length} / 3000
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
              <span>Génération en cours...</span>
            </>
          ) : (
            <>
              <SparklesIcon />
              <span>Générer la fiche pédagogique</span>
            </>
          )}
        </button>
      </div>

      {/* Message d'aide */}
      {!canGenerate && (
        <p className="text-sm text-amber-600 dark:text-amber-400 text-right">
          Veuillez décrire la formation en au moins 20 caractères pour générer la fiche.
        </p>
      )}

      {/* Modal de confirmation pour régénération */}
      <RegenerationConfirmModal
        isOpen={showRegenerationModal}
        onClose={() => setShowRegenerationModal(false)}
        onConfirm={handleConfirmRegeneration}
      />
    </div>
  );
};

export default StepContexte;
