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
} from "./variables";

// Renderer
export {
  renderTemplate,
  generateTestContext,
} from "./renderer";
