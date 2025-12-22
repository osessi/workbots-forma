"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Euro,
  ChevronDown,
  ChevronLeft,
  Building2,
  User,
  UserCircle,
  Loader2,
  Users,
  Info,
  X,
  Search,
  Plus,
  Landmark,
  Check,
} from "lucide-react";
import {
  SessionClient,
  SessionTarif,
  ClientType,
  Financeur,
  FormationInfo,
  FinanceurType,
  financeurTypeLabels,
} from "./types";

interface StepTarifsProps {
  clients: SessionClient[];
  tarifs: SessionTarif[];
  formation: FormationInfo;
  onChange: (tarifs: SessionTarif[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

const clientTypeLabels: Record<ClientType, { label: string; icon: React.ReactNode; color: string; tarifLabel: string }> = {
  ENTREPRISE: {
    label: "Entreprise",
    icon: <Building2 size={16} />,
    color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400",
    tarifLabel: "Tarif Entreprise (HT)",
  },
  INDEPENDANT: {
    label: "Indépendant",
    icon: <User size={16} />,
    color: "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30 dark:text-orange-400",
    tarifLabel: "Tarif Indépendant (HT)",
  },
  PARTICULIER: {
    label: "Particulier",
    icon: <UserCircle size={16} />,
    color: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/30 dark:text-purple-400",
    tarifLabel: "Tarif Particulier (TTC)",
  },
};

// Liste des types de financeurs pour le dropdown
const financeurTypes: FinanceurType[] = [
  "OPCO",
  "AGEFIPH",
  "CAISSE_DEPOTS",
  "ETAT",
  "FOND_ASSURANCE",
  "FRANCE_TRAVAIL",
  "INSTANCES_EUROPEENNES",
  "OPACIF",
  "OPCA",
  "REGION",
  "ORGANISME_PUBLIC",
  "AUTRE",
];

export default function StepTarifs({
  clients,
  tarifs,
  formation,
  onChange,
  onNext,
  onPrev,
}: StepTarifsProps) {
  const [financeurs, setFinanceurs] = useState<Financeur[]>([]);
  const [loadingFinanceurs, setLoadingFinanceurs] = useState(false);
  const [showFinanceurModal, setShowFinanceurModal] = useState(false);
  const [selectedClientForFinanceur, setSelectedClientForFinanceur] = useState<string | null>(null);
  const [searchFinanceur, setSearchFinanceur] = useState("");
  const [selectedFinanceurType, setSelectedFinanceurType] = useState<FinanceurType | "">("");

  // États pour la création rapide de financeur
  const [showCreateFinanceur, setShowCreateFinanceur] = useState(false);
  const [newFinanceurNom, setNewFinanceurNom] = useState("");
  const [newFinanceurType, setNewFinanceurType] = useState<FinanceurType>("OPCO");
  const [creatingFinanceur, setCreatingFinanceur] = useState(false);

  // Charger les financeurs depuis la BDD
  const fetchFinanceurs = useCallback(async () => {
    setLoadingFinanceurs(true);
    try {
      const res = await fetch("/api/donnees/financeurs");
      if (res.ok) {
        const data = await res.json();
        setFinanceurs(data);
      }
    } catch (error) {
      console.error("Erreur chargement financeurs:", error);
    } finally {
      setLoadingFinanceurs(false);
    }
  }, []);

  useEffect(() => {
    fetchFinanceurs();
  }, [fetchFinanceurs]);

  // Fonction pour obtenir le tarif par défaut selon le type de client
  const getDefaultTarif = useCallback((clientType: ClientType): number => {
    switch (clientType) {
      case "ENTREPRISE":
        return formation.tarifEntreprise || 0;
      case "INDEPENDANT":
        return formation.tarifIndependant || 0;
      case "PARTICULIER":
        return formation.tarifParticulier || 0;
      default:
        return 0;
    }
  }, [formation]);

  // Initialiser les tarifs pour chaque client s'ils n'existent pas
  useEffect(() => {
    const existingClientIds = new Set(tarifs.map((t) => t.clientId));
    const missingClients = clients.filter((c) => !existingClientIds.has(c.id));

    if (missingClients.length > 0) {
      const newTarifs: SessionTarif[] = missingClients.map((client) => {
        const defaultTarif = getDefaultTarif(client.type);
        return {
          clientId: client.id,
          tarifHT: defaultTarif,
          financeurId: null,
          montantFinance: 0,
          resteACharge: defaultTarif,
        };
      });

      onChange([...tarifs, ...newTarifs]);
    }
  }, [clients, tarifs, getDefaultTarif, onChange]);

  // Mettre à jour un tarif
  const updateTarif = (clientId: string, field: keyof SessionTarif, value: number | string | null) => {
    onChange(
      tarifs.map((t) => {
        if (t.clientId === clientId) {
          const updated = { ...t, [field]: value };

          // Recalculer le reste à charge
          if (field === "tarifHT" || field === "montantFinance") {
            updated.resteACharge = (updated.tarifHT || 0) - (updated.montantFinance || 0);
            if (updated.resteACharge < 0) updated.resteACharge = 0;
          }

          // Si on retire le financeur, remettre montant à 0
          if (field === "financeurId" && !value) {
            updated.montantFinance = 0;
            updated.resteACharge = updated.tarifHT;
          }

          return updated;
        }
        return t;
      })
    );
  };

  // Ouvrir la modal de sélection de financeur
  const openFinanceurModal = (clientId: string) => {
    setSelectedClientForFinanceur(clientId);
    setShowFinanceurModal(true);
    setSearchFinanceur("");
    setSelectedFinanceurType("");
  };

  // Sélectionner un financeur
  const selectFinanceur = (financeur: Financeur) => {
    if (selectedClientForFinanceur) {
      const tarif = tarifs.find((t) => t.clientId === selectedClientForFinanceur);
      updateTarif(selectedClientForFinanceur, "financeurId", financeur.id);
      // Pré-remplir le montant financé avec le tarif total
      if (tarif) {
        setTimeout(() => {
          updateTarif(selectedClientForFinanceur, "montantFinance", tarif.tarifHT);
        }, 0);
      }
    }
    setShowFinanceurModal(false);
    setSelectedClientForFinanceur(null);
  };

  // Créer un nouveau financeur
  const handleCreateFinanceur = async () => {
    if (!newFinanceurNom.trim()) {
      console.log("Nom du financeur vide, annulation");
      return;
    }

    setCreatingFinanceur(true);
    try {
      console.log("Création du financeur:", { nom: newFinanceurNom.trim(), type: newFinanceurType });
      const res = await fetch("/api/donnees/financeurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: newFinanceurNom.trim(),
          type: newFinanceurType,
        }),
      });

      if (res.ok) {
        const newFinanceur = await res.json();
        console.log("Financeur créé:", newFinanceur);
        // Ajouter le nouveau financeur à la liste
        setFinanceurs((prev) => [newFinanceur, ...prev]);
        // Réinitialiser le formulaire AVANT de sélectionner pour éviter les problèmes de state
        setNewFinanceurNom("");
        setNewFinanceurType("OPCO");
        setShowCreateFinanceur(false);
        // Sélectionner automatiquement le nouveau financeur
        selectFinanceur(newFinanceur);
      } else {
        const errorData = await res.json();
        console.error("Erreur API création financeur:", errorData);
        alert("Erreur lors de la création du financeur: " + (errorData.error || "Erreur inconnue"));
      }
    } catch (error) {
      console.error("Erreur création financeur:", error);
      alert("Erreur lors de la création du financeur");
    } finally {
      setCreatingFinanceur(false);
    }
  };

  // Retirer le financeur
  const removeFinanceur = (clientId: string) => {
    updateTarif(clientId, "financeurId", null);
  };

  // Filtrer les financeurs
  const filteredFinanceurs = financeurs.filter((f) => {
    const matchesSearch = f.nom.toLowerCase().includes(searchFinanceur.toLowerCase());
    const matchesType = !selectedFinanceurType || f.type === selectedFinanceurType;
    return matchesSearch && matchesType;
  });

  // Calculer le total
  const totalTarifHT = tarifs.reduce((acc, t) => acc + (t.tarifHT || 0), 0);
  const totalFinance = tarifs.reduce((acc, t) => acc + (t.montantFinance || 0), 0);
  const totalResteACharge = tarifs.reduce((acc, t) => acc + (t.resteACharge || 0), 0);
  const totalApprenants = clients.reduce((acc, c) => acc + c.apprenants.length, 0);

  const canProceed = tarifs.length > 0 && tarifs.every((t) => t.tarifHT >= 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10">
            <Euro className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tarifs & Financement
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Définissez le tarif par client et les éventuels financements externes
            </p>
          </div>
        </div>

        {/* Info tarifs par défaut */}
        <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700 dark:text-blue-400">
              <p className="font-medium mb-1">Tarifs de la formation :</p>
              <div className="flex flex-wrap gap-4">
                <span>Entreprise: <strong>{formation.tarifEntreprise || 0} € HT</strong></span>
                <span>Indépendant: <strong>{formation.tarifIndependant || 0} € HT</strong></span>
                <span>Particulier: <strong>{formation.tarifParticulier || 0} € TTC</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des clients avec tarifs */}
      <div className="space-y-4">
        {clients.map((client) => {
          const tarif = tarifs.find((t) => t.clientId === client.id);
          if (!tarif) return null;

          const clientName =
            client.type === "ENTREPRISE"
              ? client.entreprise?.raisonSociale
              : `${client.apprenant?.prenom} ${client.apprenant?.nom}`;

          const selectedFinanceur = tarif.financeurId
            ? financeurs.find((f) => f.id === tarif.financeurId)
            : null;

          return (
            <div
              key={client.id}
              className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              {/* Header du client */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border ${clientTypeLabels[client.type].color}`}>
                    {clientTypeLabels[client.type].icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {clientName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${clientTypeLabels[client.type].color}`}>
                        {clientTypeLabels[client.type].label}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {client.apprenants.length} apprenant{client.apprenants.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reste à charge */}
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Reste à charge</p>
                  <p className={`text-xl font-bold ${
                    tarif.resteACharge === 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-900 dark:text-white"
                  }`}>
                    {tarif.resteACharge.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} €
                  </p>
                </div>
              </div>

              {/* Tarif et financement */}
              <div className="grid grid-cols-2 gap-4">
                {/* Tarif HT */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {clientTypeLabels[client.type].tarifLabel}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tarif.tarifHT || ""}
                      onChange={(e) =>
                        updateTarif(client.id, "tarifHT", parseFloat(e.target.value) || 0)
                      }
                      className="w-full pr-10 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      placeholder="0.00"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                      €
                    </span>
                  </div>
                  {getDefaultTarif(client.type) > 0 && tarif.tarifHT !== getDefaultTarif(client.type) && (
                    <button
                      onClick={() => updateTarif(client.id, "tarifHT", getDefaultTarif(client.type))}
                      className="text-xs text-brand-500 hover:text-brand-600 mt-1"
                    >
                      Réinitialiser au tarif par défaut ({getDefaultTarif(client.type)} €)
                    </button>
                  )}
                </div>

                {/* Financement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Financement externe
                  </label>

                  {selectedFinanceur ? (
                    <div className="space-y-2">
                      {/* Financeur sélectionné */}
                      <div className="flex items-center justify-between p-2 rounded-lg border border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20">
                        <div className="flex items-center gap-2">
                          <Landmark size={16} className="text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">
                            {selectedFinanceur.nom}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFinanceur(client.id)}
                          className="p-1 text-green-600 hover:text-red-500 hover:bg-red-50 rounded dark:hover:bg-red-500/10"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Montant financé */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Montant pris en charge
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max={tarif.tarifHT}
                            step="0.01"
                            value={tarif.montantFinance || ""}
                            onChange={(e) =>
                              updateTarif(
                                client.id,
                                "montantFinance",
                                Math.min(parseFloat(e.target.value) || 0, tarif.tarifHT)
                              )
                            }
                            className="w-full pr-10 py-2 text-sm border border-green-300 rounded-lg bg-green-50 focus:ring-green-500 focus:border-green-500 dark:border-green-700 dark:bg-green-900/20 dark:text-white"
                            placeholder="Montant financé"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-sm font-medium">
                            €
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <button
                            onClick={() => updateTarif(client.id, "montantFinance", tarif.tarifHT)}
                            className="text-xs text-green-600 hover:text-green-700"
                          >
                            100% financé
                          </button>
                          <button
                            onClick={() => updateTarif(client.id, "montantFinance", tarif.tarifHT / 2)}
                            className="text-xs text-green-600 hover:text-green-700"
                          >
                            50% financé
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => openFinanceurModal(client.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-green-300 hover:text-green-500 transition-colors dark:border-gray-700 dark:hover:border-green-500"
                    >
                      <Plus size={16} />
                      Ajouter un financeur
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Récapitulatif */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Récapitulatif financier
        </h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 mb-1">Clients</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-1">
              <Users size={18} className="text-gray-400" />
              {clients.length}
            </p>
            <p className="text-xs text-gray-400">{totalApprenants} apprenant{totalApprenants > 1 ? "s" : ""}</p>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 mb-1">Tarif total HT</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {totalTarifHT.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
            </p>
          </div>
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
            <p className="text-xs text-green-600 dark:text-green-400 mb-1">Financements externes</p>
            <p className="text-lg font-semibold text-green-700 dark:text-green-400">
              - {totalFinance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
            </p>
          </div>
          <div className="p-3 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30">
            <p className="text-xs text-brand-600 dark:text-brand-400 mb-1">Reste à charge clients</p>
            <p className="text-lg font-semibold text-brand-700 dark:text-brand-400">
              {totalResteACharge.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
            </p>
          </div>
        </div>
      </div>

      {/* Boutons navigation */}
      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <ChevronLeft size={18} />
          Retour
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuer
          <ChevronDown className="rotate-[-90deg]" size={18} />
        </button>
      </div>

      {/* Modal sélection financeur */}
      {showFinanceurModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sélectionner un financeur
              </h3>
              <button
                onClick={() => {
                  setShowFinanceurModal(false);
                  setSelectedClientForFinanceur(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filtres */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Rechercher un financeur..."
                  value={searchFinanceur}
                  onChange={(e) => setSearchFinanceur(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Filtre par type */}
              <div className="relative">
                <select
                  value={selectedFinanceurType}
                  onChange={(e) => setSelectedFinanceurType(e.target.value as FinanceurType | "")}
                  className="w-full py-2.5 pl-3 pr-8 text-sm border border-gray-200 rounded-lg bg-gray-50 appearance-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Tous les types</option>
                  {financeurTypes.map((type) => (
                    <option key={type} value={type}>
                      {financeurTypeLabels[type]}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {/* Bouton création rapide */}
              {!showCreateFinanceur ? (
                <button
                  onClick={() => setShowCreateFinanceur(true)}
                  className="w-full flex items-center justify-center gap-2 p-3 mb-3 border-2 border-dashed border-green-300 rounded-lg text-green-600 hover:bg-green-50 transition-colors dark:border-green-500/50 dark:text-green-400 dark:hover:bg-green-500/10"
                >
                  <Plus size={18} />
                  Créer un nouveau financeur
                </button>
              ) : (
                <div className="p-4 mb-3 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-200 dark:border-green-500/30">
                  <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-3">
                    Nouveau financeur
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Nom du financeur *
                      </label>
                      <input
                        type="text"
                        value={newFinanceurNom}
                        onChange={(e) => setNewFinanceurNom(e.target.value)}
                        placeholder="Ex: OPCO Atlas"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Type de financeur
                      </label>
                      <div className="relative">
                        <select
                          value={newFinanceurType}
                          onChange={(e) => setNewFinanceurType(e.target.value as FinanceurType)}
                          className="w-full py-2 pl-3 pr-8 text-sm border border-gray-200 rounded-lg bg-white appearance-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        >
                          {financeurTypes.map((type) => (
                            <option key={type} value={type}>
                              {financeurTypeLabels[type]}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={16}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setShowCreateFinanceur(false);
                          setNewFinanceurNom("");
                          setNewFinanceurType("OPCO");
                        }}
                        className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleCreateFinanceur}
                        disabled={!newFinanceurNom.trim() || creatingFinanceur}
                        className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {creatingFinanceur ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Check size={16} />
                        )}
                        Créer et sélectionner
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loadingFinanceurs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-brand-500" size={24} />
                </div>
              ) : filteredFinanceurs.length === 0 ? (
                <div className="text-center py-8">
                  <Landmark className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Aucun financeur trouvé</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Créez un financeur ci-dessus ou ajoutez-en dans Mes données
                  </p>
                </div>
              ) : (
                filteredFinanceurs.map((financeur) => (
                  <button
                    key={financeur.id}
                    onClick={() => selectFinanceur(financeur)}
                    className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors dark:border-gray-700 dark:hover:border-green-500 dark:hover:bg-green-500/10"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {financeur.nom}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {financeurTypeLabels[financeur.type as FinanceurType] || financeur.type}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                        {financeurTypeLabels[financeur.type as FinanceurType] || financeur.type}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
