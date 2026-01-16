"use client";

// ===========================================
// CORRECTIONS 535-538: MESSAGERIE APPRENANT
// ===========================================
// 535: Séparer en 2 blocs (Organisme / Intervenant(s))
// 536: Bloc Organisme - démarrer ou reprendre la conversation
// 537: Bloc Intervenants - liste + bouton message
// 538: Support des pièces jointes

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import {
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  Building2,
  UserCircle,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  File,
  Download,
  RefreshCw,
  ChevronRight,
  User,
  PenSquare,
  ArrowLeft,
  Check,
  Mail,
  Clock,
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

interface MessageOrganisme {
  id: string;
  sujet: string;
  contenu: string;
  attachments: Attachment[];
  createdAt: string;
  isRead: boolean;
  typeAuteur: "apprenant" | "organisme";
}

interface Intervenant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  specialites?: string[];
  role: "formateur" | "coformateur";
}

interface MessageIntervenant {
  id: string;
  sujet: string;
  contenu: string;
  attachments: Attachment[];
  createdAt: string;
  isRead: boolean;
  intervenant: {
    id: string;
    nom: string;
    prenom: string;
  };
  nombreReponsesNonLues?: number;
  reponses?: Array<{
    id: string;
    contenu: string;
    attachments?: Attachment[];
    createdAt: string;
    typeAuteur: "apprenant" | "intervenant";
    isReadByApprenant?: boolean;
    apprenant?: { id: string; nom: string; prenom: string } | null;
    intervenant?: { id: string; nom: string; prenom: string } | null;
  }>;
}

// =====================================
// UTILITAIRES
// =====================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
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

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

// =====================================
// COMPOSANT FORMULAIRE MESSAGE (avec PJ)
// =====================================

function MessageForm({
  onSend,
  sending,
  token,
  placeholder = "Votre message...",
  showSubject = false,
  buttonText = "Envoyer",
}: {
  onSend: (data: { sujet?: string; contenu: string; attachments: Attachment[] }) => Promise<void>;
  sending: boolean;
  token: string;
  placeholder?: string;
  showSubject?: boolean;
  buttonText?: string;
}) {
  const [sujet, setSujet] = useState("");
  const [contenu, setContenu] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploadError(null);

    for (const file of Array.from(selectedFiles)) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setUploadError(`Type non autorisé: ${file.name}`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`Fichier trop volumineux: ${file.name} (max 10 Mo)`);
        continue;
      }

      setUploadingFile(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`/api/upload?token=${encodeURIComponent(token)}`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erreur upload");
        }

        const result = await res.json();
        if (result.url) {
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              url: result.url,
              size: file.size,
              type: file.type,
            },
          ]);
        }
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Erreur lors de l'upload");
      } finally {
        setUploadingFile(false);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contenu.trim() || sending) return;

    await onSend({
      sujet: showSubject ? sujet.trim() : undefined,
      contenu: contenu.trim(),
      attachments,
    });

    setSujet("");
    setContenu("");
    setAttachments([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {showSubject && (
        <input
          type="text"
          value={sujet}
          onChange={(e) => setSujet(e.target.value)}
          placeholder="Sujet (optionnel)"
          className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      )}

      <textarea
        value={contenu}
        onChange={(e) => setContenu(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
      />

      {/* Pièces jointes */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept={ALLOWED_MIME_TYPES.join(",")}
            multiple
            className="hidden"
            disabled={sending || uploadingFile}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || uploadingFile}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {uploadingFile ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
            <span>Ajouter un fichier</span>
          </button>
          <span className="text-xs text-gray-400">PDF, Word, Excel, Images (max 10 Mo)</span>
        </div>

        {uploadError && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {uploadError}
          </p>
        )}

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, idx) => {
              const FileIcon = getFileIcon(file.type);
              return (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30 rounded-lg text-sm"
                >
                  <FileIcon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{file.name}</span>
                  {file.size && (
                    <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!contenu.trim() || sending}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-medium transition-colors"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Envoi...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {buttonText}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// =====================================
// BLOC ORGANISME DE FORMATION
// =====================================

function BlocOrganisme({ token }: { token: string }) {
  const { organization, setDashboardStats, dashboardStats } = useApprenantPortal();
  const [messages, setMessages] = useState<MessageOrganisme[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/apprenant/messagerie/organisme?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);

        // Mettre à jour le compteur
        if (dashboardStats && setDashboardStats) {
          setDashboardStats({
            ...dashboardStats,
            messagesOrganismeNonLus: data.unreadCount || 0,
          });
        }
      }
    } catch (error) {
      console.error("Erreur chargement messages organisme:", error);
    } finally {
      setLoading(false);
    }
  }, [token, dashboardStats, setDashboardStats]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Scroll vers le bas quand on ouvre la conversation
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isOpen, messages.length]);

  // Marquer comme lu quand on ouvre
  const handleOpen = async () => {
    setIsOpen(true);

    // Marquer tous les messages de l'organisme comme lus
    const hasUnread = messages.some((m) => m.typeAuteur === "organisme" && !m.isRead);
    if (hasUnread) {
      try {
        await fetch(`/api/apprenant/messagerie/organisme?token=${encodeURIComponent(token)}`, {
          method: "PATCH",
        });

        // Mettre à jour localement
        setMessages((prev) =>
          prev.map((m) =>
            m.typeAuteur === "organisme" ? { ...m, isRead: true } : m
          )
        );
      } catch (err) {
        console.error("Erreur marquage lu:", err);
      }
    }
  };

  const handleSend = async (data: { sujet?: string; contenu: string; attachments: Attachment[] }) => {
    setSending(true);
    try {
      const res = await fetch(`/api/apprenant/messagerie/organisme?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.message) {
          setMessages((prev) => [...prev, result.message]);
        }
      }
    } catch (error) {
      console.error("Erreur envoi message:", error);
    } finally {
      setSending(false);
    }
  };

  const unreadCount = messages.filter((m) => m.typeAuteur === "organisme" && !m.isRead).length;
  const hasConversation = messages.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Organisme de formation
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {organization?.nomCommercial || organization?.name}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <span className="px-2.5 py-1 bg-brand-500 text-white text-xs font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Contenu */}
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div
            key="closed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
              </div>
            ) : (
              <button
                onClick={handleOpen}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  {hasConversation ? (
                    <>
                      <Mail className="w-5 h-5 text-brand-500" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Ouvrir la conversation ({messages.length} message{messages.length > 1 ? "s" : ""})
                      </span>
                    </>
                  ) : (
                    <>
                      <PenSquare className="w-5 h-5 text-brand-500" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Nouveau message
                      </span>
                    </>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="open"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Bouton retour */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
            </div>

            {/* Conversation */}
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  Aucun message. Commencez la conversation ci-dessous.
                </p>
              ) : (
                messages.map((msg) => {
                  const isFromMe = msg.typeAuteur === "apprenant";
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          isFromMe
                            ? "bg-brand-500 text-white rounded-tr-md"
                            : "bg-gray-100 dark:bg-gray-700 rounded-tl-md"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs font-medium ${
                              isFromMe
                                ? "text-brand-100"
                                : "text-gray-600 dark:text-gray-300"
                            }`}
                          >
                            {isFromMe ? "Vous" : organization?.nomCommercial || organization?.name}
                          </span>
                          <span
                            className={`text-xs ${
                              isFromMe ? "text-brand-200" : "text-gray-400"
                            }`}
                          >
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                        {msg.sujet && msg.sujet !== "Sans objet" && (
                          <p
                            className={`text-xs font-medium mb-1 ${
                              isFromMe ? "text-brand-100" : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            Sujet: {msg.sujet}
                          </p>
                        )}
                        <p
                          className={`text-sm whitespace-pre-wrap ${
                            isFromMe ? "text-white" : "text-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {msg.contenu}
                        </p>
                        {/* Pièces jointes */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {msg.attachments.map((att, idx) => {
                              const FileIcon = getFileIcon(att.type);
                              return (
                                <a
                                  key={idx}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                                    isFromMe
                                      ? "bg-white/20 hover:bg-white/30 text-white"
                                      : "bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  <FileIcon className="w-3 h-3" />
                                  <span className="truncate max-w-[100px]">{att.name}</span>
                                  <Download className="w-3 h-3" />
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={conversationEndRef} />
            </div>

            {/* Formulaire */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <MessageForm
                onSend={handleSend}
                sending={sending}
                token={token}
                placeholder="Votre message à l'organisme..."
                showSubject={messages.length === 0}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =====================================
// BLOC INTERVENANTS
// =====================================

function BlocIntervenants({ token }: { token: string }) {
  const { selectedSession, dashboardStats, setDashboardStats } = useApprenantPortal();
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [messages, setMessages] = useState<MessageIntervenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntervenant, setSelectedIntervenant] = useState<Intervenant | null>(null);
  const [sending, setSending] = useState(false);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Charger les intervenants de la session
  const fetchIntervenants = useCallback(async () => {
    if (!selectedSession) {
      setIntervenants([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/apprenant/intervenants?token=${encodeURIComponent(token)}&sessionId=${selectedSession.sessionId}`
      );
      if (res.ok) {
        const data = await res.json();
        setIntervenants(data.intervenants || []);
      }
    } catch (error) {
      console.error("Erreur chargement intervenants:", error);
    } finally {
      setLoading(false);
    }
  }, [token, selectedSession]);

  // Charger les messages intervenant
  const fetchMessages = useCallback(async () => {
    if (!selectedSession) return;

    try {
      const res = await fetch(
        `/api/apprenant/messages-intervenant?token=${encodeURIComponent(token)}&sessionId=${selectedSession.sessionId}`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);

        // Mettre à jour le compteur
        if (dashboardStats && setDashboardStats) {
          setDashboardStats({
            ...dashboardStats,
            messagesIntervenantNonLus: data.unreadCount || 0,
          });
        }
      }
    } catch (error) {
      console.error("Erreur chargement messages:", error);
    }
  }, [token, selectedSession, dashboardStats, setDashboardStats]);

  useEffect(() => {
    setLoading(true);
    fetchIntervenants();
    fetchMessages();
  }, [fetchIntervenants, fetchMessages]);

  // Scroll vers le bas quand on ouvre la conversation
  useEffect(() => {
    if (selectedIntervenant) {
      setTimeout(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [selectedIntervenant, messages.length]);

  // Ouvrir la conversation avec un intervenant
  const handleOpenConversation = async (intervenant: Intervenant) => {
    setSelectedIntervenant(intervenant);

    // Marquer les messages de cet intervenant comme lus
    const intervenantMessages = messages.filter(
      (m) => m.intervenant.id === intervenant.id && !m.isRead
    );

    if (intervenantMessages.length > 0) {
      for (const msg of intervenantMessages) {
        try {
          await fetch(`/api/apprenant/messages-intervenant?token=${encodeURIComponent(token)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messageId: msg.id }),
          });
        } catch (err) {
          console.error("Erreur marquage lu:", err);
        }
      }

      // Mettre à jour localement
      setMessages((prev) =>
        prev.map((m) =>
          m.intervenant.id === intervenant.id ? { ...m, isRead: true, nombreReponsesNonLues: 0 } : m
        )
      );
    }
  };

  // Envoyer une réponse
  const handleSendReply = async (
    messageId: string,
    data: { contenu: string; attachments: Attachment[] }
  ) => {
    setSending(true);
    try {
      const res = await fetch(`/api/apprenant/messages-intervenant/reponse?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          contenu: data.contenu,
          attachments: data.attachments,
        }),
      });

      if (res.ok) {
        // Rafraîchir les messages
        await fetchMessages();
      }
    } catch (error) {
      console.error("Erreur envoi réponse:", error);
    } finally {
      setSending(false);
    }
  };

  // Messages de l'intervenant sélectionné
  const intervenantMessages = selectedIntervenant
    ? messages.filter((m) => m.intervenant.id === selectedIntervenant.id)
    : [];

  // Nombre de messages non lus par intervenant
  const getUnreadCount = (intervenantId: string) => {
    return messages.filter(
      (m) =>
        m.intervenant.id === intervenantId &&
        (!m.isRead || (m.nombreReponsesNonLues && m.nombreReponsesNonLues > 0))
    ).length;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Intervenant(s)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedSession
                ? `${intervenants.length} intervenant${intervenants.length > 1 ? "s" : ""}`
                : "Sélectionnez une session"}
            </p>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <AnimatePresence mode="wait">
        {!selectedIntervenant ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
              </div>
            ) : !selectedSession ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                Sélectionnez une session pour voir les intervenants
              </p>
            ) : intervenants.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                Aucun intervenant pour cette session
              </p>
            ) : (
              <div className="space-y-2">
                {intervenants.map((intervenant) => {
                  const unreadCount = getUnreadCount(intervenant.id);
                  const hasMessages = messages.some((m) => m.intervenant.id === intervenant.id);

                  return (
                    <button
                      key={intervenant.id}
                      onClick={() => handleOpenConversation(intervenant)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900 dark:to-brand-800 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {intervenant.prenom} {intervenant.nom}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {intervenant.role === "formateur" ? "Formateur principal" : "Co-intervenant"}
                            {intervenant.specialites && intervenant.specialites.length > 0 && ` • ${intervenant.specialites.join(", ")}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-brand-500 text-white text-xs font-bold rounded-full">
                            {unreadCount}
                          </span>
                        )}
                        {hasMessages ? (
                          <Mail className="w-5 h-5 text-brand-500" />
                        ) : (
                          <MessageSquare className="w-5 h-5 text-gray-400" />
                        )}
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="conversation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header conversation */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <button
                onClick={() => setSelectedIntervenant(null)}
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {selectedIntervenant.prenom} {selectedIntervenant.nom}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedIntervenant.role === "formateur" ? "Formateur" : "Co-intervenant"}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
              {intervenantMessages.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  Aucun message avec cet intervenant.
                  <br />
                  <span className="text-sm">Les messages sont initiés par l'intervenant.</span>
                </p>
              ) : (
                intervenantMessages.map((msg) => (
                  <div key={msg.id} className="space-y-3">
                    {/* Message original de l'intervenant */}
                    <div className="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-xl border-l-4 border-brand-500">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
                          {msg.intervenant.prenom} {msg.intervenant.nom}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(msg.createdAt)}
                        </span>
                        {!msg.isRead && (
                          <span className="px-1.5 py-0.5 bg-brand-500 text-white text-[10px] font-medium rounded">
                            Nouveau
                          </span>
                        )}
                      </div>
                      {msg.sujet && (
                        <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mb-1">
                          {msg.sujet}
                        </p>
                      )}
                      <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                        {msg.contenu}
                      </p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {msg.attachments.map((att, idx) => {
                            const FileIcon = getFileIcon(att.type);
                            return (
                              <a
                                key={idx}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded text-xs transition-colors"
                              >
                                <FileIcon className="w-3 h-3 text-brand-500" />
                                <span className="truncate max-w-[100px] text-gray-700 dark:text-gray-300">
                                  {att.name}
                                </span>
                                <Download className="w-3 h-3 text-gray-400" />
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Réponses */}
                    {msg.reponses && msg.reponses.length > 0 && (
                      <div className="space-y-2 ml-4">
                        {msg.reponses.map((reponse) => {
                          const isFromIntervenant = reponse.typeAuteur === "intervenant";
                          const isUnread = isFromIntervenant && !reponse.isReadByApprenant;

                          return (
                            <div
                              key={reponse.id}
                              className={`p-3 rounded-lg ${
                                isFromIntervenant
                                  ? `bg-brand-50 dark:bg-brand-900/20 border-l-4 border-brand-500 ${isUnread ? "ring-2 ring-brand-300" : ""}`
                                  : "bg-gray-100 dark:bg-gray-700 border-l-4 border-gray-400"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`text-xs font-medium ${
                                    isFromIntervenant
                                      ? "text-brand-700 dark:text-brand-300"
                                      : "text-gray-600 dark:text-gray-400"
                                  }`}
                                >
                                  {isFromIntervenant
                                    ? `${reponse.intervenant?.prenom || ""} ${reponse.intervenant?.nom || ""}`
                                    : "Vous"}
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
                              <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                                {reponse.contenu}
                              </p>
                              {reponse.attachments && reponse.attachments.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
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
                                        <span className="truncate max-w-[100px] text-gray-700 dark:text-gray-300">
                                          {att.name}
                                        </span>
                                        <Download className="w-3 h-3 text-gray-400" />
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Formulaire de réponse */}
                    <div className="ml-4 pt-2">
                      <MessageForm
                        onSend={(data) =>
                          handleSendReply(msg.id, {
                            contenu: data.contenu,
                            attachments: data.attachments,
                          })
                        }
                        sending={sending}
                        token={token}
                        placeholder="Votre réponse..."
                        buttonText="Répondre"
                      />
                    </div>
                  </div>
                ))
              )}
              <div ref={conversationEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function MessageriePage() {
  const { token, selectedSession } = useApprenantPortal();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 dark:text-white font-medium">
            Session expirée
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-brand-500" />
            Messagerie
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Échangez avec l'organisme et vos formateurs
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Blocs */}
      <div className="grid gap-6 lg:grid-cols-2" key={refreshKey}>
        {/* Bloc Organisme */}
        <BlocOrganisme token={token} />

        {/* Bloc Intervenants */}
        <BlocIntervenants token={token} />
      </div>
    </div>
  );
}
