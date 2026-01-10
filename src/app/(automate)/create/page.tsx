"use client";
import { useState, useCallback, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import FormationStepper, { StepId } from "@/components/automate/FormationStepper";
import StepContexte from "@/components/automate/steps/StepContexte";
import StepFichePedagogique from "@/components/automate/steps/StepFichePedagogique";
import StepSlidesSupport from "@/components/automate/steps/StepSlidesSupport";
import StepEvaluations, { EvaluationsDataSaved } from "@/components/automate/steps/StepEvaluations";
import { useAutomate } from "@/context/AutomateContext";

// Composant de chargement pour le Suspense
function CreateFormationLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-8 w-8 text-brand-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-gray-500 dark:text-gray-400">Chargement...</span>
      </div>
    </div>
  );
}

// Textes fixes qui ne doivent JAMAIS être modifiés par l'IA
const FIXED_SUIVI_EVALUATION = `Feuilles d'émargement signées par demi-journée pour attester de la présence des participants
Évaluation de fin de formation pour valider les acquis des participants
Auto-évaluation des compétences en début et en fin de formation pour mesurer la progression
Questionnaire de satisfaction à chaud remis à chaque participant
Attestation de fin de formation délivrée aux participants ayant suivi l'intégralité de la session`;

const FIXED_RESSOURCES_PEDAGOGIQUES = `Formation réalisée en présentiel (en salle équipée, en intra-entreprise) ou à distance via un outil de visioconférence (en classe virtuelle synchrone)
Accompagnement par le formateur : suivi individualisé et réponses aux questions tout au long de la formation
Ateliers pratiques ou QCM pour valider les acquis des modules de formation
Supports de cours remis aux participants (version numérique et/ou papier)`;

// Fonction pour générer le texte de l'équipe pédagogique avec le nom de l'organisation
const getEquipePedagogiqueText = (organisationName: string) => {
  const name = organisationName || "Notre organisme de formation";
  return `${name} réunit une équipe de formateurs expérimentés, sélectionnés pour leur expertise métier et leur pédagogie. Notre objectif : proposer des formations structurées et orientées résultats, avec un accompagnement de qualité tout au long du parcours.`;
};

const FIXED_DELAI_ACCES = `Le délai d'accès à la formation est de 4 semaines à compter de la validation de la demande de formation.`;

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
  // Qualiopi IND 3 - Certification
  isCertifiante: false,
  numeroFicheRS: "",
  referentielRSUrl: "",
  lienFranceCompetences: "",
  // Éligibilité CPF
  estEligibleCPF: false,
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
  suiviEvaluation: FIXED_SUIVI_EVALUATION,
  equipePedagogique: "", // Sera rempli dynamiquement avec le nom de l'organisation
  ressourcesPedagogiques: FIXED_RESSOURCES_PEDAGOGIQUES,
  delaiAcces: FIXED_DELAI_ACCES,
  imageUrl: "",
};

// Modules vides initialement (sera rempli dynamiquement par l'IA)
const initialModules: Array<{
  id: string;
  titre: string;
  contenu: string[];
  isModuleZero?: boolean; // Qualiopi IND 10 - Module 0 de mise à niveau
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
    isModuleZero?: boolean; // Qualiopi IND 10 - Module 0 de mise à niveau
  }>;
  moyensPedagogiques?: string[];
  modalitesEvaluation?: string[];
  sanctionFormation?: string;
  accessibilite?: string;
}

function CreateFormationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editFormationId = searchParams.get("id");
  const { refreshFormations, user } = useAutomate();

  // Nom de l'organisation pour les textes fixes
  const organisationName = user.entreprise || "Notre organisme de formation";

  const [currentStep, setCurrentStep] = useState<StepId>("contexte");
  const [completedSteps, setCompletedSteps] = useState<StepId[]>([]);

  // Etats des donnees
  const [contexteData, setContexteData] = useState(initialContexteData);
  const [ficheData, setFicheData] = useState(initialFicheData);
  const [modules, setModules] = useState(initialModules);
  const [evaluationsData, setEvaluationsData] = useState<EvaluationsDataSaved | null>(null);

  // Etat pour la formation creee (pour la generation de documents)
  const [formationId, setFormationId] = useState<string | null>(editFormationId);
  const [isSavingFormation, setIsSavingFormation] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editFormationId);

  // Etats pour la generation IA
  const [isGeneratingFiche, setIsGeneratingFiche] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Refs pour l'auto-save avec debounce
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>("");

  // Fonction d'auto-save avec debounce (2 secondes)
  const autoSave = useCallback(async (
    dataToSave: {
      currentStep?: StepId;
      completedSteps?: StepId[];
      contexteData?: typeof contexteData;
      ficheData?: typeof ficheData;
      modules?: typeof modules;
      evaluationsData?: EvaluationsDataSaved | null;
    }
  ) => {
    // Annuler le timeout précédent
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Créer un hash des données pour éviter les sauvegardes inutiles
    const dataHash = JSON.stringify(dataToSave);
    if (dataHash === lastSavedDataRef.current) {
      return; // Pas de changement, on ne sauvegarde pas
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (!formationId) return;

      try {
        setIsSavingFormation(true);
        const payload: Record<string, unknown> = {};

        if (dataToSave.currentStep) payload.currentStep = dataToSave.currentStep;
        if (dataToSave.completedSteps) payload.completedSteps = dataToSave.completedSteps;
        if (dataToSave.contexteData) payload.contexteData = dataToSave.contexteData;

        // Si on a des données de fiche, mettre à jour fichePedagogique
        if (dataToSave.ficheData) {
          payload.titre = dataToSave.ficheData.titre;
          payload.description = dataToSave.ficheData.description;
          payload.image = dataToSave.ficheData.imageUrl;

          // Récupérer les tarifs depuis contexteData (valeurs brutes)
          const ctx = dataToSave.contexteData || contexteData;

          payload.fichePedagogique = {
            ...dataToSave.ficheData,
            ...ctx,
            objectifGeneral: dataToSave.ficheData.description,
            // Sauvegarder les tarifs formatés ET les valeurs brutes pour éviter la perte
            tarifEntrepriseFormate: dataToSave.ficheData.tarifEntreprise,
            tarifIndependantFormate: dataToSave.ficheData.tarifIndependant,
            tarifParticulierFormate: dataToSave.ficheData.tarifParticulier,
          };
        }

        // Si on a des modules, les sauvegarder aussi
        if (dataToSave.modules && dataToSave.modules.length > 0) {
          payload.modules = dataToSave.modules.map((m, i) => ({
            titre: m.titre,
            ordre: m.isModuleZero ? -1 : i + 1, // Module 0 a ordre -1
            contenu: { items: m.contenu },
            isModuleZero: m.isModuleZero || false,
          }));
        }

        // Si on a des évaluations, les sauvegarder
        if (dataToSave.evaluationsData) {
          payload.evaluationsData = dataToSave.evaluationsData;
        }

        const response = await fetch(`/api/formations/${formationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          lastSavedDataRef.current = dataHash;
        }
      } catch (error) {
        console.error("Erreur auto-save:", error);
      } finally {
        setIsSavingFormation(false);
      }
    }, 2000); // 2 secondes de debounce
  }, [formationId, contexteData]);

  // Auto-save quand contexteData change
  useEffect(() => {
    if (formationId && currentStep === "contexte") {
      autoSave({ contexteData, currentStep });
    }
  }, [contexteData, formationId, currentStep, autoSave]);

  // Auto-save quand ficheData change
  useEffect(() => {
    if (formationId && currentStep === "fiche") {
      autoSave({ ficheData, modules, currentStep });
    }
  }, [ficheData, modules, formationId, currentStep, autoSave]);

  // Auto-save quand on change d'étape
  useEffect(() => {
    if (formationId) {
      autoSave({ currentStep, completedSteps });
    }
  }, [currentStep, completedSteps, formationId, autoSave]);

  // Auto-save quand evaluationsData change
  useEffect(() => {
    if (formationId && currentStep === "evaluations" && evaluationsData) {
      autoSave({ evaluationsData, currentStep });
    }
  }, [evaluationsData, formationId, currentStep, autoSave]);

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Initialiser l'équipe pédagogique avec le nom de l'organisation
  useEffect(() => {
    if (organisationName && !editFormationId && !ficheData.equipePedagogique) {
      setFicheData(prev => ({
        ...prev,
        equipePedagogique: getEquipePedagogiqueText(organisationName)
      }));
    }
  }, [organisationName, editFormationId, ficheData.equipePedagogique]);

  // Synchroniser les modules quand le contenu de la fiche pédagogique change (Corrections 166-167)
  // Ceci assure que les modules affichés dans "Évaluations par module" correspondent
  // toujours aux modules définis dans le "Contenu de la formation"
  useEffect(() => {
    if (!ficheData.contenu || ficheData.contenu.trim() === "") return;

    // Parser le contenu pour extraire les modules
    const parseModulesFromContenu = (contenu: string) => {
      const parsedModules: Array<{ id: string; titre: string; contenu: string[]; isModuleZero?: boolean }> = [];
      const lines = contenu.split("\n");
      let currentModule: { id: string; titre: string; contenu: string[]; isModuleZero?: boolean } | null = null;

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Détecter un titre de module (ex: "Module 1 - Introduction à..." ou "Module 0 - Mise à niveau")
        const moduleMatch = trimmedLine.match(/^Module\s*(\d+)\s*[-–:]\s*(.+)/i);
        if (moduleMatch) {
          // Sauvegarder le module précédent
          if (currentModule && currentModule.titre) {
            parsedModules.push(currentModule);
          }

          const moduleNum = parseInt(moduleMatch[1]);
          const moduleTitre = trimmedLine; // Garder le titre complet "Module X - Titre"
          const isModuleZero = moduleNum === 0;

          currentModule = {
            id: String(moduleNum),
            titre: moduleTitre,
            contenu: [],
            isModuleZero,
          };
        } else if (currentModule) {
          // Ajouter le contenu au module courant (retirer le bullet point si présent)
          const cleanedLine = trimmedLine.replace(/^[•\-\*]\s*/, "").trim();
          if (cleanedLine) {
            currentModule.contenu.push(cleanedLine);
          }
        }
      }

      // Ajouter le dernier module
      if (currentModule && currentModule.titre) {
        parsedModules.push(currentModule);
      }

      return parsedModules;
    };

    const parsedModules = parseModulesFromContenu(ficheData.contenu);

    // Ne mettre à jour que si on a trouvé des modules ET que c'est différent
    if (parsedModules.length > 0) {
      // Comparer avec les modules actuels pour éviter les updates inutiles
      const currentModulesStr = JSON.stringify(modules.map(m => ({ id: m.id, titre: m.titre })));
      const parsedModulesStr = JSON.stringify(parsedModules.map(m => ({ id: m.id, titre: m.titre })));

      if (currentModulesStr !== parsedModulesStr) {
        setModules(parsedModules);
      }
    }
  }, [ficheData.contenu, modules]);

  // Charger une formation existante si on est en mode édition
  useEffect(() => {
    if (editFormationId) {
      loadExistingFormation(editFormationId);
    }
  }, [editFormationId]);

  // Fonction pour charger une formation existante
  const loadExistingFormation = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/formations/${id}`);
      if (response.ok) {
        const formation = await response.json();

        // Priorité 1: Charger depuis contexteData si disponible (nouveau format)
        const savedContexte = formation.contexteData as Record<string, unknown> | null;
        // Priorité 2: Fallback sur fichePedagogique (ancien format)
        const fiche = formation.fichePedagogique as Record<string, unknown> || {};

        // Restaurer les données du contexte
        if (savedContexte) {
          // Nouveau format: données sauvegardées directement
          setContexteData({
            typeSession: savedContexte.typeSession as string[] || [],
            modalite: savedContexte.modalite as string || "",
            dureeHeures: String(savedContexte.dureeHeures || ""),
            dureeJours: String(savedContexte.dureeJours || ""),
            nombreParticipants: String(savedContexte.nombreParticipants || ""),
            tarifEntreprise: String(savedContexte.tarifEntreprise || ""),
            tarifIndependant: String(savedContexte.tarifIndependant || ""),
            tarifParticulier: String(savedContexte.tarifParticulier || ""),
            description: savedContexte.description as string || "",
            // Qualiopi IND 3 - Certification
            isCertifiante: Boolean(savedContexte.isCertifiante) || formation.isCertifiante || false,
            numeroFicheRS: String(savedContexte.numeroFicheRS || formation.numeroFicheRS || ""),
            referentielRSUrl: String(savedContexte.referentielRSUrl || formation.referentielRSUrl || ""),
            lienFranceCompetences: String(savedContexte.lienFranceCompetences || formation.lienFranceCompetences || ""),
            // Éligibilité CPF
            estEligibleCPF: Boolean(savedContexte.estEligibleCPF) || false,
          });
        } else {
          // Ancien format: extraire depuis fichePedagogique
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
            // Qualiopi IND 3 - Certification
            isCertifiante: Boolean(fiche.isCertifiante) || formation.isCertifiante || false,
            numeroFicheRS: String(fiche.numeroFicheRS || formation.numeroFicheRS || ""),
            referentielRSUrl: String(fiche.referentielRSUrl || formation.referentielRSUrl || ""),
            lienFranceCompetences: String(fiche.lienFranceCompetences || formation.lienFranceCompetences || ""),
            // Éligibilité CPF
            estEligibleCPF: Boolean(fiche.estEligibleCPF) || false,
          });
        }

        // Restaurer les données de la fiche pédagogique
        // Les tarifs peuvent être stockés sous différents noms (tarifEntreprise, tarifEntrepriseFormate)
        // ou dans contexteData, donc on vérifie toutes les sources
        const getTarif = (field: string, formateField: string): string => {
          // Priorité 1: Valeur formatée dans la fiche (ex: "1500 € HT")
          if (fiche[formateField]) return String(fiche[formateField]);
          // Priorité 2: Valeur simple dans la fiche
          if (fiche[field]) {
            const val = String(fiche[field]);
            // Si c'est déjà formaté, retourner tel quel
            if (val.includes("€")) return val;
            // Sinon formater
            return field.includes("Particulier") ? `${val} € TTC` : `${val} € HT`;
          }
          // Priorité 3: Valeur dans contexteData sauvegardé
          if (savedContexte && savedContexte[field]) {
            const val = String(savedContexte[field]);
            if (val.includes("€")) return val;
            return field.includes("Particulier") ? `${val} € TTC` : `${val} € HT`;
          }
          return "";
        };

        setFicheData({
          titre: formation.titre || "",
          description: fiche.objectifGeneral as string || "",
          objectifs: fiche.objectifs as string[] || [],
          contenu: fiche.contenu as string || "",
          typeFormation: fiche.typeFormation as string || "",
          duree: fiche.duree as string || "",
          nombreParticipants: String(fiche.nombreParticipants || ""),
          tarifEntreprise: getTarif("tarifEntreprise", "tarifEntrepriseFormate"),
          tarifIndependant: getTarif("tarifIndependant", "tarifIndependantFormate"),
          tarifParticulier: getTarif("tarifParticulier", "tarifParticulierFormate"),
          accessibilite: fiche.accessibilite as string || initialFicheData.accessibilite,
          prerequis: fiche.prerequis as string || "",
          publicVise: fiche.publicVise as string || "",
          suiviEvaluation: fiche.suiviEvaluation as string || FIXED_SUIVI_EVALUATION,
          equipePedagogique: fiche.equipePedagogique as string || getEquipePedagogiqueText(organisationName),
          ressourcesPedagogiques: fiche.ressourcesPedagogiques as string || FIXED_RESSOURCES_PEDAGOGIQUES,
          delaiAcces: fiche.delaiAcces as string || initialFicheData.delaiAcces,
          imageUrl: formation.image || "",
        });

        // Restaurer les modules
        if (formation.modules && formation.modules.length > 0) {
          setModules(formation.modules.map((m: { id: string; titre: string; contenu?: { items?: string[] }; isModuleZero?: boolean }) => ({
            id: m.id,
            titre: m.titre,
            contenu: m.contenu?.items || [],
            isModuleZero: m.isModuleZero || false,
          })));
        }

        // Restaurer les évaluations si disponibles
        if (formation.evaluationsData) {
          setEvaluationsData(formation.evaluationsData as EvaluationsDataSaved);
        }

        // Restaurer l'étape courante et les étapes complétées depuis la BDD
        if (formation.currentStep) {
          setCurrentStep(formation.currentStep as StepId);
        }
        if (formation.completedSteps && formation.completedSteps.length > 0) {
          setCompletedSteps(formation.completedSteps as StepId[]);
        } else {
          // Fallback: déterminer les étapes complétées selon le statut
          if (formation.status === "EN_COURS" || formation.status === "TERMINEE") {
            setCompletedSteps(["contexte", "fiche"]);
            if (!formation.currentStep) setCurrentStep("slides");
          } else if (formation.titre) {
            setCompletedSteps(["contexte"]);
            if (!formation.currentStep) setCurrentStep("fiche");
          }
        }

        setFormationId(id);

        // Initialiser le hash pour éviter une sauvegarde immédiate
        lastSavedDataRef.current = JSON.stringify({
          currentStep: formation.currentStep,
          completedSteps: formation.completedSteps,
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la formation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour sauvegarder la formation en BDD
  const saveFormation = useCallback(async (titre: string, fiche: typeof ficheData, mods: typeof modules): Promise<string | null> => {
    setIsSavingFormation(true);
    try {
      const payload = {
        titre,
        description: fiche.description,
        contexteData: contexteData, // Sauvegarder aussi contexteData séparément
        fichePedagogique: {
          ...fiche,
          ...contexteData,
          objectifGeneral: fiche.description,
          // Sauvegarder les tarifs formatés ET les valeurs brutes pour éviter la perte
          tarifEntrepriseFormate: fiche.tarifEntreprise,
          tarifIndependantFormate: fiche.tarifIndependant,
          tarifParticulierFormate: fiche.tarifParticulier,
        },
        modules: mods.map((m, i) => ({
          titre: m.titre,
          ordre: m.isModuleZero ? -1 : i + 1, // Module 0 a ordre -1
          contenu: { items: m.contenu },
          isModuleZero: m.isModuleZero || false,
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

        // Construire le contenu des modules (avec gestion Module 0)
        let contenuModuleIndex = 1;
        const contenuModules = genere.modules
          ? genere.modules
              .map((m) => {
                const isModuleZero = m.isModuleZero === true;
                const moduleNum = isModuleZero ? 0 : contenuModuleIndex++;
                const moduleLabel = isModuleZero
                  ? m.titre // Le titre inclut déjà "Module 0 - Mise à niveau"
                  : `Module ${moduleNum} - ${m.titre.replace(/^Module\s*\d*\s*[-–:]*\s*/i, "")}`;
                return `${moduleLabel}\n${(m.contenu || []).map((c) => `• ${c}`).join("\n")}`;
              })
              .join("\n\n")
          : "";

        // Recherche automatique d'une image adaptée à la formation (asynchrone)
        const autoSearchImage = async (titre: string): Promise<string> => {
          try {
            // Extraire les mots-clés du titre pour la recherche
            const searchQuery = titre
              .replace(/Module \d+ –/gi, "")
              .replace(/Formation/gi, "")
              .trim()
              .slice(0, 50);

            const imageResponse = await fetch("/api/ai/search-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query: searchQuery, count: 1 }),
            });

            if (imageResponse.ok) {
              const imageData = await imageResponse.json();
              if (imageData.success && imageData.data?.images?.length > 0) {
                return imageData.data.images[0].url;
              }
            }
          } catch (error) {
            console.log("Auto-recherche image échouée, l'utilisateur pourra en sélectionner une manuellement:", error);
          }
          return "";
        };

        // Lancer la recherche d'image en parallèle
        const imagePromise = autoSearchImage(genere.titre || contexte.description);

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
          suiviEvaluation: FIXED_SUIVI_EVALUATION,
          equipePedagogique: getEquipePedagogiqueText(organisationName),
          ressourcesPedagogiques: FIXED_RESSOURCES_PEDAGOGIQUES,
          contenu: contenuModules,
          delaiAcces: FIXED_DELAI_ACCES,
          imageUrl: "", // Sera mis à jour automatiquement après la recherche
        });

        // Mettre à jour l'image une fois trouvée (asynchrone, ne bloque pas)
        imagePromise.then((imageUrl) => {
          if (imageUrl) {
            setFicheData((prev) => ({ ...prev, imageUrl }));
          }
        });

        // Mettre a jour les modules - l'IA determine le nombre de modules necessaires
        // Module 0 (isModuleZero) garde son numéro 0, les autres sont numérotés à partir de 1
        let moduleIndex = 1;
        const newModules = genere.modules && genere.modules.length > 0
          ? genere.modules.map((m) => {
              const isModuleZero = m.isModuleZero === true;
              const moduleNum = isModuleZero ? 0 : moduleIndex++;
              // Le titre du Module 0 commence déjà par "Module 0", pas besoin de le préfixer
              const titre = isModuleZero
                ? m.titre
                : `Module ${moduleNum} - ${m.titre.replace(/^Module\s*\d*\s*[-–:]*\s*/i, "")}`;
              return {
                id: String(moduleNum),
                titre,
                contenu: m.contenu || [],
                isModuleZero,
              };
            })
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
          suiviEvaluation: FIXED_SUIVI_EVALUATION,
          equipePedagogique: getEquipePedagogiqueText(organisationName),
          ressourcesPedagogiques: FIXED_RESSOURCES_PEDAGOGIQUES,
          contenu: contenuModules,
          delaiAcces: FIXED_DELAI_ACCES,
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
  }, [goToNextStep, organisationName, saveFormation]);

  // Handler pour terminer le wizard de création de formation
  const handleCreateSession = useCallback(async () => {
    // Marquer l'étape évaluations comme terminée
    if (!completedSteps.includes("evaluations")) {
      setCompletedSteps([...completedSteps, "evaluations"]);
    }

    // Sauvegarder la formation si nécessaire
    if (formationId) {
      await saveFormation(ficheData.titre, ficheData, modules);

      // Marquer la formation comme terminée (colonne "Terminée" dans le pipeline)
      // Note: estPublieCatalogue reste false pour que la formation soit dans "Terminée" et non "Publiée"
      // Le statut doit être "TERMINEE" en majuscules pour correspondre au mapping Prisma
      try {
        await fetch(`/api/formations/${formationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "TERMINEE" // Marquer la formation comme terminée
          }),
        });
      } catch (error) {
        console.error("Erreur lors de la mise à jour du statut:", error);
      }
    }

    // Rediriger vers la liste des formations (Mes formations)
    router.push("/formations");
  }, [completedSteps, formationId, ficheData, modules, saveFormation, router]);

  // Handler pour la sauvegarde des slides générés
  const handleSlidesGenerated = useCallback((slidesData: { moduleId: string; moduleTitre: string; gammaUrl?: string; exportUrl?: string; status: string }[]) => {
    console.log("Slides générés:", slidesData);
    // Les slides sont automatiquement sauvegardés via l'API /api/gamma/generate
  }, []);

  // Afficher un loader pendant le chargement initial
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-brand-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-gray-500 dark:text-gray-400">Chargement de la formation...</span>
        </div>
      </div>
    );
  }

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
          hasAdvancedProgress={completedSteps.includes("slides") || completedSteps.includes("evaluations") || evaluationsData !== null}
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
          certificationData={{
            isCertifiante: contexteData.isCertifiante,
            numeroFicheRS: contexteData.numeroFicheRS,
            lienFranceCompetences: contexteData.lienFranceCompetences,
          }}
          organisationData={{
            nom: user.entreprise || "",
            siret: user.siret || "",
            nda: user.numeroFormateur || "",
            adresse: user.adresse || "",
            codePostal: user.codePostal || "",
            ville: user.ville || "",
            prefectureRegion: user.prefectureRegion || "",
            representantNom: user.nom || "",
            representantPrenom: user.prenom || "",
            logoUrl: user.logoUrl,
          }}
        />
      )}

      {currentStep === "slides" && (
        <StepSlidesSupport
          modules={modules}
          formationId={formationId || undefined}
          formationTitre={ficheData.titre}
          onNext={() => goToNextStep("slides", "evaluations")}
          onPrevious={() => goToPreviousStep("fiche")}
          onSlidesGenerated={handleSlidesGenerated}
        />
      )}

      {currentStep === "evaluations" && (
        <StepEvaluations
          modules={modules}
          formationTitre={ficheData.titre}
          formationObjectifs={ficheData.objectifs}
          initialData={evaluationsData || undefined}
          onDataChange={setEvaluationsData}
          onNext={handleCreateSession}
          onPrevious={() => goToPreviousStep("slides")}
        />
      )}
    </div>
  );
}

// Composant principal exporté avec Suspense boundary pour useSearchParams
export default function CreateFormationPage() {
  return (
    <Suspense fallback={<CreateFormationLoader />}>
      <CreateFormationContent />
    </Suspense>
  );
}
