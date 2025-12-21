"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Video,
  Shuffle,
  ChevronDown,
  ChevronLeft,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Loader2,
  Building2,
  Link as LinkIcon,
  X,
  Search,
} from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";
import {
  SessionLieu,
  SessionJournee,
  LieuFormation,
  FormationInfo,
} from "./types";

interface StepLieuProps {
  lieu: SessionLieu;
  formation: FormationInfo;
  onChange: (lieu: SessionLieu) => void;
  onNext: () => void;
  onPrev: () => void;
}

type Modalite = "PRESENTIEL" | "DISTANCIEL" | "MIXTE";

const modaliteOptions: {
  value: Modalite;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: "PRESENTIEL",
    label: "Présentiel",
    icon: <MapPin size={20} />,
    description: "Formation en salle",
  },
  {
    value: "DISTANCIEL",
    label: "Distanciel",
    icon: <Video size={20} />,
    description: "Formation à distance",
  },
  {
    value: "MIXTE",
    label: "Mixte",
    icon: <Shuffle size={20} />,
    description: "Présentiel + distanciel",
  },
];

export default function StepLieu({
  lieu,
  formation,
  onChange,
  onNext,
  onPrev,
}: StepLieuProps) {
  const [lieux, setLieux] = useState<LieuFormation[]>([]);
  const [loadingLieux, setLoadingLieux] = useState(false);
  const [showLieuModal, setShowLieuModal] = useState(false);
  const [searchLieu, setSearchLieu] = useState("");

  // Charger les lieux depuis la BDD
  const fetchLieux = useCallback(async () => {
    setLoadingLieux(true);
    try {
      const res = await fetch("/api/donnees/lieux");
      if (res.ok) {
        const data = await res.json();
        setLieux(data);
      }
    } catch (error) {
      console.error("Erreur chargement lieux:", error);
    } finally {
      setLoadingLieux(false);
    }
  }, []);

  useEffect(() => {
    fetchLieux();
  }, [fetchLieux]);

  // Initialiser les journées en fonction de la durée de la formation
  useEffect(() => {
    if (lieu.journees.length === 0 && formation.dureeJours > 0) {
      const journees: SessionJournee[] = Array.from(
        { length: formation.dureeJours },
        (_, i) => ({
          id: `journee-${i + 1}`,
          date: "",
          horaireMatin: "09:00 - 12:30",
          horaireApresMidi: "14:00 - 17:30",
        })
      );
      onChange({ ...lieu, journees });
    }
  }, [formation.dureeJours, lieu, onChange]);

  // Mettre à jour la modalité
  const setModalite = (modalite: Modalite) => {
    onChange({
      ...lieu,
      modalite,
      // Reset les champs selon la modalité
      lieuId: modalite === "DISTANCIEL" ? null : lieu.lieuId,
      lienConnexion: modalite === "PRESENTIEL" ? "" : lieu.lienConnexion,
    });
  };

  // Sélectionner un lieu
  const selectLieu = (lieuFormation: LieuFormation) => {
    onChange({
      ...lieu,
      lieuId: lieuFormation.id,
      lieu: lieuFormation,
      adresseLibre: "",
    });
    setShowLieuModal(false);
    setSearchLieu("");
  };

  // Ajouter une journée
  const addJournee = () => {
    const newJournee: SessionJournee = {
      id: `journee-${Date.now()}`,
      date: "",
      horaireMatin: "09:00 - 12:30",
      horaireApresMidi: "14:00 - 17:30",
    };
    onChange({ ...lieu, journees: [...lieu.journees, newJournee] });
  };

  // Supprimer une journée
  const removeJournee = (journeeId: string) => {
    if (lieu.journees.length <= 1) return;
    onChange({
      ...lieu,
      journees: lieu.journees.filter((j) => j.id !== journeeId),
    });
  };

  // Mettre à jour une journée
  const updateJournee = (
    journeeId: string,
    field: keyof SessionJournee,
    value: string
  ) => {
    onChange({
      ...lieu,
      journees: lieu.journees.map((j) =>
        j.id === journeeId ? { ...j, [field]: value } : j
      ),
    });
  };

  // Filtrer les lieux présentiel
  const filteredLieux = lieux.filter(
    (l) =>
      l.typeLieu === "PRESENTIEL" &&
      (l.nom.toLowerCase().includes(searchLieu.toLowerCase()) ||
        l.lieuFormation.toLowerCase().includes(searchLieu.toLowerCase()))
  );

  // Filtrer les lieux distanciel
  const distancielLieux = lieux.filter((l) => l.typeLieu === "VISIOCONFERENCE");

  // Validation
  const isLieuValid =
    lieu.modalite === "DISTANCIEL"
      ? !!lieu.lienConnexion
      : lieu.modalite === "PRESENTIEL"
      ? !!(lieu.lieuId || lieu.adresseLibre)
      : !!(lieu.lieuId || lieu.adresseLibre) && !!lieu.lienConnexion;

  const areDatesValid = lieu.journees.every((j) => !!j.date);

  const canProceed = isLieuValid && areDatesValid && lieu.journees.length > 0;

  const selectedLieu = lieu.lieuId
    ? lieux.find((l) => l.id === lieu.lieuId)
    : null;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10">
            <MapPin className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Lieu & Dates
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Définissez la modalité, le lieu et les dates de la session
            </p>
          </div>
        </div>
      </div>

      {/* Sélection modalité */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Modalité de formation
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {modaliteOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setModalite(option.value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                lieu.modalite === option.value
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                  : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
              }`}
            >
              <div
                className={`p-2.5 rounded-lg ${
                  lieu.modalite === option.value
                    ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {option.icon}
              </div>
              <div className="text-center">
                <p
                  className={`text-sm font-medium ${
                    lieu.modalite === option.value
                      ? "text-brand-700 dark:text-brand-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {option.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {option.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lieu présentiel */}
      {(lieu.modalite === "PRESENTIEL" || lieu.modalite === "MIXTE") && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <Building2 size={16} className="text-gray-400" />
            Lieu de formation (présentiel)
          </h3>

          {selectedLieu ? (
            <div className="p-4 rounded-lg border border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedLieu.nom}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedLieu.lieuFormation}
                  </p>
                  {selectedLieu.ville && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedLieu.codePostal} {selectedLieu.ville}
                    </p>
                  )}
                  {selectedLieu.capacite && (
                    <p className="text-xs text-gray-400 mt-2">
                      Capacité: {selectedLieu.capacite} personnes
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onChange({ ...lieu, lieuId: null, lieu: undefined })}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-500/10"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => setShowLieuModal(true)}
                className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-brand-300 hover:text-brand-500 transition-colors dark:border-gray-700 dark:hover:border-brand-500"
              >
                <MapPin size={18} />
                Sélectionner un lieu de la base
              </button>

              <div className="text-center text-xs text-gray-400">ou</div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Adresse libre
                </label>
                <textarea
                  value={lieu.adresseLibre}
                  onChange={(e) =>
                    onChange({ ...lieu, adresseLibre: e.target.value })
                  }
                  placeholder="Saisissez une adresse..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lien visioconférence */}
      {(lieu.modalite === "DISTANCIEL" || lieu.modalite === "MIXTE") && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <Video size={16} className="text-gray-400" />
            Accès distanciel
          </h3>

          <div className="space-y-3">
            {/* Lien depuis la BDD */}
            {distancielLieux.length > 0 && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Lien depuis votre base
                </label>
                <select
                  value={lieu.lieuId && distancielLieux.some((l) => l.id === lieu.lieuId) ? lieu.lieuId : ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      const selected = distancielLieux.find(
                        (l) => l.id === e.target.value
                      );
                      if (selected) {
                        onChange({
                          ...lieu,
                          lienConnexion: selected.lieuFormation,
                        });
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Sélectionner...</option>
                  {distancielLieux.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                {distancielLieux.length > 0
                  ? "Ou saisir un lien personnalisé"
                  : "Lien de connexion"}
              </label>
              <div className="relative">
                <LinkIcon
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="url"
                  value={lieu.lienConnexion}
                  onChange={(e) =>
                    onChange({ ...lieu, lienConnexion: e.target.value })
                  }
                  placeholder="https://meet.google.com/xxx-xxx-xxx"
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Planning des journées */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            Planning des journées
          </h3>
          <button
            onClick={addJournee}
            className="text-xs font-medium text-brand-500 hover:text-brand-600 flex items-center gap-1"
          >
            <Plus size={14} />
            Ajouter une journée
          </button>
        </div>

        <div className="space-y-3">
          {lieu.journees.map((journee, index) => (
            <div
              key={journee.id}
              className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
              {/* Numéro journée */}
              <div className="col-span-1">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-100 text-brand-600 text-sm font-medium dark:bg-brand-500/20 dark:text-brand-400">
                  J{index + 1}
                </span>
              </div>

              {/* Date */}
              <div className="col-span-3">
                <label className="block text-xs text-gray-400 mb-1">Date</label>
                <DatePicker
                  value={journee.date}
                  onChange={(date) => updateJournee(journee.id, "date", date)}
                  placeholder="jj/mm/aaaa"
                />
              </div>

              {/* Horaire matin */}
              <div className="col-span-3">
                <label className="block text-xs text-gray-400 mb-1">Matin</label>
                <div className="relative">
                  <Clock
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={journee.horaireMatin}
                    onChange={(e) =>
                      updateJournee(journee.id, "horaireMatin", e.target.value)
                    }
                    placeholder="09:00 - 12:30"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Horaire après-midi */}
              <div className="col-span-3">
                <label className="block text-xs text-gray-400 mb-1">
                  Après-midi
                </label>
                <div className="relative">
                  <Clock
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={journee.horaireApresMidi}
                    onChange={(e) =>
                      updateJournee(journee.id, "horaireApresMidi", e.target.value)
                    }
                    placeholder="14:00 - 17:30"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Supprimer */}
              <div className="col-span-2 flex justify-end">
                {lieu.journees.length > 1 && (
                  <button
                    onClick={() => removeJournee(journee.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info durée formation */}
        <p className="text-xs text-gray-400 mt-3">
          Durée formation: {formation.dureeJours} jour(s) / {formation.dureeHeures}h
        </p>
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

      {/* Modal sélection lieu */}
      {showLieuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sélectionner un lieu
              </h3>
              <button
                onClick={() => {
                  setShowLieuModal(false);
                  setSearchLieu("");
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
                  placeholder="Rechercher un lieu..."
                  value={searchLieu}
                  onChange={(e) => setSearchLieu(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingLieux ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-brand-500" size={24} />
                </div>
              ) : filteredLieux.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Aucun lieu trouvé</p>
                </div>
              ) : (
                filteredLieux.map((lieuItem) => (
                  <button
                    key={lieuItem.id}
                    onClick={() => selectLieu(lieuItem)}
                    className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors dark:border-gray-700 dark:hover:border-brand-500 dark:hover:bg-brand-500/10"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {lieuItem.nom}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {lieuItem.lieuFormation}
                    </div>
                    {lieuItem.ville && (
                      <div className="text-xs text-gray-400 mt-1">
                        {lieuItem.codePostal} {lieuItem.ville}
                      </div>
                    )}
                    {lieuItem.capacite && (
                      <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded dark:bg-gray-800">
                        {lieuItem.capacite} places
                      </span>
                    )}
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
