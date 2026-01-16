"use client";

// ===========================================
// PAGE EMAILS - Hub principal emailing utilisateur
// ===========================================
// Navigation vers: Composer, Historique, Templates, Newsletter

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail, Send, History, FileText, Newspaper, BarChart3,
  TrendingUp, Users, Eye, MousePointer, RefreshCw,
  ArrowRight, Plus, Clock
} from "lucide-react";

interface DashboardStats {
  overview: {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  };
  recentEmails: Array<{
    id: string;
    toEmail: string;
    toName: string | null;
    subject: string;
    type: string;
    status: string;
    sentAt: string;
  }>;
}

export default function EmailsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/emailing/dashboard?period=30d");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Erreur fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const modules = [
    {
      title: "Composer un email",
      description: "Rédigez et envoyez un email en quelques clics", // Correction 541
      href: "/emails/compose",
      icon: Send,
      color: "bg-brand-500",
      action: "Composer",
    },
    {
      title: "Historique",
      description: "Consulter tous les emails envoyés (traçabilité Qualiopi)",
      href: "/emails/historique",
      icon: History,
      color: "bg-blue-500",
      action: "Voir",
    },
    {
      title: "Templates",
      description: "Gérer vos modèles d'emails personnalisés",
      href: "/emails/templates",
      icon: FileText,
      color: "bg-purple-500",
      action: "Gérer",
    },
    {
      title: "Newsletter",
      description: "Envoyer des newsletters à vos apprenants",
      href: "/emails/newsletter",
      icon: Newspaper,
      color: "bg-green-500",
      action: "Créer",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Mail className="w-7 h-7 text-brand-600" />
              Emailing
            </h1>
            {/* Correction 539: Sous-titre reformulé */}
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Envoyez et suivez vos emails depuis la plateforme, en toute simplicité.
            </p>
          </div>
          <Link
            href="/emails/compose"
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvel email
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Emails envoyés</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {loading ? "-" : stats?.overview?.totalSent?.toLocaleString() || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">30 derniers jours</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                {/* Correction 540: Libellé renommé */}
                <p className="text-sm text-gray-500 dark:text-gray-400">Taux de délivrabilité</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {loading ? "-" : `${stats?.overview?.deliveryRate || 0}%`}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {loading ? "-" : `${stats?.overview?.totalDelivered?.toLocaleString() || 0} délivrés`}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Taux d&apos;ouverture</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {loading ? "-" : `${stats?.overview?.openRate || 0}%`}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {loading ? "-" : `${stats?.overview?.totalOpened?.toLocaleString() || 0} ouverts`}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Taux de clic</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {loading ? "-" : `${stats?.overview?.clickRate || 0}%`}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <MousePointer className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {loading ? "-" : `${stats?.overview?.totalClicked?.toLocaleString() || 0} clics`}
            </p>
          </div>
        </div>

        {/* Modules */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Modules email
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className="group bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-lg transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl ${module.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {module.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {module.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400 group-hover:gap-2 transition-all">
                    {module.action}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Derniers emails */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
{/* Correction 542: Titre renommé */}
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Historique des envois
            </h2>
            <Link
              href="/emails/historique"
              className="text-sm text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              Voir tout
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : stats?.recentEmails && stats.recentEmails.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {stats.recentEmails.slice(0, 5).map((email) => (
                <div
                  key={email.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {email.subject}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      À : {email.toName || email.toEmail}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        email.status === "DELIVERED"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : email.status === "OPENED"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          : email.status === "BOUNCED"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                    >
                      {email.status === "DELIVERED" && "Délivré"}
                      {email.status === "OPENED" && "Ouvert"}
                      {email.status === "SENT" && "Envoyé"}
                      {email.status === "BOUNCED" && "Rebond"}
                      {!["DELIVERED", "OPENED", "SENT", "BOUNCED"].includes(email.status) && email.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(email.sentAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Mail className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Aucun email envoyé récemment</p>
              <Link
                href="/emails/compose"
                className="mt-4 text-sm text-brand-600 dark:text-brand-400 hover:underline"
              >
                Envoyer votre premier email
              </Link>
            </div>
          )}
        </div>

        {/* Info Qualiopi */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Traçabilité Qualiopi :</strong> Tous les emails envoyés depuis la plateforme sont automatiquement
            archivés et horodatés pour garantir la conformité lors des audits.
          </p>
        </div>
      </div>
    </div>
  );
}
