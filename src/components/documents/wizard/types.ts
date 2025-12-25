// Types pour le wizard Documents

export type WizardStep = "clients" | "tarifs" | "lieu" | "formateurs" | "documents";

export type ClientType = "ENTREPRISE" | "INDEPENDANT" | "PARTICULIER";

// Données de la BDD
export interface Entreprise {
  id: string;
  raisonSociale: string;
  siret: string | null;
  contactNom: string | null;
  contactPrenom: string | null;
  contactEmail: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
}

export interface Apprenant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  statut: "SALARIE" | "INDEPENDANT" | "PARTICULIER";
  entrepriseId: string | null;
  entreprise?: Entreprise | null;
}

export interface Intervenant {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  fonction: string | null;
  specialites: string[];
}

export interface LieuFormation {
  id: string;
  nom: string;
  typeLieu: "PRESENTIEL" | "VISIOCONFERENCE";
  lieuFormation: string;
  codePostal: string | null;
  ville: string | null;
  infosPratiques: string | null;
  capacite: number | null;
}

// Types de financeurs étendus
export type FinanceurType =
  | "OPCO"
  | "AGEFIPH"
  | "CAISSE_DEPOTS"
  | "ETAT"
  | "FOND_ASSURANCE"
  | "FRANCE_TRAVAIL"
  | "INSTANCES_EUROPEENNES"
  | "OPACIF"
  | "OPCA"
  | "REGION"
  | "ORGANISME_PUBLIC"
  | "AUTRE";

export const financeurTypeLabels: Record<FinanceurType, string> = {
  OPCO: "OPCO",
  AGEFIPH: "Agefiph",
  CAISSE_DEPOTS: "Caisse des Dépôts",
  ETAT: "État",
  FOND_ASSURANCE: "Fond d'assurance formation des non salariés",
  FRANCE_TRAVAIL: "France Travail",
  INSTANCES_EUROPEENNES: "Instances Européennes",
  OPACIF: "OPACIF",
  OPCA: "OPCA",
  REGION: "Région",
  ORGANISME_PUBLIC: "Autre public",
  AUTRE: "Autre",
};

export interface Financeur {
  id: string;
  nom: string;
  type: FinanceurType;
}

// Données du wizard
export interface SessionClient {
  id: string;
  type: ClientType;
  entrepriseId?: string;
  entreprise?: Entreprise;
  apprenantId?: string; // Pour indépendant ou particulier
  apprenant?: Apprenant;
  apprenants: Apprenant[]; // Apprenants sélectionnés (pour entreprise)
}

// Financement individuel
export interface ClientFinancement {
  id: string;
  financeurId: string;
  financeur?: Financeur;
  montant: number;
}

export interface SessionTarif {
  clientId: string;
  tarifHT: number;
  tauxTVA: number; // Taux de TVA en % (défaut 20)
  financements: ClientFinancement[]; // Plusieurs financeurs possibles
  totalFinance: number; // Somme des montants financés
  resteAChargeHT: number; // Reste à charge HT (tarifHT - totalFinance)
  montantTVA: number; // Montant de la TVA sur le reste à charge
  resteAChargeTTC: number; // Reste à charge TTC final
}

export interface SessionJournee {
  id: string;
  date: string;
  horaireMatin: string;
  horaireApresMidi: string;
}

export interface SessionLieu {
  modalite: "PRESENTIEL" | "DISTANCIEL" | "MIXTE";
  lieuId: string | null;
  lieu?: LieuFormation;
  adresseLibre: string;
  lienConnexion: string;
  journees: SessionJournee[];
}

export interface SessionFormateurs {
  formateurPrincipalId: string | null;
  formateurPrincipal?: Intervenant;
  coformateursIds: string[];
  coformateurs: Intervenant[];
}

// État complet du wizard
export interface WizardData {
  clients: SessionClient[];
  tarifs: SessionTarif[];
  lieu: SessionLieu;
  formateurs: SessionFormateurs;
}

// Props du formation (venant de la fiche pédagogique)
export interface FormationInfo {
  id?: string;
  titre: string;
  tarifEntreprise: number;
  tarifIndependant: number;
  tarifParticulier: number;
  dureeHeures: number;
  dureeJours: number;
}

// Initialisation des données
export const initialWizardData: WizardData = {
  clients: [],
  tarifs: [],
  lieu: {
    modalite: "PRESENTIEL",
    lieuId: null,
    adresseLibre: "",
    lienConnexion: "",
    journees: [
      {
        id: "1",
        date: "",
        horaireMatin: "09:00 - 12:30",
        horaireApresMidi: "14:00 - 17:30",
      },
    ],
  },
  formateurs: {
    formateurPrincipalId: null,
    coformateursIds: [],
    coformateurs: [],
  },
};
