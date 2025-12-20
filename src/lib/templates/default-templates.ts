// ===========================================
// TEMPLATES PAR DEFAUT - VERSION PROFESSIONNELLE
// ===========================================
// Ces templates sont créés automatiquement comme templates système
// Design épuré, professionnel et conforme aux normes Qualiopi

export interface DefaultTemplate {
  name: string;
  description: string;
  documentType: string;
  category: "DOCUMENT" | "EMAIL" | "PDF";
  content: object;
  headerContent?: object;
  footerContent?: object;
  variables: string[];
}

// ===========================================
// HELPERS POUR CRÉER DU CONTENU TIPTAP
// ===========================================

const createTipTapContent = (children: object[]) => ({
  type: "doc",
  content: children,
});

const paragraph = (text: string, attrs?: { textAlign?: string }) => ({
  type: "paragraph",
  ...(attrs && { attrs }),
  content: text ? [{ type: "text", text }] : [],
});

const centeredParagraph = (text: string) => ({
  type: "paragraph",
  attrs: { textAlign: "center" },
  content: text ? [{ type: "text", text }] : [],
});

const heading = (level: number, text: string, attrs?: { textAlign?: string }) => ({
  type: "heading",
  attrs: { level, ...(attrs || {}) },
  content: [{ type: "text", text }],
});

const centeredHeading = (level: number, text: string) => ({
  type: "heading",
  attrs: { level, textAlign: "center" },
  content: [{ type: "text", text }],
});

const bulletList = (items: string[]) => ({
  type: "bulletList",
  content: items.map(item => ({
    type: "listItem",
    content: [paragraph(item)],
  })),
});

const orderedList = (items: string[]) => ({
  type: "orderedList",
  attrs: { start: 1 },
  content: items.map(item => ({
    type: "listItem",
    content: [paragraph(item)],
  })),
});

const horizontalRule = () => ({
  type: "horizontalRule",
});

const boldText = (text: string) => ({
  type: "text",
  marks: [{ type: "bold" }],
  text,
});

const italicText = (text: string) => ({
  type: "text",
  marks: [{ type: "italic" }],
  text,
});

const variable = (id: string) => ({
  type: "templateVariable",
  attrs: { id },
});

const textWithVariable = (parts: (string | { var: string } | { bold: string } | { italic: string })[]) => ({
  type: "paragraph",
  content: parts.map(part => {
    if (typeof part === "string") {
      return { type: "text", text: part };
    }
    if ("var" in part) {
      return { type: "templateVariable", attrs: { id: part.var } };
    }
    if ("bold" in part) {
      return boldText(part.bold);
    }
    if ("italic" in part) {
      return italicText(part.italic);
    }
    return { type: "text", text: "" };
  }),
});

const centeredTextWithVariable = (parts: (string | { var: string } | { bold: string })[]) => ({
  type: "paragraph",
  attrs: { textAlign: "center" },
  content: parts.map(part => {
    if (typeof part === "string") {
      return { type: "text", text: part };
    }
    if ("var" in part) {
      return { type: "templateVariable", attrs: { id: part.var } };
    }
    if ("bold" in part) {
      return boldText(part.bold);
    }
    return { type: "text", text: "" };
  }),
});

const spacer = () => paragraph("");

// ===========================================
// TEMPLATE: FICHE PÉDAGOGIQUE
// ===========================================
export const FICHE_PEDAGOGIQUE_TEMPLATE: DefaultTemplate = {
  name: "Programme de formation",
  description: "Programme détaillé de la formation avec objectifs, contenu et modalités",
  documentType: "FICHE_PEDAGOGIQUE",
  category: "DOCUMENT",
  variables: [
    "formation.titre",
    "formation.description",
    "formation.duree",
    "formation.duree_heures",
    "formation.objectifs",
    "formation.prerequis",
    "formation.public_vise",
    "formation.modalites",
    "formation.prix",
    "modules",
    "organisation.nom",
    "organisation.numero_da",
    "organisation.telephone",
  ],
  headerContent: createTipTapContent([
    textWithVariable([{ var: "organisation.nom" }]),
  ]),
  content: createTipTapContent([
    centeredHeading(1, "PROGRAMME DE FORMATION"),
    spacer(),
    horizontalRule(),
    spacer(),
    centeredTextWithVariable([{ var: "formation.titre" }]),
    spacer(),
    horizontalRule(),
    spacer(),

    heading(2, "PRÉSENTATION"),
    textWithVariable([{ var: "formation.description" }]),
    spacer(),

    heading(2, "OBJECTIFS PÉDAGOGIQUES"),
    paragraph("À l'issue de cette formation, le stagiaire sera capable de :"),
    textWithVariable([{ var: "formation.objectifs" }]),
    spacer(),

    heading(2, "PUBLIC VISÉ"),
    textWithVariable([{ var: "formation.public_vise" }]),
    spacer(),

    heading(2, "PRÉREQUIS"),
    textWithVariable([{ var: "formation.prerequis" }]),
    spacer(),

    heading(2, "DURÉE ET MODALITÉS"),
    textWithVariable([{ bold: "Durée : " }, { var: "formation.duree" }]),
    textWithVariable([{ bold: "Modalités : " }, { var: "formation.modalites" }]),
    textWithVariable([{ bold: "Effectif maximum : " }, "12 participants"]),
    spacer(),

    heading(2, "CONTENU DE LA FORMATION"),
    textWithVariable([{ var: "modules" }]),
    spacer(),

    heading(2, "SUIVI DE L'EXÉCUTION ET ÉVALUATION DES RÉSULTATS"),
    bulletList([
      "Feuilles d'émargement signées par demi-journée pour attester de la présence des participants",
      "Évaluation de fin de formation pour valider les acquis des participants",
      "Auto-évaluation des compétences en début et en fin de formation pour mesurer la progression",
      "Questionnaire de satisfaction à chaud remis à chaque participant",
      "Attestation de fin de formation délivrée aux participants ayant suivi l'intégralité de la session",
    ]),
    spacer(),

    heading(2, "RESSOURCES PÉDAGOGIQUES"),
    bulletList([
      "Formation réalisée en présentiel (en salle équipée, en intra-entreprise) ou à distance via un outil de visioconférence (en classe virtuelle synchrone)",
      "Accompagnement par le formateur : suivi individualisé et réponses aux questions tout au long de la formation",
      "Ateliers pratiques : mises en situation et exercices appliqués pour ancrer les compétences",
      "Supports de cours remis aux participants (version numérique et/ou papier)",
    ]),
    spacer(),

    heading(2, "TARIF"),
    textWithVariable([{ var: "formation.prix" }, " € HT par participant"]),
    paragraph("(TVA non applicable, article 261-4-4° du CGI)"),
    spacer(),

    heading(2, "ACCESSIBILITÉ"),
    paragraph("Cette formation est accessible aux personnes en situation de handicap. Merci de nous contacter pour étudier ensemble les possibilités d'adaptation."),
  ]),
  footerContent: createTipTapContent([
    textWithVariable([{ var: "organisation.nom" }, " — N° DA : ", { var: "organisation.numero_da" }]),
  ]),
};

// ===========================================
// TEMPLATE: CONVENTION DE FORMATION
// ===========================================
export const CONVENTION_TEMPLATE: DefaultTemplate = {
  name: "Convention de formation",
  description: "Convention de formation professionnelle conforme à l'Article L.6353-1",
  documentType: "CONVENTION",
  category: "DOCUMENT",
  variables: [
    "organisation.nom",
    "organisation.siret",
    "organisation.numero_da",
    "organisation.adresse",
    "organisation.code_postal",
    "organisation.ville",
    "entreprise.nom",
    "entreprise.siret",
    "entreprise.adresse",
    "entreprise.code_postal",
    "entreprise.ville",
    "entreprise.representant",
    "formation.titre",
    "formation.duree",
    "formation.duree_heures",
    "formation.prix",
    "formation.objectifs",
    "formation.lieu",
    "formation.modalites",
    "dates.date_complete",
    "participants",
  ],
  headerContent: createTipTapContent([
    centeredTextWithVariable([{ var: "organisation.nom" }]),
  ]),
  content: createTipTapContent([
    spacer(),
    centeredHeading(1, "CONVENTION DE FORMATION PROFESSIONNELLE"),
    centeredParagraph("(Articles L.6353-1 et L.6353-2 du Code du travail)"),
    spacer(),
    horizontalRule(),
    spacer(),

    heading(2, "ENTRE LES SOUSSIGNÉS"),
    spacer(),

    textWithVariable([{ bold: "L'ORGANISME DE FORMATION" }]),
    textWithVariable([{ var: "organisation.nom" }]),
    textWithVariable(["SIRET : ", { var: "organisation.siret" }]),
    textWithVariable(["N° Déclaration d'activité : ", { var: "organisation.numero_da" }]),
    textWithVariable(["Adresse : ", { var: "organisation.adresse" }, ", ", { var: "organisation.code_postal" }, " ", { var: "organisation.ville" }]),
    paragraph("Ci-après dénommé « le Prestataire »"),
    spacer(),

    centeredParagraph("ET"),
    spacer(),

    textWithVariable([{ bold: "LE CLIENT" }]),
    textWithVariable([{ var: "entreprise.nom" }]),
    textWithVariable(["SIRET : ", { var: "entreprise.siret" }]),
    textWithVariable(["Adresse : ", { var: "entreprise.adresse" }, ", ", { var: "entreprise.code_postal" }, " ", { var: "entreprise.ville" }]),
    textWithVariable(["Représenté(e) par : ", { var: "entreprise.representant" }]),
    paragraph("Ci-après dénommé « le Client »"),
    spacer(),

    paragraph("Il est convenu ce qui suit :"),
    spacer(),
    horizontalRule(),
    spacer(),

    heading(2, "ARTICLE 1 — OBJET DE LA CONVENTION"),
    textWithVariable([
      "Le Prestataire s'engage à organiser l'action de formation intitulée : ",
      { bold: "" },
    ]),
    textWithVariable([{ var: "formation.titre" }]),
    spacer(),

    heading(2, "ARTICLE 2 — OBJECTIFS"),
    paragraph("À l'issue de la formation, les participants seront capables de :"),
    textWithVariable([{ var: "formation.objectifs" }]),
    spacer(),

    heading(2, "ARTICLE 3 — PROGRAMME"),
    paragraph("Le programme détaillé est annexé à la présente convention."),
    spacer(),

    heading(2, "ARTICLE 4 — PARTICIPANTS"),
    textWithVariable([{ var: "participants" }]),
    spacer(),

    heading(2, "ARTICLE 5 — DURÉE ET LIEU"),
    textWithVariable([{ bold: "Durée totale : " }, { var: "formation.duree" }, " (", { var: "formation.duree_heures" }, " heures)"]),
    textWithVariable([{ bold: "Modalités : " }, { var: "formation.modalites" }]),
    textWithVariable([{ bold: "Lieu : " }, { var: "formation.lieu" }]),
    spacer(),

    heading(2, "ARTICLE 6 — PRIX ET MODALITÉS DE RÈGLEMENT"),
    textWithVariable([{ bold: "Prix total HT : " }, { var: "formation.prix" }, " €"]),
    paragraph("(TVA non applicable, article 261-4-4° du CGI)"),
    spacer(),
    paragraph("Le règlement s'effectue à réception de facture, selon les conditions suivantes :"),
    bulletList([
      "30% à la signature de la convention (acompte)",
      "Solde à réception de la facture, à l'issue de la formation",
    ]),
    spacer(),

    heading(2, "ARTICLE 7 — DÉLAI DE RÉTRACTATION"),
    paragraph("En cas de signature hors établissement, le Client dispose d'un délai de rétractation de 14 jours."),
    spacer(),

    heading(2, "ARTICLE 8 — ANNULATION ET REPORT"),
    paragraph("En cas d'annulation par le Client moins de 15 jours avant le début de la formation, une indemnité de 50% du coût sera due."),
    spacer(),

    heading(2, "ARTICLE 9 — ATTESTATION"),
    paragraph("Une attestation de fin de formation sera remise à chaque participant ayant suivi l'intégralité de la formation."),
    spacer(),

    heading(2, "ARTICLE 10 — LITIGE"),
    paragraph("En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, le tribunal compétent sera celui du siège du Prestataire."),
    spacer(),
    horizontalRule(),
    spacer(),

    textWithVariable(["Fait en deux exemplaires originaux, le ", { var: "dates.date_complete" }]),
    spacer(),
    spacer(),

    paragraph("Pour le Prestataire                                        Pour le Client"),
    paragraph("(Signature précédée de                                 (Signature précédée de"),
    paragraph("« Lu et approuvé »)                                       « Lu et approuvé »)"),
  ]),
  footerContent: createTipTapContent([
    centeredParagraph("Convention de formation professionnelle"),
  ]),
};

// ===========================================
// TEMPLATE: CONTRAT DE FORMATION (PARTICULIER)
// ===========================================
export const CONTRAT_FORMATION_TEMPLATE: DefaultTemplate = {
  name: "Contrat de formation",
  description: "Contrat de formation pour les particuliers (Article L.6353-3 à L.6353-7)",
  documentType: "CONTRAT_FORMATION",
  category: "DOCUMENT",
  variables: [
    "organisation.nom",
    "organisation.siret",
    "organisation.numero_da",
    "organisation.adresse",
    "participant.nom",
    "participant.prenom",
    "participant.adresse",
    "formation.titre",
    "formation.duree",
    "formation.duree_heures",
    "formation.prix",
    "formation.objectifs",
    "formation.modalites",
    "dates.date_complete",
  ],
  headerContent: createTipTapContent([
    centeredTextWithVariable([{ var: "organisation.nom" }]),
  ]),
  content: createTipTapContent([
    spacer(),
    centeredHeading(1, "CONTRAT DE FORMATION PROFESSIONNELLE"),
    centeredParagraph("(Articles L.6353-3 à L.6353-7 du Code du travail)"),
    spacer(),
    horizontalRule(),
    spacer(),

    heading(2, "ENTRE LES SOUSSIGNÉS"),
    spacer(),

    textWithVariable([{ bold: "L'ORGANISME DE FORMATION" }]),
    textWithVariable([{ var: "organisation.nom" }]),
    textWithVariable(["N° SIRET : ", { var: "organisation.siret" }]),
    textWithVariable(["N° Déclaration d'activité : ", { var: "organisation.numero_da" }]),
    textWithVariable(["Adresse : ", { var: "organisation.adresse" }]),
    paragraph("Ci-après dénommé « le Prestataire »"),
    spacer(),

    centeredParagraph("ET"),
    spacer(),

    textWithVariable([{ bold: "LE STAGIAIRE" }]),
    textWithVariable(["M./Mme ", { var: "participant.prenom" }, " ", { var: "participant.nom" }]),
    textWithVariable(["Adresse : ", { var: "participant.adresse" }]),
    paragraph("Ci-après dénommé « le Stagiaire »"),
    spacer(),

    paragraph("Il est convenu ce qui suit :"),
    spacer(),
    horizontalRule(),
    spacer(),

    heading(2, "ARTICLE 1 — OBJET"),
    textWithVariable([
      "Le présent contrat a pour objet la réalisation de l'action de formation : ",
    ]),
    textWithVariable([{ bold: "" }, { var: "formation.titre" }]),
    spacer(),

    heading(2, "ARTICLE 2 — NATURE ET CARACTÉRISTIQUES"),
    textWithVariable([{ bold: "Objectifs : " }]),
    textWithVariable([{ var: "formation.objectifs" }]),
    spacer(),
    textWithVariable([{ bold: "Durée : " }, { var: "formation.duree" }, " (", { var: "formation.duree_heures" }, " heures)"]),
    textWithVariable([{ bold: "Modalités : " }, { var: "formation.modalites" }]),
    spacer(),

    heading(2, "ARTICLE 3 — NIVEAU REQUIS ET PUBLIC"),
    paragraph("Cette formation s'adresse aux personnes souhaitant acquérir ou développer leurs compétences dans le domaine concerné."),
    spacer(),

    heading(2, "ARTICLE 4 — SANCTION DE LA FORMATION"),
    paragraph("Une attestation de fin de formation sera remise au Stagiaire à l'issue de la formation."),
    spacer(),

    heading(2, "ARTICLE 5 — PRIX ET MODALITÉS DE PAIEMENT"),
    textWithVariable([{ bold: "Coût total de la formation : " }, { var: "formation.prix" }, " €"]),
    paragraph("(TVA non applicable, article 261-4-4° du CGI)"),
    spacer(),
    paragraph("Échelonnement des paiements :"),
    bulletList([
      "30% à la signature du contrat",
      "70% au plus tard le premier jour de la formation",
    ]),
    spacer(),

    heading(2, "ARTICLE 6 — DÉLAI DE RÉTRACTATION"),
    textWithVariable([{ bold: "IMPORTANT : " }]),
    paragraph("À compter de la date de signature du présent contrat, le Stagiaire dispose d'un délai de 14 jours pour se rétracter (Article L.6353-5 du Code du travail)."),
    paragraph("Durant ce délai, aucun paiement ne peut être exigé."),
    spacer(),

    heading(2, "ARTICLE 7 — INTERRUPTION DE LA FORMATION"),
    paragraph("En cas d'interruption de la formation, le Stagiaire ne sera redevable que du coût des heures effectivement suivies."),
    spacer(),

    heading(2, "ARTICLE 8 — CAS DE FORCE MAJEURE"),
    paragraph("En cas de force majeure dûment reconnue, le contrat pourra être résilié de plein droit sans indemnité."),
    spacer(),

    heading(2, "ARTICLE 9 — RÈGLEMENT INTÉRIEUR"),
    paragraph("Le Stagiaire s'engage à respecter le règlement intérieur de l'organisme de formation, dont il déclare avoir pris connaissance."),
    spacer(),
    horizontalRule(),
    spacer(),

    textWithVariable(["Fait en deux exemplaires, le ", { var: "dates.date_complete" }]),
    spacer(),
    spacer(),

    paragraph("Pour le Prestataire                                        Le Stagiaire"),
    paragraph("(Signature)                                                    (Signature précédée de"),
    paragraph("                                                                    « Lu et approuvé »)"),
  ]),
  footerContent: createTipTapContent([
    centeredParagraph("Contrat de formation professionnelle — Exemplaire stagiaire"),
  ]),
};

// ===========================================
// TEMPLATE: ATTESTATION DE FIN DE FORMATION
// ===========================================
export const ATTESTATION_FIN_TEMPLATE: DefaultTemplate = {
  name: "Attestation de fin de formation",
  description: "Attestation remise aux participants à l'issue de la formation",
  documentType: "ATTESTATION_FIN",
  category: "DOCUMENT",
  variables: [
    "organisation.nom",
    "organisation.numero_da",
    "organisation.adresse",
    "formation.titre",
    "formation.duree",
    "formation.duree_heures",
    "formation.objectifs",
    "participant.nom",
    "participant.prenom",
    "dates.date_complete",
    "formateur.nom",
    "formateur.prenom",
  ],
  headerContent: createTipTapContent([
    centeredTextWithVariable([{ var: "organisation.nom" }]),
  ]),
  content: createTipTapContent([
    spacer(),
    spacer(),
    centeredHeading(1, "ATTESTATION DE FIN DE FORMATION"),
    spacer(),
    horizontalRule(),
    spacer(),
    spacer(),

    paragraph("Je soussigné(e), responsable de l'organisme de formation :"),
    spacer(),
    centeredTextWithVariable([{ bold: "" }, { var: "organisation.nom" }]),
    centeredTextWithVariable(["N° de déclaration d'activité : ", { var: "organisation.numero_da" }]),
    spacer(),
    spacer(),

    centeredParagraph("atteste que"),
    spacer(),
    spacer(),

    centeredTextWithVariable([{ bold: "M./Mme " }, { var: "participant.prenom" }, " ", { var: "participant.nom" }]),
    spacer(),
    spacer(),

    centeredParagraph("a suivi avec assiduité la formation :"),
    spacer(),

    centeredTextWithVariable(["« ", { var: "formation.titre" }, " »"]),
    spacer(),

    centeredTextWithVariable(["d'une durée de ", { var: "formation.duree" }, " (", { var: "formation.duree_heures" }, " heures)"]),
    spacer(),
    spacer(),

    heading(3, "Objectifs atteints"),
    textWithVariable([{ var: "formation.objectifs" }]),
    spacer(),
    spacer(),

    heading(3, "Résultats de l'évaluation"),
    paragraph("☑ Objectifs atteints"),
    paragraph("☐ Objectifs partiellement atteints"),
    paragraph("☐ Objectifs non atteints"),
    spacer(),
    spacer(),

    paragraph("Cette attestation est délivrée pour servir et valoir ce que de droit."),
    spacer(),
    spacer(),

    textWithVariable(["Fait à _____________________, le ", { var: "dates.date_complete" }]),
    spacer(),
    spacer(),
    spacer(),

    paragraph("Le responsable de l'organisme de formation"),
    spacer(),
    paragraph("(Signature et cachet)"),
  ]),
  footerContent: createTipTapContent([
    centeredTextWithVariable([{ var: "organisation.nom" }, " — ", { var: "organisation.adresse" }]),
  ]),
};

// ===========================================
// TEMPLATE: FEUILLE D'ÉMARGEMENT
// ===========================================
export const EMARGEMENT_TEMPLATE: DefaultTemplate = {
  name: "Feuille d'émargement",
  description: "Feuille de présence à faire signer par les participants",
  documentType: "ATTESTATION_PRESENCE",
  category: "DOCUMENT",
  variables: [
    "organisation.nom",
    "organisation.numero_da",
    "formation.titre",
    "formation.duree",
    "formateur.nom",
    "formateur.prenom",
    "dates.date_complete",
    "participants",
  ],
  headerContent: createTipTapContent([
    textWithVariable([{ var: "organisation.nom" }, " — N° DA : ", { var: "organisation.numero_da" }]),
  ]),
  content: createTipTapContent([
    spacer(),
    centeredHeading(1, "FEUILLE D'ÉMARGEMENT"),
    spacer(),
    horizontalRule(),
    spacer(),

    textWithVariable([{ bold: "Formation : " }, { var: "formation.titre" }]),
    textWithVariable([{ bold: "Durée totale : " }, { var: "formation.duree" }]),
    textWithVariable([{ bold: "Formateur : " }, { var: "formateur.prenom" }, " ", { var: "formateur.nom" }]),
    textWithVariable([{ bold: "Date : " }, { var: "dates.date_complete" }]),
    spacer(),
    horizontalRule(),
    spacer(),

    heading(2, "MATIN (9h00 - 12h30)"),
    spacer(),
    paragraph("┌─────────────────────────────────────────────────────────────────────────────┐"),
    paragraph("│  N°  │           NOM PRÉNOM           │  ENTREPRISE  │     SIGNATURE      │"),
    paragraph("├─────────────────────────────────────────────────────────────────────────────┤"),
    paragraph("│   1  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│   2  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│   3  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│   4  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│   5  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│   6  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│   7  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│   8  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│   9  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│  10  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│  11  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│  12  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("└─────────────────────────────────────────────────────────────────────────────┘"),
    spacer(),

    heading(2, "APRÈS-MIDI (14h00 - 17h30)"),
    spacer(),
    paragraph("┌─────────────────────────────────────────────────────────────────────────────┐"),
    paragraph("│  N°  │           NOM PRÉNOM           │  ENTREPRISE  │     SIGNATURE      │"),
    paragraph("├─────────────────────────────────────────────────────────────────────────────┤"),
    paragraph("│   1  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│   2  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│   3  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│   4  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│   5  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│   6  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│   7  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│   8  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│   9  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│  10  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│  11  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("│  12  │ ______________________________ │ ____________ │ __________________ │"),
    paragraph("└─────────────────────────────────────────────────────────────────────────────┘"),
    spacer(),
    spacer(),

    paragraph("Signature du formateur : _________________________________"),
    spacer(),
    paragraph("Observations éventuelles : "),
    paragraph("________________________________________________________________________"),
    paragraph("________________________________________________________________________"),
  ]),
  footerContent: createTipTapContent([
    centeredParagraph("Feuille d'émargement — Document à conserver"),
  ]),
};

// ===========================================
// TEMPLATE: CONVOCATION
// ===========================================
export const CONVOCATION_TEMPLATE: DefaultTemplate = {
  name: "Convocation",
  description: "Convocation envoyée aux participants avant la formation",
  documentType: "CONVOCATION",
  category: "DOCUMENT",
  variables: [
    "organisation.nom",
    "organisation.adresse",
    "organisation.telephone",
    "formation.titre",
    "formation.duree",
    "formation.lieu",
    "formation.modalites",
    "participant.nom",
    "participant.prenom",
    "dates.date_complete",
  ],
  headerContent: createTipTapContent([
    textWithVariable([{ var: "organisation.nom" }]),
    textWithVariable([{ var: "organisation.adresse" }]),
    textWithVariable(["Tél : ", { var: "organisation.telephone" }]),
  ]),
  content: createTipTapContent([
    spacer(),
    spacer(),
    textWithVariable(["À l'attention de M./Mme ", { var: "participant.prenom" }, " ", { var: "participant.nom" }]),
    spacer(),
    spacer(),

    centeredHeading(1, "CONVOCATION"),
    centeredParagraph("à une action de formation professionnelle"),
    spacer(),
    horizontalRule(),
    spacer(),

    paragraph("Madame, Monsieur,"),
    spacer(),
    paragraph("Nous avons le plaisir de vous confirmer votre inscription à la formation suivante :"),
    spacer(),
    spacer(),

    heading(2, "INTITULÉ DE LA FORMATION"),
    textWithVariable([{ var: "formation.titre" }]),
    spacer(),

    heading(2, "DATES ET HORAIRES"),
    textWithVariable(["Date : ", { var: "dates.date_complete" }]),
    paragraph("Horaires : 9h00 - 12h30 / 14h00 - 17h30"),
    textWithVariable(["Durée totale : ", { var: "formation.duree" }]),
    spacer(),

    heading(2, "LIEU DE LA FORMATION"),
    textWithVariable([{ var: "formation.lieu" }]),
    textWithVariable(["Modalités : ", { var: "formation.modalites" }]),
    spacer(),

    heading(2, "INFORMATIONS PRATIQUES"),
    bulletList([
      "Merci de vous présenter 15 minutes avant le début de la formation",
      "Munissez-vous d'une pièce d'identité",
      "Un support de formation vous sera remis",
      "Déjeuner libre (restaurants et commerces à proximité)",
    ]),
    spacer(),

    heading(2, "DOCUMENTS À APPORTER"),
    bulletList([
      "Cette convocation",
      "Un ordinateur portable (si nécessaire)",
      "Vos questions et attentes concernant la formation",
    ]),
    spacer(),
    spacer(),

    paragraph("En cas d'empêchement, merci de nous prévenir dans les meilleurs délais."),
    spacer(),
    paragraph("Nous restons à votre disposition pour tout renseignement complémentaire."),
    spacer(),
    spacer(),

    paragraph("Bien cordialement,"),
    spacer(),
    spacer(),
    textWithVariable(["L'équipe ", { var: "organisation.nom" }]),
  ]),
  footerContent: createTipTapContent([
    centeredParagraph("Convocation — Merci de conserver ce document"),
  ]),
};

// ===========================================
// TEMPLATE: ÉVALUATION À CHAUD
// ===========================================
export const EVALUATION_CHAUD_TEMPLATE: DefaultTemplate = {
  name: "Évaluation à chaud",
  description: "Questionnaire de satisfaction remis en fin de formation",
  documentType: "EVALUATION_CHAUD",
  category: "DOCUMENT",
  variables: [
    "organisation.nom",
    "formation.titre",
    "dates.date_complete",
    "formateur.nom",
    "formateur.prenom",
  ],
  headerContent: createTipTapContent([
    textWithVariable([{ var: "organisation.nom" }]),
  ]),
  content: createTipTapContent([
    spacer(),
    centeredHeading(1, "QUESTIONNAIRE DE SATISFACTION"),
    centeredParagraph("Évaluation à chaud"),
    spacer(),
    horizontalRule(),
    spacer(),

    textWithVariable([{ bold: "Formation : " }, { var: "formation.titre" }]),
    textWithVariable([{ bold: "Date : " }, { var: "dates.date_complete" }]),
    textWithVariable([{ bold: "Formateur : " }, { var: "formateur.prenom" }, " ", { var: "formateur.nom" }]),
    spacer(),
    paragraph("Nom du participant (facultatif) : _________________________________"),
    spacer(),
    horizontalRule(),
    spacer(),

    paragraph("Merci de prendre quelques minutes pour évaluer cette formation."),
    paragraph("Entourez la note correspondant à votre appréciation : 1 = Insuffisant, 4 = Excellent"),
    spacer(),

    heading(2, "1. CONTENU DE LA FORMATION"),
    spacer(),
    paragraph("Les objectifs annoncés ont été atteints                          1    2    3    4"),
    paragraph("Le contenu correspondait à mes attentes                         1    2    3    4"),
    paragraph("Le niveau de difficulté était adapté                            1    2    3    4"),
    paragraph("Les supports pédagogiques étaient de qualité                    1    2    3    4"),
    spacer(),

    heading(2, "2. ANIMATION DE LA FORMATION"),
    spacer(),
    paragraph("Le formateur maîtrise le sujet                                  1    2    3    4"),
    paragraph("Les explications étaient claires et compréhensibles             1    2    3    4"),
    paragraph("Le formateur a su créer une dynamique de groupe                 1    2    3    4"),
    paragraph("Le formateur était à l'écoute des participants                  1    2    3    4"),
    spacer(),

    heading(2, "3. ORGANISATION"),
    spacer(),
    paragraph("La durée était adaptée au contenu                               1    2    3    4"),
    paragraph("Le rythme de la formation était adapté                          1    2    3    4"),
    paragraph("Les conditions matérielles étaient satisfaisantes               1    2    3    4"),
    paragraph("L'accueil et l'organisation étaient de qualité                  1    2    3    4"),
    spacer(),

    heading(2, "4. BILAN GLOBAL"),
    spacer(),
    paragraph("Cette formation répond à mes besoins professionnels             1    2    3    4"),
    paragraph("Je pourrai mettre en pratique les acquis de la formation        1    2    3    4"),
    spacer(),
    textWithVariable([{ bold: "Note globale de satisfaction : " }]),
    paragraph("                                                                 1    2    3    4"),
    spacer(),
    paragraph("Recommanderiez-vous cette formation ?                           ☐ Oui    ☐ Non"),
    spacer(),

    heading(2, "5. VOS COMMENTAIRES"),
    spacer(),
    paragraph("Ce que j'ai particulièrement apprécié :"),
    paragraph("________________________________________________________________________"),
    paragraph("________________________________________________________________________"),
    spacer(),
    paragraph("Ce qui pourrait être amélioré :"),
    paragraph("________________________________________________________________________"),
    paragraph("________________________________________________________________________"),
    spacer(),
    paragraph("Suggestions ou remarques :"),
    paragraph("________________________________________________________________________"),
    paragraph("________________________________________________________________________"),
    spacer(),
    spacer(),

    centeredParagraph("Merci pour votre participation et vos retours précieux !"),
  ]),
  footerContent: createTipTapContent([
    centeredParagraph("Évaluation à chaud — Vos retours nous aident à améliorer nos formations"),
  ]),
};

// ===========================================
// TEMPLATE: ÉVALUATION À FROID
// ===========================================
export const EVALUATION_FROID_TEMPLATE: DefaultTemplate = {
  name: "Évaluation à froid",
  description: "Questionnaire envoyé plusieurs semaines après la formation",
  documentType: "EVALUATION_FROID",
  category: "DOCUMENT",
  variables: [
    "organisation.nom",
    "formation.titre",
    "dates.date_complete",
    "participant.nom",
    "participant.prenom",
  ],
  headerContent: createTipTapContent([
    textWithVariable([{ var: "organisation.nom" }]),
  ]),
  content: createTipTapContent([
    spacer(),
    centeredHeading(1, "ÉVALUATION À FROID"),
    centeredParagraph("Bilan de la mise en pratique"),
    spacer(),
    horizontalRule(),
    spacer(),

    textWithVariable([{ bold: "Formation suivie : " }, { var: "formation.titre" }]),
    textWithVariable([{ bold: "Date de la formation : " }, { var: "dates.date_complete" }]),
    spacer(),
    paragraph("Nom du participant : _________________________________"),
    paragraph("Date de cette évaluation : _________________________________"),
    spacer(),
    horizontalRule(),
    spacer(),

    paragraph("Ce questionnaire a pour objectif d'évaluer la mise en pratique des acquis de la formation et son impact sur votre activité professionnelle."),
    spacer(),

    heading(2, "1. MISE EN PRATIQUE DES ACQUIS"),
    spacer(),
    paragraph("Avez-vous mis en pratique les compétences acquises lors de la formation ?"),
    paragraph("☐ Oui, régulièrement"),
    paragraph("☐ Oui, occasionnellement"),
    paragraph("☐ Non, pas encore"),
    paragraph("☐ Non, et je ne pense pas le faire"),
    spacer(),
    paragraph("Si non, quels freins avez-vous rencontrés ?"),
    paragraph("________________________________________________________________________"),
    paragraph("________________________________________________________________________"),
    spacer(),

    heading(2, "2. IMPACT SUR VOTRE ACTIVITÉ"),
    spacer(),
    paragraph("La formation vous a-t-elle permis de gagner en efficacité ?"),
    paragraph("☐ Oui, significativement    ☐ Oui, un peu    ☐ Non, pas vraiment    ☐ Non, pas du tout"),
    spacer(),
    paragraph("La formation vous a-t-elle permis d'acquérir de nouvelles compétences ?"),
    paragraph("☐ Oui, significativement    ☐ Oui, un peu    ☐ Non, pas vraiment    ☐ Non, pas du tout"),
    spacer(),
    paragraph("La formation a-t-elle répondu à vos objectifs professionnels ?"),
    paragraph("☐ Oui, totalement    ☐ Oui, partiellement    ☐ Non, pas vraiment    ☐ Non, pas du tout"),
    spacer(),

    heading(2, "3. CONNAISSANCES RETENUES"),
    spacer(),
    paragraph("Quelles sont les principales notions que vous avez retenues et utilisées ?"),
    paragraph("________________________________________________________________________"),
    paragraph("________________________________________________________________________"),
    paragraph("________________________________________________________________________"),
    spacer(),
    paragraph("Y a-t-il des points sur lesquels vous auriez besoin d'un approfondissement ?"),
    paragraph("________________________________________________________________________"),
    paragraph("________________________________________________________________________"),
    spacer(),

    heading(2, "4. BILAN GLOBAL"),
    spacer(),
    paragraph("Avec le recul, quel est votre niveau de satisfaction concernant cette formation ?"),
    paragraph("☐ Très satisfait    ☐ Satisfait    ☐ Peu satisfait    ☐ Pas satisfait"),
    spacer(),
    paragraph("Recommanderiez-vous cette formation à un collègue ?"),
    paragraph("☐ Oui, sans hésitation    ☐ Oui, probablement    ☐ Non, probablement pas    ☐ Non"),
    spacer(),

    heading(2, "5. BESOINS COMPLÉMENTAIRES"),
    spacer(),
    paragraph("Avez-vous identifié d'autres besoins de formation ?"),
    paragraph("________________________________________________________________________"),
    paragraph("________________________________________________________________________"),
    spacer(),
    spacer(),

    centeredParagraph("Merci d'avoir pris le temps de compléter ce questionnaire."),
    centeredParagraph("Vos retours nous sont précieux pour améliorer nos formations."),
  ]),
  footerContent: createTipTapContent([
    centeredParagraph("Évaluation à froid — Merci de retourner ce document complété"),
  ]),
};

// ===========================================
// TEMPLATE: RÈGLEMENT INTÉRIEUR
// ===========================================
export const REGLEMENT_INTERIEUR_TEMPLATE: DefaultTemplate = {
  name: "Règlement intérieur",
  description: "Règlement intérieur applicable aux actions de formation",
  documentType: "REGLEMENT_INTERIEUR",
  category: "DOCUMENT",
  variables: [
    "organisation.nom",
    "organisation.adresse",
    "organisation.telephone",
    "dates.date_complete",
  ],
  headerContent: createTipTapContent([
    centeredTextWithVariable([{ var: "organisation.nom" }]),
  ]),
  content: createTipTapContent([
    spacer(),
    centeredHeading(1, "RÈGLEMENT INTÉRIEUR"),
    centeredParagraph("Applicable aux stagiaires de la formation professionnelle"),
    spacer(),
    horizontalRule(),
    spacer(),

    heading(2, "PRÉAMBULE"),
    paragraph("Le présent règlement intérieur, établi conformément aux articles L.6352-3 et R.6352-1 à R.6352-15 du Code du travail, a pour objet de définir les règles générales et permanentes relatives à la discipline ainsi que les principales mesures applicables en matière de santé et de sécurité dans l'organisme de formation."),
    spacer(),

    heading(2, "ARTICLE 1 — CHAMP D'APPLICATION"),
    paragraph("Le présent règlement s'applique à toutes les personnes participantes à une action de formation organisée par l'organisme de formation, quelle que soit la durée ou le lieu de la formation."),
    paragraph("Chaque stagiaire est réputé avoir pris connaissance du présent règlement et en accepter les dispositions."),
    spacer(),

    heading(2, "ARTICLE 2 — DISCIPLINE GÉNÉRALE"),
    paragraph("Les stagiaires s'engagent à :"),
    bulletList([
      "Se conformer aux horaires fixés et communiqués préalablement",
      "Suivre avec assiduité l'ensemble des séquences de formation",
      "Respecter les consignes de sécurité en vigueur dans les locaux",
      "Avoir un comportement correct et respectueux envers toute personne présente",
      "Ne pas utiliser leur téléphone portable pendant les sessions de formation",
      "Ne pas enregistrer ou filmer les sessions sans autorisation préalable",
    ]),
    spacer(),

    heading(2, "ARTICLE 3 — HORAIRES ET ASSIDUITÉ"),
    paragraph("Les horaires de formation sont fixés par l'organisme de formation et communiqués aux stagiaires avant le début de la formation."),
    paragraph("Les stagiaires sont tenus de signer les feuilles d'émargement à chaque demi-journée de formation."),
    paragraph("Toute absence ou retard doit être justifié auprès du responsable de formation dans les meilleurs délais."),
    spacer(),

    heading(2, "ARTICLE 4 — ACCÈS AUX LOCAUX"),
    paragraph("Sauf autorisation expresse, les stagiaires n'ont accès aux locaux de formation que pour les besoins de la formation et dans les horaires prévus."),
    paragraph("Il leur est interdit d'introduire des personnes étrangères à la formation sans accord préalable."),
    spacer(),

    heading(2, "ARTICLE 5 — SANTÉ ET SÉCURITÉ"),
    paragraph("Les stagiaires doivent respecter les consignes générales et particulières de sécurité en vigueur sur les lieux de formation."),
    paragraph("Conformément à la législation en vigueur :"),
    bulletList([
      "Il est interdit de fumer dans les locaux",
      "L'introduction de boissons alcoolisées est interdite",
      "Il est interdit de se présenter en état d'ébriété ou sous l'emprise de substances illicites",
    ]),
    spacer(),

    heading(2, "ARTICLE 6 — MATÉRIEL ET DOCUMENTATION"),
    paragraph("Le matériel mis à disposition des stagiaires doit être utilisé avec soin et uniquement pour les besoins de la formation."),
    paragraph("Les supports de formation remis aux stagiaires sont strictement réservés à leur usage personnel et ne peuvent être reproduits ou diffusés sans autorisation."),
    spacer(),

    heading(2, "ARTICLE 7 — SANCTIONS DISCIPLINAIRES"),
    paragraph("Tout manquement au présent règlement pourra faire l'objet d'une sanction. La nature et l'échelle des sanctions applicables sont les suivantes :"),
    orderedList([
      "Avertissement oral",
      "Avertissement écrit",
      "Exclusion temporaire de la formation",
      "Exclusion définitive de la formation",
    ]),
    paragraph("Aucune sanction ne peut être prononcée sans que le stagiaire ait été informé des griefs retenus contre lui et ait eu la possibilité de s'expliquer."),
    spacer(),

    heading(2, "ARTICLE 8 — GARANTIES DISCIPLINAIRES"),
    paragraph("En cas de sanction envisagée autre que l'avertissement, le stagiaire sera convoqué par lettre recommandée ou remise en main propre à un entretien."),
    paragraph("La sanction ne peut intervenir moins de un jour franc ni plus de quinze jours après l'entretien."),
    spacer(),

    heading(2, "ARTICLE 9 — PUBLICITÉ ET ENTRÉE EN VIGUEUR"),
    paragraph("Le présent règlement est porté à la connaissance de chaque stagiaire avant son entrée en formation."),
    spacer(),
    spacer(),

    textWithVariable(["Fait à ", { var: "organisation.adresse" }]),
    textWithVariable(["Le ", { var: "dates.date_complete" }]),
    spacer(),
    spacer(),

    paragraph("Le responsable de l'organisme de formation"),
  ]),
  footerContent: createTipTapContent([
    centeredTextWithVariable([{ var: "organisation.nom" }, " — Règlement intérieur"]),
  ]),
};

// ===========================================
// LISTE DE TOUS LES TEMPLATES
// ===========================================
export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  FICHE_PEDAGOGIQUE_TEMPLATE,
  CONVENTION_TEMPLATE,
  CONTRAT_FORMATION_TEMPLATE,
  ATTESTATION_FIN_TEMPLATE,
  EMARGEMENT_TEMPLATE,
  CONVOCATION_TEMPLATE,
  EVALUATION_CHAUD_TEMPLATE,
  EVALUATION_FROID_TEMPLATE,
  REGLEMENT_INTERIEUR_TEMPLATE,
];
