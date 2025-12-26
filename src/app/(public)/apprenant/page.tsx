"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Mail,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  Play,
  TrendingUp,
  Award,
  Loader2,
  AlertCircle,
  LogOut,
} from "lucide-react";
import Link from "next/link";

// =====================================
// TYPES
// =====================================

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string;
}

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
  formation: Formation;
  progressionModules: ProgressionModule[];
}

interface Apprenant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

// =====================================
// HELPERS
// =====================================

const getStatusColor = (statut: string) => {
  switch (statut) {
    case "COMPLETE":
      return "bg-emerald-100 text-emerald-700";
    case "EN_COURS":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const getStatusLabel = (statut: string) => {
  switch (statut) {
    case "COMPLETE":
      return "Terminée";
    case "EN_COURS":
      return "En cours";
    default:
      return "Non commencée";
  }
};

const getProgressColor = (progress: number) => {
  if (progress >= 100) return "bg-emerald-500";
  if (progress >= 50) return "bg-blue-500";
  if (progress > 0) return "bg-amber-500";
  return "bg-gray-300";
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
};

// =====================================
// MAIN COMPONENT
// =====================================

export default function ApprenantPortal() {
  // State
  const [step, setStep] = useState<"login" | "dashboard">("login");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [apprenant, setApprenant] = useState<Apprenant | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("apprenant_token");
    if (savedToken) {
      validateToken(savedToken);
    }
  }, []);

  // Validate token and load data
  const validateToken = async (tokenToValidate: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/apprenant/auth?token=${tokenToValidate}`);
      if (res.ok) {
        const data = await res.json();
        setToken(tokenToValidate);
        setApprenant(data.apprenant);
        setOrganization(data.organization);
        setInscriptions(data.inscriptions);
        setStep("dashboard");
        localStorage.setItem("apprenant_token", tokenToValidate);
      } else {
        localStorage.removeItem("apprenant_token");
        setStep("login");
      }
    } catch {
      localStorage.removeItem("apprenant_token");
      setStep("login");
    } finally {
      setLoading(false);
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Veuillez entrer votre email");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/apprenant/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setToken(data.token);
        setApprenant(data.apprenant);
        setOrganization(data.organization);
        localStorage.setItem("apprenant_token", data.token);
        // Load full data
        await validateToken(data.token);
      } else {
        setError(data.error || "Erreur de connexion");
      }
    } catch {
      setError("Erreur lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("apprenant_token");
    setToken(null);
    setApprenant(null);
    setOrganization(null);
    setInscriptions([]);
    setStep("login");
    setEmail("");
  };

  // Loading state
  if (loading && step === "login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // =====================================
  // LOGIN VIEW
  // =====================================

  if (step === "login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Espace Apprenant</h1>
            <p className="text-gray-600 mt-2">
              Connectez-vous pour accéder à vos formations
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.email@exemple.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600"
                >
                  <AlertCircle size={18} />
                  <p className="text-sm">{error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Connexion...
                  </>
                ) : (
                  <>
                    Accéder à mes formations
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Utilisez l&apos;email associé à votre compte apprenant
          </p>
        </motion.div>
      </div>
    );
  }

  // =====================================
  // DASHBOARD VIEW
  // =====================================

  // Calculate stats
  const totalFormations = inscriptions.length;
  const completedFormations = inscriptions.filter(i => i.statut === "COMPLETE").length;
  const avgProgression = totalFormations > 0
    ? Math.round(inscriptions.reduce((acc, i) => acc + i.progression, 0) / totalFormations)
    : 0;
  const totalTime = inscriptions.reduce((acc, i) => acc + i.tempsTotal, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      {/* Header */}
      <header
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100"
        style={{
          borderBottomColor: organization?.primaryColor
            ? `${organization.primaryColor}20`
            : undefined,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {organization?.logo ? (
                <img
                  src={organization.logo}
                  alt={organization.name}
                  className="h-10 w-auto"
                />
              ) : (
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: organization?.primaryColor || "#6366f1" }}
                >
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="font-semibold text-gray-900">{organization?.name}</h1>
                <p className="text-sm text-gray-500">Espace Apprenant</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-medium text-gray-900">
                  {apprenant?.prenom} {apprenant?.nom}
                </p>
                <p className="text-sm text-gray-500">{apprenant?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                title="Se déconnecter"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900">
            Bonjour {apprenant?.prenom} !
          </h2>
          <p className="text-gray-600 mt-1">
            Voici vos formations en cours. Continuez votre apprentissage.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl"
                style={{ backgroundColor: `${organization?.primaryColor || "#6366f1"}15` }}
              >
                <BookOpen
                  className="w-5 h-5"
                  style={{ color: organization?.primaryColor || "#6366f1" }}
                />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalFormations}</p>
                <p className="text-sm text-gray-500">Formations</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completedFormations}</p>
                <p className="text-sm text-gray-500">Terminées</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{avgProgression}%</p>
                <p className="text-sm text-gray-500">Progression</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 rounded-xl">
                <Clock className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(totalTime)}</p>
                <p className="text-sm text-gray-500">Temps total</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Formations List */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mes formations</h3>

        {inscriptions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Aucune formation disponible
            </h4>
            <p className="text-gray-500">
              Vous n&apos;êtes inscrit à aucune formation pour le moment.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {inscriptions.map((inscription, index) => (
              <motion.div
                key={inscription.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Link
                  href={`/apprenant/formation/${inscription.formation.id}?token=${token}`}
                  className="block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group"
                >
                  {/* Image */}
                  <div
                    className="relative h-40 overflow-hidden"
                    style={{
                      background: inscription.formation.image
                        ? undefined
                        : `linear-gradient(135deg, ${organization?.primaryColor || "#6366f1"}, #8b5cf6)`,
                    }}
                  >
                    {inscription.formation.image ? (
                      <img
                        src={inscription.formation.image}
                        alt={inscription.formation.titre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <GraduationCap className="w-16 h-16 text-white/30" />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(inscription.statut)}`}
                      >
                        {getStatusLabel(inscription.statut)}
                      </span>
                    </div>

                    {/* Progress Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${inscription.progression}%` }}
                        transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
                        className={`h-full ${getProgressColor(inscription.progression)}`}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {inscription.formation.titre}
                    </h4>

                    {inscription.formation.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                        {inscription.formation.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen size={14} />
                          {inscription.formation.modules.length} modules
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDuration(
                            inscription.formation.modules.reduce(
                              (acc, m) => acc + (m.duree || 0),
                              0
                            )
                          )}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {inscription.progression}%
                      </span>
                    </div>

                    {/* CTA Button */}
                    <button
                      className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all"
                      style={{
                        backgroundColor: `${organization?.primaryColor || "#6366f1"}10`,
                        color: organization?.primaryColor || "#6366f1",
                      }}
                    >
                      {inscription.statut === "COMPLETE" ? (
                        <>
                          <Award size={18} />
                          Revoir la formation
                        </>
                      ) : inscription.statut === "EN_COURS" ? (
                        <>
                          <Play size={18} />
                          Continuer
                        </>
                      ) : (
                        <>
                          <Play size={18} />
                          Commencer
                        </>
                      )}
                    </button>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
