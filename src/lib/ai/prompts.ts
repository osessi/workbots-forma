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
  duree: z.string().describe("Duree du module (ex: '3h30')"),
  objectifs: z.array(z.string()).min(1).max(4),
  contenu: z.array(z.string()).min(3).max(8),
  methodePedagogique: z.string(),
  evaluation: z.string().describe("TOUJOURS utiliser EXACTEMENT: 'QCM ou atelier pour valider les acquis du module.'"),
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

// Schema pour un QCM complet (par module - environ 8 questions)
export const QCMSchema = z.object({
  titre: z.string(),
  moduleReference: z.string().optional(),
  questions: z.array(QuestionQCMSchema).min(6).max(12),
  tempsEstime: z.string(),
  seuilReussite: z.number().min(50).max(100),
});

// Schema pour une question QCM de test (avec 4 options et 1 seule bonne réponse)
export const QuestionTestSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).length(4),
  reponseCorrecte: z.number().min(0).max(3),
  explication: z.string().optional(),
  difficulte: z.enum(["facile", "moyen", "difficile"]),
  competenceEvaluee: z.string(),
});

// Schema pour test de positionnement (QCM uniquement - 20 questions, niveau plus difficile)
export const TestPositionnementSchema = z.object({
  titre: z.string(),
  introduction: z.string(),
  questions: z.array(QuestionTestSchema).min(18).max(22),
  tempsEstime: z.string(),
  seuilReussite: z.number().min(50).max(100),
  grilleLecture: z.object({
    niveauDebutant: z.string(),
    niveauIntermediaire: z.string(),
    niveauAvance: z.string(),
  }),
});

// Schema pour evaluation finale (QCM uniquement - 20 questions, niveau plus facile que positionnement)
export const EvaluationFinaleSchema = z.object({
  titre: z.string(),
  introduction: z.string(),
  objectifsEvalues: z.array(z.string()),
  questions: z.array(QuestionTestSchema).min(18).max(22),
  tempsEstime: z.string(),
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

// Schema pour un atelier pratique de module
export const AtelierSchema = z.object({
  titre: z.string().min(1),
  description: z.string().min(1),
  objectifs: z.array(z.string()).min(2).max(8),
  instructions: z.array(z.string()).min(3).max(15),
  exemplesRendu: z.array(z.string()).min(3).max(15).describe("Exemples concrets de rendu attendu pour chaque instruction - même nombre d'éléments que instructions"),
  dureeEstimee: z.string(),
  critereEvaluation: z.array(z.string()).min(2).max(8),
  materielNecessaire: z.array(z.string()).optional(),
  conseilsAnimateur: z.string().optional(),
});

// ===========================================
// PROMPTS SYSTEM
// ===========================================

export const SYSTEM_PROMPTS = {
  fichePedagogique: `Tu es un expert en ingenierie pedagogique specialise dans la creation de formations professionnelles en France.
Tu dois creer des fiches pedagogiques conformes aux exigences Qualiopi et aux standards de la formation professionnelle continue.

STRUCTURE OBLIGATOIRE DES MODULES:
- Une journee de formation = 7 heures
- Chaque journee DOIT contenir exactement 2 modules (matin et apres-midi)
- Module du matin: environ 3h30 (de 9h a 12h30 avec pause)
- Module de l'apres-midi: environ 3h30 (de 14h a 17h30 avec pause)
- Chaque module se termine OBLIGATOIREMENT par cette PHRASE EXACTE dans le contenu: "QCM ou atelier pour valider les acquis du module."

EXEMPLE pour une formation de 2 jours (14h):
- Jour 1 Matin: Module 1 (3h30) - le dernier point du contenu DOIT etre: "QCM ou atelier pour valider les acquis du module."
- Jour 1 Apres-midi: Module 2 (3h30) - le dernier point du contenu DOIT etre: "QCM ou atelier pour valider les acquis du module."
- Jour 2 Matin: Module 3 (3h30) - le dernier point du contenu DOIT etre: "QCM ou atelier pour valider les acquis du module."
- Jour 2 Apres-midi: Module 4 (3h30) - le dernier point du contenu DOIT etre: "QCM ou atelier pour valider les acquis du module."

Regles importantes:
- Utilise un langage professionnel et precis
- Les objectifs doivent etre SMART (Specifiques, Mesurables, Atteignables, Realistes, Temporellement definis)
- Chaque module doit avoir des objectifs operationnels clairs (2-4 objectifs par module)
- Les methodes pedagogiques doivent etre variees: apports theoriques, exercices pratiques, mises en situation, etudes de cas
- Le DERNIER element du tableau "contenu" de chaque module DOIT etre EXACTEMENT: "QCM ou atelier pour valider les acquis du module."
- Le contenu de chaque module doit etre detaille (4-6 points de contenu)

⚠️ INTERDICTION ABSOLUE - SECTIONS FIXES (NE JAMAIS GENERER NI MODIFIER) ⚠️
Les deux sections suivantes sont INTOUCHABLES et gerees par le systeme:

1. "Suivi de l'execution et evaluation des resultats" - CONTENU FIXE:
   • Feuilles de presence
   • Formulaires d'evaluation de la formation
   • QCM ou atelier pour valider les acquis du module.
   • Attestation de fin de formation

2. "Ressources pedagogiques" - CONTENU FIXE:
   • Support de formation projete
   • Mise a disposition en ligne des supports
   • Exercices pratiques et mises en situation
   • Etudes de cas

⛔ TU NE DOIS JAMAIS:
- Generer du contenu pour ces deux sections
- Proposer des alternatives a ces sections
- Modifier ou reformuler ces sections
- Les inclure dans ta reponse JSON

Ces sections sont standardisees Qualiopi et l'utilisateur peut les modifier manuellement s'il le souhaite.

Reponds UNIQUEMENT en JSON valide selon le schema fourni.`,

  qcm: `Tu es un expert en evaluation pedagogique specialise dans la creation de QCM de haute qualite.
Tu dois creer des questions QCM professionnelles pour evaluer les competences acquises lors d'une formation.

REGLES STRICTES POUR LES QCM:

1. QUALITE DES QUESTIONS:
   - Questions claires, precises et sans ambiguite
   - Eviter les formulations negatives ("lequel n'est PAS...", "que ne faut-il PAS faire...")
   - Eviter "toujours", "jamais", "tous", "aucun" dans les options
   - Chaque question doit tester une competence specifique

2. LONGUEUR DES REPONSES:
   ⚠️ TRES IMPORTANT: Toutes les 4 options de chaque question DOIVENT avoir une longueur SIMILAIRE
   - Si la bonne reponse fait 10-15 mots, les mauvaises reponses doivent aussi faire 10-15 mots
   - NE JAMAIS avoir une reponse beaucoup plus longue ou detaillee que les autres
   - Les reponses courtes (1-3 mots) sont a eviter car trop faciles a deviner
   - Viser 8-20 mots par option pour des reponses equilibrees

3. VARIATION DES POSITIONS:
   ⚠️ OBLIGATOIRE: La bonne reponse (reponseCorrecte) doit VARIER entre 0, 1, 2 et 3
   - Pour 8 questions: environ 2 fois en position 0, 2 fois en 1, 2 fois en 2, 2 fois en 3
   - NE JAMAIS mettre toutes les bonnes reponses en position 0 ou 1
   - Distribuer aleatoirement les bonnes reponses sur les 4 positions

4. QUALITE DES DISTRACTEURS (mauvaises reponses):
   - Les distracteurs doivent etre PLAUSIBLES et credibles
   - Ils doivent tester des erreurs courantes ou des confusions frequentes
   - INTERDIRE les reponses absurdes ou evidemment fausses
   - INTERDIRE les negations dans les distracteurs ("Il ne faut pas...", "Ce n'est pas...")
   - Les distracteurs doivent faire reflechir l'apprenant

5. NIVEAU DE DIFFICULTE:
   - Facile: questions directes sur les concepts de base
   - Moyen: questions appliquant les connaissances a des situations
   - Difficile: questions synthetisant plusieurs concepts ou analysant des cas complexes

Reponds UNIQUEMENT en JSON valide selon le schema fourni.`,

  positionnement: `Tu es un expert en evaluation des competences professionnelles.
Tu dois creer un test de positionnement de 20 questions QCM pour evaluer le niveau initial des apprenants AVANT une formation.

⚠️ IMPORTANT - VARIATION OBLIGATOIRE:
A chaque generation, tu DOIS creer des questions ENTIEREMENT NOUVELLES et DIFFERENTES.
- Utilise des formulations variees et originales
- Explore differents angles et aspects du sujet
- Ne reutilise JAMAIS les memes questions ou options de reponse
- Varie les scenarios, contextes et exemples utilises
- Chaque generation doit etre unique et creative

REGLES STRICTES POUR LE TEST DE POSITIONNEMENT:

1. FORMAT ET STRUCTURE:
   - Exactement 20 questions QCM (pas de questions ouvertes, pas d'echelles)
   - Chaque question a 4 options avec UNE SEULE bonne reponse (reponseCorrecte: 0, 1, 2 ou 3)
   - Le test doit etre PLUS DIFFICILE que l'evaluation finale
   - Varie les niveaux: 30% facile, 40% moyen, 30% difficile

2. LONGUEUR DES REPONSES:
   ⚠️ TRES IMPORTANT: Toutes les 4 options de chaque question DOIVENT avoir une longueur SIMILAIRE
   - Si la bonne reponse fait 10-15 mots, les mauvaises reponses doivent aussi faire 10-15 mots
   - NE JAMAIS avoir une reponse beaucoup plus longue ou detaillee que les autres
   - Viser 8-20 mots par option pour des reponses equilibrees

3. VARIATION DES POSITIONS:
   ⚠️ OBLIGATOIRE: La bonne reponse (reponseCorrecte) doit VARIER entre 0, 1, 2 et 3
   - Pour 20 questions: environ 5 fois en position 0, 5 fois en 1, 5 fois en 2, 5 fois en 3
   - NE JAMAIS concentrer les bonnes reponses sur une seule position
   - Distribuer aleatoirement les bonnes reponses

4. QUALITE DES DISTRACTEURS:
   - Les distracteurs doivent etre PLAUSIBLES et tester des erreurs courantes
   - INTERDIRE les negations dans les reponses ("Il ne faut pas...", "Ce n'est pas...")
   - INTERDIRE les reponses absurdes ou evidemment fausses
   - Les distracteurs doivent faire reflechir l'apprenant

5. OBJECTIF DU TEST:
   - Couvrir tous les objectifs et prerequis de la formation
   - Permettre d'identifier clairement les forces et lacunes
   - La grille de lecture definit les seuils (debutant < 40%, intermediaire 40-70%, avance > 70%)
   - Temps estime: environ 30-40 minutes

Reponds UNIQUEMENT en JSON valide selon le schema fourni.`,

  evaluation: `Tu es un expert en evaluation sommative des formations professionnelles.
Tu dois creer une evaluation finale de 20 questions QCM pour certifier les competences acquises APRES une formation.

⚠️ IMPORTANT - VARIATION OBLIGATOIRE:
A chaque generation, tu DOIS creer des questions ENTIEREMENT NOUVELLES et DIFFERENTES.
- Utilise des formulations variees et originales
- Explore differents angles et aspects du sujet
- Ne reutilise JAMAIS les memes questions ou options de reponse
- Varie les scenarios, contextes et exemples utilises
- Chaque generation doit etre unique et creative

REGLES STRICTES POUR L'EVALUATION FINALE:

1. FORMAT ET STRUCTURE:
   - Exactement 20 questions QCM (pas de questions ouvertes)
   - Chaque question a 4 options avec UNE SEULE bonne reponse (reponseCorrecte: 0, 1, 2 ou 3)
   - L'evaluation doit etre PLUS FACILE que le test de positionnement
   - Questions claires et directes (pas de pieges)
   - Varie les niveaux: 40% facile, 45% moyen, 15% difficile

2. LONGUEUR DES REPONSES:
   ⚠️ TRES IMPORTANT: Toutes les 4 options de chaque question DOIVENT avoir une longueur SIMILAIRE
   - Si la bonne reponse fait 10-15 mots, les mauvaises reponses doivent aussi faire 10-15 mots
   - NE JAMAIS avoir une reponse beaucoup plus longue ou detaillee que les autres
   - Viser 8-20 mots par option pour des reponses equilibrees

3. VARIATION DES POSITIONS:
   ⚠️ OBLIGATOIRE: La bonne reponse (reponseCorrecte) doit VARIER entre 0, 1, 2 et 3
   - Pour 20 questions: environ 5 fois en position 0, 5 fois en 1, 5 fois en 2, 5 fois en 3
   - NE JAMAIS concentrer les bonnes reponses sur une seule position
   - Distribuer aleatoirement les bonnes reponses

4. QUALITE DES DISTRACTEURS:
   - Les distracteurs doivent etre PLAUSIBLES mais moins pertinents que la bonne reponse
   - INTERDIRE les negations dans les reponses ("Il ne faut pas...", "Ce n'est pas...")
   - INTERDIRE les reponses absurdes ou evidemment fausses
   - Un apprenant qui a suivi la formation doit pouvoir identifier la bonne reponse

5. OBJECTIF DE L'EVALUATION:
   - Couvrir tous les objectifs pedagogiques de la formation
   - Verifier l'acquisition des competences enseignees
   - Seuil de reussite: 70% (14/20 bonnes reponses)
   - Temps estime: environ 20-30 minutes

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

  atelier: `Tu es un expert en ingenierie pedagogique specialise dans la creation d'ateliers pratiques pour la formation professionnelle.
Tu dois creer des ateliers pratiques engageants qui permettent aux apprenants de mettre en application les concepts appris.

STRUCTURE D'UN ATELIER:
1. Un titre clair et descriptif
2. Une description concise expliquant le but de l'atelier
3. Des objectifs pedagogiques precis (ce que l'apprenant saura faire apres l'atelier)
4. Des instructions etape par etape claires et detaillees
5. Des EXEMPLES DE RENDU CONCRETS pour chaque instruction (destines au formateur)
6. Une duree estimee realiste
7. Des criteres d'evaluation objectifs et mesurables

REGLES IMPORTANTES:
- L'atelier doit etre directement lie au contenu du module
- Les instructions doivent etre progressives et detaillees
- L'atelier doit favoriser la mise en pratique concrete
- Les criteres d'evaluation doivent etre clairs et verifiables
- La duree doit etre realiste (entre 15 et 45 minutes)

EXEMPLES DE RENDU (OBLIGATOIRE):
- Tu dois fournir un exemple de rendu CONCRET et DETAILLE pour CHAQUE instruction
- Ces exemples sont destines au formateur pour qu'il puisse evaluer les travaux
- Utilise un cas fictif realiste avec des exemples precis
- Le nombre d'exemples de rendu DOIT etre egal au nombre d'instructions
- Ne donne PAS de phrases generiques, mais des exemples concrets de ce qu'un apprenant devrait produire

TYPES D'ATELIERS POSSIBLES:
- Etude de cas pratique
- Mise en situation professionnelle
- Exercice pratique guide
- Travail collaboratif en groupe
- Simulation de scenario reel
- Creation ou production d'un livrable

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
  // Calculer le nombre de jours et modules en fonction de la duree
  const dureeMatch = input.duree.match(/(\d+)/);
  const heures = dureeMatch ? parseInt(dureeMatch[1]) : 7;
  const nbJours = Math.ceil(heures / 7);
  const nbModules = nbJours * 2; // 2 modules par jour

  return `Cree une fiche pedagogique complete pour la formation suivante:

TITRE: ${input.titre}
THEMATIQUE: ${input.thematique}
DUREE: ${input.duree} (soit ${nbJours} jour${nbJours > 1 ? "s" : ""} de formation)
PUBLIC CIBLE: ${input.publicCible}
OBJECTIF PRINCIPAL: ${input.objectifPrincipal}
${input.contexte ? `CONTEXTE ADDITIONNEL: ${input.contexte}` : ""}

STRUCTURE A RESPECTER IMPERATIVEMENT:
- Nombre de jours: ${nbJours}
- Nombre de modules: ${nbModules} (exactement 2 modules par jour)
- Duree par module: 3h30 environ
- Le DERNIER point du contenu de chaque module DOIT etre EXACTEMENT: "QCM ou atelier pour valider les acquis du module."

ORGANISATION PAR JOURNEE:
${Array.from({ length: nbJours }, (_, i) => `Jour ${i + 1}:
  - Module ${i * 2 + 1} (matin 9h-12h30): [Theme] - dernier point contenu = "QCM ou atelier pour valider les acquis du module."
  - Module ${i * 2 + 2} (apres-midi 14h-17h30): [Theme] - dernier point contenu = "QCM ou atelier pour valider les acquis du module."`).join("\n")}

Genere une fiche pedagogique complete avec:
- 3 a 5 objectifs specifiques SMART
- Exactement ${nbModules} modules structures (2 par journee)
- Pour chaque module: titre clair, duree "3h30", 2-4 objectifs operationnels, 4-6 points de contenu detailles
- Methode pedagogique: combinaison d'apports theoriques et exercices pratiques
- IMPORTANT: Le DERNIER element du tableau "contenu" de CHAQUE module doit etre EXACTEMENT la phrase: "QCM ou atelier pour valider les acquis du module."

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
  const nbQuestions = input.nombreQuestions || 8;
  // Calculer la distribution des bonnes réponses
  const distributionParPosition = Math.floor(nbQuestions / 4);

  return `Cree un QCM de ${nbQuestions} questions pour evaluer ce module:

MODULE: ${input.moduleTitre}

CONTENU DU MODULE:
${input.moduleContenu.map((c, i) => `${i + 1}. ${c}`).join("\n")}

OBJECTIFS A EVALUER:
${input.objectifs.map((o, i) => `${i + 1}. ${o}`).join("\n")}

REGLES OBLIGATOIRES:

1. NOMBRE ET FORMAT:
   - Genere exactement ${nbQuestions} questions QCM
   - Chaque question a 4 options avec UNE SEULE bonne reponse (index 0 a 3)
   - Varie les niveaux: 30% facile, 50% moyen, 20% difficile

2. LONGUEUR DES REPONSES:
   ⚠️ CRITIQUE: Toutes les 4 options DOIVENT avoir une longueur SIMILAIRE (8-20 mots chacune)
   - NE JAMAIS avoir une reponse plus longue ou detaillee que les autres
   - Si la bonne reponse fait 12 mots, les mauvaises aussi

3. DISTRIBUTION DES BONNES REPONSES:
   ⚠️ OBLIGATOIRE: Repartir les bonnes reponses sur les 4 positions
   - Environ ${distributionParPosition} questions avec reponseCorrecte = 0
   - Environ ${distributionParPosition} questions avec reponseCorrecte = 1
   - Environ ${distributionParPosition} questions avec reponseCorrecte = 2
   - Environ ${distributionParPosition} questions avec reponseCorrecte = 3

4. QUALITE:
   - INTERDIRE les negations ("ne pas", "jamais", "aucun") dans les options
   - Distracteurs plausibles qui testent des confusions courantes
   - Questions qui font reflechir l'apprenant

Schema JSON attendu:
{
  "titre": "string",
  "moduleReference": "string",
  "questions": [
    {
      "question": "string",
      "options": ["option1", "option2", "option3", "option4"],
      "reponseCorrecte": 0-3,
      "explication": "string (optionnel)",
      "difficulte": "facile|moyen|difficile"
    }
  ],
  "tempsEstime": "10-15 minutes",
  "seuilReussite": 70
}`;
}

export interface PositionnementInput {
  formationTitre: string;
  objectifs: string[];
  prerequis: string[];
  publicCible: string;
  regenerateToken?: string; // Token pour forcer la variation des questions
}

export function generatePositionnementPrompt(input: PositionnementInput): string {
  // Ajouter une instruction de variation si regenerateToken est fourni
  const variationInstruction = input.regenerateToken
    ? `\n\n🔄 REGENERATION #${input.regenerateToken}: Cette demande est une REGENERATION. Tu DOIS generer des questions COMPLETEMENT DIFFERENTES des generations precedentes. Utilise de nouveaux angles, nouvelles formulations, nouveaux exemples et scenarios.`
    : "";

  return `Cree un test de positionnement QCM de 20 questions pour cette formation:

FORMATION: ${input.formationTitre}
PUBLIC CIBLE: ${input.publicCible}

OBJECTIFS DE LA FORMATION:
${input.objectifs.map((o, i) => `${i + 1}. ${o}`).join("\n")}

PREREQUIS ATTENDUS:
${input.prerequis.map((p, i) => `${i + 1}. ${p}`).join("\n")}${variationInstruction}

REGLES OBLIGATOIRES:

1. NOMBRE ET FORMAT:
   - Genere exactement 20 questions QCM
   - Chaque question a 4 options avec UNE SEULE bonne reponse (index 0 a 3)
   - Le test doit etre DIFFICILE pour identifier les lacunes AVANT la formation
   - Difficulte: 30% facile, 40% moyen, 30% difficile

2. LONGUEUR DES REPONSES:
   ⚠️ CRITIQUE: Toutes les 4 options DOIVENT avoir une longueur SIMILAIRE (8-20 mots chacune)
   - NE JAMAIS avoir une reponse plus longue ou detaillee que les autres
   - Si la bonne reponse fait 12 mots, les mauvaises aussi

3. DISTRIBUTION DES BONNES REPONSES:
   ⚠️ OBLIGATOIRE: Repartir les bonnes reponses UNIFORMEMENT sur les 4 positions
   - 5 questions avec reponseCorrecte = 0
   - 5 questions avec reponseCorrecte = 1
   - 5 questions avec reponseCorrecte = 2
   - 5 questions avec reponseCorrecte = 3

4. QUALITE:
   - INTERDIRE les negations ("ne pas", "jamais", "aucun") dans les options
   - Distracteurs plausibles qui testent des erreurs courantes
   - Questions qui font reflechir l'apprenant

Le test doit permettre d'evaluer le niveau initial de chaque apprenant
et d'identifier leurs besoins specifiques.

Schema JSON attendu:
{
  "titre": "string",
  "introduction": "string",
  "questions": [
    {
      "question": "string",
      "options": ["option1", "option2", "option3", "option4"],
      "reponseCorrecte": 0-3,
      "explication": "string (optionnel)",
      "difficulte": "facile|moyen|difficile",
      "competenceEvaluee": "string"
    }
  ],
  "tempsEstime": "30-40 minutes",
  "seuilReussite": 60,
  "grilleLecture": {
    "niveauDebutant": "Moins de 40% de bonnes reponses",
    "niveauIntermediaire": "Entre 40% et 70% de bonnes reponses",
    "niveauAvance": "Plus de 70% de bonnes reponses"
  }
}`;
}

export interface EvaluationInput {
  formationTitre: string;
  modules: Array<{ titre: string; objectifs: string[] }>;
  dureeEvaluation?: string;
  regenerateToken?: string; // Token pour forcer la variation des questions
}

export function generateEvaluationPrompt(input: EvaluationInput): string {
  // Ajouter une instruction de variation si regenerateToken est fourni
  const variationInstruction = input.regenerateToken
    ? `\n\n🔄 REGENERATION #${input.regenerateToken}: Cette demande est une REGENERATION. Tu DOIS generer des questions COMPLETEMENT DIFFERENTES des generations precedentes. Utilise de nouveaux angles, nouvelles formulations, nouveaux exemples et scenarios.`
    : "";

  return `Cree une evaluation finale QCM de 20 questions pour cette formation:

FORMATION: ${input.formationTitre}
DUREE EVALUATION: ${input.dureeEvaluation || "20-30 minutes"}

MODULES ET OBJECTIFS:
${input.modules
  .map(
    (m, i) => `
Module ${i + 1}: ${m.titre}
Objectifs: ${m.objectifs.join(", ")}`
  )
  .join("\n")}${variationInstruction}

REGLES OBLIGATOIRES:

1. NOMBRE ET FORMAT:
   - Genere exactement 20 questions QCM
   - Chaque question a 4 options avec UNE SEULE bonne reponse (index 0 a 3)
   - L'evaluation doit etre PLUS FACILE que le test de positionnement
   - Difficulte: 40% facile, 45% moyen, 15% difficile

2. LONGUEUR DES REPONSES:
   ⚠️ CRITIQUE: Toutes les 4 options DOIVENT avoir une longueur SIMILAIRE (8-20 mots chacune)
   - NE JAMAIS avoir une reponse plus longue ou detaillee que les autres
   - Si la bonne reponse fait 12 mots, les mauvaises aussi

3. DISTRIBUTION DES BONNES REPONSES:
   ⚠️ OBLIGATOIRE: Repartir les bonnes reponses UNIFORMEMENT sur les 4 positions
   - 5 questions avec reponseCorrecte = 0
   - 5 questions avec reponseCorrecte = 1
   - 5 questions avec reponseCorrecte = 2
   - 5 questions avec reponseCorrecte = 3

4. QUALITE:
   - INTERDIRE les negations ("ne pas", "jamais", "aucun") dans les options
   - Questions directes qui verifient les acquis (pas de pieges)
   - Repartir les questions equitablement sur tous les modules

L'evaluation doit couvrir tous les modules et permettre de certifier
l'acquisition des competences. Un apprenant ayant bien suivi la formation
devrait facilement obtenir plus de 70%.

Schema JSON attendu:
{
  "titre": "string",
  "introduction": "string",
  "objectifsEvalues": ["objectif1", "objectif2"],
  "questions": [
    {
      "question": "string",
      "options": ["option1", "option2", "option3", "option4"],
      "reponseCorrecte": 0-3,
      "explication": "string (optionnel)",
      "difficulte": "facile|moyen|difficile",
      "competenceEvaluee": "string"
    }
  ],
  "tempsEstime": "20-30 minutes",
  "bareme": {
    "noteMinimum": 0,
    "noteMaximum": 20,
    "seuilReussite": 70
  },
  "consignes": "string"
}`;
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

export interface AtelierInput {
  moduleTitre: string;
  moduleContenu: string[];
  formationTitre: string;
  objectifs: string[];
}

export function generateAtelierPrompt(input: AtelierInput): string {
  return `Cree un atelier pratique pour ce module de formation:

FORMATION: ${input.formationTitre}
MODULE: ${input.moduleTitre}

CONTENU DU MODULE:
${input.moduleContenu.map((c, i) => `${i + 1}. ${c}`).join('\n')}

OBJECTIFS PEDAGOGIQUES DE LA FORMATION:
${input.objectifs.map((o, i) => `${i + 1}. ${o}`).join('\n')}

L'atelier doit:
1. Permettre de mettre en pratique les concepts du module
2. Etre realisable en 20-40 minutes
3. Avoir des instructions claires et detaillees
4. Proposer des criteres d'evaluation objectifs
5. Favoriser l'apprentissage actif et concret
6. INCLURE DES EXEMPLES DE RENDU CONCRETS pour chaque instruction (destinés au formateur)

LIMITES IMPORTANTES:
- objectifs: entre 2 et 8 elements maximum
- instructions: entre 3 et 15 etapes maximum
- exemplesRendu: EXACTEMENT le meme nombre d'elements que instructions (1 exemple par instruction)
- critereEvaluation: entre 2 et 8 elements maximum

IMPORTANT - EXEMPLES DE RENDU:
Pour chaque instruction, tu dois fournir un exemple CONCRET et DETAILLE de ce que l'apprenant devrait produire.
Ces exemples sont destines au formateur pour qu'il puisse evaluer les travaux et guider les apprenants.
Utilise un cas fictif realiste et donne des exemples precis, pas des phrases generiques.

Exemple:
- Si instruction = "Identifiez 3 forces et 3 faiblesses de votre presence digitale actuelle"
- Alors exempleRendu = "Forces: 1) Compte LinkedIn actif avec 500+ abonnés, 2) Publication régulière (2x/semaine), 3) Bio professionnelle complète. Faiblesses: 1) Pas de compte Instagram professionnel, 2) Site web non optimisé mobile, 3) Absence de stratégie de contenu vidéo."

Schema JSON attendu:
{
  "titre": "string - titre de l'atelier",
  "description": "string - description de 2-3 phrases",
  "objectifs": ["objectif1", "objectif2", "objectif3"] (2 a 8 elements),
  "instructions": ["etape1", "etape2", "etape3", "..."] (3 a 15 etapes),
  "exemplesRendu": ["exemple rendu concret etape 1", "exemple rendu concret etape 2", "..."] (MEME NOMBRE que instructions),
  "dureeEstimee": "30 minutes",
  "critereEvaluation": ["critere1", "critere2", "..."] (2 a 8 elements),
  "materielNecessaire": ["materiel1", "materiel2"] (optionnel),
  "conseilsAnimateur": "string" (optionnel)
}`;
}

// ===========================================
// TYPES EXPORTES
// ===========================================

export type FichePedagogique = z.infer<typeof FichePedagogiqueSchema>;
export type QCM = z.infer<typeof QCMSchema>;
export type QuestionQCM = z.infer<typeof QuestionQCMSchema>;
export type QuestionTest = z.infer<typeof QuestionTestSchema>;
export type TestPositionnement = z.infer<typeof TestPositionnementSchema>;
export type EvaluationFinale = z.infer<typeof EvaluationFinaleSchema>;
export type Reformulation = z.infer<typeof ReformulationSchema>;
export type Atelier = z.infer<typeof AtelierSchema>;
export type Module = z.infer<typeof ModuleSchema>;
