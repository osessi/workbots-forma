"use client";

// ===========================================
// PAGE SIGNATURE ÉLECTRONIQUE - Accès Public
// ===========================================
// /signer/[token] - Page pour visualiser et signer un document
// Affichage style PDF/Word avec champ de signature intégré

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Loader2,
  Send,
  AlertCircle,
  RefreshCw,
  Eraser,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  PenTool,
  Type,
  Upload,
} from "lucide-react";

interface DocumentData {
  id: string;
  titre: string;
  documentType: string;
  contenuHtml: string;
  destinataireNom: string;
  destinataireEmail: string;
  authMethod: "EMAIL_ONLY" | "EMAIL_SMS" | "EMAIL_CODE";
  expiresAt: string | null;
  status: string;
  organization: {
    name: string;
    logo: string | null;
  } | null;
  formation: string | null;
  apprenant: string | null;
  entreprise: string | null;
}

type Step = "loading" | "email" | "verification" | "document" | "success" | "error";
type SignatureMode = "draw" | "type" | "upload";

export default function SignerPage() {
  const params = useParams();
  const token = params.token as string;

  const [step, setStep] = useState<Step>("loading");
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAlreadySigned, setIsAlreadySigned] = useState(false);

  // Email verification
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  // Code verification
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [codeDestination, setCodeDestination] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeExpiresIn, setCodeExpiresIn] = useState(0);

  // Document view
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const documentRef = useRef<HTMLDivElement>(null);

  // Signature
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureMode, setSignatureMode] = useState<SignatureMode>("draw");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [initialsData, setInitialsData] = useState<string | null>(null);

  // Charger le document
  useEffect(() => {
    async function loadDocument() {
      try {
        const response = await fetch(`/api/signatures/sign/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Erreur lors du chargement du document");
          setStep("error");
          return;
        }

        if (data.document.status === "SIGNED" || data.document.isSigned) {
          setIsAlreadySigned(true);
          setDocument(data.document);
          setStep("success");
          return;
        }

        setDocument(data.document);
        // Si authMethod est EMAIL_ONLY, on demande juste l'email pour vérifier l'identité
        setStep("email");
      } catch (err) {
        console.error("Erreur chargement document:", err);
        setError("Impossible de charger le document");
        setStep("error");
      }
    }

    if (token) {
      loadDocument();
    }
  }, [token]);

  // Timer pour l'expiration du code
  useEffect(() => {
    if (codeExpiresIn > 0) {
      const timer = setInterval(() => {
        setCodeExpiresIn((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [codeExpiresIn]);

  // Initialiser le canvas
  useEffect(() => {
    if (showSignatureModal && signatureMode === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#1e3a5f";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [showSignatureModal, signatureMode]);

  // Calculer le nombre de pages (environ 800px par page)
  useEffect(() => {
    if (documentRef.current && document) {
      const height = documentRef.current.scrollHeight;
      setTotalPages(Math.max(1, Math.ceil(height / 1000)));
    }
  }, [document, zoom]);

  // Vérifier l'email
  const verifyEmail = async () => {
    if (!email || !email.includes("@")) {
      setEmailError("Veuillez entrer une adresse email valide");
      return;
    }

    setVerifyingEmail(true);
    setEmailError(null);

    try {
      // Vérifier si l'email correspond à un apprenant dans la base de données
      const response = await fetch(`/api/signatures/sign/${token}/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setEmailError(data.error || "Email non autorisé");
        return;
      }

      // Si l'email est valide (correspond à un apprenant ou au destinataire)
      if (document?.authMethod === "EMAIL_ONLY") {
        // Pas de code nécessaire, accès direct au document
        setStep("document");
      } else {
        // Envoyer le code de vérification
        await sendCode();
        setStep("verification");
      }
    } catch {
      setEmailError("Erreur lors de la vérification");
    } finally {
      setVerifyingEmail(false);
    }
  };

  // Envoyer le code de vérification
  const sendCode = async () => {
    setSendingCode(true);
    setCodeError(null);

    try {
      const response = await fetch(`/api/signatures/sign/${token}/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "email" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCodeError(data.error);
        return;
      }

      setCodeSent(true);
      setCodeDestination(data.destination);
      setCodeExpiresIn(data.expiresIn || 300);

      // En dev, afficher le code
      if (data.code) {
        console.log("[DEV] Code de vérification:", data.code);
      }
    } catch (err) {
      console.error("Erreur envoi code:", err);
      setCodeError("Erreur lors de l'envoi du code");
    } finally {
      setSendingCode(false);
    }
  };

  // Vérifier le code et passer au document
  const verifyCode = () => {
    if (verificationCode.length !== 6) {
      setCodeError("Le code doit contenir 6 chiffres");
      return;
    }
    setStep("document");
  };

  // Dessiner sur le canvas
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignatureData(null);
  };

  // Générer la signature depuis le texte tapé
  const generateTypedSignature = () => {
    if (!typedName.trim()) return null;

    const canvas = window.document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "italic 32px 'Brush Script MT', cursive, sans-serif";
    ctx.fillStyle = "#1e3a5f";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL("image/png");
  };

  // Uploader une signature
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedSignature(event.target?.result as string);
      setHasSignature(true);
    };
    reader.readAsDataURL(file);
  };

  // Confirmer la signature
  const confirmSignature = () => {
    let data: string | null = null;

    if (signatureMode === "draw" && canvasRef.current) {
      data = canvasRef.current.toDataURL("image/png");
    } else if (signatureMode === "type") {
      data = generateTypedSignature();
    } else if (signatureMode === "upload") {
      data = uploadedSignature;
    }

    if (data) {
      setSignatureData(data);
      setShowSignatureModal(false);
    }
  };

  // Soumettre la signature
  const submitSignature = async () => {
    if (!signatureData || !consentAccepted) return;

    setSubmitting(true);

    try {
      const response = await fetch(`/api/signatures/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureData,
          initialsData,
          verificationCode: document?.authMethod !== "EMAIL_ONLY" ? verificationCode : undefined,
          consentAccepted: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error.includes("Code")) {
          setCodeError(data.error);
          setStep("verification");
          return;
        }
        throw new Error(data.error);
      }

      setStep("success");
    } catch (err) {
      console.error("Erreur signature:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la signature");
      setStep("error");
    } finally {
      setSubmitting(false);
    }
  };

  // Formatage du temps restant
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Scroll vers une page
  const goToPage = (page: number) => {
    if (documentRef.current) {
      const pageHeight = 1000 * (zoom / 100);
      documentRef.current.scrollTo({
        top: (page - 1) * pageHeight,
        behavior: "smooth",
      });
      setCurrentPage(page);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AnimatePresence mode="wait">
        {/* Loading */}
        {step === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center"
          >
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Chargement du document...</p>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {step === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </button>
            </div>
          </motion.div>
        )}

        {/* Email Step */}
        {step === "email" && document && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
              {/* Logo */}
              <div className="text-center mb-8">
                {document.organization?.logo ? (
                  <img
                    src={document.organization.logo}
                    alt="Logo"
                    className="h-12 mx-auto mb-4"
                  />
                ) : (
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                )}
                <h1 className="text-2xl font-bold text-gray-900">{document.titre}</h1>
                <p className="text-gray-500 mt-1">{document.organization?.name}</p>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">Vérification d&apos;identité</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Pour accéder à ce document, veuillez confirmer votre adresse email.
                    </p>
                  </div>
                </div>
              </div>

              {/* Email input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Votre adresse email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {emailError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {emailError}
                  </div>
                )}

                <button
                  onClick={verifyEmail}
                  disabled={!email || verifyingEmail}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {verifyingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Vérification...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Accéder au document
                    </>
                  )}
                </button>
              </div>

              {document.expiresAt && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Ce lien expire le {new Date(document.expiresAt).toLocaleDateString("fr-FR")}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Verification Step */}
        {step === "verification" && document && (
          <motion.div
            key="verification"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Vérification</h2>
                <p className="text-gray-600 mt-2">
                  Entrez le code de vérification envoyé à{" "}
                  <strong>{codeDestination || email}</strong>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code à 6 chiffres
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(e.target.value.replace(/\D/g, ""))
                    }
                    className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="000000"
                  />
                </div>

                {codeError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {codeError}
                  </div>
                )}

                {codeExpiresIn > 0 && (
                  <p className="text-sm text-gray-500 text-center">
                    Code valide pendant {formatTime(codeExpiresIn)}
                  </p>
                )}

                <button
                  onClick={verifyCode}
                  disabled={verificationCode.length !== 6}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continuer
                </button>

                <button
                  onClick={sendCode}
                  disabled={sendingCode || codeExpiresIn > 240}
                  className="w-full py-2 text-blue-600 text-sm hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingCode ? "Envoi en cours..." : "Renvoyer le code"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Document View - Style PDF */}
        {step === "document" && document && (
          <motion.div
            key="document"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col"
          >
            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
              <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  {/* Document info */}
                  <div className="flex items-center gap-4 min-w-0">
                    {document.organization?.logo && (
                      <img
                        src={document.organization.logo}
                        alt="Logo"
                        className="h-8"
                      />
                    )}
                    <div className="min-w-0">
                      <h1 className="text-sm font-semibold text-gray-900 truncate">
                        {document.titre}
                      </h1>
                      <p className="text-xs text-gray-500">{document.organization?.name}</p>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    {/* Zoom */}
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg">
                      <button
                        onClick={() => setZoom((z) => Math.max(50, z - 10))}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-sm w-12 text-center">{zoom}%</span>
                      <button
                        onClick={() => setZoom((z) => Math.min(150, z + 10))}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Pages */}
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg">
                      <button
                        onClick={() => goToPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm w-16 text-center">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Download */}
                    <button
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Télécharger"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-auto bg-gray-200 p-6">
              <div className="max-w-4xl mx-auto">
                {/* Document Paper */}
                <div
                  ref={documentRef}
                  className="bg-white shadow-xl rounded-sm mx-auto overflow-hidden"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "top center",
                    width: "210mm", // A4 width
                    minHeight: "297mm", // A4 height
                  }}
                >
                  {/* Document content */}
                  <div className="p-16">
                    <div
                      className="prose prose-sm max-w-none"
                      style={{ fontFamily: "Georgia, serif" }}
                      dangerouslySetInnerHTML={{ __html: document.contenuHtml }}
                    />

                    {/* Signature Zone */}
                    <div className="mt-12 pt-8 border-t border-gray-300">
                      <div className="grid grid-cols-2 gap-8">
                        {/* Signature Organisme */}
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Pour l&apos;organisme de formation
                          </p>
                          <p className="text-sm text-gray-500 mb-4">
                            {document.organization?.name}
                          </p>
                          <div className="h-24 border border-gray-200 rounded bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
                            [Signature électronique]
                          </div>
                        </div>

                        {/* Signature Destinataire */}
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Pour le participant
                          </p>
                          <p className="text-sm text-gray-500 mb-4">
                            {document.destinataireNom}
                          </p>

                          {/* Zone de signature */}
                          {signatureData ? (
                            <div
                              className="relative h-24 border-2 border-green-500 rounded bg-white overflow-hidden cursor-pointer group"
                              onClick={() => setShowSignatureModal(true)}
                            >
                              <img
                                src={signatureData}
                                alt="Votre signature"
                                className="w-full h-full object-contain"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-sm">Modifier</span>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowSignatureModal(true)}
                              className="w-full h-24 border-2 border-dashed border-blue-400 rounded bg-blue-50 hover:bg-blue-100 transition-colors flex flex-col items-center justify-center gap-2 text-blue-600"
                            >
                              <PenTool className="w-6 h-6" />
                              <span className="text-sm font-medium">Cliquez pour signer</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Mention légale */}
                      <p className="text-xs text-gray-400 mt-8 text-center">
                        Document signé électroniquement conformément au règlement eIDAS et à l&apos;article 1367 du Code civil
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar - Validation */}
            <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between gap-4">
                  {/* Consent checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={consentAccepted}
                      onChange={(e) => setConsentAccepted(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Je, <strong>{document.destinataireNom}</strong>, certifie avoir lu et
                      accepté le document. Ma signature électronique a valeur légale.
                    </span>
                  </label>

                  {/* Submit button */}
                  <button
                    onClick={submitSignature}
                    disabled={!signatureData || !consentAccepted || submitting}
                    className="px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signature en cours...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Valider et signer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Success */}
        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10 text-green-600" />
              </motion.div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isAlreadySigned ? "Document déjà signé" : "Document signé !"}
              </h1>
              <p className="text-gray-600 mb-6">
                {isAlreadySigned
                  ? "Ce document a déjà été signé. Vous pouvez fermer cette page."
                  : "Votre signature a été enregistrée avec succès. Un certificat de signature vous sera envoyé par email."}
              </p>

              <div className="bg-gray-50 rounded-xl p-4 text-left text-sm">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">Signature sécurisée</span>
                </div>
                <p className="text-gray-600">
                  Votre signature électronique est horodatée et protégée par un certificat
                  SHA-256, garantissant son intégrité et sa validité juridique.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signature Modal */}
      <AnimatePresence>
        {showSignatureModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowSignatureModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Créer votre signature</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Choisissez comment vous souhaitez signer ce document
                </p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setSignatureMode("draw")}
                  className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                    signatureMode === "draw"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                  Dessiner
                </button>
                <button
                  onClick={() => setSignatureMode("type")}
                  className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                    signatureMode === "type"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Type className="w-4 h-4" />
                  Taper
                </button>
                <button
                  onClick={() => setSignatureMode("upload")}
                  className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                    signatureMode === "upload"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Importer
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Draw Mode */}
                {signatureMode === "draw" && (
                  <div>
                    <div className="relative mb-4">
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={150}
                        className="w-full border-2 border-dashed border-gray-300 rounded-xl cursor-crosshair touch-none bg-white"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      <button
                        onClick={clearSignature}
                        className="absolute top-2 right-2 p-2 bg-white/90 rounded-lg hover:bg-white transition-colors shadow"
                      >
                        <Eraser className="w-4 h-4 text-gray-600" />
                      </button>
                      {!hasSignature && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <p className="text-gray-400">Dessinez votre signature ici</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Type Mode */}
                {signatureMode === "type" && (
                  <div>
                    <input
                      type="text"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      placeholder="Tapez votre nom"
                      className="w-full px-4 py-3 text-xl border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                    />
                    {typedName && (
                      <div className="h-24 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center">
                        <span
                          className="text-3xl text-blue-900"
                          style={{ fontFamily: "'Brush Script MT', cursive" }}
                        >
                          {typedName}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Mode */}
                {signatureMode === "upload" && (
                  <div>
                    {uploadedSignature ? (
                      <div className="relative">
                        <img
                          src={uploadedSignature}
                          alt="Signature importée"
                          className="w-full h-32 object-contain border border-gray-200 rounded-xl bg-white"
                        />
                        <button
                          onClick={() => {
                            setUploadedSignature(null);
                            setHasSignature(false);
                          }}
                          className="absolute top-2 right-2 p-2 bg-white/90 rounded-lg hover:bg-white transition-colors shadow"
                        >
                          <Eraser className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    ) : (
                      <label className="block">
                        <div className="h-32 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2">
                          <Upload className="w-8 h-8 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            Cliquez pour importer une image
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmSignature}
                  disabled={
                    (signatureMode === "draw" && !hasSignature) ||
                    (signatureMode === "type" && !typedName.trim()) ||
                    (signatureMode === "upload" && !uploadedSignature)
                  }
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
