"use client";

// ===========================================
// PAGE NOTIFICATIONS - Centre de notifications
// ===========================================
// Messages internes du SaaS vers l'utilisateur

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, RefreshCw, Check, CheckCheck, Trash2, User,
  Calendar, FileText, AlertCircle, CreditCard, Settings,
  ChevronLeft, ChevronRight, Filter, X
} from "lucide-react";

// Types
interface Notification {
  id: string;
  type: string;
  titre: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  resourceType: string | null;
  resourceId: string | null;
  actionUrl: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Configuration des types de notifications
const NOTIFICATION_TYPES = {
  PRE_INSCRIPTION: { label: "Pré-inscription", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: User },
  INSCRIPTION: { label: "Inscription", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: User },
  SESSION_RAPPEL: { label: "Rappel session", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: Calendar },
  FORMATION_MODIFIEE: { label: "Formation modifiée", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: FileText },
  DOCUMENT_GENERE: { label: "Document généré", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400", icon: FileText },
  EVALUATION_COMPLETE: { label: "Évaluation", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", icon: Check },
  PAIEMENT_RECU: { label: "Paiement", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CreditCard },
  SYSTEME: { label: "Système", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400", icon: Settings },
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const fetchNotifications = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      const limit = 50;
      const offset = (page - 1) * limit;
      params.set("offset", offset.toString());
      params.set("limit", limit.toString());
      if (filterUnread) params.set("unread", "true");
      if (filterType) params.set("type", filterType);

      const res = await fetch(`/api/notifications?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur lors du chargement");

      const data = await res.json();
      setNotifications(data.notifications);
      setPagination({
        page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        totalPages: Math.ceil(data.pagination.total / data.pagination.limit),
      });
      setUnreadCount(data.pagination.unread || 0);
    } catch (error) {
      console.error("Erreur fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [filterUnread, filterType]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Marquer comme lu
  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAsRead", notificationIds: [id] }),
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erreur mark as read:", error);
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllAsRead" }),
      });
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Erreur mark all as read:", error);
    }
  };

  // Supprimer notification
  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      const wasUnread = notifications.find(n => n.id === id)?.isRead === false;
      setNotifications(prev => prev.filter(n => n.id !== id));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erreur delete notification:", error);
    }
  };

  // Click sur notification
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getTypeConfig = (type: string) => {
    return NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES] || NOTIFICATION_TYPES.SYSTEME;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Bell className="w-7 h-7 text-brand-600" />
              Notifications
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 text-sm font-medium bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Vos messages et alertes
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Tout marquer comme lu
              </button>
            )}
            <button
              onClick={() => fetchNotifications(pagination.page)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => { setFilterUnread(false); setFilterType(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              !filterUnread && !filterType
                ? "bg-brand-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            }`}
          >
            <Filter className="w-4 h-4" />
            Toutes
          </button>
          <button
            onClick={() => setFilterUnread(!filterUnread)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              filterUnread
                ? "bg-brand-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Non lues ({unreadCount})
          </button>

          {filterType && (
            <button
              onClick={() => setFilterType(null)}
              className="flex items-center gap-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
              {getTypeConfig(filterType).label}
            </button>
          )}
        </div>

        {/* Liste des notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 mx-auto animate-spin" />
              <p className="text-gray-500 mt-2">Chargement...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucune notification
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {filterUnread ? "Vous n'avez pas de notification non lue" : "Vous n'avez pas encore de notification"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {notifications.map((notification) => {
                const typeConfig = getTypeConfig(notification.type);
                const TypeIcon = typeConfig.icon;

                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                      !notification.isRead ? "bg-brand-50/50 dark:bg-brand-900/10" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Indicateur non lu */}
                    <div className="flex-shrink-0 mt-1">
                      {!notification.isRead ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-600" />
                      ) : (
                        <div className="w-2.5 h-2.5" />
                      )}
                    </div>

                    {/* Icône */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeConfig.color}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      <h4 className={`font-medium mb-1 ${!notification.isRead ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                        {notification.titre}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {notification.message}
                      </p>
                      {notification.actionUrl && (
                        <p className="text-xs text-brand-600 mt-2 hover:underline">
                          Voir les détails →
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Marquer comme lu"
                        >
                          <Check className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500">
                Page {pagination.page} sur {pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchNotifications(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fetchNotifications(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
