"use client";

// ===========================================
// PAGE DÉTAIL ENTREPRISE (Correction 396)
// ===========================================
// Affiche toutes les informations d'une entreprise:
// - Informations principales
// - Apprenants rattachés
// - Pré-inscriptions liées
// - Sessions de formation

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Users,
  Edit,
  Send,
  Loader2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Calendar,
  GraduationCap,
  BookOpen,
  Briefcase,
  StickyNote,
} from "lucide-react";

// Types
interface Formation {
  id: string;
  titre: string;
  tarifAffiche?: number | null;
}

interface PreInscription {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  statut: string;
  createdAt: string;
  formation: Formation;
}

interface SessionJournee {
  date: string;
}

interface Session {
  id: string;
  reference: string;
  nom: string;
  status: string;
  formation: { id: string; titre: string };
  journees: SessionJournee[];
}

interface SessionParticipation {
  id: string;
  client: {
    session: Session;
  };
}

interface Apprenant {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  statut: string;
  preInscriptions: PreInscription[];
  sessionParticipationsNew: SessionParticipation[];
}

interface EntrepriseStats {
  totalApprenants: number;
  totalPreInscriptions: number;
  preInscriptionsAcceptees: number;
  totalSessions: number;
  sessionsEnCours: number;
  sessionsTerminees: number;
}

interface Entreprise {
  id: string;
  raisonSociale: string;
  siret: string | null;
  tvaIntracom: string | null;
  contactCivilite: string | null;
  contactNom: string | null;
  contactPrenom: string | null;
  contactFonction: string | null;
  contactEmail: string | null;
  contactTelephone: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  pays: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  apprenants: Apprenant[];
  stats: EntrepriseStats;
}

// Configuration des statuts
const statutLabels: Record<string, string> = {
  SALARIE: "Salarié",
  INDEPENDANT: "Indépendant",
  PARTICULIER: "Particulier",
};

const statutColors: Record<string, string> = {
  SALARIE: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  INDEPENDANT: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  PARTICULIER: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
};

const preInscriptionStatutConfig: Record<string, { label: string; color: string }> = {
  NOUVELLE: { label: "Nouvelle", color: "bg-blue-100 text-blue-700" },
  EN_TRAITEMENT: { label: "En traitement", color: "bg-yellow-100 text-yellow-700" },
  ACCEPTEE: { label: "Acceptée", color: "bg-green-100 text-green-700" },
  REFUSEE: { label: "Refusée", color: "bg-red-100 text-red-700" },
  ANNULEE: { label: "Annulée", color: "bg-gray-100 text-gray-700" },
};

const sessionStatusConfig: Record<string, { label: string; color: string }> = {
  PLANIFIEE: { label: "Planifiée", color: "bg-blue-100 text-blue-700" },
  EN_COURS: { label: "En cours", color: "bg-yellow-100 text-yellow-700" },
  TERMINEE: { label: "Terminée", color: "bg-green-100 text-green-700" },
  ANNULEE: { label: "Annulée", color: "bg-red-100 text-red-700" },
};

// Tabs
type TabType = "informations" | "apprenants" | "preinscriptions" | "sessions";

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: "informations", label: "Informations", icon: <User size={16} /> },
  { id: "apprenants", label: "Apprenants", icon: <Users size={16} /> },
  { id: "preinscriptions", label: "Pré-inscriptions", icon: <FileText size={16} /> },
  { id: "sessions", label: "Sessions", icon: <Calendar size={16} /> },
];

// Helper
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function EntrepriseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("informations");
  const [selectedApprenant, setSelectedApprenant] = useState<Apprenant | null>(null);

  const fetchEntreprise = useCallback(async () => {
    try {
      const res = await fetch(`/api/donnees/entreprises/${id}`);
      if (res.ok) {
        const data = await res.json();
        setEntreprise(data);
        if (data.apprenants?.length > 0) {
          setSelectedApprenant(data.apprenants[0]);
        }
      } else {
        router.push("/donnees/entreprises");
      }
    } catch (error) {
      console.error("Erreur:", error);
      router.push("/donnees/entreprises");
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchEntreprise();
  }, [fetchEntreprise]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!entreprise) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <Building2 className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg mb-4">Entreprise non trouvée</p>
        <Link
          href="/donnees/entreprises"
          className="text-brand-500 hover:text-brand-600"
        >
          Retour aux entreprises
        </Link>
      </div>
    );
  }

  // Agréger toutes les pré-inscriptions et sessions
  const allPreInscriptions = entreprise.apprenants.flatMap(a =>
    a.preInscriptions.map(p => ({ ...p, apprenant: { id: a.id, nom: a.nom, prenom: a.prenom } }))
  );
  const allSessions = entreprise.apprenants.flatMap(a =>
    a.sessionParticipationsNew.map(s => ({ ...s, apprenant: { id: a.id, nom: a.nom, prenom: a.prenom } }))
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <Link
            href="/donnees/entreprises"
            className="hover:text-brand-500 transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            Retour aux entreprises
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
              <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                {entreprise.raisonSociale.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {entreprise.raisonSociale}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                {entreprise.siret && (
                  <span className="font-mono">SIRET: {entreprise.siret}</span>
                )}
                {entreprise.contactEmail && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="flex items-center gap-1">
                      <Mail size={14} />
                      {entreprise.contactEmail}
                    </span>
                  </>
                )}
                {entreprise.contactTelephone && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="flex items-center gap-1">
                      <Phone size={14} />
                      {entreprise.contactTelephone}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/donnees/entreprises?edit=${entreprise.id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Edit size={16} />
              Modifier
            </Link>
            {entreprise.contactEmail && (
              <a
                href={`mailto:${entreprise.contactEmail}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors"
              >
                <Send size={16} />
                Envoyer un email
              </a>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <Users size={16} />
              <span className="text-sm">Apprenants</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {entreprise.stats.totalApprenants}
            </p>
          </div>
          <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <FileText size={16} />
              <span className="text-sm">Pré-inscriptions</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {entreprise.stats.totalPreInscriptions}
            </p>
            <p className="text-xs text-gray-500">{entreprise.stats.preInscriptionsAcceptees} acceptée(s)</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <Calendar size={16} />
              <span className="text-sm">Sessions</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {entreprise.stats.totalSessions}
            </p>
            <p className="text-xs text-gray-500">{entreprise.stats.sessionsEnCours} en cours</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <CheckCircle2 size={16} />
              <span className="text-sm">Terminées</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {entreprise.stats.sessionsTerminees}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-800">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.id === "apprenants" && entreprise.stats.totalApprenants > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                    {entreprise.stats.totalApprenants}
                  </span>
                )}
                {tab.id === "preinscriptions" && entreprise.stats.totalPreInscriptions > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                    {entreprise.stats.totalPreInscriptions}
                  </span>
                )}
                {tab.id === "sessions" && entreprise.stats.totalSessions > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                    {entreprise.stats.totalSessions}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Onglet Informations */}
          {activeTab === "informations" && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Informations principales */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">
                  Informations de l&apos;entreprise
                </h3>

                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Raison sociale</span>
                    <p className="mt-1 text-gray-900 dark:text-white font-medium">
                      {entreprise.raisonSociale}
                    </p>
                  </div>

                  {entreprise.siret && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">SIRET</span>
                      <p className="mt-1 text-gray-900 dark:text-white font-mono">
                        {entreprise.siret}
                      </p>
                    </div>
                  )}

                  {entreprise.tvaIntracom && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">TVA Intracommunautaire</span>
                      <p className="mt-1 text-gray-900 dark:text-white font-mono">
                        {entreprise.tvaIntracom}
                      </p>
                    </div>
                  )}

                  {(entreprise.adresse || entreprise.ville) && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <MapPin size={14} />
                        Adresse
                      </span>
                      <p className="mt-1 text-gray-900 dark:text-white">
                        {entreprise.adresse && <>{entreprise.adresse}<br /></>}
                        {entreprise.codePostal} {entreprise.ville}
                        {entreprise.pays && entreprise.pays !== "France" && `, ${entreprise.pays}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Interlocuteur */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">
                  Interlocuteur principal
                </h3>

                <div className="space-y-4">
                  {(entreprise.contactNom || entreprise.contactPrenom) && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Nom</span>
                      <p className="mt-1 text-gray-900 dark:text-white font-medium">
                        {entreprise.contactCivilite} {entreprise.contactPrenom} {entreprise.contactNom}
                      </p>
                    </div>
                  )}

                  {entreprise.contactFonction && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Fonction</span>
                      <p className="mt-1 text-gray-900 dark:text-white">
                        {entreprise.contactFonction}
                      </p>
                    </div>
                  )}

                  {entreprise.contactEmail && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Mail size={14} />
                        Email
                      </span>
                      <a
                        href={`mailto:${entreprise.contactEmail}`}
                        className="mt-1 text-brand-500 hover:text-brand-600 block"
                      >
                        {entreprise.contactEmail}
                      </a>
                    </div>
                  )}

                  {entreprise.contactTelephone && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Phone size={14} />
                        Téléphone
                      </span>
                      <a
                        href={`tel:${entreprise.contactTelephone}`}
                        className="mt-1 text-brand-500 hover:text-brand-600 block"
                      >
                        {entreprise.contactTelephone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Notes internes */}
                {entreprise.notes && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2 flex items-center gap-2">
                      <StickyNote size={18} />
                      Notes internes
                    </h3>
                    <p className="mt-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {entreprise.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Onglet Apprenants */}
          {activeTab === "apprenants" && (
            <div>
              {entreprise.apprenants.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun apprenant rattaché à cette entreprise
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {entreprise.apprenants.map((apprenant) => (
                    <Link
                      key={apprenant.id}
                      href={`/apprenants/${apprenant.id}`}
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                          <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                            {apprenant.prenom?.[0]}{apprenant.nom?.[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                            {apprenant.prenom} {apprenant.nom}
                          </p>
                          {apprenant.email && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {apprenant.email}
                            </p>
                          )}
                        </div>
                        <ChevronRight size={16} className="text-gray-400 group-hover:text-brand-500 transition-colors" />
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <span className={`px-2 py-1 rounded-full ${statutColors[apprenant.statut] || "bg-gray-100 text-gray-700"}`}>
                          {statutLabels[apprenant.statut] || apprenant.statut}
                        </span>
                        {apprenant.preInscriptions.length > 0 && (
                          <span className="text-gray-500">
                            {apprenant.preInscriptions.length} pré-inscription(s)
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Onglet Pré-inscriptions */}
          {activeTab === "preinscriptions" && (
            <div>
              {allPreInscriptions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucune pré-inscription pour cette entreprise
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allPreInscriptions.map((preinscription) => (
                    <div
                      key={preinscription.id}
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${preInscriptionStatutConfig[preinscription.statut]?.color || "bg-gray-100 text-gray-700"}`}>
                              {preInscriptionStatutConfig[preinscription.statut]?.label || preinscription.statut}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {preinscription.formation.titre}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Pour: {preinscription.apprenant.prenom} {preinscription.apprenant.nom}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Demandée le {formatDate(preinscription.createdAt)}
                          </p>
                        </div>
                        <Link
                          href={`/pre-inscriptions?view=${preinscription.id}`}
                          className="text-brand-500 hover:text-brand-600 text-sm font-medium flex items-center gap-1"
                        >
                          Voir
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Onglet Sessions */}
          {activeTab === "sessions" && (
            <div>
              {allSessions.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucune session de formation pour cette entreprise
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allSessions.map((participation) => {
                    const session = participation.client.session;
                    const dates = session.journees.map(j => new Date(j.date));
                    const startDate = dates.length > 0 ? Math.min(...dates.map(d => d.getTime())) : null;
                    const endDate = dates.length > 0 ? Math.max(...dates.map(d => d.getTime())) : null;

                    return (
                      <div
                        key={participation.id}
                        className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${sessionStatusConfig[session.status]?.color || "bg-gray-100 text-gray-700"}`}>
                                {sessionStatusConfig[session.status]?.label || session.status}
                              </span>
                              <span className="text-xs text-gray-400 font-mono">
                                {session.reference}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {session.formation.titre}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Participant: {participation.apprenant.prenom} {participation.apprenant.nom}
                            </p>
                            {startDate && endDate && (
                              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <Calendar size={12} />
                                Du {formatDate(new Date(startDate).toISOString())} au {formatDate(new Date(endDate).toISOString())}
                              </p>
                            )}
                          </div>
                          <Link
                            href={`/sessions/${session.id}`}
                            className="text-brand-500 hover:text-brand-600 text-sm font-medium flex items-center gap-1"
                          >
                            Voir
                            <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer avec dates */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500">
        Créé le {formatDate(entreprise.createdAt)}
        {entreprise.updatedAt !== entreprise.createdAt && (
          <> • Dernière modification le {formatDate(entreprise.updatedAt)}</>
        )}
      </div>
    </div>
  );
}
