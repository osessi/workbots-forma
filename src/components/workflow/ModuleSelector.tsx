"use client";

import React, { useState } from "react";
import {
  X,
  Search,
  Mail,
  MessageSquare,
  FileText,
  Clock,
  Users,
  Bell,
  Webhook,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  PenTool,
  Database,
  UserPlus,
  ClipboardList,
  Repeat,
} from "lucide-react";
import { WorkflowActionType } from "@prisma/client";

// ===========================================
// TYPES
// ===========================================

export interface ModuleOption {
  type: WorkflowActionType;
  nom: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

export interface ModuleCategory {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  modules: ModuleOption[];
}

interface ModuleSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: WorkflowActionType, nom: string) => void;
  position?: { x: number; y: number };
}

// ===========================================
// DONNÉES DES MODULES
// ===========================================

export const MODULE_CATEGORIES: ModuleCategory[] = [
  {
    id: "communication",
    label: "Communication",
    icon: Mail,
    color: "#3B82F6",
    modules: [
      {
        type: "ENVOYER_EMAIL",
        nom: "Email",
        description: "Envoyer un email personnalisé",
        icon: Mail,
      },
      {
        type: "ENVOYER_SMS",
        nom: "SMS",
        description: "Envoyer un SMS",
        icon: MessageSquare,
      },
    ],
  },
  {
    id: "documents",
    label: "Documents",
    icon: FileText,
    color: "#10B981",
    modules: [
      {
        type: "GENERER_DOCUMENT",
        nom: "Générer PDF",
        description: "Créer un document PDF à partir d'un modèle",
        icon: FileText,
      },
      {
        type: "DEMANDER_SIGNATURE",
        nom: "Signature",
        description: "Demander une signature électronique",
        icon: PenTool,
      },
    ],
  },
  {
    id: "donnees",
    label: "Données",
    icon: Database,
    color: "#8B5CF6",
    modules: [
      {
        type: "METTRE_A_JOUR_CHAMP",
        nom: "Mettre à jour",
        description: "Modifier un champ dans la base de données",
        icon: Database,
      },
      {
        type: "CREER_APPRENANT",
        nom: "Créer apprenant",
        description: "Créer un nouvel apprenant",
        icon: UserPlus,
      },
      {
        type: "CREER_INSCRIPTION",
        nom: "Créer inscription",
        description: "Inscrire à une session de formation",
        icon: ClipboardList,
      },
    ],
  },
  {
    id: "qualite",
    label: "Qualité",
    icon: CheckCircle,
    color: "#EF4444",
    modules: [
      {
        type: "CREER_RECLAMATION",
        nom: "Réclamation",
        description: "Créer une réclamation qualité",
        icon: AlertTriangle,
      },
      {
        type: "CREER_AMELIORATION",
        nom: "Amélioration",
        description: "Créer une fiche d'amélioration",
        icon: CheckCircle,
      },
      {
        type: "CREER_TACHE",
        nom: "Tâche",
        description: "Créer une tâche à effectuer",
        icon: ClipboardList,
      },
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    color: "#F59E0B",
    modules: [
      {
        type: "NOTIFIER_EQUIPE",
        nom: "Notifier équipe",
        description: "Envoyer une notification à l'équipe",
        icon: Users,
      },
      {
        type: "NOTIFIER_UTILISATEUR",
        nom: "Notifier utilisateur",
        description: "Envoyer une notification à un utilisateur",
        icon: Bell,
      },
    ],
  },
  {
    id: "integrations",
    label: "Intégrations",
    icon: Webhook,
    color: "#6366F1",
    modules: [
      {
        type: "WEBHOOK",
        nom: "Webhook",
        description: "Appeler un webhook externe",
        icon: Webhook,
      },
      {
        type: "APPEL_API",
        nom: "Appel API",
        description: "Faire un appel à une API externe",
        icon: Webhook,
      },
    ],
  },
  {
    id: "flux",
    label: "Contrôle de flux",
    icon: GitBranch,
    color: "#EC4899",
    modules: [
      {
        type: "DELAI",
        nom: "Délai",
        description: "Attendre un certain temps avant de continuer",
        icon: Clock,
      },
      {
        type: "CONDITION",
        nom: "Condition",
        description: "Créer un branchement conditionnel",
        icon: GitBranch,
      },
      {
        type: "BOUCLE",
        nom: "Boucle",
        description: "Répéter une série d'actions",
        icon: Repeat,
      },
    ],
  },
];

// ===========================================
// COMPOSANT
// ===========================================

export default function ModuleSelector({
  isOpen,
  onClose,
  onSelect,
}: ModuleSelectorProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filtrer les modules par recherche
  const filteredCategories = MODULE_CATEGORIES.map((category) => ({
    ...category,
    modules: category.modules.filter(
      (module) =>
        module.nom.toLowerCase().includes(search.toLowerCase()) ||
        module.description.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((category) => category.modules.length > 0);

  // Si une catégorie est sélectionnée, afficher ses modules
  const displayCategories = selectedCategory
    ? filteredCategories.filter((c) => c.id === selectedCategory)
    : filteredCategories;

  const handleSelect = (module: ModuleOption) => {
    onSelect(module.type, module.nom);
    onClose();
    setSearch("");
    setSelectedCategory(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ajouter un module</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un module..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Filtres catégories */}
          {!search && (
            <div className="flex gap-2 mt-3 flex-wrap">
              <button
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === null
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                Tous
              </button>
              {MODULE_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    selectedCategory === category.id
                      ? "text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                  style={{
                    backgroundColor:
                      selectedCategory === category.id
                        ? category.color
                        : undefined,
                  }}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <category.icon className="h-3.5 w-3.5" />
                  {category.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Liste des modules */}
        <div className="flex-1 overflow-y-auto p-4">
          {displayCategories.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Aucun module trouvé
            </div>
          ) : (
            <div className="space-y-6">
              {displayCategories.map((category) => (
                <div key={category.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <category.icon
                        className="h-4 w-4"
                        style={{ color: category.color }}
                      />
                    </div>
                    <h3 className="font-medium text-gray-700 dark:text-gray-300">
                      {category.label}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {category.modules.map((module) => (
                      <button
                        key={module.type}
                        onClick={() => handleSelect(module)}
                        className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                          style={{
                            backgroundColor: `${category.color}15`,
                          }}
                        >
                          <module.icon
                            className="h-5 w-5"
                            style={{ color: category.color }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {module.nom}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                            {module.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
