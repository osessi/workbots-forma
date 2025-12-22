// ===========================================
// TYPES GAMMA API - Génération de slides
// ===========================================

// Modes de traitement du texte
export type GammaTextMode = "generate" | "condense" | "preserve";

// Formats de sortie
export type GammaFormat = "presentation" | "document" | "social" | "webpage";

// Sources d'images
export type GammaImageSource =
  | "aiGenerated"
  | "pictographic"
  | "unsplash"
  | "giphy"
  | "webAllImages"
  | "none";

// Modèles d'IA pour les images
export type GammaImageModel =
  | "imagen-4-pro"
  | "flux-1-pro"
  | "flux-1-1-pro"
  | "recraft-v3";

// Niveaux d'accès
export type GammaAccessLevel = "noAccess" | "view" | "comment" | "edit" | "fullAccess";

// Positions pour header/footer
export type GammaPosition =
  | "topLeft"
  | "topRight"
  | "topCenter"
  | "bottomLeft"
  | "bottomRight"
  | "bottomCenter";

// Options de texte
export interface GammaTextOptions {
  amount?: "brief" | "medium" | "detailed" | "extensive";
  tone?: string; // 1-500 chars, ex: "professionnel, engageant"
  audience?: string; // 1-500 chars, ex: "professionnels RH"
  language?: string; // Code langue, ex: "fr"
}

// Options d'images
export interface GammaImageOptions {
  source?: GammaImageSource;
  model?: GammaImageModel;
  style?: string; // 1-500 chars, ex: "moderne, épuré"
}

// Élément de header/footer
export interface GammaHeaderFooterElement {
  type: "text" | "image" | "cardNumber";
  content?: string; // Pour type "text"
  imageUrl?: string; // Pour type "image"
}

// Options des cartes/slides
export interface GammaCardOptions {
  dimensions?: string; // Ratio selon le format
  headerFooter?: {
    [key in GammaPosition]?: GammaHeaderFooterElement;
  };
}

// Options de partage
export interface GammaSharingOptions {
  workspaceAccess?: GammaAccessLevel;
  externalAccess?: Exclude<GammaAccessLevel, "fullAccess">;
  emailOptions?: {
    recipients?: string[];
    access?: GammaAccessLevel;
  };
}

// Requête de génération
export interface GammaGenerateRequest {
  // Requis
  inputText: string;
  textMode: GammaTextMode;

  // Optionnels
  format?: GammaFormat;
  themeId?: string;
  numCards?: number; // 1-60 (Pro), 1-75 (Ultra)
  cardSplit?: "auto" | "inputTextBreaks";
  additionalInstructions?: string; // Max 2000 chars
  folderIds?: string[];
  exportAs?: "pdf" | "pptx";

  // Objets d'options
  textOptions?: GammaTextOptions;
  imageOptions?: GammaImageOptions;
  cardOptions?: GammaCardOptions;
  sharingOptions?: GammaSharingOptions;
}

// Réponse de création
export interface GammaGenerateResponse {
  generationId: string;
}

// Statut de génération
export type GammaGenerationStatus = "pending" | "completed" | "failed";

// Réponse de statut
export interface GammaStatusResponse {
  generationId: string;
  status: GammaGenerationStatus;
  gammaUrl?: string;
  exportUrl?: string; // URL de téléchargement si exportAs spécifié
  credits?: {
    deducted: number;
    remaining: number;
  };
  error?: string;
}

// Thème Gamma
export interface GammaTheme {
  id: string;
  name: string;
  previewUrl?: string;
}

// Dossier Gamma
export interface GammaFolder {
  id: string;
  name: string;
}

// Configuration pour un module de formation
export interface ModuleSlideConfig {
  moduleId: string;
  moduleTitre: string;
  contenu: string;
  objectifs?: string[];
  numCards?: number;
}

// Options de génération pour une formation complète
export interface FormationSlidesConfig {
  formationTitre: string;
  modules: ModuleSlideConfig[];
  themeId?: string;
  language?: string;
  tone?: string;
  audience?: string;
  imageSource?: GammaImageSource;
  imageStyle?: string;
  exportAs?: "pdf" | "pptx";
  includeIntro?: boolean;
  includeConclusion?: boolean;
}

// Résultat de génération pour un module
export interface ModuleGenerationResult {
  moduleId: string;
  moduleTitre: string;
  generationId: string;
  status: GammaGenerationStatus;
  gammaUrl?: string;
  exportUrl?: string;
  error?: string;
}

// Résultat de génération pour la formation complète
export interface FormationGenerationResult {
  formationTitre: string;
  modules: ModuleGenerationResult[];
  totalCreditsUsed: number;
  remainingCredits: number;
}
