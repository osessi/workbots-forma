// ===========================================
// LAYOUT ESPACE APPRENANT
// ===========================================
// Métadonnées pour l'espace apprenant

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Espace Apprenant",
    default: "Espace Apprenant | AutoMate Forma",
  },
  description: "Votre espace personnel de formation",
};

export default function ApprenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
