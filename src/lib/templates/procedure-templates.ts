// ===========================================
// TEMPLATES PAR DÉFAUT - PROCÉDURES QUALITÉ
// ===========================================
// Templates système pour les procédures Qualiopi IND 26
// Design épuré, professionnel et conforme aux normes Qualiopi

import { DefaultTemplate } from "./types";

// ===========================================
// TEMPLATE: PROCÉDURE D'ACCUEIL DES STAGIAIRES
// ===========================================
export const PROCEDURE_ACCUEIL_TEMPLATE: DefaultTemplate = {
  name: "Procédure d'accueil des stagiaires",
  description: "Décrit le processus d'accueil et d'intégration des apprenants",
  documentType: "PROCEDURE_ACCUEIL",
  category: "DOCUMENT",
  content: {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1, textAlign: "center" },
        content: [{ type: "text", text: "PROCÉDURE D'ACCUEIL DES STAGIAIRES" }]
      },
      {
        type: "paragraph",
        attrs: { textAlign: "center" },
        content: [{ type: "text", text: "Indicateur Qualiopi : IND 26" }]
      },
      { type: "horizontalRule" },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "1. OBJET" }]
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Cette procédure définit les modalités d'accueil des stagiaires au sein de notre organisme de formation. Elle vise à garantir un accueil de qualité et à faciliter l'intégration des apprenants dans leur parcours de formation." }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "2. CHAMP D'APPLICATION" }]
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Cette procédure s'applique à l'ensemble des formations dispensées par l'organisme, qu'elles soient réalisées en présentiel, à distance ou en format hybride." }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "3. RESPONSABILITÉS" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Responsable pédagogique : " }, { type: "text", text: "Supervision de la procédure d'accueil" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Formateur : " }, { type: "text", text: "Mise en œuvre de l'accueil le jour J" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Équipe administrative : " }, { type: "text", text: "Préparation des documents et logistique" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "4. PROCESSUS D'ACCUEIL" }]
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "4.1 Avant la formation (J-7)" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Envoi de la convocation avec toutes les informations pratiques" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Transmission du programme détaillé de la formation" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Communication du règlement intérieur" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Recueil des besoins spécifiques (accessibilité, contraintes particulières)" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "4.2 Le jour de la formation (J)" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Accueil personnalisé des stagiaires à leur arrivée" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Présentation des locaux et des équipements" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Rappel des consignes de sécurité et du règlement intérieur" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Tour de table de présentation et recueil des attentes" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Présentation du programme, des objectifs et des modalités d'évaluation" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Signature de la feuille d'émargement" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "5. DOCUMENTS ASSOCIÉS" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Convocation" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Programme de formation" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Règlement intérieur" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Feuille d'émargement" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Livret d'accueil (si applicable)" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "6. INDICATEURS DE SUIVI" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Taux de satisfaction concernant l'accueil (enquête à chaud)" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Nombre de réclamations liées à l'accueil" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Délai d'envoi des convocations" }] }]
          }
        ]
      },
      { type: "horizontalRule" },
      {
        type: "paragraph",
        attrs: { textAlign: "right" },
        content: [
          { type: "text", marks: [{ type: "italic" }], text: "Date de mise à jour : " },
          { type: "templateVariable", attrs: { label: "Date du jour", category: "date", variableId: "date_jour" } }
        ]
      }
    ]
  },
  variables: ["date_jour"]
};

// ===========================================
// TEMPLATE: PROCÉDURE DE GESTION DES RÉCLAMATIONS
// ===========================================
export const PROCEDURE_RECLAMATIONS_TEMPLATE: DefaultTemplate = {
  name: "Procédure de gestion des réclamations",
  description: "Définit le traitement des réclamations et insatisfactions",
  documentType: "PROCEDURE_RECLAMATIONS",
  category: "DOCUMENT",
  content: {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1, textAlign: "center" },
        content: [{ type: "text", text: "PROCÉDURE DE GESTION DES RÉCLAMATIONS" }]
      },
      {
        type: "paragraph",
        attrs: { textAlign: "center" },
        content: [{ type: "text", text: "Indicateur Qualiopi : IND 26" }]
      },
      { type: "horizontalRule" },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "1. OBJET" }]
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Cette procédure définit les modalités de traitement des réclamations émises par les parties prenantes (stagiaires, entreprises, financeurs). Elle vise à garantir un traitement équitable et efficace des insatisfactions dans une démarche d'amélioration continue." }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "2. DÉFINITION" }]
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Une réclamation est l'expression d'une insatisfaction concernant les prestations de formation ou les services associés, nécessitant une réponse ou une résolution." }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "3. CANAUX DE RÉCEPTION" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Par email à l'adresse dédiée : reclamation@organisme.fr" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Par courrier postal" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Par téléphone (avec confirmation écrite)" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Via le formulaire en ligne" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Directement auprès du formateur ou du personnel administratif" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "4. PROCESSUS DE TRAITEMENT" }]
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "4.1 Réception et enregistrement (J)" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Enregistrement de la réclamation dans le registre dédié" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Attribution d'un numéro de suivi" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Accusé de réception envoyé sous 48h" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "4.2 Analyse (J+2 à J+5)" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Qualification de la réclamation (fondée, partiellement fondée, non fondée)" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Identification des causes" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Consultation des parties concernées si nécessaire" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "4.3 Réponse (J+7 maximum)" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Rédaction d'une réponse argumentée" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Proposition de solution ou d'action corrective" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Envoi de la réponse au réclamant" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "4.4 Suivi et clôture" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Mise en œuvre des actions correctives" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Vérification de la satisfaction du réclamant" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Clôture du dossier" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "5. INDICATEURS" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Nombre de réclamations par période" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Délai moyen de traitement" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Taux de réclamations résolues" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Typologie des réclamations" }] }]
          }
        ]
      },
      { type: "horizontalRule" },
      {
        type: "paragraph",
        attrs: { textAlign: "right" },
        content: [
          { type: "text", marks: [{ type: "italic" }], text: "Date de mise à jour : " },
          { type: "templateVariable", attrs: { label: "Date du jour", category: "date", variableId: "date_jour" } }
        ]
      }
    ]
  },
  variables: ["date_jour"]
};

// ===========================================
// TEMPLATE: PROCÉDURE D'ÉVALUATION
// ===========================================
export const PROCEDURE_EVALUATION_TEMPLATE: DefaultTemplate = {
  name: "Procédure d'évaluation",
  description: "Décrit les modalités d'évaluation des apprenants et des formations",
  documentType: "PROCEDURE_EVALUATION",
  category: "DOCUMENT",
  content: {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1, textAlign: "center" },
        content: [{ type: "text", text: "PROCÉDURE D'ÉVALUATION" }]
      },
      {
        type: "paragraph",
        attrs: { textAlign: "center" },
        content: [{ type: "text", text: "Indicateur Qualiopi : IND 26" }]
      },
      { type: "horizontalRule" },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "1. OBJET" }]
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Cette procédure définit les modalités d'évaluation mises en œuvre tout au long du parcours de formation, permettant de mesurer l'atteinte des objectifs pédagogiques et la satisfaction des parties prenantes." }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "2. TYPES D'ÉVALUATION" }]
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "2.1 Évaluations des acquis" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Positionnement initial : " }, { type: "text", text: "Évaluation des prérequis et du niveau d'entrée" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Évaluation formative : " }, { type: "text", text: "Suivi continu de la progression (quiz, exercices, mises en situation)" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Évaluation sommative : " }, { type: "text", text: "Validation des compétences acquises en fin de formation" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "2.2 Évaluations de satisfaction" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Évaluation à chaud : " }, { type: "text", text: "Questionnaire de satisfaction en fin de formation" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Évaluation à froid : " }, { type: "text", text: "Questionnaire à 3-6 mois sur l'application des acquis" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Évaluation entreprise : " }, { type: "text", text: "Enquête auprès des entreprises et financeurs" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "3. MODALITÉS DE MISE EN ŒUVRE" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Définition des critères et indicateurs d'évaluation pour chaque formation" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Communication des modalités d'évaluation aux stagiaires en début de formation" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Utilisation d'outils adaptés (questionnaires, grilles d'observation, tests)" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Traçabilité des évaluations dans le système d'information" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "4. TRAITEMENT DES RÉSULTATS" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Analyse des résultats après chaque session" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Identification des axes d'amélioration" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Mise en place d'actions correctives si nécessaire" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Reporting périodique à la direction" }] }]
          }
        ]
      },
      { type: "horizontalRule" },
      {
        type: "paragraph",
        attrs: { textAlign: "right" },
        content: [
          { type: "text", marks: [{ type: "italic" }], text: "Date de mise à jour : " },
          { type: "templateVariable", attrs: { label: "Date du jour", category: "date", variableId: "date_jour" } }
        ]
      }
    ]
  },
  variables: ["date_jour"]
};

// ===========================================
// TEMPLATE: PROCÉDURE DE SOUS-TRAITANCE
// ===========================================
export const PROCEDURE_SOUS_TRAITANCE_TEMPLATE: DefaultTemplate = {
  name: "Procédure de sous-traitance",
  description: "Encadre le recours aux sous-traitants et co-traitants",
  documentType: "PROCEDURE_SOUS_TRAITANCE",
  category: "DOCUMENT",
  content: {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1, textAlign: "center" },
        content: [{ type: "text", text: "PROCÉDURE DE SOUS-TRAITANCE" }]
      },
      {
        type: "paragraph",
        attrs: { textAlign: "center" },
        content: [{ type: "text", text: "Indicateurs Qualiopi : IND 26, 27" }]
      },
      { type: "horizontalRule" },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "1. OBJET" }]
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Cette procédure définit les modalités de sélection, de contractualisation et de suivi des sous-traitants et co-traitants intervenant dans le cadre des prestations de formation." }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "2. DÉFINITIONS" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Sous-traitance : " }, { type: "text", text: "Externalisation d'une partie de la prestation de formation à un prestataire tiers" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Co-traitance : " }, { type: "text", text: "Réalisation conjointe d'une prestation avec un partenaire" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "3. CRITÈRES DE SÉLECTION" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Certification Qualiopi ou équivalent" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Compétences et références dans le domaine concerné" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Conformité administrative (déclaration d'activité, assurances)" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Adéquation des moyens pédagogiques et techniques" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Adhésion à la démarche qualité de l'organisme" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "4. PROCESSUS" }]
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "4.1 Sélection" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Identification du besoin de sous-traitance" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Consultation de prestataires potentiels" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Vérification des pièces administratives" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Validation de la sélection" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "4.2 Contractualisation" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Signature d'un contrat de sous-traitance spécifiant :" }] }]
          }
        ]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "  - L'objet et le périmètre de la prestation" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "  - Les obligations de chaque partie" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "  - Les exigences qualité applicables" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "  - Les modalités de suivi et de contrôle" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "  - Les conditions financières" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "4.3 Suivi et évaluation" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Suivi de la réalisation des prestations" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Évaluation de la qualité des interventions" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Bilan annuel des sous-traitants" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Actions correctives si nécessaire" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "5. DOCUMENTS ASSOCIÉS" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Contrat de sous-traitance type" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Grille d'évaluation des sous-traitants" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Registre des sous-traitants" }] }]
          }
        ]
      },
      { type: "horizontalRule" },
      {
        type: "paragraph",
        attrs: { textAlign: "right" },
        content: [
          { type: "text", marks: [{ type: "italic" }], text: "Date de mise à jour : " },
          { type: "templateVariable", attrs: { label: "Date du jour", category: "date", variableId: "date_jour" } }
        ]
      }
    ]
  },
  variables: ["date_jour"]
};

// ===========================================
// TEMPLATE: PROCÉDURE DE VEILLE
// ===========================================
export const PROCEDURE_VEILLE_TEMPLATE: DefaultTemplate = {
  name: "Procédure de veille",
  description: "Organise la veille légale, métier et pédagogique",
  documentType: "PROCEDURE_VEILLE",
  category: "DOCUMENT",
  content: {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1, textAlign: "center" },
        content: [{ type: "text", text: "PROCÉDURE DE VEILLE" }]
      },
      {
        type: "paragraph",
        attrs: { textAlign: "center" },
        content: [{ type: "text", text: "Indicateurs Qualiopi : IND 23, 24, 25" }]
      },
      { type: "horizontalRule" },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "1. OBJET" }]
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Cette procédure définit l'organisation de la veille permettant de maintenir et d'améliorer la qualité des prestations de formation conformément aux exigences du référentiel Qualiopi." }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "2. TYPES DE VEILLE" }]
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "2.1 Veille légale et réglementaire (IND 23)" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Évolutions législatives et réglementaires de la formation professionnelle" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Textes de France Compétences et du Ministère du Travail" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Évolutions du référentiel Qualiopi" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "2.2 Veille métiers et compétences (IND 24)" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Évolutions des métiers et des besoins en compétences" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Publications des OPCO et branches professionnelles" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Tendances du marché de l'emploi" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "2.3 Veille innovation pédagogique (IND 25)" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Nouvelles méthodes et outils pédagogiques" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Technologies éducatives innovantes" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Bonnes pratiques du secteur" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "3. SOURCES DE VEILLE" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Légifrance, BOFIP" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "France Compétences, DGEFP" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Centre Inffo, FFFOD" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "OPCO, observatoires de branches" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Presse spécialisée, webinaires" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "4. TRAITEMENT ET DIFFUSION" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Centralisation des informations collectées" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Analyse d'impact sur les pratiques de l'organisme" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Diffusion aux équipes concernées" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Mise à jour des formations et documents si nécessaire" }] }]
          }
        ]
      },
      { type: "horizontalRule" },
      {
        type: "paragraph",
        attrs: { textAlign: "right" },
        content: [
          { type: "text", marks: [{ type: "italic" }], text: "Date de mise à jour : " },
          { type: "templateVariable", attrs: { label: "Date du jour", category: "date", variableId: "date_jour" } }
        ]
      }
    ]
  },
  variables: ["date_jour"]
};

// ===========================================
// TEMPLATE: PROCÉDURE D'ACCESSIBILITÉ HANDICAP
// ===========================================
export const PROCEDURE_ACCESSIBILITE_TEMPLATE: DefaultTemplate = {
  name: "Procédure d'accessibilité handicap",
  description: "Définit l'accueil et l'accompagnement des personnes en situation de handicap",
  documentType: "PROCEDURE_ACCESSIBILITE",
  category: "DOCUMENT",
  content: {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1, textAlign: "center" },
        content: [{ type: "text", text: "PROCÉDURE D'ACCESSIBILITÉ HANDICAP" }]
      },
      {
        type: "paragraph",
        attrs: { textAlign: "center" },
        content: [{ type: "text", text: "Indicateur Qualiopi : IND 26" }]
      },
      { type: "horizontalRule" },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "1. ENGAGEMENT" }]
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Notre organisme s'engage à faciliter l'accès des personnes en situation de handicap à ses formations, en proposant des adaptations pédagogiques et des aménagements raisonnables." }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "2. RÉFÉRENT HANDICAP" }]
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Un référent handicap est désigné au sein de l'organisme. Il est le point de contact privilégié pour :" }
        ]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Informer et orienter les personnes en situation de handicap" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Identifier les besoins d'adaptation" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Coordonner les aménagements nécessaires" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Faire le lien avec les partenaires spécialisés (AGEFIPH, Cap Emploi, etc.)" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "3. PROCESSUS D'ACCUEIL" }]
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "3.1 Identification des besoins" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Questionnaire d'inscription mentionnant les besoins spécifiques" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Entretien individuel avec le référent handicap si besoin" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Analyse de faisabilité des adaptations" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "3.2 Adaptations possibles" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Adaptation des supports pédagogiques (taille des caractères, contrastes)" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Aménagement des horaires et du rythme" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Accessibilité physique des locaux" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Matériel adapté (vidéoprojecteur, amplificateur)" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Tiers temps pour les évaluations" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "4. PARTENAIRES" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "AGEFIPH / FIPHFP" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Cap Emploi / Pôle Emploi" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "MDPH" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Ressource Handicap Formation" }] }]
          }
        ]
      },
      { type: "horizontalRule" },
      {
        type: "paragraph",
        attrs: { textAlign: "right" },
        content: [
          { type: "text", marks: [{ type: "italic" }], text: "Date de mise à jour : " },
          { type: "templateVariable", attrs: { label: "Date du jour", category: "date", variableId: "date_jour" } }
        ]
      }
    ]
  },
  variables: ["date_jour"]
};

// ===========================================
// TEMPLATE: PROCÉDURE DE SUIVI DES STAGIAIRES
// ===========================================
export const PROCEDURE_SUIVI_STAGIAIRES_TEMPLATE: DefaultTemplate = {
  name: "Procédure de suivi des stagiaires",
  description: "Organise le suivi et l'accompagnement des apprenants pendant la formation",
  documentType: "PROCEDURE_SUIVI_STAGIAIRES",
  category: "DOCUMENT",
  content: {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1, textAlign: "center" },
        content: [{ type: "text", text: "PROCÉDURE DE SUIVI DES STAGIAIRES" }]
      },
      {
        type: "paragraph",
        attrs: { textAlign: "center" },
        content: [{ type: "text", text: "Indicateur Qualiopi : IND 26" }]
      },
      { type: "horizontalRule" },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "1. OBJET" }]
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Cette procédure définit les modalités de suivi et d'accompagnement des stagiaires tout au long de leur parcours de formation." }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "2. SUIVI DE L'ASSIDUITÉ" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Émargement à chaque demi-journée (présentiel) ou connexion (distanciel)" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Suivi des temps de connexion pour les formations en ligne" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Gestion des absences et des retards" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Signalement des absences prolongées à l'employeur/financeur" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "3. SUIVI PÉDAGOGIQUE" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Points réguliers sur la progression individuelle" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Identification des difficultés d'apprentissage" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Mise en place de soutien personnalisé si nécessaire" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Évaluations formatives régulières" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "4. ACCOMPAGNEMENT INDIVIDUEL" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Disponibilité du formateur pour les questions" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Entretiens individuels sur demande" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Orientation vers des ressources complémentaires" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "5. TRAÇABILITÉ" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Dossier de suivi par stagiaire" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Feuilles d'émargement archivées" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Résultats des évaluations" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Notes de suivi des entretiens" }] }]
          }
        ]
      },
      { type: "horizontalRule" },
      {
        type: "paragraph",
        attrs: { textAlign: "right" },
        content: [
          { type: "text", marks: [{ type: "italic" }], text: "Date de mise à jour : " },
          { type: "templateVariable", attrs: { label: "Date du jour", category: "date", variableId: "date_jour" } }
        ]
      }
    ]
  },
  variables: ["date_jour"]
};

// ===========================================
// TEMPLATE: PROCÉDURE DE GESTION DES COMPÉTENCES
// ===========================================
export const PROCEDURE_GESTION_COMPETENCES_TEMPLATE: DefaultTemplate = {
  name: "Procédure de gestion des compétences",
  description: "Définit le maintien et le développement des compétences des formateurs",
  documentType: "PROCEDURE_GESTION_COMPETENCES",
  category: "DOCUMENT",
  content: {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1, textAlign: "center" },
        content: [{ type: "text", text: "PROCÉDURE DE GESTION DES COMPÉTENCES" }]
      },
      {
        type: "paragraph",
        attrs: { textAlign: "center" },
        content: [{ type: "text", text: "Indicateur Qualiopi : IND 26" }]
      },
      { type: "horizontalRule" },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "1. OBJET" }]
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Cette procédure définit les modalités de maintien et de développement des compétences de l'équipe pédagogique et administrative de l'organisme de formation." }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "2. CHAMP D'APPLICATION" }]
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Cette procédure s'applique à l'ensemble des collaborateurs intervenant dans le processus de formation : formateurs, coordinateurs pédagogiques, personnel administratif." }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "3. IDENTIFICATION DES COMPÉTENCES" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Définition des compétences requises par poste/fonction" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Cartographie des compétences existantes" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Identification des écarts à combler" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "4. PLAN DE DÉVELOPPEMENT" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Entretiens professionnels annuels" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Recueil des besoins en formation" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Élaboration du plan de formation interne" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Suivi de la réalisation des actions" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "5. TYPES D'ACTIONS" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Formations externes (certifiantes ou non)" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Formations internes et partage de pratiques" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Participation à des colloques et conférences" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Veille professionnelle" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Certification/recertification métier" }] }]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "6. TRAÇABILITÉ" }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "CV et diplômes des intervenants" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Attestations de formation continue" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Comptes-rendus d'entretiens professionnels" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Bilan annuel du plan de développement" }] }]
          }
        ]
      },
      { type: "horizontalRule" },
      {
        type: "paragraph",
        attrs: { textAlign: "right" },
        content: [
          { type: "text", marks: [{ type: "italic" }], text: "Date de mise à jour : " },
          { type: "templateVariable", attrs: { label: "Date du jour", category: "date", variableId: "date_jour" } }
        ]
      }
    ]
  },
  variables: ["date_jour"]
};

// ===========================================
// LISTE DE TOUS LES TEMPLATES DE PROCÉDURES
// ===========================================
export const PROCEDURE_TEMPLATES: DefaultTemplate[] = [
  PROCEDURE_ACCUEIL_TEMPLATE,
  PROCEDURE_RECLAMATIONS_TEMPLATE,
  PROCEDURE_EVALUATION_TEMPLATE,
  PROCEDURE_SOUS_TRAITANCE_TEMPLATE,
  PROCEDURE_VEILLE_TEMPLATE,
  PROCEDURE_ACCESSIBILITE_TEMPLATE,
  PROCEDURE_SUIVI_STAGIAIRES_TEMPLATE,
  PROCEDURE_GESTION_COMPETENCES_TEMPLATE,
];
