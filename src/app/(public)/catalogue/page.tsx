"use client";

// ===========================================
// PAGE CATALOGUE PUBLIC
// ===========================================
// Qualiopi Indicateur 1 : Information accessible au public
// Affiche la liste des formations disponibles

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Clock,
  Users,
  BookOpen,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  CatalogueHeader,
  CatalogueBanner,
  CatalogueFilterPanel,
  CatalogueFooter,
  FormationBadges,
  SatisfactionBadge,
  FormationIndicateurs,
} from "@/components/catalogue";

// Types
interface Formation {
  id: string;
  titre: string;
  description: string | null;
  image: string | null;
  objectifs: string[];
  dureeHeures: number;
  dureeJours: number;
  publicVise: string | null;
  prerequis: string | null;
  accessibiliteHandicap: string | null;
  tarif: number | null;
  isCertifiante: boolean;
  numeroFicheRS: string | null;
  estEligibleCPF: boolean;
  codeFinancementCPF: string | null;
  modalites: string[];
  lieux: string[];
  indicateurs: {
    tauxSatisfaction: number | null;
    tauxCertification: number | null;
    nombreAvis: number;
    nombreStagiaires: number;
  } | null;
  nombreModules: number;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  telephone: string | null;
  email: string | null;
  siteWeb: string | null;
  certifications: string[];
  numeroFormateur: string | null;
  siret: string | null;
  primaryColor: string;
  certificatQualiopiUrl: string | null;
  categorieQualiopi: string | null;
}

interface FilterAggregation {
  modalites: { value: string; count: number; label: string }[];
  locations: { value: string; count: number }[];
  certifianteCount: { oui: number; non: number };
  eligibleCPFCount: { oui: number; non: number };
}

interface Filters {
  modalite: string | null;
  certifiante: string | null;
  eligibleCPF: string | null;
  lieu: string | null;
}

interface CatalogueData {
  organization: Organization;
  formations: Formation[];
  filterAggregations: FilterAggregation;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Composant wrapper avec Suspense pour useSearchParams
export default function CataloguePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Chargement du catalogue...</p>
          </div>
        </div>
      }
    >
      <CatalogueContent />
    </Suspense>
  );
}

function CatalogueContent() {
  const searchParams = useSearchParams();
  const orgSlug = searchParams.get("org");

  const [data, setData] = useState<CatalogueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // État des filtres
  const [filters, setFilters] = useState<Filters>({
    modalite: null,
    certifiante: null,
    eligibleCPF: null,
    lieu: null,
  });

  const fetchCatalogue = useCallback(async () => {
    if (!orgSlug) {
      setError("Paramètre organisation manquant");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        org: orgSlug,
        page: page.toString(),
        limit: "12",
      });

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      // Ajouter les filtres
      if (filters.modalite) {
        params.append("modalite", filters.modalite);
      }
      if (filters.certifiante) {
        params.append("certifiante", filters.certifiante);
      }
      if (filters.eligibleCPF) {
        params.append("eligibleCPF", filters.eligibleCPF);
      }
      if (filters.lieu) {
        params.append("lieu", filters.lieu);
      }

      const response = await fetch(`/api/public/catalogue?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors du chargement");
      }

      const catalogueData = await response.json();
      setData(catalogueData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [orgSlug, page, searchQuery, filters]);

  useEffect(() => {
    fetchCatalogue();
  }, [fetchCatalogue]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCatalogue();
  };

  const handleFilterChange = (filterName: keyof Filters, value: string | null) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
    setPage(1);
  };

  // Page d'erreur si pas d'organisation
  if (!orgSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Catalogue non trouvé
          </h1>
          <p className="text-gray-600">
            Veuillez spécifier une organisation dans l&apos;URL
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Exemple: /catalogue?org=mon-organisation
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du catalogue...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { organization, formations, filterAggregations, pagination } = data;
  const primaryColor = organization.primaryColor || "#4277FF";

  // Calculer les stats pour la bannière
  const totalStagiaires = formations.reduce(
    (acc, f) => acc + (f.indicateurs?.nombreStagiaires || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header de l'organisation */}
      <CatalogueHeader organization={organization} />

      {/* Bannière */}
      <CatalogueBanner
        organization={organization}
        stats={{
          formationsCount: pagination.total,
          stagiairesCount: totalStagiaires > 0 ? totalStagiaires : undefined,
        }}
      />

      {/* Barre de recherche */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une formation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              Rechercher
            </button>
          </form>

          <p className="mt-2 text-sm text-gray-500">
            {pagination.total} formation{pagination.total > 1 ? "s" : ""}{" "}
            disponible{pagination.total > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Liste des formations */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Filtres */}
        <CatalogueFilterPanel
          filters={filters}
          aggregations={filterAggregations}
          onFilterChange={handleFilterChange}
          primaryColor={primaryColor}
        />

        {formations.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              Aucune formation trouvée
            </h2>
            <p className="text-gray-500">
              {searchQuery
                ? "Essayez avec d'autres mots-clés"
                : "Aucune formation n'est disponible pour le moment"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {formations.map((formation) => (
                <FormationCard
                  key={formation.id}
                  formation={formation}
                  orgSlug={orgSlug}
                  primaryColor={primaryColor}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Précédent
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Page {page} sur {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer avec Qualiopi */}
      <CatalogueFooter organization={organization} />
    </div>
  );
}

// Composant carte formation
function FormationCard({
  formation,
  orgSlug,
  primaryColor,
}: {
  formation: Formation;
  orgSlug: string;
  primaryColor: string;
}) {
  return (
    <Link
      href={`/catalogue/${formation.id}?org=${orgSlug}`}
      className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full"
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-100">
        {formation.image ? (
          <Image
            src={formation.image}
            alt={formation.titre}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <BookOpen className="w-16 h-16" style={{ color: primaryColor }} />
          </div>
        )}

        {/* Badge satisfaction en haut à droite */}
        {formation.indicateurs?.tauxSatisfaction && (
          <div className="absolute top-3 right-3">
            <SatisfactionBadge
              tauxSatisfaction={formation.indicateurs.tauxSatisfaction}
              nombreAvis={formation.indicateurs.nombreAvis}
              primaryColor={primaryColor}
              size="sm"
            />
          </div>
        )}

        {/* Badge certifiante en haut à gauche */}
        {formation.isCertifiante && (
          <div className="absolute top-3 left-3">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white rounded-md shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              Certifiante
            </span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-5 flex flex-col flex-1">
        {/* Titre - hauteur fixe pour 2 lignes */}
        <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-blue-600 transition-colors">
          {formation.titre}
        </h3>

        {/* Description - hauteur fixe pour 2 lignes */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[2.5rem]">
          {formation.description || ""}
        </p>

        {/* Badges - Tous les badges importants */}
        <div className="mb-4 flex-grow">
          <FormationBadges
            formation={{
              modalites: formation.modalites,
              dureeHeures: formation.dureeHeures,
              dureeJours: formation.dureeJours,
              isCertifiante: formation.isCertifiante,
              numeroFicheRS: formation.numeroFicheRS,
              estEligibleCPF: formation.estEligibleCPF,
              accessibiliteHandicap: formation.accessibiliteHandicap,
              nombreModules: formation.nombreModules,
              indicateurs: formation.indicateurs,
            }}
            primaryColor={primaryColor}
            size="sm"
          />
        </div>

        {/* Indicateurs de résultats */}
        {formation.indicateurs && (
          <div className="mb-4">
            <FormationIndicateurs
              indicateurs={formation.indicateurs}
              primaryColor={primaryColor}
              size="sm"
            />
          </div>
        )}

        {/* CTA centré - toujours en bas */}
        <div className="flex items-center justify-center pt-4 border-t mt-auto">
          <span
            className="inline-flex items-center text-sm font-medium group-hover:translate-x-1 transition-transform"
            style={{ color: primaryColor }}
          >
            Voir la fiche pédagogique
            <ChevronRight className="w-4 h-4 ml-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
