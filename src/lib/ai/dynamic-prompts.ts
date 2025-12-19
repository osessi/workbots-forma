// ===========================================
// SYSTEME DE PROMPTS DYNAMIQUES AVEC VARIABLES
// ===========================================

import { AIPromptType } from "@prisma/client";
import { TemplateContext } from "@/lib/templates/types";
import { TEMPLATE_VARIABLES } from "@/lib/templates/variables";

// ===========================================
// TYPES
// ===========================================

export interface PromptVariable {
  id: string;
  label: string;
  description: string;
  example: string;
  category: string;
}

export interface DynamicPromptContext {
  formation?: {
    titre?: string;
    description?: string;
    duree?: string;
    dureeHeures?: number;
    objectifs?: string[];
    prerequis?: string[];
    publicCible?: string;
    modalites?: string;
    moyensPedagogiques?: string[];
    modalitesEvaluation?: string[];
  };
  modules?: Array<{
    titre: string;
    description?: string;
    duree?: string;
    objectifs?: string[];
    contenu?: string[];
  }>;
  organisation?: {
    nom: string;
    siret?: string;
    numeroDa?: string;
    adresse?: string;
    telephone?: string;
    email?: string;
  };
  formateur?: {
    nom: string;
    prenom?: string;
    email?: string;
    telephone?: string;
    specialites?: string[];
  };
  participants?: Array<{
    nom: string;
    prenom: string;
    email?: string;
    entreprise?: string;
    fonction?: string;
  }>;
  session?: {
    dateDebut: string;
    dateFin: string;
    lieu?: string;
    isDistanciel?: boolean;
    horaires?: string;
  };
  entreprise?: {
    nom: string;
    siret?: string;
    adresse?: string;
    representant?: string;
  };
  metadata?: {
    typeSession?: string;
    nombreParticipants?: string;
    tarifEntreprise?: string;
    tarifIndependant?: string;
    tarifParticulier?: string;
  };
}

// ===========================================
// VARIABLES DISPONIBLES POUR LES PROMPTS
// ===========================================

export const PROMPT_VARIABLES: Record<string, PromptVariable[]> = {
  formation: [
    { id: "formation.titre", label: "Titre", description: "Titre de la formation", example: "Excel Avancé", category: "formation" },
    { id: "formation.description", label: "Description", description: "Description détaillée", example: "Formation complète...", category: "formation" },
    { id: "formation.duree", label: "Durée", description: "Durée totale", example: "2 jours (14h)", category: "formation" },
    { id: "formation.dureeHeures", label: "Durée en heures", description: "Nombre d'heures", example: "14", category: "formation" },
    { id: "formation.objectifs", label: "Objectifs", description: "Liste des objectifs", example: "- Maîtriser les formules...", category: "formation" },
    { id: "formation.prerequis", label: "Prérequis", description: "Prérequis nécessaires", example: "Connaître les bases...", category: "formation" },
    { id: "formation.publicCible", label: "Public cible", description: "Public visé", example: "Utilisateurs Excel", category: "formation" },
    { id: "formation.modalites", label: "Modalités", description: "Modalités pédagogiques", example: "Présentiel", category: "formation" },
  ],
  modules: [
    { id: "modules", label: "Liste des modules", description: "Tous les modules de la formation", example: "[Module 1, Module 2]", category: "modules" },
    { id: "modules.count", label: "Nombre de modules", description: "Nombre total de modules", example: "5", category: "modules" },
  ],
  organisation: [
    { id: "organisation.nom", label: "Nom organisme", description: "Nom de l'organisme de formation", example: "ACME Formation", category: "organisation" },
    { id: "organisation.siret", label: "SIRET", description: "Numéro SIRET", example: "123 456 789 00012", category: "organisation" },
    { id: "organisation.numeroDa", label: "N° DA", description: "Numéro déclaration d'activité", example: "11 75 12345 67", category: "organisation" },
    { id: "organisation.adresse", label: "Adresse", description: "Adresse complète", example: "123 rue de Paris, 75001 Paris", category: "organisation" },
  ],
  formateur: [
    { id: "formateur.nom", label: "Nom formateur", description: "Nom du formateur", example: "Dupont", category: "formateur" },
    { id: "formateur.prenom", label: "Prénom formateur", description: "Prénom du formateur", example: "Jean", category: "formateur" },
    { id: "formateur.nomComplet", label: "Nom complet", description: "Nom complet du formateur", example: "Jean Dupont", category: "formateur" },
    { id: "formateur.specialites", label: "Spécialités", description: "Domaines d'expertise", example: "Excel, Word, PowerPoint", category: "formateur" },
  ],
  participants: [
    { id: "participants", label: "Liste participants", description: "Tous les participants", example: "[Participant 1, ...]", category: "participants" },
    { id: "participants.count", label: "Nombre participants", description: "Nombre de participants", example: "10", category: "participants" },
  ],
  session: [
    { id: "session.dateDebut", label: "Date début", description: "Date de début", example: "15 janvier 2025", category: "session" },
    { id: "session.dateFin", label: "Date fin", description: "Date de fin", example: "16 janvier 2025", category: "session" },
    { id: "session.lieu", label: "Lieu", description: "Lieu de la formation", example: "Salle A, Paris", category: "session" },
    { id: "session.horaires", label: "Horaires", description: "Horaires de formation", example: "9h-12h30 / 14h-17h30", category: "session" },
  ],
};

// ===========================================
// INJECTION DE VARIABLES DANS UN PROMPT
// ===========================================

/**
 * Remplace les variables {{variable.path}} par leurs valeurs dans le contexte
 */
export function injectVariablesInPrompt(
  promptTemplate: string,
  context: DynamicPromptContext
): string {
  let result = promptTemplate;

  // Fonction helper pour accéder aux propriétés imbriquées
  const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
    const parts = path.split(".");
    let current: unknown = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  };

  // Formatter une valeur pour le prompt
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) {
      if (value.length === 0) return "Aucun";
      // Si c'est un tableau d'objets (modules, participants)
      if (typeof value[0] === "object") {
        return value
          .map((item, index) => {
            if ("titre" in item) {
              // Module
              const mod = item as { titre: string; description?: string; duree?: string; objectifs?: string[] };
              let moduleStr = `\n### Module ${index + 1}: ${mod.titre}`;
              if (mod.description) moduleStr += `\nDescription: ${mod.description}`;
              if (mod.duree) moduleStr += `\nDurée: ${mod.duree}`;
              if (mod.objectifs?.length) {
                moduleStr += `\nObjectifs:\n${mod.objectifs.map((o) => `- ${o}`).join("\n")}`;
              }
              return moduleStr;
            }
            if ("nom" in item && "prenom" in item) {
              // Participant
              const p = item as { nom: string; prenom: string; entreprise?: string; fonction?: string };
              return `- ${p.prenom} ${p.nom}${p.entreprise ? ` (${p.entreprise})` : ""}${p.fonction ? ` - ${p.fonction}` : ""}`;
            }
            return JSON.stringify(item);
          })
          .join("\n");
      }
      // Tableau simple
      return value.map((v) => `- ${v}`).join("\n");
    }
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  // Trouver et remplacer toutes les variables {{...}}
  const variablePattern = /\{\{([^}]+)\}\}/g;
  result = result.replace(variablePattern, (match, variablePath) => {
    const trimmedPath = variablePath.trim();

    // Cas spéciaux
    if (trimmedPath === "modules.count") {
      return String(context.modules?.length || 0);
    }
    if (trimmedPath === "participants.count") {
      return String(context.participants?.length || 0);
    }
    if (trimmedPath === "formateur.nomComplet") {
      const f = context.formateur;
      if (f) return `${f.prenom || ""} ${f.nom}`.trim();
      return "";
    }

    // Accès standard aux propriétés
    const value = getNestedValue(context as unknown as Record<string, unknown>, trimmedPath);
    return formatValue(value);
  });

  return result;
}

// ===========================================
// GENERATION DU CONTEXTE DEPUIS TEMPLATE CONTEXT
// ===========================================

/**
 * Convertit un TemplateContext en DynamicPromptContext
 */
export function templateContextToPromptContext(
  templateContext: TemplateContext
): DynamicPromptContext {
  return {
    formation: templateContext.formation
      ? {
          titre: templateContext.formation.titre,
          description: templateContext.formation.description,
          duree: templateContext.formation.duree,
          dureeHeures: templateContext.formation.duree_heures,
          objectifs: templateContext.formation.objectifs,
          prerequis: templateContext.formation.prerequis,
          publicCible: templateContext.formation.public_cible,
          modalites: templateContext.formation.modalites,
          moyensPedagogiques: templateContext.formation.methodes_pedagogiques
            ? [templateContext.formation.methodes_pedagogiques]
            : undefined,
          modalitesEvaluation: templateContext.formation.modalites_evaluation
            ? [templateContext.formation.modalites_evaluation]
            : undefined,
        }
      : undefined,
    modules: templateContext.modules?.map((m) => ({
      titre: m.titre,
      duree: m.duree,
      objectifs: m.objectifs,
      contenu: m.contenu,
    })),
    organisation: templateContext.organisation
      ? {
          nom: templateContext.organisation.nom,
          siret: templateContext.organisation.siret,
          numeroDa: templateContext.organisation.numero_da,
          adresse: templateContext.organisation.adresse_complete,
          telephone: templateContext.organisation.telephone,
          email: templateContext.organisation.email,
        }
      : undefined,
    formateur: templateContext.formateur
      ? {
          nom: templateContext.formateur.nom,
          prenom: templateContext.formateur.prenom,
          email: templateContext.formateur.email,
          telephone: templateContext.formateur.telephone,
          specialites: templateContext.formateur.specialite
            ? [templateContext.formateur.specialite]
            : undefined,
        }
      : undefined,
    participants: templateContext.participants?.map((p) => ({
      nom: p.nom,
      prenom: p.prenom,
      email: p.email,
      fonction: p.fonction,
    })),
    session: templateContext.dates
      ? {
          dateDebut: templateContext.dates.date_complete,
          dateFin: templateContext.dates.date_complete,
          lieu: templateContext.formation?.lieu,
        }
      : undefined,
    entreprise: templateContext.entreprise
      ? {
          nom: templateContext.entreprise.nom,
          siret: templateContext.entreprise.siret,
          adresse: templateContext.entreprise.adresse_complete,
          representant: templateContext.entreprise.representant,
        }
      : undefined,
  };
}

// ===========================================
// PROMPTS PAR DEFAUT
// ===========================================

export interface DefaultPrompt {
  type: AIPromptType;
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  requiredVariables: string[];
  optionalVariables: string[];
  model: string;
  temperature: number;
  maxTokens: number;
}

export const DEFAULT_PROMPTS: DefaultPrompt[] = [
  {
    type: "FICHE_PEDAGOGIQUE",
    name: "Génération Fiche Pédagogique",
    description: "Génère une fiche pédagogique complète conforme Qualiopi",
    systemPrompt: `Tu es un expert en ingénierie pédagogique spécialisé dans la création de formations professionnelles en France.
Tu dois créer des fiches pédagogiques conformes aux exigences Qualiopi et aux standards de la formation professionnelle continue.

Règles importantes:
- Utilise un langage professionnel et précis
- Les objectifs doivent être SMART (Spécifiques, Mesurables, Atteignables, Réalistes, Temporellement définis)
- Commence chaque objectif par un verbe d'action à l'infinitif
- Les méthodes pédagogiques doivent être variées et adaptées au public
- Inclus des modalités d'évaluation concrètes et mesurables
- Structure le contenu de manière logique et progressive
- Le nombre de modules doit être adapté à la durée et au contenu de la formation (entre 2 et 6 modules généralement)

IMPORTANT - Format de sortie JSON obligatoire:
Tu dois UNIQUEMENT retourner un objet JSON valide avec cette structure exacte:
{
  "titre": "Titre accrocheur de la formation",
  "objectifGeneral": "L'objectif général de la formation en une phrase",
  "objectifsSpecifiques": ["Objectif 1", "Objectif 2", "Objectif 3"],
  "publicCible": "Description du public visé",
  "prerequis": ["Prérequis 1", "Prérequis 2"],
  "dureeTotal": "XX heures (X jours)",
  "modules": [
    {
      "titre": "Titre du module",
      "duree": "Xh",
      "objectifs": ["Objectif module 1"],
      "contenu": ["Point 1", "Point 2", "Point 3"],
      "methodePedagogique": "Méthode utilisée"
    }
  ],
  "moyensPedagogiques": ["Moyen 1", "Moyen 2"],
  "modalitesEvaluation": ["Modalité 1", "Modalité 2"],
  "accessibilite": "Information sur l'accessibilité"
}

Ne retourne RIEN d'autre que le JSON. Pas de texte avant ou après.`,
    userPromptTemplate: `A partir de la description suivante, génère une fiche pédagogique complète au format JSON.

# DESCRIPTION DE LA FORMATION SOUHAITÉE
{{formation.description}}

# INFORMATIONS COMPLÉMENTAIRES
- Durée prévue: {{formation.duree}}
- Modalité: {{formation.modalites}}

Génère une fiche pédagogique professionnelle et complète en JSON avec un titre pertinent, des objectifs SMART, des modules adaptés à la durée, et tous les éléments requis.
Le nombre de modules doit être logique par rapport à la durée (environ 1 module par demi-journée).`,
    requiredVariables: ["formation.description"],
    optionalVariables: ["formation.duree", "formation.modalites", "formation.titre"],
    model: "claude-sonnet-4-20250514",
    temperature: 0.7,
    maxTokens: 8192,
  },
  {
    type: "QCM",
    name: "Génération QCM",
    description: "Génère un QCM de 5-10 questions pour évaluer les acquis",
    systemPrompt: `Tu es un expert en évaluation pédagogique.
Tu dois créer des questions QCM de qualité pour évaluer les compétences acquises lors d'une formation.

Règles pour les QCM:
- Les questions doivent être claires et sans ambiguïté
- Chaque question a exactement 4 options de réponse
- Une seule réponse est correcte
- Les distracteurs (mauvaises réponses) doivent être plausibles
- Varie les niveaux de difficulté
- Évite les formulations négatives
- Évite "toujours" et "jamais" dans les options

Format de sortie JSON:
{
  "titre": "QCM - [Titre du module]",
  "questions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "reponseCorrecte": 0,
      "explication": "..."
    }
  ]
}`,
    userPromptTemplate: `Génère un QCM de 5 questions pour évaluer ce module:

# MODULE
**Titre:** {{modules}}

# OBJECTIFS À ÉVALUER
{{formation.objectifs}}

Génère des questions qui testent la compréhension et l'application des concepts.`,
    requiredVariables: ["modules"],
    optionalVariables: ["formation.objectifs", "formation.titre"],
    model: "claude-sonnet-4-20250514",
    temperature: 0.5,
    maxTokens: 4096,
  },
  {
    type: "CONVENTION",
    name: "Génération Convention de Formation",
    description: "Génère une convention de formation conforme aux articles L.6353-1 et suivants",
    systemPrompt: `Tu es un expert juridique spécialisé dans le droit de la formation professionnelle en France.
Tu dois générer des conventions de formation conformes au Code du travail (articles L.6353-1 et suivants).

Éléments obligatoires d'une convention:
- Intitulé de la formation
- Objectifs et contenu
- Moyens pédagogiques et techniques
- Dispositif de suivi et d'évaluation
- Durée et dates
- Modalités de déroulement
- Prix et conditions de règlement
- Conditions d'annulation

Format: HTML structuré avec articles numérotés.`,
    userPromptTemplate: `Génère une convention de formation professionnelle:

# PARTIES
**Organisme de formation:** {{organisation.nom}}
SIRET: {{organisation.siret}} | N° DA: {{organisation.numeroDa}}
Adresse: {{organisation.adresse}}

**Entreprise cliente:** {{entreprise.nom}}
SIRET: {{entreprise.siret}}
Représentée par: {{entreprise.representant}}

# FORMATION
**Intitulé:** {{formation.titre}}
**Durée:** {{formation.duree}}
**Dates:** Du {{session.dateDebut}} au {{session.dateFin}}
**Lieu:** {{session.lieu}}

# PROGRAMME
{{modules}}

# PARTICIPANTS
{{participants}}

Génère une convention complète avec tous les articles requis légalement.
Utilise les variables {{variable}} pour les éléments personnalisables.`,
    requiredVariables: ["organisation.nom", "formation.titre", "formation.duree"],
    optionalVariables: ["entreprise.nom", "session.dateDebut", "session.dateFin", "modules", "participants"],
    model: "claude-sonnet-4-20250514",
    temperature: 0.4,
    maxTokens: 8192,
  },
  {
    type: "ATTESTATION_FIN",
    name: "Génération Attestation de Fin de Formation",
    description: "Génère une attestation de fin de formation nominative",
    systemPrompt: `Tu es un assistant spécialisé dans la génération de documents administratifs de formation.
Tu dois créer des attestations de fin de formation conformes et professionnelles.

L'attestation doit inclure:
- Identification de l'organisme
- Identification du stagiaire
- Intitulé et dates de la formation
- Durée effectuée
- Objectifs atteints
- Résultats de l'évaluation (si applicable)
- Signature

Format: HTML structuré avec mise en page professionnelle.`,
    userPromptTemplate: `Génère une attestation de fin de formation:

# ORGANISME
{{organisation.nom}}
N° DA: {{organisation.numeroDa}}
{{organisation.adresse}}

# STAGIAIRE
{{participants}}

# FORMATION
**Intitulé:** {{formation.titre}}
**Durée:** {{formation.duree}}
**Dates:** Du {{session.dateDebut}} au {{session.dateFin}}
**Lieu:** {{session.lieu}}

# OBJECTIFS
{{formation.objectifs}}

Génère une attestation professionnelle certifiant le suivi de la formation.`,
    requiredVariables: ["organisation.nom", "formation.titre", "formation.duree"],
    optionalVariables: ["participants", "session.dateDebut", "session.dateFin", "formation.objectifs"],
    model: "claude-sonnet-4-20250514",
    temperature: 0.3,
    maxTokens: 2048,
  },
  {
    type: "REFORMULATION",
    name: "Reformulation de Texte",
    description: "Améliore et reformule un texte pour le rendre plus professionnel",
    systemPrompt: `Tu es un expert en rédaction professionnelle spécialisé dans le domaine de la formation.
Tu dois améliorer et reformuler des textes pour les rendre:
- Plus clairs et lisibles
- Plus professionnels
- Grammaticalement corrects
- Adaptés au contexte de la formation professionnelle

Garde le sens original tout en améliorant la qualité rédactionnelle.`,
    userPromptTemplate: `Reformule et améliore ce texte:

"""
{{texte}}
"""

Contexte: {{contexte}}

Améliore la clarté, la structure et le professionnalisme du texte.
Retourne uniquement le texte amélioré au format HTML.`,
    requiredVariables: ["texte"],
    optionalVariables: ["contexte"],
    model: "claude-sonnet-4-20250514",
    temperature: 0.6,
    maxTokens: 4096,
  },
];

// ===========================================
// FONCTIONS UTILITAIRES
// ===========================================

/**
 * Obtient le prompt par défaut pour un type donné
 */
export function getDefaultPrompt(type: AIPromptType): DefaultPrompt | undefined {
  return DEFAULT_PROMPTS.find((p) => p.type === type);
}

/**
 * Liste toutes les variables disponibles pour les prompts
 */
export function getAllPromptVariables(): PromptVariable[] {
  return Object.values(PROMPT_VARIABLES).flat();
}

/**
 * Valide qu'un contexte contient les variables requises
 */
export function validateRequiredVariables(
  context: DynamicPromptContext,
  requiredVariables: string[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const varPath of requiredVariables) {
    const parts = varPath.split(".");
    let current: unknown = context;

    for (const part of parts) {
      if (current === null || current === undefined) {
        missing.push(varPath);
        break;
      }
      current = (current as Record<string, unknown>)[part];
    }

    if (current === null || current === undefined || current === "") {
      if (!missing.includes(varPath)) {
        missing.push(varPath);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
