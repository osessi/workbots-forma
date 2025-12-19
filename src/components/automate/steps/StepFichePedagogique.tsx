"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

// Icons
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 2.25L15.75 4.5M1.5 16.5L2.25 13.5L12.75 3L15 5.25L4.5 15.75L1.5 16.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2.25" y="2.25" width="13.5" height="13.5" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="6.375" cy="6.375" r="1.125" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2.25 12.75L5.625 9.375C6.03921 8.96079 6.71079 8.96079 7.125 9.375L11.25 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.125 12.375L11.625 10.875C12.0392 10.4608 12.7108 10.4608 13.125 10.875L15.75 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8.25" cy="8.25" r="5.25" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12.375 12.375L15.75 15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
  imageUrl?: string;
}

interface ImageResult {
  id: string;
  url: string;
  thumbnail: string;
  alt: string;
  credit: string;
  creditUrl: string;
  source: "unsplash" | "picsum";
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
  const [isDownloading, setIsDownloading] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Etats pour la recherche d'image
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [imageQuery, setImageQuery] = useState("");
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);
  const [isSearchingImages, setIsSearchingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(data.imageUrl || null);

  // Rechercher des images
  const handleSearchImages = async () => {
    if (!imageQuery.trim()) return;

    setIsSearchingImages(true);
    try {
      const response = await fetch("/api/ai/search-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: imageQuery, count: 6 }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la recherche d'images");
      }

      const result = await response.json();
      if (result.success && result.data?.images) {
        setImageResults(result.data.images);
      }
    } catch (error) {
      console.error("Erreur recherche images:", error);
    } finally {
      setIsSearchingImages(false);
    }
  };

  // Selectionner une image
  const handleSelectImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    onChange({ ...data, imageUrl });
    setShowImageSearch(false);
  };

  // Rechercher automatiquement des images basees sur le titre
  const handleAutoSearchImages = async () => {
    if (!data.titre) return;

    // Extraire les mots cles du titre pour la recherche
    const searchQuery = data.titre
      .replace(/Module \d+ –/gi, "")
      .replace(/Formation/gi, "")
      .trim()
      .slice(0, 50);

    setImageQuery(searchQuery);
    setShowImageSearch(true);

    setIsSearchingImages(true);
    try {
      const response = await fetch("/api/ai/search-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, count: 6 }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la recherche d'images");
      }

      const result = await response.json();
      if (result.success && result.data?.images) {
        setImageResults(result.data.images);
      }
    } catch (error) {
      console.error("Erreur recherche images:", error);
    } finally {
      setIsSearchingImages(false);
    }
  };

  // Fonction de telechargement PDF via API print
  const handleDownloadPDF = async () => {
    setIsDownloading(true);

    // Creer une fenetre d'impression stylisee
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${data.titre} - Fiche Pedagogique</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
          }
          h1 { color: #1a1a2e; font-size: 28px; margin-bottom: 20px; border-bottom: 3px solid #6366f1; padding-bottom: 10px; }
          h2 { color: #4338ca; font-size: 18px; margin-top: 30px; margin-bottom: 10px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .info-item { background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #6366f1; }
          .info-label { font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
          .info-value { color: #1e293b; }
          ul { padding-left: 20px; }
          li { margin-bottom: 8px; }
          .section { margin-bottom: 25px; padding: 20px; background: #fafafa; border-radius: 8px; }
          .section-title { font-weight: 600; color: #4338ca; margin-bottom: 10px; }
          @media print {
            body { padding: 20px; }
            .section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>${data.titre}</h1>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Modalite</div>
            <div class="info-value">${data.typeFormation || 'Non defini'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Duree</div>
            <div class="info-value">${data.duree || 'Non defini'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Participants max</div>
            <div class="info-value">${data.nombreParticipants || 'Non defini'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Tarif</div>
            <div class="info-value">${data.tarif || 'Non defini'}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Description</div>
          <p>${data.description || 'Aucune description'}</p>
        </div>

        <div class="section">
          <div class="section-title">Objectifs pedagogiques</div>
          <ul>
            ${data.objectifs.map(obj => `<li>${obj}</li>`).join('')}
          </ul>
        </div>

        ${data.prerequis ? `
        <div class="section">
          <div class="section-title">Prerequis</div>
          <ul>
            ${data.prerequis.split('\n').filter(p => p.trim()).map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        ${data.publicVise ? `
        <div class="section">
          <div class="section-title">Public vise</div>
          <ul>
            ${data.publicVise.split('\n').filter(p => p.trim()).map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Contenu de la formation</div>
          <div style="white-space: pre-line;">${data.contenu || 'Aucun contenu'}</div>
        </div>

        ${data.suiviEvaluation ? `
        <div class="section">
          <div class="section-title">Suivi et evaluation</div>
          <ul>
            ${data.suiviEvaluation.split('\n').filter(s => s.trim()).map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        ${data.ressourcesPedagogiques ? `
        <div class="section">
          <div class="section-title">Ressources pedagogiques</div>
          <ul>
            ${data.ressourcesPedagogiques.split('\n').filter(r => r.trim()).map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        ${data.accessibilite ? `
        <div class="section">
          <div class="section-title">Accessibilite</div>
          <p>${data.accessibilite}</p>
        </div>
        ` : ''}

        ${data.delaiAcces ? `
        <div class="section">
          <div class="section-title">Delai d'acces</div>
          <p>${data.delaiAcces}</p>
        </div>
        ` : ''}
      </body>
      </html>
    `;

    // Ouvrir une nouvelle fenetre avec le contenu
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Attendre que le contenu soit charge puis lancer l'impression
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          setIsDownloading(false);
        }, 250);
      };

      // Fallback si onload ne se declenche pas
      setTimeout(() => {
        setIsDownloading(false);
      }, 2000);
    } else {
      alert("Veuillez autoriser les popups pour telecharger le PDF");
      setIsDownloading(false);
    }
  };

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
            <div className="relative">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                {selectedImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedImage}
                    alt={data.titre || "Formation"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-100 to-purple-100 dark:from-brand-900/30 dark:to-purple-900/30 flex items-center justify-center">
                    <div className="text-center text-gray-400 dark:text-gray-500">
                      <ImageIcon />
                      <p className="text-sm mt-2">Aucune image selectionnee</p>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={handleAutoSearchImages}
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-black/50 backdrop-blur-sm rounded-lg hover:bg-black/70 transition-colors"
              >
                <ImageIcon />
                <span>Changer l&apos;image</span>
              </button>
            </div>

            {/* Modal de recherche d'image */}
            {showImageSearch && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Rechercher une image
                  </h4>
                  <button
                    onClick={() => setShowImageSearch(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageQuery}
                    onChange={(e) => setImageQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchImages()}
                    placeholder="Ex: ecriture, formation, bureau..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    onClick={handleSearchImages}
                    disabled={isSearchingImages || !imageQuery.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSearchingImages ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <SearchIcon />
                    )}
                  </button>
                </div>

                {imageResults.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {imageResults.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => handleSelectImage(img.url)}
                        className="relative aspect-video overflow-hidden rounded-lg border-2 border-transparent hover:border-brand-500 transition-colors"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.thumbnail}
                          alt={img.alt}
                          className="w-full h-full object-cover"
                        />
                        {selectedImage === img.url && (
                          <div className="absolute inset-0 bg-brand-500/30 flex items-center justify-center">
                            <CheckIcon />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {imageResults.length > 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                    Images libres de droits
                  </p>
                )}
              </div>
            )}

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
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors dark:bg-brand-500/10 dark:text-brand-400 disabled:opacity-50"
                >
                  {isDownloading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                  ) : (
                    <DownloadIcon />
                  )}
                  {isDownloading ? 'Preparation...' : 'Telecharger en PDF'}
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
