"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Play,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Settings,
  X,
  Link as LinkIcon,
  AlertCircle,
  VideoOff,
  Disc,
  FileVideo,
  RefreshCw,
  Download,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Types
interface VideoIntegration {
  id: string;
  provider: "ZOOM" | "GOOGLE_MEET" | "MICROSOFT_TEAMS";
  accountEmail: string | null;
  accountName: string | null;
  isActive: boolean;
}

interface ProviderInfo {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  integration: VideoIntegration | null;
  authUrl: string;
}

interface VideoMeeting {
  id: string;
  title: string;
  description: string | null;
  provider: "ZOOM" | "GOOGLE_MEET" | "MICROSOFT_TEAMS";
  joinUrl: string;
  hostUrl: string | null;
  password: string | null;
  scheduledStart: string;
  scheduledEnd: string | null;
  duration: number | null;
  status: "SCHEDULED" | "IN_PROGRESS" | "ENDED" | "CANCELLED";
  enableRecording: boolean;
  session: {
    id: string;
    formation: {
      id: string;
      titre: string;
    };
  } | null;
  integration: {
    id: string;
    provider: string;
    accountEmail: string | null;
  };
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
  participants: Array<{
    id: string;
    email: string;
    name: string | null;
    attended: boolean;
  }>;
  recordings: Array<{
    id: string;
    title: string;
    duration: number | null;
    hasTranscription: boolean;
  }>;
}

interface Stats {
  scheduled: number;
  inProgress: number;
  ended: number;
  total: number;
}

// Provider icons
const providerIcons: Record<string, string> = {
  ZOOM: "/images/integrations/zoom.svg",
  GOOGLE_MEET: "/images/integrations/google-meet.svg",
  MICROSOFT_TEAMS: "/images/integrations/teams.svg",
};

const providerNames: Record<string, string> = {
  ZOOM: "Zoom",
  GOOGLE_MEET: "Google Meet",
  MICROSOFT_TEAMS: "Microsoft Teams",
};

const providerColors: Record<string, string> = {
  ZOOM: "bg-blue-500",
  GOOGLE_MEET: "bg-green-500",
  MICROSOFT_TEAMS: "bg-purple-500",
};

export default function ClasseVirtuellePage() {
  const [meetings, setMeetings] = useState<VideoMeeting[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [stats, setStats] = useState<Stats>({ scheduled: 0, inProgress: 0, ended: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState<VideoMeeting | null>(null);
  const [filter, setFilter] = useState<"all" | "SCHEDULED" | "IN_PROGRESS" | "ENDED">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"meetings" | "recordings">("meetings");

  const fetchData = useCallback(async () => {
    try {
      // Récupérer les intégrations et les réunions en parallèle
      const [integrationsRes, meetingsRes] = await Promise.all([
        fetch("/api/video/integrations"),
        fetch("/api/video/meetings"),
      ]);

      if (integrationsRes.ok) {
        const data = await integrationsRes.json();
        setProviders(data.providers || []);
      }

      if (meetingsRes.ok) {
        const data = await meetingsRes.json();
        const meetingsList = data.meetings || [];
        setMeetings(meetingsList);

        // Calculer les stats
        const scheduled = meetingsList.filter((m: VideoMeeting) => m.status === "SCHEDULED").length;
        const inProgress = meetingsList.filter((m: VideoMeeting) => m.status === "IN_PROGRESS").length;
        const ended = meetingsList.filter((m: VideoMeeting) => m.status === "ENDED").length;
        setStats({
          scheduled,
          inProgress,
          ended,
          total: meetingsList.length,
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const copyJoinLink = async (meeting: VideoMeeting) => {
    await navigator.clipboard.writeText(meeting.joinUrl);
    setCopiedId(meeting.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteMeeting = async (id: string) => {
    if (!confirm("Supprimer cette réunion ?")) return;
    await fetch(`/api/video/meetings/${id}`, { method: "DELETE" });
    fetchData();
  };

  const updateMeetingStatus = async (id: string, status: string) => {
    await fetch(`/api/video/meetings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchData();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            En cours
          </span>
        );
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded-full">
            <Calendar size={12} />
            Programmée
          </span>
        );
      case "ENDED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-xs rounded-full">
            Terminée
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs rounded-full">
            Annulée
          </span>
        );
      default:
        return null;
    }
  };

  const getProviderBadge = (provider: string) => {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 ${providerColors[provider]} text-white text-xs rounded-full`}>
        {providerNames[provider]}
      </span>
    );
  };

  const filteredMeetings = filter === "all" ? meetings : meetings.filter(m => m.status === filter);
  const hasAnyIntegration = providers.some(p => p.connected);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Classe Virtuelle
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Créez et gérez vos sessions de visioconférence avec Zoom, Google Meet ou Teams
          </p>
        </div>
        {hasAnyIntegration ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            <Plus size={20} />
            Nouvelle salle
          </button>
        ) : (
          <Link
            href="/settings?tab=integrations"
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            <Settings size={20} />
            Connecter un compte
          </Link>
        )}
      </div>

      {/* Alerte si aucune intégration */}
      {!hasAnyIntegration && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-200">
                Connectez votre compte de visioconférence
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Pour créer des réunions, vous devez d&apos;abord connecter votre compte Zoom, Google Meet ou Microsoft Teams dans les paramètres.
              </p>
              <Link
                href="/settings?tab=integrations"
                className="inline-flex items-center gap-1 text-sm font-medium text-amber-800 dark:text-amber-200 hover:underline mt-2"
              >
                Accéder aux paramètres
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Providers connectés */}
      {hasAnyIntegration && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Comptes connectés :</span>
          <div className="flex gap-2">
            {providers.filter(p => p.connected).map(provider => (
              <div
                key={provider.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className={`w-6 h-6 ${providerColors[provider.id]} rounded flex items-center justify-center`}>
                  <Video size={14} className="text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {provider.integration?.accountEmail || provider.name}
                </span>
                <Check size={14} className="text-green-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("meetings")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "meetings"
              ? "border-brand-500 text-brand-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="flex items-center gap-2">
            <Video size={16} />
            Réunions
          </span>
        </button>
        <button
          onClick={() => setActiveTab("recordings")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "recordings"
              ? "border-brand-500 text-brand-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="flex items-center gap-2">
            <FileVideo size={16} />
            Enregistrements
          </span>
        </button>
      </div>

      {activeTab === "meetings" ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-50 dark:bg-brand-900/30 rounded-lg">
                  <Video className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <Play className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.inProgress}</p>
                  <p className="text-sm text-gray-500">En cours</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
                  <p className="text-sm text-gray-500">Programmées</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Check className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-600">{stats.ended}</p>
                  <p className="text-sm text-gray-500">Terminées</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {(["all", "IN_PROGRESS", "SCHEDULED", "ENDED"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {f === "all" ? "Toutes" : f === "IN_PROGRESS" ? "En cours" : f === "SCHEDULED" ? "Programmées" : "Terminées"}
              </button>
            ))}
          </div>

          {/* Meetings List */}
          {filteredMeetings.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <VideoOff className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucune réunion
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {hasAnyIntegration
                  ? "Créez votre première réunion pour démarrer une session de formation en ligne."
                  : "Connectez d'abord votre compte Zoom, Google Meet ou Teams."}
              </p>
              {hasAnyIntegration && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
                >
                  <Plus size={18} />
                  Créer une salle
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {meeting.title}
                        </h3>
                        {getStatusBadge(meeting.status)}
                        {getProviderBadge(meeting.provider)}
                      </div>
                      {meeting.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          {meeting.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(meeting.scheduledStart)}
                        </span>
                        {meeting.duration && (
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {meeting.duration} min
                          </span>
                        )}
                        {meeting.participants.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {meeting.participants.length} participant(s)
                          </span>
                        )}
                        {meeting.enableRecording && (
                          <span className="flex items-center gap-1 text-red-500">
                            <Disc size={14} />
                            Enregistrement
                          </span>
                        )}
                        {meeting.session && (
                          <Link
                            href={`/sessions/${meeting.session.id}`}
                            className="flex items-center gap-1 text-brand-500 hover:underline"
                          >
                            <LinkIcon size={14} />
                            {meeting.session.formation.titre}
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyJoinLink(meeting)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="Copier le lien"
                      >
                        {copiedId === meeting.id ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                      </button>
                      {meeting.status !== "ENDED" && meeting.status !== "CANCELLED" && (
                        <button
                          onClick={() => setShowJoinModal(meeting)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                        >
                          <Play size={16} />
                          {meeting.status === "IN_PROGRESS" ? "Rejoindre" : "Démarrer"}
                        </button>
                      )}
                      {meeting.status === "ENDED" && (
                        meeting.recordings.length > 0 ? (
                          <button
                            onClick={() => setShowJoinModal(meeting)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                          >
                            <FileVideo size={16} />
                            Enregistrement ({meeting.recordings.length})
                          </button>
                        ) : meeting.enableRecording ? (
                          <SyncRecordingsButton
                            meetingId={meeting.id}
                            onSync={fetchData}
                          />
                        ) : null
                      )}
                      <button
                        onClick={() => deleteMeeting(meeting.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <RecordingsTab />
      )}

      {/* Modal Créer une réunion */}
      {showCreateModal && (
        <CreateMeetingModal
          providers={providers.filter(p => p.connected)}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}

      {/* Modal Rejoindre */}
      {showJoinModal && (
        <JoinMeetingModal
          meeting={showJoinModal}
          onClose={() => setShowJoinModal(null)}
          onStatusChange={(status) => {
            updateMeetingStatus(showJoinModal.id, status);
            setShowJoinModal(null);
          }}
        />
      )}
    </div>
  );
}

// Onglet Enregistrements
function RecordingsTab() {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/video/recordings")
      .then(res => res.json())
      .then(data => {
        setRecordings(data.recordings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} Go`;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <FileVideo className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Aucun enregistrement
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Les enregistrements de vos réunions apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {recordings.map((recording) => (
        <div
          key={recording.id}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <FileVideo size={24} className="text-gray-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {recording.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <span>{formatDuration(recording.duration)}</span>
                <span>{formatSize(recording.fileSize)}</span>
                {recording.hasTranscription && (
                  <span className="text-brand-500">Transcription disponible</span>
                )}
              </div>
            </div>
            <a
              href={recording.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
            >
              <Play size={16} />
              Lire
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

// Modal de création
function CreateMeetingModal({
  providers,
  onClose,
  onCreated,
}: {
  providers: ProviderInfo[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    provider: providers[0]?.id || "ZOOM",
    scheduledStart: "",
    scheduledEnd: "",
    password: "",
    enableChat: true,
    enableScreenShare: true,
    enableRecording: false,
    maxParticipants: 50,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    // Calculer la durée en minutes si les deux dates sont renseignées
    let duration = 60;
    if (formData.scheduledStart && formData.scheduledEnd) {
      const start = new Date(formData.scheduledStart);
      const end = new Date(formData.scheduledEnd);
      duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    }

    try {
      const res = await fetch("/api/video/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          duration,
        }),
      });

      if (res.ok) {
        onCreated();
      } else {
        const data = await res.json();
        setError(data.error || "Une erreur est survenue");
      }
    } catch (err) {
      setError("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  };

  // Configuration couleurs des providers
  const providerStyles: Record<string, { bg: string; border: string; text: string }> = {
    ZOOM: { bg: "bg-[#0B5CFF]", border: "border-[#0B5CFF]", text: "text-[#0B5CFF]" },
    GOOGLE_MEET: { bg: "bg-[#1EA362]", border: "border-[#1EA362]", text: "text-[#1EA362]" },
    MICROSOFT_TEAMS: { bg: "bg-[#5558AF]", border: "border-[#5558AF]", text: "text-[#5558AF]" },
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Nouvelle salle virtuelle
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Sélection de la plateforme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Plateforme *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {providers.map((provider) => {
                const styles = providerStyles[provider.id];
                const isSelected = formData.provider === provider.id;
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, provider: provider.id })}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      isSelected
                        ? `${styles.border} ${styles.bg}/10 dark:${styles.bg}/20`
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className={`w-10 h-10 ${styles.bg} rounded-xl flex items-center justify-center`}>
                      <Video size={20} className="text-white" />
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? styles.text : "text-gray-600 dark:text-gray-400"}`}>
                      {provider.name}
                    </span>
                    {isSelected && (
                      <div className={`w-2 h-2 rounded-full ${styles.bg}`}></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre de la salle *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="Ex: Session Excel Avancé - Groupe A"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              rows={2}
              placeholder="Ajoutez une précision (optionnel)"
            />
          </div>

          {/* Dates début / fin */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date et heure de début *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.scheduledStart}
                onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date et heure de fin *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.scheduledEnd}
                onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Participants max + Mot de passe */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Participants max
              </label>
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                min={2}
                max={500}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mot de passe (optionnel)
              </label>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Sécuriser l'accès"
              />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Options
            </label>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableChat}
                  onChange={(e) => setFormData({ ...formData, enableChat: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Chat</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableScreenShare}
                  onChange={(e) => setFormData({ ...formData, enableScreenShare: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Partage d&apos;écran</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableRecording}
                  onChange={(e) => setFormData({ ...formData, enableRecording: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Enregistrement</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              {saving ? "Création..." : "Créer la salle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal pour rejoindre
function JoinMeetingModal({
  meeting,
  onClose,
  onStatusChange,
}: {
  meeting: VideoMeeting;
  onClose: () => void;
  onStatusChange: (status: string) => void;
}) {
  const [copiedJoin, setCopiedJoin] = useState(false);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(meeting.joinUrl);
    setCopiedJoin(true);
    setTimeout(() => setCopiedJoin(false), 2000);
  };

  const handleJoin = () => {
    // Mettre à jour le statut si nécessaire
    if (meeting.status === "SCHEDULED") {
      onStatusChange("IN_PROGRESS");
    }
    // Ouvrir le lien
    window.open(meeting.hostUrl || meeting.joinUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-xl w-full">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${providerColors[meeting.provider]} rounded-lg flex items-center justify-center`}>
              <Video size={20} className="text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {meeting.title}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Rejoindre */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Settings size={18} />
              Rejoindre en tant qu&apos;organisateur
            </h3>
            <button
              onClick={handleJoin}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
            >
              <ExternalLink size={18} />
              Ouvrir {providerNames[meeting.provider]}
            </button>
          </div>

          {/* Lien participant */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <LinkIcon size={18} />
              Lien pour les participants
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={meeting.joinUrl}
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400"
              />
              <button
                onClick={copyUrl}
                className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {copiedJoin ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Partagez ce lien avec vos apprenants pour qu&apos;ils rejoignent la session.
            </p>
          </div>

          {/* Infos */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Plateforme</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {providerNames[meeting.provider]}
              </span>
            </div>
            {meeting.password && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mot de passe</span>
                <span className="font-mono text-gray-900 dark:text-white">{meeting.password}</span>
              </div>
            )}
            {meeting.enableRecording && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Enregistrement</span>
                <span className="text-red-500 flex items-center gap-1">
                  <Disc size={12} />
                  Activé
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section Enregistrements */}
        {meeting.status === "ENDED" && (
          <div className="px-6 pb-4">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <FileVideo size={18} />
              Enregistrements
            </h3>
            {meeting.recordings.length > 0 ? (
              <div className="space-y-2">
                {meeting.recordings.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <FileVideo size={18} className="text-purple-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {rec.title}
                        </p>
                        {rec.duration && (
                          <p className="text-xs text-gray-500">
                            {Math.floor(rec.duration / 60)}:{(rec.duration % 60).toString().padStart(2, "0")}
                          </p>
                        )}
                      </div>
                    </div>
                    <a
                      href={`/api/video/recordings/${rec.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
                    >
                      <Play size={14} />
                      Lire
                    </a>
                  </div>
                ))}
              </div>
            ) : meeting.enableRecording ? (
              <div className="text-center py-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  L&apos;enregistrement n&apos;est pas encore disponible
                </p>
                <SyncRecordingsButton meetingId={meeting.id} onSync={() => {}} />
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                L&apos;enregistrement n&apos;était pas activé pour cette réunion
              </p>
            )}
          </div>
        )}

        <div className="p-4 border-t dark:border-gray-700 flex justify-between">
          <button
            onClick={() => {
              if (meeting.status === "IN_PROGRESS") {
                onStatusChange("ENDED");
              }
            }}
            className={`px-4 py-2 rounded-lg ${
              meeting.status === "IN_PROGRESS"
                ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                : "text-gray-400 cursor-not-allowed"
            }`}
            disabled={meeting.status !== "IN_PROGRESS"}
          >
            Terminer la réunion
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// Bouton de synchronisation des enregistrements
function SyncRecordingsButton({
  meetingId,
  onSync,
}: {
  meetingId: string;
  onSync: () => void;
}) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);

    try {
      const res = await fetch("/api/video/recordings/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        onSync();
      } else {
        setMessage(data.error || "Erreur lors de la synchronisation");
      }
    } catch {
      setMessage("Erreur de connexion");
    } finally {
      setSyncing(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
      >
        <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
        {syncing ? "Synchronisation..." : "Récupérer l'enregistrement"}
      </button>
      {message && (
        <span className="text-xs text-gray-500">{message}</span>
      )}
    </div>
  );
}
