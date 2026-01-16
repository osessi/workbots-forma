"use client";

// ===========================================
// CORRECTIONS 530-534: Page Messagerie Intervenant
// ===========================================
// 530: Onglet Messagerie dans le menu
// 531: 2 blocs (Organisme / Apprenants)
// 532: Envoi direct à l'organisme
// 533: Liste apprenants de la session sélectionnée
// 534: Pièces jointes

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRequireIntervenantAuth, useIntervenantPortal } from "@/context/IntervenantPortalContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Users,
  User,
  Building2,
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
  Check,
  CheckCheck,
  Mail,
  Download,
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
  typeAuteur: string;
  isReadByIntervenant: boolean;
  isReadByApprenant: boolean;
  apprenant: { id: string; nom: string; prenom: string } | null;
  intervenant: { id: string; nom: string; prenom: string } | null;
  destinataireApprenant: { id: string; nom: string; prenom: string } | null;
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
  lectures: Array<{ apprenantId: string; readAt: string }>;
  reponses: ReponseMessage[];
  nombreReponsesNonLues: number;
}

interface MessageOrganisme {
  id: string;
  sujet: string;
  contenu: string;
  attachments: Attachment[];
  createdAt: string;
  isRead: boolean;
  typeAuteur: "intervenant" | "organisme";
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
// COMPOSANT FORMULAIRE MESSAGE
// =====================================

function MessageForm({
  title,
  destinataire,
  onSend,
  onCancel,
  sending,
}: {
  title: string;
  destinataire: string;
  onSend: (sujet: string, contenu: string, attachments: Attachment[]) => void;
  onCancel: () => void;
  sending: boolean;
}) {
  const [sujet, setSujet] = useState("");
  const [contenu, setContenu] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    try {
      for (const file of Array.from(files)) {
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

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contenu.trim()) return;
    onSend(sujet, contenu, attachments);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-lg overflow-hidden"
    >
      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">{title}</h3>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">À : {destinataire}</p>
        </div>
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Sujet */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sujet
          </label>
          <input
            type="text"
            value={sujet}
            onChange={(e) => setSujet(e.target.value)}
            placeholder="Objet du message"
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
            placeholder="Écrivez votre message..."
            rows={5}
            required
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
          />
        </div>

        {/* Pièces jointes - Correction 534 */}
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
                      <span className="text-xs text-gray-500">({formatFileSize(att.size)})</span>
                    )}
                    <button
                      type="button"
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
            type="button"
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
            type="button"
            onClick={onCancel}
            disabled={sending}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={sending || !contenu.trim()}
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
      </form>
    </motion.div>
  );
}

// =====================================
// BLOC ORGANISME DE FORMATION (532)
// =====================================

function BlocOrganisme({
  token,
  organizationName,
  organizationEmail,
}: {
  token: string;
  organizationName: string;
  organizationEmail: string | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<MessageOrganisme[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Charger les messages avec l'organisme
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/intervenant/messagerie/organisme?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Erreur chargement messages organisme:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSend = async (sujet: string, contenu: string, attachments: Attachment[]) => {
    setSending(true);
    try {
      const res = await fetch(`/api/intervenant/messagerie/organisme?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sujet, contenu, attachments }),
      });

      if (res.ok) {
        setShowForm(false);
        setSuccessMessage("Message envoyé avec succès !");
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchMessages();
      }
    } catch (err) {
      console.error("Erreur envoi message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Organisme de formation</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{organizationName}</p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau message
          </button>
        )}
      </div>

      <div className="p-4">
        {/* Message de succès */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm rounded-lg flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Formulaire nouveau message */}
        <AnimatePresence>
          {showForm && (
            <div className="mb-4">
              <MessageForm
                title="Nouveau message à l'organisme"
                destinataire={organizationEmail || organizationName}
                onSend={handleSend}
                onCancel={() => setShowForm(false)}
                sending={sending}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Liste des messages */}
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg border-l-4 ${
                  msg.typeAuteur === "intervenant"
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-400"
                    : "bg-gray-50 dark:bg-gray-700/50 border-gray-400"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {msg.typeAuteur === "intervenant" ? "Vous" : organizationName}
                    </span>
                    {!msg.isRead && msg.typeAuteur === "organisme" && (
                      <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[10px] font-medium rounded">
                        Nouveau
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(msg.createdAt)}</span>
                </div>
                {msg.sujet && (
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {msg.sujet}
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {msg.contenu}
                </p>
                {msg.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.attachments.map((att, idx) => {
                      const FileIcon = getFileIcon(att.type);
                      return (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 rounded text-xs transition-colors"
                        >
                          <FileIcon className="w-3 h-3 text-blue-500" />
                          <span className="text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
                            {att.name}
                          </span>
                          <Download className="w-3 h-3 text-gray-400" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Mail className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucun message échangé avec l&apos;organisme
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================
// BLOC APPRENANTS (533)
// =====================================

function BlocApprenants({
  token,
  sessionId,
  apprenants,
  messages,
  onRefresh,
}: {
  token: string;
  sessionId: string;
  apprenants: Apprenant[];
  messages: MessageEnvoye[];
  onRefresh: () => void;
}) {
  const [selectedApprenant, setSelectedApprenant] = useState<Apprenant | null>(null);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ messageId: string; apprenantId: string; apprenantNom: string } | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // Compter les messages non lus par apprenant
  const getUnreadCountForApprenant = (apprenantId: string) => {
    return messages.reduce((count, msg) => {
      const reponsesNonLues = msg.reponses.filter(
        (r) => r.typeAuteur === "apprenant" && r.apprenant?.id === apprenantId && !r.isReadByIntervenant
      ).length;
      return count + reponsesNonLues;
    }, 0);
  };

  // Récupérer les messages d'un apprenant
  const getMessagesForApprenant = (apprenantId: string) => {
    return messages.filter(
      (msg) => msg.destinatairesIds.includes(apprenantId) || msg.envoyeATous
    );
  };

  // Envoyer un nouveau message à un apprenant
  const handleSendNewMessage = async (sujet: string, contenu: string, attachments: Attachment[]) => {
    if (!selectedApprenant) return;

    setSending(true);
    try {
      const res = await fetch(`/api/intervenant/messages?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          sujet: sujet || null,
          contenu,
          attachments,
          destinatairesIds: [selectedApprenant.id],
        }),
      });

      if (res.ok) {
        setShowNewMessageForm(false);
        onRefresh();
      }
    } catch (err) {
      console.error("Erreur envoi message:", err);
    } finally {
      setSending(false);
    }
  };

  // Répondre à un apprenant
  const handleSendReply = async () => {
    if (!replyingTo || !replyContent.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/intervenant/messages/reponse?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: replyingTo.messageId,
          destinataireApprenantId: replyingTo.apprenantId,
          contenu: replyContent.trim(),
        }),
      });

      if (res.ok) {
        setReplyingTo(null);
        setReplyContent("");
        onRefresh();
      }
    } catch (err) {
      console.error("Erreur envoi réponse:", err);
    } finally {
      setSending(false);
    }
  };

  // Marquer les messages comme lus
  const handleMarkAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/intervenant/messages?token=${encodeURIComponent(token)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });
      onRefresh();
    } catch (err) {
      console.error("Erreur marquage comme lu:", err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Apprenants</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {apprenants.length} apprenant{apprenants.length > 1 ? "s" : ""} dans cette session
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4">
        {apprenants.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucun apprenant dans cette session
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {apprenants.map((apprenant) => {
              const unreadCount = getUnreadCountForApprenant(apprenant.id);
              const apprenantMessages = getMessagesForApprenant(apprenant.id);
              const isSelected = selectedApprenant?.id === apprenant.id;

              return (
                <div key={apprenant.id}>
                  {/* Ligne apprenant */}
                  <button
                    onClick={() => setSelectedApprenant(isSelected ? null : apprenant)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      isSelected
                        ? "bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700"
                        : "bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {apprenant.prenom} {apprenant.nom}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{apprenant.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <span className="flex items-center justify-center w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full">
                          {unreadCount}
                        </span>
                      )}
                      {isSelected ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Détail conversation */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 mt-2 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
                          {/* Bouton nouveau message */}
                          {!showNewMessageForm && (
                            <button
                              onClick={() => setShowNewMessageForm(true)}
                              className="flex items-center gap-2 px-3 py-2 mb-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Nouveau message
                            </button>
                          )}

                          {/* Formulaire nouveau message */}
                          <AnimatePresence>
                            {showNewMessageForm && (
                              <div className="mb-4">
                                <MessageForm
                                  title="Nouveau message"
                                  destinataire={`${apprenant.prenom} ${apprenant.nom}`}
                                  onSend={handleSendNewMessage}
                                  onCancel={() => setShowNewMessageForm(false)}
                                  sending={sending}
                                />
                              </div>
                            )}
                          </AnimatePresence>

                          {/* Conversation */}
                          {apprenantMessages.length > 0 ? (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {apprenantMessages.map((msg) => {
                                const apprenantReponses = msg.reponses.filter(
                                  (r) =>
                                    (r.typeAuteur === "apprenant" && r.apprenant?.id === apprenant.id) ||
                                    (r.typeAuteur === "intervenant" && r.destinataireApprenant?.id === apprenant.id)
                                );

                                return (
                                  <div key={msg.id} className="space-y-2">
                                    {/* Message initial */}
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded border-l-4 border-emerald-400">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                          Vous
                                        </span>
                                        <span className="text-xs text-gray-500">{formatDate(msg.createdAt)}</span>
                                      </div>
                                      {msg.sujet && (
                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                          {msg.sujet}
                                        </p>
                                      )}
                                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                        {msg.contenu}
                                      </p>
                                    </div>

                                    {/* Réponses */}
                                    {apprenantReponses.map((reponse) => {
                                      const isFromApprenant = reponse.typeAuteur === "apprenant";
                                      const isUnread = isFromApprenant && !reponse.isReadByIntervenant;

                                      return (
                                        <div
                                          key={reponse.id}
                                          className={`p-2 rounded border-l-4 ${
                                            isFromApprenant
                                              ? `bg-orange-50 dark:bg-orange-900/20 border-orange-400 ${isUnread ? "ring-1 ring-orange-300" : ""}`
                                              : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 ml-4"
                                          }`}
                                          onClick={() => isUnread && handleMarkAsRead(msg.id)}
                                        >
                                          <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                              <span className={`text-xs font-medium ${isFromApprenant ? "text-orange-700 dark:text-orange-300" : "text-emerald-700 dark:text-emerald-300"}`}>
                                                {isFromApprenant ? `${apprenant.prenom} ${apprenant.nom}` : "Vous"}
                                              </span>
                                              {isUnread && (
                                                <span className="px-1 py-0.5 bg-orange-500 text-white text-[9px] font-bold rounded">
                                                  Nouveau
                                                </span>
                                              )}
                                            </div>
                                            <span className="text-xs text-gray-500">{formatDate(reponse.createdAt)}</span>
                                          </div>
                                          <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {reponse.contenu}
                                          </p>
                                          {/* Bouton répondre */}
                                          {isFromApprenant && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setReplyingTo({
                                                  messageId: msg.id,
                                                  apprenantId: apprenant.id,
                                                  apprenantNom: `${apprenant.prenom} ${apprenant.nom}`,
                                                });
                                              }}
                                              className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                                            >
                                              <Reply className="w-3 h-3" />
                                              Répondre
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}

                                    {/* Formulaire de réponse */}
                                    {replyingTo && replyingTo.messageId === msg.id && replyingTo.apprenantId === apprenant.id && (
                                      <div className="ml-4 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-2">
                                          Répondre à {replyingTo.apprenantNom}
                                        </p>
                                        <textarea
                                          value={replyContent}
                                          onChange={(e) => setReplyContent(e.target.value)}
                                          placeholder="Votre réponse..."
                                          rows={2}
                                          className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 resize-none"
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                          <button
                                            onClick={() => {
                                              setReplyingTo(null);
                                              setReplyContent("");
                                            }}
                                            className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                          >
                                            Annuler
                                          </button>
                                          <button
                                            onClick={handleSendReply}
                                            disabled={sending || !replyContent.trim()}
                                            className="flex items-center gap-1 px-2 py-1 text-xs bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white rounded"
                                          >
                                            {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                            Envoyer
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                              Aucun message avec cet apprenant
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function MessagerieIntervenantPage() {
  useRequireIntervenantAuth();
  const { token, selectedSession, organization, isLoading } = useIntervenantPortal();

  const [messages, setMessages] = useState<MessageEnvoye[]>([]);
  const [apprenants, setApprenants] = useState<Apprenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les messages et apprenants
  const fetchData = useCallback(async () => {
    if (!token || !selectedSession) return;

    try {
      setError(null);
      const res = await fetch(
        `/api/intervenant/messages?token=${encodeURIComponent(token)}&sessionId=${selectedSession.id}`
      );
      if (!res.ok) throw new Error("Erreur lors du chargement");

      const data = await res.json();
      setMessages(data.messages || []);
      setApprenants(data.apprenants || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [token, selectedSession]);

  useEffect(() => {
    if (selectedSession) {
      setLoading(true);
      fetchData();
    }
  }, [fetchData, selectedSession]);

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
          Veuillez sélectionner une session pour accéder à la messagerie.
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
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-emerald-500" />
          Messagerie
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Communiquez avec l&apos;organisme de formation et vos apprenants
        </p>
      </div>

      {/* Bloc Organisme de formation (532) */}
      {organization && token && (
        <BlocOrganisme
          token={token}
          organizationName={organization.nomCommercial || organization.name}
          organizationEmail={organization.email || null}
        />
      )}

      {/* Bloc Apprenants (533) */}
      {token && selectedSession && (
        <BlocApprenants
          token={token}
          sessionId={selectedSession.id}
          apprenants={apprenants}
          messages={messages}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
}
