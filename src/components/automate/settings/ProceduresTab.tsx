"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Check,
  Clock,
  Edit,
  Eye,
  Download,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Plus,
  Save,
  X,
  History,
  Loader2,
  Users,
  MessageCircle,
  ClipboardList,
  Handshake,
  Newspaper,
  Accessibility,
  BookOpen,
  GraduationCap,
  FileQuestion,
  Shield,
} from "lucide-react";

// Type de procédure
type ProcedureType =
  | "ACCUEIL"
  | "RECLAMATIONS"
  | "EVALUATION"
  | "SOUS_TRAITANCE"
  | "VEILLE"
  | "ACCESSIBILITE"
  | "SUIVI_STAGIAIRES"
  | "GESTION_COMPETENCES"
  | "PERSONNALISEE";

interface ProcedureInfo {
  type: ProcedureType;
  nom: string;
  description: string;
  documentType: string;
  indicateur: string;
  procedure: {
    id: string;
    nom: string;
    content: unknown;
    version: number;
    isPublished: boolean;
    publishedAt: string | null;
    updatedAt: string;
  } | null;
  hasContent: boolean;
  isPublished: boolean;
  version: number;
  versionsCount: number;
  updatedAt: string | null;
}

interface ProceduresData {
  procedures: ProcedureInfo[];
  stats: {
    total: number;
    completed: number;
    published: number;
  };
}

// Icônes par type de procédure
const PROCEDURE_ICONS: Record<ProcedureType, React.ReactNode> = {
  ACCUEIL: <Users size={20} />,
  RECLAMATIONS: <MessageCircle size={20} />,
  EVALUATION: <ClipboardList size={20} />,
  SOUS_TRAITANCE: <Handshake size={20} />,
  VEILLE: <Newspaper size={20} />,
  ACCESSIBILITE: <Accessibility size={20} />,
  SUIVI_STAGIAIRES: <BookOpen size={20} />,
  GESTION_COMPETENCES: <GraduationCap size={20} />,
  PERSONNALISEE: <FileQuestion size={20} />,
};

// Couleurs par type de procédure
const PROCEDURE_COLORS: Record<ProcedureType, string> = {
  ACCUEIL: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  RECLAMATIONS: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  EVALUATION: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  SOUS_TRAITANCE: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  VEILLE: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  ACCESSIBILITE: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  SUIVI_STAGIAIRES: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  GESTION_COMPETENCES: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
  PERSONNALISEE: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
};

export default function ProceduresTab() {
  const [data, setData] = useState<ProceduresData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProcedure, setSelectedProcedure] = useState<ProcedureInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchProcedures = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings/procedures");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Erreur fetch procédures:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProcedures();
  }, [fetchProcedures]);

  const handleSelectProcedure = (proc: ProcedureInfo) => {
    setSelectedProcedure(proc);
    setIsEditing(false);
    if (proc.procedure?.content) {
      // Extraire le texte du contenu TipTap JSON
      try {
        const content = proc.procedure.content as { content?: Array<{ content?: Array<{ text?: string }> }> };
        const text = content.content
          ?.map((block) =>
            block.content?.map((node) => node.text || "").join("") || ""
          )
          .join("\n\n") || "";
        setEditContent(text);
      } catch {
        setEditContent("");
      }
    } else {
      setEditContent("");
    }
  };

  const handleStartEdit = () => {
    if (!selectedProcedure) return;
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (selectedProcedure?.procedure?.content) {
      try {
        const content = selectedProcedure.procedure.content as { content?: Array<{ content?: Array<{ text?: string }> }> };
        const text = content.content
          ?.map((block) =>
            block.content?.map((node) => node.text || "").join("") || ""
          )
          .join("\n\n") || "";
        setEditContent(text);
      } catch {
        setEditContent("");
      }
    }
  };

  const handleSave = async () => {
    if (!selectedProcedure) return;

    setSaving(true);
    try {
      // Convertir le texte en format TipTap JSON simple
      const content = {
        type: "doc",
        content: editContent.split("\n\n").filter(Boolean).map((paragraph) => ({
          type: "paragraph",
          content: [{ type: "text", text: paragraph }],
        })),
      };

      const res = await fetch("/api/settings/procedures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedProcedure.type,
          content,
        }),
      });

      if (res.ok) {
        await fetchProcedures();
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedProcedure?.procedure) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/settings/procedures/${selectedProcedure.procedure.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPublished: !selectedProcedure.isPublished,
        }),
      });

      if (res.ok) {
        await fetchProcedures();
        // Mettre à jour la procédure sélectionnée
        const updatedData = await res.json();
        setSelectedProcedure((prev) =>
          prev
            ? {
                ...prev,
                isPublished: updatedData.isPublished,
                procedure: updatedData,
              }
            : null
        );
      }
    } catch (error) {
      console.error("Erreur publication:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleInitFromTemplate = async (proc: ProcedureInfo) => {
    setSaving(true);
    try {
      // Créer un contenu par défaut basé sur le type
      const defaultContents: Record<ProcedureType, string> = {
        ACCUEIL: `PROCÉDURE D'ACCUEIL DES STAGIAIRES

1. OBJET
Cette procédure définit les modalités d'accueil des apprenants au sein de notre organisme de formation.

2. CHAMP D'APPLICATION
Cette procédure s'applique à l'ensemble des formations dispensées par l'organisme.

3. RESPONSABILITÉS
- Le responsable pédagogique supervise l'accueil
- Les formateurs assurent l'accueil opérationnel
- L'assistante administrative gère les aspects logistiques

4. ÉTAPES DE L'ACCUEIL

4.1 Avant la formation
- Envoi de la convocation avec les informations pratiques
- Confirmation de l'inscription et des prérequis
- Envoi du règlement intérieur et des conditions générales

4.2 Le jour de la formation
- Accueil physique ou en visioconférence
- Vérification de l'identité des participants
- Présentation du programme et des objectifs
- Tour de table et recueil des attentes
- Présentation des locaux et des règles de sécurité

4.3 Pendant la formation
- Suivi régulier de la satisfaction
- Adaptation si nécessaire du rythme et du contenu

5. DOCUMENTS ASSOCIÉS
- Convocation
- Règlement intérieur
- Feuille d'émargement
- Questionnaire de satisfaction

6. RÉVISION
Cette procédure est révisée annuellement ou en cas de modification significative des pratiques.`,

        RECLAMATIONS: `PROCÉDURE DE GESTION DES RÉCLAMATIONS

1. OBJET
Cette procédure définit le processus de traitement des réclamations et des insatisfactions exprimées par les parties prenantes.

2. CHAMP D'APPLICATION
Cette procédure concerne les réclamations émanant :
- Des apprenants
- Des entreprises clientes
- Des financeurs
- Des intervenants

3. DÉFINITIONS
- Réclamation : expression formelle d'insatisfaction
- Insatisfaction : expression informelle de mécontentement

4. PROCESSUS DE TRAITEMENT

4.1 Réception de la réclamation
- Par email, courrier, téléphone ou formulaire en ligne
- Enregistrement dans le registre des réclamations
- Accusé de réception sous 48h

4.2 Analyse
- Identification de la cause
- Évaluation de la gravité
- Consultation des parties concernées

4.3 Traitement
- Délai de réponse : 15 jours maximum
- Proposition de solution
- Mise en œuvre des actions correctives

4.4 Suivi
- Vérification de la satisfaction du réclamant
- Analyse des tendances
- Actions préventives si récurrence

5. INDICATEURS
- Nombre de réclamations par période
- Délai moyen de traitement
- Taux de satisfaction post-traitement

6. DOCUMENTS ASSOCIÉS
- Registre des réclamations
- Formulaire de réclamation
- Modèle de réponse`,

        EVALUATION: `PROCÉDURE D'ÉVALUATION

1. OBJET
Cette procédure définit les modalités d'évaluation des acquis des apprenants et de la qualité des formations.

2. TYPES D'ÉVALUATIONS

2.1 Évaluation des acquis
- Positionnement initial
- Évaluations formatives (pendant la formation)
- Évaluation sommative (fin de formation)

2.2 Évaluation de la satisfaction
- Évaluation à chaud (fin de formation)
- Évaluation à froid (3 à 6 mois après)

3. MODALITÉS

3.1 Évaluation des acquis
- QCM / Quiz
- Études de cas
- Mises en situation pratiques
- Productions individuelles ou collectives

3.2 Critères de réussite
- Seuil de réussite défini par formation
- Critères d'évaluation communiqués en amont

4. TRAÇABILITÉ
- Résultats individuels archivés
- Attestation de fin de formation avec mention des acquis
- Registre des certifications le cas échéant

5. AMÉLIORATION CONTINUE
- Analyse des résultats par formation
- Identification des points d'amélioration
- Révision des contenus si nécessaire

6. DOCUMENTS ASSOCIÉS
- Grilles d'évaluation
- Questionnaires de satisfaction
- Attestations de formation`,

        SOUS_TRAITANCE: `PROCÉDURE DE SOUS-TRAITANCE

1. OBJET
Cette procédure encadre le recours aux sous-traitants et co-traitants dans le cadre des prestations de formation.

2. CHAMP D'APPLICATION
Concerne tous les intervenants externes :
- Formateurs indépendants
- Organismes de formation partenaires
- Prestataires techniques

3. SÉLECTION DES SOUS-TRAITANTS

3.1 Critères de sélection
- Compétences et qualifications
- Expérience dans le domaine
- Références vérifiables
- Conformité aux exigences Qualiopi

3.2 Documents requis
- CV et diplômes
- Attestation d'assurance RC Pro
- Numéro de déclaration d'activité (si OF)
- Engagement de confidentialité

4. CONTRACTUALISATION
- Contrat de sous-traitance obligatoire
- Cahier des charges précis
- Engagements qualité

5. SUIVI ET ÉVALUATION
- Supervision des interventions
- Évaluation par les apprenants
- Bilan de prestation

6. RESPECT DU RÉFÉRENTIEL QUALIOPI
Le sous-traitant s'engage à respecter :
- Les procédures de l'organisme
- Les critères du référentiel national qualité
- Les obligations de traçabilité

7. DOCUMENTS ASSOCIÉS
- Contrat de sous-traitance
- Fiche intervenant
- Grille d'évaluation intervenant`,

        VEILLE: `PROCÉDURE DE VEILLE

1. OBJET
Cette procédure organise la veille légale, réglementaire, métier et pédagogique.

2. DOMAINES DE VEILLE

2.1 Veille légale et réglementaire
- Évolutions législatives (formation professionnelle)
- Textes de France Compétences
- Publications du Ministère du Travail

2.2 Veille métiers et compétences
- Évolutions des métiers
- Nouvelles certifications
- Besoins en compétences des secteurs

2.3 Veille innovation pédagogique
- Nouvelles méthodes
- Outils et technologies
- Tendances EdTech

2.4 Veille handicap et accessibilité
- Réglementation accessibilité
- Bonnes pratiques d'inclusion
- Aides et dispositifs

3. SOURCES
- Sites institutionnels
- Flux RSS et newsletters
- Réseaux professionnels
- Publications spécialisées

4. FRÉQUENCE
- Consultation quotidienne des sources principales
- Synthèse hebdomadaire
- Bilan mensuel

5. EXPLOITATION
- Information de l'équipe pédagogique
- Mise à jour des formations si nécessaire
- Adaptation des procédures

6. TRAÇABILITÉ
- Historique des articles consultés
- Notes et analyses
- Actions mises en œuvre`,

        ACCESSIBILITE: `PROCÉDURE D'ACCESSIBILITÉ HANDICAP

1. OBJET
Cette procédure définit l'accueil et l'accompagnement des personnes en situation de handicap.

2. RÉFÉRENT HANDICAP
- Nom : [À compléter]
- Contact : [À compléter]
- Rôle : Point d'entrée unique pour les questions liées au handicap

3. IDENTIFICATION DES BESOINS

3.1 Entretien préalable
- Questionnaire de préinscription
- Échange confidentiel avec le référent handicap
- Identification des aménagements nécessaires

3.2 Types de handicap pris en compte
- Handicap moteur
- Handicap sensoriel
- Handicap cognitif
- Handicap psychique
- Maladies chroniques invalidantes

4. AMÉNAGEMENTS POSSIBLES

4.1 Aménagements pédagogiques
- Adaptation du rythme
- Supports adaptés
- Temps majoré pour les évaluations

4.2 Aménagements techniques
- Accessibilité des locaux
- Matériel adapté
- Logiciels spécifiques

4.3 Aménagements organisationnels
- Horaires adaptés
- Pauses supplémentaires
- Accompagnement renforcé

5. PARTENAIRES
- AGEFIPH / FIPHFP
- Cap Emploi
- MDPH
- Associations spécialisées

6. SUIVI
- Point régulier avec l'apprenant
- Évaluation des aménagements
- Ajustements si nécessaire`,

        SUIVI_STAGIAIRES: `PROCÉDURE DE SUIVI DES STAGIAIRES

1. OBJET
Cette procédure organise le suivi et l'accompagnement des apprenants pendant leur parcours de formation.

2. TYPES DE SUIVI

2.1 Suivi pédagogique
- Progression dans le programme
- Acquisition des compétences
- Difficultés rencontrées

2.2 Suivi administratif
- Présence et émargement
- Documents contractuels
- Attestations

2.3 Suivi personnalisé
- Accompagnement individuel si besoin
- Orientation vers des ressources complémentaires

3. MODALITÉS DE SUIVI

3.1 Pendant la formation
- Points réguliers en fin de journée/module
- Disponibilité du formateur
- Accompagnement entre les sessions

3.2 Outils de suivi
- Feuilles d'émargement
- Fiches de suivi individuel
- Plateforme LMS (si e-learning)

4. INDICATEURS
- Taux de présence
- Progression des acquis
- Satisfaction continue

5. ACTIONS CORRECTIVES
- Identification des difficultés
- Plan d'action personnalisé
- Soutien renforcé si nécessaire

6. DOCUMENTS ASSOCIÉS
- Fiche de suivi individuel
- Questionnaires intermédiaires
- Compte-rendus des entretiens`,

        GESTION_COMPETENCES: `PROCÉDURE DE GESTION DES COMPÉTENCES

1. OBJET
Cette procédure définit le maintien et le développement des compétences des formateurs et de l'équipe pédagogique.

2. ÉVALUATION DES COMPÉTENCES

2.1 Compétences requises
- Expertise métier
- Compétences pédagogiques
- Maîtrise des outils
- Soft skills

2.2 Modalités d'évaluation
- Auto-évaluation annuelle
- Évaluation par les apprenants
- Observation par les pairs
- Entretien professionnel

3. DÉVELOPPEMENT DES COMPÉTENCES

3.1 Plan de formation interne
- Formations techniques
- Formations pédagogiques
- Veille et actualisation

3.2 Autres dispositifs
- Participation à des colloques
- Échanges de pratiques
- Communautés professionnelles

4. DOCUMENTATION
- Fiches intervenants à jour
- CV et diplômes
- Attestations de formation
- Évaluations reçues

5. SUIVI
- Revue annuelle des compétences
- Identification des besoins
- Plan d'action individuel

6. INDICATEURS
- Nombre d'heures de formation/intervenant
- Évolution des évaluations
- Diversification des compétences`,

        PERSONNALISEE: `PROCÉDURE PERSONNALISÉE

[À compléter selon les besoins spécifiques de votre organisme]

1. OBJET
[Décrire l'objectif de cette procédure]

2. CHAMP D'APPLICATION
[Définir le périmètre concerné]

3. RESPONSABILITÉS
[Identifier les acteurs et leurs rôles]

4. PROCESSUS
[Détailler les étapes]

5. DOCUMENTS ASSOCIÉS
[Lister les documents liés]

6. RÉVISION
[Définir les modalités de mise à jour]`,
      };

      const content = {
        type: "doc",
        content: defaultContents[proc.type].split("\n\n").filter(Boolean).map((paragraph) => ({
          type: "paragraph",
          content: [{ type: "text", text: paragraph }],
        })),
      };

      const res = await fetch("/api/settings/procedures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: proc.type,
          nom: proc.nom,
          description: proc.description,
          content,
        }),
      });

      if (res.ok) {
        await fetchProcedures();
        // Sélectionner la procédure nouvellement créée
        const newProc = await res.json();
        const updatedProc = {
          ...proc,
          procedure: newProc,
          hasContent: true,
        };
        handleSelectProcedure(updatedProc);
      }
    } catch (error) {
      console.error("Erreur initialisation:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Procédures de l&apos;organisme
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Qualiopi IND 26 - Documentez vos procédures qualité
          </p>
        </div>
        {data && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <FileText size={16} className="text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {data.stats.completed}/{data.stats.total} procédures
              </span>
            </div>
            {data.stats.published > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {data.stats.published} publiées
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className="flex gap-6">
        {/* Liste des procédures */}
        <div className="w-1/2 space-y-3">
          {data?.procedures
            .filter((p) => p.type !== "PERSONNALISEE")
            .map((proc) => (
              <button
                key={proc.type}
                onClick={() => handleSelectProcedure(proc)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  selectedProcedure?.type === proc.type
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-sm"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${PROCEDURE_COLORS[proc.type]}`}>
                    {PROCEDURE_ICONS[proc.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {proc.nom}
                      </h3>
                      {proc.hasContent && (
                        <span
                          className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                            proc.isPublished
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                        >
                          {proc.isPublished ? (
                            <>
                              <Check size={10} />
                              Publiée
                            </>
                          ) : (
                            <>
                              <Clock size={10} />
                              Brouillon
                            </>
                          )}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                      {proc.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                        {proc.indicateur}
                      </span>
                      {proc.version > 0 && <span>v{proc.version}</span>}
                      {proc.versionsCount > 0 && (
                        <span className="flex items-center gap-1">
                          <History size={10} />
                          {proc.versionsCount} versions
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                </div>
              </button>
            ))}
        </div>

        {/* Détail de la procédure */}
        <div className="w-1/2">
          {selectedProcedure ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${PROCEDURE_COLORS[selectedProcedure.type]}`}>
                      {PROCEDURE_ICONS[selectedProcedure.type]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {selectedProcedure.nom}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {selectedProcedure.indicateur}
                        {selectedProcedure.version > 0 && ` • Version ${selectedProcedure.version}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedProcedure.hasContent && (
                      <>
                        <button
                          onClick={handlePublish}
                          disabled={saving}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            selectedProcedure.isPublished
                              ? "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                              : "bg-green-500 text-white hover:bg-green-600"
                          }`}
                        >
                          <Shield size={14} />
                          {selectedProcedure.isPublished ? "Dépublier" : "Publier"}
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Télécharger PDF"
                        >
                          <Download size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Contenu */}
              <div className="p-4">
                {selectedProcedure.hasContent ? (
                  <>
                    {isEditing ? (
                      <div className="space-y-4">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full h-96 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                          placeholder="Rédigez votre procédure..."
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <X size={16} />
                            Annuler
                          </button>
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
                          >
                            {saving ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Save size={16} />
                            )}
                            Enregistrer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Dernière modification :{" "}
                            {selectedProcedure.updatedAt
                              ? new Date(selectedProcedure.updatedAt).toLocaleDateString("fr-FR")
                              : "N/A"}
                          </span>
                          <button
                            onClick={handleStartEdit}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                          >
                            <Edit size={14} />
                            Modifier
                          </button>
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                          <pre className="whitespace-pre-wrap font-sans text-sm">
                            {editContent || "Contenu vide"}
                          </pre>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Procédure non rédigée
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      Initialisez cette procédure avec un modèle par défaut ou rédigez-la de zéro.
                    </p>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleInitFromTemplate(selectedProcedure)}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
                      >
                        {saving ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <FileText size={16} />
                        )}
                        Initialiser avec modèle
                      </button>
                      <button
                        onClick={() => {
                          setEditContent("");
                          setIsEditing(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Plus size={16} />
                        Rédiger de zéro
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12">
              <div className="text-center">
                <Eye className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Sélectionnez une procédure pour la consulter ou la modifier
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
