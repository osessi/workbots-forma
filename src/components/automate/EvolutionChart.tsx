"use client";
import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type TimePeriod = "7j" | "30j" | "90j" | "12m";

// Données pour chaque période
const dataByPeriod = {
  "7j": {
    categories: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    series: [
      { name: "Formations", data: [2, 1, 3, 2, 4, 1, 2] },
      { name: "Fiches pédagogiques", data: [5, 3, 6, 4, 8, 2, 4] },
      { name: "Présentations", data: [1, 2, 2, 1, 3, 1, 2] },
      { name: "Évaluations", data: [1, 1, 2, 1, 2, 0, 1] },
    ],
  },
  "30j": {
    categories: ["S1", "S2", "S3", "S4"],
    series: [
      { name: "Formations", data: [8, 12, 10, 15] },
      { name: "Fiches pédagogiques", data: [18, 24, 20, 28] },
      { name: "Présentations", data: [6, 10, 8, 12] },
      { name: "Évaluations", data: [4, 7, 5, 9] },
    ],
  },
  "90j": {
    categories: ["Mois 1", "Mois 2", "Mois 3"],
    series: [
      { name: "Formations", data: [25, 32, 38] },
      { name: "Fiches pédagogiques", data: [52, 68, 78] },
      { name: "Présentations", data: [20, 28, 35] },
      { name: "Évaluations", data: [15, 22, 28] },
    ],
  },
  "12m": {
    categories: ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"],
    series: [
      { name: "Formations", data: [4, 6, 8, 5, 10, 12, 8, 15, 18, 14, 20, 22] },
      { name: "Fiches pédagogiques", data: [8, 12, 15, 10, 18, 22, 16, 28, 32, 26, 35, 38] },
      { name: "Présentations", data: [3, 5, 7, 4, 9, 11, 7, 14, 16, 12, 18, 20] },
      { name: "Évaluations", data: [2, 4, 5, 3, 7, 8, 5, 10, 12, 9, 14, 16] },
    ],
  },
};

export const EvolutionChart: React.FC = () => {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>("12m");

  const periods: { key: TimePeriod; label: string }[] = [
    { key: "7j", label: "7 jours" },
    { key: "30j", label: "30 jours" },
    { key: "90j", label: "90 jours" },
    { key: "12m", label: "12 mois" },
  ];

  const currentData = useMemo(() => dataByPeriod[activePeriod], [activePeriod]);

  const options: ApexOptions = useMemo(() => ({
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "inherit",
      fontSize: "13px",
      markers: {
        size: 4,
        shape: "circle",
      },
      itemMargin: {
        horizontal: 12,
      },
    },
    colors: ["#4277FF", "#F97316", "#22C55E", "#8B5CF6"],
    chart: {
      fontFamily: "inherit",
      height: 320,
      type: "area",
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 500,
      },
      redrawOnParentResize: true,
      redrawOnWindowResize: true,
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
      padding: {
        left: 10,
        right: 10,
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      y: {
        formatter: (value: number) => `${value}`,
      },
    },
    xaxis: {
      type: "category",
      categories: currentData.categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          fontSize: "12px",
          colors: "#9CA3AF",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: "#9CA3AF",
        },
        formatter: (value: number) => Math.round(value).toString(),
      },
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: {
            height: 280,
          },
          legend: {
            fontSize: "11px",
          },
        },
      },
    ],
  }), [currentData.categories]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Évolution des créations
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Suivez l'évolution de vos contenus générés
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl dark:bg-gray-800">
          {periods.map((period) => (
            <button
              key={period.key}
              onClick={() => setActivePeriod(period.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activePeriod === period.key
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700/50"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full">
        <ReactApexChart
          options={options}
          series={currentData.series}
          type="area"
          height={320}
          width="100%"
        />
      </div>
    </div>
  );
};

export default EvolutionChart;
