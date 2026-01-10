"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Target,
  Sparkles,
  ChevronRight,
  Plus,
  ExternalLink,
  X,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Trash2,
  ThumbsUp,
  ShieldAlert,
  Lightbulb,
  TrendingUp,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

// ===========================================
// COMPOSANT - ANALYSE IA FORMATÉE
// ===========================================

interface AnalyseSection {
  type: "success" | "warning" | "danger" | "info" | "neutral";
  title: string;
  content: string;
}

function parseAnalyseIA(analyse: string): AnalyseSection[] {
  const sections: AnalyseSection[] = [];
  const lines = analyse.split("\n");
  let currentSection: AnalyseSection | null = null;
  let currentContent: string[] = [];

  const sectionPatterns: { regex: RegExp; type: AnalyseSection["type"]; title: string }[] = [
    { regex: /^#{1,3}\s*(situation\s*actuelle|état\s*actuel|analyse\s*actuelle)/i, type: "info", title: "Situation actuelle" },
    { regex: /^#{1,3}\s*(points?\s*forts?|forces?|atouts?|éléments?\s*conformes?)/i, type: "success", title: "Points Forts" },
    { regex: /^#{1,3}\s*(points?\s*(à\s*)?améliorer|améliorations?|axes?\s*d'amélioration|points?\s*faibles?)/i, type: "warning", title: "Points à Améliorer" },
    { regex: /^#{1,3}\s*(risques?|alertes?|dangers?|non[\s-]?conform|écarts?|problèmes?)/i, type: "danger", title: "Risques Identifiés" },
    { regex: /^#{1,3}\s*(recommandations?|conseils?|suggestions?|actions?\s*prioritaires?)/i, type: "info", title: "Recommandations" },
    { regex: /^#{1,3}\s*(priorit[eé]\s*\d|étape|action)/i, type: "info", title: "Actions Prioritaires" },
    { regex: /^#{1,3}\s*(synthèse|résumé|conclusion|bilan|résultat)/i, type: "neutral", title: "Synthèse" },
    { regex: /^#{1,3}\s*(conformité|score|évaluation)/i, type: "neutral", title: "Évaluation" },
    { regex: /^#{1,3}\s*(informations?\s*manquantes?|données?\s*manquantes?)/i, type: "warning", title: "Informations Manquantes" },
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
        const title = line.replace(/^#{1,3}\s+/, "").trim();
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
  if (sections.length === 0 && analyse.trim()) {
    sections.push({
      type: "info",
      title: "Analyse détaillée",
      content: analyse,
    });
  }

  return sections;
}

function getAnalyseSectionStyle(type: AnalyseSection["type"]): string {
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

function getAnalyseSectionTitleColor(type: AnalyseSection["type"]): string {
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

function getAnalyseSectionIcon(type: AnalyseSection["type"]) {
  switch (type) {
    case "success":
      return <ThumbsUp className="h-5 w-5" />;
    case "warning":
      return <TrendingUp className="h-5 w-5" />;
    case "danger":
      return <ShieldAlert className="h-5 w-5" />;
    case "info":
      return <Lightbulb className="h-5 w-5" />;
    default:
      return <Info className="h-5 w-5" />;
  }
}

function FormattedAnalyseIA({ analyse }: { analyse: string }) {
  const sections = parseAnalyseIA(analyse);

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border-l-4 ${getAnalyseSectionStyle(section.type)}`}
        >
          <h4 className={`font-semibold mb-2 flex items-center gap-2 ${getAnalyseSectionTitleColor(section.type)}`}>
            {getAnalyseSectionIcon(section.type)}
            {section.title}
          </h4>
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
            <ReactMarkdown
              components={{
                // Amélioration du style des listes
                ul: ({ children }) => (
                  <ul className="list-none space-y-2 ml-0 pl-0">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="flex items-start gap-2">
                    <span className="text-current mt-1.5 w-1.5 h-1.5 bg-current rounded-full flex-shrink-0"></span>
                    <span>{children}</span>
                  </li>
                ),
                // Style pour le texte en gras
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
                ),
                // Style pour les paragraphes
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0">{children}</p>
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

// ===========================================
// TYPES
// ===========================================

interface IndicateurDetail {
  numero: number;
  critere: {
    numero: number;
    titre: string;
    description: string;
  };
  libelle: string;
  description: string;
  // Nouvelles données RNQ V9
  niveauAttendu: string;
  nonConformite: {
    type: "mineure" | "majeure";
    gradation?: boolean;
    descriptionMineure?: string;
  };
  applicabilite: {
    OF: boolean;
    CFA: boolean;
    CBC: boolean;
    VAE: boolean;
    nouveauxEntrants?: string;
  };
  obligationsSpecifiques?: {
    type: string;
    description: string;
  }[];
  sousTraitance?: string | null;
  // Données existantes
  exigences: string[];
  preuvesAttendues: string[];
  sourcesVerification: {
    type: string;
    champs?: string[];
    description: string;
  }[];
  status: string;
  score: number;
  derniereEvaluation: string | null;
  prochainControle: string | null;
  notes: string | null;
  preuves: {
    id: string;
    type: string;
    nom: string;
    description: string | null;
    documentId: string | null; // URL du fichier/lien
    sourceType: string | null; // DOCUMENT, CAPTURE, LIEN
    createdAt: string;
  }[];
  actions: {
    id: string;
    titre: string;
    description: string | null;
    priorite: string;
    status: string;
    dateEcheance: string | null;
    responsable: {
      id: string;
      firstName: string | null;
      lastName: string | null;
    } | null;
  }[];
  analyseIA: string;
  actionsRecommandees: string[];
}

// ===========================================
// COMPOSANTS
// ===========================================

function StatusBadge({ status, score }: { status: string; score: number }) {
  const config: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    CONFORME: {
      label: "Conforme",
      color: "text-green-700 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      icon: CheckCircle2,
    },
    NON_CONFORME: {
      label: "Non conforme",
      color: "text-red-700 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      icon: XCircle,
    },
    EN_COURS: {
      label: "En cours",
      color: "text-blue-700 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      icon: Clock,
    },
    A_EVALUER: {
      label: "À évaluer",
      color: "text-gray-700 dark:text-gray-300",
      bgColor: "bg-gray-100 dark:bg-gray-700",
      icon: AlertTriangle,
    },
  };

  const { label, color, bgColor, icon: Icon } = config[status] || config.A_EVALUER;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${bgColor}`}>
      <Icon className={`h-6 w-6 ${color}`} />
      <div>
        <p className={`font-semibold ${color}`}>{label}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Score: {score}%</p>
      </div>
    </div>
  );
}

function PreuveCard({
  preuve,
  onDelete
}: {
  preuve: IndicateurDetail["preuves"][0];
  onDelete: (preuveId: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  // Vérifie si c'est une URL externe (lien) ou un fichier local (proxy API)
  const isExternalUrl = preuve.documentId && preuve.documentId.startsWith("http");
  const isLocalFile = preuve.documentId && preuve.documentId.startsWith("/api/");
  const hasUrl = isExternalUrl || isLocalFile;
  const isImage = preuve.sourceType === "CAPTURE" || preuve.nom.match(/\.(png|jpg|jpeg|gif|webp)$/i);
  const isLink = preuve.sourceType === "LIEN";

  const handleOpen = () => {
    if (hasUrl) {
      window.open(preuve.documentId!, "_blank");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleting) return;

    if (!confirm("Êtes-vous sûr de vouloir supprimer cette preuve ?")) {
      return;
    }

    setDeleting(true);
    onDelete(preuve.id);
  };

  return (
    <div
      className={`flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg ${hasUrl ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors" : ""}`}
      onClick={hasUrl ? handleOpen : undefined}
    >
      {isImage ? (
        <ImageIcon className="h-5 w-5 text-blue-500 mt-0.5" />
      ) : isLink ? (
        <LinkIcon className="h-5 w-5 text-green-500 mt-0.5" />
      ) : (
        <FileText className="h-5 w-5 text-purple-500 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white text-sm flex items-center gap-2">
          {preuve.nom}
          {hasUrl && (
            <ExternalLink className="h-3 w-3 text-gray-400" />
          )}
        </p>
        {preuve.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {preuve.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400">
            {new Date(preuve.createdAt).toLocaleDateString("fr-FR")}
          </span>
          {!hasUrl && (
            <span className="text-xs text-amber-500 dark:text-amber-400">
              (pas de fichier)
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
          {preuve.type}
        </span>
        {hasUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpen();
            }}
            className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
            title="Ouvrir la preuve"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
          title="Supprimer la preuve"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function ActionCard({ action }: { action: IndicateurDetail["actions"][0] }) {
  const prioriteColors: Record<string, string> = {
    CRITIQUE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    HAUTE: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    MOYENNE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    BASSE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <Target className="h-5 w-5 text-purple-500 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-gray-900 dark:text-white text-sm">
            {action.titre}
          </p>
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              prioriteColors[action.priorite] || prioriteColors.MOYENNE
            }`}
          >
            {action.priorite}
          </span>
        </div>
        {action.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {action.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          {action.dateEcheance && (
            <span>
              Échéance: {new Date(action.dateEcheance).toLocaleDateString("fr-FR")}
            </span>
          )}
          {action.responsable && (
            <span>
              {action.responsable.firstName} {action.responsable.lastName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================
// MODAL - AJOUTER UNE PREUVE
// ===========================================

function AddPreuveModal({
  isOpen,
  onClose,
  onSubmit,
  indicateur,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  indicateur: number;
}) {
  const [type, setType] = useState<"DOCUMENT" | "CAPTURE" | "LIEN">("DOCUMENT");
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [lien, setLien] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Réinitialiser le formulaire à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setType("DOCUMENT");
      setNom("");
      setDescription("");
      setLien("");
      setFile(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      toast.error("Le nom de la preuve est requis");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        type,
        nom: nom.trim(),
        description: description.trim(),
        lien: type === "LIEN" ? lien.trim() : undefined,
        file: type !== "LIEN" ? file : undefined,
      });
      onClose();
    } catch (error) {
      toast.error("Erreur lors de l'ajout de la preuve");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ajouter une preuve - Indicateur {indicateur}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type de preuve */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type de preuve
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType("DOCUMENT")}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                  type === "DOCUMENT"
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                }`}
              >
                <FileText className={`h-6 w-6 ${type === "DOCUMENT" ? "text-purple-600" : "text-gray-400"}`} />
                <span className={`text-xs ${type === "DOCUMENT" ? "text-purple-600" : "text-gray-500"}`}>
                  Document
                </span>
              </button>
              <button
                type="button"
                onClick={() => setType("CAPTURE")}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                  type === "CAPTURE"
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                }`}
              >
                <ImageIcon className={`h-6 w-6 ${type === "CAPTURE" ? "text-purple-600" : "text-gray-400"}`} />
                <span className={`text-xs ${type === "CAPTURE" ? "text-purple-600" : "text-gray-500"}`}>
                  Capture
                </span>
              </button>
              <button
                type="button"
                onClick={() => setType("LIEN")}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                  type === "LIEN"
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                }`}
              >
                <LinkIcon className={`h-6 w-6 ${type === "LIEN" ? "text-purple-600" : "text-gray-400"}`} />
                <span className={`text-xs ${type === "LIEN" ? "text-purple-600" : "text-gray-500"}`}>
                  Lien
                </span>
              </button>
            </div>
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom de la preuve *
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Catalogue des formations 2026"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez cette preuve..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Fichier ou Lien */}
          {type === "LIEN" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL du lien *
              </label>
              <input
                type="url"
                value={lien}
                onChange={(e) => setLien(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required={type === "LIEN"}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fichier {type === "CAPTURE" ? "(image)" : "(PDF, Word, etc.)"}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept={type === "CAPTURE" ? "image/*" : ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-400 transition-colors"
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-purple-600">
                    <FileText className="h-5 w-5" />
                    <span>{file.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <Upload className="h-8 w-8" />
                    <span>Cliquez pour sélectionner un fichier</span>
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Boutons */}
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
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                "Ajouter la preuve"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===========================================
// MODAL - NOUVELLE ACTION CORRECTIVE
// ===========================================

function AddActionModal({
  isOpen,
  onClose,
  onSubmit,
  indicateur,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  indicateur: number;
}) {
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [priorite, setPriorite] = useState("MOYENNE");
  const [dateEcheance, setDateEcheance] = useState("");
  const [loading, setLoading] = useState(false);

  // Réinitialiser le formulaire à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setTitre("");
      setDescription("");
      setPriorite("MOYENNE");
      setDateEcheance("");
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) {
      toast.error("Le titre de l'action est requis");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        titre: titre.trim(),
        description: description.trim(),
        priorite,
        dateEcheance: dateEcheance || undefined,
      });
      onClose();
    } catch (error) {
      toast.error("Erreur lors de la création de l'action");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Nouvelle action corrective - Indicateur {indicateur}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre de l'action *
            </label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex: Mettre à jour le catalogue"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détaillez l'action à réaliser..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Priorité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priorité
            </label>
            <select
              value={priorite}
              onChange={(e) => setPriorite(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="BASSE">Basse</option>
              <option value="MOYENNE">Moyenne</option>
              <option value="HAUTE">Haute</option>
              <option value="CRITIQUE">Critique</option>
            </select>
          </div>

          {/* Date d'échéance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date d'échéance
            </label>
            <input
              type="date"
              value={dateEcheance}
              onChange={(e) => setDateEcheance(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Boutons */}
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
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                "Créer l'action"
              )}
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

export default function IndicateurDetailPage() {
  const router = useRouter();
  const params = useParams();
  const numero = parseInt(params.numero as string);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<IndicateurDetail | null>(null);
  const [showAnalyse, setShowAnalyse] = useState(false);
  const [showAddPreuve, setShowAddPreuve] = useState(false);
  const [showAddAction, setShowAddAction] = useState(false);

  useEffect(() => {
    if (!isNaN(numero) && numero >= 1 && numero <= 32) {
      loadIndicateur();
    } else {
      router.push("/qualiopi/indicateurs");
    }
  }, [numero]);

  const loadIndicateur = async () => {
    try {
      const response = await fetch(`/api/qualiopi/indicateurs/${numero}`);
      if (!response.ok) throw new Error("Erreur de chargement");
      const result = await response.json();
      setData(result);
    } catch (error) {
      toast.error("Erreur lors du chargement de l'indicateur");
      router.push("/qualiopi/indicateurs");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPreuve = async (preuveData: any) => {
    try {
      const formData = new FormData();
      formData.append("indicateur", numero.toString());
      formData.append("type", preuveData.type);
      formData.append("nom", preuveData.nom);
      if (preuveData.description) formData.append("description", preuveData.description);
      if (preuveData.lien) formData.append("lien", preuveData.lien);
      if (preuveData.file) formData.append("file", preuveData.file);

      const response = await fetch(`/api/qualiopi/indicateurs/${numero}/preuves`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur inconnue" }));
        toast.error(errorData.error || "Erreur lors de l'upload");
        throw new Error(errorData.error || "Erreur");
      }
      toast.success("Preuve ajoutée avec succès");
      loadIndicateur(); // Recharger les données
    } catch (error) {
      throw error;
    }
  };

  const handleAddAction = async (actionData: any) => {
    try {
      const response = await fetch(`/api/qualiopi/indicateurs/${numero}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actionData),
      });

      if (!response.ok) throw new Error("Erreur");
      toast.success("Action corrective créée");
      loadIndicateur(); // Recharger les données
    } catch (error) {
      throw error;
    }
  };

  const handleDeletePreuve = async (preuveId: string) => {
    try {
      const response = await fetch(`/api/qualiopi/indicateurs/${numero}/preuves`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preuveId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur inconnue" }));
        toast.error(errorData.error || "Erreur lors de la suppression");
        return;
      }
      toast.success("Preuve supprimée");
      loadIndicateur(); // Recharger les données
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push("/qualiopi/indicateurs")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mt-1"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                Indicateur {data.numero}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Critère {data.critere.numero}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.libelle}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
              {data.description}
            </p>
          </div>
        </div>
      </div>

      {/* Status et navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatusBadge status={data.status} score={data.score} />

        <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <Clock className="h-6 w-6 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Dernière évaluation</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {data.derniereEvaluation
                ? new Date(data.derniereEvaluation).toLocaleDateString("fr-FR")
                : "Non évalué"}
            </p>
          </div>
        </div>

        <Link
          href={`/qualiopi/agent?indicateur=${numero}`}
          className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6" />
            <div>
              <p className="font-medium">Demander à l'agent IA</p>
              <p className="text-xs text-white/80">Obtenir de l'aide</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      {/* Informations RNQ V9 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Type de non-conformité */}
        <div className={`px-4 py-3 rounded-xl ${
          data.nonConformite?.type === "majeure" && !data.nonConformite?.gradation
            ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            : data.nonConformite?.gradation
            ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
            : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
        }`}>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Type de non-conformité</p>
          <p className={`font-semibold text-sm ${
            data.nonConformite?.type === "majeure" && !data.nonConformite?.gradation
              ? "text-red-700 dark:text-red-400"
              : data.nonConformite?.gradation
              ? "text-amber-700 dark:text-amber-400"
              : "text-blue-700 dark:text-blue-400"
          }`}>
            {data.nonConformite?.gradation
              ? "Mineure ou Majeure"
              : data.nonConformite?.type === "majeure"
              ? "Majeure uniquement"
              : "Mineure uniquement"}
          </p>
        </div>

        {/* Applicabilité */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">S'applique à</p>
          <div className="flex flex-wrap gap-1">
            {data.applicabilite?.OF && (
              <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">OF</span>
            )}
            {data.applicabilite?.CFA && (
              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">CFA</span>
            )}
            {data.applicabilite?.CBC && (
              <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">CBC</span>
            )}
            {data.applicabilite?.VAE && (
              <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">VAE</span>
            )}
          </div>
        </div>

        {/* Nouveaux entrants */}
        {data.applicabilite?.nouveauxEntrants && (
          <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700 md:col-span-2">
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Nouveaux entrants</p>
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {data.applicabilite.nouveauxEntrants}
            </p>
          </div>
        )}
      </div>

      {/* Niveau attendu RNQ V9 */}
      {data.niveauAttendu && (
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-700 p-4">
          <h2 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Niveau attendu (RNQ V9)
          </h2>
          <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed">
            {data.niveauAttendu}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exigences */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Exigences du référentiel
          </h2>
          <ul className="space-y-2">
            {data.exigences.map((exigence, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{exigence}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Preuves attendues */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Preuves attendues
          </h2>
          <ul className="space-y-2">
            {data.preuvesAttendues.map((preuve, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <FileText className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{preuve}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Obligations spécifiques par type de prestataire */}
      {data.obligationsSpecifiques && data.obligationsSpecifiques.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Obligations spécifiques par type
          </h2>
          <div className="space-y-3">
            {data.obligationsSpecifiques.map((obligation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className={`text-xs px-2 py-1 rounded font-semibold ${
                  obligation.type === "CFA" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                  obligation.type === "CBC" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                  obligation.type === "VAE" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" :
                  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                }`}>
                  {obligation.type}
                </span>
                <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                  {obligation.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preuves fournies */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Preuves fournies ({data.preuves.length})
          </h2>
          <button
            onClick={() => setShowAddPreuve(true)}
            className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
          >
            <Plus className="h-4 w-4" />
            Ajouter une preuve
          </button>
        </div>

        {data.preuves.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucune preuve fournie</p>
            <p className="text-sm mt-1">
              Ajoutez des preuves pour démontrer votre conformité
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.preuves.map((preuve) => (
              <PreuveCard key={preuve.id} preuve={preuve} onDelete={handleDeletePreuve} />
            ))}
          </div>
        )}
      </div>

      {/* Actions correctives */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Actions correctives ({data.actions.length})
          </h2>
          <button
            onClick={() => setShowAddAction(true)}
            className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
          >
            <Plus className="h-4 w-4" />
            Nouvelle action
          </button>
        </div>

        {data.actions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucune action en cours</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.actions.map((action) => (
              <ActionCard key={action.id} action={action} />
            ))}
          </div>
        )}
      </div>

      {/* Analyse IA */}
      <div className="mt-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
        <button
          onClick={() => setShowAnalyse(!showAnalyse)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Analyse IA
            </h2>
          </div>
          <ChevronRight
            className={`h-5 w-5 text-gray-400 transition-transform ${
              showAnalyse ? "rotate-90" : ""
            }`}
          />
        </button>

        {showAnalyse && (
          <div className="mt-4">
            <FormattedAnalyseIA analyse={data.analyseIA} />

            {data.actionsRecommandees.length > 0 && (
              <div className="mt-4 p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg border-l-4 border-purple-500">
                <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Actions recommandées
                </h3>
                <ul className="space-y-2">
                  {data.actionsRecommandees.map((action, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg"
                    >
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation vers indicateurs adjacents */}
      <div className="mt-6 flex items-center justify-between">
        {numero > 1 ? (
          <Link
            href={`/qualiopi/indicateurs/${numero - 1}`}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Indicateur {numero - 1}
          </Link>
        ) : (
          <div />
        )}

        {numero < 32 && (
          <Link
            href={`/qualiopi/indicateurs/${numero + 1}`}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Indicateur {numero + 1}
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Modals */}
      <AddPreuveModal
        isOpen={showAddPreuve}
        onClose={() => setShowAddPreuve(false)}
        onSubmit={handleAddPreuve}
        indicateur={numero}
      />
      <AddActionModal
        isOpen={showAddAction}
        onClose={() => setShowAddAction(false)}
        onSubmit={handleAddAction}
        indicateur={numero}
      />
    </div>
  );
}
