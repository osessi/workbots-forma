"use client";

import { Search, Calendar, Users, Award } from "lucide-react";

interface CatalogueBannerProps {
  organization: {
    name: string;
    primaryColor: string;
  };
  stats?: {
    formationsCount: number;
    stagiairesCount?: number;
  };
}

export function CatalogueBanner({ organization, stats }: CatalogueBannerProps) {
  const primaryColor = organization.primaryColor || "#4277FF";

  // Générer des couleurs dérivées
  const hexToHSL = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 217, s: 100, l: 63 };

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  const hsl = hexToHSL(primaryColor);
  const gradientStart = `hsl(${hsl.h}, ${hsl.s}%, ${Math.min(hsl.l + 5, 60)}%)`;
  const gradientEnd = `hsl(${hsl.h}, ${Math.max(hsl.s - 10, 70)}%, ${Math.max(hsl.l - 15, 25)}%)`;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
      }}
    >
      {/* Motif décoratif en arrière-plan */}
      <div className="absolute inset-0 opacity-10">
        <svg
          className="absolute w-full h-full"
          viewBox="0 0 1200 300"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Cercles décoratifs */}
          <circle cx="150" cy="50" r="100" fill="white" />
          <circle cx="1050" cy="250" r="150" fill="white" />
          <circle cx="600" cy="-50" r="120" fill="white" />
          <circle cx="900" cy="100" r="80" fill="white" />
          <circle cx="300" cy="280" r="60" fill="white" />

          {/* Lignes ondulées */}
          <path
            d="M0,150 Q300,100 600,150 T1200,150"
            stroke="white"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M0,200 Q300,250 600,200 T1200,200"
            stroke="white"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>

      {/* Formes géométriques flottantes */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-10 left-10 w-20 h-20 rounded-full opacity-20"
          style={{ backgroundColor: "white" }}
        />
        <div
          className="absolute bottom-5 right-20 w-32 h-32 rounded-full opacity-10"
          style={{ backgroundColor: "white" }}
        />
        <div
          className="absolute top-1/2 right-1/4 w-16 h-16 rounded-lg rotate-45 opacity-15"
          style={{ backgroundColor: "white" }}
        />
      </div>

      {/* Contenu */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Texte principal */}
          <div className="text-center md:text-left text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Catalogue des formations
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-xl">
              Découvrez nos formations professionnelles et choisissez celle qui correspond à vos objectifs.
            </p>
          </div>

          {/* Statistiques */}
          {stats && (
            <div className="flex gap-6 md:gap-8">
              {stats.formationsCount > 0 && (
                <div className="text-center text-white">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Calendar className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold">{stats.formationsCount}</div>
                  <div className="text-sm opacity-80">
                    Formation{stats.formationsCount > 1 ? "s" : ""}
                  </div>
                </div>
              )}
              {stats.stagiairesCount && stats.stagiairesCount > 0 && (
                <div className="text-center text-white">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold">{stats.stagiairesCount}</div>
                  <div className="text-sm opacity-80">Stagiaires formés</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Vague en bas */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1200 60"
          className="w-full h-12"
          preserveAspectRatio="none"
        >
          <path
            d="M0,60 L0,30 Q300,0 600,30 T1200,30 L1200,60 Z"
            fill="#f9fafb"
          />
        </svg>
      </div>
    </div>
  );
}
