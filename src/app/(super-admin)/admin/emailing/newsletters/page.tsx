"use client";

// ===========================================
// PAGE SUPER ADMIN - Newsletters
// ===========================================

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Newspaper, Search, RefreshCw, MoreVertical,
  Eye, Trash2, Users, Mail, TrendingUp, CheckCircle, Clock
} from "lucide-react";

interface Newsletter {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  isActive: boolean;
  activeCount: number;
  pendingCount: number;
  unsubscribedCount: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  averageOpenRate: number;
  averageClickRate: number;
  lastSentAt: string | null;
  createdAt: string;
  organization?: { name: string };
}

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: "Quotidienne",
  WEEKLY: "Hebdomadaire",
  BIWEEKLY: "Bi-mensuelle",
  MONTHLY: "Mensuelle",
  QUARTERLY: "Trimestrielle",
  ON_DEMAND: "À la demande",
};

export default function AdminNewslettersPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/emailing/newsletters?global=true");
      if (res.ok) {
        const data = await res.json();
        setNewsletters(data.newsletters || []);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNewsletter = async (id: string) => {
    if (!confirm("Supprimer cette newsletter et tous ses abonnés ?")) return;
    try {
      await fetch(`/api/emailing/newsletters/${id}`, { method: "DELETE" });
      fetchNewsletters();
    } catch (error) {
      console.error("Erreur:", error);
    }
    setOpenMenuId(null);
  };

  const filteredNewsletters = newsletters.filter((n) =>
    !search || n.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalSubscribers = newsletters.reduce((acc, n) => acc + n.activeCount, 0);
  const totalSent = newsletters.reduce((acc, n) => acc + n.totalSent, 0);

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
            <Newspaper className="w-7 h-7 text-orange-500" />
            Newsletters
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {totalSubscribers.toLocaleString()} abonnés actifs · {totalSent.toLocaleString()} emails envoyés
          </p>
        </div>
        <Link
          href="/admin/emailing/newsletters/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" />
          Nouvelle newsletter
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
                placeholder="Rechercher une newsletter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <button
            onClick={fetchNewsletters}
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
      ) : filteredNewsletters.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune newsletter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredNewsletters.map((newsletter) => (
            <div
              key={newsletter.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all relative group"
            >
              {/* Menu */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setOpenMenuId(openMenuId === newsletter.id ? null : newsletter.id)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
                {openMenuId === newsletter.id && (
                  <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                    <Link
                      href={`/admin/emailing/newsletters/${newsletter.id}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Eye className="w-4 h-4" />
                      Voir détails
                    </Link>
                    <button
                      onClick={() => deleteNewsletter(newsletter.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                )}
              </div>

              <Link href={`/admin/emailing/newsletters/${newsletter.id}`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                    <Newspaper className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate pr-8">
                        {newsletter.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        newsletter.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {newsletter.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </span>
                    </div>
                    {newsletter.description && (
                      <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                        {newsletter.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{newsletter.organization?.name || "Global"}</span>
                      <span>{FREQUENCY_LABELS[newsletter.frequency] || newsletter.frequency}</span>
                      {newsletter.lastSentAt && (
                        <span>
                          Dernier envoi: {new Date(newsletter.lastSentAt).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats abonnés */}
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-green-600">
                      {newsletter.activeCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Actifs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-amber-600">
                      {newsletter.pendingCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">En attente</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-red-600">
                      {newsletter.unsubscribedCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Désabonnés</p>
                  </div>
                </div>

                {/* Performance */}
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {newsletter.totalSent.toLocaleString()} envoyés
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {newsletter.averageOpenRate}% ouverture
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {newsletter.averageClickRate}% clics
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
        <p className="text-sm text-orange-800 dark:text-orange-200">
          <strong>Newsletters :</strong> Gérez les inscriptions aux newsletters de toutes les organisations.
          Le système gère automatiquement le double opt-in et les désabonnements conformément au RGPD.
        </p>
      </div>
    </div>
  );
}
