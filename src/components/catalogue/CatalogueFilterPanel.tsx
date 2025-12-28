"use client";

import { X, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface FilterAggregation {
  modalites: { value: string; count: number; label: string }[];
  locations: { value: string; count: number }[];
  certifianteCount: { oui: number; non: number };
  eligibleCPFCount: { oui: number; non: number };
}

interface Filters {
  modalite: string | null;
  certifiante: string | null;
  eligibleCPF: string | null;
  lieu: string | null;
}

interface CatalogueFilterPanelProps {
  filters: Filters;
  aggregations: FilterAggregation | null;
  onFilterChange: (filterName: keyof Filters, value: string | null) => void;
  primaryColor: string;
}

// Composant Dropdown personnalisé
function FilterDropdown({
  label,
  value,
  options,
  onChange,
  primaryColor,
}: {
  label: string;
  value: string | null;
  options: { value: string; label: string; count?: number }[];
  onChange: (value: string | null) => void;
  primaryColor: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : "Indifférent";

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between gap-2 px-3 py-2
          bg-white border rounded-lg text-sm text-left
          hover:border-gray-400 transition-colors
          ${
            value
              ? "border-2"
              : "border-gray-300"
          }
        `}
        style={value ? { borderColor: primaryColor } : {}}
      >
        <span className={value ? "font-medium text-gray-900" : "text-gray-600"}>
          {displayLabel}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setIsOpen(false);
            }}
            className={`
              w-full px-3 py-2 text-sm text-left hover:bg-gray-50
              ${!value ? "bg-gray-50 font-medium" : ""}
            `}
          >
            Indifférent
          </button>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`
                w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center justify-between
                ${value === option.value ? "bg-gray-50 font-medium" : ""}
              `}
            >
              <span>{option.label}</span>
              {option.count !== undefined && (
                <span className="text-xs text-gray-400">({option.count})</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Options de modalités par défaut (toujours affichées)
const DEFAULT_MODALITE_OPTIONS = [
  { value: "PRESENTIEL", label: "Présentiel" },
  { value: "E_LEARNING", label: "E-learning" },
  { value: "DISTANCIEL", label: "Distanciel" },
  { value: "MIXTE", label: "Mixte" },
  { value: "SITUATION_TRAVAIL", label: "Situation de travail" },
  { value: "STAGE", label: "Stage" },
];

export function CatalogueFilterPanel({
  filters,
  aggregations,
  onFilterChange,
  primaryColor,
}: CatalogueFilterPanelProps) {
  // Options pour les filtres - utiliser les valeurs par défaut si pas d'agrégations
  // Fusionner avec les counts si disponibles
  const modaliteOptions = DEFAULT_MODALITE_OPTIONS.map((opt) => {
    const agg = aggregations?.modalites?.find((m) => m.value === opt.value);
    return {
      ...opt,
      count: agg?.count,
    };
  });

  const certifianteOptions = [
    {
      value: "true",
      label: "Oui",
      count: aggregations?.certifianteCount.oui || 0,
    },
    {
      value: "false",
      label: "Non",
      count: aggregations?.certifianteCount.non || 0,
    },
  ];

  const eligibleCPFOptions = [
    {
      value: "true",
      label: "Oui",
      count: aggregations?.eligibleCPFCount.oui || 0,
    },
    {
      value: "false",
      label: "Non",
      count: aggregations?.eligibleCPFCount.non || 0,
    },
  ];

  const lieuOptions =
    aggregations?.locations.map((loc) => ({
      value: loc.value,
      label: loc.value,
      count: loc.count,
    })) || [];

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = Object.values(filters).some((v) => v !== null);

  // Réinitialiser tous les filtres
  const resetFilters = () => {
    onFilterChange("modalite", null);
    onFilterChange("certifiante", null);
    onFilterChange("eligibleCPF", null);
    onFilterChange("lieu", null);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Type de formation (Modalité) */}
        <FilterDropdown
          label="Type de formation"
          value={filters.modalite}
          options={modaliteOptions}
          onChange={(value) => onFilterChange("modalite", value)}
          primaryColor={primaryColor}
        />

        {/* Formation certifiante */}
        <FilterDropdown
          label="Formation certifiante"
          value={filters.certifiante}
          options={certifianteOptions}
          onChange={(value) => onFilterChange("certifiante", value)}
          primaryColor={primaryColor}
        />

        {/* Éligible CPF */}
        <FilterDropdown
          label="Éligible CPF"
          value={filters.eligibleCPF}
          options={eligibleCPFOptions}
          onChange={(value) => onFilterChange("eligibleCPF", value)}
          primaryColor={primaryColor}
        />

        {/* Lieu */}
        {lieuOptions.length > 0 && (
          <FilterDropdown
            label="Lieu"
            value={filters.lieu}
            options={lieuOptions}
            onChange={(value) => onFilterChange("lieu", value)}
            primaryColor={primaryColor}
          />
        )}
      </div>

      {/* Bouton réinitialiser */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}
