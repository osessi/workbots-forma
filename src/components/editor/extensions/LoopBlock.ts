// ===========================================
// EXTENSION TIPTAP: BLOC DE BOUCLE (EACH)
// ===========================================
// Permet d'inserer des blocs {{#each}}...{{/each}} visuels
// pour iterer sur des listes (participants, journees, modules)

import { Node, mergeAttributes } from "@tiptap/core";

export interface LoopBlockOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    loopBlock: {
      /**
       * Inserer un bloc de boucle
       */
      setLoopBlock: (collection: string) => ReturnType;
      /**
       * Supprimer le bloc de boucle et garder le contenu
       */
      unsetLoopBlock: () => ReturnType;
    };
  }
}

/**
 * Obtenir un label lisible pour une collection
 */
function getCollectionLabel(collection: string): string {
  const labels: Record<string, string> = {
    participants: "Pour chaque Participant",
    modules: "Pour chaque Module",
    journees: "Pour chaque Journée",
    objectifs: "Pour chaque Objectif",
    prerequis: "Pour chaque Prérequis",
    contenus: "Pour chaque Contenu",
  };
  return labels[collection] || `Pour chaque ${collection}`;
}

/**
 * Obtenir les variables disponibles dans une boucle
 */
export function getLoopVariables(collection: string): { id: string; label: string }[] {
  const variablesByCollection: Record<string, { id: string; label: string }[]> = {
    participants: [
      { id: "@index", label: "Index (0, 1, 2...)" },
      { id: "@number", label: "Numéro (1, 2, 3...)" },
      { id: "participant.civilite", label: "Civilité" },
      { id: "participant.nom", label: "Nom" },
      { id: "participant.prenom", label: "Prénom" },
      { id: "participant.nom_complet", label: "Nom complet" },
      { id: "participant.email", label: "Email" },
      { id: "participant.telephone", label: "Téléphone" },
      { id: "participant.fonction", label: "Fonction" },
      { id: "participant.adresse", label: "Adresse" },
      { id: "participant.code_postal", label: "Code postal" },
      { id: "participant.ville", label: "Ville" },
      { id: "participant.date_naissance", label: "Date naissance" },
      { id: "participant.lieu_naissance", label: "Lieu naissance" },
    ],
    modules: [
      { id: "@index", label: "Index (0, 1, 2...)" },
      { id: "@number", label: "Numéro (1, 2, 3...)" },
      { id: "module.numero", label: "Numéro du module" },
      { id: "module.titre", label: "Titre" },
      { id: "module.duree", label: "Durée" },
      { id: "module.duree_heures", label: "Durée (heures)" },
      { id: "module.objectifs", label: "Objectifs" },
      { id: "module.contenu", label: "Contenu" },
    ],
    journees: [
      { id: "@index", label: "Index (0, 1, 2...)" },
      { id: "@number", label: "Numéro (1, 2, 3...)" },
      { id: "journee.numero", label: "Numéro jour" },
      { id: "journee.date", label: "Date" },
      { id: "journee.date_courte", label: "Date courte" },
      { id: "journee.horaires_matin", label: "Horaires matin" },
      { id: "journee.horaires_apres_midi", label: "Horaires après-midi" },
    ],
    objectifs: [
      { id: "@index", label: "Index (0, 1, 2...)" },
      { id: "@number", label: "Numéro (1, 2, 3...)" },
      { id: "this", label: "Objectif (texte)" },
    ],
    prerequis: [
      { id: "@index", label: "Index (0, 1, 2...)" },
      { id: "@number", label: "Numéro (1, 2, 3...)" },
      { id: "this", label: "Prérequis (texte)" },
    ],
  };
  return variablesByCollection[collection] || [
    { id: "@index", label: "Index (0, 1, 2...)" },
    { id: "@number", label: "Numéro (1, 2, 3...)" },
    { id: "this", label: "Élément courant" },
  ];
}

const LoopBlock = Node.create<LoopBlockOptions>({
  name: "loopBlock",

  group: "block",

  content: "block+",

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      collection: {
        default: "participants",
        parseHTML: (element) => element.getAttribute("data-collection"),
        renderHTML: (attributes) => ({
          "data-collection": attributes.collection,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="loop-block"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const collection = node.attrs.collection as string;
    const label = getCollectionLabel(collection);

    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "loop-block",
        "data-collection": collection,
        "data-collection-label": label,
        class: `loop-block loop-block-${collection}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setLoopBlock:
        (collection: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { collection },
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Contenu répété pour chaque élément...",
                  },
                ],
              },
            ],
          });
        },
      unsetLoopBlock:
        () =>
        ({ commands }) => {
          return commands.lift(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Permettre de sortir du bloc avec Backspace au debut
      Backspace: () => {
        const { selection } = this.editor.state;
        const { $from } = selection;
        const parentNode = $from.parent;

        // Si on est au debut d'un paragraph vide dans un loop block
        if (
          parentNode.type.name === "paragraph" &&
          parentNode.content.size === 0 &&
          $from.parentOffset === 0
        ) {
          const grandparent = $from.node(-1);
          if (grandparent?.type.name === this.name && grandparent.content.childCount === 1) {
            return this.editor.commands.unsetLoopBlock();
          }
        }

        return false;
      },
    };
  },
});

export default LoopBlock;
