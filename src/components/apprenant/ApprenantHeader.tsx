"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import {
  ChevronDown,
  LogOut,
  User,
  Menu,
  X,
  GraduationCap,
  Check,
} from "lucide-react";

interface ApprenantHeaderProps {
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export default function ApprenantHeader({
  onMenuToggle,
  isMobileMenuOpen,
}: ApprenantHeaderProps) {
  const {
    apprenant,
    organization,
    inscriptions,
    selectedInscription,
    selectInscription,
    logout,
  } = useApprenantPortal();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFormationSelectorOpen, setIsFormationSelectorOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const formationRef = useRef<HTMLDivElement>(null);

  // Fermer les dropdowns au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (formationRef.current && !formationRef.current.contains(event.target as Node)) {
        setIsFormationSelectorOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectFormation = (inscriptionId: string) => {
    selectInscription(inscriptionId);
    setIsFormationSelectorOpen(false);
  };

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

          {/* Logo organisation - Correction 429: Taille réduite pour un rendu plus équilibré */}
          <Link href="/apprenant" className="flex items-center gap-2">
            {organization?.logoUrl ? (
              <Image
                src={organization.logoUrl}
                alt={organization.nomCommercial || organization.name}
                width={120}
                height={40}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white hidden sm:block text-sm">
                  {organization?.nomCommercial || organization?.name || "Espace Apprenant"}
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Centre: Sélecteur de formation (desktop) */}
        {inscriptions.length > 1 && (
          <div ref={formationRef} className="hidden md:block relative">
            <button
              onClick={() => setIsFormationSelectorOpen(!isFormationSelectorOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors max-w-md"
            >
              <GraduationCap className="w-4 h-4 text-brand-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                {selectedInscription?.formation.titre || "Sélectionner une formation"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                  isFormationSelectorOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown formations */}
            {isFormationSelectorOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2">
                    Vos formations
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {inscriptions.map((inscription) => (
                    <button
                      key={inscription.id}
                      onClick={() => handleSelectFormation(inscription.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                        selectedInscription?.id === inscription.id
                          ? "bg-brand-50 dark:bg-brand-500/10"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      {inscription.formation.image ? (
                        <Image
                          src={inscription.formation.image}
                          alt={inscription.formation.titre}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900 dark:to-brand-800 rounded-lg flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {inscription.formation.titre}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Progression: {inscription.progression}%
                        </p>
                      </div>
                      {selectedInscription?.id === inscription.id && (
                        <Check className="w-4 h-4 text-brand-500 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Droite: Profil */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            {/* Avatar */}
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {apprenant?.prenom?.[0]?.toUpperCase() || "A"}
              {apprenant?.nom?.[0]?.toUpperCase() || ""}
            </div>

            {/* Nom (desktop) */}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                {apprenant?.prenom} {apprenant?.nom?.[0]?.toUpperCase()}.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                {apprenant?.email}
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
                  {apprenant?.prenom} {apprenant?.nom}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {apprenant?.email}
                </p>
              </div>

              {/* Actions */}
              <div className="p-2">
                <Link
                  href="/apprenant/profil"
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

      {/* Sélecteur de formation mobile */}
      {inscriptions.length > 1 && (
        <div className="md:hidden px-4 pb-3">
          <button
            onClick={() => setIsFormationSelectorOpen(!isFormationSelectorOpen)}
            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-2 min-w-0">
              <GraduationCap className="w-4 h-4 text-brand-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                {selectedInscription?.formation.titre || "Sélectionner"}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                isFormationSelectorOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      )}
    </header>
  );
}
