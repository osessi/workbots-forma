"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAutomate, UserProfile } from "@/context/AutomateContext";
import UserAvatar from "@/components/ui/avatar/UserAvatar";
import Image from "next/image";
import Link from "next/link";

// Icons
const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 6.66667C2.5 5.74619 3.24619 5 4.16667 5H5.83333L7.5 3.33333H12.5L14.1667 5H15.8333C16.7538 5 17.5 5.74619 17.5 6.66667V14.1667C17.5 15.0871 16.7538 15.8333 15.8333 15.8333H4.16667C3.24619 15.8333 2.5 15.0871 2.5 14.1667V6.66667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BuildingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.33333 17.5V4.16667C3.33333 3.24619 4.07953 2.5 5 2.5H15C15.9205 2.5 16.6667 3.24619 16.6667 4.16667V17.5M3.33333 17.5H16.6667M3.33333 17.5H1.66667M16.6667 17.5H18.3333M6.66667 5.83333H8.33333M6.66667 9.16667H8.33333M11.6667 5.83333H13.3333M11.6667 9.16667H13.3333M8.33333 17.5V13.3333C8.33333 12.8731 8.70643 12.5 9.16667 12.5H10.8333C11.2936 12.5 11.6667 12.8731 11.6667 13.3333V17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Helper pour upload via API
async function uploadImage(file: File, type: "avatar" | "logo"): Promise<{ url: string | null; error: string | null }> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const response = await fetch("/api/user/avatar", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { url: null, error: data.error || "Erreur lors de l'upload" };
    }

    return { url: data.url, error: null };
  } catch (error) {
    return { url: null, error: "Erreur de connexion" };
  }
}

export default function MonComptePage() {
  const { user, updateUser, refreshUser, formations } = useAutomate();
  const [localProfile, setLocalProfile] = useState<UserProfile>(user);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Synchronize local state when user changes
  useEffect(() => {
    setLocalProfile(user);
  }, [user]);

  const handleAvatarClick = () => {
    if (isEditing && avatarInputRef.current) {
      avatarInputRef.current.click();
    }
  };

  const handleLogoClick = () => {
    // Permet l'upload du logo sans mode édition
    if (logoInputRef.current) {
      logoInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const result = await uploadImage(file, "avatar");

      if (result.url) {
        setLocalProfile({ ...localProfile, avatarUrl: result.url });
        // Refresh pour synchroniser avec le serveur
        await refreshUser();
      } else {
        alert(result.error || "Erreur lors de l'upload");
      }
    } catch (error) {
      console.error("Erreur upload:", error);
      alert("Erreur lors de l'upload de l'image");
    } finally {
      setIsUploadingAvatar(false);
      // Reset input
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5MB");
      return;
    }

    setIsUploadingLogo(true);
    try {
      const result = await uploadImage(file, "logo");

      if (result.url) {
        // Refresh pour synchroniser avec le serveur (logo sauvé dans l'organisation)
        await refreshUser();
      } else {
        alert(result.error || "Erreur lors de l'upload");
      }
    } catch (error) {
      console.error("Erreur upload:", error);
      alert("Erreur lors de l'upload du logo");
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    }
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    setLocalProfile({ ...localProfile, [field]: value });
  };

  const handleSave = () => {
    updateUser(localProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
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
        {/* Colonne gauche: Photo de profil + Logo */}
        <div className="space-y-6">
          {/* Photo de profil */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Photo de profil
            </h2>
            <div className="flex flex-col items-center">
              <div className="relative">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <div
                  onClick={handleAvatarClick}
                  className={`w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-700 ring-2 ring-transparent hover:ring-brand-100 dark:hover:ring-brand-500/20 transition-all ${isEditing ? "cursor-pointer" : ""}`}
                >
                  <UserAvatar
                    src={localProfile.avatarUrl}
                    seed={localProfile.email || "default"}
                    alt="Photo de profil"
                    size="xxlarge"
                    className="w-full h-full"
                  />
                </div>
                {isEditing && (
                  <button
                    onClick={handleAvatarClick}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 p-2.5 bg-brand-500 text-white rounded-full hover:bg-brand-600 active:scale-[0.95] transition-all shadow-lg disabled:opacity-50"
                  >
                    {isUploadingAvatar ? (
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <CameraIcon />
                    )}
                  </button>
                )}
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                {isEditing ? "Cliquez pour modifier votre photo" : `${localProfile.prenom || ""} ${localProfile.nom || ""}`.trim() || "Votre profil"}
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

          {/* Logo entreprise */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Logo entreprise
            </h2>
            <div className="flex flex-col items-center">
              <div className="relative">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <div
                  onClick={handleLogoClick}
                  className="w-32 h-32 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800 transition-all cursor-pointer hover:border-brand-300 hover:bg-brand-50/50 dark:hover:bg-brand-500/10"
                >
                  {user.logoUrl ? (
                    <Image
                      src={user.logoUrl}
                      alt="Logo entreprise"
                      width={128}
                      height={128}
                      className="object-contain w-full h-full p-2"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <div className="flex justify-center text-gray-400">
                        <BuildingIcon />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Cliquez pour ajouter
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleLogoClick}
                  disabled={isUploadingLogo}
                  className="absolute -bottom-2 -right-2 p-2 bg-brand-500 text-white rounded-full hover:bg-brand-600 active:scale-[0.95] transition-all shadow-lg disabled:opacity-50"
                >
                  {isUploadingLogo ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <CameraIcon />
                  )}
                </button>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                {localProfile.entreprise || "Votre entreprise"}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
                Ce logo apparaîtra sur vos documents
              </p>
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
                  readOnly
                  className={`${inputClassName} bg-gray-50 dark:bg-gray-800 cursor-not-allowed`}
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
                  Nom de l&apos;entreprise
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
                  Numéro de déclaration d&apos;activité
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
              <Link
                href="/reset-password"
                className="px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg active:scale-[0.98] transition-all dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
              >
                Modifier le mot de passe
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
