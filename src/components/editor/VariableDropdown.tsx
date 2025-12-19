"use client";
// ===========================================
// DROPDOWN POUR INSERTION DE VARIABLES
// ===========================================

import { useState, useRef, useEffect, useMemo } from "react";
import { DocumentType, TemplateVariable, VariableGroup } from "@/lib/templates/types";
import {
  getVariablesForDocumentType,
  VARIABLE_GROUPS,
  getVariableGroupsWithDynamicContext,
  DynamicVariableContext,
} from "@/lib/templates/variables";

interface VariableDropdownProps {
  documentType?: DocumentType;
  onInsertVariable: (variableId: string) => void;
  /** Contexte dynamique pour generer les variables numerotees */
  dynamicContext?: DynamicVariableContext;
}

export default function VariableDropdown({
  documentType,
  onInsertVariable,
  dynamicContext,
}: VariableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Obtenir les groupes de variables selon le type de document et le contexte dynamique
  const variableGroups = useMemo(() => {
    if (dynamicContext && (dynamicContext.nombreJournees || dynamicContext.nombreSalaries)) {
      // Utiliser les variables dynamiques si un contexte est fourni
      return getVariableGroupsWithDynamicContext(dynamicContext);
    }
    // Sinon utiliser les groupes statiques
    return documentType ? getVariablesForDocumentType(documentType) : VARIABLE_GROUPS;
  }, [documentType, dynamicContext?.nombreJournees, dynamicContext?.nombreSalaries]);

  // Filtrer les variables par recherche
  const filteredGroups = variableGroups
    .map((group) => ({
      ...group,
      variables: group.variables.filter(
        (v) =>
          v.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((group) => group.variables.length > 0);

  // Fermer le dropdown quand on clique a l'exterieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus sur l'input et calculer la position quand on ouvre
  useEffect(() => {
    if (isOpen) {
      if (inputRef.current) {
        inputRef.current.focus();
      }
      // Calculer la position du dropdown
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
        });
      }
    }
  }, [isOpen]);

  const toggleGroup = (category: string) => {
    setExpandedGroups((prev) =>
      prev.includes(category)
        ? prev.filter((g) => g !== category)
        : [...prev, category]
    );
  };

  const handleInsert = (variable: TemplateVariable) => {
    onInsertVariable(variable.id);
    setIsOpen(false);
    setSearchQuery("");
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "formation":
        return <GraduationCapIcon />;
      case "journees":
        return <CalendarDaysIcon />;
      case "modules":
        return <LayersIcon />;
      case "organisation":
        return <Building2Icon />;
      case "entreprise":
        return <BriefcaseIcon />;
      case "particulier":
        return <UserIcon />;
      case "participants":
        return <UsersIcon />;
      case "formateur":
        return <UserCheckIcon />;
      case "dates":
        return <CalendarIcon />;
      case "document":
        return <FileTextIcon />;
      default:
        return <VariableIcon />;
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bouton principal */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg transition-all
          ${isOpen
            ? "bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
          }
        `}
        title="Inserer une variable"
      >
        <VariableIcon />
        <span className="text-sm font-medium">Variable</span>
        <ChevronDownIcon className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown - Position fixed pour éviter les problèmes d'overflow */}
      {isOpen && (
        <div
          className="fixed w-80 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-[9999] overflow-hidden"
          style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
        >
          {/* Recherche */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une variable..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Liste des variables */}
          <div className="max-h-96 overflow-y-auto">
            {filteredGroups.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Aucune variable trouvee
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.category} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  {/* Header du groupe */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.category)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">
                        {getCategoryIcon(group.category)}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {group.label}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        ({group.variables.length})
                      </span>
                    </div>
                    <ChevronDownIcon
                      className={`text-gray-400 transition-transform ${
                        expandedGroups.includes(group.category) ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Liste des variables du groupe */}
                  {(expandedGroups.includes(group.category) || searchQuery) && (
                    <div className="pb-2">
                      {group.variables.map((variable) => (
                        <VariableItem
                          key={variable.id}
                          variable={variable}
                          onInsert={() => handleInsert(variable)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Cliquez sur une variable pour l'inserer
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================
// COMPOSANT VARIABLE ITEM
// ===========================================

interface VariableItemProps {
  variable: TemplateVariable;
  onInsert: () => void;
}

function VariableItem({ variable, onInsert }: VariableItemProps) {
  return (
    <button
      type="button"
      onClick={onInsert}
      className="w-full flex items-start gap-3 px-4 py-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors text-left"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-brand-600 dark:text-brand-400">
            {`{{${variable.id}}}`}
          </code>
          {variable.isLoop && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              Boucle
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
          {variable.label}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          Ex: {variable.example || "..."}
        </p>
      </div>
      <PlusIcon className="flex-shrink-0 text-gray-400 mt-1" />
    </button>
  );
}

// ===========================================
// ICONES
// ===========================================

const VariableIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

const ChevronDownIcon = ({ className = "" }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const SearchIcon = ({ className = "" }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PlusIcon = ({ className = "" }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const GraduationCapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const LayersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const Building2Icon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
    <path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const UserCheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <polyline points="16 11 18 13 22 9" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const CalendarDaysIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 14h.01" />
    <path d="M12 14h.01" />
    <path d="M16 14h.01" />
    <path d="M8 18h.01" />
    <path d="M12 18h.01" />
    <path d="M16 18h.01" />
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const FileTextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
