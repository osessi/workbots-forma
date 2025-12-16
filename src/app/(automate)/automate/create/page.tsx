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
  typeSession: [] as string[],
  modalite: "",
  dureeHeures: "",
  dureeJours: "",
  nombreParticipants: "",
  tarifEntreprise: "",
  tarifIndependant: "",
  tarifParticulier: "",
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
  accessibilite: "Nous faisons notre possible pour rendre nos formations accessibles à tous. En cas de besoins particuliers, merci de nous en informer en amont afin que nous puissions envisager les aménagements nécessaires.",
  prerequis: `Aucune compétence technique en informatique ou en data n'est requise
Être à l'aise avec l'utilisation courante d'un ordinateur (mail, navigation web, outils bureautiques)
Manifester un intérêt pour les enjeux du numérique et de l'intelligence artificielle dans son activité professionnelle`,
  publicVise: `Professionnels non spécialistes (salariés, managers, responsables de service, indépendants…) souhaitant comprendre les fondamentaux de l'IA
Personnes impliquées dans des projets de transformation digitale ou d'optimisation de leurs processus de travail
Toute personne souhaitant intégrer l'IA dans son quotidien professionnel`,
  suiviEvaluation: `Feuilles d'émargement signées par demi-journée pour attester de la présence des participants
Évaluation de fin de formation pour valider les acquis des participants
Auto-évaluation des compétences en début et en fin de formation pour mesurer la progression
Questionnaire de satisfaction à chaud remis à chaque participant
Attestation de fin de formation délivrée aux participants ayant suivi l'intégralité de la session`,
  ressourcesPedagogiques: `Formation réalisée en présentiel (en salle équipée, en intra-entreprise) ou à distance via un outil de visioconférence (en classe virtuelle synchrone)
Accompagnement par le formateur : suivi individualisé et réponses aux questions tout au long de la formation
Ateliers pratiques : mises en situation et exercices appliqués pour ancrer les compétences
Supports de cours remis aux participants (version numérique et/ou papier)`,
  delaiAcces: "Le délai d'accès à la formation est de 4 semaines à compter de la validation de la demande de formation.",
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
  organisme: {
    raisonSociale: "",
    representantLegal: "",
    numeroDA: "",
    siret: "",
    adresse: "",
    codePostal: "",
    ville: "",
    email: "",
    telephone: "",
  },
  client: {
    type: "entreprise" as "entreprise" | "independant",
    raisonSociale: "",
    nomDirigeant: "",
    adresse: "",
    codePostal: "",
    ville: "",
    siret: "",
    telephone: "",
    email: "",
  },
  salaries: [
    {
      id: "1",
      nomPrenom: "",
      adresse: "",
      codePostal: "",
      ville: "",
      telephone: "",
      email: "",
      dateNaissance: "",
      villeNaissance: "",
    },
  ],
  particuliers: [
    {
      id: "1",
      nom: "",
      prenom: "",
      adresse: "",
      codePostal: "",
      ville: "",
      email: "",
      telephone: "",
      statut: "",
    },
  ],
  formateur: {
    id: "1",
    nomPrenom: "",
    fonction: "",
  },
  infosPratiques: {
    lieu: "",
    adresse: "",
    codePostal: "",
    ville: "",
    journees: [
      {
        id: "1",
        date: "",
        horaireMatin: "09:00 - 12:30",
        horaireApresMidi: "14:00 - 17:30",
      },
    ],
  },
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

  const handleGenerateProgramme = () => {
    console.log("Générer programme de formation");
  };

  const handleGenerateConvocation = () => {
    console.log("Générer convocation");
  };

  const handleGenerateEmargement = () => {
    console.log("Générer feuilles d'émargement");
  };

  const handleGenerateEvalChaud = () => {
    console.log("Générer évaluation à chaud");
  };

  const handleGenerateEvalFroid = () => {
    console.log("Générer évaluation à froid");
  };

  const handleGenerateEvalFormateur = () => {
    console.log("Générer évaluation formateur");
  };

  const handleGenerateAttestation = () => {
    console.log("Générer attestation de fin de formation");
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
          onGenerateProgramme={handleGenerateProgramme}
          onGenerateConvocation={handleGenerateConvocation}
          onGenerateEmargement={handleGenerateEmargement}
          onGenerateEvalChaud={handleGenerateEvalChaud}
          onGenerateEvalFroid={handleGenerateEvalFroid}
          onGenerateEvalFormateur={handleGenerateEvalFormateur}
          onGenerateAttestation={handleGenerateAttestation}
        />
      )}
    </div>
  );
}
