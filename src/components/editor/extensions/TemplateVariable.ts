// ===========================================
// EXTENSION TIPTAP - TEMPLATE VARIABLE
// ===========================================
// Cette extension permet d'inserer des variables {{variable}}
// qui seront remplacees lors du rendu du document

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import TemplateVariableComponent from "./TemplateVariableComponent";

export interface TemplateVariableOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    templateVariable: {
      /**
       * Inserer une variable de template
       */
      insertVariable: (variableId: string) => ReturnType;
    };
  }
}

export const TemplateVariable = Node.create<TemplateVariableOptions>({
  name: "templateVariable",

  // Options par defaut
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  // Le noeud est inline (dans le texte)
  group: "inline",
  inline: true,

  // Le noeud est atomique (non editable directement)
  atom: true,

  // Attributs du noeud
  addAttributes() {
    return {
      variableId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-variable-id"),
        renderHTML: (attributes) => {
          if (!attributes.variableId) {
            return {};
          }
          return {
            "data-variable-id": attributes.variableId,
          };
        },
      },
      label: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-label"),
        renderHTML: (attributes) => {
          if (!attributes.label) {
            return {};
          }
          return {
            "data-label": attributes.label,
          };
        },
      },
      category: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-category"),
        renderHTML: (attributes) => {
          if (!attributes.category) {
            return {};
          }
          return {
            "data-category": attributes.category,
          };
        },
      },
    };
  },

  // Parser le HTML vers le noeud
  parseHTML() {
    return [
      {
        tag: 'span[data-type="template-variable"]',
      },
    ];
  },

  // Rendre le noeud en HTML
  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "template-variable",
        class: "template-variable",
      }),
      `{{${HTMLAttributes["data-variable-id"]}}}`,
    ];
  },

  // Rendre avec React
  addNodeView() {
    return ReactNodeViewRenderer(TemplateVariableComponent);
  },

  // Commandes personnalisees
  addCommands() {
    return {
      insertVariable:
        (variableId: string) =>
        ({ commands, editor }) => {
          // Importer dynamiquement pour eviter les problemes de build
          const getVariableById = require("@/lib/templates/variables").getVariableById;
          const variable = getVariableById(variableId);

          return commands.insertContent({
            type: this.name,
            attrs: {
              variableId,
              label: variable?.label || variableId,
              category: variable?.category || "custom",
            },
          });
        },
    };
  },

  // Raccourcis clavier
  addKeyboardShortcuts() {
    return {
      // Supprimer la variable avec Backspace
      Backspace: () =>
        this.editor.commands.command(({ tr, state }) => {
          let isVariable = false;
          const { selection } = state;
          const { empty, anchor } = selection;

          if (!empty) {
            return false;
          }

          state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
            if (node.type.name === this.name) {
              isVariable = true;
              tr.delete(pos, pos + node.nodeSize);
            }
          });

          return isVariable;
        }),
    };
  },
});

export default TemplateVariable;
