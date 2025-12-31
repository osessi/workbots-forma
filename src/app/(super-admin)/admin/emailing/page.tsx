"use client";

// ===========================================
// PAGE SUPER ADMIN EMAILING - Dashboard complet
// ===========================================

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail, Send, Users, BarChart3, Settings, TrendingUp, Eye,
  MousePointer, AlertTriangle, RefreshCw, ArrowRight, Globe,
  Newspaper, Zap, FileText, Target, Clock, CheckCircle
} from "lucide-react";

interface DashboardData {
  kpis: {
    totalSent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    complained: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    complaintRate: number;
  };
  timeline: Array<{
    date: string;
    sent: number;
    opened: number;
    clicked: number;
  }>;
  topCampaigns: Array<{
    id: string;
    name: string;
    subject: string;
    totalSent: number;
    openRate: number;
    clickRate: number;
    scheduledAt: string;
  }>;
  audiences: Array<{
    id: string;
    name: string;
    totalContacts: number;
    activeContacts: number;
    campaignCount: number;
  }>;
  newsletters: Array<{
    id: string;
    name: string;
    activeCount: number;
    averageOpenRate: number;
  }>;
  benchmarks: {
    industryOpenRate: number;
    industryClickRate: number;
    industryBounceRate: number;
  };
}

export default function AdminEmailingPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/emailing/analytics?period=${period}&global=true`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Erreur fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    {
      title: "Campagnes",
      description: "Créer et gérer des campagnes bulk",
      href: "/admin/emailing/campaigns",
      icon: Target,
      color: "bg-brand-500",
      stats: data?.topCampaigns?.length || 0,
      statsLabel: "campagnes",
    },
    {
      title: "Audiences",
      description: "Segmenter vos contacts",
      href: "/admin/emailing/audiences",
      icon: Users,
      color: "bg-blue-500",
      stats: data?.audiences?.reduce((acc, a) => acc + a.totalContacts, 0) || 0,
      statsLabel: "contacts",
    },
    {
      title: "Templates",
      description: "Templates globaux",
      href: "/admin/emailing/templates",
      icon: FileText,
      color: "bg-purple-500",
      stats: null,
      statsLabel: "",
    },
    {
      title: "Séquences",
      description: "Drip campaigns automatisés",
      href: "/admin/emailing/sequences",
      icon: Zap,
      color: "bg-amber-500",
      stats: null,
      statsLabel: "",
    },
    {
      title: "Newsletters",
      description: "Toutes les newsletters",
      href: "/admin/emailing/newsletters",
      icon: Newspaper,
      color: "bg-green-500",
      stats: data?.newsletters?.reduce((acc, n) => acc + n.activeCount, 0) || 0,
      statsLabel: "abonnés",
    },
    {
      title: "Analytics",
      description: "Statistiques détaillées",
      href: "/admin/emailing/analytics",
      icon: BarChart3,
      color: "bg-indigo-500",
      stats: null,
      statsLabel: "",
    },
    {
      title: "Domaines",
      description: "Configurer les domaines d'envoi",
      href: "/admin/emailing/domains",
      icon: Globe,
      color: "bg-cyan-500",
      stats: null,
      statsLabel: "",
    },
    {
      title: "Paramètres",
      description: "Configuration globale",
      href: "/admin/emailing/settings",
      icon: Settings,
      color: "bg-gray-500",
      stats: null,
      statsLabel: "",
    },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Mail className="w-7 h-7 text-brand-500" />
            Centre Emailing
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestion globale des emails, campagnes et newsletters
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
            <option value="90d">90 jours</option>
            <option value="1y">1 an</option>
          </select>
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <Send className="w-4 h-4" />
            <span className="text-xs">Envoyés</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {loading ? "-" : formatNumber(data?.kpis.totalSent || 0)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs">Délivrés</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {loading ? "-" : `${data?.kpis.deliveryRate || 0}%`}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <Eye className="w-4 h-4" />
            <span className="text-xs">Ouverts</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {loading ? "-" : `${data?.kpis.openRate || 0}%`}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Industrie: {data?.benchmarks?.industryOpenRate || 21.5}%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <MousePointer className="w-4 h-4" />
            <span className="text-xs">Cliqués</span>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {loading ? "-" : `${data?.kpis.clickRate || 0}%`}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Industrie: {data?.benchmarks?.industryClickRate || 2.3}%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs">Rebonds</span>
          </div>
          <p className={`text-2xl font-bold ${
            (data?.kpis.bounceRate || 0) > 2
              ? "text-red-600 dark:text-red-400"
              : "text-gray-900 dark:text-white"
          }`}>
            {loading ? "-" : `${data?.kpis.bounceRate || 0}%`}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Plaintes</span>
          </div>
          <p className={`text-2xl font-bold ${
            (data?.kpis.complaintRate || 0) > 0.1
              ? "text-red-600 dark:text-red-400"
              : "text-gray-900 dark:text-white"
          }`}>
            {loading ? "-" : `${data?.kpis.complaintRate || 0}%`}
          </p>
        </div>
      </div>

      {/* Modules */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Modules
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.href}
                href={module.href}
                className="group bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-lg transition-all"
              >
                <div className={`w-10 h-10 rounded-lg ${module.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {module.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {module.description}
                </p>
                {module.stats !== null && (
                  <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
                    {formatNumber(module.stats)} {module.statsLabel}
                  </p>
                )}
                <span className="inline-flex items-center gap-1 text-sm text-gray-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 mt-2">
                  Accéder
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Timeline & Top Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Évolution des envois
          </h3>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : data?.timeline && data.timeline.length > 0 ? (
            <div className="h-48 flex items-end justify-between gap-1">
              {data.timeline.slice(-14).map((day, i) => {
                const maxSent = Math.max(...data.timeline.map(d => d.sent), 1);
                const height = (day.sent / maxSent) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-brand-500 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                      style={{ height: `${height}%`, minHeight: "4px" }}
                      title={`${day.date}: ${day.sent} envoyés`}
                    />
                    {i % 2 === 0 && (
                      <span className="text-[10px] text-gray-400">
                        {new Date(day.date).getDate()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">
              Pas de données pour cette période
            </div>
          )}
        </div>

        {/* Top Campaigns */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Meilleures campagnes
            </h3>
            <Link
              href="/admin/emailing/campaigns"
              className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
            >
              Voir toutes
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : data?.topCampaigns && data.topCampaigns.length > 0 ? (
            <div className="space-y-3">
              {data.topCampaigns.slice(0, 5).map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/admin/emailing/campaigns/${campaign.id}`}
                  className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {campaign.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {campaign.subject}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-medium text-green-600">
                        {campaign.openRate}% ouvert
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatNumber(campaign.totalSent)} envoyés
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <Target className="w-8 h-8 mb-2 text-gray-400" />
              <p>Aucune campagne</p>
              <Link
                href="/admin/emailing/campaigns/new"
                className="mt-2 text-sm text-brand-600 hover:underline"
              >
                Créer une campagne
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Audiences & Newsletters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audiences */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Audiences principales
            </h3>
            <Link
              href="/admin/emailing/audiences"
              className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
            >
              Gérer
            </Link>
          </div>
          {data?.audiences && data.audiences.length > 0 ? (
            <div className="space-y-3">
              {data.audiences.slice(0, 5).map((audience) => (
                <div
                  key={audience.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {audience.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {audience.campaignCount} campagne{audience.campaignCount > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatNumber(audience.activeContacts)}
                    </p>
                    <p className="text-xs text-gray-500">contacts actifs</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Users className="w-8 h-8 mb-2 text-gray-400" />
              <p>Aucune audience</p>
            </div>
          )}
        </div>

        {/* Newsletters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Newsletters actives
            </h3>
            <Link
              href="/admin/emailing/newsletters"
              className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
            >
              Gérer
            </Link>
          </div>
          {data?.newsletters && data.newsletters.length > 0 ? (
            <div className="space-y-3">
              {data.newsletters.slice(0, 5).map((newsletter) => (
                <div
                  key={newsletter.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {newsletter.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {newsletter.averageOpenRate}% taux d&apos;ouverture
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatNumber(newsletter.activeCount)}
                    </p>
                    <p className="text-xs text-gray-500">abonnés</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Newspaper className="w-8 h-8 mb-2 text-gray-400" />
              <p>Aucune newsletter</p>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note :</strong> Cette vue agrège les données de toutes les organisations.
          Les benchmarks industrie sont basés sur les moyennes du secteur formation.
        </p>
      </div>
    </div>
  );
}
