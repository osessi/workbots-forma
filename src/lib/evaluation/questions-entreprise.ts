// ===========================================
// QUESTIONS ÉVALUATION ENTREPRISE
// ===========================================
// Questions pour l'évaluation de satisfaction des entreprises clientes
// (DRH, responsable formation, donneur d'ordre)
// Qualiopi - Retours des entreprises / donneurs d'ordre

export interface QuestionEntreprise {
  id: string;
  field: string;
  question: string;
  description?: string;
  type: "rating" | "text";
  required: boolean;
  section: string;
}

export const QUESTIONS_EVALUATION_ENTREPRISE: QuestionEntreprise[] = [
  // =====================================================
  // SECTION 1: PRÉPARATION DE LA FORMATION
  // =====================================================
  {
    id: "q1",
    field: "analyseBesoins",
    question: "L'analyse des besoins de formation a-t-elle été réalisée correctement ?",
    description: "Prise en compte de vos attentes, diagnostic des besoins de vos collaborateurs",
    type: "rating",
    required: true,
    section: "Préparation de la formation",
  },
  {
    id: "q2",
    field: "programmeAttentes",
    question: "Le programme proposé correspondait-il à vos attentes ?",
    description: "Adéquation du contenu avec vos objectifs",
    type: "rating",
    required: true,
    section: "Préparation de la formation",
  },
  {
    id: "q3",
    field: "modalitesLogistiques",
    question: "Les modalités logistiques (dates, lieu, horaires) étaient-elles adaptées ?",
    description: "Organisation pratique de la formation",
    type: "rating",
    required: true,
    section: "Préparation de la formation",
  },

  // =====================================================
  // SECTION 2: QUALITÉ DE LA FORMATION
  // =====================================================
  {
    id: "q4",
    field: "objectifsAtteints",
    question: "Les objectifs de formation ont-ils été atteints ?",
    description: "Résultats observés par rapport aux objectifs définis",
    type: "rating",
    required: true,
    section: "Qualité de la formation",
  },
  {
    id: "q5",
    field: "qualitePedagogique",
    question: "La qualité pédagogique du formateur était-elle satisfaisante ?",
    description: "Compétences, expertise et pédagogie du formateur",
    type: "rating",
    required: true,
    section: "Qualité de la formation",
  },
  {
    id: "q6",
    field: "qualiteSupports",
    question: "Les supports pédagogiques étaient-ils adaptés et de qualité ?",
    description: "Documentation, outils, ressources fournis",
    type: "rating",
    required: true,
    section: "Qualité de la formation",
  },
  {
    id: "q7",
    field: "reponseBesoinsOperationnels",
    question: "La formation a-t-elle répondu aux besoins opérationnels identifiés ?",
    description: "Application pratique des acquis dans le contexte professionnel",
    type: "rating",
    required: true,
    section: "Qualité de la formation",
  },

  // =====================================================
  // SECTION 3: SUIVI ET COMMUNICATION
  // =====================================================
  {
    id: "q8",
    field: "qualiteCommunication",
    question: "La communication avec l'organisme de formation était-elle efficace ?",
    description: "Réactivité, clarté des informations, disponibilité",
    type: "rating",
    required: true,
    section: "Suivi et communication",
  },
  {
    id: "q9",
    field: "documentsDelais",
    question: "Les documents administratifs ont-ils été transmis dans les délais ?",
    description: "Convention, programme, attestations, factures...",
    type: "rating",
    required: true,
    section: "Suivi et communication",
  },
  {
    id: "q10",
    field: "suiviPostFormation",
    question: "Un suivi post-formation a-t-il été proposé ?",
    description: "Bilan, évaluation des acquis, accompagnement après la formation",
    type: "rating",
    required: true,
    section: "Suivi et communication",
  },

  // =====================================================
  // SECTION 4: SATISFACTION GLOBALE
  // =====================================================
  {
    id: "q11",
    field: "satisfactionGlobale",
    question: "Quel est votre niveau de satisfaction globale ?",
    description: "Appréciation générale de la prestation",
    type: "rating",
    required: true,
    section: "Satisfaction globale",
  },
  {
    id: "q12",
    field: "recommandation",
    question: "Recommanderiez-vous cet organisme de formation ?",
    description: "0 = Pas du tout, 10 = Absolument",
    type: "rating",
    required: true,
    section: "Satisfaction globale",
  },
  {
    id: "q13",
    field: "nouvelleCollaboration",
    question: "Feriez-vous à nouveau appel à cet organisme ?",
    description: "Intention de renouveler la collaboration",
    type: "rating",
    required: true,
    section: "Satisfaction globale",
  },

  // =====================================================
  // SECTION 5: IMPACT
  // =====================================================
  {
    id: "q14",
    field: "ameliorationCompetences",
    question: "Avez-vous constaté une amélioration des compétences des collaborateurs formés ?",
    description: "Progression observable des compétences après la formation",
    type: "rating",
    required: true,
    section: "Impact",
  },
  {
    id: "q15",
    field: "impactActivite",
    question: "Cette formation a-t-elle eu un impact positif sur votre activité ?",
    description: "Bénéfices concrets pour votre organisation",
    type: "rating",
    required: true,
    section: "Impact",
  },

  // =====================================================
  // SECTION 6: COMMENTAIRES
  // =====================================================
  {
    id: "q16",
    field: "pointsForts",
    question: "Quels sont les points forts de cette formation ?",
    description: "Ce que vous avez particulièrement apprécié",
    type: "text",
    required: false,
    section: "Commentaires",
  },
  {
    id: "q17",
    field: "pointsAmeliorer",
    question: "Quels points pourraient être améliorés ?",
    description: "Vos suggestions d'amélioration",
    type: "text",
    required: false,
    section: "Commentaires",
  },
  {
    id: "q18",
    field: "suggestionsAutres",
    question: "Avez-vous d'autres commentaires ou suggestions ?",
    description: "Toute remarque complémentaire",
    type: "text",
    required: false,
    section: "Commentaires",
  },
];

// Grouper les questions par section
export const SECTIONS_EVALUATION_ENTREPRISE = [
  {
    id: "preparation",
    title: "Préparation de la formation",
    description: "Évaluez la phase préparatoire et l'adaptation à vos besoins",
    questions: QUESTIONS_EVALUATION_ENTREPRISE.filter(q => q.section === "Préparation de la formation"),
  },
  {
    id: "qualite",
    title: "Qualité de la formation",
    description: "Évaluez la qualité de l'intervention et des contenus",
    questions: QUESTIONS_EVALUATION_ENTREPRISE.filter(q => q.section === "Qualité de la formation"),
  },
  {
    id: "suivi",
    title: "Suivi et communication",
    description: "Évaluez la communication et le suivi administratif",
    questions: QUESTIONS_EVALUATION_ENTREPRISE.filter(q => q.section === "Suivi et communication"),
  },
  {
    id: "satisfaction",
    title: "Satisfaction globale",
    description: "Votre appréciation générale",
    questions: QUESTIONS_EVALUATION_ENTREPRISE.filter(q => q.section === "Satisfaction globale"),
  },
  {
    id: "impact",
    title: "Impact",
    description: "L'impact de la formation sur vos collaborateurs et votre activité",
    questions: QUESTIONS_EVALUATION_ENTREPRISE.filter(q => q.section === "Impact"),
  },
  {
    id: "commentaires",
    title: "Commentaires",
    description: "Vos remarques et suggestions",
    questions: QUESTIONS_EVALUATION_ENTREPRISE.filter(q => q.section === "Commentaires"),
  },
];
