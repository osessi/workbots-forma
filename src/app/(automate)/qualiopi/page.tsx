"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Play,
  Pencil,
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
    suggestion?: string;
  }[];
  indicateursValides?: {
    numero: number;
    libelle: string;
    critere: number;
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
  onShowDetail,
}: {
  critere: number;
  score: number;
  conformes: number;
  total: number;
  onShowDetail: () => void;
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
      <div className="w-44 text-sm text-gray-700 dark:text-gray-300">
        Critère {critere} - {critereTitres[critere]}
      </div>
      <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor(score)} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">
        {conformes}/{total}
      </div>
      <div className="w-8 text-center">
        <span className={status.color}>{status.icon}</span>
      </div>
      <button
        onClick={onShowDetail}
        className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        Voir détail
      </button>
    </div>
  );
}

// ===========================================
// COMPOSANTS - MODAL DETAIL CRITERE
// ===========================================

interface CritereIndicateur {
  numero: number;
  libelle: string;
  status: string;
  score: number;
}

function CritereDetailModal({
  isOpen,
  onClose,
  critere,
  titre,
  indicateurs,
}: {
  isOpen: boolean;
  onClose: () => void;
  critere: number;
  titre: string;
  indicateurs: CritereIndicateur[];
}) {
  if (!isOpen) return null;

  const conformes = indicateurs.filter(i => i.status === "CONFORME");
  const nonConformes = indicateurs.filter(i => i.status !== "CONFORME");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Critère {critere} - {titre}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Indicateurs conformes */}
          {conformes.length > 0 && (
            <div className="mb-6">
              <h3 className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium mb-3">
                <CheckCircle2 className="h-5 w-5" />
                Indicateurs validés ({conformes.length})
              </h3>
              <div className="space-y-2">
                {conformes.map((ind) => (
                  <div
                    key={ind.numero}
                    className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                  >
                    <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {ind.numero}
                    </span>
                    <span className="flex-1 text-gray-800 dark:text-gray-200 text-sm">
                      {ind.libelle}
                    </span>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Indicateurs non conformes */}
          {nonConformes.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium mb-3">
                <AlertCircle className="h-5 w-5" />
                Indicateurs à traiter ({nonConformes.length})
              </h3>
              <div className="space-y-2">
                {nonConformes.map((ind) => (
                  <Link
                    key={ind.numero}
                    href={`/qualiopi/indicateurs/${ind.numero}`}
                    className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {ind.numero}
                    </span>
                    <span className="flex-1 text-gray-800 dark:text-gray-200 text-sm">
                      {ind.libelle}
                    </span>
                    <span className="text-xs px-2 py-1 bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300 rounded">
                      {ind.score}%
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
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
              href={`/qualiopi/indicateurs/${alerte.indicateur}`}
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
// MODAL - MODIFIER DATE AUDIT
// ===========================================

function EditAuditModal({
  isOpen,
  onClose,
  audit,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  audit: { id: string; dateAudit: string; auditeur: string | null } | null;
  onSave: (auditId: string, newDate: string, auditeur: string) => Promise<void>;
}) {
  const [dateAudit, setDateAudit] = useState("");
  const [auditeur, setAuditeur] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (audit) {
      setDateAudit(audit.dateAudit.split("T")[0]);
      setAuditeur(audit.auditeur || "");
    }
  }, [audit]);

  if (!isOpen || !audit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateAudit) {
      toast.error("Veuillez sélectionner une date");
      return;
    }

    setLoading(true);
    try {
      await onSave(audit.id, dateAudit, auditeur);
      onClose();
    } catch (error) {
      toast.error("Erreur lors de la modification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Modifier l'audit
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date de l'audit
            </label>
            <input
              type="date"
              value={dateAudit}
              onChange={(e) => setDateAudit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom de l'auditeur (optionnel)
            </label>
            <input
              type="text"
              value={auditeur}
              onChange={(e) => setAuditeur(e.target.value)}
              placeholder="Ex: Jean Dupont - AFNOR"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                "Enregistrer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===========================================
// SUGGESTIONS PAR DÉFAUT
// ===========================================

function getSuggestion(indicateur: number, probleme?: string): string {
  const suggestions: Record<number, string> = {
    1: "Mettez à jour votre catalogue de formations avec les informations complètes (objectifs, prérequis, tarifs, durées).",
    2: "Publiez vos indicateurs de résultats (taux de satisfaction, taux de réussite) sur votre site web.",
    3: "Vérifiez que toutes vos formations intègrent une analyse des besoins du bénéficiaire.",
    4: "Documentez l'adéquation entre les objectifs de la formation et les besoins identifiés.",
    5: "Assurez-vous que les objectifs sont mesurables et évaluables pour chaque formation.",
    6: "Mettez en place des évaluations intermédiaires pour suivre la progression des apprenants.",
    7: "Créez des supports de formation accessibles et adaptés aux différents publics.",
    8: "Prévoyez des modalités d'adaptation pour les personnes en situation de handicap.",
    9: "Informez les publics en amont sur les conditions de déroulement des formations.",
    10: "Assurez-vous que les délais d'accès aux formations sont clairement communiqués.",
    11: "Mettez en place des évaluations finales pour mesurer l'atteinte des objectifs.",
    12: "Établissez un suivi post-formation pour évaluer l'impact des apprentissages.",
    17: "Documentez les moyens pédagogiques et techniques mis à disposition.",
    22: "Vérifiez que tous les intervenants ont leurs CV et qualifications à jour.",
    24: "Mettez en place une veille réglementaire documentée.",
    30: "Systématisez le recueil des évaluations de satisfaction.",
    31: "Créez un registre de traitement des réclamations.",
    32: "Documentez vos actions d'amélioration continue.",
  };

  return suggestions[indicateur] || "Consultez le détail de cet indicateur pour identifier les actions correctives nécessaires.";
}

// ===========================================
// PAGE PRINCIPALE
// ===========================================

export default function QualiopiDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [showAlertes, setShowAlertes] = useState(false);

  // Modal détail critère
  const [selectedCritere, setSelectedCritere] = useState<{
    critere: number;
    titre: string;
    indicateurs: CritereIndicateur[];
  } | null>(null);

  // Chat states
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Génération de preuves
  const [generatingProof, setGeneratingProof] = useState<number | null>(null);

  // Données indicateurs par critère (chargées séparément)
  const [indicateursParCritereData, setIndicateursParCritereData] = useState<Record<number, CritereIndicateur[]>>({});

  // Modal édition audit
  const [showEditAudit, setShowEditAudit] = useState(false);

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

      // Charger aussi les indicateurs par critère si disponibles
      if (result.indicateursDetailles) {
        setIndicateursParCritereData(result.indicateursDetailles);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement du dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadCritereIndicateurs = async (critere: number) => {
    try {
      const response = await fetch(`/api/qualiopi/indicateurs?critere=${critere}`);
      if (!response.ok) throw new Error("Erreur");
      const result = await response.json();

      const indicateurs: CritereIndicateur[] = result.indicateurs.map((ind: any) => ({
        numero: ind.numero,
        libelle: ind.libelle,
        status: ind.status,
        score: ind.score,
      }));

      setIndicateursParCritereData(prev => ({
        ...prev,
        [critere]: indicateurs,
      }));

      return indicateurs;
    } catch (error) {
      return [];
    }
  };

  const handleShowCritereDetail = async (critere: number, titre: string) => {
    // Charger les indicateurs si pas encore chargés
    let indicateurs = indicateursParCritereData[critere];
    if (!indicateurs) {
      indicateurs = await loadCritereIndicateurs(critere);
    }

    setSelectedCritere({
      critere,
      titre,
      indicateurs,
    });
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

    try {
      const response = await fetch("/api/qualiopi/preuves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ indicateur }),
      });

      if (!response.ok) {
        throw new Error("Erreur de génération");
      }

      // Télécharger le fichier
      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const filename = contentDisposition
        ?.split("filename=")[1]
        ?.replace(/"/g, "") || `Preuves_IND${indicateur}.zip`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Preuves générées pour l'indicateur ${indicateur}`);
    } catch (error) {
      toast.error("Erreur lors de la génération des preuves");
    } finally {
      setGeneratingProof(null);
    }
  };

  const [generatingFullDossier, setGeneratingFullDossier] = useState(false);

  const handleUpdateAudit = async (auditId: string, newDate: string, auditeur: string) => {
    try {
      const response = await fetch("/api/qualiopi/audit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId, dateAudit: newDate, auditeur }),
      });

      if (!response.ok) throw new Error("Erreur");
      toast.success("Date de l'audit modifiée");
      loadDashboard(); // Recharger les données
    } catch (error) {
      throw error;
    }
  };

  const generateFullDossier = async () => {
    setGeneratingFullDossier(true);
    toast.info("Génération du dossier d'audit complet... Cela peut prendre quelques minutes.");

    try {
      const response = await fetch("/api/qualiopi/preuves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full: true }),
      });

      if (!response.ok) {
        throw new Error("Erreur de génération");
      }

      // Télécharger le fichier ZIP
      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const filename = contentDisposition
        ?.split("filename=")[1]
        ?.replace(/"/g, "") || `Dossier_Audit_Qualiopi.zip`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Dossier d'audit généré avec succès !");
    } catch (error) {
      toast.error("Erreur lors de la génération du dossier d'audit");
    } finally {
      setGeneratingFullDossier(false);
    }
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
      {/* HEADER AVEC ALERTES ET SIMULATION */}
      {/* ============================================= */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          DASHBOARD QUALIOPI
        </h1>
        <div className="flex items-center gap-3">
          {/* Bouton Simuler un audit */}
          <Link
            href="/qualiopi/audits"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Play className="h-5 w-5" />
            <span className="font-medium">Simuler un audit</span>
          </Link>

          {/* Bouton alertes */}
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 relative">
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
                <button
                  onClick={() => setShowEditAudit(true)}
                  className="mt-3 flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  Modifier
                </button>
              </>
            ) : (
              <>
                <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" />
                <span className="text-gray-500 dark:text-gray-400">Non planifié</span>
                <Link
                  href="/qualiopi/audits"
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            CONFORMITÉ PAR CRITÈRE
          </h3>
          <Link
            href="/qualiopi/indicateurs"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            <FileText className="h-4 w-4" />
            Faire la revue des indicateurs
          </Link>
        </div>
        <div className="space-y-4">
          {data.indicateursParCritere.map((c) => (
            <CritereProgressBar
              key={c.critere}
              critere={c.critere}
              score={c.score}
              conformes={c.conformes}
              total={c.total}
              onShowDetail={() => handleShowCritereDetail(c.critere, c.titre)}
            />
          ))}
        </div>
      </div>

      {/* Modal détail critère */}
      {selectedCritere && (
        <CritereDetailModal
          isOpen={true}
          onClose={() => setSelectedCritere(null)}
          critere={selectedCritere.critere}
          titre={selectedCritere.titre}
          indicateurs={selectedCritere.indicateurs}
        />
      )}

      {/* ============================================= */}
      {/* INDICATEURS VALIDÉS - avec bouton Preuves */}
      {/* ============================================= */}
      {data.indicateursConformes > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
                INDICATEURS VALIDÉS
              </h3>
              <span className="ml-2 px-2 py-0.5 bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                {data.indicateursConformes}/{data.indicateursTotal}
              </span>
            </div>
            <button
              onClick={generateFullDossier}
              disabled={generatingFullDossier}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generatingFullDossier ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FolderArchive className="h-4 w-4" />
              )}
              Générer dossier de preuves
            </button>
          </div>

          <p className="text-green-700 dark:text-green-400 text-sm mb-4">
            Ces indicateurs sont conformes. Vous pouvez générer un dossier de preuves pour votre audit.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.indicateursValides?.slice(0, 6).map((ind) => (
              <div
                key={ind.numero}
                className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg"
              >
                <span className="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {ind.numero}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                  {ind.libelle}
                </span>
                <button
                  onClick={() => generateProof(ind.numero)}
                  disabled={generatingProof === ind.numero}
                  className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                  title="Télécharger preuves"
                >
                  {generatingProof === ind.numero ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {data.indicateursValides && data.indicateursValides.length > 6 && (
            <Link
              href="/qualiopi/indicateurs-valides"
              className="mt-3 text-sm text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
            >
              Voir tous les {data.indicateursValides.length} indicateurs validés
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {/* ============================================= */}
      {/* ACTIONS PRIORITAIRES - avec suggestions + Résoudre */}
      {/* ============================================= */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">
            ACTIONS PRIORITAIRES
          </h3>
          {data.indicateursAttention.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
              {data.indicateursAttention.length}
            </span>
          )}
        </div>

        {data.indicateursAttention.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-green-600 dark:text-green-400 bg-white dark:bg-gray-800 rounded-lg">
            <CheckCircle2 className="h-6 w-6 mr-2" />
            <span>Tous les indicateurs sont conformes !</span>
          </div>
        ) : (
          <div className="space-y-4">
            {data.indicateursAttention.map((ind, index) => (
              <div
                key={ind.numero}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-red-500"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full text-sm font-bold flex-shrink-0">
                      {ind.numero}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        <span className="text-red-600 dark:text-red-400 font-semibold">Indicateur {ind.numero}</span> - {ind.libelle}
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {ind.problemes[0] || "Non-conformité détectée"}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs font-medium">
                    {ind.score}%
                  </span>
                </div>

                {/* Suggestion de correction */}
                <div className="ml-11 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 mb-3">
                  <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <span className="text-amber-500">💡</span>
                    <span>
                      {ind.suggestion || getSuggestion(ind.numero, ind.problemes[0])}
                    </span>
                  </p>
                </div>

                {/* Bouton Résoudre */}
                <div className="ml-11">
                  <Link
                    href={`/qualiopi/indicateurs/${ind.numero}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Résoudre cet indicateur
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
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
            href="/qualiopi/agent"
            className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            <MessageSquare className="h-4 w-4" />
            Ouvrir l'assistant en plein écran
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Modal édition audit */}
      <EditAuditModal
        isOpen={showEditAudit}
        onClose={() => setShowEditAudit(false)}
        audit={data.prochainAudit ? {
          id: data.prochainAudit.id,
          dateAudit: data.prochainAudit.dateAudit,
          auditeur: data.prochainAudit.auditeur,
        } : null}
        onSave={handleUpdateAudit}
      />
    </div>
  );
}
