"use client";
// ===========================================
// TOOLBAR DE L'EDITEUR WYSIWYG
// ===========================================

import { Editor } from "@tiptap/react";
import { useState, useCallback, useRef } from "react";
import VariableDropdown from "./VariableDropdown";
import AIGenerateButton from "./AIGenerateButton";
import { DocumentType } from "@/lib/templates/types";
import { DynamicVariableContext } from "@/lib/templates/variables";

interface EditorToolbarProps {
  editor: Editor | null;
  documentType?: DocumentType;
  onInsertVariable?: (variableId: string) => void;
  onImportWord?: (file: File) => void;
  /** Contexte dynamique pour les variables numerotees (journees, salaries) */
  dynamicContext?: DynamicVariableContext;
}

// Hook pour calculer la position d'un dropdown
function useDropdownPosition(isOpen: boolean, buttonRef: React.RefObject<HTMLButtonElement | null>) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // Calcul de la position left avec gestion du débordement à droite
      let left = rect.left;
      const dropdownWidth = 288; // w-72 = 18rem = 288px
      if (left + dropdownWidth > viewportWidth - 16) {
        left = viewportWidth - dropdownWidth - 16;
      }

      setPosition({
        top: rect.bottom + 4,
        left: Math.max(8, left),
      });
    }
  }, [isOpen, buttonRef]);

  return position;
}

// Importer React pour useEffect dans le hook
import * as React from "react";

// Types de titres
type HeadingLevel = 1 | 2 | 3;

// Bouton de toolbar generique
interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-2 rounded-lg transition-all
        ${isActive
          ? "bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {children}
    </button>
  );
}

// Separateur vertical
function Divider() {
  return <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />;
}

export default function EditorToolbar({ editor, documentType, onInsertVariable, onImportWord, dynamicContext }: EditorToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);
  const imageButtonRef = useRef<HTMLButtonElement>(null);
  const linkButtonRef = useRef<HTMLButtonElement>(null);

  // Positions calculées pour les dropdowns
  const imageDropdownPos = useDropdownPosition(showImageInput, imageButtonRef);
  const linkDropdownPos = useDropdownPosition(showLinkInput, linkButtonRef);

  // Handlers pour les actions - tous les hooks doivent etre avant le return conditionnel
  const toggleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor]);
  const toggleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor]);
  const toggleUnderline = useCallback(() => editor?.chain().focus().toggleUnderline().run(), [editor]);
  const toggleStrike = useCallback(() => editor?.chain().focus().toggleStrike().run(), [editor]);

  const setHeading = useCallback((level: HeadingLevel) => {
    editor?.chain().focus().toggleHeading({ level }).run();
  }, [editor]);

  const toggleBulletList = useCallback(() => editor?.chain().focus().toggleBulletList().run(), [editor]);
  const toggleOrderedList = useCallback(() => editor?.chain().focus().toggleOrderedList().run(), [editor]);

  const setTextAlign = useCallback((align: "left" | "center" | "right" | "justify") => {
    editor?.chain().focus().setTextAlign(align).run();
  }, [editor]);

  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const addTableRow = useCallback(() => editor?.chain().focus().addRowAfter().run(), [editor]);
  const addTableColumn = useCallback(() => editor?.chain().focus().addColumnAfter().run(), [editor]);
  const deleteTable = useCallback(() => editor?.chain().focus().deleteTable().run(), [editor]);

  const setLink = useCallback(() => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl("");
      setShowLinkInput(false);
    }
  }, [editor, linkUrl]);

  const unsetLink = useCallback(() => {
    editor?.chain().focus().unsetLink().run();
  }, [editor]);

  const setTextColor = useCallback((color: string) => {
    editor?.chain().focus().setColor(color).run();
  }, [editor]);

  const toggleHighlight = useCallback((color?: string) => {
    if (color) {
      editor?.chain().focus().toggleHighlight({ color }).run();
    } else {
      editor?.chain().focus().toggleHighlight().run();
    }
  }, [editor]);

  // Inserer un saut de page
  const insertPageBreak = useCallback(() => {
    editor?.chain().focus().setHardBreak().insertContent('<div class="page-break" style="page-break-after: always; break-after: page; height: 0; margin: 24px 0; border-top: 2px dashed #d1d5db;"></div><p></p>').run();
  }, [editor]);

  const undo = useCallback(() => editor?.chain().focus().undo().run(), [editor]);
  const redo = useCallback(() => editor?.chain().focus().redo().run(), [editor]);

  const handleInsertVariable = useCallback((variableId: string) => {
    // Ne pas inserer ici car onInsertVariable le fait deja dans DocumentEditor
    onInsertVariable?.(variableId);
  }, [onInsertVariable]);

  // Inserer une image par URL
  const insertImage = useCallback(() => {
    if (imageUrl && editor) {
      editor.chain().focus().setResizableImage({ src: imageUrl }).run();
      setImageUrl("");
      setShowImageInput(false);
    }
  }, [editor, imageUrl]);

  // Handler pour upload d'image
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        editor.chain().focus().setResizableImage({ src }).run();
        // Fermer la popup apres insertion
        setShowImageInput(false);
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [editor]);

  // Handler pour import Word
  const handleWordImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportWord?.(file);
    }
    // Reset input
    if (wordInputRef.current) {
      wordInputRef.current.value = "";
    }
  }, [onImportWord]);

  // Return null apres tous les hooks
  if (!editor) return null;

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 overflow-visible">
      {/* Ligne principale */}
      <div className="flex flex-wrap items-center gap-1 p-2 overflow-visible">
        {/* Undo/Redo */}
        <ToolbarButton onClick={undo} disabled={!editor.can().undo()} title="Annuler (Ctrl+Z)">
          <UndoIcon />
        </ToolbarButton>
        <ToolbarButton onClick={redo} disabled={!editor.can().redo()} title="Retablir (Ctrl+Y)">
          <RedoIcon />
        </ToolbarButton>

        <Divider />

        {/* Titres */}
        <ToolbarButton
          onClick={() => setHeading(1)}
          isActive={editor.isActive("heading", { level: 1 })}
          title="Titre 1"
        >
          <span className="font-bold text-sm">H1</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setHeading(2)}
          isActive={editor.isActive("heading", { level: 2 })}
          title="Titre 2"
        >
          <span className="font-bold text-sm">H2</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setHeading(3)}
          isActive={editor.isActive("heading", { level: 3 })}
          title="Titre 3"
        >
          <span className="font-bold text-sm">H3</span>
        </ToolbarButton>

        <Divider />

        {/* Formatage texte */}
        <ToolbarButton
          onClick={toggleBold}
          isActive={editor.isActive("bold")}
          title="Gras (Ctrl+B)"
        >
          <BoldIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={toggleItalic}
          isActive={editor.isActive("italic")}
          title="Italique (Ctrl+I)"
        >
          <ItalicIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={toggleUnderline}
          isActive={editor.isActive("underline")}
          title="Souligne (Ctrl+U)"
        >
          <UnderlineIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={toggleStrike}
          isActive={editor.isActive("strike")}
          title="Barre"
        >
          <StrikeIcon />
        </ToolbarButton>

        <Divider />

        {/* Alignement */}
        <ToolbarButton
          onClick={() => setTextAlign("left")}
          isActive={editor.isActive({ textAlign: "left" })}
          title="Aligner a gauche"
        >
          <AlignLeftIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setTextAlign("center")}
          isActive={editor.isActive({ textAlign: "center" })}
          title="Centrer"
        >
          <AlignCenterIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setTextAlign("right")}
          isActive={editor.isActive({ textAlign: "right" })}
          title="Aligner a droite"
        >
          <AlignRightIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setTextAlign("justify")}
          isActive={editor.isActive({ textAlign: "justify" })}
          title="Justifier"
        >
          <AlignJustifyIcon />
        </ToolbarButton>

        <Divider />

        {/* Listes */}
        <ToolbarButton
          onClick={toggleBulletList}
          isActive={editor.isActive("bulletList")}
          title="Liste a puces"
        >
          <BulletListIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={toggleOrderedList}
          isActive={editor.isActive("orderedList")}
          title="Liste numerotee"
        >
          <OrderedListIcon />
        </ToolbarButton>

        <Divider />

        {/* Saut de page */}
        <ToolbarButton
          onClick={insertPageBreak}
          title="Inserer un saut de page"
        >
          <PageBreakIcon />
        </ToolbarButton>

        <Divider />

        {/* Tableau */}
        <ToolbarButton onClick={insertTable} title="Inserer un tableau">
          <TableIcon />
        </ToolbarButton>
        {editor.isActive("table") && (
          <>
            <ToolbarButton onClick={addTableRow} title="Ajouter une ligne">
              <AddRowIcon />
            </ToolbarButton>
            <ToolbarButton onClick={addTableColumn} title="Ajouter une colonne">
              <AddColumnIcon />
            </ToolbarButton>
            <ToolbarButton onClick={deleteTable} title="Supprimer le tableau">
              <DeleteTableIcon />
            </ToolbarButton>
          </>
        )}

        <Divider />

        {/* Lien */}
        <div className="relative">
          <button
            ref={linkButtonRef}
            type="button"
            onClick={() => setShowLinkInput(!showLinkInput)}
            title="Inserer un lien"
            className={`
              p-2 rounded-lg transition-all
              ${editor.isActive("link")
                ? "bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }
            `}
          >
            <LinkIcon />
          </button>
          {showLinkInput && (
            <>
              <div className="fixed inset-0 z-[9998]" onClick={() => setShowLinkInput(false)} />
              <div
                className="fixed p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[9999]"
                style={{ top: linkDropdownPos.top, left: linkDropdownPos.left }}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    onKeyDown={(e) => e.key === "Enter" && setLink()}
                    autoFocus
                  />
                  <button
                    onClick={setLink}
                    className="px-2 py-1 text-sm bg-brand-500 text-white rounded hover:bg-brand-600"
                  >
                    OK
                  </button>
                  {editor.isActive("link") && (
                    <button
                      onClick={unsetLink}
                      className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Retirer
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Image */}
        <div className="relative">
          <button
            ref={imageButtonRef}
            type="button"
            onClick={() => setShowImageInput(!showImageInput)}
            title="Inserer une image"
            className="p-2 rounded-lg transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
          >
            <ImageIcon />
          </button>
          {showImageInput && (
            <>
              {/* Backdrop pour fermer au clic exterieur */}
              <div className="fixed inset-0 z-[9998]" onClick={() => setShowImageInput(false)} />
              <div
                className="fixed p-3 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[9999] w-72"
                style={{ top: imageDropdownPos.top, left: imageDropdownPos.left }}
              >
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      URL de l'image
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        onKeyDown={(e) => e.key === "Enter" && insertImage()}
                        autoFocus
                      />
                      <button
                        onClick={insertImage}
                        className="px-2 py-1 text-sm bg-brand-500 text-white rounded hover:bg-brand-600"
                      >
                        OK
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Ou telecharger un fichier
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-200 dark:hover:file:bg-gray-600"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <Divider />

        {/* Import Word */}
        <div className="relative">
          <input
            ref={wordInputRef}
            type="file"
            accept=".docx,.doc"
            onChange={handleWordImport}
            className="hidden"
          />
          <ToolbarButton
            onClick={() => wordInputRef.current?.click()}
            title="Importer un document Word"
          >
            <WordIcon />
          </ToolbarButton>
        </div>

        <Divider />

        {/* Couleurs */}
        <ColorPicker
          label="Couleur du texte"
          icon={<TextColorIcon />}
          onSelect={setTextColor}
          currentColor={editor.getAttributes("textStyle").color}
        />
        <ColorPicker
          label="Surlignage"
          icon={<HighlightIcon />}
          onSelect={(color) => toggleHighlight(color)}
          currentColor={editor.getAttributes("highlight").color}
          isHighlight
        />

        <Divider />

        {/* Variables */}
        <VariableDropdown
          documentType={documentType}
          onInsertVariable={handleInsertVariable}
          dynamicContext={dynamicContext}
        />

        <Divider />

        {/* Generation IA */}
        <AIGenerateButton
          editor={editor}
          documentType={documentType}
          dynamicContext={dynamicContext}
        />
      </div>

      {/* Indication de selection de tableau */}
      {editor.isActive("table") && (
        <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          Tableau selectionne - Utilisez les boutons pour modifier
        </div>
      )}
    </div>
  );
}

// ===========================================
// COMPOSANT COLOR PICKER
// ===========================================

interface ColorPickerProps {
  label: string;
  icon: React.ReactNode;
  onSelect: (color: string) => void;
  currentColor?: string;
  isHighlight?: boolean;
}

const COLORS = [
  "#000000", "#374151", "#6B7280", "#9CA3AF",
  "#EF4444", "#F97316", "#F59E0B", "#EAB308",
  "#22C55E", "#10B981", "#14B8A6", "#06B6D4",
  "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7",
  "#EC4899", "#F43F5E",
];

const HIGHLIGHT_COLORS = [
  "#FEF08A", "#FDE68A", "#FED7AA", "#FECACA",
  "#BBF7D0", "#A7F3D0", "#99F6E4", "#A5F3FC",
  "#BFDBFE", "#C7D2FE", "#DDD6FE", "#E9D5FF",
  "#FBCFE8", "#FECDD3",
];

function ColorPicker({ label, icon, onSelect, currentColor, isHighlight }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const colors = isHighlight ? HIGHLIGHT_COLORS : COLORS;

  React.useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const dropdownWidth = 180;

      let left = rect.left;
      if (left + dropdownWidth > viewportWidth - 16) {
        left = viewportWidth - dropdownWidth - 16;
      }

      setPosition({
        top: rect.bottom + 4,
        left: Math.max(8, left),
      });
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={label}
        className="p-2 rounded-lg transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
      >
        <div className="relative">
          {icon}
          {currentColor && (
            <div
              className="absolute bottom-0 left-0 right-0 h-1 rounded-full"
              style={{ backgroundColor: currentColor }}
            />
          )}
        </div>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div
            className="fixed p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[9999]"
            style={{ top: position.top, left: position.left }}
          >
            <div className="grid grid-cols-6 gap-1">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    onSelect(color);
                    setIsOpen(false);
                  }}
                  className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${
                    currentColor === color ? "border-brand-500" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            {currentColor && (
              <button
                onClick={() => {
                  onSelect("");
                  setIsOpen(false);
                }}
                className="mt-2 w-full text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Supprimer la couleur
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ===========================================
// ICONES SVG
// ===========================================

const UndoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
);

const RedoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
  </svg>
);

const BoldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
  </svg>
);

const ItalicIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" />
  </svg>
);

const UnderlineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" /><line x1="4" y1="21" x2="20" y2="21" />
  </svg>
);

const StrikeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="12" x2="20" y2="12" /><path d="M17.5 7.5c-.6-1.4-2-2.5-4-2.5-2.6 0-4.5 1.6-4.5 4 0 .8.2 1.5.5 2" /><path d="M9 16c.8 1.3 2.2 2 4 2 2.6 0 4.5-1.6 4.5-4 0-.3 0-.6-.1-.9" />
  </svg>
);

const AlignLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="21" y1="6" x2="3" y2="6" /><line x1="15" y1="12" x2="3" y2="12" /><line x1="17" y1="18" x2="3" y2="18" />
  </svg>
);

const AlignCenterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="21" y1="6" x2="3" y2="6" /><line x1="18" y1="12" x2="6" y2="12" /><line x1="21" y1="18" x2="3" y2="18" />
  </svg>
);

const AlignRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="12" x2="9" y2="12" /><line x1="21" y1="18" x2="7" y2="18" />
  </svg>
);

const AlignJustifyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="12" x2="3" y2="12" /><line x1="21" y1="18" x2="3" y2="18" />
  </svg>
);

const BulletListIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
    <circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" />
  </svg>
);

const OrderedListIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
    <text x="4" y="8" fontSize="8" fill="currentColor">1</text>
    <text x="4" y="14" fontSize="8" fill="currentColor">2</text>
    <text x="4" y="20" fontSize="8" fill="currentColor">3</text>
  </svg>
);

const TableIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
  </svg>
);

const AddRowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="12" y1="16" x2="12" y2="20" /><line x1="10" y1="18" x2="14" y2="18" />
  </svg>
);

const AddColumnIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="12" y1="3" x2="12" y2="21" /><line x1="16" y1="12" x2="20" y2="12" /><line x1="18" y1="10" x2="18" y2="14" />
  </svg>
);

const DeleteTableIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" />
  </svg>
);

const LinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const TextColorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h16" /><path d="m6 16 6-12 6 12" /><path d="M8 12h8" />
  </svg>
);

const HighlightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 11-6 6v3h9l3-3" /><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
  </svg>
);

const ImageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const WordIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M9 15l2 2 4-4" />
  </svg>
);

const PageBreakIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5" />
    <path d="M4 19v-4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="10" y1="12" x2="14" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
  </svg>
);
