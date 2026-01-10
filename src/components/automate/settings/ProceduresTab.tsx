"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAutomate } from "@/context/AutomateContext";
import {
  FileText,
  Check,
  Edit,
  Eye,
  Download,
  ChevronRight,
  AlertCircle,
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
  const { user } = useAutomate();
  const [data, setData] = useState<ProceduresData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProcedure, setSelectedProcedure] = useState<ProcedureInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

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

  const handleInitFromTemplate = async (proc: ProcedureInfo) => {
    setSaving(true);
    try {
      // Créer un contenu par défaut basé sur le type - Contenu rédigé et cohérent
      const defaultContents: Record<ProcedureType, string> = {
        ACCUEIL: `PROCÉDURE D'ACCUEIL DES STAGIAIRES

1. OBJET

Cette procédure a pour objet de décrire les différentes étapes mises en place par l'organisme de formation, de la première mise en contact avec le client jusqu'au démarrage effectif de la formation. Elle détaille la démarche adoptée pour gérer chaque candidature, les différents cas de figure et les adaptations envisagées pour garantir un accueil de qualité.

2. MISE EN CONTACT

Lorsqu'un client souhaite être mis en relation avec l'organisme de formation dans le but d'entrer en formation, celui-ci formalise sa demande via l'un des canaux suivants : une demande sur le formulaire de contact disponible sur le site web, une demande par mail directement, ou un appel téléphonique.

Dès réception de la demande, un mail de bienvenue est adressé au client pour lui souhaiter la bienvenue. Ce mail reprend le nom et prénom du client, le nom de la formation, la fiche produit précisant toutes les modalités de celle-ci, ainsi qu'une fiche de renseignement permettant de connaître le client (données administratives), de détecter les situations de handicap, et d'évaluer l'adéquation entre la formation et les objectifs du client. Le devis de la formation est également joint.

3. INSCRIPTION ET SUIVI

Du début de la mise en contact à la fin de la formation, le client est suivi via une ligne dédiée dans le tableau de suivi d'activité. Ce tableau est complété régulièrement (mails envoyés/reçus/relances, commentaires éventuels, pièces précontractuelles reçues, envoi de la convocation, etc.) pour permettre le suivi de la formation et son bon déroulement.

Pour chaque étape du dossier client, les demandes par mail sont inscrites sous la forme "Relance le XX/XX/XXXX" et un commentaire est précisé dans la colonne correspondante. Au bout de 2 relances sans retour, le dossier est considéré comme abandonné.

4. CONVOCATION À LA FORMATION

Lorsque toutes les pièces contractuelles et les analyses concernant le stagiaire ont été effectuées, la convocation de formation est envoyée au client. Cette convocation reprend le nom et prénom du client, le nom de la formation, la date de la formation, le lieu de formation, les informations relatives à l'accès au site de formation, ainsi que le livret d'accueil de la formation.

5. DOCUMENTS ASSOCIÉS

Cette procédure s'appuie sur les documents suivants : la fiche de renseignement client, le devis, la fiche produit de la formation, les conditions générales de vente, le règlement intérieur, la convention de formation, la convocation, et le livret d'accueil.

6. RÉVISION

Cette procédure est révisée annuellement ou en cas de modification significative des pratiques d'accueil.`,

        RECLAMATIONS: `PROCÉDURE DE GESTION DES RÉCLAMATIONS

1. OBJET

Cette procédure définit les modalités de prise en compte et de traitement par l'organisme de formation des réclamations exprimées par les différentes parties prenantes. Elle vise également à intégrer ces réclamations dans une démarche d'amélioration continue permettant d'optimiser le fonctionnement et l'organisation de l'organisme.

2. REMONTÉE D'INFORMATIONS

Différentes enquêtes de satisfaction sont menées auprès des parties prenantes et permettent de remonter les réclamations. Le stagiaire remplit un questionnaire papier après la formation, le formateur complète un questionnaire en fin de formation, l'entreprise reçoit un questionnaire par mail 3 mois après la formation, et le financeur est sollicité annuellement.

Les résultats sont analysés via le tableau de suivi d'activité et diffusés selon les cas sur internet (pour les stagiaires et entreprises) ou conservés en interne (pour les formateurs et financeurs).

3. ENREGISTREMENT ET TRAITEMENT

Chaque réclamation exprimée est notifiée dans le tableau de suivi d'activité. Les réclamations peuvent être exprimées via différents canaux : mail, téléphone, commentaires sur les réseaux sociaux, courrier, ou échange physique.

La réclamation est prise en compte sous 5 jours maximum et fait l'objet d'une analyse et de la mise en place des actions correctives nécessaires. Une réponse est apportée à l'émetteur de la réclamation dans les 30 jours.

Lorsque l'analyse de la réclamation met en lumière un problème ou un dysfonctionnement récurrent ou susceptible de se reproduire, une ou des actions préventives sont inscrites au plan d'amélioration continue.

4. PLAN D'AMÉLIORATION CONTINUE

Le plan d'amélioration continue recense tout événement survenu ou tout écart constaté ayant perturbé ou susceptible de perturber l'organisation et le bon déroulement des formations, ainsi que toute opportunité d'amélioration issue de suggestion, retour d'expérience ou différentes veilles.

Les actions prévues peuvent faire suite à une réclamation, un dysfonctionnement constaté, un abandon de stagiaire, l'analyse des veilles, la revue des indicateurs, une non-conformité suite à un audit, ou un retour d'expérience du formateur.

Chaque élément inscrit au plan fait l'objet d'une analyse et de la programmation d'actions correctives et/ou préventives, ainsi que d'une planification dans le temps. Ce tableau fait l'objet d'un examen et d'une mise à jour trimestrielle.

5. DOCUMENTS ASSOCIÉS

Tableau de suivi d'activité (onglet Réclamations), questionnaires de satisfaction, plan d'amélioration continue.`,

        EVALUATION: `PROCÉDURE D'ÉVALUATION

1. OBJET

Cette procédure définit les modalités d'évaluation des acquis des apprenants avant, pendant et après la formation. Elle permet de mesurer la progression du stagiaire et d'adapter le contenu pédagogique à son niveau.

2. TEST INITIAL DE FORMATION

À la suite de la réception des documents précontractuels, le stagiaire complète un test initial de formation. Les réponses sont répertoriées et une note sous forme de pourcentage est attribuée automatiquement selon le barème suivant :

Si le résultat est inférieur à 30%, le stagiaire est classé niveau débutant. Si le résultat est compris entre 30% et 60%, le stagiaire est classé niveau intermédiaire. Si le résultat est supérieur ou égal à 60%, le stagiaire est classé niveau avancé.

Cette note permet d'établir le niveau de progression du stagiaire en fin de formation (en comparaison avec le test final) et d'établir les adaptations nécessaires du contenu de la formation.

3. ADAPTATIONS EN FONCTION DU NIVEAU

En fonction du niveau du stagiaire, les aménagements suivants sont prévus :

Contenu adapté : proposer un contenu de formation qui correspond au niveau du stagiaire, en ajustant la complexité des concepts abordés. Pour un stagiaire débutant, il peut être nécessaire de commencer par les bases et d'augmenter progressivement la difficulté.

Rythme d'apprentissage : proposer un rythme d'apprentissage adapté. Certains stagiaires peuvent nécessiter plus de temps pour assimiler les informations, tandis que d'autres peuvent progresser plus rapidement.

Soutien supplémentaire : fournir un soutien supplémentaire au stagiaire qui en a besoin, incluant des séances de tutorat individuelles, des ressources supplémentaires, des exercices pratiques ou des sessions de révision.

Adaptation des supports pédagogiques : adapter les supports pour répondre aux besoins spécifiques du stagiaire en simplifiant les informations complexes, en fournissant des exemples supplémentaires ou des explications détaillées.

4. TEST FINAL ET PROGRESSION

À l'issue de la formation, le stagiaire complète le test final de formation. Ceci permet de calculer sa progression et de clôturer la formation par l'émission d'une attestation de fin de formation, une fois la facture acquittée en intégralité.

5. DOCUMENTS ASSOCIÉS

Test initial de formation, test final de formation, grilles d'évaluation, attestation de fin de formation.`,

        SOUS_TRAITANCE: `PROCÉDURE DE GESTION DES FORMATEURS ET SOUS-TRAITANCE

1. OBJET

Cette procédure encadre la sélection, l'évaluation et le suivi des formateurs internes et externes intervenant pour le compte de l'organisme de formation. Elle garantit le maintien d'un niveau de qualité conforme aux exigences du référentiel Qualiopi.

2. SÉLECTION DES FORMATEURS

Lors du recrutement d'un formateur, les éléments suivants sont vérifiés : CV et diplômes, attestation d'assurance RC Pro, numéro de déclaration d'activité (si organisme de formation), références vérifiables, et conformité aux exigences Qualiopi.

Un contrat de sous-traitance ou de prestation est établi, précisant le cahier des charges, les engagements qualité et les obligations de confidentialité.

3. ÉVALUATION EN SITUATION RÉELLE

La première étape consiste en un test en situation réelle comprenant la vérification des aptitudes du formateur en séance selon une grille d'évaluation, ainsi que la vérification de la satisfaction client vis-à-vis du formateur.

Cette évaluation permet de s'assurer que le formateur maîtrise non seulement son domaine d'expertise, mais également les techniques pédagogiques adaptées au public formé.

4. BILAN ANNUEL

Chaque année, un bilan est réalisé pour chaque formateur comprenant l'analyse du nombre de formations réalisées annuellement, la vérification du maintien en compétences au travers des actions de formation, autoformation et veille listées sur le bilan, et la vérification de la satisfaction client vis-à-vis du formateur sur l'année.

Ce bilan permet d'identifier les besoins en formation continue et de s'assurer que les formateurs restent à jour dans leur domaine d'expertise.

5. RESPECT DU RÉFÉRENTIEL QUALIOPI

Le sous-traitant s'engage à respecter les procédures de l'organisme, les critères du référentiel national qualité et les obligations de traçabilité.

6. DOCUMENTS ASSOCIÉS

Contrat de sous-traitance, fiche intervenant, grille d'évaluation formateur, bilan annuel des compétences.`,

        VEILLE: `PROCÉDURE DE VEILLE

1. OBJET

Cette procédure organise la veille légale, réglementaire, métier et pédagogique de l'organisme de formation. Elle permet de maintenir à jour les connaissances et les formations proposées, et d'anticiper les évolutions du secteur.

2. AXES DE VEILLE

Une veille est effectuée selon les 3 axes suivants :

Veille réglementaire : suivi des évolutions législatives concernant la formation professionnelle, des textes de France Compétences, des publications du Ministère du Travail, et des obligations liées au référentiel Qualiopi.

Veille métier : observation des évolutions des métiers couverts par les formations, des nouvelles certifications, des besoins en compétences des secteurs d'activité, et des tendances du marché de l'emploi.

Veille innovation pédagogique : exploration des nouvelles méthodes d'apprentissage, des outils et technologies numériques, des tendances EdTech, et des bonnes pratiques pédagogiques.

3. SOURCES DE VEILLE

La veille s'appuie sur différentes sources : sites institutionnels (Ministère du Travail, France Compétences, DREETS), flux RSS et newsletters spécialisées, réseaux professionnels et associations, publications et revues spécialisées, webinaires et conférences.

4. EXPLOITATION DE LA VEILLE

L'exploitation de la veille se matérialise par deux éléments complémentaires :

Un premier volet recense les sources utilisées pour la veille (site web, newsletter, réseaux sociaux, etc.).

Un second volet présente pour chaque information collectée l'exploitation qui en est faite : mise à jour des formations, adaptation des procédures, information de l'équipe pédagogique, ou intégration au plan d'amélioration continue.

Un code couleur est utilisé pour distinguer les différents types de veille et faciliter leur recensement.

5. FRÉQUENCE

La consultation des sources principales est effectuée de manière régulière. Une synthèse hebdomadaire est réalisée, et un bilan mensuel permet d'identifier les actions à mener.

6. DOCUMENTS ASSOCIÉS

Tableau de veille, tableau d'exploitation de la veille, plan de formation continue.`,

        ACCESSIBILITE: `PROCÉDURE D'ACCESSIBILITÉ ET GESTION DU HANDICAP

1. OBJET

Cette procédure définit l'accueil et l'accompagnement des personnes en situation de handicap (PSH) dans le cadre des formations dispensées par l'organisme. Elle vise à garantir l'égalité d'accès à la formation pour tous les publics.

2. DÉTECTION DES SITUATIONS DE HANDICAP

Lors de la demande d'inscription, le client complète une fiche de renseignements permettant notamment de détecter les situations de handicap. Si le client répond positivement à la question sur les personnes en situation de handicap, il est invité à remplir en détails tous les items qui permettront d'adapter la formation à sa situation.

3. ANALYSE DE LA FAISABILITÉ

L'analyse se réalise en 3 étapes :

Première étape : analyse de la fiche de renseignements permettant d'avoir un premier niveau de compatibilité avec la formation souhaitée.

Deuxième étape : analyse de la typologie du handicap en fonction des 6 grandes catégories (visuel, auditif, moteur, consécutif à une maladie invalidante, psychique, intellectuel). L'organisme prend contact avec le PSH, son employeur, ses proches, ou un acteur spécialisé dans le handicap pour obtenir un éclairage sur les répercussions du handicap au quotidien.

Troisième étape : analyse finale de la compatibilité avec la formation.

4. DÉCISIONS POSSIBLES

À la suite des analyses, deux cas de figure peuvent se présenter :

Réorientation : en cas d'incompatibilité avérée entre le handicap du candidat et la formation, l'organisme oriente le candidat vers des organismes capables de l'aider à redéfinir ou ajuster son projet de formation ou de reconversion professionnelle.

Mise en œuvre des compensations : en cas de compatibilité, il convient d'identifier avec précision les besoins d'adaptation et les solutions de compensation (présence d'un interprète langue des signes, matériel spécifique adapté, fractionnement de la formation, adaptation des horaires, etc.).

5. PARTENAIRES

Pour mener à bien cette mission, l'organisme s'appuie sur le réseau Ressources Handicap Formation mis en place par l'AGEFIPH, les services d'entités spécialisées (Cap Emploi, MDPH, associations), et le référent Handicap de l'organisme.

6. DOCUMENTS ASSOCIÉS

Fiche de renseignements, grille d'analyse du handicap, listing réseau handicap.`,

        SUIVI_STAGIAIRES: `PROCÉDURE DE SUIVI DES STAGIAIRES

1. OBJET

Cette procédure organise le suivi et l'accompagnement des apprenants pendant leur parcours de formation, ainsi que la gestion des retards, absences et abandons. Elle garantit la qualité de l'accompagnement et le respect des obligations contractuelles.

2. PRÉVENTION DES ABANDONS

L'organisme accorde une attention particulière à l'adaptation de la formation aux objectifs du bénéficiaire dans le but de prévenir les abandons. Pour cela, une analyse des besoins est effectuée via la fiche de renseignements pour identifier la problématique du client.

L'organisme veille également à ce que le profil des participants soit bien en phase avec les prérequis et à ce que le programme, les modalités de déroulement et les objectifs soient diffusés en amont.

Chaque formation débute systématiquement par un questionnement des stagiaires sur leurs connaissances, leurs attentes et leurs besoins par rapport à la thématique, de façon à permettre au formateur d'orienter son propos.

3. GESTION DES ABANDONS EN COURS DE FORMATION

Dans le cas où le stagiaire ne peut plus ou ne veut plus suivre l'action de formation, il se doit d'en notifier son employeur. L'organisme fournira la feuille d'émargement signée par le stagiaire à l'entreprise concernée précisant l'heure de départ.

La délivrance de l'attestation de formation étant conditionnée à la réalisation et la participation active à tous les exercices et travaux pratiques, le stagiaire ayant abandonné ne pourra prétendre à l'obtention de ces justificatifs.

4. GESTION DES RETARDS ET ABSENCES

En cas de retard, le stagiaire a l'obligation de prévenir le formateur. Celui-ci pourra selon le cas accepter le stagiaire en session ou non.

En cas d'absence, le stagiaire doit prévenir le formateur et son entreprise. L'organisme avisera dans tous les cas l'entreprise concernée par mail en fournissant la feuille d'émargement.

Dans tous les cas, la non-participation même partielle entraîne l'application des conditions de report et d'annulation prévues aux CGV et la comptabilisation de l'absence dans le tableau de suivi.

5. OBLIGATIONS DU STAGIAIRE

Lors des sessions de formation, le stagiaire doit se comporter de manière exemplaire : émargement de la feuille de présence, participation active à tous les modules, respect du formateur et des autres stagiaires, et complétion du test final de formation.

6. DOCUMENTS ASSOCIÉS

Feuille d'émargement, fiche de suivi individuel, CGV, règlement intérieur.`,

        GESTION_COMPETENCES: `PROCÉDURE DE GESTION DES COMPÉTENCES ET FORMATION CONTINUE

1. OBJET

Cette procédure définit le maintien et le développement des compétences des formateurs et de l'équipe pédagogique. Elle s'inscrit dans une démarche d'amélioration continue visant à garantir la qualité des formations dispensées.

2. PLAN DE FORMATION CONTINUE

L'organisme a défini une politique de formation continue dans le but de prévoir les formations nécessaires pour respecter la réglementation en vigueur et améliorer sa qualité.

Ce plan de formation se matérialise pour chaque élément par : l'intitulé de la formation, le descriptif de la formation, les objectifs de la formation, l'organisme de formation (ou nom du formateur si formation interne), la date prévue de la formation, et la date de réalisation effective.

3. MISE À JOUR DES COMPÉTENCES

Une mise à jour des compétences est prévue dès la détection d'un nouveau besoin par l'organisme de formation. Cette mise à jour peut résulter de l'analyse des veilles réglementaire, technologique et métiers, des retours d'expérience des formations, des évolutions des certifications ou des besoins identifiés lors des bilans annuels.

4. ÉVALUATION DES FORMATEURS

L'évaluation des formateurs se fait en deux temps :

Test en situation réelle : vérification des aptitudes du formateur en séance selon une grille d'évaluation et vérification de la satisfaction client.

Bilan annuel : analyse du nombre de formations réalisées, vérification du maintien en compétences au travers des actions de formation et de veille, vérification de la satisfaction client sur l'année.

5. DOCUMENTATION

La documentation des compétences comprend les fiches intervenants à jour, les CV et diplômes, les attestations de formation suivies, les évaluations reçues par les stagiaires, et les bilans annuels.

6. DOCUMENTS ASSOCIÉS

Plan de formation continue, fiche intervenant, grille d'évaluation, bilan annuel des compétences.`,

        PERSONNALISEE: `PROCÉDURE PERSONNALISÉE

Cette procédure peut être adaptée selon les besoins spécifiques de votre organisme de formation.

1. OBJET

Décrivez ici l'objectif de cette procédure et le contexte dans lequel elle s'applique.

2. CHAMP D'APPLICATION

Définissez le périmètre concerné par cette procédure : quelles formations, quels publics, quelles situations.

3. RESPONSABILITÉS

Identifiez les acteurs impliqués et leurs rôles respectifs dans la mise en œuvre de cette procédure.

4. PROCESSUS

Détaillez les différentes étapes du processus, de manière chronologique et claire. Chaque étape doit être suffisamment détaillée pour être reproductible.

5. DOCUMENTS ASSOCIÉS

Listez les documents liés à cette procédure : formulaires, tableaux de suivi, modèles, etc.

6. RÉVISION

Définissez les modalités de mise à jour de cette procédure : fréquence de révision, conditions déclenchant une mise à jour, responsable de la mise à jour.`,
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

  // Créer une procédure vide (rédiger de zéro)
  const handleCreateFromScratch = async (proc: ProcedureInfo) => {
    setSaving(true);
    try {
      // Créer une procédure avec un contenu vide/minimal
      const content = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: `PROCÉDURE : ${proc.nom.toUpperCase()}` }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "1. OBJET" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "[À compléter]" }],
          },
        ],
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
        const newProc = await res.json();
        const updatedProc = {
          ...proc,
          procedure: newProc,
          hasContent: true,
        };
        // Sélectionner et passer directement en mode édition
        setSelectedProcedure(updatedProc);
        setEditContent(`PROCÉDURE : ${proc.nom.toUpperCase()}\n\n1. OBJET\n[À compléter]`);
        setIsEditing(true);
      }
    } catch (error) {
      console.error("Erreur création procédure:", error);
    } finally {
      setSaving(false);
    }
  };

  // Télécharger la procédure en PDF avec en-tête et pied de page
  const handleDownloadPDF = async (proc: ProcedureInfo) => {
    if (!proc.procedure || !editContent) return;

    setDownloadingPDF(true);
    try {
      // Appel API pour générer le PDF
      const res = await fetch("/api/pdf/procedure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procedureType: proc.type,
          procedureName: proc.nom,
          content: editContent,
          version: proc.version,
          indicateur: proc.indicateur,
          // Infos organisme pour en-tête/pied de page (depuis UserProfile)
          organisme: {
            nomCommercial: user?.entreprise || "",
            adresse: user?.adresse || "",
            codePostal: user?.codePostal || "",
            ville: user?.ville || "",
            siret: user?.siret || "",
            numeroFormateur: user?.numeroFormateur || "",
            prefectureRegion: user?.prefectureRegion || "",
            logo: user?.logoUrl || "",
          },
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `procedure-${proc.type.toLowerCase()}-v${proc.version || 1}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error("Erreur téléchargement PDF");
        alert("Erreur lors de la génération du PDF");
      }
    } catch (error) {
      console.error("Erreur PDF:", error);
      alert("Erreur lors de la génération du PDF");
    } finally {
      setDownloadingPDF(false);
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
            Renseignez les procédures de votre organisme de formation.
          </p>
        </div>
        {data && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <FileText size={16} className="text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {data.stats.completed}/{data.stats.total} procédures rédigées
            </span>
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
                        <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <Check size={10} />
                          Rédigée
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
                      {proc.version > 0 && (
                        <span>
                          v{proc.version}
                          {proc.updatedAt && (
                            <span className="ml-1 text-gray-400">
                              - Modifié le {new Date(proc.updatedAt).toLocaleDateString("fr-FR")}
                            </span>
                          )}
                        </span>
                      )}
                      {proc.versionsCount > 1 && (
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
                      <button
                        onClick={() => handleDownloadPDF(selectedProcedure)}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Télécharger PDF"
                      >
                        <Download size={16} />
                        Télécharger PDF
                      </button>
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
                        onClick={() => handleCreateFromScratch(selectedProcedure)}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                      >
                        {saving ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Plus size={16} />
                        )}
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
