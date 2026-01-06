// ===========================================
// SERVICE AGENT IA QUALIOPI - Claude API
// ===========================================

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db/prisma";
import {
  INDICATEURS_QUALIOPI,
  CRITERES_QUALIOPI,
  getIndicateur,
} from "./indicateurs-data";
import { analyserConformiteOrganisation } from "./conformite.service";

// Initialiser le client Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ===========================================
// TYPES
// ===========================================

interface MessageContext {
  organizationId: string;
  userId: string;
  conversationId?: string;
}

interface AgentResponse {
  message: string;
  indicateursMentionnes: number[];
  suggestions?: string[];
  actions?: {
    type: string;
    label: string;
    data?: any;
  }[];
}

// ===========================================
// PROMPT SYSTÈME
// ===========================================

const SYSTEM_PROMPT = `Tu es un expert Qualiopi, assistant spécialisé pour aider les organismes de formation français à obtenir et maintenir leur certification Qualiopi selon le Référentiel National Qualité (RNQ) Version 9 de janvier 2024.

## Ton rôle
- Répondre aux questions sur la certification Qualiopi selon le RNQ V9
- Analyser la conformité de l'organisme
- Proposer des actions correctives
- Expliquer les 32 indicateurs et les 7 critères
- Aider à préparer les audits (initial et de surveillance)
- Distinguer les non-conformités mineures des majeures

## Les 7 critères Qualiopi (RNQ V9)
${CRITERES_QUALIOPI.map(c => `**Critère ${c.numero}** - ${c.titre}: ${c.description} (Indicateurs ${c.indicateurs.join(", ")})`).join("\n")}

## Les 32 indicateurs avec types de non-conformité
${INDICATEURS_QUALIOPI.map(i => {
  const ncType = i.nonConformite.gradation ? "⚠️ Mineure ou Majeure" : (i.nonConformite.type === "mineure" ? "📝 Mineure" : "🔴 Majeure");
  return `[IND ${i.numero}] (C${i.critere}) ${i.libelle} - NC: ${ncType}`;
}).join("\n")}

## Types de prestataires (applicabilité des indicateurs)
- **OF** (Organisme de Formation): Formation professionnelle continue
- **CFA** (Centre de Formation d'Apprentis): Formation par apprentissage
- **CBC** (Centre de Bilan de Compétences): Bilans de compétences
- **VAE** (Validation des Acquis de l'Expérience): Accompagnement VAE

## Règles de non-conformité selon le RNQ V9
- **Non-conformité mineure**: Écart partiel qui n'affecte pas la qualité des prestations. L'organisme a 3 mois pour corriger.
- **Non-conformité majeure**: Écart significatif qui affecte la qualité des prestations. Peut entraîner le refus ou la suspension de la certification.
- Certains indicateurs permettent une gradation (mineure puis majeure si récurrence).

## Nouveaux entrants
Les organismes sans activité lors de l'audit initial ont des modalités d'appréciation adaptées pour certains indicateurs (2, 3, 11, 13, 14, 19, 22, 24, 25, 26 et 32). Ces indicateurs seront audités lors de l'audit de surveillance.

## Règles importantes
1. Toujours être précis et citer les numéros d'indicateurs [IND X]
2. Préciser le type de non-conformité possible pour chaque indicateur
3. Proposer des actions concrètes et réalisables
4. Tenir compte du type de prestataire (OF, CFA, CBC, VAE)
5. Prioriser les indicateurs avec non-conformité majeure

## Format de réponse
- Sois concis mais complet
- Utilise des listes à puces pour la clarté
- Cite les indicateurs concernés entre crochets [IND X]
- Indique le type de non-conformité quand pertinent
- Propose des actions prioritaires par ordre d'urgence`;

// ===========================================
// FONCTIONS PRINCIPALES
// ===========================================

export async function envoyerMessage(
  message: string,
  context: MessageContext
): Promise<AgentResponse> {
  const { organizationId, userId, conversationId } = context;

  // Récupérer le contexte de l'organisation
  const [organization, conformite, historique] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        name: true,
        catalogueActif: true,
        certificatQualiopiUrl: true,
      },
    }),
    analyserConformiteOrganisation(organizationId),
    conversationId
      ? prisma.messageQualiopi.findMany({
          where: { conversationId },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
      : [],
  ]);

  // Construire le contexte enrichi
  const contextMessage = `
## Contexte de l'organisme
- Nom: ${organization?.name}
- Catalogue actif: ${organization?.catalogueActif ? "Oui" : "Non"}
- Certificat Qualiopi: ${organization?.certificatQualiopiUrl ? "Oui" : "Non"}

## État de conformité actuel
- Score global: ${conformite.score.scoreGlobal}%
- Indicateurs conformes: ${conformite.score.indicateursConformes}/32

### Scores par critère
${conformite.score.scoreParCritere.map(c =>
  `- Critère ${c.critere}: ${c.score}% (${c.indicateursConformes}/${c.indicateursTotal} conformes)`
).join("\n")}

### Alertes en cours
${conformite.alertes.slice(0, 5).map(a =>
  `- [IND ${a.indicateur}] ${a.message}`
).join("\n") || "Aucune alerte"}
`;

  // Construire les messages pour l'API
  const messages: Anthropic.MessageParam[] = [];

  // Ajouter l'historique de la conversation
  if (historique.length > 0) {
    for (const msg of historique.reverse()) {
      messages.push({
        role: msg.role as "user" | "assistant",
        content: msg.contenu,
      });
    }
  }

  // Ajouter le message utilisateur avec contexte
  messages.push({
    role: "user",
    content: `${contextMessage}\n\n## Question de l'utilisateur\n${message}`,
  });

  // Appeler l'API Claude
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages,
  });

  // Extraire le texte de la réponse
  const responseText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  // Extraire les indicateurs mentionnés
  const indicateursMentionnes = extraireIndicateurs(responseText);

  // Sauvegarder les messages dans la conversation
  let savedConversationId = conversationId;

  if (!savedConversationId) {
    // Créer une nouvelle conversation
    const conversation = await prisma.conversationQualiopi.create({
      data: {
        organizationId,
        userId,
        titre: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
      },
    });
    savedConversationId = conversation.id;
  }

  // Sauvegarder le message utilisateur
  await prisma.messageQualiopi.create({
    data: {
      conversationId: savedConversationId,
      role: "user",
      contenu: message,
      indicateursMentionnes: [],
    },
  });

  // Sauvegarder la réponse de l'assistant
  await prisma.messageQualiopi.create({
    data: {
      conversationId: savedConversationId,
      role: "assistant",
      contenu: responseText,
      contexte: {
        scoreGlobal: conformite.score.scoreGlobal,
        alertesCount: conformite.alertes.length,
      },
      indicateursMentionnes,
    },
  });

  // Générer des suggestions d'actions
  const suggestions = genererSuggestions(indicateursMentionnes, conformite.analyses);

  return {
    message: responseText,
    indicateursMentionnes,
    suggestions,
    actions: genererActions(indicateursMentionnes),
  };
}

// ===========================================
// QUESTIONS PRÉDÉFINIES
// ===========================================

export const QUESTIONS_SUGGEREES = [
  {
    categorie: "Général",
    questions: [
      "Quel est mon niveau de conformité Qualiopi actuel ?",
      "Quels sont les indicateurs les plus urgents à traiter ?",
      "Comment me préparer au prochain audit ?",
    ],
  },
  {
    categorie: "Indicateurs",
    questions: [
      "Explique-moi l'indicateur 1 sur l'information du public",
      "Comment améliorer mon score sur le critère 7 ?",
      "Quelles preuves dois-je fournir pour l'indicateur 11 ?",
    ],
  },
  {
    categorie: "Documents",
    questions: [
      "Quels documents dois-je avoir pour être conforme ?",
      "Comment créer un règlement intérieur conforme ?",
      "Quelles sont les mentions obligatoires sur mes attestations ?",
    ],
  },
  {
    categorie: "Processus",
    questions: [
      "Comment mettre en place une procédure de réclamation ?",
      "Comment organiser ma veille réglementaire ?",
      "Comment suivre l'assiduité des stagiaires ?",
    ],
  },
];

// ===========================================
// ANALYSE SPÉCIFIQUE
// ===========================================

export async function analyserIndicateurSpecifique(
  organizationId: string,
  numeroIndicateur: number
): Promise<{
  indicateur: any;
  analyse: string;
  actions: string[];
}> {
  const indicateur = getIndicateur(numeroIndicateur);
  if (!indicateur) {
    throw new Error(`Indicateur ${numeroIndicateur} non trouvé`);
  }

  const conformite = await analyserConformiteOrganisation(organizationId);
  const analyseIndicateur = conformite.analyses.find(
    (a) => a.numero === numeroIndicateur
  );

  // Construire le prompt pour l'analyse avec les données RNQ V9
  const ncType = indicateur.nonConformite.gradation
    ? "Mineure ou Majeure (avec gradation)"
    : (indicateur.nonConformite.type === "mineure" ? "Mineure" : "Majeure");

  const applicabiliteStr = [
    indicateur.applicabilite.OF ? "OF" : null,
    indicateur.applicabilite.CFA ? "CFA" : null,
    indicateur.applicabilite.CBC ? "CBC" : null,
    indicateur.applicabilite.VAE ? "VAE" : null,
  ].filter(Boolean).join(", ");

  const prompt = `Analyse l'indicateur ${numeroIndicateur} pour cet organisme selon le RNQ V9.

## Indicateur ${numeroIndicateur}: ${indicateur.libelle}
**Critère ${indicateur.critere}**

### Description officielle
${indicateur.description}

### Niveau attendu (RNQ V9)
${indicateur.niveauAttendu}

### Type de non-conformité
- **Type**: ${ncType}
${indicateur.nonConformite.descriptionMineure ? `- **Si mineure**: ${indicateur.nonConformite.descriptionMineure}` : ""}

### Applicabilité
Cet indicateur s'applique à: ${applicabiliteStr}
${indicateur.applicabilite.nouveauxEntrants ? `\n**Nouveaux entrants**: ${indicateur.applicabilite.nouveauxEntrants}` : ""}
${indicateur.sousTraitance ? `\n**Sous-traitance**: ${indicateur.sousTraitance}` : ""}

### Exigences détaillées
${indicateur.exigences.map((e) => `- ${e}`).join("\n")}

### Preuves attendues (RNQ V9)
${indicateur.preuvesAttendues.map((p) => `- ${p}`).join("\n")}

${indicateur.obligationsSpecifiques && indicateur.obligationsSpecifiques.length > 0 ? `
### Obligations spécifiques par type
${indicateur.obligationsSpecifiques.map((o) => `- **${o.type}**: ${o.description}`).join("\n")}
` : ""}

## État actuel de l'organisme
- Score: ${analyseIndicateur?.score || 0}%
- Statut: ${analyseIndicateur?.status || "À évaluer"}
- Preuves trouvées: ${analyseIndicateur?.preuvesTrouvees?.map((p: { description: string }) => p.description).join(", ") || "Aucune"}
- Problèmes identifiés: ${analyseIndicateur?.problemes?.join(", ") || "Aucun"}

## Consignes
Fournis une analyse complète avec:
1. **Diagnostic**: Analyse détaillée de la situation actuelle
2. **Risques**: Type de non-conformité encourue si les écarts ne sont pas corrigés
3. **Actions prioritaires**: Liste ordonnée des actions à mener
4. **Preuves à préparer**: Documents concrets à préparer pour l'audit`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const analyseText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  // Extraire les actions de la réponse
  const actionsMatch = analyseText.match(/actions?.*?:?\n((?:[-•]\s*.+\n?)+)/gi);
  const actions = actionsMatch
    ? actionsMatch[0]
        .split("\n")
        .filter((l) => l.match(/^[-•]/))
        .map((l) => l.replace(/^[-•]\s*/, ""))
    : [];

  return {
    indicateur,
    analyse: analyseText,
    actions,
  };
}

// ===========================================
// SIMULATION D'AUDIT
// ===========================================

export async function simulerAudit(
  organizationId: string
): Promise<{
  rapport: string;
  pointsForts: string[];
  pointsAmeliorer: string[];
  risques: string[];
  score: number;
}> {
  const conformite = await analyserConformiteOrganisation(organizationId);
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  });

  // Séparer les indicateurs par statut
  const indicateursConformes = conformite.analyses.filter((a) => a.status === "CONFORME");
  const indicateursEnCours = conformite.analyses.filter((a) => a.status === "EN_COURS");
  const indicateursNonConformes = conformite.analyses.filter((a) => a.status === "NON_CONFORME");

  const prompt = `Tu es un auditeur Qualiopi expert. Simule un audit complet pour cet organisme de formation.

## INFORMATIONS DE L'ORGANISME
- Nom: ${organization?.name || "Organisme"}
- Date d'audit: ${new Date().toLocaleDateString("fr-FR")}
- Auditeur: Expert Qualiopi

## ÉTAT DE CONFORMITÉ ACTUEL
- **Score global: ${conformite.score.scoreGlobal}%**
- Indicateurs conformes: ${conformite.score.indicateursConformes}/32
- Indicateurs en cours: ${indicateursEnCours.length}/32
- Indicateurs non conformes: ${indicateursNonConformes.length}/32

### Détail par critère
${conformite.score.scoreParCritere.map((c) =>
  `- **Critère ${c.critere}** (${c.titre}): ${c.score}% - ${c.indicateursConformes}/${c.indicateursTotal} conformes`
).join("\n")}

### Indicateurs CONFORMES (score >= 80%)
${indicateursConformes.length > 0
  ? indicateursConformes.map((a) => `- [IND ${a.numero}]: ${a.libelle}`).join("\n")
  : "Aucun indicateur pleinement conforme"
}

### Indicateurs EN COURS (score 50-79%)
${indicateursEnCours.length > 0
  ? indicateursEnCours.map((a) => `- [IND ${a.numero}]: ${a.libelle} (${a.score}%)`).join("\n")
  : "Aucun indicateur en cours"
}

### Indicateurs NON CONFORMES (score < 50%)
${indicateursNonConformes.length > 0
  ? indicateursNonConformes.map((a) => `- [IND ${a.numero}]: ${a.libelle} (${a.score}%) - Problèmes: ${a.problemes.join("; ")}`).join("\n")
  : "Aucun indicateur non conforme"
}

## CONSIGNES DE FORMAT

Génère un RAPPORT D'AUDIT QUALIOPI professionnel et structuré. Utilise EXACTEMENT ces titres de sections avec le format markdown:

### 1. SYNTHÈSE GLOBALE
(Résumé en 2-3 paragraphes: verdict global, niveau de préparation, recommandation certification)

### 2. POINTS FORTS IDENTIFIÉS
(Liste les éléments conformes, les bonnes pratiques observées - format liste à puces)

### 3. POINTS À AMÉLIORER PRIORITAIRES
(Liste les écarts critiques identifiés par critère - format liste à puces avec référence [IND X])

### 4. RISQUES DE NON-CERTIFICATION
(Liste les risques majeurs qui pourraient empêcher la certification - format liste à puces)

### 5. RECOMMANDATIONS
(Actions prioritaires à mettre en place - format liste numérotée par ordre de priorité)

IMPORTANT:
- Sois précis et cite les numéros d'indicateurs [IND X]
- Utilise des listes à puces pour chaque section
- Le rapport doit être professionnel et actionnable
- Base-toi sur les données réelles fournies, pas sur des hypothèses`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    system: `Tu es un auditeur Qualiopi certifié avec 10 ans d'expérience. Tu génères des rapports d'audit professionnels, structurés et précis. Tu te bases uniquement sur les données fournies.`,
    messages: [{ role: "user", content: prompt }],
  });

  const rapportText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  // Extraire les sections avec des patterns plus flexibles
  const pointsForts = extraireSectionAmeliore(rapportText, ["points forts", "éléments conformes", "points positifs"]);
  const pointsAmeliorer = extraireSectionAmeliore(rapportText, ["points à améliorer", "améliorer prioritaires", "écarts", "non-conformités"]);
  const risques = extraireSectionAmeliore(rapportText, ["risques", "non-certification", "risques majeurs"]);

  return {
    rapport: rapportText,
    pointsForts,
    pointsAmeliorer,
    risques,
    score: conformite.score.scoreGlobal,
  };
}

// Fonction améliorée pour extraire les sections
function extraireSectionAmeliore(text: string, keywords: string[]): string[] {
  for (const keyword of keywords) {
    const regex = new RegExp(
      `(?:#{1,3}\\s*)?(?:\\d+\\.?\\s*)?${keyword}[^\\n]*\\n((?:[-•*]\\s*.+\\n?)+)`,
      "gi"
    );
    const match = regex.exec(text);
    if (match) {
      return match[1]
        .split("\n")
        .filter((l) => l.match(/^[-•*]/))
        .map((l) => l.replace(/^[-•*]\s*/, "").trim())
        .filter((l) => l.length > 0);
    }
  }
  return [];
}

// ===========================================
// FONCTIONS UTILITAIRES
// ===========================================

function extraireIndicateurs(text: string): number[] {
  const matches = text.matchAll(/\[?IND(?:ICATEUR)?\s*(\d+)\]?/gi);
  const indicateurs = new Set<number>();
  for (const match of matches) {
    const num = parseInt(match[1]);
    if (num >= 1 && num <= 32) {
      indicateurs.add(num);
    }
  }
  return Array.from(indicateurs).sort((a, b) => a - b);
}

function extraireSection(text: string, sectionName: string): string[] {
  const regex = new RegExp(
    `${sectionName}[:\\s]*\\n((?:[-•*]\\s*.+\\n?)+)`,
    "gi"
  );
  const match = regex.exec(text);
  if (!match) return [];

  return match[1]
    .split("\n")
    .filter((l) => l.match(/^[-•*]/))
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter((l) => l.length > 0);
}

function genererSuggestions(
  indicateurs: number[],
  analyses: any[]
): string[] {
  const suggestions: string[] = [];

  for (const num of indicateurs) {
    const analyse = analyses.find((a) => a.numero === num);
    if (analyse?.suggestions) {
      suggestions.push(...analyse.suggestions);
    }
  }

  return suggestions.slice(0, 5);
}

function genererActions(indicateurs: number[]): { type: string; label: string; data?: any }[] {
  const actions: { type: string; label: string; data?: any }[] = [];

  if (indicateurs.length > 0) {
    actions.push({
      type: "voir_indicateur",
      label: `Voir le détail de l'indicateur ${indicateurs[0]}`,
      data: { indicateur: indicateurs[0] },
    });
  }

  actions.push({
    type: "lancer_analyse",
    label: "Lancer une analyse complète",
  });

  actions.push({
    type: "simuler_audit",
    label: "Simuler un audit",
  });

  return actions;
}

// ===========================================
// GÉNÉRATION DE RAPPORT
// ===========================================

export async function genererRapportConformite(
  organizationId: string
): Promise<string> {
  const conformite = await analyserConformiteOrganisation(organizationId);
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  });

  const prompt = `Génère un rapport de conformité Qualiopi professionnel.

## Organisme: ${organization?.name}
## Date: ${new Date().toLocaleDateString("fr-FR")}

## Synthèse
- Score global: ${conformite.score.scoreGlobal}%
- Indicateurs conformes: ${conformite.score.indicateursConformes}/32

## Détail par critère
${conformite.score.scoreParCritere.map((c) => `
### Critère ${c.critere}: ${c.titre}
- Score: ${c.score}%
- Indicateurs conformes: ${c.indicateursConformes}/${c.indicateursTotal}
`).join("")}

## Indicateurs non conformes
${conformite.analyses
  .filter((a) => a.status === "NON_CONFORME")
  .map((a) => `- IND ${a.numero}: ${a.libelle} - ${a.problemes.join(", ")}`)
  .join("\n") || "Aucun"}

## Indicateurs en cours
${conformite.analyses
  .filter((a) => a.status === "EN_COURS")
  .map((a) => `- IND ${a.numero}: ${a.libelle} (${a.score}%)`)
  .join("\n") || "Aucun"}

Génère un rapport structuré et professionnel avec:
1. Synthèse exécutive
2. Analyse détaillée par critère
3. Points d'attention
4. Plan d'action recommandé
5. Conclusion`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}
