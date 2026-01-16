// ===========================================
// LAYOUT PUBLIC - Sans authentification
// ===========================================
// Layout pour les pages publiques (signature, évaluations, espaces apprenant/intervenant)
// Note: Ce layout n'a pas de <html> ou <body> car ils sont définis dans le layout racine
// Les titres spécifiques sont définis dans chaque page via generateMetadata ou metadata

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | AutoMate Forma",
    default: "AutoMate Forma",
  },
  description: "Plateforme de formation professionnelle",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout simplifié sans sidebar ni providers complexes
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {children}
    </div>
  );
}
