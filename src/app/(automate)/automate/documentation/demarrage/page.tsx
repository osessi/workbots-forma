"use client";
import React from "react";
import Link from "next/link";

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.8333 10H4.16667M4.16667 10L10 15.8333M4.16667 10L10 4.16667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface StepProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

const Step: React.FC<StepProps> = ({ number, title, children }) => (
  <div className="relative pl-12 pb-8 border-l-2 border-brand-200 dark:border-brand-800 last:border-l-0 last:pb-0">
    <div className="absolute -left-5 w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-lg">
      {number}
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
    <div className="text-gray-600 dark:text-gray-400 space-y-3">
      {children}
    </div>
  </div>
);

const ImagePlaceholder: React.FC<{ caption: string }> = ({ caption }) => (
  <div className="my-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-8 text-center">
    <div className="text-4xl mb-2">📸</div>
    <p className="text-sm text-gray-500 dark:text-gray-400">{caption}</p>
  </div>
);

const VideoPlaceholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="my-4 rounded-xl border-2 border-dashed border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/20 p-8 text-center">
    <div className="text-4xl mb-2">🎬</div>
    <p className="text-sm font-medium text-brand-600 dark:text-brand-400">{title}</p>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Vidéo tutoriel à venir</p>
  </div>
);

const Tip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="my-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
    <div className="flex gap-3">
      <span className="text-xl">💡</span>
      <p className="text-sm text-green-800 dark:text-green-300">{children}</p>
    </div>
  </div>
);

export default function DemarragePage() {
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
        <span className="inline-block px-3 py-1 text-xs font-medium bg-brand-500 text-white rounded-full mb-4">
          Commencer ici
        </span>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          🚀 Démarrage rapide
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Créez votre première formation et lancez une session en moins de 10 minutes
        </p>
      </div>

      <VideoPlaceholder title="Tutoriel vidéo : Premier pas avec Automate" />

      {/* Contenu principal */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-8">
          Votre première formation en 5 étapes
        </h2>

        <div className="space-y-2">
          <Step number={1} title="Créer votre compte et configurer votre organisation">
            <p>
              Après votre inscription, accédez à <strong>Paramètres → Organisation</strong> pour configurer :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Le nom et logo de votre organisme de formation</li>
              <li>Vos informations légales (SIRET, numéro de déclaration d'activité)</li>
              <li>Vos coordonnées de contact</li>
            </ul>
            <ImagePlaceholder caption="Capture d'écran : Page de configuration de l'organisation" />
            <Tip>
              Ces informations apparaîtront automatiquement sur tous vos documents officiels (conventions, attestations, etc.)
            </Tip>
          </Step>

          <Step number={2} title="Créer votre première formation">
            <p>
              Deux options s'offrent à vous :
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🤖 Création avec IA</h4>
                <p className="text-sm">
                  Cliquez sur <strong>"Créer une formation"</strong> → <strong>"Générer avec IA"</strong>.
                  Décrivez votre formation et l'IA créera automatiquement le programme, les objectifs et les compétences.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">✍️ Création manuelle</h4>
                <p className="text-sm">
                  Cliquez sur <strong>"Créer une formation"</strong> → <strong>"Créer manuellement"</strong>.
                  Remplissez les champs : titre, durée, objectifs, programme, etc.
                </p>
              </div>
            </div>
            <ImagePlaceholder caption="Capture d'écran : Formulaire de création de formation" />
          </Step>

          <Step number={3} title="Planifier une session">
            <p>
              Une fois votre formation créée, créez une session pour planifier sa réalisation :
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Allez dans <strong>Sessions → Créer une session</strong></li>
              <li>Sélectionnez la formation concernée</li>
              <li>Définissez les dates de début et de fin</li>
              <li>Choisissez le mode (présentiel, distanciel, mixte)</li>
              <li>Ajoutez un ou plusieurs intervenants</li>
              <li>Configurez le planning détaillé jour par jour</li>
            </ol>
            <ImagePlaceholder caption="Capture d'écran : Création d'une session" />
            <Tip>
              Vous pouvez dupliquer une session existante pour gagner du temps sur les prochaines.
            </Tip>
          </Step>

          <Step number={4} title="Inscrire des apprenants">
            <p>
              Ajoutez les participants à votre session :
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Ouvrez la session créée</li>
              <li>Allez dans l'onglet <strong>Apprenants</strong></li>
              <li>Cliquez sur <strong>"Ajouter un apprenant"</strong></li>
              <li>Renseignez les informations (nom, email, entreprise)</li>
              <li>Configurez le financement si nécessaire (OPCO, CPF, etc.)</li>
            </ol>
            <ImagePlaceholder caption="Capture d'écran : Ajout d'apprenants à une session" />
            <p>
              Les apprenants recevront automatiquement leurs convocations et documents par email selon vos automatisations.
            </p>
          </Step>

          <Step number={5} title="Générer vos documents">
            <p>
              Automate génère automatiquement tous vos documents administratifs :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Conventions de formation</strong> - Pour l'entreprise ou le financeur</li>
              <li><strong>Convocations</strong> - Envoyées aux apprenants</li>
              <li><strong>Feuilles d'émargement</strong> - Pour signer les présences</li>
              <li><strong>Attestations de fin de formation</strong> - Délivrées à l'issue</li>
              <li><strong>Fiches de mission</strong> - Pour les intervenants</li>
            </ul>
            <ImagePlaceholder caption="Capture d'écran : Génération des documents" />
            <Tip>
              Tous les documents utilisent vos modèles personnalisés avec votre charte graphique.
            </Tip>
          </Step>
        </div>
      </div>

      {/* Prochaines étapes */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🎯 Prochaines étapes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/automate/documentation/dashboard-admin"
            className="p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all dark:border-gray-700 dark:hover:border-brand-600"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Dashboard Admin</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Explorez toutes les fonctionnalités
            </p>
          </Link>
          <Link
            href="/automate/documentation/qualiopi"
            className="p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all dark:border-gray-700 dark:hover:border-brand-600"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Conformité Qualiopi</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Préparez votre certification
            </p>
          </Link>
          <Link
            href="/automate/documentation/automatisations"
            className="p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all dark:border-gray-700 dark:hover:border-brand-600"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Automatisations</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gagnez du temps avec les workflows
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
