"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Layout, Calendar, Layers, Trash2, X, AlertTriangle } from "lucide-react";
import { SmartTemplate } from "../types";

interface TemplateGalleryProps {
  templates: SmartTemplate[];
  onSelectTemplate: (template: SmartTemplate) => void;
  onUploadClick: () => void;
  onDeleteTemplate?: (templateId: string) => Promise<void>;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  templates,
  onSelectTemplate,
  onUploadClick,
  onDeleteTemplate,
}) => {
  const [templateToDelete, setTemplateToDelete] = useState<SmartTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent, template: SmartTemplate) => {
    e.stopPropagation();
    setTemplateToDelete(template);
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete || !onDeleteTemplate) return;

    setIsDeleting(true);
    try {
      await onDeleteTemplate(templateToDelete.id);
      setTemplateToDelete(null);
    } catch (error) {
      console.error("Error deleting template:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      business: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      education: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      creative: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      technology: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
      marketing: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      medical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      custom: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
      general: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    };
    return colors[category] || colors.general;
  };

  if (templates.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Layout className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No templates yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Upload your first PPTX template to start generating AI-powered presentations
          with your custom design.
        </p>
        <button
          onClick={onUploadClick}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#5141e5] text-white rounded-lg hover:bg-[#5141e5]/90 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Upload Your First Template
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#5141e5]/10 rounded-lg flex items-center justify-center">
              <Layout className="w-5 h-5 text-[#5141e5]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{templates.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Templates</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {templates.reduce((acc, t) => acc + t.slide_count, 0)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Layouts</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Set(templates.map(t => t.category)).size}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Categories</p>
            </div>
          </div>
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Add New Template Card */}
        <motion.button
          onClick={onUploadClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group aspect-[4/3] bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-[#5141e5] hover:bg-[#5141e5]/5 transition-all flex flex-col items-center justify-center"
        >
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 group-hover:bg-[#5141e5]/10 rounded-full flex items-center justify-center mb-4 transition-colors">
            <Plus className="w-8 h-8 text-gray-400 group-hover:text-[#5141e5] transition-colors" />
          </div>
          <p className="font-medium text-gray-600 dark:text-gray-400 group-hover:text-[#5141e5] transition-colors">
            Upload Template
          </p>
        </motion.button>

        {/* Template Cards */}
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <motion.div
              onClick={() => onSelectTemplate(template)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden text-left cursor-pointer"
            >
              {/* Template Preview */}
              <div className="aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 relative group/preview">
                {template.thumbnail_url ? (
                  <img
                    src={template.thumbnail_url}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Layout className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                  </div>
                )}

                {/* Category Badge */}
                <span className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                  {template.category}
                </span>

                {/* Delete Button */}
                {onDeleteTemplate && (
                  <button
                    onClick={(e) => handleDeleteClick(e, template)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity shadow-lg"
                    title="Supprimer le template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Template Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {template.name}
                </h3>
                {template.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {template.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {template.slide_count} layouts
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatDate(template.created_at)}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {templateToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => !isDeleting && setTemplateToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Supprimer le template
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Cette action est irréversible
                  </p>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Êtes-vous sûr de vouloir supprimer le template <strong>"{templateToDelete.name}"</strong> ?
                Cette action supprimera également tous les layouts associés.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setTemplateToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TemplateGallery;
