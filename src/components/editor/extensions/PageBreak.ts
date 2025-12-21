// ===========================================
// EXTENSION TIPTAP - PAGE BREAK
// ===========================================
// Cette extension permet d'inserer des sauts de page
// qui fonctionnent dans l'apercu et le telechargement PDF

import { Node, mergeAttributes } from "@tiptap/core";

export interface PageBreakOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageBreak: {
      /**
       * Inserer un saut de page
       */
      setPageBreak: () => ReturnType;
    };
  }
}

export const PageBreak = Node.create<PageBreakOptions>({
  name: "pageBreak",

  // Options par defaut
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  // Le noeud est un bloc (pas inline)
  group: "block",

  // Le noeud ne peut pas contenir d'autres elements
  atom: true,

  // Pas de contenu
  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-break"]',
      },
      {
        tag: 'div.page-break',
      },
    ];
  },

  // Rendre le noeud en HTML
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "page-break",
        class: "page-break",
      }),
    ];
  },

  // Commandes personnalisees
  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
          });
        },
    };
  },

  // Raccourcis clavier
  addKeyboardShortcuts() {
    return {
      // Ctrl+Enter pour inserer un saut de page
      "Mod-Enter": () => this.editor.commands.setPageBreak(),
    };
  },
});

export default PageBreak;
