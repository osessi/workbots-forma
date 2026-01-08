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

const ImagePlaceholder: React.FC<{ caption: string }> = ({ caption }) => (
  <div className="my-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 text-center">
    <div className="text-3xl mb-2">📸</div>
    <p className="text-sm text-gray-500 dark:text-gray-400">{caption}</p>
  </div>
);

const VideoPlaceholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="my-4 rounded-xl border-2 border-dashed border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/20 p-6 text-center">
    <div className="text-3xl mb-2">🎬</div>
    <p className="text-sm font-medium text-brand-600 dark:text-brand-400">{title}</p>
  </div>
);

interface CriterionProps {
  number: number;
  title: string;
  indicators: {
    number: number;
    title: string;
    description: string;
    proofs: string[];
  }[];
  defaultOpen?: boolean;
}

const Criterion: React.FC<CriterionProps> = ({ number, title, indicators, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-brand-50 to-white dark:from-brand-950 dark:to-gray-900 hover:from-brand-100 dark:hover:from-brand-900 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm">
            {number}
          </span>
          <span className="font-semibold text-gray-900 dark:text-white text-left">{title}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            {indicators.length} indicateur{indicators.length > 1 ? 's' : ''}
          </span>
        </div>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDownIcon />
        </span>
      </button>
      {isOpen && (
        <div className="p-4 bg-white dark:bg-white/[0.02] border-t border-gray-200 dark:border-gray-700 space-y-4">
          {indicators.map((indicator) => (
            <div key={indicator.number} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3 mb-3">
                <span className="px-2 py-1 rounded-md bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 text-sm font-medium">
                  Ind. {indicator.number}
                </span>
                <h4 className="font-semibold text-gray-900 dark:text-white">{indicator.title}</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{indicator.description}</p>
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Preuves suggérées :</p>
                <ul className="space-y-1">
                  {indicator.proofs.map((proof, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-green-500">✓</span>
                      <span>{proof}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const criteria: CriterionProps[] = [
  {
    number: 1,
    title: "Conditions d'information du public",
    defaultOpen: true,
    indicators: [
      {
        number: 1,
        title: "Information sur les prestations",
        description: "Le prestataire diffuse une information accessible au public, détaillée et vérifiable sur les prestations proposées.",
        proofs: [
          "Catalogue de formations accessible sur le site web",
          "Fiches programmes détaillées (objectifs, prérequis, durée, tarifs)",
          "Conditions générales de vente affichées",
          "Page contact avec coordonnées complètes"
        ]
      },
      {
        number: 2,
        title: "Indicateurs de résultats",
        description: "Le prestataire diffuse des indicateurs de résultats adaptés à la nature des prestations.",
        proofs: [
          "Taux de satisfaction des apprenants",
          "Taux de réussite aux évaluations",
          "Taux d'abandon",
          "Statistiques de recommandation (NPS)"
        ]
      },
      {
        number: 3,
        title: "Obtention de la certification",
        description: "Lorsque le prestataire délivre des certifications, il informe sur les taux d'obtention et les possibilités de VAE.",
        proofs: [
          "Taux d'obtention des certifications",
          "Information sur la VAE (si applicable)",
          "Liens vers France Compétences (si certification inscrite)"
        ]
      }
    ]
  },
  {
    number: 2,
    title: "Identification précise des objectifs",
    indicators: [
      {
        number: 4,
        title: "Analyse du besoin",
        description: "Le prestataire analyse le besoin du bénéficiaire et détermine les objectifs de la prestation.",
        proofs: [
          "Questionnaire de positionnement initial",
          "Entretien préalable documenté",
          "Analyse des besoins formalisée",
          "Proposition commerciale personnalisée"
        ]
      },
      {
        number: 5,
        title: "Objectifs et contenus",
        description: "Le prestataire définit les objectifs opérationnels et évaluables, et les contenus de la prestation.",
        proofs: [
          "Programme de formation avec objectifs SMART",
          "Compétences visées clairement identifiées",
          "Progression pédagogique structurée",
          "Modalités d'évaluation définies"
        ]
      },
      {
        number: 6,
        title: "Contenus et délais adaptés",
        description: "Le prestataire établit les contenus et modalités adaptés aux objectifs et publics.",
        proofs: [
          "Adaptation du programme au public",
          "Prise en compte des contraintes (handicap, langue...)",
          "Délais de réalisation communiqués",
          "Planning détaillé transmis"
        ]
      },
      {
        number: 7,
        title: "Adéquation des moyens",
        description: "Lorsque le prestataire met en œuvre des prestations sur mesure, il définit l'adéquation des moyens.",
        proofs: [
          "Devis détaillé avec moyens mobilisés",
          "CV des intervenants",
          "Description des ressources pédagogiques",
          "Modalités d'accompagnement précisées"
        ]
      },
      {
        number: 8,
        title: "Positionnement préalable",
        description: "Le prestataire détermine les procédures de positionnement et d'évaluation des acquis.",
        proofs: [
          "Tests de positionnement",
          "Grilles d'évaluation des prérequis",
          "Questionnaires d'auto-positionnement",
          "Entretiens de diagnostic"
        ]
      }
    ]
  },
  {
    number: 3,
    title: "Adaptation aux publics bénéficiaires",
    indicators: [
      {
        number: 9,
        title: "Information des publics",
        description: "Le prestataire informe les publics sur les conditions de déroulement de la prestation.",
        proofs: [
          "Convocations détaillées envoyées",
          "Livret d'accueil",
          "Règlement intérieur communiqué",
          "Informations pratiques (accès, horaires, contacts)"
        ]
      },
      {
        number: 10,
        title: "Adaptation de la prestation",
        description: "Le prestataire met en œuvre et adapte la prestation, accompagne et suit les apprenants.",
        proofs: [
          "Émargements signés",
          "Supports de formation fournis",
          "Adaptations documentées en cours de formation",
          "Suivi individuel des progressions"
        ]
      },
      {
        number: 11,
        title: "Acquis et objectifs",
        description: "Le prestataire évalue l'atteinte des objectifs et l'acquisition des compétences.",
        proofs: [
          "Évaluations des acquis (quiz, mises en situation)",
          "Attestations de fin de formation",
          "Bilans de compétences",
          "Certificats de réalisation"
        ]
      },
      {
        number: 12,
        title: "Engagement des bénéficiaires",
        description: "Le prestataire décrit et met en œuvre les mesures pour favoriser l'engagement.",
        proofs: [
          "Méthodes pédagogiques participatives documentées",
          "Activités interactives prévues",
          "Mises en situation pratiques",
          "Suivi de l'assiduité"
        ]
      },
      {
        number: 13,
        title: "Coordination des acteurs",
        description: "Pour les formations en alternance, le prestataire coordonne les différents acteurs.",
        proofs: [
          "Convention tripartite",
          "Livret de suivi en entreprise",
          "Réunions de coordination documentées",
          "Échanges avec les tuteurs"
        ]
      },
      {
        number: 14,
        title: "Exercice de la citoyenneté",
        description: "Le prestataire met en œuvre un accompagnement socio-professionnel et éducatif.",
        proofs: [
          "Informations sur droits et devoirs",
          "Sensibilisation à la citoyenneté",
          "Accompagnement vers l'emploi (si applicable)",
          "Ressources sur l'insertion professionnelle"
        ]
      },
      {
        number: 15,
        title: "Abandon et ruptures",
        description: "Le prestataire procède au recueil et traitement des cas d'abandon ou ruptures.",
        proofs: [
          "Procédure de gestion des abandons",
          "Entretiens de sortie documentés",
          "Analyse des causes",
          "Actions correctives mises en place"
        ]
      },
      {
        number: 16,
        title: "Accessibilité handicap",
        description: "Le prestataire mobilise les expertises pour accueillir les personnes en situation de handicap.",
        proofs: [
          "Référent handicap identifié",
          "Accessibilité des locaux documentée",
          "Adaptations pédagogiques possibles",
          "Partenariats avec organismes spécialisés"
        ]
      }
    ]
  },
  {
    number: 4,
    title: "Adéquation des moyens pédagogiques",
    indicators: [
      {
        number: 17,
        title: "Moyens humains et techniques",
        description: "Le prestataire mobilise les moyens humains et techniques adaptés.",
        proofs: [
          "CV des formateurs avec qualifications",
          "Liste du matériel et équipements",
          "Descriptions des salles et outils",
          "Ressources pédagogiques inventoriées"
        ]
      },
      {
        number: 18,
        title: "Coordination des intervenants",
        description: "Le prestataire mobilise et coordonne les différents intervenants.",
        proofs: [
          "Planning des interventions",
          "Réunions pédagogiques documentées",
          "Échanges entre formateurs",
          "Fiches de mission des intervenants"
        ]
      },
      {
        number: 19,
        title: "Ressources pédagogiques",
        description: "Le prestataire met à disposition des ressources pédagogiques aux bénéficiaires.",
        proofs: [
          "Supports de formation fournis",
          "Accès à une plateforme e-learning",
          "Bibliographie et ressources complémentaires",
          "Documents accessibles après la formation"
        ]
      },
      {
        number: 20,
        title: "Sous-traitance",
        description: "Le prestataire dispose d'un personnel dédié à l'appui à la mobilité internationale.",
        proofs: [
          "Contrats de sous-traitance",
          "Cahiers des charges",
          "Contrôle qualité des sous-traitants",
          "Évaluation des prestations externalisées"
        ]
      }
    ]
  },
  {
    number: 5,
    title: "Qualification des personnels",
    indicators: [
      {
        number: 21,
        title: "Compétences des intervenants",
        description: "Le prestataire détermine les compétences des intervenants et les vérifie.",
        proofs: [
          "Processus de recrutement documenté",
          "CV et diplômes des formateurs",
          "Vérification des qualifications",
          "Habilitations spécifiques (si applicable)"
        ]
      },
      {
        number: 22,
        title: "Développement des compétences",
        description: "Le prestataire entretient et développe les compétences de ses salariés.",
        proofs: [
          "Plan de formation des formateurs",
          "Attestations de formations suivies",
          "Veille métier et pédagogique",
          "Participation à des colloques/séminaires"
        ]
      }
    ]
  },
  {
    number: 6,
    title: "Inscription dans l'environnement",
    indicators: [
      {
        number: 23,
        title: "Veille légale et réglementaire",
        description: "Le prestataire réalise une veille sur les évolutions du secteur.",
        proofs: [
          "Abonnements à des sources d'information",
          "Participation à des réseaux professionnels",
          "Mise à jour des programmes",
          "Historique des évolutions intégrées"
        ]
      },
      {
        number: 24,
        title: "Veille emplois et métiers",
        description: "Le prestataire réalise une veille sur les évolutions des compétences et métiers.",
        proofs: [
          "Études sectorielles consultées",
          "Adaptation des contenus aux évolutions",
          "Contacts avec les branches professionnelles",
          "Analyse des besoins du marché"
        ]
      },
      {
        number: 25,
        title: "Veille technologique et pédagogique",
        description: "Le prestataire réalise une veille sur les innovations pédagogiques.",
        proofs: [
          "Nouvelles méthodes pédagogiques testées",
          "Outils numériques mis en place",
          "Formation aux innovations",
          "Veille sur l'e-learning"
        ]
      },
      {
        number: 26,
        title: "Public en situation de handicap",
        description: "Le prestataire mobilise les expertises et outils pour l'accueil des PSH.",
        proofs: [
          "Formations au handicap suivies",
          "Partenariats avec l'Agefiph/FIPHFP",
          "Réseau de référents handicap",
          "Outils d'adaptation disponibles"
        ]
      },
      {
        number: 27,
        title: "Insertion professionnelle",
        description: "Lorsque les prestations visent l'insertion, le prestataire s'inscrit dans un réseau.",
        proofs: [
          "Partenariats avec Pôle Emploi/France Travail",
          "Relations avec les entreprises locales",
          "Accompagnement vers l'emploi",
          "Suivi post-formation"
        ]
      }
    ]
  },
  {
    number: 7,
    title: "Prise en compte des appréciations",
    indicators: [
      {
        number: 28,
        title: "Recueil des appréciations",
        description: "Le prestataire recueille les appréciations des parties prenantes.",
        proofs: [
          "Questionnaires de satisfaction systématiques",
          "Évaluations à chaud et à froid",
          "Recueil des avis des financeurs",
          "Feedback des entreprises clientes"
        ]
      },
      {
        number: 29,
        title: "Traitement des réclamations",
        description: "Le prestataire traite les difficultés rencontrées et les réclamations.",
        proofs: [
          "Procédure de gestion des réclamations",
          "Registre des réclamations",
          "Délais de traitement respectés",
          "Actions correctives documentées"
        ]
      },
      {
        number: 30,
        title: "Mesures d'amélioration",
        description: "Le prestataire met en œuvre des mesures d'amélioration à partir des appréciations.",
        proofs: [
          "Analyse des évaluations",
          "Plans d'action d'amélioration",
          "Suivi des actions correctives",
          "Évolution des indicateurs qualité"
        ]
      },
      {
        number: 31,
        title: "Engagement des bénéficiaires",
        description: "Les apprentis et stagiaires peuvent s'exprimer sur le déroulement de la formation.",
        proofs: [
          "Délégués de promotion (si applicable)",
          "Espaces d'expression prévus",
          "Réunions de bilan intermédiaire",
          "Canaux de communication ouverts"
        ]
      },
      {
        number: 32,
        title: "Actions d'amélioration continue",
        description: "Le prestataire met en œuvre des actions d'amélioration continue.",
        proofs: [
          "Processus d'amélioration continue formalisé",
          "Revue de direction / bilan annuel",
          "Objectifs qualité définis",
          "Indicateurs de performance suivis"
        ]
      }
    ]
  }
];

export default function QualiopiPage() {
  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Link
        href="/docs"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors"
      >
        <ArrowLeftIcon />
        Retour à la documentation
      </Link>

      {/* En-tête */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-brand-50 to-white p-8 dark:border-gray-800 dark:from-brand-950 dark:to-gray-900">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          ✅ Conformité Qualiopi
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Guide complet des 32 indicateurs du Référentiel National Qualité et comment Automate vous aide à les respecter
        </p>
      </div>

      <VideoPlaceholder title="Tutoriel vidéo : Préparer votre audit Qualiopi avec Automate" />

      {/* Introduction */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🎯 Qu'est-ce que Qualiopi ?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          <strong>Qualiopi</strong> est la certification qualité obligatoire pour tous les organismes de formation souhaitant bénéficier de financements publics ou mutualisés (OPCO, CPF, Pôle Emploi, etc.).
        </p>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Elle est basée sur le <strong>Référentiel National Qualité (RNQ)</strong> qui comprend 7 critères déclinés en 32 indicateurs.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-center">
            <span className="text-3xl font-bold text-brand-600 dark:text-brand-400">7</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">Critères</p>
          </div>
          <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-center">
            <span className="text-3xl font-bold text-brand-600 dark:text-brand-400">32</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">Indicateurs</p>
          </div>
          <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-center">
            <span className="text-3xl font-bold text-brand-600 dark:text-brand-400">3</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ans de validité</p>
          </div>
          <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-center">
            <span className="text-3xl font-bold text-brand-600 dark:text-brand-400">1</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">Audit de surveillance</p>
          </div>
        </div>
      </div>

      {/* Comment Automate aide */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🤖 Comment Automate vous aide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">📄 Génération automatique des preuves</h4>
            <p className="text-sm text-green-700 dark:text-green-400">
              Conventions, émargements, attestations, évaluations... tous les documents requis sont générés automatiquement.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">📊 Indicateurs calculés</h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Taux de satisfaction, de réussite, d'abandon... calculés automatiquement depuis vos données.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">🤖 Auditeur IA</h4>
            <p className="text-sm text-purple-700 dark:text-purple-400">
              L'assistant IA analyse vos preuves et vous aide à préparer les réponses aux questions d'audit.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">✅ Suivi de conformité</h4>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Tableau de bord dédié pour suivre votre progression sur chaque indicateur.
            </p>
          </div>
        </div>
        <ImagePlaceholder caption="Capture d'écran : Tableau de bord de conformité Qualiopi" />
      </div>

      {/* Les 7 critères et 32 indicateurs */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          📋 Les 7 critères et 32 indicateurs
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Cliquez sur chaque critère pour voir les indicateurs associés et les preuves suggérées.
        </p>

        {criteria.map((criterion) => (
          <Criterion
            key={criterion.number}
            number={criterion.number}
            title={criterion.title}
            indicators={criterion.indicators}
            defaultOpen={criterion.defaultOpen}
          />
        ))}
      </div>

      {/* Utiliser l'Auditeur IA */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🤖 Utiliser l'Auditeur IA
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          L'Auditeur IA est votre assistant pour préparer et réussir votre certification Qualiopi.
        </p>

        <h3 className="font-semibold text-gray-900 dark:text-white mt-6 mb-3">Accéder à l'Auditeur IA</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-2">
          <li>Cliquez sur <strong>"Auditeur IA"</strong> dans le menu principal</li>
          <li>Sélectionnez l'indicateur que vous souhaitez vérifier</li>
          <li>L'IA analyse automatiquement vos preuves disponibles</li>
          <li>Consultez les recommandations et suggestions d'amélioration</li>
        </ol>
        <ImagePlaceholder caption="Capture d'écran : Interface de l'Auditeur IA" />

        <h3 className="font-semibold text-gray-900 dark:text-white mt-6 mb-3">Fonctionnalités</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <h4 className="font-medium text-gray-900 dark:text-white">🔍 Analyse des preuves</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Vérifie la conformité de vos documents</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <h4 className="font-medium text-gray-900 dark:text-white">💡 Suggestions</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Recommandations pour renforcer vos preuves</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <h4 className="font-medium text-gray-900 dark:text-white">❓ Simulation d'audit</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Questions types d'un auditeur</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <h4 className="font-medium text-gray-900 dark:text-white">📈 Score de préparation</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Évaluation de votre niveau de conformité</p>
          </div>
        </div>
      </div>

      {/* Préparer votre audit */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          📝 Préparer votre audit
        </h2>

        <h3 className="font-semibold text-gray-900 dark:text-white mt-4 mb-3">Avant l'audit</h3>
        <ul className="space-y-2 text-gray-600 dark:text-gray-400">
          <li className="flex gap-2">
            <span className="text-brand-500">1.</span>
            <span>Vérifiez que tous vos indicateurs sont au vert dans le tableau de bord</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-500">2.</span>
            <span>Utilisez l'Auditeur IA pour simuler des questions</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-500">3.</span>
            <span>Préparez un dossier avec vos preuves principales classées par critère</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-500">4.</span>
            <span>Assurez-vous que vos indicateurs de résultats sont à jour et publiés</span>
          </li>
        </ul>

        <h3 className="font-semibold text-gray-900 dark:text-white mt-6 mb-3">Le jour de l'audit</h3>
        <ul className="space-y-2 text-gray-600 dark:text-gray-400">
          <li className="flex gap-2">
            <span className="text-brand-500">•</span>
            <span>Accédez rapidement à toutes vos preuves depuis Automate</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-500">•</span>
            <span>Utilisez la recherche pour trouver des documents spécifiques</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-500">•</span>
            <span>Montrez vos processus en direct (création de formation, émargement, etc.)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-500">•</span>
            <span>Exportez des rapports en PDF si nécessaire</span>
          </li>
        </ul>
        <ImagePlaceholder caption="Capture d'écran : Export du dossier de preuves" />
      </div>

      {/* Navigation */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📖 Voir aussi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/docs/dashboard-admin"
            className="p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all dark:border-gray-700 dark:hover:border-brand-600"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">👨‍💼 Dashboard Admin</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Accédez à l'Auditeur IA depuis le menu
            </p>
          </Link>
          <Link
            href="/docs/automatisations"
            className="p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all dark:border-gray-700 dark:hover:border-brand-600"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">⚡ Automatisations</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatisez la génération de preuves
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
