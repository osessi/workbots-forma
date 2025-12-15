"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

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

const defaultUser: UserProfile = {
  prenom: "Fabien",
  nom: "Durand",
  email: "fabien.durand@email.com",
  telephone: "06 12 34 56 78",
  entreprise: "Formation Pro SARL",
  siret: "123 456 789 00012",
  adresse: "15 rue de la Formation",
  codePostal: "75001",
  ville: "Paris",
  numeroFormateur: "11 75 12345 67",
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

  const updateUser = useCallback((updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
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
