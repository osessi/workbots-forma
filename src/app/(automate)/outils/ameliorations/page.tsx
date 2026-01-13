"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Plus,
  Search,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pause,
  XCircle,
  Loader2,
  Target,
  Calendar,
  User,
  Flag,
  ArrowRight,
  X,
  MessageSquareWarning,
  Star,
  BarChart3,
  Lightbulb,
  FileText,
  Eye,
  ClipboardCheck,
  Pencil,
  Trash2,
  Upload,
  Image,
  File,
} from "lucide-react";

// Types
interface PieceJointe {
  id: string;
  filename: string;
  url: string;
  type: string;
  uploadedAt: string;
}

interface ActionAmelioration {
  id: string;
  origine: "RECLAMATION" | "EVALUATION_SATISFACTION" | "EVALUATION_INTERVENANT" | "VEILLE" | "AUDIT" | "INITIATIVE" | "AUTRE";
  origineDetails: string | null;
  titre: string;
  description: string;
  domaine: string | null;
  priorite: "BASSE" | "MOYENNE" | "HAUTE" | "CRITIQUE";
  responsableId: string | null;
  responsableNom: string | null;
  dateCreation: string;
  echeance: string | null;
  dateDebut: string | null;
  dateRealisation: string | null;
  statut: "A_FAIRE" | "EN_COURS" | "TERMINEE" | "ANNULEE" | "EN_ATTENTE";
  avancement: number;
  resultat: string | null;
  efficacite: string | null;
  indicateurMesure: string | null;
  valeurAvant: string | null;
  valeurApres: string | null;
  formation: { id: string; titre: string } | null;
  reclamations: { id: string; objet: string; statut: string }[];
  piecesJointes: PieceJointe[] | null;
  createdAt: string;
}

interface Stats {
  total: number;
  parStatut: Record<string, number>;
  parOrigine: Record<string, number>;
  parPriorite: Record<string, number>;
}

const STATUT_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  A_FAIRE: { label: "A faire", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400", icon: <Target size={14} /> },
  EN_COURS: { label: "En cours", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: <Loader2 size={14} className="animate-spin" /> },
  EN_ATTENTE: { label: "En attente", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: <Pause size={14} /> },
  TERMINEE: { label: "Terminée", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle2 size={14} /> },
  ANNULEE: { label: "Annulée", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: <XCircle size={14} /> },
};

const PRIORITE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  BASSE: { label: "Basse", color: "text-gray-500", icon: <Flag size={14} /> },
  MOYENNE: { label: "Moyenne", color: "text-blue-500", icon: <Flag size={14} /> },
  HAUTE: { label: "Haute", color: "text-orange-500", icon: <Flag size={14} fill="currentColor" /> },
  CRITIQUE: { label: "Critique", color: "text-red-500", icon: <AlertCircle size={14} fill="currentColor" /> },
};

const ORIGINE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  RECLAMATION: { label: "Réclamation", icon: <MessageSquareWarning size={14} /> },
  RETOUR_APPRENANT: { label: "Retour apprenant", icon: <Star size={14} /> },
  RETOUR_ENTREPRISE: { label: "Retour entreprise", icon: <Star size={14} /> },
  RETOUR_FINANCEUR: { label: "Retour financeur", icon: <Star size={14} /> },
  RETOUR_INTERVENANT: { label: "Retour intervenant", icon: <ClipboardCheck size={14} /> },
  EVALUATION_SATISFACTION: { label: "Évaluation satisfaction", icon: <Star size={14} /> },
  EVALUATION_INTERVENANT: { label: "Évaluation formateur", icon: <ClipboardCheck size={14} /> },
  VEILLE: { label: "Veille réglementaire", icon: <Eye size={14} /> },
  AUDIT: { label: "Audit interne", icon: <FileText size={14} /> },
  AUDIT_EXTERNE: { label: "Audit externe", icon: <FileText size={14} /> },
  INITIATIVE: { label: "Initiative interne", icon: <Lightbulb size={14} /> },
  ANALYSE_INDICATEURS: { label: "Analyse indicateurs", icon: <BarChart3 size={14} /> },
  AUTRE: { label: "Autre", icon: <BarChart3 size={14} /> },
};

const CATEGORIE_OPTIONS = [
  "Pédagogie",
  "Organisation",
  "Administration",
  "Accueil / Accompagnement",
  "Ressources techniques",
  "Communication",
  "Évaluation",
  "Accessibilité / Handicap",
  "Conformité",
  "Autre",
];

export default function AmeliorationsPage() {
  const [ameliorations, setAmeliorations] = useState<ActionAmelioration[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAmelioration, setSelectedAmelioration] = useState<ActionAmelioration | null>(null);
  const [filterStatut, setFilterStatut] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingAmelioration, setEditingAmelioration] = useState<ActionAmelioration | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch ameliorations
  const fetchAmeliorations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatut) params.set("statut", filterStatut);

      const res = await fetch(`/api/outils/ameliorations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAmeliorations(data.ameliorations || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error("Erreur fetch améliorations:", error);
    } finally {
      setLoading(false);
    }
  }, [filterStatut]);

  useEffect(() => {
    fetchAmeliorations();
  }, [fetchAmeliorations]);

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
  const filteredAmeliorations = ameliorations.filter(a => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      a.titre.toLowerCase().includes(query) ||
      a.description.toLowerCase().includes(query)
    );
  });

  // Update status
  const updateStatut = async (id: string, newStatut: string) => {
    try {
      const res = await fetch(`/api/outils/ameliorations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: newStatut }),
      });
      if (res.ok) {
        fetchAmeliorations();
        if (selectedAmelioration?.id === id) {
          const updated = await res.json();
          setSelectedAmelioration(updated);
        }
      }
    } catch (error) {
      console.error("Erreur mise à jour statut:", error);
    }
  };

  // Delete amelioration
  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/outils/ameliorations/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSelectedAmelioration(null);
        fetchAmeliorations();
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  // Edit amelioration
  const handleEdit = (amelioration: ActionAmelioration) => {
    setEditingAmelioration(amelioration);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Améliorations
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Qualiopi IND 32 - Mesures d'amélioration continue
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          <Plus size={18} />
          Nouvelle amélioration
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
            placeholder="Rechercher une amélioration..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Liste des améliorations */}
        <div className={`${selectedAmelioration ? "w-1/2 border-r dark:border-gray-700" : "w-full"} overflow-y-auto p-4`}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : filteredAmeliorations.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? "Aucune action trouvée" : "Aucune action d'amélioration enregistrée"}
              </p>
              <button
                onClick={() => setShowNewForm(true)}
                className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
              >
                Ajouter une action
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAmeliorations.map((amelioration) => {
                const statutConfig = STATUT_CONFIG[amelioration.statut];
                const prioriteConfig = PRIORITE_CONFIG[amelioration.priorite];
                const origineConfig = ORIGINE_CONFIG[amelioration.origine];

                return (
                  <div
                    key={amelioration.id}
                    onClick={() => setSelectedAmelioration(amelioration)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedAmelioration?.id === amelioration.id
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
                          <span className={`inline-flex items-center gap-1 text-xs ${prioriteConfig.color}`}>
                            {prioriteConfig.icon}
                            {prioriteConfig.label}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">
                          {amelioration.titre}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                          {amelioration.description}
                        </p>

                        {/* Progress bar */}
                        {amelioration.statut === "EN_COURS" && (
                          <div className="mb-2">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>Avancement</span>
                              <span>{amelioration.avancement}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand-500 rounded-full transition-all"
                                style={{ width: `${amelioration.avancement}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            {origineConfig.icon}
                            {origineConfig.label}
                          </span>
                          {amelioration.echeance && (
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              Échéance: {formatDate(amelioration.echeance)}
                            </span>
                          )}
                          {amelioration.domaine && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                              {amelioration.domaine}
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

        {/* Détail de l'amélioration */}
        {selectedAmelioration && (
          <AmeliorationDetail
            amelioration={selectedAmelioration}
            onClose={() => setSelectedAmelioration(null)}
            onUpdateStatut={updateStatut}
            onRefresh={fetchAmeliorations}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onUpdateSelected={setSelectedAmelioration}
          />
        )}
      </div>

      {/* Modal nouvelle amélioration */}
      {showNewForm && (
        <NewAmeliorationModal
          onClose={() => setShowNewForm(false)}
          onCreated={() => {
            setShowNewForm(false);
            fetchAmeliorations();
          }}
        />
      )}

      {/* Modal modification amélioration */}
      {editingAmelioration && (
        <EditAmeliorationModal
          amelioration={editingAmelioration}
          onClose={() => setEditingAmelioration(null)}
          onUpdated={() => {
            setEditingAmelioration(null);
            fetchAmeliorations();
            // Rafraîchir l'amélioration sélectionnée si c'est la même
            if (selectedAmelioration?.id === editingAmelioration.id) {
              fetch(`/api/outils/ameliorations/${editingAmelioration.id}`)
                .then(res => res.json())
                .then(data => setSelectedAmelioration(data))
                .catch(console.error);
            }
          }}
        />
      )}
    </div>
  );
}

// Composant Détail
function AmeliorationDetail({
  amelioration,
  onClose,
  onUpdateStatut,
  onRefresh,
  onDelete,
  onEdit,
  onUpdateSelected,
}: {
  amelioration: ActionAmelioration;
  onClose: () => void;
  onUpdateStatut: (id: string, statut: string) => void;
  onRefresh: () => void;
  onDelete: (id: string) => void;
  onEdit: (amelioration: ActionAmelioration) => void;
  onUpdateSelected: (updated: ActionAmelioration) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    resultat: amelioration.resultat || "",
    efficacite: amelioration.efficacite || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPreuve, setUploadingPreuve] = useState(false);
  const [deletingPreuveId, setDeletingPreuveId] = useState<string | null>(null);
  // Correction 429: État pour prévisualisation des fichiers
  const [previewFile, setPreviewFile] = useState<PieceJointe | null>(null);

  // Réinitialiser formData quand l'amélioration change
  useEffect(() => {
    setFormData({
      resultat: amelioration.resultat || "",
      efficacite: amelioration.efficacite || "",
    });
    setEditing(false);
  }, [amelioration.id, amelioration.resultat, amelioration.efficacite]);

  const statutConfig = STATUT_CONFIG[amelioration.statut];
  const prioriteConfig = PRIORITE_CONFIG[amelioration.priorite];
  const origineConfig = ORIGINE_CONFIG[amelioration.origine];

  // Upload d'une preuve - Correction 428: Mise à jour temps réel
  const handleUploadPreuve = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPreuve(true);
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const res = await fetch(`/api/outils/ameliorations/${amelioration.id}/preuves`, {
        method: "POST",
        body: uploadFormData,
      });

      if (res.ok) {
        // Correction 428: Récupérer l'amélioration mise à jour et l'afficher immédiatement
        const updatedRes = await fetch(`/api/outils/ameliorations/${amelioration.id}`);
        if (updatedRes.ok) {
          const updatedAmelioration = await updatedRes.json();
          onUpdateSelected(updatedAmelioration);
        }
        onRefresh();
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de l'upload");
      }
    } catch (error) {
      console.error("Erreur upload preuve:", error);
      alert("Erreur lors de l'upload");
    } finally {
      setUploadingPreuve(false);
      e.target.value = "";
    }
  };

  // Supprimer une preuve
  const handleDeletePreuve = async (pieceId: string) => {
    if (!confirm("Supprimer cette pièce jointe ?")) return;

    try {
      setDeletingPreuveId(pieceId);
      const res = await fetch(`/api/outils/ameliorations/${amelioration.id}/preuves?pieceId=${pieceId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onRefresh();
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur suppression preuve:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setDeletingPreuveId(null);
    }
  };

  // Correction 427: Mise à jour temps réel après enregistrement
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/outils/ameliorations/${amelioration.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const updatedAmelioration = await res.json();
        setEditing(false);
        // Correction 427: Mettre à jour en temps réel sans refresh
        onUpdateSelected(updatedAmelioration);
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
          <span className={`inline-flex items-center gap-1 text-sm ${prioriteConfig.color}`}>
            {prioriteConfig.icon}
            Priorité {prioriteConfig.label.toLowerCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(amelioration)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Modifier l'amélioration"
          >
            <Pencil size={18} className="text-gray-500" />
          </button>
          <button
            onClick={() => {
              if (confirm("Êtes-vous sûr de vouloir supprimer cette amélioration ?")) {
                onDelete(amelioration.id);
              }
            }}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            title="Supprimer l'amélioration"
          >
            <Trash2 size={18} className="text-red-500" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Titre et description */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {amelioration.titre}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {amelioration.description}
          </p>
        </div>

        {/* Infos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <span className="text-xs text-gray-500 uppercase">Origine</span>
            <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2 mt-1">
              {origineConfig.icon}
              {origineConfig.label}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <span className="text-xs text-gray-500 uppercase">Catégorie</span>
            <p className="font-medium text-gray-900 dark:text-white mt-1">
              {amelioration.domaine || "Non spécifié"}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <span className="text-xs text-gray-500 uppercase">Créée le</span>
            <p className="font-medium text-gray-900 dark:text-white mt-1">
              {formatDate(amelioration.dateCreation)}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <span className="text-xs text-gray-500 uppercase">Échéance</span>
            <p className="font-medium text-gray-900 dark:text-white mt-1">
              {amelioration.echeance ? formatDate(amelioration.echeance) : "Non définie"}
            </p>
          </div>
        </div>

        {/* Réclamations liées */}
        {amelioration.reclamations.length > 0 && (
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl space-y-2">
            <h3 className="font-medium text-orange-900 dark:text-orange-300 flex items-center gap-2">
              <MessageSquareWarning size={16} />
              Réclamations liées ({amelioration.reclamations.length})
            </h3>
            <div className="space-y-2">
              {amelioration.reclamations.map(rec => (
                <div key={rec.id} className="text-sm text-orange-700 dark:text-orange-400">
                  • {rec.objet}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workflow statut */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900 dark:text-white">Statut de l'action</h3>
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(STATUT_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => onUpdateStatut(amelioration.id, key)}
                disabled={amelioration.statut === key}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  amelioration.statut === key
                    ? config.color
                    : "bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Résultats et efficacité */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-white">Résultats & Efficacité</h3>
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
                  Action(s) d'amélioration mise(s) en place
                </label>
                <textarea
                  value={formData.resultat}
                  onChange={(e) => setFormData({ ...formData, resultat: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Ex. : Règlement intérieur complété, procédure mise à jour…"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Résultat constaté
                </label>
                <textarea
                  value={formData.efficacite}
                  onChange={(e) => setFormData({ ...formData, efficacite: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Ex. : Problème résolu, document conforme…"
                />
              </div>

              {/* Correction 426: Boutons Enregistrer/Annuler repositionnés au-dessus de Preuves */}
              <div className="flex gap-2 pt-2">
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

              {/* Section Preuves intégrée */}
              <div className="space-y-3 pt-2 border-t dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Preuves
                  </label>
                  <label className="flex items-center gap-2 px-3 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 cursor-pointer text-sm transition-colors">
                    {uploadingPreuve ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Upload size={16} />
                    )}
                    Ajouter
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleUploadPreuve}
                      disabled={uploadingPreuve}
                      className="hidden"
                    />
                  </label>
                </div>

                {amelioration.piecesJointes && amelioration.piecesJointes.length > 0 ? (
                  <div className="space-y-2">
                    {amelioration.piecesJointes.map((piece) => (
                      <div
                        key={piece.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {piece.type.startsWith("image/") ? (
                            <Image size={20} className="text-blue-500 flex-shrink-0" />
                          ) : (
                            <File size={20} className="text-red-500 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {piece.filename}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(piece.uploadedAt).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Correction 429: Bouton pour prévisualiser les fichiers */}
                          <button
                            onClick={() => setPreviewFile(piece)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <Eye size={16} className="text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDeletePreuve(piece.id)}
                            disabled={deletingPreuveId === piece.id}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                            title="Supprimer"
                          >
                            {deletingPreuveId === piece.id ? (
                              <Loader2 size={16} className="animate-spin text-red-500" />
                            ) : (
                              <Trash2 size={16} className="text-red-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <File size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-400">Aucune pièce jointe</p>
                    <p className="text-xs text-gray-400 mt-1">PDF et images acceptés (max 10 MB)</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {amelioration.resultat && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <span className="text-xs text-gray-500 uppercase">Action(s) mise(s) en place</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{amelioration.resultat}</p>
                </div>
              )}
              {amelioration.efficacite && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-xs text-green-600 uppercase">Résultat constaté</span>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">{amelioration.efficacite}</p>
                </div>
              )}

              {/* Section Preuves en lecture */}
              <div className="space-y-2 pt-2 border-t dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 uppercase">Preuves</span>
                  <label className="flex items-center gap-2 px-3 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 cursor-pointer text-sm transition-colors">
                    {uploadingPreuve ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Upload size={16} />
                    )}
                    Ajouter
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleUploadPreuve}
                      disabled={uploadingPreuve}
                      className="hidden"
                    />
                  </label>
                </div>

                {amelioration.piecesJointes && amelioration.piecesJointes.length > 0 ? (
                  <div className="space-y-2">
                    {amelioration.piecesJointes.map((piece) => (
                      <div
                        key={piece.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {piece.type.startsWith("image/") ? (
                            <Image size={20} className="text-blue-500 flex-shrink-0" />
                          ) : (
                            <File size={20} className="text-red-500 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {piece.filename}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(piece.uploadedAt).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Correction 429: Bouton pour prévisualiser les fichiers */}
                          <button
                            onClick={() => setPreviewFile(piece)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <Eye size={16} className="text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDeletePreuve(piece.id)}
                            disabled={deletingPreuveId === piece.id}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                            title="Supprimer"
                          >
                            {deletingPreuveId === piece.id ? (
                              <Loader2 size={16} className="animate-spin text-red-500" />
                            ) : (
                              <Trash2 size={16} className="text-red-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <File size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-400">Aucune pièce jointe</p>
                    <p className="text-xs text-gray-400 mt-1">PDF et images acceptés (max 10 MB)</p>
                  </div>
                )}
              </div>

              {!amelioration.resultat && !amelioration.efficacite && (
                <p className="text-sm text-gray-400 italic">Aucune information de résultat renseignée</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Correction 429: Modal de prévisualisation des fichiers */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {previewFile.filename}
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.url}
                  download={previewFile.filename}
                  className="px-3 py-1.5 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                >
                  Télécharger
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900">
              {previewFile.type.startsWith("image/") ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.filename}
                  className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                />
              ) : previewFile.type === "application/pdf" ? (
                <iframe
                  src={`${previewFile.url}#toolbar=1&navpanes=0`}
                  className="w-full h-[70vh] rounded-lg border-0"
                  title={previewFile.filename}
                />
              ) : (
                <div className="text-center py-12">
                  <File size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Aperçu non disponible pour ce type de fichier
                  </p>
                  <a
                    href={previewFile.url}
                    download={previewFile.filename}
                    className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                  >
                    Télécharger le fichier
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal nouvelle amélioration
function NewAmeliorationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    origine: "INITIATIVE",
    origineDetails: "",
    domaine: "",
    priorite: "MOYENNE",
    echeance: "",
    responsableNom: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/outils/ameliorations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          echeance: formData.echeance || null,
        }),
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
            Nouvelle amélioration
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre de l'action *
            </label>
            <input
              type="text"
              required
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Ex: Améliorer le process d'accueil des stagiaires"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description détaillée *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Décrivez en détail l'amélioration à apporter..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Origine
              </label>
              <select
                value={formData.origine}
                onChange={(e) => setFormData({ ...formData, origine: e.target.value as ActionAmelioration["origine"] })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {Object.entries(ORIGINE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priorité
              </label>
              <select
                value={formData.priorite}
                onChange={(e) => setFormData({ ...formData, priorite: e.target.value as ActionAmelioration["priorite"] })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {Object.entries(PRIORITE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Catégorie
              </label>
              <select
                value={formData.domaine}
                onChange={(e) => setFormData({ ...formData, domaine: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Sélectionner...</option>
                {CATEGORIE_OPTIONS.map(categorie => (
                  <option key={categorie} value={categorie}>{categorie}</option>
                ))}
              </select>
            </div>

            {/* Correction 425: Champ Échéance en date complète */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Échéance
              </label>
              <input
                type="date"
                value={formData.echeance}
                onChange={(e) => setFormData({ ...formData, echeance: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Responsable
            </label>
            <input
              type="text"
              value={formData.responsableNom}
              onChange={(e) => setFormData({ ...formData, responsableNom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Nom du responsable de l'action"
            />
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
              {saving ? "Création..." : "Créer l'action"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal modification amélioration
function EditAmeliorationModal({
  amelioration,
  onClose,
  onUpdated,
}: {
  amelioration: ActionAmelioration;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [formData, setFormData] = useState({
    titre: amelioration.titre,
    description: amelioration.description,
    origine: amelioration.origine,
    domaine: amelioration.domaine || "",
    priorite: amelioration.priorite,
    echeance: amelioration.echeance ? amelioration.echeance.split("T")[0] : "",
    responsableNom: amelioration.responsableNom || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch(`/api/outils/ameliorations/${amelioration.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          echeance: formData.echeance || null,
        }),
      });
      if (res.ok) {
        onUpdated();
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      alert("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Modifier l'amélioration
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre de l'action *
            </label>
            <input
              type="text"
              required
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description détaillée *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Origine
              </label>
              <select
                value={formData.origine}
                onChange={(e) => setFormData({ ...formData, origine: e.target.value as ActionAmelioration["origine"] })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {Object.entries(ORIGINE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priorité
              </label>
              <select
                value={formData.priorite}
                onChange={(e) => setFormData({ ...formData, priorite: e.target.value as ActionAmelioration["priorite"] })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {Object.entries(PRIORITE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Catégorie
              </label>
              <select
                value={formData.domaine}
                onChange={(e) => setFormData({ ...formData, domaine: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Sélectionner...</option>
                {CATEGORIE_OPTIONS.map(categorie => (
                  <option key={categorie} value={categorie}>{categorie}</option>
                ))}
              </select>
            </div>

            {/* Correction 425: Champ Échéance en date complète */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Échéance
              </label>
              <input
                type="date"
                value={formData.echeance}
                onChange={(e) => setFormData({ ...formData, echeance: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Responsable
            </label>
            <input
              type="text"
              value={formData.responsableNom}
              onChange={(e) => setFormData({ ...formData, responsableNom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Nom du responsable de l'action"
            />
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
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
