"use client";

// ===========================================
// CRM Dashboard - Analytics & Rapports
// ===========================================
// Tableau de bord CRM avec KPIs, graphiques et rapports

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

// Types
interface DashboardStats {
  totalOpportunites: number;
  montantTotal: number;
  montantPondere: number;
  tauxConversion: number;
  opportunitesGagnees: number;
  opportunitesPerdues: number;
  opportunitesEnCours: number;
  parStage: Record<string, { count: number; montant: number }>;
  parSource: Record<string, { count: number; montant: number }>;
  evolution: { date: string; count: number; montant: number }[];
  topOpportunites: {
    id: string;
    titre: string;
    montantHT: number;
    probabilite: number;
    stage: string;
    entreprise?: { raisonSociale: string } | null;
  }[];
  activitesRecentes: {
    id: string;
    type: string;
    titre: string;
    date: string;
    opportunite: { id: string; titre: string };
  }[];
}

// Configuration des stages (synchronisé avec le pipeline CRM)
const STAGES: Record<string, { label: string; color: string; bgColor: string }> = {
  A_TRAITER: { label: "À traiter", color: "text-gray-600", bgColor: "bg-gray-500" },
  EN_COURS: { label: "En cours", color: "text-blue-600", bgColor: "bg-blue-500" },
  PROPOSITION_ENVOYEE: { label: "Proposition envoyée", color: "text-purple-600", bgColor: "bg-purple-500" },
  RELANCE: { label: "Relance", color: "text-orange-600", bgColor: "bg-orange-500" },
  GAGNE: { label: "Gagné", color: "text-emerald-600", bgColor: "bg-emerald-500" },
  PERDU: { label: "Perdu", color: "text-red-600", bgColor: "bg-red-500" },
};

const SOURCES: Record<string, string> = {
  SITE_WEB: "Site web",
  BOUCHE_A_OREILLE: "Bouche à oreille",
  RESEAUX_SOCIAUX: "Réseaux sociaux",
  SALON_EVENEMENT: "Salon/Événement",
  PARTENAIRE: "Partenaire",
  DEMARCHAGE: "Démarchage",
  AUTRE: "Autre",
};

// Helpers
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
};

// Icons
function TrendUpIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function TrendDownIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  );
}

function EuroIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

// KPI Card Component
function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = "brand",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "brand" | "green" | "red" | "blue" | "purple" | "orange";
}) {
  const colorClasses = {
    brand: "bg-brand-50 dark:bg-brand-900/20 text-brand-600",
    green: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
    red: "bg-red-50 dark:bg-red-900/20 text-red-600",
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-sm ${
            trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-gray-500"
          }`}>
            {trend === "up" ? <TrendUpIcon /> : trend === "down" ? <TrendDownIcon /> : null}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}

// Simple Bar Chart Component
function SimpleBarChart({ data, maxValue }: { data: { label: string; value: number; color: string }[]; maxValue: number }) {
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
            <span className="font-medium text-gray-900 dark:text-white">{item.value}</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`h-full rounded-full ${item.color}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Funnel Chart Component
function FunnelChart({ data }: { data: { stage: string; count: number; montant: number }[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="space-y-2">
      {data.map((item, index) => {
        const stageConfig = STAGES[item.stage] || { label: item.stage, bgColor: "bg-gray-500" };
        const width = Math.max((item.count / maxCount) * 100, 20);

        return (
          <motion.div
            key={item.stage}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <div
              className={`${stageConfig.bgColor} rounded-lg py-3 px-4 text-white transition-all`}
              style={{ width: `${width}%`, minWidth: "150px" }}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{stageConfig.label}</span>
                <div className="text-right">
                  <span className="text-lg font-bold">{item.count}</span>
                  <span className="text-xs opacity-80 ml-2">{formatCurrency(item.montant)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Main Dashboard Component
export default function CRMDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/crm/dashboard?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  // Données par défaut si pas de stats
  const defaultStats: DashboardStats = stats || {
    totalOpportunites: 0,
    montantTotal: 0,
    montantPondere: 0,
    tauxConversion: 0,
    opportunitesGagnees: 0,
    opportunitesPerdues: 0,
    opportunitesEnCours: 0,
    parStage: {},
    parSource: {},
    evolution: [],
    topOpportunites: [],
    activitesRecentes: [],
  };

  // Préparer les données pour le funnel
  const funnelData = Object.entries(defaultStats.parStage)
    .filter(([stage]) => !["GAGNE", "PERDU"].includes(stage))
    .sort((a, b) => {
      const order = ["A_TRAITER", "EN_COURS", "PROPOSITION_ENVOYEE", "RELANCE"];
      return order.indexOf(a[0]) - order.indexOf(b[0]);
    })
    .map(([stage, data]) => ({
      stage,
      count: data.count,
      montant: data.montant,
    }));

  // Préparer les données par source
  const sourceData = Object.entries(defaultStats.parSource)
    .map(([source, data]) => ({
      label: SOURCES[source] || source,
      value: data.count,
      color: "bg-brand-500",
    }))
    .sort((a, b) => b.value - a.value);

  const maxSourceValue = Math.max(...sourceData.map(d => d.value), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Link
            href="/crm"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-2 transition-colors text-sm"
          >
            <ArrowLeftIcon />
            <span>Retour au pipeline</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tableau de bord CRM
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Vue d'ensemble de vos performances commerciales
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { value: "7d", label: "7 jours" },
            { value: "30d", label: "30 jours" },
            { value: "90d", label: "90 jours" },
            { value: "all", label: "Tout" },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value as typeof period)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                period === p.value
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Opportunités"
          value={defaultStats.totalOpportunites}
          subtitle={`${defaultStats.opportunitesEnCours} en cours`}
          icon={<UsersIcon />}
          color="brand"
        />
        <KPICard
          title="Montant total"
          value={formatCurrency(defaultStats.montantTotal)}
          subtitle="Valeur du pipeline"
          icon={<EuroIcon />}
          color="blue"
        />
        <KPICard
          title="Montant pondéré"
          value={formatCurrency(defaultStats.montantPondere)}
          subtitle="Prévision de CA"
          icon={<ChartIcon />}
          color="purple"
        />
        <KPICard
          title="Taux de conversion"
          value={`${defaultStats.tauxConversion.toFixed(1)}%`}
          subtitle={`${defaultStats.opportunitesGagnees} gagnées / ${defaultStats.opportunitesPerdues} perdues`}
          icon={<CheckCircleIcon />}
          color={defaultStats.tauxConversion >= 30 ? "green" : defaultStats.tauxConversion >= 15 ? "orange" : "red"}
        />
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Funnel Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Entonnoir de conversion
          </h2>
          {funnelData.length > 0 ? (
            <FunnelChart data={funnelData} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Aucune opportunité dans le pipeline</p>
            </div>
          )}
        </div>

        {/* Source Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Sources d'acquisition
          </h2>
          {sourceData.length > 0 ? (
            <SimpleBarChart data={sourceData} maxValue={maxSourceValue} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Aucune donnée disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Opportunities */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top opportunités
          </h2>
          {defaultStats.topOpportunites.length > 0 ? (
            <div className="space-y-3">
              {defaultStats.topOpportunites.map((opp, index) => {
                const stageConfig = STAGES[opp.stage] || { label: opp.stage, color: "text-gray-600", bgColor: "bg-gray-100" };
                return (
                  <Link
                    key={opp.id}
                    href={`/crm/${opp.id}`}
                    className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 text-sm font-medium">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {opp.titre}
                          </p>
                          {opp.entreprise && (
                            <p className="text-xs text-gray-500">
                              {opp.entreprise.raisonSociale}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(opp.montantHT)}
                        </p>
                        <span className={`text-xs ${stageConfig.color}`}>
                          {stageConfig.label} • {opp.probabilite}%
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Aucune opportunité</p>
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Activités récentes
          </h2>
          {defaultStats.activitesRecentes.length > 0 ? (
            <div className="space-y-3">
              {defaultStats.activitesRecentes.map((activite) => (
                <Link
                  key={activite.id}
                  href={`/crm/${activite.opportunite.id}`}
                  className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      <ClockIcon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {activite.titre}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {activite.opportunite.titre}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(activite.date)}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                      {activite.type}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Aucune activité récente</p>
            </div>
          )}
        </div>
      </div>

      {/* Won vs Lost Stats */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <CheckCircleIcon />
            </div>
            <h3 className="font-semibold">Opportunités gagnées</h3>
          </div>
          <p className="text-4xl font-bold">{defaultStats.opportunitesGagnees}</p>
          <p className="text-emerald-100 mt-2 text-sm">
            {formatCurrency(defaultStats.parStage["GAGNE"]?.montant || 0)} de CA généré
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <XCircleIcon />
            </div>
            <h3 className="font-semibold">Opportunités perdues</h3>
          </div>
          <p className="text-4xl font-bold">{defaultStats.opportunitesPerdues}</p>
          <p className="text-red-100 mt-2 text-sm">
            {formatCurrency(defaultStats.parStage["PERDU"]?.montant || 0)} de CA perdu
          </p>
        </motion.div>
      </div>
    </div>
  );
}
