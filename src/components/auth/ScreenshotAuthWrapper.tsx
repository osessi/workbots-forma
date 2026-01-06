"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface ScreenshotAuthWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wrapper qui vérifie si un token de capture d'écran est présent.
 * Si oui, il expose une variable globale pour que l'app sache qu'on est en mode capture.
 */
export default function ScreenshotAuthWrapper({
  children,
  fallback
}: ScreenshotAuthWrapperProps) {
  const searchParams = useSearchParams();
  const [isValidating, setIsValidating] = useState(false);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);

  useEffect(() => {
    const token = searchParams.get("_screenshot_token");

    if (token) {
      setIsValidating(true);
      // Valider le token côté serveur
      fetch("/api/qualiopi/validate-screenshot-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setIsScreenshotMode(true);
            // Stocker dans sessionStorage pour les requêtes API suivantes
            sessionStorage.setItem("_screenshot_token", token);
            sessionStorage.setItem("_screenshot_org_id", data.organizationId);
          }
        })
        .catch(console.error)
        .finally(() => setIsValidating(false));
    }
  }, [searchParams]);

  if (isValidating) {
    return fallback || <div>Chargement...</div>;
  }

  return <>{children}</>;
}

/**
 * Hook pour vérifier si on est en mode capture d'écran
 */
export function useScreenshotMode() {
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("_screenshot_token");
    const orgId = sessionStorage.getItem("_screenshot_org_id");
    setIsScreenshotMode(!!token);
    setOrganizationId(orgId);
  }, []);

  return { isScreenshotMode, organizationId };
}
