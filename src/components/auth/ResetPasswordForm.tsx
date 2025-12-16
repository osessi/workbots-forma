"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<"request" | "reset">("request");

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Vérifier si on est en mode reset (avec token dans l'URL)
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setMode("reset");
    }
  }, [searchParams]);

  // Demande de réinitialisation (envoi email)
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // Réinitialisation du mot de passe
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
      // Rediriger vers la page de connexion après 2 secondes
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // Message de succès pour la demande de réinitialisation
  if (success && mode === "request") {
    return (
      <div className="flex flex-col flex-1 lg:w-1/2 w-full">
        <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
          <Link
            href="/signin"
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeftIcon />
            Retour à la connexion
          </Link>
        </div>
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          {/* Logo mobile */}
          <div className="flex justify-center mb-6 lg:hidden">
            <Image
              src="/images/logo/logo-automate-lightmode.svg"
              alt="Automate Forma"
              width={180}
              height={40}
              className="dark:hidden"
            />
            <Image
              src="/images/logo/logo-automate-darkmode.svg"
              alt="Automate Forma"
              width={180}
              height={40}
              className="hidden dark:block"
            />
          </div>
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-success-50 dark:bg-success-500/10 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Email envoyé !
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Si un compte existe avec l&apos;adresse <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>, vous recevrez un email avec un lien pour réinitialiser votre mot de passe.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Vous n&apos;avez pas reçu l&apos;email ?{" "}
              <button
                onClick={() => setSuccess(false)}
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Renvoyer
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Message de succès pour la réinitialisation du mot de passe
  if (success && mode === "reset") {
    return (
      <div className="flex flex-col flex-1 lg:w-1/2 w-full">
        <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
          <Link
            href="/signin"
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeftIcon />
            Retour à la connexion
          </Link>
        </div>
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          {/* Logo mobile */}
          <div className="flex justify-center mb-6 lg:hidden">
            <Image
              src="/images/logo/logo-automate-lightmode.svg"
              alt="Automate Forma"
              width={180}
              height={40}
              className="dark:hidden"
            />
            <Image
              src="/images/logo/logo-automate-darkmode.svg"
              alt="Automate Forma"
              width={180}
              height={40}
              className="hidden dark:block"
            />
          </div>
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-success-50 dark:bg-success-500/10 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Mot de passe modifié !
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Retour à la connexion
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          {/* Logo mobile */}
          <div className="flex justify-center mb-6 lg:hidden">
            <Image
              src="/images/logo/logo-automate-lightmode.svg"
              alt="Automate Forma"
              width={180}
              height={40}
              className="dark:hidden"
            />
            <Image
              src="/images/logo/logo-automate-darkmode.svg"
              alt="Automate Forma"
              width={180}
              height={40}
              className="hidden dark:block"
            />
          </div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {mode === "request" ? "Mot de passe oublié ?" : "Nouveau mot de passe"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {mode === "request"
                ? "Entrez votre adresse email pour recevoir un lien de réinitialisation."
                : "Choisissez un nouveau mot de passe sécurisé pour votre compte."}
            </p>
          </div>
          <div>
            {/* Message d'erreur */}
            {error && (
              <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                {error}
              </div>
            )}

            {mode === "request" ? (
              <form onSubmit={handleRequestReset}>
                <div className="space-y-6">
                  <div>
                    <Label>
                      Email <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      placeholder="votre@email.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Button className="w-full" size="sm" disabled={isLoading}>
                      {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div className="space-y-6">
                  <div>
                    <Label>
                      Nouveau mot de passe <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimum 8 caractères"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                        {showPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                        )}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label>
                      Confirmer le mot de passe <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Retapez votre mot de passe"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <span
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                        {showConfirmPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                        )}
                      </span>
                    </div>
                  </div>
                  {/* Password requirements */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Le mot de passe doit contenir :
                    </p>
                    <ul className="text-xs space-y-1">
                      <li className={`flex items-center gap-2 ${password.length >= 8 ? "text-success-500" : "text-gray-400"}`}>
                        {password.length >= 8 ? (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" strokeWidth={2} />
                          </svg>
                        )}
                        Au moins 8 caractères
                      </li>
                      <li className={`flex items-center gap-2 ${password === confirmPassword && password.length > 0 ? "text-success-500" : "text-gray-400"}`}>
                        {password === confirmPassword && password.length > 0 ? (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" strokeWidth={2} />
                          </svg>
                        )}
                        Les mots de passe correspondent
                      </li>
                    </ul>
                  </div>
                  <div>
                    <Button className="w-full" size="sm" disabled={isLoading}>
                      {isLoading ? "Modification en cours..." : "Modifier le mot de passe"}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Vous vous souvenez de votre mot de passe ?{" "}
                <Link
                  href="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordForm() {
  return (
    <Suspense fallback={
      <div className="flex flex-col flex-1 lg:w-1/2 w-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    }>
      <ResetPasswordFormContent />
    </Suspense>
  );
}
