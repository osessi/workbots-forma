// ===========================================
// LAYOUT PAGE ÉVALUATION APPRENANT
// ===========================================
// Métadonnées pour la page d'évaluation apprenant (chaud/froid)

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Évaluation de la formation | AutoMate Forma",
  description: "Évaluez votre formation et partagez votre avis",
};

export default function EvaluationLayout({
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
