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
  Tag,
  Clock,
  Award,
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
  // Valeurs par défaut pour éviter les erreurs si undefined (données de BDD)
  const safeFormateurs = {
    formateurPrincipalId: formateurs?.formateurPrincipalId ?? null,
    formateurPrincipal: formateurs?.formateurPrincipal,
    coformateursIds: formateurs?.coformateursIds ?? [],
    coformateurs: formateurs?.coformateurs ?? [],
  };

  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showFormateurModal, setShowFormateurModal] = useState(false);
  const [modalType, setModalType] = useState<"principal" | "coformateur">("principal");
  const [searchFormateur, setSearchFormateur] = useState("");

  // Modal création complète
  const [showCreateIntervenantModal, setShowCreateIntervenantModal] = useState(false);
  const [creatingIntervenant, setCreatingIntervenant] = useState(false);

  // Liste des spécialités prédéfinies
  const SPECIALITES_SUGGESTIONS = [
    "Commerce & Vente",
    "Marketing & Communication",
    "Management & Leadership",
    "Ressources Humaines & Recrutement",
    "Ingénierie pédagogique & Formation de formateurs",
    "Gestion d'entreprise & Entrepreneuriat",
    "Bureautique & Outils collaboratifs",
    "Gestion de projet",
    "Digital & Web (SEO / Ads / Réseaux sociaux)",
    "Intelligence Artificielle & Automatisation",
    "Informatique & Cybersécurité",
    "Finance",
    "Comptabilité & Paie",
    "Relation client",
    "Développement personnel",
    "Santé",
    "Sécurité & Prévention",
    "Bien-être",
    "Nutrition & Santé",
    "Sport & Coaching",
    "Immobilier",
    "Assurance & Banque",
    "Hôtellerie",
    "Restauration & Tourisme",
    "Accueil, Secrétariat & Administratif",
    "Industrie",
  ];

  // Formulaire intervenant complet
  const [intervenantForm, setIntervenantForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    fonction: "",
    specialites: [] as string[],
    structure: "",
    structureSiret: "",
    notes: "",
    biographie: "",
    anneesExperience: "",
    numeroDeclarationActivite: "",
  });
  const [newSpecialite, setNewSpecialite] = useState("");
  const [showSpecialiteSuggestions, setShowSpecialiteSuggestions] = useState(false);

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
    const newCoformateurs = safeFormateurs.coformateurs.filter(
      (c) => c.id !== intervenant.id
    );
    const newCoformateursIds = safeFormateurs.coformateursIds.filter(
      (id) => id !== intervenant.id
    );

    onChange({
      ...safeFormateurs,
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
      safeFormateurs.formateurPrincipalId === intervenant.id ||
      safeFormateurs.coformateursIds.includes(intervenant.id)
    ) {
      return;
    }

    onChange({
      ...safeFormateurs,
      coformateursIds: [...safeFormateurs.coformateursIds, intervenant.id],
      coformateurs: [...safeFormateurs.coformateurs, intervenant],
    });
    setShowFormateurModal(false);
    setSearchFormateur("");
  };

  // Retirer le formateur principal
  const removeFormateurPrincipal = () => {
    onChange({
      ...safeFormateurs,
      formateurPrincipalId: null,
      formateurPrincipal: undefined,
    });
  };

  // Retirer un coformateur
  const removeCoformateur = (intervenantId: string) => {
    onChange({
      ...safeFormateurs,
      coformateursIds: safeFormateurs.coformateursIds.filter((id) => id !== intervenantId),
      coformateurs: safeFormateurs.coformateurs.filter((c) => c.id !== intervenantId),
    });
  };

  // Reset formulaire intervenant
  const resetIntervenantForm = () => {
    setIntervenantForm({
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      fonction: "",
      specialites: [],
      structure: "",
      structureSiret: "",
      notes: "",
      biographie: "",
      anneesExperience: "",
      numeroDeclarationActivite: "",
    });
    setNewSpecialite("");
    setShowSpecialiteSuggestions(false);
  };

  // Ajouter une spécialité
  const addSpecialite = () => {
    if (newSpecialite.trim() && !intervenantForm.specialites.includes(newSpecialite.trim())) {
      setIntervenantForm({
        ...intervenantForm,
        specialites: [...intervenantForm.specialites, newSpecialite.trim()],
      });
      setNewSpecialite("");
    }
  };

  // Supprimer une spécialité
  const removeSpecialite = (spec: string) => {
    setIntervenantForm({
      ...intervenantForm,
      specialites: intervenantForm.specialites.filter((s) => s !== spec),
    });
  };

  // Créer un intervenant avec formulaire complet
  const handleCreateIntervenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intervenantForm.nom || !intervenantForm.prenom || !intervenantForm.email) return;
    setCreatingIntervenant(true);
    try {
      const res = await fetch("/api/donnees/intervenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intervenantForm),
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

        resetIntervenantForm();
        setShowCreateIntervenantModal(false);
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Erreur création intervenant:", error);
      alert("Erreur lors de la création");
    } finally {
      setCreatingIntervenant(false);
    }
  };

  // Promouvoir un coformateur en formateur principal
  const promoteToFormateur = (intervenant: Intervenant) => {
    // Déplacer l'ancien formateur principal vers coformateurs
    const newCoformateurs = [...safeFormateurs.coformateurs.filter((c) => c.id !== intervenant.id)];
    const newCoformateursIds = [...safeFormateurs.coformateursIds.filter((id) => id !== intervenant.id)];

    if (safeFormateurs.formateurPrincipal) {
      newCoformateurs.push(safeFormateurs.formateurPrincipal);
      newCoformateursIds.push(safeFormateurs.formateurPrincipalId!);
    }

    onChange({
      ...safeFormateurs,
      formateurPrincipalId: intervenant.id,
      formateurPrincipal: intervenant,
      coformateurs: newCoformateurs,
      coformateursIds: newCoformateursIds,
    });
  };

  const canProceed = !!safeFormateurs.formateurPrincipalId;

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

        {safeFormateurs.formateurPrincipal ? (
          <div className="p-4 rounded-lg border border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
                  <span className="text-lg font-semibold text-brand-600 dark:text-brand-400">
                    {safeFormateurs.formateurPrincipal.prenom?.[0] || ""}
                    {safeFormateurs.formateurPrincipal.nom?.[0] || ""}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {safeFormateurs.formateurPrincipal.prenom}{" "}
                    {safeFormateurs.formateurPrincipal.nom}
                  </p>
                  {safeFormateurs.formateurPrincipal.fonction && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {safeFormateurs.formateurPrincipal.fonction}
                    </p>
                  )}
                  {safeFormateurs.formateurPrincipal.email && (
                    <p className="text-xs text-gray-400 mt-1">
                      {safeFormateurs.formateurPrincipal.email}
                    </p>
                  )}
                  {safeFormateurs.formateurPrincipal.specialites &&
                    safeFormateurs.formateurPrincipal.specialites.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {safeFormateurs.formateurPrincipal.specialites.map((s, i) => (
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

        {safeFormateurs.coformateurs.length > 0 && (
          <div className="space-y-2 mb-4">
            {safeFormateurs.coformateurs.map((coformateur) => (
              <div
                key={coformateur.id}
                className="p-3 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {coformateur.prenom?.[0] || ""}
                        {coformateur.nom?.[0] || ""}
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
      {(safeFormateurs.formateurPrincipal || safeFormateurs.coformateurs.length > 0) && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Équipe pédagogique
          </h4>
          <div className="flex flex-wrap gap-2">
            {safeFormateurs.formateurPrincipal && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-100 dark:bg-brand-500/20 text-sm font-medium text-brand-700 dark:text-brand-400">
                <Star size={14} />
                {safeFormateurs.formateurPrincipal.prenom}{" "}
                {safeFormateurs.formateurPrincipal.nom}
              </span>
            )}
            {safeFormateurs.coformateurs.map((c) => (
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
                    safeFormateurs.formateurPrincipalId === intervenant.id;
                  const isCoformateur = safeFormateurs.coformateursIds.includes(
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
                            {intervenant.prenom?.[0] || ""}
                            {intervenant.nom?.[0] || ""}
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
              <button
                onClick={() => {
                  resetIntervenantForm();
                  setShowCreateIntervenantModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg transition-colors dark:bg-brand-500/10 dark:border-brand-500/30 dark:text-brand-400 dark:hover:bg-brand-500/20"
              >
                <Plus size={18} />
                Créer un nouvel intervenant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal création intervenant complète */}
      {showCreateIntervenantModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Nouvel intervenant
              </h2>
              <button
                onClick={() => {
                  setShowCreateIntervenantModal(false);
                  resetIntervenantForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateIntervenant} className="p-6 space-y-6">
              {/* Informations personnelles */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Informations personnelles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      required
                      value={intervenantForm.prenom}
                      onChange={(e) => setIntervenantForm({ ...intervenantForm, prenom: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      required
                      value={intervenantForm.nom}
                      onChange={(e) => setIntervenantForm({ ...intervenantForm, nom: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={intervenantForm.email}
                      onChange={(e) => setIntervenantForm({ ...intervenantForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={intervenantForm.telephone}
                      onChange={(e) => setIntervenantForm({ ...intervenantForm, telephone: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Fonction
                    </label>
                    <input
                      type="text"
                      value={intervenantForm.fonction}
                      onChange={(e) => setIntervenantForm({ ...intervenantForm, fonction: e.target.value })}
                      placeholder="Ex: Formateur, Consultant, Coach..."
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Spécialités */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Spécialités
                </h3>
                <div className="relative">
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newSpecialite}
                      onChange={(e) => setNewSpecialite(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialite())}
                      onFocus={() => setShowSpecialiteSuggestions(true)}
                      placeholder="Ajouter une spécialité..."
                      className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSpecialiteSuggestions(!showSpecialiteSuggestions)}
                      className="px-4 py-2.5 text-sm font-medium text-brand-500 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
                      title="Voir les suggestions"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Liste déroulante des suggestions */}
                  {showSpecialiteSuggestions && (
                    <>
                      <div
                        className="fixed inset-0 z-[5]"
                        onClick={() => setShowSpecialiteSuggestions(false)}
                      />
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            Sélectionnez une ou plusieurs spécialités
                          </p>
                        </div>
                        {SPECIALITES_SUGGESTIONS
                          .filter(spec => !intervenantForm.specialites.includes(spec))
                          .filter(spec => !newSpecialite || spec.toLowerCase().includes(newSpecialite.toLowerCase()))
                          .map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => {
                              if (!intervenantForm.specialites.includes(suggestion)) {
                                setIntervenantForm({
                                  ...intervenantForm,
                                  specialites: [...intervenantForm.specialites, suggestion],
                                });
                              }
                              setNewSpecialite("");
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                        {newSpecialite.trim() && !SPECIALITES_SUGGESTIONS.some(s => s.toLowerCase() === newSpecialite.toLowerCase()) && (
                          <button
                            type="button"
                            onClick={() => {
                              addSpecialite();
                              setShowSpecialiteSuggestions(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors border-t border-gray-100 dark:border-gray-700"
                          >
                            + Ajouter &quot;{newSpecialite}&quot;
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowSpecialiteSuggestions(false)}
                          className="w-full px-4 py-2 text-center text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border-t border-gray-100 dark:border-gray-700"
                        >
                          Fermer
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {intervenantForm.specialites.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {intervenantForm.specialites.map((spec) => (
                      <span
                        key={spec}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full dark:bg-gray-800 dark:text-gray-300"
                      >
                        <Tag size={12} />
                        {spec}
                        <button
                          type="button"
                          onClick={() => removeSpecialite(spec)}
                          className="ml-1 text-gray-400 hover:text-gray-600"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Structure */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Structure (si externe)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Nom de la structure
                    </label>
                    <input
                      type="text"
                      value={intervenantForm.structure}
                      onChange={(e) => setIntervenantForm({ ...intervenantForm, structure: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      SIRET structure
                    </label>
                    <input
                      type="text"
                      value={intervenantForm.structureSiret}
                      onChange={(e) => setIntervenantForm({ ...intervenantForm, structureSiret: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Qualiopi IND 17 */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Qualiopi IND 17 - Profil intervenant
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Expérience et numéro déclaration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          Années d&apos;expérience
                        </span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={intervenantForm.anneesExperience}
                        onChange={(e) => setIntervenantForm({ ...intervenantForm, anneesExperience: e.target.value })}
                        placeholder="5"
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        N° déclaration d&apos;activité
                      </label>
                      <input
                        type="text"
                        value={intervenantForm.numeroDeclarationActivite}
                        onChange={(e) => setIntervenantForm({ ...intervenantForm, numeroDeclarationActivite: e.target.value })}
                        placeholder="ex: 11756789012"
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Biographie */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Biographie professionnelle
                    </label>
                    <textarea
                      rows={3}
                      value={intervenantForm.biographie}
                      onChange={(e) => setIntervenantForm({ ...intervenantForm, biographie: e.target.value })}
                      placeholder="Parcours professionnel, domaines d'expertise..."
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Notes internes
                </label>
                <textarea
                  rows={3}
                  value={intervenantForm.notes}
                  onChange={(e) => setIntervenantForm({ ...intervenantForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateIntervenantModal(false);
                    resetIntervenantForm();
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creatingIntervenant}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingIntervenant && <Loader2 size={16} className="animate-spin" />}
                  Créer et sélectionner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
