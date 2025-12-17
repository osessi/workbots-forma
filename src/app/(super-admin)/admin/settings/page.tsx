"use client";
import React, { useState, useEffect } from "react";

interface GlobalSettings {
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  defaultPlan: string;
  maintenanceMode: boolean;
  allowSignup: boolean;
  // Emails
  welcomeEmailSubject: string;
  welcomeEmailBody: string;
  passwordResetEmailSubject: string;
  invitationEmailSubject: string;
  // Textes par défaut
  defaultFormationDescription: string;
  defaultOrganizationName: string;
  // Limites par défaut
  defaultMaxFormateurs: number;
  defaultMaxFormations: number;
  defaultMaxStorage: number; // en GB
  // Services SMTP
  smtpEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpFromEmail: string;
  smtpFromName: string;
  smtpSecure: boolean;
  // Services externes
  resendApiKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  supabaseServiceRoleKey: string;
}

const defaultSettings: GlobalSettings = {
  siteName: "Automate Forma",
  siteDescription: "Plateforme de gestion de formations professionnelles",
  supportEmail: "support@automate-forma.com",
  defaultPlan: "FREE",
  maintenanceMode: false,
  allowSignup: true,
  welcomeEmailSubject: "Bienvenue sur Automate Forma !",
  welcomeEmailBody: "Bonjour {firstName},\n\nBienvenue sur Automate Forma ! Votre compte a été créé avec succès.\n\nCordialement,\nL'équipe Automate Forma",
  passwordResetEmailSubject: "Réinitialisation de votre mot de passe",
  invitationEmailSubject: "Vous êtes invité à rejoindre {organizationName}",
  defaultFormationDescription: "Description de la formation...",
  defaultOrganizationName: "Mon entreprise",
  defaultMaxFormateurs: 3,
  defaultMaxFormations: 10,
  defaultMaxStorage: 1,
  // SMTP defaults
  smtpEnabled: false,
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpPassword: "",
  smtpFromEmail: "",
  smtpFromName: "Automate Forma",
  smtpSecure: true,
  // Services externes defaults
  resendApiKey: "",
  stripeSecretKey: "",
  stripeWebhookSecret: "",
  supabaseServiceRoleKey: "",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "emails" | "defaults" | "limits" | "services">("general");
  const [hasChanges, setHasChanges] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...defaultSettings, ...data });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres:", error);
    }
  };

  const handleChange = (field: keyof GlobalSettings, value: string | number | boolean) => {
    setSettings({ ...settings, [field]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setHasChanges(false);
        alert("Paramètres enregistrés avec succès");
      } else {
        alert("Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "general", label: "Général" },
    { id: "emails", label: "Emails" },
    { id: "defaults", label: "Textes par défaut" },
    { id: "limits", label: "Limites" },
    { id: "services", label: "Services" },
  ];

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const inputClassName = "w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500";
  const labelClassName = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuration</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Param&egrave;tres globaux de la plateforme
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={`px-5 py-2.5 font-medium rounded-xl transition-colors flex items-center gap-2 ${
            hasChanges
              ? "bg-orange-500 hover:bg-orange-600 text-white"
              : "bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enregistrement...
            </>
          ) : (
            "Enregistrer"
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-orange-500 text-orange-500 dark:text-orange-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
        {/* General Tab */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClassName}>Nom du site</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => handleChange("siteName", e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Email de support</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => handleChange("supportEmail", e.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>

            <div>
              <label className={labelClassName}>Description du site</label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => handleChange("siteDescription", e.target.value)}
                className={`${inputClassName} resize-none`}
                rows={3}
              />
            </div>

            <div>
              <label className={labelClassName}>Plan par d&eacute;faut pour les nouvelles organisations</label>
              <select
                value={settings.defaultPlan}
                onChange={(e) => handleChange("defaultPlan", e.target.value)}
                className={inputClassName}
              >
                <option value="FREE">Gratuit</option>
                <option value="STARTER">Starter</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Options</h3>

              <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800/50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Mode maintenance</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    D&eacute;sactive l&apos;acc&egrave;s &agrave; la plateforme pour les utilisateurs
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleChange("maintenanceMode", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:ring-2 peer-focus:ring-orange-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800/50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Autoriser les inscriptions</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Permet aux nouveaux utilisateurs de cr&eacute;er un compte
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowSignup}
                    onChange={(e) => handleChange("allowSignup", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:ring-2 peer-focus:ring-orange-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Emails Tab */}
        {activeTab === "emails" && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                <strong>Variables disponibles :</strong> {"{firstName}"}, {"{lastName}"}, {"{email}"}, {"{organizationName}"}, {"{resetLink}"}
              </p>
            </div>

            <div>
              <label className={labelClassName}>Sujet - Email de bienvenue</label>
              <input
                type="text"
                value={settings.welcomeEmailSubject}
                onChange={(e) => handleChange("welcomeEmailSubject", e.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label className={labelClassName}>Corps - Email de bienvenue</label>
              <textarea
                value={settings.welcomeEmailBody}
                onChange={(e) => handleChange("welcomeEmailBody", e.target.value)}
                className={`${inputClassName} resize-none font-mono text-sm`}
                rows={6}
              />
            </div>

            <div>
              <label className={labelClassName}>Sujet - R&eacute;initialisation mot de passe</label>
              <input
                type="text"
                value={settings.passwordResetEmailSubject}
                onChange={(e) => handleChange("passwordResetEmailSubject", e.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label className={labelClassName}>Sujet - Invitation</label>
              <input
                type="text"
                value={settings.invitationEmailSubject}
                onChange={(e) => handleChange("invitationEmailSubject", e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
        )}

        {/* Defaults Tab */}
        {activeTab === "defaults" && (
          <div className="space-y-6">
            <div>
              <label className={labelClassName}>Nom d&apos;organisation par d&eacute;faut</label>
              <input
                type="text"
                value={settings.defaultOrganizationName}
                onChange={(e) => handleChange("defaultOrganizationName", e.target.value)}
                className={inputClassName}
              />
              <p className="text-xs text-gray-500 mt-1">
                Utilis&eacute; lors de la cr&eacute;ation d&apos;un compte sans organisation
              </p>
            </div>

            <div>
              <label className={labelClassName}>Description de formation par d&eacute;faut</label>
              <textarea
                value={settings.defaultFormationDescription}
                onChange={(e) => handleChange("defaultFormationDescription", e.target.value)}
                className={`${inputClassName} resize-none`}
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                Texte pr&eacute;-rempli lors de la cr&eacute;ation d&apos;une nouvelle formation
              </p>
            </div>
          </div>
        )}

        {/* Limits Tab */}
        {activeTab === "limits" && (
          <div className="space-y-6">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Ces limites s&apos;appliquent par d&eacute;faut aux nouvelles organisations avec le plan gratuit.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelClassName}>Formateurs max</label>
                <input
                  type="number"
                  min="1"
                  value={settings.defaultMaxFormateurs}
                  onChange={(e) => handleChange("defaultMaxFormateurs", parseInt(e.target.value) || 1)}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Formations max</label>
                <input
                  type="number"
                  min="1"
                  value={settings.defaultMaxFormations}
                  onChange={(e) => handleChange("defaultMaxFormations", parseInt(e.target.value) || 1)}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Stockage max (GB)</label>
                <input
                  type="number"
                  min="1"
                  value={settings.defaultMaxStorage}
                  onChange={(e) => handleChange("defaultMaxStorage", parseInt(e.target.value) || 1)}
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Limites par plan</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                      <th className="pb-3 font-medium">Plan</th>
                      <th className="pb-3 font-medium">Formateurs</th>
                      <th className="pb-3 font-medium">Formations</th>
                      <th className="pb-3 font-medium">Stockage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    <tr>
                      <td className="py-3 text-gray-900 dark:text-white">Gratuit</td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">3</td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">10</td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">1 GB</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-gray-900 dark:text-white">Starter</td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">10</td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">50</td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">5 GB</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-gray-900 dark:text-white">Pro</td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">50</td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">200</td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">20 GB</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-gray-900 dark:text-white">Enterprise</td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">Illimit&eacute;</td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">Illimit&eacute;</td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">100 GB</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === "services" && (
          <div className="space-y-8">
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <p className="text-sm text-purple-600 dark:text-purple-400">
                <strong>Priorit&eacute; des configurations :</strong> Les param&egrave;tres ci-dessous ont priorit&eacute; sur les variables d&apos;environnement. Laissez vide pour utiliser les valeurs des variables d&apos;environnement.
              </p>
            </div>

            {/* SMTP Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configuration SMTP</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.smtpEnabled}
                    onChange={(e) => handleChange("smtpEnabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:ring-2 peer-focus:ring-orange-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                    {settings.smtpEnabled ? "Activ\u00e9" : "D\u00e9sactiv\u00e9"}
                  </span>
                </label>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!settings.smtpEnabled ? "opacity-50 pointer-events-none" : ""}`}>
                <div>
                  <label className={labelClassName}>Serveur SMTP</label>
                  <input
                    type="text"
                    value={settings.smtpHost}
                    onChange={(e) => handleChange("smtpHost", e.target.value)}
                    className={inputClassName}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div>
                  <label className={labelClassName}>Port</label>
                  <input
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) => handleChange("smtpPort", parseInt(e.target.value) || 587)}
                    className={inputClassName}
                    placeholder="587"
                  />
                </div>
                <div>
                  <label className={labelClassName}>Utilisateur</label>
                  <input
                    type="text"
                    value={settings.smtpUser}
                    onChange={(e) => handleChange("smtpUser", e.target.value)}
                    className={inputClassName}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className={labelClassName}>Mot de passe</label>
                  <div className="relative">
                    <input
                      type={showPasswords.smtpPassword ? "text" : "password"}
                      value={settings.smtpPassword}
                      onChange={(e) => handleChange("smtpPassword", e.target.value)}
                      className={`${inputClassName} pr-10`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("smtpPassword")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPasswords.smtpPassword ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.5 10C2.5 10 5 4.16667 10 4.16667C15 4.16667 17.5 10 17.5 10C17.5 10 15 15.8333 10 15.8333C5 15.8333 2.5 10 2.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.7667 11.7667C11.5378 12.0123 11.2618 12.2093 10.9551 12.3459C10.6484 12.4826 10.3175 12.556 9.98178 12.562C9.64603 12.5679 9.31262 12.5062 9.00125 12.3805C8.68989 12.2547 8.40706 12.0675 8.16985 11.8302C7.93265 11.593 7.7454 11.3102 7.61963 10.9988C7.49385 10.6875 7.43217 10.354 7.43813 10.0183C7.4441 9.68252 7.51746 9.35165 7.6541 9.04493C7.79074 8.73821 7.98779 8.46221 8.23334 8.23334M14.95 14.95C13.5255 16.0358 11.7909 16.6374 10 16.6667C4.16667 16.6667 0.833336 10 0.833336 10C1.86991 8.06825 3.30762 6.38051 5.05 5.05L14.95 14.95ZM8.25 3.53334C8.82362 3.39907 9.41091 3.33195 10 3.33334C15.8333 3.33334 19.1667 10 19.1667 10C18.6608 10.9463 18.0575 11.8373 17.3667 12.6583L8.25 3.53334Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M0.833336 0.833336L19.1667 19.1667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClassName}>Email exp&eacute;diteur</label>
                  <input
                    type="email"
                    value={settings.smtpFromEmail}
                    onChange={(e) => handleChange("smtpFromEmail", e.target.value)}
                    className={inputClassName}
                    placeholder="noreply@example.com"
                  />
                </div>
                <div>
                  <label className={labelClassName}>Nom exp&eacute;diteur</label>
                  <input
                    type="text"
                    value={settings.smtpFromName}
                    onChange={(e) => handleChange("smtpFromName", e.target.value)}
                    className={inputClassName}
                    placeholder="Automate Forma"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.smtpSecure}
                      onChange={(e) => handleChange("smtpSecure", e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Utiliser TLS/SSL (recommand&eacute;)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800" />

            {/* Resend API */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resend (Alternative SMTP)</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Si configur&eacute;, Resend sera utilis&eacute; pour l&apos;envoi d&apos;emails au lieu du SMTP.
              </p>
              <div>
                <label className={labelClassName}>Cl&eacute; API Resend</label>
                <div className="relative">
                  <input
                    type={showPasswords.resendApiKey ? "text" : "password"}
                    value={settings.resendApiKey}
                    onChange={(e) => handleChange("resendApiKey", e.target.value)}
                    className={`${inputClassName} pr-10`}
                    placeholder="re_..."
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("resendApiKey")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.resendApiKey ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.5 10C2.5 10 5 4.16667 10 4.16667C15 4.16667 17.5 10 17.5 10C17.5 10 15 15.8333 10 15.8333C5 15.8333 2.5 10 2.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.7667 11.7667C11.5378 12.0123 11.2618 12.2093 10.9551 12.3459C10.6484 12.4826 10.3175 12.556 9.98178 12.562C9.64603 12.5679 9.31262 12.5062 9.00125 12.3805C8.68989 12.2547 8.40706 12.0675 8.16985 11.8302C7.93265 11.593 7.7454 11.3102 7.61963 10.9988C7.49385 10.6875 7.43217 10.354 7.43813 10.0183C7.4441 9.68252 7.51746 9.35165 7.6541 9.04493C7.79074 8.73821 7.98779 8.46221 8.23334 8.23334M14.95 14.95C13.5255 16.0358 11.7909 16.6374 10 16.6667C4.16667 16.6667 0.833336 10 0.833336 10C1.86991 8.06825 3.30762 6.38051 5.05 5.05L14.95 14.95ZM8.25 3.53334C8.82362 3.39907 9.41091 3.33195 10 3.33334C15.8333 3.33334 19.1667 10 19.1667 10C18.6608 10.9463 18.0575 11.8373 17.3667 12.6583L8.25 3.53334Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M0.833336 0.833336L19.1667 19.1667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800" />

            {/* Stripe */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stripe (Paiements)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClassName}>Cl&eacute; secr&egrave;te Stripe</label>
                  <div className="relative">
                    <input
                      type={showPasswords.stripeSecretKey ? "text" : "password"}
                      value={settings.stripeSecretKey}
                      onChange={(e) => handleChange("stripeSecretKey", e.target.value)}
                      className={`${inputClassName} pr-10`}
                      placeholder="sk_live_..."
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("stripeSecretKey")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPasswords.stripeSecretKey ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.5 10C2.5 10 5 4.16667 10 4.16667C15 4.16667 17.5 10 17.5 10C17.5 10 15 15.8333 10 15.8333C5 15.8333 2.5 10 2.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.7667 11.7667C11.5378 12.0123 11.2618 12.2093 10.9551 12.3459C10.6484 12.4826 10.3175 12.556 9.98178 12.562C9.64603 12.5679 9.31262 12.5062 9.00125 12.3805C8.68989 12.2547 8.40706 12.0675 8.16985 11.8302C7.93265 11.593 7.7454 11.3102 7.61963 10.9988C7.49385 10.6875 7.43217 10.354 7.43813 10.0183C7.4441 9.68252 7.51746 9.35165 7.6541 9.04493C7.79074 8.73821 7.98779 8.46221 8.23334 8.23334M14.95 14.95C13.5255 16.0358 11.7909 16.6374 10 16.6667C4.16667 16.6667 0.833336 10 0.833336 10C1.86991 8.06825 3.30762 6.38051 5.05 5.05L14.95 14.95ZM8.25 3.53334C8.82362 3.39907 9.41091 3.33195 10 3.33334C15.8333 3.33334 19.1667 10 19.1667 10C18.6608 10.9463 18.0575 11.8373 17.3667 12.6583L8.25 3.53334Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M0.833336 0.833336L19.1667 19.1667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClassName}>Webhook Secret</label>
                  <div className="relative">
                    <input
                      type={showPasswords.stripeWebhookSecret ? "text" : "password"}
                      value={settings.stripeWebhookSecret}
                      onChange={(e) => handleChange("stripeWebhookSecret", e.target.value)}
                      className={`${inputClassName} pr-10`}
                      placeholder="whsec_..."
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("stripeWebhookSecret")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPasswords.stripeWebhookSecret ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.5 10C2.5 10 5 4.16667 10 4.16667C15 4.16667 17.5 10 17.5 10C17.5 10 15 15.8333 10 15.8333C5 15.8333 2.5 10 2.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.7667 11.7667C11.5378 12.0123 11.2618 12.2093 10.9551 12.3459C10.6484 12.4826 10.3175 12.556 9.98178 12.562C9.64603 12.5679 9.31262 12.5062 9.00125 12.3805C8.68989 12.2547 8.40706 12.0675 8.16985 11.8302C7.93265 11.593 7.7454 11.3102 7.61963 10.9988C7.49385 10.6875 7.43217 10.354 7.43813 10.0183C7.4441 9.68252 7.51746 9.35165 7.6541 9.04493C7.79074 8.73821 7.98779 8.46221 8.23334 8.23334M14.95 14.95C13.5255 16.0358 11.7909 16.6374 10 16.6667C4.16667 16.6667 0.833336 10 0.833336 10C1.86991 8.06825 3.30762 6.38051 5.05 5.05L14.95 14.95ZM8.25 3.53334C8.82362 3.39907 9.41091 3.33195 10 3.33334C15.8333 3.33334 19.1667 10 19.1667 10C18.6608 10.9463 18.0575 11.8373 17.3667 12.6583L8.25 3.53334Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M0.833336 0.833336L19.1667 19.1667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800" />

            {/* Supabase */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Supabase</h3>
              <div>
                <label className={labelClassName}>Service Role Key</label>
                <div className="relative">
                  <input
                    type={showPasswords.supabaseServiceRoleKey ? "text" : "password"}
                    value={settings.supabaseServiceRoleKey}
                    onChange={(e) => handleChange("supabaseServiceRoleKey", e.target.value)}
                    className={`${inputClassName} pr-10`}
                    placeholder="eyJ..."
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("supabaseServiceRoleKey")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.supabaseServiceRoleKey ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.5 10C2.5 10 5 4.16667 10 4.16667C15 4.16667 17.5 10 17.5 10C17.5 10 15 15.8333 10 15.8333C5 15.8333 2.5 10 2.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.7667 11.7667C11.5378 12.0123 11.2618 12.2093 10.9551 12.3459C10.6484 12.4826 10.3175 12.556 9.98178 12.562C9.64603 12.5679 9.31262 12.5062 9.00125 12.3805C8.68989 12.2547 8.40706 12.0675 8.16985 11.8302C7.93265 11.593 7.7454 11.3102 7.61963 10.9988C7.49385 10.6875 7.43217 10.354 7.43813 10.0183C7.4441 9.68252 7.51746 9.35165 7.6541 9.04493C7.79074 8.73821 7.98779 8.46221 8.23334 8.23334M14.95 14.95C13.5255 16.0358 11.7909 16.6374 10 16.6667C4.16667 16.6667 0.833336 10 0.833336 10C1.86991 8.06825 3.30762 6.38051 5.05 5.05L14.95 14.95ZM8.25 3.53334C8.82362 3.39907 9.41091 3.33195 10 3.33334C15.8333 3.33334 19.1667 10 19.1667 10C18.6608 10.9463 18.0575 11.8373 17.3667 12.6583L8.25 3.53334Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M0.833336 0.833336L19.1667 19.1667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Utilis&eacute; pour la synchronisation des utilisateurs et les op&eacute;rations admin
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
