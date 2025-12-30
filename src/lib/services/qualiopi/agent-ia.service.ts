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

const SYSTEM_PROMPT = `Tu es un expert Qualiopi, assistant spécialisé pour aider les organismes de formation français à obtenir et maintenir leur certification Qualiopi.

## Ton rôle
- Répondre aux questions sur la certification Qualiopi
- Analyser la conformité de l'organisme
- Proposer des actions correctives
- Expliquer les 32 indicateurs et les 7 critères
- Aider à préparer les audits

## Les 7 critères Qualiopi
${CRITERES_QUALIOPI.map(c => `${c.numero}. ${c.titre}: ${c.description} (Indicateurs ${c.indicateurs.join(", ")})`).join("\n")}

## Les 32 indicateurs
${INDICATEURS_QUALIOPI.map(i => `IND ${i.numero} (C${i.critere}): ${i.libelle} - ${i.description.substring(0, 100)}...`).join("\n")}

## Règles importantes
1. Toujours être précis et citer les numéros d'indicateurs
2. Proposer des actions concrètes et réalisables
3. Tenir compte du contexte de l'organisme
4. Utiliser un langage clair et accessible
5. Prioriser les actions selon leur impact sur la conformité

## Format de réponse
- Sois concis mais complet
- Utilise des listes à puces pour la clarté
- Cite les indicateurs concernés entre crochets [IND X]
- Propose des actions prioritaires quand pertinent`;

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

  // Construire le prompt pour l'analyse
  const prompt = `Analyse l'indicateur ${numeroIndicateur} pour cet organisme.

## Indicateur ${numeroIndicateur}: ${indicateur.libelle}
${indicateur.description}

## Exigences
${indicateur.exigences.map((e) => `- ${e}`).join("\n")}

## État actuel
- Score: ${analyseIndicateur?.score || 0}%
- Statut: ${analyseIndicateur?.status || "À évaluer"}
- Preuves trouvées: ${analyseIndicateur?.preuvesTrouvees?.map((p) => p.description).join(", ") || "Aucune"}
- Problèmes: ${analyseIndicateur?.problemes?.join(", ") || "Aucun"}

Fournis:
1. Une analyse détaillée de la situation
2. Les actions prioritaires à mener
3. Les preuves à préparer pour l'audit`;

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

  const prompt = `Simule un audit Qualiopi pour cet organisme.

## État de conformité
- Score global: ${conformite.score.scoreGlobal}%
- Indicateurs conformes: ${conformite.score.indicateursConformes}/32

### Détail par critère
${conformite.score.scoreParCritere.map((c) =>
  `Critère ${c.critere} (${c.titre}): ${c.score}% - ${c.indicateursConformes}/${c.indicateursTotal} conformes`
).join("\n")}

### Indicateurs problématiques
${conformite.analyses
  .filter((a) => a.status === "NON_CONFORME" || a.status === "EN_COURS")
  .map((a) => `- IND ${a.numero}: ${a.libelle} (${a.score}%) - ${a.problemes.join(", ")}`)
  .join("\n")}

Fournis un rapport d'audit simulé avec:
1. Synthèse globale
2. Points forts (3-5)
3. Points à améliorer (3-5)
4. Risques de non-certification
5. Recommandations prioritaires`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const rapportText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  // Extraire les sections
  const pointsForts = extraireSection(rapportText, "points forts");
  const pointsAmeliorer = extraireSection(rapportText, "points à améliorer");
  const risques = extraireSection(rapportText, "risques");

  return {
    rapport: rapportText,
    pointsForts,
    pointsAmeliorer,
    risques,
    score: conformite.score.scoreGlobal,
  };
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
