// ===========================================
// DEFINITIONS DES VARIABLES DE TEMPLATES
// Mise à jour complète avec toutes les balises
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

  for (let i = 1; i <= Math.min(count, 10); i++) {
    variables.push(
      {
        id: `j${i}_date`,
        label: `Jour ${i} - Date`,
        category: "formation",
        description: `Date de la journée ${i}`,
        example: "15 janvier 2025",
      },
      {
        id: `j${i}_horaire_matin`,
        label: `Jour ${i} - Horaires matin`,
        category: "formation",
        description: `Horaires du matin pour le jour ${i}`,
        example: "09:00 - 12:30",
      },
      {
        id: `j${i}_horaire_apres_midi`,
        label: `Jour ${i} - Horaires après-midi`,
        category: "formation",
        description: `Horaires de l'après-midi pour le jour ${i}`,
        example: "14:00 - 17:30",
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
 * @param context - Contexte avec le nombre d'elements (journees)
 */
export function getVariablesWithDynamicContext(context: DynamicVariableContext = {}): TemplateVariable[] {
  const { nombreJournees = 0 } = context;

  // Variables de base (sans les variables numerotees dynamiques au-delà de j4)
  const baseVariables = [...TEMPLATE_VARIABLES];

  // Ajouter les variables dynamiques pour les journées > 4
  if (nombreJournees > 4) {
    const dynamicJournees = generateJourneeVariables(nombreJournees).filter(v => {
      const match = v.id.match(/^j(\d+)_/);
      return match && parseInt(match[1]) > 4;
    });

    // Inserer les variables de journees apres planning_journees_formation
    const planningIndex = baseVariables.findIndex(v => v.id === "planning_journees_formation");
    if (planningIndex !== -1) {
      baseVariables.splice(planningIndex + 1, 0, ...dynamicJournees);
    }
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
      category: "of",
      label: "Organisme de Formation",
      icon: "Building2",
      variables: allVariables.filter((v) => v.category === "of"),
    },
    {
      category: "entreprise",
      label: "Entreprise",
      icon: "Briefcase",
      variables: allVariables.filter((v) => v.category === "entreprise"),
    },
    {
      category: "apprenant",
      label: "Apprenant",
      icon: "GraduationCap",
      variables: allVariables.filter((v) => v.category === "apprenant"),
    },
    {
      category: "financeur",
      label: "Financeur",
      icon: "Landmark",
      variables: allVariables.filter((v) => v.category === "financeur"),
    },
    {
      category: "intervenant",
      label: "Intervenant",
      icon: "UserCheck",
      variables: allVariables.filter((v) => v.category === "intervenant"),
    },
    {
      category: "lieu",
      label: "Lieux",
      icon: "MapPin",
      variables: allVariables.filter((v) => v.category === "lieu"),
    },
    {
      category: "formation",
      label: "Formation",
      icon: "BookOpen",
      variables: allVariables.filter((v) => v.category === "formation"),
    },
    {
      category: "dates",
      label: "Dates",
      icon: "Calendar",
      variables: allVariables.filter((v) => v.category === "dates"),
    },
    {
      category: "client",
      label: "Client",
      icon: "UserCircle",
      variables: allVariables.filter((v) => v.category === "client"),
    },
    {
      category: "tarifs",
      label: "Tarifs & Financement",
      icon: "CreditCard",
      variables: allVariables.filter((v) => v.category === "tarifs"),
    },
  ];
}

/**
 * Toutes les variables disponibles dans le systeme
 */
export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  // =====================================================
  // ORGANISME DE FORMATION (of_)
  // Source: Paramètres > Organisme de formation
  // =====================================================
  {
    id: "of_raison_sociale",
    label: "Raison sociale de l'organisme",
    category: "of",
    description: "Raison sociale officielle de l'organisme de formation",
    example: "Automate Formation SAS",
  },
  {
    id: "of_nom_commercial",
    label: "Nom commercial de l'organisme",
    category: "of",
    description: "Nom commercial utilisé par l'organisme",
    example: "Automate Formation",
  },
  {
    id: "of_siret",
    label: "Numéro SIRET",
    category: "of",
    description: "Numéro SIRET de l'organisme de formation",
    example: "123 456 789 00012",
  },
  {
    id: "of_ville_rcs",
    label: "Ville immatriculation du RCS",
    category: "of",
    description: "Ville d'immatriculation au Registre du Commerce et des Sociétés",
    example: "Paris",
  },
  {
    id: "of_nda",
    label: "Numéro de déclaration d'activité",
    category: "of",
    description: "Numéro de déclaration d'activité auprès de la DREETS",
    example: "11 75 12345 67",
  },
  {
    id: "of_region_enregistrement",
    label: "Région d'enregistrement",
    category: "of",
    description: "Région d'acquisition du numéro de déclaration d'activité",
    example: "Île-de-France",
  },
  {
    id: "of_adresse",
    label: "Adresse",
    category: "of",
    description: "Adresse de l'organisme de formation",
    example: "15 rue de la Formation",
  },
  {
    id: "of_code_postal",
    label: "Code postal",
    category: "of",
    description: "Code postal de l'organisme",
    example: "75001",
  },
  {
    id: "of_ville",
    label: "Ville",
    category: "of",
    description: "Ville de l'organisme",
    example: "Paris",
  },
  {
    id: "of_pays",
    label: "Pays",
    category: "of",
    description: "Pays de l'organisme",
    example: "France",
  },
  {
    id: "of_representant_nom",
    label: "Nom du représentant légal",
    category: "of",
    description: "Nom du représentant légal de l'organisme",
    example: "DUPONT",
  },
  {
    id: "of_representant_prenom",
    label: "Prénom du représentant légal",
    category: "of",
    description: "Prénom du représentant légal de l'organisme",
    example: "Jean",
  },
  {
    id: "of_representant_fonction",
    label: "Fonction du représentant légal",
    category: "of",
    description: "Fonction du représentant légal",
    example: "Directeur Général",
  },
  {
    id: "of_email",
    label: "Email de contact",
    category: "of",
    description: "Email de contact de l'organisme",
    example: "contact@automate-formation.fr",
  },
  {
    id: "of_telephone",
    label: "Téléphone",
    category: "of",
    description: "Numéro de téléphone de l'organisme",
    example: "01 23 45 67 89",
  },
  {
    id: "of_site_web",
    label: "Site web",
    category: "of",
    description: "Site web de l'organisme de formation",
    example: "www.automate-formation.fr",
  },
  {
    id: "of_signature_responsable",
    label: "Signature du responsable de l'OF",
    category: "of",
    description: "Image de signature du responsable de l'organisme de formation",
    example: "[Image de signature]",
  },
  {
    id: "of_cachet",
    label: "Cachet de l'OF",
    category: "of",
    description: "Image du cachet de l'organisme de formation",
    example: "[Image du cachet]",
  },
  {
    id: "of_logo_organisme",
    label: "Logo de l'organisme",
    category: "of",
    description: "Logo de l'organisme de formation",
    example: "[Logo]",
  },

  // =====================================================
  // ENTREPRISE (entreprise_)
  // Source: Mes données > Entreprises
  // =====================================================
  {
    id: "entreprise_raison_sociale",
    label: "Raison sociale de l'entreprise",
    category: "entreprise",
    description: "Raison sociale de l'entreprise cliente",
    example: "ACME Corporation",
  },
  {
    id: "entreprise_siret",
    label: "Numéro SIRET",
    category: "entreprise",
    description: "Numéro SIRET de l'entreprise",
    example: "987 654 321 00098",
  },
  {
    id: "entreprise_adresse",
    label: "Adresse",
    category: "entreprise",
    description: "Adresse de l'entreprise",
    example: "100 avenue des Champs-Élysées",
  },
  {
    id: "entreprise_code_postal",
    label: "Code postal",
    category: "entreprise",
    description: "Code postal de l'entreprise",
    example: "75008",
  },
  {
    id: "entreprise_ville",
    label: "Ville",
    category: "entreprise",
    description: "Ville de l'entreprise",
    example: "Paris",
  },
  {
    id: "entreprise_pays",
    label: "Pays",
    category: "entreprise",
    description: "Pays de l'entreprise",
    example: "France",
  },
  {
    id: "entreprise_representant_civilite",
    label: "Civilité du représentant légal",
    category: "entreprise",
    description: "Civilité du représentant légal (M. / Mme)",
    example: "Mme",
  },
  {
    id: "entreprise_representant_nom",
    label: "Nom du représentant légal",
    category: "entreprise",
    description: "Nom du représentant légal de l'entreprise",
    example: "MARTIN",
  },
  {
    id: "entreprise_representant_prenom",
    label: "Prénom du représentant légal",
    category: "entreprise",
    description: "Prénom du représentant légal de l'entreprise",
    example: "Marie",
  },
  {
    id: "entreprise_representant_fonction",
    label: "Fonction du représentant légal",
    category: "entreprise",
    description: "Fonction du représentant légal",
    example: "Directrice des Ressources Humaines",
  },
  {
    id: "entreprise_email",
    label: "Email",
    category: "entreprise",
    description: "Email de l'entreprise",
    example: "contact@acme.com",
  },
  {
    id: "entreprise_telephone",
    label: "Téléphone",
    category: "entreprise",
    description: "Téléphone de l'entreprise",
    example: "01 23 45 67 89",
  },
  {
    id: "entreprise_tva_intracom",
    label: "TVA intracommunautaire",
    category: "entreprise",
    description: "Numéro de TVA intracommunautaire",
    example: "FR12345678901",
  },
  {
    id: "entreprise_nombre_apprenants",
    label: "Nombre d'apprenants de l'entreprise",
    category: "entreprise",
    description: "Nombre d'apprenants de l'entreprise inscrits sur cette formation (calculé automatiquement)",
    example: "3",
  },
  {
    id: "entreprise_liste_apprenants",
    label: "Liste des participants de l'entreprise",
    category: "entreprise",
    description: "Liste formatée des participants de cette entreprise pour la formation",
    example: "DUPONT Marie\nMARTIN Paul\nDURAND Julie",
  },

  // =====================================================
  // APPRENANT (apprenant_)
  // Source: Mes données > Apprenants
  // =====================================================
  {
    id: "apprenant_nom",
    label: "Nom de l'apprenant",
    category: "apprenant",
    description: "Nom de famille de l'apprenant",
    example: "DUPONT",
  },
  {
    id: "apprenant_prenom",
    label: "Prénom de l'apprenant",
    category: "apprenant",
    description: "Prénom de l'apprenant",
    example: "Marie",
  },
  {
    id: "apprenant_statut",
    label: "Statut de l'apprenant",
    category: "apprenant",
    description: "Statut de l'apprenant (salarié, indépendant, particulier)",
    example: "Salarié",
  },
  {
    id: "apprenant_raison_sociale",
    label: "Raison sociale de l'apprenant",
    category: "apprenant",
    description: "Raison sociale (si indépendant)",
    example: "Consulting Pro",
  },
  {
    id: "apprenant_siret",
    label: "Numéro SIRET",
    category: "apprenant",
    description: "Numéro SIRET de l'apprenant (si indépendant)",
    example: "123 456 789 00012",
  },
  {
    id: "apprenant_adresse",
    label: "Adresse",
    category: "apprenant",
    description: "Adresse de l'apprenant",
    example: "25 rue de la Paix",
  },
  {
    id: "apprenant_code_postal",
    label: "Code postal",
    category: "apprenant",
    description: "Code postal de l'apprenant",
    example: "75002",
  },
  {
    id: "apprenant_ville",
    label: "Ville",
    category: "apprenant",
    description: "Ville de l'apprenant",
    example: "Paris",
  },
  {
    id: "apprenant_pays",
    label: "Pays",
    category: "apprenant",
    description: "Pays de l'apprenant",
    example: "France",
  },
  {
    id: "apprenant_email",
    label: "Email",
    category: "apprenant",
    description: "Email de l'apprenant",
    example: "marie.dupont@email.com",
  },
  {
    id: "apprenant_telephone",
    label: "Téléphone",
    category: "apprenant",
    description: "Téléphone de l'apprenant",
    example: "06 12 34 56 78",
  },
  {
    id: "apprenants_liste",
    label: "Liste des apprenants",
    category: "apprenant",
    description: "Liste de tous les apprenants de la session (calculé automatiquement)",
    example: "DUPONT Marie, MARTIN Paul, DURAND Julie",
  },

  // =====================================================
  // FINANCEUR (financeur_)
  // Source: Mes données > Financeurs
  // =====================================================
  {
    id: "financeur_nom",
    label: "Nom du financeur",
    category: "financeur",
    description: "Nom de l'organisme financeur (OPCO, Pôle Emploi...)",
    example: "OPCO Atlas",
  },
  {
    id: "financeur_type",
    label: "Type de financeur",
    category: "financeur",
    description: "Type de financeur (OPCO, Région, France Travail...)",
    example: "OPCO",
  },
  {
    id: "financeur_adresse",
    label: "Adresse",
    category: "financeur",
    description: "Adresse du financeur",
    example: "30 rue de la Solidarité",
  },
  {
    id: "financeur_code_postal",
    label: "Code postal",
    category: "financeur",
    description: "Code postal du financeur",
    example: "75015",
  },
  {
    id: "financeur_ville",
    label: "Ville",
    category: "financeur",
    description: "Ville du financeur",
    example: "Paris",
  },
  {
    id: "financeur_pays",
    label: "Pays",
    category: "financeur",
    description: "Pays du financeur",
    example: "France",
  },
  {
    id: "financeur_email",
    label: "Email",
    category: "financeur",
    description: "Email du financeur",
    example: "contact@opco-atlas.fr",
  },
  {
    id: "financeur_telephone",
    label: "Téléphone",
    category: "financeur",
    description: "Téléphone du financeur",
    example: "01 45 67 89 00",
  },

  // =====================================================
  // INTERVENANT (intervenant_)
  // Source: Mes données > Intervenants
  // =====================================================
  {
    id: "intervenant_nom",
    label: "Nom de l'intervenant",
    category: "intervenant",
    description: "Nom de l'intervenant/formateur",
    example: "BERNARD",
  },
  {
    id: "intervenant_prenom",
    label: "Prénom de l'intervenant",
    category: "intervenant",
    description: "Prénom de l'intervenant/formateur",
    example: "Sophie",
  },
  {
    id: "intervenant_adresse",
    label: "Adresse",
    category: "intervenant",
    description: "Adresse de l'intervenant",
    example: "10 rue du Commerce",
  },
  {
    id: "intervenant_code_postal",
    label: "Code postal",
    category: "intervenant",
    description: "Code postal de l'intervenant",
    example: "75011",
  },
  {
    id: "intervenant_ville",
    label: "Ville",
    category: "intervenant",
    description: "Ville de l'intervenant",
    example: "Paris",
  },
  {
    id: "intervenant_pays",
    label: "Pays",
    category: "intervenant",
    description: "Pays de l'intervenant",
    example: "France",
  },
  {
    id: "intervenant_email",
    label: "Email",
    category: "intervenant",
    description: "Email de l'intervenant",
    example: "s.bernard@formation.fr",
  },
  {
    id: "intervenant_telephone",
    label: "Téléphone",
    category: "intervenant",
    description: "Téléphone de l'intervenant",
    example: "06 12 34 56 78",
  },
  {
    id: "intervenant_specialites",
    label: "Spécialités",
    category: "intervenant",
    description: "Domaines d'expertise de l'intervenant",
    example: "Management, Leadership, Communication",
  },
  {
    id: "intervenant_raison_sociale",
    label: "Raison sociale de l'intervenant (si externe)",
    category: "intervenant",
    description: "Raison sociale si l'intervenant est une entreprise externe",
    example: "Consulting Expert SARL",
  },
  {
    id: "intervenant_siret",
    label: "SIRET de l'intervenant (si entreprise)",
    category: "intervenant",
    description: "Numéro SIRET si l'intervenant est une entreprise",
    example: "123 456 789 00012",
  },
  {
    id: "intervenant_nda",
    label: "Numéro de déclaration d'activité de l'intervenant (si entreprise)",
    category: "intervenant",
    description: "NDA de l'intervenant si c'est un organisme de formation",
    example: "11 75 12345 67",
  },
  {
    id: "intervenant_equipe_pedagogique",
    label: "Équipe pédagogique",
    category: "intervenant",
    description: "Liste des intervenants de la session (calculé automatiquement)",
    example: "Sophie BERNARD, Pierre MARTIN",
  },

  // =====================================================
  // LIEUX (lieu_)
  // Source: Mes données > Lieux
  // =====================================================
  {
    id: "lieu_type",
    label: "Type de lieu",
    category: "lieu",
    description: "Type de lieu (présentiel ou visioconférence)",
    example: "Présentiel",
  },
  {
    id: "lieu_nom",
    label: "Nom du lieu",
    category: "lieu",
    description: "Nom du lieu de formation",
    example: "Salle de formation Paris 9",
  },
  {
    id: "lieu_informations_pratiques",
    label: "Informations pratiques",
    category: "lieu",
    description: "Informations pratiques (code porte, étage, accès...)",
    example: "Code porte: 1234, 3ème étage",
  },
  {
    id: "lieu_formation",
    label: "Lieu de la formation",
    category: "lieu",
    description: "Adresse complète ou lien de connexion",
    example: "12 rue de la Formation, 75009 Paris",
  },
  {
    id: "lieu_capacite",
    label: "Capacité (nombre de personnes)",
    category: "lieu",
    description: "Capacité maximale du lieu",
    example: "15",
  },

  // =====================================================
  // FORMATION (formation_)
  // Source: Formations (fiche pédagogique)
  // =====================================================
  {
    id: "formation_titre",
    label: "Titre de la formation",
    category: "formation",
    description: "Nom complet de la formation",
    example: "Management Agile et Leadership",
  },
  {
    id: "formation_modalite",
    label: "Modalité de la formation (fiche pédagogique)",
    category: "formation",
    description: "Modalité définie dans la fiche pédagogique",
    example: "Présentiel",
  },
  {
    id: "session_modalite",
    label: "Modalité de la formation (documents)",
    category: "formation",
    description: "Modalité définie pour la session de documents",
    example: "Distanciel",
  },
  {
    id: "formation_categorie_action",
    label: "Catégorie de l'action de formation",
    category: "formation",
    description: "Catégorie de l'action selon le code du travail",
    example: "Action de formation",
  },
  {
    id: "formation_duree_heures",
    label: "Durée en heures",
    category: "formation",
    description: "Durée totale en heures",
    example: "14",
  },
  {
    id: "formation_duree_jours",
    label: "Durée en jours",
    category: "formation",
    description: "Durée totale en jours",
    example: "2",
  },
  {
    id: "formation_duree_heures_jours",
    label: "Durée heures et jours",
    category: "formation",
    description: "Durée formatée en heures et jours",
    example: "14 heures (2 jours)",
  },
  {
    id: "formation_nb_participants_max",
    label: "Nombre maximum de participants par session",
    category: "formation",
    description: "Nombre maximum de participants autorisés",
    example: "12",
  },
  {
    id: "formation_description",
    label: "Description de la formation",
    category: "formation",
    description: "Description détaillée de la formation",
    example: "Cette formation vous permettra de maîtriser les fondamentaux...",
  },
  {
    id: "formation_objectifs_pedagogiques",
    label: "Objectifs pédagogiques de la formation",
    category: "formation",
    description: "Liste des objectifs pédagogiques",
    example: "- Comprendre les principes du management agile\n- Développer son leadership",
  },
  {
    id: "formation_prerequis",
    label: "Prérequis",
    category: "formation",
    description: "Prérequis nécessaires pour suivre la formation",
    example: "Aucun prérequis particulier",
  },
  {
    id: "formation_public_vise",
    label: "Public visé",
    category: "formation",
    description: "Public cible de la formation",
    example: "Managers, chefs de projet, responsables d'équipe",
  },
  {
    id: "formation_contenu_detaille",
    label: "Contenu de la formation",
    category: "formation",
    description: "Contenu détaillé et programme de la formation",
    example: "Module 1: Introduction au management agile...",
  },
  {
    id: "formation_suivi_execution_evaluation",
    label: "Suivi de l'exécution et évaluation des résultats",
    category: "formation",
    description: "Modalités de suivi et d'évaluation",
    example: "Feuilles d'émargement, évaluation de fin de formation, QCM",
  },
  {
    id: "formation_ressources_pedagogiques",
    label: "Ressources pédagogiques",
    category: "formation",
    description: "Ressources et moyens pédagogiques mis à disposition",
    example: "Support de cours, exercices pratiques, études de cas",
  },
  {
    id: "formation_accessibilite",
    label: "Accessibilité",
    category: "formation",
    description: "Informations d'accessibilité handicap",
    example: "Formation accessible aux personnes en situation de handicap",
  },
  {
    id: "formation_delai_acces",
    label: "Délai d'accès",
    category: "formation",
    description: "Délai pour accéder à la formation",
    example: "14 jours ouvrables",
  },
  {
    id: "tarif_entreprise_ht_fiche_peda",
    label: "Tarif entreprise (HT) (fiche pédagogique)",
    category: "formation",
    description: "Tarif HT pour les entreprises (affiché sur la fiche pédagogique)",
    example: "1 500,00 €",
  },
  {
    id: "tarif_independant_ht_fiche_peda",
    label: "Tarif indépendant (HT) (fiche pédagogique)",
    category: "formation",
    description: "Tarif HT pour les indépendants (affiché sur la fiche pédagogique)",
    example: "1 200,00 €",
  },
  {
    id: "tarif_particulier_ttc_fiche_peda",
    label: "Tarif particulier (TTC) (fiche pédagogique)",
    category: "formation",
    description: "Tarif TTC pour les particuliers (affiché sur la fiche pédagogique)",
    example: "1 440,00 €",
  },
  {
    id: "session_date_debut",
    label: "Date de début de la formation",
    category: "formation",
    description: "Date de début de la session",
    example: "15/01/2025",
  },
  {
    id: "session_date_fin",
    label: "Date de fin de la formation",
    category: "formation",
    description: "Date de fin de la session",
    example: "16/01/2025",
  },
  // Journées de formation (j1 à j4 sont les variables statiques de base)
  {
    id: "j1_date",
    label: "Jour 1 – Date",
    category: "formation",
    description: "Date du premier jour de formation",
    example: "15 janvier 2025",
  },
  {
    id: "j1_horaire_matin",
    label: "Jour 1 – Horaires matin",
    category: "formation",
    description: "Horaires du matin du jour 1",
    example: "09:00 - 12:30",
  },
  {
    id: "j1_horaire_apres_midi",
    label: "Jour 1 – Horaires après-midi",
    category: "formation",
    description: "Horaires de l'après-midi du jour 1",
    example: "14:00 - 17:30",
  },
  {
    id: "j2_date",
    label: "Jour 2 – Date",
    category: "formation",
    description: "Date du deuxième jour de formation",
    example: "16 janvier 2025",
  },
  {
    id: "j2_horaire_matin",
    label: "Jour 2 – Horaires matin",
    category: "formation",
    description: "Horaires du matin du jour 2",
    example: "09:00 - 12:30",
  },
  {
    id: "j2_horaire_apres_midi",
    label: "Jour 2 – Horaires après-midi",
    category: "formation",
    description: "Horaires de l'après-midi du jour 2",
    example: "14:00 - 17:30",
  },
  {
    id: "j3_date",
    label: "Jour 3 – Date",
    category: "formation",
    description: "Date du troisième jour de formation",
    example: "17 janvier 2025",
  },
  {
    id: "j3_horaire_matin",
    label: "Jour 3 – Horaires matin",
    category: "formation",
    description: "Horaires du matin du jour 3",
    example: "09:00 - 12:30",
  },
  {
    id: "j3_horaire_apres_midi",
    label: "Jour 3 – Horaires après-midi",
    category: "formation",
    description: "Horaires de l'après-midi du jour 3",
    example: "14:00 - 17:30",
  },
  {
    id: "j4_date",
    label: "Jour 4 – Date",
    category: "formation",
    description: "Date du quatrième jour de formation",
    example: "18 janvier 2025",
  },
  {
    id: "j4_horaire_matin",
    label: "Jour 4 – Horaires matin",
    category: "formation",
    description: "Horaires du matin du jour 4",
    example: "09:00 - 12:30",
  },
  {
    id: "j4_horaire_apres_midi",
    label: "Jour 4 – Horaires après-midi",
    category: "formation",
    description: "Horaires de l'après-midi du jour 4",
    example: "14:00 - 17:30",
  },
  {
    id: "planning_journees_formation",
    label: "Planning des journées de formation",
    category: "formation",
    description: "Planning complet (jour + dates + horaires par jour)",
    example: "Jour 1 - 15/01/2025 : 09:00-12:30 / 14:00-17:30\nJour 2 - 16/01/2025 : 09:00-12:30 / 14:00-17:30",
  },

  // =====================================================
  // DATES (date_)
  // =====================================================
  {
    id: "date_jour",
    label: "Jour",
    category: "dates",
    description: "Jour actuel (numéro)",
    example: "15",
  },
  {
    id: "date_mois",
    label: "Mois",
    category: "dates",
    description: "Mois actuel (en lettres)",
    example: "janvier",
  },
  {
    id: "date_annee",
    label: "Année",
    category: "dates",
    description: "Année actuelle",
    example: "2025",
  },
  {
    id: "date_complete_longue",
    label: "Date complète (longue)",
    category: "dates",
    description: "Date complète au format long",
    example: "15 janvier 2025",
  },
  {
    id: "date_complete_courte",
    label: "Date complète (courte)",
    category: "dates",
    description: "Date complète au format court",
    example: "15/01/2025",
  },

  // =====================================================
  // CLIENT (client.)
  // Pour les conditions
  // =====================================================
  {
    id: "client.type",
    label: "Type du client",
    category: "client",
    description: "Type de client (entreprise, independant, particulier, financeur)",
    example: "entreprise",
    isConditional: true,
  },

  // =====================================================
  // TARIFS & FINANCEMENT
  // Calculés dans les documents de session
  // =====================================================
  // Entreprise
  {
    id: "tarif_entreprise_ht_documents",
    label: "Tarif entreprise (HT) (documents)",
    category: "tarifs",
    description: "Tarif HT appliqué pour l'entreprise dans les documents",
    example: "1 500,00 €",
  },
  {
    id: "entreprise_montant_tva",
    label: "Montant de la TVA entreprise (documents)",
    category: "tarifs",
    description: "Montant de la TVA pour l'entreprise",
    example: "300,00 €",
  },
  {
    id: "entreprise_prix_ttc",
    label: "Tarif entreprise TTC (documents)",
    category: "tarifs",
    description: "Tarif TTC pour l'entreprise",
    example: "1 800,00 €",
  },
  {
    id: "entreprise_montant_financeur_ht",
    label: "Montant financé HT par un financeur externe (entreprise)",
    category: "tarifs",
    description: "Montant pris en charge par le financeur (HT)",
    example: "1 200,00 €",
  },
  {
    id: "entreprise_montant_financeur_ttc",
    label: "Montant financé TTC par un financeur externe (entreprise)",
    category: "tarifs",
    description: "Montant pris en charge par le financeur (TTC)",
    example: "1 440,00 €",
  },
  {
    id: "entreprise_reste_a_charge_ht",
    label: "Reste à charge pour entreprise HT",
    category: "tarifs",
    description: "Montant restant à la charge de l'entreprise (HT)",
    example: "300,00 €",
  },
  {
    id: "entreprise_reste_a_charge_ttc",
    label: "Reste à charge pour entreprise TTC",
    category: "tarifs",
    description: "Montant restant à la charge de l'entreprise (TTC)",
    example: "360,00 €",
  },
  // Indépendant
  {
    id: "tarif_independant_ht_documents",
    label: "Tarif indépendant (HT) (documents)",
    category: "tarifs",
    description: "Tarif HT appliqué pour l'indépendant dans les documents",
    example: "1 200,00 €",
  },
  {
    id: "independant_montant_tva",
    label: "Montant de la TVA indépendant (documents)",
    category: "tarifs",
    description: "Montant de la TVA pour l'indépendant",
    example: "240,00 €",
  },
  {
    id: "independant_prix_ttc",
    label: "Tarif indépendant TTC (documents)",
    category: "tarifs",
    description: "Tarif TTC pour l'indépendant",
    example: "1 440,00 €",
  },
  {
    id: "independant_montant_financeur_ht",
    label: "Montant financé HT par un financeur externe (indépendant)",
    category: "tarifs",
    description: "Montant pris en charge par le financeur (HT)",
    example: "1 000,00 €",
  },
  {
    id: "independant_montant_financeur_ttc",
    label: "Montant financé TTC par un financeur externe (indépendant)",
    category: "tarifs",
    description: "Montant pris en charge par le financeur (TTC)",
    example: "1 200,00 €",
  },
  {
    id: "independant_reste_a_charge_ht",
    label: "Reste à charge pour indépendant HT",
    category: "tarifs",
    description: "Montant restant à la charge de l'indépendant (HT)",
    example: "200,00 €",
  },
  {
    id: "independant_reste_a_charge_ttc",
    label: "Reste à charge pour indépendant TTC",
    category: "tarifs",
    description: "Montant restant à la charge de l'indépendant (TTC)",
    example: "240,00 €",
  },
  // Particulier
  {
    id: "particulier_prix_ttc",
    label: "Tarif particulier TTC (documents)",
    category: "tarifs",
    description: "Tarif TTC pour le particulier",
    example: "1 440,00 €",
  },

  // =====================================================
  // CONDITIONS (blocs conditionnels)
  // =====================================================
  {
    id: "#if client.type === 'entreprise'",
    label: "Si Entreprise",
    category: "conditions",
    description: "Afficher uniquement si le client est une entreprise",
    example: "{{#if client.type === 'entreprise'}}...{{/if}}",
    isConditional: true,
  },
  {
    id: "#if client.type === 'independant'",
    label: "Si Indépendant",
    category: "conditions",
    description: "Afficher uniquement si le client est un indépendant",
    example: "{{#if client.type === 'independant'}}...{{/if}}",
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
    id: "#if client.type === 'financeur'",
    label: "Si Financeur",
    category: "conditions",
    description: "Afficher uniquement si le client est un financeur",
    example: "{{#if client.type === 'financeur'}}...{{/if}}",
    isConditional: true,
  },
  {
    id: "#if client.type === 'salarie'",
    label: "Si Salarié",
    category: "conditions",
    description: "Afficher uniquement si le client est un salarié",
    example: "{{#if client.type === 'salarie'}}...{{/if}}",
    isConditional: true,
  },
  {
    id: "#if client.type === 'intervenant'",
    label: "Si intervenant entreprise",
    category: "conditions",
    description: "Afficher uniquement si l'intervenant est une entreprise",
    example: "{{#if client.type === 'intervenant'}}...{{/if}}",
    isConditional: true,
  },
  {
    id: "#if entreprise_a_financeur",
    label: "Si financeur externe entreprise",
    category: "conditions",
    description: "Afficher si l'entreprise a un financeur externe",
    example: "{{#if entreprise_a_financeur}}...{{/if}}",
    isConditional: true,
  },
  {
    id: "#if independant_a_financeur",
    label: "Si financeur externe indépendant",
    category: "conditions",
    description: "Afficher si l'indépendant a un financeur externe",
    example: "{{#if independant_a_financeur}}...{{/if}}",
    isConditional: true,
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
    category: "of",
    label: "Organisme de Formation",
    icon: "Building2",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "of"),
  },
  {
    category: "entreprise",
    label: "Entreprise",
    icon: "Briefcase",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "entreprise"),
  },
  {
    category: "apprenant",
    label: "Apprenant",
    icon: "GraduationCap",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "apprenant"),
  },
  {
    category: "financeur",
    label: "Financeur",
    icon: "Landmark",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "financeur"),
  },
  {
    category: "intervenant",
    label: "Intervenant",
    icon: "UserCheck",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "intervenant"),
  },
  {
    category: "lieu",
    label: "Lieux",
    icon: "MapPin",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "lieu"),
  },
  {
    category: "formation",
    label: "Formation",
    icon: "BookOpen",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "formation"),
  },
  {
    category: "dates",
    label: "Dates",
    icon: "Calendar",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "dates"),
  },
  {
    category: "client",
    label: "Client",
    icon: "UserCircle",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "client"),
  },
  {
    category: "tarifs",
    label: "Tarifs & Financement",
    icon: "CreditCard",
    variables: TEMPLATE_VARIABLES.filter((v) => v.category === "tarifs"),
  },
];

/**
 * Configuration des types de documents
 */
// Toutes les categories disponibles pour harmonisation
const ALL_CATEGORIES: VariableCategory[] = [
  "of", "entreprise", "apprenant", "financeur", "intervenant",
  "lieu", "formation", "dates", "client", "tarifs", "conditions"
];

export const DOCUMENT_TYPES: DocumentTypeConfig[] = [
  {
    type: "fiche_pedagogique",
    label: "Fiche Pédagogique",
    description: "Document détaillant le contenu pédagogique de la formation",
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
    description: "Programme détaillé de la formation",
    icon: "ListOrdered",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "attestation_fin",
    label: "Attestation de Fin de Formation",
    description: "Attestation délivrée à la fin de la formation",
    icon: "Award",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "feuille_emargement",
    label: "Feuille d'Émargement",
    description: "Feuille de présence pour signature",
    icon: "ClipboardCheck",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "reglement_interieur",
    label: "Règlement Intérieur",
    description: "Règlement intérieur applicable aux stagiaires",
    icon: "Scale",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "evaluation_chaud",
    label: "Évaluation à Chaud",
    description: "Questionnaire de satisfaction post-formation",
    icon: "ThermometerSun",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "evaluation_froid",
    label: "Évaluation à Froid",
    description: "Questionnaire d'évaluation différée",
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
    description: "Convocation à la formation",
    icon: "Mail",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "certificat",
    label: "Certificat",
    description: "Certificat de réalisation",
    icon: "Award",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "contrat_sous_traitance",
    label: "Contrat de Sous-traitance",
    description: "Contrat avec un intervenant externe",
    icon: "FileSignature",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "cgv",
    label: "Conditions Générales de Vente",
    description: "CGV de l'organisme de formation",
    icon: "FileText",
    availableCategories: ALL_CATEGORIES,
  },
  {
    type: "custom",
    label: "Document Personnalisé",
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
  return TEMPLATE_VARIABLES.find((v) => v.id === id);
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

  return Array.from(new Set(matches)); // Retirer les doublons
}
