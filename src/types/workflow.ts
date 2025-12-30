// ===========================================
// Types TypeScript pour le Moteur d'Automatisation
// Module 6 - Workbots Formation
// ===========================================

import {
  WorkflowTriggerType,
  WorkflowActionType,
  WorkflowConditionType,
  WorkflowExecutionStatus,
  WorkflowCategory,
  Workflow,
  WorkflowEtape,
  WorkflowExecution,
  WorkflowExecutionEtape,
  WorkflowLog,
  WorkflowEmailTemplate,
  WorkflowSMSTemplate,
} from "@prisma/client";

// ===========================================
// Re-export des enums Prisma
// ===========================================
export {
  WorkflowTriggerType,
  WorkflowActionType,
  WorkflowConditionType,
  WorkflowExecutionStatus,
  WorkflowCategory,
};

// ===========================================
// Configuration des déclencheurs (Triggers)
// ===========================================

// Configuration de base pour tous les triggers
export interface BaseTriggerConfig {
  // Filtres optionnels
  formationIds?: string[]; // Limiter à certaines formations
  sessionIds?: string[]; // Limiter à certaines sessions
}

// Trigger: Score inférieur à un seuil
export interface ScoreThresholdTriggerConfig extends BaseTriggerConfig {
  seuil: number; // Score minimum (0-100)
  typeEvaluation?: "POSITIONNEMENT" | "FINALE" | "QCM_MODULE" | "ATELIER_MODULE";
}

// Trigger: Document non signé après X jours
export interface DocumentNonSigneTriggerConfig extends BaseTriggerConfig {
  delaiJours: number; // Nombre de jours après lequel déclencher
  typeDocument?: string; // Type de document spécifique
}

// Trigger: CRON (planification)
export interface CronTriggerConfig extends BaseTriggerConfig {
  expression: string; // Expression CRON (ex: "0 9 * * 1" = tous les lundis à 9h)
  timezone?: string; // Fuseau horaire (défaut: Europe/Paris)
}

// Union de toutes les configurations de triggers
export type TriggerConfig =
  | BaseTriggerConfig
  | ScoreThresholdTriggerConfig
  | DocumentNonSigneTriggerConfig
  | CronTriggerConfig;

// ===========================================
// Configuration des actions
// ===========================================

// Action: Envoyer un email
export interface EnvoyerEmailActionConfig {
  templateId?: string; // ID du template email
  sujet?: string; // Sujet personnalisé (si pas de template)
  contenu?: string; // Contenu personnalisé (si pas de template)
  destinataire: "apprenant" | "intervenant" | "entreprise" | "financeur" | "custom";
  destinataireCustom?: string; // Email personnalisé si destinataire = "custom"
  copie?: string[]; // Emails en copie
  copieCachee?: string[]; // Emails en copie cachée
  piecesJointes?: string[]; // Types de documents à joindre
}

// Action: Envoyer un SMS
export interface EnvoyerSMSActionConfig {
  templateId?: string; // ID du template SMS
  contenu?: string; // Contenu personnalisé (si pas de template)
  destinataire: "apprenant" | "intervenant" | "custom";
  destinataireCustom?: string; // Numéro personnalisé si destinataire = "custom"
}

// Action: Générer un document
export interface GenererDocumentActionConfig {
  typeDocument: string; // Type de document (DocumentType)
  envoyerParEmail?: boolean; // Envoyer par email après génération
  destinataireEmail?: "apprenant" | "intervenant" | "entreprise" | "financeur";
}

// Action: Demander une signature
export interface DemanderSignatureActionConfig {
  typeDocument: string; // Type de document à signer
  signataires: Array<{
    type: "apprenant" | "intervenant" | "entreprise" | "representant_of";
    ordre: number; // Ordre de signature
  }>;
  rappelAutomatique?: boolean; // Envoyer des rappels
  delaiRappelJours?: number; // Délai entre rappels
}

// Action: Mettre à jour un champ
export interface MettreAJourChampActionConfig {
  entite: "apprenant" | "session" | "formation" | "inscription";
  champ: string; // Nom du champ à mettre à jour
  valeur: string | number | boolean; // Nouvelle valeur
  mode: "remplacer" | "incrementer" | "decrementer" | "ajouter" | "retirer";
}

// Action: Créer une entité
export interface CreerEntiteActionConfig {
  entite: "apprenant" | "inscription" | "reclamation" | "amelioration" | "tache";
  donnees: Record<string, unknown>; // Données de création
  template?: string; // Template de données
}

// Action: Notification
export interface NotificationActionConfig {
  type: "equipe" | "utilisateur";
  utilisateurId?: string; // Si type = "utilisateur"
  roles?: string[]; // Si type = "equipe", filtrer par rôles
  titre: string;
  message: string;
  priorite?: "normale" | "haute" | "urgente";
  lienAction?: string; // Lien cliquable dans la notification
}

// Action: Webhook
export interface WebhookActionConfig {
  url: string;
  methode: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  timeout?: number; // Timeout en millisecondes
  reessayerSurEchec?: boolean;
}

// Action: Délai
export interface DelaiActionConfig {
  duree: number; // Durée du délai
  unite: "minutes" | "heures" | "jours" | "semaines";
}

// Action: Condition (branchement)
export interface ConditionActionConfig {
  conditions: WorkflowConditionConfig[];
  operateur: "ET" | "OU"; // AND/OR entre les conditions
}

// Union de toutes les configurations d'actions
export type ActionConfig =
  | EnvoyerEmailActionConfig
  | EnvoyerSMSActionConfig
  | GenererDocumentActionConfig
  | DemanderSignatureActionConfig
  | MettreAJourChampActionConfig
  | CreerEntiteActionConfig
  | NotificationActionConfig
  | WebhookActionConfig
  | DelaiActionConfig
  | ConditionActionConfig;

// ===========================================
// Configuration des conditions
// ===========================================

export interface WorkflowConditionConfig {
  type: WorkflowConditionType;
  config: ConditionSpecificConfig;
}

// Condition: Formation certifiante
export interface FormationCertifianteConditionConfig {
  attendu: boolean; // true = doit être certifiante, false = ne doit pas être certifiante
}

// Condition: Modalité de formation
export interface FormationModaliteConditionConfig {
  modalites: ("PRESENTIEL" | "DISTANCIEL" | "MIXTE" | "E_LEARNING")[];
}

// Condition: Score
export interface ScoreConditionConfig {
  operateur: "<" | "<=" | ">" | ">=" | "=" | "!=";
  valeur: number;
  typeEvaluation?: string;
}

// Condition: Champ
export interface ChampConditionConfig {
  entite: "apprenant" | "session" | "formation" | "inscription";
  champ: string;
  operateur: "=" | "!=" | "contient" | "ne_contient_pas" | "vide" | "non_vide";
  valeur?: string | number | boolean;
}

// Condition: Apprenant en situation de handicap
export interface ApprenantHandicapConditionConfig {
  enSituationDeHandicap: boolean;
}

// Condition: Type de financement
export interface ApprenantFinancementConditionConfig {
  typesFinancement: string[]; // Types de financement acceptés
}

// Condition: Formule personnalisée
export interface FormulePersonnaliseeConditionConfig {
  formule: string; // Expression JavaScript simple
  variables: string[]; // Variables utilisées dans la formule
}

// Union des configurations de conditions
export type ConditionSpecificConfig =
  | FormationCertifianteConditionConfig
  | FormationModaliteConditionConfig
  | ScoreConditionConfig
  | ChampConditionConfig
  | ApprenantHandicapConditionConfig
  | ApprenantFinancementConditionConfig
  | FormulePersonnaliseeConditionConfig;

// ===========================================
// Types pour l'éditeur visuel (React Flow)
// ===========================================

// Node pour React Flow
export interface WorkflowNode {
  id: string;
  type: "trigger" | "action" | "condition" | "delay";
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

// Données d'un node
export interface WorkflowNodeData {
  label: string;
  description?: string;
  icon?: string;
  actionType?: WorkflowActionType;
  triggerType?: WorkflowTriggerType;
  config?: ActionConfig | TriggerConfig | ConditionActionConfig;
  isConfigured: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

// Edge pour React Flow (connexion entre nodes)
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string; // "oui" | "non" pour les conditions
  targetHandle?: string;
  label?: string;
  animated?: boolean;
  style?: React.CSSProperties;
}

// État complet de l'éditeur de workflow
export interface WorkflowEditorState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  isDirty: boolean;
  isValid: boolean;
  validationErrors: WorkflowValidationError[];
}

// Erreur de validation
export interface WorkflowValidationError {
  nodeId?: string;
  field?: string;
  message: string;
  severity: "error" | "warning";
}

// ===========================================
// Types pour les templates de workflows
// ===========================================

export interface WorkflowTemplate {
  id: string;
  nom: string;
  description: string;
  categorie: WorkflowCategory;
  icone: string;
  triggerType: WorkflowTriggerType;
  triggerConfig?: TriggerConfig;
  etapes: WorkflowTemplateEtape[];
  tags?: string[];
  isPopular?: boolean;
}

export interface WorkflowTemplateEtape {
  type: WorkflowActionType;
  nom: string;
  description?: string;
  config: Record<string, unknown>;
  ordre: number;
  positionX: number;
  positionY: number;
  conditions?: WorkflowConditionConfig[];
  etapeSuivanteOui?: number; // Index de l'étape suivante si condition vraie
  etapeSuivanteNon?: number; // Index de l'étape suivante si condition fausse
}

// ===========================================
// Types pour le contexte d'exécution
// ===========================================

// Contexte passé aux handlers d'actions
export interface WorkflowExecutionContext {
  workflowId: string;
  executionId: string;
  organizationId: string;

  // Entité déclencheuse
  declencheur: {
    type: string;
    id: string;
    data: Record<string, unknown>;
  };

  // Données accumulées des étapes précédentes
  resultatsEtapes: Record<string, unknown>;

  // Variables disponibles pour les templates
  variables: WorkflowVariables;
}

// Variables disponibles pour les templates (emails, SMS, etc.)
export interface WorkflowVariables {
  // Organisation
  organisation: {
    nom: string;
    nomCommercial?: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    logo?: string;
  };

  // Apprenant (si applicable)
  apprenant?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    civilite?: string;
  };

  // Formation (si applicable)
  formation?: {
    id: string;
    titre: string;
    description?: string;
    duree?: number;
    modalite?: string;
  };

  // Session (si applicable)
  session?: {
    id: string;
    dateDebut?: Date;
    dateFin?: Date;
    lieu?: string;
    formateur?: string;
  };

  // Évaluation (si applicable)
  evaluation?: {
    id: string;
    type: string;
    score?: number;
    dateCompletion?: Date;
  };

  // Document (si applicable)
  document?: {
    id: string;
    type: string;
    url?: string;
  };

  // Réclamation (si applicable)
  reclamation?: {
    id: string;
    description: string;
    dateCreation: Date;
  };

  // Variables personnalisées
  custom?: Record<string, unknown>;

  // Date et heure actuelles
  maintenant: Date;

  // Lien vers l'espace apprenant
  lienEspaceApprenant?: string;

  // Lien vers l'espace intervenant
  lienEspaceIntervenant?: string;
}

// ===========================================
// Types pour les statistiques et dashboard
// ===========================================

export interface WorkflowStats {
  totalWorkflows: number;
  workflowsActifs: number;
  totalExecutions: number;
  executionsReussies: number;
  executionsEchouees: number;
  executionsEnCours: number;
  tauxReussite: number;
  tempsExecutionMoyen: number; // en secondes
}

export interface WorkflowExecutionSummary {
  id: string;
  workflowId: string;
  workflowNom: string;
  statut: WorkflowExecutionStatus;
  progression: number;
  declencheurType: string;
  debutAt: Date;
  finAt?: Date;
  duree?: number; // en secondes
  erreur?: string;
}

export interface WorkflowDashboardData {
  stats: WorkflowStats;
  executionsRecentes: WorkflowExecutionSummary[];
  workflowsPopulaires: Array<{
    id: string;
    nom: string;
    nombreExecutions: number;
    tauxReussite: number;
  }>;
  activiteParJour: Array<{
    date: string;
    executions: number;
    reussites: number;
    echecs: number;
  }>;
}

// ===========================================
// Types pour les API
// ===========================================

// Création d'un workflow
export interface CreateWorkflowInput {
  nom: string;
  description?: string;
  icone?: string;
  categorie?: WorkflowCategory;
  triggerType: WorkflowTriggerType;
  triggerConfig?: TriggerConfig;
  actif?: boolean;
  etapes?: CreateWorkflowEtapeInput[];
}

export interface CreateWorkflowEtapeInput {
  type: WorkflowActionType;
  nom?: string;
  description?: string;
  config: ActionConfig;
  ordre: number;
  positionX?: number;
  positionY?: number;
  conditions?: WorkflowConditionConfig[];
  continuerSurErreur?: boolean;
  nombreReessais?: number;
}

// Mise à jour d'un workflow
export interface UpdateWorkflowInput {
  nom?: string;
  description?: string;
  icone?: string;
  categorie?: WorkflowCategory;
  triggerType?: WorkflowTriggerType;
  triggerConfig?: TriggerConfig;
  actif?: boolean;
}

// Réponse API workflow
export interface WorkflowResponse extends Workflow {
  etapes: WorkflowEtape[];
  _count?: {
    executions: number;
  };
}

// Liste des workflows avec pagination
export interface WorkflowListResponse {
  workflows: WorkflowResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Déclenchement manuel d'un workflow
export interface TriggerWorkflowInput {
  workflowId: string;
  declencheurType?: string;
  declencheurId?: string;
  declencheurData?: Record<string, unknown>;
}

// ===========================================
// Types pour les handlers d'actions
// ===========================================

// Résultat d'exécution d'une action
export interface ActionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  logs?: string[];
}

// Handler d'action (signature)
export type ActionHandler = (
  config: ActionConfig,
  context: WorkflowExecutionContext
) => Promise<ActionResult>;

// Registry des handlers d'actions
export type ActionHandlerRegistry = {
  [key in WorkflowActionType]: ActionHandler;
};

// ===========================================
// Types pour les événements (pub/sub)
// ===========================================

export interface WorkflowEvent {
  type: WorkflowTriggerType;
  organizationId: string;
  timestamp: Date;
  data: WorkflowEventData;
}

export interface WorkflowEventData {
  // IDs des entités concernées
  formationId?: string;
  sessionId?: string;
  apprenantId?: string;
  inscriptionId?: string;
  evaluationId?: string;
  documentId?: string;
  reclamationId?: string;

  // Données additionnelles
  metadata?: Record<string, unknown>;
}

// ===========================================
// Types pour la configuration globale
// ===========================================

export interface WorkflowGlobalConfig {
  // Limites
  maxWorkflowsParOrganisation: number;
  maxEtapesParWorkflow: number;
  maxExecutionsParJour: number;

  // Timeouts
  timeoutExecution: number; // en secondes
  timeoutAction: number; // en secondes

  // Retry
  maxReessais: number;
  delaiEntreReessais: number; // en secondes

  // Rate limiting
  maxEmailsParHeure: number;
  maxSMSParHeure: number;
  maxWebhooksParHeure: number;
}

// Configuration par défaut
export const DEFAULT_WORKFLOW_CONFIG: WorkflowGlobalConfig = {
  maxWorkflowsParOrganisation: 50,
  maxEtapesParWorkflow: 20,
  maxExecutionsParJour: 1000,
  timeoutExecution: 3600, // 1 heure
  timeoutAction: 300, // 5 minutes
  maxReessais: 3,
  delaiEntreReessais: 60, // 1 minute
  maxEmailsParHeure: 500,
  maxSMSParHeure: 100,
  maxWebhooksParHeure: 200,
};

// ===========================================
// Métadonnées des triggers et actions
// ===========================================

export interface TriggerMetadata {
  type: WorkflowTriggerType;
  nom: string;
  description: string;
  icone: string;
  categorie: string;
  configSchema?: object; // JSON Schema pour la validation
}

export interface ActionMetadata {
  type: WorkflowActionType;
  nom: string;
  description: string;
  icone: string;
  categorie: string;
  configSchema?: object; // JSON Schema pour la validation
  supportsConditions: boolean;
}

// Métadonnées de tous les triggers
export const TRIGGERS_METADATA: TriggerMetadata[] = [
  // Inscriptions
  { type: "PRE_INSCRIPTION", nom: "Nouvelle pré-inscription", description: "Déclenché lors d'une nouvelle pré-inscription", icone: "UserPlus", categorie: "Inscriptions" },
  { type: "INSCRIPTION_SESSION", nom: "Inscription confirmée", description: "Déclenché lors de la confirmation d'une inscription à une session", icone: "UserCheck", categorie: "Inscriptions" },

  // Sessions
  { type: "SESSION_J_MOINS_7", nom: "J-7 avant session", description: "Déclenché 7 jours avant le début d'une session", icone: "Calendar", categorie: "Sessions" },
  { type: "SESSION_J_MOINS_1", nom: "J-1 avant session", description: "Déclenché 1 jour avant le début d'une session", icone: "CalendarClock", categorie: "Sessions" },
  { type: "SESSION_DEBUT", nom: "Début de session", description: "Déclenché au début d'une session", icone: "Play", categorie: "Sessions" },
  { type: "SESSION_FIN_JOURNEE", nom: "Fin de journée", description: "Déclenché à la fin de chaque journée de formation", icone: "Sunset", categorie: "Sessions" },
  { type: "SESSION_FIN", nom: "Fin de session", description: "Déclenché à la fin d'une session", icone: "Flag", categorie: "Sessions" },
  { type: "SESSION_J_PLUS_30", nom: "J+30 après session", description: "Déclenché 30 jours après la fin d'une session (évaluation à froid)", icone: "CalendarCheck", categorie: "Sessions" },

  // Évaluations
  { type: "EVALUATION_COMPLETEE", nom: "Évaluation complétée", description: "Déclenché lorsqu'un apprenant complète une évaluation", icone: "ClipboardCheck", categorie: "Évaluations" },
  { type: "SCORE_INFERIEUR_SEUIL", nom: "Score inférieur au seuil", description: "Déclenché lorsqu'un score est inférieur à un seuil défini", icone: "AlertTriangle", categorie: "Évaluations" },

  // Documents
  { type: "DOCUMENT_NON_SIGNE", nom: "Document non signé", description: "Déclenché lorsqu'un document n'est pas signé après un délai", icone: "FileX", categorie: "Documents" },
  { type: "DOCUMENT_GENERE", nom: "Document généré", description: "Déclenché lorsqu'un document est généré", icone: "FileText", categorie: "Documents" },
  { type: "SIGNATURE_RECUE", nom: "Signature reçue", description: "Déclenché lorsqu'une signature est reçue", icone: "FileCheck", categorie: "Documents" },

  // Qualité
  { type: "RECLAMATION_RECUE", nom: "Réclamation reçue", description: "Déclenché lors de la réception d'une réclamation", icone: "MessageSquareWarning", categorie: "Qualité" },
  { type: "AMELIORATION_CREEE", nom: "Amélioration créée", description: "Déclenché lors de la création d'une action d'amélioration", icone: "TrendingUp", categorie: "Qualité" },

  // Planification
  { type: "CRON", nom: "Planification CRON", description: "Déclenché selon une planification personnalisée", icone: "Clock", categorie: "Planification" },
  { type: "MANUEL", nom: "Déclenchement manuel", description: "Déclenché manuellement par un utilisateur", icone: "Hand", categorie: "Manuel" },
];

// Métadonnées de toutes les actions
export const ACTIONS_METADATA: ActionMetadata[] = [
  // Communication
  { type: "ENVOYER_EMAIL", nom: "Envoyer un email", description: "Envoie un email personnalisé", icone: "Mail", categorie: "Communication", supportsConditions: true },
  { type: "ENVOYER_SMS", nom: "Envoyer un SMS", description: "Envoie un SMS", icone: "MessageSquare", categorie: "Communication", supportsConditions: true },

  // Documents
  { type: "GENERER_DOCUMENT", nom: "Générer un document", description: "Génère un document PDF", icone: "FileText", categorie: "Documents", supportsConditions: true },
  { type: "DEMANDER_SIGNATURE", nom: "Demander signature", description: "Demande une signature électronique", icone: "PenTool", categorie: "Documents", supportsConditions: true },

  // Données
  { type: "METTRE_A_JOUR_CHAMP", nom: "Mettre à jour un champ", description: "Met à jour un champ dans la base de données", icone: "Edit", categorie: "Données", supportsConditions: true },
  { type: "CREER_APPRENANT", nom: "Créer un apprenant", description: "Crée un nouvel apprenant", icone: "UserPlus", categorie: "Données", supportsConditions: true },
  { type: "CREER_INSCRIPTION", nom: "Créer une inscription", description: "Crée une inscription à une session", icone: "UserCheck", categorie: "Données", supportsConditions: true },

  // Qualité
  { type: "CREER_RECLAMATION", nom: "Créer une réclamation", description: "Crée une réclamation", icone: "AlertCircle", categorie: "Qualité", supportsConditions: true },
  { type: "CREER_AMELIORATION", nom: "Créer une amélioration", description: "Crée une action d'amélioration", icone: "TrendingUp", categorie: "Qualité", supportsConditions: true },
  { type: "CREER_TACHE", nom: "Créer une tâche", description: "Crée une tâche interne", icone: "CheckSquare", categorie: "Qualité", supportsConditions: true },

  // Notifications
  { type: "NOTIFIER_EQUIPE", nom: "Notifier l'équipe", description: "Envoie une notification à l'équipe", icone: "Users", categorie: "Notifications", supportsConditions: true },
  { type: "NOTIFIER_UTILISATEUR", nom: "Notifier utilisateur", description: "Envoie une notification à un utilisateur spécifique", icone: "User", categorie: "Notifications", supportsConditions: true },

  // Intégrations
  { type: "WEBHOOK", nom: "Appeler webhook", description: "Appelle un webhook externe", icone: "Webhook", categorie: "Intégrations", supportsConditions: true },
  { type: "APPEL_API", nom: "Appeler API", description: "Appelle une API externe", icone: "Globe", categorie: "Intégrations", supportsConditions: true },

  // Contrôle de flux
  { type: "DELAI", nom: "Attendre", description: "Attend un délai avant de continuer", icone: "Clock", categorie: "Contrôle", supportsConditions: false },
  { type: "CONDITION", nom: "Condition", description: "Branchement conditionnel", icone: "GitBranch", categorie: "Contrôle", supportsConditions: false },
  { type: "BOUCLE", nom: "Boucle", description: "Répète une action", icone: "Repeat", categorie: "Contrôle", supportsConditions: false },
];
