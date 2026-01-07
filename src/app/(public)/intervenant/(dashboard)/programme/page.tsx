"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useRequireIntervenantAuth, useIntervenantPortal } from "@/context/IntervenantPortalContext";
import {
  BookOpen,
  Clock,
  Users,
  Calendar,
  MapPin,
  Target,
  GraduationCap,
  Video,
  Building2,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Laptop,
  Timer,
  Accessibility,
  Info,
} from "lucide-react";

export default function IntervenantProgrammePage() {
  useRequireIntervenantAuth();
  const { selectedSession, isLoading, selectSession, sessions } = useIntervenantPortal();
  const searchParams = useSearchParams();

  // Sélectionner la session depuis l'URL si présente
  useEffect(() => {
    const sessionIdFromUrl = searchParams.get("session");
    if (sessionIdFromUrl && sessions.length > 0) {
      // Vérifier que la session existe
      const sessionExists = sessions.some(s => s.id === sessionIdFromUrl);
      if (sessionExists) {
        selectSession(sessionIdFromUrl);
      }
    }
  }, [searchParams, sessions, selectSession]);
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    description: true,
    objectifs: true,
    programme: true,
    public: false,
    prerequis: false,
    moyens: false,
    suivi: false,
    delai: false,
    accessibilite: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!selectedSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Aucune session sélectionnée
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Veuillez sélectionner une session dans le menu déroulant en haut de page pour voir les détails du programme.
        </p>
      </div>
    );
  }

  const formation = selectedSession.formation;

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Non défini";
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Objectifs pédagogiques - déjà un tableau
  const objectifsList = formation.objectifsPedagogiques || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* En-tête formation */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="relative h-48 bg-gradient-to-r from-emerald-500 to-emerald-600">
          {formation.image && (
            <Image
              src={formation.image}
              alt={formation.titre}
              fill
              className="object-cover opacity-30"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="min-w-0">
                <p className="text-emerald-100 text-sm mb-1">
                  {formation.reference}
                </p>
                <h1 className="text-2xl font-bold truncate">
                  {formation.titre}
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Infos clés */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wide">Durée</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formation.dureeHeures}h
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wide">Apprenants</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedSession.nombreApprenants}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                {formation.modalite === "DISTANCIEL" ? (
                  <Video className="w-4 h-4" />
                ) : formation.modalite === "MIXTE" ? (
                  <Building2 className="w-4 h-4" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
                <span className="text-xs uppercase tracking-wide">Modalité</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {formation.modalite?.toLowerCase().replace("_", " ") || "Présentiel"}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wide">Session</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedSession.nombreJournees ?? 0} jour{(selectedSession.nombreJournees ?? 0) > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dates de la session */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-500" />
          Dates de la session
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-4">
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">Début</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {formatDate(selectedSession.dateDebut)}
            </p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-4">
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">Fin</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {formatDate(selectedSession.dateFin)}
            </p>
          </div>
        </div>

        {selectedSession.lieu && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
              {selectedSession.lieu.typeLieu === "DISTANCIEL" ? (
                <Video className="w-4 h-4" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
              <span className="text-sm">Lieu de formation</span>
            </div>
            <p className="font-medium text-gray-900 dark:text-white">
              {selectedSession.lieu.nom}
            </p>
            {selectedSession.lieu.lieuFormation && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedSession.lieu.lieuFormation}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Description de la formation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => toggleSection("description")}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Description
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Présentation générale de la formation
              </p>
            </div>
          </div>
          {expandedSections.description ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.description && (
          <div className="px-6 pb-6">
            {formation.description ? (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {formation.description}
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                Description non renseignée
              </p>
            )}
          </div>
        )}
      </div>

      {/* Objectifs pédagogiques */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => toggleSection("objectifs")}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Objectifs pédagogiques
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ce que les apprenants sauront faire à l&apos;issue de la formation
              </p>
            </div>
          </div>
          {expandedSections.objectifs ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.objectifs && (
          <div className="px-6 pb-6">
            {objectifsList.length > 0 ? (
              <ul className="space-y-3">
                {objectifsList.map((objectif, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{objectif}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                Objectifs pédagogiques non renseignés
              </p>
            )}
          </div>
        )}
      </div>

      {/* Public cible */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => toggleSection("public")}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Public cible
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                À qui s&apos;adresse cette formation
              </p>
            </div>
          </div>
          {expandedSections.public ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.public && (
          <div className="px-6 pb-6">
            {formation.publicCible ? (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {formation.publicCible}
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                Public cible non renseigné
              </p>
            )}
          </div>
        )}
      </div>

      {/* Prérequis */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => toggleSection("prerequis")}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Prérequis
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Connaissances ou compétences requises
              </p>
            </div>
          </div>
          {expandedSections.prerequis ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.prerequis && (
          <div className="px-6 pb-6">
            {formation.prerequis ? (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {formation.prerequis}
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                Aucun prérequis spécifique
              </p>
            )}
          </div>
        )}
      </div>

      {/* Programme détaillé */}
      {formation.modules && formation.modules.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => toggleSection("programme")}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Programme détaillé
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formation.modules.length} module{formation.modules.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            {expandedSections.programme ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.programme && (
            <div className="px-6 pb-6">
              <div className="space-y-4">
                {formation.modules.map((module, index) => (
                  <div
                    key={module.id}
                    className="relative pl-8 pb-4 last:pb-0"
                  >
                    {/* Timeline line */}
                    {formation.modules && index < formation.modules.length - 1 && (
                      <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                    )}

                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1 w-6 h-6 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {index + 1}
                      </span>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {module.titre}
                          </h3>
                          {module.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {module.description}
                            </p>
                          )}
                        </div>
                        {module.duree && (
                          <span className="flex-shrink-0 px-2 py-1 text-xs font-medium bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600">
                            {module.duree}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ressources techniques et pédagogiques */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => toggleSection("moyens")}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <Laptop className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Ressources techniques et pédagogiques
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Moyens mis à disposition pour la formation
              </p>
            </div>
          </div>
          {expandedSections.moyens ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.moyens && (
          <div className="px-6 pb-6">
            {formation.moyensPedagogiques ? (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {formation.moyensPedagogiques}
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                Ressources techniques et pédagogiques non renseignées
              </p>
            )}
          </div>
        )}
      </div>

      {/* Suivi de l'exécution et évaluation des résultats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => toggleSection("suivi")}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 dark:bg-teal-500/20 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Suivi de l&apos;exécution et évaluation
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Modalités de suivi et d&apos;évaluation des résultats
              </p>
            </div>
          </div>
          {expandedSections.suivi ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.suivi && (
          <div className="px-6 pb-6">
            {formation.suiviEvaluation ? (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {formation.suiviEvaluation}
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                Modalités de suivi et d&apos;évaluation non renseignées
              </p>
            )}
          </div>
        )}
      </div>

      {/* Délai d'accès */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => toggleSection("delai")}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Timer className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Délai d&apos;accès
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Délai pour accéder à la formation
              </p>
            </div>
          </div>
          {expandedSections.delai ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.delai && (
          <div className="px-6 pb-6">
            {formation.delaiAcces ? (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {formation.delaiAcces}
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                Délai d&apos;accès non renseigné
              </p>
            )}
          </div>
        )}
      </div>

      {/* Accessibilité */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => toggleSection("accessibilite")}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 dark:bg-pink-500/20 rounded-lg flex items-center justify-center">
              <Accessibility className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Accessibilité
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Accessibilité aux personnes en situation de handicap
              </p>
            </div>
          </div>
          {expandedSections.accessibilite ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.accessibilite && (
          <div className="px-6 pb-6">
            {formation.accessibilite ? (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {formation.accessibilite}
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                Informations sur l&apos;accessibilité non renseignées
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
