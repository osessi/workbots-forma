"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// Helper pour convertir hex en HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 217, s: 100, l: 63 }; // Default brand color

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Appliquer la couleur primaire aux CSS variables
function applyPrimaryColor(hex: string) {
  const hsl = hexToHSL(hex);
  const root = document.documentElement;

  // Couleur principale
  root.style.setProperty("--color-brand-500", hex);
  root.style.setProperty("--color-brand-hue", hsl.h.toString());
  root.style.setProperty("--color-brand-saturation", `${hsl.s}%`);
  root.style.setProperty("--color-brand-lightness", `${hsl.l}%`);

  // Variantes plus claires
  root.style.setProperty("--color-brand-25", `hsl(${hsl.h}, ${hsl.s}%, 98%)`);
  root.style.setProperty("--color-brand-50", `hsl(${hsl.h}, ${hsl.s}%, 95%)`);
  root.style.setProperty("--color-brand-100", `hsl(${hsl.h}, ${hsl.s}%, 90%)`);
  root.style.setProperty("--color-brand-200", `hsl(${hsl.h}, ${hsl.s}%, 82%)`);
  root.style.setProperty("--color-brand-300", `hsl(${hsl.h}, ${hsl.s}%, 72%)`);
  root.style.setProperty("--color-brand-400", `hsl(${hsl.h}, ${hsl.s}%, ${Math.min(hsl.l + 8, 70)}%)`);

  // Variantes plus foncées
  root.style.setProperty("--color-brand-600", `hsl(${hsl.h}, ${hsl.s}%, ${Math.max(hsl.l - 8, 25)}%)`);
  root.style.setProperty("--color-brand-700", `hsl(${hsl.h}, ${hsl.s}%, ${Math.max(hsl.l - 16, 20)}%)`);
  root.style.setProperty("--color-brand-800", `hsl(${hsl.h}, ${hsl.s}%, ${Math.max(hsl.l - 24, 15)}%)`);
  root.style.setProperty("--color-brand-900", `hsl(${hsl.h}, ${hsl.s}%, ${Math.max(hsl.l - 32, 10)}%)`);
  root.style.setProperty("--color-brand-950", `hsl(${hsl.h}, ${hsl.s}%, ${Math.max(hsl.l - 40, 8)}%)`);
}

// Types
export interface UserProfile {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  entreprise: string;
  siret: string;
  adresse: string;
  codePostal: string;
  ville: string;
  numeroFormateur: string;
  prefectureRegion: string; // Région d'acquisition du NDA
  siteWeb: string; // Site web de l'organisme
  avatarUrl?: string | null;
  logoUrl?: string | null;
  signatureUrl?: string | null;
  primaryColor?: string;
}

export interface Formation {
  id: string;
  titre: string;
  image: string;
  dateCreation: string;
  status: "complete" | "en_cours" | "brouillon";
  // Champs additionnels de la BDD
  description?: string;
  fichePedagogique?: Record<string, unknown>;
  modules?: Array<{
    id: string;
    titre: string;
    ordre: number;
    contenu?: Record<string, unknown>;
    duree?: number;
  }>;
  documentsCount?: number;
  // LMS
  isPublished?: boolean;
  publishedAt?: string;
  // Catalogue public
  estPublieCatalogue?: boolean;
  // Badges - Qualiopi
  isCertifiante?: boolean;
  numeroFicheRS?: string | null;
  estEligibleCPF?: boolean;
  accessibiliteHandicap?: string | null;
  // Durée et modalités
  dureeHeures?: number;
  dureeJours?: number;
  modalites?: string[];
  // Indicateurs
  indicateurs?: {
    tauxSatisfaction: number | null;
    nombreAvis: number;
    nombreStagiaires: number;
  } | null;
  // Nombre de modules
  nombreModules?: number;
}

interface AutomateContextType {
  // User
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
  isLoadingUser: boolean;
  refreshUser: () => Promise<void>;

  // Formations
  formations: Formation[];
  isLoadingFormations: boolean;
  addFormation: (formation: Omit<Formation, "id">) => Promise<Formation | null>;
  updateFormation: (id: string, updates: Partial<Formation>) => Promise<void>;
  deleteFormation: (id: string) => Promise<void>;
  getFormationById: (id: string) => Formation | undefined;
  refreshFormations: () => Promise<void>;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredFormations: Formation[];

  // Branding
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
}

// Valeurs par défaut - vides pour les infos entreprise
const defaultUser: UserProfile = {
  prenom: "",
  nom: "",
  email: "",
  telephone: "",
  entreprise: "",
  siret: "",
  adresse: "",
  codePostal: "",
  ville: "",
  numeroFormateur: "",
  prefectureRegion: "",
  siteWeb: "",
  avatarUrl: null,
  logoUrl: null,
  signatureUrl: null,
};

// Images par défaut pour les formations
const DEFAULT_FORMATION_IMAGES = [
  "/images/cards/card-01.png",
  "/images/cards/card-02.png",
  "/images/cards/card-03.png",
];

// Helper pour obtenir une image aléatoire
const getRandomFormationImage = () => {
  return DEFAULT_FORMATION_IMAGES[Math.floor(Math.random() * DEFAULT_FORMATION_IMAGES.length)];
};

// Helper pour convertir le statut Prisma vers le format frontend
const mapPrismaStatusToFrontend = (status: string): "complete" | "en_cours" | "brouillon" => {
  switch (status) {
    case "TERMINEE":
      return "complete";
    case "EN_COURS":
      return "en_cours";
    case "BROUILLON":
    default:
      return "brouillon";
  }
};

// Helper pour convertir le statut frontend vers Prisma
const mapFrontendStatusToPrisma = (status: string): string => {
  switch (status) {
    case "complete":
      return "TERMINEE";
    case "en_cours":
      return "EN_COURS";
    case "brouillon":
    default:
      return "BROUILLON";
  }
};

// Helper pour formater la date
const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Couleur par défaut
const DEFAULT_PRIMARY_COLOR = "#4277FF";

const AutomateContext = createContext<AutomateContextType | undefined>(undefined);

export const AutomateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingFormations, setIsLoadingFormations] = useState(true);
  const [primaryColor, setPrimaryColorState] = useState(DEFAULT_PRIMARY_COLOR);

  // Charger le profil utilisateur depuis l'API
  const fetchUserProfile = useCallback(async () => {
    try {
      setIsLoadingUser(true);
      const response = await fetch("/api/user/profile");

      if (response.ok) {
        const data = await response.json();
        const org = data.organization;

        // Récupérer la couleur de l'organisation si disponible
        const orgColor = org?.primaryColor || DEFAULT_PRIMARY_COLOR;

        setUser({
          prenom: data.firstName || "",
          nom: data.lastName || "",
          email: data.email || "",
          telephone: data.phone || "",
          avatarUrl: data.avatar || null,
          // Infos entreprise depuis l'organisation
          entreprise: org?.name || "",
          siret: org?.siret || "",
          numeroFormateur: org?.numeroFormateur || "",
          prefectureRegion: org?.prefectureRegion || "",
          siteWeb: org?.siteWeb || "",
          adresse: org?.adresse || "",
          codePostal: org?.codePostal || "",
          ville: org?.ville || "",
          logoUrl: org?.logo || null,
          signatureUrl: org?.signature || null,
          primaryColor: orgColor,
        });

        // Appliquer la couleur immédiatement
        setPrimaryColorState(orgColor);
        if (typeof window !== "undefined") {
          applyPrimaryColor(orgColor);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement du profil:", error);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  // Charger le profil au montage
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Mettre à jour le profil utilisateur (état local + API)
  const updateUser = useCallback(async (updates: Partial<UserProfile>) => {
    // Mettre à jour l'état local immédiatement
    setUser((prev) => ({ ...prev, ...updates }));

    // Préparer les données pour l'API
    const apiData: Record<string, unknown> = {};

    // Mapper les champs du profil vers l'API
    if (updates.prenom !== undefined) apiData.firstName = updates.prenom;
    if (updates.nom !== undefined) apiData.lastName = updates.nom;
    if (updates.telephone !== undefined) apiData.phone = updates.telephone;
    if (updates.avatarUrl !== undefined) apiData.avatar = updates.avatarUrl;

    // Champs organisation
    if (updates.entreprise !== undefined) apiData.entreprise = updates.entreprise;
    if (updates.siret !== undefined) apiData.siret = updates.siret;
    if (updates.numeroFormateur !== undefined) apiData.numeroFormateur = updates.numeroFormateur;
    if (updates.prefectureRegion !== undefined) apiData.prefectureRegion = updates.prefectureRegion;
    if (updates.siteWeb !== undefined) apiData.siteWeb = updates.siteWeb;
    if (updates.adresse !== undefined) apiData.adresse = updates.adresse;
    if (updates.codePostal !== undefined) apiData.codePostal = updates.codePostal;
    if (updates.ville !== undefined) apiData.ville = updates.ville;

    // Si on a des données à envoyer, appeler l'API
    if (Object.keys(apiData).length > 0) {
      try {
        const response = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Erreur lors de la sauvegarde du profil:", errorData.error);
          // En cas d'erreur, on pourrait annuler les changements locaux
          // mais pour l'instant on garde l'optimistic update
        } else {
          console.log("Profil sauvegardé avec succès");
        }
      } catch (error) {
        console.error("Erreur réseau lors de la sauvegarde du profil:", error);
      }
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUserProfile();
  }, [fetchUserProfile]);

  // Charger les formations depuis l'API
  const fetchFormations = useCallback(async () => {
    try {
      setIsLoadingFormations(true);
      const response = await fetch("/api/formations?limit=100");

      if (response.ok) {
        const result = await response.json();
        // Support both old format (array) and new format ({ data: [], pagination: {} })
        const data = Array.isArray(result) ? result : result.data;

        // Convertir les formations de l'API vers le format frontend
        const formattedFormations: Formation[] = data.map((f: {
          id: string;
          titre: string;
          image?: string;
          status: string;
          description?: string;
          fichePedagogique?: Record<string, unknown>;
          modules?: Array<{
            id: string;
            titre: string;
            ordre: number;
            contenu?: Record<string, unknown>;
            duree?: number;
          }>;
          createdAt: string;
          _count?: { documents: number };
          isPublished?: boolean;
          publishedAt?: string;
          estPublieCatalogue?: boolean;
          // Nouveaux champs pour badges
          isCertifiante?: boolean;
          numeroFicheRS?: string | null;
          estEligibleCPF?: boolean;
          accessibiliteHandicap?: string | null;
          dureeHeures?: number;
          dureeJours?: number;
          modalites?: string[];
          indicateurs?: {
            tauxSatisfaction: number | null;
            nombreAvis: number;
            nombreStagiaires: number;
          } | null;
        }) => ({
          id: f.id,
          titre: f.titre,
          image: f.image || getRandomFormationImage(),
          dateCreation: formatDate(f.createdAt),
          status: mapPrismaStatusToFrontend(f.status),
          description: f.description,
          fichePedagogique: f.fichePedagogique,
          modules: f.modules,
          documentsCount: f._count?.documents || 0,
          isPublished: f.isPublished,
          publishedAt: f.publishedAt,
          estPublieCatalogue: f.estPublieCatalogue,
          // Badges
          isCertifiante: f.isCertifiante,
          numeroFicheRS: f.numeroFicheRS,
          estEligibleCPF: f.estEligibleCPF,
          accessibiliteHandicap: f.accessibiliteHandicap,
          dureeHeures: f.dureeHeures,
          dureeJours: f.dureeJours,
          modalites: f.modalites,
          indicateurs: f.indicateurs,
          nombreModules: f.modules?.length || 0,
        }));

        setFormations(formattedFormations);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des formations:", error);
    } finally {
      setIsLoadingFormations(false);
    }
  }, []);

  // Charger les formations au montage
  useEffect(() => {
    fetchFormations();
  }, [fetchFormations]);

  const refreshFormations = useCallback(async () => {
    await fetchFormations();
  }, [fetchFormations]);

  // Fonction pour changer la couleur primaire
  const setPrimaryColor = useCallback(async (color: string) => {
    // Appliquer immédiatement au DOM
    if (typeof window !== "undefined") {
      applyPrimaryColor(color);
    }
    setPrimaryColorState(color);

    // Sauvegarder dans l'API
    try {
      const response = await fetch("/api/organization/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryColor: color }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Erreur API branding:", data.error);
      } else {
        console.log("Couleur sauvegardée avec succès:", color);
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la couleur:", error);
    }
  }, []);

  // Appliquer la couleur au montage (côté client uniquement)
  useEffect(() => {
    if (typeof window !== "undefined" && primaryColor) {
      applyPrimaryColor(primaryColor);
    }
  }, []);

  // Ajouter une formation (persiste en BDD)
  const addFormation = useCallback(async (formation: Omit<Formation, "id">): Promise<Formation | null> => {
    try {
      const response = await fetch("/api/formations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: formation.titre,
          description: formation.description,
          fichePedagogique: formation.fichePedagogique,
          modules: formation.modules,
        }),
      });

      if (response.ok) {
        const newFormation = await response.json();

        // Convertir vers le format frontend
        const formattedFormation: Formation = {
          id: newFormation.id,
          titre: newFormation.titre,
          image: formation.image || getRandomFormationImage(),
          dateCreation: formatDate(newFormation.createdAt),
          status: mapPrismaStatusToFrontend(newFormation.status),
          description: newFormation.description,
          fichePedagogique: newFormation.fichePedagogique,
          modules: newFormation.modules,
          documentsCount: 0,
        };

        // Ajouter au state local
        setFormations((prev) => [formattedFormation, ...prev]);
        return formattedFormation;
      } else {
        const error = await response.json();
        console.error("Erreur lors de la création:", error);
        return null;
      }
    } catch (error) {
      console.error("Erreur réseau lors de la création:", error);
      return null;
    }
  }, []);

  // Mettre à jour une formation (persiste en BDD)
  const updateFormation = useCallback(async (id: string, updates: Partial<Formation>): Promise<void> => {
    // Optimistic update
    setFormations((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );

    try {
      const apiUpdates: Record<string, unknown> = {};
      if (updates.titre !== undefined) apiUpdates.titre = updates.titre;
      if (updates.description !== undefined) apiUpdates.description = updates.description;
      if (updates.status !== undefined) apiUpdates.status = mapFrontendStatusToPrisma(updates.status);
      if (updates.fichePedagogique !== undefined) apiUpdates.fichePedagogique = updates.fichePedagogique;
      if (updates.image !== undefined) apiUpdates.image = updates.image;

      if (Object.keys(apiUpdates).length > 0) {
        const response = await fetch(`/api/formations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiUpdates),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("Erreur lors de la mise à jour:", error);
          // Rollback en cas d'erreur
          await fetchFormations();
        }
      }
    } catch (error) {
      console.error("Erreur réseau lors de la mise à jour:", error);
      await fetchFormations();
    }
  }, [fetchFormations]);

  // Supprimer une formation (persiste en BDD)
  const deleteFormation = useCallback(async (id: string): Promise<void> => {
    // Optimistic update
    const previousFormations = formations;
    setFormations((prev) => prev.filter((f) => f.id !== id));

    try {
      const response = await fetch(`/api/formations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Erreur lors de la suppression:", error);
        // Rollback
        setFormations(previousFormations);
      }
    } catch (error) {
      console.error("Erreur réseau lors de la suppression:", error);
      setFormations(previousFormations);
    }
  }, [formations]);

  const getFormationById = useCallback(
    (id: string) => formations.find((f) => f.id === id),
    [formations]
  );

  const filteredFormations = formations.filter((formation) =>
    formation.titre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AutomateContext.Provider
      value={{
        user,
        updateUser,
        isLoadingUser,
        refreshUser,
        formations,
        isLoadingFormations,
        addFormation,
        updateFormation,
        deleteFormation,
        getFormationById,
        refreshFormations,
        searchQuery,
        setSearchQuery,
        filteredFormations,
        primaryColor,
        setPrimaryColor,
      }}
    >
      {children}
    </AutomateContext.Provider>
  );
};

export const useAutomate = () => {
  const context = useContext(AutomateContext);
  if (!context) {
    throw new Error("useAutomate must be used within an AutomateProvider");
  }
  return context;
};
