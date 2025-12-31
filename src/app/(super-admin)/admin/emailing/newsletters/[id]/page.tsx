"use client";

// ===========================================
// PAGE SUPER ADMIN - Détail newsletter
// ===========================================

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft, Newspaper, RefreshCw, Users, Mail, TrendingUp,
  Search, Trash2, CheckCircle, Clock, XCircle
} from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  subscribedAt: string;
  confirmedAt: string | null;
}

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
  createdAt: string;
  organization?: { name: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ACTIVE: { label: "Actif", color: "bg-green-100 text-green-700", icon: CheckCircle },
  PENDING: { label: "En attente", color: "bg-amber-100 text-amber-700", icon: Clock },
  UNSUBSCRIBED: { label: "Désabonné", color: "bg-gray-100 text-gray-700", icon: XCircle },
};

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: "Quotidienne",
  WEEKLY: "Hebdomadaire",
  BIWEEKLY: "Bi-mensuelle",
  MONTHLY: "Mensuelle",
  QUARTERLY: "Trimestrielle",
  ON_DEMAND: "À la demande",
};

export default function NewsletterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchNewsletter();
    fetchSubscribers();
  }, [id]);

  const fetchNewsletter = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/emailing/newsletters/${id}`);
      if (res.ok) {
        const data = await res.json();
        setNewsletter(data.newsletter);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscribers = async () => {
    try {
      const res = await fetch(`/api/emailing/newsletters/${id}/subscribers`);
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers || []);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const removeSubscriber = async (subscriberId: string) => {
    if (!confirm("Retirer cet abonné ?")) return;
    try {
      await fetch(`/api/emailing/newsletters/${id}/subscribers/${subscriberId}`, {
        method: "DELETE",
      });
      fetchSubscribers();
      fetchNewsletter();
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const filteredSubscribers = subscribers.filter((s) => {
    const matchSearch = !search ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      s.lastName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!newsletter) {
    return (
      <div className="text-center py-24">
        <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Newsletter non trouvée</p>
        <Link href="/admin/emailing/newsletters" className="text-brand-600 hover:underline mt-2 inline-block">
          Retour aux newsletters
        </Link>
      </div>
    );
  }

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
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {newsletter.name}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              newsletter.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            }`}>
              {newsletter.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            {newsletter.organization?.name || "Global"} · {FREQUENCY_LABELS[newsletter.frequency]}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-500">Actifs</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {newsletter.activeCount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-gray-500">En attente</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {newsletter.pendingCount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-gray-500">Désabonnés</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {newsletter.unsubscribedCount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-500">Envoyés</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {newsletter.totalSent.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-500">Taux ouverture</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {newsletter.averageOpenRate}%
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-500">Taux clic</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {newsletter.averageClickRate}%
          </p>
        </div>
      </div>

      {/* Filtres abonnés */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un abonné..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <select
            value={filterStatus || ""}
            onChange={(e) => setFilterStatus(e.target.value || null)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          <button
            onClick={fetchSubscribers}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Liste abonnés */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inscrit le</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredSubscribers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                  Aucun abonné
                </td>
              </tr>
            ) : (
              filteredSubscribers.map((subscriber) => {
                const statusConfig = STATUS_CONFIG[subscriber.status] || STATUS_CONFIG.PENDING;
                const StatusIcon = statusConfig.icon;
                return (
                  <tr key={subscriber.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <span className="text-gray-900 dark:text-white">{subscriber.email}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {subscriber.firstName || subscriber.lastName
                        ? `${subscriber.firstName || ""} ${subscriber.lastName || ""}`.trim()
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(subscriber.subscribedAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeSubscriber(subscriber.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
