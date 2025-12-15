"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

// Icons
const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 2.25L15.75 4.5M1.5 16.5L2.25 13.5L12.75 3L15 5.25L4.5 15.75L1.5 16.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.75 9L7.5 12.75L14.25 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.5 4.5L13.5 13.5M4.5 13.5L13.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12.75V14.25C3 15.0784 3.67157 15.75 4.5 15.75H13.5C14.3284 15.75 15 15.0784 15 14.25V12.75M9 11.25V2.25M9 11.25L6 8.25M9 11.25L12 8.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface FichePedagogiqueData {
  titre: string;
  description: string;
  objectifs: string[];
  contenu: string;
  typeFormation: string;
  duree: string;
  nombreParticipants: string;
  tarif: string;
  accessibilite: string;
}

interface StepFichePedagogiqueProps {
  data: FichePedagogiqueData;
  onChange: (data: FichePedagogiqueData) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const StepFichePedagogique: React.FC<StepFichePedagogiqueProps> = ({
  data,
  onChange,
  onNext,
  onPrevious,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(data.titre);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleSaveTitle = () => {
    if (editedTitle.trim()) {
      onChange({ ...data, titre: editedTitle.trim() });
    } else {
      setEditedTitle(data.titre);
    }
    setIsEditingTitle(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(data.titre);
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonne gauche - Image et infos basiques */}
          <div className="space-y-6">
            {/* Image de la formation */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              <Image
                src="/images/cards/card-01.png"
                alt="Formation"
                fill
                className="object-cover"
              />
            </div>

            {/* Type de formation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type de formation
              </label>
              <input
                type="text"
                value={data.typeFormation}
                onChange={(e) => onChange({ ...data, typeFormation: e.target.value })}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Durée */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Durée
              </label>
              <input
                type="text"
                value={data.duree}
                onChange={(e) => onChange({ ...data, duree: e.target.value })}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Nombre de participants */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre maximum de participants
              </label>
              <input
                type="text"
                value={data.nombreParticipants}
                onChange={(e) => onChange({ ...data, nombreParticipants: e.target.value })}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Tarif */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tarif
              </label>
              <input
                type="text"
                value={data.tarif}
                onChange={(e) => onChange({ ...data, tarif: e.target.value })}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Accessibilité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Accessibilité
              </label>
              <input
                type="text"
                value={data.accessibilite}
                onChange={(e) => onChange({ ...data, accessibilite: e.target.value })}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Colonne droite - Détails de la fiche */}
          <div className="space-y-6">
            {/* Titre avec actions */}
            <div className="flex items-start justify-between gap-4">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 text-xl font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-brand-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors dark:text-green-400 dark:hover:bg-green-500/10"
                    title="Enregistrer"
                  >
                    <CheckIcon />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:bg-gray-700"
                    title="Annuler"
                  >
                    <CloseIcon />
                  </button>
                </div>
              ) : (
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {data.titre}
                </h2>
              )}
              <div className="flex items-center gap-2">
                {!isEditingTitle && (
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="p-2 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-brand-400 dark:hover:bg-brand-500/10"
                    title="Modifier le titre"
                  >
                    <EditIcon />
                  </button>
                )}
                <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors dark:bg-brand-500/10 dark:text-brand-400">
                  <DownloadIcon />
                  Télécharger en PDF
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </h4>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {data.description}
                </p>
              </div>
            </div>

            {/* Objectifs pédagogiques */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Objectifs pédagogiques de la formation
              </h4>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <ul className="space-y-2">
                  {data.objectifs.map((objectif, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-brand-500 mt-1">•</span>
                      {objectif}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Contenu de la formation */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contenu de la formation
              </h4>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                  {data.contenu}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Boutons navigation */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors shadow-sm"
        >
          Générer les slides & le support
        </button>
      </div>
    </div>
  );
};

export default StepFichePedagogique;
