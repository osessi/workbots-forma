"use client";
// ===========================================
// BIBLIOTHEQUE DE BLOCS REUTILISABLES
// ===========================================
// Permet de sauvegarder et reutiliser des blocs de contenu
// (mentions legales, CGV, signatures, etc.)

import { useState, useEffect, useCallback, useRef } from "react";
import { Editor } from "@tiptap/react";

// ===========================================
// TYPES
// ===========================================

interface ReusableBlock {
  id: string;
  name: string;
  description: string | null;
  content: unknown;
  category: string;
  tags: string[];
  isSystem: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface BlocksLibraryProps {
  editor: Editor | null;
  onClose?: () => void;
}

// Categories disponibles
const BLOCK_CATEGORIES = [
  { id: "general", label: "Général", icon: "📄" },
  { id: "legal", label: "Mentions légales", icon: "⚖️" },
  { id: "signatures", label: "Signatures", icon: "✍️" },
  { id: "headers", label: "En-têtes", icon: "📋" },
  { id: "footers", label: "Pieds de page", icon: "📎" },
  { id: "tables", label: "Tableaux", icon: "📊" },
  { id: "custom", label: "Personnalisé", icon: "🎨" },
];

// ===========================================
// COMPOSANT PRINCIPAL
// ===========================================

export default function BlocksLibrary({ editor, onClose }: BlocksLibraryProps) {
  const [blocks, setBlocks] = useState<ReusableBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Charger les blocs
  const fetchBlocks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.set("category", selectedCategory);
      }
      const res = await fetch(`/api/admin/blocks?${params}`);
      if (!res.ok) throw new Error("Erreur lors du chargement des blocs");
      const data = await res.json();
      setBlocks(data.blocks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  // Filtrer les blocs par recherche
  const filteredBlocks = blocks.filter((block) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      block.name.toLowerCase().includes(query) ||
      block.description?.toLowerCase().includes(query) ||
      block.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  // Inserer un bloc dans l'editeur
  const insertBlock = useCallback(
    async (block: ReusableBlock) => {
      if (!editor) return;

      try {
        // Inserer le contenu JSON du bloc
        editor.chain().focus().insertContent(block.content as unknown as Record<string, unknown>).run();

        // Incrementer le compteur d'utilisation
        await fetch(`/api/admin/blocks/${block.id}/use`, { method: "POST" });

        onClose?.();
      } catch (err) {
        console.error("Erreur insertion bloc:", err);
      }
    },
    [editor, onClose]
  );

  // Supprimer un bloc
  const deleteBlock = useCallback(
    async (blockId: string) => {
      if (!confirm("Êtes-vous sûr de vouloir supprimer ce bloc ?")) return;

      try {
        const res = await fetch(`/api/admin/blocks/${blockId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Erreur lors de la suppression");
        setBlocks((prev) => prev.filter((b) => b.id !== blockId));
      } catch (err) {
        console.error("Erreur suppression bloc:", err);
      }
    },
    []
  );

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* En-tete */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg">
            <BlocksIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Bibliothèque de blocs
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {blocks.length} blocs disponibles
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSaveModal(true)}
            disabled={!editor || editor.isEmpty}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Sauvegarder la sélection
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Recherche et filtres */}
      <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-700">
        {/* Barre de recherche */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un bloc..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              selectedCategory === null
                ? "bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            Tous
          </button>
          {BLOCK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                selectedCategory === cat.id
                  ? "bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des blocs */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button
              onClick={fetchBlocks}
              className="mt-2 text-sm text-brand-500 hover:text-brand-600"
            >
              Réessayer
            </button>
          </div>
        ) : filteredBlocks.length === 0 ? (
          <div className="text-center py-12">
            <BlocksIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery
                ? "Aucun bloc ne correspond à votre recherche"
                : "Aucun bloc disponible"}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Sélectionnez du contenu et sauvegardez-le comme bloc réutilisable
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredBlocks.map((block) => (
              <BlockCard
                key={block.id}
                block={block}
                onInsert={() => insertBlock(block)}
                onDelete={() => deleteBlock(block.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de sauvegarde */}
      {showSaveModal && (
        <SaveBlockModal
          editor={editor}
          onClose={() => setShowSaveModal(false)}
          onSaved={() => {
            setShowSaveModal(false);
            fetchBlocks();
          }}
          saving={saving}
          setSaving={setSaving}
        />
      )}
    </div>
  );
}

// ===========================================
// CARTE DE BLOC
// ===========================================

interface BlockCardProps {
  block: ReusableBlock;
  onInsert: () => void;
  onDelete: () => void;
}

function BlockCard({ block, onInsert, onDelete }: BlockCardProps) {
  const category = BLOCK_CATEGORIES.find((c) => c.id === block.category);

  return (
    <div className="group relative p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {block.isSystem && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                Système
              </span>
            )}
            <span className="text-xs text-gray-400">
              {category?.icon} {category?.label || block.category}
            </span>
          </div>
          <h4 className="font-medium text-gray-900 dark:text-white truncate">
            {block.name}
          </h4>
          {block.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {block.description}
            </p>
          )}
          {block.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {block.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Utilisé {block.usageCount} fois
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onInsert}
            className="p-2 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
            title="Insérer"
          >
            <InsertIcon className="w-4 h-4" />
          </button>
          {!block.isSystem && (
            <button
              onClick={onDelete}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Supprimer"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================
// MODAL DE SAUVEGARDE
// ===========================================

interface SaveBlockModalProps {
  editor: Editor | null;
  onClose: () => void;
  onSaved: () => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
}

function SaveBlockModal({ editor, onClose, onSaved, saving, setSaving }: SaveBlockModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Le nom est requis");
      return;
    }
    if (!editor) return;

    setSaving(true);
    setError(null);

    try {
      // Recuperer le contenu selectionne ou tout le contenu
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;

      let content: unknown;
      if (hasSelection) {
        // Extraire le contenu selectionne
        const slice = editor.state.doc.slice(from, to);
        content = {
          type: "doc",
          content: slice.content.toJSON(),
        };
      } else {
        // Utiliser tout le contenu
        content = editor.getJSON();
      }

      const res = await fetch("/api/admin/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          content,
          category,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Sauvegarder comme bloc
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom du bloc *
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mentions légales RGPD"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Catégorie
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              {BLOCK_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ex: rgpd, legal, formation"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <SaveIcon className="w-4 h-4" />
                Sauvegarder
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// ICONES
// ===========================================

const BlocksIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const PlusIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CloseIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SearchIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const InsertIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </svg>
);

const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const SaveIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

export { BlocksIcon };
