"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  WizardStep,
  WizardData,
  FormationInfo,
  SessionClient,
  SessionTarif,
  SessionLieu,
  SessionFormateurs,
  GeneratedDocument,
  initialWizardData,
} from "./types";
import WizardStepper from "./WizardStepper";
import StepClients from "./StepClients";
import StepTarifs from "./StepTarifs";
import StepLieu from "./StepLieu";
import StepFormateurs from "./StepFormateurs";
import StepDocuments from "./StepDocuments";
import StepEspaceApprenant from "./StepEspaceApprenant";
import { Loader2 } from "lucide-react";

// Données initiales de session (pré-remplissage depuis TrainingSession)
export interface InitialSessionData {
  lieu?: {
    modalite: "PRESENTIEL" | "DISTANCIEL" | "MIXTE";
    lieuId: string | null;
    lieu?: {
      id: string;
      nom: string;
      typeLieu: string;
      lieuFormation?: string;
      codePostal?: string | null;
      ville?: string | null;
    } | null;
    adresseLibre: string;
    lienConnexion: string;
    journees: Array<{
      id: string;
      date: string;
      horaireMatin: string;
      horaireApresMidi: string;
    }>;
  };
  formateurs?: {
    formateurPrincipalId: string | null;
    formateurPrincipal?: {
      id: string;
      nom: string;
      prenom: string;
      email?: string | null;
    } | null;
    coformateursIds: string[];
    coformateurs: Array<{
      id: string;
      nom: string;
      prenom: string;
      email?: string | null;
    }>;
  };
}

interface DocumentsWizardProps {
  formation: FormationInfo;
  initialSessionData?: InitialSessionData;
  onComplete?: (data: WizardData, selectedDocs: string[]) => Promise<void>;
  onCancel?: () => void;
}

export default function DocumentsWizard({
  formation,
  initialSessionData,
  onComplete,
}: DocumentsWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("clients");
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);
  const [data, setData] = useState<WizardData>(initialWizardData);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Charger les données existantes au montage
  useEffect(() => {
    const loadExistingSession = async () => {
      // Déterminer l'URL de l'API en fonction du type de session
      const hasTrainingSession = !!formation.sessionId;

      if (!formation.id && !formation.sessionId) {
        // Si pas de formation.id ni de sessionId mais des données initiales, les utiliser
        if (initialSessionData) {
          applyInitialSessionData();
        }
        setIsLoading(false);
        return;
      }

      try {
        // Utiliser trainingSessionId si disponible (nouveau système), sinon formationId (ancien)
        const apiUrl = hasTrainingSession
          ? `/api/document-sessions?trainingSessionId=${formation.sessionId}`
          : `/api/document-sessions?formationId=${formation.id}`;
        const res = await fetch(apiUrl);
        if (res.ok) {
          const result = await res.json();
          if (result.session) {
            // Charger les données existantes
            setSessionId(result.session.sessionId);
            setData({
              clients: result.session.clients || [],
              tarifs: result.session.tarifs || [],
              lieu: result.session.lieu || initialWizardData.lieu,
              formateurs: result.session.formateurs || initialWizardData.formateurs,
            });

            // Charger les documents générés
            if (result.session.generatedDocs?.length > 0) {
              setGeneratedDocs(result.session.generatedDocs);
            }

            // Déterminer les étapes complétées
            const completed: WizardStep[] = [];
            if (result.session.clients?.length > 0) completed.push("clients");
            if (result.session.tarifs?.some((t: SessionTarif) => t.tarifHT > 0)) completed.push("tarifs");
            if (result.session.lieu?.journees?.length > 0) completed.push("lieu");
            if (result.session.formateurs?.formateurPrincipal) completed.push("formateurs");
            if (result.session.generatedDocs?.length > 0) completed.push("documents");
            setCompletedSteps(completed);

            console.log("Session chargée:", result.session.sessionId);
          } else if (initialSessionData) {
            // Pas de session existante, appliquer les données initiales
            applyInitialSessionData();
          }
        } else if (initialSessionData) {
          // Erreur API, appliquer les données initiales
          applyInitialSessionData();
        }
      } catch (error) {
        console.error("Erreur chargement session:", error);
        // En cas d'erreur, appliquer les données initiales si disponibles
        if (initialSessionData) {
          applyInitialSessionData();
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Fonction pour appliquer les données initiales de la TrainingSession
    const applyInitialSessionData = () => {
      if (!initialSessionData) return;

      const newData: WizardData = { ...initialWizardData };
      const completed: WizardStep[] = [];

      // Pré-remplir le lieu et les journées
      if (initialSessionData.lieu) {
        newData.lieu = {
          modalite: initialSessionData.lieu.modalite,
          lieuId: initialSessionData.lieu.lieuId,
          lieu: initialSessionData.lieu.lieu ? {
            id: initialSessionData.lieu.lieu.id,
            nom: initialSessionData.lieu.lieu.nom,
            typeLieu: initialSessionData.lieu.lieu.typeLieu as "PRESENTIEL" | "VISIOCONFERENCE",
            lieuFormation: initialSessionData.lieu.lieu.lieuFormation || "",
            codePostal: initialSessionData.lieu.lieu.codePostal || null,
            ville: initialSessionData.lieu.lieu.ville || null,
            infosPratiques: null,
            capacite: null,
          } : undefined,
          adresseLibre: initialSessionData.lieu.adresseLibre || "",
          lienConnexion: initialSessionData.lieu.lienConnexion || "",
          journees: initialSessionData.lieu.journees.length > 0
            ? initialSessionData.lieu.journees
            : initialWizardData.lieu.journees,
        };

        // Si on a des journées avec des dates, marquer l'étape comme complétée
        if (initialSessionData.lieu.journees.some(j => j.date)) {
          completed.push("lieu");
        }
      }

      // Pré-remplir les formateurs
      if (initialSessionData.formateurs) {
        newData.formateurs = {
          formateurPrincipalId: initialSessionData.formateurs.formateurPrincipalId,
          formateurPrincipal: initialSessionData.formateurs.formateurPrincipal ? {
            id: initialSessionData.formateurs.formateurPrincipal.id,
            nom: initialSessionData.formateurs.formateurPrincipal.nom,
            prenom: initialSessionData.formateurs.formateurPrincipal.prenom,
            email: initialSessionData.formateurs.formateurPrincipal.email || null,
            telephone: null,
            fonction: null,
            specialites: [],
          } : undefined,
          coformateursIds: initialSessionData.formateurs.coformateursIds || [],
          coformateurs: (initialSessionData.formateurs.coformateurs || []).map(cf => ({
            id: cf.id,
            nom: cf.nom,
            prenom: cf.prenom,
            email: cf.email || null,
            telephone: null,
            fonction: null,
            specialites: [],
          })),
        };

        // Si on a un formateur principal, marquer l'étape comme complétée
        if (initialSessionData.formateurs.formateurPrincipalId) {
          completed.push("formateurs");
        }
      }

      setData(newData);
      setCompletedSteps(completed);
      console.log("Données initiales de session appliquées");
    };

    loadExistingSession();
  }, [formation.id, formation.sessionId, initialSessionData]);

  // Sauvegarder automatiquement les données (debounced)
  const saveSession = useCallback(async (currentData: WizardData) => {
    // Vérifier qu'on a au moins un identifiant valide
    if (!formation.id && !formation.sessionId) return;

    setIsSaving(true);
    try {
      // Construire le payload selon le type de session
      const hasTrainingSession = !!formation.sessionId;
      const payload = hasTrainingSession
        ? {
            trainingSessionId: formation.sessionId,
            clients: currentData.clients,
            tarifs: currentData.tarifs,
            lieu: currentData.lieu,
            formateurs: currentData.formateurs,
          }
        : {
            formationId: formation.id,
            sessionId,
            clients: currentData.clients,
            tarifs: currentData.tarifs,
            lieu: currentData.lieu,
            formateurs: currentData.formateurs,
          };

      const res = await fetch("/api/document-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        if (!sessionId && result.sessionId) {
          setSessionId(result.sessionId);
        }
        console.log("Session sauvegardée");
      }
    } catch (error) {
      console.error("Erreur sauvegarde session:", error);
    } finally {
      setIsSaving(false);
    }
  }, [formation.id, formation.sessionId, sessionId]);

  // Debounce la sauvegarde
  const debouncedSave = useCallback((currentData: WizardData) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveSession(currentData);
    }, 2000); // Sauvegarder après 2 secondes d'inactivité
  }, [saveSession]);

  // Navigation entre les étapes
  // Correction 433a: Ajout de l'étape "espaceApprenant"
  const stepsOrder: WizardStep[] = [
    "clients",
    "tarifs",
    "lieu",
    "formateurs",
    "documents",
    "espaceApprenant",
  ];

  const goToStep = (step: WizardStep) => {
    setCurrentStep(step);
  };

  const goNext = () => {
    const currentIndex = stepsOrder.indexOf(currentStep);
    if (currentIndex < stepsOrder.length - 1) {
      // Marquer l'étape actuelle comme complétée
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(stepsOrder[currentIndex + 1]);
    }
  };

  const goPrev = () => {
    const currentIndex = stepsOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepsOrder[currentIndex - 1]);
    }
  };

  // Handlers pour chaque étape (avec sauvegarde automatique)
  const handleClientsChange = useCallback((clients: SessionClient[]) => {
    setData((prev) => {
      const newData = { ...prev, clients };
      debouncedSave(newData);
      return newData;
    });
  }, [debouncedSave]);

  const handleTarifsChange = useCallback((tarifs: SessionTarif[]) => {
    setData((prev) => {
      const newData = { ...prev, tarifs };
      debouncedSave(newData);
      return newData;
    });
  }, [debouncedSave]);

  const handleLieuChange = useCallback((lieu: SessionLieu) => {
    setData((prev) => {
      const newData = { ...prev, lieu };
      debouncedSave(newData);
      return newData;
    });
  }, [debouncedSave]);

  const handleFormateursChange = useCallback((formateurs: SessionFormateurs) => {
    setData((prev) => {
      const newData = { ...prev, formateurs };
      debouncedSave(newData);
      return newData;
    });
  }, [debouncedSave]);

  // Callback pour les changements de documents générés
  const handleGeneratedDocsChange = useCallback((docs: GeneratedDocument[]) => {
    setGeneratedDocs(docs);
    // Sauvegarder immédiatement les documents générés
    const hasTrainingSession = !!formation.sessionId;
    const canSave = hasTrainingSession ? !!formation.sessionId : (formation.id && sessionId);

    if (canSave) {
      const payload = hasTrainingSession
        ? {
            trainingSessionId: formation.sessionId,
            clients: data.clients,
            tarifs: data.tarifs,
            lieu: data.lieu,
            formateurs: data.formateurs,
            generatedDocs: docs,
          }
        : {
            formationId: formation.id,
            sessionId,
            clients: data.clients,
            tarifs: data.tarifs,
            lieu: data.lieu,
            formateurs: data.formateurs,
            generatedDocs: docs,
          };

      fetch("/api/document-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(console.error);
    }
  }, [formation.id, formation.sessionId, sessionId, data]);

  // Callback pour la génération (appelé depuis StepDocuments si nécessaire)
  const handleGenerate = async (selectedDocs: string[]) => {
    // Marquer l'étape documents comme complétée
    if (!completedSteps.includes("documents")) {
      setCompletedSteps([...completedSteps, "documents"]);
    }

    // Appeler le callback parent si fourni
    if (onComplete) {
      await onComplete(data, selectedDocs);
    }
  };

  // Afficher un loader pendant le chargement initial
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin h-8 w-8 text-brand-500" />
          <span className="text-gray-500 dark:text-gray-400">Chargement de la session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Indicateur de sauvegarde */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg shadow-lg">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Sauvegarde...</span>
        </div>
      )}

      {/* Header avec stepper */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <WizardStepper
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={goToStep}
        />
      </div>

      {/* Contenu de l'étape */}
      <div className="min-h-[500px]">
        {currentStep === "clients" && (
          <StepClients
            clients={data.clients}
            onChange={handleClientsChange}
            onNext={goNext}
          />
        )}

        {currentStep === "tarifs" && (
          <StepTarifs
            clients={data.clients}
            tarifs={data.tarifs}
            formation={formation}
            onChange={handleTarifsChange}
            onNext={goNext}
            onPrev={goPrev}
          />
        )}

        {currentStep === "lieu" && (
          <StepLieu
            lieu={data.lieu}
            formation={formation}
            onChange={handleLieuChange}
            onNext={goNext}
            onPrev={goPrev}
          />
        )}

        {currentStep === "formateurs" && (
          <StepFormateurs
            formateurs={data.formateurs}
            onChange={handleFormateursChange}
            onNext={goNext}
            onPrev={goPrev}
          />
        )}

        {currentStep === "documents" && (
          <StepDocuments
            clients={data.clients}
            tarifs={data.tarifs}
            lieu={data.lieu}
            formateurs={data.formateurs}
            formation={formation}
            initialGeneratedDocs={generatedDocs}
            onGeneratedDocsChange={handleGeneratedDocsChange}
            onPrev={goPrev}
            onNext={formation.sessionId ? goNext : undefined}
            onGenerate={handleGenerate}
          />
        )}

        {/* Correction 433a: Étape Espace Apprenant */}
        {currentStep === "espaceApprenant" && formation.sessionId && (
          <StepEspaceApprenant
            clients={data.clients}
            formateurs={data.formateurs}
            sessionId={formation.sessionId}
            formationTitre={formation.titre}
            onPrev={goPrev}
          />
        )}
      </div>
    </div>
  );
}
