"use client";
import React, { useState } from "react";
import Link from "next/link";

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.8333 10H4.16667M4.16667 10L10 15.8333M4.16667 10L10 4.16667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M9.16667 3.33333C5.94501 3.33333 3.33333 5.94501 3.33333 9.16667C3.33333 12.3883 5.94501 15 9.16667 15C12.3883 15 15 12.3883 15 9.16667C15 5.94501 12.3883 3.33333 9.16667 3.33333ZM1.66667 9.16667C1.66667 5.02453 5.02453 1.66667 9.16667 1.66667C13.3088 1.66667 16.6667 5.02453 16.6667 9.16667C16.6667 10.9378 16.0528 12.5654 15.0274 13.8565L18.0893 16.9107C18.4147 17.2362 18.4147 17.7638 18.0893 18.0893C17.7638 18.4147 17.2362 18.4147 16.9107 18.0893L13.8565 15.0274C12.5654 16.0528 10.9378 16.6667 9.16667 16.6667C5.02453 16.6667 1.66667 13.3088 1.66667 9.16667Z" fill="currentColor"/>
  </svg>
);

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    title: "Général",
    icon: "🏠",
    items: [
      {
        question: "Qu'est-ce qu'Automate ?",
        answer: "Automate est une plateforme tout-en-un pour les organismes de formation. Elle permet de gérer vos formations, sessions, apprenants, documents administratifs et conformité Qualiopi depuis une seule interface intuitive."
      },
      {
        question: "Automate est-il adapté à mon organisme ?",
        answer: "Automate est conçu pour tous les organismes de formation, quelle que soit leur taille : formateurs indépendants, petits centres de formation ou grandes structures. L'interface s'adapte à vos besoins."
      },
      {
        question: "Puis-je essayer Automate gratuitement ?",
        answer: "Oui, nous proposons une période d'essai gratuite qui vous permet de tester toutes les fonctionnalités de la plateforme. Contactez notre équipe commerciale pour en savoir plus."
      },
      {
        question: "Mes données sont-elles sécurisées ?",
        answer: "Absolument. Vos données sont hébergées sur des serveurs sécurisés en France, avec chiffrement et sauvegardes quotidiennes. Nous sommes conformes au RGPD et respectons les normes de sécurité les plus strictes."
      },
      {
        question: "Comment contacter le support ?",
        answer: "Vous pouvez nous contacter par email à support@automate.fr, via le chat intégré à la plateforme, ou par téléphone aux heures de bureau. Notre équipe répond généralement sous 24h."
      }
    ]
  },
  {
    title: "Formations",
    icon: "📚",
    items: [
      {
        question: "Comment créer une formation ?",
        answer: "Vous avez deux options : 1) Création avec IA - décrivez votre formation et l'IA génère automatiquement le programme, objectifs et compétences. 2) Création manuelle - remplissez vous-même tous les champs du formulaire."
      },
      {
        question: "Puis-je dupliquer une formation existante ?",
        answer: "Oui, depuis la liste des formations, cliquez sur les trois points à droite de la formation, puis 'Dupliquer'. Vous obtenez une copie que vous pouvez modifier à votre guise."
      },
      {
        question: "Comment organiser mes formations par catégories ?",
        answer: "Lors de la création ou modification d'une formation, vous pouvez assigner une catégorie. Utilisez ensuite les filtres dans la liste des formations pour afficher par catégorie."
      },
      {
        question: "Puis-je importer mes formations existantes ?",
        answer: "Oui, nous proposons un import depuis Excel/CSV. Préparez votre fichier selon notre modèle, puis utilisez la fonction d'import dans Paramètres → Import de données."
      },
      {
        question: "Comment fonctionne la génération IA des formations ?",
        answer: "Notre IA analyse votre description et génère automatiquement : le titre optimisé, les objectifs pédagogiques SMART, le programme détaillé par modules, les compétences visées, les prérequis et le public cible."
      }
    ]
  },
  {
    title: "Sessions",
    icon: "📅",
    items: [
      {
        question: "Quelle est la différence entre formation et session ?",
        answer: "Une formation est le 'modèle' (programme, objectifs, contenu). Une session est une 'instance' de cette formation avec des dates précises, des participants et un intervenant. Vous pouvez créer plusieurs sessions à partir d'une même formation."
      },
      {
        question: "Comment modifier les dates d'une session ?",
        answer: "Ouvrez la session, allez dans l'onglet 'Informations', modifiez les dates de début/fin. N'oubliez pas d'adapter le planning jour par jour si nécessaire."
      },
      {
        question: "Puis-je annuler une session ?",
        answer: "Oui, depuis la page de la session, cliquez sur 'Actions' → 'Annuler la session'. Vous pouvez configurer des emails automatiques pour prévenir les participants."
      },
      {
        question: "Comment gérer une formation en plusieurs modules ?",
        answer: "Créez plusieurs sessions liées à la même formation, chacune correspondant à un module. Vous pouvez aussi utiliser le planning détaillé pour définir les modules au sein d'une même session."
      },
      {
        question: "Puis-je déplacer un apprenant d'une session à une autre ?",
        answer: "Oui, depuis l'onglet 'Apprenants' de la session actuelle, sélectionnez l'apprenant et cliquez sur 'Transférer vers une autre session'. Les documents seront automatiquement mis à jour."
      }
    ]
  },
  {
    title: "Apprenants",
    icon: "👥",
    items: [
      {
        question: "Comment inscrire un apprenant à une session ?",
        answer: "Ouvrez la session concernée, allez dans l'onglet 'Apprenants', cliquez sur 'Ajouter un apprenant'. Vous pouvez créer un nouvel apprenant ou sélectionner un apprenant existant."
      },
      {
        question: "Comment importer une liste d'apprenants ?",
        answer: "Utilisez la fonction d'import dans Apprenants → Importer. Préparez un fichier Excel avec les colonnes : nom, prénom, email, téléphone, entreprise. Notre assistant vous guidera."
      },
      {
        question: "Un apprenant peut-il s'inscrire lui-même ?",
        answer: "Oui, si vous activez le catalogue public avec inscription en ligne. L'apprenant remplit un formulaire et peut être automatiquement inscrit ou en attente de validation selon vos paramètres."
      },
      {
        question: "Comment gérer les prérequis d'un apprenant ?",
        answer: "Créez un questionnaire de positionnement (quiz ou formulaire) et envoyez-le avant l'inscription. Les résultats sont stockés dans la fiche de l'apprenant."
      },
      {
        question: "Que faire si un apprenant abandonne ?",
        answer: "Marquez-le comme 'Abandon' dans la session. Une fenêtre vous demande la raison et la date. Ces informations sont importantes pour Qualiopi (indicateur 15)."
      }
    ]
  },
  {
    title: "Documents",
    icon: "📄",
    items: [
      {
        question: "Quels documents sont générés automatiquement ?",
        answer: "Automate génère : conventions de formation, convocations, programmes, feuilles d'émargement, attestations de fin de formation, fiches missions intervenants, certificats de réalisation, et bien d'autres."
      },
      {
        question: "Puis-je personnaliser les modèles de documents ?",
        answer: "Oui, dans Paramètres → Modèles de documents. Vous pouvez modifier les textes, ajouter votre logo, vos couleurs, et utiliser des variables dynamiques."
      },
      {
        question: "Comment envoyer les documents aux participants ?",
        answer: "Depuis la page de la session, onglet 'Documents', sélectionnez les documents à envoyer et cliquez sur 'Envoyer par email'. Vous pouvez aussi configurer un envoi automatique."
      },
      {
        question: "Dans quel format sont générés les documents ?",
        answer: "Les documents sont générés en PDF par défaut. Pour certains documents (programmes, rapports), vous pouvez aussi exporter en Word ou Excel."
      },
      {
        question: "Comment faire signer les documents électroniquement ?",
        answer: "Utilisez notre module de signature intégré. Depuis le document, cliquez sur 'Faire signer', ajoutez les signataires, et envoyez. Ils reçoivent un lien pour signer en ligne."
      }
    ]
  },
  {
    title: "Émargements",
    icon: "✍️",
    items: [
      {
        question: "Comment fonctionne l'émargement digital ?",
        answer: "Deux options : 1) Signature sur tablette pendant la formation - passez l'écran à chaque participant. 2) Envoi par email - chaque participant reçoit un lien personnel pour signer."
      },
      {
        question: "L'émargement digital est-il valide légalement ?",
        answer: "Oui, l'émargement digital est reconnu par les OPCO et les organismes de contrôle. Nos signatures sont horodatées et sécurisées."
      },
      {
        question: "Que faire si un apprenant oublie de signer ?",
        answer: "Vous pouvez lui renvoyer le lien d'émargement depuis l'interface. Une option de signature différée est également disponible avec justification."
      },
      {
        question: "Puis-je imprimer les feuilles d'émargement ?",
        answer: "Oui, vous pouvez générer des PDF vierges à imprimer pour signature manuscrite, ou exporter les feuilles signées numériquement."
      },
      {
        question: "Comment gérer les retards ou absences ?",
        answer: "Lors de la signature, vous pouvez noter l'heure d'arrivée/départ réelle. Les absences sont automatiquement calculées pour les attestations."
      }
    ]
  },
  {
    title: "Évaluations",
    icon: "⭐",
    items: [
      {
        question: "Quels types d'évaluations puis-je créer ?",
        answer: "Évaluations à chaud (satisfaction), évaluations à froid (impact), évaluations des acquis (quiz), auto-évaluations, évaluations par le formateur."
      },
      {
        question: "Comment envoyer une évaluation aux apprenants ?",
        answer: "Créez votre questionnaire dans Outils → Évaluations, puis envoyez-le manuellement ou configurez un envoi automatique en fin de session."
      },
      {
        question: "Puis-je personnaliser les questions ?",
        answer: "Oui, créez vos propres questionnaires avec différents types de questions : choix multiple, échelle de 1 à 10, texte libre, oui/non, etc."
      },
      {
        question: "Comment consulter les résultats ?",
        answer: "Les résultats sont disponibles dans la session concernée, onglet 'Évaluations'. Vous avez une vue individuelle et une vue globale avec statistiques."
      },
      {
        question: "Ces évaluations sont-elles conformes Qualiopi ?",
        answer: "Oui, nos évaluations répondent aux exigences des indicateurs 11 (acquis), 28 (appréciations) et 30 (amélioration continue) de Qualiopi."
      }
    ]
  },
  {
    title: "Qualiopi",
    icon: "✅",
    items: [
      {
        question: "Automate m'aide-t-il pour Qualiopi ?",
        answer: "Oui, Automate génère automatiquement la plupart des preuves requises : émargements, évaluations, attestations, conventions... L'Auditeur IA vous aide à préparer l'audit."
      },
      {
        question: "Qu'est-ce que l'Auditeur IA ?",
        answer: "L'Auditeur IA est un assistant qui analyse vos preuves, identifie les manques, suggère des améliorations et simule des questions d'audit pour vous préparer."
      },
      {
        question: "Tous les indicateurs sont-ils couverts ?",
        answer: "Automate couvre la grande majorité des 32 indicateurs. Pour certains indicateurs spécifiques (veille, partenariats...), nous vous guidons sur les preuves à fournir."
      },
      {
        question: "Comment suivre ma progression Qualiopi ?",
        answer: "Un tableau de bord dédié affiche votre niveau de conformité par indicateur avec un code couleur (vert/orange/rouge) et les actions à mener."
      },
      {
        question: "Automate peut-il me certifier Qualiopi ?",
        answer: "Non, Automate est un outil de gestion qui facilite la conformité. La certification est délivrée par un organisme certificateur accrédité après audit."
      }
    ]
  },
  {
    title: "Intervenants",
    icon: "👨‍🏫",
    items: [
      {
        question: "Comment ajouter un intervenant ?",
        answer: "Allez dans Paramètres → Équipe → Ajouter un intervenant. Renseignez ses coordonnées, qualifications et CV. Il recevra un email d'invitation."
      },
      {
        question: "Quels accès a un intervenant ?",
        answer: "L'intervenant accède uniquement à ses sessions : programme, apprenants, émargements, documents, évaluations. Il ne voit pas les informations financières ni les autres sessions."
      },
      {
        question: "Comment assigner un intervenant à une session ?",
        answer: "Lors de la création ou modification d'une session, dans l'onglet 'Intervenants', ajoutez le(s) formateur(s). Ils seront automatiquement notifiés."
      },
      {
        question: "Puis-je avoir plusieurs intervenants sur une session ?",
        answer: "Oui, vous pouvez ajouter autant d'intervenants que nécessaire, avec des rôles différents (formateur principal, co-animateur, expert ponctuel...)."
      },
      {
        question: "Comment gérer un intervenant externe ?",
        answer: "Les intervenants externes sont gérés de la même façon. Vous pouvez leur créer un contrat de sous-traitance et suivre leurs fiches missions."
      }
    ]
  },
  {
    title: "Facturation",
    icon: "💰",
    items: [
      {
        question: "Automate gère-t-il la facturation ?",
        answer: "Automate permet de créer des devis et de générer des factures depuis les sessions. Pour une comptabilité complète, nous recommandons l'export vers votre logiciel comptable."
      },
      {
        question: "Comment créer un devis ?",
        answer: "Depuis le CRM, sélectionnez une opportunité et cliquez sur 'Créer un devis'. Vous pouvez aussi créer un devis directement depuis une session."
      },
      {
        question: "Puis-je gérer différents financeurs (OPCO, CPF...) ?",
        answer: "Oui, chaque inscription peut avoir un type de financement différent. Automate adapte les documents (conventions spécifiques) et le suivi."
      },
      {
        question: "Comment exporter pour ma comptabilité ?",
        answer: "Allez dans Mes données → Export comptable. Sélectionnez la période et le format (CSV, Excel) compatible avec votre logiciel."
      },
      {
        question: "Automate peut-il se connecter à mon logiciel de facturation ?",
        answer: "Des intégrations sont disponibles avec certains logiciels. Contactez-nous pour vérifier la compatibilité avec votre outil."
      }
    ]
  },
  {
    title: "Technique",
    icon: "⚙️",
    items: [
      {
        question: "Automate fonctionne-t-il sur mobile ?",
        answer: "Oui, l'interface est entièrement responsive. Vous pouvez gérer vos formations depuis votre smartphone ou tablette. L'émargement tactile est optimisé pour mobile."
      },
      {
        question: "Puis-je travailler hors ligne ?",
        answer: "Non, Automate nécessite une connexion internet. Cependant, les documents PDF peuvent être téléchargés et consultés hors ligne."
      },
      {
        question: "Comment sauvegarder mes données ?",
        answer: "Vos données sont automatiquement sauvegardées sur nos serveurs. Vous pouvez également exporter régulièrement vos données via Paramètres → Export."
      },
      {
        question: "Automate s'intègre-t-il à d'autres outils ?",
        answer: "Oui, nous proposons des intégrations avec Google Calendar, Outlook, Zoom, divers CRM et outils comptables. Une API est aussi disponible."
      },
      {
        question: "Comment supprimer mon compte ?",
        answer: "Contactez notre support pour demander la suppression de votre compte. Conformément au RGPD, vos données seront supprimées sous 30 jours."
      }
    ]
  }
];

interface FAQAccordionProps {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQAccordion: React.FC<FAQAccordionProps> = ({ item, isOpen, onToggle }) => (
  <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-4 text-left hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
    >
      <span className="font-medium text-gray-900 dark:text-white pr-4">{item.question}</span>
      <span className={`transform transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
        <ChevronDownIcon />
      </span>
    </button>
    {isOpen && (
      <div className="pb-4 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        {item.answer}
      </div>
    )}
  </div>
);

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const toggleItem = (categoryTitle: string, questionIndex: number) => {
    const key = `${categoryTitle}-${questionIndex}`;
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const filteredCategories = faqData.map((category) => ({
    ...category,
    items: category.items.filter(
      (item) =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter((category) => category.items.length > 0);

  const displayCategories = activeCategory
    ? filteredCategories.filter((c) => c.title === activeCategory)
    : filteredCategories;

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Link
        href="/automate/documentation"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors"
      >
        <ArrowLeftIcon />
        Retour à la documentation
      </Link>

      {/* En-tête */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-brand-50 to-white p-8 dark:border-gray-800 dark:from-brand-950 dark:to-gray-900">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          ❓ FAQ - Questions fréquentes
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Retrouvez les réponses aux questions les plus posées sur Automate
        </p>

        {/* Barre de recherche */}
        <div className="relative max-w-2xl">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Rechercher une question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 transition-all"
          />
        </div>
      </div>

      {/* Filtres par catégorie */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeCategory === null
              ? 'bg-brand-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Toutes
        </button>
        {faqData.map((category) => (
          <button
            key={category.title}
            onClick={() => setActiveCategory(category.title)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeCategory === category.title
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span>{category.icon}</span>
            <span>{category.title}</span>
          </button>
        ))}
      </div>

      {/* Questions par catégorie */}
      {displayCategories.length > 0 ? (
        <div className="space-y-6">
          {displayCategories.map((category) => (
            <div
              key={category.title}
              className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden"
            >
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {category.title}
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {category.items.length} question{category.items.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="p-4">
                {category.items.map((item, idx) => (
                  <FAQAccordion
                    key={idx}
                    item={item}
                    isOpen={openItems.has(`${category.title}-${idx}`)}
                    onToggle={() => toggleItem(category.title, idx)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-500 dark:text-gray-400">
            Aucune question ne correspond à "{searchQuery}"
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-4 text-brand-600 dark:text-brand-400 hover:underline"
          >
            Effacer la recherche
          </button>
        </div>
      )}

      {/* Contact support */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="text-5xl">💬</div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Vous n'avez pas trouvé la réponse ?
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Notre équipe support est là pour vous aider. Contactez-nous et nous vous répondrons dans les plus brefs délais.
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="mailto:support@automate.fr"
              className="px-6 py-3 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors"
            >
              Nous contacter
            </a>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📖 Voir aussi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/automate/documentation/demarrage"
            className="p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all dark:border-gray-700 dark:hover:border-brand-600"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">🚀 Démarrage rapide</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Guide pour bien commencer
            </p>
          </Link>
          <Link
            href="/automate/documentation/dashboard-admin"
            className="p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all dark:border-gray-700 dark:hover:border-brand-600"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">👨‍💼 Dashboard Admin</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Toutes les fonctionnalités
            </p>
          </Link>
          <Link
            href="/automate/documentation/qualiopi"
            className="p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all dark:border-gray-700 dark:hover:border-brand-600"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">✅ Qualiopi</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Les 32 indicateurs
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
