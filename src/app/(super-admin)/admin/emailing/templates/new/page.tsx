"use client";

// ===========================================
// PAGE SUPER ADMIN - Nouveau template email
// ===========================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, FileText, RefreshCw, Eye, Code, Globe
} from "lucide-react";

export default function NewTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    category: "MARKETING",
    htmlContent: "",
    textContent: "",
    isGlobal: true,
  });

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/emailing/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/admin/emailing/templates");
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileText className="w-7 h-7 text-indigo-500" />
            Nouveau template
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Créez un modèle d&apos;email réutilisable
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              previewMode
                ? "bg-brand-50 border-brand-500 text-brand-600"
                : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {previewMode ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {previewMode ? "Éditer" : "Aperçu"}
          </button>
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
                  Nom du template *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Bienvenue client"
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
                  placeholder="Ex: Bienvenue chez nous !"
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
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Template global
                    </span>
                    <p className="text-sm text-gray-500">
                      Disponible pour toutes les organisations
                    </p>
                  </div>
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
                  Contenu HTML *
                </label>
                <textarea
                  value={formData.htmlContent}
                  onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                  placeholder="<html>...</html>"
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Variables disponibles: {"{{prenom}}"}, {"{{nom}}"}, {"{{email}}"}, {"{{entreprise}}"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contenu texte (fallback)
                </label>
                <textarea
                  value={formData.textContent}
                  onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                  placeholder="Version texte de l'email..."
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
              <div className="text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Entrez du contenu HTML pour voir l&apos;aperçu</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link
          href="/admin/emailing/templates"
          className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          Annuler
        </Link>
        <button
          onClick={handleSubmit}
          disabled={loading || !formData.name || !formData.htmlContent}
          className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
        >
          {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
          Créer le template
        </button>
      </div>
    </div>
  );
}
