// ===========================================
// TYPES POUR LE SYSTEME DE TEMPLATES
// Mise à jour avec les nouvelles catégories
// ===========================================

/**
 * Categories de variables disponibles dans les templates
 */
export type VariableCategory =
  | "of"           // Organisme de Formation
  | "entreprise"   // Entreprise cliente
  | "apprenant"    // Apprenant (salarié, indépendant, particulier)
  | "financeur"    // Financeur (OPCO, Région, etc.)
  | "intervenant"  // Intervenant/Formateur
  | "lieu"         // Lieu de formation
  | "formation"    // Formation et session
  | "dates"        // Dates
  | "client"       // Type de client (pour conditions)
  | "tarifs"       // Tarifs et financement
  | "conditions";  // Blocs conditionnels

/**
 * Definition d'une variable de template
 */
export interface TemplateVariable {
  /** Identifiant unique de la variable (ex: "of_raison_sociale") */
  id: string;
  /** Nom affiche dans l'interface (ex: "Raison sociale de l'organisme") */
  label: string;
  /** Categorie de la variable */
  category: VariableCategory;
  /** Description de la variable */
  description: string;
  /** Exemple de valeur */
  example: string;
  /** Si la variable est une boucle (ex: {{#each modules}}) */
  isLoop?: boolean;
  /** Si la variable est conditionnelle (ex: {{#if entreprise}}) */
  isConditional?: boolean;
  /** Variables enfants (pour les boucles) */
  children?: TemplateVariable[];
}

/**
 * Groupe de variables par categorie
 */
export interface VariableGroup {
  category: VariableCategory;
  label: string;
  icon: string;
  variables: TemplateVariable[];
}

/**
 * Types de documents supportes
 */
export type DocumentType =
  | "fiche_pedagogique"
  | "convention_formation"
  | "contrat_formation"
  | "programme_formation"
  | "attestation_fin_formation"
  | "attestation_fin"
  | "attestation_presence"
  | "feuille_emargement"
  | "reglement_interieur"
  | "evaluation_chaud"
  | "evaluation_froid"
  | "convocation"
  | "certificat"
  | "devis"
  | "facture"
  | "contrat_sous_traitance"
  | "cgv"
  | "autre"
  | "custom";

/**
 * Configuration d'un type de document
 */
export interface DocumentTypeConfig {
  type: DocumentType;
  label: string;
  description: string;
  icon: string;
  /** Categories de variables disponibles pour ce type */
  availableCategories: VariableCategory[];
  /** Template par defaut (optionnel) */
  defaultTemplate?: string;
}

/**
 * Types de clients disponibles pour les conditions
 */
export type ClientType = "entreprise" | "particulier" | "independant" | "salarie" | "financeur" | "intervenant";

/**
 * Donnees du client (pour les conditions)
 */
export interface ClientData {
  type: ClientType;
}

// ===========================================
// DONNEES ORGANISME DE FORMATION (of_)
// ===========================================
export interface OrganismeFormationData {
  raison_sociale: string;
  nom_commercial?: string;
  siret: string;
  ville_rcs?: string;
  nda: string; // Numéro de déclaration d'activité
  region_enregistrement?: string;
  adresse: string;
  code_postal: string;
  ville: string;
  pays?: string;
  representant_nom?: string;
  representant_prenom?: string;
  representant_fonction?: string;
  email?: string;
  telephone?: string;
  site_web?: string; // Site web de l'organisme
  signature_responsable?: string; // URL image
  cachet?: string; // URL image
  logo_organisme?: string; // URL image
}

// ===========================================
// DONNEES ENTREPRISE (entreprise_)
// ===========================================
export interface EntrepriseData {
  id?: string;
  raison_sociale?: string;
  siret?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  pays?: string;
  representant_civilite?: string;
  representant_nom?: string;
  representant_prenom?: string;
  representant_fonction?: string;
  email?: string;
  telephone?: string;
  tva_intracom?: string;
  // Calculés automatiquement lors d'une session
  nombre_apprenants?: number;
  liste_apprenants?: string;
  // Legacy: support ancien format
  nom?: string;
  representant?: string;
  adresse_complete?: string;
}

// ===========================================
// DONNEES APPRENANT (apprenant_)
// ===========================================
export interface ApprenantData {
  id?: string;
  nom: string;
  prenom: string;
  statut: "SALARIE" | "INDEPENDANT" | "PARTICULIER";
  raison_sociale?: string; // Si indépendant
  siret?: string; // Si indépendant
  adresse?: string;
  code_postal?: string;
  ville?: string;
  pays?: string;
  email?: string;
  telephone?: string;
}

// ===========================================
// DONNEES FINANCEUR (financeur_)
// ===========================================
export interface FinanceurData {
  id?: string;
  nom: string;
  type?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  pays?: string;
  email?: string;
  telephone?: string;
}

// ===========================================
// DONNEES INTERVENANT (intervenant_)
// ===========================================
export interface IntervenantData {
  id?: string;
  nom: string;
  prenom: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  pays?: string;
  email?: string;
  telephone?: string;
  specialites?: string[];
  raison_sociale?: string; // Si externe
  siret?: string; // Si entreprise
  nda?: string; // Si organisme de formation
}

// ===========================================
// DONNEES LIEU (lieu_)
// ===========================================
export interface LieuData {
  id?: string;
  type: "PRESENTIEL" | "VISIOCONFERENCE";
  nom: string;
  formation?: string; // Adresse ou lien
  code_postal?: string;
  ville?: string;
  informations_pratiques?: string;
  capacite?: number;
}

// ===========================================
// DONNEES FORMATION (formation_)
// ===========================================
export interface FormationData {
  id?: string;
  titre: string;
  modalite?: string;
  categorie_action?: string;
  duree_heures?: number;
  duree_jours?: number;
  duree_heures_jours?: string;
  nb_participants_max?: number;
  description?: string;
  objectifs_pedagogiques?: string;
  prerequis?: string;
  public_vise?: string;
  contenu_detaille?: string;
  suivi_execution_evaluation?: string;
  ressources_pedagogiques?: string;
  accessibilite?: string;
  delai_acces?: string;
  // Tarifs fiche pédagogique
  tarif_entreprise_ht_fiche_peda?: string;
  tarif_independant_ht_fiche_peda?: string;
  tarif_particulier_ttc_fiche_peda?: string;
  // Legacy/flexible properties
  [key: string]: unknown;
}

// ===========================================
// DONNEES SESSION
// ===========================================
export interface SessionData {
  id?: string;
  modalite?: string;
  date_debut?: string;
  date_fin?: string;
  // Journées
  journees?: JourneeData[];
  planning_journees_formation?: string;
}

export interface JourneeData {
  numero: number;
  date: string;
  horaire_matin?: string;
  horaire_apres_midi?: string;
}

// ===========================================
// DONNEES DATES (date_)
// ===========================================
export interface DatesData {
  jour: string;
  mois: string;
  annee: string;
  complete_longue: string;
  complete_courte: string;
  // Legacy
  date_complete?: string;
  date_courte?: string;
}

// ===========================================
// DONNEES TARIFS (tarifs_)
// ===========================================
export interface TarifsData {
  // Entreprise
  tarif_entreprise_ht_documents?: string;
  entreprise_montant_tva?: string;
  entreprise_prix_ttc?: string;
  entreprise_montant_financeur_ht?: string;
  entreprise_montant_financeur_ttc?: string;
  entreprise_reste_a_charge_ht?: string;
  entreprise_reste_a_charge_ttc?: string;
  entreprise_a_financeur?: boolean;
  // Indépendant
  tarif_independant_ht_documents?: string;
  independant_montant_tva?: string;
  independant_prix_ttc?: string;
  independant_montant_financeur_ht?: string;
  independant_montant_financeur_ttc?: string;
  independant_reste_a_charge_ht?: string;
  independant_reste_a_charge_ttc?: string;
  independant_a_financeur?: boolean;
  // Particulier
  particulier_prix_ttc?: string;
}

// ===========================================
// CONTEXTE DE TEMPLATE COMPLET
// ===========================================
export interface TemplateContext {
  // Organisme de formation (nouveau format)
  of?: OrganismeFormationData;
  // Entreprise cliente
  entreprise?: EntrepriseData;
  // Apprenant
  apprenant?: ApprenantData;
  apprenants?: ApprenantData[];
  apprenants_liste?: string;
  // Financeur
  financeur?: FinanceurData;
  // Intervenant
  intervenant?: IntervenantData;
  intervenants?: IntervenantData[];
  intervenant_equipe_pedagogique?: string;
  // Lieu
  lieu?: LieuData;
  // Formation
  formation?: FormationData;
  // Session
  session?: SessionData;
  // Dates
  dates?: DatesData;
  // Tarifs
  tarifs?: TarifsData;
  // Client (pour conditions)
  client?: ClientData;

  // ===========================================
  // LEGACY PROPERTIES (pour compatibilité avec ancien code)
  // ===========================================
  /** @deprecated Utiliser 'of' */
  organisation?: OrganisationData;
  /** @deprecated Utiliser 'intervenant' */
  formateur?: FormateurData;
  /** @deprecated Utiliser 'apprenants' */
  participants?: ParticipantData[];
  /** @deprecated */
  particulier?: ParticulierData;
  /** @deprecated */
  independant?: IndependantData;
  /** @deprecated */
  modules?: ModuleData[];
  /** @deprecated */
  journees?: Array<{
    numero: number;
    date: string;
    date_courte?: string;
    horaires_matin?: string;
    horaires_apres_midi?: string;
  }>;
  /** @deprecated */
  document?: DocumentData;
  /** @deprecated */
  signature?: SignatureData;
  // Index signature pour propriétés additionnelles legacy
  [key: string]: unknown;
}

// ===========================================
// TYPES LEGACY (pour compatibilité)
// ===========================================

/** @deprecated Utiliser OrganismeFormationData */
export interface OrganisationData {
  id?: string;
  nom: string;
  siret: string;
  adresse: string;
  code_postal: string;
  ville: string;
  adresse_complete?: string;
  telephone?: string;
  email?: string;
  site_web?: string;
  numero_da: string;
  logo?: string;
  logo_url?: string;
  representant?: string;
  fonction_representant?: string;
  tva_intra?: string;
  capital?: string;
  forme_juridique?: string;
  rcs?: string;
  prefecture_region?: string;
}

/** @deprecated Utiliser ApprenantData */
export interface ParticulierData {
  civilite?: string;
  nom: string;
  prenom: string;
  nom_complet?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  adresse_complete?: string;
  email?: string;
  telephone?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  statut?: string;
}

/** @deprecated Utiliser ApprenantData */
export interface IndependantData {
  civilite?: string;
  nom: string;
  prenom: string;
  nom_complet?: string;
  siret: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  adresse_complete?: string;
  email?: string;
  telephone?: string;
  activite?: string;
  date_naissance?: string;
  lieu_naissance?: string;
}

/** @deprecated Utiliser ApprenantData */
export interface ParticipantData {
  id?: string;
  civilite?: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  fonction?: string;
  type: "salarie" | "independant" | "particulier";
  siret?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  date_naissance?: string;
  lieu_naissance?: string;
}

/** @deprecated Utiliser IntervenantData */
export interface FormateurData {
  id?: string;
  civilite?: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  specialite?: string;
  entreprise?: string;
  siret?: string;
}

export interface ModuleData {
  id?: string;
  numero: number;
  titre: string;
  duree: string;
  duree_heures: number;
  objectifs?: string[];
  contenu?: string[];
  methodes?: string[];
}

export interface DocumentData {
  reference?: string;
  date_creation: string;
  version?: string;
  numero_page?: number;
  total_pages?: number;
}

export interface SignatureData {
  responsable_organisme?: string;
}

/**
 * Template sauvegarde en base
 */
export interface Template {
  id: string;
  name: string;
  type: DocumentType;
  description?: string;
  content: string;
  isGlobal: boolean;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
}

/**
 * Options de rendu
 */
export interface RenderOptions {
  previewMode?: boolean;
  outputFormat?: "html" | "json" | "text";
  inlineStyles?: boolean;
}

/**
 * Interface pour les templates par défaut
 */
export interface DefaultTemplate {
  name: string;
  description: string;
  documentType: string;
  category: "DOCUMENT" | "EMAIL" | "PDF";
  content: object;
  headerContent?: object;
  footerContent?: object;
  variables: string[];
}
