"use client";
import React, { useState, useCallback } from "react";
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

interface DocumentsWizardProps {
  formation: FormationInfo;
  onComplete?: (data: WizardData, selectedDocs: string[]) => Promise<void>;
  onCancel?: () => void;
}

export default function DocumentsWizard({
  formation,
  onComplete,
  onCancel,
}: DocumentsWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("clients");
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);
  const [data, setData] = useState<WizardData>(initialWizardData);

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

  // Handlers pour chaque étape
  const handleClientsChange = useCallback((clients: SessionClient[]) => {
    setData((prev) => ({ ...prev, clients }));
  }, []);

  const handleTarifsChange = useCallback((tarifs: SessionTarif[]) => {
    setData((prev) => ({ ...prev, tarifs }));
  }, []);

  const handleLieuChange = useCallback((lieu: SessionLieu) => {
    setData((prev) => ({ ...prev, lieu }));
  }, []);

  const handleFormateursChange = useCallback((formateurs: SessionFormateurs) => {
    setData((prev) => ({ ...prev, formateurs }));
  }, []);

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

  return (
    <div className="space-y-8">
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
