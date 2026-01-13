"use client";

// ===========================================
// CORRECTION 431: Page "Suivi pédagogique" → "Messages de l'intervenant"
// ===========================================
// Affiche les messages envoyés par l'intervenant pour la session sélectionnée

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import {
  MessageSquare,
  Clock,
  User,
  Loader2,
  AlertCircle,
  Paperclip,
  FileText,
  Image as ImageIcon,
  File,
  Download,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Inbox,
} from "lucide-react";

// =====================================
// TYPES
// =====================================

interface Attachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

interface MessageIntervenant {
  id: string;
  sujet: string | null;
  contenu: string;
  attachments: Attachment[];
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
  intervenant: {
    id: string;
    nom: string;
    prenom: string;
    photoUrl: string | null;
  };
  session: {
    id: string;
    reference: string;
    nom: string | null;
    formationTitre: string;
  };
}

// =====================================
// HELPERS
// =====================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Aujourd'hui à ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays === 1) {
    return `Hier à ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays < 7) {
    return date.toLocaleDateString("fr-FR", { weekday: "long", hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getFileIcon(type?: string) {
  if (!type) return File;
  if (type.startsWith("image/")) return ImageIcon;
  if (type.includes("pdf") || type.includes("word") || type.includes("document")) return FileText;
  return File;
}

// =====================================
// COMPOSANT CARTE MESSAGE
// =====================================

function MessageCard({
  message,
  onMarkAsRead,
}: {
  message: MessageIntervenant;
  onMarkAsRead: (messageId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(!message.isRead);

  const handleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    // Marquer comme lu si on ouvre le message
    if (newExpanded && !message.isRead) {
      onMarkAsRead(message.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-xl border transition-all ${
        message.isRead
          ? "border-gray-200 dark:border-gray-700"
          : "border-brand-300 dark:border-brand-500 shadow-md"
      }`}
    >
      {/* Header du message */}
      <button
        onClick={handleExpand}
        className="w-full p-4 flex items-start gap-3 text-left"
      >
        {/* Avatar intervenant */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0">
          {message.intervenant.photoUrl ? (
            <img
              src={message.intervenant.photoUrl}
              alt={`${message.intervenant.prenom} ${message.intervenant.nom}`}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Contenu header */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-white">
              {message.intervenant.prenom} {message.intervenant.nom}
            </span>
            {!message.isRead && (
              <span className="px-1.5 py-0.5 bg-brand-500 text-white text-[10px] font-medium rounded">
                Nouveau
              </span>
            )}
          </div>

          {message.sujet && (
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
              {message.sujet}
            </h3>
          )}

          <p className={`text-sm text-gray-600 dark:text-gray-400 ${isExpanded ? "" : "line-clamp-2"}`}>
            {message.contenu}
          </p>

          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(message.createdAt)}
            </span>
            {message.attachments.length > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5" />
                {message.attachments.length} fichier{message.attachments.length > 1 ? "s" : ""}
              </span>
            )}
            {message.isRead && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Check className="w-3.5 h-3.5" />
                Lu
              </span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Contenu expandé */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700">
              {/* Message complet */}
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                  {message.contenu}
                </p>
              </div>

              {/* Pièces jointes */}
              {message.attachments.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pièces jointes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {message.attachments.map((att, idx) => {
                      const FileIcon = getFileIcon(att.type);
                      return (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors"
                        >
                          <FileIcon className="w-4 h-4 text-brand-500" />
                          <span className="text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                            {att.name}
                          </span>
                          {att.size && (
                            <span className="text-xs text-gray-500">
                              ({formatFileSize(att.size)})
                            </span>
                          )}
                          <Download className="w-4 h-4 text-gray-400" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Session */}
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Formation : <span className="font-medium text-gray-700 dark:text-gray-300">{message.session.formationTitre}</span>
                  {message.session.reference && (
                    <> ({message.session.reference})</>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function SuiviPage() {
  const { token, selectedSession, dashboardStats, setDashboardStats } = useApprenantPortal();
  const [messages, setMessages] = useState<MessageIntervenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Récupérer les messages
  const fetchMessages = useCallback(async () => {
    if (!token) return;

    try {
      setError(null);
      const params = new URLSearchParams({ token });
      if (selectedSession?.sessionId) {
        params.append("sessionId", selectedSession.sessionId);
      }

      const res = await fetch(`/api/apprenant/messages-intervenant?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Erreur lors du chargement des messages");
      }

      const data = await res.json();
      setMessages(data.messages || []);
      setUnreadCount(data.unreadCount || 0);

      // Mettre à jour le compteur dans le context si fourni
      if (dashboardStats && setDashboardStats) {
        setDashboardStats({
          ...dashboardStats,
          messagesIntervenantNonLus: data.unreadCount || 0,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, selectedSession?.sessionId, dashboardStats, setDashboardStats]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Marquer un message comme lu
  const handleMarkAsRead = async (messageId: string) => {
    if (!token) return;

    try {
      await fetch(`/api/apprenant/messages-intervenant?token=${encodeURIComponent(token)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });

      // Mettre à jour localement
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isRead: true, readAt: new Date().toISOString() } : m
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Mettre à jour le compteur global
      if (dashboardStats && setDashboardStats) {
        setDashboardStats({
          ...dashboardStats,
          messagesIntervenantNonLus: Math.max(0, (dashboardStats.messagesIntervenantNonLus || 0) - 1),
        });
      }
    } catch (err) {
      console.error("Erreur marquage comme lu:", err);
    }
  };

  // Rafraîchir
  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 dark:text-white font-medium mb-2">{error}</p>
          <button
            onClick={handleRefresh}
            className="text-brand-600 hover:text-brand-700 text-sm font-medium"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-brand-500" />
            Suivi pédagogique
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Retrouvez ici les messages et documents partagés par votre intervenant
            {selectedSession && ` pour la session ${selectedSession.reference}`}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Compteur messages non lus */}
      {unreadCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-brand-700 dark:text-brand-300">
              {unreadCount} nouveau{unreadCount > 1 ? "x" : ""} message{unreadCount > 1 ? "s" : ""}
            </p>
            <p className="text-sm text-brand-600 dark:text-brand-400">
              Cliquez sur un message pour le consulter et le marquer comme lu
            </p>
          </div>
        </motion.div>
      )}

      {/* Liste des messages */}
      {messages.length > 0 ? (
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Aucun message pour le moment
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Votre intervenant n'a pas encore envoyé de message pour cette session.
            Les messages et documents partagés apparaîtront ici.
          </p>
        </motion.div>
      )}
    </div>
  );
}
