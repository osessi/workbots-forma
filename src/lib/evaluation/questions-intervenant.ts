// Structure des questions pour l'évaluation intervenant

export const QUESTIONS_EVALUATION_INTERVENANT = {
  organisation: [
    { id: "organisationConditions", label: "Les conditions matérielles et logistiques (salle, équipement, connexion internet, etc.) étaient adaptées pour animer cette formation dans de bonnes conditions." },
    { id: "organisationGroupe", label: "La taille du groupe, la composition et le niveau des participants étaient adaptés aux objectifs de la formation." },
    { id: "organisationCoordination", label: "La coordination avec l'organisme de formation (contact en amont, informations transmises, réactivité) a été satisfaisante." },
    { id: "organisationSupports", label: "Les supports mis à disposition (documents, outils, matériel, accès plateforme) étaient cohérents et suffisants pour animer cette formation." },
  ],
  contenu: [
    { id: "contenueObjectifs", label: "Le programme et les objectifs définis pour cette formation vous ont semblé réalistes et adaptés au public." },
    { id: "contenuMethodes", label: "Les méthodes pédagogiques prévues (apports, exercices, mises en situation, échanges) ont bien fonctionné avec ce groupe." },
    { id: "contenuParticipation", label: "Le niveau de participation et d'engagement des stagiaires pendant la formation vous a semblé satisfaisant." },
  ],
  objectifs: [
    { id: "objectifsAtteints", label: "De votre point de vue, les objectifs pédagogiques de la formation ont été atteints par le groupe." },
    { id: "valeurAjoutee", label: "Vous avez eu l'impression de pouvoir apporter une réelle valeur ajoutée aux participants (apprentissage, prises de conscience…)." },
    { id: "satisfactionGlobale", label: "Globalement, vous êtes satisfait(e) de la manière dont cette formation s'est déroulée (en tant qu'intervenant)." },
  ],
};
