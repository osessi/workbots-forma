"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

interface InvitationData {
  id: string;
  email: string;
  role: string;
  organizationName: string;
  organizationLogo: string | null;
  expiresAt: string;
}

interface AcceptInviteFormProps {
  token: string;
}

export default function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");

  // Vérifier l'invitation au chargement
  useEffect(() => {
    const verifyInvitation = async () => {
      try {
        const response = await fetch(`/api/organization/invitations/verify?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Invitation invalide ou expirée");
          setIsLoading(false);
          return;
        }

        setInvitation(data.invitation);

        // Vérifier si l'utilisateur a déjà un compte
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setHasAccount(true);
        }
      } catch (err) {
        setError("Erreur lors de la vérification de l'invitation");
      } finally {
        setIsLoading(false);
      }
    };

    verifyInvitation();
  }, [token]);

  // Accepter l'invitation (utilisateur existant)
  const handleAcceptWithExistingAccount = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/organization/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur lors de l'acceptation");
        return;
      }

      router.push("/automate");
      router.refresh();
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Créer un compte et accepter l'invitation
  const handleCreateAccountAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!invitation) return;

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();

      // Créer le compte
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            invitation_token: token,
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/automate`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.user) {
        // Accepter l'invitation
        const response = await fetch("/api/organization/invitations/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const respData = await response.json();
          setError(respData.error || "Erreur lors de l'acceptation");
          return;
        }

        // Synchroniser avec Prisma
        await fetch("/api/user/sync", { method: "POST" });

        router.push("/automate");
        router.refresh();
      }
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 lg:w-1/2 w-full items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Vérification de l&apos;invitation...</p>
      </div>
    );
  }

  // Error state (invalid or expired invitation)
  if (error && !invitation) {
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
            <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Invitation invalide
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {error}
            </p>
            <Link
              href="/signin"
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Invitation found - show accept form
  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Retour
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

          {/* Organization info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
            {invitation?.organizationLogo ? (
              <Image
                src={invitation.organizationLogo}
                alt={invitation.organizationName}
                width={64}
                height={64}
                className="mx-auto mb-3 rounded-lg object-contain"
              />
            ) : (
              <div className="mx-auto w-16 h-16 bg-brand-100 dark:bg-brand-500/20 rounded-lg flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                  {invitation?.organizationName.charAt(0)}
                </span>
              </div>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Vous avez été invité(e) à rejoindre
            </p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {invitation?.organizationName}
            </p>
            <span className="inline-flex mt-2 px-2.5 py-1 text-xs font-medium rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
              {invitation?.role === "ORG_ADMIN" ? "Administrateur" : "Formateur"}
            </span>
          </div>

          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {hasAccount ? "Rejoindre l'organisation" : "Créer votre compte"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {hasAccount
                ? "Vous êtes déjà connecté(e). Cliquez pour accepter l'invitation."
                : `Créez votre compte avec l'email ${invitation?.email}`}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          {hasAccount ? (
            // User already has an account - just accept
            <div>
              <Button
                className="w-full"
                size="sm"
                onClick={handleAcceptWithExistingAccount}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Acceptation en cours..." : "Accepter l'invitation"}
              </Button>
            </div>
          ) : (
            // User needs to create an account
            <form onSubmit={handleCreateAccountAndAccept}>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>
                      Prénom <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      placeholder="Jean"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label>
                      Nom <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      placeholder="Dupont"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={invitation?.email || ""}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                  />
                </div>
                <div>
                  <Label>
                    Mot de passe <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 8 caractères"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
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
                  <Button className="w-full" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? "Création en cours..." : "Créer mon compte et rejoindre"}
                  </Button>
                </div>
              </div>
            </form>
          )}

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Vous avez déjà un compte ?{" "}
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
  );
}
