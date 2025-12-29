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
} from "lucide-react";

// Types
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
  EVALUATION_SATISFACTION: { label: "Évaluation satisfaction", icon: <Star size={14} /> },
  EVALUATION_INTERVENANT: { label: "Évaluation intervenant", icon: <ClipboardCheck size={14} /> },
  VEILLE: { label: "Veille", icon: <Eye size={14} /> },
  AUDIT: { label: "Audit", icon: <FileText size={14} /> },
  INITIATIVE: { label: "Initiative interne", icon: <Lightbulb size={14} /> },
  AUTRE: { label: "Autre", icon: <BarChart3 size={14} /> },
};

const DOMAINE_OPTIONS = [
  "Pédagogie",
  "Organisation",
  "Administration",
  "Technique",
  "Communication",
  "Accessibilité",
  "Qualité",
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
              Plan d'amélioration
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
          Nouvelle action
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
            placeholder="Rechercher une action..."
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
    </div>
  );
}

// Composant Détail
function AmeliorationDetail({
  amelioration,
  onClose,
  onUpdateStatut,
  onRefresh,
}: {
  amelioration: ActionAmelioration;
  onClose: () => void;
  onUpdateStatut: (id: string, statut: string) => void;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    avancement: amelioration.avancement,
    resultat: amelioration.resultat || "",
    efficacite: amelioration.efficacite || "",
    indicateurMesure: amelioration.indicateurMesure || "",
    valeurAvant: amelioration.valeurAvant || "",
    valeurApres: amelioration.valeurApres || "",
  });
  const [saving, setSaving] = useState(false);

  const statutConfig = STATUT_CONFIG[amelioration.statut];
  const prioriteConfig = PRIORITE_CONFIG[amelioration.priorite];
  const origineConfig = ORIGINE_CONFIG[amelioration.origine];

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/outils/ameliorations/${amelioration.id}`, {
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
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X size={20} className="text-gray-400" />
        </button>
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
            <span className="text-xs text-gray-500 uppercase">Domaine</span>
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

        {/* Avancement */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-white">Avancement</h3>
            <span className="text-lg font-bold text-brand-500">{amelioration.avancement}%</span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all"
              style={{ width: `${amelioration.avancement}%` }}
            />
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
                  Avancement (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.avancement}
                  onChange={(e) => setFormData({ ...formData, avancement: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Résultat obtenu
                </label>
                <textarea
                  value={formData.resultat}
                  onChange={(e) => setFormData({ ...formData, resultat: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Description du résultat obtenu..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Évaluation de l'efficacité
                </label>
                <textarea
                  value={formData.efficacite}
                  onChange={(e) => setFormData({ ...formData, efficacite: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="L'action a-t-elle été efficace ? Comment le mesurer..."
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Indicateur
                  </label>
                  <input
                    type="text"
                    value={formData.indicateurMesure}
                    onChange={(e) => setFormData({ ...formData, indicateurMesure: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Ex: Taux satisfaction"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Avant
                  </label>
                  <input
                    type="text"
                    value={formData.valeurAvant}
                    onChange={(e) => setFormData({ ...formData, valeurAvant: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Ex: 75%"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Après
                  </label>
                  <input
                    type="text"
                    value={formData.valeurApres}
                    onChange={(e) => setFormData({ ...formData, valeurApres: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Ex: 92%"
                  />
                </div>
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
              {amelioration.resultat && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <span className="text-xs text-gray-500 uppercase">Résultat</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{amelioration.resultat}</p>
                </div>
              )}
              {amelioration.efficacite && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-xs text-green-600 uppercase">Efficacité</span>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">{amelioration.efficacite}</p>
                </div>
              )}
              {amelioration.indicateurMesure && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-xs text-blue-600 uppercase">Indicateur de mesure</span>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-blue-700 dark:text-blue-300">{amelioration.indicateurMesure}</span>
                    {amelioration.valeurAvant && (
                      <span className="text-sm text-gray-500">Avant: {amelioration.valeurAvant}</span>
                    )}
                    {amelioration.valeurApres && (
                      <span className="text-sm text-green-600 font-medium">Après: {amelioration.valeurApres}</span>
                    )}
                  </div>
                </div>
              )}
              {!amelioration.resultat && !amelioration.efficacite && (
                <p className="text-sm text-gray-400 italic">Aucune information de résultat renseignée</p>
              )}
            </div>
          )}
        </div>
      </div>
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
            Nouvelle action d'amélioration
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
                onChange={(e) => setFormData({ ...formData, origine: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, priorite: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {Object.entries(PRIORITE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Domaine
              </label>
              <select
                value={formData.domaine}
                onChange={(e) => setFormData({ ...formData, domaine: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Sélectionner...</option>
                {DOMAINE_OPTIONS.map(domaine => (
                  <option key={domaine} value={domaine}>{domaine}</option>
                ))}
              </select>
            </div>

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
