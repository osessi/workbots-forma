"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

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

const AutomateContext = createContext<AutomateContextType | undefined>(undefined);

export const AutomateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [formations, setFormations] = useState<Formation[]>(defaultFormations);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Charger le profil utilisateur depuis l'API
  const fetchUserProfile = useCallback(async () => {
    try {
      setIsLoadingUser(true);
      const response = await fetch("/api/user/profile");

      if (response.ok) {
        const data = await response.json();
        const org = data.organization;
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
        });
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
