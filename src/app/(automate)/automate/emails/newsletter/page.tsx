"use client";

// ===========================================
// PAGE NEWSLETTER - Gestion des newsletters
// ===========================================

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Newspaper, Search, Users, Send, Eye,
  RefreshCw, X, Check, MoreVertical, TrendingUp, Mail,
  UserPlus, Settings, BarChart3
} from "lucide-react";

interface Newsletter {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  totalCount: number;
  activeCount: number;
  totalSent: number;
  totalOpened: number;
  averageOpenRate: number;
  createdAt: string;
  _count?: {
    subscribers: number;
    issues: number;
  };
}

export default function NewsletterPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal création
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [importApprenants, setImportApprenants] = useState(false);

  // Menu dropdown
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/emailing/newsletters");
      if (res.ok) {
        const data = await res.json();
        setNewsletters(data.newsletters || []);
      }
    } catch (error) {
      console.error("Erreur fetch newsletters:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formName.trim()) {
      alert("Veuillez saisir un nom");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/emailing/newsletters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDescription || undefined,
          importFromApprenants: importApprenants,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur lors de la création");
      }

      setShowModal(false);
      setFormName("");
      setFormDescription("");
      setImportApprenants(false);
      fetchNewsletters();
    } catch (error) {
      console.error("Erreur création:", error);
      alert(error instanceof Error ? error.message : "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/emailing/newsletters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        fetchNewsletters();
      }
    } catch (error) {
      console.error("Erreur toggle:", error);
    }
    setOpenMenuId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette newsletter et tous ses abonnés ?")) return;

    try {
      const res = await fetch(`/api/emailing/newsletters/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchNewsletters();
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
    setOpenMenuId(null);
  };

  const filteredNewsletters = newsletters.filter((n) =>
    n.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalSubscribers = newsletters.reduce((acc, n) => acc + n.activeCount, 0);
  const totalSent = newsletters.reduce((acc, n) => acc + n.totalSent, 0);
  const avgOpenRate = newsletters.length > 0
    ? Math.round(newsletters.reduce((acc, n) => acc + n.averageOpenRate, 0) / newsletters.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/automate/emails"
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Newspaper className="w-7 h-7 text-brand-600" />
              Newsletters
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Gérez vos listes de diffusion et envoyez des newsletters
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle newsletter
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalSubscribers.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Abonnés actifs</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Send className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalSent.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Emails envoyés</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {avgOpenRate}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Taux d&apos;ouverture moyen</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recherche */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une newsletter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : filteredNewsletters.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Newspaper className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucune newsletter
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Créez votre première newsletter pour communiquer avec vos apprenants
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
            >
              <Plus className="w-4 h-4" />
              Créer une newsletter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNewsletters.map((newsletter) => (
              <div
                key={newsletter.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all group relative"
              >
                {/* Menu */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === newsletter.id ? null : newsletter.id);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>

                  {openMenuId === newsletter.id && (
                    <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                      <Link
                        href={`/automate/emails/newsletter/${newsletter.id}`}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Eye className="w-4 h-4" />
                        Voir les détails
                      </Link>
                      <Link
                        href={`/automate/emails/newsletter/${newsletter.id}/send`}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Send className="w-4 h-4" />
                        Envoyer une édition
                      </Link>
                      <Link
                        href={`/automate/emails/newsletter/${newsletter.id}/subscribers`}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <UserPlus className="w-4 h-4" />
                        Gérer les abonnés
                      </Link>
                      <button
                        onClick={() => toggleActive(newsletter.id, newsletter.isActive)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Settings className="w-4 h-4" />
                        {newsletter.isActive ? "Désactiver" : "Activer"}
                      </button>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={() => handleDelete(newsletter.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <X className="w-4 h-4" />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <Link href={`/automate/emails/newsletter/${newsletter.id}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      newsletter.isActive
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-gray-100 dark:bg-gray-700"
                    }`}>
                      <Newspaper className={`w-6 h-6 ${
                        newsletter.isActive
                          ? "text-green-600 dark:text-green-400"
                          : "text-gray-400"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {newsletter.name}
                        </h3>
                        {!newsletter.isActive && (
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      {newsletter.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                          {newsletter.description}
                        </p>
                      )}

                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {newsletter.activeCount}
                          </p>
                          <p className="text-xs text-gray-500">Abonnés</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {newsletter._count?.issues || 0}
                          </p>
                          <p className="text-xs text-gray-500">Éditions</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {newsletter.averageOpenRate}%
                          </p>
                          <p className="text-xs text-gray-500">Ouverture</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Conseil :</strong> Les newsletters permettent de maintenir un lien avec vos apprenants
            en leur envoyant régulièrement des informations sur vos formations, actualités et événements.
          </p>
        </div>
      </div>

      {/* Modal Création */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Nouvelle newsletter
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom de la newsletter *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  placeholder="Ex: Actualités Formation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder="Description de votre newsletter..."
                />
              </div>

              <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={importApprenants}
                  onChange={(e) => setImportApprenants(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Importer les apprenants existants
                  </p>
                  <p className="text-xs text-gray-500">
                    Ajouter automatiquement tous vos apprenants comme abonnés
                  </p>
                </div>
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
                onClick={handleCreate}
                disabled={saving || !formName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Créer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
