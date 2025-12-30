"use client";

import React from "react";
import {
  Plus,
  Zap,
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
  X,
} from "lucide-react";
import { WorkflowActionType } from "@prisma/client";

// ===========================================
// TYPES
// ===========================================

export interface WorkflowNode {
  id: string;
  type: "trigger" | "action";
  actionType?: WorkflowActionType;
  triggerType?: string;
  nom: string;
  description?: string;
  config: Record<string, unknown>;
  x: number;
  y: number;
}

export interface WorkflowConnection {
  from: string;
  to: string;
}

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  onNodeMove: (nodeId: string, x: number, y: number) => void;
  onNodeAdd: (x: number, y: number, afterNodeId?: string) => void;
  onNodeDelete: (nodeId: string) => void;
  onConnectionAdd: (from: string, to: string) => void;
  triggerNode: WorkflowNode | null;
}

// ===========================================
// CONSTANTES - CATÉGORIES DE MODULES
// ===========================================

export const MODULE_CATEGORIES = {
  communication: {
    label: "Communication",
    icon: Mail,
    color: "#3B82F6", // blue
    modules: [
      { type: "ENVOYER_EMAIL", nom: "Email", description: "Envoyer un email", icon: Mail },
      { type: "ENVOYER_SMS", nom: "SMS", description: "Envoyer un SMS", icon: MessageSquare },
    ],
  },
  documents: {
    label: "Documents",
    icon: FileText,
    color: "#10B981", // green
    modules: [
      { type: "GENERER_DOCUMENT", nom: "Générer PDF", description: "Générer un document PDF", icon: FileText },
      { type: "DEMANDER_SIGNATURE", nom: "Signature", description: "Demander une signature", icon: PenTool },
    ],
  },
  donnees: {
    label: "Données",
    icon: Database,
    color: "#8B5CF6", // purple
    modules: [
      { type: "METTRE_A_JOUR_CHAMP", nom: "Maj champ", description: "Mettre à jour un champ", icon: Database },
      { type: "CREER_APPRENANT", nom: "Créer apprenant", description: "Créer un apprenant", icon: UserPlus },
      { type: "CREER_INSCRIPTION", nom: "Créer inscription", description: "Créer une inscription", icon: ClipboardList },
    ],
  },
  qualite: {
    label: "Qualité",
    icon: CheckCircle,
    color: "#EF4444", // red
    modules: [
      { type: "CREER_RECLAMATION", nom: "Réclamation", description: "Créer une réclamation", icon: AlertTriangle },
      { type: "CREER_AMELIORATION", nom: "Amélioration", description: "Créer une amélioration", icon: CheckCircle },
      { type: "CREER_TACHE", nom: "Tâche", description: "Créer une tâche", icon: ClipboardList },
    ],
  },
  notifications: {
    label: "Notifications",
    icon: Bell,
    color: "#F59E0B", // amber
    modules: [
      { type: "NOTIFIER_EQUIPE", nom: "Notifier équipe", description: "Notification à l'équipe", icon: Users },
      { type: "NOTIFIER_UTILISATEUR", nom: "Notifier user", description: "Notification utilisateur", icon: Bell },
    ],
  },
  integrations: {
    label: "Intégrations",
    icon: Webhook,
    color: "#6366F1", // indigo
    modules: [
      { type: "WEBHOOK", nom: "Webhook", description: "Appeler un webhook", icon: Webhook },
      { type: "APPEL_API", nom: "API", description: "Appeler une API", icon: Webhook },
    ],
  },
  flux: {
    label: "Contrôle",
    icon: GitBranch,
    color: "#EC4899", // pink
    modules: [
      { type: "DELAI", nom: "Délai", description: "Attendre un délai", icon: Clock },
      { type: "CONDITION", nom: "Condition", description: "Branchement", icon: GitBranch },
      { type: "BOUCLE", nom: "Boucle", description: "Répéter", icon: Repeat },
    ],
  },
};

export function getModuleIcon(type: string) {
  for (const category of Object.values(MODULE_CATEGORIES)) {
    const module = category.modules.find(m => m.type === type);
    if (module) return module.icon;
  }
  return Zap;
}

export function getModuleColor(type: string) {
  for (const [, category] of Object.entries(MODULE_CATEGORIES)) {
    if (category.modules.find(m => m.type === type)) {
      return category.color;
    }
  }
  return "#6B7280";
}

export function getModuleInfo(type: string) {
  for (const category of Object.values(MODULE_CATEGORIES)) {
    const module = category.modules.find(m => m.type === type);
    if (module) return module;
  }
  return { type, nom: type, description: "", icon: Zap };
}

// ===========================================
// COMPOSANT NODE VERTICAL
// ===========================================

interface NodeCardProps {
  node: WorkflowNode;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onAddAfter: () => void;
  showAddButton: boolean;
  index: number;
}

function NodeCard({
  node,
  isSelected,
  onSelect,
  onDelete,
  onAddAfter,
  showAddButton,
  index,
}: NodeCardProps) {
  const isTrigger = node.type === "trigger";
  const Icon = isTrigger ? Zap : getModuleIcon(node.actionType || "");
  const color = isTrigger ? "#F59E0B" : getModuleColor(node.actionType || "");

  return (
    <div className="flex flex-col items-center">
      {/* Ligne de connexion vers le haut (sauf pour le trigger) */}
      {index > 0 && (
        <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600" />
      )}

      {/* Card du node */}
      <div
        className={`relative flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border-2 shadow-sm cursor-pointer transition-all w-[280px] ${
          isSelected
            ? "border-blue-500 shadow-lg ring-2 ring-blue-500/30"
            : "border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-md"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {/* Icône du module */}
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="h-6 w-6" style={{ color }} />
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="font-semibold text-gray-900 dark:text-white truncate">
            {node.nom}
          </p>
          {node.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {node.description}
            </p>
          )}
        </div>

        {/* Badge numéro */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
          style={{ backgroundColor: color }}
        >
          {index + 1}
        </div>

        {/* Bouton supprimer */}
        {isSelected && !isTrigger && (
          <button
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md z-10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Ligne de connexion vers le bas + bouton ajouter */}
      {showAddButton && (
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-4 bg-gray-300 dark:bg-gray-600" />
          <button
            className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg hover:scale-110 hover:shadow-xl"
            onClick={(e) => {
              e.stopPropagation();
              onAddAfter();
            }}
            title="Ajouter un module ici"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <div className="w-0.5 h-4 bg-gray-300 dark:bg-gray-600" />
        </div>
      )}
    </div>
  );
}

// ===========================================
// COMPOSANT CANVAS PRINCIPAL
// ===========================================

export default function WorkflowCanvas({
  nodes,
  connections,
  selectedNodeId,
  onNodeSelect,
  onNodeMove,
  onNodeAdd,
  onNodeDelete,
  onConnectionAdd,
  triggerNode,
}: WorkflowCanvasProps) {
  // Obtenir les nodes dans l'ordre (par position Y ou ordre)
  const orderedNodes = [...nodes].sort((a, b) => a.y - b.y);

  const handleAddAfterNode = (afterNodeId: string) => {
    // Trouver l'index du node après lequel on ajoute
    const afterIndex = afterNodeId === "trigger"
      ? -1
      : orderedNodes.findIndex(n => n.id === afterNodeId);

    // Calculer la position Y pour le nouveau node
    const afterNode = afterNodeId === "trigger" ? triggerNode : orderedNodes[afterIndex];
    const nextNode = orderedNodes[afterIndex + 1];

    let newY: number;
    if (nextNode) {
      // Insérer entre deux nodes
      newY = (afterNode!.y + nextNode.y) / 2;
    } else {
      // Ajouter à la fin
      newY = (afterNode?.y || 100) + 120;
    }

    onNodeAdd(300, newY, afterNodeId);
  };

  const handleCanvasClick = () => {
    // Ne désélectionner que si on clique vraiment sur le fond
    onNodeSelect(null);
  };

  return (
    <div
      className="w-full h-full min-h-[600px] bg-gray-100 dark:bg-gray-900 overflow-auto"
      onClick={handleCanvasClick}
    >
      {/* Grille de fond */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Contenu centré */}
      <div className="relative flex flex-col items-center py-10 px-4 min-w-fit">
        {/* Trigger Node */}
        {triggerNode && (
          <NodeCard
            node={triggerNode}
            isSelected={selectedNodeId === triggerNode.id}
            onSelect={() => onNodeSelect(triggerNode.id)}
            onDelete={() => {}}
            onAddAfter={() => handleAddAfterNode(triggerNode.id)}
            showAddButton={true}
            index={0}
          />
        )}

        {/* Action Nodes */}
        {orderedNodes.map((node, index) => (
          <NodeCard
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            onSelect={() => onNodeSelect(node.id)}
            onDelete={() => onNodeDelete(node.id)}
            onAddAfter={() => handleAddAfterNode(node.id)}
            showAddButton={true}
            index={index + 1}
          />
        ))}

        {/* Message si pas de nodes */}
        {nodes.length === 0 && (
          <div className="mt-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Cliquez sur le bouton <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold mx-1">+</span> pour ajouter votre première action
            </p>
          </div>
        )}

        {/* Bouton flottant pour ajouter à la fin */}
        {nodes.length > 0 && (
          <div className="mt-6">
            <button
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                const lastNode = orderedNodes[orderedNodes.length - 1];
                handleAddAfterNode(lastNode?.id || "trigger");
              }}
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">Ajouter une action</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
