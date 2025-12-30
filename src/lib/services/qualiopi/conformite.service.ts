// ===========================================
// SERVICE D'ANALYSE DE CONFORMITÉ QUALIOPI
// ===========================================

import { prisma } from "@/lib/db/prisma";
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
  // Récupérer les données de l'organisation
  const [
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
  ] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        procedures: true,
      },
    }),
    prisma.formation.findMany({
      where: { organizationId },
      include: {
        modules: true,
        evaluations: true,
      },
    }),
    prisma.session.findMany({
      where: { organizationId },
      include: {
        clients: true,
        journees: true,
      },
    }),
    prisma.apprenant.findMany({
      where: { organizationId },
    }),
    prisma.intervenant.findMany({
      where: { organizationId },
    }),
    prisma.document.findMany({
      where: { formation: { organizationId } },
    }),
    prisma.evaluationSatisfaction.findMany({
      where: { organizationId },
    }),
    prisma.reclamation.findMany({
      where: { organizationId },
    }),
    prisma.actionAmelioration.findMany({
      where: { organizationId },
    }),
    prisma.veilleSource.findMany({
      where: { organizationId },
    }),
  ]);

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
    case 1: // Information sur les prestations
      score = analyserIndicateur1(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 2: // Indicateurs de résultats
      score = analyserIndicateur2(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 4: // Analyse du besoin
      score = analyserIndicateur4(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 9: // Information des publics
      score = analyserIndicateur9(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 11: // Évaluation de l'atteinte des objectifs
      score = analyserIndicateur11(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 17: // Moyens humains et techniques
      score = analyserIndicateur17(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 22: // Compétences des intervenants
      score = analyserIndicateur22(data, preuvesTrouvees, problemes, suggestions);
      break;
    case 24: // Veille légale et réglementaire
      score = analyserIndicateur24(data, preuvesTrouvees, problemes, suggestions);
      break;
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
      // Pour les autres indicateurs, score par défaut basé sur la présence de données
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

  // Vérifier les formations
  const formationsCompletes = formations.filter((f: any) =>
    f.objectifs && f.prerequis && f.duree && f.modalite
  );

  if (formationsCompletes.length > 0) {
    preuves.push({
      type: "formation",
      count: formationsCompletes.length,
      description: "Formations avec informations complètes",
    });
    score += Math.min(50, (formationsCompletes.length / formations.length) * 50);
  } else if (formations.length > 0) {
    problemes.push("Formations incomplètes (objectifs, prérequis, durée)");
    suggestions.push("Complétez les informations des formations");
  }

  // Vérifier le certificat Qualiopi
  if (organization?.certificatQualiopiUrl) {
    preuves.push({ type: "certification", count: 1, description: "Certificat Qualiopi" });
    score += 15;
  }

  // Accessibilité handicap
  if (organization?.procedures?.some((p: any) => p.type === "ACCESSIBILITE")) {
    preuves.push({ type: "accessibilite", count: 1, description: "Procédure accessibilité" });
    score += 10;
  } else {
    suggestions.push("Ajoutez une procédure d'accessibilité handicap");
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
    const avgSatisfaction = evaluations.reduce((acc: number, e: any) =>
      acc + (e.noteGlobale || 0), 0) / evaluations.length;
    if (avgSatisfaction > 0) {
      preuves.push({
        type: "satisfaction",
        count: 1,
        description: `Taux de satisfaction moyen: ${avgSatisfaction.toFixed(1)}/5`,
      });
      score += 20;
    }
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

  // Vérifier le positionnement des apprenants
  const apprenantsAvecPositionnement = apprenants.filter((a: any) =>
    a.objectifs || a.contexte
  );

  if (apprenantsAvecPositionnement.length > 0) {
    preuves.push({
      type: "positionnement",
      count: apprenantsAvecPositionnement.length,
      description: "Apprenants avec analyse du besoin",
    });
    score += 60;
  } else if (apprenants.length > 0) {
    problemes.push("Analyse du besoin non documentée pour les apprenants");
    suggestions.push("Documentez l'analyse du besoin à l'inscription");
  }

  // Vérifier les clients inscrits aux sessions
  const clientsInscrits = sessions.flatMap((s: any) => s.clients || []);
  if (clientsInscrits.length > 0) {
    preuves.push({
      type: "inscription",
      count: clientsInscrits.length,
      description: "Inscriptions formalisées",
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

function analyserIndicateur22(
  data: any,
  preuves: any[],
  problemes: string[],
  suggestions: string[]
): number {
  let score = 0;
  const { intervenants } = data;

  // Vérifier les CV et compétences des intervenants
  const intervenantsComplets = intervenants.filter((i: any) =>
    i.competences || i.cv || i.diplomes
  );

  if (intervenantsComplets.length > 0) {
    preuves.push({
      type: "cv",
      count: intervenantsComplets.length,
      description: "Intervenants avec CV/compétences",
    });
    score += 60;
  } else if (intervenants.length > 0) {
    problemes.push("CV ou compétences non renseignés pour les intervenants");
    suggestions.push("Complétez les fiches des intervenants");
  }

  // Vérifier les diplômes
  const intervenantsAvecDiplomes = intervenants.filter((i: any) => i.diplomes);
  if (intervenantsAvecDiplomes.length > 0) {
    preuves.push({
      type: "diplome",
      count: intervenantsAvecDiplomes.length,
      description: "Diplômes documentés",
    });
    score += 40;
  }

  return Math.min(100, score);
}

function analyserIndicateur24(
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
    score += 70;
  } else {
    problemes.push("Aucune source de veille configurée");
    suggestions.push("Configurez des sources de veille réglementaire");
  }

  // Vérifier les sources actives
  const sourcesActives = veilleSources.filter((s: any) => s.estActive);
  if (sourcesActives.length > 0) {
    preuves.push({
      type: "veille_active",
      count: sourcesActives.length,
      description: "Sources de veille actives",
    });
    score += 30;
  }

  return Math.min(100, score);
}

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
      description: "Évaluations de satisfaction",
    });
    score += 80;

    // Bonus si taux de réponse élevé
    const evaluationsCompletes = evaluations.filter((e: any) => e.noteGlobale);
    if (evaluationsCompletes.length > evaluations.length * 0.5) {
      score += 20;
    }
  } else {
    problemes.push("Aucune évaluation de satisfaction");
    suggestions.push("Mettez en place des questionnaires de satisfaction");
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
