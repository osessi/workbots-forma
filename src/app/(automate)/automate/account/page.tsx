"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAutomate, UserProfile } from "@/context/AutomateContext";

// Icons
const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 6.66667C2.5 5.74619 3.24619 5 4.16667 5H5.83333L7.5 3.33333H12.5L14.1667 5H15.8333C16.7538 5 17.5 5.74619 17.5 6.66667V14.1667C17.5 15.0871 16.7538 15.8333 15.8333 15.8333H4.16667C3.24619 15.8333 2.5 15.0871 2.5 14.1667V6.66667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function MonComptePage() {
  const { user, updateUser, formations } = useAutomate();
  const [localProfile, setLocalProfile] = useState<UserProfile>(user);
  const [isEditing, setIsEditing] = useState(false);

  // Synchronize local state when user changes
  useEffect(() => {
    setLocalProfile(user);
  }, [user]);

  const handleChange = (field: keyof UserProfile, value: string) => {
    setLocalProfile({ ...localProfile, [field]: value });
  };

  const handleSave = () => {
    // Update global context with local changes
    updateUser(localProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset local state to global state
    setLocalProfile(user);
    setIsEditing(false);
  };

  const inputClassName = `w-full px-4 py-3 text-sm border border-gray-200 rounded-lg ${
    isEditing
      ? "bg-white dark:bg-gray-900 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
      : "bg-gray-50 dark:bg-gray-800"
  } text-gray-800 dark:border-gray-700 dark:text-white`;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Mon compte
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gérez vos informations personnelles et professionnelles
            </p>
          </div>
          {isEditing ? (
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm hover:shadow-md"
              >
                Enregistrer
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm hover:shadow-md"
            >
              Modifier
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Photo de profil */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Photo de profil
          </h2>
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-700 ring-2 ring-transparent hover:ring-brand-100 dark:hover:ring-brand-500/20 transition-all">
                <Image
                  src="/images/user/photo costume carré.jpg"
                  alt="Photo de profil"
                  width={128}
                  height={128}
                  className="object-cover"
                />
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 p-2.5 bg-brand-500 text-white rounded-full hover:bg-brand-600 active:scale-[0.95] transition-all shadow-lg">
                  <CameraIcon />
                </button>
              )}
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              {isEditing ? "Cliquez pour modifier votre photo" : `${localProfile.prenom} ${localProfile.nom}`}
            </p>
          </div>

          {/* Statistiques */}
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Statistiques
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Formations créées</span>
                <span className="font-medium text-gray-900 dark:text-white tabular-nums">{formations.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Fiches générées</span>
                <span className="font-medium text-gray-900 dark:text-white tabular-nums">78</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Membre depuis</span>
                <span className="font-medium text-gray-900 dark:text-white">Jan 2025</span>
              </div>
            </div>
          </div>
        </div>

        {/* Informations personnelles */}
        <div className="lg:col-span-2 space-y-6">
          {/* Infos personnelles */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Informations personnelles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  value={localProfile.prenom}
                  onChange={(e) => handleChange("prenom", e.target.value)}
                  readOnly={!isEditing}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  value={localProfile.nom}
                  onChange={(e) => handleChange("nom", e.target.value)}
                  readOnly={!isEditing}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={localProfile.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  readOnly={!isEditing}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={localProfile.telephone}
                  onChange={(e) => handleChange("telephone", e.target.value)}
                  readOnly={!isEditing}
                  className={inputClassName}
                />
              </div>
            </div>
          </div>

          {/* Infos professionnelles */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Informations professionnelles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom de l'entreprise
                </label>
                <input
                  type="text"
                  value={localProfile.entreprise}
                  onChange={(e) => handleChange("entreprise", e.target.value)}
                  readOnly={!isEditing}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Numéro SIRET
                </label>
                <input
                  type="text"
                  value={localProfile.siret}
                  onChange={(e) => handleChange("siret", e.target.value)}
                  readOnly={!isEditing}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Numéro de déclaration d'activité
                </label>
                <input
                  type="text"
                  value={localProfile.numeroFormateur}
                  onChange={(e) => handleChange("numeroFormateur", e.target.value)}
                  readOnly={!isEditing}
                  className={inputClassName}
                  placeholder="N° de formateur (DREETS)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  value={localProfile.adresse}
                  onChange={(e) => handleChange("adresse", e.target.value)}
                  readOnly={!isEditing}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Code postal
                </label>
                <input
                  type="text"
                  value={localProfile.codePostal}
                  onChange={(e) => handleChange("codePostal", e.target.value)}
                  readOnly={!isEditing}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  value={localProfile.ville}
                  onChange={(e) => handleChange("ville", e.target.value)}
                  readOnly={!isEditing}
                  className={inputClassName}
                />
              </div>
            </div>
          </div>

          {/* Sécurité */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Sécurité
            </h2>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Mot de passe
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Dernière modification il y a 3 mois
                </p>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg active:scale-[0.98] transition-all dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20">
                Modifier le mot de passe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
