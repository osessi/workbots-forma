"use client";

// ===========================================
// PAGE SUPER ADMIN - Paramètres emailing
// ===========================================

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Settings, Globe, Mail, Shield, RefreshCw,
  Check, AlertTriangle, Server, Key, Clock, Zap
} from "lucide-react";

interface SettingsData {
  smtp: {
    id: string;
    provider: string;
    fromEmail: string;
    fromName: string;
    replyTo: string | null;
    isVerified: boolean;
    isActive: boolean;
  } | null;
  domains: Array<{
    id: string;
    domain: string;
    status: string;
    dkimVerified: boolean;
    spfVerified: boolean;
    dmarcVerified: boolean;
  }>;
  limits: {
    emailsPerDay: number;
    emailsPerHour: number;
    contactsPerAudience: number;
    campaignsPerMonth: number;
  };
  features: {
    customSmtp: boolean;
    customDomain: boolean;
    abTesting: boolean;
    sequences: boolean;
    webhooks: boolean;
  };
}

export default function AdminEmailingSettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingSmtp, setTestingSmtp] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/emailing/settings");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const testSmtp = async () => {
    try {
      setTestingSmtp(true);
      const res = await fetch("/api/emailing/settings/smtp?action=test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "RESEND" }),
      });
      const result = await res.json();
      if (result.success) {
        alert("Email de test envoyé avec succès !");
      } else {
        alert(result.error || "Échec du test");
      }
    } catch (error) {
      alert("Erreur lors du test");
    } finally {
      setTestingSmtp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/emailing"
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-gray-500" />
            Paramètres Emailing
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Configuration globale du système d&apos;emailing
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SMTP / Resend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
              <Mail className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Service d&apos;envoi
              </h3>
              <p className="text-sm text-gray-500">Configuration Resend</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Provider</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {data?.smtp?.provider || "Resend"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Email expéditeur</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {data?.smtp?.fromEmail || "noreply@workbots.fr"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Nom expéditeur</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {data?.smtp?.fromName || "WORKBOTS Formation"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Statut</span>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                data?.smtp?.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}>
                {data?.smtp?.isActive ? (
                  <>
                    <Check className="w-3 h-3" />
                    Actif
                  </>
                ) : (
                  "Inactif"
                )}
              </span>
            </div>
          </div>

          <button
            onClick={testSmtp}
            disabled={testingSmtp}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {testingSmtp ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            Envoyer un email de test
          </button>
        </div>

        {/* Domaines */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <Globe className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Domaines
                </h3>
                <p className="text-sm text-gray-500">Domaines d&apos;envoi vérifiés</p>
              </div>
            </div>
            <Link
              href="/admin/emailing/domains"
              className="text-sm text-brand-600 hover:underline"
            >
              Gérer
            </Link>
          </div>

          {data?.domains && data.domains.length > 0 ? (
            <div className="space-y-2">
              {data.domains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {domain.domain}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs ${domain.dkimVerified ? "text-green-600" : "text-gray-400"}`}>
                        DKIM {domain.dkimVerified ? "✓" : "✗"}
                      </span>
                      <span className={`text-xs ${domain.spfVerified ? "text-green-600" : "text-gray-400"}`}>
                        SPF {domain.spfVerified ? "✓" : "✗"}
                      </span>
                      <span className={`text-xs ${domain.dmarcVerified ? "text-green-600" : "text-gray-400"}`}>
                        DMARC {domain.dmarcVerified ? "✓" : "✗"}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    domain.status === "VERIFIED"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {domain.status === "VERIFIED" ? "Vérifié" : "En attente"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Globe className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>Aucun domaine configuré</p>
              <Link
                href="/admin/emailing/domains"
                className="text-sm text-brand-600 hover:underline mt-2 inline-block"
              >
                Ajouter un domaine
              </Link>
            </div>
          )}
        </div>

        {/* Limites */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Limites
              </h3>
              <p className="text-sm text-gray-500">Restrictions de la plateforme</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Emails / heure</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {data?.limits.emailsPerHour.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Emails / jour</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {data?.limits.emailsPerDay.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Contacts / audience</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {data?.limits.contactsPerAudience.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Campagnes / mois</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {data?.limits.campaignsPerMonth.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Fonctionnalités */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Fonctionnalités
              </h3>
              <p className="text-sm text-gray-500">Options disponibles</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { key: "customSmtp", label: "SMTP personnalisé", enabled: data?.features.customSmtp },
              { key: "customDomain", label: "Domaine personnalisé", enabled: data?.features.customDomain },
              { key: "abTesting", label: "A/B Testing", enabled: data?.features.abTesting },
              { key: "sequences", label: "Séquences (drip)", enabled: data?.features.sequences },
              { key: "webhooks", label: "Webhooks", enabled: data?.features.webhooks },
            ].map((feature) => (
              <div
                key={feature.key}
                className="flex items-center justify-between py-2"
              >
                <span className="text-gray-600 dark:text-gray-400">{feature.label}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  feature.enabled
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}>
                  {feature.enabled ? (
                    <>
                      <Check className="w-3 h-3" />
                      Activé
                    </>
                  ) : (
                    "Désactivé"
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Webhooks Resend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Key className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Configuration Webhooks
            </h3>
            <p className="text-sm text-gray-500">Endpoint pour les événements Resend</p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            URL Webhook à configurer dans Resend :
          </p>
          <code className="block p-3 bg-gray-900 text-green-400 rounded text-sm overflow-x-auto">
            {typeof window !== "undefined" ? window.location.origin : "https://app.workbots.fr"}/api/webhooks/resend
          </code>
          <p className="text-xs text-gray-500 mt-2">
            Événements supportés : email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note :</strong> Ces paramètres sont globaux et s&apos;appliquent à toutes les organisations.
          Les organisations peuvent personnaliser certains paramètres (SMTP, domaine) si activé.
        </p>
      </div>
    </div>
  );
}
