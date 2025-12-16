"use client";
import React, { useState } from "react";
import Image from "next/image";

// Types
interface Module {
  id: string;
  titre: string;
  contenu: string[];
}

interface FormationData {
  // Step 1: Contexte
  titre: string;
  image: string | null;
  imageFile: File | null;

  // Step 2: Fiche pédagogique
  description: string;
  objectifs: string[];
  modules: Module[];
  typeFormation: "presentiel" | "distanciel" | "hybride";
  duree: string;
  maxParticipants: number;
  tarif: string;
  accessibilite: boolean;

  // Step 3: Slides générées (par module)
  slidesGenerated: { [moduleId: string]: boolean };
  supportGenerated: { [moduleId: string]: boolean };

  // Step 4: Évaluations
  evaluationsGenerated: boolean;

  // Step 5: Documents
  documentsGenerated: boolean;
}

// Steps configuration
const steps = [
  { id: 1, name: "Contexte" },
  { id: 2, name: "Fiche pédagogique" },
  { id: 3, name: "Slides & Support" },
  { id: 4, name: "Évaluations" },
  { id: 5, name: "Documents" },
];

export default function FormationWizard() {
  const [currentStep, setCurrentStep] = useState(2); // Start at Fiche pédagogique for demo
  const [isGenerating, setIsGenerating] = useState(false);

  // Form data with demo content
  const [data, setData] = useState<FormationData>({
    titre: "Les bases de l'intelligence artificielle",
    image: "/images/cards/card-01.png",
    imageFile: null,
    description: "Cette formation de deux jours a pour objectif de rendre accessibles les notions essentielles de l'intelligence artificielle (IA) à des professionnels non spécialistes. Elle permet de comprendre ce qu'est réellement l'IA, comment elle fonctionne, quelles sont ses principales applications concrètes en entreprise et comment l'utiliser de manière responsable.",
    objectifs: [
      "Comprendre ce qu'est (et ce que n'est pas) l'intelligence artificielle",
      "Identifier les principales familles d'IA (IA symbolique, machine learning, IA générative)",
      "Comprendre le rôle des données et des algorithmes dans le fonctionnement de l'IA",
      "Utiliser quelques outils d'IA simples (dont l'IA générative) pour gagner du temps au quotidien",
    ],
    modules: [
      {
        id: "1",
        titre: "Introduction à l'intelligence artificielle",
        contenu: [
          "Définir l'intelligence artificielle : histoire, mythes et réalités",
          "Panorama des grands types d'IA",
          "Quelques exemples d'IA dans le quotidien (recommandations, GPS, assistants vocaux...)",
        ],
      },
      {
        id: "2",
        titre: "Données, algorithmes et apprentissage automatique",
        contenu: [
          "Qu'est-ce qu'une donnée ? Données structurées / non structurées",
          "Principes de base du machine learning (apprentissage supervisé / non supervisé, entraînement d'un modèle)",
          "Notion de surapprentissage et de qualité des données",
        ],
      },
      {
        id: "3",
        titre: "Découvrir l'IA générative",
        contenu: [
          "Principe de l'IA générative (texte, image, son, vidéo).",
          "Fonctionnement général des modèles de langage (type ChatGPT).",
          "Démonstrations : génération de texte, reformulation, synthèse, idées de contenu.",
          "Notions de prompt et de bonnes pratiques de questionnement.",
        ],
      },
      {
        id: "4",
        titre: "Cas d'usage de l'IA en entreprise",
        contenu: [],
      },
    ],
    typeFormation: "presentiel",
    duree: "14 heures (2 jours)",
    maxParticipants: 12,
    tarif: "1200 € HT / participant",
    accessibilite: true,
    slidesGenerated: {},
    supportGenerated: {},
    evaluationsGenerated: false,
    documentsGenerated: false,
  });

  // Update data helper
  const updateData = (updates: Partial<FormationData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  // Navigate between steps
  const goToStep = (stepId: number) => {
    setCurrentStep(stepId);
  };

  // Simulate generation
  const handleGenerate = async (type: string, moduleId?: string) => {
    setIsGenerating(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (type === "slides" && moduleId) {
      updateData({
        slidesGenerated: { ...data.slidesGenerated, [moduleId]: true },
      });
    } else if (type === "support" && moduleId) {
      updateData({
        supportGenerated: { ...data.supportGenerated, [moduleId]: true },
      });
    } else if (type === "evaluations") {
      updateData({ evaluationsGenerated: true });
    } else if (type === "documents") {
      updateData({ documentsGenerated: true });
    }

    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Step indicator - Pill style like the mockup */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => goToStep(step.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                currentStep === step.id
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                  : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-500/50"
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep === step.id
                  ? "bg-white/20"
                  : "bg-gray-100 dark:bg-gray-700"
              }`}>
                {step.id}
              </span>
              {step.name}
            </button>
          ))}
        </div>

        {/* Main content card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">

          {/* Step 2: Fiche pédagogique */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left column - Image and metadata */}
              <div className="space-y-6">
                {/* Image */}
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {data.image && (
                    <Image
                      src={data.image}
                      alt={data.titre}
                      width={400}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Metadata fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type de formation
                    </label>
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                      {data.typeFormation === "presentiel" ? "Présentiel" :
                       data.typeFormation === "distanciel" ? "Distanciel" : "Hybride"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Durée
                    </label>
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                      {data.duree}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre maximum de participants
                    </label>
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                      {data.maxParticipants}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tarif
                    </label>
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                      {data.tarif}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Accessibilité
                    </label>
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                      {data.accessibilite ? "Oui" : "Non"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column - Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Title with actions */}
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.titre}
                  </h1>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 dark:bg-brand-900/20 dark:text-brand-400 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors border border-brand-200 dark:border-brand-800">
                      Télécharger en PDF
                    </button>
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                {/* Description */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Description
                  </h2>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {data.description}
                    </p>
                  </div>
                </div>

                {/* Objectifs */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Objectifs pédagogiques de la formation
                  </h2>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600">
                    <ul className="space-y-2">
                      {data.objectifs.map((objectif, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                          <span className="text-brand-500 mt-1">•</span>
                          {objectif}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Contenu de la formation */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Contenu de la formation
                  </h2>
                  <div className="space-y-4">
                    {data.modules.map((module) => (
                      <div key={module.id}>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                          Module {module.id} – {module.titre}
                        </h3>
                        {module.contenu.length > 0 && (
                          <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600">
                            <ul className="space-y-1.5">
                              {module.contenu.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300 text-sm">
                                  <span className="text-brand-500 mt-0.5">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => goToStep(3)}
                    className="px-6 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/25"
                  >
                    Générer les slides & le support
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Slides & Support */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Header with global actions */}
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.titre}
                </h1>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleGenerate("slides-all")}
                    disabled={isGenerating}
                    className="px-4 py-2.5 text-sm font-medium text-brand-600 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-brand-300 dark:border-brand-600 disabled:opacity-50"
                  >
                    Générer le PowerPoint
                  </button>
                  <button
                    onClick={() => handleGenerate("support-all")}
                    disabled={isGenerating}
                    className="px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
                  >
                    Générer le support apprenant
                  </button>
                </div>
              </div>

              {/* Modules list */}
              <div className="space-y-6">
                {data.modules.map((module) => (
                  <div key={module.id}>
                    <div className="flex items-start justify-between mb-3">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Module {module.id} – {module.titre}
                      </h2>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700 mb-4" />

                    {module.contenu.length > 0 && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600">
                        <ul className="space-y-1.5">
                          {module.contenu.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300 text-sm">
                              <span className="text-brand-500 mt-0.5">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => goToStep(4)}
                  className="px-6 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/25"
                >
                  Générer les évaluations
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Évaluations */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Évaluations
                </h1>
              </div>

              <div className="p-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Générer les évaluations
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Créez automatiquement des QCM, quiz et évaluations basés sur le contenu de votre formation.
                </p>
                <button
                  onClick={() => handleGenerate("evaluations")}
                  disabled={isGenerating}
                  className="px-6 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/25 disabled:opacity-50"
                >
                  {isGenerating ? "Génération..." : "Générer les évaluations"}
                </button>
              </div>

              {/* Action button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => goToStep(5)}
                  className="px-6 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/25"
                >
                  Générer les documents
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Documents */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Documents
                </h1>
              </div>

              <div className="p-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Générer les documents
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Générez tous les documents administratifs : convention, programme, feuilles d'émargement, attestations...
                </p>
                <button
                  onClick={() => handleGenerate("documents")}
                  disabled={isGenerating}
                  className="px-6 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/25 disabled:opacity-50"
                >
                  {isGenerating ? "Génération..." : "Générer les documents"}
                </button>
              </div>

              {/* Final action */}
              <div className="flex justify-end pt-4">
                <button
                  className="px-6 py-3 text-sm font-medium text-white bg-green-500 rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-500/25"
                >
                  Terminer et publier
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Contexte (placeholder) */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Contexte de la formation
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Cette étape permet de définir le contexte initial de votre formation.
              </p>
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => goToStep(2)}
                  className="px-6 py-3 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/25"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
