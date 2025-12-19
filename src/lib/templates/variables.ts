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
  {
    id: "formation.horaires_matin",
    label: "Horaires matin",
    category: "formation",
    description: "Horaires de la session du matin",
    example: "09:00 - 12:30",
  },
  {
    id: "formation.horaires_apres_midi",
    label: "Horaires apres-midi",
    category: "formation",
    description: "Horaires de la session de l'apres-midi",
    example: "14:00 - 17:30",
  },
  {
    id: "formation.nombre_jours",
    label: "Nombre de jours",
    category: "formation",
    description: "Nombre total de jours de formation",
    example: "3",
  },
  {
    id: "formation.tva",
    label: "TVA",
    category: "formation",
    description: "Montant de la TVA",
    example: "300,00",
  },
  {
    id: "formation.prix_ttc",
    label: "Prix TTC",
    category: "formation",
    description: "Prix toutes taxes comprises",
    example: "1 800,00 EUR TTC",
  },
  {
    id: "formation.methodes_pedagogiques",
    label: "Methodes pedagogiques",
    category: "formation",
    description: "Methodes utilisees (expose, cas pratiques...)",
    example: "Apports theoriques, exercices pratiques, mises en situation",
  },
  {
    id: "formation.moyens_techniques",
    label: "Moyens techniques",
    category: "formation",
    description: "Equipements et supports utilises",
    example: "Salle equipee, videoprojecteur, supports de cours",
  },
  {
    id: "formation.modalites_evaluation",
    label: "Modalites d'evaluation",
    category: "formation",
    description: "Comment les acquis sont evalues",
    example: "QCM, mise en situation, evaluation continue",
  },
  {
    id: "formation.accessibilite",
    label: "Accessibilite",
    category: "formation",
    description: "Informations d'accessibilite handicap",
    example: "Formation accessible aux personnes en situation de handicap",
  },
  {
    id: "formation.delai_acces",
    label: "Delai d'acces",
    category: "formation",
    description: "Delai pour acceder a la formation",
    example: "14 jours ouvrables",
  },

  // ===== JOURNEES DE FORMATION =====
  {
    id: "journees",
    label: "Liste des journees",
    category: "journees",
    description: "Boucle sur toutes les journees de formation",
    example: "",
    isLoop: true,
    children: [
      {
        id: "journee.numero",
        label: "Numero de la journee",
        category: "journees",
        description: "Numero d'ordre de la journee (1, 2, 3...)",
        example: "1",
      },
      {
        id: "journee.date",
        label: "Date de la journee",
        category: "journees",
        description: "Date complete de la journee",
        example: "15 janvier 2025",
      },
      {
        id: "journee.date_courte",
        label: "Date courte",
        category: "journees",
        description: "Date au format court",
        example: "15/01/2025",
      },
      {
        id: "journee.horaires_matin",
        label: "Horaires matin",
        category: "journees",
        description: "Horaires du matin pour cette journee",
        example: "09:00 - 12:30",
      },
      {
        id: "journee.horaires_apres_midi",
        label: "Horaires apres-midi",
        category: "journees",
        description: "Horaires de l'apres-midi pour cette journee",
        example: "14:00 - 17:30",
      },
    ],
  },
  {
    id: "journees.premiere_date",
    label: "Premiere journee (date debut)",
    category: "journees",
    description: "Date de la premiere journee de formation",
    example: "15 janvier 2025",
  },
  {
    id: "journees.derniere_date",
    label: "Derniere journee (date fin)",
    category: "journees",
    description: "Date de la derniere journee de formation (dynamique)",
    example: "17 janvier 2025",
  },
  {
    id: "journees.count",
    label: "Nombre de journees",
    category: "journees",
    description: "Nombre total de journees programmees",
    example: "3",
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
  {
    id: "organisation.logo",
    label: "Logo de l'organisme",
    category: "organisation",
    description: "URL du logo de l'organisme de formation",
    example: "https://example.com/logo.png",
  },
  {
    id: "organisation.tva_intra",
    label: "N° TVA intracommunautaire",
    category: "organisation",
    description: "Numero de TVA intracommunautaire",
    example: "FR12345678901",
  },
  {
    id: "organisation.capital",
    label: "Capital social",
    category: "organisation",
    description: "Capital social de la societe",
    example: "10 000 EUR",
  },
  {
    id: "organisation.forme_juridique",
    label: "Forme juridique",
    category: "organisation",
    description: "Forme juridique de l'entreprise",
    example: "SAS",
  },
  {
    id: "organisation.rcs",
    label: "RCS",
    category: "organisation",
    description: "Numero RCS",
    example: "Paris B 123 456 789",
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
  {
    id: "entreprise.email",
    label: "Email entreprise",
    category: "entreprise",
    description: "Email de l'entreprise",
    example: "contact@acme.com",
  },
  {
    id: "entreprise.telephone",
    label: "Telephone entreprise",
    category: "entreprise",
    description: "Telephone de l'entreprise",
    example: "01 23 45 67 89",
  },

  // ===== PARTICULIER =====
  {
    id: "particulier.civilite",
    label: "Civilite",
    category: "particulier",
    description: "Civilite du particulier (M. / Mme)",
    example: "M.",
  },
  {
    id: "particulier.nom",
    label: "Nom",
    category: "particulier",
    description: "Nom du particulier",
    example: "MARTIN",
  },
  {
    id: "particulier.prenom",
    label: "Prenom",
    category: "particulier",
    description: "Prenom du particulier",
    example: "Pierre",
  },
  {
    id: "particulier.nom_complet",
    label: "Nom complet",
    category: "particulier",
    description: "Prenom et nom du particulier",
    example: "Pierre MARTIN",
  },
  {
    id: "particulier.adresse",
    label: "Adresse",
    category: "particulier",
    description: "Adresse du particulier",
    example: "25 rue de la Paix",
  },
  {
    id: "particulier.code_postal",
    label: "Code postal",
    category: "particulier",
    description: "Code postal du particulier",
    example: "75002",
  },
  {
    id: "particulier.ville",
    label: "Ville",
    category: "particulier",
    description: "Ville du particulier",
    example: "Paris",
  },
  {
    id: "particulier.adresse_complete",
    label: "Adresse complete",
    category: "particulier",
    description: "Adresse complete du particulier",
    example: "25 rue de la Paix, 75002 Paris",
  },
  {
    id: "particulier.email",
    label: "Email",
    category: "particulier",
    description: "Email du particulier",
    example: "pierre.martin@email.com",
  },
  {
    id: "particulier.telephone",
    label: "Telephone",
    category: "particulier",
    description: "Telephone du particulier",
    example: "06 12 34 56 78",
  },
  {
    id: "particulier.date_naissance",
    label: "Date de naissance",
    category: "particulier",
    description: "Date de naissance du particulier",
    example: "15/03/1985",
  },
  {
    id: "particulier.lieu_naissance",
    label: "Lieu de naissance",
    category: "particulier",
    description: "Lieu de naissance du particulier",
    example: "Paris",
  },
  {
    id: "particulier.statut",
    label: "Statut",
    category: "particulier",
    description: "Statut du particulier (salarie, demandeur d'emploi...)",
    example: "Demandeur d'emploi",
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
    category: "journees",
    label: "Journees",
    icon: "CalendarDays",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "journees"),
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
    category: "particulier",
    label: "Particulier",
    icon: "User",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "particulier"),
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
// Toutes les categories disponibles pour harmonisation
const ALL_CATEGORIES: VariableCategory[] = [
  "formation", "journees", "modules", "organisation", "entreprise",
  "particulier", "participants", "formateur", "dates", "document"
];

export const DOCUMENT_TYPES: DocumentTypeConfig[] = [
  {
    type: "fiche_pedagogique",
    label: "Fiche Pedagogique",
    description: "Document detaillant le contenu pedagogique de la formation",
    icon: "BookOpen",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "convention_formation",
    label: "Convention de Formation",
    description: "Convention entre l'organisme et l'entreprise (Article L.6353-1)",
    icon: "FileSignature",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "contrat_formation",
    label: "Contrat de Formation",
    description: "Contrat de formation professionnelle (avec particulier)",
    icon: "FileText",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "programme_formation",
    label: "Programme de Formation",
    description: "Programme detaille de la formation",
    icon: "ListOrdered",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "attestation_fin",
    label: "Attestation de Fin de Formation",
    description: "Attestation delivree a la fin de la formation",
    icon: "Award",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "feuille_emargement",
    label: "Feuille d'Emargement",
    description: "Feuille de presence pour signature",
    icon: "ClipboardCheck",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "reglement_interieur",
    label: "Reglement Interieur",
    description: "Reglement interieur applicable aux stagiaires",
    icon: "Scale",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "evaluation_chaud",
    label: "Evaluation a Chaud",
    description: "Questionnaire de satisfaction post-formation",
    icon: "ThermometerSun",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "evaluation_froid",
    label: "Evaluation a Froid",
    description: "Questionnaire d'evaluation differee",
    icon: "ThermometerSnowflake",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "devis",
    label: "Devis",
    description: "Proposition commerciale",
    icon: "Receipt",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "facture",
    label: "Facture",
    description: "Facture de formation",
    icon: "CreditCard",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "convocation",
    label: "Convocation",
    description: "Convocation a la formation",
    icon: "Mail",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "certificat",
    label: "Certificat",
    description: "Certificat de realisation",
    icon: "Award",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "custom",
    label: "Document Personnalise",
    description: "Document libre",
    icon: "FileEdit",
    availableCategories: ALL_CATEGORIES,
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
