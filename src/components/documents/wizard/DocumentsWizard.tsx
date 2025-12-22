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
  initialWizardData,
} from "./types";
import WizardStepper from "./WizardStepper";
import StepClients from "./StepClients";
import StepTarifs from "./StepTarifs";
import StepLieu from "./StepLieu";
import StepFormateurs from "./StepFormateurs";
import StepDocuments from "./StepDocuments";
import { Loader2 } from "lucide-react";

interface DocumentsWizardProps {
  formation: FormationInfo;
  onComplete?: (data: WizardData, selectedDocs: string[]) => Promise<void>;
  onCancel?: () => void;
}

export default function DocumentsWizard({
  formation,
  onComplete,
}: DocumentsWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("clients");
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);
  const [data, setData] = useState<WizardData>(initialWizardData);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Charger les données existantes au montage
  useEffect(() => {
    const loadExistingSession = async () => {
      if (!formation.id) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/document-sessions?formationId=${formation.id}`);
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

            // Déterminer les étapes complétées
            const completed: WizardStep[] = [];
            if (result.session.clients?.length > 0) completed.push("clients");
            if (result.session.tarifs?.some((t: SessionTarif) => t.tarifHT > 0)) completed.push("tarifs");
            if (result.session.lieu?.journees?.length > 0) completed.push("lieu");
            if (result.session.formateurs?.formateurPrincipal) completed.push("formateurs");
            if (result.session.generatedDocs?.length > 0) completed.push("documents");
            setCompletedSteps(completed);

            console.log("Session chargée:", result.session.sessionId);
          }
        }
      } catch (error) {
        console.error("Erreur chargement session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingSession();
  }, [formation.id]);

  // Sauvegarder automatiquement les données (debounced)
  const saveSession = useCallback(async (currentData: WizardData) => {
    if (!formation.id) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/document-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formationId: formation.id,
          sessionId,
          clients: currentData.clients,
          tarifs: currentData.tarifs,
          lieu: currentData.lieu,
          formateurs: currentData.formateurs,
        }),
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
  }, [formation.id, sessionId]);

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
  const stepsOrder: WizardStep[] = [
    "clients",
    "tarifs",
    "lieu",
    "formateurs",
    "documents",
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
            onPrev={goPrev}
            onGenerate={handleGenerate}
          />
        )}
      </div>
    </div>
  );
}
