"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Landmark,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Mail,
  Phone,
  Loader2,
  Building,
} from "lucide-react";

type FinanceurType =
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

interface Financeur {
  id: string;
  nom: string;
  type: FinanceurType;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  notes: string | null;
}

const typeLabels: Record<FinanceurType, string> = {
  OPCO: "OPCO",
  AGEFIPH: "Agefiph",
  CAISSE_DEPOTS: "Caisse des Dépôts",
  ETAT: "État",
  FOND_ASSURANCE: "Fond d'assurance formation",
  FRANCE_TRAVAIL: "France Travail",
  INSTANCES_EUROPEENNES: "Instances Européennes",
  OPACIF: "OPACIF",
  OPCA: "OPCA",
  REGION: "Région",
  ORGANISME_PUBLIC: "Autre public",
  AUTRE: "Autre",
};

const typeColors: Record<FinanceurType, string> = {
  OPCO: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  AGEFIPH: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  CAISSE_DEPOTS: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400",
  ETAT: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  FOND_ASSURANCE: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  FRANCE_TRAVAIL: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400",
  INSTANCES_EUROPEENNES: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
  OPACIF: "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400",
  OPCA: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400",
  REGION: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  ORGANISME_PUBLIC: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  AUTRE: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400",
};

const allTypes: FinanceurType[] = [
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

export default function FinanceursPage() {
  const [financeurs, setFinanceurs] = useState<Financeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFinanceur, setEditingFinanceur] = useState<Financeur | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nom: "",
    type: "OPCO" as FinanceurType,
    email: "",
    telephone: "",
    adresse: "",
    notes: "",
  });

  const fetchFinanceurs = useCallback(async () => {
    try {
      let url = `/api/donnees/financeurs?search=${encodeURIComponent(searchQuery)}`;
      if (filterType) url += `&type=${filterType}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFinanceurs(data);
      }
    } catch (error) {
      console.error("Erreur chargement financeurs:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterType]);

  useEffect(() => {
    fetchFinanceurs();
  }, [fetchFinanceurs]);

  const resetForm = () => {
    setFormData({
      nom: "",
      type: "OPCO",
      email: "",
      telephone: "",
      adresse: "",
      notes: "",
    });
    setEditingFinanceur(null);
  };

  const openModal = (financeur?: Financeur) => {
    if (financeur) {
      setEditingFinanceur(financeur);
      setFormData({
        nom: financeur.nom,
        type: financeur.type,
        email: financeur.email || "",
        telephone: financeur.telephone || "",
        adresse: financeur.adresse || "",
        notes: financeur.notes || "",
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingFinanceur
        ? `/api/donnees/financeurs/${editingFinanceur.id}`
        : "/api/donnees/financeurs";
      const method = editingFinanceur ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        closeModal();
        fetchFinanceurs();
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
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce financeur ?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/donnees/financeurs/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchFinanceurs();
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
              <Landmark className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Financeurs
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gérez les OPCO et organismes de financement
              </p>
            </div>
          </div>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm hover:shadow-md whitespace-nowrap"
          >
            <Plus size={20} />
            Ajouter un financeur
          </button>
        </div>

        {/* Filtres */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={20} />
            </span>
            <input
              type="text"
              placeholder="Rechercher un financeur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 transition-all"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Tous les types</option>
            {allTypes.map((type) => (
              <option key={type} value={type}>
                {typeLabels[type]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : financeurs.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <Landmark className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? `Aucun financeur trouvé pour "${searchQuery}"` : "Aucun financeur enregistré"}
          </p>
          <button
            onClick={() => openModal()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
          >
            <Plus size={16} />
            Ajouter votre premier financeur
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {financeurs.map((financeur) => (
            <div
              key={financeur.id}
              className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] hover:border-brand-200 dark:hover:border-brand-800 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {financeur.nom}
                  </h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${typeColors[financeur.type]}`}>
                    {typeLabels[financeur.type]}
                  </span>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => openModal(financeur)}
                    className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors dark:hover:bg-brand-500/10"
                    title="Modifier"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(financeur.id)}
                    disabled={deleting === financeur.id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10 disabled:opacity-50"
                    title="Supprimer"
                  >
                    {deleting === financeur.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {financeur.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="flex-shrink-0 text-gray-400" />
                    <span className="truncate">{financeur.email}</span>
                  </div>
                )}
                {financeur.telephone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="flex-shrink-0 text-gray-400" />
                    <span>{financeur.telephone}</span>
                  </div>
                )}
                {financeur.adresse && (
                  <div className="flex items-center gap-2">
                    <Building size={14} className="flex-shrink-0 text-gray-400" />
                    <span className="truncate">{financeur.adresse}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingFinanceur ? "Modifier le financeur" : "Nouveau financeur"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Ex: OPCO EP, Atlas, Pôle emploi..."
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Type de financeur *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as FinanceurType })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {allTypes.map((type) => (
                    <option key={type} value={type}>
                      {typeLabels[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-none"
                />
              </div>

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
                  {editingFinanceur ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
