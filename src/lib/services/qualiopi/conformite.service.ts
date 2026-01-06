// ===========================================
// SERVICE D'ANALYSE DE CONFORMITÉ QUALIOPI
// ===========================================

import prisma from "@/lib/db/prisma";
import { IndicateurStatus } from "@prisma/client";
import {
  INDICATEURS_QUALIOPI,
  CRITERES_QUALIOPI,
  getIndicateur,
} from "./indicateurs-data";

// Types
export interface ConformiteScore {
  scoreGlobal: number;
  indicateursConformes: number;
  indicateursTotal: number;
  scoreParCritere: {
    critere: number;
    titre: string;
    score: number;
    indicateursConformes: number;
    indicateursTotal: number;
  }[];
}

export interface AnalyseIndicateur {
  numero: number;
  critere: number;
  libelle: string;
  status: IndicateurStatus;
  score: number;
  preuvesTrouvees: {
    type: string;
    count: number;
    description: string;
  }[];
  problemes: string[];
  suggestions: string[];
}

// ===========================================
// ANALYSE AUTOMATIQUE DE CONFORMITÉ
// ===========================================

export async function analyserConformiteOrganisation(
  organizationId: string
): Promise<{
  score: ConformiteScore;
  analyses: AnalyseIndicateur[];
  alertes: { indicateur: number; message: string; priorite: string }[];
}> {
  console.log("[Qualiopi Service] Analyzing organization:", organizationId);

  // Récupérer les données de l'organisation (avec gestion d'erreur individuelle)
  let organization: any = null;
  let formations: any[] = [];
  let sessions: any[] = [];
  let apprenants: any[] = [];
  let intervenants: any[] = [];
  let documents: any[] = [];
  let evaluations: any[] = [];
  let reclamations: any[] = [];
  let ameliorations: any[] = [];
  let veilleSources: any[] = [];

  try {
    organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { procedures: true },
    });
    console.log("[Qualiopi Service] Organization loaded:", !!organization);
  } catch (e: any) {
    console.error("[Qualiopi Service] Error loading organization:", e?.message);
  }

  try {
    formations = await prisma.formation.findMany({
      where: { organizationId },
      include: {
        modules: true,
        evaluations: true, // Pour IND 11 - Évaluations définies
      },
    });
    console.log("[Qualiopi Service] Formations loaded:", formations.length);
  } catch (e: any) {
    console.error("[Qualiopi Service] Error loading formations:", e?.message);
  }

  try {
    sessions = await prisma.session.findMany({
      where: { organizationId },
      include: { clients: true, journees: true },
    });
    console.log("[Qualiopi Service] Sessions loaded:", sessions.length);
  } catch (e: any) {
    console.error("[Qualiopi Service] Error loading sessions:", e?.message);
  }

  try {
    apprenants = await prisma.apprenant.findMany({
      where: { organizationId },
      include: {
        notesHistory: true, // Pour IND 4 - Analyse du besoin
      },
    });
    console.log("[Qualiopi Service] Apprenants loaded:", apprenants.length);
  } catch (e: any) {
    console.error("[Qualiopi Service] Error loading apprenants:", e?.message);
  }

  try {
    intervenants = await prisma.intervenant.findMany({
      where: { organizationId },
      include: {
        diplomes: true, // Pour IND 22 - Compétences des intervenants
        fichesMission: true, // Pour IND 17 - Fiches mission
      },
    });
    console.log("[Qualiopi Service] Intervenants loaded:", intervenants.length);
  } catch (e: any) {
    console.error("[Qualiopi Service] Error loading intervenants:", e?.message);
  }

  try {
    documents = await prisma.document.findMany({
      where: { formation: { organizationId } },
    });
    console.log("[Qualiopi Service] Documents loaded:", documents.length);
  } catch (e: any) {
    console.error("[Qualiopi Service] Error loading documents:", e?.message);
  }

  try {
    evaluations = await prisma.evaluationSatisfaction.findMany({
      where: { organizationId },
      include: { reponse: true },
    });
    console.log("[Qualiopi Service] Evaluations loaded:", evaluations.length);
  } catch (e: any) {
    console.error("[Qualiopi Service] Error loading evaluations:", e?.message);
  }

  try {
    reclamations = await prisma.reclamation.findMany({
      where: { organizationId },
    });
    console.log("[Qualiopi Service] Reclamations loaded:", reclamations.length);
  } catch (e: any) {
    console.error("[Qualiopi Service] Error loading reclamations:", e?.message);
  }

  try {
    ameliorations = await prisma.actionAmelioration.findMany({
      where: { organizationId },
    });
    console.log("[Qualiopi Service] Ameliorations loaded:", ameliorations.length);
  } catch (e: any) {
    console.error("[Qualiopi Service] Error loading ameliorations:", e?.message);
  }

  try {
    veilleSources = await prisma.veilleSource.findMany({
      where: { organizationId },
    });
    console.log("[Qualiopi Service] VeilleSources loaded:", veilleSources.length);
  } catch (e: any) {
    console.error("[Qualiopi Service] Error loading veilleSources:", e?.message);
  }

  const analyses: AnalyseIndicateur[] = [];
  const alertes: { indicateur: number; message: string; priorite: string }[] = [];

  // Analyser chaque indicateur
  for (const indicateur of INDICATEURS_QUALIOPI) {
    const analyse = await analyserIndicateur(
      indicateur.numero,
      {
        organization,
        formations,
        sessions,
        apprenants,
        intervenants,
        documents,
        evaluations,
        reclamations,
        ameliorations,
        veilleSources,
      }
    );
    analyses.push(analyse);

    // Générer des alertes si nécessaire
    if (analyse.status === "NON_CONFORME") {
      alertes.push({
        indicateur: indicateur.numero,
        message: `Indicateur ${indicateur.numero} non conforme: ${analyse.problemes.join(", ")}`,
        priorite: "HAUTE",
      });
    } else if (analyse.status === "EN_COURS" && analyse.score < 50) {
      alertes.push({
        indicateur: indicateur.numero,
        message: `Indicateur ${indicateur.numero} en cours de mise en conformité (${analyse.score}%)`,
        priorite: "MOYENNE",
      });
    }
  }

  // Calculer les scores
  const score = calculerScores(analyses);

  return { score, analyses, alertes };
}

// Analyser un indicateur spécifique
async function analyserIndicateur(
  numeroIndicateur: number,
  data: {
    organization: any;
    formations: any[];
    sessions: any[];
    apprenants: any[];
    intervenants: any[];
    documents: any[];
    evaluations: any[];
    reclamations: any[];
    ameliorations: any[];
    veilleSources: any[];
  }
): Promise<AnalyseIndicateur> {
  const indicateur = getIndicateur(numeroIndicateur);
  if (!indicateur) {
    throw new Error(`Indicateur ${numeroIndicateur} non trouvé`);
  }

  const preuvesTrouvees: { type: string; count: number; description: string }[] = [];
  const problemes: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Analyser selon le numéro de l'indicateur
  switch (numeroIndicateur) {
    // CRITÈRE 1 - Conditions d'information du public
    case 1: // Information sur les prestations
      score = analyserIndicateur1(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 2: // Indicateurs de résultats
      score = analyserIndicateur2(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 3: // Obtention des certifications
      score = analyserIndicateur3(data, preuvesTrouvees, problemes, suggestions);
      break;

    // CRITÈRE 2 - Identification précise des objectifs
    case 4: // Analyse du besoin
      score = analyserIndicateur4(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 5: // Objectifs opérationnels
      score = analyserIndicateur5(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 6: // Contenus et modalités
      score = analyserIndicateur6(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 7: // Adéquation contenus/certification
      score = analyserIndicateur7(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 8: // Procédures de positionnement
      score = analyserIndicateur8(data, preuvesTrouvees, problemes, suggestions);
      break;

    // CRITÈRE 3 - Adaptation aux publics bénéficiaires
    case 9: // Information des publics
      score = analyserIndicateur9(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 10: // Adaptation de la prestation
      score = analyserIndicateur10(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 11: // Évaluation de l'atteinte des objectifs
      score = analyserIndicateur11(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 12: // Engagement des bénéficiaires
      score = analyserIndicateur12(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 13: // Coordination alternance (CFA)
    case 14: // Exercice citoyenneté (CFA)
    case 15: // Droits apprentis (CFA)
    case 16: // Conformité contrat (CFA)
      // Indicateurs spécifiques CFA - score par défaut si pas CFA
      score = analyserIndicateurCFA(data, preuvesTrouvees, problemes, suggestions);
      break;

    // CRITÈRE 4 - Adéquation des moyens pédagogiques (indicateurs 17-20)
    case 17: // Moyens humains et techniques
      score = analyserIndicateur17(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 18: // Coordination des intervenants
      score = analyserIndicateur18(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 19: // Ressources pédagogiques
      score = analyserIndicateur19(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 20: // Référents et conseil de perfectionnement (CFA)
      score = analyserIndicateur20(data, preuvesTrouvees, problemes, suggestions);
      break;

    // CRITÈRE 5 - Qualification et développement des compétences (indicateurs 21-22)
    case 21: // Compétences des intervenants
      score = analyserIndicateur21_Competences(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 22: // Développement des compétences des salariés
      score = analyserIndicateur22_Developpement(data, preuvesTrouvees, problemes, suggestions);
      break;

    // CRITÈRE 6 - Inscription dans l'environnement professionnel (indicateurs 23-29)
    case 23: // Veille légale et réglementaire
      score = analyserIndicateur23_VeilleReglementaire(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 24: // Veille sur les compétences et métiers
      score = analyserIndicateur24_VeilleMetiers(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 25: // Veille sur les innovations
      score = analyserIndicateur25_VeilleInnovations(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 26: // Réseau handicap
      score = analyserIndicateur26_ReseauHandicap(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 27: // Sous-traitance et portage salarial
      score = analyserIndicateur27_SousTraitance(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 28: // Réseau de partenaires socio-économiques
      score = analyserIndicateur28_Partenaires(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 29: // Insertion professionnelle et poursuite d'études (CFA)
      score = analyserIndicateur29_Insertion(data, preuvesTrouvees, problemes, suggestions);
      break;

    // CRITÈRE 7 - Appréciations et réclamations
    case 30: // Recueil des appréciations
      score = analyserIndicateur30(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 31: // Traitement des réclamations
      score = analyserIndicateur31(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 32: // Mesures d'amélioration
      score = analyserIndicateur32(data, preuvesTrouvees, problemes, suggestions);
      break;

    default:
      score = 50;
      suggestions.push("Cet indicateur nécessite une vérification manuelle");
  }

  // Déterminer le statut
  let status: IndicateurStatus;
  if (score >= 80) {
    status = "CONFORME";
  } else if (score >= 50) {
    status = "EN_COURS";
  } else if (score > 0) {
    status = "NON_CONFORME";
  } else {
    status = "A_EVALUER";
  }

  return {
    numero: numeroIndicateur,
    critere: indicateur.critere,
    libelle: indicateur.libelle,
    status,
    score,
    preuvesTrouvees,
    problemes,
    suggestions,
  };
}

// ===========================================
// FONCTIONS D'ANALYSE PAR INDICATEUR
// ===========================================

function analyserIndicateur1(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { organization, formations } = data;

  // Vérifier les informations de l'organisation
  if (organization?.catalogueActif) {
    preuves.push({ type: "catalogue", count: 1, description: "Catalogue actif" });
    score += 15;
  } else {
    problemes.push("Catalogue non activé");
    suggestions.push("Activez le catalogue public dans les paramètres");
  }

  if (organization?.email && organization?.telephone) {
    preuves.push({ type: "contact", count: 1, description: "Coordonnées de contact" });
    score += 10;
  } else {
    problemes.push("Coordonnées incomplètes");
  }

  // Vérifier les formations - les données sont dans fichePedagogique (JSON)
  // Structure conforme à l'API catalogue: objectifs/objectifsPedagogiques, prerequis, publicVise/publicCible, duree/dureeHeures
  const formationsCompletes = formations.filter((f: any) => {
    const fiche = f.fichePedagogique;
    if (!fiche) return false;

    // Debug log pour comprendre la structure
    console.log(`[Qualiopi IND1] Checking formation "${f.titre}": fichePedagogique keys:`, Object.keys(fiche));

    // Vérifier les champs requis pour l'indicateur 1 (info sur les prestations)
    // Objectifs pédagogiques (obligatoire)
    const hasObjectifs = (fiche.objectifs && (
      Array.isArray(fiche.objectifs) ? fiche.objectifs.length > 0 : !!fiche.objectifs
    )) || (fiche.objectifsPedagogiques && (
      Array.isArray(fiche.objectifsPedagogiques) ? fiche.objectifsPedagogiques.length > 0 : !!fiche.objectifsPedagogiques
    ));

    // Prérequis OU public visé (l'un ou l'autre suffit)
    const hasPreRequis = fiche.prerequis || fiche.preRequis;
    const hasPublicVise = fiche.publicVise || fiche.publicCible;

    // Durée (sous différentes formes)
    const hasDuree = fiche.duree || fiche.dureeHeures || fiche.dureeJours || fiche.nombreHeures;

    // Log le résultat
    console.log(`[Qualiopi IND1] Formation "${f.titre}": objectifs=${hasObjectifs}, prerequis=${hasPreRequis}, publicVise=${hasPublicVise}, duree=${hasDuree}`);

    // Une formation est complète si elle a: objectifs ET (prérequis OU public visé) ET durée
    return hasObjectifs && (hasPreRequis || hasPublicVise) && hasDuree;
  });

  // Vérifier aussi les formations publiées au catalogue
  const formationsPubliees = formations.filter((f: any) => f.estPublieCatalogue);

  if (formationsCompletes.length > 0) {
    preuves.push({
      type: "formation",
      count: formationsCompletes.length,
      description: "Formations avec informations complètes (objectifs, prérequis, durée)",
    });
    score += Math.min(40, (formationsCompletes.length / Math.max(formations.length, 1)) * 40);
  } else if (formations.length > 0) {
    problemes.push("Formations incomplètes (objectifs, prérequis, durée)");
    suggestions.push("Complétez les fiches pédagogiques des formations");
  }

  // Bonus pour les formations publiées au catalogue
  if (formationsPubliees.length > 0) {
    preuves.push({
      type: "catalogue_formations",
      count: formationsPubliees.length,
      description: "Formations publiées au catalogue public",
    });
    score += 15;
  }

  // Vérifier le certificat Qualiopi
  if (organization?.certificatQualiopiUrl) {
    preuves.push({ type: "certification", count: 1, description: "Certificat Qualiopi" });
    score += 10;
  }

  // Accessibilité handicap - vérifier aussi dans fichePedagogique
  const formationsAvecAccessibilite = formations.filter((f: any) => {
    const fiche = f.fichePedagogique;
    return fiche?.accessibilite || fiche?.accessibiliteHandicap || fiche?.referentHandicap;
  });

  if (organization?.procedures?.some((p: any) => p.type === "ACCESSIBILITE") || formationsAvecAccessibilite.length > 0) {
    preuves.push({ type: "accessibilite", count: 1, description: "Informations accessibilité handicap" });
    score += 10;
  } else {
    suggestions.push("Ajoutez des informations sur l'accessibilité handicap");
  }

  return Math.min(100, score);
}

function analyserIndicateur2(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { evaluations, sessions } = data;

  // Vérifier les évaluations de satisfaction
  if (evaluations.length > 0) {
    preuves.push({
      type: "evaluation",
      count: evaluations.length,
      description: "Évaluations de satisfaction",
    });
    score += 50;
  } else {
    problemes.push("Aucune évaluation de satisfaction trouvée");
    suggestions.push("Mettez en place des questionnaires de satisfaction");
  }

  // Vérifier les sessions terminées avec journées
  const sessionsTerminees = sessions.filter((s: any) => s.status === "TERMINEE");
  if (sessionsTerminees.length > 0) {
    const sessionsAvecJournees = sessionsTerminees.filter(
      (s: any) => s.journees && s.journees.length > 0
    );
    if (sessionsAvecJournees.length > 0) {
      preuves.push({
        type: "session",
        count: sessionsAvecJournees.length,
        description: "Sessions avec suivi de présence",
      });
      score += 30;
    }
  }

  // Calculer un taux de satisfaction moyen
  if (evaluations.length > 0) {
    const evaluationsAvecReponse = evaluations.filter((e: any) => e.reponse?.noteGlobale);
    if (evaluationsAvecReponse.length > 0) {
      const avgSatisfaction = evaluationsAvecReponse.reduce((acc: number, e: any) =>
        acc + (e.reponse?.noteGlobale || 0), 0) / evaluationsAvecReponse.length;
      if (avgSatisfaction > 0) {
        preuves.push({
          type: "satisfaction",
          count: 1,
          description: `Taux de satisfaction moyen: ${avgSatisfaction.toFixed(1)}/10`,
        });
        score += 20;
      }
    }
  }

  return Math.min(100, score);
}

// IND 3 - Obtention des certifications
function analyserIndicateur3(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { formations } = data;

  // Vérifier les formations certifiantes
  const formationsCertifiantes = formations.filter((f: any) => f.isCertifiante);

  if (formationsCertifiantes.length > 0) {
    preuves.push({
      type: "certification",
      count: formationsCertifiantes.length,
      description: "Formations certifiantes",
    });
    score += 40;

    // Vérifier les liens France Compétences
    const avecFicheRS = formationsCertifiantes.filter((f: any) =>
      f.numeroFicheRS || f.lienFranceCompetences
    );
    if (avecFicheRS.length > 0) {
      preuves.push({
        type: "rncp_rs",
        count: avecFicheRS.length,
        description: "Fiches RNCP/RS référencées",
      });
      score += 40;
    }

    // Vérifier les indicateurs de taux de certification
    const avecIndicateurs = formations.filter((f: any) =>
      f.indicateurs?.tauxCertification !== null
    );
    if (avecIndicateurs.length > 0) {
      preuves.push({
        type: "taux_certification",
        count: avecIndicateurs.length,
        description: "Taux de certification publiés",
      });
      score += 20;
    }
  } else {
    // Si pas de formation certifiante, l'indicateur est NA
    score = 80; // Score neutre - Non applicable
    suggestions.push("Indicateur applicable uniquement aux formations certifiantes");
  }

  return Math.min(100, score);
}

function analyserIndicateur4(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { apprenants, sessions } = data;

  // Vérifier le positionnement des apprenants via les notes internes ou l'historique
  // Le champ "notes" contient l'analyse du besoin, et "notesHistory" l'historique
  const apprenantsAvecPositionnement = apprenants.filter((a: any) =>
    a.notes || (a.notesHistory && a.notesHistory.length > 0) || a.situationActuelle
  );

  if (apprenantsAvecPositionnement.length > 0) {
    preuves.push({
      type: "positionnement",
      count: apprenantsAvecPositionnement.length,
      description: "Apprenants avec analyse du besoin documentée",
    });
    score += 40;
  } else if (apprenants.length > 0) {
    problemes.push("Analyse du besoin non documentée pour les apprenants");
    suggestions.push("Ajoutez des notes d'analyse du besoin pour chaque apprenant");
  }

  // Vérifier les inscriptions aux sessions
  const sessionsAvecParticipants = sessions.filter((s: any) =>
    (s.clients && s.clients.length > 0) || s.nombreParticipants > 0
  );
  if (sessionsAvecParticipants.length > 0) {
    preuves.push({
      type: "inscription",
      count: sessionsAvecParticipants.length,
      description: "Sessions avec inscriptions formalisées",
    });
    score += 30;
  }

  // Bonus si des apprenants existent
  if (apprenants.length > 0) {
    preuves.push({
      type: "apprenant",
      count: apprenants.length,
      description: "Apprenants enregistrés dans le système",
    });
    score += 30;
  }

  return Math.min(100, score);
}

// IND 5 - Objectifs opérationnels
function analyserIndicateur5(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { formations } = data;

  if (formations.length === 0) {
    problemes.push("Aucune formation créée");
    return 0;
  }

  // Vérifier les objectifs dans fichePedagogique
  const formationsAvecObjectifs = formations.filter((f: any) => {
    const fiche = f.fichePedagogique;
    if (!fiche) return false;
    const objectifs = fiche.objectifs || fiche.objectifsPedagogiques;
    return objectifs && (Array.isArray(objectifs) ? objectifs.length > 0 : !!objectifs);
  });

  if (formationsAvecObjectifs.length > 0) {
    preuves.push({
      type: "objectifs",
      count: formationsAvecObjectifs.length,
      description: "Formations avec objectifs pédagogiques définis",
    });
    score += 50;
  } else {
    problemes.push("Objectifs pédagogiques non définis dans les formations");
    suggestions.push("Définissez les objectifs pédagogiques pour chaque formation");
  }

  // Vérifier les modules avec objectifs
  const formationsAvecModules = formations.filter((f: any) =>
    f.modules && f.modules.length > 0
  );
  if (formationsAvecModules.length > 0) {
    preuves.push({
      type: "modules",
      count: formationsAvecModules.reduce((acc: number, f: any) => acc + f.modules.length, 0),
      description: "Modules de formation structurés",
    });
    score += 30;
  }

  // Vérifier les évaluations définies
  const formationsAvecEval = formations.filter((f: any) =>
    f.evaluations && f.evaluations.length > 0
  );
  if (formationsAvecEval.length > 0) {
    preuves.push({
      type: "evaluation_definie",
      count: formationsAvecEval.length,
      description: "Formations avec critères d'évaluation",
    });
    score += 20;
  }

  return Math.min(100, score);
}

// IND 6 - Contenus et modalités
function analyserIndicateur6(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { formations } = data;

  if (formations.length === 0) {
    problemes.push("Aucune formation créée");
    return 0;
  }

  // Vérifier les programmes détaillés (modules)
  const formationsAvecProgramme = formations.filter((f: any) =>
    f.modules && f.modules.length > 0
  );

  if (formationsAvecProgramme.length > 0) {
    preuves.push({
      type: "programme",
      count: formationsAvecProgramme.length,
      description: "Formations avec programme détaillé",
    });
    score += 40;
  } else {
    problemes.push("Programmes de formation non structurés");
    suggestions.push("Créez des modules pour structurer vos programmes");
  }

  // Vérifier les modalités pédagogiques dans fichePedagogique
  const formationsAvecModalites = formations.filter((f: any) => {
    const fiche = f.fichePedagogique;
    return fiche && (fiche.modalite || fiche.moyensPedagogiques || fiche.ressourcesPedagogiques);
  });

  if (formationsAvecModalites.length > 0) {
    preuves.push({
      type: "modalites",
      count: formationsAvecModalites.length,
      description: "Formations avec modalités pédagogiques définies",
    });
    score += 30;
  }

  // Vérifier le public cible
  const formationsAvecPublic = formations.filter((f: any) => {
    const fiche = f.fichePedagogique;
    return fiche && (fiche.publicVise || fiche.publicCible);
  });

  if (formationsAvecPublic.length > 0) {
    preuves.push({
      type: "public_cible",
      count: formationsAvecPublic.length,
      description: "Public cible identifié",
    });
    score += 30;
  }

  return Math.min(100, score);
}

// IND 7 - Adéquation contenus/certification
function analyserIndicateur7(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { formations } = data;

  const formationsCertifiantes = formations.filter((f: any) => f.isCertifiante);

  if (formationsCertifiantes.length > 0) {
    // Vérifier que les formations certifiantes ont un référentiel
    const avecReferentiel = formationsCertifiantes.filter((f: any) =>
      f.referentielRSUrl || f.lienFranceCompetences || f.numeroFicheRS
    );

    if (avecReferentiel.length > 0) {
      preuves.push({
        type: "referentiel",
        count: avecReferentiel.length,
        description: "Référentiels de certification liés",
      });
      score += 60;
    } else {
      problemes.push("Référentiels de certification non documentés");
      suggestions.push("Liez les fiches RNCP/RS à vos formations certifiantes");
    }

    // Vérifier que les formations ont des modules structurés
    const avecModules = formationsCertifiantes.filter((f: any) =>
      f.modules && f.modules.length > 0
    );
    if (avecModules.length > 0) {
      preuves.push({
        type: "correspondance",
        count: avecModules.length,
        description: "Formations structurées en modules",
      });
      score += 40;
    }
  } else {
    // Si pas de formation certifiante, l'indicateur est NA
    score = 80;
    suggestions.push("Indicateur applicable uniquement aux formations certifiantes");
  }

  return Math.min(100, score);
}

// IND 8 - Procédures de positionnement
function analyserIndicateur8(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { formations, apprenants } = data;

  // Vérifier les évaluations de type positionnement
  const formationsAvecPositionnement = formations.filter((f: any) => {
    if (!f.evaluations) return false;
    return f.evaluations.some((e: any) =>
      e.type === "POSITIONNEMENT" || e.type === "QCM_POSITIONNEMENT"
    );
  });

  if (formationsAvecPositionnement.length > 0) {
    preuves.push({
      type: "test_positionnement",
      count: formationsAvecPositionnement.length,
      description: "Formations avec test de positionnement",
    });
    score += 60;
  } else if (formations.length > 0) {
    problemes.push("Aucun test de positionnement défini");
    suggestions.push("Créez des évaluations de positionnement pour vos formations");
  }

  // Vérifier les prérequis documentés
  const formationsAvecPrerequis = formations.filter((f: any) => {
    const fiche = f.fichePedagogique;
    return fiche && (fiche.prerequis || fiche.preRequis);
  });

  if (formationsAvecPrerequis.length > 0) {
    preuves.push({
      type: "prerequis",
      count: formationsAvecPrerequis.length,
      description: "Prérequis documentés",
    });
    score += 40;
  }

  return Math.min(100, score);
}

function analyserIndicateur9(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { documents, organization } = data;

  // Vérifier les documents d'accueil
  const convocations = documents.filter((d: any) => d.type === "CONVOCATION");
  const reglements = documents.filter((d: any) => d.type === "REGLEMENT_INTERIEUR");

  if (convocations.length > 0) {
    preuves.push({
      type: "convocation",
      count: convocations.length,
      description: "Convocations générées",
    });
    score += 40;
  } else {
    problemes.push("Aucune convocation générée");
    suggestions.push("Générez des convocations pour vos sessions");
  }

  if (reglements.length > 0) {
    preuves.push({
      type: "reglement",
      count: reglements.length,
      description: "Règlements intérieurs",
    });
    score += 30;
  } else {
    problemes.push("Règlement intérieur non trouvé");
    suggestions.push("Créez un règlement intérieur");
  }

  // Vérifier la procédure d'accueil
  if (organization?.procedures?.some((p: any) => p.type === "ACCUEIL")) {
    preuves.push({ type: "procedure", count: 1, description: "Procédure d'accueil" });
    score += 30;
  }

  return Math.min(100, score);
}

// IND 10 - Adaptation de la prestation
function analyserIndicateur10(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { sessions, apprenants } = data;

  // Vérifier le suivi des sessions (présence, journées)
  const sessionsAvecSuivi = sessions.filter((s: any) =>
    s.journees && s.journees.length > 0
  );

  if (sessionsAvecSuivi.length > 0) {
    preuves.push({
      type: "suivi_sessions",
      count: sessionsAvecSuivi.length,
      description: "Sessions avec suivi de présence",
    });
    score += 40;
  } else if (sessions.length > 0) {
    problemes.push("Suivi de présence non configuré");
    suggestions.push("Configurez les journées de formation pour suivre les présences");
  }

  // Vérifier les notes de suivi des apprenants
  const apprenantsAvecNotes = apprenants.filter((a: any) =>
    a.notes || (a.notesHistory && a.notesHistory.length > 0)
  );

  if (apprenantsAvecNotes.length > 0) {
    preuves.push({
      type: "suivi_apprenants",
      count: apprenantsAvecNotes.length,
      description: "Apprenants avec suivi individualisé",
    });
    score += 30;
  }

  // Bonus si sessions terminées
  const sessionsTerminees = sessions.filter((s: any) => s.status === "TERMINEE");
  if (sessionsTerminees.length > 0) {
    preuves.push({
      type: "sessions_terminees",
      count: sessionsTerminees.length,
      description: "Sessions de formation réalisées",
    });
    score += 30;
  }

  return Math.min(100, score);
}

function analyserIndicateur11(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { formations, documents } = data;

  // Vérifier les évaluations dans les formations
  const formationsAvecEval = formations.filter((f: any) =>
    f.evaluations && f.evaluations.length > 0
  );

  if (formationsAvecEval.length > 0) {
    preuves.push({
      type: "evaluation",
      count: formationsAvecEval.length,
      description: "Formations avec évaluations",
    });
    score += 50;
  } else {
    problemes.push("Aucune évaluation définie dans les formations");
    suggestions.push("Ajoutez des évaluations à vos formations");
  }

  // Vérifier les attestations de fin de formation
  const attestations = documents.filter((d: any) =>
    d.type === "ATTESTATION_FIN" || d.type === "ATTESTATION_PRESENCE"
  );

  if (attestations.length > 0) {
    preuves.push({
      type: "attestation",
      count: attestations.length,
      description: "Attestations générées",
    });
    score += 50;
  } else {
    suggestions.push("Générez des attestations pour vos sessions terminées");
  }

  return Math.min(100, score);
}

// IND 12 - Engagement des bénéficiaires
function analyserIndicateur12(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { sessions, documents } = data;

  // Vérifier les taux de présence via les journées
  const sessionsAvecJournees = sessions.filter((s: any) =>
    s.journees && s.journees.length > 0
  );

  if (sessionsAvecJournees.length > 0) {
    preuves.push({
      type: "suivi_assiduite",
      count: sessionsAvecJournees.length,
      description: "Suivi de l'assiduité configuré",
    });
    score += 50;
  } else if (sessions.length > 0) {
    problemes.push("Suivi de l'assiduité non configuré");
    suggestions.push("Mettez en place un suivi des présences");
  }

  // Vérifier les feuilles d'émargement
  const feuillesEmargement = documents.filter((d: any) =>
    d.type === "EMARGEMENT" || d.type === "FEUILLE_PRESENCE"
  );

  if (feuillesEmargement.length > 0) {
    preuves.push({
      type: "emargement",
      count: feuillesEmargement.length,
      description: "Feuilles d'émargement générées",
    });
    score += 30;
  }

  // Vérifier les sessions terminées (bon indicateur d'engagement)
  const sessionsTerminees = sessions.filter((s: any) => s.status === "TERMINEE");
  if (sessionsTerminees.length > 0) {
    preuves.push({
      type: "completion",
      count: sessionsTerminees.length,
      description: "Sessions menées à terme",
    });
    score += 20;
  }

  return Math.min(100, score);
}

// Indicateurs CFA (13-16) - Non applicables hors CFA
function analyserIndicateurCFA(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  const { organization } = data;

  // Vérifier si l'organisation est un CFA
  const isCFA = organization?.categorieQualiopi === "CFA" ||
    organization?.type === "CFA";

  if (isCFA) {
    // Si c'est un CFA, ces indicateurs nécessitent une vérification manuelle
    suggestions.push("Indicateur spécifique CFA - Vérification manuelle requise");
    return 50;
  } else {
    // Si ce n'est pas un CFA, ces indicateurs sont non applicables
    preuves.push({
      type: "non_applicable",
      count: 1,
      description: "Indicateur non applicable (hors CFA)",
    });
    return 80; // Score neutre - Non applicable
  }
}

function analyserIndicateur17(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { intervenants, sessions } = data;

  // Vérifier les intervenants
  if (intervenants.length > 0) {
    preuves.push({
      type: "intervenant",
      count: intervenants.length,
      description: "Intervenants enregistrés",
    });
    score += 50;
  } else {
    problemes.push("Aucun intervenant enregistré");
    suggestions.push("Ajoutez vos formateurs dans la base de données");
  }

  // Vérifier les sessions avec intervenants assignés
  const sessionsAvecIntervenant = sessions.filter((s: any) =>
    s.formateurId || (s.intervenants && s.intervenants.length > 0)
  );

  if (sessionsAvecIntervenant.length > 0) {
    preuves.push({
      type: "affectation",
      count: sessionsAvecIntervenant.length,
      description: "Sessions avec intervenants assignés",
    });
    score += 50;
  } else if (sessions.length > 0) {
    problemes.push("Sessions sans intervenant assigné");
    suggestions.push("Assignez des intervenants à vos sessions");
  }

  return Math.min(100, score);
}

// IND 18 - Coordination des intervenants
function analyserIndicateur18(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { intervenants, sessions } = data;

  if (intervenants.length > 0) {
    preuves.push({
      type: "equipe",
      count: intervenants.length,
      description: "Équipe de formateurs constituée",
    });
    score += 40;

    // Vérifier les fiches mission
    const intervenantsAvecFiche = intervenants.filter((i: any) =>
      i.fichesMission && i.fichesMission.length > 0
    );
    if (intervenantsAvecFiche.length > 0) {
      preuves.push({
        type: "fiches_mission",
        count: intervenantsAvecFiche.length,
        description: "Fiches mission formalisées",
      });
      score += 30;
    }
  }

  // Vérifier les sessions avec plusieurs intervenants (coordination)
  const sessionsCoordonnees = sessions.filter((s: any) =>
    s.formateurId && s.coFormateurs && s.coFormateurs.length > 0
  );
  if (sessionsCoordonnees.length > 0) {
    preuves.push({
      type: "coordination",
      count: sessionsCoordonnees.length,
      description: "Sessions avec coordination multi-formateurs",
    });
    score += 30;
  }

  return Math.min(100, score);
}

// IND 19 - Ressources pédagogiques
function analyserIndicateur19(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { formations, documents } = data;

  // Vérifier les ressources dans fichePedagogique
  const formationsAvecRessources = formations.filter((f: any) => {
    const fiche = f.fichePedagogique;
    return fiche && (fiche.ressourcesPedagogiques || fiche.ressourcesTechniques || fiche.supports);
  });

  if (formationsAvecRessources.length > 0) {
    preuves.push({
      type: "ressources_definies",
      count: formationsAvecRessources.length,
      description: "Ressources pédagogiques documentées",
    });
    score += 50;
  } else if (formations.length > 0) {
    problemes.push("Ressources pédagogiques non documentées");
    suggestions.push("Décrivez les ressources pédagogiques dans vos fiches formations");
  }

  // Vérifier les supports de formation uploadés
  const supports = documents.filter((d: any) =>
    d.type === "SUPPORT" || d.type === "RESSOURCE" || d.type === "PEDAGOGIQUE"
  );

  if (supports.length > 0) {
    preuves.push({
      type: "supports",
      count: supports.length,
      description: "Supports de formation uploadés",
    });
    score += 30;
  }

  // Vérifier les modules avec contenu
  const modulesAvecContenu = formations.flatMap((f: any) =>
    (f.modules || []).filter((m: any) => m.contenu)
  );
  if (modulesAvecContenu.length > 0) {
    preuves.push({
      type: "contenu_modules",
      count: modulesAvecContenu.length,
      description: "Modules avec contenu détaillé",
    });
    score += 20;
  }

  return Math.min(100, score);
}

// IND 20 - Référent handicap (principalement CFA mais aussi OF)
function analyserIndicateur20(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { organization, intervenants } = data;

  // Vérifier le référent handicap
  if (organization?.referentHandicap || organization?.referentHandicapNom) {
    preuves.push({
      type: "referent_handicap",
      count: 1,
      description: "Référent handicap désigné",
    });
    score += 60;
  } else {
    // Chercher dans les intervenants si quelqu'un a ce rôle
    const referentHandicap = intervenants.find((i: any) =>
      i.fonction?.toLowerCase().includes("handicap")
    );
    if (referentHandicap) {
      preuves.push({
        type: "referent_handicap",
        count: 1,
        description: `Référent handicap: ${referentHandicap.prenom} ${referentHandicap.nom}`,
      });
      score += 60;
    } else {
      suggestions.push("Désignez un référent handicap dans votre organisation");
    }
  }

  // Vérifier les procédures d'accessibilité
  if (organization?.procedures?.some((p: any) => p.type === "ACCESSIBILITE")) {
    preuves.push({
      type: "procedure_accessibilite",
      count: 1,
      description: "Procédure accessibilité handicap",
    });
    score += 40;
  }

  return Math.min(100, score);
}

// =====================================================
// CRITÈRE 5 - Qualification et développement des compétences
// =====================================================

// IND 21 - Compétences des intervenants (RNQ V9)
function analyserIndicateur21_Competences(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { intervenants } = data;

  if (intervenants.length === 0) {
    problemes.push("Aucun intervenant enregistré");
    suggestions.push("Ajoutez vos formateurs dans le système");
    return 0;
  }

  // Vérifier les CV des intervenants
  const intervenantsAvecCV = intervenants.filter((i: any) => i.cv);
  if (intervenantsAvecCV.length > 0) {
    preuves.push({
      type: "cv",
      count: intervenantsAvecCV.length,
      description: "Intervenants avec CV téléchargé",
    });
    score += 30;
  } else {
    problemes.push("CV non téléchargés pour les intervenants");
    suggestions.push("Téléchargez les CV de vos formateurs");
  }

  // Vérifier la biographie/compétences
  const intervenantsAvecBio = intervenants.filter((i: any) =>
    i.biographie || (i.specialites && i.specialites.length > 0)
  );
  if (intervenantsAvecBio.length > 0) {
    preuves.push({
      type: "biographie",
      count: intervenantsAvecBio.length,
      description: "Intervenants avec biographie/spécialités",
    });
    score += 30;
  }

  // Vérifier les diplômes (relation séparée IntervenantDiplome)
  const intervenantsAvecDiplomes = intervenants.filter((i: any) =>
    i.diplomes && i.diplomes.length > 0
  );
  if (intervenantsAvecDiplomes.length > 0) {
    const totalDiplomes = intervenants.reduce((acc: number, i: any) =>
      acc + (i.diplomes?.length || 0), 0
    );
    preuves.push({
      type: "diplome",
      count: totalDiplomes,
      description: "Diplômes/certifications documentés",
    });
    score += 40;
  } else {
    suggestions.push("Ajoutez les diplômes de vos intervenants");
  }

  return Math.min(100, score);
}

// IND 22 - Développement des compétences des salariés (RNQ V9)
function analyserIndicateur22_Developpement(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { intervenants, veilleSources } = data;

  if (intervenants.length === 0) {
    return 50; // Score neutre si pas d'intervenant
  }

  // Vérifier les intervenants avec formations continues
  const intervenantsAvecFormation = intervenants.filter((i: any) =>
    i.formations || i.cv || i.anneesExperience
  );

  if (intervenantsAvecFormation.length > 0) {
    preuves.push({
      type: "formation_continue",
      count: intervenantsAvecFormation.length,
      description: "Intervenants avec parcours documenté",
    });
    score += 50;
  } else {
    suggestions.push("Documentez les formations continues de vos intervenants");
  }

  // Vérifier la veille pédagogique
  if (veilleSources.length > 0) {
    preuves.push({
      type: "veille_pedagogique",
      count: veilleSources.length,
      description: "Veille pédagogique active",
    });
    score += 30;
  }

  // Bonus si diplômes récents ou multiples
  const intervenantsAvecDiplomes = intervenants.filter((i: any) =>
    i.diplomes && i.diplomes.length > 0
  );
  if (intervenantsAvecDiplomes.length > 0) {
    score += 20;
  }

  return Math.min(100, score);
}

// =====================================================
// CRITÈRE 6 - Inscription dans l'environnement professionnel
// =====================================================

// IND 23 - Veille légale et réglementaire (RNQ V9)
function analyserIndicateur23_VeilleReglementaire(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { veilleSources } = data;

  // Vérifier les sources de veille
  if (veilleSources.length > 0) {
    preuves.push({
      type: "veille",
      count: veilleSources.length,
      description: "Sources de veille configurées",
    });
    score += 50;
  } else {
    problemes.push("Aucune source de veille configurée");
    suggestions.push("Configurez des sources de veille réglementaire dans le module Veille");
  }

  // Vérifier les sources actives
  const sourcesActives = veilleSources.filter((s: any) => s.isActive);
  if (sourcesActives.length > 0) {
    preuves.push({
      type: "veille_active",
      count: sourcesActives.length,
      description: "Sources de veille actives",
    });
    score += 30;
  }

  // Vérifier les différents types de veille (réglementaire, pédagogique, etc.)
  const typesVeille = new Set(veilleSources.map((s: any) => s.type));
  if (typesVeille.size >= 2) {
    preuves.push({
      type: "diversite_veille",
      count: typesVeille.size,
      description: `${typesVeille.size} types de veille différents`,
    });
    score += 20;
  }

  return Math.min(100, score);
}

// IND 24 - Veille sur les compétences et métiers (RNQ V9)
function analyserIndicateur24_VeilleMetiers(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { veilleSources, formations } = data;

  // Vérifier les sources de veille métier/sectorielle
  const veilleMétiers = veilleSources.filter((s: any) =>
    s.type === "METIER" || s.type === "SECTORIELLE" || s.type === "COMPETENCES"
  );

  if (veilleMétiers.length > 0) {
    preuves.push({
      type: "veille_metiers",
      count: veilleMétiers.length,
      description: "Sources de veille métiers/compétences",
    });
    score += 50;
  } else if (veilleSources.length > 0) {
    // Au moins une veille existe
    preuves.push({
      type: "veille_generale",
      count: veilleSources.length,
      description: "Système de veille en place",
    });
    score += 30;
  } else {
    problemes.push("Aucune veille sur les évolutions métiers");
    suggestions.push("Configurez une veille sur les évolutions de votre secteur");
  }

  // Vérifier les formations mises à jour récemment
  const unAnAvant = new Date();
  unAnAvant.setFullYear(unAnAvant.getFullYear() - 1);
  const formationsMaJ = formations.filter((f: any) =>
    new Date(f.updatedAt) > unAnAvant
  );

  if (formationsMaJ.length > 0) {
    preuves.push({
      type: "actualisation",
      count: formationsMaJ.length,
      description: "Formations actualisées",
    });
    score += 30;
  }

  return Math.min(100, score);
}

// IND 25 - Veille sur les innovations (RNQ V9)
function analyserIndicateur25_VeilleInnovations(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { veilleSources, formations } = data;

  // Vérifier les sources de veille innovation
  const veilleInnovation = veilleSources.filter((s: any) =>
    s.type === "INNOVATION" || s.type === "PEDAGOGIQUE" || s.type === "TECHNOLOGIQUE"
  );

  if (veilleInnovation.length > 0) {
    preuves.push({
      type: "veille_innovation",
      count: veilleInnovation.length,
      description: "Sources de veille innovation",
    });
    score += 50;
  } else if (veilleSources.length > 0) {
    preuves.push({
      type: "veille_generale",
      count: veilleSources.length,
      description: "Système de veille en place",
    });
    score += 30;
  } else {
    suggestions.push("Configurez une veille sur les innovations pédagogiques");
  }

  // Vérifier les formations avec modalités innovantes (distanciel, mixte, LMS)
  const formationsInnovantes = formations.filter((f: any) => {
    const fiche = f.fichePedagogique;
    return fiche && (
      fiche.modalite === "DISTANCIEL" ||
      fiche.modalite === "MIXTE" ||
      fiche.lms ||
      fiche.elearning
    );
  });

  if (formationsInnovantes.length > 0) {
    preuves.push({
      type: "modalites_innovantes",
      count: formationsInnovantes.length,
      description: "Formations avec modalités innovantes",
    });
    score += 30;
  }

  return Math.min(100, score);
}

// IND 26 - Réseau handicap (RNQ V9)
function analyserIndicateur26_ReseauHandicap(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { organization, formations, intervenants } = data;

  // Vérifier le référent handicap
  if (organization?.referentHandicap || organization?.referentHandicapNom) {
    preuves.push({
      type: "referent_handicap",
      count: 1,
      description: "Référent handicap désigné",
    });
    score += 40;
  } else {
    // Chercher dans les intervenants si quelqu'un a ce rôle
    const referentHandicap = intervenants.find((i: any) =>
      i.fonction?.toLowerCase().includes("handicap")
    );
    if (referentHandicap) {
      preuves.push({
        type: "referent_handicap",
        count: 1,
        description: `Référent handicap: ${referentHandicap.prenom} ${referentHandicap.nom}`,
      });
      score += 40;
    } else {
      problemes.push("Référent handicap non désigné");
      suggestions.push("Désignez un référent handicap dans votre organisation");
    }
  }

  // Vérifier les formations avec accessibilité
  const formationsAccessibles = formations.filter((f: any) => {
    const fiche = f.fichePedagogique;
    return fiche && (fiche.accessibilite || fiche.accessibiliteHandicap);
  });

  if (formationsAccessibles.length > 0) {
    preuves.push({
      type: "accessibilite",
      count: formationsAccessibles.length,
      description: "Formations avec infos accessibilité",
    });
    score += 30;
  }

  // Vérifier les procédures
  if (organization?.procedures?.some((p: any) => p.type === "ACCESSIBILITE" || p.type === "HANDICAP")) {
    preuves.push({
      type: "procedure_handicap",
      count: 1,
      description: "Procédure accompagnement handicap",
    });
    score += 30;
  }

  return Math.min(100, score);
}

// IND 27 - Sous-traitance et portage salarial (RNQ V9)
function analyserIndicateur27_SousTraitance(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { intervenants, documents } = data;

  // Vérifier les intervenants externes/sous-traitants
  const intervenantsExternes = intervenants.filter((i: any) =>
    i.structure || i.structureSiret || i.numeroDeclarationActivite
  );

  if (intervenantsExternes.length > 0) {
    preuves.push({
      type: "sous_traitants",
      count: intervenantsExternes.length,
      description: "Intervenants externes identifiés",
    });
    score += 50;

    // Vérifier les contrats de sous-traitance
    const contratsSousTraitance = documents.filter((d: any) =>
      d.type === "CONTRAT_SOUS_TRAITANCE" || d.type === "CONVENTION"
    );

    if (contratsSousTraitance.length > 0) {
      preuves.push({
        type: "contrats",
        count: contratsSousTraitance.length,
        description: "Contrats de sous-traitance formalisés",
      });
      score += 50;
    } else {
      problemes.push("Contrats de sous-traitance non documentés");
      suggestions.push("Formalisez les contrats avec vos sous-traitants");
    }
  } else {
    // Si pas de sous-traitance, l'indicateur est conforme par défaut
    preuves.push({
      type: "pas_sous_traitance",
      count: 1,
      description: "Pas de sous-traitance identifiée",
    });
    score = 80;
  }

  return Math.min(100, score);
}

// IND 28 - Réseau de partenaires socio-économiques (RNQ V9)
function analyserIndicateur28_Partenaires(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { formations, sessions } = data;

  // Vérifier les formations en alternance ou avec stages
  const formationsAlternance = formations.filter((f: any) =>
    f.alternance || f.typeAlternance || f.stage
  );

  if (formationsAlternance.length > 0) {
    preuves.push({
      type: "alternance",
      count: formationsAlternance.length,
      description: "Formations avec périodes en entreprise",
    });
    score += 40;

    // Vérifier les sessions avec entreprises
    const sessionsEntreprises = sessions.filter((s: any) =>
      s.clients && s.clients.some((c: any) => c.entrepriseId)
    );

    if (sessionsEntreprises.length > 0) {
      preuves.push({
        type: "partenariats",
        count: sessionsEntreprises.length,
        description: "Partenariats entreprises actifs",
      });
      score += 40;
    }
  } else {
    // Si pas de formation en situation de travail, l'indicateur est NA
    preuves.push({
      type: "non_applicable",
      count: 1,
      description: "Pas de formation en situation de travail",
    });
    score = 80;
  }

  return Math.min(100, score);
}

// IND 29 - Insertion professionnelle et poursuite d'études (CFA) (RNQ V9)
function analyserIndicateur29_Insertion(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { organization, formations, sessions } = data;

  // Vérifier si CFA
  const isCFA = organization?.categorieQualiopi === "CFA";

  if (isCFA) {
    // Indicateur spécifique CFA - vérification des actions d'insertion
    const formationsAvecInsertion = formations.filter((f: any) =>
      f.indicateurs?.tauxInsertion !== null || f.debouches
    );

    if (formationsAvecInsertion.length > 0) {
      preuves.push({
        type: "insertion",
        count: formationsAvecInsertion.length,
        description: "Actions d'insertion documentées",
      });
      score += 50;
    } else {
      problemes.push("Actions d'insertion non documentées");
      suggestions.push("Documentez vos actions favorisant l'insertion professionnelle");
    }

    // Sessions terminées avec entreprises
    const sessionsEntreprises = sessions.filter((s: any) =>
      s.clients && s.clients.some((c: any) => c.entrepriseId)
    );

    if (sessionsEntreprises.length > 0) {
      preuves.push({
        type: "partenariats",
        count: sessionsEntreprises.length,
        description: "Liens avec les entreprises",
      });
      score += 30;
    }
  } else {
    // Non applicable hors CFA
    preuves.push({
      type: "non_applicable",
      count: 1,
      description: "Indicateur spécifique CFA",
    });
    score = 80;
  }

  return Math.min(100, score);
}

// =====================================================
// CRITÈRE 7 - Appréciations et réclamations
// =====================================================

function analyserIndicateur30(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { evaluations } = data;

  // Vérifier les évaluations de satisfaction
  if (evaluations.length > 0) {
    preuves.push({
      type: "satisfaction",
      count: evaluations.length,
      description: "Évaluations de satisfaction envoyées",
    });
    score += 40;

    // Vérifier les évaluations complétées (avec réponse)
    // La note est dans e.reponse?.noteGlobale, pas directement sur e
    const evaluationsCompletes = evaluations.filter((e: any) =>
      e.status === "COMPLETED" || e.reponse?.noteGlobale
    );

    if (evaluationsCompletes.length > 0) {
      preuves.push({
        type: "reponses",
        count: evaluationsCompletes.length,
        description: "Évaluations complétées avec réponses",
      });
      score += 40;

      // Calculer et afficher le taux de satisfaction moyen
      const evaluationsAvecNote = evaluations.filter((e: any) => e.reponse?.noteGlobale);
      if (evaluationsAvecNote.length > 0) {
        const avgSatisfaction = evaluationsAvecNote.reduce((acc: number, e: any) =>
          acc + (e.reponse?.noteGlobale || 0), 0
        ) / evaluationsAvecNote.length;
        preuves.push({
          type: "taux_satisfaction",
          count: 1,
          description: `Taux de satisfaction moyen: ${avgSatisfaction.toFixed(1)}/10`,
        });
        score += 20;
      }
    }
  } else {
    problemes.push("Aucune évaluation de satisfaction");
    suggestions.push("Envoyez des questionnaires de satisfaction aux participants");
  }

  return Math.min(100, score);
}

function analyserIndicateur31(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { reclamations, organization } = data;

  // Vérifier la procédure de réclamation
  if (organization?.procedures?.some((p: any) => p.type === "RECLAMATIONS")) {
    preuves.push({ type: "procedure", count: 1, description: "Procédure réclamations" });
    score += 40;
  } else {
    problemes.push("Procédure de réclamation non formalisée");
    suggestions.push("Créez une procédure de gestion des réclamations");
  }

  // Vérifier le traitement des réclamations
  if (reclamations.length > 0) {
    preuves.push({
      type: "reclamation",
      count: reclamations.length,
      description: "Réclamations enregistrées",
    });

    const reclamationsTraitees = reclamations.filter((r: any) =>
      r.status === "RESOLUE" || r.status === "CLOTUREE"
    );

    if (reclamationsTraitees.length > 0) {
      preuves.push({
        type: "traitement",
        count: reclamationsTraitees.length,
        description: "Réclamations traitées",
      });
      score += 60;
    } else {
      score += 30;
      problemes.push("Réclamations non traitées");
    }
  } else {
    // Pas de réclamation = ok si procédure existe
    if (score > 0) {
      score += 60;
    }
  }

  return Math.min(100, score);
}

function analyserIndicateur32(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { ameliorations, evaluations } = data;

  // Vérifier les actions d'amélioration
  if (ameliorations.length > 0) {
    preuves.push({
      type: "amelioration",
      count: ameliorations.length,
      description: "Actions d'amélioration",
    });

    const ameliorationsRealisees = ameliorations.filter((a: any) =>
      a.status === "REALISEE" || a.status === "TERMINEE"
    );

    if (ameliorationsRealisees.length > 0) {
      preuves.push({
        type: "realisation",
        count: ameliorationsRealisees.length,
        description: "Améliorations réalisées",
      });
      score += 70;
    } else {
      score += 40;
    }
  } else {
    problemes.push("Aucune action d'amélioration enregistrée");
    suggestions.push("Créez des actions d'amélioration basées sur les retours");
  }

  // Vérifier l'analyse des évaluations
  if (evaluations.length > 0) {
    score += 30;
  }

  return Math.min(100, score);
}

// ===========================================
// CALCUL DES SCORES
// ===========================================

function calculerScores(analyses: AnalyseIndicateur[]): ConformiteScore {
  const scoreParCritere = CRITERES_QUALIOPI.map((critere) => {
    const indicateursCritere = analyses.filter((a) => a.critere === critere.numero);
    const indicateursConformes = indicateursCritere.filter(
      (a) => a.status === "CONFORME"
    ).length;
    const scoreTotal = indicateursCritere.reduce((acc, a) => acc + a.score, 0);
    const scoreMoyen = indicateursCritere.length > 0
      ? scoreTotal / indicateursCritere.length
      : 0;

    return {
      critere: critere.numero,
      titre: critere.titre,
      score: Math.round(scoreMoyen),
      indicateursConformes,
      indicateursTotal: indicateursCritere.length,
    };
  });

  const indicateursConformes = analyses.filter(
    (a) => a.status === "CONFORME"
  ).length;

  const scoreGlobal = analyses.length > 0
    ? Math.round(analyses.reduce((acc, a) => acc + a.score, 0) / analyses.length)
    : 0;

  return {
    scoreGlobal,
    indicateursConformes,
    indicateursTotal: analyses.length,
    scoreParCritere,
  };
}

// ===========================================
// INITIALISATION DES INDICATEURS
// ===========================================

export async function initialiserIndicateursOrganisation(
  organizationId: string
): Promise<void> {
  // Vérifier si les indicateurs existent déjà
  const existingCount = await prisma.indicateurConformite.count({
    where: { organizationId },
  });

  if (existingCount === 32) {
    return; // Déjà initialisés
  }

  // Supprimer les anciens si partiels
  if (existingCount > 0) {
    await prisma.indicateurConformite.deleteMany({
      where: { organizationId },
    });
  }

  // Créer les 32 indicateurs
  await prisma.indicateurConformite.createMany({
    data: INDICATEURS_QUALIOPI.map((ind) => ({
      organizationId,
      numeroIndicateur: ind.numero,
      critere: ind.critere,
      libelle: ind.libelle,
      description: ind.description,
      status: "A_EVALUER",
      score: 0,
    })),
  });
}

// ===========================================
// MISE À JOUR DES INDICATEURS
// ===========================================

export async function mettreAJourIndicateurs(
  organizationId: string
): Promise<void> {
  const { analyses } = await analyserConformiteOrganisation(organizationId);

  // Mettre à jour chaque indicateur
  for (const analyse of analyses) {
    await prisma.indicateurConformite.upsert({
      where: {
        organizationId_numeroIndicateur: {
          organizationId,
          numeroIndicateur: analyse.numero,
        },
      },
      update: {
        status: analyse.status,
        score: analyse.score,
        derniereEvaluation: new Date(),
      },
      create: {
        organizationId,
        numeroIndicateur: analyse.numero,
        critere: analyse.critere,
        libelle: analyse.libelle,
        status: analyse.status,
        score: analyse.score,
        derniereEvaluation: new Date(),
      },
    });
  }
}
