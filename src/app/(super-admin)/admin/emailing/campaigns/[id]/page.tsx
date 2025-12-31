"use client";

// ===========================================
// PAGE SUPER ADMIN - Détail campagne email
// ===========================================

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft, Target, RefreshCw, Send, Pause, Play, Square,
  Users, Mail, Eye, MousePointer, AlertTriangle, CheckCircle,
  Clock, BarChart3, Trash2
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  preheader: string | null;
  status: string;
  type: string;
  htmlContent: string | null;
  textContent: string | null;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalComplained: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  audience?: { id: string; name: string; activeContacts: number };
  organization?: { name: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: "Brouillon", color: "bg-gray-100 text-gray-700", icon: Clock },
  SCHEDULED: { label: "Programmée", color: "bg-blue-100 text-blue-700", icon: Clock },
  SENDING: { label: "En cours", color: "bg-amber-100 text-amber-700", icon: RefreshCw },
  SENT: { label: "Envoyée", color: "bg-green-100 text-green-700", icon: CheckCircle },
  PAUSED: { label: "En pause", color: "bg-orange-100 text-orange-700", icon: Pause },
  FAILED: { label: "Échec", color: "bg-red-100 text-red-700", icon: AlertTriangle },
};

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/emailing/campaigns/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data.campaign);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (action: "send" | "pause" | "resume" | "cancel") => {
    try {
      const res = await fetch(`/api/emailing/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchCampaign();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-24">
        <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Campagne non trouvée</p>
        <Link href="/admin/emailing/campaigns" className="text-brand-600 hover:underline mt-2 inline-block">
          Retour aux campagnes
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.DRAFT;
  const StatusIcon = statusConfig.icon;

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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {campaign.name}
            </h1>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
              <StatusIcon className="w-4 h-4" />
              {statusConfig.label}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            {campaign.organization?.name || "Global"} · Créée le {new Date(campaign.createdAt).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <div className="flex gap-2">
          {campaign.status === "DRAFT" && (
            <button
              onClick={() => updateStatus("send")}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
            >
              <Send className="w-4 h-4" />
              Envoyer
            </button>
          )}
          {campaign.status === "SENDING" && (
            <button
              onClick={() => updateStatus("pause")}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          )}
          {campaign.status === "PAUSED" && (
            <button
              onClick={() => updateStatus("resume")}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Play className="w-4 h-4" />
              Reprendre
            </button>
          )}
          <Link
            href={`/admin/emailing/analytics/campaigns/${id}`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: "Envoyés", value: campaign.totalSent, icon: Mail, color: "text-blue-600" },
          { label: "Délivrés", value: campaign.totalDelivered, icon: CheckCircle, color: "text-green-600" },
          { label: "Ouverts", value: campaign.totalOpened, icon: Eye, color: "text-purple-600" },
          { label: "Cliqués", value: campaign.totalClicked, icon: MousePointer, color: "text-cyan-600" },
          { label: "Bounces", value: campaign.totalBounced, icon: AlertTriangle, color: "text-red-600" },
          { label: "Plaintes", value: campaign.totalComplained, icon: AlertTriangle, color: "text-orange-600" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-sm text-gray-500">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Taux */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Taux d&apos;ouverture</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-green-600">{campaign.openRate}%</span>
            <span className="text-sm text-gray-400 mb-1">moyenne: 21.5%</span>
          </div>
          <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${Math.min(campaign.openRate, 100)}%` }}
            />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Taux de clic</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-blue-600">{campaign.clickRate}%</span>
            <span className="text-sm text-gray-400 mb-1">moyenne: 2.3%</span>
          </div>
          <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.min(campaign.clickRate * 10, 100)}%` }}
            />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Taux de bounce</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-red-600">{campaign.bounceRate}%</span>
            <span className="text-sm text-gray-400 mb-1">max acceptable: 2%</span>
          </div>
          <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${campaign.bounceRate > 2 ? "bg-red-500" : "bg-green-500"}`}
              style={{ width: `${Math.min(campaign.bounceRate * 10, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Détails */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Infos campagne */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Informations</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500">Objet</span>
              <span className="text-gray-900 dark:text-white">{campaign.subject}</span>
            </div>
            {campaign.preheader && (
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500">Pré-header</span>
                <span className="text-gray-900 dark:text-white">{campaign.preheader}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500">Type</span>
              <span className="text-gray-900 dark:text-white">{campaign.type}</span>
            </div>
            {campaign.audience && (
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500">Audience</span>
                <Link
                  href={`/admin/emailing/audiences/${campaign.audience.id}`}
                  className="text-brand-600 hover:underline"
                >
                  {campaign.audience.name}
                </Link>
              </div>
            )}
            {campaign.scheduledAt && (
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500">Programmé le</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(campaign.scheduledAt).toLocaleString("fr-FR")}
                </span>
              </div>
            )}
            {campaign.sentAt && (
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Envoyé le</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(campaign.sentAt).toLocaleString("fr-FR")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Aperçu */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Aperçu</h3>
          {campaign.htmlContent ? (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <iframe
                srcDoc={campaign.htmlContent}
                className="w-full h-64 bg-white"
                title="Aperçu email"
              />
            </div>
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-gray-500 whitespace-pre-wrap">
                {campaign.textContent || "Aucun contenu"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
