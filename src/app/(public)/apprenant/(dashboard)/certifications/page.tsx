"use client";

import React from "react";
import { motion } from "framer-motion";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import {
  Award,
  Calendar,
  Download,
  Eye,
  ExternalLink,
  Loader2,
  FileCheck,
  BookOpen,
} from "lucide-react";

// =====================================
// COMPOSANT CARTE CERTIFICATION
// =====================================

function CertificationCard({
  certification,
  index,
}: {
  certification: {
    id: string;
    formationId: string;
    formationTitre: string;
    numeroFicheRS: string | null;
    lienFranceCompetences: string | null;
    sessionReference: string;
    dateCertification: string | null;
    numeroCertificat: string | null;
  };
  index: number;
}) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header avec badge */}
      <div className="relative p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-4">
          {/* Icône certification */}
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Award className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Info formation */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
              {certification.formationTitre}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" />
                Certifié
              </span>
              {certification.numeroFicheRS && (
                <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-medium">
                  RS {certification.numeroFicheRS}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Détails */}
      <div className="p-6 space-y-4">
        {/* Infos de certification */}
        <div className="grid grid-cols-2 gap-4">
          {/* Date d'obtention */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Date d&apos;obtention
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatDate(certification.dateCertification)}
            </p>
          </div>

          {/* Numéro de certificat */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                N° Certificat
              </span>
            </div>
            <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
              {certification.numeroCertificat || "N/A"}
            </p>
          </div>
        </div>

        {/* Session de référence */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Session : <span className="font-mono">{certification.sessionReference}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* Prévisualiser */}
          <a
            href={`/api/apprenant/certificate/${certification.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium rounded-xl hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Prévisualiser
          </a>

          {/* Télécharger */}
          <a
            href={`/api/apprenant/certificate/${certification.id}`}
            download={`certificat-${certification.numeroCertificat || certification.id}.html`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            Télécharger
          </a>
        </div>

        {/* Lien France Compétences */}
        {certification.lienFranceCompetences && (
          <a
            href={certification.lienFranceCompetences}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Voir sur France Compétences
          </a>
        )}
      </div>
    </motion.div>
  );
}

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function CertificationsPage() {
  const { certifications, isLoading } = useApprenantPortal();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des certifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Mes Certifications
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Retrouvez toutes vos certifications obtenues
        </p>
      </div>

      {/* Statistiques */}
      {certifications && certifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <p className="text-amber-100 text-sm">Total certifications</p>
              <p className="text-4xl font-bold">{certifications.length}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Liste des certifications */}
      {certifications && certifications.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {certifications.map((cert, index) => (
            <CertificationCard key={cert.id} certification={cert} index={index} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center"
        >
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Aucune certification
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Vous n&apos;avez pas encore de certification. Continuez votre parcours de formation pour obtenir vos premières certifications !
          </p>
        </motion.div>
      )}

      {/* Info Qualiopi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-start gap-3"
      >
        <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Certifications conformes Qualiopi
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Vos certifications sont délivrées conformément aux exigences de l&apos;indicateur 3 du référentiel Qualiopi.
            Vous pouvez les télécharger et les présenter comme justificatif de vos compétences acquises.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
