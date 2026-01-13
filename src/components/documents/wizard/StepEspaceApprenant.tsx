"use client";
// ===========================================
// Correction 433a: Étape "Espace apprenant" du wizard
// Permet de gérer les accès et invitations des apprenants
// ===========================================

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Mail,
  ExternalLink,
  Loader2,
  Check,
  Clock,
  AlertCircle,
  Building2,
  User,
  UserCircle,
  GraduationCap,
  Send,
  RefreshCw,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SessionClient, Apprenant, Intervenant } from "./types";

interface InvitationStatus {
  apprenantId: string;
  lastSentAt: string | null;
  expiresAt: string | null;
  status: "non_envoye" | "envoye" | "expire" | "active";
  history: Array<{
    sentAt: string;
    expiresAt: string;
    usedAt: string | null;
  }>;
}

interface StepEspaceApprenantProps {
  clients: SessionClient[];
  formateurs: {
    formateurPrincipalId: string | null;
    formateurPrincipal?: Intervenant | null;
    coformateursIds: string[];
    coformateurs: Intervenant[];
  };
  sessionId: string | null;
  formationTitre: string;
  onPrev: () => void;
}

// Labels pour les types de clients
const clientTypeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  ENTREPRISE: {
    label: "Salarié",
    icon: <Building2 size={14} />,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  INDEPENDANT: {
    label: "Indépendant",
    icon: <User size={14} />,
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  PARTICULIER: {
    label: "Particulier",
    icon: <UserCircle size={14} />,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
};

// Statut des invitations
const invitationStatusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  non_envoye: {
    label: "Non invité",
    color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    icon: <Clock size={14} />,
  },
  envoye: {
    label: "Invitation envoyée",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: <Mail size={14} />,
  },
  expire: {
    label: "Invitation expirée",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: <AlertCircle size={14} />,
  },
  active: {
    label: "Accès activé",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: <Check size={14} />,
  },
};

export default function StepEspaceApprenant({
  clients,
  formateurs,
  sessionId,
  formationTitre,
  onPrev,
}: StepEspaceApprenantProps) {
  const [invitationStatuses, setInvitationStatuses] = useState<Record<string, InvitationStatus>>({});
  const [loading, setLoading] = useState(true);
  const [sendingInvitation, setSendingInvitation] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  // Extraire tous les apprenants des clients
  const allApprenants: Array<{ apprenant: Apprenant; clientType: string; entrepriseNom?: string }> = [];

  clients.forEach((client) => {
    if (client.type === "ENTREPRISE" && client.apprenants) {
      client.apprenants.forEach((apprenant) => {
        allApprenants.push({
          apprenant,
          clientType: "ENTREPRISE",
          entrepriseNom: client.entreprise?.raisonSociale,
        });
      });
    } else if ((client.type === "INDEPENDANT" || client.type === "PARTICULIER") && client.apprenant) {
      allApprenants.push({
        apprenant: client.apprenant,
        clientType: client.type,
      });
    }
  });

  // Charger les statuts des invitations
  const fetchInvitationStatuses = useCallback(async () => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/sessions/${sessionId}/invitations`);
      if (res.ok) {
        const data = await res.json();
        const statusMap: Record<string, InvitationStatus> = {};
        data.invitations?.forEach((inv: InvitationStatus) => {
          statusMap[inv.apprenantId] = inv;
        });
        setInvitationStatuses(statusMap);
      }
    } catch (error) {
      console.error("Erreur chargement statuts invitations:", error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchInvitationStatuses();
  }, [fetchInvitationStatuses]);

  // Envoyer une invitation
  const handleSendInvitation = async (apprenantId: string) => {
    if (!sessionId) return;

    try {
      setSendingInvitation(apprenantId);
      const res = await fetch(`/api/sessions/${sessionId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apprenantId, type: "apprenant" }),
      });

      if (res.ok) {
        // Rafraîchir les statuts
        await fetchInvitationStatuses();
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de l'envoi de l'invitation");
      }
    } catch (error) {
      console.error("Erreur envoi invitation:", error);
      alert("Erreur lors de l'envoi de l'invitation");
    } finally {
      setSendingInvitation(null);
    }
  };

  // Envoyer toutes les invitations
  const handleSendAllInvitations = async () => {
    if (!sessionId) return;

    const nonInvites = allApprenants.filter((a) => {
      const status = invitationStatuses[a.apprenant.id];
      return !status || status.status === "non_envoye" || status.status === "expire";
    });

    for (const { apprenant } of nonInvites) {
      await handleSendInvitation(apprenant.id);
    }
  };

  // Formater la date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Obtenir le statut d'invitation d'un apprenant
  const getInvitationStatus = (apprenantId: string): InvitationStatus => {
    return invitationStatuses[apprenantId] || {
      apprenantId,
      lastSentAt: null,
      expiresAt: null,
      status: "non_envoye",
      history: [],
    };
  };

  // Correction 433a: État pour l'accès admin en cours
  const [openingEspace, setOpeningEspace] = useState<string | null>(null);

  // Correction 433a: Ouvrir l'espace apprenant en mode admin (impersonation)
  const handleOpenEspaceApprenant = async (apprenantId: string) => {
    setOpeningEspace(apprenantId);
    try {
      const res = await fetch("/api/apprenant/admin-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apprenantId }),
      });

      if (res.ok) {
        const data = await res.json();
        // Ouvrir l'espace apprenant avec le token admin dans un nouvel onglet
        window.open(data.redirectUrl, "_blank");
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de l'accès à l'espace apprenant");
      }
    } catch (error) {
      console.error("Erreur accès espace apprenant:", error);
      alert("Erreur lors de l'accès à l'espace apprenant");
    } finally {
      setOpeningEspace(null);
    }
  };

  // Compter les statistiques
  const stats = {
    total: allApprenants.length,
    nonInvites: allApprenants.filter((a) => getInvitationStatus(a.apprenant.id).status === "non_envoye").length,
    envoyes: allApprenants.filter((a) => getInvitationStatus(a.apprenant.id).status === "envoye").length,
    expires: allApprenants.filter((a) => getInvitationStatus(a.apprenant.id).status === "expire").length,
    actifs: allApprenants.filter((a) => getInvitationStatus(a.apprenant.id).status === "active").length,
  };

  return (
    <div className="space-y-6">
      {/* Header avec description */}
      <div className="bg-gradient-to-r from-brand-50 to-teal-50 dark:from-brand-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-brand-100 dark:border-brand-800">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-brand-500 rounded-lg">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              Gestion des accès apprenants
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Envoyez les invitations d'accès à l'espace apprenant pour la formation "{formationTitre}".
              Chaque apprenant recevra un email avec un lien d'accès personnalisé.
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border dark:border-gray-700 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border dark:border-gray-700 text-center">
          <div className="text-2xl font-bold text-gray-600">{stats.nonInvites}</div>
          <div className="text-xs text-gray-500">Non invités</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800 text-center">
          <div className="text-2xl font-bold text-amber-600">{stats.envoyes}</div>
          <div className="text-xs text-amber-600">En attente</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.expires}</div>
          <div className="text-xs text-red-600">Expirés</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.actifs}</div>
          <div className="text-xs text-green-600">Actifs</div>
        </div>
      </div>

      {/* Action globale */}
      {stats.nonInvites + stats.expires > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSendAllInvitations}
            disabled={!sessionId || sendingInvitation !== null}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            <Send size={16} />
            Envoyer toutes les invitations ({stats.nonInvites + stats.expires})
          </button>
        </div>
      )}

      {/* Section Formateurs */}
      {(formateurs.formateurPrincipal || formateurs.coformateurs.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-brand-500" />
              <h4 className="font-medium text-gray-900 dark:text-white">Équipe pédagogique</h4>
            </div>
          </div>
          <div className="divide-y dark:divide-gray-700">
            {formateurs.formateurPrincipal && (
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center">
                    <GraduationCap size={20} className="text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formateurs.formateurPrincipal.prenom} {formateurs.formateurPrincipal.nom}
                    </div>
                    <div className="text-sm text-gray-500">
                      Formateur principal • {formateurs.formateurPrincipal.email}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                  Formateur
                </span>
              </div>
            )}
            {formateurs.coformateurs.map((coformateur) => (
              <div key={coformateur.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
                    <User size={20} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {coformateur.prenom} {coformateur.nom}
                    </div>
                    <div className="text-sm text-gray-500">
                      Co-formateur • {coformateur.email}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  Co-formateur
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste des apprenants */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-brand-500" />
              <h4 className="font-medium text-gray-900 dark:text-white">Apprenants inscrits</h4>
              <span className="text-sm text-gray-500">({allApprenants.length})</span>
            </div>
            <button
              onClick={fetchInvitationStatuses}
              disabled={loading}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw size={16} className={`text-gray-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : allApprenants.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Aucun apprenant inscrit pour cette session.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Ajoutez des apprenants dans l'étape "Clients & Participants".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Apprenant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entreprise
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut invitation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière invitation
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {allApprenants.map(({ apprenant, clientType, entrepriseNom }) => {
                  const invStatus = getInvitationStatus(apprenant.id);
                  const statusConfig = invitationStatusConfig[invStatus.status];
                  const typeConfig = clientTypeLabels[clientType];
                  const isExpanded = expandedHistory === apprenant.id;

                  return (
                    <React.Fragment key={apprenant.id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {apprenant.prenom[0]}{apprenant.nom[0]}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {apprenant.prenom} {apprenant.nom}
                              </div>
                              <div className="text-sm text-gray-500">{apprenant.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {entrepriseNom ? (
                            <span className="text-sm text-gray-700 dark:text-gray-300">{entrepriseNom}</span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
                            {typeConfig.icon}
                            {typeConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-500">
                            {formatDate(invStatus.lastSentAt)}
                          </div>
                          {invStatus.history.length > 0 && (
                            <button
                              onClick={() => setExpandedHistory(isExpanded ? null : apprenant.id)}
                              className="flex items-center gap-1 text-xs text-brand-500 hover:underline mt-1"
                            >
                              <History size={12} />
                              {invStatus.history.length} envoi(s)
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Correction 433a: Bouton pour accéder à l'espace apprenant en mode admin */}
                            <button
                              onClick={() => handleOpenEspaceApprenant(apprenant.id)}
                              disabled={openingEspace === apprenant.id}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                              title="Accéder à l'espace apprenant"
                            >
                              {openingEspace === apprenant.id ? (
                                <Loader2 size={16} className="animate-spin text-gray-500" />
                              ) : (
                                <ExternalLink size={16} className="text-gray-500" />
                              )}
                            </button>
                            <button
                              onClick={() => handleSendInvitation(apprenant.id)}
                              disabled={sendingInvitation === apprenant.id || !sessionId}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                invStatus.status === "non_envoye" || invStatus.status === "expire"
                                  ? "bg-brand-500 text-white hover:bg-brand-600"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                              } disabled:opacity-50`}
                              title={invStatus.status === "non_envoye" ? "Envoyer l'invitation" : "Renvoyer l'invitation"}
                            >
                              {sendingInvitation === apprenant.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Mail size={14} />
                              )}
                              {invStatus.status === "non_envoye" ? "Inviter" : "Renvoyer"}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Historique des invitations */}
                      {isExpanded && invStatus.history.length > 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-2 bg-gray-50 dark:bg-gray-900">
                            <div className="ml-12 space-y-2">
                              <div className="text-xs font-medium text-gray-500 uppercase">
                                Historique des invitations
                              </div>
                              {invStatus.history.map((h, i) => (
                                <div key={i} className="flex items-center gap-4 text-sm">
                                  <span className="text-gray-500">{formatDate(h.sentAt)}</span>
                                  <span className="text-gray-400">→</span>
                                  <span className="text-gray-500">Expire le {formatDate(h.expiresAt)}</span>
                                  {h.usedAt && (
                                    <>
                                      <span className="text-gray-400">→</span>
                                      <span className="text-green-600 flex items-center gap-1">
                                        <Check size={12} />
                                        Utilisé le {formatDate(h.usedAt)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t dark:border-gray-700">
        <button
          onClick={onPrev}
          className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          ← Retour
        </button>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <Check size={16} className="text-green-500" />
          Configuration de la session terminée
        </div>
      </div>
    </div>
  );
}
