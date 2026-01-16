// ===========================================
// LAYOUT ESPACE INTERVENANT
// ===========================================
// Métadonnées pour l'espace intervenant/formateur

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Espace Intervenant",
    default: "Espace Intervenant | AutoMate Forma",
  },
  description: "Votre espace formateur pour gérer vos sessions",
};

export default function IntervenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
