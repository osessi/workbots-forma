"use client";

// ===========================================
// PAGE SUPER ADMIN - Templates email
// ===========================================

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, FileText, Search, RefreshCw, MoreVertical,
  Eye, Copy, Trash2, Edit2, Star, Lock, Globe, Clock
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string;
  category: string;
  isGlobal: boolean;
  isDefault: boolean;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  organization?: { name: string };
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  TRANSACTIONAL: { label: "Transactionnel", color: "bg-blue-100 text-blue-700" },
  MARKETING: { label: "Marketing", color: "bg-purple-100 text-purple-700" },
  NEWSLETTER: { label: "Newsletter", color: "bg-orange-100 text-orange-700" },
  NOTIFICATION: { label: "Notification", color: "bg-green-100 text-green-700" },
  ONBOARDING: { label: "Onboarding", color: "bg-cyan-100 text-cyan-700" },
  QUALIOPI: { label: "Qualiopi", color: "bg-amber-100 text-amber-700" },
  OTHER: { label: "Autre", color: "bg-gray-100 text-gray-700" },
};

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterGlobal, setFilterGlobal] = useState<boolean | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/emailing/templates?global=true");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const duplicateTemplate = async (id: string) => {
    try {
      const res = await fetch(`/api/emailing/templates/${id}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
    setOpenMenuId(null);
  };

  const toggleGlobal = async (id: string, isGlobal: boolean) => {
    try {
      const res = await fetch(`/api/emailing/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isGlobal: !isGlobal }),
      });
      if (res.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
    setOpenMenuId(null);
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Supprimer ce template ?")) return;
    try {
      await fetch(`/api/emailing/templates/${id}`, { method: "DELETE" });
      fetchTemplates();
    } catch (error) {
      console.error("Erreur:", error);
    }
    setOpenMenuId(null);
  };

  const filteredTemplates = templates.filter((t) => {
    const matchSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || t.category === filterCategory;
    const matchGlobal = filterGlobal === null || t.isGlobal === filterGlobal;
    return matchSearch && matchCategory && matchGlobal;
  });

  const globalCount = templates.filter((t) => t.isGlobal).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/emailing"
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileText className="w-7 h-7 text-indigo-500" />
            Templates Email
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {templates.length} templates · {globalCount} globaux
          </p>
        </div>
        <Link
          href="/admin/emailing/templates/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" />
          Nouveau template
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un template..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <select
            value={filterCategory || ""}
            onChange={(e) => setFilterCategory(e.target.value || null)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Toutes catégories</option>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          <select
            value={filterGlobal === null ? "" : filterGlobal.toString()}
            onChange={(e) => setFilterGlobal(e.target.value === "" ? null : e.target.value === "true")}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Tous</option>
            <option value="true">Globaux</option>
            <option value="false">Organisation</option>
          </select>
          <button
            onClick={fetchTemplates}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun template</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const categoryConfig = CATEGORY_CONFIG[template.category] || CATEGORY_CONFIG.OTHER;
            return (
              <div
                key={template.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all relative group"
              >
                {/* Badges */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  {template.isDefault && (
                    <span className="p-1 bg-amber-100 dark:bg-amber-900/30 rounded" title="Template par défaut">
                      <Star className="w-3 h-3 text-amber-600" />
                    </span>
                  )}
                  {template.isGlobal ? (
                    <span className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded" title="Template global">
                      <Globe className="w-3 h-3 text-blue-600" />
                    </span>
                  ) : (
                    <span className="p-1 bg-gray-100 dark:bg-gray-700 rounded" title="Template organisation">
                      <Lock className="w-3 h-3 text-gray-500" />
                    </span>
                  )}
                </div>

                {/* Menu */}
                <div className="absolute top-4 right-16">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === template.id ? null : template.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                  {openMenuId === template.id && (
                    <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                      <Link
                        href={`/admin/emailing/templates/${template.id}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Eye className="w-4 h-4" />
                        Voir / Éditer
                      </Link>
                      <button
                        onClick={() => duplicateTemplate(template.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Copy className="w-4 h-4" />
                        Dupliquer
                      </button>
                      <button
                        onClick={() => toggleGlobal(template.id, template.isGlobal)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {template.isGlobal ? (
                          <>
                            <Lock className="w-4 h-4" />
                            Rendre privé
                          </>
                        ) : (
                          <>
                            <Globe className="w-4 h-4" />
                            Rendre global
                          </>
                        )}
                      </button>
                      {!template.isDefault && (
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <Link href={`/admin/emailing/templates/${template.id}`}>
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>

                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 pr-16">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                    {template.subject}
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryConfig.color}`}>
                      {categoryConfig.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {template.organization?.name || "Global"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-3 h-3" />
                      {template.usageCount} utilisations
                    </div>
                    {template.lastUsedAt && (
                      <span className="text-xs text-gray-400">
                        {new Date(template.lastUsedAt).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
        <p className="text-sm text-indigo-800 dark:text-indigo-200">
          <strong>Templates globaux :</strong> Les templates marqués comme &quot;globaux&quot; sont disponibles
          pour toutes les organisations. Les templates privés ne sont accessibles que par leur organisation propriétaire.
        </p>
      </div>
    </div>
  );
}
