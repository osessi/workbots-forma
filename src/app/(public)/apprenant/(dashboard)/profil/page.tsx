"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Bell,
  BellOff,
} from "lucide-react";

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function ProfilPage() {
  const { apprenant, token, refreshData } = useApprenantPortal();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // État du formulaire
  const [formData, setFormData] = useState({
    nom: apprenant?.nom || "",
    prenom: apprenant?.prenom || "",
    telephone: apprenant?.telephone || "",
    adresse: apprenant?.adresse || "",
  });

  // Correction 568: État pour le toggle newsletter
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/apprenant/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          ...formData,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      await refreshData();
      setSuccess(true);
      setIsEditing(false);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nom: apprenant?.nom || "",
      prenom: apprenant?.prenom || "",
      telephone: apprenant?.telephone || "",
      adresse: apprenant?.adresse || "",
    });
    setIsEditing(false);
    setError(null);
  };

  // Correction 568: Toggle newsletter
  const handleNewsletterToggle = async () => {
    if (!token) return;

    const newConsent = !apprenant?.newsletterConsent;

    setNewsletterLoading(true);
    try {
      const res = await fetch("/api/apprenant/newsletter-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, consent: newConsent }),
      });

      if (res.ok) {
        await refreshData();
        setNewsletterSuccess(true);
        setTimeout(() => setNewsletterSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Erreur toggle newsletter:", err);
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mon profil
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Consultez et modifiez vos informations personnelles
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Modifier
          </button>
        )}
      </div>

      {/* Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl text-green-700 dark:text-green-400"
        >
          <CheckCircle2 className="w-5 h-5" />
          Profil mis à jour avec succès
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-red-700 dark:text-red-400"
        >
          <AlertCircle className="w-5 h-5" />
          {error}
        </motion.div>
      )}

      {/* Profil card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Header avec avatar */}
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {apprenant?.prenom?.[0]?.toUpperCase()}
              {apprenant?.nom?.[0]?.toUpperCase()}
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">
                {apprenant?.prenom} {apprenant?.nom}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {apprenant?.email}
              </p>
              {apprenant?.entreprise && (
                <p className="text-white/60 text-sm mt-0.5">
                  {apprenant.entreprise}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Formulaire / Affichage */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Prénom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prénom
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              ) : (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">
                    {apprenant?.prenom || "—"}
                  </span>
                </div>
              )}
            </div>

            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              ) : (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">
                    {apprenant?.nom || "—"}
                  </span>
                </div>
              )}
            </div>

            {/* Email (non modifiable) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 dark:text-white">
                  {apprenant?.email || "—"}
                </span>
              </div>
              {isEditing && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  L&apos;email ne peut pas être modifié
                </p>
              )}
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Téléphone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleInputChange}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              ) : (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">
                    {apprenant?.telephone || "—"}
                  </span>
                </div>
              )}
            </div>

            {/* Entreprise (non modifiable) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Entreprise
              </label>
              <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 dark:text-white">
                  {apprenant?.entreprise || "—"}
                </span>
              </div>
            </div>

            {/* Adresse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adresse
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleInputChange}
                  placeholder="123 rue de la Formation, 75000 Paris"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              ) : (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">
                    {apprenant?.adresse || "—"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Date d'inscription */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>
                Inscrit le{" "}
                {apprenant?.createdAt
                  ? new Date(apprenant.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
              </span>
            </div>
          </div>

          {/* Actions */}
          {isEditing && (
            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Enregistrer
              </button>
            </div>
          )}
        </form>
      </motion.div>

      {/* Correction 568: Bloc Newsletter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                apprenant?.newsletterConsent
                  ? "bg-brand-100 dark:bg-brand-900/30"
                  : "bg-gray-100 dark:bg-gray-700"
              }`}>
                {apprenant?.newsletterConsent ? (
                  <Bell className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                ) : (
                  <BellOff className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Newsletter
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Recevez les actualités, nouveautés et informations par email
                </p>
              </div>
            </div>

            {/* Toggle */}
            <button
              onClick={handleNewsletterToggle}
              disabled={newsletterLoading}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 ${
                apprenant?.newsletterConsent
                  ? "bg-brand-500"
                  : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              <span className="sr-only">Toggle newsletter</span>
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  apprenant?.newsletterConsent ? "translate-x-5" : "translate-x-0"
                }`}
              >
                {newsletterLoading && (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin absolute top-1 left-1" />
                )}
              </span>
            </button>
          </div>

          {/* État actuel */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {apprenant?.newsletterConsent ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Vous êtes abonné(e) à la newsletter
                  </span>
                </>
              ) : apprenant?.newsletterConsent === false ? (
                <>
                  <X className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Vous n&apos;êtes pas abonné(e) à la newsletter
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-amber-600 dark:text-amber-400">
                    Vous n&apos;avez pas encore fait de choix
                  </span>
                </>
              )}
            </div>

            {apprenant?.newsletterConsentDate && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Choix enregistré le{" "}
                {new Date(apprenant.newsletterConsentDate).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>

          {/* Message de succès */}
          {newsletterSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2 p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg text-green-700 dark:text-green-400 text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Préférences mises à jour avec succès
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
