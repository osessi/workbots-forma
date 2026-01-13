"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import {
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  Mail,
  MailOpen,
  ArrowLeft,
  Clock,
  CheckCheck,
  PenSquare,
  Inbox,
  RefreshCw,
  User,
  Building2,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  File,
  Download,
} from "lucide-react";

// =====================================
// TYPES
// =====================================

// Correction 421: Type pour les pièces jointes
interface Attachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

interface MessageReply {
  id: string;
  content: string;
  senderName: string;
  senderEmail: string;
  createdAt: string;
  fromOrganisme?: boolean;
  attachments?: Attachment[]; // Correction 421
}

interface Message {
  id: string;
  type: "sent" | "received";
  subject: string;
  content: string;
  senderName: string;
  senderEmail: string;
  isRead: boolean;
  createdAt: string;
  replies: MessageReply[];
  hasNewReply?: boolean;
  attachments?: Attachment[]; // Correction 421
}

interface MessagesData {
  messages: Message[];
  unreadCount: number;
  total: number;
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

function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Correction 421: Formater la taille du fichier
function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// Correction 421: Icône selon le type de fichier
function getFileIcon(type?: string) {
  if (!type) return File;
  if (type.startsWith("image/")) return ImageIcon;
  if (type.includes("pdf") || type.includes("word") || type.includes("document")) return FileText;
  return File;
}

// Correction 421: Types de fichiers autorisés
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
// COMPOSANT AFFICHAGE PIÈCES JOINTES
// =====================================

// Correction 421: Composant pour afficher les pièces jointes
function AttachmentList({ attachments, variant = "default" }: { attachments: Attachment[]; variant?: "default" | "bubble" }) {
  if (!attachments || attachments.length === 0) return null;

  const isLight = variant === "bubble";

  return (
    <div className={`flex flex-wrap gap-2 ${variant === "default" ? "mt-2" : "mt-2"}`}>
      {attachments.map((att, idx) => {
        const FileIcon = getFileIcon(att.type);
        return (
          <a
            key={idx}
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              isLight
                ? "bg-white/20 hover:bg-white/30 text-white"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
            }`}
          >
            <FileIcon className="w-3.5 h-3.5" />
            <span className="truncate max-w-[150px]">{att.name}</span>
            {att.size && <span className="opacity-70">({formatFileSize(att.size)})</span>}
            <Download className="w-3 h-3" />
          </a>
        );
      })}
    </div>
  );
}

// Correction 421: Composant pour uploader des fichiers
function FileUploader({
  files,
  onFilesChange,
  uploading,
  token,
}: {
  files: Attachment[];
  onFilesChange: (files: Attachment[]) => void;
  uploading: boolean;
  token: string;
}) {
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploadError(null);

    for (const file of Array.from(selectedFiles)) {
      // Vérifier le type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setUploadError(`Type non autorisé: ${file.name}. Acceptés: PDF, Word, Excel, Images.`);
        continue;
      }

      // Vérifier la taille
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`Fichier trop volumineux: ${file.name}. Maximum 10 Mo.`);
        continue;
      }

      // Upload le fichier
      setUploadingFile(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("token", token);

        const res = await fetch(`/api/apprenant/messages/upload?token=${encodeURIComponent(token)}`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erreur upload");
        }

        const result = await res.json();
        if (result.attachment) {
          onFilesChange([...files, result.attachment]);
        }
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Erreur lors de l'upload");
      } finally {
        setUploadingFile(false);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={ALLOWED_MIME_TYPES.join(",")}
          multiple
          className="hidden"
          disabled={uploading || uploadingFile}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || uploadingFile}
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

      {/* Liste des fichiers sélectionnés */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, idx) => {
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
  );
}

// =====================================
// COMPOSANT MESSAGE CARD
// =====================================

function MessageCard({
  message,
  index,
  onClick,
}: {
  message: Message;
  index: number;
  onClick: () => void;
}) {
  const isUnread = message.type === "received" ? !message.isRead : message.hasNewReply;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`w-full text-left bg-white dark:bg-gray-800 rounded-xl border p-4 transition-all hover:shadow-md group ${
        isUnread
          ? "border-brand-500 dark:border-brand-500 bg-brand-50/50 dark:bg-brand-500/5"
          : "border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Icône */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            message.type === "received"
              ? "bg-brand-100 dark:bg-brand-500/20"
              : "bg-gray-100 dark:bg-gray-700"
          }`}
        >
          {message.type === "received" ? (
            isUnread ? (
              <Mail className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            ) : (
              <MailOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            )
          ) : (
            <Send className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          )}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  className={`font-medium truncate ${
                    isUnread
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {message.subject}
                </h3>
                {isUnread && (
                  <span className="px-2 py-0.5 bg-brand-500 text-white text-xs font-medium rounded-full">
                    {message.type === "received" ? "Nouveau" : "Réponse"}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                {message.type === "received" ? (
                  <>
                    <Building2 className="w-3 h-3" />
                    <span>De: {message.senderName}</span>
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3" />
                    <span>Envoyé par vous</span>
                  </>
                )}
              </p>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(message.createdAt)}
            </span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
            {message.content}
          </p>

          {/* Indicateurs de réponses et pièces jointes */}
          <div className="mt-2 flex items-center gap-3">
            {message.replies.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <CheckCheck className="w-3 h-3" />
                <span>
                  {message.replies.length} réponse{message.replies.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
            {/* Correction 421: Indicateur pièces jointes */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <Paperclip className="w-3 h-3" />
                <span>
                  {message.attachments.length} fichier{message.attachments.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// =====================================
// COMPOSANT DÉTAIL MESSAGE
// =====================================

function MessageDetail({
  message,
  onBack,
  onReply,
  isReplying,
  token,
}: {
  message: Message;
  onBack: () => void;
  onReply: (content: string, attachments: Attachment[]) => Promise<void>; // Correction 421
  isReplying: boolean;
  token: string; // Correction 421
}) {
  const [replyContent, setReplyContent] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<Attachment[]>([]); // Correction 421
  const { organization } = useApprenantPortal();
  // Correction 423: Ref pour le scroll automatique vers le dernier message
  const conversationEndRef = React.useRef<HTMLDivElement>(null);
  const conversationContainerRef = React.useRef<HTMLDivElement>(null);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || isReplying) return;
    await onReply(replyContent.trim(), replyAttachments);
    setReplyContent("");
    setReplyAttachments([]); // Correction 421: Réinitialiser les pièces jointes
  };

  // Construire la conversation complète avec pièces jointes (Correction 421)
  const conversation = [
    {
      id: message.id,
      content: message.content,
      senderName: message.senderName,
      isFromOrganisme: message.type === "received",
      createdAt: message.createdAt,
      attachments: message.attachments || [], // Correction 421
    },
    ...message.replies.map((reply) => ({
      id: reply.id,
      content: reply.content,
      senderName: reply.senderName,
      isFromOrganisme: reply.fromOrganisme || reply.senderEmail !== message.senderEmail,
      createdAt: reply.createdAt,
      attachments: reply.attachments || [], // Correction 421
    })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Correction 423: Scroll automatique vers le dernier message au chargement
  useEffect(() => {
    // Petit délai pour laisser le temps au rendu
    const timer = setTimeout(() => {
      conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 300);
    return () => clearTimeout(timer);
  }, [message.id, conversation.length]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux messages
        </button>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {message.subject}
        </h2>

        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
          {message.type === "received" ? (
            <>
              <Building2 className="w-4 h-4" />
              <span>De: {message.senderName}</span>
            </>
          ) : (
            <>
              <User className="w-4 h-4" />
              <span>Envoyé à: {organization?.nomCommercial || organization?.name}</span>
            </>
          )}
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <Clock className="w-4 h-4" />
          <span>{formatFullDate(message.createdAt)}</span>
        </div>
      </div>

      {/* Conversation */}
      <div ref={conversationContainerRef} className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
        {conversation.map((msg, index) => {
          // Correction 423: Identifier le dernier message de l'organisme pour le mettre en évidence
          const isLastOrgMessage = msg.isFromOrganisme &&
            index === conversation.findLastIndex((m) => m.isFromOrganisme);
          const isLastMessage = index === conversation.length - 1;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex ${msg.isFromOrganisme ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.isFromOrganisme
                    ? `bg-gray-100 dark:bg-gray-700 rounded-tl-md ${
                        isLastOrgMessage ? "ring-2 ring-brand-400 ring-offset-2 dark:ring-offset-gray-800" : ""
                      }`
                    : "bg-brand-500 text-white rounded-tr-md"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-medium ${
                      msg.isFromOrganisme
                        ? "text-gray-600 dark:text-gray-300"
                        : "text-brand-100"
                    }`}
                  >
                    {msg.senderName}
                  </span>
                  <span
                    className={`text-xs ${
                      msg.isFromOrganisme
                        ? "text-gray-400 dark:text-gray-500"
                        : "text-brand-200"
                    }`}
                  >
                    {formatDate(msg.createdAt)}
                  </span>
                  {/* Correction 423: Badge "Nouveau" pour le dernier message de l'organisme */}
                  {isLastOrgMessage && message.hasNewReply && (
                    <span className="px-1.5 py-0.5 bg-brand-500 text-white text-[10px] font-medium rounded">
                      Nouveau
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm whitespace-pre-wrap ${
                    msg.isFromOrganisme ? "text-gray-700 dark:text-gray-200" : "text-white"
                  }`}
                >
                  {msg.content}
                </p>
                {/* Correction 421: Afficher les pièces jointes */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <AttachmentList
                    attachments={msg.attachments}
                    variant={msg.isFromOrganisme ? "default" : "bubble"}
                  />
                )}
              </div>
            </motion.div>
          );
        })}
        {/* Correction 423: Élément invisible pour le scroll automatique */}
        <div ref={conversationEndRef} />
      </div>

      {/* Formulaire de réponse */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <form onSubmit={handleSubmitReply} className="space-y-3">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Votre réponse..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
          />
          {/* Correction 421: Upload de fichiers pour les réponses */}
          <FileUploader
            files={replyAttachments}
            onFilesChange={setReplyAttachments}
            uploading={isReplying}
            token={token}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!replyContent.trim() || isReplying}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-medium transition-colors"
            >
              {isReplying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Répondre
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

// =====================================
// COMPOSANT NOUVEAU MESSAGE
// =====================================

function NewMessageForm({
  onSend,
  onCancel,
  isSending,
  token,
}: {
  onSend: (subject: string, content: string, attachments: Attachment[]) => Promise<void>; // Correction 421
  onCancel: () => void;
  isSending: boolean;
  token: string; // Correction 421
}) {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]); // Correction 421
  const { organization } = useApprenantPortal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;
    await onSend(subject.trim(), content.trim(), attachments); // Correction 421
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <PenSquare className="w-5 h-5 text-brand-500" />
          Nouveau message
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Envoyer un message à {organization?.nomCommercial || organization?.name}
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sujet
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Objet de votre message..."
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Rédigez votre message..."
            rows={6}
            required
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        {/* Correction 421: Pièces jointes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pièces jointes
          </label>
          <FileUploader
            files={attachments}
            onFilesChange={setAttachments}
            uploading={isSending}
            token={token}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!content.trim() || isSending}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-medium transition-colors"
          >
            {isSending ? (
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
// PAGE PRINCIPALE
// =====================================

export default function MessagesPage() {
  // Correction 430: Utiliser selectedSession pour filtrer par session
  const { token, setDashboardStats, dashboardStats, selectedSession } = useApprenantPortal();
  const [data, setData] = useState<MessagesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isNewMessage, setIsNewMessage] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMessages = useCallback(async (showLoader = true) => {
    if (!token) return;

    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      // Correction 430: Ajouter sessionId au paramètre
      const params = new URLSearchParams({ token });
      if (selectedSession?.sessionId) {
        params.append("sessionId", selectedSession.sessionId);
      }

      const res = await fetch(`/api/apprenant/messages?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Erreur lors du chargement des messages");
      }

      const messagesData = await res.json();
      setData(messagesData);

      // Mettre à jour le compteur dans le dashboard
      if (dashboardStats) {
        setDashboardStats({
          ...dashboardStats,
          messagesNonLus: messagesData.unreadCount,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, dashboardStats, setDashboardStats, selectedSession?.sessionId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Correction 423: Sélectionner automatiquement le dernier fil avec message non lu
  useEffect(() => {
    if (data && data.messages.length > 0 && !selectedMessage && !isNewMessage) {
      // Trouver le premier message avec une nouvelle réponse de l'organisme
      const messageWithUnreadReply = data.messages.find(
        (m) => m.hasNewReply || (m.type === "received" && !m.isRead)
      );

      if (messageWithUnreadReply) {
        // Sélectionner automatiquement ce message
        handleSelectMessage(messageWithUnreadReply);
      }
    }
  }, [data?.messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Marquer un message comme lu
  const markAsRead = async (messageId: string) => {
    if (!token) return;

    try {
      await fetch(`/api/apprenant/messages/${messageId}?token=${encodeURIComponent(token)}`, {
        method: "PATCH",
      });
    } catch (err) {
      console.error("Erreur lors du marquage comme lu:", err);
    }
  };

  // Envoyer une réponse (Correction 421: avec pièces jointes)
  const handleReply = async (content: string, attachments: Attachment[] = []) => {
    if (!token || !selectedMessage) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/apprenant/messages?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          content,
          attachments, // Correction 421
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de l'envoi");
      }

      const result = await res.json();

      // Mettre à jour le message sélectionné avec la nouvelle réponse
      if (result.reply) {
        setSelectedMessage({
          ...selectedMessage,
          replies: [...selectedMessage.replies, result.reply],
        });

        // Mettre à jour la liste
        if (data) {
          setData({
            ...data,
            messages: data.messages.map((m) =>
              m.id === selectedMessage.id
                ? { ...m, replies: [...m.replies, result.reply] }
                : m
            ),
          });
        }
      }
    } catch (err) {
      console.error("Erreur envoi réponse:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Envoyer un nouveau message (Correction 421: avec pièces jointes)
  const handleSendNewMessage = async (subject: string, content: string, attachments: Attachment[] = []) => {
    if (!token) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/apprenant/messages?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, content, attachments }), // Correction 421
      });

      if (!res.ok) {
        throw new Error("Erreur lors de l'envoi");
      }

      const result = await res.json();

      // Ajouter le nouveau message à la liste
      if (result.message && data) {
        setData({
          ...data,
          messages: [result.message, ...data.messages],
          total: data.total + 1,
        });
      }

      setIsNewMessage(false);
    } catch (err) {
      console.error("Erreur envoi message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Sélectionner un message
  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    setIsNewMessage(false);

    // Marquer comme lu si non lu
    const isUnread = message.type === "received" ? !message.isRead : message.hasNewReply;
    if (isUnread) {
      markAsRead(message.id);

      // Mettre à jour localement
      if (data) {
        setData({
          ...data,
          messages: data.messages.map((m) =>
            m.id === message.id
              ? { ...m, isRead: true, hasNewReply: false }
              : m
          ),
          unreadCount: Math.max(0, data.unreadCount - 1),
        });
      }
    }
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
          <p className="text-gray-900 dark:text-white font-medium">{error}</p>
          <button
            onClick={() => fetchMessages()}
            className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-brand-500" />
            Messagerie
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {data?.total || 0} message{(data?.total || 0) > 1 ? "s" : ""}
            {(data?.unreadCount || 0) > 0 && (
              <span className="ml-2 text-brand-500 font-medium">
                ({data?.unreadCount} non lu{(data?.unreadCount || 0) > 1 ? "s" : ""})
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchMessages(false)}
            disabled={refreshing}
            className="p-2.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
            title="Actualiser"
          >
            <RefreshCw className={`w-5 h-5 text-gray-500 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => {
              setIsNewMessage(true);
              setSelectedMessage(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors"
          >
            <PenSquare className="w-4 h-4" />
            Nouveau message
          </button>
        </div>
      </div>

      {/* Contenu */}
      <AnimatePresence mode="wait">
        {isNewMessage ? (
          <NewMessageForm
            key="new-message"
            onSend={handleSendNewMessage}
            onCancel={() => setIsNewMessage(false)}
            isSending={isSending}
            token={token || ""} // Correction 421
          />
        ) : selectedMessage ? (
          <MessageDetail
            key={`detail-${selectedMessage.id}`}
            message={selectedMessage}
            onBack={() => setSelectedMessage(null)}
            onReply={handleReply}
            isReplying={isSending}
            token={token || ""} // Correction 421
          />
        ) : (
          <motion.div
            key="message-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {data?.messages && data.messages.length > 0 ? (
              <div className="space-y-3">
                {data.messages.map((message, index) => (
                  <MessageCard
                    key={message.id}
                    message={message}
                    index={index}
                    onClick={() => handleSelectMessage(message)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Inbox className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Aucun message
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Vous n'avez pas encore de messages. Commencez une conversation avec votre organisme de formation.
                </p>
                <button
                  onClick={() => setIsNewMessage(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors"
                >
                  <PenSquare className="w-4 h-4" />
                  Envoyer un message
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
