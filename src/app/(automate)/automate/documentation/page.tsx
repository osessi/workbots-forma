"use client";
import React, { useState } from "react";
import Link from "next/link";

// Icons
const BookOpenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 4.16667C2.5 3.24619 3.24619 2.5 4.16667 2.5H6.66667C7.99239 2.5 9.16667 3.67428 9.16667 5V16.6667C9.16667 15.7462 8.42047 15 7.5 15H2.5V4.16667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.5 4.16667C17.5 3.24619 16.7538 2.5 15.8333 2.5H13.3333C12.0076 2.5 10.8333 3.67428 10.8333 5V16.6667C10.8333 15.7462 11.5795 15 12.5 15H17.5V4.16667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RocketIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.6667 8.33333C12.1269 8.33333 12.5 7.96024 12.5 7.5C12.5 7.03976 12.1269 6.66667 11.6667 6.66667C11.2064 6.66667 10.8333 7.03976 10.8333 7.5C10.8333 7.96024 11.2064 8.33333 11.6667 8.33333Z" fill="currentColor"/>
    <path d="M14.1667 2.5C14.1667 2.5 15.8333 2.5 17.5 4.16667C17.5 4.16667 17.5 5.83333 15.8333 7.5L12.9167 10.4167M5.83333 14.1667L2.5 17.5M7.5 11.6667C6.66667 10.8333 5.83333 10.8333 4.58333 11.25C3.33333 11.6667 2.5 12.0833 2.5 12.0833L7.08333 12.9167L7.5 11.6667ZM8.33333 12.5C9.16667 13.3333 9.16667 14.1667 8.75 15.4167C8.33333 16.6667 7.91667 17.5 7.91667 17.5L7.08333 12.9167L8.33333 12.5ZM2.5 17.5C5.41667 15 7.91667 12.9167 10 12.0833C12.0833 11.25 15 10 17.5 4.16667C17.5 4.16667 12.5 6.66667 11.6667 8.75C10.8333 10.8333 8.75 13.3333 6.25 16.25L2.5 17.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.6667 17.5V15.8333C16.6667 14.9493 16.3155 14.1014 15.6904 13.4763C15.0652 12.8512 14.2174 12.5 13.3333 12.5H6.66667C5.78261 12.5 4.93476 12.8512 4.30964 13.4763C3.68452 14.1014 3.33333 14.9493 3.33333 15.8333V17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 9.16667C11.8409 9.16667 13.3333 7.67428 13.3333 5.83333C13.3333 3.99238 11.8409 2.5 10 2.5C8.15905 2.5 6.66667 3.99238 6.66667 5.83333C6.66667 7.67428 8.15905 9.16667 10 9.16667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChecklistIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.6667 5L7.5 14.1667L3.33333 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AutomateIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 3.33333V6.66667M10 13.3333V16.6667M3.33333 10H6.66667M13.3333 10H16.6667M5.16667 5.16667L7.35417 7.35417M12.6458 12.6458L14.8333 14.8333M14.8333 5.16667L12.6458 7.35417M7.35417 12.6458L5.16667 14.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M9.16667 3.33333C5.94501 3.33333 3.33333 5.94501 3.33333 9.16667C3.33333 12.3883 5.94501 15 9.16667 15C12.3883 15 15 12.3883 15 9.16667C15 5.94501 12.3883 3.33333 9.16667 3.33333ZM1.66667 9.16667C1.66667 5.02453 5.02453 1.66667 9.16667 1.66667C13.3088 1.66667 16.6667 5.02453 16.6667 9.16667C16.6667 10.9378 16.0528 12.5654 15.0274 13.8565L18.0893 16.9107C18.4147 17.2362 18.4147 17.7638 18.0893 18.0893C17.7638 18.4147 17.2362 18.4147 16.9107 18.0893L13.8565 15.0274C12.5654 16.0528 10.9378 16.6667 9.16667 16.6667C5.02453 16.6667 1.66667 13.3088 1.66667 9.16667Z" fill="currentColor"/>
  </svg>
);

interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
}

const sections: DocSection[] = [
  {
    id: "demarrage",
    title: "🚀 Démarrage rapide",
    description: "Créez votre compte et lancez votre première formation en 10 minutes",
    icon: <RocketIcon />,
    href: "/automate/documentation/demarrage",
    badge: "Commencer ici"
  },
  {
    id: "dashboard-admin",
    title: "👨‍💼 Dashboard Admin",
    description: "Guide complet de l'interface administrateur : formations, sessions, apprenants, CRM, Qualiopi",
    icon: <BookOpenIcon />,
    href: "/automate/documentation/dashboard-admin"
  },
  {
    id: "dashboard-intervenant",
    title: "👨‍🏫 Dashboard Intervenant",
    description: "Interface formateur : programme, émargements, documents, évaluations",
    icon: <UserIcon />,
    href: "/automate/documentation/dashboard-intervenant"
  },
  {
    id: "qualiopi",
    title: "✅ Conformité Qualiopi",
    description: "Préparez votre certification avec les 32 indicateurs, preuves et assistant IA",
    icon: <ChecklistIcon />,
    href: "/automate/documentation/qualiopi"
  },
  {
    id: "automatisations",
    title: "🤖 Automatisations",
    description: "Créez des workflows intelligents pour automatiser vos tâches répétitives",
    icon: <AutomateIcon />,
    href: "/automate/documentation/automatisations"
  },
];

export default function DocumentationPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = sections.filter((section) =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* En-tête avec dégradé */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-brand-50 to-white p-8 dark:border-gray-800 dark:from-brand-950 dark:to-gray-900">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-brand-500 rounded-xl">
            <BookOpenIcon />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Documentation Automate
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
          Guides complets, tutoriels vidéo et bonnes pratiques pour maîtriser la plateforme
        </p>

        {/* Barre de recherche */}
        <div className="relative max-w-2xl">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Rechercher dans la documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 transition-all"
          />
        </div>
      </div>

      {/* Sections de documentation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSections.map((section) => (
          <Link
            key={section.id}
            href={section.href}
            className="group relative rounded-2xl border border-gray-200 bg-white p-6 hover:border-brand-300 hover:shadow-lg transition-all dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-600"
          >
            {section.badge && (
              <span className="absolute top-4 right-4 px-2.5 py-1 text-xs font-medium bg-brand-500 text-white rounded-full">
                {section.badge}
              </span>
            )}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-50 rounded-xl text-brand-600 group-hover:bg-brand-100 transition-colors dark:bg-brand-500/10 dark:text-brand-400">
                {section.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {section.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {section.description}
                </p>
                <div className="mt-4 flex items-center text-sm font-medium text-brand-600 dark:text-brand-400">
                  Consulter
                  <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredSections.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-gray-500 dark:text-gray-400">
            Aucun résultat pour "{searchQuery}"
          </p>
        </div>
      )}

      {/* Ressources supplémentaires */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ressources supplémentaires
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/automate/documentation/faq"
            className="p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all dark:border-gray-700 dark:hover:border-brand-600 dark:hover:bg-brand-500/5"
          >
            <div className="text-2xl mb-2">❓</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">FAQ</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Questions fréquentes et réponses
            </p>
          </a>
          <a
            href="https://www.youtube.com/@automate-forma"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all dark:border-gray-700 dark:hover:border-brand-600 dark:hover:bg-brand-500/5"
          >
            <div className="text-2xl mb-2">📹</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Tutoriels vidéo</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Guides visuels étape par étape
            </p>
          </a>
          <a
            href="mailto:support@automate.fr"
            className="p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all dark:border-gray-700 dark:hover:border-brand-600 dark:hover:bg-brand-500/5"
          >
            <div className="text-2xl mb-2">💬</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Support</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Contactez notre équipe d'aide
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
