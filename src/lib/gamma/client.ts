// ===========================================
// CLIENT GAMMA API - Génération de slides IA
// ===========================================

import {
  GammaGenerateRequest,
  GammaGenerateResponse,
  GammaStatusResponse,
  GammaTheme,
  GammaFolder,
  ModuleSlideConfig,
  FormationSlidesConfig,
  ModuleGenerationResult,
  FormationGenerationResult,
} from "./types";

// Base URL de l'API Gamma
const GAMMA_API_BASE = "https://public-api.gamma.app/v1.0";

// Délais pour le polling
const POLL_INTERVAL_MS = 3000; // 3 secondes
const MAX_POLL_ATTEMPTS = 120; // 6 minutes max par génération

/**
 * Client pour l'API Gamma
 */
export class GammaClient {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey || !apiKey.startsWith("sk-gamma-")) {
      throw new Error("Clé API Gamma invalide. Format attendu: sk-gamma-xxxxxxxx");
    }
    this.apiKey = apiKey;
  }

  /**
   * Headers communs pour toutes les requêtes
   */
  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "X-API-KEY": this.apiKey,
    };
  }

  /**
   * Récupérer la liste des thèmes disponibles
   */
  async listThemes(): Promise<GammaTheme[]> {
    const response = await fetch(`${GAMMA_API_BASE}/themes`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Erreur récupération thèmes: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return data.themes || [];
  }

  /**
   * Récupérer la liste des dossiers
   */
  async listFolders(): Promise<GammaFolder[]> {
    const response = await fetch(`${GAMMA_API_BASE}/folders`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Erreur récupération dossiers: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return data.folders || [];
  }

  /**
   * Lancer une génération de présentation
   */
  async generate(request: GammaGenerateRequest): Promise<GammaGenerateResponse> {
    const response = await fetch(`${GAMMA_API_BASE}/generations`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Erreur génération: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Vérifier le statut d'une génération
   */
  async checkStatus(generationId: string): Promise<GammaStatusResponse> {
    const response = await fetch(`${GAMMA_API_BASE}/generations/${generationId}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Erreur statut: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Attendre la fin d'une génération (polling)
   */
  async waitForCompletion(
    generationId: string,
    onProgress?: (status: GammaStatusResponse) => void
  ): Promise<GammaStatusResponse> {
    let attempts = 0;

    while (attempts < MAX_POLL_ATTEMPTS) {
      const status = await this.checkStatus(generationId);

      if (onProgress) {
        onProgress(status);
      }

      if (status.status === "completed") {
        return status;
      }

      if (status.status === "failed") {
        throw new Error(`Génération échouée: ${status.error || "Erreur inconnue"}`);
      }

      // Attendre avant le prochain poll
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      attempts++;
    }

    throw new Error("Timeout: la génération a pris trop de temps");
  }

  /**
   * Générer les slides pour un module de formation
   */
  async generateModuleSlides(
    module: ModuleSlideConfig,
    options: {
      themeId?: string;
      language?: string;
      tone?: string;
      audience?: string;
      imageSource?: string;
      imageStyle?: string;
      exportAs?: "pdf" | "pptx";
    } = {}
  ): Promise<ModuleGenerationResult> {
    // Construire le contenu enrichi du module
    const inputText = this.buildModuleInputText(module);

    const request: GammaGenerateRequest = {
      inputText,
      textMode: "generate",
      format: "presentation",
      numCards: module.numCards || 8, // Par défaut 8 slides par module
      exportAs: options.exportAs || "pptx",

      textOptions: {
        amount: "medium",
        tone: options.tone || "professionnel, pédagogique, engageant",
        audience: options.audience || "apprenants en formation professionnelle",
        language: options.language || "fr",
      },

      imageOptions: {
        source: (options.imageSource as "aiGenerated" | "unsplash") || "unsplash",
        style: options.imageStyle || "moderne, professionnel, épuré",
      },

      additionalInstructions: `
        Créer une présentation pédagogique pour ce module de formation.
        Structure recommandée:
        - Slide de titre avec le nom du module
        - Slide des objectifs pédagogiques
        - Slides de contenu (1 concept clé par slide)
        - Slide de synthèse/points clés

        Style:
        - Phrases courtes et impactantes
        - Bullet points clairs
        - Visuels pertinents pour illustrer les concepts
      `.trim(),
    };

    if (options.themeId) {
      request.themeId = options.themeId;
    }

    try {
      // Lancer la génération
      const { generationId } = await this.generate(request);

      // Attendre la fin
      const result = await this.waitForCompletion(generationId);

      return {
        moduleId: module.moduleId,
        moduleTitre: module.moduleTitre,
        generationId,
        status: result.status,
        gammaUrl: result.gammaUrl,
        exportUrl: result.exportUrl,
      };
    } catch (error) {
      return {
        moduleId: module.moduleId,
        moduleTitre: module.moduleTitre,
        generationId: "",
        status: "failed",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Générer les slides pour tous les modules d'une formation
   */
  async generateFormationSlides(
    config: FormationSlidesConfig,
    onModuleProgress?: (moduleIndex: number, result: ModuleGenerationResult) => void
  ): Promise<FormationGenerationResult> {
    const results: ModuleGenerationResult[] = [];
    let totalCreditsUsed = 0;
    let remainingCredits = 0;

    // Options communes
    const commonOptions = {
      themeId: config.themeId,
      language: config.language || "fr",
      tone: config.tone,
      audience: config.audience,
      imageSource: config.imageSource,
      imageStyle: config.imageStyle,
      exportAs: config.exportAs,
    };

    // Générer l'intro si demandé
    if (config.includeIntro) {
      const introModule: ModuleSlideConfig = {
        moduleId: "intro",
        moduleTitre: `Introduction - ${config.formationTitre}`,
        contenu: `
          Bienvenue à la formation "${config.formationTitre}"

          Programme:
          ${config.modules.map((m, i) => `${i + 1}. ${m.moduleTitre}`).join("\n")}
        `,
        numCards: 3,
      };

      const introResult = await this.generateModuleSlides(introModule, commonOptions);
      results.push(introResult);

      if (onModuleProgress) {
        onModuleProgress(0, introResult);
      }
    }

    // Générer chaque module
    for (let i = 0; i < config.modules.length; i++) {
      const module = config.modules[i];
      const result = await this.generateModuleSlides(module, commonOptions);

      results.push(result);

      if (onModuleProgress) {
        onModuleProgress(config.includeIntro ? i + 1 : i, result);
      }

      // Petit délai entre les modules pour éviter le rate limiting
      if (i < config.modules.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Générer la conclusion si demandé
    if (config.includeConclusion) {
      const conclusionModule: ModuleSlideConfig = {
        moduleId: "conclusion",
        moduleTitre: `Conclusion - ${config.formationTitre}`,
        contenu: `
          Récapitulatif de la formation "${config.formationTitre}"

          Points clés abordés:
          ${config.modules.map((m) => `- ${m.moduleTitre}`).join("\n")}

          Prochaines étapes et mise en pratique
        `,
        numCards: 3,
      };

      const conclusionResult = await this.generateModuleSlides(conclusionModule, commonOptions);
      results.push(conclusionResult);

      if (onModuleProgress) {
        onModuleProgress(results.length - 1, conclusionResult);
      }
    }

    // Calculer les crédits utilisés (estimation basée sur les résultats)
    // Note: Les crédits réels sont retournés par l'API pour chaque génération
    results.forEach((r) => {
      if (r.status === "completed") {
        totalCreditsUsed += 150; // Estimation moyenne
      }
    });

    return {
      formationTitre: config.formationTitre,
      modules: results,
      totalCreditsUsed,
      remainingCredits,
    };
  }

  /**
   * Construire le texte d'entrée pour un module
   */
  private buildModuleInputText(module: ModuleSlideConfig): string {
    let text = `# ${module.moduleTitre}\n\n`;

    // Ajouter les objectifs si présents
    if (module.objectifs && module.objectifs.length > 0) {
      text += `## Objectifs pédagogiques\n`;
      module.objectifs.forEach((obj) => {
        text += `- ${obj}\n`;
      });
      text += "\n---\n\n";
    }

    // Ajouter le contenu principal
    text += `## Contenu\n${module.contenu}\n`;

    return text;
  }
}

/**
 * Créer une instance du client Gamma
 * Utilise la clé API depuis les variables d'environnement côté serveur
 */
export function createGammaClient(apiKey?: string): GammaClient {
  const key = apiKey || process.env.GAMMA_API_KEY;

  if (!key) {
    throw new Error("Clé API Gamma non configurée. Définissez GAMMA_API_KEY dans les variables d'environnement.");
  }

  return new GammaClient(key);
}

export default GammaClient;
