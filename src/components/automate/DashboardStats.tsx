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

// Icons - Modern & Clean Design
const FormationIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L2 8.5L12 14L22 8.5L12 3Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M4 10V16L12 20L20 16V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 14V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const DocumentIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M8 13H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 17H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 9H21" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M16 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="7" y="13" width="3" height="3" rx="0.5" fill="currentColor"/>
    <rect x="14" y="13" width="3" height="3" rx="0.5" fill="currentColor" fillOpacity="0.5"/>
  </svg>
);

const TrendingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 7H21V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 17L9 11L13 15L21 7V17C21 18 20 19 19 19H5C4 19 3 18 3 17Z" fill="currentColor" fillOpacity="0.1"/>
  </svg>
);

const BuildingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 21H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="9" y="7" width="2" height="2" rx="0.5" fill="currentColor"/>
    <rect x="13" y="7" width="2" height="2" rx="0.5" fill="currentColor"/>
    <rect x="9" y="12" width="2" height="2" rx="0.5" fill="currentColor"/>
    <rect x="13" y="12" width="2" height="2" rx="0.5" fill="currentColor"/>
    <path d="M10 21V17H14V21" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="7" r="4" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 21V19C3 17.9391 3.42143 16.9217 4.17157 16.1716C4.92172 15.4214 5.93913 15 7 15H11C12.0609 15 13.0783 15.4214 13.8284 16.1716C14.5786 16.9217 15 17.9391 15 19V21" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="17" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M21 21V19.5C21 18.5 20.5 17.6 19.8 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
  <div className="group rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:-translate-y-0.5">
    <div className="flex items-start justify-between">
      <div className={`p-3 rounded-2xl ${color} shadow-sm group-hover:shadow-md transition-shadow duration-300`}>
        {icon}
      </div>
      {trend && (
        <span
          className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            trend.isPositive
              ? "text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-400"
              : "text-red-700 bg-red-100 dark:bg-red-900/40 dark:text-red-400"
          }`}
        >
          {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
        </span>
      )}
    </div>
    <div className="mt-4">
      <h4 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h4>
      {subValue && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{subValue}</p>}
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">{label}</p>
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
