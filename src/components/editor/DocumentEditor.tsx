"use client";
// ===========================================
// EDITEUR DE DOCUMENTS WYSIWYG PRINCIPAL
// ===========================================

import "./editor.css";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import ResizableImage from "./extensions/ResizableImage";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Typography } from "@tiptap/extension-typography";
import CharacterCount from "@tiptap/extension-character-count";
import { useCallback, useEffect, useRef, useState } from "react";
import mammoth from "mammoth";

import TemplateVariable from "./extensions/TemplateVariable";
import PageBreak from "./extensions/PageBreak";
import ConditionalBlock from "./extensions/ConditionalBlock";
import LoopBlock from "./extensions/LoopBlock";
import EditorToolbar from "./EditorToolbar";
import { DocumentType, TemplateContext } from "@/lib/templates/types";
import { DynamicVariableContext } from "@/lib/templates/variables";

// ===========================================
// TYPES
// ===========================================

interface DocumentEditorProps {
  /** Contenu initial (JSON TipTap ou HTML) */
  initialContent?: string;
  /** Type de document (pour filtrer les variables) */
  documentType?: DocumentType;
  /** Mode lecture seule */
  readOnly?: boolean;
  /** Placeholder quand vide */
  placeholder?: string;
  /** Callback lors de changement */
  onChange?: (content: string) => void;
  /** Callback pour sauvegarde (debounce) */
  onSave?: (content: string) => void;
  /** Delai de debounce pour sauvegarde auto (ms) */
  saveDebounceMs?: number;
  /** Classe CSS additionnelle */
  className?: string;
  /** Hauteur minimum de l'editeur */
  minHeight?: string;
  /** Contexte pour preview (remplacement des variables) */
  previewContext?: TemplateContext;
  /** Afficher la toolbar */
  showToolbar?: boolean;
  /** Contexte dynamique pour les variables numerotees */
  dynamicContext?: DynamicVariableContext;
}

// ===========================================
// COMPOSANT PRINCIPAL
// ===========================================

export default function DocumentEditor({
  initialContent = "",
  documentType,
  readOnly = false,
  placeholder = "Commencez a ecrire votre document...",
  onChange,
  onSave,
  saveDebounceMs = 2000,
  className = "",
  minHeight = "400px",
  previewContext,
  showToolbar = true,
  dynamicContext,
}: DocumentEditorProps) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Configuration de l'editeur TipTap
  const editor = useEditor({
    immediatelyRender: false, // Fix SSR hydration
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-brand-500 underline hover:text-brand-600",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      ResizableImage,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse w-full",
        },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-gray-300 dark:border-gray-600 p-2",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-gray-300 dark:border-gray-600 p-2 bg-gray-100 dark:bg-gray-800 font-semibold",
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typography,
      CharacterCount,
      TemplateVariable,
      PageBreak,
      ConditionalBlock,
      LoopBlock,
    ],
    content: parseContent(initialContent),
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none p-4 sm:p-6 ${
          readOnly ? "cursor-default" : ""
        }`,
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON());
      onChange?.(json);

      // Sauvegarde automatique avec debounce
      if (onSave) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          onSave(json);
        }, saveDebounceMs);
      }
    },
  });

  // Cleanup du timeout
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Mettre a jour le contenu si initialContent change
  useEffect(() => {
    if (editor && initialContent) {
      const currentContent = JSON.stringify(editor.getJSON());
      const newContent = typeof initialContent === "string" && initialContent.startsWith("{")
        ? initialContent
        : JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: initialContent }] }] });

      if (currentContent !== newContent) {
        editor.commands.setContent(parseContent(initialContent));
      }
    }
  }, [editor, initialContent]);

  // Handler pour insertion de variable
  const handleInsertVariable = useCallback(
    (variableId: string) => {
      if (editor) {
        // Verifier si c'est une variable conditionnelle (commence par #if)
        if (variableId.startsWith("#if ")) {
          // Inserer un bloc conditionnel complet avec {{#if ...}}contenu{{/if}}
          const condition = variableId.substring(4); // Enlever "#if "
          editor.chain().focus().setConditionalBlock(condition).run();
        }
        // Verifier si c'est une boucle (commence par #each)
        else if (variableId.startsWith("#each ")) {
          // Inserer un bloc de boucle avec {{#each ...}}contenu{{/each}}
          const collection = variableId.substring(6); // Enlever "#each "
          editor.chain().focus().setLoopBlock(collection).run();
        } else {
          // Variable normale
          editor.chain().focus().insertVariable(variableId).run();
        }
      }
    },
    [editor]
  );

  // Handler pour import Word
  const [isImporting, setIsImporting] = useState(false);
  const handleImportWord = useCallback(async (file: File) => {
    if (!editor) return;

    setIsImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });

      if (result.value) {
        // Inserer le HTML converti
        editor.chain().focus().setContent(result.value).run();

        // Afficher les warnings s'il y en a
        if (result.messages.length > 0) {
          console.warn("Import Word warnings:", result.messages);
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'import Word:", error);
      alert("Erreur lors de l'import du document Word. Verifiez que le fichier est valide.");
    } finally {
      setIsImporting(false);
    }
  }, [editor]);

  // Obtenir le contenu HTML
  const getHTML = useCallback(() => {
    return editor?.getHTML() || "";
  }, [editor]);

  // Obtenir le contenu JSON
  const getJSON = useCallback(() => {
    return editor?.getJSON() || null;
  }, [editor]);

  // Obtenir le contenu texte brut
  const getText = useCallback(() => {
    return editor?.getText() || "";
  }, [editor]);

  return (
    <div
      className={`document-editor relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Indicateur d'import */}
      {isImporting && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-brand-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span className="text-gray-600 dark:text-gray-300">Import du document Word...</span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      {showToolbar && !readOnly && (
        <EditorToolbar
          editor={editor}
          documentType={documentType}
          onInsertVariable={handleInsertVariable}
          onImportWord={handleImportWord}
          dynamicContext={dynamicContext}
        />
      )}

      {/* Zone d'edition */}
      <div className="editor-content-wrapper overflow-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Barre de statut */}
      {!readOnly && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span>
              {editor?.storage.characterCount?.characters?.() || getText().length} caracteres
            </span>
            <span>
              {editor?.storage.characterCount?.words?.() || getText().split(/\s+/).filter(Boolean).length} mots
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onSave && (
              <span className="flex items-center gap-1">
                <SaveIcon />
                Sauvegarde auto
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================
// HELPERS
// ===========================================

/**
 * Parser le contenu initial - gère JSON TipTap, HTML, ou texte brut
 */
function parseContent(content: string): Record<string, unknown> | string {
  if (!content) {
    return "";
  }

  // Si c'est du JSON (commence par { ou [)
  if (content.startsWith("{") || content.startsWith("[")) {
    try {
      const parsed = JSON.parse(content);

      // Vérifier si c'est du JSON TipTap valide (doit avoir type: "doc")
      if (parsed && typeof parsed === "object" && parsed.type === "doc" && Array.isArray(parsed.content)) {
        return parsed;
      }

      // Si c'est un objet {raw: "..."} (format legacy), extraire le contenu
      if (parsed && typeof parsed === "object" && typeof parsed.raw === "string") {
        return parsed.raw;
      }

      // Si c'est un objet mais pas du JSON TipTap, le convertir en texte
      if (parsed && typeof parsed === "object") {
        // Peut-être un objet Prisma ou autre format - essayer d'extraire le contenu
        if (parsed.content && typeof parsed.content === "string") {
          return parsed.content;
        }
        // Sinon retourner la string originale comme HTML
        return content;
      }

      return parsed;
    } catch {
      // JSON invalide - traiter comme HTML ou texte brut
      return content;
    }
  }

  // Si c'est du HTML ou du texte brut
  return content;
}

// ===========================================
// ICONES
// ===========================================

const SaveIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

