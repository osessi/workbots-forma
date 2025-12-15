"use client";
import React from "react";

// Icon: Document/Fiche pédagogique - Style moderne avec dégradé
const DocumentIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="docGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
    {/* Document principal */}
    <rect x="5" y="2" width="16" height="22" rx="3" fill="url(#docGradient)" opacity="0.15"/>
    <rect x="5" y="2" width="16" height="22" rx="3" stroke="url(#docGradient)" strokeWidth="1.5"/>
    {/* Coin plié */}
    <path d="M15 2V7C15 8.10457 15.8954 9 17 9H21" stroke="url(#docGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M15 2L21 8" stroke="url(#docGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    {/* Lignes de texte */}
    <path d="M9 13H17" stroke="url(#docGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 17H15" stroke="url(#docGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 21H13" stroke="url(#docGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    {/* Badge check */}
    <circle cx="21" cy="21" r="5" fill="#10b981"/>
    <path d="M19 21L20.5 22.5L23.5 19.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon: Presentation/PowerPoint - Style moderne
const PresentationIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="pptGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    {/* Écran */}
    <rect x="2" y="3" width="24" height="16" rx="3" fill="url(#pptGradient)" opacity="0.15"/>
    <rect x="2" y="3" width="24" height="16" rx="3" stroke="url(#pptGradient)" strokeWidth="1.5"/>
    {/* Pied */}
    <path d="M14 19V23" stroke="url(#pptGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 23H19" stroke="url(#pptGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    {/* Graphique bar chart */}
    <rect x="6" y="12" width="3" height="4" rx="0.5" fill="url(#pptGradient)"/>
    <rect x="10.5" y="9" width="3" height="7" rx="0.5" fill="url(#pptGradient)"/>
    <rect x="15" y="10" width="3" height="6" rx="0.5" fill="url(#pptGradient)"/>
    <rect x="19.5" y="7" width="3" height="9" rx="0.5" fill="url(#pptGradient)"/>
    {/* Play button overlay */}
    <circle cx="14" cy="11" r="3.5" fill="url(#pptGradient)" opacity="0.9"/>
    <path d="M13 9.5V12.5L15.5 11L13 9.5Z" fill="white"/>
  </svg>
);

// Icon: Evaluation/Checklist - Style moderne
const EvaluationIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="evalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
    {/* Clipboard */}
    <rect x="4" y="5" width="18" height="21" rx="3" fill="url(#evalGradient)" opacity="0.15"/>
    <rect x="4" y="5" width="18" height="21" rx="3" stroke="url(#evalGradient)" strokeWidth="1.5"/>
    {/* Clip */}
    <rect x="9" y="2" width="8" height="5" rx="2" fill="white" stroke="url(#evalGradient)" strokeWidth="1.5"/>
    <circle cx="13" cy="4.5" r="1" fill="url(#evalGradient)"/>
    {/* Checkboxes */}
    <rect x="7" y="10" width="4" height="4" rx="1" stroke="url(#evalGradient)" strokeWidth="1.2"/>
    <path d="M8 12L9.5 13.5L12 10.5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 12H19" stroke="url(#evalGradient)" strokeWidth="1.5" strokeLinecap="round"/>

    <rect x="7" y="16" width="4" height="4" rx="1" stroke="url(#evalGradient)" strokeWidth="1.2"/>
    <path d="M8 18L9.5 19.5L12 16.5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 18H17" stroke="url(#evalGradient)" strokeWidth="1.5" strokeLinecap="round"/>

    <rect x="7" y="22" width="4" height="4" rx="1" stroke="url(#evalGradient)" strokeWidth="1.2" opacity="0.5"/>
    <path d="M13 24H15" stroke="url(#evalGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  bgColor: string;
  iconColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, bgColor, iconColor }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow group">
      <div className="flex items-start justify-between">
        <div className={`flex items-center justify-center w-14 h-14 rounded-2xl ${bgColor} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
      <div className="mt-5">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <div className="flex items-end justify-between mt-2">
          <h4 className="text-4xl font-bold text-gray-900 dark:text-white tabular-nums tracking-tight">{value}</h4>
          <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-brand-600 bg-brand-50 rounded-full dark:bg-brand-500/10 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20">
            à ce jour
          </span>
        </div>
      </div>
    </div>
  );
};

export const MetricsCards: React.FC = () => {
  const metrics = [
    {
      icon: <DocumentIcon />,
      label: "Fiches pédagogiques générées",
      value: 78,
      bgColor: "bg-violet-50 dark:bg-violet-500/10",
      iconColor: "",
    },
    {
      icon: <PresentationIcon />,
      label: "Présentations générées",
      value: 45,
      bgColor: "bg-orange-50 dark:bg-orange-500/10",
      iconColor: "",
    },
    {
      icon: <EvaluationIcon />,
      label: "Évaluations générées",
      value: 32,
      bgColor: "bg-cyan-50 dark:bg-cyan-500/10",
      iconColor: "",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};

export default MetricsCards;
