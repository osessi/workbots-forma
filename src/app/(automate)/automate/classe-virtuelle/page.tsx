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
  Mic,
  Monitor,
  MessageSquare,
  X,
  Link as LinkIcon,
} from "lucide-react";

interface VirtualRoom {
  id: string;
  titre: string;
  description: string | null;
  roomId: string;
  password: string | null;
  dateDebut: string;
  dateFin: string | null;
  dureeMinutes: number;
  status: "SCHEDULED" | "ACTIVE" | "ENDED";
  hosteNom: string | null;
  hosteEmail: string | null;
  maxParticipants: number;
  enregistrement: boolean;
  chatActif: boolean;
  ecranPartageActif: boolean;
  nombreParticipants: number | null;
}

interface Stats {
  scheduled: number;
  active: number;
  ended: number;
  total: number;
}

export default function ClasseVirtuellePage() {
  const [rooms, setRooms] = useState<VirtualRoom[]>([]);
  const [stats, setStats] = useState<Stats>({ scheduled: 0, active: 0, ended: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState<VirtualRoom | null>(null);
  const [filter, setFilter] = useState<"all" | "SCHEDULED" | "ACTIVE" | "ENDED">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch("/api/virtual-rooms");
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const copyInviteLink = async (room: VirtualRoom) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/join/${room.roomId}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(room.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startRoom = async (room: VirtualRoom) => {
    // Mettre à jour le statut à ACTIVE
    await fetch("/api/virtual-rooms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: room.id, status: "ACTIVE" }),
    });
    setShowJoinModal(room);
    fetchRooms();
  };

  const deleteRoom = async (id: string) => {
    if (!confirm("Supprimer cette salle virtuelle ?")) return;
    await fetch(`/api/virtual-rooms?id=${id}`, { method: "DELETE" });
    fetchRooms();
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
      case "ACTIVE":
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
      default:
        return null;
    }
  };

  const filteredRooms = filter === "all" ? rooms : rooms.filter(r => r.status === filter);

  // URL MiroTalk SFU (version gratuite hébergée)
  const getMiroTalkUrl = (room: VirtualRoom, isHost: boolean = false) => {
    // MiroTalk SFU public instance
    const baseUrl = "https://sfu.mirotalk.com/join";
    const params = new URLSearchParams({
      room: room.roomId,
      name: isHost ? (room.hosteNom || "Formateur") : "Participant",
      audio: "true",
      video: "true",
      screen: room.ecranPartageActif ? "true" : "false",
      notify: "false",
    });
    if (room.password) {
      params.set("password", room.password);
    }
    return `${baseUrl}?${params.toString()}`;
  };

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
            Créez et gérez vos sessions de visioconférence
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          <Plus size={20} />
          Nouvelle salle
        </button>
      </div>

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
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
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
        {(["all", "ACTIVE", "SCHEDULED", "ENDED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {f === "all" ? "Toutes" : f === "ACTIVE" ? "En cours" : f === "SCHEDULED" ? "Programmées" : "Terminées"}
          </button>
        ))}
      </div>

      {/* Rooms List */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Video className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune salle virtuelle
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Créez votre première salle pour démarrer une session de formation en ligne.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
          >
            <Plus size={18} />
            Créer une salle
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {room.titre}
                    </h3>
                    {getStatusBadge(room.status)}
                  </div>
                  {room.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {room.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(room.dateDebut)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {room.dureeMinutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      Max {room.maxParticipants}
                    </span>
                    {room.chatActif && (
                      <span className="flex items-center gap-1">
                        <MessageSquare size={14} />
                        Chat
                      </span>
                    )}
                    {room.ecranPartageActif && (
                      <span className="flex items-center gap-1">
                        <Monitor size={14} />
                        Partage
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyInviteLink(room)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Copier le lien d'invitation"
                  >
                    {copiedId === room.id ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                  {room.status !== "ENDED" && (
                    <button
                      onClick={() => startRoom(room)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                      <Play size={16} />
                      {room.status === "ACTIVE" ? "Rejoindre" : "Démarrer"}
                    </button>
                  )}
                  <button
                    onClick={() => deleteRoom(room.id)}
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

      {/* Modal Créer une salle */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchRooms();
          }}
        />
      )}

      {/* Modal Rejoindre */}
      {showJoinModal && (
        <JoinRoomModal
          room={showJoinModal}
          getMiroTalkUrl={getMiroTalkUrl}
          onClose={() => setShowJoinModal(null)}
        />
      )}
    </div>
  );
}

// Modal de création
function CreateRoomModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    dateDebut: "",
    dureeMinutes: 60,
    maxParticipants: 50,
    password: "",
    chatActif: true,
    ecranPartageActif: true,
    enregistrement: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/virtual-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onCreated();
      }
    } finally {
      setSaving(false);
    }
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre de la salle *
            </label>
            <input
              type="text"
              required
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Ex: Session Excel Avancé - Groupe A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={2}
              placeholder="Description optionnelle..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date et heure *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.dateDebut}
                onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Durée (minutes)
              </label>
              <input
                type="number"
                value={formData.dureeMinutes}
                onChange={(e) => setFormData({ ...formData, dureeMinutes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min={15}
                max={480}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Participants max
              </label>
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min={2}
                max={100}
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
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Sécuriser l'accès"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Options
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.chatActif}
                  onChange={(e) => setFormData({ ...formData, chatActif: e.target.checked })}
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <MessageSquare size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Chat</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ecranPartageActif}
                  onChange={(e) => setFormData({ ...formData, ecranPartageActif: e.target.checked })}
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <Monitor size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Partage d&apos;écran</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enregistrement}
                  onChange={(e) => setFormData({ ...formData, enregistrement: e.target.checked })}
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <Video size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Enregistrement</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50"
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
function JoinRoomModal({
  room,
  getMiroTalkUrl,
  onClose,
}: {
  room: VirtualRoom;
  getMiroTalkUrl: (room: VirtualRoom, isHost?: boolean) => string;
  onClose: () => void;
}) {
  const hostUrl = getMiroTalkUrl(room, true);
  const participantUrl = getMiroTalkUrl(room, false);
  const [copiedHost, setCopiedHost] = useState(false);
  const [copiedParticipant, setCopiedParticipant] = useState(false);

  const copyUrl = async (url: string, isHost: boolean) => {
    await navigator.clipboard.writeText(url);
    if (isHost) {
      setCopiedHost(true);
      setTimeout(() => setCopiedHost(false), 2000);
    } else {
      setCopiedParticipant(true);
      setTimeout(() => setCopiedParticipant(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-xl w-full">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {room.titre}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Rejoindre en tant qu'hôte */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Settings size={18} />
              Rejoindre en tant que formateur
            </h3>
            <div className="flex gap-2">
              <a
                href={hostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
              >
                <ExternalLink size={18} />
                Ouvrir la salle
              </a>
              <button
                onClick={() => copyUrl(hostUrl, true)}
                className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {copiedHost ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
            </div>
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
                value={participantUrl}
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400"
              />
              <button
                onClick={() => copyUrl(participantUrl, false)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {copiedParticipant ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Partagez ce lien avec vos apprenants pour qu&apos;ils rejoignent la session.
            </p>
          </div>

          {/* Infos de la salle */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ID de la salle</span>
              <span className="font-mono text-gray-900 dark:text-white">{room.roomId}</span>
            </div>
            {room.password && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mot de passe</span>
                <span className="font-mono text-gray-900 dark:text-white">{room.password}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Participants max</span>
              <span className="text-gray-900 dark:text-white">{room.maxParticipants}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
