"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Users,
  BookOpen,
  Clock,
  TrendingUp,
  ChevronRight,
  Search,
  Play,
  CheckCircle,
  Circle,
  Award,
  Eye,
  UserPlus,
  Upload,
  Package,
  AlertCircle,
  Trash2,
  MoreVertical,
  X,
  FileArchive,
  RefreshCw,
  Download,
  Link as LinkIcon,
  Settings,
  Filter,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import ScormPlayer from "@/components/lms/ScormPlayer";

// =====================================
// TYPES
// =====================================

interface Module {
  id: string;
  titre: string;
  ordre: number;
  duree: number | null;
}

interface Formation {
  id: string;
  titre: string;
  description: string | null;
  image: string | null;
  status: string;
  isPublished: boolean;
  publishedAt: string | null;
  duree: number | null;
  modules: Module[];
  _count: {
    lmsInscriptions: number;
  };
}

interface Apprenant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  entreprise?: string;
  statut?: string;
  _count?: {
    lmsInscriptions: number;
  };
  lmsInscriptions?: Array<{
    id: string;
    formation: { id: string; titre: string };
    progression: number;
    statut: string;
  }>;
}

interface ProgressionModule {
  id: string;
  progression: number;
  statut: string;
  module: {
    id: string;
    titre: string;
    ordre: number;
  };
}

interface Inscription {
  id: string;
  progression: number;
  statut: string;
  dateInscription: string;
  tempsTotal: number;
  formation: {
    id: string;
    titre: string;
    modules: Module[];
  };
  apprenant: Apprenant;
  progressionModules: ProgressionModule[];
}

interface Stats {
  total: number;
  enCours: number;
  completes: number;
  nonCommences: number;
  progressionMoyenne: number;
}

interface SCORMPackage {
  id: string;
  titre: string;
  description: string | null;
  version: "SCORM_1_2" | "SCORM_2004";
  status: "UPLOADING" | "PROCESSING" | "VALID" | "ERROR" | "ARCHIVED";
  errorMessage: string | null;
  launchUrl: string | null;
  storagePath: string;
  originalFileName: string;
  fileSize: number;
  masteryScore: number | null;
  formationId: string | null;
  formation: { id: string; titre: string } | null;
  usageCount: number;
  createdAt: string;
  _count: {
    trackingData: number;
  };
}

interface SCORMStats {
  total: number;
  valid: number;
  error: number;
  processing: number;
}

type ViewMode = "formations" | "apprenants" | "scorm";
type StatusFilter = "all" | "en_cours" | "complete" | "non_commence";

// =====================================
// HELPERS
// =====================================

const getStatusColor = (statut: string) => {
  switch (statut) {
    case "COMPLETE":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "EN_COURS":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
  }
};

const getStatusLabel = (statut: string) => {
  switch (statut) {
    case "COMPLETE":
      return "Terminé";
    case "EN_COURS":
      return "En cours";
    default:
      return "Non commencé";
  }
};

const getProgressColor = (progress: number) => {
  if (progress >= 100) return "bg-emerald-500";
  if (progress >= 50) return "bg-blue-500";
  if (progress > 0) return "bg-amber-500";
  return "bg-gray-300 dark:bg-gray-600";
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getSCORMStatusConfig = (status: string) => {
  switch (status) {
    case "VALID":
      return {
        label: "Valide",
        icon: CheckCircle2,
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        text: "text-emerald-700 dark:text-emerald-400",
      };
    case "ERROR":
      return {
        label: "Erreur",
        icon: XCircle,
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-400",
      };
    case "PROCESSING":
    case "UPLOADING":
      return {
        label: "En cours",
        icon: Loader2,
        bg: "bg-amber-100 dark:bg-amber-900/30",
        text: "text-amber-700 dark:text-amber-400",
      };
    case "ARCHIVED":
      return {
        label: "Archivé",
        icon: FileArchive,
        bg: "bg-gray-100 dark:bg-gray-700",
        text: "text-gray-600 dark:text-gray-400",
      };
    default:
      return {
        label: status,
        icon: Circle,
        bg: "bg-gray-100 dark:bg-gray-700",
        text: "text-gray-600 dark:text-gray-400",
      };
  }
};

// =====================================
// MAIN COMPONENT
// =====================================

export default function LMSPage() {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>("formations");
  const [formations, setFormations] = useState<Formation[]>([]);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [scormPackages, setScormPackages] = useState<SCORMPackage[]>([]);
  const [scormStats, setScormStats] = useState<SCORMStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Modals
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [formationInscriptions, setFormationInscriptions] = useState<Inscription[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedScormPackage, setSelectedScormPackage] = useState<SCORMPackage | null>(null);
  const [showScormPlayer, setShowScormPlayer] = useState(false);
  const [playerLaunchUrl, setPlayerLaunchUrl] = useState<string | null>(null);
  const [showInscriptionModal, setShowInscriptionModal] = useState(false);

  // =====================================
  // DATA FETCHING
  // =====================================

  const loadFormations = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/formations?published=false");
      if (res.ok) {
        const data = await res.json();
        setFormations(data.formations);
      }
    } catch (error) {
      console.error("Erreur chargement formations:", error);
    }
  }, []);

  const loadInscriptions = useCallback(async (formationId?: string) => {
    try {
      const url = formationId
        ? `/api/lms/inscriptions?formationId=${formationId}`
        : "/api/lms/inscriptions";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (formationId) {
          setFormationInscriptions(data.inscriptions);
        } else {
          setInscriptions(data.inscriptions);
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error("Erreur chargement inscriptions:", error);
    }
  }, []);

  const loadScormPackages = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/scorm/packages");
      if (res.ok) {
        const data = await res.json();
        setScormPackages(data.packages);
        setScormStats(data.stats);
      }
    } catch (error) {
      console.error("Erreur chargement packages SCORM:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadFormations(), loadInscriptions(), loadScormPackages()]);
      setLoading(false);
    };
    loadData();
  }, [loadFormations, loadInscriptions, loadScormPackages]);

  useEffect(() => {
    if (selectedFormation) {
      loadInscriptions(selectedFormation.id);
    }
  }, [selectedFormation, loadInscriptions]);

  // =====================================
  // FILTERS
  // =====================================

  const filteredInscriptions = inscriptions.filter((i) => {
    const matchesSearch =
      i.apprenant.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.apprenant.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.formation.titre.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "en_cours" && i.statut === "EN_COURS") ||
      (statusFilter === "complete" && i.statut === "COMPLETE") ||
      (statusFilter === "non_commence" && i.statut === "NON_COMMENCE");

    return matchesSearch && matchesStatus;
  });

  const filteredScormPackages = scormPackages.filter((pkg) => {
    return (
      pkg.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.originalFileName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // =====================================
  // SCORM HANDLERS
  // =====================================

  const handleLaunchScorm = async (pkg: SCORMPackage) => {
    try {
      const res = await fetch(`/api/lms/scorm/${pkg.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.launchUrl) {
          setPlayerLaunchUrl(data.launchUrl);
          setSelectedScormPackage(pkg);
          setShowScormPlayer(true);
        }
      }
    } catch (error) {
      console.error("Erreur lancement SCORM:", error);
    }
  };

  const handleDeleteScorm = async (pkg: SCORMPackage) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${pkg.titre}" ?`)) return;

    try {
      const res = await fetch(`/api/lms/scorm/${pkg.id}`, { method: "DELETE" });
      if (res.ok) {
        loadScormPackages();
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur suppression SCORM:", error);
    }
  };

  // =====================================
  // LOADING STATE
  // =====================================

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-xl">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            Learning Management System
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 ml-14">
            Gérez vos formations, modules SCORM et suivez la progression de vos apprenants
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors font-medium shadow-md"
          >
            <Upload size={18} />
            Importer SCORM
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-50 dark:bg-brand-900/30 rounded-xl">
              <BookOpen className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formations.filter((f) => f.isPublished).length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Formations publiées</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
              <Package className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {scormStats?.valid || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Modules SCORM</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.total || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Inscriptions</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.progressionMoyenne || 0}%
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Progression moy.</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-4 border-b dark:border-gray-700 pb-4">
        <button
          onClick={() => setViewMode("formations")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            viewMode === "formations"
              ? "bg-brand-500 text-white shadow-md"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <BookOpen size={18} />
          Formations
        </button>
        <button
          onClick={() => setViewMode("scorm")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            viewMode === "scorm"
              ? "bg-brand-500 text-white shadow-md"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Package size={18} />
          Bibliothèque SCORM
          {scormStats && scormStats.error > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {scormStats.error}
            </span>
          )}
        </button>
        <button
          onClick={() => setViewMode("apprenants")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            viewMode === "apprenants"
              ? "bg-brand-500 text-white shadow-md"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Users size={18} />
          Apprenants
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === "formations" && (
          <FormationsView
            formations={formations}
            onSelect={setSelectedFormation}
            formatDuration={formatDuration}
          />
        )}

        {viewMode === "scorm" && (
          <SCORMLibraryView
            packages={filteredScormPackages}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onUpload={() => setShowUploadModal(true)}
            onLaunch={handleLaunchScorm}
            onDelete={handleDeleteScorm}
            onRefresh={loadScormPackages}
          />
        )}

        {viewMode === "apprenants" && (
          <ApprenantsView
            inscriptions={filteredInscriptions}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onAddInscription={() => setShowInscriptionModal(true)}
          />
        )}
      </AnimatePresence>

      {/* Formation Detail Modal */}
      {selectedFormation && (
        <FormationDetailModal
          formation={selectedFormation}
          inscriptions={formationInscriptions}
          onClose={() => {
            setSelectedFormation(null);
            setFormationInscriptions([]);
          }}
          onRefresh={() => {
            loadFormations();
            loadInscriptions(selectedFormation.id);
          }}
        />
      )}

      {/* Upload SCORM Modal */}
      {showUploadModal && (
        <UploadSCORMModal
          formations={formations}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            loadScormPackages();
          }}
        />
      )}

      {/* SCORM Player Modal */}
      {showScormPlayer && selectedScormPackage && playerLaunchUrl && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl h-[85vh]">
            <ScormPlayer
              packageId={selectedScormPackage.id}
              launchUrl={playerLaunchUrl}
              version={selectedScormPackage.version}
              apprenantId="preview"
              apprenantName="Prévisualisation"
              previewMode={true}
              onClose={() => {
                setShowScormPlayer(false);
                setSelectedScormPackage(null);
                setPlayerLaunchUrl(null);
              }}
              className="h-full"
            />
          </div>
        </div>
      )}

      {/* Inscription Modal */}
      {showInscriptionModal && (
        <InscriptionModal
          formations={formations.filter(f => f.isPublished)}
          onClose={() => setShowInscriptionModal(false)}
          onSuccess={() => {
            setShowInscriptionModal(false);
            loadInscriptions();
          }}
        />
      )}
    </div>
  );
}

// =====================================
// FORMATIONS VIEW
// =====================================

function FormationsView({
  formations,
  onSelect,
  formatDuration,
}: {
  formations: Formation[];
  onSelect: (f: Formation) => void;
  formatDuration: (m: number) => string;
}) {
  if (formations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700"
      >
        <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-700 rounded-2xl mb-4">
          <BookOpen className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Aucune formation
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
          Créez votre première formation puis publiez-la pour qu&apos;elle apparaisse dans le LMS.
        </p>
        <a
          href="/automate/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors font-medium"
        >
          Créer une formation
          <ChevronRight size={18} />
        </a>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      {formations.map((formation, index) => (
        <motion.div
          key={formation.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`group bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden transition-all hover:shadow-xl cursor-pointer ${
            formation.isPublished
              ? "border-gray-100 dark:border-gray-700"
              : "border-dashed border-gray-300 dark:border-gray-600 opacity-75"
          }`}
          onClick={() => onSelect(formation)}
        >
          {/* Image */}
          <div className="relative h-40 bg-gradient-to-br from-brand-400 to-indigo-600 overflow-hidden">
            {formation.image ? (
              <img
                src={formation.image}
                alt={formation.titre}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <GraduationCap className="w-16 h-16 text-white/30" />
              </div>
            )}
            <div className="absolute top-3 right-3">
              {formation.isPublished ? (
                <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                  <CheckCircle size={12} />
                  Publié
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                  <Circle size={12} />
                  Non publié
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2 line-clamp-1 group-hover:text-brand-500 transition-colors">
              {formation.titre}
            </h3>
            {formation.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                {formation.description}
              </p>
            )}

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <BookOpen size={14} />
                  {formation.modules.length} modules
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {formatDuration(formation.modules.reduce((acc, m) => acc + (m.duree || 0), 0))}
                </span>
              </div>
              <div className="flex items-center gap-1 text-brand-500 font-medium">
                <Users size={14} />
                {formation._count.lmsInscriptions}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// =====================================
// SCORM LIBRARY VIEW
// =====================================

function SCORMLibraryView({
  packages,
  searchQuery,
  onSearchChange,
  onUpload,
  onLaunch,
  onDelete,
  onRefresh,
}: {
  packages: SCORMPackage[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onUpload: () => void;
  onLaunch: (pkg: SCORMPackage) => void;
  onDelete: (pkg: SCORMPackage) => void;
  onRefresh: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un module SCORM..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            title="Actualiser"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={onUpload}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors font-medium"
          >
            <Upload size={18} />
            Importer
          </button>
        </div>
      </div>

      {/* Packages Grid */}
      {packages.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-700 rounded-2xl mb-4">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aucun module SCORM
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            Importez des packages SCORM pour les utiliser dans vos formations.
          </p>
          <button
            onClick={onUpload}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors font-medium"
          >
            <Upload size={18} />
            Importer un package SCORM
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg, index) => {
            const statusConfig = getSCORMStatusConfig(pkg.status);
            const StatusIcon = statusConfig.icon;

            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                      <FileArchive className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {pkg.titre}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {pkg.version === "SCORM_1_2" ? "SCORM 1.2" : "SCORM 2004"}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
                  >
                    <StatusIcon
                      size={12}
                      className={pkg.status === "PROCESSING" || pkg.status === "UPLOADING" ? "animate-spin" : ""}
                    />
                    {statusConfig.label}
                  </span>
                </div>

                {/* Error Message */}
                {pkg.status === "ERROR" && pkg.errorMessage && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <p className="text-xs text-red-600 dark:text-red-400 line-clamp-2">
                      {pkg.errorMessage}
                    </p>
                  </div>
                )}

                {/* Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Fichier</span>
                    <span className="text-gray-700 dark:text-gray-300 truncate max-w-[180px]">
                      {pkg.originalFileName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Taille</span>
                    <span className="text-gray-700 dark:text-gray-300">{formatFileSize(pkg.fileSize)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Apprenants</span>
                    <span className="text-gray-700 dark:text-gray-300">{pkg._count.trackingData}</span>
                  </div>
                  {pkg.formation && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Formation</span>
                      <span className="text-brand-500 truncate max-w-[180px]">{pkg.formation.titre}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                  {pkg.status === "VALID" && (
                    <button
                      onClick={() => onLaunch(pkg)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors text-sm font-medium"
                    >
                      <Play size={14} />
                      Prévisualiser
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(pkg)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// =====================================
// APPRENANTS VIEW
// =====================================

function ApprenantsView({
  inscriptions,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onAddInscription,
}: {
  inscriptions: Inscription[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (f: StatusFilter) => void;
  onAddInscription: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un apprenant ou une formation..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={onAddInscription}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium shadow-md transition-all"
        >
          <UserPlus size={18} />
          Inscrire un apprenant
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "en_cours", "complete", "non_commence"] as const).map((status) => (
          <button
            key={status}
            onClick={() => onStatusFilterChange(status)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              statusFilter === status
                ? "bg-brand-500 text-white shadow-md"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-brand-300"
            }`}
          >
            {status === "all"
              ? "Tous"
              : status === "en_cours"
              ? "En cours"
              : status === "complete"
              ? "Terminés"
              : "Non commencés"}
          </button>
        ))}
      </div>

      {/* Inscriptions List */}
      {inscriptions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-700 rounded-2xl mb-4">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aucune inscription
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Inscrivez des apprenants à vos formations pour suivre leur progression.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inscriptions.map((inscription, index) => (
            <motion.div
              key={inscription.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                    {inscription.apprenant.prenom[0]}
                    {inscription.apprenant.nom[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {inscription.apprenant.prenom} {inscription.apprenant.nom}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{inscription.formation.titre}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(inscription.statut)}`}>
                  {getStatusLabel(inscription.statut)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500 dark:text-gray-400">Progression globale</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{inscription.progression}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${inscription.progression}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className={`h-full rounded-full ${getProgressColor(inscription.progression)}`}
                  />
                </div>
              </div>

              {/* Modules Progress */}
              {inscription.progressionModules.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {inscription.progressionModules.slice(0, 4).map((pm) => (
                    <div key={pm.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">
                        Module {pm.module.ordre + 1}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getProgressColor(pm.progression)}`}
                            style={{ width: `${pm.progression}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{pm.progression}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {inscription.progressionModules.length > 4 && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  +{inscription.progressionModules.length - 4} autres modules
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// =====================================
// FORMATION DETAIL MODAL
// =====================================

function FormationDetailModal({
  formation,
  inscriptions,
  onClose,
  onRefresh,
}: {
  formation: Formation;
  inscriptions: Inscription[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [publishing, setPublishing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportVersion, setExportVersion] = useState<"SCORM_1_2" | "SCORM_2004">("SCORM_1_2");
  const [showExportOptions, setShowExportOptions] = useState(false);

  const handleExportScorm = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/lms/scorm/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formationId: formation.id,
          version: exportVersion,
          options: {
            masteryScore: 80,
            includeEvaluations: true,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.downloadUrl) {
          // Télécharger le fichier
          const link = document.createElement("a");
          link.href = data.downloadUrl;
          link.download = data.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setShowExportOptions(false);
        }
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de l'export");
      }
    } catch (error) {
      console.error("Erreur export SCORM:", error);
      alert("Erreur lors de l'export SCORM");
    } finally {
      setExporting(false);
    }
  };

  const togglePublish = async () => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/formations/${formation.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: !formation.isPublished }),
      });
      if (res.ok) {
        onRefresh();
      }
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header Image */}
        <div className="relative h-48 bg-gradient-to-br from-brand-400 to-indigo-600">
          {formation.image && (
            <img src={formation.image} alt={formation.titre} className="w-full h-full object-cover opacity-50" />
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
            <h2 className="text-2xl font-bold text-white mb-1">{formation.titre}</h2>
            <div className="flex items-center gap-4 text-white/80 text-sm">
              <span className="flex items-center gap-1">
                <BookOpen size={14} />
                {formation.modules.length} modules
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {formatDuration(formation.modules.reduce((acc, m) => acc + (m.duree || 0), 0))}
              </span>
              <span className="flex items-center gap-1">
                <Users size={14} />
                {formation._count.lmsInscriptions} inscrits
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-12rem)] overflow-y-auto">
          {/* Publish Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Publication LMS</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formation.isPublished ? "Cette formation est visible dans le LMS" : "Publiez pour rendre visible dans le LMS"}
              </p>
            </div>
            <button
              onClick={togglePublish}
              disabled={publishing}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                formation.isPublished
                  ? "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                  : "bg-brand-500 text-white hover:bg-brand-600 shadow-md"
              } disabled:opacity-50`}
            >
              {publishing ? "..." : formation.isPublished ? "Dépublier" : "Publier"}
            </button>
          </div>

          {/* Export SCORM */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Download size={18} />
                  Exporter en SCORM
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Générez un package SCORM compatible avec tout LMS
                </p>
              </div>
              <button
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="px-5 py-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors font-medium flex items-center gap-2"
              >
                <Download size={16} />
                Exporter
              </button>
            </div>

            {/* Export Options */}
            <AnimatePresence>
              {showExportOptions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Version SCORM :
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExportVersion("SCORM_1_2")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          exportVersion === "SCORM_1_2"
                            ? "bg-purple-500 text-white shadow-md"
                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600"
                        }`}
                      >
                        SCORM 1.2
                      </button>
                      <button
                        onClick={() => setExportVersion("SCORM_2004")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          exportVersion === "SCORM_2004"
                            ? "bg-purple-500 text-white shadow-md"
                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600"
                        }`}
                      >
                        SCORM 2004
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {exportVersion === "SCORM_1_2"
                        ? "Compatible avec la plupart des LMS (Moodle, Cornerstone, etc.)"
                        : "Version moderne avec suivi avancé et séquençage"}
                    </p>
                    <button
                      onClick={handleExportScorm}
                      disabled={exporting}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {exporting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <Download size={14} />
                          Télécharger
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Modules */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <BookOpen size={18} />
              Modules ({formation.modules.length})
            </h3>
            <div className="space-y-2">
              {formation.modules.map((module, index) => (
                <div key={module.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-medium text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{module.titre}</p>
                  </div>
                  {module.duree && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock size={14} />
                      {formatDuration(module.duree)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Inscriptions */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Users size={18} />
              Apprenants inscrits ({inscriptions.length})
            </h3>
            {inscriptions.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-2xl">
                <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">Aucun apprenant inscrit</p>
              </div>
            ) : (
              <div className="space-y-2">
                {inscriptions.map((inscription) => (
                  <div key={inscription.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-indigo-600 flex items-center justify-center text-white font-bold">
                      {inscription.apprenant.prenom[0]}
                      {inscription.apprenant.nom[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {inscription.apprenant.prenom} {inscription.apprenant.nom}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 max-w-32 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getProgressColor(inscription.progression)}`}
                            style={{ width: `${inscription.progression}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{inscription.progression}%</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(inscription.statut)}`}>
                      {getStatusLabel(inscription.statut)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// =====================================
// UPLOAD SCORM MODAL
// =====================================

function UploadSCORMModal({
  formations,
  onClose,
  onSuccess,
}: {
  formations: Formation[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [formationId, setFormationId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".zip")) {
      setError("Le fichier doit être au format ZIP");
      return;
    }
    setFile(selectedFile);
    setError(null);
    if (!titre) {
      setTitre(selectedFile.name.replace(".zip", ""));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Veuillez sélectionner un fichier");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("titre", titre || file.name.replace(".zip", ""));
      if (description) formData.append("description", description);
      if (formationId) formData.append("formationId", formationId);

      const res = await fetch("/api/lms/scorm/packages", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de l'upload");
      }
    } catch (err) {
      setError("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Importer un module SCORM</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* File Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 scale-[1.02]"
                : file
                ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-brand-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            <input ref={fileInputRef} type="file" accept=".zip" onChange={handleFileChange} className="hidden" />

            {isDragging ? (
              <div className="py-4">
                <Upload className="w-12 h-12 text-brand-500 mx-auto mb-3 animate-bounce" />
                <p className="text-brand-600 dark:text-brand-400 font-medium">Déposez le fichier ici</p>
              </div>
            ) : file ? (
              <div className="flex items-center justify-center gap-3">
                <FileArchive className="w-10 h-10 text-brand-500" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-1">Cliquez ou glissez un fichier ZIP</p>
                <p className="text-sm text-gray-400">Package SCORM 1.2 ou 2004</p>
              </>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Titre du module
              </label>
              <input
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Ex: Introduction à Excel"
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description (optionnel)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez le contenu de ce module..."
                rows={2}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Lier à une formation (optionnel)
              </label>
              <select
                value={formationId}
                onChange={(e) => setFormationId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="">Aucune formation</option>
                {formations.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.titre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400">
              <AlertCircle size={18} />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Import en cours...
              </>
            ) : (
              <>
                <Upload size={18} />
                Importer
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// =====================================
// INSCRIPTION MODAL
// =====================================

function InscriptionModal({
  formations,
  onClose,
  onSuccess,
}: {
  formations: Formation[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<"apprenant" | "formation">("apprenant");
  const [searchQuery, setSearchQuery] = useState("");
  const [apprenants, setApprenants] = useState<Apprenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedApprenant, setSelectedApprenant] = useState<Apprenant | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Charger les apprenants
  const searchApprenants = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("search", query);

      const response = await fetch(`/api/lms/apprenants?${params}`);
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setApprenants(data.apprenants || []);
    } catch (err) {
      console.error("Erreur chargement apprenants:", err);
      setApprenants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Recherche avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      searchApprenants(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchApprenants]);

  // Charger au montage
  useEffect(() => {
    searchApprenants("");
  }, [searchApprenants]);

  // Créer l'inscription
  const handleSubmit = async () => {
    if (!selectedApprenant || !selectedFormation) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/lms/inscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apprenantId: selectedApprenant.id,
          formationId: selectedFormation.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l'inscription");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Inscrire un apprenant
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {step === "apprenant"
                ? "Étape 1/2 - Sélectionnez un apprenant"
                : "Étape 2/2 - Sélectionnez une formation"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            <div
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                step === "apprenant" || step === "formation"
                  ? "bg-brand-500"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
            <div
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                step === "formation"
                  ? "bg-brand-500"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "apprenant" ? (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom, prénom ou email..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              {/* Apprenants List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-brand-500" />
                </div>
              ) : apprenants.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery
                      ? "Aucun apprenant trouvé"
                      : "Aucun apprenant dans votre base"}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Ajoutez des apprenants depuis "Mes données → Apprenants"
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {apprenants.map((apprenant) => (
                    <button
                      key={apprenant.id}
                      onClick={() => setSelectedApprenant(apprenant)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        selectedApprenant?.id === apprenant.id
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                          : "border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold">
                        {apprenant.prenom?.[0]?.toUpperCase() || apprenant.nom?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {apprenant.prenom} {apprenant.nom}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {apprenant.email}
                        </p>
                      </div>
                      {apprenant._count?.lmsInscriptions ? (
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg">
                          {apprenant._count.lmsInscriptions} formation(s)
                        </span>
                      ) : null}
                      {selectedApprenant?.id === apprenant.id && (
                        <CheckCircle size={20} className="text-brand-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected Apprenant Summary */}
              {selectedApprenant && (
                <div className="flex items-center gap-3 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-200 dark:border-brand-800">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-semibold">
                    {selectedApprenant.prenom?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {selectedApprenant.prenom} {selectedApprenant.nom}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedApprenant.email}
                    </p>
                  </div>
                  <button
                    onClick={() => setStep("apprenant")}
                    className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    Modifier
                  </button>
                </div>
              )}

              {/* Formations List */}
              {formations.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucune formation publiée disponible
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Publiez une formation depuis l'onglet "Formations"
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {formations.map((formation) => (
                    <button
                      key={formation.id}
                      onClick={() => setSelectedFormation(formation)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        selectedFormation?.id === formation.id
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                          : "border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white">
                        <BookOpen size={20} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formation.titre}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formation.modules?.length || 0} module(s)
                          {formation.duree && ` • ${formation.duree}h`}
                        </p>
                      </div>
                      {selectedFormation?.id === formation.id && (
                        <CheckCircle size={20} className="text-brand-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400">
              <AlertCircle size={18} />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={step === "apprenant" ? onClose : () => setStep("apprenant")}
            className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors"
          >
            {step === "apprenant" ? "Annuler" : "Retour"}
          </button>

          {step === "apprenant" ? (
            <button
              onClick={() => setStep("formation")}
              disabled={!selectedApprenant}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuer
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!selectedFormation || submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Inscription...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Inscrire
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
