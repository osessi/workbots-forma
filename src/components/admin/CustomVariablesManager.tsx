"use client";
// ===========================================
// GESTIONNAIRE DE VARIABLES PERSONNALISEES
// ===========================================
// Permet de creer et gerer des variables
// personnalisees propres a l'organisation

import { useState, useEffect, useCallback, useRef } from "react";

// ===========================================
// TYPES
// ===========================================

interface CustomVariable {
  id: string;
  variableId: string;
  label: string;
  description: string | null;
  category: string;
  defaultValue: string | null;
  dataType: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomVariablesManagerProps {
  className?: string;
}

const DATA_TYPES = [
  { id: "text", label: "Texte", icon: "Aa" },
  { id: "number", label: "Nombre", icon: "#" },
  { id: "date", label: "Date", icon: "📅" },
  { id: "email", label: "Email", icon: "@" },
  { id: "phone", label: "Téléphone", icon: "📞" },
  { id: "url", label: "URL", icon: "🔗" },
];

const CATEGORIES = [
  { id: "organisation", label: "Organisation" },
  { id: "formation", label: "Formation" },
  { id: "participant", label: "Participant" },
  { id: "document", label: "Document" },
  { id: "autre", label: "Autre" },
];

// ===========================================
// COMPOSANT PRINCIPAL
// ===========================================

export default function CustomVariablesManager({
  className = "",
}: CustomVariablesManagerProps) {
  const [variables, setVariables] = useState<CustomVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVariable, setEditingVariable] = useState<CustomVariable | null>(null);

  // Charger les variables
  const fetchVariables = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/custom-variables");
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data = await res.json();
      setVariables(data.variables || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVariables();
  }, [fetchVariables]);

  // Supprimer une variable
  const deleteVariable = async (id: string) => {
    if (!confirm("Supprimer cette variable ? Les documents utilisant cette variable ne seront plus renseignés.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/custom-variables/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      setVariables((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  // Grouper par categorie
  const groupedVariables = variables.reduce((acc, v) => {
    const cat = v.category || "autre";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(v);
    return acc;
  }, {} as Record<string, CustomVariable[]>);

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* En-tete */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg">
            <VariableIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Variables personnalisées
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {variables.length} variable{variables.length > 1 ? "s" : ""} définie{variables.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Nouvelle variable
        </button>
      </div>

      {/* Contenu */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button
              onClick={fetchVariables}
              className="mt-2 text-sm text-teal-500 hover:text-teal-600"
            >
              Réessayer
            </button>
          </div>
        ) : variables.length === 0 ? (
          <div className="text-center py-12">
            <VariableIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Aucune variable personnalisée
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Créez des variables spécifiques à votre organisation
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600"
            >
              Créer une variable
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedVariables).map(([category, vars]) => {
              const catInfo = CATEGORIES.find((c) => c.id === category) || {
                id: category,
                label: category,
              };
              return (
                <div key={category}>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    {catInfo.label}
                  </h4>
                  <div className="grid gap-3">
                    {vars.map((variable) => (
                      <VariableCard
                        key={variable.id}
                        variable={variable}
                        onEdit={() => setEditingVariable(variable)}
                        onDelete={() => deleteVariable(variable.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de creation/edition */}
      {(showCreateModal || editingVariable) && (
        <VariableModal
          variable={editingVariable}
          onClose={() => {
            setShowCreateModal(false);
            setEditingVariable(null);
          }}
          onSaved={() => {
            setShowCreateModal(false);
            setEditingVariable(null);
            fetchVariables();
          }}
        />
      )}
    </div>
  );
}

// ===========================================
// CARTE DE VARIABLE
// ===========================================

interface VariableCardProps {
  variable: CustomVariable;
  onEdit: () => void;
  onDelete: () => void;
}

function VariableCard({ variable, onEdit, onDelete }: VariableCardProps) {
  const dataType = DATA_TYPES.find((t) => t.id === variable.dataType) || DATA_TYPES[0];

  return (
    <div className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg font-mono text-sm">
          {dataType.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white">
              {variable.label}
            </span>
            <code className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded font-mono">
              {`{{${variable.variableId}}}`}
            </code>
          </div>
          {variable.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {variable.description}
            </p>
          )}
          {variable.defaultValue && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Défaut: {variable.defaultValue}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-2 text-gray-500 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
          title="Modifier"
        >
          <EditIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title="Supprimer"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ===========================================
// MODAL DE CREATION/EDITION
// ===========================================

interface VariableModalProps {
  variable: CustomVariable | null;
  onClose: () => void;
  onSaved: () => void;
}

function VariableModal({ variable, onClose, onSaved }: VariableModalProps) {
  const [variableId, setVariableId] = useState(
    variable?.variableId.replace("custom.", "") || ""
  );
  const [label, setLabel] = useState(variable?.label || "");
  const [description, setDescription] = useState(variable?.description || "");
  const [category, setCategory] = useState(variable?.category || "organisation");
  const [defaultValue, setDefaultValue] = useState(variable?.defaultValue || "");
  const [dataType, setDataType] = useState(variable?.dataType || "text");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!variable) {
      idInputRef.current?.focus();
    }
  }, [variable]);

  const handleSave = async () => {
    if (!variableId.trim() || !label.trim()) {
      setError("L'ID et le label sont requis");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = variable
        ? `/api/admin/custom-variables/${variable.id}`
        : "/api/admin/custom-variables";
      const method = variable ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variableId: variableId.trim(),
          label: label.trim(),
          description: description.trim() || null,
          category,
          defaultValue: defaultValue.trim() || null,
          dataType,
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

  // Generer un ID valide a partir du label
  const generateIdFromLabel = () => {
    const id = label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    setVariableId(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {variable ? "Modifier la variable" : "Nouvelle variable"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Label *
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onBlur={() => !variableId && generateIdFromLabel()}
                placeholder="Ex: Numéro de déclaration d'activité"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ID de la variable *
              </label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg text-sm text-gray-500">
                  custom.
                </div>
                <input
                  ref={idInputRef}
                  type="text"
                  value={variableId}
                  onChange={(e) =>
                    setVariableId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                  }
                  disabled={!!variable}
                  placeholder="numero_da"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50 font-mono text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Sera utilisé comme: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{`{{custom.${variableId || "..."}}}`}</code>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Catégorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type de données
              </label>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {DATA_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description optionnelle..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valeur par défaut
              </label>
              <input
                type="text"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                placeholder="Valeur utilisée si non renseignée"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !variableId.trim() || !label.trim()}
            className="px-4 py-2 text-sm font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <SaveIcon className="w-4 h-4" />
                {variable ? "Mettre à jour" : "Créer"}
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

const VariableIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7V4h16v3" />
    <path d="M9 20h6" />
    <path d="M12 4v16" />
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

const EditIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
