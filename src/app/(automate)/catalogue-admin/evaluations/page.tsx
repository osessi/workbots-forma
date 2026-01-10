"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ClipboardList,
  Search,
  Filter,
  Plus,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  QrCode,
  Send,
  Eye,
  RefreshCw,
  Users,
  UserCheck,
  ThermometerSun,
  ThermometerSnowflake,
} from "lucide-react";
import QRCodeEvaluation from "@/components/evaluation/QRCodeEvaluation";

// Types
interface Apprenant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

interface Formation {
  id: string;
  titre: string;
}

interface Session {
  id: string;
  formation: Formation;
  journees: { date: string }[];
}

interface Reponse {
  id: string;
  noteGlobale: number | null;
  scoreMoyen: number | null;
  tauxSatisfaction: number | null;
}

interface EvaluationSatisfaction {
  id: string;
  type: "CHAUD" | "FROID";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED";
  token: string;
  createdAt: string;
  sentAt: string | null;
  completedAt: string | null;
  apprenant: Apprenant;
  session: Session;
  reponse: Reponse | null;
}

interface Intervenant {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
}

interface EvaluationIntervenant {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED";
  token: string;
  createdAt: string;
  sentAt: string | null;
  completedAt: string | null;
  intervenant: Intervenant;
  session: Session;
  reponse: { scoreMoyen: number | null; satisfactionGlobale: number | null } | null;
}

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  expired: number;
  tauxMoyenSatisfaction?: number;
}

interface SessionOption {
  id: string;
  formationTitre: string;
  date: string;
  participants: { id: string; apprenantId: string; apprenant: Apprenant }[];
  formateur: { id: string; nom: string; prenom: string } | null;
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const config = {
    PENDING: { icon: Clock, label: "En attente", className: "bg-gray-100 text-gray-700" },
    IN_PROGRESS: { icon: RefreshCw, label: "En cours", className: "bg-blue-100 text-blue-700" },
    COMPLETED: { icon: CheckCircle2, label: "Complété", className: "bg-green-100 text-green-700" },
    EXPIRED: { icon: XCircle, label: "Expiré", className: "bg-red-100 text-red-700" },
  }[status] || { icon: AlertCircle, label: status, className: "bg-gray-100 text-gray-700" };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      <Icon size={14} />
      {config.label}
    </span>
  );
}

// Type badge component
function TypeBadge({ type }: { type: "CHAUD" | "FROID" | "INTERVENANT" }) {
  const config = {
    CHAUD: { icon: ThermometerSun, label: "À chaud", className: "bg-orange-100 text-orange-700" },
    FROID: { icon: ThermometerSnowflake, label: "À froid", className: "bg-blue-100 text-blue-700" },
    INTERVENANT: { icon: UserCheck, label: "Intervenant", className: "bg-purple-100 text-purple-700" },
  }[type];

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      <Icon size={14} />
      {config.label}
    </span>
  );
}

export default function EvaluationsPage() {
  // States
  const [activeTab, setActiveTab] = useState<"apprenant" | "intervenant">("apprenant");
  const [evaluations, setEvaluations] = useState<EvaluationSatisfaction[]>([]);
  const [evaluationsIntervenant, setEvaluationsIntervenant] = useState<EvaluationIntervenant[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, inProgress: 0, completed: 0, expired: 0 });
  const [statsIntervenant, setStatsIntervenant] = useState<Stats>({ total: 0, pending: 0, inProgress: 0, completed: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationSatisfaction | EvaluationIntervenant | null>(null);
  const [selectedType, setSelectedType] = useState<"CHAUD" | "FROID" | "INTERVENANT">("CHAUD");

  // Create modal states
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Load evaluations
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Load both types of evaluations
        const [satisfactionRes, intervenantRes] = await Promise.all([
          fetch("/api/evaluation-satisfaction"),
          fetch("/api/evaluation-intervenant"),
        ]);

        if (satisfactionRes.ok) {
          const data = await satisfactionRes.json();
          setEvaluations(data.evaluations || []);
          setStats(data.stats || { total: 0, pending: 0, inProgress: 0, completed: 0, expired: 0 });
        }

        if (intervenantRes.ok) {
          const data = await intervenantRes.json();
          setEvaluationsIntervenant(data.evaluations || []);
          setStatsIntervenant(data.stats || { total: 0, pending: 0, inProgress: 0, completed: 0, expired: 0 });
        }
      } catch (error) {
        console.error("Erreur chargement évaluations:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Load sessions for create modal
  useEffect(() => {
    async function loadSessions() {
      try {
        const res = await fetch("/api/sessions?includeParticipants=true");
        if (res.ok) {
          const data = await res.json();
          // Transform sessions data
          const sessionsData = (data.sessions || []).map((s: Record<string, unknown>) => ({
            id: s.id,
            formationTitre: (s.formation as { titre: string })?.titre || "Formation",
            date: (s.journees as { date: string }[])?.[0]?.date || "",
            participants: (s.clients as { participants: unknown[] }[])?.flatMap((c) => c.participants) || [],
            formateur: s.formateur,
          }));
          setSessions(sessionsData);
        }
      } catch (error) {
        console.error("Erreur chargement sessions:", error);
      }
    }

    if (showCreateModal) {
      loadSessions();
    }
  }, [showCreateModal]);

  // Filter evaluations
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((e) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = `${e.apprenant.prenom} ${e.apprenant.nom}`.toLowerCase().includes(query);
        const matchesEmail = e.apprenant.email.toLowerCase().includes(query);
        const matchesFormation = e.session.formation.titre.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesFormation) return false;
      }

      // Status filter
      if (filterStatus !== "all" && e.status !== filterStatus) return false;

      // Type filter
      if (filterType !== "all" && e.type !== filterType) return false;

      return true;
    });
  }, [evaluations, searchQuery, filterStatus, filterType]);

  const filteredEvaluationsIntervenant = useMemo(() => {
    return evaluationsIntervenant.filter((e) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = `${e.intervenant.prenom} ${e.intervenant.nom}`.toLowerCase().includes(query);
        const matchesEmail = e.intervenant.email?.toLowerCase().includes(query);
        const matchesFormation = e.session.formation.titre.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesFormation) return false;
      }

      // Status filter
      if (filterStatus !== "all" && e.status !== filterStatus) return false;

      return true;
    });
  }, [evaluationsIntervenant, searchQuery, filterStatus]);

  // Create evaluation
  const handleCreate = async () => {
    if (!selectedSession || (selectedType !== "INTERVENANT" && selectedParticipants.length === 0)) {
      alert("Veuillez sélectionner une session et au moins un participant");
      return;
    }

    setCreating(true);
    try {
      const session = sessions.find((s) => s.id === selectedSession);
      if (!session) return;

      if (selectedType === "INTERVENANT") {
        // Create intervenant evaluation
        if (!session.formateur) {
          alert("Cette session n'a pas de formateur assigné");
          return;
        }

        const res = await fetch("/api/evaluation-intervenant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: selectedSession,
            intervenantId: session.formateur.id,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Erreur de création");
        }

        const newEval = await res.json();
        setEvaluationsIntervenant((prev) => [newEval, ...prev]);
      } else {
        // Create satisfaction evaluations for each participant
        const results = await Promise.all(
          selectedParticipants.map(async (participantId) => {
            const participant = session.participants.find((p) => p.id === participantId);
            if (!participant) return null;

            const res = await fetch("/api/evaluation-satisfaction", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: selectedSession,
                apprenantId: participant.apprenantId,
                type: selectedType,
              }),
            });

            if (!res.ok) return null;
            return res.json();
          })
        );

        const newEvals = results.filter(Boolean);
        setEvaluations((prev) => [...newEvals, ...prev]);
      }

      setShowCreateModal(false);
      setSelectedSession("");
      setSelectedParticipants([]);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  // Open QR modal
  const openQRModal = (evaluation: EvaluationSatisfaction | EvaluationIntervenant, type: "CHAUD" | "FROID" | "INTERVENANT") => {
    setSelectedEvaluation(evaluation);
    setSelectedType(type);
    setShowQRModal(true);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const currentStats = activeTab === "apprenant" ? stats : statsIntervenant;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ClipboardList className="text-brand-500" />
            Évaluations de satisfaction
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gérez les évaluations à chaud, à froid et des intervenants
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          <Plus size={20} />
          Nouvelle évaluation
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentStats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">En attente</p>
          <p className="text-2xl font-bold text-gray-600">{currentStats.pending}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">En cours</p>
          <p className="text-2xl font-bold text-blue-600">{currentStats.inProgress}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Complétés</p>
          <p className="text-2xl font-bold text-green-600">{currentStats.completed}</p>
        </div>
        {activeTab === "apprenant" && stats.tauxMoyenSatisfaction !== undefined && stats.tauxMoyenSatisfaction > 0 && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-90">Satisfaction moyenne</p>
            <p className="text-2xl font-bold">{stats.tauxMoyenSatisfaction}%</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("apprenant")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "apprenant"
              ? "bg-brand-500 text-white"
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <Users size={18} />
          Apprenants ({stats.total})
        </button>
        <button
          onClick={() => setActiveTab("intervenant")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "intervenant"
              ? "bg-brand-500 text-white"
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <UserCheck size={18} />
          Intervenants ({statsIntervenant.total})
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email ou formation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white appearance-none cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="COMPLETED">Complétés</option>
              <option value="EXPIRED">Expirés</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Type filter (only for apprenant tab) */}
          {activeTab === "apprenant" && (
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-4 pr-8 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white appearance-none cursor-pointer"
              >
                <option value="all">Tous les types</option>
                <option value="CHAUD">À chaud</option>
                <option value="FROID">À froid</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : activeTab === "apprenant" ? (
          // Apprenant evaluations table
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Participant</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Formation</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Aucune évaluation trouvée
                  </td>
                </tr>
              ) : (
                filteredEvaluations.map((evaluation) => (
                  <tr key={evaluation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {evaluation.apprenant.prenom} {evaluation.apprenant.nom}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{evaluation.apprenant.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900 dark:text-white text-sm">{evaluation.session.formation.titre}</p>
                    </td>
                    <td className="px-6 py-4">
                      <TypeBadge type={evaluation.type} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={evaluation.status} />
                    </td>
                    <td className="px-6 py-4">
                      {evaluation.reponse?.tauxSatisfaction ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                          {evaluation.reponse.tauxSatisfaction}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(evaluation.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openQRModal(evaluation, evaluation.type)}
                          className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                          title="Voir QR Code"
                        >
                          <QrCode size={18} />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          // Intervenant evaluations table
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Intervenant</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Formation</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEvaluationsIntervenant.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Aucune évaluation intervenant trouvée
                  </td>
                </tr>
              ) : (
                filteredEvaluationsIntervenant.map((evaluation) => (
                  <tr key={evaluation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {evaluation.intervenant.prenom} {evaluation.intervenant.nom}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{evaluation.intervenant.email || "-"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900 dark:text-white text-sm">{evaluation.session.formation.titre}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={evaluation.status} />
                    </td>
                    <td className="px-6 py-4">
                      {evaluation.reponse?.scoreMoyen ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700">
                          {evaluation.reponse.scoreMoyen}/10
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(evaluation.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openQRModal(evaluation, "INTERVENANT")}
                          className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                          title="Voir QR Code"
                        >
                          <QrCode size={18} />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Nouvelle évaluation
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Type selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type d&apos;évaluation
                </label>
                <div className="flex gap-2">
                  {(["CHAUD", "FROID", "INTERVENANT"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedType(type);
                        setSelectedParticipants([]);
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        selectedType === type
                          ? type === "CHAUD"
                            ? "bg-orange-500 text-white border-orange-500"
                            : type === "FROID"
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-purple-500 text-white border-purple-500"
                          : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {type === "CHAUD" ? "À chaud" : type === "FROID" ? "À froid" : "Intervenant"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Session selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session de formation
                </label>
                <select
                  value={selectedSession}
                  onChange={(e) => {
                    setSelectedSession(e.target.value);
                    setSelectedParticipants([]);
                  }}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Sélectionnez une session...</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.formationTitre} - {session.date ? formatDate(session.date) : "Date non définie"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Participants selection (only for CHAUD/FROID) */}
              {selectedType !== "INTERVENANT" && selectedSession && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Participants
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2">
                    {sessions.find((s) => s.id === selectedSession)?.participants.map((participant) => (
                      <label
                        key={participant.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedParticipants.includes(participant.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedParticipants((prev) => [...prev, participant.id]);
                            } else {
                              setSelectedParticipants((prev) => prev.filter((id) => id !== participant.id));
                            }
                          }}
                          className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {participant.apprenant.prenom} {participant.apprenant.nom}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {participant.apprenant.email}
                          </p>
                        </div>
                      </label>
                    ))}
                    {sessions.find((s) => s.id === selectedSession)?.participants.length === 0 && (
                      <p className="text-center text-gray-500 py-4">Aucun participant dans cette session</p>
                    )}
                  </div>
                  {selectedParticipants.length > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      {selectedParticipants.length} participant(s) sélectionné(s)
                    </p>
                  )}
                </div>
              )}

              {/* Intervenant info */}
              {selectedType === "INTERVENANT" && selectedSession && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  {sessions.find((s) => s.id === selectedSession)?.formateur ? (
                    <div>
                      <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Formateur de la session :</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {sessions.find((s) => s.id === selectedSession)?.formateur?.prenom}{" "}
                        {sessions.find((s) => s.id === selectedSession)?.formateur?.nom}
                      </p>
                    </div>
                  ) : (
                    <p className="text-amber-600 dark:text-amber-400">
                      Cette session n&apos;a pas de formateur assigné
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedSession("");
                  setSelectedParticipants([]);
                }}
                className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={
                  creating ||
                  !selectedSession ||
                  (selectedType !== "INTERVENANT" && selectedParticipants.length === 0) ||
                  (selectedType === "INTERVENANT" && !sessions.find((s) => s.id === selectedSession)?.formateur)
                }
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Création...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Créer l&apos;évaluation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedEvaluation && (
        <QRCodeEvaluation
          sessionId={selectedEvaluation.session.id}
          apprenantId={selectedType !== "INTERVENANT" ? (selectedEvaluation as EvaluationSatisfaction).apprenant.id : undefined}
          intervenantId={selectedType === "INTERVENANT" ? (selectedEvaluation as EvaluationIntervenant).intervenant.id : undefined}
          type={selectedType}
          formationTitre={selectedEvaluation.session.formation.titre}
          participantNom={
            selectedType === "INTERVENANT"
              ? `${(selectedEvaluation as EvaluationIntervenant).intervenant.prenom} ${(selectedEvaluation as EvaluationIntervenant).intervenant.nom}`
              : `${(selectedEvaluation as EvaluationSatisfaction).apprenant.prenom} ${(selectedEvaluation as EvaluationSatisfaction).apprenant.nom}`
          }
          onClose={() => {
            setShowQRModal(false);
            setSelectedEvaluation(null);
          }}
        />
      )}
    </div>
  );
}
