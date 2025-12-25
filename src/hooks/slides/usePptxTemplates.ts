/**
 * usePptxTemplates - React Hook for PPTX Template Management
 *
 * Provides a complete interface for:
 * - Listing available templates
 * - Uploading new templates
 * - Generating presentations from templates
 * - Downloading generated files
 */

import { useState, useCallback } from 'react';

export interface PptxTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  slide_count: number;
  thumbnail_url?: string;
  is_system: boolean;
  created_at: string;
}

export interface PptxTemplateDetail extends PptxTemplate {
  placeholder_mapping: PlaceholderMapping[];
  slide_layouts: Record<string, number>;
  fonts: string[];
  theme_colors: Record<string, string>;
}

export interface PlaceholderMapping {
  slide_index: number;
  shape_id: number;
  shape_name: string;
  placeholder_type: string;
  position: { left: number; top: number };
  size: { width: number; height: number };
  default_text: string;
}

export interface SlideContent {
  title?: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  image?: {
    url: string;
    prompt?: string;
  };
  speaker_notes?: string;
}

export interface GenerateOptions {
  preserveFonts?: boolean;
  preserveColors?: boolean;
}

interface UsePptxTemplatesReturn {
  // State
  templates: PptxTemplate[];
  selectedTemplate: PptxTemplateDetail | null;
  isLoading: boolean;
  isUploading: boolean;
  isGenerating: boolean;
  error: string | null;

  // Actions
  fetchTemplates: (category?: string) => Promise<void>;
  fetchTemplateDetails: (templateId: string) => Promise<PptxTemplateDetail | null>;
  uploadTemplate: (file: File, name: string, description?: string, category?: string) => Promise<string | null>;
  generateFromTemplate: (templateId: string, slides: SlideContent[], filename?: string, options?: GenerateOptions) => Promise<string | null>;
  downloadGenerated: (filePath: string, filename?: string) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<boolean>;
  clearError: () => void;
}

export function usePptxTemplates(): UsePptxTemplatesReturn {
  const [templates, setTemplates] = useState<PptxTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PptxTemplateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Fetch all available templates
   */
  const fetchTemplates = useCallback(async (category?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      let url = '/api/slides/pptx-templates';
      if (category) {
        url += `?category=${encodeURIComponent(category)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch templates');
      }

      setTemplates(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch templates';
      setError(message);
      console.error('Error fetching templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch detailed information about a specific template
   */
  const fetchTemplateDetails = useCallback(async (templateId: string): Promise<PptxTemplateDetail | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/slides/pptx-templates/${templateId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch template details');
      }

      setSelectedTemplate(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch template details';
      setError(message);
      console.error('Error fetching template details:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Upload a new PPTX template
   */
  const uploadTemplate = useCallback(async (
    file: File,
    name: string,
    description?: string,
    category: string = 'general'
  ): Promise<string | null> => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      if (description) {
        formData.append('description', description);
      }
      formData.append('category', category);

      const response = await fetch('/api/slides/pptx-templates', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload template');
      }

      // Refresh the templates list
      await fetchTemplates();

      return data.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload template';
      setError(message);
      console.error('Error uploading template:', err);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [fetchTemplates]);

  /**
   * Generate a presentation from a template
   */
  const generateFromTemplate = useCallback(async (
    templateId: string,
    slides: SlideContent[],
    filename?: string,
    options?: GenerateOptions
  ): Promise<string | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/slides/pptx-templates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: templateId,
          slides,
          output_filename: filename,
          options,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate presentation');
      }

      return data.download_url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate presentation';
      setError(message);
      console.error('Error generating presentation:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Download a generated PPTX file
   */
  const downloadGenerated = useCallback(async (filePath: string, filename?: string) => {
    try {
      const response = await fetch(`/api/slides/pptx-templates/download?path=${encodeURIComponent(filePath)}`);

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || filePath.split('/').pop() || 'presentation.pptx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to download file';
      setError(message);
      console.error('Error downloading file:', err);
    }
  }, []);

  /**
   * Delete a template
   */
  const deleteTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    setError(null);

    try {
      const response = await fetch(`/api/slides/pptx-templates/${templateId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete template');
      }

      // Refresh the templates list
      await fetchTemplates();

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete template';
      setError(message);
      console.error('Error deleting template:', err);
      return false;
    }
  }, [fetchTemplates]);

  return {
    templates,
    selectedTemplate,
    isLoading,
    isUploading,
    isGenerating,
    error,
    fetchTemplates,
    fetchTemplateDetails,
    uploadTemplate,
    generateFromTemplate,
    downloadGenerated,
    deleteTemplate,
    clearError,
  };
}

export default usePptxTemplates;
