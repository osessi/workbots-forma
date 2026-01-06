"use client";
import React from "react";

export type StepId = "contexte" | "fiche" | "slides" | "evaluations";

interface Step {
  id: StepId;
  number: number;
  label: string;
}

// 4 étapes : la partie Documents est maintenant gérée dans la section Sessions
const steps: Step[] = [
  { id: "contexte", number: 1, label: "Contexte" },
  { id: "fiche", number: 2, label: "Fiche pédagogique" },
  { id: "slides", number: 3, label: "Slides & Support" },
  { id: "evaluations", number: 4, label: "Évaluations" },
];

interface FormationStepperProps {
  currentStep: StepId;
  onStepClick: (stepId: StepId) => void;
  completedSteps?: StepId[];
}

export const FormationStepper: React.FC<FormationStepperProps> = ({
  currentStep,
  onStepClick,
  completedSteps = [],
}) => {
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const getStepStatus = (step: Step, index: number) => {
    if (step.id === currentStep) return "current";
    if (completedSteps.includes(step.id) || index < currentStepIndex) return "completed";
    return "upcoming";
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
      {steps.map((step, index) => {
        const status = getStepStatus(step, index);

        return (
          <button
            key={step.id}
            onClick={() => onStepClick(step.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200
              ${
                status === "current"
                  ? "bg-brand-500 text-white shadow-md"
                  : status === "completed"
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
              }
            `}
          >
            <span
              className={`
                flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold
                ${
                  status === "current"
                    ? "bg-white/20 text-white"
                    : status === "completed"
                    ? "bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }
              `}
            >
              {step.number}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default FormationStepper;
