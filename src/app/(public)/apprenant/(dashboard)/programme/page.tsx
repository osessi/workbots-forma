"use client";

// ===========================================
// CORRECTION 432: Page "Programme" - Fiche pédagogique
// ===========================================
// Affiche la fiche pédagogique de la session sélectionnée
// Design inspiré du catalogue, sans infos commerciales

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import {
  BookOpen,
  Target,
  Users,
  UserCheck,
  ClipboardCheck,
  GraduationCap,
  Settings,
  Accessibility,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Calendar,
  User,
} from "lucide-react";

// =====================================
// TYPES
// =====================================

interface Module {
  id: string;
  titre: string;
  description: string | null;
  ordre: number;
  dureeHeures: number | null;
  items: string[];
}

interface Intervenant {
  id: string;
  nom: string;
  prenom: string;
  fonction: string | null;
  specialites: string[];
  bio: string | null;
  photoUrl: string | null;
  estFormateurPrincipal: boolean;
}

interface ProgrammeData {
  session: {
    id: string;
    reference: string;
    nom: string | null;
    modalite: string;
  };
  formation: {
    id: string;
    titre: string;
    description: string | null;
    image: string | null;
    dureeHeures: number;
    dureeJours: string | null;
    objectifsPedagogiques: string[];
    publicVise: string | null;
    prerequis: string | null;
    moyensPedagogiques: string | null;
    methodsPedagogiques: string[];
    supportsPedagogiques: Array<{ nom: string; url?: string; type: string }>;
    methodesEvaluation: string[];
    suiviEvaluation: string | null;
    ressourcesPedagogiques: string | null;
    accessibiliteHandicap: string | null;
    equipePedagogiqueDescription: string | null;
    createdAt: string;
    updatedAt: string;
    snapshotCreatedAt: string | null;
  };
  modules: Module[];
  equipePedagogique: Intervenant[];
}

// =====================================
// COMPOSANT SECTION CARD
// =====================================

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-brand-100 dark:bg-brand-500/20">
          <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// =====================================
// COMPOSANT SECTION ICON (avec icône centrée)
// =====================================

function SectionIconCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 relative">
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <Icon className="w-6 h-6 text-brand-600 dark:text-brand-400" />
      </div>
      <h3 className="text-center font-bold text-gray-900 dark:text-white mt-4 mb-4">{title}</h3>
      {children}
    </div>
  );
}

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function ProgrammePage() {
  const { token, selectedSession } = useApprenantPortal();
  const [data, setData] = useState<ProgrammeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchProgramme = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const params = new URLSearchParams({ token });
        if (selectedSession?.sessionId) {
          params.append("sessionId", selectedSession.sessionId);
        }

        const res = await fetch(`/api/apprenant/programme?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Erreur lors du chargement du programme");
        }

        const programmeData = await res.json();
        setData(programmeData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchProgramme();
  }, [token, selectedSession?.sessionId]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement du programme...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 dark:text-white font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!data?.formation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Aucune formation disponible
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Le programme de votre formation n&apos;est pas encore disponible.
        </p>
      </div>
    );
  }

  const { formation, modules, equipePedagogique } = data;

  return (
    <div className="space-y-6">
      {/* ========================================= */}
      {/* EN-TÊTE AVEC VISUEL + TITRE */}
      {/* ========================================= */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Colonne gauche - Image + Titre */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {/* Image */}
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
              {formation.image ? (
                <Image
                  src={formation.image}
                  alt={formation.titre}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900 dark:to-brand-800">
                  <GraduationCap className="w-16 h-16 text-brand-600 dark:text-brand-400" />
                </div>
              )}
            </div>

            {/* Infos */}
            <div className="p-6">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {formation.titre}
              </h1>

              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-4">
                <p>Formation créée le {new Date(formation.createdAt).toLocaleDateString("fr-FR")}</p>
                <p>Dernière mise à jour le {new Date(formation.updatedAt).toLocaleDateString("fr-FR")}</p>
              </div>

              {/* Durée */}
              {formation.dureeHeures > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 text-brand-500" />
                  <span>
                    {formation.dureeHeures}h
                    {formation.dureeJours && ` (${formation.dureeJours})`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colonne droite - Description */}
        <div className="lg:col-span-8">
          {formation.description && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 h-full"
            >
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {formation.description}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* ========================================= */}
      {/* OBJECTIFS PÉDAGOGIQUES */}
      {/* ========================================= */}
      {formation.objectifsPedagogiques.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SectionCard title="Objectifs pédagogiques" icon={Target}>
            <ul className="space-y-3">
              {formation.objectifsPedagogiques.map((objectif, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{objectif}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </motion.div>
      )}

      {/* ========================================= */}
      {/* PROFIL DES BÉNÉFICIAIRES */}
      {/* ========================================= */}
      {(formation.publicVise || formation.prerequis) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SectionCard title="Profil des bénéficiaires" icon={Users}>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Pour qui */}
              {formation.publicVise && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400 mb-3">
                    <UserCheck className="w-4 h-4" />
                    Pour qui
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {formation.publicVise.split("\n").filter(Boolean).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-gray-400 mt-1">•</span>
                        <span>{item.replace(/^[-•]\s*/, "")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Prérequis */}
              {formation.prerequis && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400 mb-3">
                    <ClipboardCheck className="w-4 h-4" />
                    Prérequis
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {formation.prerequis.split("\n").filter(Boolean).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-gray-400 mt-1">•</span>
                        <span>{item.replace(/^[-•]\s*/, "")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </SectionCard>
        </motion.div>
      )}

      {/* ========================================= */}
      {/* CONTENU DE LA FORMATION (Modules) */}
      {/* ========================================= */}
      {modules.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <SectionCard title="Contenu de la formation" icon={BookOpen}>
            <div className="space-y-3">
              {modules.map((module) => (
                <div
                  key={module.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="font-medium text-gray-900 dark:text-white text-left">
                      Module {module.ordre} - {module.titre}
                    </span>
                    {expandedModules.has(module.id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {expandedModules.has(module.id) && (
                    <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      {module.items && module.items.length > 0 ? (
                        <ul className="space-y-2">
                          {module.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-gray-400 dark:text-gray-500 mt-1">•</span>
                              <span className="text-gray-700 dark:text-gray-300">{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : module.description ? (
                        <p className="text-gray-600 dark:text-gray-400">{module.description}</p>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-500 italic">Détails à venir</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </motion.div>
      )}

      {/* ========================================= */}
      {/* ÉQUIPE PÉDAGOGIQUE + SUIVI ÉVALUATION */}
      {/* ========================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid md:grid-cols-2 gap-6"
      >
        {/* Équipe pédagogique */}
        <SectionIconCard title="Équipe pédagogique" icon={GraduationCap}>
          {equipePedagogique.length > 0 ? (
            <div className="space-y-4">
              {equipePedagogique.map((intervenant) => (
                <div key={intervenant.id} className="flex items-start gap-3">
                  {intervenant.photoUrl ? (
                    <Image
                      src={intervenant.photoUrl}
                      alt={`${intervenant.prenom} ${intervenant.nom}`}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {intervenant.prenom} {intervenant.nom}
                      {intervenant.estFormateurPrincipal && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-full">
                          Formateur principal
                        </span>
                      )}
                    </p>
                    {intervenant.fonction && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{intervenant.fonction}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : formation.equipePedagogiqueDescription ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center whitespace-pre-line">
              {formation.equipePedagogiqueDescription}
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-500 text-center italic">
              Informations à venir
            </p>
          )}
        </SectionIconCard>

        {/* Suivi de l'exécution et évaluation des résultats */}
        <SectionIconCard title="Suivi de l'exécution et évaluation" icon={ClipboardCheck}>
          {formation.suiviEvaluation ? (
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {formation.suiviEvaluation.split("\n").filter(Boolean).map((line, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>{line.replace(/^[•\-\*]\s*/, "")}</span>
                </li>
              ))}
            </ul>
          ) : formation.methodesEvaluation.length > 0 ? (
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {formation.methodesEvaluation.map((method, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>{method}</span>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>Feuilles d&apos;émargement par demi-journée</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>Évaluation des acquis tout au long de la formation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>Certificat de réalisation remis à l&apos;issue</span>
              </li>
            </ul>
          )}
        </SectionIconCard>
      </motion.div>

      {/* ========================================= */}
      {/* RESSOURCES TECHNIQUES ET PÉDAGOGIQUES */}
      {/* ========================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl p-6 relative bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800"
      >
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <Settings className="w-6 h-6 text-brand-600 dark:text-brand-400" />
        </div>
        <h3 className="text-center font-bold text-gray-900 dark:text-white mt-4 mb-4">
          Ressources techniques et pédagogiques
        </h3>
        {formation.ressourcesPedagogiques ? (
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {formation.ressourcesPedagogiques.split("\n").filter(Boolean).map((line, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>{line.replace(/^[•\-\*]\s*/, "")}</span>
              </li>
            ))}
          </ul>
        ) : formation.moyensPedagogiques ? (
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {formation.moyensPedagogiques.split("\n").filter(Boolean).map((line, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>{line.replace(/^[•\-\*]\s*/, "")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-gray-400 mt-1">•</span>
              <span>Formation réalisée en présentiel ou à distance via visioconférence</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400 mt-1">•</span>
              <span>Accompagnement personnalisé par le formateur</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400 mt-1">•</span>
              <span>Supports de cours et ressources pédagogiques</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400 mt-1">•</span>
              <span>Espace apprenant avec documents accessibles</span>
            </li>
          </ul>
        )}
      </motion.div>

      {/* ========================================= */}
      {/* ACCESSIBILITÉ */}
      {/* ========================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <SectionCard title="Accessibilité" icon={Accessibility}>
          <p className="text-gray-700 dark:text-gray-300">
            {formation.accessibiliteHandicap ||
              "Nous mettons un point d'honneur à garantir l'accessibilité de nos formations aux personnes en situation de handicap. Si vous avez des besoins particuliers, n'hésitez pas à nous contacter en amont afin que nous puissions prendre les dispositions nécessaires pour vous assurer une expérience de formation optimale."}
          </p>
        </SectionCard>
      </motion.div>
    </div>
  );
}
