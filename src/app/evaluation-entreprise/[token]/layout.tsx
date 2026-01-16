// ===========================================
// LAYOUT PAGE ÉVALUATION ENTREPRISE
// ===========================================
// Métadonnées pour la page d'évaluation entreprise (DRH, responsable formation)

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Évaluation Entreprise | AutoMate Forma",
  description: "Évaluation de satisfaction pour les entreprises clientes",
};

export default function EvaluationEntrepriseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
