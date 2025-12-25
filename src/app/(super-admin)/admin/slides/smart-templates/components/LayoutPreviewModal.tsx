"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, Move, Maximize2 } from "lucide-react";
import { DesignSystemLayout } from "../types";

interface LayoutPreviewModalProps {
  layout: DesignSystemLayout | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (layout: DesignSystemLayout) => void;
  thumbnailUrl?: string | null;
}

const LayoutPreviewModal: React.FC<LayoutPreviewModalProps> = ({
  layout,
  isOpen,
  onClose,
  onEdit,
  thumbnailUrl,
}) => {
  if (!layout) return null;

  const getPlaceholderColor = (type: string) => {
    const colors: Record<string, string> = {
      title: "bg-purple-200 border-purple-400",
      center_title: "bg-purple-200 border-purple-400",
      subtitle: "bg-blue-200 border-blue-400",
      body: "bg-green-200 border-green-400",
      object: "bg-orange-200 border-orange-400",
      picture: "bg-pink-200 border-pink-400",
      chart: "bg-cyan-200 border-cyan-400",
      table: "bg-yellow-200 border-yellow-400",
      footer: "bg-gray-200 border-gray-400",
      date: "bg-gray-200 border-gray-400",
      slide_number: "bg-gray-200 border-gray-400",
    };
    return colors[type] || "bg-gray-200 border-gray-400";
  };

  // Calculate scale factor for preview
  const PREVIEW_WIDTH = 800;
  const PREVIEW_HEIGHT = 450;
  const SLIDE_WIDTH = 9144000; // EMU (10 inches)
  const SLIDE_HEIGHT = 6858000; // EMU (7.5 inches)
  const scaleX = PREVIEW_WIDTH / SLIDE_WIDTH;
  const scaleY = PREVIEW_HEIGHT / SLIDE_HEIGHT;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {layout.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Layout #{layout.index + 1} • Type: {layout.type.replace(/_/g, " ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(layout)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#5141e5] text-white rounded-lg hover:bg-[#5141e5]/90 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Layout
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Preview Area */}
            <div className="p-6">
              <div className="flex gap-6">
                {/* Slide Preview */}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Preview
                  </p>
                  <div
                    className="relative bg-white border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden"
                    style={{
                      width: PREVIEW_WIDTH,
                      height: PREVIEW_HEIGHT,
                      maxWidth: "100%",
                      aspectRatio: "16/9",
                    }}
                  >
                    {/* Real Slide Image */}
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={layout.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      /* Grid Background as fallback */
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage:
                            "linear-gradient(to right, #ccc 1px, transparent 1px), linear-gradient(to bottom, #ccc 1px, transparent 1px)",
                          backgroundSize: "20px 20px",
                        }}
                      />
                    )}

                    {/* Placeholders Overlay - only show if no thumbnail */}
                    {!thumbnailUrl && layout.placeholders.map((ph, idx) => {
                      const left = (ph.position?.left || 0) * scaleX;
                      const top = (ph.position?.top || 0) * scaleY;
                      const width = (ph.size?.width || 0) * scaleX;
                      const height = (ph.size?.height || 0) * scaleY;

                      return (
                        <div
                          key={idx}
                          className={`absolute border-2 border-dashed ${getPlaceholderColor(ph.type)} rounded flex items-center justify-center transition-all hover:scale-[1.02] cursor-pointer`}
                          style={{
                            left: `${(left / PREVIEW_WIDTH) * 100}%`,
                            top: `${(top / PREVIEW_HEIGHT) * 100}%`,
                            width: `${(width / PREVIEW_WIDTH) * 100}%`,
                            height: `${(height / PREVIEW_HEIGHT) * 100}%`,
                            minWidth: "30px",
                            minHeight: "20px",
                          }}
                          title={`${ph.type}: ${ph.name}`}
                        >
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-800 px-1 text-center truncate">
                            {ph.type}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Placeholder Details */}
                <div className="w-80 flex-shrink-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Editable Elements ({layout.placeholders.length})
                  </p>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {layout.placeholders.map((ph, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${getPlaceholderColor(ph.type)} cursor-pointer hover:shadow-md transition-all`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-gray-800">
                            {ph.type}
                          </span>
                          <div className="flex items-center gap-1">
                            {ph.is_static && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                                STATIC
                              </span>
                            )}
                            <span className="text-xs text-gray-500">#{idx + 1}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 truncate">{ph.name}</p>

                        {/* Current Text Content */}
                        {ph.current_text && (
                          <div className="mt-2 p-2 bg-white/60 rounded text-xs text-gray-700 line-clamp-2">
                            &quot;{ph.current_text}&quot;
                          </div>
                        )}

                        <div className="flex gap-2 mt-2 text-xs text-gray-500">
                          {ph.max_chars && (
                            <span>~{ph.max_chars} chars</span>
                          )}
                          {ph.max_lines && (
                            <span>~{ph.max_lines} lines</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommended For */}
              {layout.recommended_for && layout.recommended_for.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recommended for:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {layout.recommended_for.map((rec, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-[#5141e5]/10 text-[#5141e5] rounded-full text-sm"
                      >
                        {rec.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LayoutPreviewModal;
