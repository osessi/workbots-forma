// ===========================================
// LAYOUT CATALOGUE PUBLIC
// ===========================================
// Layout pour les pages du catalogue de formations

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catalogue de formation",
  description: "Découvrez nos formations professionnelles et choisissez celle qui correspond à vos objectifs.",
};

export default function CatalogueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
