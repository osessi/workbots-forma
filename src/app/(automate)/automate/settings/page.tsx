"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useAutomate } from "@/context/AutomateContext";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import OrganigrammeTab from "@/components/automate/settings/OrganigrammeTab";
import ProceduresTab from "@/components/automate/settings/ProceduresTab";

// Icons
const BuildingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.33333 17.5V4.16667C3.33333 3.24619 4.07953 2.5 5 2.5H15C15.9205 2.5 16.6667 3.24619 16.6667 4.16667V17.5M3.33333 17.5H16.6667M3.33333 17.5H1.66667M16.6667 17.5H18.3333M6.66667 5.83333H8.33333M6.66667 9.16667H8.33333M11.6667 5.83333H13.3333M11.6667 9.16667H13.3333M8.33333 17.5V13.3333C8.33333 12.8731 8.70643 12.5 9.16667 12.5H10.8333C11.2936 12.5 11.6667 12.8731 11.6667 13.3333V17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.1667 17.5V15.8333C14.1667 14.9493 13.8155 14.1014 13.1904 13.4763C12.5652 12.8512 11.7174 12.5 10.8333 12.5H4.16667C3.28261 12.5 2.43476 12.8512 1.80964 13.4763C1.18452 14.1014 0.833333 14.9493 0.833333 15.8333V17.5M19.1667 17.5V15.8333C19.1662 15.0948 18.9203 14.3773 18.4678 13.7936C18.0153 13.2099 17.3818 12.793 16.6667 12.6083M13.3333 2.60833C14.0503 2.79192 14.6859 3.20892 15.1397 3.79359C15.5935 4.37827 15.8399 5.09736 15.8399 5.8375C15.8399 6.57764 15.5935 7.29673 15.1397 7.88141C14.6859 8.46608 14.0503 8.88308 13.3333 9.06667M10.8333 5.83333C10.8333 7.67428 9.34095 9.16667 7.5 9.16667C5.65905 9.16667 4.16667 7.67428 4.16667 5.83333C4.16667 3.99238 5.65905 2.5 7.5 2.5C9.34095 2.5 10.8333 3.99238 10.8333 5.83333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 6.66667C2.5 5.74619 3.24619 5 4.16667 5H5.83333L7.5 3.33333H12.5L14.1667 5H15.8333C16.7538 5 17.5 5.74619 17.5 6.66667V14.1667C17.5 15.0871 16.7538 15.8333 15.8333 15.8333H4.16667C3.24619 15.8333 2.5 15.0871 2.5 14.1667V6.66667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PaletteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 17.5C14.1421 17.5 17.5 14.1421 17.5 10C17.5 5.85786 14.1421 2.5 10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.66667 10.8333C7.12691 10.8333 7.5 10.4602 7.5 10C7.5 9.53976 7.12691 9.16667 6.66667 9.16667C6.20643 9.16667 5.83333 9.53976 5.83333 10C5.83333 10.4602 6.20643 10.8333 6.66667 10.8333Z" fill="currentColor"/>
    <path d="M10 7.5C10.4602 7.5 10.8333 7.12691 10.8333 6.66667C10.8333 6.20643 10.4602 5.83333 10 5.83333C9.53976 5.83333 9.16667 6.20643 9.16667 6.66667C9.16667 7.12691 9.53976 7.5 10 7.5Z" fill="currentColor"/>
    <path d="M13.3333 10.8333C13.7936 10.8333 14.1667 10.4602 14.1667 10C14.1667 9.53976 13.7936 9.16667 13.3333 9.16667C12.8731 9.16667 12.5 9.53976 12.5 10C12.5 10.4602 12.8731 10.8333 13.3333 10.8333Z" fill="currentColor"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.66667 7.5H18.3333M3.33333 3.33333H16.6667C17.5871 3.33333 18.3333 4.07953 18.3333 5V15C18.3333 15.9205 17.5871 16.6667 16.6667 16.6667H3.33333C2.41286 16.6667 1.66667 15.9205 1.66667 15V5C1.66667 4.07953 2.41286 3.33333 3.33333 3.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 12.5H8.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const OrganigrammeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2.5V6.66667M10 6.66667H5.83333M10 6.66667H14.1667M5.83333 6.66667V8.33333M5.83333 6.66667H2.5C2.5 6.66667 2.5 8.33333 2.5 8.33333V10.8333C2.5 11.2936 2.8731 11.6667 3.33333 11.6667H8.33333C8.79357 11.6667 9.16667 11.2936 9.16667 10.8333V8.33333C9.16667 7.8731 8.79357 7.5 8.33333 7.5H3.33333C2.8731 7.5 2.5 7.8731 2.5 8.33333M14.1667 6.66667V8.33333M14.1667 6.66667H17.5C17.5 6.66667 17.5 8.33333 17.5 8.33333V10.8333C17.5 11.2936 17.1269 11.6667 16.6667 11.6667H11.6667C11.2064 11.6667 10.8333 11.2936 10.8333 10.8333V8.33333C10.8333 7.8731 11.2064 7.5 11.6667 7.5H16.6667C17.1269 7.5 17.5 7.8731 17.5 8.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="7.5" y="1.66667" width="5" height="3.33333" rx="0.833333" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5.83333 11.6667V13.3333M14.1667 11.6667V13.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="3.33333" y="13.3333" width="5" height="4.16667" rx="0.833333" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11.6667" y="13.3333" width="5" height="4.16667" rx="0.833333" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon for procedures
const ProceduresIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.66667 2.5H4.16667C3.24619 2.5 2.5 3.24619 2.5 4.16667V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V4.16667C17.5 3.24619 16.7538 2.5 15.8333 2.5H13.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6.66667 2.5H13.3333V5C13.3333 5.46024 12.9602 5.83333 12.5 5.83333H7.5C7.03976 5.83333 6.66667 5.46024 6.66667 5V2.5Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6.66667 10H13.3333M6.66667 13.3333H10.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Tabs
type TabType = "organisme" | "organigramme" | "procedures" | "members" | "branding" | "billing";

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: "organisme", label: "Organisme de formation", icon: <BuildingIcon /> },
  { id: "organigramme", label: "Organigramme", icon: <OrganigrammeIcon /> },
  { id: "procedures", label: "Procédures Qualité", icon: <ProceduresIcon /> },
  { id: "members", label: "Membres", icon: <UsersIcon /> },
  { id: "branding", label: "Marque blanche", icon: <PaletteIcon /> },
  { id: "billing", label: "Facturation", icon: <CreditCardIcon /> },
];

// Interface pour les données de l'organisme
interface OrganismeData {
  name: string;
  nomCommercial: string;
  siret: string;
  villeRcs: string;
  numeroFormateur: string;
  prefectureRegion: string;
  representantNom: string;
  representantPrenom: string;
  representantFonction: string;
  adresse: string;
  codePostal: string;
  ville: string;
  email: string;
  telephone: string;
  siteWeb: string;
  logo: string;
  signature: string;
  cachet: string;
}

// Preset colors for branding
const presetColors = [
  "#4277FF", // Brand blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#EF4444", // Red
  "#F97316", // Orange
  "#EAB308", // Yellow
  "#22C55E", // Green
  "#14B8A6", // Teal
  "#06B6D4", // Cyan
];

// Plan limits
const PLAN_LIMITS = {
  FREE: { maxFormateurs: 1, maxFormations: 5, maxStorageGb: 1 },
  STARTER: { maxFormateurs: 3, maxFormations: 20, maxStorageGb: 5 },
  PRO: { maxFormateurs: 10, maxFormations: 100, maxStorageGb: 25 },
  ENTERPRISE: { maxFormateurs: -1, maxFormations: -1, maxStorageGb: 100 }, // -1 = illimité
};

// Composant qui utilise useSearchParams (doit être dans Suspense)
function SettingsTabHandler({ onTabChange }: { onTabChange: (tab: TabType) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") as TabType | null;
    if (tabFromUrl && tabs.some(t => t.id === tabFromUrl)) {
      onTabChange(tabFromUrl);
    }
  }, [searchParams, onTabChange]);

  return null;
}

// Helper pour upload des images
async function uploadOrganismeImage(file: File, type: "logo" | "signature" | "cachet"): Promise<{ url: string | null; error: string | null }> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const response = await fetch("/api/user/avatar", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { url: null, error: data.error || "Erreur lors de l'upload" };
    }

    return { url: data.url, error: null };
  } catch {
    return { url: null, error: "Erreur de connexion" };
  }
}

export default function SettingsPage() {
  const { user, primaryColor, setPrimaryColor, refreshUser } = useAutomate();
  const [activeTab, setActiveTab] = useState<TabType>("organisme");

  // Refs pour les inputs file
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const signatureInputRef = React.useRef<HTMLInputElement>(null);
  const cachetInputRef = React.useRef<HTMLInputElement>(null);

  // Upload states
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [isUploadingCachet, setIsUploadingCachet] = useState(false);

  // Organisme state
  const [organisme, setOrganisme] = useState<OrganismeData>({
    name: "",
    nomCommercial: "",
    siret: "",
    villeRcs: "",
    numeroFormateur: "",
    prefectureRegion: "",
    representantNom: "",
    representantPrenom: "",
    representantFonction: "",
    adresse: "",
    codePostal: "",
    ville: "",
    email: "",
    telephone: "",
    siteWeb: "",
    logo: "",
    signature: "",
    cachet: "",
  });
  const [isLoadingOrganisme, setIsLoadingOrganisme] = useState(true);
  const [isSavingOrganisme, setIsSavingOrganisme] = useState(false);
  const [organismeMessage, setOrganismeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Charger les données de l'organisme
  useEffect(() => {
    const loadOrganisme = async () => {
      try {
        const response = await fetch("/api/user/organization");
        if (response.ok) {
          const data = await response.json();
          if (data.organization) {
            setOrganisme({
              name: data.organization.name || "",
              nomCommercial: data.organization.nomCommercial || "",
              siret: data.organization.siret || "",
              villeRcs: data.organization.villeRcs || "",
              numeroFormateur: data.organization.numeroFormateur || "",
              prefectureRegion: data.organization.prefectureRegion || "",
              representantNom: data.organization.representantNom || "",
              representantPrenom: data.organization.representantPrenom || "",
              representantFonction: data.organization.representantFonction || "",
              adresse: data.organization.adresse || "",
              codePostal: data.organization.codePostal || "",
              ville: data.organization.ville || "",
              email: data.organization.email || "",
              telephone: data.organization.telephone || "",
              siteWeb: data.organization.siteWeb || "",
              logo: data.organization.logo || "",
              signature: data.organization.signature || "",
              cachet: data.organization.cachet || "",
            });
          }
        }
      } catch (error) {
        console.error("Erreur chargement organisme:", error);
      } finally {
        setIsLoadingOrganisme(false);
      }
    };
    loadOrganisme();
  }, []);

  const handleOrganismeChange = (field: keyof OrganismeData, value: string) => {
    setOrganisme(prev => ({ ...prev, [field]: value }));
    setOrganismeMessage(null);
  };

  const handleSaveOrganisme = async () => {
    setIsSavingOrganisme(true);
    setOrganismeMessage(null);
    try {
      const response = await fetch("/api/user/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(organisme),
      });

      if (response.ok) {
        setOrganismeMessage({ type: "success", text: "Informations enregistrees avec succes" });
        await refreshUser();
      } else {
        const data = await response.json();
        setOrganismeMessage({ type: "error", text: data.error || "Erreur lors de l'enregistrement" });
      }
    } catch (error) {
      console.error("Erreur sauvegarde organisme:", error);
      setOrganismeMessage({ type: "error", text: "Erreur lors de l'enregistrement" });
    } finally {
      setIsSavingOrganisme(false);
    }
  };

  // Handlers pour upload des images
  const handleImageUpload = async (file: File, type: "logo" | "signature" | "cachet") => {
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5MB");
      return;
    }

    const setLoading = type === "logo" ? setIsUploadingLogo : type === "signature" ? setIsUploadingSignature : setIsUploadingCachet;
    setLoading(true);

    try {
      const result = await uploadOrganismeImage(file, type);
      if (result.url) {
        setOrganisme(prev => ({ ...prev, [type]: result.url }));
        await refreshUser();
      } else {
        alert(result.error || "Erreur lors de l'upload");
      }
    } catch {
      alert("Erreur lors de l'upload de l'image");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file, "logo");
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file, "signature");
    if (signatureInputRef.current) signatureInputRef.current.value = "";
  };

  const handleCachetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file, "cachet");
    if (cachetInputRef.current) cachetInputRef.current.value = "";
  };

  // Members state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"FORMATEUR" | "ORG_ADMIN">("FORMATEUR");
  const [isInviting, setIsInviting] = useState(false);

  const handleInviteMember = async () => {
    if (!inviteEmail) return;

    setIsInviting(true);
    try {
      // TODO: Implement invitation API
      alert(`Invitation envoyée à ${inviteEmail} avec le rôle ${inviteRole}`);
      setInviteEmail("");
    } catch (error) {
      alert("Erreur lors de l'envoi de l'invitation");
    } finally {
      setIsInviting(false);
    }
  };

  // Mock members data
  const mockMembers = [
    { id: "1", name: user.prenom + " " + user.nom, email: user.email, role: "ORG_ADMIN", avatar: user.avatarUrl, status: "active" },
  ];

  return (
    <div className="space-y-6">
      {/* Handler pour lire le tab depuis l'URL */}
      <Suspense fallback={null}>
        <SettingsTabHandler onTabChange={setActiveTab} />
      </Suspense>

      {/* En-tête */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Paramètres
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Gérez les paramètres de votre organisation
        </p>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 dark:border-gray-800">
          <nav className="flex gap-1 p-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Organisme Tab */}
          {activeTab === "organisme" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Organisme de formation
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Renseignez les informations de votre organisme de formation. Elles sont indispensables pour generer correctement vos documents officiels.
                </p>
              </div>

              {/* Message de succes/erreur */}
              {organismeMessage && (
                <div className={`p-4 rounded-lg ${
                  organismeMessage.type === "success"
                    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                }`}>
                  {organismeMessage.text}
                </div>
              )}

              {isLoadingOrganisme ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Informations legales */}
                  <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Informations legales
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Raison sociale de l&apos;organisme *
                        </label>
                        <input
                          type="text"
                          value={organisme.name}
                          onChange={(e) => handleOrganismeChange("name", e.target.value)}
                          placeholder="Nom juridique de votre organisme"
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Nom commercial de l&apos;organisme
                        </label>
                        <input
                          type="text"
                          value={organisme.nomCommercial}
                          onChange={(e) => handleOrganismeChange("nomCommercial", e.target.value)}
                          placeholder="Nom commercial (si different)"
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Numero SIRET
                        </label>
                        <input
                          type="text"
                          value={organisme.siret}
                          onChange={(e) => handleOrganismeChange("siret", e.target.value)}
                          placeholder="123 456 789 00012"
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Ville d&apos;immatriculation RCS
                        </label>
                        <input
                          type="text"
                          value={organisme.villeRcs}
                          onChange={(e) => handleOrganismeChange("villeRcs", e.target.value)}
                          placeholder="Paris"
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Numero de declaration d&apos;activite (NDA)
                        </label>
                        <input
                          type="text"
                          value={organisme.numeroFormateur}
                          onChange={(e) => handleOrganismeChange("numeroFormateur", e.target.value)}
                          placeholder="11 75 XXXXX 75"
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Delivre par la DREETS (ex-DIRECCTE)
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Region d&apos;enregistrement
                        </label>
                        <input
                          type="text"
                          value={organisme.prefectureRegion}
                          onChange={(e) => handleOrganismeChange("prefectureRegion", e.target.value)}
                          placeholder="Ile-de-France"
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Representant legal */}
                  <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Representant legal
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Nom du representant legal
                        </label>
                        <input
                          type="text"
                          value={organisme.representantNom}
                          onChange={(e) => handleOrganismeChange("representantNom", e.target.value)}
                          placeholder="DUPONT"
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Prenom du representant legal
                        </label>
                        <input
                          type="text"
                          value={organisme.representantPrenom}
                          onChange={(e) => handleOrganismeChange("representantPrenom", e.target.value)}
                          placeholder="Jean"
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Fonction du representant legal
                      </label>
                      <input
                        type="text"
                        value={organisme.representantFonction}
                        onChange={(e) => handleOrganismeChange("representantFonction", e.target.value)}
                        placeholder="Gerant, PDG, Directeur General..."
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                      />
                    </div>
                  </div>

                  {/* Coordonnees */}
                  <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Coordonnees du siege / lieu d&apos;exercice
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Adresse
                      </label>
                      <input
                        type="text"
                        value={organisme.adresse}
                        onChange={(e) => handleOrganismeChange("adresse", e.target.value)}
                        placeholder="123 rue de la Formation"
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Code postal
                        </label>
                        <input
                          type="text"
                          value={organisme.codePostal}
                          onChange={(e) => handleOrganismeChange("codePostal", e.target.value)}
                          placeholder="75001"
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Ville
                        </label>
                        <input
                          type="text"
                          value={organisme.ville}
                          onChange={(e) => handleOrganismeChange("ville", e.target.value)}
                          placeholder="Paris"
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Email de contact
                        </label>
                        <input
                          type="email"
                          value={organisme.email}
                          onChange={(e) => handleOrganismeChange("email", e.target.value)}
                          placeholder="contact@organisme.fr"
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Telephone
                        </label>
                        <input
                          type="tel"
                          value={organisme.telephone}
                          onChange={(e) => handleOrganismeChange("telephone", e.target.value)}
                          placeholder="01 23 45 67 89"
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Site web
                      </label>
                      <input
                        type="url"
                        value={organisme.siteWeb}
                        onChange={(e) => handleOrganismeChange("siteWeb", e.target.value)}
                        placeholder="https://www.votre-organisme.fr"
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                      />
                    </div>
                  </div>

                  {/* Visuels - Logo, Signature, Cachet */}
                  <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Logo, Signature et Cachet
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Ces elements apparaitront sur vos documents officiels (conventions, attestations, etc.)
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Logo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Logo de l&apos;organisme
                        </label>
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                        <div
                          onClick={() => logoInputRef.current?.click()}
                          className="mt-2 flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-400 transition-colors min-h-[100px] cursor-pointer"
                        >
                          {isUploadingLogo ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                          ) : organisme.logo ? (
                            <div className="relative">
                              <Image
                                src={organisme.logo}
                                alt="Logo"
                                width={120}
                                height={60}
                                className="object-contain max-h-16"
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOrganismeChange("logo", ""); }}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <>
                              <CameraIcon />
                              <span className="mt-2 text-xs text-gray-500">Cliquez pour ajouter un logo</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Signature */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Signature du responsable
                        </label>
                        <input
                          ref={signatureInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureChange}
                          className="hidden"
                        />
                        <div
                          onClick={() => signatureInputRef.current?.click()}
                          className="mt-2 flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-400 transition-colors min-h-[100px] cursor-pointer"
                        >
                          {isUploadingSignature ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                          ) : organisme.signature ? (
                            <div className="relative">
                              <Image
                                src={organisme.signature}
                                alt="Signature"
                                width={120}
                                height={60}
                                className="object-contain max-h-16"
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOrganismeChange("signature", ""); }}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span className="mt-2 text-xs text-gray-500">Cliquez pour ajouter une signature</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Cachet */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Cachet de l&apos;entreprise
                        </label>
                        <input
                          ref={cachetInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleCachetChange}
                          className="hidden"
                        />
                        <div
                          onClick={() => cachetInputRef.current?.click()}
                          className="mt-2 flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-400 transition-colors min-h-[100px] cursor-pointer"
                        >
                          {isUploadingCachet ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                          ) : organisme.cachet ? (
                            <div className="relative">
                              <Image
                                src={organisme.cachet}
                                alt="Cachet"
                                width={80}
                                height={80}
                                className="object-contain max-h-16"
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOrganismeChange("cachet", ""); }}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M12 8v8M8 12h8" strokeLinecap="round"/>
                              </svg>
                              <span className="mt-2 text-xs text-gray-500">Cliquez pour ajouter un cachet</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bouton de sauvegarde */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveOrganisme}
                      disabled={isSavingOrganisme}
                      className="px-6 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
                    >
                      {isSavingOrganisme ? "Enregistrement..." : "Enregistrer les modifications"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Organigramme Tab */}
          {activeTab === "organigramme" && <OrganigrammeTab />}

          {/* Procedures Tab */}
          {activeTab === "procedures" && <ProceduresTab />}

          {/* Members Tab */}
          {activeTab === "members" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Membres de l&apos;équipe
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Gérez les accès de votre organisation
                  </p>
                </div>
              </div>

              {/* Invitation form */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Inviter un nouveau membre
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as "FORMATEUR" | "ORG_ADMIN")}
                    className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  >
                    <option value="FORMATEUR">Formateur</option>
                    <option value="ORG_ADMIN">Administrateur</option>
                  </select>
                  <button
                    onClick={handleInviteMember}
                    disabled={isInviting || !inviteEmail}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 whitespace-nowrap"
                  >
                    {isInviting ? "Envoi..." : "Envoyer l'invitation"}
                  </button>
                </div>
              </div>

              {/* Members list */}
              <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Membre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Rôle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {mockMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                              {member.avatar ? (
                                <Image
                                  src={member.avatar}
                                  alt={member.name}
                                  width={40}
                                  height={40}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <UsersIcon />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {member.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                            member.role === "ORG_ADMIN" || member.role === "SUPER_ADMIN"
                              ? "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                          }`}>
                            {member.role === "SUPER_ADMIN" ? "Super Admin" : member.role === "ORG_ADMIN" ? "Admin" : "Formateur"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Actif
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                            {member.role !== "SUPER_ADMIN" && member.role !== "ORG_ADMIN" && "Modifier"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Usage limits */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Membres utilisés
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {mockMembers.length} / {PLAN_LIMITS.FREE.maxFormateurs === -1 ? "Illimité" : PLAN_LIMITS.FREE.maxFormateurs}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-brand-500 h-2 rounded-full"
                    style={{ width: `${Math.min((mockMembers.length / PLAN_LIMITS.FREE.maxFormateurs) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <Link href="/automate/settings?tab=billing" className="text-brand-500 hover:text-brand-600">
                    Passez à un plan supérieur
                  </Link>{" "}
                  pour inviter plus de membres.
                </p>
              </div>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === "branding" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Personnalisation de la marque
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Personnalisez l&apos;apparence de votre espace et documents
                </p>
              </div>

              {/* Color picker */}
              <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Couleur principale
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Cliquez sur une couleur pour l&apos;appliquer instantanément à votre interface
                </p>
                <div className="flex flex-wrap gap-3">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setPrimaryColor(color)}
                      className={`w-10 h-10 rounded-full transition-all ${
                        primaryColor === color
                          ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {primaryColor === color && (
                        <span className="flex items-center justify-center text-white">
                          <CheckIcon />
                        </span>
                      )}
                    </button>
                  ))}
                  <div className="relative">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="absolute inset-0 w-10 h-10 opacity-0 cursor-pointer"
                    />
                    <div
                      className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <span className="text-xs text-gray-400">+</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Couleur actuelle: {primaryColor}
                </p>
              </div>

              {/* Custom domain */}
              <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      Domaine personnalisé
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Utilisez votre propre domaine pour accéder à votre espace
                    </p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 rounded-full">
                    Plan Pro requis
                  </span>
                </div>
                <div className="mt-4">
                  <input
                    type="text"
                    value=""
                    placeholder="formation.votre-domaine.com"
                    disabled
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-100 dark:bg-gray-900 dark:border-gray-700 text-gray-400 cursor-not-allowed"
                    readOnly
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Aperçu
                </h3>
                <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                  {user.logoUrl ? (
                    <Image
                      src={user.logoUrl}
                      alt="Logo"
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: primaryColor + "20" }}
                    >
                      <span style={{ color: primaryColor }} className="text-lg font-bold">
                        {user.entreprise?.charAt(0) || "A"}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {user.entreprise || "Votre Organisation"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Organisme de formation
                    </p>
                  </div>
                </div>
                {/* Sample buttons preview */}
                <div className="mt-4 flex gap-3">
                  <button
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Bouton primaire
                  </button>
                  <button
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                    style={{ color: primaryColor, backgroundColor: primaryColor + "15" }}
                  >
                    Bouton secondaire
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Facturation et abonnement
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gérez votre abonnement et vos factures
                </p>
              </div>

              {/* Current plan */}
              <div className="p-6 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-brand-100 text-sm">Plan actuel</p>
                    <h3 className="text-2xl font-bold mt-1">Gratuit</h3>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium bg-white/20 rounded-full">
                    Actif
                  </span>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-brand-100 text-xs">Formateurs</p>
                    <p className="font-semibold">{mockMembers.length} / {PLAN_LIMITS.FREE.maxFormateurs}</p>
                  </div>
                  <div>
                    <p className="text-brand-100 text-xs">Formations</p>
                    <p className="font-semibold">0 / {PLAN_LIMITS.FREE.maxFormations}</p>
                  </div>
                  <div>
                    <p className="text-brand-100 text-xs">Stockage</p>
                    <p className="font-semibold">0 / {PLAN_LIMITS.FREE.maxStorageGb} Go</p>
                  </div>
                </div>
              </div>

              {/* Payment Method Card */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Moyen de paiement
                  </h3>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors">
                    Modifier
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                    {/* Credit Card Visual */}
                    <div className="w-full max-w-[320px] aspect-[1.6/1] rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 p-5 text-white shadow-lg relative overflow-hidden flex-shrink-0">
                      {/* Card chip */}
                      <div className="w-10 h-7 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md mb-6 flex items-center justify-center">
                        <div className="w-6 h-4 border border-yellow-600/50 rounded-sm"></div>
                      </div>
                      {/* Card number */}
                      <p className="font-mono text-lg tracking-widest mb-6">
                        •••• •••• •••• 4242
                      </p>
                      {/* Card details */}
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase">Titulaire</p>
                          <p className="text-sm font-medium truncate max-w-[120px]">
                            {user.prenom && user.nom
                              ? `${user.prenom} ${user.nom}`.toUpperCase()
                              : "TITULAIRE"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase">Expire</p>
                          <p className="text-sm font-medium">12/26</p>
                        </div>
                        <div className="text-right">
                          <svg width="50" height="30" viewBox="0 0 50 30" fill="none">
                            <circle cx="18" cy="15" r="12" fill="#EB001B" fillOpacity="0.9"/>
                            <circle cx="32" cy="15" r="12" fill="#F79E1B" fillOpacity="0.9"/>
                          </svg>
                        </div>
                      </div>
                      {/* Decorative circles */}
                      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/5"></div>
                      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/5"></div>
                    </div>
                    {/* Card Info */}
                    <div className="flex-1 min-w-0">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex px-2.5 py-1 text-xs font-medium bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 rounded-full">
                            Par défaut
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Mastercard se terminant par <span className="font-medium text-gray-900 dark:text-white">4242</span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Expire le <span className="font-medium">12/2026</span>
                        </p>
                        <div className="flex flex-wrap gap-3 pt-2">
                          <button className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium">
                            Changer de carte
                          </button>
                          <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 font-medium">
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upgrade options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Starter */}
                <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Starter</h3>
                  <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
                    29€<span className="text-sm font-normal text-gray-500">/mois</span>
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckIcon /> 3 formateurs
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon /> 20 formations
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon /> 5 Go stockage
                    </li>
                  </ul>
                  <button className="w-full mt-6 px-4 py-2.5 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400">
                    Passer à Starter
                  </button>
                </div>

                {/* Pro */}
                <div className="p-6 border-2 border-brand-500 rounded-xl relative">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-medium bg-brand-500 text-white rounded-full">
                    Populaire
                  </span>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Pro</h3>
                  <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
                    79€<span className="text-sm font-normal text-gray-500">/mois</span>
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckIcon /> 10 formateurs
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon /> 100 formations
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon /> 25 Go stockage
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon /> Domaine personnalisé
                    </li>
                  </ul>
                  <button className="w-full mt-6 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600">
                    Passer à Pro
                  </button>
                </div>

                {/* Enterprise */}
                <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Enterprise</h3>
                  <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
                    Sur mesure
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckIcon /> Formateurs illimités
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon /> Formations illimitées
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon /> 100 Go stockage
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon /> Support dédié
                    </li>
                  </ul>
                  <button className="w-full mt-6 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300">
                    Nous contacter
                  </button>
                </div>
              </div>

              {/* Invoices Table */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Historique des factures
                  </h3>
                  <button className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                    Tout télécharger
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Facture
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Montant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {/* Mock invoices data */}
                      {[
                        { id: "INV-2024-001", date: "1 Déc 2024", amount: "79,00 €", status: "Payée" },
                        { id: "INV-2024-002", date: "1 Nov 2024", amount: "79,00 €", status: "Payée" },
                        { id: "INV-2024-003", date: "1 Oct 2024", amount: "79,00 €", status: "Payée" },
                        { id: "INV-2024-004", date: "1 Sep 2024", amount: "29,00 €", status: "Payée" },
                        { id: "INV-2024-005", date: "1 Aoû 2024", amount: "29,00 €", status: "Payée" },
                      ].map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {invoice.id}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {invoice.date}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {invoice.amount}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium">
                              Télécharger PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
