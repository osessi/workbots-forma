"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApprenantPortal, ApprenantPortalProvider } from "@/context/ApprenantPortalContext";
import { useCustomDomainOrg, useApplyOrgColors } from "@/hooks/useCustomDomainOrg";

// =====================================
// LOGIN CONTENT
// =====================================

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: contextLoading } = useApprenantPortal();

  // Branding dynamique via domaine personnalisé
  const { organization: brandOrg, isCustomDomain, isLoading: brandLoading } = useCustomDomainOrg();
  useApplyOrgColors(brandOrg);

  // State
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  // Refs pour les inputs du code
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect si déjà connecté
  useEffect(() => {
    if (!contextLoading && isAuthenticated) {
      router.push("/apprenant");
    }
  }, [contextLoading, isAuthenticated, router]);

  // Check for magic link token in URL
  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      validateMagicToken(urlToken);
    }
  }, [searchParams]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Validate magic link token
  const validateMagicToken = async (magicToken: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/apprenant/verify-token?token=${magicToken}`);
      if (res.ok) {
        const data = await res.json();
        await login(data.token);
        router.push("/apprenant");
      } else {
        const data = await res.json();
        setError(data.error || "Lien invalide ou expiré");
      }
    } catch {
      setError("Erreur lors de la vérification du lien");
    } finally {
      setLoading(false);
    }
  };

  // Send OTP code
  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/apprenant/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep("code");
        setSuccessMessage("Code envoyé ! Vérifiez votre boîte mail.");
        setResendCooldown(60);

        // En dev, afficher le code
        if (data.devCode) {
          setDevCode(data.devCode);
        }

        // Focus premier input
        setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
      } else {
        setError(data.error || "Erreur lors de l'envoi du code");
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP code
  const verifyCode = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/apprenant/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: fullCode,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        await login(data.token);
        router.push("/apprenant");
      } else {
        setError(data.error || "Code invalide");
        setCode(["", "", "", "", "", ""]);
        codeInputRefs.current[0]?.focus();
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  // Handle code input change
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (newCode.join("").length === 6) {
      setTimeout(() => verifyCode(), 100);
    }
  };

  // Handle code paste
  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 6) {
      const newCode = pastedData.split("");
      setCode(newCode);
      codeInputRefs.current[5]?.focus();
      setTimeout(() => verifyCode(), 100);
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  // Couleur primaire (utiliser celle de l'organisation ou brand par défaut)
  const primaryColor = brandOrg?.primaryColor || "#4277FF";

  // Loading du branding
  if (brandLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header avec branding dynamique */}
          <div
            className="px-6 py-8 text-center"
            style={{
              background: isCustomDomain && brandOrg
                ? `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)`
                : "linear-gradient(to right, #4277FF, #3366ee)",
            }}
          >
            {/* Logo ou icône */}
            {isCustomDomain && brandOrg?.logo ? (
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 p-2 shadow-lg">
                <img
                  src={brandOrg.logo}
                  alt={brandOrg.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
            )}

            {/* Nom de l'organisation ou titre par défaut */}
            <h1 className="text-2xl font-bold text-white mb-1">
              {isCustomDomain && brandOrg ? brandOrg.name : "Espace Apprenant"}
            </h1>
            <p className="text-white/80 text-sm">
              {isCustomDomain && brandOrg
                ? "Espace Apprenant"
                : "Connectez-vous pour accéder à vos formations"}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* STEP 1: Email */}
              {step === "email" && (
                <motion.form
                  key="email"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={sendCode}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Adresse email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                        autoFocus
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium rounded-xl transition-colors"
                    style={{
                      backgroundColor: loading || !email.trim() ? undefined : primaryColor,
                    }}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Recevoir un code
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </motion.form>
              )}

              {/* STEP 2: Code OTP */}
              {step === "code" && (
                <motion.div
                  key="code"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {/* Back button */}
                  <button
                    onClick={() => {
                      setStep("email");
                      setCode(["", "", "", "", "", ""]);
                      setError(null);
                      setDevCode(null);
                    }}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Modifier l&apos;email
                  </button>

                  <div className="text-center">
                    <div className="w-12 h-12 bg-brand-100 dark:bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <KeyRound className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Code envoyé à <span className="font-medium">{email}</span>
                    </p>
                  </div>

                  {/* Success message */}
                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl text-green-600 dark:text-green-400 text-sm"
                    >
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      {successMessage}
                    </motion.div>
                  )}

                  {/* Dev code (only in development) */}
                  {devCode && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-center">
                      <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">
                        Mode développement - Code :
                      </p>
                      <p className="font-mono text-lg font-bold text-amber-700 dark:text-amber-300">
                        {devCode}
                      </p>
                    </div>
                  )}

                  {/* Code inputs */}
                  <div className="flex justify-center gap-2">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          codeInputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handleCodePaste}
                        className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                        disabled={loading}
                      />
                    ))}
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  {/* Resend button */}
                  <div className="text-center">
                    {resendCooldown > 0 ? (
                      <p className="text-sm text-gray-500">
                        Renvoyer dans {resendCooldown}s
                      </p>
                    ) : (
                      <button
                        onClick={() => sendCode()}
                        disabled={loading}
                        className="text-sm text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 mx-auto"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Renvoyer le code
                      </button>
                    )}
                  </div>

                  {loading && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {isCustomDomain && brandOrg ? (
            <>
              <p className="mb-1">Vous n&apos;avez pas de compte ?</p>
              {brandOrg.contact.email && (
                <p className="text-gray-600 dark:text-gray-300">
                  Contactez-nous : {brandOrg.contact.email}
                </p>
              )}
              {brandOrg.contact.phone && (
                <p className="text-gray-600 dark:text-gray-300">
                  Tél : {brandOrg.contact.phone}
                </p>
              )}
            </>
          ) : (
            <p>
              Vous n&apos;avez pas de compte ?{" "}
              <span className="text-gray-600 dark:text-gray-300">
                Contactez votre organisme de formation.
              </span>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// =====================================
// PAGE WRAPPER
// =====================================

function LoginContentWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

export default function ApprenantLoginPage() {
  return (
    <ApprenantPortalProvider>
      <LoginContentWithSuspense />
    </ApprenantPortalProvider>
  );
}
