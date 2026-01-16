"use client";

// ===========================================
// CORRECTION 431: Page "Messages apprenants" pour l'intervenant
// ===========================================
// Permet à l'intervenant d'envoyer des messages aux apprenants de sa session

import React, { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRequireIntervenantAuth, useIntervenantPortal } from "@/context/IntervenantPortalContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Users,
  User,
  Check,
  CheckCheck,
  Clock,
  Paperclip,
  X,
  Loader2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  File,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Inbox,
  Plus,
  Reply,
  MessageCircle,
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

interface Apprenant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

interface ReponseMessage {
  id: string;
  contenu: string;
  attachments: Attachment[];
  createdAt: string;
  typeAuteur: string; // "apprenant" ou "intervenant"
  isReadByIntervenant: boolean;
  isReadByApprenant: boolean;
  // Auteur si c'est un apprenant
  apprenant: {
    id: string;
    nom: string;
    prenom: string;
  } | null;
  // Auteur si c'est l'intervenant
  intervenant: {
    id: string;
    nom: string;
    prenom: string;
  } | null;
  // Destinataire si réponse de l'intervenant
  destinataireApprenant: {
    id: string;
    nom: string;
    prenom: string;
  } | null;
}

interface MessageEnvoye {
  id: string;
  sujet: string | null;
  contenu: string;
  attachments: Attachment[];
  envoyeATous: boolean;
  destinatairesIds: string[];
  createdAt: string;
  nombreDestinataires: number;
  nombreLectures: number;
  lectures: Array<{
    apprenantId: string;
    readAt: string;
  }>;
  // Réponses (apprenants ET intervenant)
  reponses: ReponseMessage[];
  nombreReponsesNonLues: number;
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
// COMPOSANT CARTE MESSAGE ENVOYÉ
// =====================================

function MessageCard({
  message,
  apprenants,
  token,
  onReponseLue,
}: {
  message: MessageEnvoye;
  apprenants: Apprenant[];
  token: string;
  onReponseLue: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  // État pour le formulaire de réponse
  const [replyingTo, setReplyingTo] = useState<{ apprenantId: string; apprenantNom: string } | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Calculer le statut de lecture
  const lecturesCount = message.nombreLectures;
  const totalDestinataires = message.nombreDestinataires;
  const allRead = lecturesCount >= totalDestinataires;
  const hasUnreadReplies = message.nombreReponsesNonLues > 0;

  // Envoyer une réponse à un apprenant
  const handleSendReply = async () => {
    if (!replyingTo || !replyContent.trim()) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/intervenant/messages/reponse?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: message.id,
          destinataireApprenantId: replyingTo.apprenantId,
          contenu: replyContent.trim(),
        }),
      });

      if (res.ok) {
        setReplyingTo(null);
        setReplyContent("");
        onReponseLue(); // Rafraîchir les messages
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de l'envoi");
      }
    } catch (err) {
      console.error("Erreur envoi réponse:", err);
      alert("Erreur lors de l'envoi de la réponse");
    } finally {
      setSendingReply(false);
    }
  };

  // Marquer toutes les réponses comme lues
  const markAllRepliesAsRead = async () => {
    if (message.nombreReponsesNonLues === 0) return;

    setMarkingAsRead(true);
    try {
      const res = await fetch(`/api/intervenant/messages?token=${encodeURIComponent(token)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: message.id }),
      });
      if (res.ok) {
        onReponseLue();
      }
    } catch (err) {
      console.error("Erreur marquage comme lu:", err);
    } finally {
      setMarkingAsRead(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header du message */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-start gap-3 text-left"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
          <Send className="w-5 h-5 text-white" />
        </div>

        {/* Contenu header */}
        <div className="flex-1 min-w-0">
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
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {message.envoyeATous ? "Tous les apprenants" : `${totalDestinataires} apprenant${totalDestinataires > 1 ? "s" : ""}`}
            </span>
            {message.attachments.length > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5" />
                {message.attachments.length}
              </span>
            )}
            <span className={`flex items-center gap-1 ${allRead ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
              {allRead ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              {lecturesCount}/{totalDestinataires} lu{lecturesCount > 1 ? "s" : ""}
            </span>
            {message.reponses.length > 0 && (
              <span className={`flex items-center gap-1 ${hasUnreadReplies ? "text-orange-600 dark:text-orange-400 font-medium" : "text-gray-500"}`}>
                <Reply className="w-3.5 h-3.5" />
                {message.reponses.length} réponse{message.reponses.length > 1 ? "s" : ""}
                {hasUnreadReplies && (
                  <span className="ml-1 px-1.5 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 text-[10px] font-bold rounded-full">
                    {message.nombreReponsesNonLues} new
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Badge réponses non lues */}
        {hasUnreadReplies && (
          <div className="flex-shrink-0 mr-2">
            <span className="flex items-center justify-center w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full">
              {message.nombreReponsesNonLues}
            </span>
          </div>
        )}

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
                          <FileIcon className="w-4 h-4 text-emerald-500" />
                          <span className="text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                            {att.name}
                          </span>
                          {att.size && (
                            <span className="text-xs text-gray-500">
                              ({formatFileSize(att.size)})
                            </span>
                          )}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Conversation (réponses des apprenants ET de l'intervenant) */}
              {message.reponses.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Conversation ({message.reponses.length} message{message.reponses.length > 1 ? "s" : ""})
                    </p>
                    {hasUnreadReplies && (
                      <button
                        onClick={markAllRepliesAsRead}
                        disabled={markingAsRead}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded transition-colors"
                      >
                        {markingAsRead ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {message.reponses.map((reponse) => {
                      const isFromIntervenant = reponse.typeAuteur === "intervenant";
                      const isUnread = !isFromIntervenant && !reponse.isReadByIntervenant;

                      return (
                        <div
                          key={reponse.id}
                          className={`p-3 rounded-lg border-l-4 ${
                            isFromIntervenant
                              ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-400 dark:border-emerald-500 ml-6"
                              : isUnread
                                ? "bg-orange-50 dark:bg-orange-500/10 border-orange-400 dark:border-orange-500"
                                : "bg-gray-50 dark:bg-gray-700/30 border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isFromIntervenant
                                ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                                : "bg-gradient-to-br from-blue-400 to-blue-600"
                            }`}>
                              {isFromIntervenant ? (
                                <Send className="w-4 h-4 text-white" />
                              ) : (
                                <User className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {isFromIntervenant ? (
                                      <>Vous</>
                                    ) : (
                                      <>{reponse.apprenant?.prenom} {reponse.apprenant?.nom}</>
                                    )}
                                  </p>
                                  {isFromIntervenant && reponse.destinataireApprenant && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      → {reponse.destinataireApprenant.prenom} {reponse.destinataireApprenant.nom}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {isUnread && (
                                    <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 text-[10px] font-bold rounded">
                                      Nouveau
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(reponse.createdAt)}
                                  </span>
                                </div>
                              </div>
                              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {reponse.contenu}
                              </p>
                              {reponse.attachments.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {reponse.attachments.map((att, idx) => {
                                    const FileIcon = getFileIcon(att.type);
                                    return (
                                      <a
                                        key={idx}
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded text-xs transition-colors"
                                      >
                                        <FileIcon className="w-3 h-3 text-emerald-500" />
                                        <span className="text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                                          {att.name}
                                        </span>
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                              {/* Bouton répondre (seulement pour les messages des apprenants) */}
                              {!isFromIntervenant && reponse.apprenant && (
                                <button
                                  onClick={() => setReplyingTo({
                                    apprenantId: reponse.apprenant!.id,
                                    apprenantNom: `${reponse.apprenant!.prenom} ${reponse.apprenant!.nom}`,
                                  })}
                                  className="mt-2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                                >
                                  <Reply className="w-3 h-3" />
                                  Répondre
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Formulaire de réponse */}
                  {replyingTo && (
                    <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-700">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          Répondre à {replyingTo.apprenantNom}
                        </p>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent("");
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Votre réponse..."
                        rows={3}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleSendReply}
                          disabled={sendingReply || !replyContent.trim()}
                          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          {sendingReply ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Envoyer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Détail des lectures */}
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Statut de lecture ({lecturesCount}/{totalDestinataires})
                </p>
                <div className="flex flex-wrap gap-2">
                  {apprenants
                    .filter(a => message.envoyeATous || message.destinatairesIds.includes(a.id))
                    .map((apprenant) => {
                      const lecture = message.lectures.find(l => l.apprenantId === apprenant.id);
                      return (
                        <div
                          key={apprenant.id}
                          className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs ${
                            lecture
                              ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {lecture ? (
                            <CheckCheck className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>
                            {apprenant.prenom} {apprenant.nom}
                          </span>
                        </div>
                      );
                    })}
                </div>
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

function IntervenantMessagesPageContent() {
  useRequireIntervenantAuth();
  const searchParams = useSearchParams();
  const { token, selectedSession, isLoading } = useIntervenantPortal();

  const [messages, setMessages] = useState<MessageEnvoye[]>([]);
  const [apprenants, setApprenants] = useState<Apprenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // État pour le formulaire
  const [showForm, setShowForm] = useState(false);
  const [sujet, setSujet] = useState("");
  const [contenu, setContenu] = useState("");
  const [selectedApprenants, setSelectedApprenants] = useState<string[]>([]);
  const [envoyerATous, setEnvoyerATous] = useState(true);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Correction 503: Gérer le paramètre apprenantId pour pré-sélectionner un apprenant
  const [initialApprenantId, setInitialApprenantId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Correction 503: Récupérer l'apprenantId depuis l'URL au chargement
  useEffect(() => {
    const apprenantIdParam = searchParams.get("apprenantId");
    if (apprenantIdParam) {
      setInitialApprenantId(apprenantIdParam);
    }
  }, [searchParams]);

  // Correction 503: Ouvrir le formulaire et pré-sélectionner l'apprenant quand les données sont chargées
  useEffect(() => {
    if (initialApprenantId && apprenants.length > 0 && !loading) {
      // Vérifier que l'apprenant existe dans la liste
      const apprenantExists = apprenants.some(a => a.id === initialApprenantId);
      if (apprenantExists) {
        setShowForm(true);
        setEnvoyerATous(false);
        setSelectedApprenants([initialApprenantId]);
        // Réinitialiser pour ne pas rouvrir si on ferme le formulaire
        setInitialApprenantId(null);
      }
    }
  }, [initialApprenantId, apprenants, loading]);

  // Récupérer les messages
  const fetchMessages = useCallback(async () => {
    if (!token || !selectedSession) return;

    try {
      setError(null);
      const res = await fetch(
        `/api/intervenant/messages?token=${encodeURIComponent(token)}&sessionId=${selectedSession.id}`
      );
      if (!res.ok) {
        throw new Error("Erreur lors du chargement des messages");
      }

      const data = await res.json();
      setMessages(data.messages || []);
      setApprenants(data.apprenants || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, selectedSession]);

  useEffect(() => {
    if (selectedSession) {
      setLoading(true);
      fetchMessages();
    }
  }, [fetchMessages, selectedSession]);

  // Envoyer un message
  const handleSendMessage = async () => {
    if (!token || !selectedSession || !contenu.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/intervenant/messages?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          sujet: sujet.trim() || null,
          contenu: contenu.trim(),
          attachments,
          destinatairesIds: envoyerATous ? null : selectedApprenants,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      const data = await res.json();
      // Ajouter le nouveau message en haut de la liste
      setMessages((prev) => [data.message, ...prev]);

      // Réinitialiser le formulaire
      setShowForm(false);
      setSujet("");
      setContenu("");
      setSelectedApprenants([]);
      setEnvoyerATous(true);
      setAttachments([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSending(false);
    }
  };

  // Upload de fichier
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    try {
      for (const file of Array.from(files)) {
        // Créer un FormData pour l'upload
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              url: data.url,
              size: file.size,
              type: file.type,
            },
          ]);
        }
      }
    } catch (err) {
      console.error("Erreur upload:", err);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Supprimer une pièce jointe
  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Sélection des apprenants
  const toggleApprenant = (id: string) => {
    setSelectedApprenants((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  // Rafraîchir
  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!selectedSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Aucune session sélectionnée
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Veuillez sélectionner une session pour envoyer des messages aux apprenants.
        </p>
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
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
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
            <MessageSquare className="w-6 h-6 text-emerald-500" />
            Messages apprenants
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Envoyez des messages et documents à vos apprenants - {selectedSession.formation.titre}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau message
          </button>
        </div>
      </div>

      {/* Formulaire d'envoi */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-lg overflow-hidden">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <h2 className="font-semibold text-emerald-900 dark:text-emerald-100">
                  Nouveau message
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Destinataires */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Destinataires
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={envoyerATous}
                        onChange={(e) => setEnvoyerATous(e.target.checked)}
                        className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Envoyer à tous les apprenants ({apprenants.length})
                      </span>
                    </label>

                    {!envoyerATous && (
                      <div className="pl-6 flex flex-wrap gap-2">
                        {apprenants.map((apprenant) => (
                          <button
                            key={apprenant.id}
                            onClick={() => toggleApprenant(apprenant.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                              selectedApprenants.includes(apprenant.id)
                                ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-600"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent"
                            }`}
                          >
                            {selectedApprenants.includes(apprenant.id) && (
                              <Check className="w-3 h-3" />
                            )}
                            {apprenant.prenom} {apprenant.nom}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sujet (optionnel) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sujet (optionnel)
                  </label>
                  <input
                    type="text"
                    value={sujet}
                    onChange={(e) => setSujet(e.target.value)}
                    placeholder="Ex: Ressources pour le module 3"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={contenu}
                    onChange={(e) => setContenu(e.target.value)}
                    placeholder="Écrivez votre message ici..."
                    rows={5}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                  />
                </div>

                {/* Pièces jointes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pièces jointes
                  </label>

                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {attachments.map((att, idx) => {
                        const FileIcon = getFileIcon(att.type);
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm"
                          >
                            <FileIcon className="w-4 h-4 text-emerald-500" />
                            <span className="text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                              {att.name}
                            </span>
                            {att.size && (
                              <span className="text-xs text-gray-500">
                                ({formatFileSize(att.size)})
                              </span>
                            )}
                            <button
                              onClick={() => handleRemoveAttachment(idx)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 transition-colors"
                  >
                    {uploadingFile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <Paperclip className="w-4 h-4" />
                        Ajouter un fichier
                      </>
                    )}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowForm(false)}
                    disabled={sending}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !contenu.trim() || (!envoyerATous && selectedApprenants.length === 0)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Envoyer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info apprenants */}
      {apprenants.length > 0 && !showForm && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-emerald-700 dark:text-emerald-300">
              {apprenants.length} apprenant{apprenants.length > 1 ? "s" : ""} dans cette session
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Les messages envoyés seront notifiés par email et visibles dans leur espace apprenant
            </p>
          </div>
        </div>
      )}

      {/* Liste des messages envoyés */}
      {messages.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Messages envoyés ({messages.length})
          </h2>
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              apprenants={apprenants}
              token={token || ""}
              onReponseLue={fetchMessages}
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
            Aucun message envoyé
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            Vous n&apos;avez pas encore envoyé de message pour cette session.
            Partagez des ressources, des consignes ou des informations avec vos apprenants.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Envoyer mon premier message
          </button>
        </motion.div>
      )}
    </div>
  );
}

// Wrapper avec Suspense pour useSearchParams
export default function IntervenantMessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    }>
      <IntervenantMessagesPageContent />
    </Suspense>
  );
}
