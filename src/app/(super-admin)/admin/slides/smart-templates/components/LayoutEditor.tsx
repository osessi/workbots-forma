"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Save,
  Plus,
  Trash2,
  Move,
  Maximize2,
  Type,
  Image,
  BarChart3,
  Table,
  AlignLeft,
  GripVertical,
  RotateCcw,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { DesignSystemLayout, DesignSystem, PlaceholderInfo } from "../types";

interface LayoutEditorProps {
  layout: DesignSystemLayout;
  designSystem: DesignSystem;
  templateId: string;
  onClose: () => void;
  onSave: (updatedLayout: DesignSystemLayout) => Promise<void>;
  thumbnailUrl?: string | null;
}

// Use PlaceholderInfo from types.ts for consistency
type Placeholder = PlaceholderInfo;

const PLACEHOLDER_TYPES = [
  { type: "title", label: "Title", icon: Type },
  { type: "subtitle", label: "Subtitle", icon: Type },
  { type: "body", label: "Body Text", icon: AlignLeft },
  { type: "picture", label: "Image", icon: Image },
  { type: "chart", label: "Chart", icon: BarChart3 },
  { type: "table", label: "Table", icon: Table },
];

const LayoutEditor: React.FC<LayoutEditorProps> = ({
  layout,
  designSystem,
  templateId,
  onClose,
  onSave,
  thumbnailUrl,
}) => {
  const [editedLayout, setEditedLayout] = useState<DesignSystemLayout>({
    ...layout,
    placeholders: layout.placeholders.map(ph => ({
      ...ph,
      position: ph.position || { left: 457200, top: 274638 },
      size: ph.size || { width: 8229600, height: 1143000 },
    })),
  });
  const [selectedPlaceholder, setSelectedPlaceholder] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Canvas dimensions
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 450;
  const SLIDE_WIDTH_EMU = 9144000;
  const SLIDE_HEIGHT_EMU = 6858000;

  const scaleToCanvas = useCallback((emu: number, isWidth: boolean) => {
    return isWidth
      ? (emu / SLIDE_WIDTH_EMU) * CANVAS_WIDTH
      : (emu / SLIDE_HEIGHT_EMU) * CANVAS_HEIGHT;
  }, []);

  const scaleToEMU = useCallback((px: number, isWidth: boolean) => {
    return isWidth
      ? (px / CANVAS_WIDTH) * SLIDE_WIDTH_EMU
      : (px / CANVAS_HEIGHT) * SLIDE_HEIGHT_EMU;
  }, []);

  const getPlaceholderColor = (type: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      title: { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-700" },
      center_title: { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-700" },
      subtitle: { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-700" },
      body: { bg: "bg-green-100", border: "border-green-400", text: "text-green-700" },
      object: { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-700" },
      picture: { bg: "bg-pink-100", border: "border-pink-400", text: "text-pink-700" },
      chart: { bg: "bg-cyan-100", border: "border-cyan-400", text: "text-cyan-700" },
      table: { bg: "bg-yellow-100", border: "border-yellow-400", text: "text-yellow-700" },
    };
    return colors[type] || { bg: "bg-gray-100", border: "border-gray-400", text: "text-gray-700" };
  };

  const handlePlaceholderDrag = useCallback(
    (index: number, deltaX: number, deltaY: number) => {
      setEditedLayout((prev) => {
        const newPlaceholders = [...prev.placeholders];
        const ph = newPlaceholders[index];
        if (ph.position) {
          ph.position = {
            left: Math.max(0, ph.position.left + scaleToEMU(deltaX, true)),
            top: Math.max(0, ph.position.top + scaleToEMU(deltaY, false)),
          };
        }
        return { ...prev, placeholders: newPlaceholders };
      });
      setHasChanges(true);
    },
    [scaleToEMU]
  );

  const handlePlaceholderResize = useCallback(
    (index: number, deltaWidth: number, deltaHeight: number) => {
      setEditedLayout((prev) => {
        const newPlaceholders = [...prev.placeholders];
        const ph = newPlaceholders[index];
        if (ph.size) {
          ph.size = {
            width: Math.max(914400, ph.size.width + scaleToEMU(deltaWidth, true)),
            height: Math.max(457200, ph.size.height + scaleToEMU(deltaHeight, false)),
          };
        }
        return { ...prev, placeholders: newPlaceholders };
      });
      setHasChanges(true);
    },
    [scaleToEMU]
  );

  const addPlaceholder = useCallback((type: string) => {
    setEditedLayout((prev) => {
      const newPlaceholder: Placeholder = {
        idx: prev.placeholders.length,
        type,
        name: `New ${type}`,
        position: { left: 914400, top: 914400 },
        size: { width: 4572000, height: 1143000 },
        max_chars: 500,
        max_lines: 5,
      };
      return {
        ...prev,
        placeholders: [...prev.placeholders, newPlaceholder],
      };
    });
    setSelectedPlaceholder(editedLayout.placeholders.length);
    setHasChanges(true);
  }, [editedLayout.placeholders.length]);

  const deletePlaceholder = useCallback((index: number) => {
    setEditedLayout((prev) => ({
      ...prev,
      placeholders: prev.placeholders.filter((_, i) => i !== index),
    }));
    setSelectedPlaceholder(null);
    setHasChanges(true);
  }, []);

  const duplicatePlaceholder = useCallback((index: number) => {
    setEditedLayout((prev) => {
      const ph = prev.placeholders[index];
      const newPlaceholder: Placeholder = {
        ...ph,
        idx: prev.placeholders.length,
        name: `${ph.name || ph.type} (copy)`,
        position: {
          left: (ph.position?.left || 0) + 457200,
          top: (ph.position?.top || 0) + 457200,
        },
      };
      return {
        ...prev,
        placeholders: [...prev.placeholders, newPlaceholder],
      };
    });
    setHasChanges(true);
  }, []);

  const updatePlaceholderProperty = useCallback(
    (index: number, property: string, value: string | number) => {
      setEditedLayout((prev) => {
        const newPlaceholders = [...prev.placeholders];
        (newPlaceholders[index] as unknown as Record<string, unknown>)[property] = value;
        return { ...prev, placeholders: newPlaceholders };
      });
      setHasChanges(true);
    },
    []
  );

  const resetLayout = useCallback(() => {
    setEditedLayout({
      ...layout,
      placeholders: layout.placeholders.map(ph => ({
        ...ph,
        position: ph.position || { left: 457200, top: 274638 },
        size: ph.size || { width: 8229600, height: 1143000 },
      })),
    });
    setHasChanges(false);
    setSelectedPlaceholder(null);
  }, [layout]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedLayout);
      setHasChanges(false);
      toast.success("Layout saved successfully!");
    } catch (error) {
      toast.error("Failed to save layout");
    } finally {
      setIsSaving(false);
    }
  };

  // Draggable placeholder component
  const DraggablePlaceholder: React.FC<{
    placeholder: Placeholder;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
  }> = ({ placeholder, index, isSelected, onSelect }) => {
    const dragStartPos = useRef({ x: 0, y: 0 });
    const resizeStartPos = useRef({ x: 0, y: 0 });
    const colors = getPlaceholderColor(placeholder.type);

    const handleMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect();
      setIsDragging(true);
      dragStartPos.current = { x: e.clientX, y: e.clientY };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - dragStartPos.current.x;
        const deltaY = moveEvent.clientY - dragStartPos.current.y;
        handlePlaceholderDrag(index, deltaX, deltaY);
        dragStartPos.current = { x: moveEvent.clientX, y: moveEvent.clientY };
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    };

    const handleResizeMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsResizing(true);
      resizeStartPos.current = { x: e.clientX, y: e.clientY };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - resizeStartPos.current.x;
        const deltaY = moveEvent.clientY - resizeStartPos.current.y;
        handlePlaceholderResize(index, deltaX, deltaY);
        resizeStartPos.current = { x: moveEvent.clientX, y: moveEvent.clientY };
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    };

    const left = scaleToCanvas(placeholder.position?.left || 0, true);
    const top = scaleToCanvas(placeholder.position?.top || 0, false);
    const width = scaleToCanvas(placeholder.size?.width || 914400, true);
    const height = scaleToCanvas(placeholder.size?.height || 457200, false);

    return (
      <div
        className={`absolute border-2 ${colors.border} ${colors.bg} rounded cursor-move transition-shadow ${
          isSelected ? "ring-2 ring-[#5141e5] ring-offset-2 shadow-lg" : "hover:shadow-md"
        }`}
        style={{
          left: `${left}px`,
          top: `${top}px`,
          width: `${Math.max(width, 40)}px`,
          height: `${Math.max(height, 30)}px`,
        }}
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {/* Drag handle */}
        <div className="absolute top-1 left-1">
          <GripVertical className={`w-4 h-4 ${colors.text} opacity-50`} />
        </div>

        {/* Label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-medium ${colors.text} px-1 truncate`}>
            {placeholder.type}
          </span>
        </div>

        {/* Resize handle */}
        {isSelected && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-[#5141e5] rounded-tl cursor-se-resize"
            onMouseDown={handleResizeMouseDown}
          >
            <Maximize2 className="w-3 h-3 text-white m-0.5" />
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex bg-gray-100 dark:bg-gray-900"
    >
      {/* Left Panel - Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Edit Layout: {editedLayout.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Drag placeholders to reposition, resize with bottom-right handle
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-sm text-orange-600 dark:text-orange-400">
                Unsaved changes
              </span>
            )}
            <button
              onClick={resetLayout}
              disabled={!hasChanges}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-[#5141e5] text-white rounded-lg hover:bg-[#5141e5]/90 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <div
            ref={canvasRef}
            className="relative bg-white shadow-2xl rounded-lg overflow-hidden"
            style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
            onClick={() => setSelectedPlaceholder(null)}
          >
            {/* Real Slide Image as Background */}
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={editedLayout.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              /* Grid as fallback */
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />
            )}

            {/* Semi-transparent overlay for better placeholder visibility when image is present */}
            {thumbnailUrl && (
              <div className="absolute inset-0 bg-black/10" />
            )}

            {/* Placeholders */}
            {editedLayout.placeholders.map((ph, idx) => (
              <DraggablePlaceholder
                key={idx}
                placeholder={ph}
                index={idx}
                isSelected={selectedPlaceholder === idx}
                onSelect={() => setSelectedPlaceholder(idx)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Properties */}
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Add Placeholder */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Add Placeholder
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {PLACEHOLDER_TYPES.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => addPlaceholder(type)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-[#5141e5] hover:bg-[#5141e5]/5 transition-colors"
              >
                <Icon className="w-5 h-5 text-gray-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Placeholder Properties */}
        {selectedPlaceholder !== null && editedLayout.placeholders[selectedPlaceholder] && (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Placeholder Properties
              </h3>
              <div className="flex gap-1">
                <button
                  onClick={() => duplicatePlaceholder(selectedPlaceholder)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => deletePlaceholder(selectedPlaceholder)}
                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Type
                </label>
                <select
                  value={editedLayout.placeholders[selectedPlaceholder].type}
                  onChange={(e) =>
                    updatePlaceholderProperty(selectedPlaceholder, "type", e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {PLACEHOLDER_TYPES.map(({ type, label }) => (
                    <option key={type} value={type}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editedLayout.placeholders[selectedPlaceholder].name || ""}
                  onChange={(e) =>
                    updatePlaceholderProperty(selectedPlaceholder, "name", e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Position (inches)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400">Left</label>
                    <input
                      type="number"
                      step="0.1"
                      value={(
                        (editedLayout.placeholders[selectedPlaceholder].position?.left || 0) / 914400
                      ).toFixed(2)}
                      onChange={(e) => {
                        const newLeft = parseFloat(e.target.value) * 914400;
                        setEditedLayout((prev) => {
                          const newPlaceholders = [...prev.placeholders];
                          newPlaceholders[selectedPlaceholder].position = {
                            ...newPlaceholders[selectedPlaceholder].position,
                            left: newLeft,
                            top: newPlaceholders[selectedPlaceholder].position?.top || 0,
                          };
                          return { ...prev, placeholders: newPlaceholders };
                        });
                        setHasChanges(true);
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Top</label>
                    <input
                      type="number"
                      step="0.1"
                      value={(
                        (editedLayout.placeholders[selectedPlaceholder].position?.top || 0) / 914400
                      ).toFixed(2)}
                      onChange={(e) => {
                        const newTop = parseFloat(e.target.value) * 914400;
                        setEditedLayout((prev) => {
                          const newPlaceholders = [...prev.placeholders];
                          newPlaceholders[selectedPlaceholder].position = {
                            left: newPlaceholders[selectedPlaceholder].position?.left || 0,
                            top: newTop,
                          };
                          return { ...prev, placeholders: newPlaceholders };
                        });
                        setHasChanges(true);
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Size */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Size (inches)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400">Width</label>
                    <input
                      type="number"
                      step="0.1"
                      value={(
                        (editedLayout.placeholders[selectedPlaceholder].size?.width || 0) / 914400
                      ).toFixed(2)}
                      onChange={(e) => {
                        const newWidth = parseFloat(e.target.value) * 914400;
                        setEditedLayout((prev) => {
                          const newPlaceholders = [...prev.placeholders];
                          newPlaceholders[selectedPlaceholder].size = {
                            ...newPlaceholders[selectedPlaceholder].size,
                            width: newWidth,
                            height: newPlaceholders[selectedPlaceholder].size?.height || 914400,
                          };
                          return { ...prev, placeholders: newPlaceholders };
                        });
                        setHasChanges(true);
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Height</label>
                    <input
                      type="number"
                      step="0.1"
                      value={(
                        (editedLayout.placeholders[selectedPlaceholder].size?.height || 0) / 914400
                      ).toFixed(2)}
                      onChange={(e) => {
                        const newHeight = parseFloat(e.target.value) * 914400;
                        setEditedLayout((prev) => {
                          const newPlaceholders = [...prev.placeholders];
                          newPlaceholders[selectedPlaceholder].size = {
                            width: newPlaceholders[selectedPlaceholder].size?.width || 914400,
                            height: newHeight,
                          };
                          return { ...prev, placeholders: newPlaceholders };
                        });
                        setHasChanges(true);
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Max Content */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Content Limits
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400">Max Chars</label>
                    <input
                      type="number"
                      value={editedLayout.placeholders[selectedPlaceholder].max_chars || ""}
                      onChange={(e) =>
                        updatePlaceholderProperty(
                          selectedPlaceholder,
                          "max_chars",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Max Lines</label>
                    <input
                      type="number"
                      value={editedLayout.placeholders[selectedPlaceholder].max_lines || ""}
                      onChange={(e) =>
                        updatePlaceholderProperty(
                          selectedPlaceholder,
                          "max_lines",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Selection */}
        {selectedPlaceholder === null && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center text-gray-400">
              <Move className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Select a placeholder to edit</p>
              <p className="text-xs mt-1">or add a new one above</p>
            </div>
          </div>
        )}

        {/* Placeholder List */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            All Placeholders ({editedLayout.placeholders.length})
          </h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {editedLayout.placeholders.map((ph, idx) => {
              const colors = getPlaceholderColor(ph.type);
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedPlaceholder(idx)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                    selectedPlaceholder === idx
                      ? "bg-[#5141e5]/10 text-[#5141e5]"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className={`w-3 h-3 rounded ${colors.bg} ${colors.border} border`} />
                  <span className="text-sm truncate flex-1">{ph.name || ph.type}</span>
                  <span className="text-xs text-gray-400">#{idx + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LayoutEditor;
