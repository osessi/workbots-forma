// ===========================================
// DEFINITIONS DES VARIABLES DE TEMPLATES
// ===========================================

import { TemplateVariable, VariableGroup, DocumentTypeConfig, DocumentType, VariableCategory } from "./types";

// ===========================================
// GENERATEURS DE VARIABLES DYNAMIQUES
// ===========================================

/**
 * Genere les variables numerotees pour les journees basees sur le nombre reel
 * @param count - Nombre de journees (0 = pas de variables numerotees affichees)
 */
export function generateJourneeVariables(count: number): TemplateVariable[] {
  const variables: TemplateVariable[] = [];

  for (let i = 1; i <= count; i++) {
    variables.push(
      {
        id: `journee${i}.date`,
        label: `Jour ${i} - Date`,
        category: "journees",
        description: `Date de la journee ${i}`,
        example: "15 janvier 2025",
      },
      {
        id: `journee${i}.date_courte`,
        label: `Jour ${i} - Date courte`,
        category: "journees",
        description: `Date courte de la journee ${i}`,
        example: "15/01/2025",
      },
      {
        id: `journee${i}.horaires_matin`,
        label: `Jour ${i} - Horaires matin`,
        category: "journees",
        description: `Horaires du matin pour le jour ${i}`,
        example: "09:00 - 12:30",
      },
      {
        id: `journee${i}.horaires_apres_midi`,
        label: `Jour ${i} - Horaires apres-midi`,
        category: "journees",
        description: `Horaires de l'apres-midi pour le jour ${i}`,
        example: "14:00 - 17:30",
      }
    );
  }

  return variables;
}

/**
 * Genere les variables numerotees pour les salaries basees sur le nombre reel
 * @param count - Nombre de salaries (0 = pas de variables numerotees affichees)
 */
export function generateSalarieVariables(count: number): TemplateVariable[] {
  const variables: TemplateVariable[] = [];

  for (let i = 1; i <= count; i++) {
    variables.push(
      {
        id: `salarie${i}.nom`,
        label: `Salarie ${i} - Nom`,
        category: "participants",
        description: `Nom du salarie ${i}`,
        example: "DUPONT",
      },
      {
        id: `salarie${i}.prenom`,
        label: `Salarie ${i} - Prenom`,
        category: "participants",
        description: `Prenom du salarie ${i}`,
        example: "Jean",
      },
      {
        id: `salarie${i}.nom_complet`,
        label: `Salarie ${i} - Nom complet`,
        category: "participants",
        description: `Nom complet du salarie ${i}`,
        example: "Jean DUPONT",
      },
      {
        id: `salarie${i}.adresse`,
        label: `Salarie ${i} - Adresse`,
        category: "participants",
        description: `Adresse du salarie ${i}`,
        example: "12 rue de la Paix",
      },
      {
        id: `salarie${i}.code_postal`,
        label: `Salarie ${i} - Code postal`,
        category: "participants",
        description: `Code postal du salarie ${i}`,
        example: "75001",
      },
      {
        id: `salarie${i}.ville`,
        label: `Salarie ${i} - Ville`,
        category: "participants",
        description: `Ville du salarie ${i}`,
        example: "Paris",
      },
      {
        id: `salarie${i}.adresse_complete`,
        label: `Salarie ${i} - Adresse complete`,
        category: "participants",
        description: `Adresse complete du salarie ${i}`,
        example: "12 rue de la Paix, 75001 Paris",
      },
      {
        id: `salarie${i}.telephone`,
        label: `Salarie ${i} - Telephone`,
        category: "participants",
        description: `Telephone du salarie ${i}`,
        example: "06 12 34 56 78",
      },
      {
        id: `salarie${i}.email`,
        label: `Salarie ${i} - Email`,
        category: "participants",
        description: `Email du salarie ${i}`,
        example: "jean.dupont@email.com",
      },
      {
        id: `salarie${i}.date_naissance`,
        label: `Salarie ${i} - Date naissance`,
        category: "participants",
        description: `Date de naissance du salarie ${i}`,
        example: "15/03/1985",
      },
      {
        id: `salarie${i}.lieu_naissance`,
        label: `Salarie ${i} - Lieu naissance`,
        category: "participants",
        description: `Lieu de naissance du salarie ${i}`,
        example: "Paris",
      }
    );
  }

  return variables;
}

/**
 * Contexte dynamique pour la generation des variables
 */
export interface DynamicVariableContext {
  nombreJournees?: number;
  nombreSalaries?: number;
}

/**
 * Obtenir toutes les variables avec les variables dynamiques basees sur le contexte
 * @param context - Contexte avec le nombre d'elements (journees, salaries)
 */
export function getVariablesWithDynamicContext(context: DynamicVariableContext = {}): TemplateVariable[] {
  const { nombreJournees = 0, nombreSalaries = 0 } = context;

  // Variables de base (sans les variables numerotees)
  const baseVariables = TEMPLATE_VARIABLES.filter(v => {
    // Exclure les variables generees statiquement (on les regenere dynamiquement)
    const isStaticJournee = v.id.match(/^journee\d+\./);
    const isStaticSalarie = v.id.match(/^salarie\d+\./);
    return !isStaticJournee && !isStaticSalarie;
  });

  // Ajouter les variables dynamiques
  const dynamicJournees = generateJourneeVariables(nombreJournees);
  const dynamicSalaries = generateSalarieVariables(nombreSalaries);

  // Inserer les variables de journees apres journees.count
  const journeesCountIndex = baseVariables.findIndex(v => v.id === "journees.count");
  if (journeesCountIndex !== -1) {
    baseVariables.splice(journeesCountIndex + 1, 0, ...dynamicJournees);
  }

  // Inserer les variables de salaries apres participants.count
  const participantsCountIndex = baseVariables.findIndex(v => v.id === "participants.count");
  if (participantsCountIndex !== -1) {
    baseVariables.splice(participantsCountIndex + 1, 0, ...dynamicSalaries);
  }

  return baseVariables;
}

/**
 * Obtenir les groupes de variables avec contexte dynamique
 */
export function getVariableGroupsWithDynamicContext(context: DynamicVariableContext = {}): VariableGroup[] {
  const allVariables = getVariablesWithDynamicContext(context);

  return [
    {
      category: "conditions",
      label: "Conditions",
      icon: "GitBranch",
      variables: allVariables.filter((v) => v.category === "conditions"),
    },
    {
      category: "client",
      label: "Client",
      icon: "UserCircle",
      variables: allVariables.filter((v) => v.category === "client"),
    },
    {
      category: "formation",
      label: "Formation",
      icon: "GraduationCap",
      variables: allVariables.filter((v) => v.category === "formation"),
    },
    {
      category: "journees",
      label: "Journees",
      icon: "CalendarDays",
      variables: allVariables.filter((v) => v.category === "journees"),
    },
    {
      category: "modules",
      label: "Modules",
      icon: "Layers",
      variables: allVariables.filter((v) => v.category === "modules"),
    },
    {
      category: "organisation",
      label: "Organisme",
      icon: "Building2",
      variables: allVariables.filter((v) => v.category === "organisation"),
    },
    {
      category: "entreprise",
      label: "Entreprise",
      icon: "Briefcase",
      variables: allVariables.filter((v) => v.category === "entreprise"),
    },
    {
      category: "particulier",
      label: "Particulier",
      icon: "User",
      variables: allVariables.filter((v) => v.category === "particulier"),
    },
    {
      category: "independant",
      label: "Independant",
      icon: "UserCog",
      variables: allVariables.filter((v) => v.category === "independant"),
    },
    {
      category: "financeur",
      label: "Financeur",
      icon: "Landmark",
      variables: allVariables.filter((v) => v.category === "financeur"),
    },
    {
      category: "participants",
      label: "Participants",
      icon: "Users",
      variables: allVariables.filter((v) => v.category === "participants"),
    },
    {
      category: "formateur",
      label: "Formateur",
      icon: "UserCheck",
      variables: allVariables.filter((v) => v.category === "formateur"),
    },
    {
      category: "dates",
      label: "Dates",
      icon: "Calendar",
      variables: allVariables.filter((v) => v.category === "dates"),
    },
    {
      category: "document",
      label: "Document",
      icon: "FileText",
      variables: allVariables.filter((v) => v.category === "document"),
    },
    {
      category: "signature",
      label: "Signature",
      icon: "PenTool",
      variables: allVariables.filter((v) => v.category === "signature"),
    },
  ];
}

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
  // Note: Les variables journee1, journee2, etc. sont generees dynamiquement
  // via getVariablesWithDynamicContext() selon le nombre reel de journees

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
    label: "Raison sociale",
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
  {
    id: "organisation.prefecture_region",
    label: "Region prefecture",
    category: "organisation",
    description: "Region d'acquisition du numero de declaration d'activite",
    example: "Ile-de-France",
  },

  // ===== FORMATION - SECTIONS FIXES =====
  {
    id: "formation.execution_resultats",
    label: "Suivi execution et resultats",
    category: "formation",
    description: "Section fixe: Suivi de l'execution et evaluation des resultats (texte standard Qualiopi)",
    example: "Feuilles d'emargement, evaluation de fin de formation, auto-evaluation, questionnaire satisfaction, attestation",
  },
  {
    id: "formation.ressources_pedagogiques",
    label: "Ressources pedagogiques",
    category: "formation",
    description: "Section fixe: Ressources et moyens pedagogiques (texte standard Qualiopi)",
    example: "Formation presentiel/distanciel, accompagnement formateur, ateliers pratiques, supports de cours",
  },

  // ===== SIGNATURE =====
  {
    id: "signature.responsable_organisme",
    label: "Signature responsable OF",
    category: "signature",
    description: "Image de signature du responsable de l'organisme de formation",
    example: "https://example.com/signature.png",
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

  // ===== INDEPENDANT =====
  {
    id: "independant.civilite",
    label: "Civilite",
    category: "independant",
    description: "Civilite de l'independant (M. / Mme)",
    example: "M.",
  },
  {
    id: "independant.nom",
    label: "Nom",
    category: "independant",
    description: "Nom de l'independant",
    example: "DURAND",
  },
  {
    id: "independant.prenom",
    label: "Prenom",
    category: "independant",
    description: "Prenom de l'independant",
    example: "Jean",
  },
  {
    id: "independant.nom_complet",
    label: "Nom complet",
    category: "independant",
    description: "Prenom et nom de l'independant",
    example: "Jean DURAND",
  },
  {
    id: "independant.siret",
    label: "SIRET",
    category: "independant",
    description: "Numero SIRET de l'independant",
    example: "123 456 789 00012",
  },
  {
    id: "independant.adresse",
    label: "Adresse",
    category: "independant",
    description: "Adresse de l'independant",
    example: "10 rue du Commerce",
  },
  {
    id: "independant.code_postal",
    label: "Code postal",
    category: "independant",
    description: "Code postal de l'independant",
    example: "75011",
  },
  {
    id: "independant.ville",
    label: "Ville",
    category: "independant",
    description: "Ville de l'independant",
    example: "Paris",
  },
  {
    id: "independant.adresse_complete",
    label: "Adresse complete",
    category: "independant",
    description: "Adresse complete de l'independant",
    example: "10 rue du Commerce, 75011 Paris",
  },
  {
    id: "independant.email",
    label: "Email",
    category: "independant",
    description: "Email de l'independant",
    example: "jean.durand@email.com",
  },
  {
    id: "independant.telephone",
    label: "Telephone",
    category: "independant",
    description: "Telephone de l'independant",
    example: "06 98 76 54 32",
  },
  {
    id: "independant.activite",
    label: "Activite",
    category: "independant",
    description: "Activite professionnelle de l'independant",
    example: "Consultant informatique",
  },
  {
    id: "independant.date_naissance",
    label: "Date de naissance",
    category: "independant",
    description: "Date de naissance de l'independant",
    example: "20/06/1980",
  },
  {
    id: "independant.lieu_naissance",
    label: "Lieu de naissance",
    category: "independant",
    description: "Lieu de naissance de l'independant",
    example: "Lyon",
  },

  // ===== FINANCEUR =====
  {
    id: "financeur.nom",
    label: "Nom du financeur",
    category: "financeur",
    description: "Nom de l'organisme financeur (OPCO, Pole Emploi...)",
    example: "OPCO Atlas",
  },
  {
    id: "financeur.siret",
    label: "SIRET financeur",
    category: "financeur",
    description: "Numero SIRET du financeur",
    example: "852 963 741 00025",
  },
  {
    id: "financeur.adresse",
    label: "Adresse financeur",
    category: "financeur",
    description: "Adresse du financeur",
    example: "30 rue de la Solidarite",
  },
  {
    id: "financeur.code_postal",
    label: "Code postal financeur",
    category: "financeur",
    description: "Code postal du financeur",
    example: "75015",
  },
  {
    id: "financeur.ville",
    label: "Ville financeur",
    category: "financeur",
    description: "Ville du financeur",
    example: "Paris",
  },
  {
    id: "financeur.adresse_complete",
    label: "Adresse complete financeur",
    category: "financeur",
    description: "Adresse complete du financeur",
    example: "30 rue de la Solidarite, 75015 Paris",
  },
  {
    id: "financeur.telephone",
    label: "Telephone financeur",
    category: "financeur",
    description: "Telephone du financeur",
    example: "01 45 67 89 00",
  },
  {
    id: "financeur.email",
    label: "Email financeur",
    category: "financeur",
    description: "Email du financeur",
    example: "contact@opco-atlas.fr",
  },
  {
    id: "financeur.representant",
    label: "Representant financeur",
    category: "financeur",
    description: "Nom du representant du financeur",
    example: "Marie FINANCE",
  },
  {
    id: "financeur.fonction_representant",
    label: "Fonction representant",
    category: "financeur",
    description: "Fonction du representant du financeur",
    example: "Charge de mission",
  },
  {
    id: "financeur.numero_dossier",
    label: "Numero de dossier",
    category: "financeur",
    description: "Numero de dossier de financement",
    example: "DOSSIER-2025-001234",
  },

  // ===== CLIENT (pour les conditions) =====
  {
    id: "client.type",
    label: "Type de client",
    category: "client",
    description: "Type de client pour les conditions (entreprise, particulier, independant, salarie, financeur)",
    example: "entreprise",
    isConditional: true,
  },

  // ===== CONDITIONS (blocs conditionnels) =====
  {
    id: "#if client.type === 'entreprise'",
    label: "Si Entreprise",
    category: "conditions",
    description: "Afficher uniquement si le client est une entreprise",
    example: "{{#if client.type === 'entreprise'}}...{{/if}}",
    isConditional: true,
  },
  {
    id: "#if client.type === 'particulier'",
    label: "Si Particulier",
    category: "conditions",
    description: "Afficher uniquement si le client est un particulier",
    example: "{{#if client.type === 'particulier'}}...{{/if}}",
    isConditional: true,
  },
  {
    id: "#if client.type === 'independant'",
    label: "Si Independant",
    category: "conditions",
    description: "Afficher uniquement si le client est un independant",
    example: "{{#if client.type === 'independant'}}...{{/if}}",
    isConditional: true,
  },
  {
    id: "#if client.type === 'salarie'",
    label: "Si Salarie",
    category: "conditions",
    description: "Afficher uniquement si le client est un salarie",
    example: "{{#if client.type === 'salarie'}}...{{/if}}",
    isConditional: true,
  },
  {
    id: "#if client.type === 'financeur'",
    label: "Si Financeur",
    category: "conditions",
    description: "Afficher uniquement si le client est un financeur (OPCO...)",
    example: "{{#if client.type === 'financeur'}}...{{/if}}",
    isConditional: true,
  },
  {
    id: "#if entreprise",
    label: "Si Entreprise existe",
    category: "conditions",
    description: "Afficher si les donnees entreprise sont presentes",
    example: "{{#if entreprise}}...{{/if}}",
    isConditional: true,
  },
  {
    id: "#if particulier",
    label: "Si Particulier existe",
    category: "conditions",
    description: "Afficher si les donnees particulier sont presentes",
    example: "{{#if particulier}}...{{/if}}",
    isConditional: true,
  },
  {
    id: "#if independant",
    label: "Si Independant existe",
    category: "conditions",
    description: "Afficher si les donnees independant sont presentes",
    example: "{{#if independant}}...{{/if}}",
    isConditional: true,
  },
  {
    id: "#if financeur",
    label: "Si Financeur existe",
    category: "conditions",
    description: "Afficher si les donnees financeur sont presentes",
    example: "{{#if financeur}}...{{/if}}",
    isConditional: true,
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
  // Note: Les variables salarie1, salarie2, etc. sont generees dynamiquement
  // via getVariablesWithDynamicContext() selon le nombre reel de salaries

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
    category: "conditions",
    label: "Conditions",
    icon: "GitBranch",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "conditions"),
  },
  {
    category: "client",
    label: "Client",
    icon: "UserCircle",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "client"),
  },
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
    category: "independant",
    label: "Independant",
    icon: "UserCog",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "independant"),
  },
  {
    category: "financeur",
    label: "Financeur",
    icon: "Landmark",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "financeur"),
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
  {
    category: "signature",
    label: "Signature",
    icon: "PenTool",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "signature"),
  },
];

/**
 * Configuration des types de documents
 */
// Toutes les categories disponibles pour harmonisation
const ALL_CATEGORIES: VariableCategory[] = [
  "formation", "journees", "modules", "organisation", "entreprise",
  "particulier", "participants", "formateur", "dates", "document", "signature"
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
