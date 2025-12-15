"use client";

import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

export default function SignUpPage() {
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
            Rejoignez Automate
          </h1>
          <p className="text-white/80 text-lg mb-8">
            Créez votre compte et commencez à générer vos formations
            professionnelles en quelques minutes.
          </p>

          {/* Avantages */}
          <div className="text-left space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-white/90">
                Fiches pédagogiques générées par l'IA
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-white/90">
                Présentations et supports automatisés
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-white/90">
                Documents administratifs conformes Qualiopi
              </p>
            </div>
          </div>
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

          <SignUp
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
