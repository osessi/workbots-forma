// ===========================================
// LAYOUT PAGE ÉVALUATION FINANCEUR
// ===========================================
// Métadonnées pour la page d'évaluation financeur (OPCO, CPF, etc.)

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Évaluation Financeur | AutoMate Forma",
  description: "Évaluation de satisfaction pour les financeurs de formation",
};

export default function EvaluationFinanceurLayout({
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
