"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  Check,
  Palette,
  Layout,
  Sparkles,
} from "lucide-react";
import { WorkbotsTemplate } from "@/lib/workbots/types";

// Import dynamique des layouts pour les previews (avec les vrais noms de fichiers)
const GeneralIntroLayout = dynamic(
  () => import("@/components/slides/presentation-templates/general/IntroSlideLayout"),
  { ssr: false }
);
const GeneralBulletsLayout = dynamic(
  () => import("@/components/slides/presentation-templates/general/BulletWithIconsSlideLayout"),
  { ssr: false }
);

const ModernIntroLayout = dynamic(
  () => import("@/components/slides/presentation-templates/modern/1IntroSlideLayout"),
  { ssr: false }
);
const ModernBulletsLayout = dynamic(
  () => import("@/components/slides/presentation-templates/modern/3ProblemSlideLayout"),
  { ssr: false }
);

const StandardIntroLayout = dynamic(
  () => import("@/components/slides/presentation-templates/standard/IntroSlideLayout"),
  { ssr: false }
);
const StandardBulletsLayout = dynamic(
  () => import("@/components/slides/presentation-templates/standard/IconBulletDescriptionLayout"),
  { ssr: false }
);

const SwiftIntroLayout = dynamic(
  () => import("@/components/slides/presentation-templates/swift/IntroSlideLayout"),
  { ssr: false }
);
const SwiftBulletsLayout = dynamic(
  () => import("@/components/slides/presentation-templates/swift/BulletsWithIconsTitleDescription"),
  { ssr: false }
);

// Map des composants de preview pour chaque template
const TEMPLATE_PREVIEW_COMPONENTS: Record<string, { intro: React.ComponentType<any>; bullets: React.ComponentType<any> }> = {
  general: { intro: GeneralIntroLayout, bullets: GeneralBulletsLayout },
  modern: { intro: ModernIntroLayout, bullets: ModernBulletsLayout },
  standard: { intro: StandardIntroLayout, bullets: StandardBulletsLayout },
  swift: { intro: SwiftIntroLayout, bullets: SwiftBulletsLayout },
};

// Templates par défaut avec descriptions et layout counts réels
const DEFAULT_TEMPLATES: WorkbotsTemplate[] = [
  {
    id: "general",
    name: "Général",
    description: "Template polyvalent pour toutes types de présentations avec layouts flexibles",
    layoutCount: 12,
  },
  {
    id: "modern",
    name: "Moderne",
    description: "Design sombre et épuré avec accents colorés, idéal pour pitch decks",
    layoutCount: 11,
  },
  {
    id: "standard",
    name: "Standard",
    description: "Format classique et professionnel avec mise en page structurée",
    layoutCount: 11,
  },
  {
    id: "swift",
    name: "Swift",
    description: "Style minimaliste et dynamique avec couleurs chaudes",
    layoutCount: 9,
  },
];

interface WorkbotsTemplateSelectorProps {
  selectedTemplateId: string;
  onSelectTemplate: (template: WorkbotsTemplate) => void;
  className?: string;
}

// Données de preview par défaut pour éviter les erreurs d'images vides
const DEFAULT_PREVIEW_DATA = {
  title: "Titre de présentation",
  description: "Description du contenu de la slide avec des informations importantes.",
  presenterName: "Présentateur",
  presentationDate: "Décembre 2024",
  image: {
    __image_url__: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
    __image_prompt__: "Business presentation"
  },
  bullets: [
    { title: "Point 1", description: "Description du premier point" },
    { title: "Point 2", description: "Description du second point" },
    { title: "Point 3", description: "Description du troisième point" },
  ],
};

// Composant de preview miniature d'un layout
const LayoutMiniPreview: React.FC<{
  LayoutComponent: React.ComponentType<any>;
  scale?: number;
}> = ({ LayoutComponent, scale = 0.18 }) => {
  return (
    <div className="relative overflow-hidden aspect-video bg-white rounded border border-gray-200">
      <div className="absolute inset-0 bg-transparent z-10" />
      <div
        className="origin-top-left"
        style={{
          transform: `scale(${scale})`,
          width: `${100 / scale}%`,
          height: `${100 / scale}%`,
        }}
      >
        <Suspense fallback={<div className="w-full h-full bg-gray-100 animate-pulse" />}>
          <LayoutComponent data={DEFAULT_PREVIEW_DATA} />
        </Suspense>
      </div>
    </div>
  );
};

export default function WorkbotsTemplateSelector({
  selectedTemplateId,
  onSelectTemplate,
  className = "",
}: WorkbotsTemplateSelectorProps) {
  const [templates, setTemplates] = useState<WorkbotsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasCustomTemplates, setHasCustomTemplates] = useState(false);

  // Charger les templates
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/workbots/templates");

      if (response.ok) {
        const data = await response.json();
        if (data.templates && data.templates.length > 0) {
          setTemplates(data.templates);
          setHasCustomTemplates(
            data.templates.some((t: WorkbotsTemplate) => t.id.startsWith("custom-"))
          );

          if (!selectedTemplateId && data.templates.length > 0) {
            onSelectTemplate(data.templates[0]);
          }
        } else {
          // Utiliser les templates par défaut si aucun retourné
          setTemplates(DEFAULT_TEMPLATES);
          if (!selectedTemplateId) {
            onSelectTemplate(DEFAULT_TEMPLATES[0]);
          }
        }
      } else {
        // En cas d'erreur HTTP, utiliser les templates par défaut sans afficher d'erreur
        console.warn("API templates indisponible, utilisation des templates par défaut");
        setTemplates(DEFAULT_TEMPLATES);
        if (!selectedTemplateId) {
          onSelectTemplate(DEFAULT_TEMPLATES[0]);
        }
      }
    } catch (err) {
      // Erreur réseau ou autre - utiliser les templates par défaut silencieusement
      console.warn("Erreur chargement templates, utilisation des defaults:", err);
      setTemplates(DEFAULT_TEMPLATES);
      if (!selectedTemplateId) {
        onSelectTemplate(DEFAULT_TEMPLATES[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const builtInTemplates = templates.filter((t) => !t.id.startsWith("custom-"));
  const customTemplates = templates.filter((t) => t.id.startsWith("custom-"));

  // Couleurs pour les templates custom
  const customTemplateColors: Record<number, { bg: string; accent: string }> = {
    0: { bg: "#EDE9FE", accent: "#8B5CF6" },
    1: { bg: "#FCE7F3", accent: "#EC4899" },
    2: { bg: "#DBEAFE", accent: "#3B82F6" },
    3: { bg: "#D1FAE5", accent: "#10B981" },
  };

  const renderTemplatePreview = (template: WorkbotsTemplate, index: number = 0) => {
    const previewComponents = TEMPLATE_PREVIEW_COMPONENTS[template.id];

    // Si on a des composants de preview pour ce template, les afficher
    if (previewComponents) {
      return (
        <div className="relative w-full bg-gray-50 dark:bg-gray-800 overflow-hidden rounded-t-lg p-3">
          <div className="grid grid-cols-2 gap-3">
            <LayoutMiniPreview LayoutComponent={previewComponents.intro} scale={0.22} />
            <LayoutMiniPreview LayoutComponent={previewComponents.bullets} scale={0.22} />
          </div>
        </div>
      );
    }

    // Pour les templates custom sans preview, afficher un placeholder stylisé
    const colorIndex = index % Object.keys(customTemplateColors).length;
    const colors = customTemplateColors[colorIndex];

    return (
      <div
        className="w-full h-36 p-4 flex flex-col justify-between rounded-t-lg"
        style={{ backgroundColor: colors.bg }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm"
            style={{ backgroundColor: colors.accent }}
          >
            {template.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 space-y-1">
            <div
              className="h-1.5 rounded-full w-3/4"
              style={{ backgroundColor: colors.accent, opacity: 0.8 }}
            />
            <div
              className="h-1 rounded-full w-1/2"
              style={{ backgroundColor: colors.accent, opacity: 0.4 }}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="aspect-video rounded-sm"
              style={{ backgroundColor: colors.accent, opacity: 0.15 + i * 0.1 }}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderTemplateCard = (template: WorkbotsTemplate, index: number = 0, isCustom = false) => {
    const isSelected = selectedTemplateId === template.id;

    return (
      <button
        key={template.id}
        onClick={() => onSelectTemplate(template)}
        className={`group relative rounded-xl border-2 transition-all overflow-hidden text-left ${
          isSelected
            ? "border-brand-500 ring-2 ring-brand-500/20 scale-[1.02] shadow-lg"
            : "border-gray-200 hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:hover:border-gray-600"
        }`}
      >
        {renderTemplatePreview(template, index)}

        <div className="p-3 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2 mb-1">
            {isCustom ? (
              <Sparkles size={12} className="text-purple-500 flex-shrink-0" />
            ) : (
              <Layout size={12} className="text-gray-400 flex-shrink-0" />
            )}
            <h4
              className={`text-sm font-semibold truncate ${
                isSelected
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-gray-800 dark:text-gray-200"
              }`}
            >
              {template.name}
            </h4>
          </div>
          {template.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-1.5 min-h-[2rem]">
              {template.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
              {template.layoutCount} layouts
            </span>
            {isCustom && (
              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-medium rounded dark:bg-purple-500/20 dark:text-purple-400">
                Custom
              </span>
            )}
          </div>
        </div>

        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center shadow-lg">
            <Check size={14} className="text-white" />
          </div>
        )}
      </button>
    );
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <Palette size={16} />
            Template de présentation
          </label>
          <Loader2 size={14} className="animate-spin text-gray-400" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse"
            >
              <div className="h-32 bg-gray-100 dark:bg-gray-800" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <Palette size={16} />
          Template de présentation
          {hasCustomTemplates && (
            <span className="text-xs font-normal text-purple-500">
              ({customTemplates.length} personnalisé{customTemplates.length > 1 ? "s" : ""})
            </span>
          )}
        </label>
        <button
          onClick={fetchTemplates}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Rafraîchir les templates"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl dark:bg-amber-500/10 dark:border-amber-500/30">
          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
            <AlertCircle size={14} />
            <span>{error} - Templates par défaut utilisés</span>
          </div>
        </div>
      )}

      {customTemplates.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-3 uppercase tracking-wide flex items-center gap-2">
            <Sparkles size={12} />
            Templates personnalisés
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {customTemplates.map((template, index) => renderTemplateCard(template, index, true))}
          </div>
        </div>
      )}

      <div>
        {customTemplates.length > 0 && (
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
            <Layout size={12} />
            Templates standards
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {builtInTemplates.map((template, index) => renderTemplateCard(template, index, false))}
        </div>
      </div>

      {templates.length > 8 && (
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          {templates.length} templates disponibles
        </p>
      )}
    </div>
  );
}
