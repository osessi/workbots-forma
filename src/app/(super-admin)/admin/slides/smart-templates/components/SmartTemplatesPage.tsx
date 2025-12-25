"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Wrapper from "@/components/slides/Wrapper";
import { OverlayLoader } from "@/components/slides/ui/overlay-loader";
import { toast } from "sonner";
import TemplateUploader from "./TemplateUploader";
import TemplateGallery from "./TemplateGallery";
import DesignSystemViewer from "./DesignSystemViewer";
import GenerationInterface from "./GenerationInterface";
import { SmartTemplate, DesignSystem } from "../types";

type ViewMode = "gallery" | "upload" | "design-system" | "generate";

const SmartTemplatesPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");
  const [templates, setTemplates] = useState<SmartTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SmartTemplate | null>(null);
  const [designSystem, setDesignSystem] = useState<DesignSystem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Fetch templates on mount
  React.useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/slides/smart-templates/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const handleTemplateUploaded = useCallback(async (templateId: string, designSystemData: DesignSystem) => {
    setDesignSystem(designSystemData);
    await fetchTemplates();

    // Find the newly uploaded template
    const newTemplate = templates.find(t => t.id === templateId) || {
      id: templateId,
      name: designSystemData.name,
      slide_count: designSystemData.slide_count,
      category: "custom",
      created_at: new Date().toISOString(),
    };

    setSelectedTemplate(newTemplate as SmartTemplate);
    setViewMode("design-system");
    toast.success("Template analysed successfully!");
  }, [templates]);

  const handleSelectTemplate = useCallback(async (template: SmartTemplate) => {
    setSelectedTemplate(template);
    setIsLoading(true);
    setLoadingMessage("Loading design system...");

    try {
      const response = await fetch(`/api/slides/smart-templates/templates/${template.id}`);
      if (response.ok) {
        const data = await response.json();
        setDesignSystem(data);
        setViewMode("design-system");
      } else {
        throw new Error("Failed to load design system");
      }
    } catch (error) {
      toast.error("Failed to load template design system");
      console.error(error);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  }, []);

  const handleStartGeneration = useCallback(() => {
    if (!selectedTemplate || !designSystem) {
      toast.error("Please select a template first");
      return;
    }
    setViewMode("generate");
  }, [selectedTemplate, designSystem]);

  const handleBackToGallery = useCallback(() => {
    setViewMode("gallery");
    setSelectedTemplate(null);
    setDesignSystem(null);
  }, []);

  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    try {
      const response = await fetch(`/api/slides/smart-templates/templates/${templateId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Template supprimé avec succès");
        // Refresh templates list
        await fetchTemplates();
      } else {
        throw new Error("Failed to delete template");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression du template");
      throw error;
    }
  }, []);

  return (
    <Wrapper className="pb-10">
      <OverlayLoader
        show={isLoading}
        text={loadingMessage}
        showProgress={true}
        duration={30}
      />

      {/* Header */}
      <div className="py-6 border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-instrument_sans">
              Smart Templates
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Import PPTX templates and generate presentations with 99% style fidelity
            </p>
          </div>

          <div className="flex items-center gap-3">
            {viewMode !== "gallery" && (
              <button
                onClick={handleBackToGallery}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Back to Gallery
              </button>
            )}

            {viewMode === "gallery" && (
              <button
                onClick={() => setViewMode("upload")}
                className="px-4 py-2 bg-[#5141e5] text-white rounded-lg hover:bg-[#5141e5]/90 transition-colors font-medium"
              >
                Upload Template
              </button>
            )}

            {viewMode === "design-system" && selectedTemplate && (
              <button
                onClick={handleStartGeneration}
                className="px-6 py-2 bg-[#5141e5] text-white rounded-lg hover:bg-[#5141e5]/90 transition-colors font-medium"
              >
                Generate Presentation
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      <AnimatePresence mode="wait">
        {viewMode === "gallery" && (
          <motion.div
            key="gallery"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TemplateGallery
              templates={templates}
              onSelectTemplate={handleSelectTemplate}
              onUploadClick={() => setViewMode("upload")}
              onDeleteTemplate={handleDeleteTemplate}
            />
          </motion.div>
        )}

        {viewMode === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TemplateUploader
              onTemplateUploaded={handleTemplateUploaded}
              onCancel={() => setViewMode("gallery")}
            />
          </motion.div>
        )}

        {viewMode === "design-system" && designSystem && (
          <motion.div
            key="design-system"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <DesignSystemViewer
              designSystem={designSystem}
              templateName={selectedTemplate?.name || "Template"}
              templateId={selectedTemplate?.id}
              onDesignSystemUpdate={setDesignSystem}
            />
          </motion.div>
        )}

        {viewMode === "generate" && selectedTemplate && designSystem && (
          <motion.div
            key="generate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GenerationInterface
              template={selectedTemplate}
              designSystem={designSystem}
              onBack={() => setViewMode("design-system")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Wrapper>
  );
};

export default SmartTemplatesPage;
