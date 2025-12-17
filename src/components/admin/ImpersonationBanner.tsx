"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ImpersonatedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  organization: {
    id: string;
    name: string;
  } | null;
}

export default function ImpersonationBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkImpersonationStatus();
  }, []);

  const checkImpersonationStatus = async () => {
    try {
      const response = await fetch("/api/admin/impersonate");
      if (response.ok) {
        const data = await response.json();
        setIsImpersonating(data.isImpersonating);
        setImpersonatedUser(data.user);
      }
    } catch (error) {
      console.error("Erreur verification impersonation:", error);
    }
  };

  const handleEndImpersonation = async () => {
    setIsEnding(true);
    try {
      const response = await fetch("/api/admin/impersonate", {
        method: "DELETE",
      });

      if (response.ok) {
        setIsImpersonating(false);
        setImpersonatedUser(null);
        // Rediriger vers le dashboard admin
        router.push("/admin");
        // Rafraichir la page pour reinitialiser le contexte
        router.refresh();
      }
    } catch (error) {
      console.error("Erreur arret impersonation:", error);
    } finally {
      setIsEnding(false);
    }
  };

  if (!isImpersonating || !impersonatedUser) {
    return null;
  }

  const userName = `${impersonatedUser.firstName || ""} ${impersonatedUser.lastName || ""}`.trim() || impersonatedUser.email;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 shadow-lg">
      <div className="px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
          {/* Warning icon + Message */}
          <div className="flex items-center gap-3 text-white">
            {/* Warning Icon */}
            <div className="flex-shrink-0 p-2 bg-white/20 rounded-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.58 20.74C2.9 20.91 3.26 21 3.64 21H20.36C20.74 21 21.1 20.91 21.42 20.74C21.74 20.56 22 20.3 22.18 20C22.36 19.7 22.45 19.36 22.45 19C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.27 3.32 12.95 3.15C12.63 2.98 12.28 2.89 11.91 2.89C11.54 2.89 11.19 2.98 10.87 3.15C10.55 3.32 10.29 3.56 10.11 3.86L10.29 3.86Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Text */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-bold text-sm uppercase tracking-wide">
                Mode Impersonation Actif
              </span>
              <span className="hidden sm:block text-white/60">|</span>
              <span className="text-sm text-white/90">
                Vous naviguez en tant que <strong className="font-semibold">{userName}</strong>
                {impersonatedUser.organization && (
                  <span className="text-white/75"> ({impersonatedUser.organization.name})</span>
                )}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleEndImpersonation}
            disabled={isEnding}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2 bg-white text-orange-600 rounded-lg text-sm font-bold shadow-md hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEnding ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Retour en cours...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Retourner au Panel Admin
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom border decoration */}
      <div className="h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400" />
    </div>
  );
}
