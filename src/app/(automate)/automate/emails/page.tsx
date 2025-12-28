"use client";

// ===========================================
// PAGE EMAILS - Historique des emails envoyés
// ===========================================
// Traçabilité Qualiopi - Tous les emails envoyés

import { useEffect, useState, useCallback } from "react";
import {
  Mail, Search, Filter, RefreshCw, Eye, X, Clock, User, CheckCircle,
  XCircle, AlertTriangle, Send, Key, FileSignature, UserPlus, Bell,
  FileText, Calendar, ChevronLeft, ChevronRight, Download
} from "lucide-react";

// Types
interface SentEmail {
  id: string;
  toEmail: string;
  toName: string | null;
  subject: string;
  type: string;
  status: string;
  sentAt: string;
  resendId: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  attachments: Array<{ filename: string; size: number }> | null;
  apprenantId: string | null;
  sessionId: string | null;
  formationId: string | null;
  preInscriptionId: string | null;
  sentBySystem: boolean;
  errorMessage: string | null;
}

interface EmailDetail extends SentEmail {
  htmlContent: string;
  textContent: string | null;
  ccEmails: string[];
  bccEmails: string[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Stats {
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  total: number;
}

// Configuration des types d'emails
const EMAIL_TYPES = {
  VERIFICATION_CODE: { label: "Code vérification", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Key },
  SIGNATURE_INVITATION: { label: "Invitation signature", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: FileSignature },
  INVITATION_APPRENANT: { label: "Invitation apprenant", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: UserPlus },
  PRE_INSCRIPTION: { label: "Pré-inscription", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: User },
  NOTIFICATION_ADMIN: { label: "Notification admin", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: Bell },
  CONVOCATION: { label: "Convocation", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", icon: Calendar },
  ATTESTATION: { label: "Attestation", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400", icon: FileText },
  CONVENTION: { label: "Convention", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400", icon: FileText },
  DOCUMENT: { label: "Document", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400", icon: FileText },
  RAPPEL: { label: "Rappel", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: Bell },
  OTHER: { label: "Autre", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400", icon: Mail },
};

const STATUS_CONFIG = {
  SENT: { label: "Envoyé", color: "bg-blue-100 text-blue-700", icon: Send },
  DELIVERED: { label: "Délivré", color: "bg-green-100 text-green-700", icon: CheckCircle },
  OPENED: { label: "Ouvert", color: "bg-emerald-100 text-emerald-700", icon: Eye },
  CLICKED: { label: "Cliqué", color: "bg-teal-100 text-teal-700", icon: CheckCircle },
  BOUNCED: { label: "Rebond", color: "bg-yellow-100 text-yellow-700", icon: AlertTriangle },
  FAILED: { label: "Échec", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function EmailsPage() {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [stats, setStats] = useState<Stats>({ byType: {}, byStatus: {}, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Fetch emails
  const fetchEmails = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "50");
      if (search) params.set("search", search);
      if (filterType) params.set("type", filterType);
      if (filterStatus) params.set("status", filterStatus);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/emails?${params.toString()}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      }

      setEmails(data.emails || []);
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
      setStats(data.stats || { byType: {}, byStatus: {}, total: 0 });
    } catch (err) {
      console.error("Erreur fetch emails:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du chargement");
      setEmails([]);
      setPagination({ page: 1, limit: 50, total: 0, totalPages: 0 });
      setStats({ byType: {}, byStatus: {}, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [search, filterType, filterStatus, dateFrom, dateTo]);

  // Fetch email detail
  const fetchEmailDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      const res = await fetch(`/api/emails/${id}`);
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data = await res.json();
      setSelectedEmail(data.email);
    } catch (error) {
      console.error("Erreur fetch email detail:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Recherche avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmails(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filterType, filterStatus, dateFrom, dateTo, fetchEmails]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeConfig = (type: string) => {
    return EMAIL_TYPES[type as keyof typeof EMAIL_TYPES] || EMAIL_TYPES.OTHER;
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.SENT;
  };

  const clearFilters = () => {
    setSearch("");
    setFilterType(null);
    setFilterStatus(null);
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = search || filterType || filterStatus || dateFrom || dateTo;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Mail className="w-7 h-7 text-brand-600" />
              Historique des emails
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Traçabilité complète des emails envoyés - {stats.total} email{stats.total > 1 ? "s" : ""} au total
            </p>
          </div>
          <button
            onClick={() => fetchEmails(pagination.page)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note :</strong> {error}
            </p>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Recherche */}
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par email, nom ou sujet..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtre type */}
            <select
              value={filterType || ""}
              onChange={(e) => setFilterType(e.target.value || null)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Tous les types</option>
              {Object.entries(EMAIL_TYPES).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            {/* Filtre statut */}
            <select
              value={filterStatus || ""}
              onChange={(e) => setFilterStatus(e.target.value || null)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            {/* Date de début */}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            />

            {/* Date de fin */}
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            />

            {/* Bouton clear */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
                Effacer
              </button>
            )}
          </div>

          {/* Stats par type (filtres rapides) */}
          {Object.keys(stats.byType).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setFilterType(null)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !filterType
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Tous ({stats.total})
              </button>
              {Object.entries(stats.byType).map(([type, count]) => {
                const config = getTypeConfig(type);
                const IconComponent = config.icon;
                return (
                  <button
                    key={type}
                    onClick={() => setFilterType(filterType === type ? null : type)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      filterType === type
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
        </div>

        {/* Liste des emails */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Destinataire
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sujet
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <RefreshCw className="w-8 h-8 text-gray-400 mx-auto animate-spin" />
                      <p className="text-gray-500 mt-2">Chargement...</p>
                    </td>
                  </tr>
                ) : emails.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Mail className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {hasActiveFilters ? "Aucun email ne correspond aux filtres" : "Aucun email envoyé"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  emails.map((email) => {
                    const typeConfig = getTypeConfig(email.type);
                    const statusConfig = getStatusConfig(email.status);
                    const TypeIcon = typeConfig.icon;
                    const StatusIcon = statusConfig.icon;

                    return (
                      <tr
                        key={email.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                        onClick={() => fetchEmailDetail(email.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${typeConfig.color}`}>
                              <TypeIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {email.toName || email.toEmail}
                              </p>
                              {email.toName && (
                                <p className="text-xs text-gray-500">{email.toEmail}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900 dark:text-white truncate max-w-xs">
                            {email.subject}
                          </p>
                          {email.attachments && email.attachments.length > 0 && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Download className="w-3 h-3" />
                              {email.attachments.length} pièce{email.attachments.length > 1 ? "s" : ""} jointe{email.attachments.length > 1 ? "s" : ""}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.color}`}>
                            {typeConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(email.sentAt)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchEmailDetail(email.id);
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500">
                Page {pagination.page} sur {pagination.totalPages} ({pagination.total} résultats)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchEmails(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fetchEmails(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Qualiopi */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Traçabilité Qualiopi :</strong> Tous les emails envoyés depuis la plateforme sont enregistrés ici.
            Cette page permet de retrouver n&apos;importe quel email lors d&apos;un audit (invitations, confirmations, convocations, etc.).
          </p>
        </div>
      </div>

      {/* Modal de visualisation email */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeConfig(selectedEmail.type).color}`}>
                    {getTypeConfig(selectedEmail.type).label}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusConfig(selectedEmail.status).color}`}>
                    {getStatusConfig(selectedEmail.status).label}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {selectedEmail.subject}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  À : {selectedEmail.toName ? `${selectedEmail.toName} <${selectedEmail.toEmail}>` : selectedEmail.toEmail}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Envoyé le {formatDate(selectedEmail.sentAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg ml-4"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {loadingDetail ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
              ) : (
                <iframe
                  srcDoc={selectedEmail.htmlContent}
                  className="w-full h-full min-h-[500px] border-0"
                  title="Email preview"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
