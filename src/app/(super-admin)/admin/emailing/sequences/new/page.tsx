"use client";

// ===========================================
// PAGE SUPER ADMIN - Nouvelle séquence
// ===========================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, GitBranch, Plus, Trash2, RefreshCw, Mail, Clock
} from "lucide-react";

interface Step {
  order: number;
  subject: string;
  htmlContent: string;
  textContent: string;
  delayDays: number;
  delayHours: number;
}

export default function NewSequencePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    triggerType: "MANUAL",
  });

  const [steps, setSteps] = useState<Step[]>([
    { order: 1, subject: "", htmlContent: "", textContent: "", delayDays: 0, delayHours: 0 },
  ]);

  const addStep = () => {
    const lastStep = steps[steps.length - 1];
    setSteps([
      ...steps,
      {
        order: steps.length + 1,
        subject: "",
        htmlContent: "",
        textContent: "",
        delayDays: 1,
        delayHours: 0,
      },
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    const newSteps = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }));
    setSteps(newSteps);
  };

  const updateStep = (index: number, field: keyof Step, value: string | number) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/emailing/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          steps: steps.map((s) => ({
            ...s,
            delayMinutes: s.delayDays * 24 * 60 + s.delayHours * 60,
          })),
        }),
      });

      if (res.ok) {
        router.push("/admin/emailing/sequences");
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
          href="/admin/emailing/sequences"
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <GitBranch className="w-7 h-7 text-purple-500" />
            Nouvelle séquence
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Créez une campagne drip automatisée
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
              Nom de la séquence *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Onboarding nouveaux clients"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Déclencheur
            </label>
            <select
              value={formData.triggerType}
              onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="MANUAL">Manuel</option>
              <option value="SUBSCRIPTION">Inscription newsletter</option>
              <option value="TAG_ADDED">Tag ajouté</option>
              <option value="FORM_SUBMIT">Soumission formulaire</option>
              <option value="CAMPAIGN_OPENED">Ouverture campagne</option>
              <option value="CAMPAIGN_CLICKED">Clic campagne</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optionnel)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de cette séquence..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Étapes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Étapes de la séquence
          </h2>
          <button
            onClick={addStep}
            className="flex items-center gap-2 text-brand-600 hover:text-brand-700"
          >
            <Plus className="w-4 h-4" />
            Ajouter une étape
          </button>
        </div>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              {/* Ligne de connexion */}
              {index > 0 && (
                <div className="absolute -top-6 left-8 w-px h-6 bg-purple-300 dark:bg-purple-700" />
              )}

              <div className="flex items-start gap-4">
                {/* Numéro */}
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-purple-600">{step.order}</span>
                </div>

                <div className="flex-1 space-y-4">
                  {/* Délai */}
                  {index > 0 && (
                    <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Attendre</span>
                      <input
                        type="number"
                        min="0"
                        value={step.delayDays}
                        onChange={(e) => updateStep(index, "delayDays", parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">jours</span>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={step.delayHours}
                        onChange={(e) => updateStep(index, "delayHours", parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">heures</span>
                    </div>
                  )}

                  {/* Contenu */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Objet de l&apos;email
                    </label>
                    <input
                      type="text"
                      value={step.subject}
                      onChange={(e) => updateStep(index, "subject", e.target.value)}
                      placeholder="Ex: Bienvenue chez nous !"
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contenu HTML
                    </label>
                    <textarea
                      value={step.htmlContent}
                      onChange={(e) => updateStep(index, "htmlContent", e.target.value)}
                      placeholder="<html>...</html>"
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contenu texte (fallback)
                    </label>
                    <textarea
                      value={step.textContent}
                      onChange={(e) => updateStep(index, "textContent", e.target.value)}
                      placeholder="Version texte..."
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Supprimer */}
                {steps.length > 1 && (
                  <button
                    onClick={() => removeStep(index)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link
          href="/admin/emailing/sequences"
          className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          Annuler
        </Link>
        <button
          onClick={handleSubmit}
          disabled={loading || !formData.name || !steps[0].subject}
          className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
        >
          {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
          Créer la séquence
        </button>
      </div>
    </div>
  );
}
