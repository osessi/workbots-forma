// ===========================================
// LAYOUT PAGE SIGNATURE
// ===========================================
// Métadonnées pour la page de signature électronique

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signature Électronique",
  description: "Signez vos documents en ligne de manière sécurisée",
};

export default function SignerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
