"use client";

import { useState, useEffect, useRef } from "react";

interface Apprenant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

interface Participant {
  id: string;
  apprenant: Apprenant;
}

interface SignatureData {
  participantId: string;
  periode: string;
  signedAt: string;
  signatureData?: string;
}

interface Journee {
  id: string;
  date: string;
  heureDebutMatin: string | null;
  heureFinMatin: string | null;
  heureDebutAprem: string | null;
  heureFinAprem: string | null;
}

interface FeuilleEmargement {
  id: string;
  token: string;
  status: string;
  journee: Journee;
  signatures: SignatureData[];
}

interface FeuilleEmargementViewProps {
  feuille: FeuilleEmargement;
  participants: Participant[];
  formationTitre: string;
  onClose?: () => void;
}

// Icons
const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PrintIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

export default function FeuilleEmargementView({
  feuille,
  participants,
  formationTitre,
  onClose,
}: FeuilleEmargementViewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const hasMorning = feuille.journee.heureDebutMatin && feuille.journee.heureFinMatin;
  const hasAfternoon = feuille.journee.heureDebutAprem && feuille.journee.heureFinAprem;

  const getSignature = (participantId: string, periode: string) => {
    return feuille.signatures.find(
      (s) => s.participantId === participantId && s.periode === periode
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Statistiques
  const totalParticipants = participants.length;
  const signaturesMatin = feuille.signatures.filter((s) => s.periode === "matin").length;
  const signaturesAprem = feuille.signatures.filter((s) => s.periode === "apres_midi").length;

  // Imprimer la feuille
  const printFeuille = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full my-8">
        {/* Header - pas imprimé */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 print:hidden">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Feuille d&apos;émargement
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={printFeuille}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <PrintIcon /> Imprimer
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        </div>

        {/* Contenu imprimable */}
        <div ref={printRef} className="p-6 print:p-8">
          {/* En-tête de la feuille */}
          <div className="text-center mb-6 print:mb-8">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white print:text-2xl">
              Feuille d&apos;émargement
            </h1>
            <h2 className="text-lg text-gray-700 dark:text-gray-300 mt-2">
              {formationTitre}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {formatDate(feuille.journee.date)}
            </p>
          </div>

          {/* Horaires */}
          <div className="flex justify-center gap-8 mb-6 print:mb-8">
            {hasMorning && (
              <div className="text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Matin</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {feuille.journee.heureDebutMatin} - {feuille.journee.heureFinMatin}
                </p>
              </div>
            )}
            {hasAfternoon && (
              <div className="text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Après-midi</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {feuille.journee.heureDebutAprem} - {feuille.journee.heureFinAprem}
                </p>
              </div>
            )}
          </div>

          {/* Statistiques - pas imprimé */}
          <div className="grid grid-cols-3 gap-4 mb-6 print:hidden">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalParticipants}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Participants</p>
            </div>
            {hasMorning && (
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {signaturesMatin}/{totalParticipants}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Matin</p>
              </div>
            )}
            {hasAfternoon && (
              <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {signaturesAprem}/{totalParticipants}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Après-midi</p>
              </div>
            )}
          </div>

          {/* Tableau des signatures */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">
                  Participant
                </th>
                {hasMorning && (
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium text-gray-900 dark:text-white">
                    Matin
                  </th>
                )}
                {hasAfternoon && (
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium text-gray-900 dark:text-white">
                    Après-midi
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {participants.map((participant) => {
                const sigMatin = getSignature(participant.id, "matin");
                const sigAprem = getSignature(participant.id, "apres_midi");

                return (
                  <tr key={participant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {participant.apprenant.prenom} {participant.apprenant.nom}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {participant.apprenant.email}
                      </p>
                    </td>
                    {hasMorning && (
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center">
                        {sigMatin ? (
                          <div className="flex flex-col items-center">
                            {sigMatin.signatureData ? (
                              <img
                                src={sigMatin.signatureData}
                                alt="Signature"
                                className="max-h-12 print:max-h-8"
                              />
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                                <CheckIcon /> Signé
                              </span>
                            )}
                            <span className="text-xs text-gray-400 mt-1">
                              {formatTime(sigMatin.signedAt)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600 text-2xl print:text-gray-400">—</span>
                        )}
                      </td>
                    )}
                    {hasAfternoon && (
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center">
                        {sigAprem ? (
                          <div className="flex flex-col items-center">
                            {sigAprem.signatureData ? (
                              <img
                                src={sigAprem.signatureData}
                                alt="Signature"
                                className="max-h-12 print:max-h-8"
                              />
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                                <CheckIcon /> Signé
                              </span>
                            )}
                            <span className="text-xs text-gray-400 mt-1">
                              {formatTime(sigAprem.signedAt)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600 text-2xl print:text-gray-400">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {participants.length === 0 && (
            <div className="text-center py-8 border border-gray-300 dark:border-gray-600 border-t-0">
              <p className="text-gray-500 dark:text-gray-400">
                Aucun participant inscrit.
              </p>
            </div>
          )}

          {/* Pied de page pour impression */}
          <div className="mt-8 pt-4 border-t border-gray-300 dark:border-gray-600 hidden print:block">
            <p className="text-xs text-gray-400 text-center">
              Document généré le {new Date().toLocaleDateString("fr-FR")} à {new Date().toLocaleTimeString("fr-FR")}
            </p>
          </div>
        </div>
      </div>

      {/* Style d'impression */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed {
            position: absolute;
            background: white !important;
          }
          .fixed > div {
            box-shadow: none !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
          .fixed > div > div:last-child,
          .fixed > div > div:last-child * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
