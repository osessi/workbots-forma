"use client";

// ===========================================
// CORRECTIONS 477-482: Page "Mes Certifications"
// ===========================================
// 477: Afficher 2 blocs : Attestation + Diplôme
// 478: Nouveau titre et sous-titre
// 479: Attestation disponible 1h avant fin de session
// 480: Diplôme disponible si moyenne obtenue à l'évaluation finale
// 481: Diplôme généré avec balises (nom, formation, date, organisme)
// 482: Supprimer le bloc informatif Qualiopi

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import {
  FileText,
  Award,
  Download,
  Clock,
  CheckCircle2,
  Lock,
  Loader2,
  AlertCircle,
  Trophy,
  Calendar,
  Building,
  GraduationCap,
} from "lucide-react";

// =====================================
// TYPES
// =====================================

interface CertificationsData {
  attestation: {
    disponible: boolean;
    dateDisponibilite: string | null;
    sessionId: string;
    sessionReference: string;
    sessionNom: string | null;
    formationTitre: string;
    apprenant: {
      nom: string;
      prenom: string;
    };
    organisme: string | null;
    periode: {
      debut: string | null;
      fin: string | null;
    } | null;
  } | null;
  diplome: {
    disponible: boolean;
    score: number | null;
    scoreMinimum: number;
    sessionId: string;
    sessionReference: string;
    sessionNom: string | null;
    formationTitre: string;
    apprenant: {
      nom: string;
      prenom: string;
    };
    organisme: string | null;
    dateObtention: string | null;
  } | null;
}

// =====================================
// COMPOSANT BLOC ATTESTATION
// =====================================

function AttestationCard({
  attestation,
  token,
}: {
  attestation: CertificationsData["attestation"];
  token: string;
}) {
  if (!attestation) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-100 dark:border-blue-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Attestation de fin de formation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Document officiel attestant de votre participation
            </p>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6 space-y-4">
        {/* Infos formation */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <GraduationCap className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Formation
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {attestation.formationTitre}
              </p>
            </div>
          </div>

          {attestation.periode && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Période
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Du {formatDate(attestation.periode.debut)} au {formatDate(attestation.periode.fin)}
                </p>
              </div>
            </div>
          )}

          {attestation.organisme && (
            <div className="flex items-start gap-3">
              <Building className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Organisme
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {attestation.organisme}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Statut et bouton */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          {attestation.disponible ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Disponible</span>
              </div>
              <a
                href={`/api/apprenant/certifications/attestation?token=${token}&sessionId=${attestation.sessionId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
              >
                <Download className="w-5 h-5" />
                Télécharger l&apos;attestation
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Disponible à partir du {formatDateTime(attestation.dateDisponibilite)}
                </span>
              </div>
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium rounded-xl cursor-not-allowed"
              >
                <Lock className="w-5 h-5" />
                Disponible en fin de session
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// =====================================
// COMPOSANT BLOC DIPLÔME
// =====================================

function DiplomeCard({
  diplome,
  token,
}: {
  diplome: CertificationsData["diplome"];
  token: string;
}) {
  if (!diplome) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-100 dark:border-amber-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Award className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Diplôme
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Certificat de réussite à la formation
            </p>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6 space-y-4">
        {/* Infos formation */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <GraduationCap className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Formation
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {diplome.formationTitre}
              </p>
            </div>
          </div>

          {/* Score requis */}
          <div className="flex items-start gap-3">
            <Trophy className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Condition d&apos;obtention
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Score minimum requis : {diplome.scoreMinimum}% à l&apos;évaluation finale
              </p>
            </div>
          </div>

          {/* Score obtenu si disponible */}
          {diplome.score !== null && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Votre score
                </span>
                <span
                  className={`text-lg font-bold ${
                    diplome.disponible
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {Math.round(diplome.score)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    diplome.disponible
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(100, diplome.score)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>0%</span>
                <span className="text-amber-600 dark:text-amber-400">
                  Seuil : {diplome.scoreMinimum}%
                </span>
                <span>100%</span>
              </div>
            </div>
          )}
        </div>

        {/* Statut et bouton */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          {diplome.disponible ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Félicitations ! Diplôme obtenu</span>
              </div>
              <a
                href={`/api/apprenant/certifications/diplome?token=${token}&sessionId=${diplome.sessionId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-xl transition-colors"
              >
                <Download className="w-5 h-5" />
                Télécharger le diplôme
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Lock className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {diplome.score === null
                    ? "Passez l'évaluation finale pour débloquer"
                    : `Score insuffisant (${Math.round(diplome.score)}% < ${diplome.scoreMinimum}%)`}
                </span>
              </div>
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium rounded-xl cursor-not-allowed"
              >
                <Lock className="w-5 h-5" />
                Disponible après réussite
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function CertificationsPage() {
  const { token, selectedSession } = useApprenantPortal();
  const [data, setData] = useState<CertificationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertifications = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({ token });
        if (selectedSession?.sessionId) {
          params.append("sessionId", selectedSession.sessionId);
        }

        const res = await fetch(`/api/apprenant/certifications?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Erreur lors du chargement des certifications");
        }

        const certificationsData = await res.json();
        setData(certificationsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchCertifications();
  }, [token, selectedSession?.sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Chargement des certifications...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 dark:text-white font-medium mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-brand-600 hover:text-brand-700 text-sm font-medium"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Correction 478 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Mes certifications
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Retrouvez ici vos documents de fin de formation.
        </p>
      </div>

      {/* Message si pas de session sélectionnée */}
      {!selectedSession && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Sélectionnez une session de formation pour accéder à vos documents.
            </p>
          </div>
        </motion.div>
      )}

      {/* Blocs Attestation et Diplôme - Correction 477 */}
      {data && token && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Bloc 1 : Attestation - Correction 479 */}
          <AttestationCard attestation={data.attestation} token={token} />

          {/* Bloc 2 : Diplôme - Correction 480 */}
          <DiplomeCard diplome={data.diplome} token={token} />
        </div>
      )}

      {/* État vide si pas de données */}
      {(!data || (!data.attestation && !data.diplome)) && selectedSession && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center"
        >
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Aucun document disponible
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Vos documents de fin de formation seront disponibles une fois la session terminée.
          </p>
        </motion.div>
      )}

      {/* Correction 482: Bloc Qualiopi supprimé */}
    </div>
  );
}
