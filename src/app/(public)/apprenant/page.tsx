"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Mail,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  Play,
  TrendingUp,
  Award,
  Loader2,
  AlertCircle,
  LogOut,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

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

function ApprenantPortalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State
  const [step, setStep] = useState<"email" | "code" | "dashboard">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [apprenant, setApprenant] = useState<Apprenant | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  // Refs pour les inputs du code
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check for existing token or magic link on mount
  useEffect(() => {
    // Check for magic link token in URL
    const urlToken = searchParams.get("token");
    if (urlToken) {
      // Correction 433a: Si admin=true, c'est un accès admin direct (impersonation)
      // Le token est déjà un session token, pas besoin de passer par verify-token
      const isAdminAccess = searchParams.get("admin") === "true";
      if (isAdminAccess) {
        // Utiliser directement le token comme session token
        validateToken(urlToken);
      } else {
        validateMagicToken(urlToken);
      }
      return;
    }

    // Check for saved session token
    const savedToken = localStorage.getItem("apprenant_token");
    if (savedToken) {
      validateToken(savedToken);
    }
  }, [searchParams]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Validate magic link token (first connection)
  const validateMagicToken = async (magicToken: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/apprenant/verify-token?token=${magicToken}`);
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setApprenant(data.apprenant);
        setOrganization(data.organization);
        localStorage.setItem("apprenant_token", data.token);
        // Load full data
        await validateToken(data.token);
      } else {
        const data = await res.json();
        setError(data.error || "Lien invalide ou expiré");
        setStep("email");
      }
    } catch {
      setError("Erreur lors de la vérification du lien");
      setStep("email");
    } finally {
      setLoading(false);
    }
  };

  // Validate session token
  const validateToken = async (tokenToValidate: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/apprenant/auth?token=${tokenToValidate}`);
      if (res.ok) {
        // Token valide - rediriger vers le nouveau dashboard
        localStorage.setItem("apprenant_token", tokenToValidate);
        // Utiliser window.location pour forcer un rechargement complet
        window.location.href = "/apprenant/suivi";
      } else {
        localStorage.removeItem("apprenant_token");
        setStep("email");
        setLoading(false);
      }
    } catch {
      localStorage.removeItem("apprenant_token");
      setStep("email");
      setLoading(false);
    }
  };

  // Send OTP code
  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setError("Veuillez entrer votre email");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/apprenant/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage("Code envoyé ! Vérifiez votre boîte mail.");
        setStep("code");
        setResendCooldown(60);
        setCode(["", "", "", "", "", ""]);
        // En dev, stocker le code pour affichage
        if (data.devCode) {
          setDevCode(data.devCode);
        }
        // Focus first input
        setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
      } else {
        setError(data.error || "Erreur lors de l'envoi du code");
      }
    } catch {
      setError("Erreur lors de l'envoi du code");
    } finally {
      setLoading(false);
    }
  };

  // Handle code input
  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-focus next input
    if (digit && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (digit && index === 5) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        verifyCode(fullCode);
      }
    }
  };

  // Handle paste
  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 6) {
      const newCode = pastedData.split("");
      setCode(newCode);
      verifyCode(pastedData);
    }
  };

  // Handle backspace
  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP code
  const verifyCode = async (codeToVerify: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/apprenant/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: codeToVerify }),
      });

      const data = await res.json();

      if (res.ok) {
        // Stocker le token et rediriger directement
        localStorage.setItem("apprenant_token", data.token);
        // Utiliser window.location pour forcer un rechargement complet
        // Cela permet au nouveau contexte de lire le token depuis localStorage
        window.location.href = "/apprenant/suivi";
      } else {
        setError(data.error || "Code invalide");
        setCode(["", "", "", "", "", ""]);
        codeInputRefs.current[0]?.focus();
        setLoading(false);
      }
    } catch {
      setError("Erreur lors de la vérification");
      setLoading(false);
    }
  };

  // Resend code
  const handleResendCode = () => {
    if (resendCooldown > 0) return;
    handleSendCode();
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("apprenant_token");
    setToken(null);
    setApprenant(null);
    setOrganization(null);
    setInscriptions([]);
    setStep("email");
    setEmail("");
    setCode(["", "", "", "", "", ""]);
    setError(null);
    setSuccessMessage(null);
    setDevCode(null);
  };

  // Go back to email step
  const handleBackToEmail = () => {
    setStep("email");
    setError(null);
    setSuccessMessage(null);
    setCode(["", "", "", "", "", ""]);
    setDevCode(null);
  };

  // Loading state initial
  if (loading && step === "email" && !error) {
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
  // EMAIL STEP
  // =====================================

  if (step === "email") {
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
            <form onSubmit={handleSendCode} className="space-y-6">
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
                    autoFocus
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600"
                  >
                    <AlertCircle size={18} />
                    <p className="text-sm">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    Recevoir un code de connexion
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
  // CODE VERIFICATION STEP
  // =====================================

  if (step === "code") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
              <KeyRound className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Vérification</h1>
            <p className="text-gray-600 mt-2">
              Entrez le code à 6 chiffres envoyé à
            </p>
            <p className="text-indigo-600 font-medium">{email}</p>
          </div>

          {/* Code Form */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="space-y-6">
              {/* Success message */}
              <AnimatePresence mode="wait">
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-green-600"
                  >
                    <CheckCircle size={18} />
                    <p className="text-sm">{successMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dev code display */}
              {devCode && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-xs text-amber-600 mb-1">Mode développement - Code :</p>
                  <p className="text-2xl font-mono font-bold text-amber-700 tracking-widest text-center">
                    {devCode}
                  </p>
                </div>
              )}

              {/* Code inputs */}
              <div className="flex justify-center gap-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { codeInputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    onPaste={handleCodePaste}
                    className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    disabled={loading}
                  />
                ))}
              </div>

              {/* Error message */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600"
                  >
                    <AlertCircle size={18} />
                    <p className="text-sm">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading indicator */}
              {loading && (
                <div className="flex items-center justify-center gap-2 text-indigo-600">
                  <Loader2 size={18} className="animate-spin" />
                  <p className="text-sm">Vérification...</p>
                </div>
              )}

              {/* Resend code */}
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">
                  Vous n&apos;avez pas reçu le code ?
                </p>
                <button
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || loading}
                  className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw size={16} className={resendCooldown > 0 ? "" : "group-hover:rotate-180 transition-transform"} />
                  {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : "Renvoyer le code"}
                </button>
              </div>

              {/* Back button */}
              <button
                onClick={handleBackToEmail}
                className="w-full flex items-center justify-center gap-2 py-3 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={18} />
                Modifier l&apos;email
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Le code expire dans 10 minutes
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

// Composant wrapper avec Suspense pour useSearchParams
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Chargement...</p>
      </div>
    </div>
  );
}

export default function ApprenantPortal() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ApprenantPortalContent />
    </Suspense>
  );
}
