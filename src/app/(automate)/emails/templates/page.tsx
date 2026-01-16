"use client";

// ===========================================
// PAGE TEMPLATES - Gestion des modèles d'emails
// ===========================================

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, FileText, Search, Edit, Trash2, Copy,
  RefreshCw, X, Check, Eye, MoreVertical
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string;
  category: string;
  content: string;
  isGlobal: boolean;
  isDefault: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: "CONVOCATION", label: "Convocation" },
  { value: "INVITATION", label: "Invitation" },
  { value: "CONFIRMATION", label: "Confirmation" },
  { value: "RAPPEL", label: "Rappel" },
  { value: "ATTESTATION", label: "Attestation" },
  { value: "NEWSLETTER", label: "Newsletter" },
  { value: "NOTIFICATION", label: "Notification" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "AUTRE", label: "Autre" },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [formName, setFormName] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formCategory, setFormCategory] = useState("AUTRE");
  const [formContent, setFormContent] = useState("");
  const [formIsDefault, setFormIsDefault] = useState(false);

  // Preview
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Menu dropdown
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/emailing/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Erreur fetch templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditingTemplate(null);
    setFormName("");
    setFormSubject("");
    setFormCategory("AUTRE");
    setFormContent("");
    setFormIsDefault(false);
    setShowModal(true);
  };

  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormSubject(template.subject);
    setFormCategory(template.category);
    setFormContent(template.content);
    setFormIsDefault(template.isDefault);
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formSubject.trim()) {
      alert("Veuillez remplir le nom et le sujet");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: formName,
        subject: formSubject,
        category: formCategory,
        content: formContent,
        isDefault: formIsDefault,
      };

      let res;
      if (editingTemplate) {
        res = await fetch(`/api/emailing/templates/${editingTemplate.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/emailing/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur lors de la sauvegarde");
      }

      setShowModal(false);
      fetchTemplates();
    } catch (error) {
      console.error("Erreur save:", error);
      alert(error instanceof Error ? error.message : "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce template ?")) return;

    try {
      const res = await fetch(`/api/emailing/templates/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      fetchTemplates();
    } catch (error) {
      console.error("Erreur delete:", error);
      alert("Erreur lors de la suppression");
    }
    setOpenMenuId(null);
  };

  const handleDuplicate = async (template: Template) => {
    try {
      const res = await fetch("/api/emailing/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${template.name} (copie)`,
          subject: template.subject,
          category: template.category,
          content: template.content,
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la duplication");
      }

      fetchTemplates();
    } catch (error) {
      console.error("Erreur duplicate:", error);
      alert("Erreur lors de la duplication");
    }
    setOpenMenuId(null);
  };

  const filteredTemplates = templates.filter((t) => {
    const matchSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || t.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/emails"
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FileText className="w-7 h-7 text-brand-600" />
              Templates d&apos;emails
            </h1>
            {/* Correction 557: Sous-titre reformulé */}
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Créez et réutilisez vos emails types en quelques clics.
            </p>
          </div>
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau template
          </button>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un template..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Correction 558: Padding ajusté pour la flèche */}
            <select
              value={filterCategory || ""}
              onChange={(e) => setFilterCategory(e.target.value || null)}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Toutes les catégories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucun template
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {search || filterCategory ? "Aucun résultat pour votre recherche" : "Créez votre premier template d'email"}
            </p>
            <button
              onClick={openNewModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
            >
              <Plus className="w-4 h-4" />
              Créer un template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all group relative"
              >
                {/* Menu */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === template.id ? null : template.id);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>

                  {openMenuId === template.id && (
                    <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                      <button
                        onClick={() => openEditModal(template)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Edit className="w-4 h-4" />
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDuplicate(template)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Copy className="w-4 h-4" />
                        Dupliquer
                      </button>
                      <button
                        onClick={() => setPreviewTemplate(template)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Eye className="w-4 h-4" />
                        Aperçu
                      </button>
                      {!template.isGlobal && (
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div onClick={() => setPreviewTemplate(template)} className="cursor-pointer">
                  {/* Badge catégorie */}
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full mb-3">
                    {CATEGORIES.find((c) => c.value === template.category)?.label || template.category}
                  </span>

                  {/* Badges */}
                  <div className="flex gap-2 mb-3">
                    {template.isGlobal && (
                      <span className="inline-flex px-2 py-0.5 text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded">
                        Global
                      </span>
                    )}
                    {template.isDefault && (
                      <span className="inline-flex px-2 py-0.5 text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded">
                        Par défaut
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 pr-8">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                    {template.subject}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{template.usageCount} utilisation{template.usageCount > 1 ? "s" : ""}</span>
                    <span>{formatDate(template.updatedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Création/Edition */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {editingTemplate ? "Modifier le template" : "Nouveau template"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom du template *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  placeholder="Ex: Confirmation d'inscription"
                />
              </div>

              {/* Correction 559: Libellé renommé */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Objet de l&apos;email *
                </label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  placeholder="Ex: Confirmation de votre inscription à {{formation}}"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Catégorie
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contenu HTML
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 font-mono text-sm resize-none"
                  placeholder="<h1>Bonjour {{prenom}}</h1>..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Variables : {"{{prenom}}"}, {"{{nom}}"}, {"{{email}}"}, {"{{formation}}"}, {"{{session}}"}, {"{{date}}"}
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Définir comme template par défaut pour cette catégorie
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formName.trim() || !formSubject.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aperçu */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {previewTemplate.name}
                </h3>
                <p className="text-sm text-gray-500">{previewTemplate.subject}</p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900">
              {previewTemplate.content ? (
                <div
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto"
                  dangerouslySetInnerHTML={{ __html: previewTemplate.content }}
                />
              ) : (
                <p className="text-center text-gray-500 py-12">
                  Aucun contenu défini pour ce template
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
