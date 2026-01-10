"use client";

// ===========================================
// PAGE CATALOGUE - Gestion du catalogue public
// ===========================================
// Permet de voir et configurer le catalogue public de l'organisation

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Globe,
  ExternalLink,
  Eye,
  Settings,
  BookOpen,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  TrendingUp,
  Users,
  Upload,
  Award,
  ChevronRight,
  Clock,
  Trash2,
} from "lucide-react";

interface CatalogueStats {
  totalFormations: number;
  formationsPubliees: number;
  formationsNonPubliees: number;
  preInscriptionsTotal: number;
  preInscriptionsNouvelles: number;
}

interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
  catalogueActif: boolean;
  logo: string | null;
  primaryColor: string | null;
  certificatQualiopiUrl: string | null;
  categorieQualiopi: string | null;
  certifications: string[];
}

interface FormationPubliee {
  id: string;
  titre: string;
  image: string | null;
  dureeHeures: number;
  status: string;
}

// Options de catégories Qualiopi
const CATEGORIES_QUALIOPI = [
  "Action de formation",
  "Bilans de compétences",
  "Actions permettant de faire valider les acquis de l'expérience",
  "Actions de formation par apprentissage",
];

export default function CataloguePage() {
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null);
  const [stats, setStats] = useState<CatalogueStats | null>(null);
  const [formationsPubliees, setFormationsPubliees] = useState<FormationPubliee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [uploadingCertificat, setUploadingCertificat] = useState(false);
  const [deletingCertificat, setDeletingCertificat] = useState(false);
  const [savingCategorie, setSavingCategorie] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Récupérer les infos de l'organisation
      const orgResponse = await fetch("/api/user/organization");
      if (!orgResponse.ok) throw new Error("Erreur lors du chargement");
      const orgData = await orgResponse.json();
      setOrganization(orgData.organization);

      // Récupérer les stats du catalogue
      const statsResponse = await fetch("/api/catalogue/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Récupérer les formations publiées
      const formationsResponse = await fetch("/api/catalogue/formations-publiees");
      if (formationsResponse.ok) {
        const formationsData = await formationsResponse.json();
        setFormationsPubliees(formationsData.formations || []);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleCatalogue = async () => {
    if (!organization) return;

    try {
      setUpdating(true);
      const response = await fetch("/api/user/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogueActif: !organization.catalogueActif,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Erreur API:", data);
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      setOrganization({
        ...organization,
        catalogueActif: !organization.catalogueActif,
      });
    } catch (err) {
      console.error("Erreur toggle catalogue:", err);
    } finally {
      setUpdating(false);
    }
  };

  const catalogueUrl = organization
    ? `${window.location.origin}/catalogue?org=${organization.slug}`
    : "";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(catalogueUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erreur copie:", err);
    }
  };

  // Upload du certificat Qualiopi
  const handleCertificatUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization) return;

    // Vérifier que c'est un PDF
    if (file.type !== "application/pdf") {
      alert("Veuillez sélectionner un fichier PDF");
      return;
    }

    try {
      setUploadingCertificat(true);

      // Upload vers Supabase Storage
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "certificat-qualiopi");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Erreur lors de l'upload");
      }

      const { url } = await uploadResponse.json();

      // Sauvegarder l'URL dans l'organisation
      const updateResponse = await fetch("/api/user/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificatQualiopiUrl: url }),
      });

      if (!updateResponse.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      setOrganization({ ...organization, certificatQualiopiUrl: url });
    } catch (err) {
      console.error("Erreur upload certificat:", err);
      alert("Erreur lors de l'upload du certificat");
    } finally {
      setUploadingCertificat(false);
    }
  };

  // Supprimer le certificat Qualiopi
  const handleDeleteCertificat = async () => {
    if (!organization || !organization.certificatQualiopiUrl) return;

    if (!confirm("Êtes-vous sûr de vouloir supprimer le certificat Qualiopi ?")) {
      return;
    }

    try {
      setDeletingCertificat(true);

      const response = await fetch("/api/user/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificatQualiopiUrl: null }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      setOrganization({ ...organization, certificatQualiopiUrl: null });
    } catch (err) {
      console.error("Erreur suppression certificat:", err);
      alert("Erreur lors de la suppression du certificat");
    } finally {
      setDeletingCertificat(false);
    }
  };

  // Sauvegarder la catégorie Qualiopi
  const handleCategorieChange = async (categorie: string) => {
    if (!organization) return;

    try {
      setSavingCategorie(true);

      const response = await fetch("/api/user/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categorieQualiopi: categorie }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      setOrganization({ ...organization, categorieQualiopi: categorie });
    } catch (err) {
      console.error("Erreur sauvegarde catégorie:", err);
    } finally {
      setSavingCategorie(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
        <p className="text-gray-600">{error || "Organisation non trouvée"}</p>
      </div>
    );
  }

  const primaryColor = organization.primaryColor || "#4277FF";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Catalogue Public
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Publiez et gérez votre catalogue de formations en ligne.
          </p>
        </div>

        {organization.catalogueActif && (
          <a
            href={catalogueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            <Eye className="w-5 h-5" />
            Voir le catalogue
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Carte principale - Statut du catalogue */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Globe className="w-7 h-7" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Catalogue en ligne
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {organization.catalogueActif
                  ? "Votre catalogue est visible publiquement"
                  : "Votre catalogue n'est pas visible publiquement"}
              </p>
            </div>
          </div>

          <button
            onClick={toggleCatalogue}
            disabled={updating}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
              organization.catalogueActif
                ? "bg-green-500"
                : "bg-gray-300 dark:bg-gray-600"
            } ${updating ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                organization.catalogueActif ? "translate-x-8" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {organization.catalogueActif && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lien vers votre catalogue
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={catalogueUrl}
                readOnly
                className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
              />
              <button
                onClick={copyToClipboard}
                className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Copier le lien"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-500" />
                )}
              </button>
              <a
                href={catalogueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Ouvrir dans un nouvel onglet"
              >
                <ExternalLink className="w-5 h-5 text-gray-500" />
              </a>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Partagez ce lien sur votre site web ou vos réseaux sociaux
            </p>
          </div>
        )}
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalFormations}
                </p>
                <p className="text-sm text-gray-500">Formations totales</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.formationsPubliees}
                </p>
                <p className="text-sm text-gray-500">Publiées au catalogue</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.preInscriptionsTotal}
                </p>
                <p className="text-sm text-gray-500">Pré-inscriptions</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.preInscriptionsNouvelles}
                </p>
                <p className="text-sm text-gray-500">Nouvelles demandes</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paramètres Qualiopi */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Certification Qualiopi
            </h2>
            <p className="text-sm text-gray-500">
              Configurez les informations de votre certification
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload certificat */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Certificat Qualiopi (PDF)
            </label>
            <div className="flex items-center gap-3">
              {organization.certificatQualiopiUrl ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-300">
                    Certificat uploadé
                  </span>
                  <a
                    href={organization.certificatQualiopiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Aucun certificat
                  </span>
                </div>
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleCertificatUpload}
                  className="hidden"
                  disabled={uploadingCertificat}
                />
                <span
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{
                    backgroundColor: `${primaryColor}15`,
                    color: primaryColor,
                  }}
                >
                  {uploadingCertificat ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {organization.certificatQualiopiUrl ? "Remplacer" : "Importer"}
                </span>
              </label>
              {organization.certificatQualiopiUrl && (
                <button
                  onClick={handleDeleteCertificat}
                  disabled={deletingCertificat}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deletingCertificat ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Supprimer
                </button>
              )}
            </div>
          </div>

          {/* Catégorie Qualiopi */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Catégorie de certification
            </label>
            <select
              value={organization.categorieQualiopi || ""}
              onChange={(e) => handleCategorieChange(e.target.value)}
              disabled={savingCategorie}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="">Sélectionner une catégorie</option>
              {CATEGORIES_QUALIOPI.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Cette information sera affichée dans le footer de votre catalogue
            </p>
          </div>
        </div>
      </div>

      {/* Formations publiées */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Formations publiées
              </h2>
              <p className="text-sm text-gray-500">
                {formationsPubliees.length} formation{formationsPubliees.length > 1 ? "s" : ""} dans votre catalogue
              </p>
            </div>
          </div>
          <Link
            href="/formations"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: `${primaryColor}15`,
              color: primaryColor,
            }}
          >
            Gérer les formations
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {formationsPubliees.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">
              Aucune formation publiée dans le catalogue
            </p>
            <Link
              href="/formations"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ backgroundColor: primaryColor }}
            >
              Publier une formation
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formationsPubliees.slice(0, 6).map((formation) => (
              <Link
                key={formation.id}
                href={`/create?id=${formation.id}`}
                className="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                  {formation.image ? (
                    <Image
                      src={formation.image}
                      alt={formation.titre}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <BookOpen className="w-6 h-6" style={{ color: primaryColor }} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-brand-600">
                    {formation.titre}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{formation.dureeHeures}h</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-500" />
              </Link>
            ))}
          </div>
        )}

        {formationsPubliees.length > 6 && (
          <div className="mt-4 text-center">
            <Link
              href="/formations"
              className="text-sm font-medium hover:underline"
              style={{ color: primaryColor }}
            >
              Voir toutes les formations ({formationsPubliees.length})
            </Link>
          </div>
        )}
      </div>

      {/* Action rapide - Paramètres organisation */}
      <Link
        href="/settings"
        className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-brand-300 dark:hover:border-brand-600 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Paramètres organisation
            </h3>
            <p className="text-sm text-gray-500">
              Logo, couleurs et informations de contact
            </p>
          </div>
          <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-brand-500 transition-colors" />
        </div>
      </Link>

      {/* Information Qualiopi */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Conformité Qualiopi - Indicateur 1
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Votre catalogue public répond aux exigences de l'indicateur 1 de Qualiopi :
              il diffuse une information accessible au public sur les prestations proposées,
              les délais d'accès, les résultats obtenus et les conditions d'accessibilité.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
