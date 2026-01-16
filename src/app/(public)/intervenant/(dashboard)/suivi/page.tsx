"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRequireIntervenantAuth, useIntervenantPortal } from "@/context/IntervenantPortalContext";
import {
  ClipboardList,
  Users,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Send,
  FileText,
  Link as LinkIcon,
  Upload,
  X,
  Mail,
  Loader2,
  FolderOpen,
  MessageCircle,
} from "lucide-react";

// ===========================================
// Corrections 524-528: Refonte complète du suivi pédagogique
// ===========================================

interface ApprenantSuivi {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  signaturesCount: number;
  totalHalfDays: number;
  presenceRate: number;
  evaluationsCompletes: number;
  evaluationsTotal: number;
  messagesNonLus: number;
  statut: "excellent" | "bon" | "attention" | "critique";
}

interface Stats {
  participants: number;
  ressourcesPartagees: number;
  messagesEnvoyes: number;
  messagesRecus: number;
  messagesNonLus: number;
  signaturesTotal: number;
  signaturesAttendu: number;
  evaluationsCompletees: number;
  evaluationsAttendu: number;
}

interface Attachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export default function IntervenantSuiviPage() {
  useRequireIntervenantAuth();
  const { selectedSession, token, isLoading } = useIntervenantPortal();
  const [apprenantsSuivi, setApprenantsSuivi] = useState<ApprenantSuivi[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // État pour le message groupé
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageTarget, setMessageTarget] = useState<"all" | ApprenantSuivi | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [messageSujet, setMessageSujet] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // État pour les ressources partagées
  const [showRessourceForm, setShowRessourceForm] = useState(false);
  const [ressourceMessage, setRessourceMessage] = useState("");
  const [ressourceLien, setRessourceLien] = useState("");
  const [ressourceFiles, setRessourceFiles] = useState<File[]>([]);
  const [uploadingRessource, setUploadingRessource] = useState(false);

  const fetchSuivi = useCallback(async () => {
    if (!selectedSession || !token) return;

    setLoadingData(true);
    try {
      const res = await fetch(`/api/intervenant/suivi?token=${token}&sessionId=${selectedSession.id}`);
      if (res.ok) {
        const data = await res.json();
        setApprenantsSuivi(data.apprenants || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error("Erreur fetch suivi:", error);
    } finally {
      setLoadingData(false);
    }
  }, [selectedSession, token]);

  useEffect(() => {
    if (selectedSession && token) {
      fetchSuivi();
    }
  }, [selectedSession, token, fetchSuivi]);

  // Envoyer un message
  const handleSendMessage = async () => {
    if (!selectedSession || !token || !messageContent.trim()) return;

    setSendingMessage(true);
    try {
      const destinatairesIds = messageTarget === "all" || !messageTarget
        ? [] // Vide = tous
        : [messageTarget.id];

      const res = await fetch(`/api/intervenant/messages?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          sujet: messageSujet.trim() || null,
          contenu: messageContent.trim(),
          destinatairesIds,
        }),
      });

      if (res.ok) {
        setShowMessageModal(false);
        setMessageTarget(null);
        setMessageContent("");
        setMessageSujet("");
        fetchSuivi(); // Rafraîchir les stats
      }
    } catch (error) {
      console.error("Erreur envoi message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  // Publier une ressource
  const handlePublishRessource = async () => {
    if (!selectedSession || !token) return;
    if (!ressourceMessage.trim() && ressourceFiles.length === 0 && !ressourceLien.trim()) return;

    setUploadingRessource(true);
    try {
      // Upload des fichiers si présents
      const attachments: Attachment[] = [];

      for (const file of ressourceFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", `sessions/${selectedSession.id}/ressources`);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          attachments.push({
            name: file.name,
            url,
            size: file.size,
            type: file.type,
          });
        }
      }

      // Ajouter le lien comme attachment si présent
      if (ressourceLien.trim()) {
        attachments.push({
          name: ressourceLien.trim(),
          url: ressourceLien.trim(),
          type: "link",
        });
      }

      // Envoyer comme message groupé avec attachments
      const res = await fetch(`/api/intervenant/messages?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          sujet: "Ressources partagées",
          contenu: ressourceMessage.trim() || "Nouvelles ressources disponibles",
          attachments,
          destinatairesIds: [], // Tous les apprenants
        }),
      });

      if (res.ok) {
        setShowRessourceForm(false);
        setRessourceMessage("");
        setRessourceLien("");
        setRessourceFiles([]);
        fetchSuivi();
      }
    } catch (error) {
      console.error("Erreur publication ressource:", error);
    } finally {
      setUploadingRessource(false);
    }
  };

  // Ouvrir messagerie avec un apprenant
  const openMessageToApprenant = (apprenant: ApprenantSuivi) => {
    setMessageTarget(apprenant);
    setShowMessageModal(true);
  };

  // Ouvrir message groupé
  const openGroupMessage = () => {
    setMessageTarget("all");
    setShowMessageModal(true);
  };

  const getStatutInfo = (statut: string) => {
    switch (statut) {
      case "excellent":
        return { color: "text-green-500", bg: "bg-green-100 dark:bg-green-500/20", label: "Excellent" };
      case "bon":
        return { color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-500/20", label: "Bon" };
      case "attention":
        return { color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-500/20", label: "Attention" };
      case "critique":
        return { color: "text-red-500", bg: "bg-red-100 dark:bg-red-500/20", label: "Critique" };
      default:
        return { color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-700", label: "N/A" };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!selectedSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ClipboardList className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Aucune session sélectionnée
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Veuillez sélectionner une session pour voir le suivi pédagogique.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête - Correction 527 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Suivi pédagogique
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Centralisez l&apos;animation de session, les messages et les ressources partagées.
          </p>
        </div>

        {/* Correction 524: Bouton message groupé */}
        <button
          onClick={openGroupMessage}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Message groupé
        </button>
      </div>

      {/* Correction 526: 4 tuiles KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs">Participants</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats?.participants || apprenantsSuivi.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <FolderOpen className="w-4 h-4" />
            <span className="text-xs">Ressources partagées</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {stats?.ressourcesPartagees || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <Send className="w-4 h-4" />
            <span className="text-xs">Messages envoyés</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {stats?.messagesEnvoyes || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs">Messages reçus</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">
            {stats?.messagesRecus || 0}
            {(stats?.messagesNonLus || 0) > 0 && (
              <span className="text-sm font-normal text-red-500 ml-2">
                ({stats?.messagesNonLus} non lus)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Liste des apprenants - Corrections 524 + 528 */}
      {loadingData ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : apprenantsSuivi.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            Aucun apprenant inscrit à cette session
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* En-tête tableau */}
          <div className="hidden md:grid md:grid-cols-7 gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400">
            <div className="col-span-2">Apprenant</div>
            <div className="text-center">Présence</div>
            <div className="text-center">Évaluations</div>
            <div className="text-center">Statut</div>
            <div className="text-center">Messages</div>
            <div className="text-center">Actions</div>
          </div>

          {/* Lignes */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {apprenantsSuivi.map((apprenant) => {
              const statutInfo = getStatutInfo(apprenant.statut);

              return (
                <div
                  key={apprenant.id}
                  className="flex flex-col md:grid md:grid-cols-7 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {/* Apprenant */}
                  <div className="col-span-2 flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {apprenant.prenom[0]}{apprenant.nom[0]}
                      </div>
                      {/* Correction 528: Badge message non lu */}
                      {apprenant.messagesNonLus > 0 && (
                        <a
                          href={`/intervenant/messagerie?apprenant=${apprenant.id}`}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold hover:bg-red-600 transition-colors"
                          title={`${apprenant.messagesNonLus} message(s) non lu(s)`}
                        >
                          {apprenant.messagesNonLus}
                        </a>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {apprenant.prenom} {apprenant.nom}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {apprenant.email}
                      </p>
                    </div>
                  </div>

                  {/* Présence */}
                  <div className="flex items-center justify-between md:justify-center">
                    <span className="text-gray-500 text-sm md:hidden">Présence</span>
                    <span className={`font-medium ${
                      apprenant.presenceRate >= 80 ? "text-green-600" :
                      apprenant.presenceRate >= 50 ? "text-amber-600" : "text-red-600"
                    }`}>
                      {apprenant.signaturesCount}/{apprenant.totalHalfDays}
                      <span className="text-gray-400 text-sm ml-1">({apprenant.presenceRate}%)</span>
                    </span>
                  </div>

                  {/* Évaluations */}
                  <div className="flex items-center justify-between md:justify-center">
                    <span className="text-gray-500 text-sm md:hidden">Évaluations</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {apprenant.evaluationsCompletes}/{apprenant.evaluationsTotal}
                    </span>
                  </div>

                  {/* Statut */}
                  <div className="flex items-center justify-between md:justify-center">
                    <span className="text-gray-500 text-sm md:hidden">Statut</span>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full ${statutInfo.bg}`}>
                      {apprenant.statut === "excellent" && <CheckCircle className={`w-3 h-3 ${statutInfo.color}`} />}
                      {apprenant.statut === "critique" && <AlertCircle className={`w-3 h-3 ${statutInfo.color}`} />}
                      <span className={`text-xs font-medium ${statutInfo.color}`}>
                        {statutInfo.label}
                      </span>
                    </span>
                  </div>

                  {/* Badge messages */}
                  <div className="flex items-center justify-between md:justify-center">
                    <span className="text-gray-500 text-sm md:hidden">Messages</span>
                    {apprenant.messagesNonLus > 0 ? (
                      <a
                        href={`/intervenant/messagerie?apprenant=${apprenant.id}`}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full text-xs font-medium hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                      >
                        <Mail className="w-3 h-3" />
                        {apprenant.messagesNonLus} non lu{apprenant.messagesNonLus > 1 ? "s" : ""}
                      </a>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </div>

                  {/* Correction 524: Bouton message individuel */}
                  <div className="flex items-center justify-between md:justify-center">
                    <span className="text-gray-500 text-sm md:hidden">Actions</span>
                    <button
                      onClick={() => openMessageToApprenant(apprenant)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Correction 525: Bloc Ressources partagées */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-emerald-500" />
            Ressources partagées
          </h3>
          {!showRessourceForm && (
            <button
              onClick={() => setShowRessourceForm(true)}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              + Ajouter une ressource
            </button>
          )}
        </div>

        {showRessourceForm ? (
          <div className="space-y-4">
            {/* Message / consigne */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message / consigne
              </label>
              <textarea
                value={ressourceMessage}
                onChange={(e) => setRessourceMessage(e.target.value)}
                placeholder="Décrivez la ressource ou ajoutez une consigne..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                rows={3}
              />
            </div>

            {/* Upload fichiers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fichiers (PDF, images, PPT, etc.)
              </label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Ajouter des fichiers</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setRessourceFiles(prev => [...prev, ...files]);
                    }}
                  />
                </label>
              </div>
              {ressourceFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {ressourceFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FileText className="w-4 h-4" />
                      <span>{file.name}</span>
                      <button
                        onClick={() => setRessourceFiles(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lien */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lien (optionnel)
              </label>
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={ressourceLien}
                  onChange={(e) => setRessourceLien(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handlePublishRessource}
                disabled={uploadingRessource || (!ressourceMessage.trim() && ressourceFiles.length === 0 && !ressourceLien.trim())}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                {uploadingRessource ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publication...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Publier
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowRessourceForm(false);
                  setRessourceMessage("");
                  setRessourceLien("");
                  setRessourceFiles([]);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Partagez des fichiers, liens ou consignes avec tous les apprenants de la session.
          </p>
        )}
      </div>

      {/* Modal de message - Correction 524 */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {messageTarget === "all"
                    ? "Message à tous les apprenants"
                    : `Message à ${(messageTarget as ApprenantSuivi)?.prenom} ${(messageTarget as ApprenantSuivi)?.nom}`
                  }
                </h3>
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    setMessageTarget(null);
                    setMessageContent("");
                    setMessageSujet("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sujet (optionnel)
                  </label>
                  <input
                    type="text"
                    value={messageSujet}
                    onChange={(e) => setMessageSujet(e.target.value)}
                    placeholder="Sujet du message..."
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message *
                  </label>
                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Votre message..."
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    rows={5}
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !messageContent.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {sendingMessage ? (
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
                  <button
                    onClick={() => {
                      setShowMessageModal(false);
                      setMessageTarget(null);
                      setMessageContent("");
                      setMessageSujet("");
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
