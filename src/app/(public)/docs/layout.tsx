// ===========================================
// LAYOUT DOCUMENTATION
// ===========================================
// Métadonnées pour les pages de documentation

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Documentation",
    default: "Documentation | AutoMate Forma",
  },
  description: "Documentation et guides d'utilisation d'AutoMate Forma",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
