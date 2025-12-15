"use client";
import React, { useState } from "react";
import FormationStepper, { StepId } from "@/components/automate/FormationStepper";
import StepContexte from "@/components/automate/steps/StepContexte";
import StepFichePedagogique from "@/components/automate/steps/StepFichePedagogique";
import StepSlidesSupport from "@/components/automate/steps/StepSlidesSupport";
import StepEvaluations from "@/components/automate/steps/StepEvaluations";
import StepDocuments from "@/components/automate/steps/StepDocuments";

// Données initiales pour l'étape Contexte
const initialContexteData = {
  dureeHeures: "",
  dureeJours: "",
  modalite: "",
  tarif: "",
  nombreParticipants: "",
  description: "",
};

// Données initiales pour la fiche pédagogique (exemple)
const initialFicheData = {
  titre: "Les bases de l'intelligence artificielle",
  description:
    "Cette formation de deux jours a pour objectif de rendre accessibles les notions essentielles de l'intelligence artificielle (IA) à des professionnels non spécialistes. Elle permet de comprendre ce qu'est réellement l'IA, comment elle fonctionne, quelles sont ses principales applications concrètes en entreprise et comment l'utiliser de manière responsable.",
  objectifs: [
    "Comprendre ce qu'est (et ce que n'est pas) l'intelligence artificielle",
    "Identifier les principales familles d'IA (IA symbolique, machine learning, IA générative)",
    "Comprendre le rôle des données et des algorithmes dans le fonctionnement de l'IA",
    "Utiliser quelques outils d'IA simples (dont l'IA générative) pour gagner du temps au quotidien",
  ],
  contenu: `Module 1 – Introduction à l'intelligence artificielle
• Définir l'intelligence artificielle : histoire, mythes et réalités
• Panorama des grands types d'IA
• Quelques exemples d'IA dans le quotidien (recommandations, GPS, assistants vocaux...)

Module 2 – Données, algorithmes et apprentissage automatique
• Qu'est-ce qu'une donnée ? Données structurées / non structurées
• Principes de base du machine learning (apprentissage supervisé / non supervisé, entraînement d'un modèle)
• Notion de surapprentissage et de qualité des données`,
  typeFormation: "Présentiel",
  duree: "14 heures (2 jours)",
  nombreParticipants: "12",
  tarif: "1200 € HT / participant",
  accessibilite: "Oui",
};

// Modules pour les étapes Slides et Évaluations
const initialModules = [
  {
    id: "1",
    titre: "Module 1 – Introduction à l'intelligence artificielle",
    contenu: [
      "Définir l'intelligence artificielle : histoire, mythes et réalités",
      "Panorama des grands types d'IA",
      "Quelques exemples d'IA dans le quotidien (recommandations, GPS, assistants vocaux...)",
    ],
  },
  {
    id: "2",
    titre: "Module 2 – Données, algorithmes et apprentissage automatique",
    contenu: [
      "Qu'est-ce qu'une donnée ? Données structurées / non structurées",
      "Principes de base du machine learning (apprentissage supervisé / non supervisé, entraînement d'un modèle)",
      "Notion de surapprentissage et de qualité des données",
    ],
  },
  {
    id: "3",
    titre: "Module 3 – Découvrir l'IA générative",
    contenu: [
      "Principe de l'IA générative (texte, image, son, vidéo).",
      "Fonctionnement général des modèles de langage (type ChatGPT).",
      "Démonstrations : génération de texte, reformulation, synthèse, idées de contenu.",
      "Notions de prompt et de bonnes pratiques de questionnement.",
    ],
  },
  {
    id: "4",
    titre: "Module 4 – Cas d'usage de l'IA en entreprise",
    contenu: [],
  },
];

// Données initiales pour les documents
const initialDocumentsData = {
  entreprise: {
    raisonSociale: "",
    nomDirigeant: "",
    siret: "",
    adresse: "",
  },
  salaries: [
    {
      id: "1",
      nomPrenom: "",
      adresse: "",
      codePostal: "",
      ville: "",
    },
  ],
  independants: [
    {
      id: "1",
      raisonSociale: "",
      nomDirigeant: "",
      siret: "",
      adresse: "",
    },
  ],
  formateur: {
    id: "1",
    nomPrenom: "",
    fonction: "",
  },
  formateurs: [
    {
      id: "1",
      nomPrenom: "",
      fonction: "",
    },
  ],
};

export default function CreateFormationPage() {
  const [currentStep, setCurrentStep] = useState<StepId>("contexte");
  const [completedSteps, setCompletedSteps] = useState<StepId[]>([]);

  // États des données
  const [contexteData, setContexteData] = useState(initialContexteData);
  const [ficheData, setFicheData] = useState(initialFicheData);
  const [documentsData, setDocumentsData] = useState(initialDocumentsData);

  const handleStepClick = (stepId: StepId) => {
    setCurrentStep(stepId);
  };

  const goToNextStep = (currentStepId: StepId, nextStepId: StepId) => {
    if (!completedSteps.includes(currentStepId)) {
      setCompletedSteps([...completedSteps, currentStepId]);
    }
    setCurrentStep(nextStepId);
  };

  const goToPreviousStep = (previousStepId: StepId) => {
    setCurrentStep(previousStepId);
  };

  // Handlers pour les générations (à implémenter avec l'IA)
  const handleGeneratePowerPoint = (moduleId: string) => {
    console.log("Générer PowerPoint pour module:", moduleId);
  };

  const handleGenerateSupport = (moduleId: string) => {
    console.log("Générer support pour module:", moduleId);
  };

  const handleGeneratePositionnement = () => {
    console.log("Générer test de positionnement");
  };

  const handleGenerateEvaluationFinale = () => {
    console.log("Générer évaluation finale");
  };

  const handleGenerateQCM = (moduleId: string) => {
    console.log("Générer QCM pour module:", moduleId);
  };

  const handleGenerateConvention = () => {
    console.log("Générer convention de formation");
  };

  const handleGenerateContrat = () => {
    console.log("Générer contrat de formation");
  };

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <FormationStepper
          currentStep={currentStep}
          onStepClick={handleStepClick}
          completedSteps={completedSteps}
        />
      </div>

      {/* Contenu de l'étape */}
      {currentStep === "contexte" && (
        <StepContexte
          data={contexteData}
          onChange={setContexteData}
          onNext={() => goToNextStep("contexte", "fiche")}
        />
      )}

      {currentStep === "fiche" && (
        <StepFichePedagogique
          data={ficheData}
          onChange={setFicheData}
          onNext={() => goToNextStep("fiche", "slides")}
          onPrevious={() => goToPreviousStep("contexte")}
        />
      )}

      {currentStep === "slides" && (
        <StepSlidesSupport
          modules={initialModules}
          onNext={() => goToNextStep("slides", "evaluations")}
          onPrevious={() => goToPreviousStep("fiche")}
          onGeneratePowerPoint={handleGeneratePowerPoint}
          onGenerateSupport={handleGenerateSupport}
        />
      )}

      {currentStep === "evaluations" && (
        <StepEvaluations
          modules={initialModules}
          onNext={() => goToNextStep("evaluations", "documents")}
          onPrevious={() => goToPreviousStep("slides")}
          onGeneratePositionnement={handleGeneratePositionnement}
          onGenerateEvaluationFinale={handleGenerateEvaluationFinale}
          onGenerateQCM={handleGenerateQCM}
        />
      )}

      {currentStep === "documents" && (
        <StepDocuments
          data={documentsData}
          onChange={setDocumentsData}
          onGenerateConvention={handleGenerateConvention}
          onGenerateContrat={handleGenerateContrat}
        />
      )}
    </div>
  );
}
