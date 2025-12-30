"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Loader2,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  FileText,
  Calendar,
  ChevronRight,
  Send,
  Download,
  FolderArchive,
  ExternalLink,
  Sparkles,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

// ===========================================
// TYPES
// ===========================================

interface DashboardData {
  scoreGlobal: number;
  indicateursConformes: number;
  indicateursTotal: number;
  indicateursParCritere: {
    critere: number;
    titre: string;
    score: number;
    conformes: number;
    total: number;
  }[];
  prochainAudit: {
    id: string;
    type: string;
    dateAudit: string;
    auditeur: string | null;
    joursRestants: number | null;
  } | null;
  alertesPrioritaires: {
    indicateur: number;
    message: string;
    priorite: string;
  }[];
  alertesNonLues: number;
  actionsEnCours: number;
  indicateursAttention: {
    numero: number;
    libelle: string;
    score: number;
    status: string;
    problemes: string[];
  }[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ===========================================
// COMPOSANTS - SCORE CIRCLE
// ===========================================

function ScoreCircle({ score, size = "large" }: { score: number; size?: "large" | "medium" }) {
  const dimensions = size === "large" ? { w: 140, r: 55, stroke: 10 } : { w: 100, r: 40, stroke: 8 };
  const circumference = 2 * Math.PI * dimensions.r;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 80) return "#22C55E";
    if (score >= 60) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div className="relative" style={{ width: dimensions.w, height: dimensions.w }}>
      <svg className="w-full h-full -rotate-90">
        <circle
          cx={dimensions.w / 2}
          cy={dimensions.w / 2}
          r={dimensions.r}
          stroke="currentColor"
          strokeWidth={dimensions.stroke}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={dimensions.w / 2}
          cy={dimensions.w / 2}
          r={dimensions.r}
          stroke={getColor(score)}
          strokeWidth={dimensions.stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-bold text-gray-900 dark:text-white ${size === "large" ? "text-4xl" : "text-2xl"}`}>
          {score}%
        </span>
      </div>
    </div>
  );
}

// ===========================================
// COMPOSANTS - CRITERE PROGRESS BAR
// ===========================================

function CritereProgressBar({
  critere,
  score,
  conformes,
  total,
}: {
  critere: number;
  score: number;
  conformes: number;
  total: number;
}) {
  const critereTitres: Record<number, string> = {
    1: "Information",
    2: "Objectifs",
    3: "Adaptation",
    4: "Moyens",
    5: "Qualification",
    6: "Environnement",
    7: "Recueil",
  };

  const getStatus = (score: number) => {
    if (score >= 80) return { icon: "✅", color: "text-green-600" };
    if (score >= 50) return { icon: "⚠️", color: "text-amber-600" };
    if (score === 0) return { icon: "➖", color: "text-gray-400" };
    return { icon: "❌", color: "text-red-600" };
  };

  const status = getStatus(score);

  const getBarColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-48 text-sm text-gray-700 dark:text-gray-300">
        Critère {critere} - {critereTitres[critere]}
      </div>
      <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor(score)} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="w-16 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">
        {score}%
      </div>
      <div className="w-8 text-center">
        <span className={status.color}>{status.icon}</span>
      </div>
    </div>
  );
}

// ===========================================
// COMPOSANTS - ALERTES PANEL
// ===========================================

function AlertesPanel({
  alertes,
  isOpen,
  onClose,
}: {
  alertes: DashboardData["alertesPrioritaires"];
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-12 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">Alertes</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {alertes.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            Aucune alerte
          </div>
        ) : (
          alertes.map((alerte, index) => (
            <Link
              key={index}
              href={`/automate/qualiopi/indicateurs/${alerte.indicateur}`}
              className="flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                alerte.priorite === "HAUTE" || alerte.priorite === "CRITIQUE"
                  ? "text-red-500"
                  : "text-amber-500"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Indicateur {alerte.indicateur}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {alerte.message}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

// ===========================================
// PAGE PRINCIPALE
// ===========================================

export default function QualiopiDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [showAlertes, setShowAlertes] = useState(false);

  // Chat states
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Génération de preuves
  const [generatingProof, setGeneratingProof] = useState<number | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const loadDashboard = async () => {
    try {
      const response = await fetch("/api/qualiopi/dashboard");
      if (!response.ok) throw new Error("Erreur de chargement");
      const result = await response.json();
      setData(result);
    } catch (error) {
      toast.error("Erreur lors du chargement du dashboard");
    } finally {
      setLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);

    try {
      const response = await fetch("/api/qualiopi/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) throw new Error("Erreur");
      const data = await response.json();

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
    } catch (error) {
      toast.error("Erreur de communication avec l'assistant");
      setChatMessages((prev) => prev.slice(0, -1));
    } finally {
      setChatLoading(false);
    }
  };

  const handleSuggestionClick = (question: string) => {
    setChatInput(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const generateProof = async (indicateur: number) => {
    setGeneratingProof(indicateur);
    toast.info(`Génération des preuves pour l'indicateur ${indicateur}...`);

    // Simuler la génération (à implémenter avec vraie logique)
    setTimeout(() => {
      setGeneratingProof(null);
      toast.success(`Preuves générées pour l'indicateur ${indicateur}`);
    }, 2000);
  };

  const generateFullDossier = async () => {
    toast.info("Génération du dossier d'audit complet...");

    // Simuler la génération (à implémenter avec vraie logique)
    setTimeout(() => {
      toast.success("Dossier d'audit généré avec succès");
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Erreur de chargement
        </h2>
        <button
          onClick={loadDashboard}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const suggestions = [
    "Comment préparer mon audit initial ?",
    "Quelles preuves pour l'indicateur 7 ?",
    "Comment améliorer mon taux de satisfaction ?",
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* ============================================= */}
      {/* HEADER AVEC ALERTES */}
      {/* ============================================= */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          DASHBOARD QUALIOPI
        </h1>
        <div className="relative">
          <button
            onClick={() => setShowAlertes(!showAlertes)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="font-medium">{data.alertesNonLues} alertes</span>
          </button>
          <AlertesPanel
            alertes={data.alertesPrioritaires}
            isOpen={showAlertes}
            onClose={() => setShowAlertes(false)}
          />
        </div>
      </div>

      {/* ============================================= */}
      {/* STATS PRINCIPALES - Score, Indicateurs, Audit */}
      {/* ============================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Score Global */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 text-center">
            Score Global
          </h3>
          <div className="flex justify-center">
            <ScoreCircle score={data.scoreGlobal} size="large" />
          </div>
        </div>

        {/* Indicateurs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 text-center">
            Indicateurs
          </h3>
          <div className="flex flex-col items-center justify-center h-32">
            <div className="text-5xl font-bold text-gray-900 dark:text-white">
              {data.indicateursConformes} / {data.indicateursTotal}
            </div>
            <div className="text-gray-500 dark:text-gray-400 mt-2">
              conformes
            </div>
          </div>
        </div>

        {/* Prochain Audit */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 text-center">
            Prochain Audit
          </h3>
          <div className="flex flex-col items-center justify-center h-32">
            {data.prochainAudit ? (
              <>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Date(data.prochainAudit.dateAudit).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-2 mt-2 text-blue-600 dark:text-blue-400">
                  <Clock className="h-4 w-4" />
                  <span>dans {data.prochainAudit.joursRestants}j</span>
                </div>
              </>
            ) : (
              <>
                <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" />
                <span className="text-gray-500 dark:text-gray-400">Non planifié</span>
                <Link
                  href="/automate/qualiopi/audits"
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  Planifier un audit
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============================================= */}
      {/* CONFORMITÉ PAR CRITÈRE */}
      {/* ============================================= */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          CONFORMITÉ PAR CRITÈRE
        </h3>
        <div className="space-y-4">
          {data.indicateursParCritere.map((c) => (
            <CritereProgressBar
              key={c.critere}
              critere={c.critere}
              score={c.score}
              conformes={c.conformes}
              total={c.total}
            />
          ))}
        </div>
      </div>

      {/* ============================================= */}
      {/* ACTIONS PRIORITAIRES */}
      {/* ============================================= */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            ACTIONS PRIORITAIRES
          </h3>
        </div>

        {data.indicateursAttention.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-6 w-6 mr-2" />
            <span>Tous les indicateurs sont conformes !</span>
          </div>
        ) : (
          <div className="space-y-3">
            {data.indicateursAttention.map((ind, index) => (
              <div
                key={ind.numero}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <span className="w-6 h-6 flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-sm font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <span className="text-gray-900 dark:text-white">
                      {ind.problemes[0] || ind.libelle}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      (IND {ind.numero})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => generateProof(ind.numero)}
                    disabled={generatingProof === ind.numero}
                    className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center gap-1"
                  >
                    {generatingProof === ind.numero ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Preuves
                  </button>
                  <Link
                    href={`/automate/qualiopi/indicateurs/${ind.numero}`}
                    className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Résoudre
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bouton dossier complet */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={generateFullDossier}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FolderArchive className="h-5 w-5" />
            Générer dossier d'audit complet (ZIP)
          </button>
        </div>
      </div>

      {/* ============================================= */}
      {/* ASSISTANT QUALIOPI - Chat intégré */}
      {/* ============================================= */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            ASSISTANT QUALIOPI
          </h3>
        </div>

        {/* Zone de chat */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 h-64 overflow-y-auto">
          {chatMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
              <p>Posez votre question sur Qualiopi...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input de chat */}
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question sur Qualiopi..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={chatLoading}
          />
          <button
            onClick={sendChatMessage}
            disabled={!chatInput.trim() || chatLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {/* Suggestions */}
        <div className="mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Suggestions :</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                • {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Lien vers chat complet */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/automate/qualiopi/agent"
            className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            <MessageSquare className="h-4 w-4" />
            Ouvrir l'assistant en plein écran
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
