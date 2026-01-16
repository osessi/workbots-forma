"use client";

// ===========================================
// CORRECTION 431: Page "Suivi pédagogique" avec réponses
// ===========================================
// Affiche les messages envoyés par l'intervenant pour la session sélectionnée
// Permet à l'apprenant de répondre aux messages

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
  Send,
  Reply,
  X,
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

interface ReponseMessage {
  id: string;
  contenu: string;
  attachments: Attachment[];
  createdAt: string;
  typeAuteur: string;
  isReadByApprenant: boolean;
  apprenant: {
    id: string;
    nom: string;
    prenom: string;
  } | null;
  intervenant: {
    id: string;
    nom: string;
    prenom: string;
  } | null;
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
  // Conversation (réponses)
  reponses?: ReponseMessage[];
  nombreReponsesNonLues?: number;
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
  onReply,
}: {
  message: MessageIntervenant;
  onMarkAsRead: (messageId: string) => void;
  onReply: (message: MessageIntervenant) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(!message.isRead || (message.nombreReponsesNonLues || 0) > 0);

  // Nombre de réponses non lues de l'intervenant
  const unreadRepliesCount = message.nombreReponsesNonLues || 0;

  const handleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    // Marquer comme lu si on ouvre le message (marque aussi les réponses comme lues côté API)
    if (newExpanded && (!message.isRead || unreadRepliesCount > 0)) {
      onMarkAsRead(message.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-xl border transition-all ${
        message.isRead && unreadRepliesCount === 0
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
            {unreadRepliesCount > 0 && (
              <span className="px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-medium rounded">
                {unreadRepliesCount} nouvelle{unreadRepliesCount > 1 ? "s" : ""} réponse{unreadRepliesCount > 1 ? "s" : ""}
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
            {message.reponses && message.reponses.length > 0 && (
              <span className="flex items-center gap-1 text-brand-600 dark:text-brand-400">
                <MessageSquare className="w-3.5 h-3.5" />
                {message.reponses.length} réponse{message.reponses.length > 1 ? "s" : ""}
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
              {/* Message original de l'intervenant */}
              <div className="mt-4 p-4 bg-brand-50 dark:bg-brand-900/20 rounded-lg border-l-4 border-brand-500">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
                    {message.intervenant.prenom} {message.intervenant.nom}
                  </span>
                  <span className="text-xs text-brand-500 dark:text-brand-400">
                    {formatDate(message.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                  {message.contenu}
                </p>
              </div>

              {/* Pièces jointes du message original */}
              {message.attachments.length > 0 && (
                <div className="mt-3 ml-4">
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

              {/* Fil de conversation (réponses) */}
              {message.reponses && message.reponses.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <MessageSquare className="w-4 h-4" />
                    <span>Conversation ({message.reponses.length})</span>
                  </div>

                  {message.reponses.map((reponse) => {
                    const isFromIntervenant = reponse.typeAuteur === "intervenant";
                    const isUnread = isFromIntervenant && !reponse.isReadByApprenant;

                    return (
                      <motion.div
                        key={reponse.id}
                        initial={{ opacity: 0, x: isFromIntervenant ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3 rounded-lg ${
                          isFromIntervenant
                            ? `bg-brand-50 dark:bg-brand-900/20 border-l-4 border-brand-500 ${isUnread ? "ring-2 ring-brand-300 dark:ring-brand-500" : ""}`
                            : "bg-gray-100 dark:bg-gray-700 border-l-4 border-gray-400 ml-4"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            isFromIntervenant
                              ? "bg-gradient-to-br from-brand-500 to-brand-600"
                              : "bg-gray-500"
                          }`}>
                            <User className="w-2.5 h-2.5 text-white" />
                          </div>
                          <span className={`text-xs font-medium ${
                            isFromIntervenant
                              ? "text-brand-700 dark:text-brand-300"
                              : "text-gray-600 dark:text-gray-400"
                          }`}>
                            {isFromIntervenant
                              ? `${reponse.intervenant?.prenom || ""} ${reponse.intervenant?.nom || ""}`
                              : "Vous"
                            }
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(reponse.createdAt)}
                          </span>
                          {isUnread && (
                            <span className="px-1.5 py-0.5 bg-brand-500 text-white text-[9px] font-medium rounded">
                              Nouveau
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap pl-7">
                          {reponse.contenu}
                        </p>

                        {/* Pièces jointes de la réponse */}
                        {reponse.attachments && reponse.attachments.length > 0 && (
                          <div className="mt-2 pl-7 flex flex-wrap gap-2">
                            {reponse.attachments.map((att, idx) => {
                              const FileIcon = getFileIcon(att.type);
                              return (
                                <a
                                  key={idx}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 rounded text-xs transition-colors"
                                >
                                  <FileIcon className="w-3 h-3 text-brand-500" />
                                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                                    {att.name}
                                  </span>
                                  <Download className="w-3 h-3 text-gray-400" />
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
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

              {/* Bouton Répondre */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReply(message);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Reply className="w-4 h-4" />
                  Répondre
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =====================================
// MODAL RÉPONSE
// =====================================

function ReplyModal({
  message,
  token,
  onClose,
  onSuccess,
}: {
  message: MessageIntervenant;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [contenu, setContenu] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contenu.trim()) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/apprenant/messages-intervenant/reponse?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: message.id,
          contenu: contenu.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
              <Reply className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Répondre à {message.intervenant.prenom} {message.intervenant.nom}
              </h3>
              {message.sujet && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[250px]">
                  Re: {message.sujet}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message original (aperçu) */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Message original :</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
            {message.contenu}
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Votre réponse
            </label>
            <textarea
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              placeholder="Écrivez votre réponse..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!contenu.trim() || sending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Envoyer
            </button>
          </div>
        </form>
      </motion.div>
    </div>
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
  const [replyingTo, setReplyingTo] = useState<MessageIntervenant | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Marquer un message comme lu (+ marquer les réponses de l'intervenant comme lues)
  const handleMarkAsRead = async (messageId: string) => {
    if (!token) return;

    // Trouver le message pour calculer les compteurs
    const messageToMark = messages.find((m) => m.id === messageId);
    const wasUnread = messageToMark && !messageToMark.isRead;
    const unreadRepliesCount = messageToMark?.nombreReponsesNonLues || 0;

    try {
      await fetch(`/api/apprenant/messages-intervenant?token=${encodeURIComponent(token)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });

      // Mettre à jour localement: marquer message comme lu + toutes les réponses de l'intervenant
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                isRead: true,
                readAt: new Date().toISOString(),
                nombreReponsesNonLues: 0,
                // Marquer toutes les réponses de l'intervenant comme lues
                reponses: m.reponses?.map((r) =>
                  r.typeAuteur === "intervenant"
                    ? { ...r, isReadByApprenant: true }
                    : r
                ),
              }
            : m
        )
      );

      // Décrémenter le compteur uniquement si le message était non lu
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Mettre à jour le compteur global
        if (dashboardStats && setDashboardStats) {
          setDashboardStats({
            ...dashboardStats,
            messagesIntervenantNonLus: Math.max(0, (dashboardStats.messagesIntervenantNonLus || 0) - 1),
          });
        }
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

  // Succès envoi réponse
  const handleReplySuccess = () => {
    setSuccessMessage("Votre réponse a été envoyée avec succès !");
    setTimeout(() => setSuccessMessage(null), 5000);
    // Rafraîchir les messages pour afficher la nouvelle réponse
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

      {/* Message de succès */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-white" />
            </div>
            <p className="text-green-700 dark:text-green-300">{successMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

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
              onReply={(msg) => setReplyingTo(msg)}
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

      {/* Modal de réponse */}
      <AnimatePresence>
        {replyingTo && token && (
          <ReplyModal
            message={replyingTo}
            token={token}
            onClose={() => setReplyingTo(null)}
            onSuccess={handleReplySuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
