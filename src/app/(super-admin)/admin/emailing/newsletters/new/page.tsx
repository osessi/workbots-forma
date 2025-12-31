"use client";

// ===========================================
// PAGE SUPER ADMIN - Nouvelle newsletter
// ===========================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Newspaper, RefreshCw
} from "lucide-react";

export default function NewNewsletterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    frequency: "MONTHLY",
    welcomeSubject: "Bienvenue à notre newsletter",
    welcomeContent: "",
    confirmationRequired: true,
  });

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/emailing/newsletters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/admin/emailing/newsletters");
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
          href="/admin/emailing/newsletters"
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Newspaper className="w-7 h-7 text-orange-500" />
            Nouvelle newsletter
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Créez une newsletter pour collecter des abonnés
          </p>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom de la newsletter *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Newsletter mensuelle"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fréquence
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="DAILY">Quotidienne</option>
              <option value="WEEKLY">Hebdomadaire</option>
              <option value="BIWEEKLY">Bi-mensuelle</option>
              <option value="MONTHLY">Mensuelle</option>
              <option value="QUARTERLY">Trimestrielle</option>
              <option value="ON_DEMAND">À la demande</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de cette newsletter..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Email de bienvenue */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Email de bienvenue
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Objet de l&apos;email de bienvenue
            </label>
            <input
              type="text"
              value={formData.welcomeSubject}
              onChange={(e) => setFormData({ ...formData, welcomeSubject: e.target.value })}
              placeholder="Ex: Bienvenue à notre newsletter !"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contenu de l&apos;email de bienvenue (HTML)
            </label>
            <textarea
              value={formData.welcomeContent}
              onChange={(e) => setFormData({ ...formData, welcomeContent: e.target.value })}
              placeholder="<html>...</html>"
              rows={6}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            />
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.confirmationRequired}
                onChange={(e) => setFormData({ ...formData, confirmationRequired: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  Double opt-in requis
                </span>
                <p className="text-sm text-gray-500">
                  Les abonnés doivent confirmer leur inscription (recommandé pour le RGPD)
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link
          href="/admin/emailing/newsletters"
          className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          Annuler
        </Link>
        <button
          onClick={handleSubmit}
          disabled={loading || !formData.name}
          className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
        >
          {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
          Créer la newsletter
        </button>
      </div>
    </div>
  );
}
