"use client";
import React, { useState, useCallback } from "react";
import FormationStepper, { StepId } from "@/components/automate/FormationStepper";
import StepContexte from "@/components/automate/steps/StepContexte";
import StepFichePedagogique from "@/components/automate/steps/StepFichePedagogique";
import StepSlidesSupport from "@/components/automate/steps/StepSlidesSupport";
import StepEvaluations from "@/components/automate/steps/StepEvaluations";
import StepDocuments, { DocumentsData } from "@/components/automate/steps/StepDocuments";
import DocumentGenerationWrapper from "@/components/documents/DocumentGenerationWrapper";

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

// Données initiales vides pour la fiche pédagogique (sera rempli par l'IA)
const initialFicheData = {
  titre: "",
  description: "",
  objectifs: [] as string[],
  contenu: "",
  typeFormation: "",
  duree: "",
  nombreParticipants: "",
  tarifEntreprise: "",
  tarifIndependant: "",
  tarifParticulier: "",
  accessibilite: "Nous faisons notre possible pour rendre nos formations accessibles à tous. En cas de besoins particuliers, merci de nous en informer en amont afin que nous puissions envisager les aménagements nécessaires.",
  prerequis: "",
  publicVise: "",
  suiviEvaluation: "",
  ressourcesPedagogiques: "",
  delaiAcces: "Le délai d'accès à la formation est de 4 semaines à compter de la validation de la demande de formation.",
  imageUrl: "",
};

// Modules vides initialement (sera rempli dynamiquement par l'IA)
const initialModules: Array<{
  id: string;
  titre: string;
  contenu: string[];
}> = [];

// Données initiales pour les documents
const initialDocumentsData: DocumentsData = {
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
    typeLieu: "presentiel" as const,
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

// Types pour la generation
interface FichePedagogiqueGeneree {
  titre?: string;
  objectifGeneral?: string;
  objectifsSpecifiques?: string[];
  publicCible?: string;
  prerequis?: string[];
  dureeTotal?: string;
  modules?: Array<{
    titre: string;
    duree?: string;
    objectifs?: string[];
    contenu?: string[];
    methodePedagogique?: string;
  }>;
  moyensPedagogiques?: string[];
  modalitesEvaluation?: string[];
  sanctionFormation?: string;
  accessibilite?: string;
}

export default function CreateFormationPage() {
  const [currentStep, setCurrentStep] = useState<StepId>("contexte");
  const [completedSteps, setCompletedSteps] = useState<StepId[]>([]);

  // Etats des donnees
  const [contexteData, setContexteData] = useState(initialContexteData);
  const [ficheData, setFicheData] = useState(initialFicheData);
  const [documentsData, setDocumentsData] = useState(initialDocumentsData);
  const [modules, setModules] = useState(initialModules);

  // Etat pour la formation creee (pour la generation de documents)
  const [formationId, setFormationId] = useState<string | null>(null);
  const [isSavingFormation, setIsSavingFormation] = useState(false);

  // Etats pour la generation IA
  const [isGeneratingFiche, setIsGeneratingFiche] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

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

  // Fonction pour generer la fiche pedagogique avec l'IA
  const handleGenerateFiche = useCallback(async (contexte: typeof contexteData) => {
    setIsGeneratingFiche(true);
    setGenerationError(null);

    // Labels pour les modalites
    const modaliteLabel: Record<string, string> = {
      presentiel: "Presentiel",
      distanciel: "Distanciel / Classe virtuelle",
      elearning: "E-learning",
      mixte: "Formation mixte",
    };

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptType: "FICHE_PEDAGOGIQUE",
          context: {
            formation: {
              description: contexte.description,
              duree: contexte.dureeHeures
                ? `${contexte.dureeHeures} heures (${contexte.dureeJours || Math.ceil(parseInt(contexte.dureeHeures) / 7)} jours)`
                : undefined,
              modalites: contexte.modalite ? modaliteLabel[contexte.modalite] || contexte.modalite : undefined,
            },
            metadata: {
              typeSession: contexte.typeSession.join(", "),
              nombreParticipants: contexte.nombreParticipants,
              tarifEntreprise: contexte.tarifEntreprise,
              tarifIndependant: contexte.tarifIndependant,
              tarifParticulier: contexte.tarifParticulier,
            },
          },
          outputFormat: "json",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la generation");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Erreur lors de la generation");
      }

      // Parser le contenu JSON genere
      const genere = data.contentJson as FichePedagogiqueGeneree | null;

      if (genere) {
        // Calculer la duree formatee
        const dureeFormatee = contexte.dureeHeures
          ? `${contexte.dureeHeures} heures (${contexte.dureeJours || Math.ceil(parseInt(contexte.dureeHeures) / 7)} jours)`
          : genere.dureeTotal || "";

        // Formater les tarifs
        const tarifEntrepriseFormate = contexte.tarifEntreprise
          ? `${contexte.tarifEntreprise} € HT`
          : "";
        const tarifIndependantFormate = contexte.tarifIndependant
          ? `${contexte.tarifIndependant} € HT`
          : "";
        const tarifParticulierFormate = contexte.tarifParticulier
          ? `${contexte.tarifParticulier} € TTC`
          : "";

        // Construire le contenu des modules
        const contenuModules = genere.modules
          ? genere.modules
              .map(
                (m, i) =>
                  `Module ${i + 1} - ${m.titre}\n${(m.contenu || []).map((c) => `• ${c}`).join("\n")}`
              )
              .join("\n\n")
          : "";

        // Mettre a jour les donnees de la fiche avec les valeurs generees (pas de fallback vers prev)
        setFicheData({
          titre: genere.titre || "Formation sans titre",
          description: genere.objectifGeneral || contexte.description,
          objectifs: genere.objectifsSpecifiques || [],
          prerequis: (genere.prerequis || []).join("\n"),
          publicVise: genere.publicCible || "",
          typeFormation: modaliteLabel[contexte.modalite] || contexte.modalite || "",
          duree: dureeFormatee,
          nombreParticipants: contexte.nombreParticipants || "",
          tarifEntreprise: tarifEntrepriseFormate,
          tarifIndependant: tarifIndependantFormate,
          tarifParticulier: tarifParticulierFormate,
          accessibilite: "Nous faisons notre possible pour rendre nos formations accessibles à tous. En cas de besoins particuliers, merci de nous en informer en amont afin que nous puissions envisager les aménagements nécessaires.",
          suiviEvaluation: "Feuilles de presence\nFormulaires d'evaluation de la formation\nQuiz de validation des acquis en fin de module\nAttestation de fin de formation",
          ressourcesPedagogiques: "Support de formation projete\nMise a disposition en ligne des supports\nExercices pratiques et mises en situation\nEtudes de cas",
          contenu: contenuModules,
          delaiAcces: "Le délai d'accès à la formation est de 4 semaines à compter de la validation de la demande de formation.",
          imageUrl: "", // Sera defini par l'utilisateur dans l'etape suivante
        });

        // Mettre a jour les modules - l'IA determine le nombre de modules necessaires
        if (genere.modules && genere.modules.length > 0) {
          setModules(
            genere.modules.map((m, i) => ({
              id: String(i + 1),
              titre: `Module ${i + 1} - ${m.titre}`,
              contenu: m.contenu || [],
            }))
          );
        }
      }

      // Passer a l'etape suivante
      goToNextStep("contexte", "fiche");
    } catch (error) {
      console.error("Erreur generation fiche:", error);
      setGenerationError(
        error instanceof Error ? error.message : "Erreur lors de la generation de la fiche"
      );
      // Afficher une alerte mais permettre de continuer
      alert(
        `Erreur lors de la generation: ${error instanceof Error ? error.message : "Erreur inconnue"}. Vous pouvez remplir manuellement les informations.`
      );
      // Passer quand meme a l'etape suivante pour permettre la saisie manuelle
      goToNextStep("contexte", "fiche");
    } finally {
      setIsGeneratingFiche(false);
    }
  }, [goToNextStep]);

  // Fonction pour sauvegarder la formation avant generation de documents
  const saveFormationForDocuments = useCallback(async (): Promise<string | null> => {
    // Si déjà une formation, la retourner
    if (formationId) return formationId;

    setIsSavingFormation(true);
    try {
      const response = await fetch("/api/formations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: ficheData.titre,
          description: ficheData.description,
          fichePedagogique: {
            objectifs: ficheData.objectifs,
            contenu: ficheData.contenu,
            typeFormation: ficheData.typeFormation,
            duree: ficheData.duree,
            dureeHeures: parseInt(contexteData.dureeHeures) || 14,
            dureeJours: parseInt(contexteData.dureeJours) || 2,
            nombreParticipants: ficheData.nombreParticipants,
            tarifEntreprise: ficheData.tarifEntreprise,
            tarifIndependant: ficheData.tarifIndependant,
            tarifParticulier: ficheData.tarifParticulier,
            accessibilite: ficheData.accessibilite,
            prerequis: ficheData.prerequis,
            publicVise: ficheData.publicVise,
            suiviEvaluation: ficheData.suiviEvaluation,
            ressourcesPedagogiques: ficheData.ressourcesPedagogiques,
            delaiAcces: ficheData.delaiAcces,
            modalites: contexteData.modalite,
            prix: parseInt(contexteData.tarifEntreprise) || 0,
          },
          modules: modules.map((m, index) => ({
            titre: m.titre,
            ordre: index + 1,
            contenu: { contenu: m.contenu },
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde de la formation");
      }

      const data = await response.json();
      setFormationId(data.id);
      return data.id;
    } catch (error) {
      console.error("Erreur sauvegarde formation:", error);
      alert("Erreur lors de la sauvegarde de la formation. Veuillez réessayer.");
      return null;
    } finally {
      setIsSavingFormation(false);
    }
  }, [formationId, ficheData, contexteData, modules]);

  // Handlers pour les generations de slides (a implementer avec Gamma)
  const handleGeneratePowerPoint = (moduleId: string) => {
    console.log("Generer PowerPoint pour module:", moduleId);
    // TODO: Integrer Gamma API pour generation de slides
  };

  const handleGenerateSupport = (moduleId: string) => {
    console.log("Generer support pour module:", moduleId);
    // TODO: Integrer Gamma API pour generation de support apprenant
  };

  // Mapping des types de documents vers les types API
  const documentTypeMapping: Record<string, string> = {
    convention: "CONVENTION",
    contrat: "CONTRAT_FORMATION",
    programme: "FICHE_PEDAGOGIQUE",
    convocation: "CONVOCATION",
    emargement: "ATTESTATION_PRESENCE",
    evalChaud: "EVALUATION_CHAUD",
    evalFroid: "EVALUATION_FROID",
    evalFormateur: "EVALUATION_FORMATEUR",
    attestation: "ATTESTATION_FIN",
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

      {/* Contenu de l'etape */}
      {currentStep === "contexte" && (
        <StepContexte
          data={contexteData}
          onChange={setContexteData}
          onNext={() => goToNextStep("contexte", "fiche")}
          onGenerateFiche={handleGenerateFiche}
          isGenerating={isGeneratingFiche}
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
          modules={modules}
          onNext={() => goToNextStep("slides", "evaluations")}
          onPrevious={() => goToPreviousStep("fiche")}
          onGeneratePowerPoint={handleGeneratePowerPoint}
          onGenerateSupport={handleGenerateSupport}
        />
      )}

      {currentStep === "evaluations" && (
        <StepEvaluations
          modules={modules}
          formationTitre={ficheData.titre}
          formationObjectifs={ficheData.objectifs}
          onNext={() => goToNextStep("evaluations", "documents")}
          onPrevious={() => goToPreviousStep("slides")}
        />
      )}

      {currentStep === "documents" && (
        <DocumentGenerationWrapper
          formationId={formationId || ""}
          onSaveFormation={saveFormationForDocuments}
        >
          {({ generateDocument, isGenerating, generatingType }) => (
            <StepDocuments
              data={documentsData}
              onChange={setDocumentsData}
              isGenerating={isGenerating || isSavingFormation}
              generatingType={generatingType}
              onGenerateConvention={() => generateDocument(documentTypeMapping.convention)}
              onGenerateContrat={() => generateDocument(documentTypeMapping.contrat)}
              onGenerateProgramme={() => generateDocument(documentTypeMapping.programme)}
              onGenerateConvocation={() => generateDocument(documentTypeMapping.convocation)}
              onGenerateEmargement={() => generateDocument(documentTypeMapping.emargement)}
              onGenerateEvalChaud={() => generateDocument(documentTypeMapping.evalChaud)}
              onGenerateEvalFroid={() => generateDocument(documentTypeMapping.evalFroid)}
              onGenerateEvalFormateur={() => generateDocument(documentTypeMapping.evalFormateur)}
              onGenerateAttestation={() => generateDocument(documentTypeMapping.attestation)}
            />
          )}
        </DocumentGenerationWrapper>
      )}
    </div>
  );
}
