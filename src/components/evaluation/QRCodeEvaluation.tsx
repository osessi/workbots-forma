"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeEvaluationProps {
  // Pour créer une nouvelle évaluation
  sessionId: string;
  apprenantId?: string;
  intervenantId?: string;
  type: "CHAUD" | "FROID" | "INTERVENANT";
  // Infos d'affichage
  formationTitre: string;
  participantNom?: string;
  onClose?: () => void;
}

interface EvaluationData {
  id: string;
  token: string;
  status: string;
}

// Icons
const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const PrintIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
  </svg>
);

export default function QRCodeEvaluation({
  sessionId,
  apprenantId,
  intervenantId,
  type,
  formationTitre,
  participantNom,
  onClose,
}: QRCodeEvaluationProps) {
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isIntervenant = type === "INTERVENANT";
  const apiPath = isIntervenant ? "/api/evaluation-intervenant" : "/api/evaluation-satisfaction";
  const publicPath = isIntervenant ? "/evaluation-intervenant" : "/evaluation";

  const qrUrl = evaluation
    ? `${typeof window !== "undefined" ? window.location.origin : ""}${publicPath}/${evaluation.token}`
    : "";

  // Créer ou récupérer l'évaluation
  const createOrGetEvaluation = async () => {
    setLoading(true);
    setError(null);

    try {
      const body = isIntervenant
        ? { sessionId, intervenantId }
        : { sessionId, apprenantId, type };

      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur de création");
      }

      const data = await res.json();
      setEvaluation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    createOrGetEvaluation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, apprenantId, intervenantId, type]);

  // Télécharger le QR code
  const downloadQRCode = () => {
    const svg = document.getElementById("qr-code-evaluation-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      const typeName = type === "CHAUD" ? "chaud" : type === "FROID" ? "froid" : "intervenant";
      downloadLink.download = `qr-evaluation-${typeName}-${Date.now()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Imprimer le QR code
  const printQRCode = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const typeLabel = type === "CHAUD" ? "à chaud" : type === "FROID" ? "à froid" : "intervenant";
    const bgColor = type === "INTERVENANT" ? "#7c3aed" : type === "FROID" ? "#2563eb" : "#f97316";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code Évaluation - ${formationTitre}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              text-align: center;
            }
            .badge {
              display: inline-block;
              padding: 4px 12px;
              background: ${bgColor};
              color: white;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 16px;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 8px;
            }
            p {
              color: #666;
              margin-bottom: 24px;
            }
            .participant {
              font-weight: 600;
              color: #333;
              margin-bottom: 16px;
            }
            .qr-container {
              display: inline-block;
              padding: 24px;
              border: 2px solid #000;
              border-radius: 12px;
            }
            .instructions {
              margin-top: 24px;
              font-size: 14px;
              color: #666;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="badge">Évaluation ${typeLabel}</div>
          <h1>${formationTitre}</h1>
          ${participantNom ? `<p class="participant">${participantNom}</p>` : ""}
          <div class="qr-container">
            ${document.getElementById("qr-code-evaluation-svg")?.outerHTML || ""}
          </div>
          <p class="instructions">
            Scannez ce QR code pour compléter votre évaluation
          </p>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Copier le lien
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = qrUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case "CHAUD":
        return "Évaluation à chaud";
      case "FROID":
        return "Évaluation à froid";
      case "INTERVENANT":
        return "Évaluation Intervenant";
      default:
        return "Évaluation";
    }
  };

  const getTypeBadgeClass = () => {
    switch (type) {
      case "CHAUD":
        return "bg-orange-100 text-orange-700";
      case "FROID":
        return "bg-blue-100 text-blue-700";
      case "INTERVENANT":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            QR Code Évaluation
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Badge type */}
          <div className="text-center mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getTypeBadgeClass()}`}>
              {getTypeLabel()}
            </span>
          </div>

          <div className="text-center mb-4">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {formationTitre}
            </h3>
            {participantNom && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {participantNom}
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={createOrGetEvaluation}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshIcon /> Réessayer
              </button>
            </div>
          ) : evaluation ? (
            <>
              <div className="bg-white p-4 rounded-lg shadow-inner flex items-center justify-center mb-4">
                <QRCodeSVG
                  id="qr-code-evaluation-svg"
                  value={qrUrl}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-4">
                {type === "INTERVENANT"
                  ? "L'intervenant peut scanner ce QR code pour compléter son évaluation."
                  : "Le participant peut scanner ce QR code pour compléter son évaluation."}
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={downloadQRCode}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <DownloadIcon /> Télécharger
                </button>
                <button
                  onClick={printQRCode}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <PrintIcon /> Imprimer
                </button>
              </div>

              {/* Lien direct */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Lien direct :
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={qrUrl}
                    readOnly
                    className="flex-1 text-xs bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded px-2 py-1 text-gray-600 dark:text-gray-300"
                  />
                  <button
                    onClick={copyLink}
                    className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                      copied
                        ? "bg-green-600 text-white"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    <CopyIcon />
                    {copied ? "Copié !" : "Copier"}
                  </button>
                </div>
              </div>

              {/* Status indicator */}
              {evaluation.status === "COMPLETED" && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-400 text-center">
                    Cette évaluation a déjà été complétée
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
