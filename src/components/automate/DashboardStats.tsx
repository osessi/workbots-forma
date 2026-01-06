"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface DashboardData {
  formations: {
    total: number;
    max: number;
    byStatus: Record<string, number>;
  };
  documents: {
    total: number;
  };
  sessions: {
    total: number;
  };
  crm: {
    opportunites: number;
    montantTotal: number;
  };
  clients: {
    entreprises: number;
    apprenants: number;
  };
  recentFormations: Array<{
    id: string;
    titre: string;
    status: string;
    createdAt: string;
  }>;
  chartData: Array<{
    month: string;
    formations: number;
  }>;
}

// Icons
const FormationIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3L2 8l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

const DocumentIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const TrendingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 6l-9.5 9.5-5-5L1 18" />
    <path d="M17 6h6v6" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />
  </svg>
);

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const StatCard = ({
  icon,
  label,
  value,
  subValue,
  color,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
  trend?: { value: number; isPositive: boolean };
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
      {trend && (
        <span
          className={`flex items-center gap-1 text-xs font-medium ${
            trend.isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
        </span>
      )}
    </div>
    <div className="mt-4">
      <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h4>
      {subValue && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subValue}</p>}
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  </div>
);

export default function DashboardStats() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (error) {
        console.error("Erreur chargement stats:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Options du graphique formations
  const chartOptions: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    colors: ["#4277FF"],
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: "50%",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: data?.chartData.map((d) => d.month) || [],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: "#9CA3AF", fontSize: "12px" },
      },
    },
    yaxis: {
      labels: {
        style: { colors: "#9CA3AF", fontSize: "12px" },
        formatter: (val) => Math.floor(val).toString(),
      },
      tickAmount: 5,
      min: 0,
      forceNiceScale: false,
      decimalsInFloat: 0,
      stepSize: 1,
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 4,
    },
    tooltip: {
      y: { formatter: (val) => `${val} formations` },
    },
  };

  // Options du graphique statuts
  const statusChartOptions: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
    },
    colors: ["#F59E0B", "#22C55E", "#4277FF"],
    labels: ["En cours", "Terminées", "Publiées sur le catalogue"],
    legend: {
      position: "bottom",
      fontSize: "13px",
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${Math.round(val as number)}%`,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              fontSize: "14px",
              formatter: () => data?.formations.total.toString() || "0",
            },
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-36 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const statusData = [
    data.formations.byStatus.EN_COURS || 0,
    data.formations.byStatus.TERMINEE || 0,
    data.formations.byStatus.PUBLIEE || 0,
  ];

  return (
    <div className="space-y-6">
      {/* Cartes de stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icon={<FormationIcon />}
          label="Formations"
          value={data.formations.total}
          subValue={`sur ${data.formations.max}`}
          color="bg-blue-50 text-blue-600 dark:bg-blue-900/30"
        />
        <StatCard
          icon={<DocumentIcon />}
          label="Documents"
          value={data.documents.total}
          color="bg-purple-50 text-purple-600 dark:bg-purple-900/30"
        />
        <StatCard
          icon={<CalendarIcon />}
          label="Sessions"
          value={data.sessions.total}
          color="bg-green-50 text-green-600 dark:bg-green-900/30"
        />
        <StatCard
          icon={<TrendingIcon />}
          label="Opportunités CRM"
          value={data.crm.opportunites}
          subValue={formatCurrency(data.crm.montantTotal)}
          color="bg-orange-50 text-orange-600 dark:bg-orange-900/30"
        />
        <StatCard
          icon={<BuildingIcon />}
          label="Entreprises"
          value={data.clients.entreprises}
          color="bg-pink-50 text-pink-600 dark:bg-pink-900/30"
        />
        <StatCard
          icon={<UsersIcon />}
          label="Apprenants"
          value={data.clients.apprenants}
          color="bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30"
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique formations par mois */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Formations créées par mois
          </h3>
          <ReactApexChart
            options={chartOptions}
            series={[{ name: "Formations", data: data.chartData.map((d) => d.formations) }]}
            type="bar"
            height={280}
          />
        </div>

        {/* Graphique statuts */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            État des formations
          </h3>
          <ReactApexChart
            options={statusChartOptions}
            series={statusData}
            type="donut"
            height={280}
          />
        </div>
      </div>

      {/* Formations récentes */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Formations récentes
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Titre
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Statut
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Créée le
                </th>
              </tr>
            </thead>
            <tbody>
              {data.recentFormations.map((formation) => (
                <tr
                  key={formation.id}
                  className="border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formation.titre}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        formation.status === "TERMINEE"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : formation.status === "EN_COURS"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {formation.status === "TERMINEE"
                        ? "Terminée"
                        : formation.status === "EN_COURS"
                        ? "En cours"
                        : "Brouillon"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(formation.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
              {data.recentFormations.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucune formation créée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
