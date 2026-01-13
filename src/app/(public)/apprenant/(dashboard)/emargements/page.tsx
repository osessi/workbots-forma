"use client";

// ===========================================
// CORRECTIONS 439-441: Page "Émargements"
// ===========================================
// 439: Reformuler sous-titre
// 440: Compteurs basés sur la session sélectionnée (demi-journées)
// 441: Affichage demi-journées + règles d'ouverture de signature

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import {
  PenLine,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  User,
  Loader2,
  AlertCircle,
  X,
  Trash2,
  Check,
  Sun,
  Sunset,
  Lock,
} from "lucide-react";

// =====================================
// TYPES
// =====================================

interface DemiJournee {
  id: string;
  journeeId: string;
  jour: number;
  date: string;
  periode: "matin" | "aprem";
  heureDebut: string;
  heureFin: string;
  statut: "a_venir" | "ouvert" | "signe";
  feuilleId: string | null;
  sessionNom: string;
  sessionReference: string;
  lieu: string | null;
  formateur: string | null;
}

interface EmargementsData {
  demiJournees: DemiJournee[];
  stats: {
    total: number;
    signes: number;
    enAttente: number;
  };
  formationTitre: string | null;
  participantId: string;
}

// =====================================
// COMPOSANT SIGNATURE CANVAS
// =====================================

function SignatureModal({
  isOpen,
  onClose,
  onSign,
  demiJournee,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSign: (signature: string) => void;
  demiJournee: DemiJournee;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#1f2937";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [isOpen]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSign = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    const signature = canvas.toDataURL("image/png");
    onSign(signature);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Signer l&apos;émargement
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Jour {demiJournee.jour} – {new Date(demiJournee.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })} – {demiJournee.periode === "matin" ? "Matin" : "Après-midi"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Canvas */}
          <div className="p-4">
            <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900">
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                className="w-full touch-none cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    Dessinez votre signature ici
                  </p>
                </div>
              )}
            </div>

            {/* Info session */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm">
              <p className="font-medium text-gray-900 dark:text-white">
                {demiJournee.sessionNom}
              </p>
              <div className="flex flex-wrap gap-3 mt-2 text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {demiJournee.heureDebut} – {demiJournee.heureFin}
                </span>
                {demiJournee.lieu && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {demiJournee.lieu}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={clearCanvas}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Effacer
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSign}
                disabled={!hasDrawn}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                Valider
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// =====================================
// COMPOSANT DEMI-JOURNÉE CARD
// =====================================

function DemiJourneeCard({
  demiJournee,
  index,
  onSign,
}: {
  demiJournee: DemiJournee;
  index: number;
  onSign: (demiJournee: DemiJournee) => void;
}) {
  const isToday = new Date(demiJournee.date).toDateString() === new Date().toDateString();

  // Icône et couleur selon la période
  const PeriodeIcon = demiJournee.periode === "matin" ? Sun : Sunset;
  const periodeLabel = demiJournee.periode === "matin" ? "Matin" : "Après-midi";

  // Style selon le statut
  const getStatutStyle = () => {
    switch (demiJournee.statut) {
      case "signe":
        return {
          bgClass: "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30",
          badgeClass: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400",
          badgeLabel: "Signé",
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        };
      case "ouvert":
        return {
          bgClass: "bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/30",
          badgeClass: "bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400",
          badgeLabel: "Ouvert",
          icon: <PenLine className="w-5 h-5 text-brand-500" />,
        };
      default:
        return {
          bgClass: "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600",
          badgeClass: "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400",
          badgeLabel: "À venir",
          icon: <Lock className="w-5 h-5 text-gray-400" />,
        };
    }
  };

  const statutStyle = getStatutStyle();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-xl border overflow-hidden ${statutStyle.bgClass} ${
        isToday ? "ring-2 ring-brand-500/30" : ""
      }`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Info principale */}
          <div className="flex items-center gap-4">
            {/* Icône période */}
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                demiJournee.periode === "matin"
                  ? "bg-amber-100 dark:bg-amber-500/20"
                  : "bg-orange-100 dark:bg-orange-500/20"
              }`}
            >
              <PeriodeIcon
                className={`w-6 h-6 ${
                  demiJournee.periode === "matin"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-orange-600 dark:text-orange-400"
                }`}
              />
            </div>

            {/* Détails */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Jour {demiJournee.jour} – {new Date(demiJournee.date).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </h3>
                {isToday && (
                  <span className="text-xs px-2 py-0.5 bg-brand-500 text-white rounded-full">
                    Aujourd&apos;hui
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <PeriodeIcon className="w-4 h-4" />
                  {periodeLabel}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {demiJournee.heureDebut} – {demiJournee.heureFin}
                </span>
              </div>
            </div>
          </div>

          {/* Statut + Action */}
          <div className="flex items-center gap-3">
            {/* Badge statut */}
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statutStyle.badgeClass}`}>
              {statutStyle.icon}
              {statutStyle.badgeLabel}
            </span>

            {/* Bouton signer si ouvert */}
            {demiJournee.statut === "ouvert" && (
              <button
                onClick={() => onSign(demiJournee)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors"
              >
                <PenLine className="w-4 h-4" />
                Signer
              </button>
            )}
          </div>
        </div>

        {/* Info supplémentaires (lieu, formateur) - affichées seulement si présentes */}
        {(demiJournee.lieu || demiJournee.formateur) && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
            {demiJournee.lieu && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {demiJournee.lieu}
              </span>
            )}
            {demiJournee.formateur && (
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {demiJournee.formateur}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function EmargementsPage() {
  // Correction 440: Utiliser selectedSession pour filtrer par session
  const { token, selectedSession, refreshData } = useApprenantPortal();
  const [data, setData] = useState<EmargementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingDemiJournee, setSigningDemiJournee] = useState<DemiJournee | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchEmargements = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ token });
      // Correction 440: Filtrer par sessionId
      if (selectedSession?.sessionId) {
        params.append("sessionId", selectedSession.sessionId);
      }

      const res = await fetch(`/api/apprenant/emargements?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Erreur lors du chargement des émargements");
      }

      const emargementsData = await res.json();
      setData(emargementsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmargements();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedSession?.sessionId]);

  const handleSign = async (signature: string) => {
    if (!signingDemiJournee || !token || !data?.participantId) return;

    // Vérifier qu'une feuille existe
    if (!signingDemiJournee.feuilleId) {
      setError("Impossible de signer : feuille d'émargement non créée pour cette journée.");
      setSigningDemiJournee(null);
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/apprenant/emargements/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          feuilleId: signingDemiJournee.feuilleId,
          periode: signingDemiJournee.periode,
          signature,
        }),
      });

      if (!res.ok) {
        const responseData = await res.json();
        throw new Error(responseData.error || "Erreur lors de la signature");
      }

      // Rafraîchir les données
      await fetchEmargements();
      await refreshData();
      setSigningDemiJournee(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des émargements...</p>
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
            onClick={fetchEmargements}
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
      {/* Header - Correction 439 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Émargements
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Retrouvez ici vos feuilles d&apos;émargement et signez-les au moment prévu.
        </p>
      </div>

      {/* Stats - Correction 440 */}
      {data?.stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.stats.total}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data.stats.signes}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Signés</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {data.stats.enAttente}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">En attente</p>
          </div>
        </div>
      )}

      {/* Liste des demi-journées - Correction 441 */}
      {data?.demiJournees && data.demiJournees.length > 0 ? (
        <div className="space-y-3">
          {data.demiJournees.map((demiJournee, index) => (
            <DemiJourneeCard
              key={demiJournee.id}
              demiJournee={demiJournee}
              index={index}
              onSign={(dj) => setSigningDemiJournee(dj)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Aucune journée planifiée
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {selectedSession
              ? "Cette session n'a pas encore de journées planifiées."
              : "Sélectionnez une session pour voir vos émargements."}
          </p>
        </div>
      )}

      {/* Modal de signature */}
      {signingDemiJournee && (
        <SignatureModal
          isOpen={true}
          onClose={() => setSigningDemiJournee(null)}
          onSign={handleSign}
          demiJournee={signingDemiJournee}
        />
      )}

      {/* Loading overlay pendant signature */}
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-300">Signature en cours...</p>
          </div>
        </div>
      )}
    </div>
  );
}
