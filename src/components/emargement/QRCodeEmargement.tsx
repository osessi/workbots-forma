"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeEmargementProps {
  journeeId: string;
  formationTitre: string;
  journeeDate: string;
  onClose?: () => void;
}

interface FeuilleData {
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

export default function QRCodeEmargement({
  journeeId,
  formationTitre,
  journeeDate,
  onClose,
}: QRCodeEmargementProps) {
  const [feuille, setFeuille] = useState<FeuilleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const qrUrl = feuille
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/emargement/${feuille.token}`
    : "";

  // Créer ou récupérer la feuille d'émargement
  const createOrGetFeuille = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/emargement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journeeId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur de création");
      }

      const data = await res.json();
      setFeuille(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    createOrGetFeuille();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeeId]);

  // Télécharger le QR code
  const downloadQRCode = () => {
    const svg = document.getElementById("qr-code-svg");
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
      downloadLink.download = `qr-emargement-${journeeDate}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Imprimer le QR code
  const printQRCode = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code Émargement - ${formationTitre}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              text-align: center;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 8px;
            }
            p {
              color: #666;
              margin-bottom: 24px;
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
          <h1>${formationTitre}</h1>
          <p>Journée du ${new Date(journeeDate).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}</p>
          <div class="qr-container">
            ${document.getElementById("qr-code-svg")?.outerHTML || ""}
          </div>
          <p class="instructions">
            Scannez ce QR code pour signer la feuille de présence
          </p>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            QR Code Émargement
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
          <div className="text-center mb-4">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {formationTitre}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(journeeDate)}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={createOrGetFeuille}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshIcon /> Réessayer
              </button>
            </div>
          ) : feuille ? (
            <>
              <div className="bg-white p-4 rounded-lg shadow-inner flex items-center justify-center mb-4">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={qrUrl}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-4">
                Les participants peuvent scanner ce QR code pour signer leur présence.
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
                    onClick={() => navigator.clipboard.writeText(qrUrl)}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Copier
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
