// ===========================================
// EXTENSION TIPTAP - BLOC CONDITIONNEL
// ===========================================
// Cette extension permet d'inserer des blocs conditionnels
// qui s'affichent ou non selon le type de client

import { Node, mergeAttributes } from "@tiptap/core";

export interface ConditionalBlockOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    conditionalBlock: {
      /**
       * Inserer un bloc conditionnel
       */
      setConditionalBlock: (condition: string) => ReturnType;
      /**
       * Inserer un bloc "Si Entreprise"
       */
      setIfEntreprise: () => ReturnType;
      /**
       * Inserer un bloc "Si Particulier"
       */
      setIfParticulier: () => ReturnType;
      /**
       * Inserer un bloc "Si Independant"
       */
      setIfIndependant: () => ReturnType;
      /**
       * Inserer un bloc "Si Salarie"
       */
      setIfSalarie: () => ReturnType;
      /**
       * Inserer un bloc "Si Financeur"
       */
      setIfFinanceur: () => ReturnType;
    };
  }
}

export const ConditionalBlock = Node.create<ConditionalBlockOptions>({
  name: "conditionalBlock",

  // Options par defaut
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  // Le noeud est un bloc
  group: "block",

  // Le noeud peut contenir du contenu block
  content: "block+",

  // Attributs du noeud
  addAttributes() {
    return {
      condition: {
        default: "",
        parseHTML: element => element.getAttribute("data-condition"),
        renderHTML: attributes => {
          return {
            "data-condition": attributes.condition,
          };
        },
      },
      conditionLabel: {
        default: "",
        parseHTML: element => element.getAttribute("data-condition-label"),
        renderHTML: attributes => {
          return {
            "data-condition-label": attributes.conditionLabel,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="conditional-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "conditional-block",
        class: "conditional-block",
      }),
      0, // 0 signifie que le contenu enfant sera place ici
    ];
  },

  // Commandes personnalisees
  addCommands() {
    return {
      setConditionalBlock:
        (condition: string) =>
        ({ commands }) => {
          const conditionLabel = getConditionLabel(condition);
          return commands.insertContent({
            type: this.name,
            attrs: { condition, conditionLabel },
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Contenu conditionnel..." }],
              },
            ],
          });
        },
      setIfEntreprise:
        () =>
        ({ commands }) => {
          return commands.setConditionalBlock("client.type === 'entreprise'");
        },
      setIfParticulier:
        () =>
        ({ commands }) => {
          return commands.setConditionalBlock("client.type === 'particulier'");
        },
      setIfIndependant:
        () =>
        ({ commands }) => {
          return commands.setConditionalBlock("client.type === 'independant'");
        },
      setIfSalarie:
        () =>
        ({ commands }) => {
          return commands.setConditionalBlock("client.type === 'salarie'");
        },
      setIfFinanceur:
        () =>
        ({ commands }) => {
          return commands.setConditionalBlock("client.type === 'financeur'");
        },
    };
  },
});

/**
 * Obtenir le label lisible pour une condition
 */
function getConditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    "client.type === 'entreprise'": "Si Entreprise",
    "client.type === 'particulier'": "Si Particulier",
    "client.type === 'independant'": "Si Independant",
    "client.type === 'salarie'": "Si Salarie",
    "client.type === 'financeur'": "Si Financeur",
    "entreprise": "Si Entreprise existe",
    "particulier": "Si Particulier existe",
    "independant": "Si Independant existe",
    "financeur": "Si Financeur existe",
  };
  return labels[condition] || condition;
}

export default ConditionalBlock;
