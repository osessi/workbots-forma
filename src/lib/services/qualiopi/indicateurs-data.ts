// ===========================================
// DONNÉES DE RÉFÉRENCE QUALIOPI - 32 INDICATEURS
// Basé sur le Référentiel National Qualité V9 - Janvier 2024
// ===========================================

export type TypePrestataire = "OF" | "CFA" | "CBC" | "VAE";
export type TypeNonConformite = "mineure" | "majeure";

export interface IndicateurQualiopi {
  numero: number;
  critere: number;
  libelle: string;
  description: string;
  // Niveau attendu selon le RNQ V9
  niveauAttendu: string;
  // Type de non-conformité possible
  nonConformite: {
    type: TypeNonConformite;
    gradation?: boolean; // Si true, peut être mineure ou majeure
    descriptionMineure?: string;
  };
  // Exigences détaillées
  exigences: string[];
  // Exemples de preuves du RNQ V9
  preuvesAttendues: string[];
  // Obligations spécifiques par type de prestataire
  obligationsSpecifiques?: {
    type: TypePrestataire;
    description: string;
  }[];
  // Applicabilité par type de prestataire
  applicabilite: {
    OF: boolean;
    CFA: boolean;
    CBC: boolean;
    VAE: boolean;
    nouveauxEntrants?: string; // Précisions pour nouveaux entrants
  };
  // Sous-traitance
  sousTraitance?: string;
  // Sources de données dans l'application
  sourcesVerification: {
    type: string;
    champs?: string[];
    description: string;
  }[];
}

// Les 7 critères Qualiopi (RNQ V9)
export const CRITERES_QUALIOPI = [
  {
    numero: 1,
    titre: "Conditions d'information du public",
    description:
      "Les conditions d'information du public sur les prestations proposées, les délais pour y accéder et les résultats obtenus",
    indicateurs: [1, 2, 3],
  },
  {
    numero: 2,
    titre: "Identification précise des objectifs",
    description:
      "L'identification précise des objectifs des prestations proposées et l'adaptation de ces prestations aux publics bénéficiaires lors de la conception des prestations",
    indicateurs: [4, 5, 6, 7, 8],
  },
  {
    numero: 3,
    titre: "Adaptation aux publics bénéficiaires",
    description:
      "L'adaptation aux publics bénéficiaires des prestations et des modalités d'accueil, d'accompagnement, de suivi et d'évaluation mises en œuvre",
    indicateurs: [9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    numero: 4,
    titre: "Adéquation des moyens pédagogiques",
    description:
      "L'adéquation des moyens pédagogiques, techniques et d'encadrement aux prestations mises en œuvre",
    indicateurs: [17, 18, 19, 20],
  },
  {
    numero: 5,
    titre: "Qualification et développement des compétences",
    description:
      "La qualification et le développement des connaissances et compétences des personnels chargés de mettre en œuvre les prestations",
    indicateurs: [21, 22],
  },
  {
    numero: 6,
    titre: "Inscription dans son environnement professionnel",
    description:
      "L'inscription et l'investissement du prestataire dans son environnement professionnel",
    indicateurs: [23, 24, 25, 26, 27, 28, 29],
  },
  {
    numero: 7,
    titre: "Recueil et prise en compte des appréciations",
    description:
      "Le recueil et la prise en compte des appréciations et des réclamations formulées par les parties prenantes aux prestations délivrées",
    indicateurs: [30, 31, 32],
  },
];

// Les 32 indicateurs Qualiopi détaillés selon le RNQ V9
export const INDICATEURS_QUALIOPI: IndicateurQualiopi[] = [
  // =====================================================
  // CRITÈRE 1 - Conditions d'information du public
  // =====================================================
  {
    numero: 1,
    critere: 1,
    libelle: "Information sur les prestations",
    description:
      "Le prestataire diffuse une information accessible au public, détaillée et vérifiable sur les prestations proposées : prérequis, objectifs, durée, modalités et délais d'accès, tarifs, contacts, méthodes mobilisées et modalités d'évaluation, accessibilité aux personnes handicapées.",
    niveauAttendu:
      "Donner une information accessible, exhaustive sur la prestation, c'est-à-dire sur son contenu et sur l'intégralité des items mentionnés. Cette information doit être à jour.",
    nonConformite: {
      type: "mineure",
      gradation: true,
      descriptionMineure:
        "Information partiellement accessible ou absence ponctuelle et non répétitive de certains items dans la communication.",
    },
    exigences: [
      "Prérequis clairement indiqués (ou mention 'aucun prérequis')",
      "Objectifs de la formation définis",
      "Durée totale précisée (en heures ou jours)",
      "Modalités et délais d'accès communiqués",
      "Tarifs affichés",
      "Contacts identifiés",
      "Méthodes pédagogiques mobilisées décrites",
      "Modalités d'évaluation précisées",
      "Accessibilité aux personnes handicapées mentionnée",
      "Information diffusée en amont de la contractualisation",
    ],
    preuvesAttendues: [
      "Tous supports et outils d'information (plaquette, réseaux sociaux, sites internet, supports de publicité, salons)",
      "Supports de contractualisation",
      "Conditions générales de vente",
      "Pour les PSH : supports de présentation de la politique d'accessibilité, conditions d'accès",
    ],
    obligationsSpecifiques: [
      {
        type: "VAE",
        description:
          "Les contraintes et exigences de la démarche sont clairement formalisées et communiquées, notamment les modalités d'instruction et de faisabilité.",
      },
      {
        type: "CBC",
        description: "Les prérequis n'ont pas à être mentionnés.",
      },
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
    },
    sousTraitance:
      "L'indicateur n'est pas applicable car l'information doit être réalisée par le donneur d'ordres.",
    sourcesVerification: [
      {
        type: "formation",
        champs: [
          "prerequis",
          "objectifs",
          "duree",
          "modalite",
          "tarif",
          "methodePedagogique",
          "modaliteEvaluation",
          "accessibiliteHandicap",
        ],
        description: "Vérifier que chaque formation a ses champs remplis",
      },
      {
        type: "fichePedagogique",
        champs: [
          "objectifs",
          "prerequis",
          "publicVise",
          "methodePedagogique",
          "modaliteEvaluation",
          "delaiAcces",
        ],
        description: "Vérifier la fiche pédagogique complète",
      },
      {
        type: "organization",
        champs: ["catalogueActif", "siteWeb", "email", "telephone"],
        description: "Vérifier les informations de l'organisme",
      },
    ],
  },
  {
    numero: 2,
    critere: 1,
    libelle: "Indicateurs de résultats",
    description:
      "Le prestataire diffuse des indicateurs de résultats adaptés à la nature des prestations mises en œuvre et des publics accueillis.",
    niveauAttendu:
      "Donner une information chiffrée permettant de suivre les résultats de la prestation au regard des objectifs.",
    nonConformite: {
      type: "mineure",
      gradation: true,
      descriptionMineure: "Information insuffisamment détaillée.",
    },
    exigences: [
      "Taux de satisfaction des stagiaires",
      "Nombre de stagiaires",
      "Taux et causes des abandons",
      "Taux de retour des enquêtes",
      "Taux d'interruption en cours de prestation",
      "Taux d'insertion dans l'emploi",
      "Indicateurs mis à jour régulièrement",
    ],
    preuvesAttendues: [
      "Tous supports et outils d'information",
      "Rapports d'activités",
      "Bilans",
      "Résultats d'enquêtes",
      "Indicateurs de performance",
    ],
    obligationsSpecifiques: [
      {
        type: "CFA",
        description:
          "Les indicateurs de résultats obligatoires sont ceux cités à l'article L. 6111-8 du code du travail (Inserjeunes). Le CFA informe de la mise à disposition de ces indicateurs sur le site de diffusion.",
      },
      {
        type: "CBC",
        description:
          "Nombre de bénéficiaires en début et en fin d'accompagnement, taux de réalisation des entretiens de suivi à six mois, nature et nombre d'enquêtes-terrain réalisées.",
      },
      {
        type: "VAE",
        description:
          "Nombre de candidats accompagnés, taux de réussite globale, taux de réussite sur les diplômes les plus demandés (validation totale, partielle), taux de satisfaction des clients.",
      },
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
      nouveauxEntrants:
        "Des indicateurs sont pré-identifiés au moment de l'audit initial et sont audités au moment de l'audit de surveillance.",
    },
    sousTraitance:
      "L'indicateur n'est pas applicable car la diffusion des indicateurs doit être réalisée par le donneur d'ordres.",
    sourcesVerification: [
      {
        type: "evaluationSatisfaction",
        description: "Calculer les taux de satisfaction et réussite",
      },
      {
        type: "session",
        champs: ["tauxPresence", "tauxReussite", "tauxAbandon"],
        description: "Analyser les résultats par session",
      },
      {
        type: "statistiques",
        description: "Vérifier les statistiques globales diffusées",
      },
    ],
  },
  {
    numero: 3,
    critere: 1,
    libelle: "Obtention des certifications",
    description:
      "Lorsque le prestataire met en œuvre des prestations conduisant à une certification professionnelle, il informe sur les taux d'obtention des certifications préparées, les possibilités de valider un/ou des blocs de compétences, ainsi que sur les équivalences, passerelles, suites de parcours et les débouchés.",
    niveauAttendu:
      "Donner au public une information accessible, exhaustive (c'est-à-dire sur l'intégralité des items mentionnés) et actualisée (informations à jour).",
    nonConformite: {
      type: "mineure",
      gradation: true,
      descriptionMineure:
        "Information partiellement accessible ou absence ponctuelle et non répétitive de certains items (à l'exclusion du taux d'obtention de la certification).",
    },
    exigences: [
      "Taux d'obtention des certifications préparées",
      "Taux de présentation à l'examen",
      "Information sur les blocs de compétences",
      "Équivalences documentées",
      "Passerelles identifiées",
      "Suites de parcours possibles",
      "Débouchés professionnels (taux d'insertion global et dans le métier visé)",
    ],
    preuvesAttendues: [
      "Tous supports et outils d'information : plaquette, réseaux sociaux, sites internet, supports publicité, salons",
      "Supports de contractualisation",
      "Taux d'obtention d'une certification pour les formations certifiantes",
      "Trajectoires d'évolution des bénéficiaires à l'issue de la prestation",
      "Fiches RNCP/RS référencées",
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: false,
      VAE: true,
      nouveauxEntrants:
        "La communication sur les taux d'obtention des certifications est auditée lors de l'audit de surveillance.",
    },
    sousTraitance:
      "L'indicateur n'est pas applicable car l'information doit être réalisée par le donneur d'ordres.",
    sourcesVerification: [
      {
        type: "formation",
        champs: [
          "certificationRncp",
          "codeRncp",
          "codeRs",
          "blocCompetences",
          "passerelles",
          "debouches",
        ],
        description: "Vérifier les informations des formations certifiantes",
      },
      {
        type: "certification",
        champs: ["tauxObtention", "tauxPresentation"],
        description: "Statistiques de certification",
      },
    ],
  },

  // =====================================================
  // CRITÈRE 2 - Identification précise des objectifs
  // =====================================================
  {
    numero: 4,
    critere: 2,
    libelle: "Analyse du besoin",
    description:
      "Le prestataire analyse le besoin du bénéficiaire en lien avec l'entreprise et/ou le financeur concerné(s).",
    niveauAttendu:
      "Démontrer comment le besoin du bénéficiaire est analysé en fonction de la finalité de la prestation.",
    nonConformite: {
      type: "majeure",
      gradation: false,
    },
    exigences: [
      "Entretien préalable documenté ou analyse formalisée",
      "Grilles d'analyse des besoins",
      "Diagnostics préalables",
      "Dossiers d'admission",
      "Comptes rendus d'entretiens",
      "Critères de détermination de l'opportunité et de la faisabilité de la prestation",
      "Prise en compte du contexte professionnel",
    ],
    preuvesAttendues: [
      "Tout support synthétisant les besoins identifiés du bénéficiaire ou d'un groupe de bénéficiaires",
      "Grilles d'analyse",
      "Diagnostics préalables",
      "Dossiers d'admission",
      "Comptes rendus d'entretiens",
    ],
    obligationsSpecifiques: [
      {
        type: "CFA",
        description:
          "L'analyse est prévue en amont du processus de contractualisation alternant/entreprise. Elle peut être complétée au début du parcours. Elle intègre la vérification des missions proposées par l'entreprise avec le diplôme ou la certification visé.",
      },
      {
        type: "CBC",
        description:
          "L'outil utilisé dans le cadre de la phase préliminaire (ex: grille APS) doit déboucher sur la co-construction d'un programme personnalisé avec le bénéficiaire.",
      },
      {
        type: "VAE",
        description:
          "Contractualisation de l'accompagnement décrivant notamment la méthode, les modalités individuelles et collectives, ainsi que l'échéancier de la mise en œuvre.",
      },
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
    },
    sourcesVerification: [
      {
        type: "apprenant",
        champs: [
          "notes",
          "situationActuelle",
          "objectifFormation",
          "analyseBesoins",
        ],
        description: "Vérifier l'analyse des besoins des apprenants",
      },
      {
        type: "apprenantNote",
        description: "Historique des notes et analyses",
      },
      {
        type: "inscription",
        champs: ["analyseBesoins", "entretienPrealable"],
        description: "Vérifier l'analyse du besoin à l'inscription",
      },
    ],
  },
  {
    numero: 5,
    critere: 2,
    libelle: "Objectifs opérationnels",
    description:
      "Le prestataire définit les objectifs opérationnels et évaluables de la prestation.",
    niveauAttendu:
      "Démontrer que les objectifs spécifiques à la prestation ont été définis et peuvent faire l'objet d'une évaluation.",
    nonConformite: {
      type: "majeure",
      gradation: false,
    },
    exigences: [
      "Objectifs opérationnels identifiés (observables et mesurables)",
      "Compétences visées par la prestation identifiées",
      "Objectifs pédagogiques intermédiaires et finaux définis",
      "Indicateurs de suivi et de résultats existants",
      "Référentiel de la certification (si applicable)",
    ],
    preuvesAttendues: [
      "Tous supports et outils d'analyse",
      "Existence d'indicateurs de suivi et de résultats",
      "Supports de contractualisation",
      "Identification des compétences visées par la prestation",
      "Objectifs pédagogiques intermédiaires et finaux",
      "Référentiel de la certification",
    ],
    obligationsSpecifiques: [
      {
        type: "CFA",
        description:
          "Ces objectifs doivent être exprimés en compétences et/ou capacités professionnelles à acquérir et/ou en certifications visées.",
      },
      {
        type: "CBC",
        description:
          "Il existe des outils et grilles utilisés pour codéfinir les objectifs en phase préliminaire et des documents de synthèse. Il peut s'agir d'objectifs en lien avec le développement des compétences à s'orienter.",
      },
      {
        type: "VAE",
        description:
          "L'accompagnement est contractualisé et énonce les engagements respectifs du bénéficiaire et de l'accompagnateur.",
      },
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
    },
    sousTraitance:
      "Le prestataire démontre qu'il tient compte des objectifs définis par le donneur d'ordres.",
    sourcesVerification: [
      {
        type: "formation",
        champs: ["objectifs", "competencesVisees", "objectifsPedagogiques"],
        description: "Vérifier les objectifs des formations",
      },
      {
        type: "module",
        champs: ["objectifs", "competences"],
        description: "Vérifier les objectifs par module",
      },
      {
        type: "evaluation",
        description: "Vérifier que les objectifs peuvent être évalués",
      },
    ],
  },
  {
    numero: 6,
    critere: 2,
    libelle: "Contenus et modalités",
    description:
      "Le prestataire établit les contenus et les modalités de mise en œuvre de la prestation, adaptés aux objectifs définis et aux publics bénéficiaires.",
    niveauAttendu:
      "Démontrer que les contenus et modalités de mise en œuvre des prestations sont adaptés aux objectifs définis en fonction des bénéficiaires.",
    nonConformite: {
      type: "majeure",
      gradation: false,
    },
    exigences: [
      "Parcours, déroulés et séquences structurés",
      "Grilles et modalités d'évaluation définies",
      "Modalités techniques et pédagogiques d'accompagnement (présentiel, distance, mixte)",
      "Programme détaillé avec durée et calendrier",
      "Adaptation au public cible documentée",
    ],
    preuvesAttendues: [
      "Parcours, déroulés et séquences",
      "Grilles et modalités d'évaluation",
      "Modalités techniques et pédagogiques d'accompagnement : présentiel, à distance ou en mixte (blended learning, synchrone ou asynchrone)",
      "Supports de contractualisation, de réalisation",
      "Modalités de mise en œuvre",
      "Référentiels des diplômes",
      "Guide pratique du déroulé de la prestation avec durée et calendrier",
      "Pour les PSH : accessibilité ou possibilités d'adaptation des modalités proposées",
    ],
    obligationsSpecifiques: [
      {
        type: "VAE",
        description:
          "Ateliers collectifs d'explicitation de l'expérience prévus.",
      },
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
    },
    sourcesVerification: [
      {
        type: "formation",
        champs: [
          "programme",
          "modalites",
          "publicCible",
          "modalitePedagogique",
          "duree",
        ],
        description: "Vérifier les contenus des formations",
      },
      {
        type: "fichePedagogique",
        champs: ["contenu", "deroulement", "calendrier", "modalites"],
        description: "Vérifier la fiche pédagogique",
      },
    ],
  },
  {
    numero: 7,
    critere: 2,
    libelle: "Adéquation contenus/certification",
    description:
      "Lorsque le prestataire met en œuvre des prestations conduisant à une certification professionnelle, il s'assure de l'adéquation du ou des contenus de la prestation aux exigences de la certification visée.",
    niveauAttendu:
      "Démontrer l'adéquation du contenu aux compétences ciblées et aux épreuves d'évaluation de la certification.",
    nonConformite: {
      type: "majeure",
      gradation: false,
    },
    exigences: [
      "Référentiel de certification analysé",
      "Correspondance contenus/référentiel établie",
      "Habilitation du prestataire à former à la certification (si applicable)",
      "Convention de partenariat avec le certificateur (si applicable)",
      "Prestation conforme au référentiel d'activité, de compétences et d'évaluation",
    ],
    preuvesAttendues: [
      "Présentation de l'offre de formation en cohérence avec le référentiel de la certification",
      "Habilitation du prestataire à former à une certification professionnelle",
      "Convention de partenariat avec le certificateur",
      "Tableau croisé du contenu de la formation et du référentiel de compétences",
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: false,
      VAE: false,
    },
    sousTraitance:
      "L'organisme certificateur tient compte des missions confiées pour l'appréciation de cet indicateur.",
    sourcesVerification: [
      {
        type: "formation",
        champs: [
          "certificationRncp",
          "codeRncp",
          "referentielCompetences",
          "habilitation",
        ],
        description: "Vérifier l'adéquation aux certifications",
      },
      {
        type: "module",
        champs: ["competencesCiblees"],
        description: "Vérifier la correspondance modules/compétences",
      },
    ],
  },
  {
    numero: 8,
    critere: 2,
    libelle: "Procédures de positionnement",
    description:
      "Le prestataire détermine les procédures de positionnement et d'évaluation des acquis à l'entrée de la prestation.",
    niveauAttendu:
      "Démontrer l'existence de procédures de positionnement et d'évaluation des acquis à l'entrée de la prestation adaptée aux publics et modalités de formations.",
    nonConformite: {
      type: "mineure",
      gradation: true,
      descriptionMineure: "Dispositif existant mais incomplet.",
    },
    exigences: [
      "Diagnostic préalable ou entretien",
      "Évaluation des acquis à l'entrée (quizz, QCM, exercices, mise en situation, test)",
      "Outils de mesure des écarts en termes de compétences",
      "Auto-positionnement disponible",
      "Procédures de positionnement et/ou conditions d'accès définies",
    ],
    preuvesAttendues: [
      "Diagnostic préalable",
      "Entretien",
      "Évaluation des acquis à l'entrée (quizz, QCM, exercices, mise en situation, test)",
      "Outils de mesure des écarts en termes de compétences à acquérir ou à faire valider",
      "Auto-positionnement",
      "Procédures de positionnement et/ou conditions d'accès",
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: false,
      VAE: false,
    },
    sourcesVerification: [
      {
        type: "evaluation",
        champs: ["type", "typeEvaluation"],
        description: "Vérifier les évaluations de positionnement",
      },
      {
        type: "formation",
        champs: ["prerequis", "testPositionnement"],
        description: "Vérifier les procédures de positionnement",
      },
    ],
  },

  // =====================================================
  // CRITÈRE 3 - Adaptation aux publics bénéficiaires
  // =====================================================
  {
    numero: 9,
    critere: 3,
    libelle: "Information des publics",
    description:
      "Le prestataire informe les publics bénéficiaires des conditions de déroulement de la prestation.",
    niveauAttendu:
      "Les modalités d'accueil et les conditions de déroulement de la prestation sont formalisées et diffusées.",
    nonConformite: {
      type: "mineure",
      gradation: true,
      descriptionMineure: "Information incomplète.",
    },
    exigences: [
      "Règlement intérieur communiqué",
      "Livret d'accueil fourni",
      "Convocation avec informations pratiques",
      "Conditions générales d'utilisation (CGU) pour FOAD",
      "Noms des référents pédagogiques et administratifs communiqués",
      "Informations sur les aspects périphériques (hébergement, restauration, transport, rémunération)",
      "Modalités d'accès, de suivi et d'accompagnement des PSH",
    ],
    preuvesAttendues: [
      "Règlement intérieur",
      "Livret d'accueil",
      "Convocation",
      "Conditions générales d'utilisation (CGU)",
      "Noms des référents pédagogiques et administratifs",
      "Organigramme",
      "Pour la FOAD : modalités d'accès au LMS, assistance technique et pédagogique, modalités de réalisation des séquences à distance",
    ],
    obligationsSpecifiques: [
      {
        type: "CBC",
        description:
          "Le prestataire informe sur les engagements déontologiques prévus à l'article L. 6313-4 du code du travail (respect du consentement, confidentialité).",
      },
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
    },
    sousTraitance:
      "L'organisme certificateur tient compte des missions confiées pour l'appréciation de cet indicateur.",
    sourcesVerification: [
      {
        type: "document",
        champs: ["type", "typeDocument"],
        description:
          "Vérifier les documents d'accueil (règlement intérieur, livret d'accueil, convocations)",
      },
      {
        type: "organization",
        champs: ["reglementInterieur", "livretAccueil"],
        description: "Vérifier les documents organisationnels",
      },
    ],
  },
  {
    numero: 10,
    critere: 3,
    libelle: "Adaptation de la prestation",
    description:
      "Le prestataire met en œuvre et adapte la prestation, l'accompagnement et le suivi aux publics bénéficiaires.",
    niveauAttendu:
      "La prestation est adaptée aux situations et profils des bénéficiaires, lorsque l'analyse du besoin en établit la nécessité : contenus (outils et méthodes), accompagnement, suivi (durées, emplois du temps, adaptation des rythmes).",
    nonConformite: {
      type: "majeure",
      gradation: false,
    },
    exigences: [
      "Individualisation des parcours quand nécessaire",
      "Accompagnement personnalisé",
      "Suivi régulier documenté",
      "Adaptation des durées et contenus",
      "Livret de suivi pédagogique (centre/entreprise)",
      "Séquences d'accompagnements et/ou de médiation",
    ],
    preuvesAttendues: [
      "Durées et contenus des prestations",
      "Emplois du temps",
      "Inscription aux modules de formation en fonction du profil du bénéficiaire",
      "Groupes de niveaux",
      "Entretiens",
      "Fonction dédiée (référent pédagogique)",
      "Livret de suivi pédagogique (centre/entreprise)",
      "Séquences d'accompagnements et/ou de médiation",
      "Traçabilité de l'accompagnement technique et pédagogique",
      "Pour les PSH : liste de structures/personnes ressources, modalités d'aménagement, plans individuels de compensation",
    ],
    obligationsSpecifiques: [
      {
        type: "CFA",
        description:
          "Le prestataire met en œuvre les dispositions de la loi relatives aux obligations des CFA pour l'accompagnement des apprentis (missions mentionnées aux 1°, 2° et 11° de l'article L. 6231-2 du code du travail).",
      },
      {
        type: "VAE",
        description:
          "Le prestataire met en œuvre les phases individuelles et/ou collectives et adapte la durée et les modalités d'accompagnement en fonction du bénéficiaire.",
      },
      {
        type: "CBC",
        description:
          "La convention de prestation précise la durée, le coût, le planning prévisionnel, la description des trois étapes du bilan de compétences, la description des moyens, outils, méthodes, modalités pédagogiques et postures utilisés.",
      },
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
    },
    sourcesVerification: [
      {
        type: "session",
        champs: ["emploiDuTemps", "adaptations"],
        description: "Vérifier le suivi des sessions",
      },
      {
        type: "apprenant",
        champs: ["notes", "suiviIndividuel", "adaptations", "accompagnement"],
        description: "Vérifier le suivi des apprenants",
      },
    ],
  },
  {
    numero: 11,
    critere: 3,
    libelle: "Évaluation de l'atteinte des objectifs",
    description:
      "Le prestataire évalue l'atteinte par les publics bénéficiaires des objectifs de la prestation.",
    niveauAttendu:
      "Démontrer qu'un processus d'évaluation existe, est formalisé et mis en œuvre. Il permet d'apprécier l'atteinte des objectifs.",
    nonConformite: {
      type: "majeure",
      gradation: false,
    },
    exigences: [
      "Outils d'évaluation des acquis en cours et en fin de prestation (à chaud et à froid)",
      "Outils d'auto-évaluation mis à la disposition des bénéficiaires",
      "Bilans intermédiaires réalisés",
      "Comptes-rendus disponibles",
      "Résultats communiqués aux bénéficiaires",
    ],
    preuvesAttendues: [
      "Outils d'évaluation des acquis en cours et en fin de prestation (à chaud et à froid)",
      "Outils d'auto-évaluation mis à la disposition des bénéficiaires",
      "Bilans intermédiaires",
      "Comptes-rendus",
      "Taux de réussite aux certifications professionnelles et concours",
      "Livret de compétences",
      "Preuve de délivrance de la certification",
      "Livrets de suivi en entreprise",
    ],
    obligationsSpecifiques: [
      {
        type: "VAE",
        description:
          "Dossier de suivi du candidat permettant d'apprécier la progression du bénéficiaire tout au long de la prestation au regard des objectifs.",
      },
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
      nouveauxEntrants:
        "Un processus d'évaluation existe et est formalisé. Sa mise en œuvre sera auditée lors de l'audit de surveillance.",
    },
    sourcesVerification: [
      {
        type: "evaluation",
        champs: ["type", "resultat", "dateEvaluation"],
        description: "Vérifier les évaluations réalisées",
      },
      {
        type: "document",
        champs: ["type"],
        description:
          "Vérifier les attestations et bilans générés (attestation de fin de formation)",
      },
    ],
  },
  {
    numero: 12,
    critere: 3,
    libelle: "Engagement des bénéficiaires",
    description:
      "Le prestataire décrit et met en œuvre les mesures pour favoriser l'engagement des bénéficiaires et prévenir les ruptures de parcours.",
    niveauAttendu:
      "Démontrer que des mesures formalisées existent et sont mises en œuvre.",
    nonConformite: {
      type: "mineure",
      gradation: true,
      descriptionMineure: "Mise en œuvre partielle des mesures définies.",
    },
    exigences: [
      "Procédure de gestion des abandons et de relance systématique",
      "Suivi de l'assiduité",
      "Outils et méthodes favorisant l'implication du bénéficiaire",
      "Variété des modalités pédagogiques",
      "Outils pédagogiques favorisant l'interactivité et la participation",
      "Mesures de prévention des abandons pour les PSH",
    ],
    preuvesAttendues: [
      "Procédure de gestion des abandons et de relance systématique",
      "Listing de relances téléphoniques",
      "Carnet de rendez-vous",
      "Outils et méthodes favorisant l'implication du bénéficiaire (documents co-construits, espaces partagés)",
      "Plateforme pédagogique",
      "Variété des modalités pédagogiques",
      "Pour les alternants : contacts/visites avec l'entreprise, organisation de rencontres, modalités d'accompagnement pour détecter et prévenir les risques d'abandon",
    ],
    obligationsSpecifiques: [
      {
        type: "CFA",
        description:
          "Le prestataire apporte, en lien avec le Service Public de l'Emploi (missions prévues aux 5°, 6° et 13° de l'article L. 6231-2), un accompagnement pour : prévenir ou résoudre les difficultés d'ordre social et matériel, orienter les apprentis ayant interrompu leur formation, aider activement dans la recherche d'une autre entreprise si besoin.",
      },
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
    },
    sourcesVerification: [
      {
        type: "session",
        champs: ["tauxPresence", "tauxAbandon", "relances"],
        description: "Vérifier les taux de présence et actions de relance",
      },
      {
        type: "apprenant",
        champs: ["statut", "dateAbandon", "motifAbandon"],
        description: "Vérifier le suivi des abandons",
      },
    ],
  },
  {
    numero: 13,
    critere: 3,
    libelle: "Coordination centre/entreprise (alternance)",
    description:
      "Pour les formations en alternance, le prestataire, en lien avec l'entreprise, anticipe avec l'apprenant les missions confiées, à court, moyen et long terme, et assure la coordination et la progressivité des apprentissages réalisés en centre de formation et en entreprise.",
    niveauAttendu:
      "Démontrer que les principes de la pédagogie de l'alternance sont mis en œuvre, grâce à un processus formalisé d'articulation itératif des apprentissages entre le centre de formation et l'entreprise.",
    nonConformite: {
      type: "mineure",
      gradation: true,
      descriptionMineure: "Mise en œuvre partielle des processus définis.",
    },
    exigences: [
      "Livret d'alternance ou outil de liaison",
      "Coordination centre/entreprise documentée",
      "Progressivité des missions établie",
      "Visites en entreprise réalisées",
      "Dialogue entre prestataire et tuteurs",
    ],
    preuvesAttendues: [
      "Tout outil de liaison entre l'entreprise, le bénéficiaire et le prestataire : carnet de suivi",
      "Preuves de dialogue entre prestataire et tuteurs pour l'adaptation",
      "Plannings",
      "Comptes rendus d'entretien ou de visite d'entreprise",
      "Tableau de bord dématérialisé",
      "Outil de capitalisation des retours d'expériences des apprenants",
      "Pour les PSH : outil de liaison sur les adaptations de la formation en entreprise",
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: false,
      VAE: false,
      nouveauxEntrants:
        "Un processus d'articulation des apprentissages est formalisé pour les deux lieux de formation. La mise en œuvre sera auditée lors de l'audit de surveillance.",
    },
    sousTraitance:
      "L'organisme certificateur tient compte des missions confiées pour l'appréciation de cet indicateur.",
    sourcesVerification: [
      {
        type: "formation",
        champs: ["typeAlternance", "alternance"],
        description: "Vérifier les formations en alternance",
      },
      {
        type: "visiteEntreprise",
        description: "Vérifier les visites en entreprise",
      },
      {
        type: "livretAlternance",
        description: "Vérifier les livrets d'alternance",
      },
    ],
  },
  {
    numero: 14,
    critere: 3,
    libelle: "Accompagnement socio-professionnel (CFA)",
    description:
      "Le prestataire met en œuvre un accompagnement socio-professionnel, éducatif et relatif à l'exercice de la citoyenneté.",
    niveauAttendu:
      "Démontrer que l'accompagnement de l'apprenant est formalisé et mis en œuvre par la mise en place de projets spécifiques.",
    nonConformite: {
      type: "majeure",
      gradation: false,
    },
    exigences: [
      "Accompagnement socio-professionnel structuré",
      "Actions éducatives mises en place",
      "Éducation à la citoyenneté",
      "Dispositifs d'aides financières identifiés",
      "Actions de sensibilisation à la mixité et à la diversité",
    ],
    preuvesAttendues: [
      "Mise en place de projets spécifiques d'activités sportives",
      "Ateliers culturels",
      "Éducation aux écrans",
      "Culture à l'exercice de la citoyenneté",
      "Dispositifs d'aides financières",
      "Listes des intervenants sociaux",
      "Dispositif d'accompagnement des apprenants dans le centre (restauration, foyer, internat)",
      "Actions de sensibilisation à la mixité et à la diversité",
    ],
    applicabilite: {
      OF: false,
      CFA: true,
      CBC: false,
      VAE: false,
      nouveauxEntrants:
        "L'accompagnement est formalisé. Sa mise en œuvre sera auditée lors de l'audit de surveillance.",
    },
    sourcesVerification: [
      {
        type: "projetEducatif",
        description: "Vérifier les projets éducatifs CFA",
      },
      {
        type: "accompagnementSocial",
        description: "Vérifier l'accompagnement social",
      },
    ],
  },
  {
    numero: 15,
    critere: 3,
    libelle: "Droits et devoirs des apprentis (CFA)",
    description:
      "Le prestataire informe les apprentis de leurs droits et devoirs en tant qu'apprentis et salariés ainsi que des règles applicables en matière de santé et de sécurité en milieu professionnel.",
    niveauAttendu:
      "Démontrer que les apprentis sont informés des droits et devoirs des salariés/apprentis et sur les règles applicables en matière de santé et de sécurité en milieu professionnel.",
    nonConformite: {
      type: "majeure",
      gradation: false,
    },
    exigences: [
      "Information sur les droits et devoirs des apprentis",
      "Formation santé/sécurité au travail",
      "Règlement intérieur du CFA communiqué",
      "Livret de l'apprenti fourni",
    ],
    preuvesAttendues: [
      "Règlement intérieur du CFA",
      "Supports d'informations",
      "Supports de contractualisation",
      "Compte-rendu de réunions d'informations collectives",
      "Livret d'accueil",
    ],
    applicabilite: {
      OF: false,
      CFA: true,
      CBC: false,
      VAE: false,
    },
    sourcesVerification: [
      {
        type: "document",
        champs: ["type"],
        description:
          "Vérifier les documents d'information apprentis (livret apprenti, règlement)",
      },
      {
        type: "formationSecurite",
        description: "Vérifier les formations sécurité",
      },
    ],
  },
  {
    numero: 16,
    critere: 3,
    libelle: "Conditions de certification",
    description:
      "Lorsque le prestataire met en œuvre des formations conduisant à une certification professionnelle, il s'assure que les conditions de présentation des bénéficiaires à la certification respectent les exigences formelles de l'autorité de certification.",
    niveauAttendu:
      "Le prestataire respecte les exigences formelles de l'autorité de certification lorsqu'il présente des candidats à la certification qu'il propose.",
    nonConformite: {
      type: "majeure",
      gradation: false,
    },
    exigences: [
      "Information des bénéficiaires sur le déroulement de l'évaluation",
      "Conditions de passage de l'examen respectées",
      "Inscription à la session d'évaluation conforme",
      "Habilitation du prestataire à évaluer (si applicable)",
      "Pour les PSH : modalités d'aménagement des examens",
    ],
    preuvesAttendues: [
      "Information communiquée aux bénéficiaires sur le déroulement de l'évaluation",
      "Conditions de passage de l'examen à distance",
      "Preuve d'inscription à la session d'évaluation",
      "Habilitation du prestataire à évaluer et convention de partenariat avec le certificateur",
      "Référentiel d'évaluation",
      "Règlement d'organisation des examens",
      "Procès-verbal des sessions d'examen",
      "Livret d'évaluations réalisées en cours de formation",
    ],
    obligationsSpecifiques: [
      {
        type: "VAE",
        description:
          "Le prestataire démontre qu'il a demandé au certificateur les conditions de présentation aux certifications et les calendriers de jury.",
      },
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: false,
      VAE: true,
    },
    sousTraitance:
      "L'organisme certificateur tient compte des missions confiées pour l'appréciation de cet indicateur.",
    sourcesVerification: [
      {
        type: "formation",
        champs: ["certificationRncp", "habilitation"],
        description: "Vérifier les formations certifiantes et habilitations",
      },
      {
        type: "sessionExamen",
        description: "Vérifier les sessions d'examen",
      },
    ],
  },

  // =====================================================
  // CRITÈRE 4 - Adéquation des moyens pédagogiques
  // =====================================================
  {
    numero: 17,
    critere: 4,
    libelle: "Moyens humains et techniques",
    description:
      "Le prestataire met à disposition ou s'assure de la mise à disposition des moyens humains et techniques adaptés et d'un environnement approprié (conditions, locaux, équipements, plateaux techniques…).",
    niveauAttendu:
      "Démontrer que les locaux, les équipements, les moyens humains sont en adéquation avec les objectifs de la ou des prestation(s).",
    nonConformite: {
      type: "mineure",
      gradation: true,
      descriptionMineure: "Défaut dans les moyens ponctuel et non répétitif.",
    },
    exigences: [
      "Locaux adaptés et conformes",
      "Équipements fonctionnels et suffisants",
      "Moyens techniques appropriés",
      "Registre public d'accessibilité",
      "Document unique d'évaluation des risques professionnels (si applicable)",
      "Pour FOAD : plateformes LMS, aides à la connexion",
    ],
    preuvesAttendues: [
      "Bail ou contrat de location",
      "Registre public d'accessibilité",
      "Document unique d'évaluation des risques professionnels",
      "Matériel adéquat (vidéo projecteur, paperboard, ordinateur, équipements spécifiques)",
      "Chantiers pédagogiques, salles de langues, plateaux techniques",
      "Plateformes LMS, aides à la connexion à distance",
      "Planning d'intervention",
      "Espace documentaire",
      "CV des intervenants",
      "Supports méthodologiques",
      "Contrats de sous-traitance, contrats de prestations",
    ],
    obligationsSpecifiques: [
      {
        type: "CBC",
        description:
          "Mise à disposition des moyens dédiés à l'activité. Un environnement garantissant la discrétion et la confidentialité des échanges est prévu. Le cas échéant, l'habilitation des personnes devant faire passer les tests est précisée.",
      },
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
    },
    sourcesVerification: [
      {
        type: "lieuFormation",
        champs: ["capacite", "equipements", "accessibilite"],
        description: "Vérifier les lieux de formation",
      },
      {
        type: "equipement",
        description: "Vérifier l'inventaire des équipements",
      },
      {
        type: "intervenant",
        description: "Vérifier les moyens humains",
      },
    ],
  },
  {
    numero: 18,
    critere: 4,
    libelle: "Coordination des intervenants",
    description:
      "Le prestataire mobilise et coordonne les différents intervenants internes et/ou externes (pédagogiques, administratifs, logistiques, commerciaux…).",
    niveauAttendu:
      "Le prestataire identifie, selon les fonctions nécessaires aux prestations, les intervenants dont il assure la coordination.",
    nonConformite: {
      type: "mineure",
      gradation: true,
      descriptionMineure: "Défaut ponctuel de coordination.",
    },
    exigences: [
      "Organigramme fonctionnel avec champs d'intervention",
      "Liste des intervenants/contributeurs internes ou externes",
      "Planning des intervenants établi",
      "Coordination documentée (réunions d'équipe)",
      "Fiches de poste ou contrats de prestations",
    ],
    preuvesAttendues: [
      "Organigramme fonctionnel avec les champs d'intervention (pédagogique, technique, commercial, social)",
      "Liste des intervenants/contributeurs internes ou externes",
      "Contrats de travail, de prestations de service",
      "Fiches de poste",
      "Liste des référents pédagogiques, administratifs et handicap",
      "Planning des intervenants",
      "Comptes-rendus de réunions d'équipes",
      "Relevés des échanges avec les intervenants externes",
    ],
    obligationsSpecifiques: [
      {
        type: "VAE",
        description:
          "Les intervenants externes ne sont ni les certificateurs ni les financeurs.",
      },
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
    },
    sourcesVerification: [
      {
        type: "intervenant",
        champs: ["type", "statut", "specialites"],
        description: "Vérifier les intervenants",
      },
      {
        type: "session",
        champs: ["intervenants"],
        description: "Vérifier l'affectation aux sessions",
      },
      {
        type: "reunion",
        description: "Vérifier les réunions de coordination",
      },
    ],
  },
  {
    numero: 19,
    critere: 4,
    libelle: "Ressources pédagogiques",
    description:
      "Le prestataire met à disposition du bénéficiaire des ressources pédagogiques et permet à celui-ci de se les approprier.",
    niveauAttendu:
      "Démontrer que les ressources pédagogiques sont cohérentes avec les objectifs des prestations, sont disponibles et que des dispositions sont mises en place afin de permettre aux bénéficiaires de se les approprier.",
    nonConformite: {
      type: "mineure",
      gradation: true,
      descriptionMineure:
        "Défaut ponctuel et non répétitif dans les ressources et les moyens mis à disposition.",
    },
    exigences: [
      "Supports de cours/d'explicitation des compétences fournis",
      "Ressources accessibles aux bénéficiaires",
      "Modalités d'appropriation facilitées",
      "Dispositif de veille et d'actualisation des ressources",
      "Pour FOAD : assistance technique et pédagogique appropriée",
    ],
    preuvesAttendues: [
      "Ressources pédagogiques mises à disposition : supports de cours, vidéos, fiches pratiques",
      "Outils d'exploration du monde du travail et projections professionnelles",
      "Liste des ressources documentaires (fiches RNCP…)",
      "Typologie des ressources pédagogiques (internet, abonnements revues spécialisées, centre de ressources)",
      "Modalités d'accès aux ressources pour les bénéficiaires et équipes pédagogiques",
      "Modalités pour faciliter l'accès aux ressources numériques (tutos, assistance téléphonique)",
      "Traçabilité de l'accompagnement pédagogique pour les formations à distance (forum, mails)",
      "Pour les PSH : modalités d'accès ou supports spécifiques",
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
      nouveauxEntrants:
        "Démontrer que les ressources pédagogiques sont prévues. La mise en œuvre sera auditée lors de l'audit de surveillance.",
    },
    sourcesVerification: [
      {
        type: "formation",
        champs: ["supports", "ressources"],
        description: "Vérifier les supports de formation",
      },
      {
        type: "ressourcePedagogique",
        description: "Vérifier les ressources pédagogiques",
      },
      {
        type: "fichier",
        description: "Vérifier les fichiers et documents associés",
      },
    ],
  },
  {
    numero: 20,
    critere: 4,
    libelle: "Référents et conseil de perfectionnement (CFA)",
    description:
      "Le prestataire dispose d'un personnel dédié à l'appui à la mobilité nationale et internationale, d'un référent handicap et d'un conseil de perfectionnement.",
    niveauAttendu:
      "Le prestataire présente : la liste des membres du conseil de perfectionnement avec le dernier compte-rendu/procès-verbal ; la liste des personnes dédiées à la mobilité et les actions mises en œuvre ; le nom et contact du référent handicap et les actions qu'il met en œuvre.",
    nonConformite: {
      type: "majeure",
      gradation: false,
    },
    exigences: [
      "Conseil de perfectionnement constitué avec membres identifiés",
      "Dernier compte-rendu/procès-verbal du conseil",
      "Personnel dédié à la mobilité (nationale et internationale) identifié",
      "Actions de mobilité mises en œuvre",
      "Référent handicap nommé avec procès-verbal de nomination",
      "Actions du référent handicap documentées",
    ],
    preuvesAttendues: [
      "Nom et qualité des membres du conseil de perfectionnement (dernier compte-rendu et/ou procès-verbal)",
      "Preuve de constitution en cours du conseil de perfectionnement pour le nouveau CFA",
      "Nom et qualité des personnes dédiées à la mobilité (nationale et internationale)",
      "Nom du référent handicap et procès-verbal de sa nomination",
      "Missions remplies par les référents et personnels dédiés",
      "Exemples d'actions menées",
    ],
    applicabilite: {
      OF: false,
      CFA: true,
      CBC: false,
      VAE: false,
    },
    sourcesVerification: [
      {
        type: "organization",
        champs: [
          "referentHandicap",
          "referentMobilite",
          "conseilPerfectionnement",
        ],
        description: "Vérifier les référents CFA",
      },
      {
        type: "reunionConseil",
        description: "Vérifier les réunions du conseil de perfectionnement",
      },
    ],
  },

  // =====================================================
  // CRITÈRE 5 - Qualification et développement des compétences
  // =====================================================
  {
    numero: 21,
    critere: 5,
    libelle: "Compétences des intervenants",
    description:
      "Le prestataire détermine, mobilise et évalue les compétences des différents intervenants internes et/ou externes, adaptées aux prestations.",
    niveauAttendu:
      "Démontrer que les compétences requises pour réaliser les prestations ont été définies en amont et sont adaptées aux prestations. La maîtrise de ces compétences par les intervenants est vérifiée par le prestataire.",
    nonConformite: {
      type: "majeure",
      gradation: false,
    },
    exigences: [
      "Analyse des besoins de compétences réalisée",
      "Modalités de recrutement définies",
      "Modalités d'intégration des personnels",
      "CV des intervenants disponibles",
      "Formations initiales et continues des intervenants documentées",
      "Sensibilisation des personnels à l'accueil du public en situation de handicap",
    ],
    preuvesAttendues: [
      "Analyse des besoins de compétences et modalités de recrutement",
      "Modalités d'intégration des personnels",
      "Entretiens professionnels",
      "Curriculum vitae des intervenants",
      "Formations initiales et continues des intervenants",
      "Sensibilisation des personnels à l'accueil du public en situation de handicap",
      "Processus d'accueil des nouveaux professionnels",
      "Échanges de pratiques",
      "Plan de développement des compétences",
      "Pluridisciplinarité des intervenants internes et externes",
    ],
    obligationsSpecifiques: [
      {
        type: "VAE",
        description:
          "Les accompagnateurs sont formés à l'analyse des référentiels métiers et certifications dont ils ont la charge et à la méthodologie d'accompagnement.",
      },
      {
        type: "CBC",
        description:
          "Vérification des certifications détenues par l'intervenant pour réaliser les tests psychotechniques.",
      },
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
    },
    sourcesVerification: [
      {
        type: "intervenant",
        champs: ["competences", "cv", "biographie", "specialites"],
        description: "Vérifier les compétences des intervenants",
      },
      {
        type: "intervenantDiplome",
        description: "Vérifier les diplômes des intervenants",
      },
      {
        type: "intervenantFormation",
        description: "Vérifier les formations suivies par les intervenants",
      },
    ],
  },
  {
    numero: 22,
    critere: 5,
    libelle: "Développement des compétences des salariés",
    description:
      "Le prestataire entretient et développe les compétences de ses salariés, adaptées aux prestations qu'il délivre.",
    niveauAttendu:
      "Démontrer la mobilisation des différents leviers de formation et de professionnalisation pour l'ensemble de son personnel.",
    nonConformite: {
      type: "majeure",
      gradation: false,
    },
    exigences: [
      "Qualification des personnels à jour",
      "Plan de développement des compétences établi",
      "Entretiens professionnels réalisés",
      "Mobilisation de différents leviers de formation (recherche-action, communauté de pairs, groupes d'analyse)",
      "Diffusion d'information sur les possibilités de formation (CPF, VAE)",
    ],
    preuvesAttendues: [
      "Qualification des personnels",
      "Mobilisation de différents leviers de formation et de professionnalisation : recherche-action, plan de développement des compétences",
      "Entretien professionnel",
      "Communauté de pairs",
      "Groupe d'analyse et d'échange de pratiques",
      "Diffusion de documents d'information sur les possibilités de formation et de qualification tout au long de la vie (CPF, VAE, etc.)",
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
      nouveauxEntrants:
        "Cet indicateur sera audité lors de l'audit de surveillance.",
    },
    sourcesVerification: [
      {
        type: "intervenant",
        champs: ["formations", "formationsContinues"],
        description: "Vérifier les formations des intervenants",
      },
      {
        type: "planFormation",
        description: "Vérifier le plan de développement des compétences",
      },
    ],
  },

  // =====================================================
  // CRITÈRE 6 - Inscription dans l'environnement professionnel
  // =====================================================
  {
    numero: 23,
    critere: 6,
    libelle: "Veille légale et réglementaire",
    description:
      "Le prestataire réalise une veille légale et réglementaire sur le champ de la formation professionnelle et en exploite les enseignements.",
    niveauAttendu:
      "Démontrer la mise en place d'une veille légale et réglementaire, sa prise en compte par le prestataire et sa communication en interne.",
    nonConformite: {
      type: "mineure",
      gradation: true,
      descriptionMineure: "Absence d'exploitation de la veille mise en place.",
    },
    exigences: [
      "Veille réglementaire organisée et documentée",
      "Sources de veille identifiées (abonnements, adhésions, sites institutionnels)",
      "Exploitation des résultats (actualisation des supports, diffusion en interne)",
      "Mise à jour des pratiques selon les évolutions",
    ],
    preuvesAttendues: [
      "Abonnements, adhésions",
      "Participation aux salons professionnels, conférences, groupes normatifs",
      "Veille réglementaire en matière de handicap",
      "Actualisation des supports d'information ou de contractualisation en fonction des évolutions juridiques",
      "Diffusion des actualités légales et règlementaires au personnel",
      "Consultation et analyse de la documentation diffusée sur les sites institutionnels (travail-emploi.gouv.fr, portail CDC)",
    ],
    obligationsSpecifiques: [
      {
        type: "VAE",
        description:
          "Documentation à jour sur le cadre légal du droit individuel à la VAE et de ses modalités de financement.",
      },
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
    },
    sourcesVerification: [
      {
        type: "veilleSource",
        champs: ["isActive", "type", "categorie"],
        description: "Vérifier les sources de veille réglementaire",
      },
      {
        type: "veilleArticle",
        champs: ["datePublication", "type"],
        description: "Vérifier les articles de veille",
      },
    ],
  },
  {
    numero: 24,
    critere: 6,
    libelle: "Veille sur les compétences et métiers",
    description:
      "Le prestataire réalise une veille sur les évolutions des compétences, des métiers et des emplois dans ses secteurs d'intervention et en exploite les enseignements.",
    niveauAttendu:
      "Démontrer la mise en place d'une veille sur les thèmes de l'indicateur et son impact éventuel sur les prestations.",
    nonConformite: {
      type: "mineure",
      gradation: true,
      descriptionMineure: "Absence d'exploitation de la veille mise en place.",
    },
    exigences: [
      "Veille métiers organisée sur les secteurs d'intervention",
      "Participation à des conférences, colloques, salons",
      "Adhésion à un réseau professionnel (syndicat, fédération, forums)",
      "Abonnements à des revues professionnelles",
      "Évolutions prises en compte dans les prestations",
    ],
    preuvesAttendues: [
      "Veille sur les évolutions des compétences, des métiers et des emplois et documents y afférents",
      "Participations à des conférences, colloques, salon",
      "Adhésion à un réseau professionnel (syndicat, fédération, forums)",
      "Abonnements à des revues professionnelles",
      "Diffusion des éléments issus de la veille au personnel du prestataire",
      "Évolutions apportées au contenu des prestations proposées",
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
      nouveauxEntrants:
        "Démontrer la mise en place d'une veille sur les thèmes de l'indicateur. L'impact éventuel sera audité lors de l'audit de surveillance.",
    },
    sourcesVerification: [
      {
        type: "veilleSource",
        champs: ["isActive", "type", "categorie"],
        description: "Vérifier les sources de veille métiers",
      },
      {
        type: "formation",
        champs: ["updatedAt", "dateMiseAJour"],
        description: "Vérifier la mise à jour des formations",
      },
    ],
  },
  {
    numero: 25,
    critere: 6,
    libelle: "Veille sur les innovations",
    description:
      "Le prestataire réalise une veille sur les innovations pédagogiques et technologiques permettant une évolution de ses prestations et en exploite les enseignements.",
    niveauAttendu:
      "Démontrer la mise en place d'une veille sur les thèmes de l'indicateur et son impact éventuel sur les prestations.",
    nonConformite: {
      type: "mineure",
      gradation: true,
      descriptionMineure: "Absence d'exploitation de la veille mise en place.",
    },
    exigences: [
      "Veille innovation organisée (pédagogique et technologique)",
      "Participation à des conférences, colloques, salons, groupes de réflexion",
      "Nouvelles pratiques testées ou analysées",
      "Technologies intégrées quand pertinent",
      "Analyse d'opportunité et de faisabilité sur les innovations",
    ],
    preuvesAttendues: [
      "Veille sur les innovations pédagogiques et technologiques et documents y afférents",
      "Participations à des conférences, colloques, salons, groupes de réflexions et d'analyse de pratiques",
      "Adhésion à un réseau professionnel (syndicat, fédération, forums)",
      "Abonnements à des revues professionnelles",
      "Diffusion des éléments issus de la veille au personnel",
      "Évolutions apportées au contenu des prestations, aux modalités ou aux outils pédagogiques",
      "Analyse d'opportunité et de faisabilité sur la mise en œuvre des innovations",
      "Pour les organismes accueillant des PSH : participation à des conférences thématiques sur les innovations pour ce public",
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
      nouveauxEntrants:
        "Démontrer la mise en place d'une veille pédagogique et technologique. L'impact éventuel sera audité lors de l'audit de surveillance.",
    },
    sourcesVerification: [
      {
        type: "veilleSource",
        champs: ["isActive", "type", "categorie"],
        description: "Vérifier les sources de veille innovation",
      },
      {
        type: "innovationPedagogique",
        description: "Vérifier les innovations mises en œuvre",
      },
    ],
  },
  {
    numero: 26,
    critere: 6,
    libelle: "Réseau handicap",
    description:
      "Le prestataire mobilise les expertises, outils et réseaux nécessaires pour accueillir, accompagner/former ou orienter les publics en situation de handicap.",
    niveauAttendu:
      "Démontrer l'identification d'un réseau de partenaires/experts/acteurs du champ du handicap, mobilisable par les personnels. Dans le cas d'accueil de personnes en situation de handicap, préciser les modalités de recours à ce réseau et les mesures spécifiques d'accompagnement ou d'orientation mises en œuvre.",
    nonConformite: {
      type: "majeure",
      gradation: false,
    },
    exigences: [
      "Référent handicap désigné avec compétences actualisées",
      "Liste des partenaires du territoire (Agefiph, Fiphfp, Cap emploi, MDPH)",
      "Participation aux instances et manifestations des partenaires",
      "Charte d'engagement pour l'accessibilité (si applicable)",
      "Recours à l'offre de services Ressource Handicap Formation",
    ],
    preuvesAttendues: [
      "Liste des partenaires du territoire susceptibles d'aider le prestataire dans la prise en compte des PSH (Agefiph, Fiphfp, Cap emploi, MDPH)",
      "Participation aux instances et manifestation des partenaires",
      "Compte-rendu de rencontres, invitation à des réunions, prise de contact",
      "Compétences et connaissances actualisées du référent handicap",
      "Charte d'engagement pour l'accessibilité",
      "Recours à l'offre de services Ressource Handicap Formation",
      "Ressources mobilisées pour l'accompagnement et l'orientation des publics",
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
      nouveauxEntrants:
        "Démontrer la mise en place d'un réseau de partenaires/experts/acteurs du champ du handicap.",
    },
    sousTraitance:
      "Le prestataire démontre qu'il dispose d'un réseau de partenaires handicap ou que son donneur d'ordre lui a communiqué la liste de ses partenaires mobilisables pour orienter les PSH.",
    sourcesVerification: [
      {
        type: "organization",
        champs: ["referentHandicap", "partenairesHandicap"],
        description: "Vérifier le référent handicap et partenaires",
      },
      {
        type: "apprenant",
        champs: ["situationHandicap", "amenagements"],
        description: "Vérifier l'accompagnement handicap",
      },
    ],
  },
  {
    numero: 27,
    critere: 6,
    libelle: "Sous-traitance et portage salarial",
    description:
      "Lorsque le prestataire fait appel à la sous-traitance ou au portage salarial, il s'assure du respect de la conformité au présent référentiel.",
    niveauAttendu:
      "Démontrer les dispositions mises en place pour vérifier le respect de la conformité au présent référentiel par le sous-traitant ou le salarié porté.",
    nonConformite: {
      type: "majeure",
      gradation: false,
    },
    exigences: [
      "Contrats de sous-traitance formalisés",
      "Processus de sélection des sous-traitants",
      "Animation qualité dédiée ou charte",
      "Justificatifs présentés par les sous-traitants ou salariés portés",
      "Suivi qualité de la sous-traitance",
    ],
    preuvesAttendues: [
      "Contrats de sous-traitance",
      "Tous les éléments qui permettent de démontrer les modalités de sélection et de pilotage des sous-traitants (process de sélection, animation qualité dédiée, charte)",
      "Justificatifs présentés par les sous-traitants ou les salariés portés",
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
    },
    sourcesVerification: [
      {
        type: "intervenant",
        champs: ["type", "statut", "certificationQualiopi"],
        description: "Vérifier les intervenants externes et sous-traitants",
      },
      {
        type: "contratSousTraitance",
        description: "Vérifier les contrats de sous-traitance",
      },
    ],
  },
  {
    numero: 28,
    critere: 6,
    libelle: "Réseau de partenaires socio-économiques",
    description:
      "Lorsque les prestations dispensées au bénéficiaire comprennent des périodes de formation en situation de travail, le prestataire mobilise son réseau de partenaires socio-économiques pour coconstruire l'ingénierie de formation et favoriser l'accueil en entreprise.",
    niveauAttendu:
      "Démontrer l'existence d'un réseau de partenaires socio-économiques mobilisé tout au long de la prestation.",
    nonConformite: {
      type: "mineure",
      gradation: true,
      descriptionMineure:
        "Défaut ponctuel et non répétitif dans la mobilisation des partenaires.",
    },
    exigences: [
      "Liste des entreprises partenaires établie",
      "Conventions de partenariats formalisées",
      "Comités de pilotage ou réunions avec partenaires",
      "Contacts avec le réseau SPE (Service Public de l'Emploi)",
      "Livret alternance incluant les informations partenaires",
    ],
    preuvesAttendues: [
      "Comités de pilotage",
      "Comptes rendus de réunions",
      "Liste des entreprises partenaires",
      "Conventions de partenariats",
      "Convention de formation",
      "Contacts réseau SPE",
      "Livret alternance",
      "Informations sur les partenariats",
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: false,
      VAE: false,
    },
    sousTraitance:
      "L'organisme certificateur tient compte des missions confiées pour l'appréciation de cet indicateur.",
    sourcesVerification: [
      {
        type: "entreprisePartenaire",
        description: "Vérifier les partenariats entreprises",
      },
      {
        type: "conventionPartenariat",
        description: "Vérifier les conventions",
      },
    ],
  },
  {
    numero: 29,
    critere: 6,
    libelle: "Insertion professionnelle et poursuite d'études (CFA)",
    description:
      "Le prestataire développe des actions qui concourent à l'insertion professionnelle ou la poursuite d'étude par la voie de l'apprentissage ou par toute autre voie permettant de développer leurs connaissances et leurs compétences.",
    niveauAttendu:
      "Démontrer l'existence d'actions qui concourent à l'insertion professionnelle ou à la poursuite d'études.",
    nonConformite: {
      type: "majeure",
      gradation: false,
    },
    exigences: [
      "Actions favorisant l'insertion professionnelle des apprenants",
      "Actions de promotion de la poursuite d'études",
      "Partenariats avec acteurs de l'insertion et de l'emploi",
      "Partenariats avec le monde professionnel",
      "Diffusion des offres d'apprentissage et d'emploi",
    ],
    preuvesAttendues: [
      "Actions visant à favoriser l'insertion professionnelle des apprenants (salon d'orientation, visite d'entreprise, atelier CV/lettre de motivation, aide à la recherche d'emploi, réseau d'anciens élèves)",
      "Actions de promotion de la poursuite d'étude",
      "Partenariats avec des acteurs de l'insertion et de l'emploi et avec le monde professionnel",
      "Diffusion des offres d'apprentissage et d'emploi",
      "Information sur les compétitions des métiers (Meilleurs Apprentis de France, WorldSkills, Meilleurs Ouvriers de France…)",
    ],
    applicabilite: {
      OF: false,
      CFA: true,
      CBC: false,
      VAE: false,
    },
    sourcesVerification: [
      {
        type: "actionInsertion",
        description: "Vérifier les actions d'insertion",
      },
      {
        type: "statistiquesInsertion",
        description: "Statistiques d'insertion professionnelle",
      },
    ],
  },

  // =====================================================
  // CRITÈRE 7 - Appréciations et réclamations
  // =====================================================
  {
    numero: 30,
    critere: 7,
    libelle: "Recueil des appréciations",
    description:
      "Le prestataire recueille les appréciations des parties prenantes : bénéficiaires, financeurs, équipes pédagogiques et entreprises concernées.",
    niveauAttendu:
      "Démontrer la sollicitation des appréciations à une fréquence pertinente, incluant des dispositifs de relance et permettant une libre expression.",
    nonConformite: {
      type: "mineure",
      gradation: true,
      descriptionMineure:
        "Absence de sollicitation des appréciations d'une partie prenante. S'agissant des financeurs, absence de contact ou de participation à des webinaires ou réunions organisés par le financeur.",
    },
    exigences: [
      "Questionnaires de satisfaction (à chaud et/ou à froid)",
      "Retours des formateurs recueillis",
      "Feedback des entreprises sollicité",
      "Appréciations des financeurs (au moins une fois par an)",
      "Analyse et traitement des appréciations formulées",
    ],
    preuvesAttendues: [
      "Enquête de satisfaction, questionnaire",
      "Compte-rendu d'entretiens",
      "Évaluation à chaud et/ou à froid",
      "Analyse et traitement des appréciations formulées par les parties prenantes",
      "Comité de pilotage, webinaires, entretiens",
      "Comptes-rendus de réunions d'équipes, séminaires",
      "Sollicitation des financeurs, échanges avec le financeur sur une ou plusieurs prestations",
      "Recommandations issues d'un contrôle mené par le financeur",
      "Consultation des sites mis en place par les financeurs (ex : Anotéa)",
    ],
    obligationsSpecifiques: [
      {
        type: "CBC",
        description:
          "Seules les appréciations des bénéficiaires et des équipes pédagogiques sont requises. Questionnaire d'évaluation à l'issue du bilan et à 6 mois.",
      },
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
    },
    sousTraitance:
      "Le prestataire recueille l'appréciation des bénéficiaires et de son donneur d'ordres sur la prestation réalisée.",
    sourcesVerification: [
      {
        type: "evaluationSatisfaction",
        champs: ["type", "noteGlobale", "reponse"],
        description: "Vérifier les évaluations de satisfaction",
      },
      {
        type: "enqueteSatisfaction",
        description: "Vérifier les enquêtes de satisfaction",
      },
    ],
  },
  {
    numero: 31,
    critere: 7,
    libelle: "Traitement des réclamations",
    description:
      "Le prestataire met en œuvre des modalités de traitement des difficultés rencontrées par les parties prenantes, des réclamations exprimées par ces dernières, des aléas survenus en cours de prestation.",
    niveauAttendu:
      "Démontrer la mise en place de modalités de traitement des aléas, difficultés et réclamations.",
    nonConformite: {
      type: "majeure",
      gradation: false,
    },
    exigences: [
      "Procédure de réclamation formalisée",
      "Accusé de réception des réclamations",
      "Traitement documenté avec réponses apportées",
      "Actions correctives mises en œuvre",
      "Tableau de suivi des réclamations et de leur traitement",
    ],
    preuvesAttendues: [
      "Description et mise en œuvre de ces modalités (accusé de réception des réclamations et réponses apportées aux réclamants)",
      "Enquêtes de satisfaction",
      "Analyse et traitement des réclamations formulées par les stagiaires",
      "Système de médiation",
      "Traitement des difficultés et des aléas",
      "Solutions apportées en cas d'imprévu",
      "Dialogue et communication interne",
      "Tableau de suivi des réclamations et de leur traitement",
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
    },
    sourcesVerification: [
      {
        type: "reclamation",
        champs: ["statut", "dateResolution", "actionsCorrectives"],
        description: "Vérifier les réclamations traitées",
      },
      {
        type: "incident",
        description: "Vérifier le traitement des incidents et aléas",
      },
    ],
  },
  {
    numero: 32,
    critere: 7,
    libelle: "Mesures d'amélioration continue",
    description:
      "Le prestataire met en œuvre des mesures d'amélioration à partir de l'analyse des appréciations et des réclamations.",
    niveauAttendu:
      "Démontrer la mise en place d'une démarche d'amélioration continue.",
    nonConformite: {
      type: "majeure",
      gradation: false,
    },
    exigences: [
      "Identification et réflexion sur les causes d'abandon ou motifs d'insatisfaction",
      "Plans d'action d'amélioration établis",
      "Mise en œuvre d'actions spécifiques",
      "Tableau de suivi des mesures d'amélioration",
      "Boucle d'amélioration continue active",
    ],
    preuvesAttendues: [
      "Identification et réflexion sur les causes d'abandon ou les motifs d'insatisfaction",
      "Plans d'action d'amélioration",
      "Mise en œuvre d'actions spécifiques",
      "Tableau de suivi des mesures d'améliorations mises en œuvre à partir des réclamations, aléas et difficultés",
    ],
    obligationsSpecifiques: [
      {
        type: "VAE",
        description:
          "Partage des résultats de l'accompagnement (nombre de candidats en début et fin d'accompagnement, taux et causes d'abandon, taux de réussite à la VAE).",
      },
    ],
    applicabilite: {
      OF: true,
      CFA: true,
      CBC: true,
      VAE: true,
      nouveauxEntrants:
        "L'indicateur sera audité à l'audit de surveillance.",
    },
    sourcesVerification: [
      {
        type: "actionAmelioration",
        champs: ["statut", "origine", "dateEcheance", "resultat"],
        description: "Vérifier les actions d'amélioration",
      },
      {
        type: "planAmelioration",
        description: "Vérifier le plan d'amélioration continue",
      },
    ],
  },
];

// =====================================================
// FONCTIONS UTILITAIRES
// =====================================================

/**
 * Récupère un indicateur par son numéro
 */
export function getIndicateur(numero: number): IndicateurQualiopi | undefined {
  return INDICATEURS_QUALIOPI.find((i) => i.numero === numero);
}

/**
 * Récupère les indicateurs d'un critère
 */
export function getIndicateursByCritere(critere: number): IndicateurQualiopi[] {
  return INDICATEURS_QUALIOPI.filter((i) => i.critere === critere);
}

/**
 * Récupère un critère par son numéro
 */
export function getCritere(numero: number) {
  return CRITERES_QUALIOPI.find((c) => c.numero === numero);
}

/**
 * Récupère les indicateurs applicables à un type de prestataire
 */
export function getIndicateursByType(
  type: TypePrestataire
): IndicateurQualiopi[] {
  return INDICATEURS_QUALIOPI.filter((i) => i.applicabilite[type]);
}

/**
 * Vérifie si un indicateur peut avoir une non-conformité mineure
 */
export function canHaveMinorNonConformity(numero: number): boolean {
  const indicateur = getIndicateur(numero);
  return indicateur?.nonConformite.gradation === true;
}

/**
 * Récupère les indicateurs spécifiques (non communs)
 */
export function getIndicateursSpecifiques(): IndicateurQualiopi[] {
  return INDICATEURS_QUALIOPI.filter(
    (i) =>
      !i.applicabilite.OF ||
      !i.applicabilite.CFA ||
      !i.applicabilite.CBC ||
      !i.applicabilite.VAE
  );
}

/**
 * Récupère les indicateurs communs (applicables à tous)
 */
export function getIndicateursCommuns(): IndicateurQualiopi[] {
  return INDICATEURS_QUALIOPI.filter(
    (i) =>
      i.applicabilite.OF &&
      i.applicabilite.CFA &&
      i.applicabilite.CBC &&
      i.applicabilite.VAE
  );
}

/**
 * Récupère les indicateurs avec modalités adaptées pour les nouveaux entrants
 * (2, 3, 11, 13, 14, 19, 22, 24, 25, 26 et 32)
 */
export function getIndicateursNouveauxEntrants(): IndicateurQualiopi[] {
  return INDICATEURS_QUALIOPI.filter(
    (i) => i.applicabilite.nouveauxEntrants !== undefined
  );
}
