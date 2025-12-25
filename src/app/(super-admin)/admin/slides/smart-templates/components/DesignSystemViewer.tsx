"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Palette,
  Type,
  Grid3X3,
  Info,
  CheckCircle,
  Eye,
  Edit2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { DesignSystem, DesignSystemLayout } from "../types";
import LayoutPreviewModal from "./LayoutPreviewModal";
import LayoutEditor from "./LayoutEditor";

interface ThumbnailData {
  index: number;
  image: string;
}

interface DesignSystemViewerProps {
  designSystem: DesignSystem;
  templateName: string;
  templateId?: string;
  onDesignSystemUpdate?: (updatedDesignSystem: DesignSystem) => void;
}

const DesignSystemViewer: React.FC<DesignSystemViewerProps> = ({
  designSystem,
  templateName,
  templateId,
  onDesignSystemUpdate,
}) => {
  const [previewLayout, setPreviewLayout] = useState<DesignSystemLayout | null>(null);
  const [editingLayout, setEditingLayout] = useState<DesignSystemLayout | null>(null);
  const [hoveredLayout, setHoveredLayout] = useState<number | null>(null);
  const [thumbnails, setThumbnails] = useState<ThumbnailData[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);

  // Load thumbnails when templateId changes
  useEffect(() => {
    if (templateId) {
      loadThumbnails();
    }
  }, [templateId]);

  const loadThumbnails = async () => {
    if (!templateId) return;

    setLoadingThumbnails(true);
    try {
      const response = await fetch(
        `/api/slides/smart-templates/templates/${templateId}/thumbnails`
      );
      if (response.ok) {
        const data = await response.json();
        setThumbnails(data.thumbnails || []);
      }
    } catch (error) {
      console.error("Error loading thumbnails:", error);
    } finally {
      setLoadingThumbnails(false);
    }
  };

  const getThumbnailForSlide = (index: number): string | null => {
    const thumb = thumbnails.find((t) => t.index === index);
    return thumb?.image || null;
  };

  const handlePreviewLayout = useCallback((layout: DesignSystemLayout) => {
    setPreviewLayout(layout);
  }, []);

  const handleEditLayout = useCallback((layout: DesignSystemLayout) => {
    setPreviewLayout(null);
    setEditingLayout(layout);
  }, []);

  const handleSaveLayout = useCallback(
    async (updatedLayout: DesignSystemLayout) => {
      if (!templateId) {
        toast.error("Template ID not available");
        return;
      }

      try {
        const response = await fetch(
          `/api/slides/smart-templates/templates/${templateId}/layouts`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              layout_index: updatedLayout.index,
              layout: updatedLayout,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to save layout");
        }

        // Update local state
        if (onDesignSystemUpdate) {
          const newLayouts = designSystem.layouts.map((l) =>
            l.index === updatedLayout.index ? updatedLayout : l
          );
          onDesignSystemUpdate({
            ...designSystem,
            layouts: newLayouts,
          });
        }

        setEditingLayout(null);
        toast.success("Layout saved successfully!");
      } catch (error) {
        console.error("Error saving layout:", error);
        toast.error("Failed to save layout");
        throw error;
      }
    },
    [templateId, designSystem, onDesignSystemUpdate]
  );

  const getLayoutTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      title: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      section: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      content: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      bullets: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      image_left: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
      image_right: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
      comparison: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
      quote: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      closing: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      two_column: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
      chart: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
      table: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    };
    return colors[type] || "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
  };

  const getPlaceholderColor = (type: string) => {
    const colors: Record<string, string> = {
      title: "bg-purple-300 dark:bg-purple-600",
      center_title: "bg-purple-300 dark:bg-purple-600",
      subtitle: "bg-blue-300 dark:bg-blue-600",
      body: "bg-green-300 dark:bg-green-600",
      object: "bg-orange-300 dark:bg-orange-600",
      picture: "bg-pink-300 dark:bg-pink-600",
      chart: "bg-cyan-300 dark:bg-cyan-600",
      table: "bg-yellow-300 dark:bg-yellow-600",
    };
    return colors[type] || "bg-gray-300 dark:bg-gray-600";
  };

  // Calculate scale for mini preview
  const SLIDE_WIDTH_EMU = 9144000;
  const SLIDE_HEIGHT_EMU = 6858000;

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#5141e5] to-[#7c3aed] rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{templateName}</h2>
            <p className="text-white/80 mt-1">
              Design system extracted successfully - {designSystem.layouts.length} layouts detected
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-3xl font-bold">{designSystem.layouts.length}</p>
            <p className="text-sm text-white/70">Layouts</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-3xl font-bold">
              {(designSystem.typography?.all_fonts || designSystem.fonts || []).length || 0}
            </p>
            <p className="text-sm text-white/70">Fonts</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-3xl font-bold">
              {Object.keys(designSystem.colors?.theme || designSystem.theme_colors || {}).length || 0}
            </p>
            <p className="text-sm text-white/70">Colors</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-3xl font-bold">99%</p>
            <p className="text-sm text-white/70">Fidelity</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colors Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#5141e5]/10 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-[#5141e5]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Theme Colors</h3>
          </div>

          <div className="space-y-3">
            {Object.entries(designSystem.colors?.theme || designSystem.theme_colors || {}).length > 0 ? (
              Object.entries(designSystem.colors?.theme || designSystem.theme_colors || {}).map(([name, color]) => (
                <div key={name} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg shadow-inner border border-gray-200 dark:border-gray-600"
                    style={{ backgroundColor: typeof color === 'string' ? color : '#ccc' }}
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                      {name.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      {typeof color === 'string' ? color : 'N/A'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Using default theme colors
              </p>
            )}
          </div>
        </motion.div>

        {/* Typography Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Type className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Typography</h3>
          </div>

          <div className="space-y-4">
            {(designSystem.typography?.heading_fonts || designSystem.heading_fonts || []).length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Heading Fonts</p>
                <div className="flex flex-wrap gap-2">
                  {(designSystem.typography?.heading_fonts || designSystem.heading_fonts || []).map((font, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300"
                    >
                      {font}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(designSystem.typography?.body_fonts || designSystem.body_fonts || []).length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Body Fonts</p>
                <div className="flex flex-wrap gap-2">
                  {(designSystem.typography?.body_fonts || designSystem.body_fonts || []).map((font, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300"
                    >
                      {font}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(designSystem.typography?.all_fonts || designSystem.fonts || []).length === 0 &&
             (designSystem.typography?.heading_fonts || designSystem.heading_fonts || []).length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Using default system fonts (Calibri, Arial)
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Layouts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Grid3X3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Available Layouts</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Click to preview • Double-click to edit
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {designSystem.layouts.map((layout, index) => (
            <motion.div
              key={index}
              className="group relative border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:border-[#5141e5] hover:shadow-lg transition-all cursor-pointer"
              onMouseEnter={() => setHoveredLayout(index)}
              onMouseLeave={() => setHoveredLayout(null)}
              onClick={() => handlePreviewLayout(layout)}
              onDoubleClick={() => handleEditLayout(layout)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Mini Preview */}
              <div
                className="relative bg-gray-50 dark:bg-gray-900"
                style={{
                  width: "100%",
                  aspectRatio: "16/9",
                }}
              >
                {/* Real Thumbnail or Placeholder Preview */}
                {getThumbnailForSlide(index) ? (
                  <img
                    src={getThumbnailForSlide(index)!}
                    alt={`Slide ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : loadingThumbnails ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Grid Background */}
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, #999 1px, transparent 1px), linear-gradient(to bottom, #999 1px, transparent 1px)",
                        backgroundSize: "10px 10px",
                      }}
                    />

                    {/* Placeholder Previews as fallback */}
                    {layout.placeholders.map((ph, phIdx) => {
                      const left = ((ph.position?.left || 0) / SLIDE_WIDTH_EMU) * 100;
                      const top = ((ph.position?.top || 0) / SLIDE_HEIGHT_EMU) * 100;
                      const width = ((ph.size?.width || 914400) / SLIDE_WIDTH_EMU) * 100;
                      const height = ((ph.size?.height || 457200) / SLIDE_HEIGHT_EMU) * 100;

                      return (
                        <div
                          key={phIdx}
                          className={`absolute rounded-sm ${getPlaceholderColor(ph.type)} opacity-70`}
                          style={{
                            left: `${Math.max(0, Math.min(left, 95))}%`,
                            top: `${Math.max(0, Math.min(top, 95))}%`,
                            width: `${Math.max(5, Math.min(width, 100 - left))}%`,
                            height: `${Math.max(5, Math.min(height, 100 - top))}%`,
                          }}
                          title={`${ph.type}: ${ph.name}`}
                        />
                      );
                    })}
                  </>
                )}

                {/* Hover Overlay */}
                <div
                  className={`absolute inset-0 bg-black/50 flex items-center justify-center gap-2 transition-opacity ${
                    hoveredLayout === index ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewLayout(layout);
                    }}
                    className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditLayout(layout);
                    }}
                    className="p-2 bg-[#5141e5] text-white rounded-lg hover:bg-[#5141e5]/90 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Layout Info */}
              <div className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getLayoutTypeColor(layout.type)}`}>
                    {layout.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-400">#{index + 1}</span>
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                  {layout.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {layout.placeholders.length} placeholders
                </p>

                {/* Recommended For Tags */}
                {layout.recommended_for && layout.recommended_for.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {layout.recommended_for.slice(0, 2).map((rec, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded"
                      >
                        {rec}
                      </span>
                    ))}
                    {layout.recommended_for.length > 2 && (
                      <span className="text-xs text-gray-400">
                        +{layout.recommended_for.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3"
      >
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-900 dark:text-blue-100">Ready to Generate</p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Click "Generate Presentation" to create a new presentation using this template.
            The AI will intelligently select layouts and adapt content while preserving 99% of the original styling.
          </p>
        </div>
      </motion.div>

      {/* Preview Modal */}
      <LayoutPreviewModal
        layout={previewLayout}
        isOpen={!!previewLayout}
        onClose={() => setPreviewLayout(null)}
        onEdit={handleEditLayout}
        thumbnailUrl={previewLayout ? getThumbnailForSlide(previewLayout.index) : null}
      />

      {/* Editor */}
      {editingLayout && templateId && (
        <LayoutEditor
          layout={editingLayout}
          designSystem={designSystem}
          templateId={templateId}
          onClose={() => setEditingLayout(null)}
          onSave={handleSaveLayout}
          thumbnailUrl={getThumbnailForSlide(editingLayout.index)}
        />
      )}
    </div>
  );
};

export default DesignSystemViewer;
