"use client";

// ===========================================
// PAGE COMPOSE - Composer un email
// ===========================================
// Corrections 544-550: Refonte complète avec 2 blocs et pop-up de sélection avancée

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Send, Paperclip, Users, FileText, X, Plus,
  Search, Check, RefreshCw, Calendar, Clock, File, Image as ImageIcon,
  ChevronRight, Eye, UserCheck, Building2, GraduationCap
} from "lucide-react";

// Types
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
  formationId?: string;
  formationTitre?: string;
}

interface Intervenant {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  fonction?: string;
}

interface Formation {
  id: string;
  titre: string;
}

interface Session {
  id: string;
  reference: string;
  nom: string | null;
  formationId: string;
}

interface DriveFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface Recipient {
  email: string;
  name?: string;
  type: "apprenant" | "intervenant";
  id: string;
}

// Composant principal
export default function ComposeEmailPage() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Mode d'envoi actif (template ou libre)
  const [activeMode, setActiveMode] = useState<"template" | "libre" | null>(null);

  // Formulaire Template
  const [templateRecipients, setTemplateRecipients] = useState<Recipient[]>([]);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templateAttachments, setTemplateAttachments] = useState<DriveFile[]>([]);
  const [templateScheduledAt, setTemplateScheduledAt] = useState("");
  const [templateScheduleMode, setTemplateScheduleMode] = useState<"now" | "scheduled">("now");

  // Formulaire Email libre
  const [libreRecipients, setLibreRecipients] = useState<Recipient[]>([]);
  const [libreSubject, setLibreSubject] = useState("");
  const [libreContent, setLibreContent] = useState("");
  const [libreAttachments, setLibreAttachments] = useState<DriveFile[]>([]);
  const [libreScheduledAt, setLibreScheduledAt] = useState("");
  const [libreScheduleMode, setLibreScheduleMode] = useState<"now" | "scheduled">("now");

  // Modals
  const [showAddRecipients, setShowAddRecipients] = useState(false);
  const [currentRecipientTarget, setCurrentRecipientTarget] = useState<"template" | "libre">("template");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showDrive, setShowDrive] = useState(false);
  const [currentDriveTarget, setCurrentDriveTarget] = useState<"template" | "libre">("template");
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState("");

  // Data
  const [templates, setTemplates] = useState<Template[]>([]);
  const [apprenants, setApprenants] = useState<Apprenant[]>([]);
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);

  // Pop-up Add Recipients State
  const [recipientTab, setRecipientTab] = useState<"apprenants" | "intervenants">("apprenants");
  const [selectionMode, setSelectionMode] = useState<"all" | "formation" | "manual">("manual");
  const [selectedFormationId, setSelectedFormationId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [sessionSelectionType, setSessionSelectionType] = useState<"all" | "specific">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSelectedRecipients, setTempSelectedRecipients] = useState<Recipient[]>([]);

  // Charger les données initiales
  useEffect(() => {
    fetchTemplates();
    fetchFormations();
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

  const fetchFormations = async () => {
    try {
      const res = await fetch("/api/formations?limit=100");
      if (res.ok) {
        const data = await res.json();
        setFormations(data.formations || data.data || []);
      }
    } catch (error) {
      console.error("Erreur fetch formations:", error);
    }
  };

  const fetchApprenants = useCallback(async (formationId?: string, sessionId?: string) => {
    try {
      let url = "/api/apprenants?limit=500";
      if (sessionId) {
        url += `&sessionId=${sessionId}`;
      } else if (formationId) {
        url += `&formationId=${formationId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setApprenants(data.apprenants || data.data || []);
      }
    } catch (error) {
      console.error("Erreur fetch apprenants:", error);
    }
  }, []);

  const fetchIntervenants = useCallback(async (formationId?: string, sessionId?: string) => {
    try {
      let url = "/api/intervenants?limit=500";
      if (sessionId) {
        url += `&sessionId=${sessionId}`;
      } else if (formationId) {
        url += `&formationId=${formationId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setIntervenants(data.intervenants || data.data || []);
      }
    } catch (error) {
      console.error("Erreur fetch intervenants:", error);
    }
  }, []);

  const fetchSessions = useCallback(async (formationId: string) => {
    try {
      const res = await fetch(`/api/training-sessions?formationId=${formationId}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.data || []);
      }
    } catch (error) {
      console.error("Erreur fetch sessions:", error);
    }
  }, []);

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

  // Ouvrir la pop-up d'ajout de destinataires
  const openAddRecipients = (target: "template" | "libre") => {
    setCurrentRecipientTarget(target);
    setRecipientTab("apprenants");
    setSelectionMode("manual");
    setSelectedFormationId("");
    setSelectedSessionId("");
    setSessionSelectionType("all");
    setSearchQuery("");
    // Précharger les destinataires déjà sélectionnés
    const currentRecipients = target === "template" ? templateRecipients : libreRecipients;
    setTempSelectedRecipients([...currentRecipients]);
    fetchApprenants();
    fetchIntervenants();
    setShowAddRecipients(true);
  };

  // Gestion des destinataires
  const addTempRecipient = (recipient: Recipient) => {
    if (!tempSelectedRecipients.some(r => r.id === recipient.id)) {
      setTempSelectedRecipients([...tempSelectedRecipients, recipient]);
    }
  };

  const removeTempRecipient = (id: string) => {
    setTempSelectedRecipients(tempSelectedRecipients.filter(r => r.id !== id));
  };

  const confirmRecipients = () => {
    if (currentRecipientTarget === "template") {
      setTemplateRecipients(tempSelectedRecipients);
    } else {
      setLibreRecipients(tempSelectedRecipients);
    }
    setShowAddRecipients(false);
  };

  const selectAllApprenants = () => {
    const newRecipients: Recipient[] = apprenants.map(a => ({
      id: a.id,
      email: a.email,
      name: `${a.prenom} ${a.nom}`,
      type: "apprenant" as const
    }));
    setTempSelectedRecipients(prev => {
      const existing = prev.filter(r => r.type !== "apprenant");
      return [...existing, ...newRecipients];
    });
  };

  const selectAllIntervenants = () => {
    const newRecipients: Recipient[] = intervenants.map(i => ({
      id: i.id,
      email: i.email,
      name: `${i.prenom} ${i.nom}`,
      type: "intervenant" as const
    }));
    setTempSelectedRecipients(prev => {
      const existing = prev.filter(r => r.type !== "intervenant");
      return [...existing, ...newRecipients];
    });
  };

  // Gestion des templates
  const selectTemplate = (template: Template) => {
    setTemplateId(template.id);
    setShowTemplates(false);
    setActiveMode("template");
  };

  // Gestion des pièces jointes
  const openDrive = (target: "template" | "libre") => {
    setCurrentDriveTarget(target);
    fetchDriveFiles();
    setShowDrive(true);
  };

  const addAttachment = (file: DriveFile) => {
    const attachments = currentDriveTarget === "template" ? templateAttachments : libreAttachments;
    const setAttachments = currentDriveTarget === "template" ? setTemplateAttachments : setLibreAttachments;
    if (!attachments.some(a => a.id === file.id)) {
      setAttachments([...attachments, file]);
    }
  };

  const removeAttachment = (fileId: string, target: "template" | "libre") => {
    if (target === "template") {
      setTemplateAttachments(templateAttachments.filter(a => a.id !== fileId));
    } else {
      setLibreAttachments(libreAttachments.filter(a => a.id !== fileId));
    }
  };

  // Prévisualisation
  const handlePreview = async (mode: "template" | "libre") => {
    if (mode === "template" && templateId) {
      try {
        const res = await fetch(`/api/emailing/templates/${templateId}/preview`);
        if (res.ok) {
          const data = await res.json();
          setPreviewContent(data.html || data.content || "Aperçu non disponible");
          setShowPreview(true);
        }
      } catch (error) {
        console.error("Erreur preview:", error);
      }
    } else if (mode === "libre") {
      setPreviewContent(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">${libreSubject || "(Sans objet)"}</h2>
          <div style="color: #555; line-height: 1.6;">${libreContent.replace(/\n/g, "<br>")}</div>
        </div>
      `);
      setShowPreview(true);
    }
  };

  // Envoi
  const handleSend = async (mode: "template" | "libre") => {
    const recipients = mode === "template" ? templateRecipients : libreRecipients;
    const attachments = mode === "template" ? templateAttachments : libreAttachments;
    const scheduledAt = mode === "template"
      ? (templateScheduleMode === "scheduled" ? templateScheduledAt : "")
      : (libreScheduleMode === "scheduled" ? libreScheduledAt : "");

    if (recipients.length === 0) {
      alert("Veuillez ajouter au moins un destinataire");
      return;
    }

    if (mode === "template" && !templateId) {
      alert("Veuillez sélectionner une template");
      return;
    }

    if (mode === "libre") {
      if (!libreSubject.trim()) {
        alert("Veuillez saisir un objet");
        return;
      }
      if (!libreContent.trim()) {
        alert("Veuillez saisir un message");
        return;
      }
    }

    try {
      setSending(true);
      setActiveMode(mode);

      const res = await fetch("/api/emailing/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipients.map(r => ({ email: r.email, name: r.name })),
          subject: mode === "template" ? undefined : libreSubject,
          content: mode === "template" ? undefined : libreContent,
          templateId: mode === "template" ? templateId : undefined,
          attachments: attachments.map(a => ({
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

  // Filtrage des listes
  const filteredApprenants = apprenants.filter(a =>
    `${a.prenom} ${a.nom} ${a.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredIntervenants = intervenants.filter(i =>
    `${i.prenom} ${i.nom} ${i.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Écran de succès
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
            {(activeMode === "template" ? templateScheduleMode : libreScheduleMode) === "scheduled"
              ? "Votre email sera envoyé à la date programmée"
              : "Votre email a été envoyé avec succès"}
          </p>
        </div>
      </div>
    );
  }

  const selectedTemplate = templates.find(t => t.id === templateId);

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
              Choisissez votre mode d&apos;envoi ci-dessous
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* ========================================= */}
          {/* BLOC 1 : Envoyer avec une template */}
          {/* ========================================= */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header du bloc */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-brand-50 to-white dark:from-brand-900/20 dark:to-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-500 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Envoyer avec une template
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Sélectionnez une template prête à l&apos;envoi, puis choisissez vos destinataires.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template <span className="text-red-500">*</span>
                </label>
                <button
                  onClick={() => setShowTemplates(true)}
                  className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:border-brand-300 dark:hover:border-brand-600 transition-colors"
                >
                  <span className={selectedTemplate ? "text-gray-900 dark:text-white" : "text-gray-400"}>
                    {selectedTemplate ? selectedTemplate.name : "Sélectionner une template"}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                {selectedTemplate && (
                  <p className="mt-2 text-sm text-gray-500">
                    Objet : {selectedTemplate.subject}
                  </p>
                )}
              </div>

              {/* Destinataires */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Destinataires
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {templateRecipients.length === 0 ? (
                    <span className="text-sm text-gray-400">Aucun destinataire sélectionné</span>
                  ) : (
                    <>
                      {templateRecipients.slice(0, 5).map(r => (
                        <span
                          key={r.id}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full text-sm"
                        >
                          {r.name || r.email}
                          <button onClick={() => setTemplateRecipients(templateRecipients.filter(rec => rec.id !== r.id))}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {templateRecipients.length > 5 && (
                        <span className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm">
                          +{templateRecipients.length - 5} autres
                        </span>
                      )}
                    </>
                  )}
                </div>
                <button
                  onClick={() => openAddRecipients("template")}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              {/* Programmation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Programmation de l&apos;envoi
                </label>
                <div className="flex gap-3 mb-3">
                  <button
                    onClick={() => setTemplateScheduleMode("now")}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                      templateScheduleMode === "now"
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300"
                        : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Envoyer maintenant
                  </button>
                  <button
                    onClick={() => setTemplateScheduleMode("scheduled")}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                      templateScheduleMode === "scheduled"
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300"
                        : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Programmer
                  </button>
                </div>
                {templateScheduleMode === "scheduled" && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={templateScheduledAt}
                      onChange={(e) => setTemplateScheduledAt(e.target.value)}
                      className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                )}
              </div>

              {/* Pièces jointes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Pièces jointes (optionnel)
                  </label>
                  <button
                    onClick={() => openDrive("template")}
                    className="flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    <Paperclip className="w-4 h-4" />
                    Ajouter une pièce jointe
                  </button>
                </div>
                {templateAttachments.length > 0 && (
                  <div className="space-y-2">
                    {templateAttachments.map(file => (
                      <div key={file.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-2">
                          <File className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-900 dark:text-white">{file.name}</span>
                          <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                        </div>
                        <button onClick={() => removeAttachment(file.id, "template")} className="text-gray-400 hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handlePreview("template")}
                  disabled={!templateId}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Prévisualiser
                </button>
                <button
                  onClick={() => handleSend("template")}
                  disabled={sending || !templateId || templateRecipients.length === 0}
                  className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending && activeMode === "template" ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : templateScheduleMode === "scheduled" ? (
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

          {/* ========================================= */}
          {/* BLOC 2 : Écrire un email */}
          {/* ========================================= */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header du bloc */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Écrire un email
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Rédigez votre email manuellement, puis envoyez-le à vos destinataires.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Destinataires */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Destinataires
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {libreRecipients.length === 0 ? (
                    <span className="text-sm text-gray-400">Aucun destinataire sélectionné</span>
                  ) : (
                    <>
                      {libreRecipients.slice(0, 5).map(r => (
                        <span
                          key={r.id}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                        >
                          {r.name || r.email}
                          <button onClick={() => setLibreRecipients(libreRecipients.filter(rec => rec.id !== r.id))}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {libreRecipients.length > 5 && (
                        <span className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm">
                          +{libreRecipients.length - 5} autres
                        </span>
                      )}
                    </>
                  )}
                </div>
                <button
                  onClick={() => openAddRecipients("libre")}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              {/* Objet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Objet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={libreSubject}
                  onChange={(e) => setLibreSubject(e.target.value)}
                  placeholder="Objet de l'email"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={libreContent}
                  onChange={(e) => setLibreContent(e.target.value)}
                  rows={8}
                  placeholder="Rédigez votre message…"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Variables disponibles : {"{{prenom}}"}, {"{{nom}}"}, {"{{email}}"}, {"{{formation}}"}, {"{{session}}"}
                </p>
              </div>

              {/* Programmation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Programmation de l&apos;envoi
                </label>
                <div className="flex gap-3 mb-3">
                  <button
                    onClick={() => setLibreScheduleMode("now")}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                      libreScheduleMode === "now"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Envoyer maintenant
                  </button>
                  <button
                    onClick={() => setLibreScheduleMode("scheduled")}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                      libreScheduleMode === "scheduled"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Programmer
                  </button>
                </div>
                {libreScheduleMode === "scheduled" && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={libreScheduledAt}
                      onChange={(e) => setLibreScheduledAt(e.target.value)}
                      className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Pièces jointes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Pièces jointes (optionnel)
                  </label>
                  <button
                    onClick={() => openDrive("libre")}
                    className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Paperclip className="w-4 h-4" />
                    Ajouter une pièce jointe
                  </button>
                </div>
                {libreAttachments.length > 0 && (
                  <div className="space-y-2">
                    {libreAttachments.map(file => (
                      <div key={file.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-2">
                          <File className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-900 dark:text-white">{file.name}</span>
                          <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                        </div>
                        <button onClick={() => removeAttachment(file.id, "libre")} className="text-gray-400 hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handlePreview("libre")}
                  disabled={!libreSubject.trim() || !libreContent.trim()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Prévisualiser
                </button>
                <button
                  onClick={() => handleSend("libre")}
                  disabled={sending || libreRecipients.length === 0 || !libreSubject.trim() || !libreContent.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending && activeMode === "libre" ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : libreScheduleMode === "scheduled" ? (
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
        </div>
      </div>

      {/* ========================================= */}
      {/* Modal Ajouter des destinataires (544-546) */}
      {/* ========================================= */}
      {showAddRecipients && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ajouter des destinataires
                </h3>
                <button
                  onClick={() => setShowAddRecipients(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Onglets Apprenants / Intervenants */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setRecipientTab("apprenants");
                    setSelectionMode("manual");
                    setSelectedFormationId("");
                    setSelectedSessionId("");
                    fetchApprenants();
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    recipientTab === "apprenants"
                      ? "bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Apprenants
                </button>
                <button
                  onClick={() => {
                    setRecipientTab("intervenants");
                    setSelectionMode("manual");
                    setSelectedFormationId("");
                    setSelectedSessionId("");
                    fetchIntervenants();
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    recipientTab === "intervenants"
                      ? "bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Intervenants
                </button>
              </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-auto p-4">
              {/* Modes de sélection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mode de sélection
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectionMode("all");
                      setSelectedFormationId("");
                      setSelectedSessionId("");
                      if (recipientTab === "apprenants") {
                        fetchApprenants();
                      } else {
                        fetchIntervenants();
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectionMode === "all"
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {recipientTab === "apprenants" ? "Tous les apprenants" : "Tous les intervenants"}
                  </button>
                  <button
                    onClick={() => {
                      setSelectionMode("formation");
                      setSelectedFormationId("");
                      setSelectedSessionId("");
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectionMode === "formation"
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Par formation
                  </button>
                  <button
                    onClick={() => {
                      setSelectionMode("manual");
                      setSelectedFormationId("");
                      setSelectedSessionId("");
                      if (recipientTab === "apprenants") {
                        fetchApprenants();
                      } else {
                        fetchIntervenants();
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectionMode === "manual"
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Sélection manuelle
                  </button>
                </div>
              </div>

              {/* Mode A - Tous */}
              {selectionMode === "all" && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-amber-800 dark:text-amber-200 mb-3">
                    Vous allez envoyer à <strong>{recipientTab === "apprenants" ? apprenants.length : intervenants.length}</strong> {recipientTab === "apprenants" ? "apprenants" : "intervenants"}.
                  </p>
                  <button
                    onClick={() => {
                      if (recipientTab === "apprenants") {
                        selectAllApprenants();
                      } else {
                        selectAllIntervenants();
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    Sélectionner tous
                  </button>
                </div>
              )}

              {/* Mode B - Par formation */}
              {selectionMode === "formation" && (
                <div className="space-y-4">
                  {/* Sélection formation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Formation
                    </label>
                    <select
                      value={selectedFormationId}
                      onChange={(e) => {
                        setSelectedFormationId(e.target.value);
                        setSelectedSessionId("");
                        setSessionSelectionType("all");
                        if (e.target.value) {
                          fetchSessions(e.target.value);
                          if (recipientTab === "apprenants") {
                            fetchApprenants(e.target.value);
                          } else {
                            fetchIntervenants(e.target.value);
                          }
                        }
                      }}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Sélectionner une formation</option>
                      {formations.map(f => (
                        <option key={f.id} value={f.id}>{f.titre}</option>
                      ))}
                    </select>
                  </div>

                  {selectedFormationId && (
                    <>
                      {/* Options après sélection formation */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSessionSelectionType("all");
                            setSelectedSessionId("");
                            if (recipientTab === "apprenants") {
                              fetchApprenants(selectedFormationId);
                            } else {
                              fetchIntervenants(selectedFormationId);
                            }
                          }}
                          className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                            sessionSelectionType === "all"
                              ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300"
                              : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          Toutes les sessions
                        </button>
                        <button
                          onClick={() => setSessionSelectionType("specific")}
                          className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                            sessionSelectionType === "specific"
                              ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300"
                              : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          Choisir une session
                        </button>
                      </div>

                      {/* Sélection session spécifique */}
                      {sessionSelectionType === "specific" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Session
                          </label>
                          <select
                            value={selectedSessionId}
                            onChange={(e) => {
                              setSelectedSessionId(e.target.value);
                              if (e.target.value) {
                                if (recipientTab === "apprenants") {
                                  fetchApprenants(undefined, e.target.value);
                                } else {
                                  fetchIntervenants(undefined, e.target.value);
                                }
                              }
                            }}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="">Sélectionner une session</option>
                            {sessions.map(s => (
                              <option key={s.id} value={s.id}>{s.reference} {s.nom ? `- ${s.nom}` : ""}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Liste des personnes après filtrage */}
                      {((sessionSelectionType === "all") || (sessionSelectionType === "specific" && selectedSessionId)) && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {recipientTab === "apprenants" ? apprenants.length : intervenants.length} {recipientTab === "apprenants" ? "apprenants" : "intervenants"} trouvés
                            </span>
                            <button
                              onClick={() => {
                                if (recipientTab === "apprenants") {
                                  selectAllApprenants();
                                } else {
                                  selectAllIntervenants();
                                }
                              }}
                              className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
                            >
                              Tout sélectionner
                            </button>
                          </div>
                          <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                            {recipientTab === "apprenants" ? (
                              apprenants.length > 0 ? (
                                apprenants.map(a => {
                                  const isSelected = tempSelectedRecipients.some(r => r.id === a.id);
                                  return (
                                    <label key={a.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {
                                          if (isSelected) {
                                            removeTempRecipient(a.id);
                                          } else {
                                            addTempRecipient({
                                              id: a.id,
                                              email: a.email,
                                              name: `${a.prenom} ${a.nom}`,
                                              type: "apprenant"
                                            });
                                          }
                                        }}
                                        className="w-4 h-4 text-brand-600 rounded"
                                      />
                                      <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{a.prenom} {a.nom}</p>
                                        <p className="text-xs text-gray-500">{a.email}</p>
                                      </div>
                                    </label>
                                  );
                                })
                              ) : (
                                <p className="p-4 text-sm text-gray-500 text-center">Aucun apprenant trouvé</p>
                              )
                            ) : (
                              intervenants.length > 0 ? (
                                intervenants.map(i => {
                                  const isSelected = tempSelectedRecipients.some(r => r.id === i.id);
                                  return (
                                    <label key={i.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {
                                          if (isSelected) {
                                            removeTempRecipient(i.id);
                                          } else {
                                            addTempRecipient({
                                              id: i.id,
                                              email: i.email,
                                              name: `${i.prenom} ${i.nom}`,
                                              type: "intervenant"
                                            });
                                          }
                                        }}
                                        className="w-4 h-4 text-brand-600 rounded"
                                      />
                                      <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{i.prenom} {i.nom}</p>
                                        <p className="text-xs text-gray-500">{i.email} {i.fonction && `• ${i.fonction}`}</p>
                                      </div>
                                    </label>
                                  );
                                })
                              ) : (
                                <p className="p-4 text-sm text-gray-500 text-center">Aucun intervenant trouvé</p>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Mode C - Sélection manuelle */}
              {selectionMode === "manual" && (
                <div className="space-y-4">
                  {/* Recherche */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher par nom ou email…"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {/* Liste */}
                  <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                    {recipientTab === "apprenants" ? (
                      filteredApprenants.length > 0 ? (
                        filteredApprenants.map(a => {
                          const isSelected = tempSelectedRecipients.some(r => r.id === a.id);
                          return (
                            <label key={a.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    removeTempRecipient(a.id);
                                  } else {
                                    addTempRecipient({
                                      id: a.id,
                                      email: a.email,
                                      name: `${a.prenom} ${a.nom}`,
                                      type: "apprenant"
                                    });
                                  }
                                }}
                                className="w-4 h-4 text-brand-600 rounded"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{a.prenom} {a.nom}</p>
                                <p className="text-xs text-gray-500">{a.email}</p>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-brand-600" />}
                            </label>
                          );
                        })
                      ) : (
                        <p className="p-4 text-sm text-gray-500 text-center">Aucun apprenant trouvé</p>
                      )
                    ) : (
                      filteredIntervenants.length > 0 ? (
                        filteredIntervenants.map(i => {
                          const isSelected = tempSelectedRecipients.some(r => r.id === i.id);
                          return (
                            <label key={i.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    removeTempRecipient(i.id);
                                  } else {
                                    addTempRecipient({
                                      id: i.id,
                                      email: i.email,
                                      name: `${i.prenom} ${i.nom}`,
                                      type: "intervenant"
                                    });
                                  }
                                }}
                                className="w-4 h-4 text-brand-600 rounded"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{i.prenom} {i.nom}</p>
                                <p className="text-xs text-gray-500">{i.email} {i.fonction && `• ${i.fonction}`}</p>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-brand-600" />}
                            </label>
                          );
                        })
                      ) : (
                        <p className="p-4 text-sm text-gray-500 text-center">Aucun intervenant trouvé</p>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer avec récapitulatif */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {tempSelectedRecipients.length} destinataire{tempSelectedRecipients.length > 1 ? "s" : ""} sélectionné{tempSelectedRecipients.length > 1 ? "s" : ""}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddRecipients(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmRecipients}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Templates */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Sélectionner une template
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
                  {templates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => selectTemplate(template)}
                      className={`w-full text-left p-4 rounded-lg transition-colors border ${
                        templateId === template.id
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30"
                          : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <p className="font-medium text-gray-900 dark:text-white">
                        {template.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{template.subject}</p>
                      <span className="inline-block mt-2 text-xs text-brand-600 bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded">
                        {template.category}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucune template disponible</p>
                  <Link href="/emails/templates" className="text-sm text-brand-600 hover:underline mt-2 inline-block">
                    Créer une template
                  </Link>
                </div>
              )}
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
                Ajouter une pièce jointe
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
                  {driveFiles.map(file => {
                    const attachments = currentDriveTarget === "template" ? templateAttachments : libreAttachments;
                    const isAttached = attachments.some(a => a.id === file.id);
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
                              <ImageIcon className="w-5 h-5 text-gray-500" />
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
                <div className="text-center py-8">
                  <File className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun fichier dans le Drive</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowDrive(false)}
                className="w-full py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Prévisualisation */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Aperçu de l&apos;email
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="overflow-auto max-h-[60vh] p-4">
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowPreview(false)}
                className="w-full py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
