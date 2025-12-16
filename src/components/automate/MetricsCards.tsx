"use client";
import React from "react";

// Icon: Formation - Style moderne avec dégradé bleu
const FormationIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="formGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4277FF" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
    <path d="M14 3L2 9L14 15L26 9L14 3Z" fill="url(#formGradient)" opacity="0.15"/>
    <path d="M14 3L2 9L14 15L26 9L14 3Z" stroke="url(#formGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 11.5V19L14 23L22 19V11.5" stroke="url(#formGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M26 9V17" stroke="url(#formGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="26" cy="18" r="1.5" fill="url(#formGradient)"/>
  </svg>
);

// Icon: Fiche pédagogique - Style moderne avec dégradé orange
const FicheIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ficheGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    <rect x="5" y="2" width="16" height="22" rx="3" fill="url(#ficheGradient)" opacity="0.15"/>
    <rect x="5" y="2" width="16" height="22" rx="3" stroke="url(#ficheGradient)" strokeWidth="1.5"/>
    <path d="M15 2V7C15 8.10457 15.8954 9 17 9H21" stroke="url(#ficheGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 13H17" stroke="url(#ficheGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 17H15" stroke="url(#ficheGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 21H13" stroke="url(#ficheGradient)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Icon: Slides - Style moderne avec dégradé vert
const SlidesIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="slidesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22C55E" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
    </defs>
    <rect x="2" y="4" width="24" height="16" rx="3" fill="url(#slidesGradient)" opacity="0.15"/>
    <rect x="2" y="4" width="24" height="16" rx="3" stroke="url(#slidesGradient)" strokeWidth="1.5"/>
    <path d="M14 20V24" stroke="url(#slidesGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 24H19" stroke="url(#slidesGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="6" y="8" width="6" height="4" rx="1" fill="url(#slidesGradient)" opacity="0.5"/>
    <path d="M6 15H22" stroke="url(#slidesGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 8H22" stroke="url(#slidesGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 11H20" stroke="url(#slidesGradient)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Icon: Support stagiaire - Style moderne avec dégradé violet
const SupportIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="supportGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
    </defs>
    <path d="M4 6C4 4.89543 4.89543 4 6 4H18L24 10V22C24 23.1046 23.1046 24 22 24H6C4.89543 24 4 23.1046 4 22V6Z" fill="url(#supportGradient)" opacity="0.15"/>
    <path d="M4 6C4 4.89543 4.89543 4 6 4H18L24 10V22C24 23.1046 23.1046 24 22 24H6C4.89543 24 4 23.1046 4 22V6Z" stroke="url(#supportGradient)" strokeWidth="1.5"/>
    <path d="M18 4V10H24" stroke="url(#supportGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="14" cy="14" r="4" stroke="url(#supportGradient)" strokeWidth="1.5"/>
    <path d="M14 12V14.5L15.5 15.5" stroke="url(#supportGradient)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Icon: Evaluation - Style moderne avec dégradé cyan
const EvaluationIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="evalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#0891b2" />
      </linearGradient>
    </defs>
    <rect x="4" y="5" width="18" height="21" rx="3" fill="url(#evalGradient)" opacity="0.15"/>
    <rect x="4" y="5" width="18" height="21" rx="3" stroke="url(#evalGradient)" strokeWidth="1.5"/>
    <rect x="9" y="2" width="8" height="5" rx="2" fill="white" stroke="url(#evalGradient)" strokeWidth="1.5"/>
    <circle cx="13" cy="4.5" r="1" fill="url(#evalGradient)"/>
    <rect x="7" y="10" width="4" height="4" rx="1" stroke="url(#evalGradient)" strokeWidth="1.2"/>
    <path d="M8 12L9.5 13.5L12 10.5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 12H19" stroke="url(#evalGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="7" y="16" width="4" height="4" rx="1" stroke="url(#evalGradient)" strokeWidth="1.2"/>
    <path d="M8 18L9.5 19.5L12 16.5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 18H17" stroke="url(#evalGradient)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Icon: Documents - Style moderne avec dégradé rose
const DocumentsIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="docsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EC4899" />
        <stop offset="100%" stopColor="#db2777" />
      </linearGradient>
    </defs>
    <rect x="6" y="4" width="14" height="18" rx="2" fill="url(#docsGradient)" opacity="0.15"/>
    <rect x="6" y="4" width="14" height="18" rx="2" stroke="url(#docsGradient)" strokeWidth="1.5"/>
    <rect x="8" y="6" width="14" height="18" rx="2" fill="white" stroke="url(#docsGradient)" strokeWidth="1.5"/>
    <path d="M11 11H19" stroke="url(#docsGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M11 15H17" stroke="url(#docsGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M11 19H15" stroke="url(#docsGradient)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  maxValue?: number;
  bgColor: string;
  iconColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, maxValue, bgColor, iconColor }) => {
  const percentage = maxValue ? (value / maxValue) * 100 : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow group">
      <div className="flex items-center justify-center">
        <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${bgColor} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        {maxValue ? (
          <>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums tracking-tight">
              {value}<span className="text-base font-medium text-gray-400 dark:text-gray-500">/{maxValue}</span>
            </h4>
            <div className="mt-2 h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </>
        ) : (
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums tracking-tight">{value}</h4>
        )}
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 block">{label}</span>
      </div>
    </div>
  );
};

// Icon: Total Documents - Style moderne avec dégradé violet
const TotalDocsIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="totalDocsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
    </defs>
    <rect x="3" y="4" width="12" height="16" rx="2" fill="url(#totalDocsGradient)" opacity="0.15"/>
    <rect x="3" y="4" width="12" height="16" rx="2" stroke="url(#totalDocsGradient)" strokeWidth="1.5"/>
    <rect x="8" y="8" width="12" height="16" rx="2" fill="white" stroke="url(#totalDocsGradient)" strokeWidth="1.5"/>
    <rect x="13" y="12" width="12" height="16" rx="2" fill="white" stroke="url(#totalDocsGradient)" strokeWidth="1.5"/>
    <path d="M16 17H22" stroke="url(#totalDocsGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M16 20H20" stroke="url(#totalDocsGradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M16 23H18" stroke="url(#totalDocsGradient)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const MetricsCards: React.FC = () => {
  // Données de démonstration - à remplacer par les vraies données du contexte/API
  const formationsCreated = 22;
  const formationsMax = 50; // Limite du plan

  // Calcul du total des documents générés
  const fichesPedagogiques = 38;
  const slides = 32;
  const supportsStag = 28;
  const evaluations = 16;
  const documents = 24;
  const totalDocuments = fichesPedagogiques + slides + supportsStag + evaluations + documents;
  const totalDocumentsMax = 500; // Limite du plan pour les documents

  const supportsFormation = slides;
  const supportsFormationMax = 100; // Limite du plan pour les supports

  const metrics = [
    {
      icon: <FormationIcon />,
      label: "Formations créées",
      value: formationsCreated,
      maxValue: formationsMax,
      bgColor: "bg-blue-50 dark:bg-blue-500/10",
      iconColor: "",
    },
    {
      icon: <TotalDocsIcon />,
      label: "Documents générés",
      value: totalDocuments,
      maxValue: totalDocumentsMax,
      bgColor: "bg-violet-50 dark:bg-violet-500/10",
      iconColor: "",
    },
    {
      icon: <SlidesIcon />,
      label: "Supports de formation",
      value: supportsFormation,
      maxValue: supportsFormationMax,
      bgColor: "bg-green-50 dark:bg-green-500/10",
      iconColor: "",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};

export default MetricsCards;
