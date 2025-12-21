// ===========================================
// TYPES POUR LE SYSTEME DE TEMPLATES
// ===========================================

/**
 * Categories de variables disponibles dans les templates
 */
export type VariableCategory =
  | "formation"
  | "journees"
  | "modules"
  | "organisation"
  | "entreprise"
  | "particulier"
  | "independant"
  | "financeur"
  | "client"
  | "participants"
  | "formateur"
  | "dates"
  | "document"
  | "signature"
  | "conditions";

/**
 * Definition d'une variable de template
 */
export interface TemplateVariable {
  /** Identifiant unique de la variable (ex: "formation.titre") */
  id: string;
  /** Nom affiche dans l'interface (ex: "Titre de la formation") */
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
export type ClientType = "entreprise" | "particulier" | "independant" | "salarie" | "financeur";

/**
 * Donnees du client (pour les conditions)
 */
export interface ClientData {
  type: ClientType;
}

/**
 * Donnees du financeur (OPCO, Pole Emploi, etc.)
 */
export interface FinanceurData {
  nom: string;
  siret?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  adresse_complete?: string;
  telephone?: string;
  email?: string;
  representant?: string;
  fonction_representant?: string;
  numero_dossier?: string;
}

/**
 * Donnees de l'independant
 */
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
  activite?: string; // Activite professionnelle
  date_naissance?: string;
  lieu_naissance?: string;
}

/**
 * Contexte de donnees pour le rendu d'un template
 */
export interface TemplateContext {
  formation?: FormationData;
  journees?: JourneeData[];
  modules?: ModuleData[];
  organisation?: OrganisationData;
  entreprise?: EntrepriseData;
  particulier?: ParticulierData;
  independant?: IndependantData;
  financeur?: FinanceurData;
  client?: ClientData;
  participants?: ParticipantData[];
  formateur?: FormateurData;
  dates?: DatesData;
  document?: DocumentData;
  signature?: SignatureData;
}

/**
 * Donnees d'une formation
 */
export interface FormationData {
  id?: string;
  titre: string;
  description?: string;
  duree: string;
  duree_heures: number;
  nombre_jours?: number;
  prix?: number | string;
  prix_format?: string;
  prix_ttc?: number | string;
  tva?: number | string;
  objectifs?: string[];
  prerequis?: string[];
  public_cible?: string;
  modalites?: string;
  lieu?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  date_debut?: string;
  date_fin?: string;
  horaires_matin?: string;
  horaires_apres_midi?: string;
  reference?: string;
  methodes_pedagogiques?: string;
  moyens_techniques?: string;
  modalites_evaluation?: string;
  accessibilite?: string;
  delai_acces?: string;
}

/**
 * Donnees d'une journee de formation
 */
export interface JourneeData {
  numero: number;
  date: string;
  date_courte: string;
  horaires_matin?: string;
  horaires_apres_midi?: string;
}

/**
 * Donnees d'un particulier (stagiaire individuel)
 */
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
  statut?: string; // demandeur d'emploi, salarie, independant, etc.
}

/**
 * Donnees d'un module
 */
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

/**
 * Donnees de l'organisation (organisme de formation)
 */
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
  numero_da: string; // Numero de declaration d'activite
  logo?: string; // URL du logo
  logo_url?: string; // Alias pour compatibilite
  representant?: string;
  fonction_representant?: string;
  tva_intra?: string; // Numero TVA intracommunautaire
  capital?: string; // Capital social
  forme_juridique?: string; // SAS, SARL, etc.
  rcs?: string; // RCS
  prefecture_region?: string; // Region d'acquisition du numero de declaration d'activite
}

/**
 * Donnees de l'entreprise cliente
 */
export interface EntrepriseData {
  id?: string;
  nom: string;
  siret: string;
  adresse: string;
  code_postal: string;
  ville: string;
  adresse_complete?: string;
  telephone?: string;
  email?: string;
  representant: string;
  fonction_representant?: string;
}

/**
 * Donnees d'un participant
 */
export interface ParticipantData {
  id?: string;
  civilite?: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  fonction?: string;
  type: "salarie" | "independant" | "particulier";
  // Pour independants et salaries
  siret?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  // Informations personnelles
  date_naissance?: string;
  lieu_naissance?: string;
}

/**
 * Donnees du formateur
 */
export interface FormateurData {
  id?: string;
  civilite?: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  specialite?: string;
  // Entreprise du formateur (si externe)
  entreprise?: string;
  siret?: string;
}

/**
 * Donnees de dates
 */
export interface DatesData {
  jour: string;
  mois: string;
  annee: string;
  date_complete: string;
  date_courte: string;
  heure?: string;
}

/**
 * Donnees du document
 */
export interface DocumentData {
  reference?: string;
  date_creation: string;
  version?: string;
  numero_page?: number;
  total_pages?: number;
}

/**
 * Donnees de signature
 */
export interface SignatureData {
  responsable_organisme?: string; // URL de l'image de signature
}

/**
 * Template sauvegarde en base
 */
export interface Template {
  id: string;
  name: string;
  type: DocumentType;
  description?: string;
  content: string; // JSON TipTap
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
  /** Mode preview (affiche les variables non resolues) */
  previewMode?: boolean;
  /** Format de sortie */
  outputFormat?: "html" | "json" | "text";
  /** Inclure les styles inline */
  inlineStyles?: boolean;
}
