"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

// Icons
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  prerequis: string;
  publicVise: string;
  suiviEvaluation: string;
  ressourcesPedagogiques: string;
  delaiAcces: string;
}

interface StepFichePedagogiqueProps {
  data: FichePedagogiqueData;
  onChange: (data: FichePedagogiqueData) => void;
  onNext: () => void;
  onPrevious: () => void;
}

// Composant pour les blocs éditables avec stylo
interface EditableBlockProps {
  title: string;
  value: string;
  fieldName: keyof FichePedagogiqueData;
  onChange: (field: keyof FichePedagogiqueData, value: string) => void;
  isList?: boolean;
}

const EditableBlock: React.FC<EditableBlockProps> = ({ title, value, fieldName, onChange, isList = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [isEditing]);

  useEffect(() => {
    setEditedValue(value);
  }, [value]);

  const handleSave = () => {
    onChange(fieldName, editedValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedValue(value);
    setIsEditing(false);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedValue(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const renderContent = () => {
    if (isList && value) {
      const items = value.split("\n").filter(item => item.trim());
      return (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="text-brand-500 mt-0.5 flex-shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    }
    return (
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
        {value}
      </p>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </h4>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors dark:hover:text-brand-400 dark:hover:bg-brand-500/10"
            title="Modifier"
          >
            <EditIcon />
          </button>
        )}
      </div>
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              ref={textareaRef}
              value={editedValue}
              onChange={handleTextareaChange}
              className="w-full px-3 py-2 text-sm border border-brand-300 rounded-lg bg-white text-gray-800 dark:bg-gray-900 dark:text-white dark:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none min-h-[100px]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-sm text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

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

  const handleFieldChange = (field: keyof FichePedagogiqueData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonne gauche - Image et infos basiques (sticky) */}
          <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            {/* Image de la formation */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              <Image
                src="/images/cards/card-01.png"
                alt="Formation"
                fill
                className="object-cover"
              />
            </div>

            {/* Modalité de la formation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Modalité de la formation
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

            {/* Nombre maximum de participants par session */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre maximum de participants par session
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

            {/* Accessibilité - Bloc éditable */}
            <EditableBlock
              title="Accessibilité"
              value={data.accessibilite}
              fieldName="accessibilite"
              onChange={handleFieldChange}
            />
          </div>

          {/* Colonne droite - Détails de la fiche */}
          <div className="space-y-5">
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
                      <span className="text-brand-500 mt-0.5 flex-shrink-0">•</span>
                      <span>{objectif}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Prérequis - Bloc éditable */}
            <EditableBlock
              title="Prérequis"
              value={data.prerequis}
              fieldName="prerequis"
              onChange={handleFieldChange}
              isList
            />

            {/* Public visé - Bloc éditable */}
            <EditableBlock
              title="Public visé"
              value={data.publicVise}
              fieldName="publicVise"
              onChange={handleFieldChange}
              isList
            />

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

            {/* Suivi de l'exécution et évaluation des résultats - Bloc éditable */}
            <EditableBlock
              title="Suivi de l'exécution et évaluation des résultats"
              value={data.suiviEvaluation}
              fieldName="suiviEvaluation"
              onChange={handleFieldChange}
              isList
            />

            {/* Ressources pédagogiques - Bloc éditable */}
            <EditableBlock
              title="Ressources pédagogiques"
              value={data.ressourcesPedagogiques}
              fieldName="ressourcesPedagogiques"
              onChange={handleFieldChange}
              isList
            />

            {/* Délai d'accès - Bloc éditable */}
            <EditableBlock
              title="Délai d'accès"
              value={data.delaiAcces}
              fieldName="delaiAcces"
              onChange={handleFieldChange}
            />
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
