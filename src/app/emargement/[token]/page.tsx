"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

// Types
interface Participant {
  id: string;
  apprenantId: string;
  nom: string;
  prenom: string;
  email: string;
}

interface Formateur {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
}

interface Signature {
  signataire: "participant" | "formateur";
  participantId?: string;
  intervenantId?: string;
  periode: string;
  signedAt: string;
}

interface FeuilleData {
  id: string;
  token: string;
  status: string;
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
  lieu: {
    nom: string;
    lieuFormation: string;
  } | null;
  formateur: Formateur | null;
  participants: Participant[];
  signatures: Signature[];
}

// Icons
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const LoadingSpinner = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="4" strokeWidth={2} />
    <path strokeWidth={2} d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

// Composant Signature Pad simple
function SignaturePad({
  onSave,
  onCancel
}: {
  onSave: (data: string) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Set style
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
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
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const data = canvas.toDataURL("image/png");
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Signez ci-dessous
        </h3>

        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg mb-4">
          <canvas
            ref={canvasRef}
            className="w-full h-40 touch-none cursor-crosshair bg-white rounded-lg"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuler
          </button>
          <button
            onClick={clear}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Effacer
          </button>
          <button
            onClick={save}
            disabled={!hasDrawn}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmargementPage() {
  const params = useParams();
  const token = params.token as string;

  const [feuille, setFeuille] = useState<FeuilleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [selectedPeriode, setSelectedPeriode] = useState<"matin" | "apres_midi" | null>(null);
  const [signing, setSigning] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signingAsFormateur, setSigningAsFormateur] = useState(false);

  // Charger les données
  useEffect(() => {
    async function loadFeuille() {
      try {
        const res = await fetch(`/api/emargement/${token}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Erreur de chargement");
        }
        const data = await res.json();
        setFeuille(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadFeuille();
    }
  }, [token]);

  // Vérifier si un participant a signé pour une période
  const hasSigned = (participantId: string, periode: string) => {
    return feuille?.signatures.some(
      (s) => s.signataire === "participant" && s.participantId === participantId && s.periode === periode
    );
  };

  // Vérifier si le formateur a signé pour une période
  const formateurHasSigned = (periode: string) => {
    return feuille?.signatures.some(
      (s) => s.signataire === "formateur" && s.periode === periode
    );
  };

  // Démarrer le processus de signature participant
  const startSignature = (participant: Participant, periode: "matin" | "apres_midi") => {
    setSelectedParticipant(participant);
    setSelectedPeriode(periode);
    setSigningAsFormateur(false);
    setShowSignaturePad(true);
  };

  // Démarrer le processus de signature formateur
  const startFormateurSignature = (periode: "matin" | "apres_midi") => {
    setSelectedParticipant(null);
    setSelectedPeriode(periode);
    setSigningAsFormateur(true);
    setShowSignaturePad(true);
  };

  // Signer (participant ou formateur)
  const handleSign = async (signatureData: string) => {
    if (!selectedPeriode) return;
    if (!signingAsFormateur && !selectedParticipant) return;

    setSigning(true);
    try {
      const body = signingAsFormateur
        ? {
            intervenantId: feuille?.formateur?.id,
            periode: selectedPeriode,
            signatureData,
            email: feuille?.formateur?.email,
          }
        : {
            participantId: selectedParticipant!.id,
            periode: selectedPeriode,
            signatureData,
            email: selectedParticipant!.email,
          };

      const res = await fetch(`/api/emargement/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur de signature");
      }

      // Mettre à jour les signatures localement
      setFeuille((prev) => {
        if (!prev) return prev;
        const newSignature: Signature = signingAsFormateur
          ? {
              signataire: "formateur",
              intervenantId: prev.formateur?.id,
              periode: selectedPeriode,
              signedAt: new Date().toISOString(),
            }
          : {
              signataire: "participant",
              participantId: selectedParticipant!.id,
              periode: selectedPeriode,
              signedAt: new Date().toISOString(),
            };
        return {
          ...prev,
          signatures: [...prev.signatures, newSignature],
        };
      });

      setShowSignaturePad(false);
      setSelectedParticipant(null);
      setSelectedPeriode(null);
      setSigningAsFormateur(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur de signature");
    } finally {
      setSigning(false);
    }
  };

  // Formatter la date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {error}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Le lien d&apos;émargement n&apos;est plus valide ou a expiré.
          </p>
        </div>
      </div>
    );
  }

  if (!feuille) {
    return null;
  }

  const hasMorning = feuille.journee.heureDebutMatin && feuille.journee.heureFinMatin;
  const hasAfternoon = feuille.journee.heureDebutAprem && feuille.journee.heureFinAprem;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
            {feuille.formation.titre}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            📅 {formatDate(feuille.journee.date)}
          </p>
          {feuille.lieu && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              📍 {feuille.lieu.nom}
            </p>
          )}
          {feuille.formateur && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              👤 Formateur: {feuille.formateur.prenom} {feuille.formateur.nom}
            </p>
          )}
        </div>
      </header>

      {/* Horaires */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Horaires de la journée
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {hasMorning && (
              <div className="flex items-center gap-2">
                <SunIcon />
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Matin</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {feuille.journee.heureDebutMatin} - {feuille.journee.heureFinMatin}
                  </p>
                </div>
              </div>
            )}
            {hasAfternoon && (
              <div className="flex items-center gap-2">
                <MoonIcon />
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Après-midi</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {feuille.journee.heureDebutAprem} - {feuille.journee.heureFinAprem}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Liste des participants */}
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          Participants ({feuille.participants.length})
        </h2>

        <div className="space-y-3">
          {feuille.participants.map((participant) => (
            <div
              key={participant.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {participant.prenom} {participant.nom}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {participant.email}
                  </p>
                </div>
              </div>

              {/* Boutons de signature */}
              <div className="flex gap-2 mt-3">
                {hasMorning && (
                  <button
                    onClick={() => startSignature(participant, "matin")}
                    disabled={hasSigned(participant.id, "matin")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      hasSigned(participant.id, "matin")
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {hasSigned(participant.id, "matin") ? (
                      <>
                        <CheckIcon /> Matin ✓
                      </>
                    ) : (
                      <>
                        <SunIcon /> Signer Matin
                      </>
                    )}
                  </button>
                )}

                {hasAfternoon && (
                  <button
                    onClick={() => startSignature(participant, "apres_midi")}
                    disabled={hasSigned(participant.id, "apres_midi")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      hasSigned(participant.id, "apres_midi")
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    {hasSigned(participant.id, "apres_midi") ? (
                      <>
                        <CheckIcon /> Après-midi ✓
                      </>
                    ) : (
                      <>
                        <MoonIcon /> Signer Après-midi
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {feuille.participants.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Aucun participant inscrit à cette session.
            </p>
          </div>
        )}

        {/* Section Formateur */}
        {feuille.formateur && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              Signature du Formateur
            </h2>
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg shadow p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold">
                    {feuille.formateur.prenom[0]}{feuille.formateur.nom[0]}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {feuille.formateur.prenom} {feuille.formateur.nom}
                    </h3>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                      Formateur
                    </p>
                  </div>
                </div>
              </div>

              {/* Boutons de signature formateur */}
              <div className="flex gap-2 mt-4">
                {hasMorning && (
                  <button
                    onClick={() => startFormateurSignature("matin")}
                    disabled={formateurHasSigned("matin")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      formateurHasSigned("matin")
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default"
                        : "bg-purple-600 text-white hover:bg-purple-700"
                    }`}
                  >
                    {formateurHasSigned("matin") ? (
                      <>
                        <CheckIcon /> Matin ✓
                      </>
                    ) : (
                      <>
                        <SunIcon /> Signer Matin
                      </>
                    )}
                  </button>
                )}

                {hasAfternoon && (
                  <button
                    onClick={() => startFormateurSignature("apres_midi")}
                    disabled={formateurHasSigned("apres_midi")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      formateurHasSigned("apres_midi")
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default"
                        : "bg-purple-600 text-white hover:bg-purple-700"
                    }`}
                  >
                    {formateurHasSigned("apres_midi") ? (
                      <>
                        <CheckIcon /> Après-midi ✓
                      </>
                    ) : (
                      <>
                        <MoonIcon /> Signer Après-midi
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Signature */}
      {showSignaturePad && !signing && (
        <SignaturePad
          onSave={handleSign}
          onCancel={() => {
            setShowSignaturePad(false);
            setSelectedParticipant(null);
            setSelectedPeriode(null);
            setSigningAsFormateur(false);
          }}
        />
      )}

      {/* Loading pendant signature */}
      {signing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 flex flex-col items-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              Enregistrement de la signature...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
