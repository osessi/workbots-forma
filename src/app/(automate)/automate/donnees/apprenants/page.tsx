"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Mail,
  Phone,
  Building2,
  Loader2,
  Briefcase,
  User,
  Eye,
  StickyNote,
  MessageSquarePlus,
  Clock,
  Send,
} from "lucide-react";

interface Entreprise {
  id: string;
  raisonSociale: string;
}

// Qualiopi IND 5 - Type pour les notes avec historique
interface ApprenantNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

interface Apprenant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  raisonSociale: string | null;
  siret: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  pays: string;
  statut: "SALARIE" | "INDEPENDANT" | "PARTICULIER";
  entrepriseId: string | null;
  entreprise: Entreprise | null;
  notes: string | null;
}

const statutLabels = {
  SALARIE: "Salarié",
  INDEPENDANT: "Indépendant",
  PARTICULIER: "Particulier",
};

const statutColors = {
  SALARIE: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  INDEPENDANT: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  PARTICULIER: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
};

export default function ApprenantsPage() {
  const [apprenants, setApprenants] = useState<Apprenant[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApprenant, setEditingApprenant] = useState<Apprenant | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Qualiopi IND 5 - États pour les notes avec historique
  const [notes, setNotes] = useState<ApprenantNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    raisonSociale: "",
    siret: "",
    adresse: "",
    codePostal: "",
    ville: "",
    pays: "France",
    statut: "PARTICULIER" as "SALARIE" | "INDEPENDANT" | "PARTICULIER",
    entrepriseId: "",
    notes: "",
  });

  const fetchApprenants = useCallback(async () => {
    try {
      let url = `/api/donnees/apprenants?search=${encodeURIComponent(searchQuery)}`;
      if (filterStatut) url += `&statut=${filterStatut}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setApprenants(data);
      }
    } catch (error) {
      console.error("Erreur chargement apprenants:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterStatut]);

  const fetchEntreprises = async () => {
    try {
      const res = await fetch("/api/donnees/entreprises");
      if (res.ok) {
        const data = await res.json();
        setEntreprises(data);
      }
    } catch (error) {
      console.error("Erreur chargement entreprises:", error);
    }
  };

  useEffect(() => {
    fetchApprenants();
    fetchEntreprises();
  }, [fetchApprenants]);

  const resetForm = () => {
    setFormData({
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      raisonSociale: "",
      siret: "",
      adresse: "",
      codePostal: "",
      ville: "",
      pays: "France",
      statut: "PARTICULIER",
      entrepriseId: "",
      notes: "",
    });
    setEditingApprenant(null);
    // Reset notes state
    setNotes([]);
    setNewNote("");
    setShowNoteForm(false);
  };

  // Qualiopi IND 5 - Charger les notes d'un apprenant
  const loadNotes = async (apprenantId: string) => {
    setNotesLoading(true);
    try {
      const res = await fetch(`/api/donnees/apprenants/${apprenantId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error("Erreur chargement notes:", error);
    } finally {
      setNotesLoading(false);
    }
  };

  // Qualiopi IND 5 - Ajouter une nouvelle note
  const handleAddNote = async () => {
    if (!newNote.trim() || addingNote || !editingApprenant) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/donnees/apprenants/${editingApprenant.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes((prev) => [data.note, ...prev]);
        setNewNote("");
        setShowNoteForm(false);
      }
    } catch (error) {
      console.error("Erreur ajout note:", error);
    } finally {
      setAddingNote(false);
    }
  };

  const openModal = (apprenant?: Apprenant) => {
    if (apprenant) {
      setEditingApprenant(apprenant);
      setFormData({
        nom: apprenant.nom,
        prenom: apprenant.prenom,
        email: apprenant.email,
        telephone: apprenant.telephone || "",
        raisonSociale: apprenant.raisonSociale || "",
        siret: apprenant.siret || "",
        adresse: apprenant.adresse || "",
        codePostal: apprenant.codePostal || "",
        ville: apprenant.ville || "",
        pays: apprenant.pays || "France",
        statut: apprenant.statut,
        entrepriseId: apprenant.entrepriseId || "",
        notes: apprenant.notes || "",
      });
      // Charger les notes de l'apprenant
      loadNotes(apprenant.id);
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
      const url = editingApprenant
        ? `/api/donnees/apprenants/${editingApprenant.id}`
        : "/api/donnees/apprenants";
      const method = editingApprenant ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        closeModal();
        fetchApprenants();
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
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet apprenant ?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/donnees/apprenants/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchApprenants();
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
              <Users className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Apprenants
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gérez les participants de vos formations
              </p>
            </div>
          </div>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm hover:shadow-md whitespace-nowrap"
          >
            <Plus size={20} />
            Ajouter un apprenant
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
              placeholder="Rechercher un apprenant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 transition-all"
            />
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Tous les statuts</option>
            <option value="SALARIE">Salariés</option>
            <option value="INDEPENDANT">Indépendants</option>
            <option value="PARTICULIER">Particuliers</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : apprenants.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? `Aucun apprenant trouvé pour "${searchQuery}"` : "Aucun apprenant enregistré"}
          </p>
          <button
            onClick={() => openModal()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
          >
            <Plus size={16} />
            Ajouter votre premier apprenant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apprenants.map((apprenant) => (
            <div
              key={apprenant.id}
              className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] hover:border-brand-200 dark:hover:border-brand-800 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {apprenant.prenom} {apprenant.nom}
                  </h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${statutColors[apprenant.statut]}`}>
                    {statutLabels[apprenant.statut]}
                  </span>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Link
                    href={`/automate/apprenants/${apprenant.id}`}
                    className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors dark:hover:bg-green-500/10"
                    title="Voir le dossier"
                  >
                    <Eye size={16} />
                  </Link>
                  <button
                    onClick={() => openModal(apprenant)}
                    className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors dark:hover:bg-brand-500/10"
                    title="Modifier"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(apprenant.id)}
                    disabled={deleting === apprenant.id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10 disabled:opacity-50"
                    title="Supprimer"
                  >
                    {deleting === apprenant.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="flex-shrink-0 text-gray-400" />
                  <span className="truncate">{apprenant.email}</span>
                </div>
                {apprenant.telephone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="flex-shrink-0 text-gray-400" />
                    <span>{apprenant.telephone}</span>
                  </div>
                )}
                {apprenant.entreprise && (
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="flex-shrink-0 text-gray-400" />
                    <span className="truncate">{apprenant.entreprise.raisonSociale}</span>
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingApprenant ? "Modifier l'apprenant" : "Nouvel apprenant"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
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
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
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
                </div>
              </div>

              {/* Statut */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Statut
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {(["SALARIE", "INDEPENDANT", "PARTICULIER"] as const).map((statut) => (
                    <button
                      key={statut}
                      type="button"
                      onClick={() => setFormData({ ...formData, statut, entrepriseId: statut !== "SALARIE" ? "" : formData.entrepriseId })}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                        formData.statut === statut
                          ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                          : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {statut === "SALARIE" && <Briefcase size={16} />}
                      {statut === "INDEPENDANT" && <User size={16} />}
                      {statut === "PARTICULIER" && <User size={16} />}
                      {statutLabels[statut]}
                    </button>
                  ))}
                </div>

                {/* Sélection entreprise si salarié */}
                {formData.statut === "SALARIE" && (
                  <div className="mt-4">
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Entreprise
                    </label>
                    <select
                      value={formData.entrepriseId}
                      onChange={(e) => setFormData({ ...formData, entrepriseId: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Sélectionner une entreprise</option>
                      {entreprises.map((ent) => (
                        <option key={ent.id} value={ent.id}>
                          {ent.raisonSociale}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Champs indépendant */}
                {formData.statut === "INDEPENDANT" && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Raison sociale de l'apprenant
                      </label>
                      <input
                        type="text"
                        value={formData.raisonSociale}
                        onChange={(e) => setFormData({ ...formData, raisonSociale: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Numéro SIRET
                      </label>
                      <input
                        type="text"
                        value={formData.siret}
                        onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Adresse */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Adresse
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder="Adresse"
                      value={formData.adresse}
                      onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Code postal"
                      value={formData.codePostal}
                      onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Ville"
                      value={formData.ville}
                      onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder="Pays"
                      value={formData.pays}
                      onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Qualiopi IND 5 - Notes internes avec historique */}
              {editingApprenant ? (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <StickyNote className="w-4 h-4 text-amber-500" />
                      Notes internes
                      {notes.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
                          {notes.length}
                        </span>
                      )}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowNoteForm(!showNoteForm)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                      Ajouter
                    </button>
                  </div>

                  {/* Formulaire d'ajout de note */}
                  {showNoteForm && (
                    <div className="mb-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Saisissez votre note interne..."
                        rows={2}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowNoteForm(false);
                            setNewNote("");
                          }}
                          className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={handleAddNote}
                          disabled={!newNote.trim() || addingNote}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 rounded transition-colors"
                        >
                          {addingNote ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Liste des notes */}
                  {notesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                    </div>
                  ) : notes.length > 0 ? (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800/30"
                        >
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {note.content}
                          </p>
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-yellow-200 dark:border-yellow-800/30 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(note.createdAt).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {note.createdBy && (
                              <>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <span>
                                  {note.createdBy.firstName || note.createdBy.email.split("@")[0]}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400 dark:text-gray-500">
                      <StickyNote className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      <p className="text-xs">Aucune note pour cet apprenant</p>
                      <p className="text-xs mt-0.5">Cliquez sur &quot;Ajouter&quot; pour créer une note</p>
                    </div>
                  )}

                  {/* Note héritée (ancien champ) si elle existe */}
                  {formData.notes && notes.length === 0 && (
                    <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Note héritée (ancienne version)</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {formData.notes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Champ simple pour la création */
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Notes internes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notes internes (optionnel)"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-none"
                  />
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
                  {editingApprenant ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
