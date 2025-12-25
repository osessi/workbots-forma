"use client";

import React, { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, X, Loader2, CheckCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { DesignSystem } from "../types";

interface TemplateUploaderProps {
  onTemplateUploaded: (templateId: string, designSystem: DesignSystem) => void;
  onCancel: () => void;
}

const TemplateUploader: React.FC<TemplateUploaderProps> = ({
  onTemplateUploaded,
  onCancel,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState<"idle" | "uploading" | "analyzing" | "done">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.toLowerCase().endsWith(".pptx")) {
      setFile(droppedFile);
      if (!name) {
        setName(droppedFile.name.replace(/\.pptx$/i, ""));
      }
    } else {
      toast.error("Please upload a .pptx file");
    }
  }, [name]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.toLowerCase().endsWith(".pptx")) {
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name.replace(/\.pptx$/i, ""));
      }
    } else if (selectedFile) {
      toast.error("Please upload a .pptx file");
    }
  }, [name]);

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    setIsUploading(true);
    setUploadStep("uploading");
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      if (description) formData.append("description", description);
      formData.append("category", category);

      setUploadProgress(30);
      setUploadStep("analyzing");

      const response = await fetch("/api/slides/smart-templates/analyze", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(70);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to analyze template");
      }

      const data = await response.json();
      setUploadProgress(100);
      setUploadStep("done");

      // Wait a moment before transitioning
      setTimeout(() => {
        onTemplateUploaded(data.template_id, data.design_system);
      }, 500);

    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload template");
      setUploadStep("idle");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#5141e5]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-[#5141e5]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-instrument_sans">
            Upload PPTX Template
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Our AI will analyze your template and extract the complete design system
          </p>
        </div>

        {/* File Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all
            ${file
              ? "border-green-400 bg-green-50 dark:bg-green-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-[#5141e5] hover:bg-[#5141e5]/5"
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pptx"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {file ? (
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-red-500" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                Drop your PPTX file here or click to browse
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Maximum file size: 100MB
              </p>
            </>
          )}
        </div>

        {/* Template Details */}
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Corporate Blue Theme"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5141e5] focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this template..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5141e5] focus:border-transparent transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5141e5] focus:border-transparent transition-all"
            >
              <option value="general">General</option>
              <option value="business">Business</option>
              <option value="education">Education</option>
              <option value="creative">Creative</option>
              <option value="technology">Technology</option>
              <option value="marketing">Marketing</option>
              <option value="medical">Medical</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-6"
          >
            <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-[#5141e5]"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-2 flex items-center justify-center gap-2">
              {uploadStep === "uploading" && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading template...
                </>
              )}
              {uploadStep === "analyzing" && (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse text-[#5141e5]" />
                  AI is analyzing your design system...
                </>
              )}
              {uploadStep === "done" && (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Analysis complete!
                </>
              )}
            </p>
          </motion.div>
        )}

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={onCancel}
            disabled={isUploading}
            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || !name.trim() || isUploading}
            className="flex-1 px-6 py-3 bg-[#5141e5] text-white rounded-lg hover:bg-[#5141e5]/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Analyze Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateUploader;
