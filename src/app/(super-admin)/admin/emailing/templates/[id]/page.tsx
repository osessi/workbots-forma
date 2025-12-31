"use client";

// ===========================================
// PAGE SUPER ADMIN - Détail/Édition template
// ===========================================

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, FileText, RefreshCw, Save, Eye, Code, Globe, Lock, Clock
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string;
  category: string;
  htmlContent: string;
  textContent: string | null;
  isGlobal: boolean;
  isDefault: boolean;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  organization?: { name: string };
}

export default function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    category: "",
    htmlContent: "",
    textContent: "",
    isGlobal: false,
  });

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/emailing/templates/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTemplate(data.template);
        setFormData({
          name: data.template.name,
          subject: data.template.subject || "",
          category: data.template.category,
          htmlContent: data.template.htmlContent || "",
          textContent: data.template.textContent || "",
          isGlobal: data.template.isGlobal,
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/emailing/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchTemplate();
        alert("Template sauvegardé !");
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-24">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Template non trouvé</p>
        <Link href="/admin/emailing/templates" className="text-brand-600 hover:underline mt-2 inline-block">
          Retour aux templates
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/emailing/templates"
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {template.name}
            </h1>
            {template.isGlobal ? (
              <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                <Globe className="w-3 h-3" /> Global
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                <Lock className="w-3 h-3" /> Privé
              </span>
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            {template.organization?.name || "Global"} · {template.usageCount} utilisations
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Sauvegarder
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 mb-1">Catégorie</p>
          <p className="font-medium text-gray-900 dark:text-white">{template.category}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 mb-1">Utilisations</p>
          <p className="font-medium text-gray-900 dark:text-white">{template.usageCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 mb-1">Dernière utilisation</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {template.lastUsedAt
              ? new Date(template.lastUsedAt).toLocaleDateString("fr-FR")
              : "Jamais"}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 mb-1">Créé le</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {new Date(template.createdAt).toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire */}
        <div className="space-y-6">
          {/* Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Configuration
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom du template
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Objet par défaut
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Catégorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="TRANSACTIONAL">Transactionnel</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="NEWSLETTER">Newsletter</option>
                  <option value="NOTIFICATION">Notification</option>
                  <option value="ONBOARDING">Onboarding</option>
                  <option value="QUALIOPI">Qualiopi</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isGlobal}
                    onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded"
                  />
                  <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Template global
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Contenu
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contenu HTML
                </label>
                <textarea
                  value={formData.htmlContent}
                  onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contenu texte
                </label>
                <textarea
                  value={formData.textContent}
                  onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Aperçu */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Aperçu
          </h2>
          {formData.htmlContent ? (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <iframe
                srcDoc={formData.htmlContent}
                className="w-full h-[500px] bg-white"
                title="Aperçu template"
              />
            </div>
          ) : (
            <div className="h-[500px] flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-gray-500">Aucun contenu HTML</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
