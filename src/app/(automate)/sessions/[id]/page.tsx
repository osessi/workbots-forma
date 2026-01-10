"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DocumentsWizard, FormationInfo, InitialSessionData } from "@/components/documents/wizard";

// Types
interface Apprenant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

interface Entreprise {
  id: string;
  raisonSociale: string;
}

interface SessionParticipant {
  id: string;
  estConfirme: boolean;
  aAssiste: boolean;
  // Qualiopi IND 3 - Certification
  certificationObtenue: boolean;
  dateCertification: string | null;
  numeroCertificat: string | null;
  apprenant: Apprenant;
}

interface SessionClient {
  id: string;
  typeClient: string;
  entreprise: Entreprise | null;
  contactNom: string | null;
  contactPrenom: string | null;
  contactEmail: string | null;
  participants: SessionParticipant[];
}

interface SessionJournee {
  id: string;
  ordre: number;
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
  modalite: string;
  notes: string | null;
  formation: {
    id: string;
    titre: string;
    dureeHeures: number | null;
    // Qualiopi IND 3 - Certification
    isCertifiante: boolean;
    numeroFicheRS: string | null;
    lienFranceCompetences: string | null;
    // Pour le DocumentsWizard
    fichePedagogique: Record<string, unknown> | null;
  };
  lieu: {
    id: string;
    nom: string;
    typeLieu: string;
    lieuFormation: string;
  } | null;
  formateur: {
    id: string;
    nom: string;
    prenom: string;
    email: string | null;
  } | null;
  journees: SessionJournee[];
  clients: SessionClient[];
  // Qualiopi IND 3 - Certification par session
  delivreCertification: boolean | null;
  // Pour le DocumentsWizard
  lieuTexteLibre: string | null;
  lienConnexion: string | null;
  tarifParDefautHT: number | null;
  tauxTVA: number;
  createdAt: string;
  updatedAt: string;
}

// Icons
const LoaderIcon = () => (
  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 10H5M5 10L10 5M5 10L10 15" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 3v10M3 8h10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="3" width="14" height="13" rx="2" />
    <path d="M2 7h14M6 1v3M12 1v3" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 9.5a2 2 0 100-4 2 2 0 000 4z" />
    <path d="M15 7.5c0 5-6 8-6 8s-6-3-6-8a6 6 0 1112 0z" />
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="9" cy="5" r="3" />
    <path d="M3 16c0-3.5 2.5-5.5 6-5.5s6 2 6 5.5" />
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="7" cy="5" r="2.5" />
    <path d="M2 15c0-2.5 2-4.5 5-4.5s5 2 5 4.5" />
    <circle cx="13" cy="5.5" r="2" />
    <path d="M16 15c0-2-1.5-3.5-4-3.5" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 16V4a1 1 0 011-1h8a1 1 0 011 1v12M12 16V8a1 1 0 011-1h2a1 1 0 011 1v8M5 6h2M5 9h2M5 12h2" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 8l4 4 6-8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 5l10 10M5 15l10-10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 4h12M5.33 4V2.67c0-.37.3-.67.67-.67h4c.37 0 .67.3.67.67V4M6.67 7.33v4M9.33 7.33v4M12.67 4v9.33c0 .37-.3.67-.67.67H4c-.37 0-.67-.3-.67-.67V4" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10 1.5l2.5 2.5L4.5 12H2v-2.5L10 1.5z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AwardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="9" cy="6" r="4" />
    <path d="M6 9.5l-1.5 6.5 4.5-2 4.5 2-1.5-6.5" />
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
    <circle cx="8" cy="8" r="2" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 2v8M4 7l4 4 4-4M2 12v2h12v-2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Status colors
const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  BROUILLON: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", dot: "bg-gray-400" },
  PLANIFIEE: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  EN_COURS: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400", dot: "bg-orange-500" },
  TERMINEE: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400", dot: "bg-green-500" },
  ANNULEE: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
};

const statusLabels: Record<string, string> = {
  BROUILLON: "Brouillon",
  PLANIFIEE: "Planifiée",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
};

const modaliteLabels: Record<string, string> = {
  PRESENTIEL: "Présentiel",
  DISTANCIEL: "Distanciel",
  MIXTE: "Mixte",
};

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state for adding client
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [addingClient, setAddingClient] = useState(false);
  const [availableApprenants, setAvailableApprenants] = useState<Apprenant[]>([]);
  const [availableEntreprises, setAvailableEntreprises] = useState<Entreprise[]>([]);

  // Edit modals
  const [showEditLieuModal, setShowEditLieuModal] = useState(false);
  const [showEditFormateurModal, setShowEditFormateurModal] = useState(false);
  const [availableLieux, setAvailableLieux] = useState<{ id: string; nom: string; typeLieu: string; lieuFormation: string }[]>([]);
  const [availableFormateurs, setAvailableFormateurs] = useState<{ id: string; nom: string; prenom: string }[]>([]);
  const [selectedLieuId, setSelectedLieuId] = useState("");
  const [selectedFormateurId, setSelectedFormateurId] = useState("");
  const [updating, setUpdating] = useState(false);

  // Certification modal (Qualiopi IND 3)
  const [showCertificationModal, setShowCertificationModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<SessionParticipant | null>(null);
  const [certificationForm, setCertificationForm] = useState({
    certificationObtenue: false,
    dateCertification: "",
    numeroCertificat: "",
  });
  const [updatingCertification, setUpdatingCertification] = useState(false);

  // Form state
  const [clientForm, setClientForm] = useState({
    typeClient: "SALARIE",
    entrepriseId: "",
    contactNom: "",
    contactPrenom: "",
    contactEmail: "",
    selectedApprenants: [] as string[],
  });

  // Fetch session
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/training-sessions/${sessionId}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push("/sessions");
          return;
        }
        throw new Error("Erreur lors du chargement de la session");
      }
      const data = await res.json();
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [sessionId, router]);

  // Fetch apprenants
  const fetchApprenants = useCallback(async () => {
    try {
      const res = await fetch("/api/apprenants");
      if (!res.ok) return;
      const data = await res.json();
      setAvailableApprenants(data || []);
    } catch {
      // Ignore
    }
  }, []);

  // Fetch entreprises
  const fetchEntreprises = useCallback(async () => {
    try {
      const res = await fetch("/api/entreprises");
      if (!res.ok) return;
      const data = await res.json();
      setAvailableEntreprises(data || []);
    } catch {
      // Ignore
    }
  }, []);

  // Fetch lieux
  const fetchLieux = useCallback(async () => {
    try {
      const res = await fetch("/api/lieux");
      if (!res.ok) return;
      const data = await res.json();
      setAvailableLieux(data || []);
    } catch {
      // Ignore
    }
  }, []);

  // Fetch formateurs
  const fetchFormateurs = useCallback(async () => {
    try {
      const res = await fetch("/api/intervenants");
      if (!res.ok) return;
      const data = await res.json();
      setAvailableFormateurs(data || []);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchSession();
    fetchApprenants();
    fetchEntreprises();
    fetchLieux();
    fetchFormateurs();
  }, [fetchSession, fetchApprenants, fetchEntreprises, fetchLieux, fetchFormateurs]);

  // Update session status
  const updateStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/training-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour");
      fetchSession();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  // Update lieu
  const handleUpdateLieu = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/training-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lieuId: selectedLieuId || null }),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour du lieu");
      setShowEditLieuModal(false);
      fetchSession();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setUpdating(false);
    }
  };

  // Update formateur
  const handleUpdateFormateur = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/training-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formateurId: selectedFormateurId || null }),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour du formateur");
      setShowEditFormateurModal(false);
      fetchSession();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setUpdating(false);
    }
  };

  // Open certification modal (Qualiopi IND 3)
  const openCertificationModal = (participant: SessionParticipant) => {
    setSelectedParticipant(participant);
    setCertificationForm({
      certificationObtenue: participant.certificationObtenue || false,
      dateCertification: participant.dateCertification
        ? new Date(participant.dateCertification).toISOString().split("T")[0]
        : "",
      numeroCertificat: participant.numeroCertificat || "",
    });
    setShowCertificationModal(true);
  };

  // Update participant certification (Qualiopi IND 3)
  const handleUpdateCertification = async () => {
    if (!selectedParticipant) return;
    setUpdatingCertification(true);
    try {
      const res = await fetch(`/api/session-participant/${selectedParticipant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificationObtenue: certificationForm.certificationObtenue,
          dateCertification: certificationForm.dateCertification || null,
          numeroCertificat: certificationForm.numeroCertificat || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }
      setShowCertificationModal(false);
      setSelectedParticipant(null);
      fetchSession();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setUpdatingCertification(false);
    }
  };

  // Add client with participants
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clientForm.selectedApprenants.length === 0) {
      alert("Veuillez sélectionner au moins un participant");
      return;
    }

    setAddingClient(true);
    try {
      const res = await fetch(`/api/training-sessions/${sessionId}/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeClient: clientForm.typeClient,
          entrepriseId: clientForm.entrepriseId || undefined,
          contactNom: clientForm.contactNom || undefined,
          contactPrenom: clientForm.contactPrenom || undefined,
          contactEmail: clientForm.contactEmail || undefined,
          apprenantIds: clientForm.selectedApprenants,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'ajout");
      }

      setShowAddClientModal(false);
      setClientForm({
        typeClient: "SALARIE",
        entrepriseId: "",
        contactNom: "",
        contactPrenom: "",
        contactEmail: "",
        selectedApprenants: [],
      });
      fetchSession();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setAddingClient(false);
    }
  };

  // Toggle apprenant selection
  const toggleApprenant = (id: string) => {
    setClientForm(prev => ({
      ...prev,
      selectedApprenants: prev.selectedApprenants.includes(id)
        ? prev.selectedApprenants.filter(a => a !== id)
        : [...prev.selectedApprenants, id],
    }));
  };

  // Remove participant
  const removeParticipant = async (clientId: string, participantId: string) => {
    if (!confirm("Supprimer ce participant ?")) return;
    try {
      const res = await fetch(`/api/training-sessions/${sessionId}/clients/${clientId}/participants/${participantId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      fetchSession();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  // Get total participants
  const getTotalParticipants = () => {
    if (!session) return 0;
    return session.clients.reduce((acc, client) => acc + client.participants.length, 0);
  };

  // Get certification stats (Qualiopi IND 3)
  // Un participant est "présenté" s'il a assisté OU s'il est certifié
  const getCertificationStats = () => {
    if (!session) return { total: 0, certified: 0, rate: 0 };
    let total = 0;
    let certified = 0;
    session.clients.forEach((client) => {
      client.participants.forEach((p) => {
        // Un participant certifié est automatiquement considéré comme présenté
        if (p.aAssiste || p.certificationObtenue) {
          total++;
          if (p.certificationObtenue) certified++;
        }
      });
    });
    return {
      total,
      certified,
      rate: total > 0 ? Math.round((certified / total) * 100) : 0,
    };
  };

  // Check if session delivers certifications (Qualiopi IND 3)
  // Logic: delivreCertification overrides formation.isCertifiante
  // - delivreCertification = true → delivers
  // - delivreCertification = false → does not deliver
  // - delivreCertification = null → inherits from formation.isCertifiante
  const sessionDeliversCertification = () => {
    if (!session) return false;
    if (session.delivreCertification === true) return true;
    if (session.delivreCertification === false) return false;
    return session.formation.isCertifiante;
  };

  // Toggle certification delivery for this session
  const handleToggleCertification = async () => {
    if (!session) return;
    setUpdating(true);
    try {
      // If currently delivers (explicit or inherited), set to false
      // If currently doesn't deliver, set to true
      const newValue = !sessionDeliversCertification();
      const res = await fetch(`/api/training-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delivreCertification: newValue }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }
      fetchSession();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setUpdating(false);
    }
  };

  // Get formation info for the DocumentsWizard
  const getFormationInfo = useCallback((): FormationInfo => {
    if (!session) {
      return {
        id: undefined,
        titre: "Formation",
        tarifEntreprise: 0,
        tarifIndependant: 0,
        tarifParticulier: 0,
        dureeHeures: 14,
        dureeJours: 2,
      };
    }

    // Extract tarifs from fichePedagogique if available
    const fiche = session.formation.fichePedagogique || {};
    const parseTarif = (val: unknown): number => {
      if (typeof val === "number") return val;
      if (typeof val === "string") {
        const match = val.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      }
      return 0;
    };

    return {
      id: session.formation.id,
      titre: session.formation.titre,
      tarifEntreprise: parseTarif(fiche.tarifEntreprise) || session.tarifParDefautHT || 0,
      tarifIndependant: parseTarif(fiche.tarifIndependant) || session.tarifParDefautHT || 0,
      tarifParticulier: parseTarif(fiche.tarifParticulier) || session.tarifParDefautHT || 0,
      dureeHeures: session.formation.dureeHeures || 14,
      dureeJours: session.journees.length || 2,
      // Pass session-specific data
      sessionId: session.id,
      sessionReference: session.reference,
    };
  }, [session]);

  // Get initial session data for pre-filling the wizard (lieu, dates, formateur)
  const getInitialSessionData = useCallback((): InitialSessionData | undefined => {
    if (!session) return undefined;

    // Convertir la modalité
    const modaliteMap: Record<string, "PRESENTIEL" | "DISTANCIEL" | "MIXTE"> = {
      PRESENTIEL: "PRESENTIEL",
      DISTANCIEL: "DISTANCIEL",
      MIXTE: "MIXTE",
    };

    return {
      lieu: {
        modalite: modaliteMap[session.modalite] || "PRESENTIEL",
        lieuId: session.lieu?.id || null,
        lieu: session.lieu ? {
          id: session.lieu.id,
          nom: session.lieu.nom,
          typeLieu: session.lieu.typeLieu,
          lieuFormation: session.lieu.lieuFormation,
        } : undefined,
        adresseLibre: session.lieuTexteLibre || "",
        lienConnexion: session.lienConnexion || "",
        journees: session.journees.map((j) => ({
          id: j.id,
          date: j.date.split("T")[0], // Format YYYY-MM-DD
          horaireMatin: j.heureDebutMatin && j.heureFinMatin
            ? `${j.heureDebutMatin} - ${j.heureFinMatin}`
            : "09:00 - 12:30",
          horaireApresMidi: j.heureDebutAprem && j.heureFinAprem
            ? `${j.heureDebutAprem} - ${j.heureFinAprem}`
            : "14:00 - 17:30",
        })),
      },
      formateurs: {
        formateurPrincipalId: session.formateur?.id || null,
        formateurPrincipal: session.formateur ? {
          id: session.formateur.id,
          nom: session.formateur.nom,
          prenom: session.formateur.prenom,
          email: session.formateur.email || undefined,
        } : undefined,
        coformateursIds: [],
        coformateurs: [],
      },
    };
  }, [session]);

  // Callback when wizard is complete
  const handleWizardComplete = useCallback(async () => {
    // Update session status to PLANIFIEE if it was BROUILLON
    if (session?.status === "BROUILLON") {
      try {
        await fetch(`/api/training-sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PLANIFIEE" }),
        });
      } catch (err) {
        console.error("Erreur mise à jour statut:", err);
      }
    }
    // Refresh session data
    fetchSession();
  }, [session, sessionId, fetchSession]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoaderIcon />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error || "Session non trouvée"}</p>
        <Link href="/sessions" className="text-brand-500 hover:underline mt-4 inline-block">
          Retour aux sessions
        </Link>
      </div>
    );
  }

  const statusStyle = statusColors[session.status] || statusColors.BROUILLON;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/sessions"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
          >
            <ArrowLeftIcon />
            Retour aux sessions
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-mono text-gray-500 dark:text-gray-400">{session.reference}</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
              {statusLabels[session.status]}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {modaliteLabels[session.modalite]}
            </span>
            {/* Badge certification session (Qualiopi IND 3) */}
            {sessionDeliversCertification() && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                <AwardIcon />
                Certifiante
                {session.formation.numeroFicheRS && (
                  <span className="opacity-70">({session.formation.numeroFicheRS})</span>
                )}
              </span>
            )}
            {/* Toggle certification for this session (only if formation is certifiante) */}
            {session.formation.isCertifiante && (
              <button
                onClick={handleToggleCertification}
                disabled={updating}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  sessionDeliversCertification()
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200"
                }`}
                title={sessionDeliversCertification() ? "Désactiver la certification pour cette session" : "Activer la certification pour cette session"}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {sessionDeliversCertification() ? (
                    <path d="M2 6L4.5 8.5L10 3" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <path d="M3 3L9 9M3 9L9 3" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </svg>
                {sessionDeliversCertification() ? "Certification ON" : "Certification OFF"}
              </button>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {session.formation.titre}
          </h1>
          {session.nom && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">{session.nom}</p>
          )}
        </div>

        {/* Status actions */}
        <div className="flex gap-2">
          {session.status === "BROUILLON" && (
            <button
              onClick={() => updateStatus("PLANIFIEE")}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
            >
              Planifier
            </button>
          )}
          {session.status === "PLANIFIEE" && (
            <button
              onClick={() => updateStatus("EN_COURS")}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors"
            >
              Démarrer
            </button>
          )}
          {session.status === "EN_COURS" && (
            <button
              onClick={() => updateStatus("TERMINEE")}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
            >
              Terminer
            </button>
          )}
        </div>
      </div>

      {/* Certification stats card (Qualiopi IND 3) - Only for sessions with certification enabled and TERMINEE status */}
      {sessionDeliversCertification() && session.status === "TERMINEE" && (
        <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
              <AwardIcon />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Suivi des certifications</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Formation certifiante - Qualiopi IND 3
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-xl">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{getCertificationStats().total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Présentés</p>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-xl">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{getCertificationStats().certified}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Certifiés</p>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-xl">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{getCertificationStats().rate}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Taux</p>
            </div>
          </div>
          {session.formation.lienFranceCompetences && (
            <a
              href={session.formation.lienFranceCompetences}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400"
            >
              Voir sur France Compétences
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 4L4 10M10 4v5M10 4H5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}
        </div>
      )}

      {/* Documents Wizard - Configuration de la session */}
      <DocumentsWizard
        formation={getFormationInfo()}
        initialSessionData={getInitialSessionData()}
        onComplete={handleWizardComplete}
      />

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ajouter des participants</h2>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="p-6 space-y-6">
              {/* Type de client */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type de client
                </label>
                <div className="flex gap-3">
                  {[
                    { value: "SALARIE", label: "Entreprise" },
                    { value: "INDEPENDANT", label: "Indépendant" },
                    { value: "PARTICULIER", label: "Particulier" },
                  ].map(({ value, label }) => (
                    <label key={value} className="flex-1">
                      <input
                        type="radio"
                        name="typeClient"
                        value={value}
                        checked={clientForm.typeClient === value}
                        onChange={(e) => setClientForm(prev => ({ ...prev, typeClient: e.target.value, entrepriseId: "" }))}
                        className="sr-only"
                      />
                      <div className={`p-3 text-center border rounded-xl cursor-pointer transition-colors ${
                        clientForm.typeClient === value
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}>
                        {label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Entreprise selection */}
              {clientForm.typeClient === "SALARIE" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Entreprise
                  </label>
                  <select
                    value={clientForm.entrepriseId}
                    onChange={(e) => setClientForm(prev => ({ ...prev, entrepriseId: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Sélectionner une entreprise</option>
                    {availableEntreprises.map((e) => (
                      <option key={e.id} value={e.id}>{e.raisonSociale}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Contact info for non-entreprise */}
              {clientForm.typeClient !== "SALARIE" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prénom</label>
                    <input
                      type="text"
                      value={clientForm.contactPrenom}
                      onChange={(e) => setClientForm(prev => ({ ...prev, contactPrenom: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom</label>
                    <input
                      type="text"
                      value={clientForm.contactNom}
                      onChange={(e) => setClientForm(prev => ({ ...prev, contactNom: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Participants selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sélectionner les participants
                </label>
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl max-h-60 overflow-y-auto">
                  {availableApprenants.length === 0 ? (
                    <p className="p-4 text-center text-gray-500 dark:text-gray-400">
                      Aucun apprenant disponible
                    </p>
                  ) : (
                    availableApprenants.map((apprenant) => (
                      <label
                        key={apprenant.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0"
                      >
                        <input
                          type="checkbox"
                          checked={clientForm.selectedApprenants.includes(apprenant.id)}
                          onChange={() => toggleApprenant(apprenant.id)}
                          className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {apprenant.prenom} {apprenant.nom}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{apprenant.email}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                {clientForm.selectedApprenants.length > 0 && (
                  <p className="mt-2 text-sm text-brand-500">
                    {clientForm.selectedApprenants.length} participant(s) sélectionné(s)
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={addingClient || clientForm.selectedApprenants.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
                >
                  {addingClient && <LoaderIcon />}
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lieu Modal */}
      {showEditLieuModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md">
            <div className="border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Modifier le lieu</h2>
              <button
                onClick={() => setShowEditLieuModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lieu de formation
                </label>
                <select
                  value={selectedLieuId}
                  onChange={(e) => setSelectedLieuId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Aucun lieu sélectionné</option>
                  {availableLieux.map((lieu) => (
                    <option key={lieu.id} value={lieu.id}>
                      {lieu.nom} - {lieu.typeLieu === "DISTANCIEL" ? "En ligne" : lieu.lieuFormation}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditLieuModal(false)}
                  className="px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateLieu}
                  disabled={updating}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
                >
                  {updating && <LoaderIcon />}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Formateur Modal */}
      {showEditFormateurModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md">
            <div className="border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Modifier le formateur</h2>
              <button
                onClick={() => setShowEditFormateurModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formateur
                </label>
                <select
                  value={selectedFormateurId}
                  onChange={(e) => setSelectedFormateurId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Aucun formateur sélectionné</option>
                  {availableFormateurs.map((formateur) => (
                    <option key={formateur.id} value={formateur.id}>
                      {formateur.prenom} {formateur.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditFormateurModal(false)}
                  className="px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateFormateur}
                  disabled={updating}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
                >
                  {updating && <LoaderIcon />}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certification Modal (Qualiopi IND 3) */}
      {showCertificationModal && selectedParticipant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md">
            <div className="border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Certification</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedParticipant.apprenant.prenom} {selectedParticipant.apprenant.nom}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCertificationModal(false);
                  setSelectedParticipant(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Toggle certification */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    certificationForm.certificationObtenue
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                  }`}>
                    <AwardIcon />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Certification obtenue</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Le participant a obtenu sa certification
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCertificationForm(prev => ({
                    ...prev,
                    certificationObtenue: !prev.certificationObtenue,
                  }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    certificationForm.certificationObtenue
                      ? "bg-amber-500"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      certificationForm.certificationObtenue ? "left-7" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* Date de certification */}
              {certificationForm.certificationObtenue && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date de certification
                    </label>
                    <input
                      type="date"
                      value={certificationForm.dateCertification}
                      onChange={(e) => setCertificationForm(prev => ({
                        ...prev,
                        dateCertification: e.target.value,
                      }))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Numéro de certificat */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Numéro de certificat (optionnel)
                    </label>
                    <input
                      type="text"
                      value={certificationForm.numeroCertificat}
                      onChange={(e) => setCertificationForm(prev => ({
                        ...prev,
                        numeroCertificat: e.target.value,
                      }))}
                      placeholder="Ex: CERT-2025-0001"
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowCertificationModal(false);
                    setSelectedParticipant(null);
                  }}
                  className="px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateCertification}
                  disabled={updatingCertification}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
                >
                  {updatingCertification && <LoaderIcon />}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
