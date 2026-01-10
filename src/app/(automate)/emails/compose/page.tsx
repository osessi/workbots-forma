"use client";

// ===========================================
// PAGE COMPOSE - Composer un email
// ===========================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Send, Paperclip, Users, FileText, X, Plus,
  Search, Check, RefreshCw, Calendar, Clock, File, Image
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string;
  category: string;
}

interface Apprenant {
  id: string;
  prenom: string;
  nom: string;
  email: string;
}

interface DriveFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export default function ComposeEmailPage() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Formulaire
  const [recipients, setRecipients] = useState<Array<{ email: string; name?: string }>>([]);
  const [recipientInput, setRecipientInput] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<DriveFile[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");

  // Modals
  const [showTemplates, setShowTemplates] = useState(false);
  const [showApprenants, setShowApprenants] = useState(false);
  const [showDrive, setShowDrive] = useState(false);

  // Data
  const [templates, setTemplates] = useState<Template[]>([]);
  const [apprenants, setApprenants] = useState<Apprenant[]>([]);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Charger les templates
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/emailing/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Erreur fetch templates:", error);
    }
  };

  const fetchApprenants = async () => {
    try {
      const res = await fetch("/api/apprenants?limit=100");
      if (res.ok) {
        const data = await res.json();
        setApprenants(data.apprenants || []);
      }
    } catch (error) {
      console.error("Erreur fetch apprenants:", error);
    }
  };

  const fetchDriveFiles = async () => {
    try {
      const res = await fetch("/api/files?limit=50");
      if (res.ok) {
        const data = await res.json();
        setDriveFiles(data.files || []);
      }
    } catch (error) {
      console.error("Erreur fetch files:", error);
    }
  };

  const addRecipient = (email: string, name?: string) => {
    if (email && !recipients.some((r) => r.email === email)) {
      setRecipients([...recipients, { email, name }]);
    }
    setRecipientInput("");
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r.email !== email));
  };

  const selectTemplate = (template: Template) => {
    setTemplateId(template.id);
    setSubject(template.subject);
    setShowTemplates(false);
  };

  const addApprenant = (apprenant: Apprenant) => {
    addRecipient(apprenant.email, `${apprenant.prenom} ${apprenant.nom}`);
  };

  const addAttachment = (file: DriveFile) => {
    if (!attachments.some((a) => a.id === file.id)) {
      setAttachments([...attachments, file]);
    }
  };

  const removeAttachment = (fileId: string) => {
    setAttachments(attachments.filter((a) => a.id !== fileId));
  };

  const handleSend = async () => {
    if (recipients.length === 0) {
      alert("Veuillez ajouter au moins un destinataire");
      return;
    }
    if (!subject.trim()) {
      alert("Veuillez saisir un sujet");
      return;
    }
    if (!content.trim() && !templateId) {
      alert("Veuillez saisir un message ou sélectionner un template");
      return;
    }

    try {
      setSending(true);

      const res = await fetch("/api/emailing/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipients,
          subject,
          content: content || undefined,
          templateId: templateId || undefined,
          attachments: attachments.map((a) => ({
            fileId: a.id,
            filename: a.name,
            url: a.url,
          })),
          scheduledAt: scheduledAt || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur lors de l'envoi");
      }

      setSent(true);
      setTimeout(() => {
        router.push("/emails");
      }, 2000);
    } catch (error) {
      console.error("Erreur envoi:", error);
      alert(error instanceof Error ? error.message : "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredApprenants = apprenants.filter((a) =>
    `${a.prenom} ${a.nom} ${a.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Email envoyé !
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {scheduledAt ? "Votre email sera envoyé à la date programmée" : "Votre email a été envoyé avec succès"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/emails"
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Composer un email
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Envoyez un email personnalisé à vos contacts
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Destinataires */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Destinataires
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {recipients.map((r) => (
                <span
                  key={r.email}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full text-sm"
                >
                  {r.name || r.email}
                  <button
                    onClick={() => removeRecipient(r.email)}
                    className="hover:text-brand-900 dark:hover:text-brand-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && recipientInput) {
                    e.preventDefault();
                    addRecipient(recipientInput);
                  }
                }}
                placeholder="Ajouter un email..."
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              <button
                onClick={() => {
                  fetchApprenants();
                  setShowApprenants(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Users className="w-4 h-4" />
                Apprenants
              </button>
            </div>
          </div>

          {/* Sujet */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sujet
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Sujet de l'email..."
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              <button
                onClick={() => setShowTemplates(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Template
              </button>
            </div>
            {templateId && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-brand-600 dark:text-brand-400">
                  Template sélectionné
                </span>
                <button
                  onClick={() => setTemplateId(null)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  (supprimer)
                </button>
              </div>
            )}
          </div>

          {/* Contenu */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message {templateId && "(optionnel si template sélectionné)"}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              placeholder="Rédigez votre message ici..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              Variables disponibles : {"{{prenom}}"}, {"{{nom}}"}, {"{{email}}"}, {"{{formation}}"}, {"{{session}}"}
            </p>
          </div>

          {/* Pièces jointes */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Pièces jointes
              </label>
              <button
                onClick={() => {
                  fetchDriveFiles();
                  setShowDrive(true);
                }}
                className="flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline"
              >
                <Paperclip className="w-4 h-4" />
                Ajouter depuis Drive
              </button>
            </div>
            {attachments.length > 0 ? (
              <div className="space-y-2">
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <File className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <button
                      onClick={() => removeAttachment(file.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucune pièce jointe</p>
            )}
          </div>

          {/* Programmation */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Programmer l&apos;envoi (optionnel)
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              {scheduledAt && (
                <button
                  onClick={() => setScheduledAt("")}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 flex items-center justify-between">
            <Link
              href="/emails"
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Annuler
            </Link>
            <button
              onClick={handleSend}
              disabled={sending || recipients.length === 0 || !subject.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : scheduledAt ? (
                <>
                  <Clock className="w-4 h-4" />
                  Programmer
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

      {/* Modal Templates */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Sélectionner un template
              </h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="overflow-auto max-h-96 p-4">
              {templates.length > 0 ? (
                <div className="space-y-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => selectTemplate(template)}
                      className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">
                        {template.name}
                      </p>
                      <p className="text-sm text-gray-500">{template.subject}</p>
                      <span className="inline-block mt-1 text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                        {template.category}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Aucun template disponible
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Apprenants */}
      {showApprenants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Sélectionner des apprenants
                </h3>
                <button
                  onClick={() => setShowApprenants(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <div className="overflow-auto max-h-96 p-4">
              {filteredApprenants.length > 0 ? (
                <div className="space-y-2">
                  {filteredApprenants.map((apprenant) => {
                    const isSelected = recipients.some((r) => r.email === apprenant.email);
                    return (
                      <button
                        key={apprenant.id}
                        onClick={() => addApprenant(apprenant)}
                        disabled={isSelected}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          isSelected
                            ? "bg-brand-50 dark:bg-brand-900/30 cursor-default"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {apprenant.prenom} {apprenant.nom}
                            </p>
                            <p className="text-sm text-gray-500">{apprenant.email}</p>
                          </div>
                          {isSelected && (
                            <Check className="w-5 h-5 text-brand-600" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Aucun apprenant trouvé
                </p>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowApprenants(false)}
                className="w-full py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
              >
                Fermer ({recipients.length} sélectionné{recipients.length > 1 ? "s" : ""})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Drive */}
      {showDrive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Fichiers Drive
              </h3>
              <button
                onClick={() => setShowDrive(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="overflow-auto max-h-96 p-4">
              {driveFiles.length > 0 ? (
                <div className="space-y-2">
                  {driveFiles.map((file) => {
                    const isAttached = attachments.some((a) => a.id === file.id);
                    return (
                      <button
                        key={file.id}
                        onClick={() => addAttachment(file)}
                        disabled={isAttached}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          isAttached
                            ? "bg-brand-50 dark:bg-brand-900/30 cursor-default"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {file.type?.startsWith("image") ? (
                              <Image className="w-5 h-5 text-gray-500" />
                            ) : (
                              <File className="w-5 h-5 text-gray-500" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          {isAttached && (
                            <Check className="w-5 h-5 text-brand-600" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Aucun fichier dans le Drive
                </p>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowDrive(false)}
                className="w-full py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
              >
                Fermer ({attachments.length} fichier{attachments.length > 1 ? "s" : ""})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
