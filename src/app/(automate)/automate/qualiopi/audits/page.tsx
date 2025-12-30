"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Play,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Plus,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

// ===========================================
// TYPES
// ===========================================

interface Audit {
  id: string;
  type: string;
  dateAudit: string;
  auditeur: string | null;
  resultat: string;
  scoreGlobal: number | null;
  indicateursConformes: number | null;
  indicateursTotal: number | null;
  notes: string | null;
  rapportUrl: string | null;
  createdAt: string;
}

interface SimulationResult {
  rapport: string;
  pointsForts: string[];
  pointsAmeliorer: string[];
  risques: string[];
  score: number;
}

// ===========================================
// COMPOSANTS
// ===========================================

function AuditCard({
  audit,
  isExpanded,
  onToggle,
}: {
  audit: Audit;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const typeLabels: Record<string, { label: string; color: string }> = {
    INITIAL: { label: "Initial", color: "bg-blue-100 text-blue-700" },
    SURVEILLANCE: { label: "Surveillance", color: "bg-purple-100 text-purple-700" },
    RENOUVELLEMENT: { label: "Renouvellement", color: "bg-green-100 text-green-700" },
    SIMULATION: { label: "Simulation", color: "bg-amber-100 text-amber-700" },
  };

  const resultatConfig: Record<string, { label: string; icon: any; color: string }> = {
    REUSSI: { label: "Réussi", icon: CheckCircle2, color: "text-green-600" },
    ECHOUE: { label: "Échoué", icon: XCircle, color: "text-red-600" },
    PARTIEL: { label: "Partiel", icon: AlertTriangle, color: "text-amber-600" },
    EN_ATTENTE: { label: "En attente", icon: Clock, color: "text-gray-600" },
  };

  const typeInfo = typeLabels[audit.type] || typeLabels.SIMULATION;
  const resultatInfo = resultatConfig[audit.resultat] || resultatConfig.EN_ATTENTE;
  const ResultatIcon = resultatInfo.icon;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}
            >
              {typeInfo.label}
            </span>
            <ResultatIcon className={`h-5 w-5 ${resultatInfo.color}`} />
          </div>

          <div className="text-left">
            <p className="font-medium text-gray-900 dark:text-white">
              {new Date(audit.dateAudit).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            {audit.auditeur && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {audit.auditeur}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {audit.scoreGlobal !== null && (
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {audit.scoreGlobal}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {audit.indicateursConformes}/{audit.indicateursTotal} conformes
              </p>
            </div>
          )}
          <ChevronDown
            className={`h-5 w-5 text-gray-400 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Contenu détaillé */}
      {isExpanded && audit.notes && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{audit.notes}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

function NewAuditModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { type: string; dateAudit: string; auditeur: string }) => void;
}) {
  const [type, setType] = useState("SURVEILLANCE");
  const [dateAudit, setDateAudit] = useState("");
  const [auditeur, setAuditeur] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ type, dateAudit, auditeur });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Planifier un audit
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type d'audit
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="INITIAL">Initial</option>
              <option value="SURVEILLANCE">Surveillance</option>
              <option value="RENOUVELLEMENT">Renouvellement</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date de l'audit
            </label>
            <input
              type="date"
              value={dateAudit}
              onChange={(e) => setDateAudit(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Organisme certificateur / Auditeur
            </label>
            <input
              type="text"
              value={auditeur}
              onChange={(e) => setAuditeur(e.target.value)}
              placeholder="Ex: AFNOR, Bureau Veritas..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Planifier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===========================================
// PAGE PRINCIPALE
// ===========================================

export default function AuditsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);
  const [showNewAuditModal, setShowNewAuditModal] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(
    null
  );

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    try {
      const response = await fetch("/api/qualiopi/audit");
      if (!response.ok) throw new Error("Erreur de chargement");
      const data = await response.json();
      setAudits(data.audits || []);
    } catch (error) {
      toast.error("Erreur lors du chargement des audits");
    } finally {
      setLoading(false);
    }
  };

  const launchSimulation = async () => {
    setSimulating(true);
    setSimulationResult(null);

    try {
      const response = await fetch("/api/qualiopi/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSimulation: true }),
      });

      if (!response.ok) throw new Error("Erreur de simulation");
      const data = await response.json();

      setSimulationResult(data.simulation);
      setAudits((prev) => [data.audit, ...prev]);
      toast.success("Simulation terminée");
    } catch (error) {
      toast.error("Erreur lors de la simulation");
    } finally {
      setSimulating(false);
    }
  };

  const createAudit = async (data: {
    type: string;
    dateAudit: string;
    auditeur: string;
  }) => {
    try {
      const response = await fetch("/api/qualiopi/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Erreur de création");
      const audit = await response.json();

      setAudits((prev) => [audit, ...prev]);
      toast.success("Audit planifié");
    } catch (error) {
      toast.error("Erreur lors de la planification");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/automate/qualiopi")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Audits & Simulations
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Préparez-vous à la certification Qualiopi
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewAuditModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          <Plus className="h-4 w-4" />
          Planifier un audit
        </button>
      </div>

      {/* Simulation */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Play className="h-5 w-5 text-green-600" />
              Simulation d'audit
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              L'agent IA va analyser votre conformité et simuler un audit complet
            </p>
          </div>

          <button
            onClick={launchSimulation}
            disabled={simulating}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {simulating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Lancer la simulation
              </>
            )}
          </button>
        </div>

        {/* Résultat de simulation */}
        {simulationResult && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  simulationResult.score >= 80
                    ? "bg-green-100 dark:bg-green-900/30"
                    : simulationResult.score >= 60
                    ? "bg-amber-100 dark:bg-amber-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
                }`}
              >
                <span
                  className={`text-2xl font-bold ${
                    simulationResult.score >= 80
                      ? "text-green-600"
                      : simulationResult.score >= 60
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}
                >
                  {simulationResult.score}%
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {simulationResult.score >= 80
                    ? "Prêt pour l'audit"
                    : simulationResult.score >= 60
                    ? "Quelques améliorations nécessaires"
                    : "Actions correctives requises"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Score de conformité estimé
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Points forts */}
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Points forts
                </h3>
                <ul className="space-y-1">
                  {simulationResult.pointsForts.map((point, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                    >
                      <span className="text-green-500 mt-0.5">+</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Points à améliorer */}
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Points à améliorer
                </h3>
                <ul className="space-y-1">
                  {simulationResult.pointsAmeliorer.map((point, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                    >
                      <span className="text-amber-500 mt-0.5">!</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Risques */}
            {simulationResult.risques.length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h3 className="font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Risques identifiés
                </h3>
                <ul className="space-y-1">
                  {simulationResult.risques.map((risque, index) => (
                    <li
                      key={index}
                      className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2"
                    >
                      <span className="text-red-500 mt-0.5">-</span>
                      {risque}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historique des audits */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Historique des audits
        </h2>

        {audits.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Aucun audit
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Lancez une simulation ou planifiez votre premier audit
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {audits.map((audit) => (
              <AuditCard
                key={audit.id}
                audit={audit}
                isExpanded={expandedAudit === audit.id}
                onToggle={() =>
                  setExpandedAudit(expandedAudit === audit.id ? null : audit.id)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal nouveau audit */}
      <NewAuditModal
        isOpen={showNewAuditModal}
        onClose={() => setShowNewAuditModal(false)}
        onSubmit={createAudit}
      />
    </div>
  );
}
