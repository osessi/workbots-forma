// ===========================================
// WORKBOTS SLIDES - Types & Interfaces
// ===========================================

// Tone options for presentation generation
export type WorkbotsTone =
  | "default"
  | "casual"
  | "professional"
  | "funny"
  | "educational"
  | "sales_pitch";

// Verbosity options
export type WorkbotsVerbosity = "concise" | "standard" | "text-heavy";

// Export format
export type WorkbotsExportFormat = "pptx" | "pdf";

// ===========================================
// Template Types
// ===========================================

export interface WorkbotsTemplate {
  id: string;
  name: string;
  description?: string;
  layoutCount: number;
  previewUrl?: string;
  lastUpdatedAt?: string;
  fonts?: string[];
}

export interface WorkbotsLayout {
  layout_id: string;
  layout_name: string;
  layout_code: string;
  fonts?: string[];
}

export interface WorkbotsTemplateDetails {
  success: boolean;
  layouts: WorkbotsLayout[];
  template?: {
    id: string;
    name: string;
    description?: string;
  };
  fonts?: string[];
}

// ===========================================
// Generation Request Types
// ===========================================

export interface WorkbotsGenerateRequest {
  // Required
  content: string;

  // Optional content overrides
  slidesMarkdown?: string[];
  instructions?: string;

  // Generation options
  tone?: WorkbotsTone;
  verbosity?: WorkbotsVerbosity;
  nSlides?: number;
  language?: string;

  // Template
  template?: string; // "general", "modern", "standard", "swift", or "custom-{uuid}"

  // Features
  webSearch?: boolean;
  includeTableOfContents?: boolean;
  includeTitleSlide?: boolean;

  // Files for context
  files?: string[];

  // Export
  exportAs?: WorkbotsExportFormat;
}

export interface WorkbotsModuleConfig {
  moduleId: string;
  moduleTitre: string;
  contenu: string;
  objectifs?: string;
  nSlides?: number;
}

export interface WorkbotsFormationGenerateRequest {
  formationId: string;
  formationTitre: string;
  modules: WorkbotsModuleConfig[];

  // Template selection
  templateId?: string;

  // Generation options
  tone?: WorkbotsTone;
  verbosity?: WorkbotsVerbosity;
  language?: string;

  // Features
  includeIntro?: boolean;
  includeConclusion?: boolean;

  // Export
  exportAs?: WorkbotsExportFormat;
}

// ===========================================
// Generation Response Types
// ===========================================

export interface WorkbotsGenerateResponse {
  presentationId: string;
  path: string;
  editPath: string;
}

export interface WorkbotsAsyncGenerateResponse {
  id: string;
  status: "pending" | "in_progress" | "completed" | "error";
  message: string;
  data?: WorkbotsGenerateResponse;
  error?: {
    code: string;
    message: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WorkbotsModuleResult {
  moduleId: string;
  moduleTitre: string;
  presentationId?: string;
  exportUrl?: string;
  editUrl?: string;
  status: "pending" | "generating" | "completed" | "failed";
  error?: string;
}

export interface WorkbotsFormationGenerateResponse {
  formationId: string;
  status: "pending" | "enrichment" | "generating" | "completed" | "failed";
  progress: number;
  currentPhase?: string;
  currentModuleIndex?: number;
  currentModuleName?: string;
  moduleResults: WorkbotsModuleResult[];
  error?: string;
}

// ===========================================
// Slide Types
// ===========================================

export interface WorkbotsSlide {
  id: string;
  presentationId: string;
  layoutGroup: string;
  layout: string;
  index: number;
  content: Record<string, unknown>;
  htmlContent?: string;
  speakerNote?: string;
}

export interface WorkbotsPresentation {
  id: string;
  content: string;
  nSlides: number;
  language: string;
  title?: string;
  slides: WorkbotsSlide[];
  createdAt: string;
  updatedAt: string;
}

// ===========================================
// Status Types
// ===========================================

export interface WorkbotsGenerationStatus {
  id: string;
  formationId: string;
  status: "PENDING" | "ENRICHMENT" | "GENERATING" | "FINALIZING" | "COMPLETED" | "FAILED";
  progress: number;
  currentPhase?: string;
  currentModuleIndex: number;
  currentModuleName?: string;
  themeId?: string;
  themeName?: string;
  tone?: string;
  cardsPerModule: number;
  errorMessage?: string;
  moduleResults?: WorkbotsModuleResult[];
  startedAt: string;
  completedAt?: string;
}

// ===========================================
// API Response Types
// ===========================================

export interface WorkbotsTemplatesResponse {
  success: boolean;
  templates: WorkbotsTemplate[];
  total: number;
}

export interface WorkbotsStatusResponse {
  active: WorkbotsGenerationStatus[];
  completed: WorkbotsGenerationStatus[];
  failed: WorkbotsGenerationStatus[];
}
