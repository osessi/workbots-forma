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
  // Correction 461: Code postal et ville pour adresse complète
  codePostal: string | null;
  ville: string | null;
  email: string | null;
  telephone: string | null;
  siteWeb: string | null;
  numeroFormateur: string | null;
  // Correction 463: URL certificat Qualiopi
  certificatQualiopiUrl: string | null;
}

interface Formation {
  id: string;
  titre: string;
  description: string | null;
  image: string | null;
  dureeHeures: number | null;
}

interface LMSInscription {
  id: string;
  progression: number;
  statut: "NON_COMMENCE" | "EN_COURS" | "COMPLETE";
  dateInscription: string;
  tempsTotal: number;
  formation: Formation;
}

interface Apprenant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  adresse: string | null;
  entreprise: string | null;
  photoUrl?: string | null;
  createdAt?: string;
  // Correction 567: Consentement newsletter
  newsletterConsent: boolean | null;
  newsletterConsentDate: string | null;
}

interface DashboardStats {
  evaluationsEnAttente: number;
  documentsDisponibles: number;
  emargementsEnAttente: number;
  prochainsCréneaux: number;
  messagesNonLus?: number;
  messagesIntervenantNonLus?: number; // Correction 431 - Messages de l'intervenant non lus
  messagesOrganismeNonLus?: number; // Messages de l'organisme non lus
}

// Qualiopi IND 3 - Certification obtenue par l'apprenant
interface Certification {
  id: string;
  formationId: string;
  formationTitre: string;
  numeroFicheRS: string | null;
  lienFranceCompetences: string | null;
  sessionReference: string;
  dateCertification: string | null;
  numeroCertificat: string | null;
}

// Correction 430 - Session de formation
interface SessionJournee {
  id: string;
  date: string;
  ordre: number;
  heureDebutMatin: string;
  heureFinMatin: string;
  heureDebutAprem: string;
  heureFinAprem: string;
}

interface ApprenantSession {
  participationId: string;
  sessionId: string;
  reference: string;
  nom: string | null;
  status: string;
  modalite: string;
  formation: {
    id: string;
    titre: string;
    image: string | null;
    description: string | null;
  };
  entreprise: {
    id: string;
    raisonSociale: string;
  } | null;
  formateur: {
    id: string;
    nom: string;
    prenom: string;
  } | null;
  lieu: {
    id: string;
    nom: string;
    ville: string | null;
  } | null;
  journees: SessionJournee[];
  dateDebut: string | null;
  dateFin: string | null;
  estConfirme: boolean;
  aAssiste: boolean;
}

interface ApprenantPortalContextType {
  // Auth
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Data
  apprenant: Apprenant | null;
  organization: Organization | null;
  inscriptions: LMSInscription[];
  selectedInscription: LMSInscription | null;
  dashboardStats: DashboardStats | null;
  certifications: Certification[]; // Qualiopi IND 3
  // Correction 430 - Sessions de formation
  sessions: ApprenantSession[];
  selectedSession: ApprenantSession | null;

  // Actions
  login: (token: string) => void;
  logout: () => void;
  selectInscription: (inscriptionId: string) => void;
  selectSession: (sessionId: string) => void; // Correction 430
  refreshData: () => Promise<void>;
  setDashboardStats: (stats: DashboardStats) => void;
}

// =====================================
// CONTEXT
// =====================================

const ApprenantPortalContext = createContext<ApprenantPortalContextType | undefined>(undefined);

// =====================================
// PROVIDER
// =====================================

export function ApprenantPortalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Data state
  const [apprenant, setApprenant] = useState<Apprenant | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [inscriptions, setInscriptions] = useState<LMSInscription[]>([]);
  const [selectedInscriptionId, setSelectedInscriptionId] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]); // Qualiopi IND 3
  // Correction 430 - Sessions de formation
  const [sessions, setSessions] = useState<ApprenantSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Computed
  const isAuthenticated = !!token && !!apprenant;
  const selectedInscription = inscriptions.find(i => i.id === selectedInscriptionId) || inscriptions[0] || null;
  // Correction 430 - Session sélectionnée
  const selectedSession = sessions.find(s => s.sessionId === selectedSessionId) || sessions[0] || null;

  // =====================================
  // FETCH DATA
  // =====================================

  const fetchApprenantData = useCallback(async (authToken: string) => {
    try {
      console.log("[ApprenantPortalContext] Appel API /api/apprenant/auth...");
      const res = await fetch(`/api/apprenant/auth?token=${encodeURIComponent(authToken)}`);

      console.log("[ApprenantPortalContext] Réponse API status:", res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("[ApprenantPortalContext] Erreur API - Status:", res.status, "- Data:", errorData);
        throw new Error(errorData.error || "Token invalide");
      }

      const data = await res.json();
      console.log("[ApprenantPortalContext] Données reçues:", {
        apprenant: !!data.apprenant,
        organization: !!data.organization,
        inscriptions: data.inscriptions?.length || 0,
      });

      setApprenant(data.apprenant);
      setOrganization(data.organization);
      setInscriptions(data.inscriptions || []);
      setCertifications(data.certifications || []); // Qualiopi IND 3
      // Correction 430 - Sessions de formation
      setSessions(data.sessions || []);

      // Sélectionner la première inscription par défaut
      if (data.inscriptions?.length > 0 && !selectedInscriptionId) {
        setSelectedInscriptionId(data.inscriptions[0].id);
      }

      // Correction 430 - Sélectionner la première session par défaut
      if (data.sessions?.length > 0 && !selectedSessionId) {
        setSelectedSessionId(data.sessions[0].sessionId);
      }

      return true;
    } catch (error) {
      console.error("[ApprenantPortalContext] Erreur authentification apprenant:", error);
      return false;
    }
  }, [selectedInscriptionId]);

  // =====================================
  // INIT - Charger token depuis localStorage
  // =====================================

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      const storedToken = localStorage.getItem("apprenant_token");
      const storedInscriptionId = localStorage.getItem("apprenant_selected_inscription");
      // Correction 430 - Session sauvegardée
      const storedSessionId = localStorage.getItem("apprenant_selected_session");

      console.log("[ApprenantPortalContext] Init auth - token présent:", !!storedToken);

      if (storedInscriptionId) {
        setSelectedInscriptionId(storedInscriptionId);
      }

      // Correction 430
      if (storedSessionId) {
        setSelectedSessionId(storedSessionId);
      }

      if (storedToken) {
        console.log("[ApprenantPortalContext] Validation du token en cours...");
        const success = await fetchApprenantData(storedToken);
        console.log("[ApprenantPortalContext] Résultat validation:", success);
        if (success) {
          setToken(storedToken);
        } else {
          // Token invalide, nettoyer
          console.log("[ApprenantPortalContext] Token invalide, nettoyage...");
          localStorage.removeItem("apprenant_token");
          localStorage.removeItem("apprenant_selected_inscription");
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, [fetchApprenantData]);

  // =====================================
  // ACTIONS
  // =====================================

  const login = useCallback(async (newToken: string) => {
    setIsLoading(true);

    const success = await fetchApprenantData(newToken);

    if (success) {
      setToken(newToken);
      localStorage.setItem("apprenant_token", newToken);
    }

    setIsLoading(false);
  }, [fetchApprenantData]);

  const logout = useCallback(() => {
    setToken(null);
    setApprenant(null);
    setOrganization(null);
    setInscriptions([]);
    setSelectedInscriptionId(null);
    setDashboardStats(null);
    setCertifications([]); // Qualiopi IND 3
    // Correction 430
    setSessions([]);
    setSelectedSessionId(null);

    localStorage.removeItem("apprenant_token");
    localStorage.removeItem("apprenant_selected_inscription");
    localStorage.removeItem("apprenant_selected_session"); // Correction 430

    router.push("/apprenant");
  }, [router]);

  const selectInscription = useCallback((inscriptionId: string) => {
    setSelectedInscriptionId(inscriptionId);
    localStorage.setItem("apprenant_selected_inscription", inscriptionId);
  }, []);

  // Correction 430 - Sélectionner une session
  const selectSession = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
    localStorage.setItem("apprenant_selected_session", sessionId);
  }, []);

  const refreshData = useCallback(async () => {
    if (token) {
      await fetchApprenantData(token);
    }
  }, [token, fetchApprenantData]);

  // =====================================
  // CONTEXT VALUE
  // =====================================

  const value: ApprenantPortalContextType = {
    // Auth
    token,
    isAuthenticated,
    isLoading,

    // Data
    apprenant,
    organization,
    inscriptions,
    selectedInscription,
    dashboardStats,
    certifications, // Qualiopi IND 3
    // Correction 430 - Sessions
    sessions,
    selectedSession,

    // Actions
    login,
    logout,
    selectInscription,
    selectSession, // Correction 430
    refreshData,
    setDashboardStats,
  };

  return (
    <ApprenantPortalContext.Provider value={value}>
      {children}
    </ApprenantPortalContext.Provider>
  );
}

// =====================================
// HOOK
// =====================================

export function useApprenantPortal() {
  const context = useContext(ApprenantPortalContext);

  if (context === undefined) {
    throw new Error("useApprenantPortal must be used within an ApprenantPortalProvider");
  }

  return context;
}

// =====================================
// HOOK - Require Auth (redirect si pas connecté)
// =====================================

export function useRequireApprenantAuth() {
  const context = useApprenantPortal();
  const router = useRouter();

  useEffect(() => {
    if (!context.isLoading && !context.isAuthenticated) {
      // Rediriger vers la page de login existante
      router.push("/apprenant");
    }
  }, [context.isLoading, context.isAuthenticated, router]);

  return context;
}
