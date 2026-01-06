"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Download,
  FolderArchive,
  FileText,
  ChevronRight,
  Search,
} from "lucide-react";
import { toast } from "sonner";

// ===========================================
// TYPES
// ===========================================

interface IndicateurValide {
  numero: number;
  libelle: string;
  critere: number;
  score: number;
  derniereEvaluation: string | null;
  preuvesCount: number;
}

interface DashboardData {
  indicateursValides: IndicateurValide[];
  indicateursConformes: number;
  indicateursTotal: number;
}

// ===========================================
// PAGE PRINCIPALE
// ===========================================

export default function IndicateursValidesPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [generatingProof, setGeneratingProof] = useState<number | null>(null);
  const [generatingFullDossier, setGeneratingFullDossier] = useState(false);
  const [selectedCritere, setSelectedCritere] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch("/api/qualiopi/indicateurs-valides");
      if (!response.ok) throw new Error("Erreur de chargement");
      const result = await response.json();
      setData(result);
    } catch (error) {
      toast.error("Erreur lors du chargement des indicateurs validés");
    } finally {
      setLoading(false);
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

  const critereTitres: Record<number, string> = {
    1: "Information",
    2: "Objectifs",
    3: "Adaptation",
    4: "Moyens",
    5: "Qualification",
    6: "Environnement",
    7: "Recueil",
  };

  // Filtrer les indicateurs
  const filteredIndicateurs = data?.indicateursValides?.filter((ind) => {
    const matchesSearch =
      searchQuery === "" ||
      ind.libelle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ind.numero.toString().includes(searchQuery);
    const matchesCritere = selectedCritere === null || ind.critere === selectedCritere;
    return matchesSearch && matchesCritere;
  }) || [];

  // Grouper par critère
  const indicateursParCritere = filteredIndicateurs.reduce((acc, ind) => {
    if (!acc[ind.critere]) {
      acc[ind.critere] = [];
    }
    acc[ind.critere].push(ind);
    return acc;
  }, {} as Record<number, IndicateurValide[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Erreur de chargement</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/automate/qualiopi"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au dashboard
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Indicateurs Validés
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {data.indicateursConformes} indicateurs conformes sur {data.indicateursTotal}
              </p>
            </div>
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
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un indicateur..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Filtre par critère */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCritere(null)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                selectedCritere === null
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Tous
            </button>
            {[1, 2, 3, 4, 5, 6, 7].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCritere(c)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedCritere === c
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                C{c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des indicateurs */}
      {filteredIndicateurs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun indicateur validé
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery || selectedCritere
              ? "Aucun résultat pour ces critères de recherche"
              : "Travaillez sur vos indicateurs pour les valider"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(indicateursParCritere)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([critere, indicateurs]) => (
              <div
                key={critere}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Header critère */}
                <div className="bg-green-50 dark:bg-green-900/20 px-4 py-3 border-b border-green-200 dark:border-green-800">
                  <h2 className="font-semibold text-green-800 dark:text-green-300">
                    Critère {critere} - {critereTitres[Number(critere)]}
                  </h2>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {indicateurs.length} indicateur{indicateurs.length > 1 ? "s" : ""} validé{indicateurs.length > 1 ? "s" : ""}
                  </p>
                </div>

                {/* Liste */}
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {indicateurs.map((ind) => (
                    <div
                      key={ind.numero}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      {/* Numéro */}
                      <span className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {ind.numero}
                      </span>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {ind.libelle}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            Score: {ind.score}%
                          </span>
                          {ind.preuvesCount > 0 && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5" />
                              {ind.preuvesCount} preuve{ind.preuvesCount > 1 ? "s" : ""}
                            </span>
                          )}
                          {ind.derniereEvaluation && (
                            <span>
                              Évalué le {new Date(ind.derniereEvaluation).toLocaleDateString("fr-FR")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => generateProof(ind.numero)}
                          disabled={generatingProof === ind.numero}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          Détails
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Footer - Résumé */}
      <div className="mt-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-green-800 dark:text-green-300 font-medium">
              {filteredIndicateurs.length} indicateur{filteredIndicateurs.length > 1 ? "s" : ""} affiché{filteredIndicateurs.length > 1 ? "s" : ""}
            </span>
          </div>
          <Link
            href="/automate/qualiopi/indicateurs"
            className="text-sm text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
          >
            Voir tous les indicateurs
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
