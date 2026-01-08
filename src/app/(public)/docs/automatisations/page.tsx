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

interface AutomationCardProps {
  icon: string;
  title: string;
  trigger: string;
  actions: string[];
  example: string;
}

const AutomationCard: React.FC<AutomationCardProps> = ({ icon, title, trigger, actions, example }) => (
  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.02] overflow-hidden">
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
    </div>
    <div className="p-4 space-y-4">
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Déclencheur</p>
        <p className="text-sm text-gray-900 dark:text-white bg-brand-50 dark:bg-brand-900/30 px-3 py-2 rounded-lg inline-block">
          ⚡ {trigger}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Actions</p>
        <ul className="space-y-1">
          {actions.map((action, idx) => (
            <li key={idx} className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="text-green-500">→</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
          💬 {example}
        </p>
      </div>
    </div>
  </div>
);

export default function AutomatisationsPage() {
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
          🤖 Automatisations
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Créez des workflows intelligents pour automatiser vos tâches répétitives et gagner du temps
        </p>
      </div>

      <VideoPlaceholder title="Tutoriel vidéo : Créer votre première automatisation" />

      {/* Introduction */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🎯 Qu'est-ce qu'une automatisation ?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Une automatisation est une règle qui déclenche des actions automatiques lorsqu'un événement spécifique se produit dans Automate.
        </p>
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
            <span>⚡</span>
            <span className="font-medium">Déclencheur</span>
          </div>
          <div className="flex items-center text-gray-400">→</div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            <span>⚙️</span>
            <span className="font-medium">Conditions</span>
          </div>
          <div className="flex items-center text-gray-400">→</div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
            <span>🎬</span>
            <span className="font-medium">Actions</span>
          </div>
        </div>
        <Tip>
          Les automatisations vous permettent de gagner des heures chaque semaine en éliminant les tâches manuelles répétitives.
        </Tip>
      </div>

      {/* Accéder aux automatisations */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🔧 Accéder aux automatisations
        </h2>
        <ol className="list-decimal list-inside space-y-3 text-gray-600 dark:text-gray-400 ml-2">
          <li>Cliquez sur <strong>"Automatisations"</strong> dans le menu principal</li>
          <li>Vous accédez à la liste de vos automatisations actives</li>
          <li>Cliquez sur <strong>"Nouvelle automatisation"</strong> pour en créer une</li>
          <li>Ou sélectionnez un modèle prédéfini pour démarrer rapidement</li>
        </ol>
        <ImagePlaceholder caption="Capture d'écran : Liste des automatisations" />
      </div>

      {/* Créer une automatisation */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ✨ Créer une automatisation
        </h2>

        <h3 className="font-semibold text-gray-900 dark:text-white mt-4 mb-3">Étape 1 : Choisir le déclencheur</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-3">
          Le déclencheur définit quand l'automatisation doit s'exécuter. Exemples :
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {[
            "Apprenant inscrit",
            "Session créée",
            "Session démarrée",
            "Session terminée",
            "Document généré",
            "Évaluation reçue",
            "Émargement signé",
            "Date planifiée"
          ].map((trigger) => (
            <div key={trigger} className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-700 dark:text-gray-300 text-center">
              {trigger}
            </div>
          ))}
        </div>

        <h3 className="font-semibold text-gray-900 dark:text-white mt-6 mb-3">Étape 2 : Définir les conditions (optionnel)</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-3">
          Ajoutez des conditions pour filtrer quand l'automatisation doit s'exécuter :
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-2">
          <li>Si la formation est de type "présentiel"</li>
          <li>Si l'apprenant a un financeur OPCO</li>
          <li>Si la session dure plus de 2 jours</li>
          <li>Si l'intervenant est un externe</li>
        </ul>

        <h3 className="font-semibold text-gray-900 dark:text-white mt-6 mb-3">Étape 3 : Ajouter les actions</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-3">
          Définissez ce qui doit se passer automatiquement :
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {[
            "Envoyer un email",
            "Générer un document",
            "Créer une tâche",
            "Envoyer un SMS",
            "Mettre à jour un champ",
            "Ajouter un tag",
            "Notifier l'équipe",
            "Créer un rappel"
          ].map((action) => (
            <div key={action} className="px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/30 text-sm text-green-700 dark:text-green-300 text-center">
              {action}
            </div>
          ))}
        </div>
        <ImagePlaceholder caption="Capture d'écran : Éditeur d'automatisation" />
      </div>

      {/* Automatisations populaires */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          ⭐ Automatisations populaires
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Voici les automatisations les plus utilisées par nos clients :
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AutomationCard
            icon="📧"
            title="Convocation automatique"
            trigger="Apprenant inscrit à une session"
            actions={[
              "Générer la convocation personnalisée",
              "Envoyer par email à l'apprenant",
              "Envoyer une copie au responsable formation"
            ]}
            example="Marie s'inscrit à une session → Elle reçoit immédiatement sa convocation"
          />

          <AutomationCard
            icon="📝"
            title="Rappel d'émargement"
            trigger="Jour de formation (le matin)"
            actions={[
              "Envoyer le lien d'émargement aux apprenants",
              "Notifier l'intervenant",
              "Créer un rappel pour l'après-midi"
            ]}
            example="Lundi 8h → Tous les participants reçoivent le lien pour signer"
          />

          <AutomationCard
            icon="⭐"
            title="Évaluation à chaud"
            trigger="Session terminée"
            actions={[
              "Attendre 1 heure",
              "Envoyer le questionnaire de satisfaction",
              "Programmer une relance J+3"
            ]}
            example="Formation terminée vendredi 17h → Questionnaire envoyé à 18h"
          />

          <AutomationCard
            icon="📄"
            title="Attestation automatique"
            trigger="Session terminée + émargements complets"
            actions={[
              "Vérifier les signatures",
              "Générer l'attestation de fin de formation",
              "Envoyer par email à l'apprenant"
            ]}
            example="Émargements OK → Attestation générée et envoyée automatiquement"
          />

          <AutomationCard
            icon="🔔"
            title="Relance financeur"
            trigger="10 jours avant le début de session"
            actions={[
              "Vérifier si la convention est signée",
              "Si non signée → envoyer relance au financeur",
              "Créer une tâche de suivi"
            ]}
            example="Convention non reçue → Relance automatique envoyée"
          />

          <AutomationCard
            icon="📋"
            title="Fiche mission intervenant"
            trigger="Intervenant assigné à une session"
            actions={[
              "Générer la fiche de mission",
              "Envoyer par email à l'intervenant",
              "Ajouter au dossier de la session"
            ]}
            example="Jean est ajouté comme formateur → Il reçoit sa fiche mission"
          />

          <AutomationCard
            icon="📊"
            title="Rapport hebdomadaire"
            trigger="Tous les lundis à 9h"
            actions={[
              "Compiler les statistiques de la semaine",
              "Générer le rapport PDF",
              "Envoyer au responsable formation"
            ]}
            example="Chaque lundi → Rapport d'activité dans votre boîte mail"
          />

          <AutomationCard
            icon="🎓"
            title="Bienvenue apprenant"
            trigger="Nouvel apprenant créé"
            actions={[
              "Envoyer l'email de bienvenue",
              "Partager le guide de démarrage",
              "Créer son accès à la plateforme LMS"
            ]}
            example="Nouvel apprenant enregistré → Accueil personnalisé automatique"
          />
        </div>
      </div>

      {/* Emails automatiques */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          📧 Personnaliser les emails automatiques
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Chaque email automatique peut être personnalisé avec des variables dynamiques :
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {[
            "{{apprenant.prenom}}",
            "{{apprenant.nom}}",
            "{{session.titre}}",
            "{{session.date_debut}}",
            "{{session.lieu}}",
            "{{formation.titre}}",
            "{{intervenant.nom}}",
            "{{organisme.nom}}"
          ].map((variable) => (
            <div key={variable} className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 font-mono text-xs text-gray-700 dark:text-gray-300">
              {variable}
            </div>
          ))}
        </div>

        <h3 className="font-semibold text-gray-900 dark:text-white mt-6 mb-3">Exemple d'email personnalisé</h3>
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Bonjour <span className="bg-brand-100 dark:bg-brand-900/50 px-1 rounded">{"{{apprenant.prenom}}"}</span>,
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
            Nous avons le plaisir de vous confirmer votre inscription à la formation
            <span className="bg-brand-100 dark:bg-brand-900/50 px-1 rounded">{"{{formation.titre}}"}</span>
            qui se déroulera le <span className="bg-brand-100 dark:bg-brand-900/50 px-1 rounded">{"{{session.date_debut}}"}</span>
            à <span className="bg-brand-100 dark:bg-brand-900/50 px-1 rounded">{"{{session.lieu}}"}</span>.
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
            Votre formateur sera <span className="bg-brand-100 dark:bg-brand-900/50 px-1 rounded">{"{{intervenant.nom}}"}</span>.
          </p>
        </div>
        <ImagePlaceholder caption="Capture d'écran : Éditeur de modèle d'email" />
      </div>

      {/* Bonnes pratiques */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ✅ Bonnes pratiques
        </h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <span className="text-2xl">🎯</span>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Commencez simple</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Créez d'abord des automatisations simples avec une seule action. Ajoutez de la complexité progressivement.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="text-2xl">🧪</span>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Testez avant d'activer</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Utilisez le mode test pour vérifier que votre automatisation fonctionne correctement avant de l'activer en production.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="text-2xl">📝</span>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Nommez clairement</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Donnez des noms explicites à vos automatisations pour les retrouver facilement : "Convocation - Session présentiel" plutôt que "Auto 1".
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="text-2xl">📊</span>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Surveillez les statistiques</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Consultez régulièrement les statistiques d'exécution pour identifier les automatisations qui échouent.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="text-2xl">🔒</span>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Ajoutez des conditions</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Utilisez les conditions pour éviter les envois inutiles ou en double.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historique et logs */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          📜 Historique et logs
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Chaque exécution d'automatisation est enregistrée avec :
        </p>
        <ul className="space-y-2 text-gray-600 dark:text-gray-400">
          <li className="flex gap-2">
            <span className="text-brand-500">•</span>
            <span>Date et heure d'exécution</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-500">•</span>
            <span>Élément déclencheur (session, apprenant...)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-500">•</span>
            <span>Statut (succès, échec, en attente)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-500">•</span>
            <span>Détail des actions effectuées</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-500">•</span>
            <span>Messages d'erreur le cas échéant</span>
          </li>
        </ul>
        <ImagePlaceholder caption="Capture d'écran : Historique des exécutions" />
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
              Accédez aux automatisations depuis le menu
            </p>
          </Link>
          <Link
            href="/docs/qualiopi"
            className="p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all dark:border-gray-700 dark:hover:border-brand-600"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">✅ Conformité Qualiopi</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatisez la génération des preuves
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
