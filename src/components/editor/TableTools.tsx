"use client";
// ===========================================
// OUTILS AVANCES POUR LES TABLEAUX
// ===========================================
// Modal de creation et barre d'outils contextuelle

import { useState, useCallback, useRef, useEffect } from "react";
import { Editor } from "@tiptap/react";
import { createPortal } from "react-dom";

// ===========================================
// MODAL DE CREATION DE TABLEAU
// ===========================================

interface TableCreatorProps {
  onInsert: (rows: number, cols: number, withHeader: boolean) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export function TableCreatorModal({ onInsert, onClose, position }: TableCreatorProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [withHeader, setWithHeader] = useState(true);
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Grille de selection visuelle (max 10x10)
  const maxGridRows = 8;
  const maxGridCols = 8;

  // Fermer au clic exterieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Gestion du clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") onInsert(rows, cols, withHeader);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onInsert, rows, cols, withHeader]);

  const handleGridSelect = (row: number, col: number) => {
    setRows(row);
    setCols(col);
    onInsert(row, col, withHeader);
  };

  return createPortal(
    <div
      ref={modalRef}
      className="fixed bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[10000] w-80"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
          Inserer un tableau
        </h3>
      </div>

      {/* Grille de selection visuelle */}
      <div className="p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Survolez pour selectionner la taille
        </p>
        <div className="inline-block border border-gray-200 dark:border-gray-700 rounded p-1 bg-gray-50 dark:bg-gray-800">
          {Array.from({ length: maxGridRows }).map((_, rowIdx) => (
            <div key={rowIdx} className="flex">
              {Array.from({ length: maxGridCols }).map((_, colIdx) => {
                const isSelected =
                  hoverCell
                    ? rowIdx < hoverCell.row && colIdx < hoverCell.col
                    : rowIdx < rows && colIdx < cols;
                return (
                  <button
                    key={colIdx}
                    type="button"
                    className={`w-6 h-6 border border-gray-300 dark:border-gray-600 m-0.5 rounded-sm transition-colors ${
                      isSelected
                        ? "bg-brand-500 border-brand-600"
                        : "bg-white dark:bg-gray-700 hover:bg-brand-100 dark:hover:bg-brand-900/30"
                    }`}
                    onMouseEnter={() => setHoverCell({ row: rowIdx + 1, col: colIdx + 1 })}
                    onMouseLeave={() => setHoverCell(null)}
                    onClick={() => handleGridSelect(rowIdx + 1, colIdx + 1)}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
          {hoverCell ? `${hoverCell.col} x ${hoverCell.row}` : `${cols} x ${rows}`}
        </p>
      </div>

      {/* Options avancees */}
      <div className="px-4 pb-2">
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Ou entrez les dimensions manuellement
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 dark:text-gray-400">Colonnes</label>
              <input
                type="number"
                min="1"
                max="20"
                value={cols}
                onChange={(e) => setCols(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="w-14 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center"
              />
            </div>
            <span className="text-gray-400">x</span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 dark:text-gray-400">Lignes</label>
              <input
                type="number"
                min="1"
                max="50"
                value={rows}
                onChange={(e) => setRows(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                className="w-14 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Option en-tete */}
      <div className="px-4 pb-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={withHeader}
            onChange={(e) => setWithHeader(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-brand-500 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Avec ligne d&apos;en-tete
          </span>
        </label>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Annuler
        </button>
        <button
          onClick={() => onInsert(rows, cols, withHeader)}
          className="px-4 py-1.5 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          Inserer
        </button>
      </div>
    </div>,
    document.body
  );
}

// ===========================================
// BARRE D'OUTILS CONTEXTUELLE POUR TABLEAUX
// ===========================================

interface TableToolbarProps {
  editor: Editor;
}

export function TableContextToolbar({ editor }: TableToolbarProps) {
  const [showMergeOptions, setShowMergeOptions] = useState(false);

  // Actions de base
  const addRowBefore = useCallback(() => editor.chain().focus().addRowBefore().run(), [editor]);
  const addRowAfter = useCallback(() => editor.chain().focus().addRowAfter().run(), [editor]);
  const deleteRow = useCallback(() => editor.chain().focus().deleteRow().run(), [editor]);

  const addColumnBefore = useCallback(() => editor.chain().focus().addColumnBefore().run(), [editor]);
  const addColumnAfter = useCallback(() => editor.chain().focus().addColumnAfter().run(), [editor]);
  const deleteColumn = useCallback(() => editor.chain().focus().deleteColumn().run(), [editor]);

  const deleteTable = useCallback(() => editor.chain().focus().deleteTable().run(), [editor]);

  const toggleHeaderRow = useCallback(() => editor.chain().focus().toggleHeaderRow().run(), [editor]);
  const toggleHeaderColumn = useCallback(() => editor.chain().focus().toggleHeaderColumn().run(), [editor]);

  const mergeCells = useCallback(() => editor.chain().focus().mergeCells().run(), [editor]);
  const splitCell = useCallback(() => editor.chain().focus().splitCell().run(), [editor]);

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800 border-t border-gray-200 dark:border-gray-700">
      {/* Info */}
      <div className="flex items-center gap-2 pr-3 border-r border-gray-300 dark:border-gray-600">
        <TableIcon className="w-4 h-4 text-brand-500" />
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Tableau</span>
      </div>

      {/* Lignes */}
      <div className="flex items-center gap-0.5 px-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Ligne:</span>
        <ToolbarSmallButton onClick={addRowBefore} title="Ajouter une ligne avant">
          <AddRowBeforeIcon />
        </ToolbarSmallButton>
        <ToolbarSmallButton onClick={addRowAfter} title="Ajouter une ligne apres">
          <AddRowAfterIcon />
        </ToolbarSmallButton>
        <ToolbarSmallButton onClick={deleteRow} title="Supprimer la ligne" danger>
          <DeleteRowIcon />
        </ToolbarSmallButton>
      </div>

      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />

      {/* Colonnes */}
      <div className="flex items-center gap-0.5 px-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Colonne:</span>
        <ToolbarSmallButton onClick={addColumnBefore} title="Ajouter une colonne avant">
          <AddColBeforeIcon />
        </ToolbarSmallButton>
        <ToolbarSmallButton onClick={addColumnAfter} title="Ajouter une colonne apres">
          <AddColAfterIcon />
        </ToolbarSmallButton>
        <ToolbarSmallButton onClick={deleteColumn} title="Supprimer la colonne" danger>
          <DeleteColIcon />
        </ToolbarSmallButton>
      </div>

      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />

      {/* En-tetes */}
      <div className="flex items-center gap-0.5 px-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">En-tete:</span>
        <ToolbarSmallButton onClick={toggleHeaderRow} title="Basculer ligne d'en-tete">
          <HeaderRowIcon />
        </ToolbarSmallButton>
        <ToolbarSmallButton onClick={toggleHeaderColumn} title="Basculer colonne d'en-tete">
          <HeaderColIcon />
        </ToolbarSmallButton>
      </div>

      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />

      {/* Fusion */}
      <div className="relative">
        <ToolbarSmallButton
          onClick={() => setShowMergeOptions(!showMergeOptions)}
          title="Options de fusion"
        >
          <MergeIcon />
        </ToolbarSmallButton>
        {showMergeOptions && (
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setShowMergeOptions(false)} />
            <div className="absolute bottom-full left-0 mb-1 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[9999] min-w-[140px]">
              <button
                onClick={() => { mergeCells(); setShowMergeOptions(false); }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <MergeIcon className="w-4 h-4" />
                Fusionner
              </button>
              <button
                onClick={() => { splitCell(); setShowMergeOptions(false); }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <SplitIcon className="w-4 h-4" />
                Diviser
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex-1" />

      {/* Supprimer tableau */}
      <ToolbarSmallButton onClick={deleteTable} title="Supprimer le tableau" danger>
        <TrashIcon />
      </ToolbarSmallButton>
    </div>
  );
}

// ===========================================
// PETIT BOUTON POUR LA TOOLBAR CONTEXTUELLE
// ===========================================

interface ToolbarSmallButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}

function ToolbarSmallButton({ onClick, title, children, danger }: ToolbarSmallButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        danger
          ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

// ===========================================
// ICONES
// ===========================================

const TableIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
);

const AddRowBeforeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="10" width="18" height="11" rx="1" />
    <line x1="9" y1="10" x2="9" y2="21" />
    <line x1="15" y1="10" x2="15" y2="21" />
    <line x1="12" y1="2" x2="12" y2="7" />
    <line x1="10" y1="4.5" x2="14" y2="4.5" />
  </svg>
);

const AddRowAfterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="11" rx="1" />
    <line x1="9" y1="3" x2="9" y2="14" />
    <line x1="15" y1="3" x2="15" y2="14" />
    <line x1="12" y1="17" x2="12" y2="22" />
    <line x1="10" y1="19.5" x2="14" y2="19.5" />
  </svg>
);

const DeleteRowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="8" width="18" height="8" rx="1" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const AddColBeforeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="10" y="3" width="11" height="18" rx="1" />
    <line x1="10" y1="9" x2="21" y2="9" />
    <line x1="10" y1="15" x2="21" y2="15" />
    <line x1="2" y1="12" x2="7" y2="12" />
    <line x1="4.5" y1="10" x2="4.5" y2="14" />
  </svg>
);

const AddColAfterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="11" height="18" rx="1" />
    <line x1="3" y1="9" x2="14" y2="9" />
    <line x1="3" y1="15" x2="14" y2="15" />
    <line x1="17" y1="12" x2="22" y2="12" />
    <line x1="19.5" y1="10" x2="19.5" y2="14" />
  </svg>
);

const DeleteColIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="8" y="3" width="8" height="18" rx="1" />
    <line x1="12" y1="8" x2="12" y2="16" />
  </svg>
);

const HeaderRowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <rect x="3" y="3" width="18" height="6" fill="currentColor" fillOpacity="0.3" />
    <line x1="3" y1="9" x2="21" y2="9" />
  </svg>
);

const HeaderColIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <rect x="3" y="3" width="6" height="18" fill="currentColor" fillOpacity="0.3" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);

const MergeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v8h6V3" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

const SplitIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="3" y1="12" x2="21" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
