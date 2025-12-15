"use client";
import React, { useState } from "react";

// Icons
const ChevronDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M9.16667 3.33333C5.94501 3.33333 3.33333 5.94501 3.33333 9.16667C3.33333 12.3883 5.94501 15 9.16667 15C12.3883 15 15 12.3883 15 9.16667C15 5.94501 12.3883 3.33333 9.16667 3.33333ZM1.66667 9.16667C1.66667 5.02453 5.02453 1.66667 9.16667 1.66667C13.3088 1.66667 16.6667 5.02453 16.6667 9.16667C16.6667 10.9378 16.0528 12.5654 15.0274 13.8565L18.0893 16.9107C18.4147 17.2362 18.4147 17.7638 18.0893 18.0893C17.7638 18.4147 17.2362 18.4147 16.9107 18.0893L13.8565 15.0274C12.5654 16.0528 10.9378 16.6667 9.16667 16.6667C5.02453 16.6667 1.66667 13.3088 1.66667 9.16667Z" fill="currentColor"/>
  </svg>
);

const MessageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqItems: FAQItem[] = [
  // Général
  {
    id: "1",
    category: "general",
    question: "Qu'est-ce qu'Automate ?",
    answer: "Automate est une plateforme SaaS qui permet aux formateurs de générer automatiquement leurs contenus pédagogiques grâce à l'intelligence artificielle. En quelques clics, vous pouvez créer des fiches pédagogiques, des présentations PowerPoint, des supports apprenants, des évaluations et des documents administratifs.",
  },
  {
    id: "2",
    category: "general",
    question: "Comment fonctionne la génération de contenus ?",
    answer: "Vous décrivez votre formation (sujet, durée, public cible, objectifs) et notre IA génère automatiquement une fiche pédagogique complète. Ensuite, vous pouvez générer les slides, les supports et les évaluations module par module. Tous les contenus sont éditables et personnalisables.",
  },
  {
    id: "3",
    category: "general",
    question: "L'IA peut-elle remplacer un formateur ?",
    answer: "Non, Automate est un outil d'assistance. L'IA génère une base de travail que vous pouvez ensuite personnaliser selon votre expertise et votre pédagogie. Vous gardez le contrôle total sur le contenu final.",
  },

  // Fonctionnalités
  {
    id: "4",
    category: "features",
    question: "Quels types de documents puis-je générer ?",
    answer: "Vous pouvez générer : des fiches pédagogiques complètes, des présentations PowerPoint, des supports apprenants (PDF), des tests de positionnement, des évaluations finales, des QCM par module, des conventions de formation et des contrats de formation.",
  },
  {
    id: "5",
    category: "features",
    question: "Puis-je modifier les contenus générés ?",
    answer: "Oui, tous les contenus générés sont entièrement éditables. Vous pouvez modifier les textes, réorganiser les modules, ajouter ou supprimer des éléments selon vos besoins.",
  },
  {
    id: "6",
    category: "features",
    question: "Les documents sont-ils conformes Qualiopi ?",
    answer: "Nos modèles de documents administratifs (conventions, contrats, feuilles d'émargement) sont conçus pour répondre aux exigences de la certification Qualiopi. Cependant, nous vous recommandons de vérifier la conformité avec votre certificateur.",
  },

  // Abonnements
  {
    id: "7",
    category: "billing",
    question: "Quels sont les différents plans disponibles ?",
    answer: "Nous proposons 3 plans : Starter (gratuit, 3 formations), Pro (29€/mois, formations illimitées) et Entreprise (99€/mois, multi-utilisateurs). Consultez la page Facturation pour plus de détails.",
  },
  {
    id: "8",
    category: "billing",
    question: "Puis-je changer de plan à tout moment ?",
    answer: "Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Le changement prend effet immédiatement et le montant est calculé au prorata.",
  },
  {
    id: "9",
    category: "billing",
    question: "Comment annuler mon abonnement ?",
    answer: "Vous pouvez annuler votre abonnement à tout moment depuis la page Facturation. Votre accès reste actif jusqu'à la fin de la période payée. Vos formations restent accessibles en lecture seule après l'annulation.",
  },

  // Support
  {
    id: "10",
    category: "support",
    question: "Comment contacter le support ?",
    answer: "Vous pouvez nous contacter par email à support@automate.fr ou via le chat disponible en bas à droite de l'écran. Les utilisateurs Pro et Entreprise bénéficient d'un support prioritaire avec un temps de réponse garanti sous 24h.",
  },
  {
    id: "11",
    category: "support",
    question: "Proposez-vous des formations à l'utilisation ?",
    answer: "Oui, nous proposons des webinaires gratuits chaque semaine pour découvrir toutes les fonctionnalités d'Automate. Les utilisateurs Entreprise bénéficient également d'une session de formation personnalisée à l'onboarding.",
  },
];

const categories = [
  { id: "all", label: "Toutes les questions" },
  { id: "general", label: "Général" },
  { id: "features", label: "Fonctionnalités" },
  { id: "billing", label: "Abonnements" },
  { id: "support", label: "Support" },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredItems = faqItems.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "all" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Questions fréquentes
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Retrouvez les réponses aux questions les plus fréquentes sur Automate
        </p>

        {/* Barre de recherche */}
        <div className="mt-6">
          <div className="relative max-w-lg">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Rechercher une question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Catégories */}
        <div className="mt-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeCategory === category.id
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des questions */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {filteredItems.map((item) => (
            <div key={item.id} className="p-0">
              <button
                onClick={() => toggleItem(item.id)}
                className="flex items-center justify-between w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white pr-4">
                  {item.question}
                </span>
                <span
                  className={`flex-shrink-0 text-gray-400 transition-transform ${
                    openItems.includes(item.id) ? "rotate-180" : ""
                  }`}
                >
                  <ChevronDownIcon />
                </span>
              </button>
              {openItems.includes(item.id) && (
                <div className="px-6 pb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Aucune question trouvée pour "{searchQuery}"
            </p>
          </div>
        )}
      </div>

      {/* Besoin d'aide supplémentaire */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-50 rounded-xl dark:bg-brand-500/10">
              <span className="text-brand-500">
                <MessageIcon />
              </span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Vous n'avez pas trouvé votre réponse ?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Notre équipe support est disponible pour vous aider du lundi au vendredi, de 9h à 18h.
              </p>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors whitespace-nowrap">
            Contacter le support
          </button>
        </div>
      </div>
    </div>
  );
}
