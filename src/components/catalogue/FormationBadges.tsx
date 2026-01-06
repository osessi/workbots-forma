"use client";

import {
  Clock,
  MapPin,
  Video,
  Users,
  Award,
  Accessibility,
  Monitor,
  Briefcase,
  GraduationCap,
  CheckCircle,
  BookOpen,
} from "lucide-react";

interface FormationBadgesProps {
  formation: {
    modalites?: string[];
    dureeHeures: number;
    dureeJours?: number;
    isCertifiante: boolean;
    numeroFicheRS?: string | null;
    estEligibleCPF?: boolean;
    accessibiliteHandicap?: string | null;
    nombreModules?: number;
    indicateurs?: {
      tauxSatisfaction: number | null;
      nombreAvis?: number;
      nombreStagiaires?: number;
    } | null;
  };
  primaryColor?: string;
  size?: "sm" | "md";
  showAll?: boolean;
}

// Labels des modalités
const modaliteLabels: Record<string, string> = {
  PRESENTIEL: "Présentiel",
  DISTANCIEL: "Distanciel",
  MIXTE: "Mixte",
  E_LEARNING: "E-learning",
  SITUATION_TRAVAIL: "Situation de travail",
  STAGE: "Stage",
};

// Couleurs des modalités - Style Digiforma avec bordure et fond léger
const modaliteStyles: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  PRESENTIEL: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: "text-blue-500" },
  DISTANCIEL: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", icon: "text-purple-500" },
  MIXTE: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", icon: "text-indigo-500" },
  E_LEARNING: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", icon: "text-cyan-500" },
  SITUATION_TRAVAIL: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: "text-orange-500" },
  STAGE: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "text-emerald-500" },
};

// Icônes des modalités
const modaliteIcons: Record<string, React.ElementType> = {
  PRESENTIEL: MapPin,
  DISTANCIEL: Monitor,
  MIXTE: Users,
  E_LEARNING: Video,
  SITUATION_TRAVAIL: Briefcase,
  STAGE: GraduationCap,
};

export function FormationBadges({
  formation,
  primaryColor = "#4277FF",
  size = "sm",
  showAll = false,
}: FormationBadgesProps) {
  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
  };

  // Déterminer les modalités à afficher
  const modalitesToShow = formation.modalites && formation.modalites.length > 0
    ? formation.modalites
    : ["PRESENTIEL"]; // Défaut si pas de modalité définie

  return (
    <div className="flex flex-wrap gap-2">
      {/* Badges de modalité - Utilise la couleur primaire */}
      {modalitesToShow.map((modalite) => {
        const Icon = modaliteIcons[modalite] || Users;
        return (
          <span
            key={modalite}
            className={`
              inline-flex items-center gap-1.5 rounded-md font-medium border
              ${sizeClasses[size]}
            `}
            style={{
              backgroundColor: `${primaryColor}10`,
              color: primaryColor,
              borderColor: `${primaryColor}30`,
            }}
          >
            <Icon className={iconSizes[size]} style={{ color: primaryColor }} />
            {modaliteLabels[modalite] || modalite}
          </span>
        );
      })}

      {/* Durée - Style avec couleur primaire */}
      {formation.dureeHeures > 0 && (
        <span
          className={`
            inline-flex items-center gap-1.5 rounded-md font-medium border
            ${sizeClasses[size]}
          `}
          style={{
            backgroundColor: `${primaryColor}10`,
            color: primaryColor,
            borderColor: `${primaryColor}30`,
          }}
        >
          <Clock className={iconSizes[size]} style={{ color: primaryColor }} />
          {formation.dureeHeures}h
          {formation.dureeJours && formation.dureeJours > 0 && (
            <span style={{ color: primaryColor, opacity: 0.8 }}>
              ({formation.dureeJours}j)
            </span>
          )}
        </span>
      )}

      {/* Nombre de modules */}
      {formation.nombreModules && formation.nombreModules > 0 && (
        <span
          className={`
            inline-flex items-center gap-1.5 rounded-md font-medium border
            ${sizeClasses[size]}
          `}
          style={{
            backgroundColor: `${primaryColor}10`,
            color: primaryColor,
            borderColor: `${primaryColor}30`,
          }}
        >
          <BookOpen className={iconSizes[size]} style={{ color: primaryColor }} />
          {formation.nombreModules} module{formation.nombreModules > 1 ? "s" : ""}
        </span>
      )}

      {/* Accessible - Badge toujours affiché avec icône */}
      <span
        className={`
          inline-flex items-center gap-1.5 rounded-md font-medium border
          bg-teal-50 text-teal-700 border-teal-200
          ${sizeClasses[size]}
        `}
        title="Formation accessible aux personnes en situation de handicap"
      >
        <Accessibility className={`${iconSizes[size]} text-teal-500`} />
        {formation.accessibiliteHandicap ? "Accessible PSH" : "Accessible PSH"}
      </span>

      {/* Éligible CPF - Badge vert avec check */}
      {formation.estEligibleCPF && (
        <span
          className={`
            inline-flex items-center gap-1.5 rounded-md font-medium border
            bg-green-50 text-green-700 border-green-200
            ${sizeClasses[size]}
          `}
        >
          <CheckCircle className={`${iconSizes[size]} text-green-500`} />
          Éligible CPF
        </span>
      )}

      {/* Formation certifiante - Badge prominent */}
      {formation.isCertifiante && (
        <span
          className={`
            inline-flex items-center gap-1.5 rounded-md font-semibold
            text-white border
            ${sizeClasses[size]}
          `}
          style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
        >
          <Award className={`${iconSizes[size]} text-white/80`} />
          {showAll && formation.numeroFicheRS
            ? `Certifiante ${formation.numeroFicheRS}`
            : "Certifiante"}
        </span>
      )}
    </div>
  );
}

// Composant pour le badge de satisfaction (séparé car souvent affiché différemment)
export function SatisfactionBadge({
  tauxSatisfaction,
  nombreAvis,
  primaryColor = "#4277FF",
  size = "sm",
}: {
  tauxSatisfaction: number | null;
  nombreAvis?: number;
  primaryColor?: string;
  size?: "sm" | "md";
}) {
  if (!tauxSatisfaction) return null;

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  // Convertir le taux en note sur 10 si c'est un pourcentage
  const note = tauxSatisfaction > 10 ? (tauxSatisfaction / 10).toFixed(1) : tauxSatisfaction;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-md font-medium
        bg-amber-50 text-amber-700 border border-amber-200
        ${sizeClasses[size]}
      `}
    >
      <span className="text-amber-500">★</span>
      {note}/10
      {nombreAvis && nombreAvis > 0 && (
        <span className="text-amber-600/70">
          ({nombreAvis} avis)
        </span>
      )}
    </span>
  );
}

// Composant pour afficher le taux de certification (Qualiopi IND 3)
export function CertificationBadge({
  tauxCertification,
  primaryColor = "#4277FF",
  size = "sm",
}: {
  tauxCertification: number | null;
  primaryColor?: string;
  size?: "sm" | "md";
}) {
  if (!tauxCertification) return null;

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-md font-medium
        bg-emerald-50 text-emerald-700 border border-emerald-200
        ${sizeClasses[size]}
      `}
      title="Taux de certification (certifiés / présentés)"
    >
      <Award className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      {tauxCertification.toFixed(0)}% certifiés
    </span>
  );
}

// Composant pour afficher les indicateurs de résultats (stagiaires formés, etc.)
export function FormationIndicateurs({
  indicateurs,
  primaryColor = "#4277FF",
  size = "sm",
}: {
  indicateurs: {
    tauxSatisfaction: number | null;
    tauxCertification?: number | null;
    nombreAvis?: number;
    nombreStagiaires?: number;
  } | null;
  primaryColor?: string;
  size?: "sm" | "md";
}) {
  if (!indicateurs) return null;

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Taux de satisfaction */}
      {indicateurs.tauxSatisfaction && (
        <SatisfactionBadge
          tauxSatisfaction={indicateurs.tauxSatisfaction}
          nombreAvis={indicateurs.nombreAvis}
          primaryColor={primaryColor}
          size={size}
        />
      )}

      {/* Taux de certification (Qualiopi IND 3) */}
      {indicateurs.tauxCertification && (
        <CertificationBadge
          tauxCertification={indicateurs.tauxCertification}
          primaryColor={primaryColor}
          size={size}
        />
      )}

      {/* Nombre de stagiaires formés */}
      {indicateurs.nombreStagiaires && indicateurs.nombreStagiaires > 0 && (
        <span
          className={`
            inline-flex items-center gap-1.5 rounded-md font-medium border
            ${sizeClasses[size]}
          `}
          style={{
            backgroundColor: `${primaryColor}10`,
            color: primaryColor,
            borderColor: `${primaryColor}30`,
          }}
        >
          <Users className={iconSizes[size]} style={{ color: primaryColor }} />
          {indicateurs.nombreStagiaires} stagiaire{indicateurs.nombreStagiaires > 1 ? "s" : ""} formé{indicateurs.nombreStagiaires > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
