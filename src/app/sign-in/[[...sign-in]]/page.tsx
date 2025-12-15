"use client";

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">
      {/* Colonne gauche - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-500 to-brand-700 flex-col justify-center items-center p-12">
        <div className="max-w-md text-center">
          <Image
            src="/images/logo/logo-automate-darkmode.svg"
            alt="Automate"
            width={280}
            height={80}
            className="mx-auto mb-8"
          />
          <h1 className="text-3xl font-bold text-white mb-4">
            Créez vos formations en quelques clics
          </h1>
          <p className="text-white/80 text-lg">
            La plateforme tout-en-un pour les organismes de formation.
            Générez fiches pédagogiques, supports et documents administratifs
            avec l'IA.
          </p>
        </div>
      </div>

      {/* Colonne droite - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden mb-8 text-center">
            <Image
              src="/images/logo/logo-automate-lightmode.svg"
              alt="Automate"
              width={200}
              height={60}
              className="mx-auto dark:hidden"
            />
            <Image
              src="/images/logo/logo-automate-darkmode.svg"
              alt="Automate"
              width={200}
              height={60}
              className="mx-auto hidden dark:block"
            />
          </div>

          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border border-gray-200 dark:border-gray-700 dark:bg-gray-800",
                headerTitle: "text-gray-900 dark:text-white",
                headerSubtitle: "text-gray-500 dark:text-gray-400",
                socialButtonsBlockButton:
                  "border-gray-200 dark:border-gray-600 dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600",
                socialButtonsBlockButtonText: "text-gray-700 dark:text-gray-200",
                dividerLine: "bg-gray-200 dark:bg-gray-600",
                dividerText: "text-gray-500 dark:text-gray-400",
                formFieldLabel: "text-gray-700 dark:text-gray-300",
                formFieldInput:
                  "border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-brand-500 focus:ring-brand-500",
                formButtonPrimary:
                  "bg-brand-500 hover:bg-brand-600 text-white",
                footerActionLink: "text-brand-500 hover:text-brand-600",
                identityPreviewEditButton: "text-brand-500",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
