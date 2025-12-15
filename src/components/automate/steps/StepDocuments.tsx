"use client";
import React, { useState } from "react";

// Icon Plus
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 3.33333V12.6667M3.33333 8H12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon Trash
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.75 3.5H12.25M5.25 3.5V2.33333C5.25 1.8731 5.6231 1.5 6.08333 1.5H7.91667C8.3769 1.5 8.75 1.8731 8.75 2.33333V3.5M10.5 3.5V11.6667C10.5 12.1269 10.1269 12.5 9.66667 12.5H4.33333C3.8731 12.5 3.5 12.1269 3.5 11.6667V3.5H10.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface Entreprise {
  raisonSociale: string;
  nomDirigeant: string;
  siret: string;
  adresse: string;
}

interface Salarie {
  id: string;
  nomPrenom: string;
  adresse: string;
  codePostal: string;
  ville: string;
}

interface Independant {
  id: string;
  raisonSociale: string;
  nomDirigeant: string;
  siret: string;
  adresse: string;
}

interface Formateur {
  id: string;
  nomPrenom: string;
  fonction: string;
}

interface DocumentsData {
  entreprise: Entreprise;
  salaries: Salarie[];
  independants: Independant[];
  formateur: Formateur; // Pour rétrocompatibilité
  formateurs?: Formateur[];
}

interface StepDocumentsProps {
  data: DocumentsData;
  onChange: (data: DocumentsData) => void;
  onGenerateConvention: () => void;
  onGenerateContrat: () => void;
}

export const StepDocuments: React.FC<StepDocumentsProps> = ({
  data,
  onChange,
  onGenerateConvention,
  onGenerateContrat,
}) => {
  const addSalarie = () => {
    const newSalarie: Salarie = {
      id: Date.now().toString(),
      nomPrenom: "",
      adresse: "",
      codePostal: "",
      ville: "",
    };
    onChange({
      ...data,
      salaries: [...data.salaries, newSalarie],
    });
  };

  const addIndependant = () => {
    const newIndependant: Independant = {
      id: Date.now().toString(),
      raisonSociale: "",
      nomDirigeant: "",
      siret: "",
      adresse: "",
    };
    onChange({
      ...data,
      independants: [...data.independants, newIndependant],
    });
  };

  const deleteSalarie = (id: string) => {
    // Ne pas supprimer si c'est le dernier salarié
    if (data.salaries.length <= 1) return;
    onChange({
      ...data,
      salaries: data.salaries.filter((s) => s.id !== id),
    });
  };

  const deleteIndependant = (id: string) => {
    // Ne pas supprimer si c'est le dernier indépendant
    if (data.independants.length <= 1) return;
    onChange({
      ...data,
      independants: data.independants.filter((i) => i.id !== id),
    });
  };

  // Initialiser formateurs si non présent (migration depuis formateur unique)
  const formateurs = data.formateurs || [{ id: "1", nomPrenom: data.formateur?.nomPrenom || "", fonction: data.formateur?.fonction || "" }];

  const addFormateur = () => {
    const newFormateur: Formateur = {
      id: Date.now().toString(),
      nomPrenom: "",
      fonction: "",
    };
    onChange({
      ...data,
      formateurs: [...formateurs, newFormateur],
    });
  };

  const deleteFormateur = (id: string) => {
    // Ne pas supprimer si c'est le dernier formateur
    if (formateurs.length <= 1) return;
    onChange({
      ...data,
      formateurs: formateurs.filter((f) => f.id !== id),
    });
  };

  const updateFormateurById = (id: string, field: keyof Omit<Formateur, "id">, value: string) => {
    onChange({
      ...data,
      formateurs: formateurs.map((f) =>
        f.id === id ? { ...f, [field]: value } : f
      ),
    });
  };

  const updateEntreprise = (field: keyof Entreprise, value: string) => {
    onChange({
      ...data,
      entreprise: { ...data.entreprise, [field]: value },
    });
  };

  const updateSalarie = (id: string, field: keyof Salarie, value: string) => {
    onChange({
      ...data,
      salaries: data.salaries.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    });
  };

  const updateIndependant = (id: string, field: keyof Independant, value: string) => {
    onChange({
      ...data,
      independants: data.independants.map((i) =>
        i.id === id ? { ...i, [field]: value } : i
      ),
    });
  };

  const inputClassName = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500";

  return (
    <div className="space-y-6">
      {/* Grille des 4 colonnes */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Colonne 1 - Entreprise */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Entreprise
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Renseignez ici les informations de l'entreprise qui finance ou accueille la formation. Ces données seront utilisées pour la convention, les convocations et les attestations.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Raison sociale
                </label>
                <input
                  type="text"
                  placeholder="Écrivez ici..."
                  value={data.entreprise.raisonSociale}
                  onChange={(e) => updateEntreprise("raisonSociale", e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom et prénom du dirigeant
                </label>
                <input
                  type="text"
                  placeholder="Écrivez ici..."
                  value={data.entreprise.nomDirigeant}
                  onChange={(e) => updateEntreprise("nomDirigeant", e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Numéro SIRET
                </label>
                <input
                  type="text"
                  placeholder="Écrivez ici..."
                  value={data.entreprise.siret}
                  onChange={(e) => updateEntreprise("siret", e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  placeholder="Écrivez ici..."
                  value={data.entreprise.adresse}
                  onChange={(e) => updateEntreprise("adresse", e.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>
          </div>

          {/* Colonne 2 - Salarié(s) */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Salarié(s)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Ajoutez ici les salariés qui vont suivre cette formation. Leurs informations seront utilisées pour les feuilles d'émargement et les attestations.
            </p>

            {data.salaries.map((salarie, index) => (
              <div key={salarie.id} className="relative space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                {/* Bouton supprimer - visible seulement s'il y a plus d'un salarié */}
                {data.salaries.length > 1 && (
                  <button
                    onClick={() => deleteSalarie(salarie.id)}
                    className="absolute -top-1 -right-1 p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                    title="Supprimer ce salarié"
                  >
                    <TrashIcon />
                  </button>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom et prénom {data.salaries.length > 1 && <span className="text-gray-400">#{index + 1}</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="Écrivez ici..."
                    value={salarie.nomPrenom}
                    onChange={(e) => updateSalarie(salarie.id, "nomPrenom", e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    placeholder="Écrivez ici..."
                    value={salarie.adresse}
                    onChange={(e) => updateSalarie(salarie.id, "adresse", e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Code postal
                  </label>
                  <input
                    type="text"
                    placeholder="Écrivez ici..."
                    value={salarie.codePostal}
                    onChange={(e) => updateSalarie(salarie.id, "codePostal", e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    placeholder="Écrivez ici..."
                    value={salarie.ville}
                    onChange={(e) => updateSalarie(salarie.id, "ville", e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>
            ))}

            <button
              onClick={addSalarie}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <PlusIcon />
            </button>
          </div>

          {/* Colonne 3 - Indépendant(s) */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Indépendant(s)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Ajoutez ici les indépendants (auto-entrepreneurs, freelances, etc.) qui vont suivre cette formation. Leurs informations serviront pour les documents de formation.
            </p>

            {data.independants.map((independant, index) => (
              <div key={independant.id} className="relative space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                {/* Bouton supprimer - visible seulement s'il y a plus d'un indépendant */}
                {data.independants.length > 1 && (
                  <button
                    onClick={() => deleteIndependant(independant.id)}
                    className="absolute -top-1 -right-1 p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                    title="Supprimer cet indépendant"
                  >
                    <TrashIcon />
                  </button>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Raison sociale {data.independants.length > 1 && <span className="text-gray-400">#{index + 1}</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="Écrivez ici..."
                    value={independant.raisonSociale}
                    onChange={(e) => updateIndependant(independant.id, "raisonSociale", e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom et prénom du dirigeant
                  </label>
                  <input
                    type="text"
                    placeholder="Écrivez ici..."
                    value={independant.nomDirigeant}
                    onChange={(e) => updateIndependant(independant.id, "nomDirigeant", e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Numéro SIRET
                  </label>
                  <input
                    type="text"
                    placeholder="Écrivez ici..."
                    value={independant.siret}
                    onChange={(e) => updateIndependant(independant.id, "siret", e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    placeholder="Écrivez ici..."
                    value={independant.adresse}
                    onChange={(e) => updateIndependant(independant.id, "adresse", e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>
            ))}

            <button
              onClick={addIndependant}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <PlusIcon />
            </button>
          </div>

          {/* Colonne 4 - Formateur(s) */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Formateur(s)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Renseignez ici les informations du formateur en charge de cette formation. Elles seront utilisées dans l'ensemble des documents officiels.
            </p>

            {formateurs.map((formateur, index) => (
              <div key={formateur.id} className="relative space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                {/* Bouton supprimer - visible seulement s'il y a plus d'un formateur */}
                {formateurs.length > 1 && (
                  <button
                    onClick={() => deleteFormateur(formateur.id)}
                    className="absolute -top-1 -right-1 p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                    title="Supprimer ce formateur"
                  >
                    <TrashIcon />
                  </button>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom et prénom {formateurs.length > 1 && <span className="text-gray-400">#{index + 1}</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="Écrivez ici..."
                    value={formateur.nomPrenom}
                    onChange={(e) => updateFormateurById(formateur.id, "nomPrenom", e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fonction / spécialité
                  </label>
                  <input
                    type="text"
                    placeholder="Écrivez ici..."
                    value={formateur.fonction}
                    onChange={(e) => updateFormateurById(formateur.id, "fonction", e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>
            ))}

            <button
              onClick={addFormateur}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <PlusIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Convention et Contrat de formation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Convention de formation */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Convention de formation
          </h3>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Document contractuel entre l'organisme de formation et l'entreprise, reprenant les éléments de l'action de formation (objectifs, durée, modalités, tarifs, parties engagées).
            </p>
          </div>
          <button
            onClick={onGenerateConvention}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors dark:bg-brand-500/10 dark:text-brand-400"
          >
            Générer la convention de formation
          </button>
        </div>

        {/* Contrat de formation */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Contrat de formation
          </h3>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Contrat de formation destiné aux participants indépendants (auto-entrepreneurs, freelances, etc.), reprenant les conditions de la formation : programme, durée, modalités, prix et engagements de chaque partie.
            </p>
          </div>
          <button
            onClick={onGenerateContrat}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors dark:bg-brand-500/10 dark:text-brand-400"
          >
            Générer le contrat de formation
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepDocuments;
