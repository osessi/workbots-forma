"use client";

// ===========================================
// PAGE ADMIN - PRÉ-INSCRIPTIONS
// ===========================================
// Qualiopi Indicateur 1 : Gestion des demandes de pré-inscription

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Search,
  Eye,
  Trash2,
  X,
  Mail,
  Phone,
  Building2,
  Loader2,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Filter,
  UserPlus,
  FileText,
  Accessibility,
  ExternalLink,
} from "lucide-react";

// Types
interface Formation {
  id: string;
  titre: string;
}

interface Apprenant {
  id: string;
  nom: string;
  prenom: string;
}

interface PreInscription {
  id: string;
  // Identité
  civilite: string | null;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  dateNaissance: string | null;
  lieuNaissance: string | null;
  // Adresse
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  pays: string | null;
  // Situation
  situationProfessionnelle: string | null;
  entreprise: string | null;
  poste: string | null;
  siret: string | null;
  // Handicap
  situationHandicap: boolean;
  besoinsAmenagements: string | null;
  // Financement
  modeFinancement: string | null;
  financeurNom: string | null;
  commentaireFinancement: string | null;
  // Analyse du besoin
  objectifsProfessionnels: string | null;
  contexte: string | null;
  experiencePrealable: string | null;
  attentesSpecifiques: string | null;
  contraintes: string | null;
  // Gestion
  statut: "NOUVELLE" | "EN_TRAITEMENT" | "ACCEPTEE" | "REFUSEE" | "ANNULEE";
  noteInterne: string | null;
  motifRefus: string | null;
  // Relations
  formation: Formation;
  apprenant: Apprenant | null;
  apprenantId: string | null;
  // Metadata
  createdAt: string;
  traiteeAt: string | null;
}

interface Stats {
  NOUVELLE: number;
  EN_TRAITEMENT: number;
  ACCEPTEE: number;
  REFUSEE: number;
  ANNULEE: number;
}

const statutConfig = {
  NOUVELLE: {
    label: "Nouvelle",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
    icon: Clock,
  },
  EN_TRAITEMENT: {
    label: "En traitement",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
    icon: Loader2,
  },
  ACCEPTEE: {
    label: "Acceptée",
    color: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
    icon: CheckCircle2,
  },
  REFUSEE: {
    label: "Refusée",
    color: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
    icon: XCircle,
  },
  ANNULEE: {
    label: "Annulée",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400",
    icon: X,
  },
};

const situationLabels: Record<string, string> = {
  SALARIE: "Salarié(e)",
  INDEPENDANT: "Indépendant(e)",
  DEMANDEUR_EMPLOI: "Demandeur d'emploi",
  ETUDIANT: "Étudiant(e)",
  RETRAITE: "Retraité(e)",
  AUTRE: "Autre",
};

const financementLabels: Record<string, string> = {
  ENTREPRISE: "Entreprise",
  OPCO: "OPCO",
  CPF: "CPF",
  FRANCE_TRAVAIL: "France Travail",
  PERSONNEL: "Personnel",
  MIXTE: "Financement mixte",
  AUTRE: "Autre",
};

export default function PreInscriptionsPage() {
  const [preInscriptions, setPreInscriptions] = useState<PreInscription[]>([]);
  const [stats, setStats] = useState<Stats>({
    NOUVELLE: 0,
    EN_TRAITEMENT: 0,
    ACCEPTEE: 0,
    REFUSEE: 0,
    ANNULEE: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("");
  const [selectedPreInscription, setSelectedPreInscription] =
    useState<PreInscription | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchPreInscriptions = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/api/pre-inscriptions?search=${encodeURIComponent(searchQuery)}`;
      if (filterStatut) url += `&statut=${filterStatut}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPreInscriptions(data.preInscriptions);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Erreur chargement pré-inscriptions:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterStatut]);

  useEffect(() => {
    fetchPreInscriptions();
  }, [fetchPreInscriptions]);

  const handleUpdateStatut = async (
    id: string,
    newStatut: PreInscription["statut"],
    options?: { noteInterne?: string; motifRefus?: string; convertirEnApprenant?: boolean }
  ) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/pre-inscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statut: newStatut,
          ...options,
        }),
      });

      if (res.ok) {
        await fetchPreInscriptions();
        setSelectedPreInscription(null);
      }
    } catch (error) {
      console.error("Erreur mise à jour:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette pré-inscription ?")) {
      return;
    }

    setDeleting(id);
    try {
      const res = await fetch(`/api/pre-inscriptions/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchPreInscriptions();
        if (selectedPreInscription?.id === id) {
          setSelectedPreInscription(null);
        }
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
    } finally {
      setDeleting(null);
    }
  };

  const totalPreInscriptions = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ClipboardList className="w-7 h-7 text-blue-600" />
            Pré-inscriptions
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gérez les demandes de pré-inscription reçues depuis le catalogue
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="Nouvelles"
          count={stats.NOUVELLE}
          color="bg-blue-500"
          onClick={() => setFilterStatut(filterStatut === "NOUVELLE" ? "" : "NOUVELLE")}
          active={filterStatut === "NOUVELLE"}
        />
        <StatCard
          label="En traitement"
          count={stats.EN_TRAITEMENT}
          color="bg-yellow-500"
          onClick={() =>
            setFilterStatut(filterStatut === "EN_TRAITEMENT" ? "" : "EN_TRAITEMENT")
          }
          active={filterStatut === "EN_TRAITEMENT"}
        />
        <StatCard
          label="Acceptées"
          count={stats.ACCEPTEE}
          color="bg-green-500"
          onClick={() => setFilterStatut(filterStatut === "ACCEPTEE" ? "" : "ACCEPTEE")}
          active={filterStatut === "ACCEPTEE"}
        />
        <StatCard
          label="Refusées"
          count={stats.REFUSEE}
          color="bg-red-500"
          onClick={() => setFilterStatut(filterStatut === "REFUSEE" ? "" : "REFUSEE")}
          active={filterStatut === "REFUSEE"}
        />
        <StatCard
          label="Total"
          count={totalPreInscriptions}
          color="bg-gray-500"
          onClick={() => setFilterStatut("")}
          active={!filterStatut}
        />
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="NOUVELLE">Nouvelles</option>
              <option value="EN_TRAITEMENT">En traitement</option>
              <option value="ACCEPTEE">Acceptées</option>
              <option value="REFUSEE">Refusées</option>
              <option value="ANNULEE">Annulées</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : preInscriptions.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery || filterStatut
                ? "Aucune pré-inscription trouvée"
                : "Aucune pré-inscription pour le moment"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {preInscriptions.map((pi) => (
              <PreInscriptionRow
                key={pi.id}
                preInscription={pi}
                onView={() => setSelectedPreInscription(pi)}
                onDelete={() => handleDelete(pi.id)}
                deleting={deleting === pi.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal détail */}
      {selectedPreInscription && (
        <PreInscriptionDetailModal
          preInscription={selectedPreInscription}
          onClose={() => setSelectedPreInscription(null)}
          onUpdateStatut={handleUpdateStatut}
          updating={updating}
        />
      )}
    </div>
  );
}

// Composant stat card
function StatCard({
  label,
  count,
  color,
  onClick,
  active,
}: {
  label: string;
  count: number;
  color: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all ${
        active
          ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <div className="text-left">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </button>
  );
}

// Composant ligne pré-inscription
function PreInscriptionRow({
  preInscription,
  onView,
  onDelete,
  deleting,
}: {
  preInscription: PreInscription;
  onView: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const config = statutConfig[preInscription.statut];
  const StatusIcon = config.icon;

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {preInscription.prenom} {preInscription.nom}
              </h3>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 ${config.color}`}>
                <StatusIcon className="w-3 h-3" />
                {config.label}
              </span>
              {preInscription.situationHandicap && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 flex items-center gap-1">
                  <Accessibility className="w-3 h-3" />
                  Handicap
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {preInscription.email}
              </span>
              <span className="flex items-center gap-1">
                <GraduationCap className="w-4 h-4" />
                {preInscription.formation.titre}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(preInscription.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onView}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
            title="Voir détails"
          >
            <Eye className="w-5 h-5" />
          </button>
          {preInscription.apprenant && (
            <Link
              href={`/automate/apprenants/${preInscription.apprenant.id}`}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors"
              title="Voir le dossier apprenant"
            >
              <User className="w-5 h-5" />
            </Link>
          )}
          <button
            onClick={onDelete}
            disabled={deleting}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
            title="Supprimer"
          >
            {deleting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal détail pré-inscription
function PreInscriptionDetailModal({
  preInscription,
  onClose,
  onUpdateStatut,
  updating,
}: {
  preInscription: PreInscription;
  onClose: () => void;
  onUpdateStatut: (
    id: string,
    statut: PreInscription["statut"],
    options?: { noteInterne?: string; motifRefus?: string; convertirEnApprenant?: boolean }
  ) => void;
  updating: boolean;
}) {
  const [noteInterne, setNoteInterne] = useState(preInscription.noteInterne || "");
  const [motifRefus, setMotifRefus] = useState(preInscription.motifRefus || "");
  const [showRefusForm, setShowRefusForm] = useState(false);

  const config = statutConfig[preInscription.statut];

  const handleAccept = () => {
    onUpdateStatut(preInscription.id, "ACCEPTEE", {
      noteInterne,
      convertirEnApprenant: true,
    });
  };

  const handleRefuse = () => {
    if (!motifRefus.trim()) {
      alert("Veuillez indiquer le motif du refus");
      return;
    }
    onUpdateStatut(preInscription.id, "REFUSEE", {
      noteInterne,
      motifRefus,
    });
  };

  const handleEnTraitement = () => {
    onUpdateStatut(preInscription.id, "EN_TRAITEMENT", { noteInterne });
  };

  // Vérifier si une section a des données
  const hasAnalyseBesoin = preInscription.objectifsProfessionnels ||
    preInscription.contexte ||
    preInscription.experiencePrealable ||
    preInscription.attentesSpecifiques ||
    preInscription.contraintes;

  const hasFinancement = preInscription.modeFinancement ||
    preInscription.financeurNom ||
    preInscription.commentaireFinancement;

  const hasSituationPro = preInscription.situationProfessionnelle ||
    preInscription.entreprise ||
    preInscription.poste ||
    preInscription.siret;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Dossier de pré-inscription
              </h2>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.color}`}>
                {config.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span className="font-medium">{preInscription.prenom} {preInscription.nom}</span> • {preInscription.formation.titre}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* ========================================= */}
          {/* ÉTAPE 1 : ANALYSE DU BESOIN (QUALIOPI) */}
          {/* ========================================= */}
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Analyse du besoin
              </h3>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 rounded-full">
                Qualiopi - Indicateur 1 & 4
              </span>
            </div>

            <div className="ml-4 pl-7 border-l-2 border-gray-200 dark:border-gray-700">
              {hasAnalyseBesoin ? (
                <div className="space-y-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5">
                  <InfoBlock
                    label="Quels sont vos objectifs professionnels ?"
                    value={preInscription.objectifsProfessionnels}
                    required
                  />
                  <InfoBlock
                    label="Quel est le contexte de votre demande ?"
                    value={preInscription.contexte}
                  />
                  <InfoBlock
                    label="Quelle est votre expérience préalable dans ce domaine ?"
                    value={preInscription.experiencePrealable}
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    <InfoBlock
                      label="Attentes spécifiques"
                      value={preInscription.attentesSpecifiques}
                    />
                    <InfoBlock
                      label="Contraintes éventuelles"
                      value={preInscription.contraintes}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5 text-gray-500 dark:text-gray-400 italic">
                  Aucune information renseignée pour l&apos;analyse du besoin
                </div>
              )}
            </div>
          </div>

          {/* ========================================= */}
          {/* ÉTAPE 2 : SITUATION DE HANDICAP */}
          {/* ========================================= */}
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Accessibilité
              </h3>
              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 rounded-full">
                Obligatoire Qualiopi
              </span>
            </div>

            <div className="ml-4 pl-7 border-l-2 border-gray-200 dark:border-gray-700">
              {preInscription.situationHandicap ? (
                <div className="bg-purple-50 dark:bg-purple-500/10 rounded-xl p-5 border border-purple-200 dark:border-purple-500/30">
                  <div className="flex items-start gap-3">
                    <Accessibility className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-purple-900 dark:text-purple-300 mb-2">
                        Personne en situation de handicap
                      </p>
                      {preInscription.besoinsAmenagements ? (
                        <div>
                          <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">
                            Besoins d&apos;aménagements spécifiques :
                          </p>
                          <p className="text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-3 rounded-lg">
                            {preInscription.besoinsAmenagements}
                          </p>
                        </div>
                      ) : (
                        <p className="text-purple-600 dark:text-purple-400 italic">
                          Aucun aménagement spécifique demandé
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5">
                  <p className="text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="inline w-4 h-4 mr-2 text-green-500" />
                    Pas de situation de handicap déclarée
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ========================================= */}
          {/* ÉTAPE 3 : FINANCEMENT */}
          {/* ========================================= */}
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Financement
              </h3>
            </div>

            <div className="ml-4 pl-7 border-l-2 border-gray-200 dark:border-gray-700">
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5">
                {hasFinancement ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Mode de financement</p>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {preInscription.modeFinancement
                            ? financementLabels[preInscription.modeFinancement] || preInscription.modeFinancement
                            : "-"}
                        </p>
                      </div>
                      {preInscription.financeurNom && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Nom du financeur</p>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {preInscription.financeurNom}
                          </p>
                        </div>
                      )}
                    </div>
                    {preInscription.commentaireFinancement && (
                      <InfoBlock
                        label="Commentaire sur le financement"
                        value={preInscription.commentaireFinancement}
                      />
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    Aucune information de financement renseignée
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ========================================= */}
          {/* ÉTAPE 4 : INFORMATIONS PERSONNELLES */}
          {/* ========================================= */}
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Informations personnelles
              </h3>
            </div>

            <div className="ml-4 pl-7 border-l-2 border-gray-200 dark:border-gray-700">
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5 space-y-6">
                {/* Identité */}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Identité
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Civilité</p>
                      <p className="text-gray-900 dark:text-white">{preInscription.civilite || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Prénom</p>
                      <p className="text-gray-900 dark:text-white font-medium">{preInscription.prenom}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Nom</p>
                      <p className="text-gray-900 dark:text-white font-medium">{preInscription.nom}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Date de naissance</p>
                      <p className="text-gray-900 dark:text-white">
                        {preInscription.dateNaissance
                          ? new Date(preInscription.dateNaissance).toLocaleDateString("fr-FR")
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Lieu de naissance</p>
                      <p className="text-gray-900 dark:text-white">{preInscription.lieuNaissance || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Coordonnées */}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Coordonnées
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-gray-900 dark:text-white">
                        <a href={`mailto:${preInscription.email}`} className="text-blue-600 hover:underline">
                          {preInscription.email}
                        </a>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Téléphone</p>
                      <p className="text-gray-900 dark:text-white">
                        {preInscription.telephone ? (
                          <a href={`tel:${preInscription.telephone}`} className="text-blue-600 hover:underline">
                            {preInscription.telephone}
                          </a>
                        ) : "-"}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Adresse</p>
                      <p className="text-gray-900 dark:text-white">
                        {preInscription.adresse ? (
                          <>
                            {preInscription.adresse}<br />
                            {preInscription.codePostal} {preInscription.ville}
                            {preInscription.pays && preInscription.pays !== "France" && (
                              <>, {preInscription.pays}</>
                            )}
                          </>
                        ) : "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Situation professionnelle */}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Situation professionnelle
                  </p>
                  {hasSituationPro ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Situation</p>
                        <p className="text-gray-900 dark:text-white">
                          {preInscription.situationProfessionnelle
                            ? situationLabels[preInscription.situationProfessionnelle] || preInscription.situationProfessionnelle
                            : "-"}
                        </p>
                      </div>
                      {preInscription.entreprise && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Entreprise</p>
                          <p className="text-gray-900 dark:text-white">{preInscription.entreprise}</p>
                        </div>
                      )}
                      {preInscription.poste && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Poste</p>
                          <p className="text-gray-900 dark:text-white">{preInscription.poste}</p>
                        </div>
                      )}
                      {preInscription.siret && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">SIRET</p>
                          <p className="text-gray-900 dark:text-white font-mono">{preInscription.siret}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">
                      Aucune information professionnelle renseignée
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================= */}
          {/* NOTE INTERNE (pour l'équipe) */}
          {/* ========================================= */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <Section title="Note interne" icon={FileText}>
              <textarea
                value={noteInterne}
                onChange={(e) => setNoteInterne(e.target.value)}
                placeholder="Ajoutez une note interne (visible uniquement par votre équipe)..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </Section>
          </div>

          {/* Formulaire de refus */}
          {showRefusForm && (
            <Section title="Motif du refus" icon={AlertCircle}>
              <textarea
                value={motifRefus}
                onChange={(e) => setMotifRefus(e.target.value)}
                placeholder="Indiquez le motif du refus..."
                rows={3}
                className="w-full px-4 py-2.5 border border-red-300 dark:border-red-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
              />
            </Section>
          )}

          {/* Actions */}
          {preInscription.statut !== "ACCEPTEE" &&
            preInscription.statut !== "REFUSEE" && (
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {preInscription.statut === "NOUVELLE" && (
                  <button
                    onClick={handleEnTraitement}
                    disabled={updating}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    {updating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    Mettre en traitement
                  </button>
                )}

                <button
                  onClick={handleAccept}
                  disabled={updating}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {updating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  Accepter et créer l&apos;apprenant
                </button>

                {!showRefusForm ? (
                  <button
                    onClick={() => setShowRefusForm(true)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Refuser
                  </button>
                ) : (
                  <button
                    onClick={handleRefuse}
                    disabled={updating || !motifRefus.trim()}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    {updating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Confirmer le refus
                  </button>
                )}
              </div>
            )}

          {/* Statut accepté */}
          {preInscription.statut === "ACCEPTEE" && (
            <div className="p-4 bg-green-50 dark:bg-green-500/10 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-green-900 dark:text-green-300">
                    Pré-inscription acceptée
                  </p>
                  {preInscription.apprenant && (
                    <p className="text-sm text-green-700 dark:text-green-400">
                      Apprenant créé : {preInscription.apprenant.prenom}{" "}
                      {preInscription.apprenant.nom}
                    </p>
                  )}
                </div>
              </div>
              {preInscription.apprenant && (
                <Link
                  href={`/automate/apprenants/${preInscription.apprenant.id}`}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Voir le dossier complet de l&apos;apprenant
                  <ExternalLink className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}

          {/* Statut refusé */}
          {preInscription.statut === "REFUSEE" && preInscription.motifRefus && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-lg">
              <p className="font-medium text-red-900 dark:text-red-300 mb-1">
                Motif du refus
              </p>
              <p className="text-red-700 dark:text-red-400">
                {preInscription.motifRefus}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p>
              Reçue le{" "}
              {new Date(preInscription.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {preInscription.traiteeAt && (
              <p>
                Traitée le{" "}
                {new Date(preInscription.traiteeAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Composants helpers
function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-gray-400" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-gray-900 dark:text-white">{value || "-"}</p>
    </div>
  );
}

function InfoBlock({ label, value, required }: { label: string; value: string | null; required?: boolean }) {
  if (!value && !required) return null;

  return (
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </p>
      <p className="text-gray-900 dark:text-white whitespace-pre-line">
        {value || <span className="italic text-gray-400">Non renseigné</span>}
      </p>
    </div>
  );
}
