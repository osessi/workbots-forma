// ===========================================
// Hook pour récupérer l'organisation via domaine personnalisé
// ===========================================

"use client";

import { useState, useEffect } from "react";

interface CustomDomainOrganization {
  id: string;
  name: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string | null;
  slug: string;
  contact: {
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
  };
}

interface UseCustomDomainOrgResult {
  organization: CustomDomainOrganization | null;
  isCustomDomain: boolean;
  isLoading: boolean;
  error: string | null;
  customDomain: string | null;
}

export function useCustomDomainOrg(): UseCustomDomainOrgResult {
  const [organization, setOrganization] = useState<CustomDomainOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customDomain, setCustomDomain] = useState<string | null>(null);
  const [isCustomDomain, setIsCustomDomain] = useState(false);

  useEffect(() => {
    const checkCustomDomain = async () => {
      try {
        // Récupérer le domaine depuis le cookie
        // Le middleware a ajouté un cookie "custom-domain" si c'est un domaine personnalisé
        const domainFromCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("custom-domain="))
          ?.split("=")[1];

        // Vérifier aussi que ce n'est pas localhost (double sécurité)
        const currentHost = window.location.hostname;
        const isLocalhost = currentHost === "localhost" || currentHost === "127.0.0.1";

        if (!domainFromCookie || isLocalhost) {
          // Pas de domaine personnalisé ou on est en local
          setIsCustomDomain(false);
          setIsLoading(false);
          return;
        }

        setCustomDomain(domainFromCookie);
        setIsCustomDomain(true);

        // Récupérer les informations de l'organisation
        const res = await fetch(`/api/organization/by-domain?domain=${encodeURIComponent(domainFromCookie)}`);

        if (res.ok) {
          const data = await res.json();
          setOrganization(data.organization);
        } else {
          const data = await res.json();
          setError(data.error || "Organisation non trouvée");
        }
      } catch (err) {
        setError("Erreur lors de la récupération des informations");
        console.error("useCustomDomainOrg error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkCustomDomain();
  }, []);

  return {
    organization,
    isCustomDomain,
    isLoading,
    error,
    customDomain,
  };
}

// Hook pour appliquer les couleurs de l'organisation au document
export function useApplyOrgColors(organization: CustomDomainOrganization | null) {
  useEffect(() => {
    if (organization?.primaryColor) {
      document.documentElement.style.setProperty("--org-primary", organization.primaryColor);

      // Calculer une version plus claire pour le hover
      const primaryHex = organization.primaryColor.replace("#", "");
      const r = parseInt(primaryHex.slice(0, 2), 16);
      const g = parseInt(primaryHex.slice(2, 4), 16);
      const b = parseInt(primaryHex.slice(4, 6), 16);

      // Version plus claire (ajouter 20% de blanc)
      const lighterR = Math.min(255, r + Math.round((255 - r) * 0.2));
      const lighterG = Math.min(255, g + Math.round((255 - g) * 0.2));
      const lighterB = Math.min(255, b + Math.round((255 - b) * 0.2));

      document.documentElement.style.setProperty(
        "--org-primary-light",
        `rgb(${lighterR}, ${lighterG}, ${lighterB})`
      );
    }

    if (organization?.secondaryColor) {
      document.documentElement.style.setProperty("--org-secondary", organization.secondaryColor);
    }

    // Cleanup
    return () => {
      document.documentElement.style.removeProperty("--org-primary");
      document.documentElement.style.removeProperty("--org-primary-light");
      document.documentElement.style.removeProperty("--org-secondary");
    };
  }, [organization]);
}
