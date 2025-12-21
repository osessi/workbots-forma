"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  UserCog,
  ChevronDown,
  ChevronLeft,
  Plus,
  X,
  Search,
  Loader2,
  Star,
  Users,
  Trash2,
  Check,
} from "lucide-react";
import { SessionFormateurs, Intervenant } from "./types";

interface StepFormateursProps {
  formateurs: SessionFormateurs;
  onChange: (formateurs: SessionFormateurs) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function StepFormateurs({
  formateurs,
  onChange,
  onNext,
  onPrev,
}: StepFormateursProps) {
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showFormateurModal, setShowFormateurModal] = useState(false);
  const [modalType, setModalType] = useState<"principal" | "coformateur">("principal");
  const [searchFormateur, setSearchFormateur] = useState("");

  // Création rapide
  const [creatingIntervenant, setCreatingIntervenant] = useState(false);
  const [newIntervenant, setNewIntervenant] = useState({
    nom: "",
    prenom: "",
    email: "",
    fonction: "",
  });

  // Charger les intervenants
  const fetchIntervenants = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await fetch("/api/donnees/intervenants");
      if (res.ok) {
        const data = await res.json();
        setIntervenants(data);
      }
    } catch (error) {
      console.error("Erreur chargement intervenants:", error);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchIntervenants();
  }, [fetchIntervenants]);

  // Filtrer les intervenants
  const filteredIntervenants = intervenants.filter(
    (i) =>
      i.nom.toLowerCase().includes(searchFormateur.toLowerCase()) ||
      i.prenom.toLowerCase().includes(searchFormateur.toLowerCase()) ||
      (i.specialites || []).some((s) =>
        s.toLowerCase().includes(searchFormateur.toLowerCase())
      )
  );

  // Ouvrir la modal
  const openModal = (type: "principal" | "coformateur") => {
    setModalType(type);
    setShowFormateurModal(true);
    setSearchFormateur("");
  };

  // Sélectionner le formateur principal
  const selectFormateurPrincipal = (intervenant: Intervenant) => {
    // Si l'intervenant était coformateur, le retirer
    const newCoformateurs = formateurs.coformateurs.filter(
      (c) => c.id !== intervenant.id
    );
    const newCoformateursIds = formateurs.coformateursIds.filter(
      (id) => id !== intervenant.id
    );

    onChange({
      ...formateurs,
      formateurPrincipalId: intervenant.id,
      formateurPrincipal: intervenant,
      coformateurs: newCoformateurs,
      coformateursIds: newCoformateursIds,
    });
    setShowFormateurModal(false);
    setSearchFormateur("");
  };

  // Ajouter un coformateur
  const addCoformateur = (intervenant: Intervenant) => {
    // Ne pas ajouter si c'est déjà le formateur principal ou déjà coformateur
    if (
      formateurs.formateurPrincipalId === intervenant.id ||
      formateurs.coformateursIds.includes(intervenant.id)
    ) {
      return;
    }

    onChange({
      ...formateurs,
      coformateursIds: [...formateurs.coformateursIds, intervenant.id],
      coformateurs: [...formateurs.coformateurs, intervenant],
    });
    setShowFormateurModal(false);
    setSearchFormateur("");
  };

  // Retirer le formateur principal
  const removeFormateurPrincipal = () => {
    onChange({
      ...formateurs,
      formateurPrincipalId: null,
      formateurPrincipal: undefined,
    });
  };

  // Retirer un coformateur
  const removeCoformateur = (intervenantId: string) => {
    onChange({
      ...formateurs,
      coformateursIds: formateurs.coformateursIds.filter((id) => id !== intervenantId),
      coformateurs: formateurs.coformateurs.filter((c) => c.id !== intervenantId),
    });
  };

  // Créer un intervenant rapidement
  const handleCreateIntervenant = async () => {
    if (!newIntervenant.nom || !newIntervenant.prenom) return;
    setCreatingIntervenant(true);
    try {
      const res = await fetch("/api/donnees/intervenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIntervenant),
      });
      if (res.ok) {
        const created = await res.json();
        setIntervenants([...intervenants, created]);

        // Ajouter selon le type
        if (modalType === "principal") {
          selectFormateurPrincipal(created);
        } else {
          addCoformateur(created);
        }

        setNewIntervenant({ nom: "", prenom: "", email: "", fonction: "" });
      }
    } catch (error) {
      console.error("Erreur création intervenant:", error);
    } finally {
      setCreatingIntervenant(false);
    }
  };

  // Promouvoir un coformateur en formateur principal
  const promoteToFormateur = (intervenant: Intervenant) => {
    // Déplacer l'ancien formateur principal vers coformateurs
    const newCoformateurs = [...formateurs.coformateurs.filter((c) => c.id !== intervenant.id)];
    const newCoformateursIds = [...formateurs.coformateursIds.filter((id) => id !== intervenant.id)];

    if (formateurs.formateurPrincipal) {
      newCoformateurs.push(formateurs.formateurPrincipal);
      newCoformateursIds.push(formateurs.formateurPrincipalId!);
    }

    onChange({
      ...formateurs,
      formateurPrincipalId: intervenant.id,
      formateurPrincipal: intervenant,
      coformateurs: newCoformateurs,
      coformateursIds: newCoformateursIds,
    });
  };

  const canProceed = !!formateurs.formateurPrincipalId;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10">
            <UserCog className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Formateur(s)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Désignez le formateur principal et les éventuels co-formateurs
            </p>
          </div>
        </div>
      </div>

      {/* Formateur principal */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <Star size={16} className="text-yellow-500" />
          Formateur principal
          <span className="text-xs text-red-500">*</span>
        </h3>

        {formateurs.formateurPrincipal ? (
          <div className="p-4 rounded-lg border border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
                  <span className="text-lg font-semibold text-brand-600 dark:text-brand-400">
                    {formateurs.formateurPrincipal.prenom[0]}
                    {formateurs.formateurPrincipal.nom[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formateurs.formateurPrincipal.prenom}{" "}
                    {formateurs.formateurPrincipal.nom}
                  </p>
                  {formateurs.formateurPrincipal.fonction && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formateurs.formateurPrincipal.fonction}
                    </p>
                  )}
                  {formateurs.formateurPrincipal.email && (
                    <p className="text-xs text-gray-400 mt-1">
                      {formateurs.formateurPrincipal.email}
                    </p>
                  )}
                  {formateurs.formateurPrincipal.specialites &&
                    formateurs.formateurPrincipal.specialites.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {formateurs.formateurPrincipal.specialites.map((s, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              </div>
              <button
                onClick={removeFormateurPrincipal}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-500/10"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => openModal("principal")}
            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-brand-300 hover:text-brand-500 transition-colors dark:border-gray-700 dark:hover:border-brand-500"
          >
            <Plus size={18} />
            Sélectionner le formateur principal
          </button>
        )}
      </div>

      {/* Co-formateurs */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <Users size={16} className="text-gray-400" />
          Co-formateurs
          <span className="text-xs text-gray-400 font-normal">(optionnel)</span>
        </h3>

        {formateurs.coformateurs.length > 0 && (
          <div className="space-y-2 mb-4">
            {formateurs.coformateurs.map((coformateur) => (
              <div
                key={coformateur.id}
                className="p-3 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {coformateur.prenom[0]}
                        {coformateur.nom[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {coformateur.prenom} {coformateur.nom}
                      </p>
                      {coformateur.fonction && (
                        <p className="text-xs text-gray-500">
                          {coformateur.fonction}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => promoteToFormateur(coformateur)}
                      title="Promouvoir formateur principal"
                      className="p-1.5 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg dark:hover:bg-yellow-500/10"
                    >
                      <Star size={16} />
                    </button>
                    <button
                      onClick={() => removeCoformateur(coformateur.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-500/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => openModal("coformateur")}
          className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-brand-300 hover:text-brand-500 transition-colors dark:border-gray-700 dark:hover:border-brand-500"
        >
          <Plus size={16} />
          Ajouter un co-formateur
        </button>
      </div>

      {/* Récapitulatif */}
      {(formateurs.formateurPrincipal || formateurs.coformateurs.length > 0) && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Équipe pédagogique
          </h4>
          <div className="flex flex-wrap gap-2">
            {formateurs.formateurPrincipal && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-100 dark:bg-brand-500/20 text-sm font-medium text-brand-700 dark:text-brand-400">
                <Star size={14} />
                {formateurs.formateurPrincipal.prenom}{" "}
                {formateurs.formateurPrincipal.nom}
              </span>
            )}
            {formateurs.coformateurs.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {c.prenom} {c.nom}
              </span>
            ))}
          </div>
        </div>
      )}

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

      {/* Modal sélection formateur */}
      {showFormateurModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {modalType === "principal"
                  ? "Sélectionner le formateur principal"
                  : "Ajouter un co-formateur"}
              </h3>
              <button
                onClick={() => {
                  setShowFormateurModal(false);
                  setSearchFormateur("");
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Rechercher un intervenant..."
                  value={searchFormateur}
                  onChange={(e) => setSearchFormateur(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-brand-500" size={24} />
                </div>
              ) : filteredIntervenants.length === 0 ? (
                <div className="text-center py-8">
                  <UserCog className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Aucun intervenant trouvé</p>
                </div>
              ) : (
                filteredIntervenants.map((intervenant) => {
                  const isFormateurPrincipal =
                    formateurs.formateurPrincipalId === intervenant.id;
                  const isCoformateur = formateurs.coformateursIds.includes(
                    intervenant.id
                  );
                  const isDisabled =
                    isFormateurPrincipal ||
                    (modalType === "coformateur" && isCoformateur);

                  return (
                    <button
                      key={intervenant.id}
                      onClick={() => {
                        if (!isDisabled) {
                          if (modalType === "principal") {
                            selectFormateurPrincipal(intervenant);
                          } else {
                            addCoformateur(intervenant);
                          }
                        }
                      }}
                      disabled={isDisabled}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        isDisabled
                          ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800"
                          : "border-gray-200 hover:border-brand-300 hover:bg-brand-50 dark:border-gray-700 dark:hover:border-brand-500 dark:hover:bg-brand-500/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {intervenant.prenom[0]}
                            {intervenant.nom[0]}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {intervenant.prenom} {intervenant.nom}
                            </span>
                            {isFormateurPrincipal && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded dark:bg-yellow-500/20 dark:text-yellow-400">
                                <Star size={10} /> Principal
                              </span>
                            )}
                            {isCoformateur && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded dark:bg-gray-700 dark:text-gray-400">
                                <Check size={10} /> Co-formateur
                              </span>
                            )}
                          </div>
                          {intervenant.fonction && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {intervenant.fonction}
                            </p>
                          )}
                          {intervenant.specialites &&
                            intervenant.specialites.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {intervenant.specialites.slice(0, 3).map((s, i) => (
                                  <span
                                    key={i}
                                    className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded dark:bg-gray-700"
                                  >
                                    {s}
                                  </span>
                                ))}
                                {intervenant.specialites.length > 3 && (
                                  <span className="text-xs text-gray-400">
                                    +{intervenant.specialites.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Créer un nouvel intervenant */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-500 mb-3">
                Ou créer un nouvel intervenant :
              </p>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Prénom *"
                    value={newIntervenant.prenom}
                    onChange={(e) =>
                      setNewIntervenant({ ...newIntervenant, prenom: e.target.value })
                    }
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Nom *"
                    value={newIntervenant.nom}
                    onChange={(e) =>
                      setNewIntervenant({ ...newIntervenant, nom: e.target.value })
                    }
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Email"
                    value={newIntervenant.email}
                    onChange={(e) =>
                      setNewIntervenant({ ...newIntervenant, email: e.target.value })
                    }
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Fonction"
                    value={newIntervenant.fonction}
                    onChange={(e) =>
                      setNewIntervenant({ ...newIntervenant, fonction: e.target.value })
                    }
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <button
                  onClick={handleCreateIntervenant}
                  disabled={
                    !newIntervenant.nom ||
                    !newIntervenant.prenom ||
                    creatingIntervenant
                  }
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creatingIntervenant && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  Créer et sélectionner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
