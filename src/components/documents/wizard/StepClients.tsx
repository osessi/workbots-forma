"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  User,
  UserCircle,
  Plus,
  Trash2,
  Search,
  X,
  Loader2,
  Check,
  ChevronDown,
  Users,
} from "lucide-react";
import {
  SessionClient,
  ClientType,
  Entreprise,
  Apprenant,
} from "./types";

interface StepClientsProps {
  clients: SessionClient[];
  onChange: (clients: SessionClient[]) => void;
  onNext: () => void;
}

const clientTypeLabels: Record<ClientType, { label: string; icon: React.ReactNode; color: string }> = {
  ENTREPRISE: {
    label: "Entreprise",
    icon: <Building2 size={18} />,
    color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400",
  },
  INDEPENDANT: {
    label: "Indépendant",
    icon: <User size={18} />,
    color: "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30 dark:text-orange-400",
  },
  PARTICULIER: {
    label: "Particulier",
    icon: <UserCircle size={18} />,
    color: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/30 dark:text-purple-400",
  },
};

export default function StepClients({ clients, onChange, onNext }: StepClientsProps) {
  const [showAddClient, setShowAddClient] = useState(false);
  const [selectedType, setSelectedType] = useState<ClientType | null>(null);

  // Données BDD
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [apprenants, setApprenants] = useState<Apprenant[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Recherche
  const [searchEntreprise, setSearchEntreprise] = useState("");
  const [searchApprenant, setSearchApprenant] = useState("");

  // Modals
  const [showEntrepriseModal, setShowEntrepriseModal] = useState(false);
  const [showApprenantModal, setShowApprenantModal] = useState(false);
  const [selectedEntreprise, setSelectedEntreprise] = useState<Entreprise | null>(null);

  // Création rapide
  const [creatingEntreprise, setCreatingEntreprise] = useState(false);
  const [creatingApprenant, setCreatingApprenant] = useState(false);
  const [newEntreprise, setNewEntreprise] = useState({ raisonSociale: "", siret: "", contactEmail: "" });
  const [newApprenant, setNewApprenant] = useState({ nom: "", prenom: "", email: "", statut: "SALARIE" as "SALARIE" | "INDEPENDANT" | "PARTICULIER", entrepriseId: "" });

  // Charger les données
  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [entreprisesRes, apprenantsRes] = await Promise.all([
        fetch("/api/donnees/entreprises"),
        fetch("/api/donnees/apprenants"),
      ]);

      if (entreprisesRes.ok) {
        const data = await entreprisesRes.json();
        setEntreprises(data);
      }
      if (apprenantsRes.ok) {
        const data = await apprenantsRes.json();
        setApprenants(data);
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrer les entreprises
  const filteredEntreprises = entreprises.filter((e) =>
    e.raisonSociale.toLowerCase().includes(searchEntreprise.toLowerCase())
  );

  // Filtrer les apprenants par statut
  const getFilteredApprenants = (statut: "INDEPENDANT" | "PARTICULIER") => {
    return apprenants.filter(
      (a) =>
        a.statut === statut &&
        (a.nom.toLowerCase().includes(searchApprenant.toLowerCase()) ||
          a.prenom.toLowerCase().includes(searchApprenant.toLowerCase()))
    );
  };

  // Apprenants d'une entreprise
  const getEntrepriseApprenants = (entrepriseId: string) => {
    return apprenants.filter(
      (a) => a.statut === "SALARIE" && a.entrepriseId === entrepriseId
    );
  };

  // Ajouter un client entreprise
  const addEntrepriseClient = (entreprise: Entreprise) => {
    const newClient: SessionClient = {
      id: `client-${Date.now()}`,
      type: "ENTREPRISE",
      entrepriseId: entreprise.id,
      entreprise,
      apprenants: [],
    };
    onChange([...clients, newClient]);
    setShowEntrepriseModal(false);
    setSelectedType(null);
    setShowAddClient(false);
    setSearchEntreprise("");
  };

  // Ajouter un client indépendant/particulier
  const addApprenantClient = (apprenant: Apprenant, type: ClientType) => {
    const newClient: SessionClient = {
      id: `client-${Date.now()}`,
      type,
      apprenantId: apprenant.id,
      apprenant,
      apprenants: [apprenant],
    };
    onChange([...clients, newClient]);
    setShowApprenantModal(false);
    setSelectedType(null);
    setShowAddClient(false);
    setSearchApprenant("");
  };

  // Supprimer un client
  const removeClient = (clientId: string) => {
    onChange(clients.filter((c) => c.id !== clientId));
  };

  // Toggle apprenant dans une entreprise
  const toggleApprenant = (clientId: string, apprenant: Apprenant) => {
    onChange(
      clients.map((c) => {
        if (c.id === clientId) {
          const exists = c.apprenants.some((a) => a.id === apprenant.id);
          return {
            ...c,
            apprenants: exists
              ? c.apprenants.filter((a) => a.id !== apprenant.id)
              : [...c.apprenants, apprenant],
          };
        }
        return c;
      })
    );
  };

  // Créer une entreprise rapidement
  const handleCreateEntreprise = async () => {
    if (!newEntreprise.raisonSociale) return;
    setCreatingEntreprise(true);
    try {
      const res = await fetch("/api/donnees/entreprises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntreprise),
      });
      if (res.ok) {
        const created = await res.json();
        setEntreprises([...entreprises, created]);
        addEntrepriseClient(created);
        setNewEntreprise({ raisonSociale: "", siret: "", contactEmail: "" });
      }
    } catch (error) {
      console.error("Erreur création entreprise:", error);
    } finally {
      setCreatingEntreprise(false);
    }
  };

  // Créer un apprenant rapidement
  const handleCreateApprenant = async () => {
    if (!newApprenant.nom || !newApprenant.prenom || !newApprenant.email) return;
    setCreatingApprenant(true);
    try {
      const res = await fetch("/api/donnees/apprenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newApprenant,
          entrepriseId: newApprenant.statut === "SALARIE" ? newApprenant.entrepriseId : null,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setApprenants([...apprenants, created]);

        if (newApprenant.statut === "SALARIE" && selectedEntreprise) {
          // Ajouter à l'entreprise sélectionnée
          const clientIndex = clients.findIndex(
            (c) => c.type === "ENTREPRISE" && c.entrepriseId === selectedEntreprise.id
          );
          if (clientIndex !== -1) {
            toggleApprenant(clients[clientIndex].id, created);
          }
        } else if (selectedType) {
          addApprenantClient(created, selectedType);
        }

        setNewApprenant({ nom: "", prenom: "", email: "", statut: "SALARIE", entrepriseId: "" });
        setShowApprenantModal(false);
      }
    } catch (error) {
      console.error("Erreur création apprenant:", error);
    } finally {
      setCreatingApprenant(false);
    }
  };

  // Compter les apprenants total
  const totalApprenants = clients.reduce((acc, c) => acc + c.apprenants.length, 0);

  const canProceed = clients.length > 0 && totalApprenants > 0;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10">
            <Users className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Clients & Participants
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Définissez les clients et les participants de cette session
            </p>
          </div>
        </div>
      </div>

      {/* Liste des clients ajoutés */}
      {clients.length > 0 && (
        <div className="space-y-4">
          {clients.map((client) => (
            <div
              key={client.id}
              className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border ${clientTypeLabels[client.type].color}`}>
                    {clientTypeLabels[client.type].icon}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {clientTypeLabels[client.type].label}
                    </span>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {client.type === "ENTREPRISE"
                        ? client.entreprise?.raisonSociale
                        : `${client.apprenant?.prenom} ${client.apprenant?.nom}`}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => removeClient(client.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Apprenants pour entreprise */}
              {client.type === "ENTREPRISE" && client.entrepriseId && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Apprenants ({client.apprenants.length} sélectionné{client.apprenants.length > 1 ? "s" : ""})
                    </span>
                    <button
                      onClick={() => {
                        setSelectedEntreprise(client.entreprise || null);
                        setNewApprenant({ ...newApprenant, statut: "SALARIE", entrepriseId: client.entrepriseId || "" });
                        setShowApprenantModal(true);
                      }}
                      className="text-xs font-medium text-brand-500 hover:text-brand-600 flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Ajouter un salarié
                    </button>
                  </div>

                  {/* Liste des salariés de l'entreprise */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {getEntrepriseApprenants(client.entrepriseId).length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">
                        Aucun salarié rattaché à cette entreprise
                      </p>
                    ) : (
                      getEntrepriseApprenants(client.entrepriseId).map((apprenant) => {
                        const isSelected = client.apprenants.some((a) => a.id === apprenant.id);
                        return (
                          <label
                            key={apprenant.id}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-brand-50 border border-brand-200 dark:bg-brand-500/10 dark:border-brand-500/30"
                                : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleApprenant(client.id, apprenant)}
                              className="w-4 h-4 text-brand-500 rounded border-gray-300 focus:ring-brand-500"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {apprenant.prenom} {apprenant.nom}
                              </p>
                              <p className="text-xs text-gray-500">{apprenant.email}</p>
                            </div>
                            {isSelected && (
                              <Check size={16} className="text-brand-500" />
                            )}
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Badge apprenant pour indépendant/particulier */}
              {(client.type === "INDEPENDANT" || client.type === "PARTICULIER") && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <User size={14} />
                  <span>{client.apprenant?.email}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bouton ajouter un client */}
      {!showAddClient ? (
        <button
          onClick={() => setShowAddClient(true)}
          className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-brand-300 hover:text-brand-500 transition-colors dark:border-gray-700 dark:hover:border-brand-500"
        >
          <Plus size={20} />
          Ajouter un client
        </button>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Choisir le type de client
            </h3>
            <button
              onClick={() => {
                setShowAddClient(false);
                setSelectedType(null);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
            >
              <X size={18} />
            </button>
          </div>

          {/* Sélection type de client */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {(Object.keys(clientTypeLabels) as ClientType[]).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setSelectedType(type);
                  if (type === "ENTREPRISE") {
                    setShowEntrepriseModal(true);
                  } else {
                    setShowApprenantModal(true);
                    setNewApprenant({ ...newApprenant, statut: type });
                  }
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  selectedType === type
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                }`}
              >
                <div className={`p-2.5 rounded-lg ${clientTypeLabels[type].color}`}>
                  {clientTypeLabels[type].icon}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {clientTypeLabels[type].label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Récapitulatif */}
      {clients.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Récapitulatif
          </h4>
          <div className="space-y-2">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600 dark:text-gray-400">
                  {client.type === "ENTREPRISE"
                    ? client.entreprise?.raisonSociale
                    : `${client.apprenant?.prenom} ${client.apprenant?.nom}`}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {client.apprenants.length} apprenant{client.apprenants.length > 1 ? "s" : ""}
                </span>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="font-medium text-gray-700 dark:text-gray-300">Total</span>
              <span className="font-semibold text-brand-600 dark:text-brand-400">
                {totalApprenants} apprenant{totalApprenants > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bouton suivant */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuer
          <ChevronDown className="rotate-[-90deg]" size={18} />
        </button>
      </div>

      {/* Modal sélection entreprise */}
      {showEntrepriseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sélectionner une entreprise
              </h3>
              <button
                onClick={() => {
                  setShowEntrepriseModal(false);
                  setSelectedType(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une entreprise..."
                  value={searchEntreprise}
                  onChange={(e) => setSearchEntreprise(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-brand-500" size={24} />
                </div>
              ) : filteredEntreprises.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Aucune entreprise trouvée</p>
                </div>
              ) : (
                filteredEntreprises.map((entreprise) => {
                  const alreadyAdded = clients.some(
                    (c) => c.type === "ENTREPRISE" && c.entrepriseId === entreprise.id
                  );
                  return (
                    <button
                      key={entreprise.id}
                      onClick={() => !alreadyAdded && addEntrepriseClient(entreprise)}
                      disabled={alreadyAdded}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        alreadyAdded
                          ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800"
                          : "border-gray-200 hover:border-brand-300 hover:bg-brand-50 dark:border-gray-700 dark:hover:border-brand-500 dark:hover:bg-brand-500/10"
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {entreprise.raisonSociale}
                      </div>
                      {entreprise.siret && (
                        <div className="text-xs text-gray-500 mt-1">
                          SIRET: {entreprise.siret}
                        </div>
                      )}
                      {alreadyAdded && (
                        <span className="text-xs text-brand-500 mt-1 block">
                          Déjà ajoutée
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Créer une nouvelle entreprise */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-500 mb-3">Ou créer une nouvelle entreprise :</p>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Raison sociale *"
                  value={newEntreprise.raisonSociale}
                  onChange={(e) => setNewEntreprise({ ...newEntreprise, raisonSociale: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="SIRET"
                    value={newEntreprise.siret}
                    onChange={(e) => setNewEntreprise({ ...newEntreprise, siret: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <button
                    onClick={handleCreateEntreprise}
                    disabled={!newEntreprise.raisonSociale || creatingEntreprise}
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    {creatingEntreprise && <Loader2 size={14} className="animate-spin" />}
                    Créer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal sélection apprenant (indépendant ou particulier) */}
      {showApprenantModal && selectedType && selectedType !== "ENTREPRISE" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sélectionner un {selectedType === "INDEPENDANT" ? "indépendant" : "particulier"}
              </h3>
              <button
                onClick={() => {
                  setShowApprenantModal(false);
                  setSelectedType(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchApprenant}
                  onChange={(e) => setSearchApprenant(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-brand-500" size={24} />
                </div>
              ) : getFilteredApprenants(selectedType).length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">
                    Aucun {selectedType === "INDEPENDANT" ? "indépendant" : "particulier"} trouvé
                  </p>
                </div>
              ) : (
                getFilteredApprenants(selectedType).map((apprenant) => {
                  const alreadyAdded = clients.some(
                    (c) => c.apprenantId === apprenant.id
                  );
                  return (
                    <button
                      key={apprenant.id}
                      onClick={() => !alreadyAdded && addApprenantClient(apprenant, selectedType)}
                      disabled={alreadyAdded}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        alreadyAdded
                          ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800"
                          : "border-gray-200 hover:border-brand-300 hover:bg-brand-50 dark:border-gray-700 dark:hover:border-brand-500 dark:hover:bg-brand-500/10"
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {apprenant.prenom} {apprenant.nom}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{apprenant.email}</div>
                      {alreadyAdded && (
                        <span className="text-xs text-brand-500 mt-1 block">
                          Déjà ajouté
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Créer un nouvel apprenant */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-500 mb-3">
                Ou créer un nouvel {selectedType === "INDEPENDANT" ? "indépendant" : "particulier"} :
              </p>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Prénom *"
                    value={newApprenant.prenom}
                    onChange={(e) => setNewApprenant({ ...newApprenant, prenom: e.target.value })}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Nom *"
                    value={newApprenant.nom}
                    onChange={(e) => setNewApprenant({ ...newApprenant, nom: e.target.value })}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Email *"
                    value={newApprenant.email}
                    onChange={(e) => setNewApprenant({ ...newApprenant, email: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <button
                    onClick={handleCreateApprenant}
                    disabled={!newApprenant.nom || !newApprenant.prenom || !newApprenant.email || creatingApprenant}
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    {creatingApprenant && <Loader2 size={14} className="animate-spin" />}
                    Créer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal ajout salarié pour entreprise */}
      {showApprenantModal && selectedEntreprise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Ajouter un salarié
              </h3>
              <button
                onClick={() => {
                  setShowApprenantModal(false);
                  setSelectedEntreprise(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Pour : <span className="font-medium">{selectedEntreprise.raisonSociale}</span>
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Prénom *"
                  value={newApprenant.prenom}
                  onChange={(e) => setNewApprenant({ ...newApprenant, prenom: e.target.value })}
                  className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Nom *"
                  value={newApprenant.nom}
                  onChange={(e) => setNewApprenant({ ...newApprenant, nom: e.target.value })}
                  className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <input
                type="email"
                placeholder="Email *"
                value={newApprenant.email}
                onChange={(e) => setNewApprenant({ ...newApprenant, email: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowApprenantModal(false);
                    setSelectedEntreprise(null);
                    setNewApprenant({ nom: "", prenom: "", email: "", statut: "SALARIE", entrepriseId: "" });
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateApprenant}
                  disabled={!newApprenant.nom || !newApprenant.prenom || !newApprenant.email || creatingApprenant}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creatingApprenant && <Loader2 size={14} className="animate-spin" />}
                  Créer et ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
