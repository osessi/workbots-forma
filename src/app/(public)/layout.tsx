// ===========================================
// LAYOUT PUBLIC - Sans authentification
// ===========================================
// Layout pour les pages publiques (signature, etc.)
// Note: Ce layout n'a pas de <html> ou <body> car ils sont définis dans le layout racine

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signature Électronique | AutoMate Forma",
  description: "Signez vos documents en ligne de manière sécurisée",
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
