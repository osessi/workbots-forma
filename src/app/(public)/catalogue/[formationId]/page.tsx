"use client";

// ===========================================
// PAGE DÉTAIL FORMATION - STYLE HEALTH CONSULTING
// ===========================================
// Qualiopi Indicateur 1 : Information détaillée et vérifiable

import { useEffect, useState, useCallback, use, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Users,
  User,
  Star,
  Award,
  BookOpen,
  CheckCircle2,
  Calendar,
  MapPin,
  ExternalLink,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Accessibility,
  Euro,
  GraduationCap,
  Target,
  FileText,
  Building2,
  Phone,
  Globe,
  Mail,
  ChevronRight,
  UserCheck,
  ClipboardCheck,
  Settings,
  X,
  Briefcase,
} from "lucide-react";
import { CatalogueFooter, FormationBadges, SatisfactionBadge } from "@/components/catalogue";

// Types
interface SousModule {
  titre: string;
  description?: string;
}

interface Module {
  id: string;
  titre: string;
  description: string | null;
  dureeHeures: number | null;
  ordre: number;
  items?: string[]; // Contenu détaillé du module
  sousModules?: SousModule[];
}

interface SessionDisponible {
  id: string;
  reference: string;
  nom: string | null;
  modalite: string;
  tarif: number | null;
  lieu: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  nombreJournees: number;
}

interface FormationDetail {
  id: string;
  titre: string;
  description: string | null;
  image: string | null;
  objectifsPedagogiques: string[];
  publicVise: string | null;
  prerequis: string | null;
  duree: {
    totalMinutes: number;
    totalHeures: number;
    totalJours?: number;
    nombreModules: number;
  };
  programme: Module[];
  typeFormation?: string | null;
  nombreParticipants?: string | null;
  suiviEvaluation?: string | null;
  ressourcesPedagogiques?: string | null;
  qualiteSatisfaction?: string | null;
  accessibiliteHandicap: string | null;
  delaiAcces: string | null;
  tarif: number | null;
  tarifs?: {
    particulier: number | null;
    entreprise: number | null;
  };
  certification: {
    isCertifiante: boolean;
    numeroFicheRS: string | null;
    lienFranceCompetences: string | null;
  } | null;
  cpf: {
    estEligible: boolean;
    codeFinancement: string | null;
  } | null;
  modalites: string[];
  indicateurs: {
    tauxSatisfaction: number | null;
    nombreAvis: number;
    nombreStagiaires: number;
    tauxReussite: number | null;
    tauxCertification: number | null;
    annee: number | null;
  } | null;
  sessionsDisponibles: SessionDisponible[];
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    telephone: string | null;
    email: string | null;
    siteWeb?: string | null;
    primaryColor: string;
    certifications: string[];
    certificatQualiopiUrl: string | null;
    categorieQualiopi: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

// Labels des modalités
const modaliteLabels: Record<string, string> = {
  PRESENTIEL: "Présentiel",
  DISTANCIEL: "Distanciel",
  MIXTE: "Mixte",
  E_LEARNING: "E-learning",
  SITUATION_TRAVAIL: "Situation de travail",
  STAGE: "Stage",
};

type PageProps = {
  params: Promise<{ formationId: string }>;
};

export default function FormationDetailPage({ params }: PageProps) {
  const { formationId } = use(params);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Chargement de la formation...</p>
          </div>
        </div>
      }
    >
      <FormationDetailContent formationId={formationId} />
    </Suspense>
  );
}

function FormationDetailContent({ formationId }: { formationId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgSlug = searchParams.get("org");

  const [formation, setFormation] = useState<FormationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreInscription, setShowPreInscription] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [clientType, setClientType] = useState<"particulier" | "entreprise">("entreprise");

  const fetchFormation = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (orgSlug) params.append("org", orgSlug);

      const response = await fetch(
        `/api/public/catalogue/${formationId}?${params}`,
        { cache: "no-store" } // Toujours récupérer les données fraîches
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors du chargement");
      }

      const data = await response.json();
      setFormation(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [formationId, orgSlug]);

  useEffect(() => {
    fetchFormation();
  }, [fetchFormation]);

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de la formation...</p>
        </div>
      </div>
    );
  }

  if (error || !formation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
          <p className="text-gray-600 mb-4">{error || "Formation non trouvée"}</p>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:underline"
          >
            ← Retour au catalogue
          </button>
        </div>
      </div>
    );
  }

  const primaryColor = formation.organization.primaryColor || "#4277FF";
  const dureeJours = formation.duree.totalJours || Math.ceil(formation.duree.totalHeures / 7);
  const currentTarif = clientType === "particulier"
    ? formation.tarifs?.particulier || formation.tarif
    : formation.tarifs?.entreprise || formation.tarif;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header avec logo et contact */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link href={`/catalogue?org=${orgSlug}`} className="flex items-center gap-3">
              {formation.organization.logo ? (
                <Image
                  src={formation.organization.logo}
                  alt={formation.organization.name}
                  width={150}
                  height={50}
                  className="h-12 w-auto object-contain"
                />
              ) : (
                <span className="text-xl font-bold" style={{ color: primaryColor }}>
                  {formation.organization.name}
                </span>
              )}
            </Link>

            {/* Contact */}
            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-600">
                Votre contact {formation.organization.name}
              </span>
              {formation.organization.email && (
                <a
                  href={`mailto:${formation.organization.email}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Mail className="w-4 h-4" />
                  {formation.organization.email}
                </a>
              )}
              {formation.organization.telephone && (
                <a
                  href={`tel:${formation.organization.telephone}`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-700 text-sm hover:bg-gray-200"
                >
                  <Phone className="w-4 h-4" />
                  {formation.organization.telephone}
                </a>
              )}
              {formation.organization.siteWeb && (
                <a
                  href={formation.organization.siteWeb}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 border rounded-full text-sm hover:bg-gray-50"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  <Globe className="w-4 h-4" />
                  Notre site web
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Bannière avec image de la formation */}
      <div
        className="relative h-48 md:h-64 bg-cover bg-center"
        style={{
          backgroundImage: formation.image
            ? `url(${formation.image})`
            : `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
        }}
      >
        {/* Overlay sombre */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Contenu de la bannière */}
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-6">
          {/* Breadcrumb sur la bannière */}
          <nav className="flex items-center gap-2 text-sm mb-3">
            <Link href={`/catalogue?org=${orgSlug}`} className="text-white/80 hover:text-white transition-colors">
              Accueil
            </Link>
            <ChevronRight className="w-4 h-4 text-white/60" />
            <span className="text-white/80">Formations</span>
            <ChevronRight className="w-4 h-4 text-white/60" />
            <span className="font-medium text-white truncate max-w-md">
              {formation.titre}
            </span>
          </nav>

          {/* Titre sur la bannière */}
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {formation.titre}
          </h1>

          {/* Badges sur la bannière - style blanc pour contraste */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {formation.modalites.length > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm" style={{ color: primaryColor }}>
                {formation.modalites.map(m => modaliteLabels[m] || m).join(", ")}
              </span>
            )}
            {formation.duree.totalHeures > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm" style={{ color: primaryColor }}>
                {formation.duree.totalHeures}h ({dureeJours} jour{dureeJours > 1 ? "s" : ""})
              </span>
            )}
            {formation.accessibiliteHandicap && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-teal-500/90 text-white backdrop-blur-sm flex items-center gap-1">
                <Accessibility className="w-3.5 h-3.5" />
                Accessible PMR
              </span>
            )}
            {formation.certification?.isCertifiante && (
              <span className="px-3 py-1 rounded-full text-xs font-medium text-white backdrop-blur-sm" style={{ backgroundColor: `${primaryColor}cc` }}>
                Certifiante
              </span>
            )}
            {formation.cpf?.estEligible && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/90 text-white backdrop-blur-sm">
                Éligible CPF
              </span>
            )}
            {formation.indicateurs?.tauxSatisfaction && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/90 text-white backdrop-blur-sm flex items-center gap-1">
                <Star className="w-3.5 h-3.5" />
                {(formation.indicateurs.tauxSatisfaction / 10).toFixed(1)}/10
                {formation.indicateurs.nombreAvis > 0 && ` (${formation.indicateurs.nombreAvis} avis)`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-12 gap-8">

            {/* ========================================= */}
            {/* SIDEBAR GAUCHE - Infos formation */}
            {/* ========================================= */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden sticky top-4">
                {/* Image */}
                <div className="relative aspect-video bg-gray-100">
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
                      <GraduationCap className="w-16 h-16" style={{ color: primaryColor }} />
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {formation.titre}
                  </h2>

                  <div className="text-xs text-gray-500 mb-4 space-y-1">
                    <p>Formation créée le {new Date(formation.createdAt).toLocaleDateString("fr-FR")}</p>
                    <p>Dernière mise à jour le {new Date(formation.updatedAt).toLocaleDateString("fr-FR")}</p>
                  </div>

                  {/* Badges avec couleur primaire */}
                  <div className="mb-4">
                    <FormationBadges
                      formation={{
                        modalites: formation.modalites,
                        dureeHeures: formation.duree.totalHeures,
                        dureeJours: formation.duree.totalJours || dureeJours,
                        isCertifiante: formation.certification?.isCertifiante || false,
                        numeroFicheRS: formation.certification?.numeroFicheRS,
                        estEligibleCPF: formation.cpf?.estEligible,
                        accessibiliteHandicap: formation.accessibiliteHandicap,
                        nombreModules: formation.duree.nombreModules,
                      }}
                      primaryColor={primaryColor}
                      size="sm"
                    />
                  </div>

                  {/* Taux de satisfaction des apprenants - Encadré dédié */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm font-medium text-gray-700 text-center mb-3">
                      Taux de satisfaction des apprenants
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${formation.indicateurs?.tauxSatisfaction
                              ? Math.min(formation.indicateurs.tauxSatisfaction, 100)
                              : 0}%`,
                            backgroundColor: primaryColor,
                          }}
                        />
                      </div>
                      <span className="text-lg font-bold whitespace-nowrap" style={{ color: primaryColor }}>
                        {formation.indicateurs?.tauxSatisfaction
                          ? `${(formation.indicateurs.tauxSatisfaction / 10).toFixed(1)}/10`
                          : "N/A"}
                      </span>
                      {formation.indicateurs?.nombreAvis && formation.indicateurs.nombreAvis > 0 && (
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          ({formation.indicateurs.nombreAvis} avis)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Détails avec badges colorés */}
                  <div className="space-y-4 py-4 border-t border-b">
                    {/* Type de formation - Badge coloré */}
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 mt-0.5" style={{ color: primaryColor }} />
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Type de formation</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(formation.modalites.length > 0 ? formation.modalites : ["PRESENTIEL"]).map((modalite) => (
                            <span
                              key={modalite}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border"
                              style={{
                                backgroundColor: `${primaryColor}10`,
                                color: primaryColor,
                                borderColor: `${primaryColor}30`,
                              }}
                            >
                              {modaliteLabels[modalite] || modalite}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Durée - Badge coloré */}
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 mt-0.5" style={{ color: primaryColor }} />
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Durée de formation</p>
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border"
                          style={{
                            backgroundColor: `${primaryColor}10`,
                            color: primaryColor,
                            borderColor: `${primaryColor}30`,
                          }}
                        >
                          {formation.duree.totalHeures}h ({dureeJours} jour{dureeJours > 1 ? "s" : ""})
                        </span>
                      </div>
                    </div>

                    {/* Accessibilité - Badge coloré */}
                    <div className="flex items-start gap-3">
                      <Accessibility className="w-5 h-5 mt-0.5 text-teal-500" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Accessibilité</p>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border bg-teal-50 text-teal-700 border-teal-200">
                          {formation.accessibiliteHandicap ? "Accessible PMR" : "Accessible"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Type client toggle */}
                  <div className="flex items-center gap-2 py-4">
                    <button
                      onClick={() => setClientType("particulier")}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        clientType === "particulier"
                          ? "text-white"
                          : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                      }`}
                      style={clientType === "particulier" ? { backgroundColor: primaryColor } : undefined}
                    >
                      Particulier
                    </button>
                    <button
                      onClick={() => setClientType("entreprise")}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        clientType === "entreprise"
                          ? "text-white"
                          : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                      }`}
                      style={clientType === "entreprise" ? { backgroundColor: primaryColor } : undefined}
                    >
                      Entreprise
                    </button>
                  </div>

                  {/* Tarif selon le type de client */}
                  <div className="text-center py-4">
                    {currentTarif ? (
                      <p className="text-2xl font-bold text-gray-900">
                        {currentTarif.toLocaleString("fr-FR")} € <span className="text-sm font-normal text-gray-500">HT</span>
                      </p>
                    ) : (
                      <p className="text-lg text-gray-600">Tarif sur demande</p>
                    )}
                  </div>

                  {/* Bouton inscription */}
                  <button
                    onClick={() => setShowPreInscription(true)}
                    className="w-full py-3 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: primaryColor }}
                  >
                    S&apos;inscrire
                  </button>
                </div>
              </div>
            </div>

            {/* ========================================= */}
            {/* CONTENU PRINCIPAL - Droite */}
            {/* ========================================= */}
            <div className="lg:col-span-8 space-y-8">

              {/* Description */}
              {formation.description && (
                <div className="bg-white rounded-2xl border shadow-sm p-6">
                  <p className="text-gray-600 leading-relaxed">
                    {formation.description}
                  </p>
                </div>
              )}

              {/* ========================================= */}
              {/* OBJECTIFS DE LA FORMATION */}
              {/* ========================================= */}
              <SectionCard title="Objectifs de la formation" icon={Target} primaryColor={primaryColor}>
                {formation.objectifsPedagogiques.length > 0 ? (
                  <ul className="space-y-3">
                    {formation.objectifsPedagogiques.map((objectif, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                        <span className="text-gray-700">{objectif}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                      <span className="text-gray-700">Développer les compétences nécessaires pour maîtriser le sujet</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                      <span className="text-gray-700">Mettre en place des méthodes et outils concrets</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                      <span className="text-gray-700">Acquérir des techniques pratiques applicables immédiatement</span>
                    </li>
                  </ul>
                )}
              </SectionCard>

              {/* ========================================= */}
              {/* PROFIL DES BÉNÉFICIAIRES */}
              {/* ========================================= */}
              <SectionCard title="Profil des bénéficiaires" icon={Users} primaryColor={primaryColor}>
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Pour qui */}
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: primaryColor }}>
                      <UserCheck className="w-4 h-4" />
                      Pour qui
                    </h4>
                    {formation.publicVise ? (
                      <ul className="space-y-2 text-sm text-gray-700">
                        {formation.publicVise.split("\n").filter(Boolean).map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-gray-400 mt-1">•</span>
                            <span>{item.replace(/^[-•]\s*/, "")}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-gray-400 mt-1">•</span>
                          <span>Managers et responsables d&apos;équipes</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gray-400 mt-1">•</span>
                          <span>Cadres souhaitant développer leurs compétences</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gray-400 mt-1">•</span>
                          <span>Professionnels intéressés par le sujet</span>
                        </li>
                      </ul>
                    )}
                  </div>

                  {/* Prérequis */}
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: primaryColor }}>
                      <ClipboardCheck className="w-4 h-4" />
                      Prérequis
                    </h4>
                    {formation.prerequis ? (
                      <ul className="space-y-2 text-sm text-gray-700">
                        {formation.prerequis.split("\n").filter(Boolean).map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-gray-400 mt-1">•</span>
                            <span>{item.replace(/^[-•]\s*/, "")}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-gray-400 mt-1">•</span>
                          <span>Aucun prérequis particulier</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gray-400 mt-1">•</span>
                          <span>Novices acceptés</span>
                        </li>
                      </ul>
                    )}
                  </div>
                </div>
              </SectionCard>

              {/* ========================================= */}
              {/* CONTENU DE LA FORMATION (Modules) */}
              {/* ========================================= */}
              <SectionCard title="Contenu de la formation" icon={BookOpen} primaryColor={primaryColor}>
                <div className="space-y-3">
                  {formation.programme.length > 0 ? (
                    formation.programme.map((module) => (
                      <div key={module.id} className="border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleModule(module.id)}
                          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <span className="font-medium text-gray-900 text-left">
                            {module.titre}
                          </span>
                          {expandedModules.has(module.id) ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        {expandedModules.has(module.id) && (
                          <div className="px-4 py-4 border-t bg-white">
                            {/* Afficher les items du module */}
                            {module.items && module.items.length > 0 ? (
                              <ul className="space-y-2">
                                {module.items.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-gray-400 mt-1">•</span>
                                    <span className="text-gray-700">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : module.description ? (
                              <p className="text-gray-600">{module.description}</p>
                            ) : module.sousModules && module.sousModules.length > 0 ? (
                              <ul className="space-y-2">
                                {module.sousModules.map((sm, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-gray-400 mt-1">•</span>
                                    <span className="text-gray-700">{sm.titre}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-500 italic">Détails à venir</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Programme à définir</p>
                  )}
                </div>
              </SectionCard>

              {/* ========================================= */}
              {/* ÉQUIPE PÉDAGOGIQUE + SUIVI ÉVALUATION (2 colonnes avec icônes) */}
              {/* ========================================= */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Équipe pédagogique */}
                <div className="bg-white rounded-2xl border shadow-sm p-6 relative">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center bg-white border shadow-sm">
                    <GraduationCap className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                  <h3 className="text-center font-bold text-gray-900 mt-4 mb-4">Équipe pédagogique</h3>
                  <p className="text-sm text-gray-600 text-center">
                    {`${formation.organization.name} est une équipe de formateurs experts, dont l'objectif est d'optimiser la performance et les compétences. En mettant l'accent sur l'efficacité tout en préservant le bien-être, nous aidons à concilier performance durable et épanouissement professionnel.`}
                  </p>
                </div>

                {/* Suivi de l'exécution et évaluation des résultats */}
                <div className="bg-white rounded-2xl border shadow-sm p-6 relative">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center bg-white border shadow-sm">
                    <ClipboardCheck className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                  <h3 className="text-center font-bold text-gray-900 mt-4 mb-4">Suivi de l&apos;exécution et évaluation des résultats</h3>
                  {formation.suiviEvaluation ? (
                    <ul className="space-y-2 text-sm text-gray-600">
                      {formation.suiviEvaluation.split('\n').filter(Boolean).map((line, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-gray-400 mt-1">•</span>
                          <span>{line.replace(/^[•\-\*]\s*/, '')}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-gray-400 mt-1">•</span>
                        <span>Le suivi de la réalisation se fera par la signature de feuille d&apos;émargement par demi-journée</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gray-400 mt-1">•</span>
                        <span>L&apos;évaluation de l&apos;acquisition des compétences s&apos;effectue tout au long de la formation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gray-400 mt-1">•</span>
                        <span>L&apos;évaluation finale se fera par un QCM</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gray-400 mt-1">•</span>
                        <span>Un certificat de réalisation est remis à l&apos;apprenant à l&apos;issue de la formation</span>
                      </li>
                    </ul>
                  )}
                </div>
              </div>

              {/* ========================================= */}
              {/* RESSOURCES TECHNIQUES ET PÉDAGOGIQUES (cadre bleu) */}
              {/* ========================================= */}
              <div className="rounded-2xl p-6 relative" style={{ backgroundColor: `${primaryColor}08`, border: `1px solid ${primaryColor}30` }}>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center bg-white border shadow-sm">
                  <Settings className="w-6 h-6" style={{ color: primaryColor }} />
                </div>
                <h3 className="text-center font-bold text-gray-900 mt-4 mb-4">Ressources techniques et pédagogiques</h3>
                {formation.ressourcesPedagogiques ? (
                  <ul className="space-y-2 text-sm text-gray-700">
                    {formation.ressourcesPedagogiques.split('\n').filter(Boolean).map((line, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-gray-400 mt-1">•</span>
                        <span>{line.replace(/^[•\-\*]\s*/, '')}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <span>Formation réalisée en présentiel en salle équipée, en intra entreprise ou à distance depuis un outil de visioconférence (synchrone)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <span>Accompagnement formateur : Suivi et conseils personnalisés par le formateur durant la formation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <span>Ateliers pratiques : Projets à réaliser pour appliquer les compétences acquises</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <span>Supports de cours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <span>Espace apprenant avec toutes les informations et documents relatifs à la formation mis à disposition</span>
                    </li>
                  </ul>
                )}
              </div>

              {/* ========================================= */}
              {/* QUALITÉ ET SATISFACTION */}
              {/* ========================================= */}
              <SectionCard title="Qualité et satisfaction" icon={Star} primaryColor={primaryColor}>
                <div className="space-y-6">
                  {/* Texte sur toute la largeur */}
                  <div className="text-sm text-gray-600 space-y-3">
                    {formation.qualiteSatisfaction ? (
                      <p>{formation.qualiteSatisfaction}</p>
                    ) : (
                      <>
                        <p>
                          Chez {formation.organization.name}, nous plaçons la satisfaction de nos apprenants au cœur de nos préoccupations, en mesurant régulièrement leur progression tout au long de nos formations pour garantir un apprentissage de qualité et un accompagnement personnalisé vers la réussite.
                        </p>
                        <p>
                          Dans le cadre de notre démarche d&apos;amélioration continue, une enquête de satisfaction sera envoyée en fin de formation aux apprenants, formateurs et prescripteurs, le cas échéant.
                        </p>
                        <p>
                          Une évaluation différée est également envoyée trois mois après la formation afin de mesurer l&apos;impact de la formation sur le projet professionnel et l&apos;application des compétences acquises.
                        </p>
                      </>
                    )}
                  </div>
                  {/* Indicateurs en dessous, centrés - Toujours affiché */}
                  <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-3">Taux de satisfaction des apprenants</p>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${formation.indicateurs?.tauxSatisfaction
                              ? Math.min(formation.indicateurs.tauxSatisfaction, 100)
                              : 0}%`,
                            backgroundColor: primaryColor,
                          }}
                        />
                      </div>
                      <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                        {formation.indicateurs?.tauxSatisfaction
                          ? `${(formation.indicateurs.tauxSatisfaction / 10).toFixed(1)}/10`
                          : "N/A"}
                      </span>
                      {formation.indicateurs?.nombreAvis && formation.indicateurs.nombreAvis > 0 && (
                        <span className="text-sm text-gray-500">
                          ({formation.indicateurs.nombreAvis} avis)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* ========================================= */}
              {/* DÉLAI D'ACCÈS */}
              {/* ========================================= */}
              <SectionCard title="Délai d'accès" icon={Calendar} primaryColor={primaryColor}>
                <p className="text-gray-700">
                  {formation.delaiAcces || "4 semaines"}
                </p>
              </SectionCard>

              {/* ========================================= */}
              {/* ACCESSIBILITÉ */}
              {/* ========================================= */}
              <SectionCard title="Accessibilité" icon={Accessibility} primaryColor={primaryColor}>
                <p className="text-gray-700">
                  {formation.accessibiliteHandicap ||
                    `Nous mettons un point d'honneur à garantir l'accessibilité de nos formations aux personnes en situation de handicap. Que ce soit en termes d'accès physique, de supports pédagogiques ou d'aménagements spécifiques, nous nous engageons à adapter nos sessions pour répondre aux besoins individuels. Si vous avez des besoins particuliers, n'hésitez pas à nous en informer en amont afin que nous puissions prendre les dispositions nécessaires pour vous assurer une expérience de formation optimale par mail à ${formation.organization.email || "contact@" + formation.organization.slug + ".fr"}`
                  }
                </p>
              </SectionCard>

            </div>
          </div>
        </div>
      </main>

      {/* Footer avec Qualiopi */}
      <CatalogueFooter organization={formation.organization} />

      {/* Modal de pré-inscription */}
      {showPreInscription && (
        <PreInscriptionModal
          formation={formation}
          onClose={() => setShowPreInscription(false)}
          primaryColor={primaryColor}
        />
      )}
    </div>
  );
}

// Composant Section Card
function SectionCard({
  title,
  icon: Icon,
  primaryColor,
  children,
}: {
  title: string;
  icon: React.ElementType;
  primaryColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: primaryColor }} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ===========================================
// MODAL DE PRÉ-INSCRIPTION COMPLÈTE (Qualiopi)
// ===========================================
// Formulaire complet en 4 étapes avec tous les champs requis

function PreInscriptionModal({
  formation,
  onClose,
  primaryColor,
}: {
  formation: FormationDetail;
  onClose: () => void;
  primaryColor: string;
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileType, setProfileType] = useState<"particulier" | "entreprise" | null>(null);

  const [formData, setFormData] = useState({
    // Étape 1: Analyse du besoin (Qualiopi)
    objectifsProfessionnels: "",
    contexte: "",
    experiencePrealable: "",
    attentesSpecifiques: "",
    contraintes: "",
    // Étape 2: Identité
    civilite: "",
    nom: "",
    prenom: "",
    dateNaissance: "",
    lieuNaissance: "",
    email: "",
    telephone: "",
    // Étape 3: Adresse & Situation
    adresse: "",
    codePostal: "",
    ville: "",
    situationProfessionnelle: "",
    entreprise: "",
    poste: "",
    siret: "",
    // Étape 4: Handicap & Financement
    situationHandicap: false,
    besoinsAmenagements: "",
    modeFinancement: "",
    financeurNom: "",
    commentaireFinancement: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/public/pre-inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationSlug: formation.organization.slug,
          formationId: formation.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'envoi");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  // Validation par étape
  const canProceed = () => {
    switch (step) {
      case 1:
        return true; // Analyse du besoin optionnelle
      case 2:
        return formData.nom && formData.prenom && formData.email;
      case 3:
        return true; // Adresse optionnelle
      case 4:
        return true; // Handicap/financement optionnel
      default:
        return true;
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl max-w-lg w-full p-8 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <CheckCircle2 className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Demande envoyée avec succès !
          </h2>
          <p className="text-gray-600 mb-2">
            Votre demande de pré-inscription à la formation
          </p>
          <p className="font-semibold mb-4" style={{ color: primaryColor }}>
            &quot;{formation.titre}&quot;
          </p>
          <p className="text-gray-600 mb-6">
            a bien été enregistrée. Vous allez recevoir un email de confirmation.
            Notre équipe vous recontactera dans les plus brefs délais.
          </p>
          <button
            onClick={onClose}
            className="px-8 py-3 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  // Écran de sélection du profil
  if (!profileType) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden">
          {/* Header avec image */}
          <div
            className="relative h-32 bg-cover bg-center"
            style={{
              backgroundImage: formation.image
                ? `url(${formation.image})`
                : `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
            }}
          >
            <div className="absolute inset-0 bg-black/40" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="absolute bottom-4 left-6 right-6">
              <p className="text-white/80 text-sm">Pré-inscription à la formation</p>
              <h2 className="text-xl font-bold text-white">{formation.titre}</h2>
            </div>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <User className="w-8 h-8" style={{ color: primaryColor }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Votre profil</h3>
              <p className="text-gray-600 text-sm">
                Sélectionnez votre profil pour adapter le formulaire à votre situation
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setProfileType("particulier");
                  setFormData(prev => ({ ...prev, situationProfessionnelle: "PARTICULIER" }));
                }}
                className="w-full p-4 border-2 rounded-xl hover:border-gray-300 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Je m&apos;inscris individuellement</p>
                    <p className="text-sm text-gray-500">En tant que particulier ou indépendant (profession libérale)</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                </div>
              </button>

              <button
                onClick={() => {
                  setProfileType("entreprise");
                  setFormData(prev => ({ ...prev, situationProfessionnelle: "SALARIE" }));
                }}
                className="w-full p-4 border-2 rounded-xl hover:border-gray-300 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Building2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Je fais une demande pour une structure</p>
                    <p className="text-sm text-gray-500">Entreprise, association, collectivité...</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                </div>
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-6">
              Sélectionnez ce mode si c&apos;est votre entreprise qui finance votre formation
              ou si vous souhaitez programmer une formation pour vos collaborateurs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header fixe avec progression */}
        <div className="sticky top-0 bg-white border-b z-10">
          {/* Barre de progression */}
          <div className="h-1 bg-gray-100">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: primaryColor }}
            />
          </div>

          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => profileType ? setProfileType(null) : onClose()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <p className="text-sm text-gray-500">Étape {step} sur {totalSteps}</p>
                <h2 className="font-semibold text-gray-900">
                  {step === 1 && "Analyse du besoin"}
                  {step === 2 && "Vos informations"}
                  {step === 3 && (profileType === "entreprise" ? "Informations entreprise" : "Adresse & Situation")}
                  {step === 4 && "Accessibilité & Financement"}
                </h2>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Indicateurs d'étapes */}
          <div className="px-6 pb-4 flex items-center justify-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  s === step
                    ? "text-white"
                    : s < step
                    ? "text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
                style={{
                  backgroundColor: s <= step ? primaryColor : undefined,
                }}
              >
                {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* ========================================= */}
            {/* ÉTAPE 1: ANALYSE DU BESOIN (Qualiopi) */}
            {/* ========================================= */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="p-4 rounded-lg" style={{ backgroundColor: `${primaryColor}08` }}>
                  <p className="text-sm text-gray-600">
                    <strong style={{ color: primaryColor }}>Conformité Qualiopi :</strong> Ces informations nous permettent de mieux comprendre vos besoins et d&apos;adapter notre accompagnement.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quels sont vos objectifs professionnels ? *
                  </label>
                  <textarea
                    name="objectifsProfessionnels"
                    value={formData.objectifsProfessionnels}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                    style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
                    placeholder="Ex: Développer mes compétences en gestion de projet pour évoluer vers un poste de chef de projet..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quel est le contexte de votre demande ?
                  </label>
                  <textarea
                    name="contexte"
                    value={formData.contexte}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                    placeholder="Ex: Évolution professionnelle, reconversion, montée en compétences..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quelle est votre expérience préalable dans ce domaine ?
                  </label>
                  <textarea
                    name="experiencePrealable"
                    value={formData.experiencePrealable}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                    placeholder="Ex: Débutant, quelques notions, expérience professionnelle de X ans..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attentes spécifiques
                    </label>
                    <textarea
                      name="attentesSpecifiques"
                      value={formData.attentesSpecifiques}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                      placeholder="Vos attentes particulières..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraintes éventuelles
                    </label>
                    <textarea
                      name="contraintes"
                      value={formData.contraintes}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                      placeholder="Horaires, lieu, disponibilités..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================= */}
            {/* ÉTAPE 2: INFORMATIONS PERSONNELLES */}
            {/* ========================================= */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <User className="w-5 h-5" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Informations personnelles</h3>
                    <p className="text-sm text-gray-500">Les champs marqués * sont obligatoires</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Civilité</label>
                    <select
                      name="civilite"
                      value={formData.civilite}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent bg-white"
                    >
                      <option value="">Choisir</option>
                      <option value="M.">M.</option>
                      <option value="Mme">Mme</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      placeholder="Votre nom"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                    <input
                      type="text"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      placeholder="Votre prénom"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date de naissance</label>
                    <input
                      type="date"
                      name="dateNaissance"
                      value={formData.dateNaissance}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lieu de naissance</label>
                    <input
                      type="text"
                      name="lieuNaissance"
                      value={formData.lieuNaissance}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      placeholder="Ville de naissance"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      placeholder="votre@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      placeholder="06 00 00 00 00"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================= */}
            {/* ÉTAPE 3: ADRESSE & SITUATION / ENTREPRISE */}
            {/* ========================================= */}
            {step === 3 && (
              <div className="space-y-6">
                {profileType === "entreprise" ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
                        <Building2 className="w-5 h-5" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Informations entreprise</h3>
                        <p className="text-sm text-gray-500">Structure qui finance la formation</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l&apos;entreprise *</label>
                        <input
                          type="text"
                          name="entreprise"
                          value={formData.entreprise}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          placeholder="Raison sociale"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">SIRET *</label>
                        <input
                          type="text"
                          name="siret"
                          value={formData.siret}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          placeholder="123 456 789 00012"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Adresse de l&apos;entreprise</label>
                      <input
                        type="text"
                        name="adresse"
                        value={formData.adresse}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        placeholder="Numéro et nom de rue"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Code postal</label>
                        <input
                          type="text"
                          name="codePostal"
                          value={formData.codePostal}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          placeholder="75000"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                        <input
                          type="text"
                          name="ville"
                          value={formData.ville}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          placeholder="Ville"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Votre poste dans l&apos;entreprise</label>
                      <input
                        type="text"
                        name="poste"
                        value={formData.poste}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        placeholder="Ex: Responsable RH, Directeur..."
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
                        <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Adresse & Situation</h3>
                        <p className="text-sm text-gray-500">Vos coordonnées et situation professionnelle</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                      <input
                        type="text"
                        name="adresse"
                        value={formData.adresse}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        placeholder="Numéro et nom de rue"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Code postal</label>
                        <input
                          type="text"
                          name="codePostal"
                          value={formData.codePostal}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          placeholder="75000"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                        <input
                          type="text"
                          name="ville"
                          value={formData.ville}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          placeholder="Ville"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Situation professionnelle</label>
                      <select
                        name="situationProfessionnelle"
                        value={formData.situationProfessionnelle}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent bg-white"
                      >
                        <option value="">Sélectionnez</option>
                        <option value="SALARIE">Salarié(e)</option>
                        <option value="INDEPENDANT">Indépendant(e) / Freelance</option>
                        <option value="DEMANDEUR_EMPLOI">Demandeur d&apos;emploi</option>
                        <option value="ETUDIANT">Étudiant(e)</option>
                        <option value="RETRAITE">Retraité(e)</option>
                        <option value="AUTRE">Autre</option>
                      </select>
                    </div>

                    {(formData.situationProfessionnelle === "SALARIE" || formData.situationProfessionnelle === "INDEPENDANT") && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {formData.situationProfessionnelle === "SALARIE" ? "Entreprise" : "Nom commercial"}
                          </label>
                          <input
                            type="text"
                            name="entreprise"
                            value={formData.entreprise}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {formData.situationProfessionnelle === "SALARIE" ? "Poste" : "SIRET"}
                          </label>
                          <input
                            type="text"
                            name={formData.situationProfessionnelle === "SALARIE" ? "poste" : "siret"}
                            value={formData.situationProfessionnelle === "SALARIE" ? formData.poste : formData.siret}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ========================================= */}
            {/* ÉTAPE 4: HANDICAP & FINANCEMENT */}
            {/* ========================================= */}
            {step === 4 && (
              <div className="space-y-6">
                {/* Section Handicap - Obligatoire Qualiopi */}
                <div className="p-5 border-2 border-purple-200 rounded-xl bg-purple-50/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Accessibility className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Accessibilité (Qualiopi)</h3>
                      <p className="text-sm text-gray-500">Information obligatoire pour adapter votre parcours</p>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-300 transition-colors">
                    <input
                      type="checkbox"
                      name="situationHandicap"
                      checked={formData.situationHandicap}
                      onChange={handleChange}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Êtes-vous en situation de handicap ?</span>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Cette information nous permet de vous proposer des aménagements adaptés
                      </p>
                    </div>
                  </label>

                  {formData.situationHandicap && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Avez-vous besoin d&apos;aménagements spécifiques ?
                      </label>
                      <textarea
                        name="besoinsAmenagements"
                        value={formData.besoinsAmenagements}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Décrivez vos besoins : accessibilité PMR, supports adaptés, pauses régulières..."
                      />
                    </div>
                  )}
                </div>

                {/* Section Financement */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <Euro className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Mode de financement</h3>
                      <p className="text-sm text-gray-500">Comment souhaitez-vous financer cette formation ?</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { value: "ENTREPRISE", label: "Entreprise", icon: Building2 },
                      { value: "OPCO", label: "OPCO", icon: Award },
                      { value: "CPF", label: "CPF", icon: GraduationCap },
                      { value: "FRANCE_TRAVAIL", label: "France Travail", icon: Briefcase },
                      { value: "PERSONNEL", label: "Personnel", icon: User },
                      { value: "MIXTE", label: "Mixte", icon: FileText },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.modeFinancement === option.value
                            ? "border-current bg-opacity-10"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        style={{
                          borderColor: formData.modeFinancement === option.value ? primaryColor : undefined,
                          backgroundColor: formData.modeFinancement === option.value ? `${primaryColor}10` : undefined,
                        }}
                      >
                        <input
                          type="radio"
                          name="modeFinancement"
                          value={option.value}
                          checked={formData.modeFinancement === option.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <option.icon
                          className="w-5 h-5"
                          style={{ color: formData.modeFinancement === option.value ? primaryColor : "#9ca3af" }}
                        />
                        <span className={`text-sm font-medium ${
                          formData.modeFinancement === option.value ? "text-gray-900" : "text-gray-600"
                        }`}>
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  {(formData.modeFinancement === "OPCO" || formData.modeFinancement === "MIXTE") && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom du financeur / OPCO
                      </label>
                      <input
                        type="text"
                        name="financeurNom"
                        value={formData.financeurNom}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        placeholder="Ex: OPCO EP, ATLAS, Uniformation..."
                      />
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commentaire sur le financement (optionnel)
                    </label>
                    <textarea
                      name="commentaireFinancement"
                      value={formData.commentaireFinancement}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      placeholder="Précisions sur votre situation de financement..."
                    />
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer fixe avec boutons */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => step > 1 ? setStep(step - 1) : setProfileType(null)}
            className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
          >
            Retour
          </button>

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="px-8 py-2.5 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              Continuer
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
              className="px-8 py-2.5 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90 flex items-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Envoyer ma demande
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
