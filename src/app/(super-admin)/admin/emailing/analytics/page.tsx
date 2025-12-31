"use client";

// ===========================================
// PAGE SUPER ADMIN - Analytics emailing
// ===========================================

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, BarChart3, RefreshCw, TrendingUp, TrendingDown,
  Send, Eye, MousePointer, AlertTriangle, Users, Target,
  Calendar, Download
} from "lucide-react";

interface AnalyticsData {
  period: string;
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
    openRate: number;
    clickRate: number;
  }>;
  byType: Array<{
    type: string;
    sent: number;
    opened: number;
    openRate: number;
  }>;
  topCampaigns: Array<{
    id: string;
    name: string;
    totalSent: number;
    openRate: number;
    clickRate: number;
  }>;
  templatePerformance: Array<{
    id: string;
    name: string;
    category: string;
    usageCount: number;
  }>;
  benchmarks: {
    industryOpenRate: number;
    industryClickRate: number;
    industryBounceRate: number;
  };
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/emailing/analytics?period=${period}&global=true`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getBenchmarkComparison = (value: number, benchmark: number) => {
    const diff = value - benchmark;
    if (diff > 2) return { icon: TrendingUp, color: "text-green-600", text: `+${diff.toFixed(1)}% vs industrie` };
    if (diff < -2) return { icon: TrendingDown, color: "text-red-600", text: `${diff.toFixed(1)}% vs industrie` };
    return { icon: TrendingUp, color: "text-gray-500", text: "Dans la moyenne" };
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
            <BarChart3 className="w-7 h-7 text-indigo-500" />
            Analytics Emailing
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Statistiques détaillées de toutes les organisations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">90 derniers jours</option>
            <option value="1y">12 derniers mois</option>
          </select>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : data ? (
        <>
          {/* KPIs principaux */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Send className="w-4 h-4" />
                <span className="text-sm">Envoyés</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatNumber(data.kpis.totalSent)}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Eye className="w-4 h-4" />
                <span className="text-sm">Taux ouverture</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">{data.kpis.openRate}%</p>
              {(() => {
                const comp = getBenchmarkComparison(data.kpis.openRate, data.benchmarks.industryOpenRate);
                const Icon = comp.icon;
                return (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${comp.color}`}>
                    <Icon className="w-3 h-3" />
                    {comp.text}
                  </p>
                );
              })()}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <MousePointer className="w-4 h-4" />
                <span className="text-sm">Taux clic</span>
              </div>
              <p className="text-3xl font-bold text-purple-600">{data.kpis.clickRate}%</p>
              {(() => {
                const comp = getBenchmarkComparison(data.kpis.clickRate, data.benchmarks.industryClickRate);
                const Icon = comp.icon;
                return (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${comp.color}`}>
                    <Icon className="w-3 h-3" />
                    {comp.text}
                  </p>
                );
              })()}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Délivrés</span>
              </div>
              <p className="text-3xl font-bold text-green-600">{data.kpis.deliveryRate}%</p>
              <p className="text-xs text-gray-400 mt-1">
                {formatNumber(data.kpis.delivered)} emails
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Rebonds</span>
              </div>
              <p className={`text-3xl font-bold ${data.kpis.bounceRate > 2 ? "text-red-600" : "text-gray-900 dark:text-white"}`}>
                {data.kpis.bounceRate}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatNumber(data.kpis.bounced)} emails
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Plaintes</span>
              </div>
              <p className={`text-3xl font-bold ${data.kpis.complaintRate > 0.1 ? "text-red-600" : "text-gray-900 dark:text-white"}`}>
                {data.kpis.complaintRate}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatNumber(data.kpis.complained)} plaintes
              </p>
            </div>
          </div>

          {/* Graphique timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Évolution dans le temps
            </h3>
            {data.timeline.length > 0 ? (
              <div className="h-64 flex items-end justify-between gap-1">
                {data.timeline.map((day, i) => {
                  const maxSent = Math.max(...data.timeline.map(d => d.sent), 1);
                  const height = (day.sent / maxSent) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {day.date}: {day.sent} envoyés, {day.openRate}% ouverts
                      </div>
                      <div
                        className="w-full bg-gradient-to-t from-brand-600 to-brand-400 rounded-t opacity-80 hover:opacity-100 transition-all"
                        style={{ height: `${height}%`, minHeight: "4px" }}
                      />
                      {i % Math.ceil(data.timeline.length / 10) === 0 && (
                        <span className="text-[10px] text-gray-400 mt-1">
                          {new Date(day.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Pas de données pour cette période
              </div>
            )}
          </div>

          {/* Stats par type et Top Campagnes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Par type */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Par type d&apos;email
              </h3>
              {data.byType.length > 0 ? (
                <div className="space-y-3">
                  {data.byType.map((type) => (
                    <div key={type.type} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {type.type}
                        </p>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-1">
                          <div
                            className="bg-brand-500 rounded-full h-2"
                            style={{ width: `${type.openRate}%` }}
                          />
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {type.openRate}%
                        </p>
                        <p className="text-xs text-gray-500">{formatNumber(type.sent)} envoyés</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Pas de données</p>
              )}
            </div>

            {/* Top campagnes */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Top campagnes
                </h3>
                <Link href="/admin/emailing/campaigns" className="text-sm text-brand-600 hover:underline">
                  Voir toutes
                </Link>
              </div>
              {data.topCampaigns.length > 0 ? (
                <div className="space-y-3">
                  {data.topCampaigns.slice(0, 5).map((campaign, i) => (
                    <Link
                      key={campaign.id}
                      href={`/admin/emailing/analytics/campaigns/${campaign.id}`}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-medium flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {campaign.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatNumber(campaign.totalSent)} envoyés
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">{campaign.openRate}%</p>
                        <p className="text-xs text-gray-400">ouvert</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Aucune campagne</p>
              )}
            </div>
          </div>

          {/* Templates performance */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Templates les plus utilisés
            </h3>
            {data.templatePerformance.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {data.templatePerformance.slice(0, 10).map((template) => (
                  <div
                    key={template.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {template.name}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">{template.category}</p>
                    <p className="text-lg font-semibold text-brand-600">
                      {template.usageCount}
                    </p>
                    <p className="text-xs text-gray-400">utilisations</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Aucun template utilisé</p>
            )}
          </div>

          {/* Benchmarks */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Benchmarks industrie (Formation)
            </h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300">Taux d&apos;ouverture :</span>
                <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                  {data.benchmarks.industryOpenRate}%
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Taux de clic :</span>
                <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                  {data.benchmarks.industryClickRate}%
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Taux de rebond :</span>
                <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                  {data.benchmarks.industryBounceRate}%
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          Erreur lors du chargement des données
        </div>
      )}
    </div>
  );
}
