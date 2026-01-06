"use client";

// ===========================================
// PAGE DÉTAIL APPRENANT
// ===========================================
// Affiche toutes les informations d'un apprenant:
// - Informations personnelles
// - Pré-inscriptions liées
// - Sessions de formation
// - Documents

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Calendar,
  BookOpen,
  GraduationCap,
  Edit,
  Send,
  Loader2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  MessageSquarePlus,
  StickyNote,
  FolderOpen,
  Upload,
  File,
  Trash2,
  Download,
  Eye,
} from "lucide-react";

// Types
interface Entreprise {
  id: string;
  raisonSociale: string;
  siret: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  contactEmail: string | null;
  contactTelephone: string | null;
}

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
  telephone: string | null;
  statut: string;
  createdAt: string;
  traiteeAt: string | null;
  formation: Formation;
  // Infos Qualiopi
  objectifsProfessionnels: string | null;
  contexte: string | null;
  experiencePrealable: string | null;
  attentesSpecifiques: string | null;
  contraintes: string | null;
  situationHandicap: boolean;
  besoinsAmenagements: string | null;
  modeFinancement: string | null;
  financeurNom: string | null;
  situationProfessionnelle: string | null;
  entreprise: string | null;
  poste: string | null;
}

interface SessionJournee {
  date: string;
}

interface Session {
  id: string;
  reference: string;
  nom: string | null;
  status: string;
  formation: Formation;
  journees: SessionJournee[];
}

interface SessionClient {
  session: Session;
}

interface SessionParticipation {
  id: string;
  createdAt: string;
  client: SessionClient;
}

interface LMSInscription {
  id: string;
  createdAt: string;
  progression: number;
  formation: Formation;
}

interface ApprenantDocument {
  id: string;
  nom: string;
  type: string;
  taille: number;
  url: string;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

// Qualiopi IND 5 - Type pour les notes avec historique
interface ApprenantNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

interface Apprenant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  pays: string;
  statut: "SALARIE" | "INDEPENDANT" | "PARTICULIER";
  raisonSociale: string | null;
  siret: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  entreprise: Entreprise | null;
  preInscriptions: PreInscription[];
  sessionParticipationsNew: SessionParticipation[];
  lmsInscriptions: LMSInscription[];
}

interface Stats {
  totalPreInscriptions: number;
  preInscriptionsAcceptees: number;
  totalSessions: number;
  sessionsEnCours: number;
  sessionsTerminees: number;
  totalFormationsLMS: number;
  totalDocuments: number;
}

// Configuration
const statutLabels = {
  SALARIE: "Salarié",
  INDEPENDANT: "Indépendant",
  PARTICULIER: "Particulier",
};

const statutColors = {
  SALARIE: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  INDEPENDANT: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  PARTICULIER: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
};

const preInscriptionStatutConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  NOUVELLE: { label: "Nouvelle", color: "bg-blue-100 text-blue-700", icon: <AlertCircle size={14} /> },
  EN_TRAITEMENT: { label: "En traitement", color: "bg-yellow-100 text-yellow-700", icon: <Clock size={14} /> },
  ACCEPTEE: { label: "Acceptée", color: "bg-green-100 text-green-700", icon: <CheckCircle2 size={14} /> },
  REFUSEE: { label: "Refusée", color: "bg-red-100 text-red-700", icon: <XCircle size={14} /> },
  ANNULEE: { label: "Annulée", color: "bg-gray-100 text-gray-700", icon: <XCircle size={14} /> },
};

const sessionStatutConfig: Record<string, { label: string; color: string }> = {
  BROUILLON: { label: "Brouillon", color: "bg-gray-100 text-gray-700" },
  PLANIFIEE: { label: "Planifiée", color: "bg-blue-100 text-blue-700" },
  EN_COURS: { label: "En cours", color: "bg-green-100 text-green-700" },
  TERMINEE: { label: "Terminée", color: "bg-purple-100 text-purple-700" },
  ANNULEE: { label: "Annulée", color: "bg-red-100 text-red-700" },
};

const financementLabels: Record<string, string> = {
  PERSONNEL: "Personnel",
  ENTREPRISE: "Entreprise",
  OPCO: "OPCO",
  CPF: "CPF",
  POLE_EMPLOI: "Pôle Emploi / France Travail",
  AUTRE: "Autre",
};

// Helpers
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDateShort = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function ApprenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const apprenantId = params.id as string;

  const [apprenant, setApprenant] = useState<Apprenant | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "preinscriptions" | "sessions" | "documents">("info");
  const [selectedPreInscription, setSelectedPreInscription] = useState<PreInscription | null>(null);

  // Qualiopi IND 5 - États pour les notes avec historique
  const [notes, setNotes] = useState<ApprenantNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  // États pour les documents
  const [documents, setDocuments] = useState<ApprenantDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadApprenant = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("[PAGE] Loading apprenant:", apprenantId);
      const res = await fetch(`/api/apprenants/${apprenantId}`);
      console.log("[PAGE] API response status:", res.status);

      if (res.ok) {
        const data = await res.json();
        console.log("[PAGE] Apprenant loaded:", data.apprenant?.nom);
        setApprenant(data.apprenant);
        setStats(data.stats);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("[PAGE] API error:", res.status, errorData);
        // Si 404, on reste sur la page avec le message "non trouvé"
        // Si autre erreur, on affiche aussi le message "non trouvé"
      }
    } catch (error) {
      console.error("[PAGE] Erreur chargement apprenant:", error);
    } finally {
      setIsLoading(false);
    }
  }, [apprenantId]);

  useEffect(() => {
    loadApprenant();
  }, [loadApprenant]);

  // Qualiopi IND 5 - Charger l'historique des notes
  const loadNotes = useCallback(async () => {
    if (!apprenantId) return;
    setNotesLoading(true);
    try {
      const res = await fetch(`/api/donnees/apprenants/${apprenantId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error("Erreur chargement notes:", error);
    } finally {
      setNotesLoading(false);
    }
  }, [apprenantId]);

  // Charger les notes au montage
  useEffect(() => {
    if (apprenantId) {
      loadNotes();
    }
  }, [apprenantId, loadNotes]);

  // Qualiopi IND 5 - Ajouter une nouvelle note
  const handleAddNote = async () => {
    if (!newNote.trim() || addingNote) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/donnees/apprenants/${apprenantId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes((prev) => [data.note, ...prev]);
        setNewNote("");
        setShowNoteForm(false);
      }
    } catch (error) {
      console.error("Erreur ajout note:", error);
    } finally {
      setAddingNote(false);
    }
  };

  // Supprimer une note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette note ?")) return;

    setDeletingNoteId(noteId);
    try {
      const res = await fetch(`/api/donnees/apprenants/${apprenantId}/notes/${noteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      }
    } catch (error) {
      console.error("Erreur suppression note:", error);
    } finally {
      setDeletingNoteId(null);
    }
  };

  // Charger les documents de l'apprenant
  const loadDocuments = useCallback(async () => {
    if (!apprenantId) return;
    setDocumentsLoading(true);
    try {
      const res = await fetch(`/api/donnees/apprenants/${apprenantId}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Erreur chargement documents:", error);
    } finally {
      setDocumentsLoading(false);
    }
  }, [apprenantId]);

  // Charger les documents quand l'onglet Documents est actif
  useEffect(() => {
    if (activeTab === "documents" && apprenantId) {
      loadDocuments();
    }
  }, [activeTab, apprenantId, loadDocuments]);

  // Upload d'un document
  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || uploadingDocument) return;

    setUploadingDocument(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/donnees/apprenants/${apprenantId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setDocuments((prev) => [data.document, ...prev]);
      }
    } catch (error) {
      console.error("Erreur upload document:", error);
    } finally {
      setUploadingDocument(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Supprimer un document
  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;

    try {
      const res = await fetch(`/api/donnees/apprenants/${apprenantId}/documents/${documentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      }
    } catch (error) {
      console.error("Erreur suppression document:", error);
    }
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Auto-sélectionner la première pré-inscription
  useEffect(() => {
    if (apprenant && apprenant.preInscriptions.length > 0 && !selectedPreInscription) {
      setSelectedPreInscription(apprenant.preInscriptions[0]);
    }
  }, [apprenant, selectedPreInscription]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!apprenant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <User className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg mb-4">Apprenant non trouvé</p>
        <Link
          href="/automate/donnees/apprenants"
          className="text-brand-500 hover:text-brand-600"
        >
          Retour à la liste des apprenants
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <Link
          href="/automate/donnees/apprenants"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          <span>Retour aux apprenants</span>
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 text-2xl font-bold">
              {apprenant.prenom.charAt(0)}{apprenant.nom.charAt(0)}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {apprenant.prenom} {apprenant.nom}
                </h1>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statutColors[apprenant.statut]}`}>
                  {statutLabels[apprenant.statut]}
                </span>
                {!apprenant.isActive && (
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                    Inactif
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Mail size={14} />
                  {apprenant.email}
                </span>
                {apprenant.telephone && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={14} />
                    {apprenant.telephone}
                  </span>
                )}
              </div>

              {apprenant.entreprise && (
                <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-600 dark:text-gray-300">
                  <Building2 size={14} className="text-gray-400" />
                  {apprenant.entreprise.raisonSociale}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/automate/donnees/apprenants?edit=${apprenant.id}`)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <Edit size={16} />
              Modifier
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors">
              <Send size={16} />
              Envoyer un email
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                <FileText size={16} />
                Pré-inscriptions
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalPreInscriptions}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.preInscriptionsAcceptees} acceptée(s)
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                <Calendar size={16} />
                Sessions
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalSessions}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.sessionsEnCours} en cours
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                <BookOpen size={16} />
                Formations LMS
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalFormationsLMS}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                <FolderOpen size={16} />
                Documents
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalDocuments}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Content */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          {[
            { id: "info", label: "Informations", icon: <User size={16} /> },
            { id: "preinscriptions", label: "Pré-inscriptions", icon: <FileText size={16} />, count: stats?.totalPreInscriptions },
            { id: "sessions", label: "Sessions", icon: <Calendar size={16} />, count: stats?.totalSessions },
            { id: "documents", label: "Documents", icon: <FolderOpen size={16} />, count: stats?.totalDocuments },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeApprenantTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "info" && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6"
            >
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Informations personnelles */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">
                    Informations personnelles
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Prénom</span>
                        <p className="text-gray-900 dark:text-white font-medium mt-1">{apprenant.prenom}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Nom</span>
                        <p className="text-gray-900 dark:text-white font-medium mt-1">{apprenant.nom}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
                      <p className="text-gray-900 dark:text-white font-medium mt-1 flex items-center gap-2">
                        <Mail size={14} className="text-gray-400" />
                        <a href={`mailto:${apprenant.email}`} className="text-brand-600 hover:text-brand-700">
                          {apprenant.email}
                        </a>
                      </p>
                    </div>

                    {apprenant.telephone && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Téléphone</span>
                        <p className="text-gray-900 dark:text-white font-medium mt-1 flex items-center gap-2">
                          <Phone size={14} className="text-gray-400" />
                          <a href={`tel:${apprenant.telephone}`} className="text-brand-600 hover:text-brand-700">
                            {apprenant.telephone}
                          </a>
                        </p>
                      </div>
                    )}

                    {(apprenant.adresse || apprenant.ville) && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Adresse</span>
                        <p className="text-gray-900 dark:text-white mt-1 flex items-start gap-2">
                          <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <span>
                            {apprenant.adresse && <>{apprenant.adresse}<br /></>}
                            {apprenant.codePostal} {apprenant.ville}
                            {apprenant.pays && apprenant.pays !== "France" && <><br />{apprenant.pays}</>}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statut et entreprise */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">
                    Situation professionnelle
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Statut</span>
                      <p className="mt-2">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg ${statutColors[apprenant.statut]}`}>
                          {apprenant.statut === "SALARIE" && <Briefcase size={14} />}
                          {apprenant.statut === "INDEPENDANT" && <User size={14} />}
                          {apprenant.statut === "PARTICULIER" && <User size={14} />}
                          {statutLabels[apprenant.statut]}
                        </span>
                      </p>
                    </div>

                    {apprenant.statut === "SALARIE" && apprenant.entreprise && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Building2 size={18} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {apprenant.entreprise.raisonSociale}
                            </p>
                            {apprenant.entreprise.siret && (
                              <p className="text-sm text-gray-500">
                                SIRET: {apprenant.entreprise.siret}
                              </p>
                            )}
                          </div>
                        </div>
                        {(apprenant.entreprise.adresse || apprenant.entreprise.ville) && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {apprenant.entreprise.adresse}
                            {apprenant.entreprise.adresse && <br />}
                            {apprenant.entreprise.codePostal} {apprenant.entreprise.ville}
                          </p>
                        )}
                      </div>
                    )}

                    {apprenant.statut === "INDEPENDANT" && (
                      <div className="space-y-3">
                        {apprenant.raisonSociale && (
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Raison sociale</span>
                            <p className="text-gray-900 dark:text-white font-medium mt-1">{apprenant.raisonSociale}</p>
                          </div>
                        )}
                        {apprenant.siret && (
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">SIRET</span>
                            <p className="text-gray-900 dark:text-white font-medium mt-1">{apprenant.siret}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Qualiopi IND 5 - Section Notes Internes avec Historique */}
                  <div>
                    <div className="flex items-center justify-between border-b dark:border-gray-700 pb-2 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <StickyNote className="w-5 h-5 text-amber-500" />
                        Notes internes
                        {notes.length > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
                            {notes.length}
                          </span>
                        )}
                      </h3>
                      <button
                        onClick={() => setShowNoteForm(!showNoteForm)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                      >
                        <MessageSquarePlus className="w-4 h-4" />
                        Ajouter
                      </button>
                    </div>

                    {/* Formulaire d'ajout de note */}
                    <AnimatePresence>
                      {showNoteForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-4 overflow-hidden"
                        >
                          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4">
                            <textarea
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              placeholder="Saisissez votre note interne..."
                              rows={3}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                            />
                            <div className="flex justify-end gap-2 mt-3">
                              <button
                                onClick={() => {
                                  setShowNoteForm(false);
                                  setNewNote("");
                                }}
                                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              >
                                Annuler
                              </button>
                              <button
                                onClick={handleAddNote}
                                disabled={!newNote.trim() || addingNote}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 rounded-lg transition-colors"
                              >
                                {addingNote ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                                Enregistrer
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Liste des notes */}
                    {notesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                      </div>
                    ) : notes.length > 0 ? (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {notes.map((note) => (
                          <div
                            key={note.id}
                            className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800/30 group relative"
                          >
                            {/* Bouton supprimer */}
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              disabled={deletingNoteId === note.id}
                              className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="Supprimer cette note"
                            >
                              {deletingNoteId === note.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap pr-8">
                              {note.content}
                            </p>
                            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-yellow-200 dark:border-yellow-800/30 text-xs text-gray-500 dark:text-gray-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {new Date(note.createdAt).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {note.createdBy && (
                                <>
                                  <span className="text-gray-300 dark:text-gray-600">•</span>
                                  <span>
                                    par {note.createdBy.firstName || note.createdBy.email.split("@")[0]}{" "}
                                    {note.createdBy.lastName || ""}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                        <StickyNote className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucune note pour cet apprenant</p>
                        <p className="text-xs mt-1">Cliquez sur &quot;Ajouter&quot; pour créer une note</p>
                      </div>
                    )}

                    {/* Note héritée (ancien champ) si elle existe */}
                    {apprenant.notes && notes.length === 0 && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Note héritée (ancienne version)</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {apprenant.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-500 dark:text-gray-400 pt-4 border-t dark:border-gray-700">
                    <p>Créé le {formatDate(apprenant.createdAt)}</p>
                    <p>Dernière modification le {formatDate(apprenant.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "preinscriptions" && (
            <motion.div
              key="preinscriptions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6"
            >
              {apprenant.preInscriptions.length > 0 ? (
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Liste des pré-inscriptions */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                      {apprenant.preInscriptions.length} pré-inscription(s)
                    </h3>
                    {apprenant.preInscriptions.map((preInscription) => {
                      const config = preInscriptionStatutConfig[preInscription.statut] || preInscriptionStatutConfig.NOUVELLE;
                      return (
                        <button
                          key={preInscription.id}
                          onClick={() => setSelectedPreInscription(preInscription)}
                          className={`w-full text-left p-4 rounded-xl border transition-all ${
                            selectedPreInscription?.id === preInscription.id
                              ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {preInscription.formation.titre}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Demandée le {formatDateShort(preInscription.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
                                {config.icon}
                                {config.label}
                              </span>
                              <ChevronRight size={16} className="text-gray-400" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Détail de la pré-inscription sélectionnée */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                    {selectedPreInscription ? (
                      <div className="space-y-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {selectedPreInscription.formation.titre}
                            </h3>
                            {selectedPreInscription.formation.tarifAffiche && (
                              <p className="text-brand-600 font-medium mt-1">
                                {selectedPreInscription.formation.tarifAffiche.toLocaleString("fr-FR")} € HT
                              </p>
                            )}
                          </div>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${preInscriptionStatutConfig[selectedPreInscription.statut]?.color}`}>
                            {preInscriptionStatutConfig[selectedPreInscription.statut]?.label}
                          </span>
                        </div>

                        {/* Analyse du besoin (Qualiopi) */}
                        {(selectedPreInscription.objectifsProfessionnels ||
                          selectedPreInscription.contexte ||
                          selectedPreInscription.experiencePrealable) && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <GraduationCap size={16} />
                              Analyse du besoin (Qualiopi)
                            </h4>
                            <div className="space-y-3 text-sm">
                              {selectedPreInscription.objectifsProfessionnels && (
                                <div>
                                  <span className="text-gray-500">Objectifs professionnels:</span>
                                  <p className="text-gray-900 dark:text-white mt-1">{selectedPreInscription.objectifsProfessionnels}</p>
                                </div>
                              )}
                              {selectedPreInscription.contexte && (
                                <div>
                                  <span className="text-gray-500">Contexte:</span>
                                  <p className="text-gray-900 dark:text-white mt-1">{selectedPreInscription.contexte}</p>
                                </div>
                              )}
                              {selectedPreInscription.experiencePrealable && (
                                <div>
                                  <span className="text-gray-500">Expérience préalable:</span>
                                  <p className="text-gray-900 dark:text-white mt-1">{selectedPreInscription.experiencePrealable}</p>
                                </div>
                              )}
                              {selectedPreInscription.attentesSpecifiques && (
                                <div>
                                  <span className="text-gray-500">Attentes spécifiques:</span>
                                  <p className="text-gray-900 dark:text-white mt-1">{selectedPreInscription.attentesSpecifiques}</p>
                                </div>
                              )}
                              {selectedPreInscription.contraintes && (
                                <div>
                                  <span className="text-gray-500">Contraintes:</span>
                                  <p className="text-gray-900 dark:text-white mt-1">{selectedPreInscription.contraintes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Situation de handicap */}
                        {selectedPreInscription.situationHandicap && (
                          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800/30">
                            <h4 className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-1">
                              Situation de handicap déclarée
                            </h4>
                            {selectedPreInscription.besoinsAmenagements && (
                              <p className="text-sm text-orange-600 dark:text-orange-300">
                                Aménagements: {selectedPreInscription.besoinsAmenagements}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Financement */}
                        {selectedPreInscription.modeFinancement && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Financement</h4>
                            <p className="text-gray-900 dark:text-white">
                              {financementLabels[selectedPreInscription.modeFinancement] || selectedPreInscription.modeFinancement}
                              {selectedPreInscription.financeurNom && ` - ${selectedPreInscription.financeurNom}`}
                            </p>
                          </div>
                        )}

                        {/* Situation pro au moment de la demande */}
                        {selectedPreInscription.situationProfessionnelle && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Situation lors de la demande</h4>
                            <p className="text-gray-900 dark:text-white">
                              {selectedPreInscription.situationProfessionnelle}
                              {selectedPreInscription.entreprise && ` chez ${selectedPreInscription.entreprise}`}
                              {selectedPreInscription.poste && ` (${selectedPreInscription.poste})`}
                            </p>
                          </div>
                        )}

                        <div className="text-xs text-gray-500 pt-4 border-t dark:border-gray-700">
                          <p>Demande reçue le {formatDate(selectedPreInscription.createdAt)}</p>
                          {selectedPreInscription.traiteeAt && (
                            <p>Traitée le {formatDate(selectedPreInscription.traiteeAt)}</p>
                          )}
                        </div>

                        <Link
                          href={`/automate/pre-inscriptions?view=${selectedPreInscription.id}`}
                          className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
                        >
                          Voir la pré-inscription complète
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Sélectionnez une pré-inscription pour voir les détails</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">Aucune pré-inscription</p>
                  <p className="text-sm">Cet apprenant n'a pas encore fait de demande de pré-inscription.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "sessions" && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6"
            >
              {apprenant.sessionParticipationsNew.length > 0 ? (
                <div className="space-y-4">
                  {apprenant.sessionParticipationsNew.map((participation) => {
                    const session = participation.client.session;
                    const config = sessionStatutConfig[session.status] || sessionStatutConfig.BROUILLON;
                    // Calculer les dates depuis les journées
                    const dateDebut = session.journees.length > 0 ? session.journees[0].date : null;
                    const dateFin = session.journees.length > 1 ? session.journees[session.journees.length - 1].date : dateDebut;
                    return (
                      <Link
                        key={participation.id}
                        href={`/automate/sessions/${session.id}`}
                        className="block p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {session.nom || session.reference}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {session.formation.titre}
                            </p>
                            {dateDebut && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1.5">
                                <Calendar size={14} />
                                {formatDateShort(dateDebut)}
                                {dateFin && dateFin !== dateDebut && ` - ${formatDateShort(dateFin)}`}
                              </p>
                            )}
                          </div>
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">Aucune session</p>
                  <p className="text-sm">Cet apprenant n'est inscrit à aucune session de formation.</p>
                </div>
              )}

              {/* LMS Inscriptions */}
              {apprenant.lmsInscriptions.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                    <BookOpen size={16} />
                    Formations en ligne (LMS)
                  </h3>
                  <div className="space-y-3">
                    {apprenant.lmsInscriptions.map((inscription) => (
                      <div
                        key={inscription.id}
                        className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {inscription.formation.titre}
                          </p>
                          <span className="text-sm text-brand-600 font-medium">
                            {inscription.progression}% complété
                          </span>
                        </div>
                        <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-brand-500 h-full rounded-full transition-all"
                            style={{ width: `${inscription.progression}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "documents" && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6"
            >
              {/* Zone d'upload */}
              <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleDocumentUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingDocument}
                  className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-brand-400 dark:hover:border-brand-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                >
                  {uploadingDocument ? (
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Envoi en cours...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400 group-hover:text-brand-500 transition-colors" />
                      <p className="text-gray-600 dark:text-gray-300 font-medium">
                        Cliquez pour importer un document
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        PDF, Word, Excel, Images (max 10 MB)
                      </p>
                    </>
                  )}
                </button>
              </div>

              {/* Liste des documents */}
              {documentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                </div>
              ) : documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                        <File className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {doc.nom}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>{formatFileSize(doc.taille)}</span>
                          <span>•</span>
                          <span>{formatDateShort(doc.createdAt)}</span>
                          {doc.createdBy && (
                            <>
                              <span>•</span>
                              <span>par {doc.createdBy.firstName || doc.createdBy.email.split("@")[0]}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-500 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Voir"
                        >
                          <Eye size={18} />
                        </a>
                        <a
                          href={doc.url}
                          download={doc.nom}
                          className="p-2 text-gray-500 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Télécharger"
                        >
                          <Download size={18} />
                        </a>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">Aucun document</p>
                  <p className="text-sm">Importez des documents liés à cet apprenant (pièces justificatives, attestations, etc.)</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
