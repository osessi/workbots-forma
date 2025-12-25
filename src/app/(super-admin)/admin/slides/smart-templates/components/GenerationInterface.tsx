"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Loader2,
  Download,
  CheckCircle,
  FileText,
  Globe,
  Hash,
  MessageSquare,
  Settings2,
  ChevronDown,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { SmartTemplate, DesignSystem, GenerateResponse } from "../types";

interface GenerationInterfaceProps {
  template: SmartTemplate;
  designSystem: DesignSystem;
  onBack: () => void;
}

const LANGUAGES = [
  { code: "fr", label: "Francais" },
  { code: "en", label: "English" },
  { code: "es", label: "Espanol" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Portugues" },
  { code: "nl", label: "Nederlands" },
  { code: "ar", label: "Arabic" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
];

const GenerationInterface: React.FC<GenerationInterfaceProps> = ({
  template,
  designSystem,
  onBack,
}) => {
  const [topic, setTopic] = useState("");
  const [numSlides, setNumSlides] = useState(10);
  const [language, setLanguage] = useState("fr");
  const [context, setContext] = useState("");
  const [instructions, setInstructions] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<"idle" | "planning" | "generating" | "building" | "done">("idle");
  const [result, setResult] = useState<GenerateResponse | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic for your presentation");
      return;
    }

    setIsGenerating(true);
    setGenerationStep("planning");

    try {
      // Simulate steps for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      setGenerationStep("generating");

      const response = await fetch("/api/slides/smart-templates/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template_id: template.id,
          topic,
          num_slides: numSlides,
          language,
          context: context || undefined,
          instructions: instructions || undefined,
        }),
      });

      setGenerationStep("building");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to generate presentation");
      }

      const data: GenerateResponse = await response.json();
      setGenerationStep("done");
      setResult(data);
      toast.success(`Generated ${data.slides_generated} slides successfully!`);

    } catch (error) {
      console.error("Generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate presentation");
      setGenerationStep("idle");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;

    try {
      // Extract filename from download_url (format: /api/v1/ppt/smart-templates/download/filename.pptx)
      const filename = result.download_url.split('/').pop() || 'presentation.pptx';
      const response = await fetch(`/api/slides/smart-templates/download/${filename}`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${topic.replace(/[^a-zA-Z0-9]/g, "_")}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  const getStepMessage = () => {
    switch (generationStep) {
      case "planning":
        return "AI is planning your presentation structure...";
      case "generating":
        return "Generating content for each slide...";
      case "building":
        return "Building your PPTX with perfect styling...";
      case "done":
        return "Your presentation is ready!";
      default:
        return "";
    }
  };

  if (result && generationStep === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Presentation Generated!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {result.slides_generated} slides created with 99% style fidelity
          </p>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-[#5141e5]" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">{topic}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  PowerPoint Presentation (.pptx)
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              View Design System
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 px-6 py-3 bg-[#5141e5] text-white rounded-lg hover:bg-[#5141e5]/90 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download PPTX
            </button>
          </div>

          <button
            onClick={() => {
              setResult(null);
              setGenerationStep("idle");
              setTopic("");
            }}
            className="mt-4 text-[#5141e5] hover:underline text-sm"
          >
            Generate another presentation
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#5141e5] to-[#7c3aed] rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Generate Presentation
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Using template: <span className="font-medium text-gray-700 dark:text-gray-300">{template.name}</span>
          </p>
        </div>

        {/* Generation Form */}
        <div className="space-y-6">
          {/* Topic Input */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MessageSquare className="w-4 h-4" />
              What is your presentation about? *
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Introduction to Machine Learning for Business Leaders"
              rows={3}
              disabled={isGenerating}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5141e5] focus:border-transparent transition-all resize-none disabled:opacity-50"
            />
          </div>

          {/* Quick Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Hash className="w-4 h-4" />
                Number of Slides
              </label>
              <select
                value={numSlides}
                onChange={(e) => setNumSlides(Number(e.target.value))}
                disabled={isGenerating}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5141e5] focus:border-transparent transition-all disabled:opacity-50"
              >
                {[5, 8, 10, 12, 15, 20, 25, 30].map((n) => (
                  <option key={n} value={n}>{n} slides</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Globe className="w-4 h-4" />
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={isGenerating}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5141e5] focus:border-transparent transition-all disabled:opacity-50"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            disabled={isGenerating}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <Settings2 className="w-4 h-4" />
            Advanced Options
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-2"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Context (optional)
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Add any background information, data, or context that should be included..."
                  rows={3}
                  disabled={isGenerating}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5141e5] focus:border-transparent transition-all resize-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Special Instructions (optional)
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g., Focus on practical examples, Include statistics, Keep it beginner-friendly..."
                  rows={2}
                  disabled={isGenerating}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5141e5] focus:border-transparent transition-all resize-none disabled:opacity-50"
                />
              </div>
            </motion.div>
          )}

          {/* Generation Progress */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#5141e5]/5 dark:bg-[#5141e5]/10 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Loader2 className="w-8 h-8 text-[#5141e5] animate-spin" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getStepMessage()}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This usually takes 30-60 seconds
                  </p>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center gap-2 mt-4">
                {["planning", "generating", "building"].map((step, idx) => (
                  <React.Fragment key={step}>
                    <div
                      className={`w-3 h-3 rounded-full transition-colors ${
                        generationStep === step
                          ? "bg-[#5141e5] animate-pulse"
                          : ["planning", "generating", "building"].indexOf(generationStep) > idx
                          ? "bg-green-500"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                    {idx < 2 && (
                      <div className={`flex-1 h-0.5 ${
                        ["planning", "generating", "building"].indexOf(generationStep) > idx
                          ? "bg-green-500"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={onBack}
              disabled={isGenerating}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={!topic.trim() || isGenerating}
              className="flex-1 px-6 py-3 bg-[#5141e5] text-white rounded-xl hover:bg-[#5141e5]/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Presentation
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerationInterface;
