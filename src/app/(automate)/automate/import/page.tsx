"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAutomate } from "@/context/AutomateContext";

// Types pour les modules
interface ModuleData {
  id: string;
  titre: string;
  duree: string;
  objectifs: string[];
  contenu: string[];
}

// Type pour les données de la formation
interface FormationImportData {
  titre: string;
  description: string;
  typeSession: string[];
  modalite: string;
  dureeHeures: string;
  dureeJours: string;
  tarifEntreprise: string;
  tarifIndependant: string;
  tarifParticulier: string;
  objectifs: string[];
  prerequis: string;
  publicVise: string;
  accessibilite: string;
  modules: ModuleData[];
}

// Valeurs initiales
const initialFormData: FormationImportData = {
  titre: "",
  description: "",
  typeSession: [],
  modalite: "presentiel",
  dureeHeures: "",
  dureeJours: "",
  tarifEntreprise: "",
  tarifIndependant: "",
  tarifParticulier: "",
  objectifs: [""],
  prerequis: "",
  publicVise: "",
  accessibilite: "Nous faisons notre possible pour rendre nos formations accessibles à tous. En cas de besoins particuliers, merci de nous en informer en amont afin que nous puissions envisager les aménagements nécessaires.",
  modules: [],
};

// Icônes
const UploadIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 16L4 17C4 18.6569 5.34315 20 7 20L17 20C18.6569 20 20 18.6569 20 17L20 16M16 8L12 4M12 4L8 8M12 4L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 4H14M5.333 4V2.667C5.333 2.298 5.632 2 6 2H10C10.368 2 10.667 2.298 10.667 2.667V4M6.667 7.333V11.333M9.333 7.333V11.333M12.667 4V13.333C12.667 13.702 12.368 14 12 14H4C3.632 14 3.333 13.702 3.333 13.333V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 12.5L10 7.5L5 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 1.66667V3.33334M10 16.6667V18.3333M3.33333 10H1.66666M18.3333 10H16.6667M15.8926 15.8926L14.7141 14.7141M15.8926 4.10744L14.7141 5.28596M4.10744 15.8926L5.28596 14.7141M4.10744 4.10744L5.28596 5.28596" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 6.66667L11.1785 9.82149L14.3333 11L11.1785 12.1785L10 15.3333L8.82149 12.1785L5.66667 11L8.82149 9.82149L10 6.66667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DocumentIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LoaderIcon = () => (
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default function ImportFormationPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { refreshFormations } = useAutomate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // États
  const [mode, setMode] = useState<"choice" | "upload" | "manual">("choice");

  // Réinitialiser l'état à "choice" quand on navigue vers cette page
  // Ceci résout le bug 162 : cliquer sur "Créer une formation" dans le menu
  // doit toujours afficher l'écran de choix initial
  const lastPathnameRef = useRef(pathname);
  useEffect(() => {
    // Si le pathname a changé et revient à cette page, réinitialiser
    if (lastPathnameRef.current !== pathname) {
      lastPathnameRef.current = pathname;
    }
  }, [pathname]);

  // Réinitialiser quand le composant est monté (navigation vers cette page)
  useEffect(() => {
    // Toujours afficher le choix initial quand on arrive sur cette page
    setMode("choice");
    setFormData(initialFormData);
    setUploadedFile(null);
    setError(null);
  }, [pathname]);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<FormationImportData>(initialFormData);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Gestion du drag & drop
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  // Gestion du fichier uploadé
  const handleFileSelect = async (file: File) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Format non supporté. Veuillez uploader un fichier PDF ou Word (.docx)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Le fichier est trop volumineux. Maximum 10 Mo.");
      return;
    }

    setError(null);
    setUploadedFile(file);
    setIsExtracting(true);

    try {
      // Upload et extraction via API
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch("/api/formations/import", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'extraction");
      }

      const extractedData = await response.json();

      // Pré-remplir le formulaire avec les données extraites
      setFormData({
        ...initialFormData,
        titre: extractedData.titre || "",
        description: extractedData.description || extractedData.objectifGeneral || "",
        objectifs: extractedData.objectifs || extractedData.objectifsSpecifiques || [""],
        prerequis: Array.isArray(extractedData.prerequis)
          ? extractedData.prerequis.join("\n")
          : extractedData.prerequis || "",
        publicVise: extractedData.publicVise || extractedData.publicCible || "",
        dureeHeures: extractedData.dureeHeures || "",
        dureeJours: extractedData.dureeJours || "",
        modules: (extractedData.modules || []).map((m: { titre: string; duree?: string; objectifs?: string[]; contenu?: string[] }, i: number) => ({
          id: `module-${i + 1}`,
          titre: m.titre || `Module ${i + 1}`,
          duree: m.duree || "",
          objectifs: m.objectifs || [],
          contenu: m.contenu || [],
        })),
      });

      setMode("manual");
    } catch (err) {
      console.error("Erreur extraction:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'extraction du document");
      setUploadedFile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  // Gestion du formulaire
  const updateFormData = (field: keyof FormationImportData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Gestion des objectifs
  const addObjectif = () => {
    setFormData(prev => ({
      ...prev,
      objectifs: [...prev.objectifs, ""],
    }));
  };

  const updateObjectif = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      objectifs: prev.objectifs.map((obj, i) => i === index ? value : obj),
    }));
  };

  const removeObjectif = (index: number) => {
    if (formData.objectifs.length > 1) {
      setFormData(prev => ({
        ...prev,
        objectifs: prev.objectifs.filter((_, i) => i !== index),
      }));
    }
  };

  // Gestion des modules
  const addModule = () => {
    const newModule: ModuleData = {
      id: `module-${Date.now()}`,
      titre: `Module ${formData.modules.length + 1}`,
      duree: "",
      objectifs: [""],
      contenu: [""],
    };
    setFormData(prev => ({
      ...prev,
      modules: [...prev.modules, newModule],
    }));
    setExpandedModules(prev => [...prev, newModule.id]);
  };

  const updateModule = (moduleId: string, field: keyof ModuleData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map(m =>
        m.id === moduleId ? { ...m, [field]: value } : m
      ),
    }));
  };

  const removeModule = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.filter(m => m.id !== moduleId),
    }));
    setExpandedModules(prev => prev.filter(id => id !== moduleId));
  };

  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  // Sauvegarde de la formation
  const handleSave = async () => {
    // Validation
    if (!formData.titre.trim()) {
      setError("Le titre de la formation est obligatoire");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        titre: formData.titre,
        description: formData.description,
        creationMode: "IMPORT",
        fichePedagogique: {
          ...formData,
          objectifGeneral: formData.description,
          typeFormation: formData.modalite === "presentiel"
            ? "Présentiel"
            : formData.modalite === "distanciel"
              ? "Distanciel / Classe virtuelle"
              : "Formation mixte",
        },
        contexteData: {
          typeSession: formData.typeSession,
          modalite: formData.modalite,
          dureeHeures: formData.dureeHeures,
          dureeJours: formData.dureeJours,
          tarifEntreprise: formData.tarifEntreprise,
          tarifIndependant: formData.tarifIndependant,
          tarifParticulier: formData.tarifParticulier,
          description: formData.description,
        },
        modules: formData.modules.map((m, i) => ({
          titre: m.titre,
          ordre: i + 1,
          duree: m.duree ? parseInt(m.duree) * 60 : null,
          contenu: { items: m.contenu, objectifs: m.objectifs },
        })),
      };

      const response = await fetch("/api/formations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création");
      }

      const newFormation = await response.json();
      await refreshFormations();

      // Rediriger vers la page d'édition
      router.push(`/automate/create?id=${newFormation.id}`);
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  // Affichage du choix initial
  if (mode === "choice") {
    return (
      <div className="space-y-6">
        {/* En-tête */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Créer une formation
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Choisissez comment vous souhaitez créer votre formation.
          </p>
        </div>

        {/* Choix du mode - 3 options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Option: Créer avec l'IA */}
          <a
            href="/automate/create"
            className="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white p-8 dark:border-brand-500/30 dark:from-brand-500/10 dark:to-white/[0.03] hover:border-brand-400 dark:hover:border-brand-500 transition-all group text-left relative overflow-hidden"
          >
            <div className="absolute top-3 right-3">
              <span className="px-2 py-1 text-xs font-medium bg-brand-500 text-white rounded-full">
                Recommandé
              </span>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4 group-hover:scale-110 transition-transform">
              <SparklesIcon />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Créer avec l&apos;IA
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Décrivez votre formation et l&apos;IA génère automatiquement la fiche pédagogique, les slides et les évaluations.
            </p>
            <div className="flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 font-medium">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L10 5L14 5.5L11 8.5L12 13L8 11L4 13L5 8.5L2 5.5L6 5L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Rapide et personnalisé
            </div>
          </a>

          {/* Option: Import fichier */}
          <button
            onClick={() => setMode("upload")}
            className="rounded-2xl border-2 border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-white/[0.03] hover:border-brand-300 dark:hover:border-brand-500 transition-all group text-left"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 group-hover:scale-110 transition-transform">
              <UploadIcon />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Importer un fichier
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Uploadez votre fiche pédagogique existante (PDF ou Word) et nous extrairons les informations.
            </p>
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10M11.3333 5.33333L8 2M8 2L4.66667 5.33333M8 2V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Extraction automatique
            </div>
          </button>

          {/* Option: Création manuelle */}
          <button
            onClick={() => setMode("manual")}
            className="rounded-2xl border-2 border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-white/[0.03] hover:border-brand-300 dark:hover:border-brand-500 transition-all group text-left"
          >
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 mb-4 group-hover:scale-110 transition-transform">
              <DocumentIcon />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Saisie manuelle
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Renseignez toutes les informations de votre formation via le formulaire.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 5.33333V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Contrôle total
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Affichage upload
  if (mode === "upload") {
    return (
      <div className="space-y-6">
        {/* En-tête */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMode("choice")}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors dark:hover:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Importer une fiche pédagogique
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Glissez-déposez votre fichier ou cliquez pour sélectionner.
              </p>
            </div>
          </div>
        </div>

        {/* Zone d'upload */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
              : "border-gray-300 bg-white hover:border-brand-300 dark:border-gray-700 dark:bg-white/[0.03] dark:hover:border-brand-500"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          {isExtracting ? (
            <div className="flex flex-col items-center gap-4">
              <LoaderIcon />
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  Extraction en cours...
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Analyse de &quot;{uploadedFile?.name}&quot;
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">
                <UploadIcon />
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Glissez votre fichier ici
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                ou cliquez pour parcourir
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Formats acceptés : PDF, DOC, DOCX (max. 10 Mo)
              </p>
            </>
          )}
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 dark:bg-red-500/10 dark:border-red-500/30">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Affichage formulaire manuel
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setMode("choice");
                setFormData(initialFormData);
                setUploadedFile(null);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors dark:hover:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {uploadedFile ? "Compléter les informations" : "Créer une formation"}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {uploadedFile
                  ? `Données extraites de "${uploadedFile.name}". Vérifiez et complétez si nécessaire.`
                  : "Remplissez les informations de votre formation."
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <LoaderIcon />
                Enregistrement...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 10V15.8333C16.6667 16.2754 16.4911 16.6993 16.1785 17.0118C15.866 17.3244 15.442 17.5 15 17.5H5C4.55797 17.5 4.13405 17.3244 3.82149 17.0118C3.50893 16.6993 3.33333 16.2754 3.33333 15.8333V4.16667C3.33333 3.72464 3.50893 3.30072 3.82149 2.98816C4.13405 2.67559 4.55797 2.5 5 2.5H10.8333M13.3333 6.66667V2.5M11.25 4.58333H15.4167" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Enregistrer la formation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 dark:bg-red-500/10 dark:border-red-500/30">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Formulaire */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informations générales
            </h2>
            <div className="space-y-4">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Titre de la formation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => updateFormData("titre", e.target.value)}
                  placeholder="Ex: Neuromarketing : Exploiter les neurosciences pour optimiser vos stratégies"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              {/* Description / Objectif général */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Objectif général / Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                  placeholder="Décrivez l'objectif principal de cette formation..."
                  rows={3}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 resize-none"
                />
              </div>

              {/* Public visé */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Public visé
                </label>
                <textarea
                  value={formData.publicVise}
                  onChange={(e) => updateFormData("publicVise", e.target.value)}
                  placeholder="À qui s'adresse cette formation ?"
                  rows={2}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 resize-none"
                />
              </div>

              {/* Prérequis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Prérequis
                </label>
                <textarea
                  value={formData.prerequis}
                  onChange={(e) => updateFormData("prerequis", e.target.value)}
                  placeholder="Quels sont les prérequis pour suivre cette formation ?"
                  rows={2}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Objectifs pédagogiques */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Objectifs pédagogiques
              </h2>
              <button
                onClick={addObjectif}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
              >
                <PlusIcon />
                Ajouter
              </button>
            </div>
            <div className="space-y-3">
              {formData.objectifs.map((objectif, index) => (
                <div key={index} className="flex gap-2">
                  <span className="flex-shrink-0 w-8 h-10 flex items-center justify-center text-sm font-medium text-gray-400 dark:text-gray-500">
                    {index + 1}.
                  </span>
                  <input
                    type="text"
                    value={objectif}
                    onChange={(e) => updateObjectif(index, e.target.value)}
                    placeholder="Décrivez un objectif pédagogique..."
                    className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                  />
                  {formData.objectifs.length > 1 && (
                    <button
                      onClick={() => removeObjectif(index)}
                      className="flex-shrink-0 p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Modules */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Modules de formation
              </h2>
              <button
                onClick={addModule}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
              >
                <PlusIcon />
                Ajouter un module
              </button>
            </div>

            {formData.modules.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 mb-3">
                  <DocumentIcon />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Aucun module ajouté. Cliquez sur &quot;Ajouter un module&quot; pour commencer.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.modules.map((module, index) => (
                  <div
                    key={module.id}
                    className="border border-gray-200 rounded-xl overflow-hidden dark:border-gray-700"
                  >
                    {/* Header du module */}
                    <div
                      onClick={() => toggleModuleExpand(module.id)}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="w-8 h-8 flex-shrink-0 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-bold dark:bg-brand-500/20 dark:text-brand-400">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={module.titre}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateModule(module.id, "titre", e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full font-medium text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                          />
                          {module.duree && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Durée: {module.duree}h
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeModule(module.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10"
                        >
                          <TrashIcon />
                        </button>
                        {expandedModules.includes(module.id) ? (
                          <ChevronUpIcon />
                        ) : (
                          <ChevronDownIcon />
                        )}
                      </div>
                    </div>

                    {/* Contenu du module (expanded) */}
                    {expandedModules.includes(module.id) && (
                      <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
                        {/* Durée */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Durée (heures)
                          </label>
                          <input
                            type="number"
                            value={module.duree}
                            onChange={(e) => updateModule(module.id, "duree", e.target.value)}
                            placeholder="2"
                            className="w-32 px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          />
                        </div>

                        {/* Contenu du module */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Contenu du module
                          </label>
                          <textarea
                            value={module.contenu.join("\n")}
                            onChange={(e) => updateModule(module.id, "contenu", e.target.value.split("\n"))}
                            placeholder="Listez les points abordés (un par ligne)..."
                            rows={4}
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Modalités */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Modalités
            </h2>
            <div className="space-y-4">
              {/* Type de session */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type de session
                </label>
                <div className="space-y-2">
                  {[
                    { value: "intra", label: "Intra-entreprise" },
                    { value: "inter", label: "Inter-entreprises" },
                  ].map((type) => (
                    <label key={type.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.typeSession.includes(type.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFormData("typeSession", [...formData.typeSession, type.value]);
                          } else {
                            updateFormData("typeSession", formData.typeSession.filter(t => t !== type.value));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Modalité */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Modalité de formation
                </label>
                <div className="space-y-2">
                  {[
                    { value: "presentiel", label: "Présentiel" },
                    { value: "distanciel", label: "Distanciel" },
                    { value: "mixte", label: "Mixte" },
                  ].map((modalite) => (
                    <label key={modalite.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="modalite"
                        value={modalite.value}
                        checked={formData.modalite === modalite.value}
                        onChange={(e) => updateFormData("modalite", e.target.value)}
                        className="w-4 h-4 border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{modalite.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Durée */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Durée (heures)
                  </label>
                  <input
                    type="number"
                    value={formData.dureeHeures}
                    onChange={(e) => updateFormData("dureeHeures", e.target.value)}
                    placeholder="14"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Durée (jours)
                  </label>
                  <input
                    type="number"
                    value={formData.dureeJours}
                    onChange={(e) => updateFormData("dureeJours", e.target.value)}
                    placeholder="2"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tarification */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tarification
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Tarif entreprise (HT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.tarifEntreprise}
                    onChange={(e) => updateFormData("tarifEntreprise", e.target.value)}
                    placeholder="1500"
                    className="w-full px-4 py-2.5 pr-12 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Tarif indépendant (HT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.tarifIndependant}
                    onChange={(e) => updateFormData("tarifIndependant", e.target.value)}
                    placeholder="1200"
                    className="w-full px-4 py-2.5 pr-12 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Tarif particulier (TTC)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.tarifParticulier}
                    onChange={(e) => updateFormData("tarifParticulier", e.target.value)}
                    placeholder="900"
                    className="w-full px-4 py-2.5 pr-12 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
                </div>
              </div>
            </div>
          </div>

          {/* Accessibilité */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Accessibilité PSH
            </h2>
            <textarea
              value={formData.accessibilite}
              onChange={(e) => updateFormData("accessibilite", e.target.value)}
              rows={4}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
