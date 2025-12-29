"use client";

import React, { useState, useEffect } from "react";
import { useRequireIntervenantAuth, useIntervenantPortal } from "@/context/IntervenantPortalContext";
import {
  PenLine,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Download,
  Eye,
} from "lucide-react";

interface Journee {
  id: string;
  date: string;
  heureDebutMatin: string;
  heureFinMatin: string;
  heureDebutAprem: string;
  heureFinAprem: string;
  feuilleId?: string;
  signaturesMatin: number;
  signaturesAprem: number;
  totalParticipants: number;
}

export default function IntervenantEmargementsPage() {
  useRequireIntervenantAuth();
  const { selectedSession, token, isLoading } = useIntervenantPortal();
  const [journees, setJournees] = useState<Journee[]>([]);
  const [loadingJournees, setLoadingJournees] = useState(false);

  useEffect(() => {
    if (selectedSession && token) {
      fetchJournees();
    }
  }, [selectedSession, token]);

  const fetchJournees = async () => {
    if (!selectedSession || !token) return;

    setLoadingJournees(true);
    try {
      const res = await fetch(`/api/intervenant/emargements?token=${token}&sessionId=${selectedSession.id}`);
      if (res.ok) {
        const data = await res.json();
        setJournees(data.journees || []);
      }
    } catch (error) {
      console.error("Erreur fetch journées:", error);
    } finally {
      setLoadingJournees(false);
    }
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
        <PenLine className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Aucune session sélectionnée
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Veuillez sélectionner une session pour gérer les émargements.
        </p>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const getEmargementStatus = (journee: Journee) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const journeeDate = new Date(journee.date);
    journeeDate.setHours(0, 0, 0, 0);

    if (journeeDate > today) {
      return { status: "future", label: "À venir", color: "text-gray-400", bg: "bg-gray-100 dark:bg-gray-700" };
    }

    const totalSignatures = journee.signaturesMatin + journee.signaturesAprem;
    const expectedSignatures = journee.totalParticipants * 2;

    if (totalSignatures === expectedSignatures) {
      return { status: "complete", label: "Complet", color: "text-green-600", bg: "bg-green-100 dark:bg-green-500/20" };
    } else if (totalSignatures > 0) {
      return { status: "partial", label: "Partiel", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-500/20" };
    } else {
      return { status: "missing", label: "En attente", color: "text-red-600", bg: "bg-red-100 dark:bg-red-500/20" };
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Émargements
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {selectedSession.formation.titre} - Gestion des feuilles de présence
        </p>
      </div>

      {/* Stats résumé */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">Journées</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {journees.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs">Participants</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {selectedSession.nombreApprenants}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-green-500 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs">Complètes</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {journees.filter(j => getEmargementStatus(j).status === "complete").length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">En attente</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">
            {journees.filter(j => getEmargementStatus(j).status === "partial" || getEmargementStatus(j).status === "missing").length}
          </p>
        </div>
      </div>

      {/* Liste des journées */}
      {loadingJournees ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : journees.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <PenLine className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            Aucune journée de formation planifiée
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {journees.map((journee) => {
            const statusInfo = getEmargementStatus(journee);

            return (
              <div
                key={journee.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Date et horaires */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white capitalize">
                          {formatDate(journee.date)}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>
                            {journee.heureDebutMatin || "09:00"} - {journee.heureFinAprem || "17:00"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Matin</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {journee.signaturesMatin}/{journee.totalParticipants}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Après-midi</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {journee.signaturesAprem}/{journee.totalParticipants}
                      </p>
                    </div>

                    {/* Status */}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {journee.feuilleId && (
                        <>
                          <button
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Voir la feuille"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Télécharger"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
