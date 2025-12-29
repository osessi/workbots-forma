"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

// Types
interface OrganigrammePoste {
  id: string;
  type: "DIRIGEANT" | "REFERENT_HANDICAP" | "REFERENT_PEDAGOGIQUE" | "REFERENT_QUALITE" | "FORMATEUR" | "ADMINISTRATIF" | "AUTRE";
  titre: string;
  nom: string;
  prenom: string;
  email?: string | null;
  telephone?: string | null;
  photo?: string | null;
  description?: string | null;
  intervenantId?: string | null;
  niveau: number;
  ordre: number;
  parentId?: string | null;
  isVisible: boolean;
  intervenant?: {
    id: string;
    nom: string;
    prenom: string;
    email?: string | null;
    telephone?: string | null;
    fonction?: string | null;
  } | null;
  parent?: {
    id: string;
    titre: string;
    nom: string;
    prenom: string;
  } | null;
  children?: OrganigrammePoste[];
}

interface Intervenant {
  id: string;
  nom: string;
  prenom: string;
  email?: string | null;
  telephone?: string | null;
  fonction?: string | null;
}

interface OrganizationInfo {
  representantNom?: string | null;
  representantPrenom?: string | null;
  representantFonction?: string | null;
  email?: string | null;
  telephone?: string | null;
}

// Couleurs par type de poste
const POSTE_COLORS: Record<OrganigrammePoste["type"], { bg: string; border: string; text: string; icon: string; gradient: string }> = {
  DIRIGEANT: { bg: "bg-purple-50 dark:bg-purple-900/30", border: "border-purple-300 dark:border-purple-600", text: "text-purple-700 dark:text-purple-300", icon: "bg-purple-500", gradient: "from-purple-500 to-purple-600" },
  REFERENT_HANDICAP: { bg: "bg-blue-50 dark:bg-blue-900/30", border: "border-blue-300 dark:border-blue-600", text: "text-blue-700 dark:text-blue-300", icon: "bg-blue-500", gradient: "from-blue-500 to-blue-600" },
  REFERENT_PEDAGOGIQUE: { bg: "bg-green-50 dark:bg-green-900/30", border: "border-green-300 dark:border-green-600", text: "text-green-700 dark:text-green-300", icon: "bg-green-500", gradient: "from-green-500 to-green-600" },
  REFERENT_QUALITE: { bg: "bg-amber-50 dark:bg-amber-900/30", border: "border-amber-300 dark:border-amber-600", text: "text-amber-700 dark:text-amber-300", icon: "bg-amber-500", gradient: "from-amber-500 to-amber-600" },
  FORMATEUR: { bg: "bg-cyan-50 dark:bg-cyan-900/30", border: "border-cyan-300 dark:border-cyan-600", text: "text-cyan-700 dark:text-cyan-300", icon: "bg-cyan-500", gradient: "from-cyan-500 to-cyan-600" },
  ADMINISTRATIF: { bg: "bg-gray-50 dark:bg-gray-800", border: "border-gray-300 dark:border-gray-600", text: "text-gray-700 dark:text-gray-300", icon: "bg-gray-500", gradient: "from-gray-500 to-gray-600" },
  AUTRE: { bg: "bg-slate-50 dark:bg-slate-800", border: "border-slate-300 dark:border-slate-600", text: "text-slate-700 dark:text-slate-300", icon: "bg-slate-500", gradient: "from-slate-500 to-slate-600" },
};

const POSTE_LABELS: Record<OrganigrammePoste["type"], string> = {
  DIRIGEANT: "Dirigeant / Gerant",
  REFERENT_HANDICAP: "Referent Handicap",
  REFERENT_PEDAGOGIQUE: "Referent Pedagogique",
  REFERENT_QUALITE: "Referent Qualite",
  FORMATEUR: "Formateur",
  ADMINISTRATIF: "Administratif",
  AUTRE: "Autre",
};

// Icons
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 4v12M4 10h12" strokeLinecap="round" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GripIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="6" r="1.5" />
    <circle cx="15" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" />
    <circle cx="15" cy="18" r="1.5" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Modal de creation/edition
interface PosteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<OrganigrammePoste>) => void;
  poste?: OrganigrammePoste | null;
  intervenants: Intervenant[];
  postes: OrganigrammePoste[];
  organizationInfo?: OrganizationInfo;
  organizationId: string;
  isLoading?: boolean;
}

function PosteModal({ isOpen, onClose, onSave, poste, intervenants, postes, organizationInfo, organizationId, isLoading }: PosteModalProps) {
  const [formData, setFormData] = useState({
    type: poste?.type || "AUTRE" as OrganigrammePoste["type"],
    titre: poste?.titre || "",
    nom: poste?.nom || "",
    prenom: poste?.prenom || "",
    email: poste?.email || "",
    telephone: poste?.telephone || "",
    description: poste?.description || "",
    intervenantId: poste?.intervenantId || "",
    parentId: poste?.parentId || "",
    niveau: poste?.niveau ?? 0,
    isVisible: poste?.isVisible !== false,
    photo: poste?.photo || "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (poste) {
      setFormData({
        type: poste.type,
        titre: poste.titre,
        nom: poste.nom,
        prenom: poste.prenom,
        email: poste.email || "",
        telephone: poste.telephone || "",
        description: poste.description || "",
        intervenantId: poste.intervenantId || "",
        parentId: poste.parentId || "",
        niveau: poste.niveau,
        isVisible: poste.isVisible !== false,
        photo: poste.photo || "",
      });
    } else {
      // Pour un nouveau poste, pre-remplir le dirigeant si pas de postes
      if (postes.length === 0 && organizationInfo?.representantNom) {
        setFormData(prev => ({
          ...prev,
          type: "DIRIGEANT",
          titre: organizationInfo.representantFonction || "Dirigeant",
          nom: organizationInfo.representantNom || "",
          prenom: organizationInfo.representantPrenom || "",
          email: organizationInfo.email || "",
          telephone: organizationInfo.telephone || "",
          niveau: 0,
          photo: "",
        }));
      } else {
        // Calculer le niveau par defaut (niveau max + 1 ou 0)
        const maxLevel = postes.length > 0 ? Math.max(...postes.map(p => p.niveau)) : -1;
        setFormData({
          type: "AUTRE",
          titre: "",
          nom: "",
          prenom: "",
          email: "",
          telephone: "",
          description: "",
          intervenantId: "",
          parentId: "",
          niveau: Math.min(maxLevel + 1, 4),
          isVisible: true,
          photo: "",
        });
      }
    }
    setUploadError(null);
  }, [poste, postes.length, organizationInfo]);

  // Upload de la photo via API serveur (bypass RLS)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith("image/")) {
      setUploadError("Veuillez selectionner une image (JPG, PNG, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("L'image ne doit pas depasser 5 Mo");
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      // Utiliser l'API serveur pour bypasser RLS
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("type", "organigramme-photo");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur upload");
      }

      setFormData(prev => ({ ...prev, photo: result.url }));
    } catch (error) {
      console.error("Erreur upload photo:", error);
      setUploadError(error instanceof Error ? error.message : "Erreur lors de l'upload de la photo");
    } finally {
      setIsUploading(false);
    }
  };

  // Supprimer la photo
  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, photo: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Auto-remplir depuis intervenant
  const handleIntervenantChange = (intervenantId: string) => {
    setFormData(prev => ({ ...prev, intervenantId }));
    if (intervenantId) {
      const intervenant = intervenants.find(i => i.id === intervenantId);
      if (intervenant) {
        setFormData(prev => ({
          ...prev,
          nom: intervenant.nom,
          prenom: intervenant.prenom,
          email: intervenant.email || "",
          telephone: intervenant.telephone || "",
          titre: intervenant.fonction || prev.titre,
        }));
      }
    }
  };

  // Titre auto selon le type
  const handleTypeChange = (type: OrganigrammePoste["type"]) => {
    // Auto-determiner le niveau selon le type
    let autoNiveau = formData.niveau;
    if (type === "DIRIGEANT") autoNiveau = 0;
    else if (type === "REFERENT_HANDICAP" || type === "REFERENT_PEDAGOGIQUE" || type === "REFERENT_QUALITE") autoNiveau = 1;
    else if (type === "FORMATEUR" || type === "ADMINISTRATIF") autoNiveau = 2;
    else autoNiveau = 3;

    setFormData(prev => ({
      ...prev,
      type,
      titre: prev.titre || POSTE_LABELS[type],
      niveau: autoNiveau,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      intervenantId: formData.intervenantId || null,
      parentId: formData.parentId || null,
      photo: formData.photo || null,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {poste ? "Modifier le poste" : "Ajouter un poste"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type de poste */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Type de poste *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value as OrganigrammePoste["type"])}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
            >
              {Object.entries(POSTE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Niveau hierarchique */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Niveau hierarchique (0 = sommet de la pyramide)
            </label>
            <select
              value={formData.niveau}
              onChange={(e) => setFormData(prev => ({ ...prev, niveau: parseInt(e.target.value) }))}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
            >
              <option value={0}>Niveau 0 - Direction (sommet)</option>
              <option value={1}>Niveau 1 - Referents / Responsables</option>
              <option value={2}>Niveau 2 - Equipe operationnelle</option>
              <option value={3}>Niveau 3 - Support / Autres</option>
            </select>
          </div>

          {/* Titre du poste */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Titre du poste *
            </label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
              placeholder="Ex: Directeur General, Referent Handicap..."
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
              required
            />
          </div>

          {/* Photo de profil */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Photo de profil
            </label>
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="relative">
                {formData.photo ? (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                    <Image
                      src={formData.photo}
                      alt="Photo de profil"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <XIcon />
                    </button>
                  </div>
                ) : (
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br ${POSTE_COLORS[formData.type].gradient} text-white text-2xl font-bold`}>
                    {formData.prenom.charAt(0) || "?"}{formData.nom.charAt(0) || "?"}
                  </div>
                )}
              </div>

              {/* Upload button */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                    isUploading
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      Upload en cours...
                    </>
                  ) : (
                    <>
                      <CameraIcon />
                      {formData.photo ? "Changer la photo" : "Ajouter une photo"}
                    </>
                  )}
                </label>
                <p className="text-xs text-gray-500 mt-1.5">JPG, PNG. Max 5 Mo.</p>
                {uploadError && (
                  <p className="text-xs text-red-500 mt-1">{uploadError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Lier a un intervenant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Lier a un intervenant (optionnel)
            </label>
            <select
              value={formData.intervenantId}
              onChange={(e) => handleIntervenantChange(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
            >
              <option value="">-- Aucun --</option>
              {intervenants.map(i => (
                <option key={i.id} value={i.id}>{i.prenom} {i.nom} {i.fonction ? `(${i.fonction})` : ""}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Les informations seront pre-remplies depuis l&apos;intervenant</p>
          </div>

          {/* Nom / Prenom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nom *
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                placeholder="DUPONT"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Prenom *
              </label>
              <input
                type="text"
                value={formData.prenom}
                onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                placeholder="Jean"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                required
              />
            </div>
          </div>

          {/* Email / Telephone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemple.com"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Telephone
              </label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                placeholder="01 23 45 67 89"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
              />
            </div>
          </div>

          {/* Visibilite */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isVisible"
              checked={formData.isVisible}
              onChange={(e) => setFormData(prev => ({ ...prev, isVisible: e.target.checked }))}
              className="w-4 h-4 text-brand-600 bg-white border-gray-300 rounded focus:ring-brand-500"
            />
            <label htmlFor="isVisible" className="text-sm text-gray-700 dark:text-gray-300">
              Visible dans l&apos;organigramme public (espace apprenant)
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50"
            >
              {isLoading ? "Enregistrement..." : poste ? "Modifier" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Carte de poste pyramidale
interface PyramidCardProps {
  poste: OrganigrammePoste;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isFirst?: boolean;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

function PyramidCard({ poste, onEdit, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown, isFirst, isDragging, dragHandleProps }: PyramidCardProps) {
  const colors = POSTE_COLORS[poste.type];

  return (
    <div
      className={`
        relative group transition-all duration-200
        ${isDragging ? "opacity-50 scale-105" : ""}
      `}
    >
      {/* Carte principale */}
      <div className={`
        relative overflow-hidden rounded-2xl border-2 ${colors.border} ${colors.bg}
        shadow-lg hover:shadow-xl transition-all duration-300
        min-w-[180px] max-w-[220px]
      `}>
        {/* Gradient header */}
        <div className={`h-2 bg-gradient-to-r ${colors.gradient}`} />

        {/* Contenu */}
        <div className="p-4">
          {/* Avatar */}
          <div className="flex justify-center mb-3">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center
              bg-gradient-to-br ${colors.gradient} text-white shadow-lg
              ring-4 ring-white dark:ring-gray-800
            `}>
              {poste.photo ? (
                <Image
                  src={poste.photo}
                  alt={`${poste.prenom} ${poste.nom}`}
                  width={64}
                  height={64}
                  className="rounded-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold">
                  {poste.prenom.charAt(0)}{poste.nom.charAt(0)}
                </span>
              )}
            </div>
          </div>

          {/* Badge type */}
          <div className="flex justify-center mb-2">
            <span className={`
              inline-flex items-center px-2.5 py-0.5 rounded-full
              text-[10px] font-semibold uppercase tracking-wide
              bg-white dark:bg-gray-800 ${colors.text} shadow-sm
            `}>
              {POSTE_LABELS[poste.type].split(" / ")[0]}
            </span>
          </div>

          {/* Nom */}
          <h4 className="text-center font-bold text-gray-900 dark:text-white text-sm">
            {poste.prenom} {poste.nom}
          </h4>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {poste.titre}
          </p>

          {/* Email */}
          {poste.email && (
            <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 mt-2 truncate">
              {poste.email}
            </p>
          )}

          {/* Indicateur masque */}
          {!poste.isVisible && (
            <div className="absolute top-3 right-3">
              <span className="text-[9px] text-gray-400 italic bg-white/80 dark:bg-gray-800/80 px-1.5 py-0.5 rounded">
                Masque
              </span>
            </div>
          )}
        </div>

        {/* Actions au hover */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pt-8 pb-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-center gap-1">
            {/* Drag handle */}
            <div
              {...dragHandleProps}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
              title="Deplacer"
            >
              <GripIcon />
            </div>

            {/* Move up/down */}
            <button
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Monter d'un niveau"
            >
              <ChevronUpIcon />
            </button>
            <button
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Descendre d'un niveau"
            >
              <ChevronDownIcon />
            </button>

            {/* Edit */}
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg bg-brand-100 dark:bg-brand-900/30 text-brand-600 hover:bg-brand-200"
              title="Modifier"
            >
              <EditIcon />
            </button>

            {/* Delete */}
            {!isFirst && (
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200"
                title="Supprimer"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant principal
export default function OrganigrammeTab() {
  const [postes, setPostes] = useState<OrganigrammePoste[]>([]);
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfo>({});
  const [organizationId, setOrganizationId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pyramidRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPoste, setEditingPoste] = useState<OrganigrammePoste | null>(null);

  // Charger les donnees
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [orgRes, intRes] = await Promise.all([
        fetch("/api/settings/organigramme"),
        fetch("/api/donnees/intervenants"),
      ]);

      if (orgRes.ok) {
        const data = await orgRes.json();
        setPostes(data.postes || []);
        setOrganizationInfo(data.organization || {});
        // Recuperer l'organizationId depuis le premier poste ou depuis l'API
        if (data.postes?.[0]?.organizationId) {
          setOrganizationId(data.postes[0].organizationId);
        } else if (data.organizationId) {
          setOrganizationId(data.organizationId);
        }
      }

      if (intRes.ok) {
        const data = await intRes.json();
        setIntervenants(data || []);
      }
    } catch (err) {
      console.error("Erreur chargement organigramme:", err);
      setError("Erreur lors du chargement de l'organigramme");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Creer ou modifier un poste
  const handleSavePoste = async (data: Partial<OrganigrammePoste>) => {
    try {
      setIsSaving(true);
      const url = editingPoste
        ? `/api/settings/organigramme/${editingPoste.id}`
        : "/api/settings/organigramme";
      const method = editingPoste ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadData();
        setIsModalOpen(false);
        setEditingPoste(null);
      } else {
        const resData = await response.json();
        setError(resData.error || "Erreur lors de l'enregistrement");
      }
    } catch (err) {
      console.error("Erreur sauvegarde poste:", err);
      setError("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  // Supprimer un poste
  const handleDeletePoste = async (id: string) => {
    if (!confirm("Supprimer ce poste de l'organigramme ?")) return;

    try {
      const response = await fetch(`/api/settings/organigramme/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadData();
      } else {
        const data = await response.json();
        setError(data.error || "Erreur lors de la suppression");
      }
    } catch (err) {
      console.error("Erreur suppression poste:", err);
      setError("Erreur lors de la suppression");
    }
  };

  // Deplacer un poste (changer de niveau)
  const handleMovePoste = async (posteId: string, direction: "up" | "down") => {
    const poste = postes.find(p => p.id === posteId);
    if (!poste) return;

    const newNiveau = direction === "up" ? poste.niveau - 1 : poste.niveau + 1;
    if (newNiveau < 0 || newNiveau > 3) return;

    try {
      const response = await fetch(`/api/settings/organigramme/${posteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...poste, niveau: newNiveau }),
      });

      if (response.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Erreur deplacement poste:", err);
    }
  };

  // Export PDF pyramide
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const postesByLevel = postes.reduce((acc, poste) => {
      const level = poste.niveau || 0;
      if (!acc[level]) acc[level] = [];
      acc[level].push(poste);
      return acc;
    }, {} as Record<number, OrganigrammePoste[]>);

    const levels = Object.keys(postesByLevel).map(Number).sort((a, b) => a - b);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Organigramme</title>
        <style>
          @page { size: A4 landscape; margin: 20mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            padding: 40px;
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ed 100%);
            min-height: 100vh;
          }
          h1 {
            text-align: center;
            margin-bottom: 50px;
            color: #1a1a2e;
            font-size: 28px;
            font-weight: 700;
          }
          .pyramid {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 30px;
          }
          .level {
            display: flex;
            justify-content: center;
            gap: 20px;
            position: relative;
          }
          .level::before {
            content: '';
            position: absolute;
            top: -15px;
            left: 50%;
            transform: translateX(-50%);
            width: 2px;
            height: 15px;
            background: #cbd5e1;
          }
          .level:first-child::before { display: none; }
          .card {
            background: white;
            border-radius: 16px;
            padding: 20px;
            text-align: center;
            min-width: 160px;
            max-width: 200px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
          }
          .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
          }
          .card.DIRIGEANT::before { background: linear-gradient(90deg, #9333ea, #a855f7); }
          .card.REFERENT_HANDICAP::before { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
          .card.REFERENT_PEDAGOGIQUE::before { background: linear-gradient(90deg, #22c55e, #4ade80); }
          .card.REFERENT_QUALITE::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
          .card.FORMATEUR::before { background: linear-gradient(90deg, #06b6d4, #22d3ee); }
          .card.ADMINISTRATIF::before, .card.AUTRE::before { background: linear-gradient(90deg, #64748b, #94a3b8); }
          .avatar {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            margin: 0 auto 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 18px;
            overflow: hidden;
          }
          .avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .avatar.DIRIGEANT { background: linear-gradient(135deg, #9333ea, #a855f7); }
          .avatar.REFERENT_HANDICAP { background: linear-gradient(135deg, #3b82f6, #60a5fa); }
          .avatar.REFERENT_PEDAGOGIQUE { background: linear-gradient(135deg, #22c55e, #4ade80); }
          .avatar.REFERENT_QUALITE { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
          .avatar.FORMATEUR { background: linear-gradient(135deg, #06b6d4, #22d3ee); }
          .avatar.ADMINISTRATIF, .avatar.AUTRE { background: linear-gradient(135deg, #64748b, #94a3b8); }
          .badge {
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 3px 8px;
            border-radius: 10px;
            margin-bottom: 8px;
            display: inline-block;
          }
          .badge.DIRIGEANT { background: #faf5ff; color: #9333ea; }
          .badge.REFERENT_HANDICAP { background: #eff6ff; color: #3b82f6; }
          .badge.REFERENT_PEDAGOGIQUE { background: #f0fdf4; color: #22c55e; }
          .badge.REFERENT_QUALITE { background: #fffbeb; color: #f59e0b; }
          .badge.FORMATEUR { background: #ecfeff; color: #06b6d4; }
          .badge.ADMINISTRATIF, .badge.AUTRE { background: #f1f5f9; color: #64748b; }
          .name { font-weight: 700; font-size: 14px; color: #1a1a2e; }
          .title { font-size: 11px; color: #64748b; margin-top: 4px; }
          .contact { font-size: 10px; color: #94a3b8; margin-top: 8px; }
          .footer {
            text-align: center;
            margin-top: 50px;
            font-size: 10px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <h1>Organigramme</h1>
        <div class="pyramid">
          ${levels.map(niveau => {
            const levelPostes = postesByLevel[niveau].sort((a, b) => a.ordre - b.ordre);
            return `
              <div class="level">
                ${levelPostes.map(p => `
                  <div class="card ${p.type}">
                    <div class="avatar ${p.type}">
                      ${p.photo ? `<img src="${p.photo}" alt="${p.prenom} ${p.nom}" />` : `${p.prenom.charAt(0)}${p.nom.charAt(0)}`}
                    </div>
                    <div class="badge ${p.type}">${POSTE_LABELS[p.type].split(" / ")[0]}</div>
                    <div class="name">${p.prenom} ${p.nom}</div>
                    <div class="title">${p.titre}</div>
                    ${p.email ? `<div class="contact">${p.email}</div>` : ""}
                  </div>
                `).join("")}
              </div>
            `;
          }).join("")}
        </div>
        <div class="footer">
          Document genere le ${new Date().toLocaleDateString("fr-FR")}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  // Ouvrir modal creation
  const openCreateModal = () => {
    setEditingPoste(null);
    setIsModalOpen(true);
  };

  // Ouvrir modal edition
  const openEditModal = (poste: OrganigrammePoste) => {
    setEditingPoste(poste);
    setIsModalOpen(true);
  };

  // Organiser les postes par niveau pour l'affichage pyramidal
  const postesByLevel = postes.reduce((acc, poste) => {
    const level = poste.niveau || 0;
    if (!acc[level]) acc[level] = [];
    acc[level].push(poste);
    return acc;
  }, {} as Record<number, OrganigrammePoste[]>);

  const levels = Object.keys(postesByLevel).map(Number).sort((a, b) => a - b);

  const LEVEL_LABELS = ["Direction", "Referents / Responsables", "Equipe operationnelle", "Support / Autres"];

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Organigramme de l&apos;organisme
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Structurez votre equipe en pyramide. Utilisez les fleches pour deplacer les postes entre les niveaux.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            disabled={postes.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
          >
            <DownloadIcon />
            Export PDF
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
          >
            <PlusIcon />
            Ajouter un poste
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Fermer</button>
        </div>
      )}

      {/* Chargement */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      ) : postes.length === 0 ? (
        /* Etat vide */
        <div className="p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/30 dark:to-brand-800/30 flex items-center justify-center text-brand-500">
            <UserIcon />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Construisez votre organigramme
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Commencez par ajouter le dirigeant au sommet de la pyramide, puis ajoutez les referents et l&apos;equipe.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 shadow-lg shadow-brand-500/25"
          >
            <PlusIcon />
            Ajouter le dirigeant
          </button>
        </div>
      ) : (
        /* Affichage pyramidal */
        <div
          ref={pyramidRef}
          className="relative p-8 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl overflow-hidden"
        >
          {/* Background decoratif */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-brand-200/20 to-transparent rounded-full" />
          </div>

          {/* Pyramide */}
          <div className="relative space-y-8">
            {levels.map((level, levelIndex) => {
              const levelPostes = postesByLevel[level].sort((a, b) => a.ordre - b.ordre);

              return (
                <div key={level} className="relative">
                  {/* Connecteur vertical */}
                  {levelIndex > 0 && (
                    <div className="absolute left-1/2 -top-4 w-0.5 h-4 bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500" />
                  )}

                  {/* Label du niveau */}
                  <div className="flex justify-center mb-3">
                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      {LEVEL_LABELS[level] || `Niveau ${level}`}
                    </span>
                  </div>

                  {/* Cartes du niveau */}
                  <div className="flex flex-wrap justify-center gap-4">
                    {levelPostes.map((poste, index) => (
                      <PyramidCard
                        key={poste.id}
                        poste={poste}
                        onEdit={() => openEditModal(poste)}
                        onDelete={() => handleDeletePoste(poste.id)}
                        onMoveUp={() => handleMovePoste(poste.id, "up")}
                        onMoveDown={() => handleMovePoste(poste.id, "down")}
                        canMoveUp={level > 0}
                        canMoveDown={level < 3}
                        isFirst={level === 0 && levelPostes.length === 1 && index === 0}
                      />
                    ))}
                  </div>

                  {/* Lignes horizontales de connexion */}
                  {levelPostes.length > 1 && levelIndex < levels.length - 1 && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full">
                      <div className="h-0.5 bg-gray-300 dark:bg-gray-600" style={{ width: `${(levelPostes.length - 1) * 200}px`, marginLeft: `-${((levelPostes.length - 1) * 200) / 2}px` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bouton ajouter dans un niveau vide */}
          {levels.length > 0 && levels.length < 4 && (
            <div className="flex justify-center mt-8">
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-brand-400 hover:text-brand-600 transition-colors"
              >
                <PlusIcon />
                Ajouter un poste
              </button>
            </div>
          )}
        </div>
      )}

      {/* Qualiopi Info */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          <strong>Qualiopi IND 9 :</strong> L&apos;organigramme doit presenter clairement les responsables cles de l&apos;organisme,
          notamment le <strong>referent handicap</strong> (obligatoire) et le <strong>responsable pedagogique</strong>. Ces informations sont accessibles aux apprenants
          depuis leur espace dedie.
        </p>
      </div>

      {/* Modal */}
      <PosteModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingPoste(null); }}
        onSave={handleSavePoste}
        poste={editingPoste}
        intervenants={intervenants}
        postes={postes}
        organizationInfo={organizationInfo}
        organizationId={organizationId}
        isLoading={isSaving}
      />
    </div>
  );
}
