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
  avatarUrl?: string | null;
  logoUrl?: string | null;
  primaryColor?: string;
}

export interface Formation {
  id: string;
  titre: string;
  image: string;
  dateCreation: string;
  status: "complete" | "en_cours" | "brouillon";
}

interface AutomateContextType {
  // User
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
  isLoadingUser: boolean;
  refreshUser: () => Promise<void>;

  // Formations
  formations: Formation[];
  addFormation: (formation: Omit<Formation, "id">) => void;
  updateFormation: (id: string, updates: Partial<Formation>) => void;
  deleteFormation: (id: string) => void;
  getFormationById: (id: string) => Formation | undefined;

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
  avatarUrl: null,
  logoUrl: null,
};

const defaultFormations: Formation[] = [
  {
    id: "1",
    titre: "Les bases de l'intelligence artificielle",
    image: "/images/cards/card-01.png",
    dateCreation: "03/12/2025",
    status: "complete",
  },
  {
    id: "2",
    titre: "Initiation à Excel pour les débutants",
    image: "/images/cards/card-02.png",
    dateCreation: "18/10/2025",
    status: "complete",
  },
  {
    id: "3",
    titre: "Vendre avec la Communication Non Violente (CNV)",
    image: "/images/cards/card-03.png",
    dateCreation: "09/10/2025",
    status: "en_cours",
  },
  {
    id: "4",
    titre: "Construire un script d'appel de vente efficace",
    image: "/images/cards/card-01.png",
    dateCreation: "11/09/2025",
    status: "complete",
  },
  {
    id: "5",
    titre: "Prendre la parole en public avec confiance",
    image: "/images/cards/card-02.png",
    dateCreation: "15/07/2025",
    status: "brouillon",
  },
  {
    id: "6",
    titre: "Gestion du stress et des émotions au travail",
    image: "/images/cards/card-03.png",
    dateCreation: "17/05/2025",
    status: "complete",
  },
  {
    id: "7",
    titre: "Fidéliser ses clients grâce à la relation commerciale",
    image: "/images/cards/card-01.png",
    dateCreation: "22/04/2025",
    status: "complete",
  },
  {
    id: "8",
    titre: "Conduire des réunions de formation efficaces et dynamiques",
    image: "/images/cards/card-02.png",
    dateCreation: "08/03/2025",
    status: "complete",
  },
  {
    id: "9",
    titre: "Construire un script d'appel de vente performant",
    image: "/images/cards/card-03.png",
    dateCreation: "12/02/2025",
    status: "complete",
  },
  {
    id: "10",
    titre: 'Gérer les objections et transformer les "non" en opportunités',
    image: "/images/cards/card-01.png",
    dateCreation: "24/01/2025",
    status: "complete",
  },
];

// Couleur par défaut
const DEFAULT_PRIMARY_COLOR = "#4277FF";

const AutomateContext = createContext<AutomateContextType | undefined>(undefined);

export const AutomateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [formations, setFormations] = useState<Formation[]>(defaultFormations);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingUser, setIsLoadingUser] = useState(true);
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
          adresse: org?.adresse || "",
          codePostal: org?.codePostal || "",
          ville: org?.ville || "",
          logoUrl: org?.logo || null,
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

  const updateUser = useCallback((updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUserProfile();
  }, [fetchUserProfile]);

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

  const addFormation = useCallback((formation: Omit<Formation, "id">) => {
    const newId = (Math.max(...formations.map((f) => parseInt(f.id))) + 1).toString();
    setFormations((prev) => [{ ...formation, id: newId }, ...prev]);
  }, [formations]);

  const updateFormation = useCallback((id: string, updates: Partial<Formation>) => {
    setFormations((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  }, []);

  const deleteFormation = useCallback((id: string) => {
    setFormations((prev) => prev.filter((f) => f.id !== id));
  }, []);

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
        addFormation,
        updateFormation,
        deleteFormation,
        getFormationById,
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
