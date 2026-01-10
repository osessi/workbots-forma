"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Filter,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

// ===========================================
// TYPES
// ===========================================

interface Indicateur {
  numero: number;
  critere: number;
  libelle: string;
  description: string;
  status: string;
  score: number;
  preuvesCount: number;
  actionsEnCours: number;
  problemes: string[];
}

interface Critere {
  numero: number;
  titre: string;
  description: string;
  indicateurs: number[];
  indicateursCount: number;
  conformesCount: number;
}

// ===========================================
// COMPOSANTS
// ===========================================

function StatusBadge({ status, score }: { status: string; score: number }) {
  const config: Record<string, { label: string; color: string; icon: any }> = {
    CONFORME: {
      label: "Conforme",
      color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      icon: CheckCircle2,
    },
    NON_CONFORME: {
      label: "Non conforme",
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      icon: XCircle,
    },
    EN_COURS: {
      label: "En cours",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      icon: Clock,
    },
    A_EVALUER: {
      label: "À évaluer",
      color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
      icon: AlertTriangle,
    },
    NON_APPLICABLE: {
      label: "N/A",
      color: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
      icon: AlertTriangle,
    },
  };

  const { label, color, icon: Icon } = config[status] || config.A_EVALUER;

  return (
    <div className="flex items-center gap-2">
      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">{score}%</span>
    </div>
  );
}

function IndicateurCard({ indicateur }: { indicateur: Indicateur }) {
  return (
    <Link
      href={`/qualiopi/indicateurs/${indicateur.numero}`}
      className="block p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
              IND {indicateur.numero}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Critère {indicateur.critere}
            </span>
          </div>
          <h3 className="font-medium text-gray-900 dark:text-white">
            {indicateur.libelle}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {indicateur.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3">
            <StatusBadge status={indicateur.status} score={indicateur.score} />
            {indicateur.preuvesCount > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {indicateur.preuvesCount} preuve(s)
              </span>
            )}
            {indicateur.actionsEnCours > 0 && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                {indicateur.actionsEnCours} action(s)
              </span>
            )}
          </div>

          {/* Problèmes */}
          {indicateur.problemes.length > 0 && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              {indicateur.problemes[0]}
            </p>
          )}
        </div>

        <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />
      </div>
    </Link>
  );
}

function CritereSection({
  critere,
  indicateurs,
  isExpanded,
  onToggle,
}: {
  critere: Critere;
  indicateurs: Indicateur[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const progress = critere.indicateursCount > 0
    ? (critere.conformesCount / critere.indicateursCount) * 100
    : 0;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {critere.numero}
            </span>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Critère {critere.numero}: {critere.titre}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {critere.conformesCount}/{critere.indicateursCount} indicateurs conformes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Progress bar */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  progress >= 80
                    ? "bg-green-500"
                    : progress >= 50
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {Math.round(progress)}%
            </span>
          </div>

          <ChevronDown
            className={`h-5 w-5 text-gray-400 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-3 bg-white dark:bg-gray-800">
          {indicateurs.map((indicateur) => (
            <IndicateurCard key={indicateur.numero} indicateur={indicateur} />
          ))}
        </div>
      )}
    </div>
  );
}

// ===========================================
// PAGE PRINCIPALE
// ===========================================

export default function IndicateursPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [indicateurs, setIndicateurs] = useState<Indicateur[]>([]);
  const [criteres, setCriteres] = useState<Critere[]>([]);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterCritere, setFilterCritere] = useState<number | null>(null);
  const [expandedCriteres, setExpandedCriteres] = useState<number[]>([1]);

  const [stats, setStats] = useState({ total: 0, conformes: 0 });

  useEffect(() => {
    loadIndicateurs();
  }, []);

  const loadIndicateurs = async () => {
    try {
      const response = await fetch("/api/qualiopi/indicateurs");
      if (!response.ok) throw new Error("Erreur de chargement");
      const data = await response.json();
      setIndicateurs(data.indicateurs || []);
      setCriteres(data.criteres || []);
      setStats({ total: data.total, conformes: data.conformes });
    } catch (error) {
      toast.error("Erreur lors du chargement des indicateurs");
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les indicateurs
  const filteredIndicateurs = indicateurs.filter((ind) => {
    if (search) {
      const searchLower = search.toLowerCase();
      if (
        !ind.libelle.toLowerCase().includes(searchLower) &&
        !ind.description.toLowerCase().includes(searchLower) &&
        !`ind ${ind.numero}`.includes(searchLower) &&
        !`indicateur ${ind.numero}`.includes(searchLower)
      ) {
        return false;
      }
    }
    if (filterStatus && ind.status !== filterStatus) return false;
    if (filterCritere && ind.critere !== filterCritere) return false;
    return true;
  });

  // Grouper par critère
  const indicateursParCritere = criteres.map((critere) => ({
    critere,
    indicateurs: filteredIndicateurs.filter((ind) => ind.critere === critere.numero),
  }));

  const toggleCritere = (numero: number) => {
    setExpandedCriteres((prev) =>
      prev.includes(numero)
        ? prev.filter((n) => n !== numero)
        : [...prev, numero]
    );
  };

  const expandAll = () => {
    setExpandedCriteres(criteres.map((c) => c.numero));
  };

  const collapseAll = () => {
    setExpandedCriteres([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
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
              Indicateurs Qualiopi
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {stats.conformes}/{stats.total} indicateurs conformes
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Tout déplier
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Tout replier
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un indicateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Filtre statut */}
          <select
            value={filterStatus || ""}
            onChange={(e) => setFilterStatus(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Tous les statuts</option>
            <option value="CONFORME">Conforme</option>
            <option value="NON_CONFORME">Non conforme</option>
            <option value="EN_COURS">En cours</option>
            <option value="A_EVALUER">À évaluer</option>
          </select>

          {/* Filtre critère */}
          <select
            value={filterCritere || ""}
            onChange={(e) =>
              setFilterCritere(e.target.value ? parseInt(e.target.value) : null)
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Tous les critères</option>
            {criteres.map((c) => (
              <option key={c.numero} value={c.numero}>
                Critère {c.numero}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des critères et indicateurs */}
      <div className="space-y-4">
        {indicateursParCritere.map(({ critere, indicateurs }) => (
          <CritereSection
            key={critere.numero}
            critere={critere}
            indicateurs={indicateurs}
            isExpanded={expandedCriteres.includes(critere.numero)}
            onToggle={() => toggleCritere(critere.numero)}
          />
        ))}
      </div>

      {/* Message si aucun résultat */}
      {filteredIndicateurs.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Aucun indicateur trouvé
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Essayez de modifier vos filtres
          </p>
          <button
            onClick={() => {
              setSearch("");
              setFilterStatus(null);
              setFilterCritere(null);
            }}
            className="mt-4 px-4 py-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}
