// ===========================================
// DEFINITIONS DES VARIABLES DE TEMPLATES
// ===========================================

import { TemplateVariable, VariableGroup, DocumentTypeConfig, DocumentType, VariableCategory } from "./types";

/**
 * Toutes les variables disponibles dans le systeme
 */
export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  // ===== FORMATION =====
  {
    id: "formation.titre",
    label: "Titre de la formation",
    category: "formation",
    description: "Nom complet de la formation",
    example: "Management Agile et Leadership",
  },
  {
    id: "formation.description",
    label: "Description",
    category: "formation",
    description: "Description detaillee de la formation",
    example: "Cette formation vous permettra de maitriser les fondamentaux du management agile...",
  },
  {
    id: "formation.duree",
    label: "Duree",
    category: "formation",
    description: "Duree totale de la formation",
    example: "14 heures (2 jours)",
  },
  {
    id: "formation.duree_heures",
    label: "Duree en heures",
    category: "formation",
    description: "Nombre d'heures total",
    example: "14",
  },
  {
    id: "formation.prix",
    label: "Prix",
    category: "formation",
    description: "Prix de la formation",
    example: "1500",
  },
  {
    id: "formation.prix_format",
    label: "Prix formate",
    category: "formation",
    description: "Prix avec devise et formatage",
    example: "1 500,00 EUR HT",
  },
  {
    id: "formation.objectifs",
    label: "Objectifs pedagogiques",
    category: "formation",
    description: "Liste des objectifs de la formation",
    example: "Comprendre les principes du management agile",
    isLoop: true,
  },
  {
    id: "formation.prerequis",
    label: "Prerequis",
    category: "formation",
    description: "Prerequis necessaires",
    example: "Aucun prerequis particulier",
    isLoop: true,
  },
  {
    id: "formation.public_cible",
    label: "Public cible",
    category: "formation",
    description: "Public vise par la formation",
    example: "Managers, chefs de projet, responsables d'equipe",
  },
  {
    id: "formation.modalites",
    label: "Modalites",
    category: "formation",
    description: "Modalites de la formation (presentiel, distanciel...)",
    example: "Presentiel",
  },
  {
    id: "formation.lieu",
    label: "Lieu",
    category: "formation",
    description: "Lieu de la formation",
    example: "Paris - Centre de formation",
  },
  {
    id: "formation.date_debut",
    label: "Date de debut",
    category: "formation",
    description: "Date de debut de la formation",
    example: "15/01/2025",
  },
  {
    id: "formation.date_fin",
    label: "Date de fin",
    category: "formation",
    description: "Date de fin de la formation",
    example: "16/01/2025",
  },
  {
    id: "formation.reference",
    label: "Reference",
    category: "formation",
    description: "Reference unique de la formation",
    example: "FORM-2025-001",
  },

  // ===== MODULES =====
  {
    id: "modules",
    label: "Liste des modules",
    category: "modules",
    description: "Boucle sur tous les modules de la formation",
    example: "",
    isLoop: true,
    children: [
      {
        id: "module.numero",
        label: "Numero du module",
        category: "modules",
        description: "Numero d'ordre du module",
        example: "1",
      },
      {
        id: "module.titre",
        label: "Titre du module",
        category: "modules",
        description: "Nom du module",
        example: "Introduction au Management Agile",
      },
      {
        id: "module.duree",
        label: "Duree du module",
        category: "modules",
        description: "Duree du module",
        example: "3 heures",
      },
      {
        id: "module.objectifs",
        label: "Objectifs du module",
        category: "modules",
        description: "Objectifs specifiques du module",
        example: "Comprendre l'historique de l'agilite",
        isLoop: true,
      },
      {
        id: "module.contenu",
        label: "Contenu du module",
        category: "modules",
        description: "Points abordes dans le module",
        example: "Les 4 valeurs du Manifeste Agile",
        isLoop: true,
      },
    ],
  },

  // ===== ORGANISATION =====
  {
    id: "organisation.nom",
    label: "Nom de l'organisme",
    category: "organisation",
    description: "Raison sociale de l'organisme de formation",
    example: "Automate Formation SAS",
  },
  {
    id: "organisation.siret",
    label: "SIRET",
    category: "organisation",
    description: "Numero SIRET de l'organisme",
    example: "123 456 789 00012",
  },
  {
    id: "organisation.adresse",
    label: "Adresse",
    category: "organisation",
    description: "Adresse complete",
    example: "15 rue de la Formation",
  },
  {
    id: "organisation.code_postal",
    label: "Code postal",
    category: "organisation",
    description: "Code postal",
    example: "75001",
  },
  {
    id: "organisation.ville",
    label: "Ville",
    category: "organisation",
    description: "Ville",
    example: "Paris",
  },
  {
    id: "organisation.adresse_complete",
    label: "Adresse complete",
    category: "organisation",
    description: "Adresse avec code postal et ville",
    example: "15 rue de la Formation, 75001 Paris",
  },
  {
    id: "organisation.telephone",
    label: "Telephone",
    category: "organisation",
    description: "Numero de telephone",
    example: "01 23 45 67 89",
  },
  {
    id: "organisation.email",
    label: "Email",
    category: "organisation",
    description: "Adresse email",
    example: "contact@automate-formation.fr",
  },
  {
    id: "organisation.site_web",
    label: "Site web",
    category: "organisation",
    description: "URL du site web",
    example: "www.automate-formation.fr",
  },
  {
    id: "organisation.numero_da",
    label: "N° Declaration d'Activite",
    category: "organisation",
    description: "Numero de declaration d'activite",
    example: "11 75 12345 67",
  },
  {
    id: "organisation.representant",
    label: "Representant legal",
    category: "organisation",
    description: "Nom du representant legal",
    example: "Jean DUPONT",
  },
  {
    id: "organisation.fonction_representant",
    label: "Fonction du representant",
    category: "organisation",
    description: "Fonction du representant legal",
    example: "Directeur General",
  },

  // ===== ENTREPRISE =====
  {
    id: "entreprise.nom",
    label: "Nom de l'entreprise",
    category: "entreprise",
    description: "Raison sociale de l'entreprise cliente",
    example: "ACME Corporation",
  },
  {
    id: "entreprise.siret",
    label: "SIRET entreprise",
    category: "entreprise",
    description: "Numero SIRET de l'entreprise",
    example: "987 654 321 00098",
  },
  {
    id: "entreprise.adresse",
    label: "Adresse entreprise",
    category: "entreprise",
    description: "Adresse de l'entreprise",
    example: "100 avenue des Champs-Elysees",
  },
  {
    id: "entreprise.code_postal",
    label: "Code postal entreprise",
    category: "entreprise",
    description: "Code postal de l'entreprise",
    example: "75008",
  },
  {
    id: "entreprise.ville",
    label: "Ville entreprise",
    category: "entreprise",
    description: "Ville de l'entreprise",
    example: "Paris",
  },
  {
    id: "entreprise.adresse_complete",
    label: "Adresse complete entreprise",
    category: "entreprise",
    description: "Adresse complete de l'entreprise",
    example: "100 avenue des Champs-Elysees, 75008 Paris",
  },
  {
    id: "entreprise.representant",
    label: "Representant entreprise",
    category: "entreprise",
    description: "Nom du representant de l'entreprise",
    example: "Marie MARTIN",
  },
  {
    id: "entreprise.fonction_representant",
    label: "Fonction representant",
    category: "entreprise",
    description: "Fonction du representant",
    example: "Directrice des Ressources Humaines",
  },

  // ===== PARTICIPANTS =====
  {
    id: "participants",
    label: "Liste des participants",
    category: "participants",
    description: "Boucle sur tous les participants",
    example: "",
    isLoop: true,
    children: [
      {
        id: "participant.civilite",
        label: "Civilite",
        category: "participants",
        description: "Civilite du participant",
        example: "M.",
      },
      {
        id: "participant.nom",
        label: "Nom",
        category: "participants",
        description: "Nom du participant",
        example: "DURAND",
      },
      {
        id: "participant.prenom",
        label: "Prenom",
        category: "participants",
        description: "Prenom du participant",
        example: "Pierre",
      },
      {
        id: "participant.nom_complet",
        label: "Nom complet",
        category: "participants",
        description: "Prenom et nom du participant",
        example: "Pierre DURAND",
      },
      {
        id: "participant.email",
        label: "Email",
        category: "participants",
        description: "Email du participant",
        example: "p.durand@example.com",
      },
      {
        id: "participant.fonction",
        label: "Fonction",
        category: "participants",
        description: "Poste du participant",
        example: "Chef de projet",
      },
    ],
  },
  {
    id: "participants.count",
    label: "Nombre de participants",
    category: "participants",
    description: "Nombre total de participants",
    example: "8",
  },

  // ===== FORMATEUR =====
  {
    id: "formateur.civilite",
    label: "Civilite formateur",
    category: "formateur",
    description: "Civilite du formateur",
    example: "Mme",
  },
  {
    id: "formateur.nom",
    label: "Nom formateur",
    category: "formateur",
    description: "Nom du formateur",
    example: "BERNARD",
  },
  {
    id: "formateur.prenom",
    label: "Prenom formateur",
    category: "formateur",
    description: "Prenom du formateur",
    example: "Sophie",
  },
  {
    id: "formateur.nom_complet",
    label: "Nom complet formateur",
    category: "formateur",
    description: "Prenom et nom du formateur",
    example: "Sophie BERNARD",
  },
  {
    id: "formateur.email",
    label: "Email formateur",
    category: "formateur",
    description: "Email du formateur",
    example: "s.bernard@formation.fr",
  },
  {
    id: "formateur.telephone",
    label: "Telephone formateur",
    category: "formateur",
    description: "Telephone du formateur",
    example: "06 12 34 56 78",
  },
  {
    id: "formateur.specialite",
    label: "Specialite",
    category: "formateur",
    description: "Domaine d'expertise du formateur",
    example: "Management et Leadership",
  },

  // ===== DATES =====
  {
    id: "date.jour",
    label: "Jour",
    category: "dates",
    description: "Jour actuel",
    example: "15",
  },
  {
    id: "date.mois",
    label: "Mois",
    category: "dates",
    description: "Mois actuel (en lettres)",
    example: "janvier",
  },
  {
    id: "date.mois_numero",
    label: "Mois (numero)",
    category: "dates",
    description: "Mois actuel (en chiffres)",
    example: "01",
  },
  {
    id: "date.annee",
    label: "Annee",
    category: "dates",
    description: "Annee actuelle",
    example: "2025",
  },
  {
    id: "date.complete",
    label: "Date complete",
    category: "dates",
    description: "Date complete formatee",
    example: "15 janvier 2025",
  },
  {
    id: "date.courte",
    label: "Date courte",
    category: "dates",
    description: "Date au format court",
    example: "15/01/2025",
  },

  // ===== DOCUMENT =====
  {
    id: "document.reference",
    label: "Reference document",
    category: "document",
    description: "Reference unique du document",
    example: "CONV-2025-001",
  },
  {
    id: "document.date_creation",
    label: "Date de creation",
    category: "document",
    description: "Date de creation du document",
    example: "15/01/2025",
  },
  {
    id: "document.version",
    label: "Version",
    category: "document",
    description: "Version du document",
    example: "1.0",
  },
];

/**
 * Variables groupees par categorie
 */
export const VARIABLE_GROUPS: VariableGroup[] = [
  {
    category: "formation",
    label: "Formation",
    icon: "GraduationCap",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "formation"),
  },
  {
    category: "modules",
    label: "Modules",
    icon: "Layers",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "modules"),
  },
  {
    category: "organisation",
    label: "Organisme",
    icon: "Building2",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "organisation"),
  },
  {
    category: "entreprise",
    label: "Entreprise",
    icon: "Briefcase",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "entreprise"),
  },
  {
    category: "participants",
    label: "Participants",
    icon: "Users",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "participants"),
  },
  {
    category: "formateur",
    label: "Formateur",
    icon: "UserCheck",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "formateur"),
  },
  {
    category: "dates",
    label: "Dates",
    icon: "Calendar",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "dates"),
  },
  {
    category: "document",
    label: "Document",
    icon: "FileText",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "document"),
  },
];

/**
 * Configuration des types de documents
 */
export const DOCUMENT_TYPES: DocumentTypeConfig[] = [
  {
    type: "fiche_pedagogique",
    label: "Fiche Pedagogique",
    description: "Document detaillant le contenu pedagogique de la formation",
    icon: "BookOpen",
    availableCategories: ["formation", "modules", "organisation", "formateur", "dates", "document"],
  },
  {
    type: "convention_formation",
    label: "Convention de Formation",
    description: "Convention entre l'organisme et l'entreprise (Article L.6353-1)",
    icon: "FileSignature",
    availableCategories: ["formation", "modules", "organisation", "entreprise", "participants", "formateur", "dates", "document"],
  },
  {
    type: "contrat_formation",
    label: "Contrat de Formation",
    description: "Contrat de formation professionnelle",
    icon: "FileText",
    availableCategories: ["formation", "modules", "organisation", "entreprise", "participants", "formateur", "dates", "document"],
  },
  {
    type: "programme_formation",
    label: "Programme de Formation",
    description: "Programme detaille de la formation",
    icon: "ListOrdered",
    availableCategories: ["formation", "modules", "organisation", "formateur", "dates", "document"],
  },
  {
    type: "attestation_fin",
    label: "Attestation de Fin de Formation",
    description: "Attestation delivree a la fin de la formation",
    icon: "Award",
    availableCategories: ["formation", "organisation", "participants", "formateur", "dates", "document"],
  },
  {
    type: "feuille_emargement",
    label: "Feuille d'Emargement",
    description: "Feuille de presence pour signature",
    icon: "ClipboardCheck",
    availableCategories: ["formation", "organisation", "participants", "formateur", "dates", "document"],
  },
  {
    type: "reglement_interieur",
    label: "Reglement Interieur",
    description: "Reglement interieur applicable aux stagiaires",
    icon: "Scale",
    availableCategories: ["organisation", "dates", "document"],
  },
  {
    type: "evaluation_chaud",
    label: "Evaluation a Chaud",
    description: "Questionnaire de satisfaction post-formation",
    icon: "ThermometerSun",
    availableCategories: ["formation", "organisation", "formateur", "dates", "document"],
  },
  {
    type: "evaluation_froid",
    label: "Evaluation a Froid",
    description: "Questionnaire d'evaluation differee",
    icon: "ThermometerSnowflake",
    availableCategories: ["formation", "organisation", "participants", "dates", "document"],
  },
  {
    type: "devis",
    label: "Devis",
    description: "Proposition commerciale",
    icon: "Receipt",
    availableCategories: ["formation", "organisation", "entreprise", "dates", "document"],
  },
  {
    type: "facture",
    label: "Facture",
    description: "Facture de formation",
    icon: "CreditCard",
    availableCategories: ["formation", "organisation", "entreprise", "participants", "dates", "document"],
  },
  {
    type: "custom",
    label: "Document Personnalise",
    description: "Document libre",
    icon: "FileEdit",
    availableCategories: ["formation", "modules", "organisation", "entreprise", "participants", "formateur", "dates", "document"],
  },
];

/**
 * Obtenir les variables disponibles pour un type de document
 */
export function getVariablesForDocumentType(documentType: DocumentType): VariableGroup[] {
  const config = DOCUMENT_TYPES.find((d) => d.type === documentType);
  if (!config) return VARIABLE_GROUPS;

  return VARIABLE_GROUPS.filter((group) =>
    config.availableCategories.includes(group.category)
  );
}

/**
 * Obtenir une variable par son ID
 */
export function getVariableById(id: string): TemplateVariable | undefined {
  // Chercher dans les variables de premier niveau
  const found = TEMPLATE_VARIABLES.find((v) => v.id === id);
  if (found) return found;

  // Chercher dans les enfants (pour les boucles)
  for (const variable of TEMPLATE_VARIABLES) {
    if (variable.children) {
      const childFound = variable.children.find((c) => c.id === id);
      if (childFound) return childFound;
    }
  }

  return undefined;
}

/**
 * Formater une variable pour l'insertion dans l'editeur
 */
export function formatVariableForInsertion(variableId: string): string {
  return `{{${variableId}}}`;
}

/**
 * Extraire les variables d'un texte
 */
export function extractVariablesFromText(text: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const matches: string[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1]);
  }

  return [...new Set(matches)]; // Retirer les doublons
}
