"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRequireIntervenantAuth, useIntervenantPortal } from "@/context/IntervenantPortalContext";
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Edit2,
  Save,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Tag,
  LogOut,
  CheckCircle,
} from "lucide-react";

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function IntervenantProfilPage() {
  useRequireIntervenantAuth();
  const { intervenant, token, refreshData, isLoading, logout } = useIntervenantPortal();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // État du formulaire
  const [formData, setFormData] = useState({
    nom: intervenant?.nom || "",
    prenom: intervenant?.prenom || "",
    telephone: intervenant?.telephone || "",
    fonction: intervenant?.fonction || "",
    structure: intervenant?.structure || "",
  });

  // Update form data when intervenant changes
  React.useEffect(() => {
    if (intervenant) {
      setFormData({
        nom: intervenant.nom || "",
        prenom: intervenant.prenom || "",
        telephone: intervenant.telephone || "",
        fonction: intervenant.fonction || "",
        structure: intervenant.structure || "",
      });
    }
  }, [intervenant]);

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

      const res = await fetch("/api/intervenant/profil", {
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
      nom: intervenant?.nom || "",
      prenom: intervenant?.prenom || "",
      telephone: intervenant?.telephone || "",
      fonction: intervenant?.fonction || "",
      structure: intervenant?.structure || "",
    });
    setIsEditing(false);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

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
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
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
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {intervenant?.prenom?.[0]?.toUpperCase()}
              {intervenant?.nom?.[0]?.toUpperCase()}
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">
                {intervenant?.prenom} {intervenant?.nom}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {intervenant?.email}
              </p>
              {intervenant?.fonction && (
                <p className="text-white/60 text-sm mt-0.5">
                  {intervenant.fonction}
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
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              ) : (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">
                    {intervenant?.prenom || "—"}
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
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              ) : (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">
                    {intervenant?.nom || "—"}
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
                  {intervenant?.email || "—"}
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
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              ) : (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">
                    {intervenant?.telephone || "—"}
                  </span>
                </div>
              )}
            </div>

            {/* Fonction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fonction
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="fonction"
                  value={formData.fonction}
                  onChange={handleInputChange}
                  placeholder="Formateur, Consultant, etc."
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              ) : (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">
                    {intervenant?.fonction || "—"}
                  </span>
                </div>
              )}
            </div>

            {/* Structure */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Structure
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="structure"
                  value={formData.structure}
                  onChange={handleInputChange}
                  placeholder="Nom de votre entreprise ou structure"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              ) : (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">
                    {intervenant?.structure || "—"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Spécialités */}
          {intervenant?.specialites && intervenant.specialites.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Spécialités
              </label>
              <div className="flex flex-wrap gap-2">
                {intervenant.specialites.map((specialite, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium"
                  >
                    <Tag className="w-3 h-3" />
                    {specialite}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Date d'inscription */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Intervenant actif</span>
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
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors"
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

      {/* Déconnexion */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          {!showLogoutConfirm ? (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-medium rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Se déconnecter
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-gray-700 dark:text-gray-300">
                Êtes-vous sûr de vouloir vous déconnecter ?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={logout}
                  className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Confirmer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
