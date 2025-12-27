"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
          router.push("/automate/sessions");
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

  useEffect(() => {
    fetchSession();
    fetchApprenants();
    fetchEntreprises();
  }, [fetchSession, fetchApprenants, fetchEntreprises]);

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
        <Link href="/automate/sessions" className="text-brand-500 hover:underline mt-4 inline-block">
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
            href="/automate/sessions"
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
          {/* Configure / Documents button */}
          <Link
            href={`/automate/sessions/${session.id}/configure`}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors inline-flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>
            Documents
          </Link>

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

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dates */}
        <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <CalendarIcon />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Dates</h3>
          </div>
          {session.journees.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune journée planifiée</p>
          ) : (
            <div className="space-y-2">
              {session.journees.map((journee) => (
                <div key={journee.id} className="text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {format(new Date(journee.date), "EEEE d MMMM yyyy", { locale: fr })}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    {journee.heureDebutMatin} - {journee.heureFinAprem}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lieu */}
        <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
              <MapPinIcon />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Lieu</h3>
          </div>
          {session.lieu ? (
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{session.lieu.nom}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{session.lieu.lieuFormation}</p>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {session.modalite === "DISTANCIEL" ? "Formation à distance" : "Non défini"}
            </p>
          )}
        </div>

        {/* Formateur */}
        <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
              <UserIcon />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Formateur</h3>
          </div>
          {session.formateur ? (
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {session.formateur.prenom} {session.formateur.nom}
              </p>
              {session.formateur.email && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{session.formateur.email}</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Non assigné</p>
          )}
        </div>
      </div>

      {/* Participants section */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg text-brand-600 dark:text-brand-400">
              <UsersIcon />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Participants</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{getTotalParticipants()} inscrit(s)</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddClientModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl transition-colors"
          >
            <PlusIcon />
            Ajouter
          </button>
        </div>

        {session.clients.length === 0 ? (
          <div className="p-8 text-center">
            <UsersIcon />
            <p className="text-gray-500 dark:text-gray-400 mt-2">Aucun participant inscrit</p>
            <button
              onClick={() => setShowAddClientModal(true)}
              className="mt-4 text-brand-500 hover:text-brand-600 font-medium"
            >
              Ajouter des participants
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {session.clients.map((client) => (
              <div key={client.id} className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <BuildingIcon />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {client.entreprise?.raisonSociale || `${client.contactPrenom} ${client.contactNom}` || "Client individuel"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {client.participants.length} participant(s)
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 pl-11">
                  {client.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center text-sm font-medium">
                          {participant.apprenant.prenom[0]}{participant.apprenant.nom[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {participant.apprenant.prenom} {participant.apprenant.nom}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{participant.apprenant.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {participant.estConfirme && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full flex items-center gap-1">
                            <CheckIcon />
                            Confirmé
                          </span>
                        )}
                        <button
                          onClick={() => removeParticipant(client.id, participant.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}
