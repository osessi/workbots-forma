"use client";

// ===========================================
// PAGE SUPER ADMIN - Détail séquence
// ===========================================

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft, GitBranch, RefreshCw, Play, Pause, Square,
  Users, Mail, Clock, CheckCircle, XCircle, Plus
} from "lucide-react";

interface Step {
  id: string;
  order: number;
  subject: string;
  delayMinutes: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
}

interface Enrollment {
  id: string;
  contactEmail: string;
  status: string;
  currentStep: number;
  enrolledAt: string;
  completedAt: string | null;
}

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
  steps: Step[];
  organization?: { name: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Brouillon", color: "bg-gray-100 text-gray-700" },
  ACTIVE: { label: "Active", color: "bg-green-100 text-green-700" },
  PAUSED: { label: "En pause", color: "bg-amber-100 text-amber-700" },
  STOPPED: { label: "Arrêtée", color: "bg-red-100 text-red-700" },
};

export default function SequenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"steps" | "enrollments">("steps");

  useEffect(() => {
    fetchSequence();
    fetchEnrollments();
  }, [id]);

  const fetchSequence = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/emailing/sequences/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSequence(data.sequence);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const res = await fetch(`/api/emailing/sequences/${id}/enrollments`);
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments || []);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const updateStatus = async (action: "activate" | "pause" | "stop") => {
    try {
      const res = await fetch(`/api/emailing/sequences/${id}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchSequence();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const formatDelay = (minutes: number) => {
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    if (days > 0 && hours > 0) return `${days}j ${hours}h`;
    if (days > 0) return `${days} jour${days > 1 ? "s" : ""}`;
    if (hours > 0) return `${hours} heure${hours > 1 ? "s" : ""}`;
    return "Immédiat";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!sequence) {
    return (
      <div className="text-center py-24">
        <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Séquence non trouvée</p>
        <Link href="/admin/emailing/sequences" className="text-brand-600 hover:underline mt-2 inline-block">
          Retour aux séquences
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[sequence.status] || STATUS_CONFIG.DRAFT;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/emailing/sequences"
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {sequence.name}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            {sequence.organization?.name || "Global"} · {sequence.totalSteps} étapes
          </p>
        </div>
        <div className="flex gap-2">
          {sequence.status === "DRAFT" && (
            <button
              onClick={() => updateStatus("activate")}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Play className="w-4 h-4" />
              Activer
            </button>
          )}
          {sequence.status === "ACTIVE" && (
            <button
              onClick={() => updateStatus("pause")}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          )}
          {sequence.status === "PAUSED" && (
            <>
              <button
                onClick={() => updateStatus("activate")}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Play className="w-4 h-4" />
                Reprendre
              </button>
              <button
                onClick={() => updateStatus("stop")}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Square className="w-4 h-4" />
                Arrêter
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 mb-1">Total inscrits</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {sequence.totalEnrolled.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 mb-1">En cours</p>
          <p className="text-2xl font-bold text-blue-600">
            {sequence.activeEnrollments.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 mb-1">Terminés</p>
          <p className="text-2xl font-bold text-green-600">
            {sequence.completedEnrollments.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 mb-1">Taux complétion</p>
          <p className="text-2xl font-bold text-purple-600">
            {sequence.totalEnrolled > 0
              ? Math.round((sequence.completedEnrollments / sequence.totalEnrolled) * 100)
              : 0}%
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab("steps")}
          className={`px-4 py-2 font-medium transition-colors ${
            tab === "steps"
              ? "text-brand-600 border-b-2 border-brand-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Étapes ({sequence.steps.length})
        </button>
        <button
          onClick={() => setTab("enrollments")}
          className={`px-4 py-2 font-medium transition-colors ${
            tab === "enrollments"
              ? "text-brand-600 border-b-2 border-brand-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Inscrits ({enrollments.length})
        </button>
      </div>

      {/* Étapes */}
      {tab === "steps" && (
        <div className="space-y-4">
          {sequence.steps.map((step, index) => (
            <div
              key={step.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-purple-600">{step.order}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {index > 0 && (
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Après {formatDelay(step.delayMinutes)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    {step.subject}
                  </h3>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {step.totalSent} envoyés
                    </span>
                    <span className="text-green-600">
                      {step.totalSent > 0 ? Math.round((step.totalOpened / step.totalSent) * 100) : 0}% ouverts
                    </span>
                    <span className="text-blue-600">
                      {step.totalOpened > 0 ? Math.round((step.totalClicked / step.totalOpened) * 100) : 0}% cliqués
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inscrits */}
      {tab === "enrollments" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Étape</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inscrit le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {enrollments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                    Aucun inscrit
                  </td>
                </tr>
              ) : (
                enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <span className="text-gray-900 dark:text-white">{enrollment.contactEmail}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        enrollment.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : enrollment.status === "ACTIVE"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {enrollment.status === "COMPLETED" ? (
                          <><CheckCircle className="w-3 h-3" /> Terminé</>
                        ) : enrollment.status === "ACTIVE" ? (
                          <><Play className="w-3 h-3" /> En cours</>
                        ) : (
                          enrollment.status
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {enrollment.currentStep} / {sequence.totalSteps}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(enrollment.enrolledAt).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
