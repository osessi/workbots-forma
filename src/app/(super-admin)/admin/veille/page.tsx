"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Newspaper,
  Scale,
  Briefcase,
  Lightbulb,
  Accessibility,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  ExternalLink,
  Check,
  X,
  Loader2,
  AlertCircle,
  Globe,
  Rss,
  Clock,
  FileText,
} from "lucide-react";

type VeilleType = "LEGALE" | "METIER" | "INNOVATION" | "HANDICAP";

interface VeilleSource {
  id: string;
  type: VeilleType;
  nom: string;
  description: string | null;
  url: string;
  logoUrl: string | null;
  isRss: boolean;
  scrapeSelector: string | null;
  refreshInterval: number;
  lastRefresh: string | null;
  nextRefresh: string | null;
  isActive: boolean;
  errorCount: number;
  lastError: string | null;
  organizationId: string | null;
  _count: {
    articles: number;
  };
}

const VEILLE_TYPES: {
  type: VeilleType;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  { type: "LEGALE", label: "Légale & Réglementaire", icon: <Scale size={18} />, color: "text-blue-600 bg-blue-100" },
  { type: "METIER", label: "Métiers & Compétences", icon: <Briefcase size={18} />, color: "text-green-600 bg-green-100" },
  { type: "INNOVATION", label: "Innovation Pédagogique", icon: <Lightbulb size={18} />, color: "text-amber-600 bg-amber-100" },
  { type: "HANDICAP", label: "Handicap & Accessibilité", icon: <Accessibility size={18} />, color: "text-purple-600 bg-purple-100" },
];


export default function AdminVeillePage() {
  const [sources, setSources] = useState<VeilleSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<VeilleType | "ALL">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<VeilleSource | null>(null);
  const [saving, setSaving] = useState(false);
  const [initializingDefaults, setInitializingDefaults] = useState(false);
  const [testingFeed, setTestingFeed] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    itemsFound: number;
    error?: string;
    sampleItems?: { title: string; link: string }[];
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    type: "LEGALE" as VeilleType,
    nom: "",
    description: "",
    url: "",
    logoUrl: "",
    isRss: true,
    scrapeSelector: "",
    refreshInterval: 1440,
  });

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/outils/veille/sources?globalOnly=true");
      if (res.ok) {
        const data = await res.json();
        setSources(data);
      }
    } catch (error) {
      console.error("Erreur fetch sources:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleRefreshSource = async (sourceId: string) => {
    try {
      setRefreshing(sourceId);
      await fetch("/api/outils/veille/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, forceRefresh: true }),
      });
      await fetchSources();
    } catch (error) {
      console.error("Erreur refresh:", error);
    } finally {
      setRefreshing(null);
    }
  };

  const handleRefreshAll = async () => {
    try {
      setRefreshing("all");
      await fetch("/api/outils/veille/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRefresh: true }),
      });
      await fetchSources();
    } catch (error) {
      console.error("Erreur refresh all:", error);
    } finally {
      setRefreshing(null);
    }
  };

  const openModal = (source?: VeilleSource) => {
    if (source) {
      setEditingSource(source);
      setFormData({
        type: source.type,
        nom: source.nom,
        description: source.description || "",
        url: source.url,
        logoUrl: source.logoUrl || "",
        isRss: source.isRss,
        scrapeSelector: source.scrapeSelector || "",
        refreshInterval: source.refreshInterval,
      });
    } else {
      setEditingSource(null);
      setFormData({
        type: "LEGALE",
        nom: "",
        description: "",
        url: "",
        logoUrl: "",
        isRss: true,
        scrapeSelector: "",
        refreshInterval: 1440,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSource(null);
    setTestResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingSource) {
        // Update
        await fetch("/api/outils/veille/sources", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingSource.id, ...formData }),
        });
      } else {
        // Create
        await fetch("/api/outils/veille/sources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, isGlobal: true }),
        });
      }
      closeModal();
      fetchSources();
    } catch (error) {
      console.error("Erreur save:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette source ? Tous les articles associés seront également supprimés.")) return;

    try {
      await fetch(`/api/outils/veille/sources?id=${id}`, { method: "DELETE" });
      fetchSources();
    } catch (error) {
      console.error("Erreur delete:", error);
    }
  };

  const handleToggleActive = async (source: VeilleSource) => {
    try {
      await fetch("/api/outils/veille/sources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: source.id, isActive: !source.isActive }),
      });
      fetchSources();
    } catch (error) {
      console.error("Erreur toggle:", error);
    }
  };

  // Initialiser avec les vraies sources depuis l'API
  const initializeDefaultSources = async () => {
    if (!confirm("Voulez-vous créer les sources de veille par défaut ? Les sources existantes ne seront pas modifiées.")) return;

    setInitializingDefaults(true);
    try {
      const res = await fetch("/api/outils/veille/init-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      alert(`${data.message}`);
      fetchSources();
    } catch (error) {
      console.error("Erreur init defaults:", error);
      alert("Erreur lors de l'initialisation des sources");
    } finally {
      setInitializingDefaults(false);
    }
  };

  // Réinitialiser toutes les sources
  const resetAllSources = async () => {
    if (!confirm("⚠️ ATTENTION: Cela va SUPPRIMER toutes les sources existantes et les recréer. Continuer ?")) return;

    setInitializingDefaults(true);
    try {
      const res = await fetch("/api/outils/veille/init-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetAll: true }),
      });
      const data = await res.json();
      alert(`${data.message}`);
      fetchSources();
    } catch (error) {
      console.error("Erreur reset sources:", error);
      alert("Erreur lors de la réinitialisation");
    } finally {
      setInitializingDefaults(false);
    }
  };

  // Tester un flux RSS
  const testFeed = async () => {
    if (!formData.url) {
      alert("Veuillez entrer une URL");
      return;
    }

    setTestingFeed(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/outils/veille/test-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formData.url }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (error) {
      console.error("Erreur test feed:", error);
      setTestResult({
        success: false,
        itemsFound: 0,
        error: "Erreur lors du test",
      });
    } finally {
      setTestingFeed(false);
    }
  };

  const filteredSources = activeTab === "ALL" ? sources : sources.filter((s) => s.type === activeTab);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Jamais";
    const date = new Date(dateStr);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-xl">
            <Newspaper className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestion des sources de veille
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configurez les flux RSS et pages web à scraper
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {sources.length === 0 ? (
            <button
              onClick={initializeDefaultSources}
              disabled={initializingDefaults}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {initializingDefaults ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
              Initialiser sources par défaut
            </button>
          ) : (
            <button
              onClick={resetAllSources}
              disabled={initializingDefaults}
              className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 disabled:opacity-50 transition-colors text-sm"
              title="Réinitialiser toutes les sources avec les valeurs par défaut"
            >
              {initializingDefaults ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}
              Réinitialiser
            </button>
          )}
          <button
            onClick={handleRefreshAll}
            disabled={refreshing === "all"}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw size={18} className={refreshing === "all" ? "animate-spin" : ""} />
            Tout actualiser
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            <Plus size={18} />
            Ajouter une source
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "ALL"
              ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
          }`}
        >
          <Globe size={16} />
          Toutes ({sources.length})
        </button>
        {VEILLE_TYPES.map((vt) => {
          const count = sources.filter((s) => s.type === vt.type).length;
          return (
            <button
              key={vt.type}
              onClick={() => setActiveTab(vt.type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === vt.type
                  ? vt.color
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
              }`}
            >
              {vt.icon}
              {vt.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Sources List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : filteredSources.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <Newspaper className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Aucune source configurée
          </p>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            Ajouter une source
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSources.map((source) => {
            const veilleType = VEILLE_TYPES.find((vt) => vt.type === source.type)!;
            return (
              <div
                key={source.id}
                className={`p-4 bg-white dark:bg-gray-800 rounded-xl border ${
                  source.isActive ? "border-gray-200 dark:border-gray-700" : "border-red-200 dark:border-red-800 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${veilleType.color}`}>
                      {source.isRss ? <Rss size={20} /> : <Globe size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {source.nom}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs rounded ${veilleType.color}`}>
                          {veilleType.label}
                        </span>
                        {!source.isActive && (
                          <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded">
                            Désactivée
                          </span>
                        )}
                        {source.errorCount > 0 && (
                          <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-600 rounded flex items-center gap-1">
                            <AlertCircle size={10} />
                            {source.errorCount} erreurs
                          </span>
                        )}
                      </div>
                      {source.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {source.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-brand-500 transition-colors"
                        >
                          <ExternalLink size={12} />
                          {source.url.slice(0, 50)}...
                        </a>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          Dernière MAJ : {formatDate(source.lastRefresh)}
                        </span>
                        <span>
                          {source._count.articles} articles
                        </span>
                      </div>
                      {source.lastError && (
                        <p className="text-xs text-red-500 mt-1">
                          Erreur : {source.lastError.slice(0, 100)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRefreshSource(source.id)}
                      disabled={refreshing === source.id}
                      className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"
                      title="Actualiser"
                    >
                      <RefreshCw size={18} className={refreshing === source.id ? "animate-spin" : ""} />
                    </button>
                    <button
                      onClick={() => handleToggleActive(source)}
                      className={`p-2 rounded-lg transition-colors ${
                        source.isActive
                          ? "text-green-500 hover:bg-green-50"
                          : "text-red-500 hover:bg-red-50"
                      }`}
                      title={source.isActive ? "Désactiver" : "Activer"}
                    >
                      {source.isActive ? <Check size={18} /> : <X size={18} />}
                    </button>
                    <button
                      onClick={() => openModal(source)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(source.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingSource ? "Modifier la source" : "Nouvelle source"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type de veille
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as VeilleType })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {VEILLE_TYPES.map((vt) => (
                    <option key={vt.type} value={vt.type}>
                      {vt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom de la source
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                  placeholder="Ex: France Compétences - Actualités"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* URL avec bouton de test */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL du flux RSS ou de la page
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => {
                      setFormData({ ...formData, url: e.target.value });
                      setTestResult(null);
                    }}
                    required
                    placeholder="https://example.com/feed.xml"
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={testFeed}
                    disabled={testingFeed || !formData.url}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    {testingFeed ? <Loader2 size={16} className="animate-spin" /> : <Rss size={16} />}
                    Tester
                  </button>
                </div>
                {/* Résultat du test */}
                {testResult && (
                  <div className={`mt-2 p-3 rounded-lg text-sm ${
                    testResult.success
                      ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {testResult.success ? (
                        <Check size={16} className="text-green-600" />
                      ) : (
                        <X size={16} className="text-red-600" />
                      )}
                      <span className={testResult.success ? "text-green-700 dark:text-green-400 font-medium" : "text-red-700 dark:text-red-400 font-medium"}>
                        {testResult.success ? `${testResult.itemsFound} articles trouvés` : "Échec du test"}
                      </span>
                    </div>
                    {testResult.error && (
                      <p className="text-red-600 dark:text-red-400 text-xs">{testResult.error}</p>
                    )}
                    {testResult.sampleItems && testResult.sampleItems.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Aperçu des articles :</p>
                        {testResult.sampleItems.slice(0, 3).map((item, idx) => (
                          <p key={idx} className="text-xs text-gray-600 dark:text-gray-300 truncate">
                            • {item.title}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Brève description de la source..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Type de source */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.isRss}
                    onChange={() => setFormData({ ...formData, isRss: true })}
                    className="w-4 h-4 text-brand-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Flux RSS</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!formData.isRss}
                    onChange={() => setFormData({ ...formData, isRss: false })}
                    className="w-4 h-4 text-brand-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Page web (scraping IA)</span>
                </label>
              </div>

              {/* Scrape selector (si pas RSS) */}
              {!formData.isRss && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sélecteur CSS (optionnel)
                  </label>
                  <input
                    type="text"
                    value={formData.scrapeSelector}
                    onChange={(e) => setFormData({ ...formData, scrapeSelector: e.target.value })}
                    placeholder="Ex: .article-list .item"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    L&apos;IA extraira automatiquement les articles si non renseigné
                  </p>
                </div>
              )}

              {/* Intervalle de refresh */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fréquence de mise à jour
                </label>
                <select
                  value={formData.refreshInterval}
                  onChange={(e) => setFormData({ ...formData, refreshInterval: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={60}>Toutes les heures</option>
                  <option value={360}>Toutes les 6 heures</option>
                  <option value={720}>Toutes les 12 heures</option>
                  <option value={1440}>Tous les jours</option>
                  <option value={10080}>Toutes les semaines</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {editingSource ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
