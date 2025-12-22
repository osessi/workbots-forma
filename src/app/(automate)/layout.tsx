"use client";

import { useSidebar } from "@/context/SidebarContext";
import { AutomateProvider } from "@/context/AutomateContext";
import AutomateHeader from "@/components/automate/AutomateHeader";
import AutomateSidebar from "@/components/automate/AutomateSidebar";
import ImpersonationBanner from "@/components/admin/ImpersonationBanner";
import SlideGenerationNotifications from "@/components/automate/SlideGenerationNotifications";
import Backdrop from "@/layout/Backdrop";
import { ToastProvider, ConfirmProvider } from "@/components/ui/feedback";
import React from "react";

export default function AutomateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[260px]"
    : "lg:ml-[80px]";

  return (
    <AutomateProvider>
      <ToastProvider position="top-right">
        <ConfirmProvider>
          {/* Bandeau d'impersonation (visible uniquement en mode impersonation) */}
          <ImpersonationBanner />
          <div className="min-h-screen bg-gray-50 dark:bg-gray-950 xl:flex">
            <AutomateSidebar />
            <Backdrop />
            <div
              className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
            >
              <AutomateHeader />
              <div className="p-4 mx-auto max-w-7xl md:p-6 lg:p-8">{children}</div>
            </div>
          </div>
          {/* Notifications de génération de slides */}
          <SlideGenerationNotifications />
        </ConfirmProvider>
      </ToastProvider>
    </AutomateProvider>
  );
}
