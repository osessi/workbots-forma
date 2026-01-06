// ===========================================
// QUESTIONS ÉVALUATION FINANCEUR
// ===========================================
// Questions pour l'évaluation de satisfaction des financeurs (OPCO, CPF, Pôle Emploi, etc.)
// Qualiopi - Retours des financeurs

export interface QuestionFinanceur {
  id: string;
  field: string;
  question: string;
  description?: string;
  type: "rating" | "text";
  required: boolean;
  section: string;
}

export const QUESTIONS_EVALUATION_FINANCEUR: QuestionFinanceur[] = [
  // Section : Qualité de la collaboration
  {
    id: "q1",
    field: "qualiteCommunication",
    question: "La communication avec l'organisme de formation était-elle claire et efficace ?",
    description: "Qualité des échanges, réactivité, clarté des informations",
    type: "rating",
    required: true,
    section: "Qualité de la collaboration",
  },
  {
    id: "q2",
    field: "documentsDelais",
    question: "Les documents administratifs ont-ils été fournis dans les délais impartis ?",
    description: "Conventions, factures, certificats de réalisation, attestations...",
    type: "rating",
    required: true,
    section: "Qualité de la collaboration",
  },
  {
    id: "q3",
    field: "qualiteLivrables",
    question: "La qualité des livrables est-elle satisfaisante ?",
    description: "Qualité des documents produits (conventions, certificats, etc.)",
    type: "rating",
    required: true,
    section: "Qualité de la collaboration",
  },
  {
    id: "q4",
    field: "echangesProfessionnels",
    question: "Les échanges avec l'organisme ont-ils été professionnels et courtois ?",
    description: "Professionnalisme, courtoisie, respect des engagements",
    type: "rating",
    required: true,
    section: "Qualité de la collaboration",
  },
  {
    id: "q5",
    field: "recommandation",
    question: "Recommanderiez-vous cet organisme pour de futures formations ?",
    description: "0 = Pas du tout, 10 = Absolument",
    type: "rating",
    required: true,
    section: "Qualité de la collaboration",
  },
  // Section : Suggestions
  {
    id: "q6",
    field: "suggestions",
    question: "Avez-vous des suggestions d'amélioration ou des commentaires ?",
    description: "Toute remarque constructive est la bienvenue",
    type: "text",
    required: false,
    section: "Suggestions",
  },
];

// Grouper les questions par section
export const SECTIONS_EVALUATION_FINANCEUR = [
  {
    id: "collaboration",
    title: "Qualité de la collaboration",
    description: "Évaluez la qualité de nos échanges et livrables",
    questions: QUESTIONS_EVALUATION_FINANCEUR.filter(q => q.section === "Qualité de la collaboration"),
  },
  {
    id: "suggestions",
    title: "Suggestions",
    description: "Vos commentaires et suggestions d'amélioration",
    questions: QUESTIONS_EVALUATION_FINANCEUR.filter(q => q.section === "Suggestions"),
  },
];
