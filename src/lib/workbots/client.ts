// ===========================================
// WORKBOTS SLIDES - API Client
// ===========================================

import {
  WorkbotsTemplate,
  WorkbotsTemplateDetails,
  WorkbotsGenerateRequest,
  WorkbotsGenerateResponse,
  WorkbotsAsyncGenerateResponse,
  WorkbotsPresentation,
  WorkbotsTone,
  WorkbotsVerbosity,
  WorkbotsExportFormat,
} from "./types";

// Default API URL (FastAPI backend)
const DEFAULT_API_URL = process.env.SLIDES_API_URL || "http://localhost:8000";

// Polling configuration
const POLL_INTERVAL_MS = 3000; // 3 seconds
const MAX_POLL_ATTEMPTS = 200; // 10 minutes max

export class WorkbotsClient {
  private apiUrl: string;
  private headers: Record<string, string>;

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl || DEFAULT_API_URL;
    this.headers = {
      "Content-Type": "application/json",
    };
  }

  // ===========================================
  // Template Management
  // ===========================================

  /**
   * Get all available templates (custom templates created by admins)
   */
  async getTemplates(): Promise<WorkbotsTemplate[]> {
    const response = await fetch(
      `${this.apiUrl}/api/v1/ppt/template-management/summary`,
      {
        method: "GET",
        headers: this.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform the response to our format
    const templates: WorkbotsTemplate[] = data.presentations?.map(
      (p: {
        presentation_id: string;
        layout_count: number;
        last_updated_at?: string;
        template?: { id: string; name: string; description?: string };
      }) => ({
        id: p.presentation_id,
        name: p.template?.name || `Template ${p.presentation_id.slice(0, 8)}`,
        description: p.template?.description,
        layoutCount: p.layout_count,
        lastUpdatedAt: p.last_updated_at,
      })
    ) || [];

    return templates;
  }

  /**
   * Get template details including layouts
   */
  async getTemplateDetails(templateId: string): Promise<WorkbotsTemplateDetails> {
    const response = await fetch(
      `${this.apiUrl}/api/v1/ppt/template-management/get-layouts?presentation_id=${templateId}`,
      {
        method: "GET",
        headers: this.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch template details: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get built-in layouts
   */
  async getBuiltInLayouts(): Promise<string[]> {
    const response = await fetch(`${this.apiUrl}/api/v1/ppt/layouts/`, {
      method: "GET",
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch layouts: ${response.statusText}`);
    }

    const data = await response.json();
    return Object.keys(data);
  }

  // ===========================================
  // Presentation Generation
  // ===========================================

  /**
   * Generate a presentation synchronously
   */
  async generatePresentation(
    request: WorkbotsGenerateRequest
  ): Promise<WorkbotsGenerateResponse> {
    const response = await fetch(
      `${this.apiUrl}/api/v1/ppt/presentation/generate`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          content: request.content,
          slides_markdown: request.slidesMarkdown,
          instructions: request.instructions,
          tone: request.tone || "professional",
          verbosity: request.verbosity || "standard",
          n_slides: request.nSlides || 10,
          language: request.language || "French",
          template: request.template || "general",
          web_search: request.webSearch || false,
          include_table_of_contents: request.includeTableOfContents || false,
          include_title_slide: request.includeTitleSlide !== false,
          files: request.files,
          export_as: request.exportAs || "pptx",
          trigger_webhook: false,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Failed to generate presentation: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      presentationId: data.presentation_id,
      path: data.path,
      editPath: data.edit_path,
    };
  }

  /**
   * Generate a presentation asynchronously
   */
  async generatePresentationAsync(
    request: WorkbotsGenerateRequest
  ): Promise<WorkbotsAsyncGenerateResponse> {
    const response = await fetch(
      `${this.apiUrl}/api/v1/ppt/presentation/generate/async`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          content: request.content,
          slides_markdown: request.slidesMarkdown,
          instructions: request.instructions,
          tone: request.tone || "professional",
          verbosity: request.verbosity || "standard",
          n_slides: request.nSlides || 10,
          language: request.language || "French",
          template: request.template || "general",
          web_search: request.webSearch || false,
          include_table_of_contents: request.includeTableOfContents || false,
          include_title_slide: request.includeTitleSlide !== false,
          files: request.files,
          export_as: request.exportAs || "pptx",
          trigger_webhook: false,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Failed to start generation: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Check generation status
   */
  async checkGenerationStatus(taskId: string): Promise<WorkbotsAsyncGenerateResponse> {
    const response = await fetch(
      `${this.apiUrl}/api/v1/ppt/presentation/status/${taskId}`,
      {
        method: "GET",
        headers: this.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to check status: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Wait for generation to complete
   */
  async waitForCompletion(
    taskId: string,
    onProgress?: (status: WorkbotsAsyncGenerateResponse) => void
  ): Promise<WorkbotsAsyncGenerateResponse> {
    let attempts = 0;

    while (attempts < MAX_POLL_ATTEMPTS) {
      const status = await this.checkGenerationStatus(taskId);

      if (onProgress) {
        onProgress(status);
      }

      if (status.status === "completed" || status.status === "error") {
        return status;
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      attempts++;
    }

    throw new Error("Generation timed out");
  }

  // ===========================================
  // Module-based Generation (for Formations)
  // ===========================================

  /**
   * Generate slides for a single module
   */
  async generateModuleSlides(
    moduleTitle: string,
    moduleContent: string,
    options: {
      objectives?: string;
      nSlides?: number;
      tone?: WorkbotsTone;
      verbosity?: WorkbotsVerbosity;
      language?: string;
      template?: string;
      exportAs?: WorkbotsExportFormat;
    } = {}
  ): Promise<WorkbotsGenerateResponse> {
    // Build content with objectives if provided
    let content = `# ${moduleTitle}\n\n${moduleContent}`;
    if (options.objectives) {
      content += `\n\n## Objectifs pédagogiques\n${options.objectives}`;
    }

    return await this.generatePresentation({
      content,
      nSlides: options.nSlides || 10,
      tone: options.tone || "educational",
      verbosity: options.verbosity || "standard",
      language: options.language || "French",
      template: options.template || "general",
      exportAs: options.exportAs || "pptx",
      includeTitleSlide: true,
    });
  }

  // ===========================================
  // Presentation Management
  // ===========================================

  /**
   * Get a presentation by ID
   */
  async getPresentation(presentationId: string): Promise<WorkbotsPresentation> {
    const response = await fetch(
      `${this.apiUrl}/api/v1/ppt/presentation/${presentationId}`,
      {
        method: "GET",
        headers: this.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch presentation: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Export a presentation
   */
  async exportPresentation(
    presentationId: string,
    format: WorkbotsExportFormat = "pptx"
  ): Promise<WorkbotsGenerateResponse> {
    const response = await fetch(
      `${this.apiUrl}/api/v1/ppt/presentation/export`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          id: presentationId,
          export_as: format,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to export presentation: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      presentationId: data.presentation_id,
      path: data.path,
      editPath: data.edit_path,
    };
  }

  /**
   * Delete a presentation
   */
  async deletePresentation(presentationId: string): Promise<void> {
    const response = await fetch(
      `${this.apiUrl}/api/v1/ppt/presentation/${presentationId}`,
      {
        method: "DELETE",
        headers: this.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete presentation: ${response.statusText}`);
    }
  }

  // ===========================================
  // File Upload
  // ===========================================

  /**
   * Upload files for context
   */
  async uploadFiles(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch(`${this.apiUrl}/api/v1/ppt/files/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload files: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Export a singleton instance
export const workbotsClient = new WorkbotsClient();
