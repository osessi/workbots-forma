"use client";
import React from "react";
import { WizardStep } from "./types";
import { Users, CreditCard, MapPin, GraduationCap, FileText, Check, UserCircle } from "lucide-react";

interface Step {
  id: WizardStep;
  label: string;
  icon: React.ReactNode;
}

// Correction 433a: Ajout de l'étape "Espace apprenant"
const steps: Step[] = [
  { id: "clients", label: "Clients & Participants", icon: <Users size={18} /> },
  { id: "tarifs", label: "Tarifs", icon: <CreditCard size={18} /> },
  { id: "lieu", label: "Lieu & Dates", icon: <MapPin size={18} /> },
  { id: "formateurs", label: "Formateur(s)", icon: <GraduationCap size={18} /> },
  { id: "documents", label: "Documents", icon: <FileText size={18} /> },
  { id: "espaceApprenant", label: "Espace apprenant", icon: <UserCircle size={18} /> },
];

interface WizardStepperProps {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  onStepClick: (step: WizardStep) => void;
}

export default function WizardStepper({
  currentStep,
  completedSteps,
  onStepClick,
}: WizardStepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = step.id === currentStep;
        const isPast = index < currentIndex;
        const isClickable = isCompleted || isPast || isCurrent;

        return (
          <React.Fragment key={step.id}>
            {/* Step */}
            <button
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={`flex flex-col items-center gap-2 group transition-all ${
                isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
              }`}
            >
              {/* Circle */}
              <div
                className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                  isCurrent
                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                    : isCompleted
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                } ${isClickable && !isCurrent ? "group-hover:scale-110" : ""}`}
              >
                {isCompleted && !isCurrent ? (
                  <Check size={18} />
                ) : (
                  step.icon
                )}
              </div>

              {/* Label */}
              <span
                className={`text-xs font-medium text-center max-w-[80px] leading-tight ${
                  isCurrent
                    ? "text-brand-600 dark:text-brand-400"
                    : isCompleted
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {step.label}
              </span>
            </button>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2">
                <div
                  className={`h-0.5 rounded-full transition-all ${
                    index < currentIndex || (isCompleted && index === currentIndex)
                      ? "bg-green-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
