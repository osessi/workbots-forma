"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import FormationStepper, { StepId } from "@/components/automate/FormationStepper";
import StepContexte from "@/components/automate/steps/StepContexte";
import StepFichePedagogique from "@/components/automate/steps/StepFichePedagogique";
import StepSlidesSupport from "@/components/automate/steps/StepSlidesSupport";
import StepEvaluations from "@/components/automate/steps/StepEvaluations";
import { DocumentsWizard, WizardData, FormationInfo } from "@/components/documents/wizard";
import { useAutomate } from "@/context/AutomateContext";

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
  const searchParams = useSearchParams();
  const editFormationId = searchParams.get("id");
  const { refreshFormations } = useAutomate();

  const [currentStep, setCurrentStep] = useState<StepId>("contexte");
  const [completedSteps, setCompletedSteps] = useState<StepId[]>([]);

  // Etats des donnees
  const [contexteData, setContexteData] = useState(initialContexteData);
  const [ficheData, setFicheData] = useState(initialFicheData);
  const [modules, setModules] = useState(initialModules);

  // Etat pour la formation creee (pour la generation de documents)
  const [formationId, setFormationId] = useState<string | null>(editFormationId);
  const [isSavingFormation, setIsSavingFormation] = useState(false);

  // Etats pour la generation IA
  const [isGeneratingFiche, setIsGeneratingFiche] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Charger une formation existante si on est en mode édition
  useEffect(() => {
    if (editFormationId) {
      loadExistingFormation(editFormationId);
    }
  }, [editFormationId]);

  // Fonction pour charger une formation existante
  const loadExistingFormation = async (id: string) => {
    try {
      const response = await fetch(`/api/formations/${id}`);
      if (response.ok) {
        const formation = await response.json();

        // Restaurer les données du contexte depuis fichePedagogique
        const fiche = formation.fichePedagogique as Record<string, unknown> || {};

        setContexteData({
          typeSession: fiche.typeSession as string[] || [],
          modalite: fiche.modalite as string || "",
          dureeHeures: String(fiche.dureeHeures || ""),
          dureeJours: String(fiche.dureeJours || ""),
          nombreParticipants: String(fiche.nombreParticipants || ""),
          tarifEntreprise: String(fiche.tarifEntreprise || ""),
          tarifIndependant: String(fiche.tarifIndependant || ""),
          tarifParticulier: String(fiche.tarifParticulier || ""),
          description: fiche.description as string || formation.description || "",
        });

        setFicheData({
          titre: formation.titre || "",
          description: fiche.objectifGeneral as string || "",
          objectifs: fiche.objectifs as string[] || [],
          contenu: fiche.contenu as string || "",
          typeFormation: fiche.typeFormation as string || "",
          duree: fiche.duree as string || "",
          nombreParticipants: String(fiche.nombreParticipants || ""),
          tarifEntreprise: fiche.tarifEntrepriseFormate as string || "",
          tarifIndependant: fiche.tarifIndependantFormate as string || "",
          tarifParticulier: fiche.tarifParticulierFormate as string || "",
          accessibilite: fiche.accessibilite as string || initialFicheData.accessibilite,
          prerequis: fiche.prerequis as string || "",
          publicVise: fiche.publicVise as string || "",
          suiviEvaluation: fiche.suiviEvaluation as string || "",
          ressourcesPedagogiques: fiche.ressourcesPedagogiques as string || "",
          delaiAcces: fiche.delaiAcces as string || initialFicheData.delaiAcces,
          imageUrl: formation.image || "",
        });

        // Restaurer les modules
        if (formation.modules && formation.modules.length > 0) {
          setModules(formation.modules.map((m: { id: string; titre: string; contenu?: { items?: string[] } }) => ({
            id: m.id,
            titre: m.titre,
            contenu: m.contenu?.items || [],
          })));
        }

        // Déterminer les étapes complétées selon le statut
        if (formation.status === "EN_COURS" || formation.status === "TERMINEE") {
          setCompletedSteps(["contexte", "fiche"]);
          setCurrentStep("slides");
        } else if (formation.titre) {
          setCompletedSteps(["contexte"]);
          setCurrentStep("fiche");
        }

        setFormationId(id);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la formation:", error);
    }
  };

  // Fonction pour sauvegarder la formation en BDD
  const saveFormation = useCallback(async (titre: string, fiche: typeof ficheData, mods: typeof modules): Promise<string | null> => {
    setIsSavingFormation(true);
    try {
      const payload = {
        titre,
        description: fiche.description,
        fichePedagogique: {
          ...fiche,
          ...contexteData,
          objectifGeneral: fiche.description,
        },
        modules: mods.map((m, i) => ({
          titre: m.titre,
          ordre: i + 1,
          contenu: { items: m.contenu },
        })),
      };

      if (formationId) {
        // Mise à jour
        const response = await fetch(`/api/formations/${formationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          await refreshFormations();
          return formationId;
        }
      } else {
        // Création
        const response = await fetch("/api/formations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const newFormation = await response.json();
          setFormationId(newFormation.id);
          await refreshFormations();
          return newFormation.id;
        }
      }
      return null;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      return null;
    } finally {
      setIsSavingFormation(false);
    }
  }, [formationId, contexteData, refreshFormations]);

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
        const newModules = genere.modules && genere.modules.length > 0
          ? genere.modules.map((m, i) => ({
              id: String(i + 1),
              titre: `Module ${i + 1} - ${m.titre}`,
              contenu: m.contenu || [],
            }))
          : [];

        if (newModules.length > 0) {
          setModules(newModules);
        }

        // Sauvegarder automatiquement la formation en BDD
        const titreFormation = genere.titre || "Formation sans titre";
        const newFicheData = {
          titre: titreFormation,
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
          imageUrl: "",
        };

        // Sauvegarder en BDD (asynchrone, ne bloque pas la navigation)
        saveFormation(titreFormation, newFicheData, newModules);
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

  // Fonction pour obtenir les infos de la formation pour le wizard Documents
  const getFormationInfo = useCallback((): FormationInfo => {
    // Parser les tarifs depuis les chaînes (ex: "1500 € HT" -> 1500)
    const parseTarif = (tarifStr: string): number => {
      if (!tarifStr) return 0;
      const match = tarifStr.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };

    return {
      id: formationId || undefined,
      titre: ficheData.titre || "Formation",
      tarifEntreprise: parseTarif(ficheData.tarifEntreprise) || parseInt(contexteData.tarifEntreprise) || 0,
      tarifIndependant: parseTarif(ficheData.tarifIndependant) || parseInt(contexteData.tarifIndependant) || 0,
      tarifParticulier: parseTarif(ficheData.tarifParticulier) || parseInt(contexteData.tarifParticulier) || 0,
      dureeHeures: parseInt(contexteData.dureeHeures) || 14,
      dureeJours: parseInt(contexteData.dureeJours) || 2,
    };
  }, [formationId, ficheData, contexteData]);

  // Callback quand la génération de documents est terminée
  const handleDocumentsComplete = useCallback(async (data: WizardData, selectedDocs: string[]) => {
    console.log("Documents wizard complete:", data);
    console.log("Documents sélectionnés:", selectedDocs);

    // TODO: Implémenter la génération réelle des documents
    // Pour l'instant, marquer l'étape comme terminée
    if (!completedSteps.includes("documents")) {
      setCompletedSteps([...completedSteps, "documents"]);
    }
  }, [completedSteps]);

  // Handlers pour les generations de slides (a implementer avec Gamma)
  const handleGeneratePowerPoint = (moduleId: string) => {
    console.log("Generer PowerPoint pour module:", moduleId);
    // TODO: Integrer Gamma API pour generation de slides
  };

  const handleGenerateSupport = (moduleId: string) => {
    console.log("Generer support pour module:", moduleId);
    // TODO: Integrer Gamma API pour generation de support apprenant
  };

  return (
    <div className="space-y-6">
      {/* Indicateur de sauvegarde */}
      {isSavingFormation && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg shadow-lg">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium">Sauvegarde en cours...</span>
        </div>
      )}

      {/* Badge formation sauvegardée */}
      {formationId && !isSavingFormation && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm dark:bg-green-500/20 dark:text-green-400">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Formation sauvegardée
        </div>
      )}

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
          onNext={async () => {
            // Sauvegarder les modifications de la fiche avant de passer à l'étape suivante
            await saveFormation(ficheData.titre, ficheData, modules);
            goToNextStep("fiche", "slides");
          }}
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
        <DocumentsWizard
          formation={getFormationInfo()}
          onComplete={handleDocumentsComplete}
        />
      )}
    </div>
  );
}
