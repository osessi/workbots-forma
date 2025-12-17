// ===========================================
// DECLARATIONS DE TYPES POUR LES EXTENSIONS TIPTAP
// ===========================================

import "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    resizableImage: {
      /**
       * Insert a resizable image
       */
      setResizableImage: (options: {
        src: string;
        alt?: string;
        title?: string;
      }) => ReturnType;
    };
    templateVariable: {
      /**
       * Insert a template variable
       */
      insertVariable: (variableId: string) => ReturnType;
    };
  }
}
