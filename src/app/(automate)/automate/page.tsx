"use client";

import WelcomeCard from "@/components/automate/WelcomeCard";
import DashboardStats from "@/components/automate/DashboardStats";

export default function AutomateDashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Card with Create Button */}
      <WelcomeCard />

      {/* Dashboard Stats dynamiques */}
      <DashboardStats />
    </div>
  );
}
