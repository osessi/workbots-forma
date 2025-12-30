"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Play,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { WorkflowExecutionStatus } from "@prisma/client";

// ===========================================
// TYPES
// ===========================================

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowExecutionStatus;
  declencheurType: string;
  declencheurId: string | null;
  declencheurData: Record<string, unknown> | null;
  resultat: Record<string, unknown> | null;
  erreur: string | null;
  etapesCompletees: number;
  etapesTotales: number;
  tempsExecution: number | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

interface WorkflowInfo {
  id: string;
  nom: string;
  description: string | null;
}

// ===========================================
// HELPERS
// ===========================================

function getStatusInfo(status: WorkflowExecutionStatus) {
  switch (status) {
    case "EN_ATTENTE":
      return {
        label: "En attente",
        color: "bg-gray-100 text-gray-700",
        icon: Clock,
      };
    case "EN_COURS":
      return {
        label: "En cours",
        color: "bg-blue-100 text-blue-700",
        icon: RefreshCw,
      };
    case "TERMINEE":
      return {
        label: "Terminé",
        color: "bg-green-100 text-green-700",
        icon: CheckCircle2,
      };
    case "ERREUR":
      return {
        label: "Erreur",
        color: "bg-red-100 text-red-700",
        icon: XCircle,
      };
    case "ANNULEE":
      return {
        label: "Annulé",
        color: "bg-orange-100 text-orange-700",
        icon: AlertTriangle,
      };
    case "PAUSE":
      return {
        label: "En pause",
        color: "bg-yellow-100 text-yellow-700",
        icon: Clock,
      };
    default:
      return {
        label: status,
        color: "bg-gray-100 text-gray-700",
        icon: Clock,
      };
  }
}

function formatDuration(ms: number | null) {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ===========================================
// COMPOSANT EXECUTION ROW
// ===========================================

function ExecutionRow({ execution }: { execution: WorkflowExecution }) {
  const [expanded, setExpanded] = useState(false);
  const statusInfo = getStatusInfo(execution.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <button className="text-gray-400">
          {expanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>

        {/* Status */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
        >
          <StatusIcon className="h-4 w-4" />
          {statusInfo.label}
        </div>

        {/* Trigger type */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Zap className="h-4 w-4" />
          {execution.declencheurType}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                execution.status === "ERREUR"
                  ? "bg-red-500"
                  : execution.status === "TERMINEE"
                  ? "bg-green-500"
                  : "bg-blue-500"
              }`}
              style={{
                width: `${
                  execution.etapesTotales > 0
                    ? (execution.etapesCompletees / execution.etapesTotales) * 100
                    : 0
                }%`,
              }}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {execution.etapesCompletees}/{execution.etapesTotales}
          </span>
        </div>

        {/* Duration */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {formatDuration(execution.tempsExecution)}
        </div>

        {/* Date */}
        <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
          {formatDate(execution.startedAt)}
        </div>
      </div>

      {/* Details */}
      {expanded && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ID d'exécution</p>
              <p className="text-sm font-mono text-gray-900 dark:text-white">{execution.id}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Déclencheur ID</p>
              <p className="text-sm font-mono text-gray-900 dark:text-white">{execution.declencheurId || "-"}</p>
            </div>

            {execution.completedAt && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Terminé à</p>
                <p className="text-sm text-gray-900 dark:text-white">{formatDate(execution.completedAt)}</p>
              </div>
            )}

            {execution.erreur && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Erreur</p>
                <div className="p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded text-sm text-red-700 dark:text-red-400">
                  {execution.erreur}
                </div>
              </div>
            )}

            {execution.declencheurData && Object.keys(execution.declencheurData).length > 0 && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Données du déclencheur</p>
                <pre className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto max-h-40 text-gray-900 dark:text-gray-100">
                  {JSON.stringify(execution.declencheurData, null, 2)}
                </pre>
              </div>
            )}

            {execution.resultat && Object.keys(execution.resultat).length > 0 && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Résultat</p>
                <pre className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto max-h-40 text-gray-900 dark:text-gray-100">
                  {JSON.stringify(execution.resultat, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================
// PAGE PRINCIPALE
// ===========================================

export default function WorkflowHistoriquePage() {
  const router = useRouter();
  const params = useParams();
  const workflowId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [workflow, setWorkflow] = useState<WorkflowInfo | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [workflowId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger le workflow
      const workflowRes = await fetch(`/api/automatisations/${workflowId}`);
      if (!workflowRes.ok) throw new Error("Workflow non trouvé");
      const workflowData = await workflowRes.json();
      setWorkflow(workflowData);

      // Charger les exécutions
      const execRes = await fetch(`/api/automatisations/${workflowId}/executions`);
      if (execRes.ok) {
        const execData = await execRes.json();
        setExecutions(execData.executions || []);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement");
      router.push("/automate/automatisations");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const execRes = await fetch(`/api/automatisations/${workflowId}/executions`);
      if (execRes.ok) {
        const execData = await execRes.json();
        setExecutions(execData.executions || []);
      }
    } catch (error) {
      toast.error("Erreur lors du rafraîchissement");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/automate/automatisations/${workflowId}`)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Historique</h1>
            <p className="text-gray-500 dark:text-gray-400">{workflow?.nom}</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{executions.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {executions.filter(e => e.status === "TERMINEE").length}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Réussies</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {executions.filter(e => e.status === "ERREUR").length}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Erreurs</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {executions.filter(e => e.status === "EN_COURS").length}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">En cours</p>
        </div>
      </div>

      {/* Liste des exécutions */}
      {executions.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Play className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aucune exécution</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Ce workflow n'a pas encore été exécuté
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {executions.map((execution) => (
            <ExecutionRow key={execution.id} execution={execution} />
          ))}
        </div>
      )}
    </div>
  );
}
