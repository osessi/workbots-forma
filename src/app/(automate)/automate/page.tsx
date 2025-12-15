"use client";

import WelcomeCard from "@/components/automate/WelcomeCard";
import MetricsCards from "@/components/automate/MetricsCards";
import EvolutionChart from "@/components/automate/EvolutionChart";
import RecentFormationsTable from "@/components/automate/RecentFormationsTable";

export default function AutomateDashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Card with Create Button */}
      <WelcomeCard />

      {/* Metrics Cards */}
      <MetricsCards />

      {/* Evolution Chart */}
      <EvolutionChart />

      {/* Recent Formations Table */}
      <RecentFormationsTable />
    </div>
  );
}
