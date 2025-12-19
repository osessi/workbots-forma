// ===========================================
// EXPORTS DU MODULE TEMPLATES
// ===========================================

// Types
export * from "./types";

// Variables
export {
  TEMPLATE_VARIABLES,
  VARIABLE_GROUPS,
  DOCUMENT_TYPES,
  getVariablesForDocumentType,
  getVariableById,
  formatVariableForInsertion,
  extractVariablesFromText,
  // Fonctions pour variables dynamiques
  generateJourneeVariables,
  generateSalarieVariables,
  getVariablesWithDynamicContext,
  getVariableGroupsWithDynamicContext,
} from "./variables";

export type { DynamicVariableContext } from "./variables";

// Renderer
export {
  renderTemplate,
  generateTestContext,
} from "./renderer";
