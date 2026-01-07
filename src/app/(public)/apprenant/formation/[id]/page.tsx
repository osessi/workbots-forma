"use client";

import { useState, useEffect, use, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Circle,
  Clock,
  Play,
  Lock,
  ChevronRight,
  Loader2,
  AlertCircle,
  Award,
  Package,
  X,
  RotateCcw,
  Maximize2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import ScormPlayer from "@/components/lms/ScormPlayer";

// =====================================
// TYPES
// =====================================

interface Module {
  id: string;
  titre: string;
  description: string | null;
  ordre: number;
  duree: number | null;
  contenu: any;
}

interface Formation {
  id: string;
  titre: string;
  description: string | null;
  image: string | null;
  modules: Module[];
}

interface ProgressionModule {
  moduleId: string;
  progression: number;
  statut: string;
}

interface Inscription {
  id: string;
  progression: number;
  statut: string;
  dateInscription: string;
  tempsTotal: number;
}

interface SCORMPackage {
  id: string;
  titre: string;
  description: string | null;
  version: "SCORM_1_2" | "SCORM_2004";
  signedUrl: string | null;
  masteryScore: number | null;
  tracking: {
    lessonStatus: string;
    scoreRaw: number | null;
  } | null;
}

// =====================================
// HELPERS
// =====================================

const getModuleStatus = (
  moduleId: string,
  progressions: ProgressionModule[]
) => {
  const progress = progressions.find((p) => p.moduleId === moduleId);
  if (!progress) return { status: "locked", progress: 0 };
  return {
    status: progress.statut.toLowerCase().replace("_", "-"),
    progress: progress.progression,
  };
};

const getProgressColor = (progress: number) => {
  if (progress >= 100) return "bg-emerald-500";
  if (progress >= 50) return "bg-blue-500";
  if (progress > 0) return "bg-amber-500";
  return "bg-gray-300";
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

// =====================================
// MAIN COMPONENT
// =====================================

function FormationDetailPageContent({
  resolvedParams,
}: {
  resolvedParams: { id: string };
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formation, setFormation] = useState<Formation | null>(null);
  const [inscription, setInscription] = useState<Inscription | null>(null);
  const [progressions, setProgressions] = useState<ProgressionModule[]>([]);
  const [scormPackages, setScormPackages] = useState<SCORMPackage[]>([]);

  // Active module/SCORM
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [activeScorm, setActiveScorm] = useState<SCORMPackage | null>(null);
  const [showScormPlayer, setShowScormPlayer] = useState(false);

  // Load formation data
  useEffect(() => {
    if (!token) {
      router.push("/apprenant");
      return;
    }

    const loadFormation = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/apprenant/formations/${resolvedParams.id}?token=${token}`);
        if (res.ok) {
          const data = await res.json();
          setFormation(data.formation);
          setInscription(data.inscription);
          setProgressions(data.progressionModules);
          setScormPackages(data.scormPackages);
        } else {
          const data = await res.json();
          setError(data.error || "Erreur de chargement");
        }
      } catch {
        setError("Erreur de connexion");
      } finally {
        setLoading(false);
      }
    };

    loadFormation();
  }, [resolvedParams.id, token, router]);

  // Mark module progress
  const markModuleProgress = async (moduleId: string, completed: boolean) => {
    if (!token || !inscription) return;

    try {
      await fetch("/api/apprenant/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inscriptionId: inscription.id,
          moduleId,
          progression: completed ? 100 : 50,
          completed,
        }),
      });

      // Refresh data
      const res = await fetch(`/api/apprenant/formations/${resolvedParams.id}?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setInscription(data.inscription);
        setProgressions(data.progressionModules);
      }
    } catch (err) {
      console.error("Erreur mise à jour progression:", err);
    }
  };

  // Handle SCORM completion
  const handleScormComplete = async (data: { status: string; score?: number }) => {
    if (activeModule && (data.status === "completed" || data.status === "passed")) {
      await markModuleProgress(activeModule.id, true);
    }
    setShowScormPlayer(false);
    setActiveScorm(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement de la formation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !formation || !inscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Erreur de chargement
          </h1>
          <p className="text-gray-600 mb-6">{error || "Formation non trouvée"}</p>
          <Link
            href={`/apprenant?token=${token}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors font-medium"
          >
            <ArrowLeft size={18} />
            Retour aux formations
          </Link>
        </div>
      </div>
    );
  }

  // Calculate total duration
  const totalDuration = formation.modules.reduce(
    (acc, m) => acc + (m.duree || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/apprenant?token=${token}`}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-gray-900 truncate">
                {formation.titre}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <BookOpen size={14} />
                  {formation.modules.length} modules
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {formatDuration(totalDuration)}
                </span>
              </div>
            </div>

            {/* Progress Badge */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-2xl font-bold text-indigo-600">
                  {inscription.progression}%
                </p>
                <p className="text-xs text-gray-500">Progression</p>
              </div>
              <div className="w-16 h-16 relative">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${inscription.progression} 100`}
                  />
                </svg>
                {inscription.statut === "COMPLETE" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Award className="w-6 h-6 text-emerald-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Modules List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Parcours de formation
            </h2>

            {formation.modules.map((module, index) => {
              const { status, progress } = getModuleStatus(module.id, progressions);
              const isLocked = index > 0 && status === "locked";
              const isActive = activeModule?.id === module.id;

              return (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                    isActive
                      ? "border-indigo-500 shadow-lg ring-2 ring-indigo-100"
                      : isLocked
                      ? "border-gray-100 opacity-60"
                      : "border-gray-100 hover:shadow-md hover:border-indigo-200 cursor-pointer"
                  }`}
                  onClick={() => !isLocked && setActiveModule(module)}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                          status === "complete"
                            ? "bg-emerald-100"
                            : status === "en-cours"
                            ? "bg-blue-100"
                            : isLocked
                            ? "bg-gray-100"
                            : "bg-indigo-100"
                        }`}
                      >
                        {status === "complete" ? (
                          <CheckCircle className="w-6 h-6 text-emerald-500" />
                        ) : status === "en-cours" ? (
                          <Play className="w-6 h-6 text-blue-500" />
                        ) : isLocked ? (
                          <Lock className="w-6 h-6 text-gray-400" />
                        ) : (
                          <Circle className="w-6 h-6 text-indigo-500" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="font-semibold text-gray-900">
                            <span className="text-gray-400 mr-2">{index + 1}.</span>
                            {module.titre}
                          </h3>
                          {module.duree && (
                            <span className="flex-shrink-0 text-sm text-gray-500 flex items-center gap-1">
                              <Clock size={14} />
                              {formatDuration(module.duree)}
                            </span>
                          )}
                        </div>

                        {module.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {module.description}
                          </p>
                        )}

                        {/* Progress Bar */}
                        {(status === "en-cours" || status === "complete") && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-500">Progression</span>
                              <span className="font-medium text-gray-700">
                                {progress}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className={`h-full rounded-full ${getProgressColor(progress)}`}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action */}
                      {!isLocked && (
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100"
                      >
                        <div className="p-5 bg-gray-50">
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => markModuleProgress(module.id, false)}
                              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors text-sm font-medium"
                            >
                              <Play size={16} />
                              {status === "complete" ? "Revoir" : "Commencer"}
                            </button>

                            {status !== "complete" && (
                              <button
                                onClick={() => markModuleProgress(module.id, true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-sm font-medium"
                              >
                                <CheckCircle size={16} />
                                Marquer comme terminé
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Sidebar - SCORM Packages */}
          <div className="space-y-6">
            {/* SCORM Modules */}
            {scormPackages.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package size={18} className="text-purple-500" />
                  Modules interactifs
                </h3>

                <div className="space-y-3">
                  {scormPackages.map((pkg) => {
                    const isCompleted =
                      pkg.tracking?.lessonStatus === "COMPLETED" ||
                      pkg.tracking?.lessonStatus === "PASSED";

                    return (
                      <div
                        key={pkg.id}
                        className={`p-4 rounded-xl border ${
                          isCompleted
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              isCompleted ? "bg-emerald-100" : "bg-purple-100"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Package className="w-4 h-4 text-purple-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm">
                              {pkg.titre}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {pkg.version === "SCORM_1_2" ? "SCORM 1.2" : "SCORM 2004"}
                            </p>
                            {pkg.tracking?.scoreRaw && (
                              <p className="text-xs text-emerald-600 mt-1">
                                Score: {pkg.tracking.scoreRaw}%
                              </p>
                            )}
                          </div>
                        </div>

                        {pkg.signedUrl && (
                          <button
                            onClick={() => {
                              setActiveScorm(pkg);
                              setShowScormPlayer(true);
                            }}
                            className="w-full mt-3 flex items-center justify-center gap-2 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
                          >
                            <Play size={14} />
                            {isCompleted ? "Revoir" : "Lancer"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Formation Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">
                Informations
              </h3>

              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Inscrit le</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {new Date(inscription.dateInscription).toLocaleDateString("fr-FR")}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Temps passé</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {formatDuration(inscription.tempsTotal)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Statut</dt>
                  <dd className="text-sm font-medium">
                    <span
                      className={`px-2 py-1 rounded-lg ${
                        inscription.statut === "COMPLETE"
                          ? "bg-emerald-100 text-emerald-700"
                          : inscription.statut === "EN_COURS"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {inscription.statut === "COMPLETE"
                        ? "Terminée"
                        : inscription.statut === "EN_COURS"
                        ? "En cours"
                        : "Non commencée"}
                    </span>
                  </dd>
                </div>
              </dl>

              {inscription.statut === "COMPLETE" && (
                <div className="mt-4 p-4 bg-emerald-50 rounded-xl text-center">
                  <Award className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="font-medium text-emerald-700">
                    Formation terminée !
                  </p>
                  <p className="text-sm text-emerald-600 mt-1">
                    Félicitations pour votre accomplissement
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* SCORM Player Modal */}
      <AnimatePresence>
        {showScormPlayer && activeScorm && activeScorm.signedUrl && token && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-6xl h-[85vh] bg-white rounded-2xl overflow-hidden"
            >
              <ScormPlayer
                packageId={activeScorm.id}
                launchUrl={activeScorm.signedUrl}
                version={activeScorm.version}
                apprenantId={token.split(".")[0] || "apprenant"}
                apprenantName="Apprenant"
                onComplete={handleScormComplete}
                onClose={() => {
                  setShowScormPlayer(false);
                  setActiveScorm(null);
                }}
                className="h-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FormationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div></div>}>
      <FormationDetailPageContent resolvedParams={resolvedParams} />
    </Suspense>
  );
}
