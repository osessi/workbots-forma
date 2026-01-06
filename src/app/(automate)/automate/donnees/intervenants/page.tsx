"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  UserCheck,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Mail,
  Phone,
  Building2,
  Loader2,
  Tag,
  Upload,
  GraduationCap,
  FileText,
  Clock,
  Award,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";

// Liste des spécialités prédéfinies
const SPECIALITES_SUGGESTIONS = [
  "Commerce & Vente",
  "Marketing & Communication",
  "Management & Leadership",
  "Ressources Humaines & Recrutement",
  "Ingénierie pédagogique & Formation de formateurs",
  "Gestion d'entreprise & Entrepreneuriat",
  "Bureautique & Outils collaboratifs",
  "Gestion de projet",
  "Digital & Web (SEO / Ads / Réseaux sociaux)",
  "Intelligence Artificielle & Automatisation",
  "Informatique & Cybersécurité",
  "Finance",
  "Comptabilité & Paie",
  "Relation client",
  "Développement personnel",
  "Santé",
  "Sécurité & Prévention",
  "Bien-être",
  "Nutrition & Santé",
  "Sport & Coaching",
  "Immobilier",
  "Assurance & Banque",
  "Hôtellerie",
  "Restauration & Tourisme",
  "Accueil, Secrétariat & Administratif",
  "Industrie",
];

interface Diplome {
  id: string;
  intitule: string;
  organisme: string | null;
  anneeObtention: number | null;
  niveau: string | null;
  fichierUrl: string | null;
}

interface Intervenant {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  fonction: string | null;
  specialites: string[];
  structure: string | null;
  structureSiret: string | null;
  notes: string | null;
  // Nouveaux champs Qualiopi IND 17
  photoUrl: string | null;
  cv: string | null;
  biographie: string | null;
  anneesExperience: number | null;
  numeroDeclarationActivite: string | null;
  diplomes: Diplome[];
}

// Composant pour afficher un diplôme avec gestion du justificatif PDF
function DiplomeItem({
  diplome,
  intervenantId,
  onDelete,
  isDeleting,
  onFileUpdated,
}: {
  diplome: Diplome;
  intervenantId: string;
  onDelete: () => void;
  isDeleting: boolean;
  onFileUpdated: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `/api/donnees/intervenants/${intervenantId}/diplomes/${diplome.id}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      onFileUpdated(data.url);
    } catch (error) {
      console.error("Erreur upload justificatif:", error);
      alert(error instanceof Error ? error.message : "Erreur lors de l'upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteFile = async () => {
    if (!confirm("Supprimer le justificatif de ce diplôme ?")) return;

    setDeleting(true);
    try {
      const res = await fetch(
        `/api/donnees/intervenants/${intervenantId}/diplomes/${diplome.id}/upload`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      onFileUpdated(null);
    } catch (error) {
      console.error("Erreur suppression justificatif:", error);
      alert(error instanceof Error ? error.message : "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
            {diplome.intitule}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {diplome.organisme && `${diplome.organisme} • `}
            {diplome.anneeObtention && `${diplome.anneeObtention} • `}
            {diplome.niveau}
          </p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10 flex-shrink-0"
          title="Supprimer le diplôme"
        >
          {isDeleting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Trash2 size={14} />
          )}
        </button>
      </div>

      {/* Gestion du justificatif PDF */}
      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleUploadFile}
          className="hidden"
        />

        {diplome.fichierUrl ? (
          // Justificatif existant
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={diplome.fichierUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20"
            >
              <FileText size={12} />
              Voir le justificatif
            </a>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              {uploading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Upload size={12} />
              )}
              Changer
            </button>
            <button
              type="button"
              onClick={handleDeleteFile}
              disabled={deleting}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
            >
              {deleting ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Trash2 size={12} />
              )}
              Supprimer
            </button>
          </div>
        ) : (
          // Pas de justificatif
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded-md hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
          >
            {uploading ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Upload...
              </>
            ) : (
              <>
                <Upload size={12} />
                Joindre le diplôme (PDF)
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function IntervenantsPage() {
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIntervenant, setEditingIntervenant] = useState<Intervenant | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [newSpecialite, setNewSpecialite] = useState("");
  const [showSpecialiteSuggestions, setShowSpecialiteSuggestions] = useState(false);

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    fonction: "",
    specialites: [] as string[],
    structure: "",
    structureSiret: "",
    notes: "",
    // Nouveaux champs Qualiopi IND 17
    photoUrl: "",
    cv: "",
    biographie: "",
    anneesExperience: "",
    numeroDeclarationActivite: "",
  });

  // État pour les diplômes
  const [diplomes, setDiplomes] = useState<Diplome[]>([]);
  // Diplômes en attente pour la création (avant soumission)
  const [pendingDiplomes, setPendingDiplomes] = useState<Array<{
    intitule: string;
    organisme: string;
    anneeObtention: string;
    niveau: string;
    fichierUrl: string;
    pendingFile?: File;
  }>>([]);
  const [newDiplome, setNewDiplome] = useState({
    intitule: "",
    organisme: "",
    anneeObtention: "",
    niveau: "",
    fichierUrl: "",
  });
  const [pendingDiplomeFile, setPendingDiplomeFile] = useState<File | null>(null);
  const diplomeFileInputRef = useRef<HTMLInputElement>(null);
  const [addingDiplome, setAddingDiplome] = useState(false);
  const [savingDiplome, setSavingDiplome] = useState(false);
  const [deletingDiplome, setDeletingDiplome] = useState<string | null>(null);

  // États pour l'upload de fichiers
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [deletingCv, setDeletingCv] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  // Fichiers sélectionnés pour la création (avant soumission)
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [pendingCvFile, setPendingCvFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const fetchIntervenants = useCallback(async () => {
    try {
      const res = await fetch(`/api/donnees/intervenants?search=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setIntervenants(data);
      }
    } catch (error) {
      console.error("Erreur chargement intervenants:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchIntervenants();
  }, [fetchIntervenants]);

  const resetForm = () => {
    setFormData({
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      fonction: "",
      specialites: [],
      structure: "",
      structureSiret: "",
      notes: "",
      photoUrl: "",
      cv: "",
      biographie: "",
      anneesExperience: "",
      numeroDeclarationActivite: "",
    });
    setEditingIntervenant(null);
    setNewSpecialite("");
    setDiplomes([]);
    setPendingDiplomes([]);
    setAddingDiplome(false);
    setNewDiplome({
      intitule: "",
      organisme: "",
      anneeObtention: "",
      niveau: "",
      fichierUrl: "",
    });
    setPendingDiplomeFile(null);
    // Reset fichiers en attente
    setPendingPhotoFile(null);
    setPendingCvFile(null);
    setPhotoPreview(null);
    setUploadError(null);
    setUploadSuccess(null);
  };

  const openModal = (intervenant?: Intervenant) => {
    if (intervenant) {
      setEditingIntervenant(intervenant);
      setFormData({
        nom: intervenant.nom,
        prenom: intervenant.prenom,
        email: intervenant.email || "",
        telephone: intervenant.telephone || "",
        fonction: intervenant.fonction || "",
        specialites: intervenant.specialites || [],
        structure: intervenant.structure || "",
        structureSiret: intervenant.structureSiret || "",
        notes: intervenant.notes || "",
        photoUrl: intervenant.photoUrl || "",
        cv: intervenant.cv || "",
        biographie: intervenant.biographie || "",
        anneesExperience: intervenant.anneesExperience?.toString() || "",
        numeroDeclarationActivite: intervenant.numeroDeclarationActivite || "",
      });
      setDiplomes(intervenant.diplomes || []);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  // Gestion des diplômes
  const handleAddDiplome = async () => {
    if (!newDiplome.intitule.trim()) return;

    // Mode création : stocker le diplôme localement
    if (!editingIntervenant) {
      setPendingDiplomes([
        ...pendingDiplomes,
        {
          ...newDiplome,
          pendingFile: pendingDiplomeFile || undefined,
        },
      ]);
      setNewDiplome({
        intitule: "",
        organisme: "",
        anneeObtention: "",
        niveau: "",
        fichierUrl: "",
      });
      setPendingDiplomeFile(null);
      setAddingDiplome(false);
      return;
    }

    // Mode édition : enregistrer en base
    setSavingDiplome(true);
    try {
      const res = await fetch(`/api/donnees/intervenants/${editingIntervenant.id}/diplomes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDiplome),
      });

      if (res.ok) {
        const diplome = await res.json();

        // Si un fichier justificatif est sélectionné, l'uploader
        if (pendingDiplomeFile) {
          const uploadFormData = new FormData();
          uploadFormData.append("file", pendingDiplomeFile);
          await fetch(`/api/donnees/intervenants/${editingIntervenant.id}/diplomes/${diplome.id}/upload`, {
            method: "POST",
            body: uploadFormData,
          });
        }

        setDiplomes([...diplomes, diplome]);
        setNewDiplome({
          intitule: "",
          organisme: "",
          anneeObtention: "",
          niveau: "",
          fichierUrl: "",
        });
        setPendingDiplomeFile(null);
        setAddingDiplome(false);
        // Recharger les diplômes pour avoir le fichier
        if (editingIntervenant) {
          const reloadRes = await fetch(`/api/donnees/intervenants/${editingIntervenant.id}`);
          if (reloadRes.ok) {
            const data = await reloadRes.json();
            setDiplomes(data.diplomes || []);
          }
        }
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de l'ajout du diplôme");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'ajout du diplôme");
    } finally {
      setSavingDiplome(false);
    }
  };

  // Supprimer un diplôme en attente (mode création)
  const handleRemovePendingDiplome = (index: number) => {
    setPendingDiplomes(pendingDiplomes.filter((_, i) => i !== index));
  };

  const handleDeleteDiplome = async (diplomeId: string) => {
    if (!editingIntervenant) return;
    if (!confirm("Supprimer ce diplôme ?")) return;

    setDeletingDiplome(diplomeId);
    try {
      const res = await fetch(`/api/donnees/intervenants/${editingIntervenant.id}/diplomes/${diplomeId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDiplomes(diplomes.filter(d => d.id !== diplomeId));
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setDeletingDiplome(null);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Upload de fichier (photo ou CV)
  const handleFileUpload = async (file: File, type: "photo" | "cv") => {
    if (!editingIntervenant) return;

    setUploadError(null);
    setUploadSuccess(null);

    if (type === "photo") {
      setUploadingPhoto(true);
    } else {
      setUploadingCv(true);
    }

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("type", type);

      const res = await fetch(`/api/donnees/intervenants/${editingIntervenant.id}/upload`, {
        method: "POST",
        body: uploadFormData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      // Mettre à jour l'état local
      if (type === "photo") {
        setFormData(prev => ({ ...prev, photoUrl: data.url }));
        setEditingIntervenant({ ...editingIntervenant, photoUrl: data.url });
      } else {
        setFormData(prev => ({ ...prev, cv: data.url }));
        setEditingIntervenant({ ...editingIntervenant, cv: data.url });
      }

      setUploadSuccess(type === "photo" ? "Photo uploadée avec succès" : "CV uploadé avec succès");
      setTimeout(() => setUploadSuccess(null), 3000);

      // Rafraîchir la liste
      fetchIntervenants();
    } catch (error) {
      console.error("Erreur upload:", error);
      setUploadError(error instanceof Error ? error.message : "Erreur lors de l'upload");
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      if (type === "photo") {
        setUploadingPhoto(false);
      } else {
        setUploadingCv(false);
      }
    }
  };

  // Suppression de fichier (photo ou CV)
  const handleFileDelete = async (type: "photo" | "cv") => {
    if (!editingIntervenant) return;

    if (!confirm(type === "photo" ? "Supprimer la photo de profil ?" : "Supprimer le CV ?")) {
      return;
    }

    setUploadError(null);
    setUploadSuccess(null);

    if (type === "photo") {
      setDeletingPhoto(true);
    } else {
      setDeletingCv(true);
    }

    try {
      const res = await fetch(`/api/donnees/intervenants/${editingIntervenant.id}/upload?type=${type}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      // Mettre à jour l'état local
      if (type === "photo") {
        setFormData(prev => ({ ...prev, photoUrl: "" }));
        setEditingIntervenant({ ...editingIntervenant, photoUrl: null });
      } else {
        setFormData(prev => ({ ...prev, cv: "" }));
        setEditingIntervenant({ ...editingIntervenant, cv: null });
      }

      setUploadSuccess(type === "photo" ? "Photo supprimée" : "CV supprimé");
      setTimeout(() => setUploadSuccess(null), 3000);

      // Rafraîchir la liste
      fetchIntervenants();
    } catch (error) {
      console.error("Erreur suppression:", error);
      setUploadError(error instanceof Error ? error.message : "Erreur lors de la suppression");
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      if (type === "photo") {
        setDeletingPhoto(false);
      } else {
        setDeletingCv(false);
      }
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (editingIntervenant) {
        // Mode édition : upload immédiat
        handleFileUpload(file, "photo");
      } else {
        // Mode création : stocker le fichier pour upload après création
        setPendingPhotoFile(file);
        // Créer un preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (editingIntervenant) {
        // Mode édition : upload immédiat
        handleFileUpload(file, "cv");
      } else {
        // Mode création : stocker le fichier pour upload après création
        setPendingCvFile(file);
      }
    }
  };

  // Upload fichier pour un intervenant existant ou nouvellement créé
  const uploadFileForIntervenant = async (intervenantId: string, file: File, type: "photo" | "cv") => {
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("type", type);

    const res = await fetch(`/api/donnees/intervenants/${intervenantId}/upload`, {
      method: "POST",
      body: uploadFormData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `Erreur lors de l'upload du ${type}`);
    }

    return await res.json();
  };

  const addSpecialite = () => {
    if (newSpecialite.trim() && !formData.specialites.includes(newSpecialite.trim())) {
      setFormData({
        ...formData,
        specialites: [...formData.specialites, newSpecialite.trim()],
      });
      setNewSpecialite("");
    }
  };

  const removeSpecialite = (spec: string) => {
    setFormData({
      ...formData,
      specialites: formData.specialites.filter((s) => s !== spec),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setUploadError(null);

    try {
      const url = editingIntervenant
        ? `/api/donnees/intervenants/${editingIntervenant.id}`
        : "/api/donnees/intervenants";
      const method = editingIntervenant ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur lors de l'enregistrement");
      }

      const intervenant = await res.json();

      // Si c'est une création et qu'il y a des fichiers en attente, les uploader
      if (!editingIntervenant && (pendingPhotoFile || pendingCvFile)) {
        try {
          if (pendingPhotoFile) {
            await uploadFileForIntervenant(intervenant.id, pendingPhotoFile, "photo");
          }
          if (pendingCvFile) {
            await uploadFileForIntervenant(intervenant.id, pendingCvFile, "cv");
          }
        } catch (uploadErr) {
          console.error("Erreur upload fichiers:", uploadErr);
          // L'intervenant est créé, mais l'upload a échoué - on continue quand même
          setUploadError(uploadErr instanceof Error ? uploadErr.message : "Erreur lors de l'upload des fichiers");
        }
      }

      // Si c'est une création et qu'il y a des diplômes en attente, les sauvegarder
      if (!editingIntervenant && pendingDiplomes.length > 0) {
        for (const pendingDiplome of pendingDiplomes) {
          try {
            const diplomeRes = await fetch(`/api/donnees/intervenants/${intervenant.id}/diplomes`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                intitule: pendingDiplome.intitule,
                organisme: pendingDiplome.organisme,
                anneeObtention: pendingDiplome.anneeObtention,
                niveau: pendingDiplome.niveau,
              }),
            });

            if (diplomeRes.ok && pendingDiplome.pendingFile) {
              const createdDiplome = await diplomeRes.json();
              const uploadFormData = new FormData();
              uploadFormData.append("file", pendingDiplome.pendingFile);
              await fetch(`/api/donnees/intervenants/${intervenant.id}/diplomes/${createdDiplome.id}/upload`, {
                method: "POST",
                body: uploadFormData,
              });
            }
          } catch (diplomeErr) {
            console.error("Erreur ajout diplôme:", diplomeErr);
          }
        }
      }

      closeModal();
      fetchIntervenants();
    } catch (error) {
      console.error("Erreur:", error);
      alert(error instanceof Error ? error.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet intervenant ?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/donnees/intervenants/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchIntervenants();
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-500/10">
              <UserCheck className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Intervenants
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gérez les formateurs qui interviendront sur vos formations
              </p>
            </div>
          </div>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm hover:shadow-md whitespace-nowrap"
          >
            <Plus size={20} />
            Ajouter un intervenant
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="mt-6">
          <div className="relative max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={20} />
            </span>
            <input
              type="text"
              placeholder="Rechercher un intervenant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : intervenants.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <UserCheck className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? `Aucun intervenant trouvé pour "${searchQuery}"` : "Aucun intervenant enregistré"}
          </p>
          <button
            onClick={() => openModal()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
          >
            <Plus size={16} />
            Ajouter votre premier intervenant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {intervenants.map((intervenant) => (
            <div
              key={intervenant.id}
              className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] hover:border-brand-200 dark:hover:border-brand-800 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Photo de profil */}
                  {intervenant.photoUrl ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
                      <Image
                        src={intervenant.photoUrl}
                        alt={`${intervenant.prenom} ${intervenant.nom}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-600 dark:text-brand-400 font-semibold text-lg">
                        {intervenant.prenom.charAt(0)}{intervenant.nom.charAt(0)}
                      </span>
                    </div>
                  )}
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {intervenant.prenom} {intervenant.nom}
                  </h3>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => openModal(intervenant)}
                    className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors dark:hover:bg-brand-500/10"
                    title="Modifier"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(intervenant.id)}
                    disabled={deleting === intervenant.id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10 disabled:opacity-50"
                    title="Supprimer"
                  >
                    {deleting === intervenant.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {intervenant.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="flex-shrink-0 text-gray-400" />
                    <span className="truncate">{intervenant.email}</span>
                  </div>
                )}
                {intervenant.telephone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="flex-shrink-0 text-gray-400" />
                    <span>{intervenant.telephone}</span>
                  </div>
                )}
                {intervenant.structure && (
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="flex-shrink-0 text-gray-400" />
                    <span className="truncate">{intervenant.structure}</span>
                  </div>
                )}
              </div>

              {intervenant.specialites && intervenant.specialites.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex flex-wrap gap-1">
                    {intervenant.specialites.slice(0, 3).map((spec) => (
                      <span
                        key={spec}
                        className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full dark:bg-gray-800 dark:text-gray-400"
                      >
                        {spec}
                      </span>
                    ))}
                    {intervenant.specialites.length > 3 && (
                      <span className="px-2 py-0.5 text-xs text-gray-400">
                        +{intervenant.specialites.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingIntervenant ? "Modifier l'intervenant" : "Nouvel intervenant"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Informations personnelles */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Informations personnelles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Spécialités */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Spécialités
                </h3>
                <div className="relative">
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newSpecialite}
                      onChange={(e) => setNewSpecialite(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialite())}
                      onFocus={() => setShowSpecialiteSuggestions(true)}
                      placeholder="Ajouter une spécialité..."
                      className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSpecialiteSuggestions(!showSpecialiteSuggestions)}
                      className="px-4 py-2.5 text-sm font-medium text-brand-500 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
                      title="Voir les suggestions"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Liste déroulante des suggestions */}
                  {showSpecialiteSuggestions && (
                    <>
                      {/* Overlay invisible pour fermer au clic extérieur */}
                      <div
                        className="fixed inset-0 z-[5]"
                        onClick={() => setShowSpecialiteSuggestions(false)}
                      />
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          Sélectionnez une ou plusieurs spécialités
                        </p>
                      </div>
                      {SPECIALITES_SUGGESTIONS
                        .filter(spec => !formData.specialites.includes(spec))
                        .filter(spec => !newSpecialite || spec.toLowerCase().includes(newSpecialite.toLowerCase()))
                        .map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            if (!formData.specialites.includes(suggestion)) {
                              setFormData({
                                ...formData,
                                specialites: [...formData.specialites, suggestion],
                              });
                            }
                            setNewSpecialite("");
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                      {newSpecialite.trim() && !SPECIALITES_SUGGESTIONS.some(s => s.toLowerCase() === newSpecialite.toLowerCase()) && (
                        <button
                          type="button"
                          onClick={() => {
                            addSpecialite();
                            setShowSpecialiteSuggestions(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors border-t border-gray-100 dark:border-gray-700"
                        >
                          + Ajouter &quot;{newSpecialite}&quot;
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowSpecialiteSuggestions(false)}
                        className="w-full px-4 py-2 text-center text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border-t border-gray-100 dark:border-gray-700"
                      >
                        Fermer
                      </button>
                    </div>
                    </>
                  )}
                </div>
                {formData.specialites.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.specialites.map((spec) => (
                      <span
                        key={spec}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full dark:bg-gray-800 dark:text-gray-300"
                      >
                        <Tag size={12} />
                        {spec}
                        <button
                          type="button"
                          onClick={() => removeSpecialite(spec)}
                          className="ml-1 text-gray-400 hover:text-gray-600"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Structure */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Structure (si externe)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Nom de la structure
                    </label>
                    <input
                      type="text"
                      value={formData.structure}
                      onChange={(e) => setFormData({ ...formData, structure: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      SIRET structure
                    </label>
                    <input
                      type="text"
                      value={formData.structureSiret}
                      onChange={(e) => setFormData({ ...formData, structureSiret: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Qualiopi IND 17 - Profil enrichi */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Qualiopi IND 17 - Profil intervenant
                  </h3>
                </div>

                {/* Messages de succès/erreur pour l'upload */}
                {uploadSuccess && (
                  <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-500/10 dark:border-green-500/30 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-green-700 dark:text-green-300">{uploadSuccess}</span>
                  </div>
                )}
                {uploadError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-700 dark:text-red-300">{uploadError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Photo et CV - Upload */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Upload Photo */}
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                          <ImageIcon size={14} />
                          Photo de profil
                        </span>
                      </label>
                      <div className="space-y-2">
                        {/* Preview de la photo */}
                        {(editingIntervenant?.photoUrl || photoPreview) && (
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={editingIntervenant?.photoUrl || photoPreview || ""}
                              alt="Photo intervenant"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {/* Afficher le nom du fichier sélectionné en mode création */}
                        {!editingIntervenant && pendingPhotoFile && (
                          <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            {pendingPhotoFile.name}
                          </p>
                        )}
                        {/* Input fichier caché */}
                        <input
                          ref={photoInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                        {/* Boutons Changer / Supprimer */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            disabled={uploadingPhoto || deletingPhoto}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50 dark:bg-gray-800 dark:text-amber-300 dark:border-amber-500/50 dark:hover:bg-amber-500/10"
                          >
                            {uploadingPhoto ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                Upload en cours...
                              </>
                            ) : (
                              <>
                                <Upload size={16} />
                                {editingIntervenant?.photoUrl || pendingPhotoFile ? "Changer la photo" : "Sélectionner une photo"}
                              </>
                            )}
                          </button>
                          {/* Bouton supprimer photo (uniquement en mode édition et si photo existante) */}
                          {editingIntervenant?.photoUrl && (
                            <button
                              type="button"
                              onClick={() => handleFileDelete("photo")}
                              disabled={deletingPhoto || uploadingPhoto}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/20"
                            >
                              {deletingPhoto ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                              Supprimer
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          JPG, PNG, WebP ou GIF (max 5 MB)
                        </p>
                      </div>
                    </div>

                    {/* Upload CV */}
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                          <FileText size={14} />
                          CV
                        </span>
                      </label>
                      <div className="flex flex-col gap-3">
                        {/* Lien vers le CV existant (mode édition) */}
                        {editingIntervenant?.cv && (
                          <a
                            href={editingIntervenant.cv}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                          >
                            <FileText size={14} />
                            Voir le CV actuel
                          </a>
                        )}
                        {/* Afficher le nom du fichier sélectionné en mode création */}
                        {!editingIntervenant && pendingCvFile && (
                          <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            {pendingCvFile.name}
                          </p>
                        )}
                        {/* Input fichier caché */}
                        <input
                          ref={cvInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleCvChange}
                          className="hidden"
                        />
                        {/* Boutons Changer / Supprimer CV */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => cvInputRef.current?.click()}
                            disabled={uploadingCv || deletingCv}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50 dark:bg-gray-800 dark:text-amber-300 dark:border-amber-500/50 dark:hover:bg-amber-500/10"
                          >
                            {uploadingCv ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                Upload en cours...
                              </>
                            ) : (
                              <>
                                <Upload size={16} />
                                {editingIntervenant?.cv || pendingCvFile ? "Changer le CV" : "Sélectionner un CV"}
                              </>
                            )}
                          </button>
                          {/* Bouton supprimer CV (uniquement en mode édition et si CV existant) */}
                          {editingIntervenant?.cv && (
                            <button
                              type="button"
                              onClick={() => handleFileDelete("cv")}
                              disabled={deletingCv || uploadingCv}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/20"
                            >
                              {deletingCv ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                              Supprimer
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          PDF ou Word (max 10 MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expérience et numéro déclaration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          Années d&apos;expérience
                        </span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.anneesExperience}
                        onChange={(e) => setFormData({ ...formData, anneesExperience: e.target.value })}
                        placeholder="5"
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        N° déclaration d&apos;activité
                      </label>
                      <input
                        type="text"
                        value={formData.numeroDeclarationActivite}
                        onChange={(e) => setFormData({ ...formData, numeroDeclarationActivite: e.target.value })}
                        placeholder="ex: 11756789012"
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Biographie */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Biographie professionnelle
                    </label>
                    <textarea
                      rows={3}
                      value={formData.biographie}
                      onChange={(e) => setFormData({ ...formData, biographie: e.target.value })}
                      placeholder="Parcours professionnel, domaines d'expertise..."
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-none"
                    />
                  </div>

                  {/* Diplômes */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <GraduationCap size={14} />
                        Diplômes et certifications
                      </label>
                      <button
                        type="button"
                        onClick={() => setAddingDiplome(true)}
                        className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1"
                      >
                        <Plus size={14} />
                        Ajouter
                      </button>
                    </div>

                    {/* Liste des diplômes existants (mode édition) */}
                    {editingIntervenant && diplomes.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {diplomes.map((diplome) => (
                          <DiplomeItem
                            key={diplome.id}
                            diplome={diplome}
                            intervenantId={editingIntervenant.id}
                            onDelete={() => handleDeleteDiplome(diplome.id)}
                            isDeleting={deletingDiplome === diplome.id}
                            onFileUpdated={(url) => {
                              setDiplomes(prev =>
                                prev.map(d =>
                                  d.id === diplome.id ? { ...d, fichierUrl: url } : d
                                )
                              );
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Liste des diplômes en attente (mode création) */}
                    {!editingIntervenant && pendingDiplomes.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {pendingDiplomes.map((diplome, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/30"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                {diplome.intitule}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {diplome.organisme && `${diplome.organisme} • `}
                                {diplome.anneeObtention && `${diplome.anneeObtention} • `}
                                {diplome.niveau}
                                {diplome.pendingFile && ` • 📄 ${diplome.pendingFile.name}`}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePendingDiplome(index)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formulaire ajout diplôme */}
                    {addingDiplome && (
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-amber-300 dark:border-amber-500/30 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={newDiplome.intitule}
                            onChange={(e) => setNewDiplome({ ...newDiplome, intitule: e.target.value })}
                            placeholder="Intitulé du diplôme *"
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          />
                          <input
                            type="text"
                            value={newDiplome.organisme}
                            onChange={(e) => setNewDiplome({ ...newDiplome, organisme: e.target.value })}
                            placeholder="Organisme délivrant"
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          />
                          <input
                            type="number"
                            value={newDiplome.anneeObtention}
                            onChange={(e) => setNewDiplome({ ...newDiplome, anneeObtention: e.target.value })}
                            placeholder="Année d'obtention"
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          />
                          <select
                            value={newDiplome.niveau}
                            onChange={(e) => setNewDiplome({ ...newDiplome, niveau: e.target.value })}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          >
                            <option value="">Niveau</option>
                            <option value="CAP">CAP</option>
                            <option value="BEP">BEP</option>
                            <option value="Bac">Bac</option>
                            <option value="Bac+2 (BTS/DUT)">Bac+2 (BTS/DUT)</option>
                            <option value="Bac+3 (Licence/Bachelor)">Bac+3 (Licence/Bachelor)</option>
                            <option value="Bac+4">Bac+4</option>
                            <option value="Bac+5 (Master)">Bac+5 (Master)</option>
                            <option value="Bac+8 (Doctorat)">Bac+8 (Doctorat)</option>
                            <option value="Certification">Certification</option>
                          </select>
                        </div>
                        {/* Champ pour importer le justificatif PDF */}
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Justificatif (PDF)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              ref={diplomeFileInputRef}
                              accept=".pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setPendingDiplomeFile(file);
                                }
                              }}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => diplomeFileInputRef.current?.click()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                            >
                              <Upload size={12} />
                              {pendingDiplomeFile ? "Changer" : "Importer PDF"}
                            </button>
                            {pendingDiplomeFile && (
                              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                <CheckCircle2 size={12} />
                                {pendingDiplomeFile.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAddingDiplome(false);
                              setPendingDiplomeFile(null);
                            }}
                            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            onClick={handleAddDiplome}
                            disabled={savingDiplome || !newDiplome.intitule.trim()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50"
                          >
                            {savingDiplome && <Loader2 size={14} className="animate-spin" />}
                            Ajouter
                          </button>
                        </div>
                      </div>
                    )}

                    {((editingIntervenant && diplomes.length === 0) || (!editingIntervenant && pendingDiplomes.length === 0)) && !addingDiplome && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        Aucun diplôme enregistré
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Notes internes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {editingIntervenant ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
