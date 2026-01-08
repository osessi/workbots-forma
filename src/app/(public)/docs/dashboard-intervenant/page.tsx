"use client";
import React from "react";
import Link from "next/link";

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.8333 10H4.16667M4.16667 10L10 15.8333M4.16667 10L10 4.16667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

const Tip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="my-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
    <div className="flex gap-3">
      <span className="text-xl">💡</span>
      <p className="text-sm text-amber-800 dark:text-amber-300">{children}</p>
    </div>
  </div>
);

interface SectionCardProps {
  icon: string;
  title: string;
  description: string;
  features: string[];
}

const SectionCard: React.FC<SectionCardProps> = ({ icon, title, description, features }) => (
  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.02] overflow-hidden">
    <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </div>
    <div className="p-6">
      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex gap-3 text-gray-600 dark:text-gray-400">
            <span className="text-brand-500 mt-0.5">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default function DashboardIntervenantPage() {
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
          👨‍🏫 Dashboard Intervenant
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Guide de l'interface dédiée aux formateurs pour gérer leurs sessions, émargements, documents et évaluations
        </p>
      </div>

      <VideoPlaceholder title="Tutoriel vidéo : Prise en main du Dashboard Intervenant" />

      {/* Introduction */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🎯 À propos du Dashboard Intervenant
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Le Dashboard Intervenant est une interface simplifiée spécialement conçue pour les formateurs. Il permet d'accéder uniquement aux informations et fonctionnalités nécessaires pour animer les sessions de formation.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">✅ Ce que voit l'intervenant</h4>
            <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
              <li>• Ses sessions assignées uniquement</li>
              <li>• Le programme et planning détaillé</li>
              <li>• La liste des apprenants</li>
              <li>• Les feuilles d'émargement</li>
              <li>• Les documents de la session</li>
              <li>• Les évaluations à compléter</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">❌ Ce qu'il ne voit pas</h4>
            <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
              <li>• Les informations financières</li>
              <li>• Les données des autres intervenants</li>
              <li>• Les sessions auxquelles il n'est pas assigné</li>
              <li>• La gestion de l'organisme</li>
              <li>• Les paramètres administratifs</li>
            </ul>
          </div>
        </div>
        <Tip>
          Les intervenants reçoivent un email d'invitation avec un lien de connexion sécurisé. Ils peuvent créer leur mot de passe lors de la première connexion.
        </Tip>
      </div>

      {/* Accès à l'interface */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🔐 Connexion à l'interface
        </h2>
        <ol className="list-decimal list-inside space-y-3 text-gray-600 dark:text-gray-400 ml-2">
          <li>L'intervenant reçoit un email d'invitation de l'organisme de formation</li>
          <li>Il clique sur le lien <strong>"Accéder à mon espace"</strong></li>
          <li>Lors de la première connexion, il crée son mot de passe</li>
          <li>Pour les connexions suivantes : email + mot de passe</li>
        </ol>
        <ImagePlaceholder caption="Capture d'écran : Page de connexion intervenant" />
      </div>

      {/* Sections du dashboard */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          📋 Sections de l'interface
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SectionCard
            icon="🏠"
            title="Accueil"
            description="Vue d'ensemble de l'activité"
            features={[
              "Sessions à venir avec dates et lieux",
              "Tâches en attente (émargements, évaluations)",
              "Notifications récentes",
              "Accès rapide aux fonctionnalités principales"
            ]}
          />

          <SectionCard
            icon="📚"
            title="Programme"
            description="Contenu de la formation"
            features={[
              "Programme détaillé de la session",
              "Objectifs pédagogiques",
              "Supports et ressources de formation",
              "Planning jour par jour"
            ]}
          />

          <SectionCard
            icon="👥"
            title="Apprenants"
            description="Liste des participants"
            features={[
              "Liste des apprenants de la session",
              "Coordonnées de contact",
              "Informations sur l'entreprise",
              "Statut de présence"
            ]}
          />

          <SectionCard
            icon="✍️"
            title="Émargements"
            description="Gestion des présences"
            features={[
              "Feuilles d'émargement par demi-journée",
              "Signature électronique sur tablette/mobile",
              "Envoi par email aux apprenants",
              "Suivi des signatures en temps réel"
            ]}
          />

          <SectionCard
            icon="📄"
            title="Documents"
            description="Documentation de la session"
            features={[
              "Téléchargement de la fiche mission",
              "Accès au programme officiel",
              "Supports de formation",
              "Documents administratifs"
            ]}
          />

          <SectionCard
            icon="⭐"
            title="Évaluations"
            description="Suivi qualité"
            features={[
              "Évaluation à chaud des apprenants",
              "Évaluation des acquis (quiz)",
              "Évaluation du formateur",
              "Consultation des résultats"
            ]}
          />

          <SectionCard
            icon="📅"
            title="Calendrier"
            description="Planning des sessions"
            features={[
              "Vue calendrier des sessions",
              "Détails par session (lieu, horaires)",
              "Synchronisation avec agenda personnel",
              "Rappels automatiques"
            ]}
          />

          <SectionCard
            icon="👤"
            title="Profil"
            description="Informations personnelles"
            features={[
              "Modification des coordonnées",
              "Changement de mot de passe",
              "CV et qualifications",
              "Préférences de notification"
            ]}
          />
        </div>
      </div>

      {/* Émargement détaillé */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ✍️ Comment gérer les émargements
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          L'émargement est une fonctionnalité clé pour la conformité Qualiopi. Voici comment procéder :
        </p>

        <h3 className="font-semibold text-gray-900 dark:text-white mt-6 mb-3">Option 1 : Signature sur tablette/ordinateur</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-2">
          <li>Accédez à <strong>Émargements</strong> dans le menu</li>
          <li>Sélectionnez la journée concernée</li>
          <li>Cliquez sur <strong>"Faire signer"</strong></li>
          <li>Passez la tablette à chaque apprenant pour signature</li>
          <li>Le formateur signe en dernier</li>
        </ol>
        <ImagePlaceholder caption="Capture d'écran : Interface de signature sur tablette" />

        <h3 className="font-semibold text-gray-900 dark:text-white mt-6 mb-3">Option 2 : Envoi par email</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-2">
          <li>Accédez à <strong>Émargements</strong> dans le menu</li>
          <li>Sélectionnez la journée concernée</li>
          <li>Cliquez sur <strong>"Envoyer par email"</strong></li>
          <li>Chaque apprenant reçoit un lien pour signer</li>
          <li>Suivez les signatures en temps réel sur votre interface</li>
        </ol>
        <ImagePlaceholder caption="Capture d'écran : Envoi des émargements par email" />

        <Tip>
          Pour le distanciel, privilégiez l'envoi par email. Pour le présentiel, la signature sur tablette est plus pratique et rapide.
        </Tip>
      </div>

      {/* Évaluations détaillées */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ⭐ Les différentes évaluations
        </h2>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">📝 Évaluation à chaud</h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Questionnaire de satisfaction envoyé aux apprenants en fin de session. Permet de mesurer leur satisfaction globale, la qualité de l'animation, et de recueillir des suggestions d'amélioration.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">🎯 Évaluation des acquis</h4>
            <p className="text-sm text-purple-700 dark:text-purple-400">
              Quiz ou test permettant de vérifier l'acquisition des compétences. Peut être réalisé en début (positionnement), pendant (formatif) ou en fin de formation (sommative).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">👨‍🏫 Évaluation du formateur</h4>
            <p className="text-sm text-green-700 dark:text-green-400">
              Bilan rempli par le formateur sur le déroulement de la session : points forts, difficultés rencontrées, recommandations pour les futures sessions.
            </p>
          </div>
        </div>
        <ImagePlaceholder caption="Capture d'écran : Interface des évaluations" />
      </div>

      {/* Application mobile */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          📱 Utilisation sur mobile
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          L'interface intervenant est entièrement responsive et optimisée pour une utilisation sur smartphone ou tablette.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
            <span className="text-3xl mb-2 block">✍️</span>
            <h4 className="font-semibold text-gray-900 dark:text-white">Émargement</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Signature tactile optimisée</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
            <span className="text-3xl mb-2 block">👥</span>
            <h4 className="font-semibold text-gray-900 dark:text-white">Apprenants</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Contacts accessibles en un clic</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
            <span className="text-3xl mb-2 block">📅</span>
            <h4 className="font-semibold text-gray-900 dark:text-white">Calendrier</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Vue agenda compacte</p>
          </div>
        </div>
        <ImagePlaceholder caption="Capture d'écran : Interface mobile de l'intervenant" />
      </div>

      {/* FAQ rapide */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ❓ Questions fréquentes
        </h2>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Comment modifier mes informations personnelles ?</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Allez dans <strong>Profil</strong> et modifiez les informations souhaitées. N'oubliez pas de sauvegarder.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Je n'ai pas accès à une session, que faire ?</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Vous voyez uniquement les sessions où vous êtes assigné comme intervenant. Contactez l'organisme de formation pour être ajouté.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Comment télécharger ma fiche mission ?</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Allez dans <strong>Documents</strong> de la session concernée et cliquez sur "Télécharger" à côté de la fiche mission.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Un apprenant a oublié de signer, comment faire ?</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Vous pouvez renvoyer le lien d'émargement par email ou permettre une signature différée depuis l'interface.
            </p>
          </div>
        </div>
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
              L'interface de gestion complète
            </p>
          </Link>
          <Link
            href="/docs/faq"
            className="p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all dark:border-gray-700 dark:hover:border-brand-600"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">❓ FAQ</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Toutes les réponses à vos questions
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
