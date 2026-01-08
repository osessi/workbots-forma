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

interface AccordionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Accordion: React.FC<AccordionProps> = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
        </div>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDownIcon />
        </span>
      </button>
      {isOpen && (
        <div className="p-6 bg-white dark:bg-white/[0.02] border-t border-gray-200 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
};

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

const Feature: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
    <div className="w-2 h-2 rounded-full bg-brand-500 mt-2 flex-shrink-0"></div>
    <div>
      <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  </div>
);

export default function DashboardAdminPage() {
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
          👨‍💼 Dashboard Admin
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Guide complet de l'interface administrateur pour gérer vos formations, sessions, apprenants et conformité Qualiopi
        </p>
      </div>

      <VideoPlaceholder title="Tutoriel vidéo : Tour complet du Dashboard Admin" />

      {/* Sommaire */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📋 Sommaire</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { icon: "📊", title: "Tableau de bord" },
            { icon: "📚", title: "Formations" },
            { icon: "📅", title: "Sessions" },
            { icon: "👥", title: "Apprenants" },
            { icon: "📁", title: "Mes fichiers" },
            { icon: "🎯", title: "CRM" },
            { icon: "📖", title: "Catalogue" },
            { icon: "🎓", title: "LMS" },
            { icon: "💻", title: "Classe virtuelle" },
            { icon: "🤖", title: "Auditeur IA" },
            { icon: "⚡", title: "Automatisations" },
            { icon: "📧", title: "Emails" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
              <span>{item.icon}</span>
              <span>{item.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sections détaillées */}
      <div className="space-y-4">
        <Accordion title="Tableau de bord" icon="📊" defaultOpen={true}>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Le tableau de bord vous offre une vue d'ensemble de votre activité de formation.
          </p>
          <ImagePlaceholder caption="Capture d'écran : Vue d'ensemble du tableau de bord" />
          <div className="space-y-2 mt-4">
            <Feature
              title="Statistiques clés"
              description="Nombre de formations, sessions actives, apprenants inscrits, chiffre d'affaires"
            />
            <Feature
              title="Sessions à venir"
              description="Liste des prochaines sessions avec dates et nombre de participants"
            />
            <Feature
              title="Tâches en attente"
              description="Documents à signer, évaluations à envoyer, relances à faire"
            />
            <Feature
              title="Indicateurs Qualiopi"
              description="Progression de votre conformité aux 32 indicateurs"
            />
          </div>
        </Accordion>

        <Accordion title="Créer une formation" icon="➕">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Accédez à cette fonctionnalité via le menu <strong>"Créer une formation"</strong> dans la sidebar.
          </p>

          <h4 className="font-semibold text-gray-900 dark:text-white mt-6 mb-3">🤖 Création avec IA</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-2">
            <li>Cliquez sur <strong>"Générer avec IA"</strong></li>
            <li>Décrivez votre formation en quelques phrases</li>
            <li>L'IA génère automatiquement : titre, objectifs, programme, compétences, modalités</li>
            <li>Relisez et ajustez si nécessaire</li>
            <li>Validez pour créer la formation</li>
          </ol>
          <ImagePlaceholder caption="Capture d'écran : Interface de génération IA" />

          <h4 className="font-semibold text-gray-900 dark:text-white mt-6 mb-3">✍️ Création manuelle</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-2">
            <li>Cliquez sur <strong>"Créer manuellement"</strong></li>
            <li>Remplissez les informations générales (titre, code, catégorie)</li>
            <li>Définissez les objectifs pédagogiques</li>
            <li>Créez le programme par modules/séquences</li>
            <li>Ajoutez les prérequis et public cible</li>
            <li>Configurez les modalités (durée, tarif, méthodes)</li>
          </ol>
          <ImagePlaceholder caption="Capture d'écran : Formulaire de création manuelle" />
        </Accordion>

        <Accordion title="Mes formations" icon="📚">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Gérez votre catalogue de formations depuis cette section.
          </p>
          <div className="space-y-2">
            <Feature
              title="Liste des formations"
              description="Visualisez toutes vos formations avec statut, durée et nombre de sessions"
            />
            <Feature
              title="Filtres et recherche"
              description="Filtrez par catégorie, statut, date de création"
            />
            <Feature
              title="Actions rapides"
              description="Modifier, dupliquer, archiver, créer une session depuis une formation"
            />
            <Feature
              title="Export"
              description="Exportez votre catalogue en PDF ou Excel"
            />
          </div>
          <ImagePlaceholder caption="Capture d'écran : Liste des formations" />
        </Accordion>

        <Accordion title="Sessions" icon="📅">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Les sessions représentent les instances concrètes de vos formations avec dates, participants et intervenants.
          </p>

          <h4 className="font-semibold text-gray-900 dark:text-white mt-4 mb-3">Créer une session</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-2">
            <li>Allez dans <strong>Sessions → Créer une session</strong></li>
            <li>Sélectionnez la formation de référence</li>
            <li>Définissez les dates (début, fin)</li>
            <li>Choisissez la modalité (présentiel, distanciel, mixte)</li>
            <li>Ajoutez le(s) intervenant(s)</li>
            <li>Configurez le planning jour par jour</li>
            <li>Renseignez le lieu et les informations pratiques</li>
          </ol>
          <ImagePlaceholder caption="Capture d'écran : Création d'une session" />

          <h4 className="font-semibold text-gray-900 dark:text-white mt-6 mb-3">Gérer une session</h4>
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            Depuis la page d'une session, vous pouvez accéder aux onglets :
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <h5 className="font-medium text-gray-900 dark:text-white">📋 Informations</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Détails généraux, dates, modalités</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <h5 className="font-medium text-gray-900 dark:text-white">👥 Apprenants</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Liste des participants inscrits</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <h5 className="font-medium text-gray-900 dark:text-white">📝 Planning</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Programme jour par jour</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <h5 className="font-medium text-gray-900 dark:text-white">📄 Documents</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Conventions, convocations, attestations</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <h5 className="font-medium text-gray-900 dark:text-white">✍️ Émargement</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Feuilles de présence</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <h5 className="font-medium text-gray-900 dark:text-white">⭐ Évaluations</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Satisfaction et acquis</p>
            </div>
          </div>
          <ImagePlaceholder caption="Capture d'écran : Page de gestion d'une session" />
        </Accordion>

        <Accordion title="Apprenants" icon="👥">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Gérez votre base d'apprenants et leur parcours de formation.
          </p>
          <div className="space-y-2">
            <Feature
              title="Fiche apprenant"
              description="Informations personnelles, entreprise, historique des formations"
            />
            <Feature
              title="Inscriptions"
              description="Inscrire un apprenant à une ou plusieurs sessions"
            />
            <Feature
              title="Documents"
              description="Accès aux documents générés pour chaque apprenant"
            />
            <Feature
              title="Suivi"
              description="Progression, présences, évaluations, attestations"
            />
          </div>
          <ImagePlaceholder caption="Capture d'écran : Fiche apprenant" />
        </Accordion>

        <Accordion title="Mes fichiers" icon="📁">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Centralisez tous vos documents et ressources pédagogiques.
          </p>
          <div className="space-y-2">
            <Feature
              title="Organisation"
              description="Créez des dossiers pour organiser vos fichiers"
            />
            <Feature
              title="Upload"
              description="Téléversez PDF, images, vidéos, documents Office"
            />
            <Feature
              title="Partage"
              description="Partagez des fichiers avec les intervenants ou apprenants"
            />
            <Feature
              title="Recherche"
              description="Retrouvez rapidement vos fichiers par nom ou type"
            />
          </div>
          <ImagePlaceholder caption="Capture d'écran : Gestionnaire de fichiers" />
        </Accordion>

        <Accordion title="CRM" icon="🎯">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Gérez vos prospects, clients et opportunités commerciales.
          </p>
          <div className="space-y-2">
            <Feature
              title="Contacts"
              description="Base de données prospects et clients avec historique des échanges"
            />
            <Feature
              title="Entreprises"
              description="Fiches entreprises avec contacts associés"
            />
            <Feature
              title="Pipeline commercial"
              description="Suivez vos opportunités de vente étape par étape"
            />
            <Feature
              title="Devis"
              description="Créez et envoyez des devis personnalisés"
            />
          </div>
          <ImagePlaceholder caption="Capture d'écran : Interface CRM" />
        </Accordion>

        <Accordion title="Catalogue" icon="📖">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Publiez votre catalogue de formations en ligne.
          </p>
          <div className="space-y-2">
            <Feature
              title="Page catalogue"
              description="Présentez vos formations sur une page web personnalisée"
            />
            <Feature
              title="Filtres"
              description="Permettez aux visiteurs de filtrer par thème, durée, tarif"
            />
            <Feature
              title="Demande de devis"
              description="Formulaire intégré pour recevoir des demandes"
            />
            <Feature
              title="Inscription en ligne"
              description="Permettez l'inscription directe des participants"
            />
          </div>
          <ImagePlaceholder caption="Capture d'écran : Configuration du catalogue" />
        </Accordion>

        <Accordion title="LMS (Learning Management System)" icon="🎓">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Proposez des parcours e-learning à vos apprenants.
          </p>
          <div className="space-y-2">
            <Feature
              title="Modules e-learning"
              description="Créez des modules avec vidéos, quiz, documents"
            />
            <Feature
              title="Parcours"
              description="Organisez les modules en parcours progressifs"
            />
            <Feature
              title="Suivi de progression"
              description="Visualisez l'avancement de chaque apprenant"
            />
            <Feature
              title="Certificats"
              description="Délivrez des certificats de completion automatiquement"
            />
          </div>
          <ImagePlaceholder caption="Capture d'écran : Interface LMS" />
        </Accordion>

        <Accordion title="Classe virtuelle" icon="💻">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Animez vos formations à distance avec notre outil de visioconférence intégré.
          </p>
          <div className="space-y-2">
            <Feature
              title="Visioconférence"
              description="Lancez des sessions vidéo avec les apprenants"
            />
            <Feature
              title="Partage d'écran"
              description="Présentez vos supports de formation"
            />
            <Feature
              title="Tableau blanc"
              description="Dessinez et annotez en temps réel"
            />
            <Feature
              title="Chat"
              description="Échangez par messages pendant la session"
            />
            <Feature
              title="Enregistrement"
              description="Enregistrez les sessions pour rediffusion"
            />
          </div>
          <ImagePlaceholder caption="Capture d'écran : Classe virtuelle" />
        </Accordion>

        <Accordion title="Auditeur IA" icon="🤖">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            L'assistant IA vous aide à préparer votre certification Qualiopi.
          </p>
          <div className="space-y-2">
            <Feature
              title="Analyse des preuves"
              description="L'IA vérifie la conformité de vos documents"
            />
            <Feature
              title="Suggestions d'amélioration"
              description="Recommandations pour renforcer vos preuves"
            />
            <Feature
              title="Simulation d'audit"
              description="Questions types que pourrait poser un auditeur"
            />
            <Feature
              title="Score de conformité"
              description="Évaluation de votre niveau de préparation"
            />
          </div>
          <ImagePlaceholder caption="Capture d'écran : Interface Auditeur IA" />
        </Accordion>

        <Accordion title="Emails" icon="📧">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Gérez vos communications email depuis la plateforme.
          </p>
          <div className="space-y-2">
            <Feature
              title="Modèles d'emails"
              description="Créez et personnalisez vos modèles de communication"
            />
            <Feature
              title="Envoi automatique"
              description="Configuration des envois selon les événements"
            />
            <Feature
              title="Historique"
              description="Consultez tous les emails envoyés"
            />
            <Feature
              title="Statistiques"
              description="Taux d'ouverture, de clic, de réponse"
            />
          </div>
          <ImagePlaceholder caption="Capture d'écran : Gestion des emails" />
        </Accordion>

        <Accordion title="Outils" icon="🔧">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Accédez aux outils complémentaires pour votre activité.
          </p>
          <div className="space-y-2">
            <Feature
              title="Signature électronique"
              description="Faites signer vos documents en ligne"
            />
            <Feature
              title="Modèles de documents"
              description="Personnalisez vos templates de documents"
            />
            <Feature
              title="Import/Export"
              description="Importez des données depuis Excel, exportez vos rapports"
            />
            <Feature
              title="Intégrations"
              description="Connectez avec vos outils existants (calendrier, CRM, etc.)"
            />
          </div>
          <ImagePlaceholder caption="Capture d'écran : Outils disponibles" />
        </Accordion>

        <Accordion title="Mes données" icon="📊">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Analysez votre activité avec des rapports détaillés.
          </p>
          <div className="space-y-2">
            <Feature
              title="Rapports d'activité"
              description="Nombre de formations, sessions, apprenants par période"
            />
            <Feature
              title="Statistiques financières"
              description="Chiffre d'affaires, taux de remplissage, rentabilité"
            />
            <Feature
              title="Indicateurs qualité"
              description="Taux de satisfaction, de réussite, d'abandon"
            />
            <Feature
              title="Exports"
              description="Téléchargez vos données en format CSV ou Excel"
            />
          </div>
          <ImagePlaceholder caption="Capture d'écran : Tableau de bord analytique" />
        </Accordion>
      </div>

      {/* Navigation */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📖 Voir aussi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/docs/dashboard-intervenant"
            className="p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all dark:border-gray-700 dark:hover:border-brand-600"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">👨‍🏫 Dashboard Intervenant</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              L'interface dédiée aux formateurs
            </p>
          </Link>
          <Link
            href="/docs/qualiopi"
            className="p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all dark:border-gray-700 dark:hover:border-brand-600"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">✅ Conformité Qualiopi</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Les 32 indicateurs en détail
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
