"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useAutomate } from "@/context/AutomateContext";

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const WelcomeCard: React.FC = () => {
  const { user } = useAutomate();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 overflow-hidden rounded-full border-2 border-gray-100 dark:border-gray-700 ring-2 ring-transparent hover:ring-brand-100 dark:hover:ring-brand-500/20 transition-all">
            <Image
              src="/images/user/photo costume carré.jpg"
              alt={user.prenom}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Bonjour {user.prenom},
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Prêt à créer une nouvelle formation ?
            </p>
          </div>
        </div>
        <Link
          href="/automate/create"
          className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm hover:shadow-md"
        >
          <PlusIcon />
          Créer une formation
        </Link>
      </div>
    </div>
  );
};

export default WelcomeCard;
