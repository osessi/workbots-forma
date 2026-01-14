"use client";

// ===========================================
// CORRECTIONS 490, 495: Header intervenant simplifié
// ===========================================
// 490: Logo agrandi (w-12 h-12)
// 495: Sélecteur de session déplacé dans le menu gauche

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useIntervenantPortal } from "@/context/IntervenantPortalContext";
import {
  ChevronDown,
  LogOut,
  User,
  Menu,
  X,
  Briefcase,
} from "lucide-react";

interface IntervenantHeaderProps {
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export default function IntervenantHeader({
  onMenuToggle,
  isMobileMenuOpen,
}: IntervenantHeaderProps) {
  const {
    intervenant,
    organization,
    logout,
  } = useIntervenantPortal();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Gauche: Menu mobile + Logo */}
        <div className="flex items-center gap-3">
          {/* Bouton menu mobile */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          {/* Logo organisation - Correction 490: Logo agrandi */}
          <Link href="/intervenant/accueil" className="flex items-center gap-3">
            {organization?.logoUrl ? (
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 flex-shrink-0">
                <Image
                  src={organization.logoUrl}
                  alt={organization.nomCommercial || organization.name}
                  fill
                  className="object-contain p-1.5"
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
            )}
          </Link>
        </div>

        {/* Correction 495: Sélecteur de session déplacé dans le menu gauche - Suppression du header */}

        {/* Droite: Profil */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            {/* Avatar */}
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {intervenant?.prenom?.[0]?.toUpperCase() || "I"}
              {intervenant?.nom?.[0]?.toUpperCase() || ""}
            </div>

            {/* Nom (desktop) */}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                {intervenant?.prenom} {intervenant?.nom?.[0]?.toUpperCase()}.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                {intervenant?.email}
              </p>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-gray-400 hidden sm:block transition-transform ${
                isProfileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown profil */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Info utilisateur */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <p className="font-medium text-gray-900 dark:text-white">
                  {intervenant?.prenom} {intervenant?.nom}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {intervenant?.email}
                </p>
                {intervenant?.fonction && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    {intervenant.fonction}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="p-2">
                <Link
                  href="/intervenant/profil"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  Mon profil
                </Link>

                <hr className="my-2 border-gray-100 dark:border-gray-700" />

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Correction 495: Sélecteur de session mobile déplacé dans le menu gauche */}
    </header>
  );
}
