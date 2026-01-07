"use client";

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
  Check,
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
    sessions,
    selectedSession,
    selectSession,
    logout,
  } = useIntervenantPortal();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSessionSelectorOpen, setIsSessionSelectorOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<HTMLDivElement>(null);

  // Fermer les dropdowns au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (sessionRef.current && !sessionRef.current.contains(event.target as Node)) {
        setIsSessionSelectorOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSession = (sessionId: string) => {
    selectSession(sessionId);
    setIsSessionSelectorOpen(false);
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

          {/* Logo organisation */}
          <Link href="/intervenant/accueil" className="flex items-center gap-3">
            {organization?.logoUrl ? (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 flex-shrink-0">
                <Image
                  src={organization.logoUrl}
                  alt={organization.nomCommercial || organization.name}
                  fill
                  className="object-contain p-1"
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
            )}
          </Link>
        </div>

        {/* Centre: Sélecteur de session (desktop) */}
        {sessions.length > 0 && (
          <div ref={sessionRef} className="hidden md:block relative">
            <button
              onClick={() => setIsSessionSelectorOpen(!isSessionSelectorOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors max-w-md"
            >
              <Briefcase className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                {selectedSession?.formation.titre || "Sélectionner une session"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                  isSessionSelectorOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown sessions */}
            {isSessionSelectorOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2">
                    Vos sessions de formation
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleSelectSession(session.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                        selectedSession?.id === session.id
                          ? "bg-emerald-50 dark:bg-emerald-500/10"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      {session.formation.image ? (
                        <Image
                          src={session.formation.image}
                          alt={session.formation.titre}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 rounded-lg flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {session.formation.titre}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {session.reference} - {session.nombreApprenants} apprenant{session.nombreApprenants > 1 ? "s" : ""}
                        </p>
                      </div>
                      {selectedSession?.id === session.id && (
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
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

      {/* Sélecteur de session mobile */}
      {sessions.length > 0 && (
        <div className="md:hidden px-4 pb-3">
          <button
            onClick={() => setIsSessionSelectorOpen(!isSessionSelectorOpen)}
            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Briefcase className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                {selectedSession?.formation.titre || "Sélectionner"}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                isSessionSelectorOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      )}
    </header>
  );
}
