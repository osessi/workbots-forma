"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";

// =====================================
// TYPES
// =====================================

interface Organization {
  id: string;
  name: string;
  nomCommercial: string | null;
  logoUrl: string | null;
  siret: string | null;
  adresse: string | null;
  email: string | null;
  telephone: string | null;
  siteWeb: string | null;
  numeroFormateur: string | null;
}

interface Module {
  id: string;
  titre: string;
  description?: string | null;
  ordre: number;
  duree?: number | null;
  objectifs?: string[];
  contenu?: string | Record<string, unknown> | null;
}

interface Formation {
  id: string;
  titre: string;
  reference?: string | null;
  description: string | null;
  image: string | null;
  dureeHeures: number | null;
  modalite: string | null;
  objectifsPedagogiques: string[];
  publicCible?: string | null;
  prerequis?: string | null;
  moyensPedagogiques?: string | null;
  suiviEvaluation?: string | null;
  delaiAcces?: string | null;
  accessibilite?: string | null;
  modules?: Module[];
}

interface Lieu {
  id: string;
  nom: string;
  typeLieu: string;
  lieuFormation?: string | null;
  adresse?: string | null;
  ville?: string | null;
}

interface Journee {
  id: string;
  date: string;
  heureDebutMatin: string | null;
  heureFinMatin: string | null;
  heureDebutAprem: string | null;
  heureFinAprem: string | null;
}

interface Session {
  id: string;
  reference: string;
  nom: string | null;
  status: string;
  statut?: string;
  formation: Formation;
  dateDebut: string | null;
  dateFin: string | null;
  nombreApprenants: number;
  nombreJournees?: number;
  lieu?: Lieu | null;
  prochaineJournee?: Journee | null;
  journees?: Journee[];
}

interface Intervenant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  fonction: string | null;
  specialites: string[];
  structure: string | null;
  photoUrl?: string | null;
}

interface DashboardStats {
  sessionsEnCours: number;
  sessionsAVenir: number;
  totalApprenants: number;
  evaluationsACorreger: number;
  emargementsEnAttente: number;
  prochainsCréneaux: number;
}

interface IntervenantPortalContextType {
  // Auth
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Data
  intervenant: Intervenant | null;
  organization: Organization | null;
  sessions: Session[];
  selectedSession: Session | null;
  dashboardStats: DashboardStats | null;

  // Actions
  login: (token: string) => void;
  logout: () => void;
  selectSession: (sessionId: string) => void;
  refreshData: () => Promise<void>;
  setDashboardStats: (stats: DashboardStats) => void;
}

// =====================================
// CONTEXT
// =====================================

const IntervenantPortalContext = createContext<IntervenantPortalContextType | undefined>(undefined);

// =====================================
// PROVIDER
// =====================================

export function IntervenantPortalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Data state
  const [intervenant, setIntervenant] = useState<Intervenant | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // Computed
  const isAuthenticated = !!token && !!intervenant;
  const selectedSession = sessions.find(s => s.id === selectedSessionId) || sessions[0] || null;

  // Calculer les stats automatiquement à partir des sessions
  const computedStats: DashboardStats = React.useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const sessionsEnCours = sessions.filter(s => s.status === "EN_COURS").length;
    const sessionsAVenir = sessions.filter(s => {
      if (s.status === "PLANIFIEE") return true;
      // Aussi compter les sessions dont la date de début est dans le futur
      if (s.dateDebut && new Date(s.dateDebut) > now) return true;
      return false;
    }).length;
    const totalApprenants = sessions.reduce((sum, s) => sum + (s.nombreApprenants || 0), 0);

    // Calculer émargements en attente et évaluations à corriger
    // Pour l'instant, on utilise les valeurs du dashboardStats si elles existent
    const emargementsEnAttente = dashboardStats?.emargementsEnAttente || 0;
    const evaluationsACorreger = dashboardStats?.evaluationsACorreger || 0;
    const prochainsCréneaux = dashboardStats?.prochainsCréneaux || 0;

    return {
      sessionsEnCours,
      sessionsAVenir,
      totalApprenants,
      emargementsEnAttente,
      evaluationsACorreger,
      prochainsCréneaux,
    };
  }, [sessions, dashboardStats]);

  // =====================================
  // FETCH DATA
  // =====================================

  const fetchIntervenantData = useCallback(async (authToken: string) => {
    try {
      console.log("[IntervenantPortalContext] Appel API /api/intervenant/auth...");
      const res = await fetch(`/api/intervenant/auth?token=${encodeURIComponent(authToken)}`);

      console.log("[IntervenantPortalContext] Réponse API status:", res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("[IntervenantPortalContext] Erreur API - Status:", res.status, "- Data:", errorData);
        throw new Error(errorData.error || "Token invalide");
      }

      const data = await res.json();
      console.log("[IntervenantPortalContext] Données reçues:", {
        intervenant: !!data.intervenant,
        organization: !!data.organization,
        sessions: data.sessions?.length || 0,
      });

      setIntervenant(data.intervenant);
      setOrganization(data.organization);
      setSessions(data.sessions || []);

      // Sélectionner la première session par défaut
      if (data.sessions?.length > 0 && !selectedSessionId) {
        setSelectedSessionId(data.sessions[0].id);
      }

      return true;
    } catch (error) {
      console.error("[IntervenantPortalContext] Erreur authentification intervenant:", error);
      return false;
    }
  }, [selectedSessionId]);

  // =====================================
  // INIT - Charger token depuis localStorage
  // =====================================

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      const storedToken = localStorage.getItem("intervenant_token");
      const storedSessionId = localStorage.getItem("intervenant_selected_session");

      console.log("[IntervenantPortalContext] Init auth - token présent:", !!storedToken);

      if (storedSessionId) {
        setSelectedSessionId(storedSessionId);
      }

      if (storedToken) {
        console.log("[IntervenantPortalContext] Validation du token en cours...");
        const success = await fetchIntervenantData(storedToken);
        console.log("[IntervenantPortalContext] Résultat validation:", success);
        if (success) {
          setToken(storedToken);
        } else {
          // Token invalide, nettoyer
          console.log("[IntervenantPortalContext] Token invalide, nettoyage...");
          localStorage.removeItem("intervenant_token");
          localStorage.removeItem("intervenant_selected_session");
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, [fetchIntervenantData]);

  // =====================================
  // ACTIONS
  // =====================================

  const login = useCallback(async (newToken: string) => {
    setIsLoading(true);

    const success = await fetchIntervenantData(newToken);

    if (success) {
      setToken(newToken);
      localStorage.setItem("intervenant_token", newToken);
    }

    setIsLoading(false);
  }, [fetchIntervenantData]);

  const logout = useCallback(() => {
    setToken(null);
    setIntervenant(null);
    setOrganization(null);
    setSessions([]);
    setSelectedSessionId(null);
    setDashboardStats(null);

    localStorage.removeItem("intervenant_token");
    localStorage.removeItem("intervenant_selected_session");

    router.push("/intervenant/login");
  }, [router]);

  const selectSession = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
    localStorage.setItem("intervenant_selected_session", sessionId);
  }, []);

  const refreshData = useCallback(async () => {
    if (token) {
      await fetchIntervenantData(token);
    }
  }, [token, fetchIntervenantData]);

  // =====================================
  // CONTEXT VALUE
  // =====================================

  const value: IntervenantPortalContextType = {
    // Auth
    token,
    isAuthenticated,
    isLoading,

    // Data
    intervenant,
    organization,
    sessions,
    selectedSession,
    dashboardStats: computedStats, // Utiliser les stats calculées automatiquement

    // Actions
    login,
    logout,
    selectSession,
    refreshData,
    setDashboardStats,
  };

  return (
    <IntervenantPortalContext.Provider value={value}>
      {children}
    </IntervenantPortalContext.Provider>
  );
}

// =====================================
// HOOK
// =====================================

export function useIntervenantPortal() {
  const context = useContext(IntervenantPortalContext);

  if (context === undefined) {
    throw new Error("useIntervenantPortal must be used within an IntervenantPortalProvider");
  }

  return context;
}

// =====================================
// HOOK - Require Auth (redirect si pas connecté)
// =====================================

export function useRequireIntervenantAuth() {
  const context = useIntervenantPortal();
  const router = useRouter();

  useEffect(() => {
    if (!context.isLoading && !context.isAuthenticated) {
      router.push("/intervenant/login");
    }
  }, [context.isLoading, context.isAuthenticated, router]);

  return context;
}
