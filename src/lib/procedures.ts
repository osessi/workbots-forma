// ===========================================
// Constantes et types pour les procédures Qualiopi
// ===========================================

import { ProcedureType } from "@prisma/client";

// Mapping des types de procédures vers leurs informations
export const PROCEDURE_TYPES_INFO: Record<ProcedureType, {
  nom: string;
  description: string;
  documentType: string;
  indicateur: string;
}> = {
  ACCUEIL: {
    nom: "Procédure d'accueil des stagiaires",
    description: "Décrit les modalités d'accueil et d'intégration des apprenants",
    documentType: "PROCEDURE_ACCUEIL",
    indicateur: "IND 26",
  },
  RECLAMATIONS: {
    nom: "Procédure de gestion des réclamations",
    description: "Définit le traitement des réclamations des apprenants et financeurs",
    documentType: "PROCEDURE_RECLAMATIONS",
    indicateur: "IND 26",
  },
  EVALUATION: {
    nom: "Procédure d'évaluation",
    description: "Décrit les méthodes d'évaluation des acquis et des formations",
    documentType: "PROCEDURE_EVALUATION",
    indicateur: "IND 26",
  },
  SOUS_TRAITANCE: {
    nom: "Procédure de sous-traitance",
    description: "Définit les règles de sélection et de suivi des sous-traitants",
    documentType: "PROCEDURE_SOUS_TRAITANCE",
    indicateur: "IND 26, 27",
  },
  VEILLE: {
    nom: "Procédure de veille",
    description: "Organise la veille légale, réglementaire et pédagogique",
    documentType: "PROCEDURE_VEILLE",
    indicateur: "IND 23, 24, 25",
  },
  ACCESSIBILITE: {
    nom: "Procédure d'accessibilité handicap",
    description: "Définit l'accueil et l'accompagnement des personnes handicapées",
    documentType: "PROCEDURE_ACCESSIBILITE",
    indicateur: "IND 26",
  },
  SUIVI_STAGIAIRES: {
    nom: "Procédure de suivi des stagiaires",
    description: "Décrit le suivi et l'accompagnement des apprenants",
    documentType: "PROCEDURE_SUIVI_STAGIAIRES",
    indicateur: "IND 26",
  },
  GESTION_COMPETENCES: {
    nom: "Procédure de gestion des compétences",
    description: "Définit le développement des compétences des formateurs",
    documentType: "PROCEDURE_GESTION_COMPETENCES",
    indicateur: "IND 26",
  },
  PERSONNALISEE: {
    nom: "Procédure personnalisée",
    description: "Procédure spécifique à l'organisme",
    documentType: "AUTRE",
    indicateur: "",
  },
};
