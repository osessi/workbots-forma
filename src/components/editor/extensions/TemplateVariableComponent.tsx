"use client";
// ===========================================
// COMPOSANT REACT POUR LES VARIABLES DE TEMPLATE
// ===========================================

import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { VariableCategory } from "@/lib/templates/types";

// Couleurs par categorie
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  formation: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700" },
  modules: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", border: "border-purple-300 dark:border-purple-700" },
  organisation: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", border: "border-green-300 dark:border-green-700" },
  entreprise: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", border: "border-orange-300 dark:border-orange-700" },
  participants: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300", border: "border-pink-300 dark:border-pink-700" },
  formateur: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-300 dark:border-cyan-700" },
  dates: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-300 dark:border-amber-700" },
  document: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", border: "border-gray-300 dark:border-gray-600" },
};

export default function TemplateVariableComponent(props: NodeViewProps) {
  const { node, selected, deleteNode } = props;
  const variableId = node.attrs.variableId as string || "unknown";
  const label = node.attrs.label as string || variableId;
  const category = node.attrs.category as string || "document";
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.document;

  return (
    <NodeViewWrapper
      as="span"
      className={`
        group inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md text-sm font-medium
        border transition-all cursor-default select-none
        ${colors.bg} ${colors.text} ${colors.border}
        ${selected ? "ring-2 ring-brand-500 ring-offset-1" : ""}
        hover:opacity-90
      `}
      data-variable-id={variableId}
      data-category={category}
      title={`Variable: ${variableId}\n${label}`}
    >
      {/* Icone variable */}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-60 flex-shrink-0"
      >
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
      <span className="truncate max-w-[200px]">{label}</span>
      {/* Bouton supprimer (visible au survol) */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          deleteNode();
        }}
        className="ml-1 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 transition-opacity flex-shrink-0"
        title="Supprimer la variable"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="hover:text-red-500"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </NodeViewWrapper>
  );
}
