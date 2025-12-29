"use client";

import React, { useState } from "react";
import { IntervenantPortalProvider } from "@/context/IntervenantPortalContext";
import IntervenantHeader from "@/components/intervenant/IntervenantHeader";
import IntervenantSidebar from "@/components/intervenant/IntervenantSidebar";

export default function IntervenantDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <IntervenantPortalProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Header */}
        <IntervenantHeader
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />

        {/* Sidebar */}
        <IntervenantSidebar
          isMobileOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Main content */}
        <main className="lg:pl-64 pt-16">
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </IntervenantPortalProvider>
  );
}
