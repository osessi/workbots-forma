"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Users,
  Loader2,
  Info,
  Video,
  Link as LinkIcon,
  CheckCircle2,
  Circle,
  ClipboardCheck,
} from "lucide-react";

type TypeLieu = "PRESENTIEL" | "VISIOCONFERENCE";

interface LieuFormation {
  id: string;
  nom: string;
  typeLieu: TypeLieu;
  lieuFormation: string;
  codePostal: string | null;
  ville: string | null;
  infosPratiques: string | null;
  capacite: number | null;
  // Checklist conformité Qualiopi IND 17
  checkSurfaceAdaptee: boolean;
  checkErpConforme: boolean;
  checkVentilation: boolean;
  checkEclairage: boolean;
  checkSanitaires: boolean;
  checkAccessibiliteHandicap: boolean;
  checkWifi: boolean;
  checkVideoprojecteur: boolean;
  checkMobilier: boolean;
  checkEquipements: boolean;
  checkFournitures: boolean;
  notesConformite: string | null;
}

const typeLabels: Record<TypeLieu, string> = {
  PRESENTIEL: "Présentiel",
  VISIOCONFERENCE: "Visioconférence",
};

const typeColors: Record<TypeLieu, string> = {
  PRESENTIEL: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  VISIOCONFERENCE: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
};

export default function LieuxPage() {
  const [lieux, setLieux] = useState<LieuFormation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLieu, setEditingLieu] = useState<LieuFormation | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nom: "",
    typeLieu: "PRESENTIEL" as TypeLieu,
    lieuFormation: "",
    codePostal: "",
    ville: "",
    infosPratiques: "",
    capacite: "",
    // Checklist conformité Qualiopi IND 17
    checkSurfaceAdaptee: false,
    checkErpConforme: false,
    checkVentilation: false,
    checkEclairage: false,
    checkSanitaires: false,
    checkAccessibiliteHandicap: false,
    checkWifi: false,
    checkVideoprojecteur: false,
    checkMobilier: false,
    checkEquipements: false,
    checkFournitures: false,
    notesConformite: "",
  });

  const fetchLieux = useCallback(async () => {
    try {
      const res = await fetch(`/api/donnees/lieux?search=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setLieux(data);
      }
    } catch (error) {
      console.error("Erreur chargement lieux:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchLieux();
  }, [fetchLieux]);

  const resetForm = () => {
    setFormData({
      nom: "",
      typeLieu: "PRESENTIEL",
      lieuFormation: "",
      codePostal: "",
      ville: "",
      infosPratiques: "",
      capacite: "",
      checkSurfaceAdaptee: false,
      checkErpConforme: false,
      checkVentilation: false,
      checkEclairage: false,
      checkSanitaires: false,
      checkAccessibiliteHandicap: false,
      checkWifi: false,
      checkVideoprojecteur: false,
      checkMobilier: false,
      checkEquipements: false,
      checkFournitures: false,
      notesConformite: "",
    });
    setEditingLieu(null);
  };

  const openModal = (lieu?: LieuFormation) => {
    if (lieu) {
      setEditingLieu(lieu);
      setFormData({
        nom: lieu.nom,
        typeLieu: lieu.typeLieu || "PRESENTIEL",
        lieuFormation: lieu.lieuFormation || "",
        codePostal: lieu.codePostal || "",
        ville: lieu.ville || "",
        infosPratiques: lieu.infosPratiques || "",
        capacite: lieu.capacite?.toString() || "",
        checkSurfaceAdaptee: lieu.checkSurfaceAdaptee || false,
        checkErpConforme: lieu.checkErpConforme || false,
        checkVentilation: lieu.checkVentilation || false,
        checkEclairage: lieu.checkEclairage || false,
        checkSanitaires: lieu.checkSanitaires || false,
        checkAccessibiliteHandicap: lieu.checkAccessibiliteHandicap || false,
        checkWifi: lieu.checkWifi || false,
        checkVideoprojecteur: lieu.checkVideoprojecteur || false,
        checkMobilier: lieu.checkMobilier || false,
        checkEquipements: lieu.checkEquipements || false,
        checkFournitures: lieu.checkFournitures || false,
        notesConformite: lieu.notesConformite || "",
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  // Calculer le score de conformité
  const getConformityScore = (lieu: LieuFormation) => {
    if (lieu.typeLieu === "VISIOCONFERENCE") return null;
    const checks = [
      lieu.checkSurfaceAdaptee,
      lieu.checkErpConforme,
      lieu.checkVentilation,
      lieu.checkEclairage,
      lieu.checkSanitaires,
      lieu.checkAccessibiliteHandicap,
      lieu.checkWifi,
      lieu.checkVideoprojecteur,
      lieu.checkMobilier,
      lieu.checkEquipements,
      lieu.checkFournitures,
    ];
    const total = checks.length;
    const checked = checks.filter(Boolean).length;
    return { checked, total, percentage: Math.round((checked / total) * 100) };
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingLieu
        ? `/api/donnees/lieux/${editingLieu.id}`
        : "/api/donnees/lieux";
      const method = editingLieu ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        closeModal();
        fetchLieux();
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce lieu ?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/donnees/lieux/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchLieux();
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-500/10">
              <MapPin className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Lieux de formation
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gérez les salles et lieux de formation (présentiel ou visio)
              </p>
            </div>
          </div>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm hover:shadow-md whitespace-nowrap"
          >
            <Plus size={20} />
            Ajouter un lieu
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="mt-6">
          <div className="relative max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={20} />
            </span>
            <input
              type="text"
              placeholder="Rechercher un lieu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : lieux.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <MapPin className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? `Aucun lieu trouvé pour "${searchQuery}"` : "Aucun lieu enregistré"}
          </p>
          <button
            onClick={() => openModal()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
          >
            <Plus size={16} />
            Ajouter votre premier lieu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lieux.map((lieu) => (
            <div
              key={lieu.id}
              className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] hover:border-brand-200 dark:hover:border-brand-800 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {lieu.nom}
                  </h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${typeColors[lieu.typeLieu || "PRESENTIEL"]}`}>
                    {typeLabels[lieu.typeLieu || "PRESENTIEL"]}
                  </span>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => openModal(lieu)}
                    className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors dark:hover:bg-brand-500/10"
                    title="Modifier"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(lieu.id)}
                    disabled={deleting === lieu.id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10 disabled:opacity-50"
                    title="Supprimer"
                  >
                    {deleting === lieu.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-2">
                  {lieu.typeLieu === "VISIOCONFERENCE" ? (
                    <LinkIcon size={14} className="flex-shrink-0 text-blue-400 mt-0.5" />
                  ) : (
                    <MapPin size={14} className="flex-shrink-0 text-gray-400 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    {lieu.typeLieu === "VISIOCONFERENCE" ? (
                      <a
                        href={lieu.lieuFormation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline truncate block"
                      >
                        {lieu.lieuFormation}
                      </a>
                    ) : (
                      <>
                        <p>{lieu.lieuFormation}</p>
                        {(lieu.codePostal || lieu.ville) && (
                          <p>{lieu.codePostal} {lieu.ville}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {lieu.typeLieu !== "VISIOCONFERENCE" && lieu.capacite && (
                  <div className="flex items-center gap-2">
                    <Users size={14} className="flex-shrink-0 text-gray-400" />
                    <span>Capacité: {lieu.capacite} personnes</span>
                  </div>
                )}
                {lieu.infosPratiques && (
                  <div className="flex items-start gap-2">
                    <Info size={14} className="flex-shrink-0 text-gray-400 mt-0.5" />
                    <span className="text-xs text-gray-500 line-clamp-2">{lieu.infosPratiques}</span>
                  </div>
                )}
                {/* Score conformité Qualiopi IND 17 */}
                {lieu.typeLieu !== "VISIOCONFERENCE" && (() => {
                  const score = getConformityScore(lieu);
                  if (!score) return null;
                  return (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck size={14} className={`flex-shrink-0 ${score.percentage === 100 ? "text-green-500" : score.percentage >= 50 ? "text-amber-500" : "text-red-500"}`} />
                        <span className="text-xs font-medium">
                          Conformité: {score.checked}/{score.total} ({score.percentage}%)
                        </span>
                      </div>
                      <div className="mt-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${score.percentage === 100 ? "bg-green-500" : score.percentage >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${score.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingLieu ? "Modifier le lieu" : "Nouveau lieu"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Type de lieu */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Type de lieu *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, typeLieu: "PRESENTIEL" })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl border-2 transition-all ${
                      formData.typeLieu === "PRESENTIEL"
                        ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    <MapPin size={18} />
                    Présentiel
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, typeLieu: "VISIOCONFERENCE" })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl border-2 transition-all ${
                      formData.typeLieu === "VISIOCONFERENCE"
                        ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    <Video size={18} />
                    Visioconférence
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Nom du lieu *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder={formData.typeLieu === "VISIOCONFERENCE" ? "Ex: Salle Zoom principale" : "Ex: Salle de formation Paris 9"}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Champ Lieu de formation (adresse ou lien) */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {formData.typeLieu === "VISIOCONFERENCE" ? "Lien de connexion *" : "Lieu de formation *"}
                </label>
                <input
                  type={formData.typeLieu === "VISIOCONFERENCE" ? "url" : "text"}
                  required
                  value={formData.lieuFormation}
                  onChange={(e) => setFormData({ ...formData, lieuFormation: e.target.value })}
                  placeholder={formData.typeLieu === "VISIOCONFERENCE" ? "https://zoom.us/j/..." : "12 rue de la Formation"}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                {formData.typeLieu === "VISIOCONFERENCE" && (
                  <p className="mt-1 text-xs text-gray-500">
                    Lien Zoom, Google Meet, Teams, etc.
                  </p>
                )}
              </div>

              {/* Champs spécifiques au présentiel */}
              {formData.typeLieu === "PRESENTIEL" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Code postal
                      </label>
                      <input
                        type="text"
                        value={formData.codePostal}
                        onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Ville
                      </label>
                      <input
                        type="text"
                        value={formData.ville}
                        onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Capacité (nombre de personnes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.capacite}
                      onChange={(e) => setFormData({ ...formData, capacite: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Informations pratiques
                </label>
                <textarea
                  rows={3}
                  value={formData.infosPratiques}
                  onChange={(e) => setFormData({ ...formData, infosPratiques: e.target.value })}
                  placeholder={formData.typeLieu === "VISIOCONFERENCE" ? "Instructions de connexion, code d'accès..." : "Code porte, étage, accès PMR, parking..."}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-none"
                />
              </div>

              {/* Checklist conformité Qualiopi IND 17 - uniquement pour présentiel */}
              {formData.typeLieu === "PRESENTIEL" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <div className="flex items-center gap-2 mb-4">
                    <ClipboardCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      Qualiopi IND 17 - Checklist conformité lieu
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {/* Surface et aménagement */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Surface et aménagement</p>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.checkSurfaceAdaptee}
                          onChange={(e) => setFormData({ ...formData, checkSurfaceAdaptee: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Surface adaptée au nombre d&apos;apprenants</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.checkErpConforme}
                          onChange={(e) => setFormData({ ...formData, checkErpConforme: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Conformité ERP (Établissement Recevant du Public)</span>
                      </label>
                    </div>

                    {/* Conditions de travail */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Conditions de travail</p>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.checkVentilation}
                          onChange={(e) => setFormData({ ...formData, checkVentilation: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Ventilation/climatisation adaptée</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.checkEclairage}
                          onChange={(e) => setFormData({ ...formData, checkEclairage: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Éclairage suffisant</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.checkSanitaires}
                          onChange={(e) => setFormData({ ...formData, checkSanitaires: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Sanitaires accessibles</span>
                      </label>
                    </div>

                    {/* Accessibilité */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Accessibilité</p>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.checkAccessibiliteHandicap}
                          onChange={(e) => setFormData({ ...formData, checkAccessibiliteHandicap: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Accessibilité PMR (handicap)</span>
                      </label>
                    </div>

                    {/* Équipements techniques */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Équipements techniques</p>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.checkWifi}
                          onChange={(e) => setFormData({ ...formData, checkWifi: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">WiFi disponible</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.checkVideoprojecteur}
                          onChange={(e) => setFormData({ ...formData, checkVideoprojecteur: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Vidéoprojecteur ou écran</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.checkMobilier}
                          onChange={(e) => setFormData({ ...formData, checkMobilier: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Mobilier adapté (tables, chaises)</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.checkEquipements}
                          onChange={(e) => setFormData({ ...formData, checkEquipements: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Équipements spécifiques selon formation</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.checkFournitures}
                          onChange={(e) => setFormData({ ...formData, checkFournitures: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Fournitures pédagogiques disponibles</span>
                      </label>
                    </div>

                    {/* Notes conformité */}
                    <div className="pt-2">
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Notes sur la conformité
                      </label>
                      <textarea
                        rows={2}
                        value={formData.notesConformite}
                        onChange={(e) => setFormData({ ...formData, notesConformite: e.target.value })}
                        placeholder="Points d'attention, travaux prévus..."
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {editingLieu ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
