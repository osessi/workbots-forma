"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRequireIntervenantAuth, useIntervenantPortal } from "@/context/IntervenantPortalContext";
import {
  PenLine,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Eye,
  X,
  Loader2,
  Check,
  UserCheck,
  Pen,
  Send,
  User,
} from "lucide-react";

interface Journee {
  id: string;
  date: string;
  heureDebutMatin: string | null;
  heureFinMatin: string | null;
  heureDebutAprem: string | null;
  heureFinAprem: string | null;
  feuilleId?: string;
  feuilleToken?: string;
  signaturesMatin: number;
  signaturesAprem: number;
  totalParticipants: number;
  // Correction 505: Signatures de l'intervenant
  intervenantSignatureMatin?: { id: string; signedAt: string | null } | null;
  intervenantSignatureAprem?: { id: string; signedAt: string | null } | null;
}

interface Participant {
  id: string;
  apprenant: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
}

interface Signature {
  id: string;
  signataire: string;
  participantId: string | null;
  intervenantId: string | null;
  periode: string;
  signedAt: string | null;
  signatureData: string | null;
}

interface FeuilleDetail {
  journee: {
    id: string;
    date: string;
    heureDebutMatin: string | null;
    heureFinMatin: string | null;
    heureDebutAprem: string | null;
    heureFinAprem: string | null;
  };
  formation: {
    titre: string;
  };
  // Correction 506: Ajout du formateur
  formateur: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  } | null;
  participants: Participant[];
  feuille: {
    id: string;
    token: string;
    status: string;
    signatures: Signature[];
  };
  intervenantId: string;
}

export default function IntervenantEmargementsPage() {
  useRequireIntervenantAuth();
  const { selectedSession, token, isLoading } = useIntervenantPortal();
  const [journees, setJournees] = useState<Journee[]>([]);
  const [loadingJournees, setLoadingJournees] = useState(false);
  const [selectedJournee, setSelectedJournee] = useState<Journee | null>(null);
  const [feuilleDetail, setFeuilleDetail] = useState<FeuilleDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  // Correction 505: État pour la signature en cours
  const [signingPeriode, setSigningPeriode] = useState<{ journeeId: string; periode: string } | null>(null);
  // Correction 508: État pour l'envoi de relances
  const [sendingRelance, setSendingRelance] = useState(false);

  const fetchJournees = useCallback(async () => {
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
  }, [selectedSession, token]);

  useEffect(() => {
    if (selectedSession && token) {
      fetchJournees();
    }
  }, [selectedSession, token, fetchJournees]);

  const openFeuilleDetail = async (journee: Journee) => {
    setSelectedJournee(journee);
    setLoadingDetail(true);
    setFeuilleDetail(null);

    try {
      const res = await fetch(`/api/intervenant/emargements/${journee.id}?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setFeuilleDetail(data);
      }
    } catch (error) {
      console.error("Erreur fetch détail:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeFeuilleDetail = () => {
    setSelectedJournee(null);
    setFeuilleDetail(null);
    // Rafraîchir les journées après fermeture
    fetchJournees();
  };

  // Correction 505: Signer l'émargement intervenant
  const signEmargement = async (journeeId: string, periode: string) => {
    if (!token) return;

    setSigningPeriode({ journeeId, periode });
    try {
      const res = await fetch(`/api/intervenant/emargements/${journeeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, periode }),
      });

      if (res.ok) {
        // Rafraîchir les données
        fetchJournees();
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la signature");
      }
    } catch (error) {
      console.error("Erreur signature:", error);
      alert("Erreur lors de la signature");
    } finally {
      setSigningPeriode(null);
    }
  };

  // Correction 505: Déterminer le statut d'un créneau pour l'intervenant
  const getIntervenantCreneauStatus = (journee: Journee, periode: "matin" | "aprem") => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const journeeDate = new Date(journee.date);
    journeeDate.setHours(0, 0, 0, 0);

    // Si déjà signé
    const signature = periode === "matin" ? journee.intervenantSignatureMatin : journee.intervenantSignatureAprem;
    if (signature) {
      return { status: "signe", label: "Signé", canSign: false };
    }

    // Si journée future
    if (journeeDate > today) {
      return { status: "avenir", label: "À venir", canSign: false };
    }

    // Si journée passée (non signée)
    if (journeeDate < today) {
      return { status: "disponible", label: "Disponible", canSign: true };
    }

    // Journée d'aujourd'hui - vérifier l'heure
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinutes;

    if (periode === "matin") {
      const heureDebut = journee.heureDebutMatin || "09:00";
      const [hDebut, mDebut] = heureDebut.split(":").map(Number);
      const startTime = hDebut * 60 + (mDebut || 0);

      if (currentTime >= startTime) {
        return { status: "disponible", label: "Disponible", canSign: true };
      } else {
        return { status: "avenir", label: `À partir de ${heureDebut}`, canSign: false };
      }
    } else {
      const heureDebut = journee.heureDebutAprem || "14:00";
      const [hDebut, mDebut] = heureDebut.split(":").map(Number);
      const startTime = hDebut * 60 + (mDebut || 0);

      if (currentTime >= startTime) {
        return { status: "disponible", label: "Disponible", canSign: true };
      } else {
        return { status: "avenir", label: `À partir de ${heureDebut}`, canSign: false };
      }
    }
  };

  const getSignature = (participantId: string, periode: string) => {
    return feuilleDetail?.feuille.signatures.find(
      (s) => s.participantId === participantId && s.periode === periode
    );
  };

  // Correction 506: Récupérer la signature de l'intervenant
  const getIntervenantSignature = (periode: string) => {
    return feuilleDetail?.feuille.signatures.find(
      (s) => s.intervenantId && (s.periode === periode || (periode === "apres_midi" && s.periode === "aprem"))
    );
  };

  // Correction 508: Envoyer les relances aux participants non signés
  const sendRelance = async () => {
    if (!selectedJournee || !token) return;

    setSendingRelance(true);
    try {
      const res = await fetch(`/api/intervenant/emargements/${selectedJournee.id}/relance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || "Relances envoyées avec succès");
      } else {
        alert(data.error || "Erreur lors de l'envoi des relances");
      }
    } catch (error) {
      console.error("Erreur relance:", error);
      alert("Erreur lors de l'envoi des relances");
    } finally {
      setSendingRelance(false);
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
      {/* En-tête - Correction 504: Sous-titre reformulé */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Émargements
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Consultez les feuilles de présence et l&apos;avancement des signatures.
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
          {/* Section titre: Signatures apprenants */}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            Signatures des apprenants
          </h2>

          {journees.map((journee) => {
            const statusInfo = getEmargementStatus(journee);
            const isClickable = statusInfo.status !== "future";

            return (
              <button
                key={journee.id}
                onClick={() => isClickable && openFeuilleDetail(journee)}
                disabled={!isClickable}
                className={`w-full text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-all ${
                  isClickable
                    ? "hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md cursor-pointer"
                    : "opacity-75 cursor-not-allowed"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Date et horaires */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isClickable
                          ? "bg-emerald-100 dark:bg-emerald-500/20"
                          : "bg-gray-100 dark:bg-gray-700"
                      }`}>
                        <Calendar className={`w-6 h-6 ${
                          isClickable
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-gray-400 dark:text-gray-500"
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white capitalize">
                          {formatDate(journee.date)}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>
                            {journee.heureDebutMatin || "09:00"} - {journee.heureFinMatin || "12:30"}
                            {" / "}
                            {journee.heureDebutAprem || "14:00"} - {journee.heureFinAprem || "17:30"}
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
                      {isClickable && (
                        <span className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5">
                          <Eye className="w-4 h-4" />
                          Ouvrir
                        </span>
                      )}
                      <ChevronRight className={`w-5 h-5 ${isClickable ? "text-emerald-400" : "text-gray-300"}`} />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Correction 505: Bloc Émargement intervenant */}
      {journees.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-500" />
            Émargement intervenant
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 -mt-1">
            Signez votre présence pour chaque demi-journée de formation.
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {journees.map((journee) => {
                const matinStatus = getIntervenantCreneauStatus(journee, "matin");
                const apremStatus = getIntervenantCreneauStatus(journee, "aprem");

                return (
                  <div key={`intervenant-${journee.id}`} className="p-4">
                    {/* En-tête de la journée */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white capitalize">
                          {formatDate(journee.date)}
                        </p>
                      </div>
                    </div>

                    {/* Créneaux */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-13">
                      {/* Créneau Matin */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">Matin</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {journee.heureDebutMatin || "09:00"} – {journee.heureFinMatin || "12:30"}
                          </p>
                        </div>
                        {matinStatus.status === "signe" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-sm font-medium rounded-lg">
                            <Check className="w-4 h-4" />
                            Signé
                          </span>
                        ) : matinStatus.canSign ? (
                          <button
                            onClick={() => signEmargement(journee.id, "matin")}
                            disabled={signingPeriode?.journeeId === journee.id && signingPeriode?.periode === "matin"}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            {signingPeriode?.journeeId === journee.id && signingPeriode?.periode === "matin" ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Pen className="w-4 h-4" />
                            )}
                            Signer
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm rounded-lg">
                            <Clock className="w-4 h-4" />
                            {matinStatus.label}
                          </span>
                        )}
                      </div>

                      {/* Créneau Après-midi */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">Après-midi</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {journee.heureDebutAprem || "14:00"} – {journee.heureFinAprem || "17:30"}
                          </p>
                        </div>
                        {apremStatus.status === "signe" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-sm font-medium rounded-lg">
                            <Check className="w-4 h-4" />
                            Signé
                          </span>
                        ) : apremStatus.canSign ? (
                          <button
                            onClick={() => signEmargement(journee.id, "aprem")}
                            disabled={signingPeriode?.journeeId === journee.id && signingPeriode?.periode === "aprem"}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            {signingPeriode?.journeeId === journee.id && signingPeriode?.periode === "aprem" ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Pen className="w-4 h-4" />
                            )}
                            Signer
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm rounded-lg">
                            <Clock className="w-4 h-4" />
                            {apremStatus.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal détail feuille d'émargement */}
      {selectedJournee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header - Correction 507: Bouton "Émargement en ligne" retiré */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Feuille d&apos;émargement
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(selectedJournee.date)}
                </p>
              </div>
              <button
                onClick={closeFeuilleDetail}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              ) : feuilleDetail ? (
                <div className="space-y-6">
                  {/* Infos formation */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {feuilleDetail.formation.titre}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(feuilleDetail.journee.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Matin : {feuilleDetail.journee.heureDebutMatin || "09:00"} – {feuilleDetail.journee.heureFinMatin || "12:30"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Après-midi : {feuilleDetail.journee.heureDebutAprem || "14:00"} – {feuilleDetail.journee.heureFinAprem || "17:30"}
                      </span>
                    </div>
                  </div>

                  {/* Stats signatures - Correction 506: Compteurs incluant l'intervenant */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {feuilleDetail.participants.length + 1}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Participants</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {feuilleDetail.feuille.signatures.filter(s => s.periode === "matin").length}/{feuilleDetail.participants.length + 1}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Matin</p>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {feuilleDetail.feuille.signatures.filter(s => s.periode === "apres_midi" || s.periode === "aprem").length}/{feuilleDetail.participants.length + 1}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Après-midi</p>
                    </div>
                  </div>

                  {/* Tableau des participants */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                          <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                            Participant
                          </th>
                          <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                            Matin
                          </th>
                          <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                            Après-midi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {feuilleDetail.participants.map((participant) => {
                          const sigMatin = getSignature(participant.id, "matin");
                          const sigAprem = getSignature(participant.id, "apres_midi");

                          return (
                            <tr key={participant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="border border-gray-200 dark:border-gray-600 px-4 py-3">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {participant.apprenant.prenom} {participant.apprenant.nom}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {participant.apprenant.email}
                                </p>
                              </td>
                              <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-center">
                                {sigMatin ? (
                                  <div className="flex flex-col items-center">
                                    {sigMatin.signatureData ? (
                                      <img
                                        src={sigMatin.signatureData}
                                        alt="Signature"
                                        className="max-h-10 max-w-24"
                                      />
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-xs rounded-full">
                                        <Check className="w-3 h-3" /> Signé
                                      </span>
                                    )}
                                    {sigMatin.signedAt && (
                                      <span className="text-xs text-gray-400 mt-1">
                                        {formatDateTime(sigMatin.signedAt)}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-300 dark:text-gray-600 text-xl">—</span>
                                )}
                              </td>
                              <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-center">
                                {sigAprem ? (
                                  <div className="flex flex-col items-center">
                                    {sigAprem.signatureData ? (
                                      <img
                                        src={sigAprem.signatureData}
                                        alt="Signature"
                                        className="max-h-10 max-w-24"
                                      />
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-xs rounded-full">
                                        <Check className="w-3 h-3" /> Signé
                                      </span>
                                    )}
                                    {sigAprem.signedAt && (
                                      <span className="text-xs text-gray-400 mt-1">
                                        {formatDateTime(sigAprem.signedAt)}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-300 dark:text-gray-600 text-xl">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Correction 506: Ligne Intervenant */}
                        {feuilleDetail.formateur && (() => {
                          const sigIntervenantMatin = getIntervenantSignature("matin");
                          const sigIntervenantAprem = getIntervenantSignature("apres_midi");

                          return (
                            <tr className="bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20">
                              <td className="border border-gray-200 dark:border-gray-600 px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      Intervenant
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {feuilleDetail.formateur.prenom} {feuilleDetail.formateur.nom}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-center">
                                {sigIntervenantMatin ? (
                                  <div className="flex flex-col items-center">
                                    {sigIntervenantMatin.signatureData ? (
                                      <img
                                        src={sigIntervenantMatin.signatureData}
                                        alt="Signature"
                                        className="max-h-10 max-w-24"
                                      />
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-xs rounded-full">
                                        <Check className="w-3 h-3" /> Signé
                                      </span>
                                    )}
                                    {sigIntervenantMatin.signedAt && (
                                      <span className="text-xs text-gray-400 mt-1">
                                        {formatDateTime(sigIntervenantMatin.signedAt)}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-300 dark:text-gray-600 text-xl">—</span>
                                )}
                              </td>
                              <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-center">
                                {sigIntervenantAprem ? (
                                  <div className="flex flex-col items-center">
                                    {sigIntervenantAprem.signatureData ? (
                                      <img
                                        src={sigIntervenantAprem.signatureData}
                                        alt="Signature"
                                        className="max-h-10 max-w-24"
                                      />
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-xs rounded-full">
                                        <Check className="w-3 h-3" /> Signé
                                      </span>
                                    )}
                                    {sigIntervenantAprem.signedAt && (
                                      <span className="text-xs text-gray-400 mt-1">
                                        {formatDateTime(sigIntervenantAprem.signedAt)}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-300 dark:text-gray-600 text-xl">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {feuilleDetail.participants.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Aucun participant inscrit à cette session
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Erreur lors du chargement des données
                  </p>
                </div>
              )}
            </div>

            {/* Footer - Correction 508: Bouton de relance des participants non signés */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeFeuilleDetail}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Fermer
              </button>
              {feuilleDetail && (
                <button
                  onClick={sendRelance}
                  disabled={sendingRelance}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {sendingRelance ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Relancer les non-signés
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
