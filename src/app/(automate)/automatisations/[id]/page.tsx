"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Play,
  Settings,
  Trash2,
  Loader2,
  Zap,
  MoreVertical,
  History,
  Copy,
  Power,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { WorkflowResponse, TRIGGERS_METADATA } from "@/types/workflow";
import { WorkflowActionType, WorkflowEtape, WorkflowTriggerType } from "@prisma/client";
import WorkflowCanvas, {
  WorkflowNode,
  WorkflowConnection,
  getModuleInfo,
} from "@/components/workflow/WorkflowCanvas";
import ModuleSelector from "@/components/workflow/ModuleSelector";
import ConfigPanel from "@/components/workflow/ConfigPanel";

// ===========================================
// TYPES
// ===========================================

interface TestResult {
  success: boolean;
  message: string;
  executionId?: string;
}

// ===========================================
// PAGE PRINCIPALE
// ===========================================

export default function WorkflowEditorPage() {
  const router = useRouter();
  const params = useParams();
  const workflowId = params.id as string;

  // États principaux
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [workflow, setWorkflow] = useState<WorkflowResponse | null>(null);

  // États du canvas
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<WorkflowConnection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [triggerNode, setTriggerNode] = useState<WorkflowNode | null>(null);

  // États des panneaux
  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const [pendingConnectionFrom, setPendingConnectionFrom] = useState<string | null>(null);
  const [pendingNodePosition, setPendingNodePosition] = useState<{ x: number; y: number } | null>(null);
  const [insertAfterNodeId, setInsertAfterNodeId] = useState<string | null>(null);

  // États menu settings
  const [showSettings, setShowSettings] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Résultat du test
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // ===========================================
  // CHARGEMENT DU WORKFLOW
  // ===========================================

  useEffect(() => {
    loadWorkflow();
  }, [workflowId]);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/automatisations/${workflowId}`);

      if (!res.ok) {
        throw new Error("Workflow non trouvé");
      }

      const data: WorkflowResponse = await res.json();
      setWorkflow(data);

      // Créer le node du déclencheur
      const trigger: WorkflowNode = {
        id: "trigger",
        type: "trigger",
        triggerType: data.triggerType,
        nom: TRIGGERS_METADATA.find((t) => t.type === data.triggerType)?.nom || "Déclencheur",
        description: TRIGGERS_METADATA.find((t) => t.type === data.triggerType)?.description,
        config: (data.triggerConfig as Record<string, unknown>) || {},
        x: 300,
        y: 100,
      };
      setTriggerNode(trigger);

      // Convertir les étapes en nodes
      const etapeNodes: WorkflowNode[] = (data.etapes || []).map((etape, index) => ({
        id: etape.id,
        type: "action" as const,
        actionType: etape.type,
        nom: etape.nom || getModuleInfo(etape.type).nom,
        description: etape.description || "",
        config: (etape.config as Record<string, unknown>) || {},
        x: etape.positionX || 300,
        y: etape.positionY || 200 + index * 120,
      }));
      setNodes(etapeNodes);

      // Créer les connexions
      const conns: WorkflowConnection[] = [];
      if (etapeNodes.length > 0) {
        // Connexion trigger -> premier node
        conns.push({ from: "trigger", to: etapeNodes[0].id });
        // Connexions entre nodes
        for (let i = 0; i < etapeNodes.length - 1; i++) {
          conns.push({ from: etapeNodes[i].id, to: etapeNodes[i + 1].id });
        }
      }
      setConnections(conns);
    } catch (error) {
      toast.error("Erreur lors du chargement");
      router.push("/automatisations");
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // ACTIONS
  // ===========================================

  const handleSave = async () => {
    if (!workflow) return;

    try {
      setSaving(true);

      // Convertir les nodes en étapes
      const orderedNodes = getOrderedNodes();
      const etapes = orderedNodes.map((node, index) => ({
        id: node.id.startsWith("new-") ? undefined : node.id,
        type: node.actionType as WorkflowActionType,
        nom: node.nom,
        description: node.description || "",
        config: node.config,
        ordre: index,
        positionX: Math.round(node.x),
        positionY: Math.round(node.y),
      }));

      const res = await fetch(`/api/automatisations/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: workflow.nom,
          description: workflow.description,
          actif: workflow.actif,
          triggerType: workflow.triggerType,
          triggerConfig: triggerNode?.config || {},
          etapes,
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      const updated = await res.json();
      setWorkflow(updated);

      toast.success("Workflow sauvegardé");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      // D'abord sauvegarder
      await handleSave();

      const res = await fetch(`/api/automatisations/${workflowId}/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTestResult({
          success: false,
          message: data.error || "Erreur lors du test",
        });
        toast.error("Échec du test");
      } else {
        setTestResult({
          success: true,
          message: "Workflow exécuté avec succès",
          executionId: data.executionId,
        });
        toast.success("Test réussi !");
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "Erreur lors du test",
      });
      toast.error("Erreur lors du test");
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce workflow ?")) return;

    try {
      const res = await fetch(`/api/automatisations/${workflowId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      toast.success("Workflow supprimé");
      router.push("/automatisations");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleToggleActive = async () => {
    if (!workflow) return;

    const newState = !workflow.actif;
    setWorkflow({ ...workflow, actif: newState });

    try {
      const res = await fetch(`/api/automatisations/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actif: newState }),
      });

      if (!res.ok) throw new Error();

      toast.success(newState ? "Workflow activé" : "Workflow désactivé");
    } catch {
      setWorkflow({ ...workflow, actif: !newState });
      toast.error("Erreur lors de la mise à jour");
    }
  };

  // ===========================================
  // GESTION DES NODES
  // ===========================================

  const getOrderedNodes = useCallback(() => {
    // Trier les nodes par position Y pour maintenir l'ordre
    return [...nodes].sort((a, b) => a.y - b.y);
  }, [nodes]);

  const handleNodeSelect = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    setShowSettings(false);
  };

  const handleNodeMove = (nodeId: string, x: number, y: number) => {
    if (nodeId === "trigger") {
      setTriggerNode((prev) => (prev ? { ...prev, x, y } : null));
    } else {
      setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, x, y } : n)));
    }
  };

  const handleNodeAdd = (x: number, y: number, afterNodeId?: string) => {
    setPendingNodePosition({ x, y });
    setInsertAfterNodeId(afterNodeId || null);
    setShowModuleSelector(true);
  };

  const handleModuleSelect = (type: WorkflowActionType, nom: string) => {
    const orderedNodes = getOrderedNodes();

    // Déterminer la position Y du nouveau node
    let newY: number;
    if (insertAfterNodeId) {
      const afterIndex = insertAfterNodeId === "trigger"
        ? -1
        : orderedNodes.findIndex(n => n.id === insertAfterNodeId);
      const afterNode = insertAfterNodeId === "trigger" ? triggerNode : orderedNodes[afterIndex];
      const nextNode = orderedNodes[afterIndex + 1];

      if (nextNode) {
        // Insérer entre deux nodes - décaler tous les nodes suivants
        newY = (afterNode?.y || 100) + 120;
        // Décaler les nodes suivants
        setNodes(prev => prev.map(n => {
          const nodeIndex = orderedNodes.findIndex(on => on.id === n.id);
          if (nodeIndex > afterIndex) {
            return { ...n, y: n.y + 120 };
          }
          return n;
        }));
      } else {
        newY = (afterNode?.y || 100) + 120;
      }
    } else {
      newY = pendingNodePosition?.y || (nodes.length > 0 ? Math.max(...nodes.map((n) => n.y)) + 120 : 220);
    }

    const newNode: WorkflowNode = {
      id: `new-${Date.now()}`,
      type: "action",
      actionType: type,
      nom,
      description: "",
      config: {},
      x: pendingNodePosition?.x || 300,
      y: newY,
    };

    setNodes((prev) => [...prev, newNode]);

    // Mettre à jour les connexions
    if (insertAfterNodeId) {
      setConnections(prev => {
        // Trouver la connexion sortante du node "after"
        const outgoingConn = prev.find(c => c.from === insertAfterNodeId);

        // Retirer cette connexion
        let newConns = prev.filter(c => c.from !== insertAfterNodeId);

        // Ajouter la connexion: afterNode -> newNode
        newConns.push({ from: insertAfterNodeId, to: newNode.id });

        // Si il y avait un node après, connecter newNode -> nextNode
        if (outgoingConn) {
          newConns.push({ from: newNode.id, to: outgoingConn.to });
        }

        return newConns;
      });
    } else if (nodes.length === 0) {
      // Premier node, connecter au trigger
      setConnections([{ from: "trigger", to: newNode.id }]);
    } else {
      // Connecter au dernier node
      const lastNode = orderedNodes[orderedNodes.length - 1];
      setConnections((prev) => [...prev, { from: lastNode.id, to: newNode.id }]);
    }

    setSelectedNodeId(newNode.id);
    setPendingNodePosition(null);
    setInsertAfterNodeId(null);
  };

  const handleNodeDelete = (nodeId: string) => {
    // Supprimer le node
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));

    // Mettre à jour les connexions
    setConnections((prev) => {
      const incoming = prev.find((c) => c.to === nodeId);
      const outgoing = prev.find((c) => c.from === nodeId);

      // Retirer les connexions impliquant ce node
      let newConns = prev.filter((c) => c.from !== nodeId && c.to !== nodeId);

      // Reconnecter si nécessaire
      if (incoming && outgoing) {
        newConns.push({ from: incoming.from, to: outgoing.to });
      }

      return newConns;
    });

    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const handleConnectionAdd = (from: string, to: string) => {
    setConnections((prev) => [...prev, { from, to }]);
  };

  const handleConfigSave = (nodeId: string, config: Record<string, unknown>) => {
    if (nodeId === "trigger") {
      setTriggerNode((prev) => (prev ? { ...prev, config } : null));
    } else {
      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, config, nom: (config._nom as string) || n.nom } : n))
      );
    }
    toast.success("Configuration enregistrée");
  };

  // ===========================================
  // RENDER
  // ===========================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Chargement du workflow...</p>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return null;
  }

  const selectedNode = selectedNodeId === "trigger"
    ? triggerNode
    : nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white">{workflow.nom}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {workflow.nombreExecutions} exécutions • {workflow.nombreErreurs} erreurs
              </p>
            </div>
          </div>

          {/* Toggle actif */}
          <button
            onClick={handleToggleActive}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              workflow.actif
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <Power className="h-4 w-4" />
            {workflow.actif ? "Actif" : "Inactif"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Résultat du test */}
          {testResult && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                testResult.success
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {testResult.message}
            </div>
          )}

          {/* Bouton Historique */}
          <button
            onClick={() => router.push(`/automatisations/${workflowId}/historique`)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
            title="Historique"
          >
            <History className="h-5 w-5" />
          </button>

          {/* Bouton Dupliquer */}
          <button
            onClick={() => toast.info("Fonctionnalité à venir")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
            title="Dupliquer"
          >
            <Copy className="h-5 w-5" />
          </button>

          {/* Bouton Paramètres */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {showSettings && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSettings(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      setShowSettingsModal(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                  >
                    <Settings className="h-4 w-4" />
                    Paramètres
                  </button>
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      handleDelete();
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Bouton Tester */}
          <button
            onClick={handleTest}
            disabled={testing || nodes.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              testing || nodes.length === 0
                ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
            }`}
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Tester
          </button>

          {/* Bouton Sauvegarder */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              saving
                ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Sauvegarder
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative">
          <WorkflowCanvas
            nodes={nodes}
            connections={connections}
            selectedNodeId={selectedNodeId}
            onNodeSelect={handleNodeSelect}
            onNodeMove={handleNodeMove}
            onNodeAdd={handleNodeAdd}
            onNodeDelete={handleNodeDelete}
            onConnectionAdd={handleConnectionAdd}
            triggerNode={triggerNode}
          />
        </div>

        {/* Panneau de configuration */}
        {selectedNode && (
          <ConfigPanel
            node={selectedNode}
            onClose={() => setSelectedNodeId(null)}
            onSave={handleConfigSave}
            onDelete={handleNodeDelete}
          />
        )}
      </div>

      {/* Sélecteur de modules */}
      <ModuleSelector
        isOpen={showModuleSelector}
        onClose={() => {
          setShowModuleSelector(false);
          setPendingNodePosition(null);
          setInsertAfterNodeId(null);
        }}
        onSelect={handleModuleSelect}
      />

      {/* Modal des paramètres du workflow */}
      {showSettingsModal && workflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSettingsModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Paramètres du workflow
              </h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Contenu */}
            <div className="p-4 space-y-4">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom du workflow
                </label>
                <input
                  type="text"
                  value={workflow.nom}
                  onChange={(e) => setWorkflow({ ...workflow, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom du workflow"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={workflow.description || ""}
                  onChange={(e) => setWorkflow({ ...workflow, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description du workflow"
                  rows={3}
                />
              </div>

              {/* Déclencheur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Déclencheur
                </label>
                <select
                  value={workflow.triggerType}
                  onChange={(e) => {
                    const newTriggerType = e.target.value as WorkflowTriggerType;
                    setWorkflow({ ...workflow, triggerType: newTriggerType });
                    // Mettre à jour le trigger node
                    const triggerMeta = TRIGGERS_METADATA.find(t => t.type === newTriggerType);
                    if (triggerNode && triggerMeta) {
                      setTriggerNode({
                        ...triggerNode,
                        triggerType: newTriggerType,
                        nom: triggerMeta.nom,
                        description: triggerMeta.description,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TRIGGERS_METADATA.map((trigger) => (
                    <option key={trigger.type} value={trigger.type}>
                      {trigger.nom}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {TRIGGERS_METADATA.find(t => t.type === workflow.triggerType)?.description}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  toast.success("Paramètres mis à jour (n'oubliez pas de sauvegarder)");
                }}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
