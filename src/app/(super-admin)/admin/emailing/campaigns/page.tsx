"use client";

// ===========================================
// PAGE SUPER ADMIN - Campagnes email
// ===========================================

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Target, Search, RefreshCw, MoreVertical,
  Eye, Send, Trash2, Copy, Clock, CheckCircle, XCircle,
  PauseCircle, Users, BarChart3
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  type: string;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  audience?: { name: string };
  organization?: { name: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: "Brouillon", color: "bg-gray-100 text-gray-700", icon: Clock },
  SCHEDULED: { label: "Programmée", color: "bg-blue-100 text-blue-700", icon: Clock },
  SENDING: { label: "En cours", color: "bg-amber-100 text-amber-700", icon: RefreshCw },
  SENT: { label: "Envoyée", color: "bg-green-100 text-green-700", icon: CheckCircle },
  PAUSED: { label: "En pause", color: "bg-orange-100 text-orange-700", icon: PauseCircle },
  FAILED: { label: "Échec", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/emailing/campaigns?global=true");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Supprimer cette campagne ?")) return;
    try {
      await fetch(`/api/emailing/campaigns/${id}`, { method: "DELETE" });
      fetchCampaigns();
    } catch (error) {
      console.error("Erreur:", error);
    }
    setOpenMenuId(null);
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
            <Target className="w-7 h-7 text-brand-500" />
            Campagnes
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez toutes les campagnes email
          </p>
        </div>
        <Link
          href="/admin/emailing/campaigns/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" />
          Nouvelle campagne
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
                placeholder="Rechercher..."
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
            onClick={fetchCampaigns}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Campagne
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Organisation
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Envoyés
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Performance
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <RefreshCw className="w-8 h-8 text-gray-400 mx-auto animate-spin" />
                </td>
              </tr>
            ) : filteredCampaigns.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  Aucune campagne
                </td>
              </tr>
            ) : (
              filteredCampaigns.map((campaign) => {
                const statusConfig = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.DRAFT;
                const StatusIcon = statusConfig.icon;
                return (
                  <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {campaign.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {campaign.subject}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {campaign.organization?.name || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {campaign.totalSent.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {campaign.totalDelivered.toLocaleString()} délivrés
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm font-medium text-green-600">{campaign.openRate}%</p>
                          <p className="text-xs text-gray-400">ouvert</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-600">{campaign.clickRate}%</p>
                          <p className="text-xs text-gray-400">cliqué</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(campaign.sentAt || campaign.scheduledAt)}
                    </td>
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === campaign.id ? null : campaign.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                      {openMenuId === campaign.id && (
                        <div className="absolute right-4 top-12 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                          <Link
                            href={`/admin/emailing/campaigns/${campaign.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Eye className="w-4 h-4" />
                            Voir détails
                          </Link>
                          <Link
                            href={`/admin/emailing/analytics/campaigns/${campaign.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <BarChart3 className="w-4 h-4" />
                            Analytics
                          </Link>
                          <button
                            onClick={() => deleteCampaign(campaign.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        </div>
                      )}
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
