"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquareWarning,
  Plus,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Mail,
  Phone,
  FileText,
  MessageCircle,
  Building2,
  User,
  Calendar,
  ArrowRight,
  X,
} from "lucide-react";

// Types
interface Reclamation {
  id: string;
  dateReclamation: string;
  origine: "EMAIL" | "TELEPHONE" | "COURRIER" | "FORMULAIRE" | "AUTRE";
  categorie: "PEDAGOGIE" | "ORGANISATION" | "ADMINISTRATIF" | "TECHNIQUE" | "INTERVENANT" | "ACCESSIBILITE" | "AUTRE";
  nomPlaignant: string;
  emailPlaignant: string | null;
  telephonePlaignant: string | null;
  typePlaignant: string | null;
  objet: string;
  description: string;
  statut: "NOUVELLE" | "EN_ANALYSE" | "EN_COURS" | "RESOLUE" | "CLOTUREE";
  datePriseEnCompte: string | null;
  analyse: string | null;
  actionsCorrectives: string | null;
  retourClient: string | null;
  dateRetourClient: string | null;
  dateResolution: string | null;
  delaiTraitement: number | null;
  formation: { id: string; titre: string } | null;
  session: { id: string; reference: string; nom: string | null } | null;
  apprenant: { id: string; nom: string; prenom: string; email: string } | null;
  amelioration: { id: string; titre: string; statut: string } | null;
  createdAt: string;
}

interface Stats {
  total: number;
  parStatut: Record<string, number>;
}

const STATUT_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  NOUVELLE: { label: "Nouvelle", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: <AlertCircle size={14} /> },
  EN_ANALYSE: { label: "En analyse", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: <Clock size={14} /> },
  EN_COURS: { label: "En cours", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: <Loader2 size={14} className="animate-spin" /> },
  RESOLUE: { label: "Résolue", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle2 size={14} /> },
  CLOTUREE: { label: "Clôturée", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400", icon: <XCircle size={14} /> },
};

const ORIGINE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  EMAIL: { label: "Email", icon: <Mail size={14} /> },
  TELEPHONE: { label: "Téléphone", icon: <Phone size={14} /> },
  COURRIER: { label: "Courrier", icon: <FileText size={14} /> },
  FORMULAIRE: { label: "Formulaire", icon: <MessageCircle size={14} /> },
  AUTRE: { label: "Autre", icon: <MessageSquareWarning size={14} /> },
};

const CATEGORIE_OPTIONS = [
  { value: "PEDAGOGIE", label: "Pédagogie" },
  { value: "ORGANISATION", label: "Organisation" },
  { value: "ADMINISTRATIF", label: "Administratif" },
  { value: "TECHNIQUE", label: "Technique" },
  { value: "INTERVENANT", label: "Intervenant" },
  { value: "ACCESSIBILITE", label: "Accessibilité" },
  { value: "AUTRE", label: "Autre" },
];

export default function ReclamationsPage() {
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null);
  const [filterStatut, setFilterStatut] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);

  // Fetch reclamations
  const fetchReclamations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatut) params.set("statut", filterStatut);

      const res = await fetch(`/api/outils/reclamations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReclamations(data.reclamations || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error("Erreur fetch réclamations:", error);
    } finally {
      setLoading(false);
    }
  }, [filterStatut]);

  useEffect(() => {
    fetchReclamations();
  }, [fetchReclamations]);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Filter by search
  const filteredReclamations = reclamations.filter(r => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.objet.toLowerCase().includes(query) ||
      r.nomPlaignant.toLowerCase().includes(query) ||
      r.description.toLowerCase().includes(query)
    );
  });

  // Update status
  const updateStatut = async (id: string, newStatut: string) => {
    try {
      const res = await fetch(`/api/outils/reclamations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: newStatut }),
      });
      if (res.ok) {
        fetchReclamations();
        if (selectedReclamation?.id === id) {
          const updated = await res.json();
          setSelectedReclamation(updated);
        }
      }
    } catch (error) {
      console.error("Erreur mise à jour statut:", error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
            <MessageSquareWarning className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Réclamations
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Qualiopi IND 31 - Traitement des difficultés et réclamations
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          <Plus size={18} />
          Nouvelle réclamation
        </button>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setFilterStatut(null)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !filterStatut
                ? "bg-brand-500 text-white"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Toutes ({stats.total})
          </button>
          {Object.entries(STATUT_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilterStatut(key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filterStatut === key
                  ? "bg-brand-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {config.icon}
              {config.label} ({stats.parStatut[key] || 0})
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-gray-700">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une réclamation..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Liste des réclamations */}
        <div className={`${selectedReclamation ? "w-1/2 border-r dark:border-gray-700" : "w-full"} overflow-y-auto p-4`}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : filteredReclamations.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquareWarning className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? "Aucune réclamation trouvée" : "Aucune réclamation enregistrée"}
              </p>
              <button
                onClick={() => setShowNewForm(true)}
                className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
              >
                Ajouter une réclamation
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReclamations.map((reclamation) => {
                const statutConfig = STATUT_CONFIG[reclamation.statut];
                const origineConfig = ORIGINE_CONFIG[reclamation.origine];

                return (
                  <div
                    key={reclamation.id}
                    onClick={() => setSelectedReclamation(reclamation)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedReclamation?.id === reclamation.id
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statutConfig.color}`}>
                            {statutConfig.icon}
                            {statutConfig.label}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            {origineConfig.icon}
                            {origineConfig.label}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">
                          {reclamation.objet}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                          {reclamation.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {reclamation.nomPlaignant}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(reclamation.dateReclamation)}
                          </span>
                          {reclamation.formation && (
                            <span className="flex items-center gap-1">
                              <Building2 size={12} />
                              {reclamation.formation.titre}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Détail de la réclamation */}
        {selectedReclamation && (
          <ReclamationDetail
            reclamation={selectedReclamation}
            onClose={() => setSelectedReclamation(null)}
            onUpdateStatut={updateStatut}
            onRefresh={fetchReclamations}
          />
        )}
      </div>

      {/* Modal nouvelle réclamation */}
      {showNewForm && (
        <NewReclamationModal
          onClose={() => setShowNewForm(false)}
          onCreated={() => {
            setShowNewForm(false);
            fetchReclamations();
          }}
        />
      )}
    </div>
  );
}

// Composant Détail
function ReclamationDetail({
  reclamation,
  onClose,
  onUpdateStatut,
  onRefresh,
}: {
  reclamation: Reclamation;
  onClose: () => void;
  onUpdateStatut: (id: string, statut: string) => void;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    analyse: reclamation.analyse || "",
    actionsCorrectives: reclamation.actionsCorrectives || "",
    retourClient: reclamation.retourClient || "",
  });
  const [saving, setSaving] = useState(false);

  const statutConfig = STATUT_CONFIG[reclamation.statut];

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/outils/reclamations/${reclamation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setEditing(false);
        onRefresh();
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-1/2 overflow-y-auto bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${statutConfig.color}`}>
            {statutConfig.icon}
            {statutConfig.label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X size={20} className="text-gray-400" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Objet */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {reclamation.objet}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {reclamation.description}
          </p>
        </div>

        {/* Infos plaignant */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-3">
          <h3 className="font-medium text-gray-900 dark:text-white">Plaignant</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Nom</span>
              <p className="font-medium text-gray-900 dark:text-white">{reclamation.nomPlaignant}</p>
            </div>
            {reclamation.emailPlaignant && (
              <div>
                <span className="text-gray-500">Email</span>
                <p className="font-medium text-gray-900 dark:text-white">{reclamation.emailPlaignant}</p>
              </div>
            )}
            {reclamation.telephonePlaignant && (
              <div>
                <span className="text-gray-500">Téléphone</span>
                <p className="font-medium text-gray-900 dark:text-white">{reclamation.telephonePlaignant}</p>
              </div>
            )}
            <div>
              <span className="text-gray-500">Date réclamation</span>
              <p className="font-medium text-gray-900 dark:text-white">{formatDate(reclamation.dateReclamation)}</p>
            </div>
          </div>
        </div>

        {/* Références */}
        {(reclamation.formation || reclamation.session) && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-2">
            <h3 className="font-medium text-blue-900 dark:text-blue-300">Formation concernée</h3>
            {reclamation.formation && (
              <p className="text-sm text-blue-700 dark:text-blue-400">{reclamation.formation.titre}</p>
            )}
            {reclamation.session && (
              <p className="text-sm text-blue-700 dark:text-blue-400">Session: {reclamation.session.reference}</p>
            )}
          </div>
        )}

        {/* Workflow statut */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900 dark:text-white">Avancement du traitement</h3>
          <div className="flex items-center gap-2">
            {Object.entries(STATUT_CONFIG).map(([key, config], index) => (
              <div key={key} className="flex items-center">
                <button
                  onClick={() => onUpdateStatut(reclamation.id, key)}
                  disabled={reclamation.statut === key}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    reclamation.statut === key
                      ? config.color
                      : "bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {config.label}
                </button>
                {index < Object.keys(STATUT_CONFIG).length - 1 && (
                  <ArrowRight size={16} className="text-gray-300 mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Traitement */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-white">Traitement</h3>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-brand-500 hover:text-brand-600"
              >
                Modifier
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Analyse du problème
                </label>
                <textarea
                  value={formData.analyse}
                  onChange={(e) => setFormData({ ...formData, analyse: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Analyse de la réclamation..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Actions correctives
                </label>
                <textarea
                  value={formData.actionsCorrectives}
                  onChange={(e) => setFormData({ ...formData, actionsCorrectives: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Actions mises en place..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Retour au client
                </label>
                <textarea
                  value={formData.retourClient}
                  onChange={(e) => setFormData({ ...formData, retourClient: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Réponse apportée au client..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {reclamation.analyse && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <span className="text-xs text-gray-500 uppercase">Analyse</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{reclamation.analyse}</p>
                </div>
              )}
              {reclamation.actionsCorrectives && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <span className="text-xs text-gray-500 uppercase">Actions correctives</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{reclamation.actionsCorrectives}</p>
                </div>
              )}
              {reclamation.retourClient && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-xs text-green-600 uppercase">Retour au client</span>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">{reclamation.retourClient}</p>
                  {reclamation.dateRetourClient && (
                    <p className="text-xs text-green-500 mt-1">
                      Envoyé le {formatDate(reclamation.dateRetourClient)}
                    </p>
                  )}
                </div>
              )}
              {!reclamation.analyse && !reclamation.actionsCorrectives && !reclamation.retourClient && (
                <p className="text-sm text-gray-400 italic">Aucune information de traitement renseignée</p>
              )}
            </div>
          )}
        </div>

        {/* Délai de traitement */}
        {reclamation.delaiTraitement !== null && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <span className="text-sm text-gray-500">Délai de traitement</span>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {reclamation.delaiTraitement} jour{reclamation.delaiTraitement > 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Modal nouvelle réclamation
function NewReclamationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [formData, setFormData] = useState({
    nomPlaignant: "",
    emailPlaignant: "",
    telephonePlaignant: "",
    typePlaignant: "apprenant",
    origine: "EMAIL",
    categorie: "AUTRE",
    objet: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/outils/reclamations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        onCreated();
      }
    } catch (error) {
      console.error("Erreur création:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Nouvelle réclamation
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom du plaignant *
              </label>
              <input
                type="text"
                required
                value={formData.nomPlaignant}
                onChange={(e) => setFormData({ ...formData, nomPlaignant: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.emailPlaignant}
                onChange={(e) => setFormData({ ...formData, emailPlaignant: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.telephonePlaignant}
                onChange={(e) => setFormData({ ...formData, telephonePlaignant: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Origine
              </label>
              <select
                value={formData.origine}
                onChange={(e) => setFormData({ ...formData, origine: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="EMAIL">Email</option>
                <option value="TELEPHONE">Téléphone</option>
                <option value="COURRIER">Courrier</option>
                <option value="FORMULAIRE">Formulaire</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Catégorie
              </label>
              <select
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {CATEGORIE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Objet de la réclamation *
              </label>
              <input
                type="text"
                required
                value={formData.objet}
                onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Résumé court de la réclamation"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description détaillée *
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Décrivez en détail le problème rencontré..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? "Création..." : "Créer la réclamation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
