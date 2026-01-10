"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Play,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Plus,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ThumbsUp,
  Target,
  ShieldAlert,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

// ===========================================
// TYPES
// ===========================================

interface Audit {
  id: string;
  type: string;
  dateAudit: string;
  auditeur: string | null;
  resultat: string;
  scoreGlobal: number | null;
  indicateursConformes: number | null;
  indicateursTotal: number | null;
  notes: string | null;
  rapportUrl: string | null;
  createdAt: string;
}

interface SimulationResult {
  rapport: string;
  pointsForts: string[];
  pointsAmeliorer: string[];
  risques: string[];
  score: number;
  recommandations?: string[];
}

// ===========================================
// COMPOSANT - RAPPORT FORMATÉ
// ===========================================

function FormattedRapport({ rapport }: { rapport: string }) {
  // Parser le rapport pour extraire les sections
  const sections = parseRapport(rapport);

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border-l-4 ${getSectionStyle(section.type)}`}
        >
          <h4 className={`font-semibold mb-3 flex items-center gap-2 ${getSectionTitleColor(section.type)}`}>
            {getSectionIcon(section.type)}
            {section.title}
          </h4>
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
            <ReactMarkdown
              components={{
                // Amélioration du style des listes
                ul: ({ children }) => (
                  <ul className="list-none space-y-2 ml-0 pl-0 my-2">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-none space-y-2 ml-0 pl-0 my-2 counter-reset-item">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="flex items-start gap-2 pl-0">
                    <span className="w-1.5 h-1.5 bg-current rounded-full mt-2 flex-shrink-0 opacity-60"></span>
                    <span className="flex-1">{children}</span>
                  </li>
                ),
                // Style pour le texte en gras
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
                ),
                // Style pour les paragraphes
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                ),
                // Style pour les références d'indicateurs
                code: ({ children }) => (
                  <code className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                    {children}
                  </code>
                ),
              }}
            >
              {section.content}
            </ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  );
}

interface RapportSection {
  type: "success" | "warning" | "danger" | "info" | "neutral";
  title: string;
  content: string;
}

function parseRapport(rapport: string): RapportSection[] {
  const sections: RapportSection[] = [];
  const lines = rapport.split("\n");
  let currentSection: RapportSection | null = null;
  let currentContent: string[] = [];

  const sectionPatterns: { regex: RegExp; type: RapportSection["type"]; title: string }[] = [
    // Synthèse et résumé
    { regex: /^#{1,3}\s*(\d+\.?\s*)?(synthèse|résumé|conclusion|bilan|résultat\s*global)/i, type: "neutral", title: "Synthèse Globale" },
    // Points forts
    { regex: /^#{1,3}\s*(\d+\.?\s*)?(points?\s*forts?|forces?|atouts?|éléments?\s*conformes?|points?\s*positifs?)/i, type: "success", title: "Points Forts Identifiés" },
    // Points à améliorer
    { regex: /^#{1,3}\s*(\d+\.?\s*)?(points?\s*(à\s*)?améliorer|améliorations?|axes?\s*d'amélioration|écarts?\s*critiques?)/i, type: "warning", title: "Points à Améliorer" },
    // Risques
    { regex: /^#{1,3}\s*(\d+\.?\s*)?(risques?|alertes?|dangers?|non[\s-]?certification)/i, type: "danger", title: "Risques de Non-Certification" },
    // Recommandations
    { regex: /^#{1,3}\s*(\d+\.?\s*)?(recommandations?|conseils?|suggestions?|actions?\s*prioritaires?)/i, type: "info", title: "Recommandations" },
    // Conformité
    { regex: /^#{1,3}\s*(\d+\.?\s*)?(conformité|score|évaluation)/i, type: "neutral", title: "Évaluation de Conformité" },
  ];

  for (const line of lines) {
    let matchedPattern = false;

    for (const pattern of sectionPatterns) {
      if (pattern.regex.test(line)) {
        // Sauvegarder la section précédente
        if (currentSection) {
          currentSection.content = currentContent.join("\n").trim();
          if (currentSection.content) sections.push(currentSection);
        }
        // Démarrer nouvelle section
        currentSection = { type: pattern.type, title: pattern.title, content: "" };
        currentContent = [];
        matchedPattern = true;
        break;
      }
    }

    if (!matchedPattern) {
      // Vérifier si c'est un autre titre markdown
      if (/^#{1,3}\s+/.test(line) && currentSection) {
        // Sauvegarder et créer nouvelle section neutre
        currentSection.content = currentContent.join("\n").trim();
        if (currentSection.content) sections.push(currentSection);
        const title = line.replace(/^#{1,3}\s*\d*\.?\s*/, "").trim();
        currentSection = { type: "neutral", title, content: "" };
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }
  }

  // Sauvegarder la dernière section
  if (currentSection) {
    currentSection.content = currentContent.join("\n").trim();
    if (currentSection.content) sections.push(currentSection);
  }

  // Si aucune section détectée, créer une section par défaut
  if (sections.length === 0 && rapport.trim()) {
    sections.push({
      type: "neutral",
      title: "Rapport d'Audit",
      content: rapport,
    });
  }

  return sections;
}

function getSectionStyle(type: RapportSection["type"]): string {
  switch (type) {
    case "success":
      return "bg-green-50 dark:bg-green-900/20 border-green-500";
    case "warning":
      return "bg-amber-50 dark:bg-amber-900/20 border-amber-500";
    case "danger":
      return "bg-red-50 dark:bg-red-900/20 border-red-500";
    case "info":
      return "bg-blue-50 dark:bg-blue-900/20 border-blue-500";
    default:
      return "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600";
  }
}

function getSectionTitleColor(type: RapportSection["type"]): string {
  switch (type) {
    case "success":
      return "text-green-700 dark:text-green-400";
    case "warning":
      return "text-amber-700 dark:text-amber-400";
    case "danger":
      return "text-red-700 dark:text-red-400";
    case "info":
      return "text-blue-700 dark:text-blue-400";
    default:
      return "text-gray-700 dark:text-gray-300";
  }
}

function getSectionIcon(type: RapportSection["type"]) {
  switch (type) {
    case "success":
      return <ThumbsUp className="h-5 w-5" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5" />;
    case "danger":
      return <ShieldAlert className="h-5 w-5" />;
    case "info":
      return <Lightbulb className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
}

// ===========================================
// COMPOSANTS
// ===========================================

function AuditCard({
  audit,
  isExpanded,
  onToggle,
}: {
  audit: Audit;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const typeLabels: Record<string, { label: string; color: string }> = {
    INITIAL: { label: "Initial", color: "bg-blue-100 text-blue-700" },
    SURVEILLANCE: { label: "Surveillance", color: "bg-purple-100 text-purple-700" },
    RENOUVELLEMENT: { label: "Renouvellement", color: "bg-green-100 text-green-700" },
    SIMULATION: { label: "Simulation", color: "bg-amber-100 text-amber-700" },
  };

  const resultatConfig: Record<string, { label: string; icon: any; color: string }> = {
    REUSSI: { label: "Réussi", icon: CheckCircle2, color: "text-green-600" },
    ECHOUE: { label: "Échoué", icon: XCircle, color: "text-red-600" },
    PARTIEL: { label: "Partiel", icon: AlertTriangle, color: "text-amber-600" },
    EN_ATTENTE: { label: "En attente", icon: Clock, color: "text-gray-600" },
  };

  const typeInfo = typeLabels[audit.type] || typeLabels.SIMULATION;
  const resultatInfo = resultatConfig[audit.resultat] || resultatConfig.EN_ATTENTE;
  const ResultatIcon = resultatInfo.icon;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}
            >
              {typeInfo.label}
            </span>
            <ResultatIcon className={`h-5 w-5 ${resultatInfo.color}`} />
          </div>

          <div className="text-left">
            <p className="font-medium text-gray-900 dark:text-white">
              {new Date(audit.dateAudit).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            {audit.auditeur && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {audit.auditeur}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {audit.scoreGlobal !== null && (
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {audit.scoreGlobal}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {audit.indicateursConformes}/{audit.indicateursTotal} conformes
              </p>
            </div>
          )}
          <ChevronDown
            className={`h-5 w-5 text-gray-400 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Contenu détaillé */}
      {isExpanded && audit.notes && (
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <FormattedRapport rapport={audit.notes} />
        </div>
      )}
    </div>
  );
}

function NewAuditModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { type: string; dateAudit: string; auditeur: string }) => void;
}) {
  const [type, setType] = useState("SURVEILLANCE");
  const [dateAudit, setDateAudit] = useState("");
  const [auditeur, setAuditeur] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ type, dateAudit, auditeur });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Planifier un audit
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type d'audit
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="INITIAL">Initial</option>
              <option value="SURVEILLANCE">Surveillance</option>
              <option value="RENOUVELLEMENT">Renouvellement</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date de l'audit
            </label>
            <input
              type="date"
              value={dateAudit}
              onChange={(e) => setDateAudit(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Organisme certificateur / Auditeur
            </label>
            <input
              type="text"
              value={auditeur}
              onChange={(e) => setAuditeur(e.target.value)}
              placeholder="Ex: AFNOR, Bureau Veritas..."
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
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Planifier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===========================================
// PAGE PRINCIPALE
// ===========================================

export default function AuditsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);
  const [showNewAuditModal, setShowNewAuditModal] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(
    null
  );

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    try {
      const response = await fetch("/api/qualiopi/audit");
      if (!response.ok) throw new Error("Erreur de chargement");
      const data = await response.json();
      setAudits(data.audits || []);
    } catch (error) {
      toast.error("Erreur lors du chargement des audits");
    } finally {
      setLoading(false);
    }
  };

  const launchSimulation = async () => {
    setSimulating(true);
    setSimulationResult(null);

    try {
      const response = await fetch("/api/qualiopi/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSimulation: true }),
      });

      if (!response.ok) throw new Error("Erreur de simulation");
      const data = await response.json();

      setSimulationResult(data.simulation);
      setAudits((prev) => [data.audit, ...prev]);
      toast.success("Simulation terminée");
    } catch (error) {
      toast.error("Erreur lors de la simulation");
    } finally {
      setSimulating(false);
    }
  };

  const createAudit = async (data: {
    type: string;
    dateAudit: string;
    auditeur: string;
  }) => {
    try {
      const response = await fetch("/api/qualiopi/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Erreur de création");
      const audit = await response.json();

      setAudits((prev) => [audit, ...prev]);
      toast.success("Audit planifié");
    } catch (error) {
      toast.error("Erreur lors de la planification");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/qualiopi")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Audits & Simulations
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Préparez-vous à la certification Qualiopi
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewAuditModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          <Plus className="h-4 w-4" />
          Planifier un audit
        </button>
      </div>

      {/* Simulation */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Play className="h-5 w-5 text-green-600" />
              Simulation d'audit
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              L'agent IA va analyser votre conformité et simuler un audit complet
            </p>
          </div>

          <button
            onClick={launchSimulation}
            disabled={simulating}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {simulating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Lancer la simulation
              </>
            )}
          </button>
        </div>

        {/* Résultat de simulation */}
        {simulationResult && (
          <div className="mt-6 space-y-6">
            {/* Score et verdict */}
            <div className="flex items-center gap-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${
                  simulationResult.score >= 80
                    ? "bg-green-50 dark:bg-green-900/30 border-green-500"
                    : simulationResult.score >= 60
                    ? "bg-amber-50 dark:bg-amber-900/30 border-amber-500"
                    : "bg-red-50 dark:bg-red-900/30 border-red-500"
                }`}
              >
                <span
                  className={`text-3xl font-bold ${
                    simulationResult.score >= 80
                      ? "text-green-600"
                      : simulationResult.score >= 60
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}
                >
                  {simulationResult.score}%
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {simulationResult.score >= 80
                    ? "Prêt pour l'audit !"
                    : simulationResult.score >= 60
                    ? "Quelques améliorations nécessaires"
                    : "Actions correctives requises"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Score de conformité estimé sur 32 indicateurs
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {simulationResult.pointsForts.length} points forts
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    {simulationResult.pointsAmeliorer.length} à améliorer
                  </span>
                  {simulationResult.risques.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                      <XCircle className="h-4 w-4" />
                      {simulationResult.risques.length} risques
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Points forts - Overlay VERT */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl overflow-hidden">
              <div className="bg-green-100 dark:bg-green-900/40 px-6 py-3 border-b border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5" />
                  Points Forts
                  <span className="ml-2 px-2 py-0.5 bg-green-200 dark:bg-green-800 rounded-full text-xs">
                    {simulationResult.pointsForts.length}
                  </span>
                </h3>
              </div>
              <div className="p-6">
                {simulationResult.pointsForts.length === 0 ? (
                  <p className="text-green-600 dark:text-green-400 text-sm italic">
                    Aucun point fort identifié pour le moment
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {simulationResult.pointsForts.map((point, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                      >
                        <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          ✓
                        </span>
                        <span className="text-gray-800 dark:text-gray-200">{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Points à améliorer - Overlay ORANGE */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl overflow-hidden">
              <div className="bg-amber-100 dark:bg-amber-900/40 px-6 py-3 border-b border-amber-200 dark:border-amber-800">
                <h3 className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Points à Améliorer
                  <span className="ml-2 px-2 py-0.5 bg-amber-200 dark:bg-amber-800 rounded-full text-xs">
                    {simulationResult.pointsAmeliorer.length}
                  </span>
                </h3>
              </div>
              <div className="p-6">
                {simulationResult.pointsAmeliorer.length === 0 ? (
                  <p className="text-amber-600 dark:text-amber-400 text-sm italic">
                    Aucun point à améliorer identifié
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {simulationResult.pointsAmeliorer.map((point, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                      >
                        <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          !
                        </span>
                        <div className="flex-1">
                          <span className="text-gray-800 dark:text-gray-200">{point}</span>
                        </div>
                        <Link
                          href="/qualiopi/indicateurs"
                          className="flex-shrink-0 text-xs px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                        >
                          Résoudre
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Risques critiques - Overlay ROUGE */}
            {simulationResult.risques.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl overflow-hidden">
                <div className="bg-red-100 dark:bg-red-900/40 px-6 py-3 border-b border-red-200 dark:border-red-800">
                  <h3 className="font-semibold text-red-800 dark:text-red-300 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5" />
                    Risques Critiques
                    <span className="ml-2 px-2 py-0.5 bg-red-200 dark:bg-red-800 rounded-full text-xs">
                      {simulationResult.risques.length}
                    </span>
                  </h3>
                </div>
                <div className="p-6">
                  <ul className="space-y-3">
                    {simulationResult.risques.map((risque, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-red-500"
                      >
                        <span className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          ✕
                        </span>
                        <div className="flex-1">
                          <span className="text-gray-800 dark:text-gray-200 font-medium">{risque}</span>
                          <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                            ⚠️ Non-conformité majeure - Action immédiate requise
                          </p>
                        </div>
                        <Link
                          href="/qualiopi/indicateurs"
                          className="flex-shrink-0 text-xs px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Traiter
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Rapport détaillé formaté */}
            {simulationResult.rapport && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Rapport Détaillé
                  </h3>
                </div>
                <div className="p-6">
                  <FormattedRapport rapport={simulationResult.rapport} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historique des audits */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Historique des audits
        </h2>

        {audits.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Aucun audit
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Lancez une simulation ou planifiez votre premier audit
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {audits.map((audit) => (
              <AuditCard
                key={audit.id}
                audit={audit}
                isExpanded={expandedAudit === audit.id}
                onToggle={() =>
                  setExpandedAudit(expandedAudit === audit.id ? null : audit.id)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal nouveau audit */}
      <NewAuditModal
        isOpen={showNewAuditModal}
        onClose={() => setShowNewAuditModal(false)}
        onSubmit={createAudit}
      />
    </div>
  );
}
