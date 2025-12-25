"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAutomate, UserProfile } from "@/context/AutomateContext";
import UserAvatar from "@/components/ui/avatar/UserAvatar";
import Link from "next/link";

// Icons
const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 6.66667C2.5 5.74619 3.24619 5 4.16667 5H5.83333L7.5 3.33333H12.5L14.1667 5H15.8333C16.7538 5 17.5 5.74619 17.5 6.66667V14.1667C17.5 15.0871 16.7538 15.8333 15.8333 15.8333H4.16667C3.24619 15.8333 2.5 15.0871 2.5 14.1667V6.66667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.60417 3.59707C8.95894 2.13431 11.0411 2.13431 11.3958 3.59707C11.4684 3.89653 11.6121 4.17329 11.8143 4.40328C12.0166 4.63328 12.271 4.80965 12.5562 4.91739C12.8413 5.02514 13.1485 5.06092 13.4512 5.02167C13.754 4.98242 14.0432 4.86938 14.2933 4.69207C15.5608 3.79457 17.0054 5.23915 16.1079 6.50665C15.9308 6.75667 15.818 7.04571 15.7789 7.34832C15.7398 7.65092 15.7757 7.95791 15.8834 8.24289C15.9912 8.52787 16.1675 8.78212 16.3973 8.98426C16.6272 9.1864 16.9038 9.33016 17.2029 9.40282C18.6657 9.7576 18.6657 11.8398 17.2029 12.1946C16.9035 12.2672 16.6267 12.4109 16.3967 12.6131C16.1667 12.8154 15.9904 13.0697 15.8826 13.3549C15.7749 13.64 15.7391 13.9473 15.7783 14.25C15.8176 14.5528 15.9306 14.842 16.1079 15.0921C17.0054 16.3596 15.5608 17.8041 14.2933 16.9066C14.0433 16.7295 13.7543 16.6168 13.4517 16.5776C13.1491 16.5385 12.8421 16.5744 12.5571 16.6821C12.2722 16.7899 12.0179 16.9662 11.8158 17.196C11.6136 17.4258 11.4699 17.7025 11.3972 18.0016C11.0425 19.4644 8.96023 19.4644 8.60546 18.0016C8.53282 17.7021 8.38917 17.4254 8.18693 17.1954C7.98469 16.9654 7.73029 16.789 7.44514 16.6813C7.15999 16.5736 6.85282 16.5378 6.55002 16.577C6.24723 16.6163 5.95802 16.7293 5.70785 16.9066C4.44035 17.8041 2.99576 16.3596 3.89326 15.0921C4.07039 14.842 4.18321 14.5529 4.22232 14.2503C4.26143 13.9477 4.22559 13.6408 4.11787 13.3558C4.01015 13.0708 3.83389 12.8166 3.60416 12.6145C3.37442 12.4124 3.0979 12.2686 2.79877 12.1959C1.33602 11.8411 1.33602 9.75882 2.79877 9.40405C3.09823 9.33147 3.37499 9.18787 3.60498 8.98566C3.83498 8.78346 4.01135 8.52908 4.11909 8.24395C4.22684 7.95882 4.26261 7.65165 4.22336 7.34886C4.18411 7.04607 4.07108 6.75685 3.89377 6.50665C2.99627 5.23915 4.44085 3.79457 5.70835 4.69207C6.35418 5.15582 7.24085 5.00624 7.70501 4.35999C7.70544 4.35915 7.70585 4.35832 7.70627 4.35749C7.91377 4.07207 8.60417 3.59707 8.60417 3.59707ZM10 13.3333C10.8841 13.3333 11.7319 12.9821 12.357 12.357C12.9821 11.7319 13.3333 10.8841 13.3333 9.99999C13.3333 9.11593 12.9821 8.26809 12.357 7.64297C11.7319 7.01785 10.8841 6.66666 10 6.66666C9.11595 6.66666 8.2681 7.01785 7.64298 7.64297C7.01786 8.26809 6.66667 9.11593 6.66667 9.99999C6.66667 10.8841 7.01786 11.7319 7.64298 12.357C8.2681 12.9821 9.11595 13.3333 10 13.3333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2.5C7.23858 2.5 5 4.73858 5 7.5V10.5858L3.79289 11.7929C3.60536 11.9804 3.5 12.2348 3.5 12.5V13.5C3.5 14.0523 3.94772 14.5 4.5 14.5H15.5C16.0523 14.5 16.5 14.0523 16.5 13.5V12.5C16.5 12.2348 16.3946 11.9804 16.2071 11.7929L15 10.5858V7.5C15 4.73858 12.7614 2.5 10 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.5 14.5V15C8.5 15.8284 9.17157 16.5 10 16.5C10.8284 16.5 11.5 15.8284 11.5 15V14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.83333 9.16667V5.83333C5.83333 3.53214 7.69881 1.66667 10 1.66667C12.3012 1.66667 14.1667 3.53214 14.1667 5.83333V9.16667M4.16667 9.16667H15.8333C16.7538 9.16667 17.5 9.91286 17.5 10.8333V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16667C3.24619 18.3333 2.5 17.5871 2.5 16.6667V10.8333C2.5 9.91286 3.24619 9.16667 4.16667 9.16667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Helper pour upload via API
async function uploadImage(file: File, type: "avatar"): Promise<{ url: string | null; error: string | null }> {
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
  } catch {
    return { url: null, error: "Erreur de connexion" };
  }
}

export default function MonComptePage() {
  const { user, updateUser, refreshUser, formations } = useAutomate();
  const [localProfile, setLocalProfile] = useState<UserProfile>(user);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Synchronize local state when user changes
  useEffect(() => {
    setLocalProfile(user);
  }, [user]);

  const handleAvatarClick = () => {
    if (isEditing && avatarInputRef.current) {
      avatarInputRef.current.click();
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

  const inputClassName = `w-full px-4 py-3 text-sm border border-gray-200 rounded-xl ${
    isEditing
      ? "bg-white dark:bg-gray-900 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
      : "bg-gray-50 dark:bg-gray-800"
  } text-gray-800 dark:border-gray-700 dark:text-white transition-all`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* En-tête avec photo de profil */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow overflow-hidden">
        {/* Bannière gradient */}
        <div className="h-24 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />

        <div className="px-6 pb-6">
          {/* Photo et infos */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            {/* Photo de profil */}
            <div className="relative flex-shrink-0">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <div
                onClick={handleAvatarClick}
                className={`w-28 h-28 rounded-2xl overflow-hidden border-4 border-white dark:border-gray-900 shadow-lg ${isEditing ? "cursor-pointer ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-gray-900" : ""} transition-all`}
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
                  className="absolute -bottom-1 -right-1 p-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 active:scale-[0.95] transition-all shadow-lg disabled:opacity-50"
                >
                  {isUploadingAvatar ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <CameraIcon />
                  )}
                </button>
              )}
            </div>

            {/* Infos et boutons */}
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 sm:pt-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {`${localProfile.prenom || ""} ${localProfile.nom || ""}`.trim() || "Mon compte"}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {localProfile.email}
                </p>
              </div>

              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm"
                  >
                    Enregistrer
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm"
                >
                  Modifier le profil
                </button>
              )}
            </div>
          </div>

          {/* Statistiques en ligne */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formations.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Formations</p>
            </div>
            <div className="text-center border-x border-gray-100 dark:border-gray-800">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">78</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Fiches</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">Jan 2025</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Membre depuis</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations personnelles */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
            Informations personnelles
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  Prenom
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
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
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
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={localProfile.email}
                readOnly
                className={`${inputClassName} bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Telephone
              </label>
              <input
                type="tel"
                value={localProfile.telephone}
                onChange={(e) => handleChange("telephone", e.target.value)}
                readOnly={!isEditing}
                placeholder={isEditing ? "Entrez votre numéro" : "Non renseigné"}
                className={inputClassName}
              />
            </div>
          </div>
        </div>

        {/* Colonne droite: Sécurité + Notifications + Paramètres */}
        <div className="space-y-6">
          {/* Sécurité */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10">
                <LockIcon />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Securite
              </h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Mot de passe
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Derniere modification il y a 3 mois
                </p>
              </div>
              <Link
                href="/reset-password"
                className="px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl active:scale-[0.98] transition-all dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
              >
                Modifier
              </Link>
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                <BellIcon />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Notifications par email
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Mises a jour sur vos formations
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300/50 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
              </label>
            </div>
          </div>

          {/* Paramètres organisme */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10">
                <SettingsIcon />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Organisme
              </h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Parametres de l&apos;organisme
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Logo, signature, cachet et informations
                </p>
              </div>
              <Link
                href="/automate/settings"
                className="px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl active:scale-[0.98] transition-all dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
              >
                Acceder
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
