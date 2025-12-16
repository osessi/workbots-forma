"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import UserAvatar from "@/components/ui/avatar/UserAvatar";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState, useRef } from "react";

// Types
interface TeamMember {
  email: string;
  role: "admin" | "formateur" | "membre";
}

interface WizardData {
  // Step 1: Account
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  telephone: string;
  avatarFile: File | null;
  avatarPreview: string | null;
  // Step 2: Workspace / Entreprise
  workspaceName: string;
  workspaceSlug: string;
  siret: string;
  numeroFormateur: string;
  adresse: string;
  codePostal: string;
  ville: string;
  logoFile: File | null;
  logoPreview: string | null;
  // Step 3: Invitations
  teamMembers: TeamMember[];
}

// Steps indicator
const steps = [
  { id: 1, name: "Compte", description: "Vos informations" },
  { id: 2, name: "Entreprise", description: "Votre organisation" },
  { id: 3, name: "Équipe", description: "Inviter des membres" },
];

export default function SignUpWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Form data
  const [data, setData] = useState<WizardData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    telephone: "",
    avatarFile: null,
    avatarPreview: null,
    workspaceName: "",
    workspaceSlug: "",
    siret: "",
    numeroFormateur: "",
    adresse: "",
    codePostal: "",
    ville: "",
    logoFile: null,
    logoPreview: null,
    teamMembers: [{ email: "", role: "formateur" }],
  });

  // Update data helper
  const updateData = (updates: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  // Handle avatar selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Veuillez sélectionner une image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      updateData({
        avatarFile: file,
        avatarPreview: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle logo selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Veuillez sélectionner une image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      updateData({
        logoFile: file,
        logoPreview: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  // Generate slug from workspace name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50);
  };

  // Handle workspace name change
  const handleWorkspaceNameChange = (name: string) => {
    updateData({
      workspaceName: name,
      workspaceSlug: generateSlug(name),
    });
  };

  // Add team member field
  const addTeamMember = () => {
    if (data.teamMembers.length < 10) {
      updateData({ teamMembers: [...data.teamMembers, { email: "", role: "formateur" }] });
    }
  };

  // Remove team member field
  const removeTeamMember = (index: number) => {
    const newMembers = data.teamMembers.filter((_, i) => i !== index);
    updateData({ teamMembers: newMembers.length > 0 ? newMembers : [{ email: "", role: "formateur" }] });
  };

  // Update team member email
  const updateTeamMemberEmail = (index: number, email: string) => {
    const newMembers = [...data.teamMembers];
    newMembers[index] = { ...newMembers[index], email };
    updateData({ teamMembers: newMembers });
  };

  // Update team member role
  const updateTeamMemberRole = (index: number, role: "admin" | "formateur" | "membre") => {
    const newMembers = [...data.teamMembers];
    newMembers[index] = { ...newMembers[index], role };
    updateData({ teamMembers: newMembers });
  };

  // Validate current step
  const validateStep = (): boolean => {
    setError(null);

    if (currentStep === 1) {
      if (!data.firstName.trim()) {
        setError("Le prénom est requis");
        return false;
      }
      if (!data.lastName.trim()) {
        setError("Le nom est requis");
        return false;
      }
      if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        setError("Email invalide");
        return false;
      }
      if (data.password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères");
        return false;
      }
      if (!isChecked) {
        setError("Vous devez accepter les conditions d'utilisation");
        return false;
      }
    }

    if (currentStep === 2) {
      if (!data.workspaceName.trim()) {
        setError("Le nom du workspace est requis");
        return false;
      }
      if (!data.workspaceSlug.trim()) {
        setError("L'identifiant du workspace est requis");
        return false;
      }
    }

    return true;
  };

  // Go to next step
  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  // Go to previous step
  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError(null);
  };

  // Final submission
  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();

      // 1. Create account avec TOUTES les infos
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          data: {
            // Infos personnelles
            first_name: data.firstName,
            last_name: data.lastName,
            full_name: `${data.firstName} ${data.lastName}`,
            phone: data.telephone,
            // Infos entreprise/workspace
            workspace_name: data.workspaceName,
            workspace_slug: data.workspaceSlug,
            siret: data.siret,
            numero_formateur: data.numeroFormateur,
            adresse: data.adresse,
            code_postal: data.codePostal,
            ville: data.ville,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (authData.user) {
        // Si confirmation email requise
        if (authData.user.identities?.length === 0) {
          setError("Un compte existe déjà avec cet email");
          return;
        }

        // Si l'email doit être confirmé
        if (!authData.session) {
          setSuccess(true);
        } else {
          // Connexion automatique si pas de confirmation requise
          // Synchroniser l'utilisateur avec Prisma
          await fetch("/api/user/sync", { method: "POST" });

          // Upload avatar si sélectionné
          if (data.avatarFile) {
            const formData = new FormData();
            formData.append("file", data.avatarFile);
            formData.append("type", "avatar");
            await fetch("/api/user/avatar", {
              method: "POST",
              body: formData,
            });
          }

          // Upload logo si sélectionné
          if (data.logoFile) {
            const formData = new FormData();
            formData.append("file", data.logoFile);
            formData.append("type", "logo");
            await fetch("/api/user/avatar", {
              method: "POST",
              body: formData,
            });
          }

          router.push("/automate");
          router.refresh();
        }
      }
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // OAuth Sign Up
  const handleOAuthSignUp = async (provider: "google" | "azure" | "linkedin_oidc") => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?wizard=true`,
        },
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
      }
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  // Success message
  if (success) {
    return (
      <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-4">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center dark:bg-green-900/30">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Vérifiez votre email
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Nous avons envoyé un lien de confirmation à <strong>{data.email}</strong>.
              Cliquez sur le lien pour activer votre compte.
            </p>
            <Link
              href="/signin"
              className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="w-full max-w-md sm:pt-6 mx-auto mb-5 px-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Retour
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-4">
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

        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      currentStep >= step.id
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${currentStep >= step.id ? "text-brand-500" : "text-gray-400"}`}>
                      {step.name}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.id ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Step 1: Account */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="mb-4">
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                Créer votre compte
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Commencez par vos informations personnelles
              </p>
            </div>

            {/* OAuth Providers */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleOAuthSignUp("google")}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 py-2.5 text-sm font-normal text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10 disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z" fill="#4285F4"/>
                  <path d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z" fill="#34A853"/>
                  <path d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z" fill="#FBBC05"/>
                  <path d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z" fill="#EB4335"/>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleOAuthSignUp("azure")}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 py-2.5 text-sm font-normal text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10 disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleOAuthSignUp("linkedin_oidc")}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 py-2.5 text-sm font-normal text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10 disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M17.0392 17.0392H14.0775V12.4025C14.0775 11.2967 14.055 9.87167 12.5358 9.87167C10.9933 9.87167 10.7567 11.0775 10.7567 12.3208V17.0392H7.795V7.49667H10.6383V8.80167H10.6775C11.0733 8.05 12.04 7.25917 13.4842 7.25917C16.4858 7.25917 17.04 9.23583 17.04 11.8058V17.0392H17.0392ZM4.4475 6.19083C3.49417 6.19083 2.7275 5.41833 2.7275 4.47C2.7275 3.5225 3.495 2.75083 4.4475 2.75083C5.3975 2.75083 6.1675 3.5225 6.1675 4.47C6.1675 5.41833 5.39667 6.19083 4.4475 6.19083ZM5.93167 17.0392H2.96333V7.49667H5.93167V17.0392ZM18.5208 0H1.47583C0.66 0 0 0.645 0 1.44083V18.5592C0 19.3558 0.66 20 1.47583 20H18.5183C19.3333 20 20 19.3558 20 18.5592V1.44083C20 0.645 19.3333 0 18.5183 0H18.5208Z" fill="#0A66C2"/>
                </svg>
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-900 text-gray-400">ou</span>
              </div>
            </div>

            {/* Avatar upload */}
            <div className="flex flex-col items-center">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="relative group"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-700 transition-all group-hover:border-brand-200 dark:group-hover:border-brand-500/30">
                  {data.avatarPreview ? (
                    <Image
                      src={data.avatarPreview}
                      alt="Avatar preview"
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <UserAvatar
                      seed={data.email || "new-user"}
                      size="xxlarge"
                      className="w-full h-full"
                    />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 p-1.5 bg-brand-500 text-white rounded-full">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </button>
              <p className="mt-2 text-xs text-gray-400">Photo de profil (optionnel)</p>
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prénom<span className="text-error-500">*</span></Label>
                <Input
                  type="text"
                  placeholder="Jean"
                  value={data.firstName}
                  onChange={(e) => updateData({ firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Nom<span className="text-error-500">*</span></Label>
                <Input
                  type="text"
                  placeholder="Dupont"
                  value={data.lastName}
                  onChange={(e) => updateData({ lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Email<span className="text-error-500">*</span></Label>
              <Input
                type="email"
                placeholder="votre@email.com"
                value={data.email}
                onChange={(e) => updateData({ email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Mot de passe<span className="text-error-500">*</span></Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 6 caractères"
                  value={data.password}
                  onChange={(e) => updateData({ password: e.target.value })}
                  required
                  minLength={6}
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

            <div className="flex items-start gap-3">
              <Checkbox
                className="w-5 h-5 mt-0.5"
                checked={isChecked}
                onChange={setIsChecked}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                J&apos;accepte les{" "}
                <Link href="/terms" className="text-brand-500 hover:underline">
                  Conditions d&apos;utilisation
                </Link>{" "}
                et la{" "}
                <Link href="/privacy" className="text-brand-500 hover:underline">
                  Politique de confidentialité
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Entreprise */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="mb-4">
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                Votre entreprise
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ces informations apparaîtront sur vos documents de formation
              </p>
            </div>

            {/* Nom de l'entreprise et identifiant */}
            <div>
              <Label>Nom de l&apos;entreprise<span className="text-error-500">*</span></Label>
              <Input
                type="text"
                placeholder="Ma Formation Pro SARL"
                value={data.workspaceName}
                onChange={(e) => handleWorkspaceNameChange(e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Identifiant du workspace<span className="text-error-500">*</span></Label>
              <div className="flex items-center">
                <span className="px-3 py-2.5 text-sm text-gray-500 bg-gray-100 border border-r-0 border-gray-200 rounded-l-lg dark:bg-gray-800 dark:border-gray-700">
                  workbots.io/
                </span>
                <Input
                  type="text"
                  placeholder="ma-formation"
                  value={data.workspaceSlug}
                  onChange={(e) => updateData({ workspaceSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  className="rounded-l-none"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Cet identifiant sera utilisé dans l&apos;URL de votre workspace
              </p>
            </div>

            {/* SIRET et Numéro formateur */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Numéro SIRET</Label>
                <Input
                  type="text"
                  placeholder="123 456 789 00012"
                  value={data.siret}
                  onChange={(e) => updateData({ siret: e.target.value })}
                />
              </div>
              <div>
                <Label>N° déclaration d&apos;activité</Label>
                <Input
                  type="text"
                  placeholder="11 75 12345 67"
                  value={data.numeroFormateur}
                  onChange={(e) => updateData({ numeroFormateur: e.target.value })}
                />
                <p className="mt-1 text-xs text-gray-400">N° DREETS</p>
              </div>
            </div>

            {/* Adresse */}
            <div>
              <Label>Adresse</Label>
              <Input
                type="text"
                placeholder="15 rue de la Formation"
                value={data.adresse}
                onChange={(e) => updateData({ adresse: e.target.value })}
              />
            </div>

            {/* Code postal et Ville */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Code postal</Label>
                <Input
                  type="text"
                  placeholder="75001"
                  value={data.codePostal}
                  onChange={(e) => updateData({ codePostal: e.target.value })}
                />
              </div>
              <div>
                <Label>Ville</Label>
                <Input
                  type="text"
                  placeholder="Paris"
                  value={data.ville}
                  onChange={(e) => updateData({ ville: e.target.value })}
                />
              </div>
            </div>

            {/* Logo entreprise */}
            <div>
              <Label>Logo de l&apos;entreprise</Label>
              <div className="flex items-center gap-4 mt-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="relative group"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800 transition-all group-hover:border-brand-300 group-hover:bg-brand-50/50 dark:group-hover:bg-brand-500/10">
                    {data.logoPreview ? (
                      <Image
                        src={data.logoPreview}
                        alt="Logo preview"
                        width={80}
                        height={80}
                        className="object-contain w-full h-full p-1"
                      />
                    ) : (
                      <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-1 bg-brand-500 text-white rounded-full">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </button>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ce logo apparaîtra sur vos documents de formation
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG jusqu&apos;à 5MB</p>
                </div>
              </div>
            </div>

            {/* Info box */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-300">Bon à savoir :</span> Vous pourrez modifier ces informations à tout moment dans les paramètres de votre compte.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Invitations */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="mb-4">
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                Inviter votre équipe
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Invitez des collaborateurs à rejoindre votre workspace
              </p>
            </div>

            {/* Rôles description */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Rôles disponibles :</p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <li><span className="font-medium">Admin</span> - Accès complet, gestion des membres</li>
                <li><span className="font-medium">Formateur</span> - Créer et gérer ses formations</li>
                <li><span className="font-medium">Membre</span> - Consulter les formations</li>
              </ul>
            </div>

            <div className="space-y-3">
              {data.teamMembers.map((member, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="collegue@email.com"
                      value={member.email}
                      onChange={(e) => updateTeamMemberEmail(index, e.target.value)}
                    />
                  </div>
                  <select
                    value={member.role}
                    onChange={(e) => updateTeamMemberRole(index, e.target.value as "admin" | "formateur" | "membre")}
                    className="h-11 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="formateur">Formateur</option>
                    <option value="admin">Admin</option>
                    <option value="membre">Membre</option>
                  </select>
                  {data.teamMembers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTeamMember(index)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {data.teamMembers.length < 10 && (
              <button
                type="button"
                onClick={addTeamMember}
                className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter un membre
              </button>
            )}

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Les personnes invitées recevront un email avec un lien pour créer leur compte et rejoindre votre workspace.
              </p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 mb-6">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              Retour
            </button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors"
            >
              Continuer
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Passer
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-6 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Création..." : "Créer mon compte"}
              </button>
            </div>
          )}
        </div>

        <div className="text-center pb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vous avez déjà un compte ?{" "}
            <Link href="/signin" className="text-brand-500 hover:text-brand-600">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
