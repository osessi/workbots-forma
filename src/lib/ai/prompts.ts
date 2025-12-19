// ===========================================
// PROMPTS STRUCTURES POUR LA GENERATION IA
// ===========================================

import { z } from "zod";

// ===========================================
// SCHEMAS ZOD POUR VALIDATION DES REPONSES
// ===========================================

// Schema pour un module de formation
export const ModuleSchema = z.object({
  titre: z.string().min(1),
  duree: z.string().describe("Duree du module (ex: '2h', '1 jour')"),
  objectifs: z.array(z.string()).min(1),
  contenu: z.array(z.string()).min(1),
  methodePedagogique: z.string(),
  evaluation: z.string().optional(),
});

// Schema pour une fiche pedagogique complete
export const FichePedagogiqueSchema = z.object({
  titre: z.string().min(1),
  objectifGeneral: z.string().min(1),
  objectifsSpecifiques: z.array(z.string()).min(1),
  publicCible: z.string().min(1),
  prerequis: z.array(z.string()),
  dureeTotal: z.string(),
  modules: z.array(ModuleSchema).min(1),
  moyensPedagogiques: z.array(z.string()).min(1),
  modalitesEvaluation: z.array(z.string()).min(1),
  sanctionFormation: z.string(),
  accessibilite: z.string().optional(),
});

// Schema pour une question QCM
export const QuestionQCMSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).length(4),
  reponseCorrecte: z.number().min(0).max(3),
  explication: z.string().optional(),
  difficulte: z.enum(["facile", "moyen", "difficile"]),
});

// Schema pour un QCM complet
export const QCMSchema = z.object({
  titre: z.string(),
  moduleReference: z.string().optional(),
  questions: z.array(QuestionQCMSchema).min(5).max(10),
  tempsEstime: z.string(),
  seuilReussite: z.number().min(50).max(100),
});

// Schema pour test de positionnement
export const TestPositionnementSchema = z.object({
  titre: z.string(),
  introduction: z.string(),
  questions: z.array(
    z.object({
      question: z.string(),
      type: z.enum(["qcm", "echelle", "ouvert"]),
      options: z.array(z.string()).optional(),
      objectifEvalue: z.string(),
    })
  ).min(5),
  grilleLecture: z.object({
    niveauDebutant: z.string(),
    niveauIntermediaire: z.string(),
    niveauAvance: z.string(),
  }),
});

// Schema pour evaluation finale
export const EvaluationFinaleSchema = z.object({
  titre: z.string(),
  objectifsEvalues: z.array(z.string()),
  sections: z.array(
    z.object({
      titre: z.string(),
      questions: z.array(QuestionQCMSchema),
      pointsTotal: z.number(),
    })
  ),
  bareme: z.object({
    noteMinimum: z.number(),
    noteMaximum: z.number(),
    seuilReussite: z.number(),
  }),
  consignes: z.string(),
});

// Schema pour reformulation
export const ReformulationSchema = z.object({
  texteOriginal: z.string(),
  texteAmeliore: z.string(),
  modifications: z.array(z.string()),
  suggestions: z.array(z.string()).optional(),
});

// ===========================================
// PROMPTS SYSTEM
// ===========================================

export const SYSTEM_PROMPTS = {
  fichePedagogique: `Tu es un expert en ingenierie pedagogique specialise dans la creation de formations professionnelles en France.
Tu dois creer des fiches pedagogiques conformes aux exigences Qualiopi et aux standards de la formation professionnelle continue.

Regles importantes:
- Utilise un langage professionnel et precis
- Les objectifs doivent etre SMART (Specifiques, Mesurables, Atteignables, Realistes, Temporellement definis)
- Chaque module doit avoir des objectifs operationnels clairs
- Les methodes pedagogiques doivent etre variees et adaptees au public
- Les modalites d'evaluation doivent permettre de mesurer l'atteinte des objectifs

Reponds UNIQUEMENT en JSON valide selon le schema fourni.`,

  qcm: `Tu es un expert en evaluation pedagogique.
Tu dois creer des questions QCM de qualite pour evaluer les competences acquises lors d'une formation.

Regles pour les QCM:
- Les questions doivent etre claires et sans ambiguite
- Les 4 options doivent etre plausibles (pas de reponses evidemment fausses)
- Les distracteurs doivent tester des erreurs courantes
- Varie les niveaux de difficulte (facile, moyen, difficile)
- Chaque question doit tester une competence specifique
- Evite les formulations negatives ("lequel n'est PAS...")
- Evite les "toujours" et "jamais" dans les options

Reponds UNIQUEMENT en JSON valide selon le schema fourni.`,

  positionnement: `Tu es un expert en evaluation des competences professionnelles.
Tu dois creer un test de positionnement pour evaluer le niveau initial des apprenants avant une formation.

Regles pour le test de positionnement:
- Les questions doivent couvrir tous les objectifs de la formation
- Inclure des questions de differents niveaux
- Permettre d'identifier les forces et lacunes
- Les questions ouvertes permettent d'evaluer la reflexion
- La grille de lecture doit etre claire pour l'interpretation

Reponds UNIQUEMENT en JSON valide selon le schema fourni.`,

  evaluation: `Tu es un expert en evaluation sommative des formations professionnelles.
Tu dois creer une evaluation finale complete pour certifier les competences acquises.

Regles pour l'evaluation finale:
- Couvrir tous les objectifs pedagogiques de la formation
- Le bareme doit etre clair et juste
- Les questions doivent permettre de verifier les competences operationnelles
- Inclure des mises en situation quand c'est pertinent
- Le seuil de reussite doit etre raisonnable (generalement 70-80%)

Reponds UNIQUEMENT en JSON valide selon le schema fourni.`,

  reformulation: `Tu es un expert en redaction de contenus pedagogiques professionnels.
Tu dois ameliorer et reformuler des textes pour les rendre plus clairs, professionnels et adaptes au contexte de la formation.

Regles pour la reformulation:
- Garde le sens original
- Ameliore la clarte et la lisibilite
- Utilise un vocabulaire professionnel adapte
- Corrige les erreurs grammaticales et orthographiques
- Rends le texte plus engageant pour les apprenants

Reponds UNIQUEMENT en JSON valide selon le schema fourni.`,
};

// ===========================================
// FONCTIONS DE GENERATION DE PROMPTS
// ===========================================

export interface FichePedagogiqueInput {
  titre: string;
  thematique: string;
  duree: string;
  publicCible: string;
  objectifPrincipal: string;
  contexte?: string;
}

export function generateFichePedagogiquePrompt(input: FichePedagogiqueInput): string {
  return `Cree une fiche pedagogique complete pour la formation suivante:

TITRE: ${input.titre}
THEMATIQUE: ${input.thematique}
DUREE: ${input.duree}
PUBLIC CIBLE: ${input.publicCible}
OBJECTIF PRINCIPAL: ${input.objectifPrincipal}
${input.contexte ? `CONTEXTE ADDITIONNEL: ${input.contexte}` : ""}

Genere une fiche pedagogique complete avec:
- 3 a 5 objectifs specifiques
- Des modules structures (entre 3 et 6 modules)
- Des methodes pedagogiques variees
- Des modalites d'evaluation adaptees

Schema JSON attendu:
${JSON.stringify(FichePedagogiqueSchema.shape, null, 2)}`;
}

export interface QCMInput {
  moduleTitre: string;
  moduleContenu: string[];
  objectifs: string[];
  nombreQuestions?: number;
}

export function generateQCMPrompt(input: QCMInput): string {
  const nbQuestions = input.nombreQuestions || 5;
  return `Cree un QCM de ${nbQuestions} questions pour evaluer ce module:

MODULE: ${input.moduleTitre}

CONTENU DU MODULE:
${input.moduleContenu.map((c, i) => `${i + 1}. ${c}`).join("\n")}

OBJECTIFS A EVALUER:
${input.objectifs.map((o, i) => `${i + 1}. ${o}`).join("\n")}

Genere exactement ${nbQuestions} questions avec 4 options chacune.
Varie les niveaux de difficulte.

Schema JSON attendu:
${JSON.stringify(QCMSchema.shape, null, 2)}`;
}

export interface PositionnementInput {
  formationTitre: string;
  objectifs: string[];
  prerequis: string[];
  publicCible: string;
}

export function generatePositionnementPrompt(input: PositionnementInput): string {
  return `Cree un test de positionnement pour cette formation:

FORMATION: ${input.formationTitre}
PUBLIC CIBLE: ${input.publicCible}

OBJECTIFS DE LA FORMATION:
${input.objectifs.map((o, i) => `${i + 1}. ${o}`).join("\n")}

PREREQUIS ATTENDUS:
${input.prerequis.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Le test doit permettre d'evaluer le niveau initial de chaque apprenant
et d'identifier leurs besoins specifiques.

Schema JSON attendu:
${JSON.stringify(TestPositionnementSchema.shape, null, 2)}`;
}

export interface EvaluationInput {
  formationTitre: string;
  modules: Array<{ titre: string; objectifs: string[] }>;
  dureeEvaluation?: string;
}

export function generateEvaluationPrompt(input: EvaluationInput): string {
  return `Cree une evaluation finale pour cette formation:

FORMATION: ${input.formationTitre}
DUREE EVALUATION: ${input.dureeEvaluation || "30 minutes"}

MODULES ET OBJECTIFS:
${input.modules
  .map(
    (m, i) => `
Module ${i + 1}: ${m.titre}
Objectifs: ${m.objectifs.join(", ")}`
  )
  .join("\n")}

L'evaluation doit couvrir tous les modules et permettre de certifier
l'acquisition des competences.

Schema JSON attendu:
${JSON.stringify(EvaluationFinaleSchema.shape, null, 2)}`;
}

export interface ReformulationInput {
  texte: string;
  contexte: string;
  style?: "formel" | "accessible" | "technique";
}

export function generateReformulationPrompt(input: ReformulationInput): string {
  const styleInstructions = {
    formel: "un style professionnel et formel",
    accessible: "un style accessible et pedagogique",
    technique: "un style technique et precis",
  };

  return `Ameliore et reformule ce texte:

TEXTE ORIGINAL:
${input.texte}

CONTEXTE: ${input.contexte}
STYLE SOUHAITE: ${styleInstructions[input.style || "formel"]}

Reformule le texte en:
- Ameliorant la clarte
- Corrigeant les erreurs
- Adaptant le ton au contexte

Schema JSON attendu:
${JSON.stringify(ReformulationSchema.shape, null, 2)}`;
}

// ===========================================
// TYPES EXPORTES
// ===========================================

export type FichePedagogique = z.infer<typeof FichePedagogiqueSchema>;
export type QCM = z.infer<typeof QCMSchema>;
export type QuestionQCM = z.infer<typeof QuestionQCMSchema>;
export type TestPositionnement = z.infer<typeof TestPositionnementSchema>;
export type EvaluationFinale = z.infer<typeof EvaluationFinaleSchema>;
export type Reformulation = z.infer<typeof ReformulationSchema>;
export type Module = z.infer<typeof ModuleSchema>;
