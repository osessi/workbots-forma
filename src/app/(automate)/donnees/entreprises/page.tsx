"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Users,
  Mail,
  Phone,
  MapPin,
  Loader2,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface Apprenant {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
}

interface Entreprise {
  id: string;
  raisonSociale: string;
  siret: string | null;
  tvaIntracom: string | null;
  contactCivilite: string | null;
  contactNom: string | null;
  contactPrenom: string | null;
  contactFonction: string | null;
  contactEmail: string | null;
  contactTelephone: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  pays: string;
  notes: string | null;
  _count?: {
    apprenants: number;
  };
  apprenants?: Apprenant[];
}

export default function EntreprisesPage() {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntreprise, setEditingEntreprise] = useState<Entreprise | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // État pour le modal des apprenants
  const [showApprenantsModal, setShowApprenantsModal] = useState(false);
  const [selectedEntreprise, setSelectedEntreprise] = useState<Entreprise | null>(null);
  const [apprenantsLoading, setApprenantsLoading] = useState(false);
  const [apprenantsList, setApprenantsList] = useState<Apprenant[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    raisonSociale: "",
    siret: "",
    tvaIntracom: "",
    contactCivilite: "",
    contactNom: "",
    contactPrenom: "",
    contactFonction: "",
    contactEmail: "",
    contactTelephone: "",
    adresse: "",
    codePostal: "",
    ville: "",
    pays: "France",
    notes: "",
  });

  const fetchEntreprises = useCallback(async () => {
    try {
      const res = await fetch(`/api/donnees/entreprises?search=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setEntreprises(data);
      }
    } catch (error) {
      console.error("Erreur chargement entreprises:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchEntreprises();
  }, [fetchEntreprises]);

  const resetForm = () => {
    setFormData({
      raisonSociale: "",
      siret: "",
      tvaIntracom: "",
      contactCivilite: "",
      contactNom: "",
      contactPrenom: "",
      contactFonction: "",
      contactEmail: "",
      contactTelephone: "",
      adresse: "",
      codePostal: "",
      ville: "",
      pays: "France",
      notes: "",
    });
    setEditingEntreprise(null);
  };

  const openModal = (entreprise?: Entreprise) => {
    if (entreprise) {
      setEditingEntreprise(entreprise);
      setFormData({
        raisonSociale: entreprise.raisonSociale,
        siret: entreprise.siret || "",
        tvaIntracom: entreprise.tvaIntracom || "",
        contactCivilite: entreprise.contactCivilite || "",
        contactNom: entreprise.contactNom || "",
        contactPrenom: entreprise.contactPrenom || "",
        contactFonction: entreprise.contactFonction || "",
        contactEmail: entreprise.contactEmail || "",
        contactTelephone: entreprise.contactTelephone || "",
        adresse: entreprise.adresse || "",
        codePostal: entreprise.codePostal || "",
        ville: entreprise.ville || "",
        pays: entreprise.pays || "France",
        notes: entreprise.notes || "",
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
      const url = editingEntreprise
        ? `/api/donnees/entreprises/${editingEntreprise.id}`
        : "/api/donnees/entreprises";
      const method = editingEntreprise ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        closeModal();
        fetchEntreprises();
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
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette entreprise ?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/donnees/entreprises/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchEntreprises();
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

  // Ouvrir le modal des apprenants rattachés
  const openApprenantsModal = async (entreprise: Entreprise) => {
    setSelectedEntreprise(entreprise);
    setShowApprenantsModal(true);
    setApprenantsLoading(true);

    try {
      const res = await fetch(`/api/donnees/entreprises/${entreprise.id}/apprenants`);
      if (res.ok) {
        const data = await res.json();
        setApprenantsList(data.apprenants || []);
      }
    } catch (error) {
      console.error("Erreur chargement apprenants:", error);
    } finally {
      setApprenantsLoading(false);
    }
  };

  const closeApprenantsModal = () => {
    setShowApprenantsModal(false);
    setSelectedEntreprise(null);
    setApprenantsList([]);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-500/10">
              <Building2 className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Entreprises
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gérez les entreprises clientes de votre organisme
              </p>
            </div>
          </div>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm hover:shadow-md whitespace-nowrap"
          >
            <Plus size={20} />
            Ajouter une entreprise
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
              placeholder="Rechercher une entreprise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Liste des entreprises */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : entreprises.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <Building2 className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? `Aucune entreprise trouvée pour "${searchQuery}"` : "Aucune entreprise enregistrée"}
          </p>
          <button
            onClick={() => openModal()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
          >
            <Plus size={16} />
            Ajouter votre première entreprise
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entreprises.map((entreprise) => (
            <div
              key={entreprise.id}
              className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] hover:border-brand-200 dark:hover:border-brand-800 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  {/* Correction 396: Lien vers la fiche entreprise */}
                  <Link
                    href={`/donnees/entreprises/${entreprise.id}`}
                    className="font-semibold text-gray-900 dark:text-white truncate block hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    {entreprise.raisonSociale}
                  </Link>
                  {entreprise.siret && (
                    <p className="text-xs text-gray-400 mt-0.5">SIRET: {entreprise.siret}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Link
                    href={`/donnees/entreprises/${entreprise.id}`}
                    className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors dark:hover:bg-brand-500/10"
                    title="Voir la fiche"
                  >
                    <ExternalLink size={16} />
                  </Link>
                  <button
                    onClick={() => openModal(entreprise)}
                    className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors dark:hover:bg-brand-500/10"
                    title="Modifier"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(entreprise.id)}
                    disabled={deleting === entreprise.id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10 disabled:opacity-50"
                    title="Supprimer"
                  >
                    {deleting === entreprise.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {(entreprise.contactNom || entreprise.contactPrenom) && (
                  <div className="flex items-center gap-2">
                    <Users size={14} className="flex-shrink-0 text-gray-400" />
                    <span className="truncate">
                      {entreprise.contactPrenom} {entreprise.contactNom}
                    </span>
                  </div>
                )}
                {entreprise.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="flex-shrink-0 text-gray-400" />
                    <span className="truncate">{entreprise.contactEmail}</span>
                  </div>
                )}
                {entreprise.contactTelephone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="flex-shrink-0 text-gray-400" />
                    <span>{entreprise.contactTelephone}</span>
                  </div>
                )}
                {entreprise.ville && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="flex-shrink-0 text-gray-400" />
                    <span className="truncate">
                      {entreprise.codePostal} {entreprise.ville}
                    </span>
                  </div>
                )}
              </div>

              {entreprise._count && entreprise._count.apprenants > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => openApprenantsModal(entreprise)}
                    className="group flex items-center gap-1 text-xs text-brand-500 font-medium hover:text-brand-600 transition-colors"
                  >
                    <Users size={12} />
                    {entreprise._count.apprenants} apprenant{entreprise._count.apprenants > 1 ? "s" : ""} rattaché{entreprise._count.apprenants > 1 ? "s" : ""}
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              )}
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
                {editingEntreprise ? "Modifier l'entreprise" : "Nouvelle entreprise"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Informations principales */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Informations principales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Raison sociale *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.raisonSociale}
                      onChange={(e) => setFormData({ ...formData, raisonSociale: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      SIRET *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.siret}
                      onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      TVA Intracommunautaire *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.tvaIntracom}
                      onChange={(e) => setFormData({ ...formData, tvaIntracom: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Interlocuteur principal */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Interlocuteur principal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Civilité *
                    </label>
                    <select
                      required
                      value={formData.contactCivilite}
                      onChange={(e) => setFormData({ ...formData, contactCivilite: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Sélectionner</option>
                      <option value="M.">M.</option>
                      <option value="Mme">Mme</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Fonction *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Gérant, PDG, DRH..."
                      value={formData.contactFonction}
                      onChange={(e) => setFormData({ ...formData, contactFonction: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.contactPrenom}
                      onChange={(e) => setFormData({ ...formData, contactPrenom: e.target.value })}
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
                      value={formData.contactNom}
                      onChange={(e) => setFormData({ ...formData, contactNom: e.target.value })}
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
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
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
                      value={formData.contactTelephone}
                      onChange={(e) => setFormData({ ...formData, contactTelephone: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Adresse de l'entreprise */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Adresse de l'entreprise
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Adresse *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.adresse}
                      onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Code postal *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.codePostal}
                      onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Ville *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.ville}
                      onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Pays *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.pays}
                      onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
                  {editingEntreprise ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Apprenants rattachés */}
      {showApprenantsModal && selectedEntreprise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Apprenants rattachés
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {selectedEntreprise.raisonSociale}
                </p>
              </div>
              <button
                onClick={closeApprenantsModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[60vh]">
              {apprenantsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                </div>
              ) : apprenantsList.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <Users className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun apprenant rattaché à cette entreprise
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {apprenantsList.map((apprenant) => (
                    <div
                      key={apprenant.id}
                      className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                            <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                              {apprenant.prenom?.[0]}{apprenant.nom?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {apprenant.prenom} {apprenant.nom}
                            </p>
                            {apprenant.email && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {apprenant.email}
                              </p>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/donnees/apprenants?id=${apprenant.id}`}
                          className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors dark:hover:bg-brand-500/10"
                          title="Voir la fiche"
                        >
                          <ExternalLink size={16} />
                        </Link>
                      </div>
                      {apprenant.telephone && (
                        <p className="mt-1 ml-13 text-sm text-gray-400 flex items-center gap-1">
                          <Phone size={12} />
                          {apprenant.telephone}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <Link
                href={`/donnees/apprenants?entreprise=${selectedEntreprise.id}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-brand-600 hover:text-brand-700 bg-white dark:bg-gray-800 border border-brand-200 dark:border-brand-800 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
              >
                Voir tous les apprenants
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
