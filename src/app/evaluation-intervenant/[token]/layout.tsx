// ===========================================
// LAYOUT PAGE ÉVALUATION INTERVENANT
// ===========================================
// Métadonnées pour la page d'évaluation intervenant

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Évaluation Intervenant | AutoMate Forma",
  description: "Évaluation de la session de formation par l'intervenant",
};

export default function EvaluationIntervenantLayout({
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
