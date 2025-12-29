// Structure des questions pour l'évaluation à chaud
export const QUESTIONS_EVALUATION_CHAUD = {
  preparation: [
    { id: "preparationInfos", label: "Les informations reçues avant la formation (programme, objectifs, durée) m'ont permis de bien comprendre ce qui allait être proposé." },
    { id: "preparationMessages", label: "Les messages envoyés avant la formation (emails, consignes, lien de connexion…) m'ont aidé(e) à me préparer dans de bonnes conditions." },
    { id: "preparationPrerequis", label: "Les prérequis annoncés correspondaient à mon niveau et à mon expérience." },
  ],
  organisation: [
    { id: "organisationCalendrier", label: "Le calendrier de la formation (dates, horaires, pauses) était bien organisé et adapté à mes contraintes." },
    { id: "organisationConditions", label: "Les conditions matérielles et techniques (salle, matériel, connexion, plateforme) ont permis de suivre la formation dans de bonnes conditions." },
  ],
  animation: [
    { id: "animationExplications", label: "Les explications du formateur / de la formatrice étaient claires, structurées et accessibles." },
    { id: "animationEchanges", label: "Le formateur / la formatrice a favorisé les échanges (questions, discussions, travaux de groupe) et ma participation." },
    { id: "animationAmbiance", label: "L'ambiance de travail au sein du groupe était agréable et propice à l'apprentissage." },
    { id: "animationRythme", label: "Le rythme de la formation (enchaînement des séquences, volume d'informations) était adapté : ni trop lent, ni trop rapide." },
  ],
  contenu: [
    { id: "contenuCoherence", label: "Le contenu de la formation était en cohérence avec mes attentes et mes besoins professionnels." },
    { id: "contenuUtilite", label: "Les notions, outils ou méthodes abordés me semblent utiles pour ma pratique au quotidien." },
    { id: "contenuSupports", label: "Les supports de formation (diapositives, documents, outils numériques…) étaient clairs, structurés et agréables à utiliser." },
    { id: "contenuNiveau", label: "Le niveau général de la formation (difficulté, exigence) était adapté à mon profil." },
  ],
  objectifs: [
    { id: "objectifsAtteints", label: "Sur une échelle de 0 à 10, dans quelle mesure estimez-vous que ces objectifs ont été atteints pour vous ?" },
  ],
  global: [
    { id: "noteGlobale", label: "Si vous deviez donner une note globale à cette formation, quelle serait-elle ?" },
  ],
};

// Structure des questions pour l'évaluation à froid
export const QUESTIONS_EVALUATION_FROID = {
  appreciation: [
    { id: "noteGlobale", label: "Avec le recul, dans quelle mesure êtes-vous globalement satisfait(e) de cette formation ?" },
    { id: "froidAttentesInitiales", label: "Dans quelle mesure considérez-vous que cette formation a répondu à vos attentes initiales ?" },
  ],
  utilite: [
    { id: "froidCompetencesUtiles", label: "La formation vous a-t-elle permis d'acquérir des compétences ou des outils réellement utiles dans votre activité professionnelle ?" },
    { id: "froidMiseEnPratique", label: "Depuis la formation, dans quelle mesure avez-vous mis en pratique ce que vous avez appris (outils, méthodes, postures…) ?" },
    { id: "froidImpactTravail", label: "Avec le recul, dans quelle mesure estimez-vous que cette formation a eu un impact positif sur votre travail (gain de temps, qualité, efficacité, relationnel, etc.) ?" },
  ],
  pertinence: [
    { id: "froidPertinenceActuelle", label: "À quel point le contenu de cette formation vous semble-t-il encore pertinent par rapport à vos missions actuelles ?" },
    { id: "froidUtiliteFuture", label: "À quel point pensez-vous que cette formation vous sera encore utile dans les prochains mois ?" },
  ],
  objectifs: [
    { id: "froidObjectifsPratique", label: "Sur une échelle de 0 à 10, dans quelle mesure estimez-vous que vous appliquez aujourd'hui, dans votre activité professionnelle, les compétences visées par ces objectifs ?" },
  ],
  recommandation: [
    { id: "recommandation", label: "Si vous deviez recommander cette formation à un collègue ou à un autre professionnel, quelle note donneriez-vous ?" },
  ],
};
