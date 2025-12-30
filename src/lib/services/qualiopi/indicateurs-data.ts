// ===========================================
// DONNÉES DE RÉFÉRENCE QUALIOPI - 32 INDICATEURS
// ===========================================

export interface IndicateurQualiopi {
  numero: number;
  critere: number;
  libelle: string;
  description: string;
  exigences: string[];
  preuvesAttendues: string[];
  // Sources de données dans l'application
  sourcesVerification: {
    type: string; // formation, session, apprenant, document, etc.
    champs?: string[];
    description: string;
  }[];
}

// Les 7 critères Qualiopi
export const CRITERES_QUALIOPI = [
  {
    numero: 1,
    titre: "Conditions d'information du public",
    description: "Les conditions d'information du public sur les prestations proposées, les délais pour y accéder et les résultats obtenus",
    indicateurs: [1, 2, 3],
  },
  {
    numero: 2,
    titre: "Identification précise des objectifs",
    description: "L'identification précise des objectifs des prestations proposées et l'adaptation de ces prestations aux publics bénéficiaires lors de la conception des prestations",
    indicateurs: [4, 5, 6, 7, 8],
  },
  {
    numero: 3,
    titre: "Adaptation aux publics bénéficiaires",
    description: "L'adaptation aux publics bénéficiaires des prestations et des modalités d'accueil, d'accompagnement, de suivi et d'évaluation mises en œuvre",
    indicateurs: [9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    numero: 4,
    titre: "Adéquation des moyens pédagogiques",
    description: "L'adéquation des moyens pédagogiques, techniques et d'encadrement aux prestations mises en œuvre",
    indicateurs: [17, 18, 19, 20, 21],
  },
  {
    numero: 5,
    titre: "Qualification et développement des compétences",
    description: "La qualification et le développement des connaissances et compétences des personnels chargés de mettre en œuvre les prestations",
    indicateurs: [22, 23, 24, 25],
  },
  {
    numero: 6,
    titre: "Inscription dans son environnement",
    description: "L'inscription et l'investissement du prestataire dans son environnement professionnel",
    indicateurs: [26, 27, 28, 29],
  },
  {
    numero: 7,
    titre: "Recueil et prise en compte des appréciations",
    description: "Le recueil et la prise en compte des appréciations et des réclamations formulées par les parties prenantes aux prestations délivrées",
    indicateurs: [30, 31, 32],
  },
];

// Les 32 indicateurs Qualiopi détaillés
export const INDICATEURS_QUALIOPI: IndicateurQualiopi[] = [
  // CRITÈRE 1 - Conditions d'information du public
  {
    numero: 1,
    critere: 1,
    libelle: "Information sur les prestations",
    description: "Le prestataire diffuse une information accessible au public, détaillée et vérifiable sur les prestations proposées : prérequis, objectifs, durée, modalités et délais d'accès, tarifs, contacts, méthodes mobilisées et modalités d'évaluation, accessibilité aux personnes handicapées.",
    exigences: [
      "Catalogue ou site web accessible",
      "Fiches formations complètes",
      "Informations sur les prérequis",
      "Objectifs clairement définis",
      "Durée précisée",
      "Modalités d'accès indiquées",
      "Tarifs affichés",
      "Contact référent",
      "Méthodes pédagogiques décrites",
      "Modalités d'évaluation précisées",
      "Accessibilité handicap mentionnée",
    ],
    preuvesAttendues: [
      "Catalogue de formations",
      "Site web avec informations détaillées",
      "Fiches programmes",
      "CGV mentionnant les délais",
    ],
    sourcesVerification: [
      {
        type: "formation",
        champs: ["prerequis", "objectifs", "duree", "modalite", "tarif"],
        description: "Vérifier que chaque formation a ses champs remplis",
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
    description: "Le prestataire diffuse des indicateurs de résultats adaptés à la nature des prestations mises en œuvre et aux publics accueillis.",
    exigences: [
      "Taux de satisfaction",
      "Taux de réussite aux évaluations",
      "Taux d'insertion professionnelle (si applicable)",
      "Indicateurs mis à jour régulièrement",
    ],
    preuvesAttendues: [
      "Tableau de bord des résultats",
      "Statistiques par formation",
      "Enquêtes de satisfaction analysées",
    ],
    sourcesVerification: [
      {
        type: "evaluation",
        description: "Calculer les taux de satisfaction et réussite",
      },
      {
        type: "session",
        description: "Analyser les résultats par session",
      },
    ],
  },
  {
    numero: 3,
    critere: 1,
    libelle: "Obtention des certifications",
    description: "Lorsque le prestataire met en œuvre des prestations conduisant à une certification professionnelle, il informe sur les taux d'obtention des certifications préparées, les possibilités de valider un/ou des blocs de compétences, ainsi que sur les équivalences, passerelles, suites de parcours et les débouchés.",
    exigences: [
      "Taux d'obtention des certifications",
      "Information sur les blocs de compétences",
      "Équivalences et passerelles documentées",
      "Débouchés professionnels indiqués",
    ],
    preuvesAttendues: [
      "Statistiques de certification",
      "Fiches RNCP/RS référencées",
      "Parcours et débouchés documentés",
    ],
    sourcesVerification: [
      {
        type: "formation",
        champs: ["certificationRncp", "blocCompetences"],
        description: "Vérifier les formations certifiantes",
      },
    ],
  },

  // CRITÈRE 2 - Identification précise des objectifs
  {
    numero: 4,
    critere: 2,
    libelle: "Analyse du besoin",
    description: "Le prestataire analyse le besoin du bénéficiaire en lien avec l'entreprise et/ou le financeur concerné(s).",
    exigences: [
      "Entretien préalable documenté",
      "Analyse des besoins formalisée",
      "Prise en compte du contexte professionnel",
    ],
    preuvesAttendues: [
      "Questionnaire de positionnement",
      "Compte-rendu d'entretien",
      "Analyse des besoins signée",
    ],
    sourcesVerification: [
      {
        type: "apprenant",
        champs: ["positionnementInitial"],
        description: "Vérifier le positionnement des apprenants",
      },
      {
        type: "inscription",
        description: "Vérifier l'analyse du besoin à l'inscription",
      },
    ],
  },
  {
    numero: 5,
    critere: 2,
    libelle: "Objectifs opérationnels",
    description: "Le prestataire définit les objectifs opérationnels et évaluables de la prestation.",
    exigences: [
      "Objectifs SMART définis",
      "Compétences visées identifiées",
      "Critères d'évaluation établis",
    ],
    preuvesAttendues: [
      "Programme de formation avec objectifs",
      "Référentiel de compétences",
      "Grille d'évaluation",
    ],
    sourcesVerification: [
      {
        type: "formation",
        champs: ["objectifs", "competencesVisees"],
        description: "Vérifier les objectifs des formations",
      },
      {
        type: "module",
        champs: ["objectifs"],
        description: "Vérifier les objectifs par module",
      },
    ],
  },
  {
    numero: 6,
    critere: 2,
    libelle: "Contenus et modalités",
    description: "Le prestataire établit les contenus et les modalités de mise en œuvre de la prestation, adaptés aux objectifs définis et aux publics bénéficiaires.",
    exigences: [
      "Programme détaillé",
      "Modalités pédagogiques définies",
      "Adaptation au public cible",
    ],
    preuvesAttendues: [
      "Programme de formation complet",
      "Supports pédagogiques",
      "Scénarios pédagogiques",
    ],
    sourcesVerification: [
      {
        type: "formation",
        champs: ["programme", "modalites", "publicCible"],
        description: "Vérifier les contenus des formations",
      },
    ],
  },
  {
    numero: 7,
    critere: 2,
    libelle: "Adéquation contenus/certification",
    description: "Lorsque le prestataire met en œuvre des prestations conduisant à une certification professionnelle, il s'assure de l'adéquation du ou des contenus de la prestation aux exigences de la certification visée.",
    exigences: [
      "Référentiel de certification analysé",
      "Correspondance contenus/référentiel",
      "Mise à jour selon évolutions",
    ],
    preuvesAttendues: [
      "Tableau de correspondance",
      "Référentiel RNCP/RS",
      "Analyse d'adéquation",
    ],
    sourcesVerification: [
      {
        type: "formation",
        champs: ["certificationRncp", "referentielCompetences"],
        description: "Vérifier l'adéquation aux certifications",
      },
    ],
  },
  {
    numero: 8,
    critere: 2,
    libelle: "Procédures de positionnement",
    description: "Le prestataire détermine les procédures de positionnement et d'évaluation des acquis à l'entrée de la prestation.",
    exigences: [
      "Test de positionnement",
      "Évaluation des prérequis",
      "Procédure formalisée",
    ],
    preuvesAttendues: [
      "Tests de positionnement",
      "Grilles d'évaluation initiale",
      "Procédure de positionnement",
    ],
    sourcesVerification: [
      {
        type: "evaluation",
        champs: ["type"],
        description: "Vérifier les évaluations de positionnement",
      },
    ],
  },

  // CRITÈRE 3 - Adaptation aux publics bénéficiaires
  {
    numero: 9,
    critere: 3,
    libelle: "Information des publics",
    description: "Le prestataire informe les publics bénéficiaires sur les conditions de déroulement de la prestation.",
    exigences: [
      "Convocation avec informations pratiques",
      "Règlement intérieur communiqué",
      "Livret d'accueil",
    ],
    preuvesAttendues: [
      "Convocations types",
      "Règlement intérieur",
      "Livret d'accueil",
    ],
    sourcesVerification: [
      {
        type: "document",
        champs: ["type"],
        description: "Vérifier les documents d'accueil générés",
      },
    ],
  },
  {
    numero: 10,
    critere: 3,
    libelle: "Adaptation de la prestation",
    description: "Le prestataire met en œuvre et adapte la prestation, l'accompagnement et le suivi aux publics bénéficiaires.",
    exigences: [
      "Individualisation des parcours",
      "Accompagnement personnalisé",
      "Suivi régulier",
    ],
    preuvesAttendues: [
      "Feuilles de présence",
      "Suivi individuel documenté",
      "Adaptations tracées",
    ],
    sourcesVerification: [
      {
        type: "session",
        description: "Vérifier le suivi des sessions",
      },
      {
        type: "apprenant",
        champs: ["notes", "suiviIndividuel"],
        description: "Vérifier le suivi des apprenants",
      },
    ],
  },
  {
    numero: 11,
    critere: 3,
    libelle: "Évaluation de l'atteinte des objectifs",
    description: "Le prestataire évalue l'atteinte par les publics bénéficiaires des objectifs de la prestation.",
    exigences: [
      "Évaluations en cours et fin de formation",
      "Critères d'évaluation définis",
      "Résultats communiqués",
    ],
    preuvesAttendues: [
      "Évaluations réalisées",
      "Résultats des évaluations",
      "Attestations de fin de formation",
    ],
    sourcesVerification: [
      {
        type: "evaluation",
        description: "Vérifier les évaluations réalisées",
      },
      {
        type: "document",
        champs: ["type"],
        description: "Vérifier les attestations générées",
      },
    ],
  },
  {
    numero: 12,
    critere: 3,
    libelle: "Engagement des bénéficiaires",
    description: "Le prestataire décrit et met en œuvre les mesures pour favoriser l'engagement des bénéficiaires et prévenir les ruptures de parcours.",
    exigences: [
      "Suivi de l'assiduité",
      "Prévention des abandons",
      "Relance des absents",
    ],
    preuvesAttendues: [
      "Procédure de suivi assiduité",
      "Actions de relance documentées",
      "Statistiques d'abandon",
    ],
    sourcesVerification: [
      {
        type: "session",
        champs: ["tauxPresence"],
        description: "Vérifier les taux de présence",
      },
    ],
  },
  {
    numero: 13,
    critere: 3,
    libelle: "Coordination des acteurs",
    description: "Pour les formations en alternance, le prestataire, en lien avec l'entreprise, anticipe avec l'apprenant les missions confiées, à court, moyen et long terme, et assure la coordination et la progressivité des apprentissages réalisés en centre de formation et en entreprise.",
    exigences: [
      "Livret d'alternance",
      "Coordination centre/entreprise",
      "Progressivité des missions",
    ],
    preuvesAttendues: [
      "Livret de suivi alternance",
      "Comptes-rendus de visite",
      "Planning des missions",
    ],
    sourcesVerification: [
      {
        type: "formation",
        champs: ["typeAlternance"],
        description: "Vérifier les formations en alternance",
      },
    ],
  },
  {
    numero: 14,
    critere: 3,
    libelle: "Exercice de la citoyenneté",
    description: "Le prestataire met en œuvre un accompagnement socio-professionnel, éducatif et relatif à l'exercice de la citoyenneté.",
    exigences: [
      "Accompagnement socio-professionnel",
      "Éducation citoyenne",
      "Orientation professionnelle",
    ],
    preuvesAttendues: [
      "Actions d'accompagnement documentées",
      "Ateliers citoyenneté",
      "Suivi socio-professionnel",
    ],
    sourcesVerification: [
      {
        type: "formation",
        description: "Applicable aux CFA principalement",
      },
    ],
  },
  {
    numero: 15,
    critere: 3,
    libelle: "Information sur les aides",
    description: "Le prestataire informe les apprentis de leurs droits et devoirs en tant qu'apprentis et salariés ainsi que des règles applicables en matière de santé et de sécurité en milieu professionnel.",
    exigences: [
      "Information droits/devoirs apprentis",
      "Formation santé/sécurité",
      "Livret apprenti",
    ],
    preuvesAttendues: [
      "Livret de l'apprenti",
      "Attestation formation sécurité",
      "Documentation droits sociaux",
    ],
    sourcesVerification: [
      {
        type: "document",
        description: "Applicable aux CFA",
      },
    ],
  },
  {
    numero: 16,
    critere: 3,
    libelle: "Conformité du contrat",
    description: "Lorsque le prestataire met en œuvre des formations conduisant à une certification professionnelle, il s'assure que les conditions de présentation des bénéficiaires à la certification respectent les exigences formelles de l'autorité de certification.",
    exigences: [
      "Vérification des conditions de certification",
      "Inscription aux examens conforme",
      "Suivi des certifications",
    ],
    preuvesAttendues: [
      "Procédure d'inscription certification",
      "Suivi des passages",
      "Résultats certifications",
    ],
    sourcesVerification: [
      {
        type: "formation",
        champs: ["certificationRncp"],
        description: "Vérifier les formations certifiantes",
      },
    ],
  },

  // CRITÈRE 4 - Adéquation des moyens
  {
    numero: 17,
    critere: 4,
    libelle: "Moyens humains et techniques",
    description: "Le prestataire met à disposition ou s'assure de la mise à disposition des moyens humains et techniques adaptés et d'un environnement approprié (conditions, locaux, équipements, plateaux techniques…).",
    exigences: [
      "Locaux adaptés",
      "Équipements fonctionnels",
      "Moyens techniques suffisants",
    ],
    preuvesAttendues: [
      "Inventaire des équipements",
      "Fiches locaux",
      "Vérifications périodiques",
    ],
    sourcesVerification: [
      {
        type: "lieuFormation",
        description: "Vérifier les lieux de formation",
      },
    ],
  },
  {
    numero: 18,
    critere: 4,
    libelle: "Coordination des intervenants",
    description: "Le prestataire mobilise et coordonne les différents intervenants internes et/ou externes (pédagogiques, administratifs, logistiques, commerciaux…).",
    exigences: [
      "Planning des intervenants",
      "Coordination documentée",
      "Réunions d'équipe",
    ],
    preuvesAttendues: [
      "Planning intervenants",
      "Comptes-rendus réunions",
      "Fiches intervenants",
    ],
    sourcesVerification: [
      {
        type: "intervenant",
        description: "Vérifier les intervenants",
      },
      {
        type: "session",
        champs: ["intervenants"],
        description: "Vérifier l'affectation aux sessions",
      },
    ],
  },
  {
    numero: 19,
    critere: 4,
    libelle: "Ressources pédagogiques",
    description: "Le prestataire met à disposition du bénéficiaire des ressources pédagogiques et permet à celui-ci de se les approprier.",
    exigences: [
      "Supports pédagogiques fournis",
      "Ressources accessibles",
      "Appropriation facilitée",
    ],
    preuvesAttendues: [
      "Supports de formation",
      "Plateforme de ressources",
      "Bibliographie/sitographie",
    ],
    sourcesVerification: [
      {
        type: "formation",
        champs: ["supports"],
        description: "Vérifier les supports de formation",
      },
      {
        type: "file",
        description: "Vérifier les fichiers associés",
      },
    ],
  },
  {
    numero: 20,
    critere: 4,
    libelle: "Intervenants internes ou externes",
    description: "Le prestataire dispose d'un personnel dédié à l'appui à la mobilité nationale et internationale, d'un référent handicap et d'un conseil de perfectionnement.",
    exigences: [
      "Référent handicap désigné",
      "Référent mobilité (si applicable)",
      "Conseil de perfectionnement",
    ],
    preuvesAttendues: [
      "Organigramme avec référents",
      "Fiches de poste",
      "CR conseil perfectionnement",
    ],
    sourcesVerification: [
      {
        type: "organization",
        description: "Applicable aux CFA principalement",
      },
    ],
  },
  {
    numero: 21,
    critere: 4,
    libelle: "Référent handicap",
    description: "Le prestataire définit et met en œuvre les modalités de diffusion, d'accessibilité et de réactualisation des supports pédagogiques.",
    exigences: [
      "Mise à jour des supports",
      "Accessibilité documentée",
      "Procédure de réactualisation",
    ],
    preuvesAttendues: [
      "Procédure de mise à jour",
      "Versions datées des supports",
      "Tableau de suivi actualisation",
    ],
    sourcesVerification: [
      {
        type: "formation",
        champs: ["updatedAt"],
        description: "Vérifier la mise à jour des formations",
      },
    ],
  },

  // CRITÈRE 5 - Qualification des personnels
  {
    numero: 22,
    critere: 5,
    libelle: "Compétences des intervenants",
    description: "Le prestataire s'assure de l'adéquation des compétences des personnes chargées d'accompagner ou de former les publics bénéficiaires.",
    exigences: [
      "CV des formateurs",
      "Diplômes/certifications",
      "Adéquation compétences/formations",
    ],
    preuvesAttendues: [
      "CV formateurs",
      "Copies diplômes",
      "Fiches de poste",
    ],
    sourcesVerification: [
      {
        type: "intervenant",
        champs: ["competences", "cv", "diplomes"],
        description: "Vérifier les compétences des intervenants",
      },
    ],
  },
  {
    numero: 23,
    critere: 5,
    libelle: "Développement des compétences",
    description: "Le prestataire entretient et développe les compétences de ses salariés, adaptées aux prestations qu'il délivre.",
    exigences: [
      "Plan de formation interne",
      "Formations suivies par les formateurs",
      "Veille pédagogique",
    ],
    preuvesAttendues: [
      "Plan de développement des compétences",
      "Attestations de formation",
      "Veille documentée",
    ],
    sourcesVerification: [
      {
        type: "intervenant",
        champs: ["formations"],
        description: "Vérifier les formations des intervenants",
      },
      {
        type: "veille",
        description: "Vérifier la veille réglementaire",
      },
    ],
  },
  {
    numero: 24,
    critere: 5,
    libelle: "Veille légale et réglementaire",
    description: "Le prestataire réalise une veille légale et réglementaire sur le champ de la formation professionnelle et en exploite les résultats.",
    exigences: [
      "Veille réglementaire organisée",
      "Exploitation des résultats",
      "Mise à jour des pratiques",
    ],
    preuvesAttendues: [
      "Sources de veille identifiées",
      "Synthèses de veille",
      "Actions mises en œuvre",
    ],
    sourcesVerification: [
      {
        type: "veille",
        description: "Vérifier les articles de veille",
      },
    ],
  },
  {
    numero: 25,
    critere: 5,
    libelle: "Veille sur les compétences métiers",
    description: "Le prestataire réalise une veille sur les évolutions des compétences, des métiers et des emplois dans ses secteurs d'intervention et en exploite les résultats.",
    exigences: [
      "Veille métiers organisée",
      "Évolutions prises en compte",
      "Actualisation des formations",
    ],
    preuvesAttendues: [
      "Veille sectorielle",
      "Mise à jour des référentiels",
      "Évolutions métiers intégrées",
    ],
    sourcesVerification: [
      {
        type: "veille",
        description: "Vérifier la veille métiers",
      },
      {
        type: "formation",
        description: "Vérifier la mise à jour des formations",
      },
    ],
  },

  // CRITÈRE 6 - Inscription dans l'environnement
  {
    numero: 26,
    critere: 6,
    libelle: "Veille sur les innovations",
    description: "Le prestataire réalise une veille sur les innovations pédagogiques et technologiques permettant une évolution de ses prestations et en exploite les résultats.",
    exigences: [
      "Veille innovation organisée",
      "Nouvelles pratiques testées",
      "Technologies intégrées",
    ],
    preuvesAttendues: [
      "Sources d'innovation identifiées",
      "Expérimentations documentées",
      "Évolutions mises en œuvre",
    ],
    sourcesVerification: [
      {
        type: "veille",
        description: "Vérifier la veille innovation",
      },
    ],
  },
  {
    numero: 27,
    critere: 6,
    libelle: "Réseau professionnel",
    description: "Le prestataire mobilise les expertises, outils et réseaux nécessaires pour accueillir, accompagner/former ou orienter les publics en situation de handicap.",
    exigences: [
      "Référent handicap actif",
      "Partenariats adaptés",
      "Adaptations documentées",
    ],
    preuvesAttendues: [
      "Fiche référent handicap",
      "Réseau de partenaires",
      "Adaptations réalisées",
    ],
    sourcesVerification: [
      {
        type: "organization",
        description: "Vérifier le référent handicap",
      },
      {
        type: "apprenant",
        champs: ["situationHandicap"],
        description: "Vérifier l'accompagnement handicap",
      },
    ],
  },
  {
    numero: 28,
    critere: 6,
    libelle: "Sous-traitance",
    description: "Lorsque le prestataire fait appel à la sous-traitance ou au portage salarial, il s'assure du respect de la conformité au présent référentiel.",
    exigences: [
      "Contrats de sous-traitance",
      "Vérification conformité sous-traitants",
      "Suivi qualité sous-traitance",
    ],
    preuvesAttendues: [
      "Contrats sous-traitance",
      "Certifications sous-traitants",
      "Évaluations sous-traitants",
    ],
    sourcesVerification: [
      {
        type: "intervenant",
        champs: ["type"],
        description: "Vérifier les intervenants externes",
      },
      {
        type: "document",
        champs: ["type"],
        description: "Vérifier les contrats sous-traitance",
      },
    ],
  },
  {
    numero: 29,
    critere: 6,
    libelle: "Insertion professionnelle",
    description: "Le prestataire mobilise les acteurs économiques du territoire pour co-construire les formations et assurer leur adéquation aux besoins du marché de l'emploi.",
    exigences: [
      "Partenariats entreprises",
      "Co-construction formations",
      "Adéquation au marché",
    ],
    preuvesAttendues: [
      "Conventions partenariat",
      "Enquêtes besoins entreprises",
      "Statistiques insertion",
    ],
    sourcesVerification: [
      {
        type: "entreprise",
        description: "Vérifier les partenariats",
      },
    ],
  },

  // CRITÈRE 7 - Appréciations et réclamations
  {
    numero: 30,
    critere: 7,
    libelle: "Recueil des appréciations",
    description: "Le prestataire recueille les appréciations des parties prenantes : bénéficiaires, financeurs, équipes pédagogiques et entreprises concernées.",
    exigences: [
      "Questionnaires de satisfaction",
      "Retours formateurs",
      "Feedback entreprises",
    ],
    preuvesAttendues: [
      "Questionnaires satisfaction",
      "Synthèses des retours",
      "Bilans par session",
    ],
    sourcesVerification: [
      {
        type: "evaluation",
        champs: ["type"],
        description: "Vérifier les évaluations de satisfaction",
      },
    ],
  },
  {
    numero: 31,
    critere: 7,
    libelle: "Traitement des réclamations",
    description: "Le prestataire met en œuvre des modalités de traitement des difficultés rencontrées par les parties prenantes, des réclamations exprimées par ces dernières, des aléas survenus en cours de prestation.",
    exigences: [
      "Procédure de réclamation",
      "Traitement documenté",
      "Actions correctives",
    ],
    preuvesAttendues: [
      "Procédure réclamations",
      "Registre des réclamations",
      "Suivi des actions",
    ],
    sourcesVerification: [
      {
        type: "reclamation",
        description: "Vérifier les réclamations traitées",
      },
    ],
  },
  {
    numero: 32,
    critere: 7,
    libelle: "Mesures d'amélioration",
    description: "Le prestataire met en œuvre des mesures d'amélioration à partir de l'analyse des appréciations et des réclamations.",
    exigences: [
      "Analyse des retours",
      "Plan d'amélioration",
      "Suivi des améliorations",
    ],
    preuvesAttendues: [
      "Synthèse des analyses",
      "Plan d'amélioration continue",
      "Actions mises en œuvre",
    ],
    sourcesVerification: [
      {
        type: "amelioration",
        description: "Vérifier les actions d'amélioration",
      },
    ],
  },
];

// Fonction pour récupérer un indicateur par son numéro
export function getIndicateur(numero: number): IndicateurQualiopi | undefined {
  return INDICATEURS_QUALIOPI.find((i) => i.numero === numero);
}

// Fonction pour récupérer les indicateurs d'un critère
export function getIndicateursByCritere(critere: number): IndicateurQualiopi[] {
  return INDICATEURS_QUALIOPI.filter((i) => i.critere === critere);
}

// Fonction pour récupérer un critère par son numéro
export function getCritere(numero: number) {
  return CRITERES_QUALIOPI.find((c) => c.numero === numero);
}
