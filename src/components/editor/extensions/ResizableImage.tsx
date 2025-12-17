"use client";
// ===========================================
// EXTENSION TIPTAP POUR IMAGES REDIMENSIONNABLES
// ===========================================

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useState, useRef, useCallback, useEffect } from "react";

// ===========================================
// COMPOSANT REACT POUR L'IMAGE REDIMENSIONNABLE
// ===========================================

function ResizableImageComponent({ node, updateAttributes, selected }: NodeViewProps) {
  const [isResizing, setIsResizing] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const { src, alt, title, width, height, align = "center" } = node.attrs;

  // Gestion du resize
  const handleMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = imageRef.current?.offsetWidth || 300;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startXRef.current;
      const multiplier = direction === "right" ? 1 : -1;
      const newWidth = Math.max(100, startWidthRef.current + diff * multiplier);
      updateAttributes({ width: newWidth });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [updateAttributes]);

  // Alignement
  const alignmentClasses: Record<string, string> = {
    left: "mr-auto",
    center: "mx-auto",
    right: "ml-auto",
  };
  const alignmentClass = alignmentClasses[align as string] || "mx-auto";

  return (
    <NodeViewWrapper className={`relative ${alignmentClass} block my-4`} style={{ width: width ? `${width}px` : "auto" }}>
      <div className={`relative inline-block ${selected ? "ring-2 ring-brand-500 ring-offset-2" : ""}`}>
        {/* Image */}
        <img
          ref={imageRef}
          src={src}
          alt={alt || ""}
          title={title || ""}
          className="max-w-full h-auto rounded-lg"
          style={{
            width: width ? `${width}px` : "auto",
            height: height ? `${height}px` : "auto",
          }}
          draggable={false}
        />

        {/* Poignees de redimensionnement - visibles au survol ou selection */}
        {selected && (
          <>
            {/* Poignee gauche */}
            <div
              className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-8 bg-brand-500 rounded cursor-ew-resize opacity-80 hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, "left")}
            />
            {/* Poignee droite */}
            <div
              className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-8 bg-brand-500 rounded cursor-ew-resize opacity-80 hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, "right")}
            />
          </>
        )}

        {/* Indicateur de redimensionnement */}
        {isResizing && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/75 text-white text-xs px-2 py-1 rounded">
            {Math.round(width || imageRef.current?.offsetWidth || 0)}px
          </div>
        )}

        {/* Barre d'outils d'alignement - visible au survol */}
        {selected && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1">
            <button
              onClick={() => updateAttributes({ align: "left" })}
              className={`p-1.5 rounded ${align === "left" ? "bg-brand-100 dark:bg-brand-900/30 text-brand-600" : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
              title="Aligner a gauche"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="21" y1="6" x2="3" y2="6" /><line x1="15" y1="12" x2="3" y2="12" /><line x1="17" y1="18" x2="3" y2="18" />
              </svg>
            </button>
            <button
              onClick={() => updateAttributes({ align: "center" })}
              className={`p-1.5 rounded ${align === "center" ? "bg-brand-100 dark:bg-brand-900/30 text-brand-600" : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
              title="Centrer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="21" y1="6" x2="3" y2="6" /><line x1="18" y1="12" x2="6" y2="12" /><line x1="21" y1="18" x2="3" y2="18" />
              </svg>
            </button>
            <button
              onClick={() => updateAttributes({ align: "right" })}
              className={`p-1.5 rounded ${align === "right" ? "bg-brand-100 dark:bg-brand-900/30 text-brand-600" : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
              title="Aligner a droite"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="12" x2="9" y2="12" /><line x1="21" y1="18" x2="7" y2="18" />
              </svg>
            </button>
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
            <button
              onClick={() => updateAttributes({ width: null, height: null })}
              className="p-1.5 rounded text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Taille originale"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// ===========================================
// EXTENSION TIPTAP
// ===========================================

export const ResizableImage = Node.create({
  name: "resizableImage",

  group: "block",

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      align: {
        default: "center",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },

  addCommands() {
    return {
      setResizableImage:
        (options: { src: string; alt?: string; title?: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

export default ResizableImage;
