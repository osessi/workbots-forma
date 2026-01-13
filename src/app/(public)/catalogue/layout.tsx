// ===========================================
// LAYOUT CATALOGUE PUBLIC
// ===========================================
// Layout pour les pages du catalogue des formations

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catalogue des formations",
  description: "Découvrez nos formations professionnelles et choisissez celle qui correspond à vos objectifs.",
};

export default function CatalogueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
