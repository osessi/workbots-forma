"use client";

import React, { useState, Suspense } from "react";
import { ApprenantPortalProvider, useRequireApprenantAuth } from "@/context/ApprenantPortalContext";
import ApprenantHeader from "@/components/apprenant/ApprenantHeader";
import ApprenantSidebar from "@/components/apprenant/ApprenantSidebar";
import { Loader2 } from "lucide-react";

// =====================================
// LOADING COMPONENT
// =====================================

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
      </div>
    </div>
  );
}

// =====================================
// LAYOUT CONTENT (avec auth check)
// =====================================

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useRequireApprenantAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Afficher loading pendant vérification auth
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Si pas authentifié, le hook redirige automatiquement
  if (!isAuthenticated) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <ApprenantHeader
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Sidebar */}
      <ApprenantSidebar
        isMobileOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main content */}
      <main className="lg:pl-64 pt-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

// =====================================
// MAIN LAYOUT
// =====================================

export default function ApprenantDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ApprenantPortalProvider>
      <Suspense fallback={<LoadingScreen />}>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </Suspense>
    </ApprenantPortalProvider>
  );
}
