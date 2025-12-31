"use client";

// ===========================================
// PAGE SUPER ADMIN - Nouvelle campagne email
// ===========================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Send, Save, Users, FileText, Clock, Target,
  RefreshCw, ChevronRight, Eye, Sparkles
} from "lucide-react";

interface Audience {
  id: string;
  name: string;
  activeContacts: number;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  category: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    preheader: "",
    audienceId: "",
    templateId: "",
    htmlContent: "",
    textContent: "",
    type: "MARKETING",
    scheduledAt: "",
    sendNow: true,
  });

  useEffect(() => {
    fetchAudiences();
    fetchTemplates();
  }, []);

  const fetchAudiences = async () => {
    try {
      const res = await fetch("/api/emailing/audiences?global=true");
      if (res.ok) {
        const data = await res.json();
        setAudiences(data.audiences || []);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/emailing/templates?global=true");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const selectTemplate = (template: Template) => {
    setFormData({
      ...formData,
      templateId: template.id,
      subject: template.subject || formData.subject,
    });
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    try {
      setLoading(true);
      const res = await fetch("/api/emailing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: isDraft ? "DRAFT" : (formData.sendNow ? "SENDING" : "SCHEDULED"),
        }),
      });

      if (res.ok) {
        router.push("/admin/emailing/campaigns");
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

  const selectedAudience = audiences.find(a => a.id === formData.audienceId);
  const selectedTemplate = templates.find(t => t.id === formData.templateId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/emailing/campaigns"
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Target className="w-7 h-7 text-brand-500" />
            Nouvelle campagne
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Créez et envoyez une campagne email
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {[
          { num: 1, label: "Configuration" },
          { num: 2, label: "Audience" },
          { num: 3, label: "Contenu" },
          { num: 4, label: "Planification" },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <button
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                step === s.num
                  ? "bg-brand-500 text-white"
                  : step > s.num
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
                {s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < 3 && <ChevronRight className="w-5 h-5 text-gray-300 mx-2" />}
          </div>
        ))}
      </div>

      {/* Step 1: Configuration */}
      {step === 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Configuration de la campagne
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom de la campagne *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Newsletter Janvier 2025"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Objet de l&apos;email *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Ex: Découvrez nos nouveautés !"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pré-header (optionnel)
              </label>
              <input
                type="text"
                value={formData.preheader}
                onChange={(e) => setFormData({ ...formData, preheader: e.target.value })}
                placeholder="Texte d'aperçu dans la boîte de réception"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type de campagne
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="MARKETING">Marketing</option>
                <option value="TRANSACTIONAL">Transactionnel</option>
                <option value="NEWSLETTER">Newsletter</option>
                <option value="NOTIFICATION">Notification</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setStep(2)}
              disabled={!formData.name || !formData.subject}
              className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Audience */}
      {step === 2 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sélectionner une audience
          </h2>
          {audiences.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Aucune audience disponible</p>
              <Link
                href="/admin/emailing/audiences/new"
                className="text-brand-600 hover:underline"
              >
                Créer une audience
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {audiences.map((audience) => (
                <button
                  key={audience.id}
                  onClick={() => setFormData({ ...formData, audienceId: audience.id })}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    formData.audienceId === audience.id
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{audience.name}</p>
                      <p className="text-sm text-gray-500">{audience.activeContacts.toLocaleString()} contacts actifs</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Retour
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!formData.audienceId}
              className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Contenu */}
      {step === 3 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Contenu de l&apos;email
          </h2>

          {/* Templates */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Utiliser un template (optionnel)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => selectTemplate(template)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    formData.templateId === template.id
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {template.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Contenu HTML */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contenu HTML
            </label>
            <textarea
              value={formData.htmlContent}
              onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
              placeholder="<html>...</html>"
              rows={10}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            />
          </div>

          {/* Contenu texte */}
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

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Retour
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Planification */}
      {step === 4 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Planification
          </h2>

          {/* Récapitulatif */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Récapitulatif</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Campagne:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{formData.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Objet:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{formData.subject}</span>
              </div>
              <div>
                <span className="text-gray-500">Audience:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{selectedAudience?.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Destinataires:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{selectedAudience?.activeContacts.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Options d'envoi */}
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <input
                type="radio"
                checked={formData.sendNow}
                onChange={() => setFormData({ ...formData, sendNow: true, scheduledAt: "" })}
                className="w-4 h-4 text-brand-600"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Envoyer maintenant</p>
                <p className="text-sm text-gray-500">La campagne sera envoyée immédiatement</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <input
                type="radio"
                checked={!formData.sendNow}
                onChange={() => setFormData({ ...formData, sendNow: false })}
                className="w-4 h-4 text-brand-600"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Programmer l&apos;envoi</p>
                <p className="text-sm text-gray-500">Choisissez une date et heure d&apos;envoi</p>
                {!formData.sendNow && (
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="mt-2 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                )}
              </div>
            </label>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Retour
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Save className="w-4 h-4" />
                Sauvegarder brouillon
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={loading || (!formData.sendNow && !formData.scheduledAt)}
                className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {formData.sendNow ? "Envoyer" : "Programmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
