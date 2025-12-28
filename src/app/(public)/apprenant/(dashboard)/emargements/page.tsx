"use client";

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
} from "lucide-react";

interface EmargementJournee {
  id: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  sessionNom: string;
  sessionReference: string;
  lieu: string | null;
  formateur: string | null;
  signatureMatin: boolean;
  signatureAprem: boolean;
  feuilleId: string;
}

interface EmargementsData {
  emargements: EmargementJournee[];
  stats: {
    total: number;
    signes: number;
    enAttente: number;
  };
}

// =====================================
// COMPOSANT SIGNATURE CANVAS
// =====================================

function SignatureModal({
  isOpen,
  onClose,
  onSign,
  periode,
  journee,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSign: (signature: string) => void;
  periode: "matin" | "aprem";
  journee: EmargementJournee;
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
                {new Date(journee.date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })} - {periode === "matin" ? "Matin" : "Après-midi"}
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
                {journee.sessionNom}
              </p>
              <div className="flex flex-wrap gap-3 mt-2 text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {periode === "matin" ? journee.heureDebut : "14:00"} - {periode === "matin" ? "12:30" : journee.heureFin}
                </span>
                {journee.lieu && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {journee.lieu}
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
// COMPOSANT EMARGEMENT CARD
// =====================================

function EmargementCard({
  journee,
  index,
  onSign,
}: {
  journee: EmargementJournee;
  index: number;
  onSign: (journee: EmargementJournee, periode: "matin" | "aprem") => void;
}) {
  const isToday = new Date(journee.date).toDateString() === new Date().toDateString();
  const isPast = new Date(journee.date) < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white dark:bg-gray-800 rounded-xl border ${
        isToday
          ? "border-brand-500 ring-2 ring-brand-500/20"
          : "border-gray-200 dark:border-gray-700"
      } overflow-hidden`}
    >
      {/* Header avec date */}
      <div
        className={`px-4 py-3 ${
          isToday
            ? "bg-brand-50 dark:bg-brand-500/10"
            : "bg-gray-50 dark:bg-gray-700/50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center ${
                isToday
                  ? "bg-brand-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              }`}
            >
              <span className="text-xs font-medium uppercase">
                {new Date(journee.date).toLocaleDateString("fr-FR", { weekday: "short" })}
              </span>
              <span className="text-sm font-bold leading-none">
                {new Date(journee.date).getDate()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(journee.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {journee.sessionNom}
              </p>
            </div>
          </div>
          {isToday && (
            <span className="text-xs font-medium px-2 py-1 bg-brand-500 text-white rounded-full">
              Aujourd&apos;hui
            </span>
          )}
        </div>
      </div>

      {/* Corps */}
      <div className="p-4">
        {/* Info session */}
        <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {journee.heureDebut} - {journee.heureFin}
          </span>
          {journee.lieu && (
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {journee.lieu}
            </span>
          )}
          {journee.formateur && (
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {journee.formateur}
            </span>
          )}
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-3">
          {/* Matin */}
          <div
            className={`p-3 rounded-lg border ${
              journee.signatureMatin
                ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30"
                : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Matin
              </span>
              {journee.signatureMatin ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Clock className="w-5 h-5 text-gray-400" />
              )}
            </div>
            {journee.signatureMatin ? (
              <p className="text-xs text-green-600 dark:text-green-400">
                Signé
              </p>
            ) : (
              <button
                onClick={() => onSign(journee, "matin")}
                disabled={!isToday && !isPast}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <PenLine className="w-4 h-4" />
                Signer
              </button>
            )}
          </div>

          {/* Après-midi */}
          <div
            className={`p-3 rounded-lg border ${
              journee.signatureAprem
                ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30"
                : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Après-midi
              </span>
              {journee.signatureAprem ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Clock className="w-5 h-5 text-gray-400" />
              )}
            </div>
            {journee.signatureAprem ? (
              <p className="text-xs text-green-600 dark:text-green-400">
                Signé
              </p>
            ) : (
              <button
                onClick={() => onSign(journee, "aprem")}
                disabled={!isToday && !isPast}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <PenLine className="w-4 h-4" />
                Signer
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function EmargementsPage() {
  const { token, selectedInscription, refreshData } = useApprenantPortal();
  const [data, setData] = useState<EmargementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingJournee, setSigningJournee] = useState<{
    journee: EmargementJournee;
    periode: "matin" | "aprem";
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchEmargements = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({ token });
      if (selectedInscription?.id) {
        params.append("inscriptionId", selectedInscription.id);
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
  }, [token, selectedInscription?.id]);

  const handleSign = async (signature: string) => {
    if (!signingJournee || !token) return;

    try {
      setSubmitting(true);

      const res = await fetch("/api/apprenant/emargements/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          feuilleId: signingJournee.journee.feuilleId,
          periode: signingJournee.periode,
          signature,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la signature");
      }

      // Rafraîchir les données
      await fetchEmargements();
      await refreshData();
      setSigningJournee(null);
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
          <p className="text-gray-900 dark:text-white font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Émargements
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Signez vos feuilles de présence
        </p>
      </div>

      {/* Stats */}
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

      {/* Liste des émargements */}
      {data?.emargements && data.emargements.length > 0 ? (
        <div className="space-y-4">
          {data.emargements.map((journee, index) => (
            <EmargementCard
              key={journee.id}
              journee={journee}
              index={index}
              onSign={(j, p) => setSigningJournee({ journee: j, periode: p })}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Aucun émargement disponible pour le moment
          </p>
        </div>
      )}

      {/* Modal de signature */}
      {signingJournee && (
        <SignatureModal
          isOpen={true}
          onClose={() => setSigningJournee(null)}
          onSign={handleSign}
          periode={signingJournee.periode}
          journee={signingJournee.journee}
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
