"use client";

// ===========================================
// PAGE DEV - VISUALISATION EMAILS
// ===========================================
// Page pour voir les emails envoyés en développement

import { useEffect, useState, useCallback } from "react";
import { Mail, RefreshCw, Eye, Clock, User, Building2, X, Inbox, AlertTriangle, Trash2, Key, FileSignature, UserPlus, Bell, FileText, Filter } from "lucide-react";

interface DevEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  sentAt: string;
  organizationId?: string;
  type?: string;
}

interface PreInscription {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  statut: string;
  createdAt: string;
  formation: { titre: string };
  organization: { name: string; nomCommercial?: string };
}

// Configuration des types d'emails
const EMAIL_TYPES = {
  VERIFICATION_CODE: { label: "Code vérification", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Key },
  SIGNATURE_INVITATION: { label: "Invitation signature", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: FileSignature },
  INVITATION_APPRENANT: { label: "Invitation apprenant", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: UserPlus },
  PRE_INSCRIPTION: { label: "Pré-inscription", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: User },
  NOTIFICATION_ADMIN: { label: "Notification admin", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: Bell },
  DOCUMENT: { label: "Document", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400", icon: FileText },
  OTHER: { label: "Autre", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400", icon: Mail },
};

export default function DevEmailsPage() {
  const [emails, setEmails] = useState<DevEmail[]>([]);
  const [preInscriptions, setPreInscriptions] = useState<PreInscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<DevEmail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dev/emails");
      if (!res.ok) {
        if (res.status === 403) {
          setError("Cette page n'est pas disponible en production");
          return;
        }
        throw new Error("Erreur lors du chargement");
      }
      const data = await res.json();
      setEmails(data.emails || []);
      setPreInscriptions(data.recentPreInscriptions || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
    // Rafraîchir toutes les 10 secondes
    const interval = setInterval(fetchEmails, 10000);
    return () => clearInterval(interval);
  }, [fetchEmails]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NOUVELLE":
        return "bg-blue-100 text-blue-700";
      case "EN_TRAITEMENT":
        return "bg-yellow-100 text-yellow-700";
      case "ACCEPTEE":
        return "bg-green-100 text-green-700";
      case "REFUSEE":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const clearAllEmails = async () => {
    try {
      const res = await fetch("/api/dev/emails", { method: "DELETE" });
      if (res.ok) {
        setEmails([]);
        setSelectedEmail(null);
      }
    } catch (err) {
      console.error("Erreur suppression emails:", err);
    }
  };

  const getEmailTypeConfig = (type?: string) => {
    return EMAIL_TYPES[type as keyof typeof EMAIL_TYPES] || EMAIL_TYPES.OTHER;
  };

  const filteredEmails = filterType
    ? emails.filter(e => e.type === filterType)
    : emails;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Accès restreint
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Mail className="w-7 h-7 text-brand-600" />
              Dev Email Viewer
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Visualisez les emails envoyés en développement
            </p>
          </div>
          <div className="flex items-center gap-2">
            {emails.length > 0 && (
              <button
                onClick={clearAllEmails}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors dark:bg-red-900/30 dark:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
                Effacer tout
              </button>
            )}
            <button
              onClick={fetchEmails}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Rafraîchir
            </button>
          </div>
        </div>

        {/* Filtres par type */}
        {emails.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setFilterType(null)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !filterType
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Tous ({emails.length})
            </button>
            {Object.entries(EMAIL_TYPES).map(([key, config]) => {
              const count = emails.filter(e => e.type === key).length;
              if (count === 0) return null;
              const IconComponent = config.icon;
              return (
                <button
                  key={key}
                  onClick={() => setFilterType(filterType === key ? null : key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filterType === key
                      ? "bg-brand-600 text-white"
                      : `${config.color} hover:opacity-80`
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  {config.label} ({count})
                </button>
              );
            })}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Colonne Emails */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Inbox className="w-5 h-5" />
                Emails envoyés ({filteredEmails.length}{filterType ? ` / ${emails.length}` : ""})
              </h2>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
              {filteredEmails.length === 0 ? (
                <div className="p-8 text-center">
                  <Mail className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun email envoyé pour le moment
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Les emails apparaîtront ici quand ils seront envoyés
                  </p>
                </div>
              ) : (
                filteredEmails.map((email) => {
                  const typeConfig = getEmailTypeConfig(email.type);
                  const IconComponent = typeConfig.icon;
                  return (
                    <button
                      key={email.id}
                      onClick={() => setSelectedEmail(email)}
                      className={`w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        selectedEmail?.id === email.id ? "bg-brand-50 dark:bg-brand-900/20" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeConfig.color}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${typeConfig.color}`}>
                              {typeConfig.label}
                            </span>
                          </div>
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {email.subject}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            À: {email.to}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(email.sentAt)}
                          </p>
                        </div>
                        <Eye className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Colonne Pré-inscriptions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Dernières pré-inscriptions ({preInscriptions.length})
              </h2>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
              {preInscriptions.length === 0 ? (
                <div className="p-8 text-center">
                  <User className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucune pré-inscription
                  </p>
                </div>
              ) : (
                preInscriptions.map((pi) => (
                  <div key={pi.id} className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {pi.prenom} {pi.nom}
                          </p>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                              pi.statut
                            )}`}
                          >
                            {pi.statut}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {pi.email}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {pi.formation.titre}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(pi.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> Cette page est uniquement disponible en mode développement.
            Les emails sont stockés en mémoire et seront effacés au redémarrage du serveur.
            Pour un environnement de test plus robuste, configurez Mailhog ou un service similaire.
          </p>
        </div>
      </div>

      {/* Modal de visualisation email */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {selectedEmail.subject}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  À: {selectedEmail.to}
                </p>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <iframe
                srcDoc={selectedEmail.html}
                className="w-full h-full min-h-[500px] border-0"
                title="Email preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
