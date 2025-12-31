"use client";

// ===========================================
// PAGE SUPER ADMIN - Séquences email (Drip Campaigns)
// ===========================================

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, GitBranch, Search, RefreshCw, MoreVertical,
  Eye, Play, Pause, Square, Trash2, Users, Mail, Clock,
  CheckCircle, XCircle, AlertTriangle
} from "lucide-react";

interface Sequence {
  id: string;
  name: string;
  description: string | null;
  status: string;
  triggerType: string;
  totalSteps: number;
  totalEnrolled: number;
  activeEnrollments: number;
  completedEnrollments: number;
  createdAt: string;
  organization?: { name: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: "Brouillon", color: "bg-gray-100 text-gray-700", icon: Clock },
  ACTIVE: { label: "Active", color: "bg-green-100 text-green-700", icon: Play },
  PAUSED: { label: "En pause", color: "bg-amber-100 text-amber-700", icon: Pause },
  STOPPED: { label: "Arrêtée", color: "bg-red-100 text-red-700", icon: Square },
};

const TRIGGER_LABELS: Record<string, string> = {
  MANUAL: "Manuel",
  SUBSCRIPTION: "Inscription",
  TAG_ADDED: "Tag ajouté",
  FORM_SUBMIT: "Formulaire",
  CAMPAIGN_OPENED: "Campagne ouverte",
  CAMPAIGN_CLICKED: "Clic campagne",
};

export default function AdminSequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchSequences();
  }, []);

  const fetchSequences = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/emailing/sequences?global=true");
      if (res.ok) {
        const data = await res.json();
        setSequences(data.sequences || []);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, action: "activate" | "pause" | "stop") => {
    try {
      const res = await fetch(`/api/emailing/sequences/${id}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchSequences();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
    setOpenMenuId(null);
  };

  const deleteSequence = async (id: string) => {
    if (!confirm("Supprimer cette séquence et tous ses enrollments ?")) return;
    try {
      await fetch(`/api/emailing/sequences/${id}`, { method: "DELETE" });
      fetchSequences();
    } catch (error) {
      console.error("Erreur:", error);
    }
    setOpenMenuId(null);
  };

  const filteredSequences = sequences.filter((s) => {
    const matchSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalActive = sequences.filter((s) => s.status === "ACTIVE").length;
  const totalEnrolled = sequences.reduce((acc, s) => acc + s.activeEnrollments, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/emailing"
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <GitBranch className="w-7 h-7 text-purple-500" />
            Séquences (Drip Campaigns)
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {totalActive} actives · {totalEnrolled.toLocaleString()} contacts inscrits
          </p>
        </div>
        <Link
          href="/admin/emailing/sequences/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" />
          Nouvelle séquence
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une séquence..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <select
            value={filterStatus || ""}
            onChange={(e) => setFilterStatus(e.target.value || null)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          <button
            onClick={fetchSequences}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : filteredSequences.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune séquence</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSequences.map((sequence) => {
            const statusConfig = STATUS_CONFIG[sequence.status] || STATUS_CONFIG.DRAFT;
            const StatusIcon = statusConfig.icon;
            return (
              <div
                key={sequence.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all relative group"
              >
                {/* Menu */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === sequence.id ? null : sequence.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                  {openMenuId === sequence.id && (
                    <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                      <Link
                        href={`/admin/emailing/sequences/${sequence.id}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Eye className="w-4 h-4" />
                        Voir détails
                      </Link>
                      {sequence.status === "DRAFT" && (
                        <button
                          onClick={() => updateStatus(sequence.id, "activate")}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        >
                          <Play className="w-4 h-4" />
                          Activer
                        </button>
                      )}
                      {sequence.status === "ACTIVE" && (
                        <button
                          onClick={() => updateStatus(sequence.id, "pause")}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        >
                          <Pause className="w-4 h-4" />
                          Mettre en pause
                        </button>
                      )}
                      {sequence.status === "PAUSED" && (
                        <button
                          onClick={() => updateStatus(sequence.id, "activate")}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        >
                          <Play className="w-4 h-4" />
                          Reprendre
                        </button>
                      )}
                      {(sequence.status === "ACTIVE" || sequence.status === "PAUSED") && (
                        <button
                          onClick={() => updateStatus(sequence.id, "stop")}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Square className="w-4 h-4" />
                          Arrêter
                        </button>
                      )}
                      <button
                        onClick={() => deleteSequence(sequence.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>

                <Link href={`/admin/emailing/sequences/${sequence.id}`}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <GitBranch className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate pr-8">
                          {sequence.name}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </div>
                      {sequence.description && (
                        <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                          {sequence.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>{sequence.organization?.name || "Global"}</span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {sequence.totalSteps} étapes
                        </span>
                        <span>{TRIGGER_LABELS[sequence.triggerType] || sequence.triggerType}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {sequence.activeEnrollments.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">En cours</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-green-600">
                        {sequence.completedEnrollments.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Terminés</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {sequence.totalEnrolled.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
        <p className="text-sm text-purple-800 dark:text-purple-200">
          <strong>Séquences automatiques :</strong> Créez des campagnes drip pour nurturing,
          onboarding, ou suivi automatisé. Les emails sont envoyés automatiquement selon le délai configuré entre chaque étape.
        </p>
      </div>
    </div>
  );
}
