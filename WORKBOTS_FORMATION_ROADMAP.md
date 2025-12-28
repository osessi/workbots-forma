# WORKBOTS FORMATION - ROADMAP REVOLUTION

> **Mission** : Révolutionner le marché de la formation professionnelle en France en offrant une plateforme tout-en-un qui génère des formations complètes via IA et garantit la conformité Qualiopi automatique.

> **Vision** : Permettre à n'importe quel organisme de formation de créer, gérer et certifier ses formations en quelques clics, tout en étant 100% conforme aux 32 indicateurs Qualiopi.

---

## TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Qualiopi](#architecture-qualiopi)
3. [Modules à développer](#modules-à-développer)
4. [Roadmap par indicateur](#roadmap-par-indicateur)
5. [Système d'automatisation](#système-dautomatisation)
6. [Agent Qualiopi IA](#agent-qualiopi-ia)
7. [Spécifications techniques](#spécifications-techniques)
8. [Suivi du développement](#suivi-du-développement)

---

## VUE D'ENSEMBLE

### Le Problème

- **70-80% des organismes de formation perdent leur certification Qualiopi** chaque année
- Trop d'exigences documentaires et de preuves à fournir
- Outils fragmentés, pas de solution intégrée
- Processus manuels chronophages

### La Solution WORKBOTS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WORKBOTS FORMATION                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│   │  CRÉATION   │    │   GESTION   │    │  QUALIOPI   │    │ AUTOMATION  │  │
│   │     IA      │───▶│  SESSIONS   │───▶│  COMPLIANT  │───▶│   ENGINE    │  │
│   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│         │                  │                  │                  │          │
│         ▼                  ▼                  ▼                  ▼          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    AGENT QUALIOPI INTELLIGENT                        │   │
│   │  • Analyse conformité temps réel                                     │   │
│   │  • Génération automatique des preuves                                │   │
│   │  • Alertes proactives                                                │   │
│   │  • Préparation audit                                                 │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Stack Technologique

| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 16, React 19, TypeScript |
| Backend | Next.js API Routes, Prisma ORM |
| Base de données | PostgreSQL (Supabase) |
| Authentification | Supabase Auth |
| Stockage | Supabase Storage |
| IA | Claude (Anthropic), OpenAI |
| Slides | Gamma API, Workbots |
| Queue | Bull MQ, Redis |
| Email | Resend |

---

## ARCHITECTURE QUALIOPI

### Les 7 Critères et 32 Indicateurs

```
RÉFÉRENTIEL QUALIOPI
│
├── CRITÈRE 1 : Information du public (IND 1-3)
│   ├── IND 1 : Diffusion information accessible
│   ├── IND 2 : Indicateurs de résultats
│   └── IND 3 : Certifications (fiche RS)
│
├── CRITÈRE 2 : Identification des objectifs (IND 4-7)
│   ├── IND 4 : Analyse des besoins
│   ├── IND 5 : Définition des objectifs
│   ├── IND 6 : Contenus et modalités
│   └── IND 7 : Adéquation contenus/certifications
│
├── CRITÈRE 3 : Adaptation aux publics (IND 8-12)
│   ├── IND 8 : Positionnement préalable
│   ├── IND 9 : Conditions de déroulement
│   ├── IND 10 : Adaptation du parcours
│   ├── IND 11 : Évaluation des acquis
│   └── IND 12 : Engagement des bénéficiaires
│
├── CRITÈRE 4 : Moyens pédagogiques (IND 13-16)
│   ├── IND 13 : CFA - Coordination alternance
│   ├── IND 14 : CFA - Missions tuteurs
│   ├── IND 15 : CFA - Conditions d'alternance
│   └── IND 16 : Moyens humains et techniques
│
├── CRITÈRE 5 : Qualification des personnels (IND 17-22)
│   ├── IND 17 : Mobilisation des intervenants
│   ├── IND 18 : Coordination des équipes
│   ├── IND 19 : Ressources pédagogiques
│   ├── IND 20 : CFA - Personnel dédié
│   ├── IND 21 : Compétences des formateurs
│   └── IND 22 : Développement des compétences
│
├── CRITÈRE 6 : Inscription dans l'environnement (IND 23-27)
│   ├── IND 23 : Veille légale et réglementaire
│   ├── IND 24 : Veille compétences/métiers
│   ├── IND 25 : Veille handicap
│   ├── IND 26 : Processus qualité
│   └── IND 27 : Sous-traitance
│
└── CRITÈRE 7 : Recueil et traitement (IND 28-32)
    ├── IND 28 : CFA - Conformité contrat
    ├── IND 29 : CFA - Missions référents
    ├── IND 30 : Recueil appréciations
    ├── IND 31 : Traitement réclamations
    └── IND 32 : Mesures d'amélioration
```

---

## MODULES À DÉVELOPPER

### Module 1 : Catalogue Public & Pré-inscription

**Objectif** : Répondre aux indicateurs 1, 2, 3, 4

```
/public/catalogue
├── Liste des formations (filtrable)
├── Fiche formation détaillée
│   ├── Objectifs pédagogiques
│   ├── Programme détaillé
│   ├── Prérequis
│   ├── Modalités d'évaluation
│   ├── Accessibilité handicap
│   ├── Taux de satisfaction (IND 2)
│   ├── Taux de certification (IND 3)
│   └── Fiche RS si certifiante
└── Formulaire pré-inscription
    ├── Partie 1 : Analyse du besoin
    │   ├── Objectifs professionnels
    │   ├── Expérience préalable
    │   ├── Attentes spécifiques
    │   └── Contraintes éventuelles
    └── Partie 2 : Fiche de renseignements
        ├── Informations personnelles
        ├── Situation professionnelle
        ├── Situation de handicap (OBLIGATOIRE)
        └── Mode de financement
```

### Module 2 : Espace Apprenant Restructuré

**Objectif** : Répondre aux indicateurs 5, 9, 19

```
/espace-apprenant
├── Accueil personnalisé
│   └── Message de bienvenue avec infos session
├── Ma formation
│   ├── Programme détaillé
│   ├── Objectifs pédagogiques
│   └── Planning des sessions
├── Mes documents
│   ├── Convocation
│   ├── Règlement intérieur
│   ├── CGV
│   ├── Supports de cours
│   └── Attestations
├── Mes évaluations
│   ├── Test de positionnement
│   ├── QCM par module
│   ├── Ateliers pratiques
│   └── Évaluation finale
├── Émargements
│   └── Signatures en attente
├── Vos intervenants
│   ├── Photo + Bio
│   └── Spécialités
└── À propos de l'OF
    └── Organigramme
```

### Module 3 : Espace Intervenant

**Objectif** : Répondre aux indicateurs 17, 21, 22

```
/espace-intervenant
├── Mon profil
│   ├── Photo de profil
│   ├── CV
│   ├── Diplômes
│   ├── Numéro de déclaration d'activité
│   └── Spécialités
├── Fiche mission
│   ├── Compétences requises
│   ├── Missions pédagogiques
│   └── Signature électronique
├── Mes sessions
│   ├── Sessions à venir
│   ├── Sessions passées
│   └── Émargements
├── Agent IA Formateur
│   ├── Veille métier personnalisée
│   ├── Quiz de montée en compétences
│   └── Dernières nouveautés par spécialité
└── Questionnaire satisfaction
```

### Module 4 : Système de Veille Automatisée

**Objectif** : Répondre aux indicateurs 23, 24, 25

```
/outils/veille
├── Veille Légale & Réglementaire
│   ├── Sources : Légifrance, France Compétences, etc.
│   └── Alertes automatiques
├── Veille Métiers & Compétences
│   ├── Sources : OPCO, branches professionnelles
│   └── Évolutions sectorielles
├── Veille Innovation Pédagogique
│   ├── Sources : EdTech, publications
│   └── Nouvelles méthodes
└── Veille Handicap & Accessibilité
    ├── Sources : AGEFIPH, FIPHFP
    └── Réglementations accessibilité
```

### Module 5 : Gestion Qualité

**Objectif** : Répondre aux indicateurs 26, 31, 32

```
/outils
├── Procédures OF
│   ├── Procédure accueil stagiaires
│   ├── Procédure gestion réclamations
│   ├── Procédure évaluation
│   ├── Procédure sous-traitance
│   └── [Télécharger/Éditer en 1 clic]
├── Réclamations
│   ├── Nouvelle réclamation
│   ├── Liste des réclamations
│   │   ├── Date réclamation
│   │   ├── Origine
│   │   ├── Client/Formation
│   │   ├── Description du problème
│   │   ├── Date prise en compte
│   │   ├── Analyse
│   │   ├── Actions correctives
│   │   ├── Retour client
│   │   └── Action préventive
│   └── Statistiques
└── Améliorations
    ├── Actions d'amélioration en cours
    ├── Actions terminées
    └── Plan d'amélioration continue
```

### Module 6 : Moteur d'Automatisation

**Objectif** : Simplifier tous les processus récurrents

```
/automatisations
├── Dashboard visuel (style Make/Integromat)
│   ├── Workflows actifs
│   ├── Exécutions récentes
│   └── Statistiques
├── Créateur de workflows
│   ├── Déclencheurs
│   │   ├── Nouvelle inscription
│   │   ├── J-7 avant session
│   │   ├── J-1 avant session
│   │   ├── Fin de session
│   │   ├── Score < seuil
│   │   ├── Document non signé
│   │   └── [Déclencheur personnalisé]
│   ├── Actions
│   │   ├── Envoyer email
│   │   ├── Envoyer SMS
│   │   ├── Générer document
│   │   ├── Créer tâche
│   │   ├── Notifier équipe
│   │   ├── Mettre à jour données
│   │   └── [Action personnalisée]
│   └── Conditions
│       ├── Si score < X
│       ├── Si document manquant
│       ├── Si formation certifiante
│       └── [Condition personnalisée]
└── Templates de workflows
    ├── Parcours inscription complet
    ├── Rappels automatiques session
    ├── Suivi post-formation
    ├── Relances signatures
    └── Préparation audit Qualiopi
```

### Module 7 : Préparation Audit

**Objectif** : Faciliter la préparation et le passage de l'audit Qualiopi

```
/audit
├── Dashboard Audit
│   ├── Score conformité global (%)
│   ├── Indicateurs par critère
│   └── Prochaine échéance
├── Checklist par indicateur
│   ├── Preuves requises
│   ├── Preuves fournies
│   ├── Statut (Conforme/À traiter/Non applicable)
│   └── Commentaires
├── Génération de preuves
│   ├── Export automatique par indicateur
│   ├── Captures d'écran automatiques
│   └── Statistiques formatées
├── Historique des audits
│   ├── Audits passés
│   ├── Non-conformités relevées
│   └── Actions correctives apportées
└── Simulation d'audit
    ├── Questions types par indicateur
    └── Auto-évaluation guidée
```

### Module 8 : Agent Qualiopi IA

**Objectif** : Assistant intelligent pour la conformité

```
/agent-qualiopi
├── Chat conversationnel
│   ├── Questions sur les indicateurs
│   ├── Conseils de conformité
│   └── Aide à la rédaction
├── Analyse automatique
│   ├── Scan des formations
│   ├── Détection des manques
│   └── Suggestions d'amélioration
├── Alertes proactives
│   ├── Documents expirés
│   ├── Évaluations manquantes
│   ├── Taux de satisfaction bas
│   └── Échéances approchantes
└── Rapports de conformité
    ├── Rapport par formation
    ├── Rapport global OF
    └── Export pour audit
```

### Module 9 : Intégrations OPCO

**Objectif** : Simplifier les démarches de financement

```
/integrations/opco
├── Connexion API OPCO
│   ├── OPCO EP
│   ├── OPCO Atlas
│   ├── OPCO Mobilités
│   ├── OPCO Santé
│   └── [Autres OPCO]
├── Vérification budgets
│   ├── Enveloppes disponibles
│   ├── Date mise à jour
│   └── Historique consommation
├── Soumission dossiers
│   ├── Création automatique
│   ├── Pièces jointes générées
│   └── Suivi statut
└── Gestion remboursements
    ├── Factures émises
    ├── Paiements reçus
    └── Relances automatiques
```

### Module 10 : BPF (Bilan Pédagogique et Financier)

**Objectif** : Automatiser la déclaration annuelle obligatoire

```
/bpf
├── Collecte automatique des données
│   ├── Nombre de stagiaires
│   ├── Heures de formation dispensées
│   ├── Chiffre d'affaires formation
│   ├── Répartition par type de formation
│   └── Répartition par public
├── Génération du BPF
│   ├── Formulaire CERFA pré-rempli
│   ├── Vérification cohérence
│   └── Export PDF
├── Historique
│   ├── BPF des années précédentes
│   └── Évolution des indicateurs
└── Rappels
    └── Alerte échéance déclaration (30 avril)
```

---

## ROADMAP PAR INDICATEUR

### INDICATEUR 1 : Information accessible au public

**Statut** : 🔴 À développer

**Exigence Qualiopi** :
> Le prestataire diffuse une information accessible au public, détaillée et vérifiable sur les prestations proposées.

**Développements requis** :

```
□ Créer le catalogue public (/public/catalogue)
  □ Liste des formations avec filtres
  □ Fiche formation détaillée
  □ Informations obligatoires :
    □ Objectifs
    □ Programme
    □ Prérequis
    □ Public visé
    □ Durée
    □ Modalités (présentiel/distanciel/mixte)
    □ Méthodes mobilisées
    □ Modalités d'évaluation
    □ Accessibilité handicap
    □ Tarifs
    □ Contact

□ Créer le formulaire de pré-inscription
  □ Partie 1 : Analyse du besoin
    □ Objectifs professionnels recherchés
    □ Contexte de la demande
    □ Expérience préalable dans le domaine
    □ Attentes spécifiques
    □ Contraintes (horaires, lieu, etc.)
  □ Partie 2 : Fiche de renseignements
    □ Civilité, nom, prénom
    □ Date de naissance
    □ Adresse complète
    □ Email, téléphone
    □ Situation professionnelle
    □ Entreprise (si salarié)
    □ ⚠️ Question handicap (OBLIGATOIRE)
      "Êtes-vous en situation de handicap ?
       Si oui, avez-vous besoin d'aménagements spécifiques ?"
    □ Mode de financement envisagé

□ Modifier le modèle Organisation
  □ Ajouter champ "certificat" (texte)
  □ Ajouter champ "categorie_of" (enum)

□ Workflow de pré-inscription
  □ Email de confirmation automatique
  □ Notification à l'OF
  □ Création automatique dans base apprenants
```

**Preuves pour l'audit** :
- Capture du catalogue en ligne
- Formulaire de pré-inscription vierge
- Exemple de fiche formation complète

---

### INDICATEUR 2 : Indicateurs de résultats

**Statut** : 🔴 À développer

**Exigence Qualiopi** :
> Le prestataire diffuse des indicateurs de résultats adaptés à la nature des prestations.

**Développements requis** :

```
□ Calculer automatiquement les indicateurs
  □ Taux de satisfaction (depuis évaluations à chaud)
    □ Modifier questionnaire satisfaction : notes 0-10
    □ Formule : moyenne des notes / 10 * 100 = %
  □ Taux de réussite aux évaluations
  □ Taux d'obtention certification (si certifiante)
  □ Nombre de stagiaires formés

□ Afficher sur le catalogue
  □ Par formation :
    □ Taux de satisfaction : XX%
    □ Nombre d'avis : XX
    □ Stagiaires formés : XX
  □ Global OF :
    □ Taux de satisfaction moyen
    □ Total stagiaires formés

□ Mettre à jour automatiquement
  □ Recalcul après chaque évaluation
  □ Affichage N-1 (année précédente)

□ Modifier l'évaluation à chaud
  □ Questions notées de 0 à 10
  □ Exemple de questions :
    □ "Les objectifs ont-ils été atteints ?" (0-10)
    □ "Qualité de l'animation" (0-10)
    □ "Qualité des supports" (0-10)
    □ "Organisation générale" (0-10)
    □ "Recommanderiez-vous cette formation ?" (0-10)
```

**Preuves pour l'audit** :
- Capture des indicateurs affichés
- Méthodologie de calcul
- Historique des données

---

### INDICATEUR 3 : Formations certifiantes

**Statut** : 🔴 À développer

**Exigence Qualiopi** :
> Lorsque le prestataire met en œuvre des prestations conduisant à une certification, il informe sur les certifications, leur enregistrement (RS/RNCP).

**Développements requis** :

```
□ Modifier le modèle Formation
  □ Ajouter champ "is_certifiante" (boolean)
  □ Ajouter champ "numero_fiche_rs" (string, ex: RS6563)
  □ Ajouter champ "referentiel_rs_url" (string, URL fichier)

□ Interface wizard création formation
  □ Dans l'onglet "Contexte", ajouter section :
    □ Checkbox "Formation certifiante"
    □ Si coché :
      □ Input "Numéro fiche RS" (placeholder: "RS6563")
      □ Bouton "Upload référentiel RS" (PDF)
      □ Lien vers France Compétences

□ Génération IA adaptée
  □ Si fiche RS uploadée :
    □ Extraire les compétences du référentiel
    □ Adapter les objectifs pédagogiques
    □ Aligner le contenu sur le référentiel

□ Suivi des certifications
  □ Dans fiche apprenant, après formation :
    □ Checkbox "Certification obtenue"
    □ Date d'obtention
    □ Numéro certificat

□ Calcul taux de certification
  □ Formule : certifiés / présentés * 100
  □ Affichage sur catalogue
```

**Preuves pour l'audit** :
- Lien vers la fiche RS
- Référentiel de certification
- Statistiques d'obtention

---

### INDICATEUR 4 : Analyse des besoins

**Statut** : ✅ Couvert par Indicateur 1

---

### INDICATEUR 5 : Réponse aux demandes

**Statut** : 🟡 Partiellement développé

**Exigence Qualiopi** :
> Le prestataire définit les objectifs opérationnels et évaluables de la prestation.

**Développements requis** :

```
□ Ajouter onglet "Notes" dans fiche apprenant
  □ Zone de texte riche
  □ Historique des notes avec dates
  □ Visible uniquement par l'OF

□ Email automatique J-7
  □ Contenu :
    "Bonjour [Prénom],

    Votre formation [Titre] débute dans 7 jours.

    Nous vous invitons à :
    - Consulter le programme de formation
    - Lire le règlement intérieur
    - Prendre connaissance des CGV

    Tous ces documents sont disponibles sur votre espace apprenant : [Lien]

    Si vous avez des questions ou des besoins spécifiques,
    n'hésitez pas à nous contacter.

    À très bientôt !"

  □ Pièces jointes :
    □ Convocation
    □ Programme de formation
    □ Règlement intérieur
```

---

### INDICATEUR 6 : Scénario pédagogique

**Statut** : 🟢 Simple à implémenter

**Exigence Qualiopi** :
> Le prestataire établit les contenus et les modalités de mise en œuvre.

**Développements requis** :

```
□ Wizard création formation > Fiche pédagogique
  □ Ajouter bouton "Télécharger le scénario pédagogique"
  □ Position : à côté du bouton "Télécharger le PDF"

□ Contenu du scénario pédagogique (PDF)
  □ En-tête avec logo OF
  □ Titre : "SCÉNARIO PÉDAGOGIQUE : [Titre formation]"
  □ Tableau avec colonnes :
    □ Nom du module
    □ Contenu (objectifs détaillés)
    □ Objectif du module
    □ Durée
    □ Méthodes pédagogiques
    □ Supports et outils pédagogiques
    □ Modalités d'évaluation

□ Génération automatique depuis les modules
```

---

### INDICATEUR 7 : Adéquation RS / Formation

**Statut** : 🔴 À développer

**Exigence Qualiopi** :
> Lorsque le prestataire met en œuvre des prestations conduisant à une certification, il s'assure de l'adéquation du ou des contenus aux exigences de la certification visée.

**Développements requis** :

```
□ Tableau croisé RS / Fiche pédagogique
  □ Interface :
    □ Colonne gauche : Compétences du référentiel RS
    □ Colonne droite : Objectifs pédagogiques de la formation
    □ Indicateur de correspondance (couleur)

□ Wizard création formation > Fiche pédagogique
  □ Si formation certifiante (fiche RS renseignée) :
    □ Afficher bouton "Tableau croisé (fiche RS / fiche péda)"
    □ Position : à côté des boutons de téléchargement

□ Génération automatique
  □ Extraire les compétences du référentiel RS (IA)
  □ Mapper avec les objectifs pédagogiques
  □ Identifier les écarts
  □ Proposer des ajustements

□ Export PDF
  □ Tableau de correspondance complet
  □ Taux de couverture du référentiel
```

---

### INDICATEUR 8 : Test de positionnement

**Statut** : ✅ Déjà implémenté

Les tests de positionnement et évaluations finales sont déjà présents dans le système.

---

### INDICATEUR 9 : Conditions de déroulement

**Statut** : 🔴 À développer

**Exigence Qualiopi** :
> Le prestataire informe les publics bénéficiaires sur les conditions de déroulement.

**Développements requis** :

```
□ Email de convocation automatique
  □ Déclenché lors de l'inscription à une session
  □ Contenu :
    "Bonjour [Prénom],

    Nous vous accueillons pour la formation [Titre].

    Vous retrouverez toutes les informations liées à la formation
    sur votre espace apprenant : [Lien]

    Documents disponibles :
    - Convocation
    - Règlement intérieur
    - CGV

    Cordialement,
    L'équipe [Nom OF]"

□ Restructurer l'espace apprenant
  □ Accueil avec message de bienvenue
  □ Section "Mes documents" avec :
    □ Convocation
    □ Règlement intérieur
    □ CGV

□ Créer l'organigramme (Paramètres > Organisation)
  □ Nouvel onglet "Organigramme"
  □ Structure :
    □ Gérant de l'organisme de formation
    □ Référent handicap
    □ Référent pédagogique
    □ Formateurs (synchro avec base Intervenants)
      □ Nom, prénom
      □ Spécialité
      □ Photo
  □ Possibilité d'ajouter d'autres postes
  □ Export PDF de l'organigramme
  □ Affichage sur espace apprenant (section "À propos")
```

---

### INDICATEUR 10 : Adaptation du parcours

**Statut** : 🟡 Partiellement développé

**Exigence Qualiopi** :
> Le prestataire met en œuvre et adapte la prestation, l'accompagnement et le suivi aux publics bénéficiaires.

**Développements requis** :

```
□ Fiche d'adaptabilité
  □ Générée automatiquement si score positionnement < 2/20
  □ Contenu :
    □ Analyse des lacunes identifiées
    □ Proposition d'adaptation du parcours
    □ Module(s) complémentaire(s) suggéré(s)
  □ Envoyée à l'apprenant par email

□ Module 0 - Mise à niveau
  □ Création automatique si nécessaire
  □ Contenu adapté aux lacunes
  □ ⚠️ Durée NON comptabilisée dans le scénario pédagogique
  □ Flag "is_module_zero" sur le modèle Module

□ Workflow automatique
  □ Si score < seuil → Générer fiche adaptabilité
  □ Proposer inscription au Module 0
  □ Notifier le formateur
```

---

### INDICATEUR 11 : Évaluation des acquis

**Statut** : 🟡 À compléter

**Exigence Qualiopi** :
> Le prestataire évalue l'atteinte par les publics bénéficiaires des objectifs de la prestation.

**Développements requis** :

```
□ Document de corrélation Objectifs / Évaluation finale
  □ Position dans wizard :
    Onglet "Évaluations" > Sous le test de positionnement et éval finale
  □ Nouveau bloc : "Corrélation entre objectifs pédagogiques et évaluation finale"
  □ Bouton : "Générer le document"

□ Contenu du document (PDF)
  □ Pour chaque objectif pédagogique :
    □ Libellé de l'objectif
    □ Question(s) de l'évaluation finale correspondante(s)
    □ Critère de validation

□ Génération automatique par IA
  □ Analyser les objectifs pédagogiques
  □ Mapper avec les questions de l'évaluation
  □ Identifier les objectifs non évalués
  □ Proposer des questions complémentaires si nécessaire
```

---

### INDICATEUR 12 : Engagement des bénéficiaires

**Statut** : ✅ Couvert par les ateliers

Les ateliers par module permettent l'engagement actif des bénéficiaires.

---

### INDICATEURS 13, 14, 15 : CFA

**Statut** : ⏸️ Non applicable (hors CFA)

---

### INDICATEUR 16 : Moyens techniques

**Statut** : ⏸️ Rien à développer pour le moment

---

### INDICATEUR 17 : Mobilisation des intervenants

**Statut** : 🔴 À développer

**Exigence Qualiopi** :
> Le prestataire mobilise et coordonne les différents intervenants internes et/ou externes.

**Développements requis** :

```
□ Enrichir la fiche Intervenant (Mes données > Intervenants)
  □ Ajouter :
    □ Photo de profil (upload)
    □ CV (upload PDF)
    □ Diplôme(s) (upload multiples)
    □ Numéro de déclaration d'activité
    □ Spécialités (tags)
    □ Expérience (années)

□ Checklist Lieu de formation (Mes données > Lieux)
  □ Ajouter section "Conformité du lieu" avec checkboxes :
    □ Salle de surface minimale 4m² par personne
    □ Respect des exigences ERP (sécurité incendie, évacuation, extincteurs)
    □ Ventilation de la salle conforme
    □ Éclairage minimal suffisant
    □ Proximité des sanitaires
    □ Accessibilité aux personnes en situation de handicap
    □ Accès réseau WIFI
    □ Mise à disposition d'un vidéoprojecteur
    □ Possibilité de disposition du mobilier selon l'organisation souhaitée
    □ Possibilité de mettre en place ses propres équipements en amont
    □ Fourniture pour les stagiaires (papiers, crayons, bouteille eau)

□ Fiche mission Intervenant
  □ Document PDF généré
  □ Contenu :
    □ Compétences et expertise requises
    □ Compétences en ingénierie pédagogique
    □ Compétences en animation pédagogique
  □ Signature électronique intégrée

□ Créer l'Espace Intervenant
  □ Dashboard personnalisé
  □ Mon profil (éditable)
  □ Fiche mission (consultable)
  □ Mes sessions (planning)
  □ Émargements
```

---

### INDICATEUR 18 : Coordination des équipes

**Statut** : ✅ Couvert par l'organigramme (IND 9)

---

### INDICATEUR 19 : Ressources pédagogiques

**Statut** : ✅ Déjà implémenté

Les supports sont disponibles sur l'espace apprenant.

---

### INDICATEUR 20 : CFA

**Statut** : ⏸️ Non applicable

---

### INDICATEUR 21 : Compétences des formateurs

**Statut** : ✅ Couvert par la fiche mission (IND 17)

---

### INDICATEUR 22 : Développement des compétences

**Statut** : 🟡 À développer

**Exigence Qualiopi** :
> Le prestataire entretient et développe les compétences de ses salariés.

**Développements requis** :

```
□ Questionnaire satisfaction formateur
  □ Questions :
    □ Satisfaction générale de la mission
    □ Qualité des outils fournis
    □ Accompagnement par l'OF
    □ Suggestions d'amélioration
    □ Besoins en formation

□ Agent IA Formateur (montée en compétences)
  □ Interface conversationnelle
  □ Flow :
    1. "Dans quelle spécialité exercez-vous ?"
       → Liste : Commerce, Vente, Management, Digital, etc.
    2. "Voulez-vous connaître les dernières nouveautés liées à cette spécialité ?"
       → Veille automatique par domaine
    3. Quiz de connaissances
    4. Recommandations de formations
```

---

### INDICATEURS 23, 24, 25 : Veille réglementaire

**Statut** : 🔴 À développer

**Exigence Qualiopi** :
> Le prestataire réalise une veille légale et réglementaire, sur les compétences/métiers/emplois, et sur l'innovation pédagogique et technologique.

**Développements requis** :

```
□ Créer l'onglet "Outils" dans le menu principal

□ Sous-onglet "Veille" avec 4 catégories :

  □ 1. Veille Légale & Réglementaire
    □ Sources automatisées :
      □ Légifrance (décrets, lois)
      □ France Compétences
      □ Ministère du Travail
    □ Affichage des dernières actualités
    □ Date de mise à jour automatique

  □ 2. Veille Métiers & Compétences
    □ Sources :
      □ OPCO (observatoires métiers)
      □ Branches professionnelles
      □ Pôle Emploi / France Travail
    □ Par secteur d'activité

  □ 3. Veille Innovation Pédagogique
    □ Sources :
      □ EdTech France
      □ Café Pédagogique
      □ Thot Cursus
    □ Nouvelles méthodes, outils

  □ 4. Veille Handicap & Accessibilité
    □ Sources :
      □ AGEFIPH
      □ FIPHFP
      □ Ministère (handicap)
    □ Réglementations, bonnes pratiques

□ Automatisation
  □ Scraping automatique des sources
  □ Mise à jour quotidienne
  □ Notifications des actualités importantes
  □ Historique consultable
```

---

### INDICATEUR 26 : Processus qualité

**Statut** : 🟡 À développer

**Exigence Qualiopi** :
> Le prestataire met en œuvre des procédures de mise en œuvre de ses prestations.

**Développements requis** :

```
□ Section Procédures OF (Paramètres > Organisation)
  □ Nouveau bouton "Procédures de l'organisme"
  □ Liste des procédures :
    □ Procédure d'accueil des stagiaires
    □ Procédure de gestion des réclamations
    □ Procédure d'évaluation
    □ Procédure de sous-traitance
    □ Procédure de veille
    □ [Procédures personnalisées]

□ Pour chaque procédure :
  □ Template pré-rempli par défaut
  □ Éditeur WYSIWYG pour personnalisation
  □ Bouton "Télécharger PDF"
  □ Versioning (historique des modifications)
```

---

### INDICATEUR 27 : Sous-traitance

**Statut** : 🟢 Simple à implémenter

**Exigence Qualiopi** :
> Lorsqu'il fait appel à des prestataires, le prestataire s'assure du respect des critères du référentiel.

**Développements requis** :

```
□ Contrat de sous-traitance formateur
  □ Template document
  □ Champs :
    □ Identité du formateur
    □ Formation(s) concernée(s)
    □ Obligations du sous-traitant
    □ Respect du référentiel Qualiopi
    □ Confidentialité
    □ Tarification
  □ Signature électronique intégrée
  □ Génération automatique depuis fiche intervenant
```

---

### INDICATEURS 28, 29 : CFA

**Statut** : ⏸️ Non applicable

---

### INDICATEUR 30 : Recueil des appréciations

**Statut** : 🔴 À développer

**Exigence Qualiopi** :
> Le prestataire recueille les appréciations des parties prenantes.

**Développements requis** :

```
□ Enquêtes de satisfaction multiples :

  □ 1. Satisfaction Stagiaire à chaud
    □ Envoi automatique en fin de formation
    □ Questions notées 0-10
    □ Calcul taux de satisfaction

  □ 2. Satisfaction Stagiaire à froid (J+30)
    □ Envoi automatique 30 jours après
    □ Questions sur :
      □ Application des acquis
      □ Impact professionnel
      □ Recommandation

  □ 3. Satisfaction Entreprise
    □ Si stagiaire = salarié
    □ Envoi au responsable formation entreprise
    □ Questions sur :
      □ Pertinence de la formation
      □ Retour sur investissement
      □ Satisfaction globale

  □ 4. Satisfaction Financeur
    □ Envoi aux financeurs (OPCO, etc.)
    □ Questions sur :
      □ Qualité des documents
      □ Respect des délais
      □ Qualité administrative

  □ 5. Satisfaction Formateur
    □ Après chaque session
    □ Couvert par IND 22

□ Dashboard satisfaction
  □ Vue consolidée tous types
  □ Évolution dans le temps
  □ Export pour audit
```

---

### INDICATEUR 31 : Traitement des réclamations

**Statut** : 🟡 À développer

**Exigence Qualiopi** :
> Le prestataire met en œuvre des modalités de traitement des difficultés rencontrées, des réclamations.

**Développements requis** :

```
□ Créer Outils > Réclamations

□ Interface de gestion :
  □ Bouton "Nouvelle réclamation"
  □ Tableau des réclamations avec colonnes :
    □ Date réclamation
    □ Origine (email, téléphone, courrier, autre)
    □ Client / Formation concernée
    □ Description du problème
    □ Date prise en compte
    □ Analyse
    □ Actions correctives
    □ Retour fait au client
    □ Action préventive ajoutée au plan

□ Workflow de traitement :
  □ Statuts : Nouvelle → En analyse → En cours → Résolue
  □ Notifications automatiques
  □ Historique des échanges

□ Statistiques :
  □ Nombre de réclamations
  □ Délai moyen de traitement
  □ Types de réclamations
```

---

### INDICATEUR 32 : Mesures d'amélioration

**Statut** : 🟡 À développer

**Exigence Qualiopi** :
> Le prestataire met en œuvre des mesures d'amélioration à partir de l'analyse des appréciations et réclamations.

**Développements requis** :

```
□ Créer Outils > Améliorations

□ Plan d'amélioration continue :
  □ Liste des actions d'amélioration
  □ Pour chaque action :
    □ Origine (réclamation, évaluation, veille, audit)
    □ Description de l'amélioration
    □ Responsable
    □ Échéance
    □ Statut (À faire, En cours, Terminée)
    □ Date de réalisation
    □ Résultat

□ Lien avec les réclamations :
  □ Chaque réclamation peut générer une action d'amélioration
  □ Traçabilité complète

□ Dashboard amélioration continue :
  □ Actions en cours
  □ Actions terminées
  □ Efficacité des actions
```

---

## SYSTÈME D'AUTOMATISATION

### Architecture du moteur

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WORKBOTS AUTOMATION ENGINE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │
│  │ DÉCLENCHEUR │───▶│  CONDITIONS │───▶│   ACTIONS   │                  │
│  │  (Trigger)  │    │  (Filters)  │    │  (Execute)  │                  │
│  └─────────────┘    └─────────────┘    └─────────────┘                  │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  DÉCLENCHEURS DISPONIBLES :                                              │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • Nouvelle pré-inscription                                       │    │
│  │ • Inscription confirmée à une session                            │    │
│  │ • J-7 avant début session                                        │    │
│  │ • J-1 avant début session                                        │    │
│  │ • Début de session                                               │    │
│  │ • Fin de journée de formation                                    │    │
│  │ • Fin de session                                                 │    │
│  │ • Évaluation complétée                                           │    │
│  │ • Score inférieur à un seuil                                     │    │
│  │ • Document non signé après X jours                               │    │
│  │ • Réclamation reçue                                              │    │
│  │ • J+30 après fin de session (éval à froid)                       │    │
│  │ • Planification personnalisée (CRON)                             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  CONDITIONS DISPONIBLES :                                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • Si formation certifiante                                       │    │
│  │ • Si modalité = présentiel/distanciel/mixte                      │    │
│  │ • Si score < X                                                   │    │
│  │ • Si document manquant                                           │    │
│  │ • Si signature en attente                                        │    │
│  │ • Si stagiaire en situation de handicap                          │    │
│  │ • Si financé par OPCO                                            │    │
│  │ • Condition personnalisée (formule)                              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ACTIONS DISPONIBLES :                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • Envoyer un email (template personnalisable)                    │    │
│  │ • Envoyer un SMS                                                 │    │
│  │ • Générer un document                                            │    │
│  │ • Créer une tâche interne                                        │    │
│  │ • Notifier l'équipe (notification in-app)                        │    │
│  │ • Mettre à jour un champ                                         │    │
│  │ • Créer une réclamation                                          │    │
│  │ • Ajouter une action d'amélioration                              │    │
│  │ • Webhook externe                                                │    │
│  │ • Délai / Attente                                                │    │
│  │ • Branchement conditionnel                                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Interface visuelle (style Make/Integromat)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  AUTOMATISATIONS                                            [+ Nouveau] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 🟢 Parcours inscription complet                      [Actif] [⚙️] │   │
│  │    Déclenché 45 fois ce mois • Dernière exécution : il y a 2h    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 🟢 Rappels J-7 et J-1                                [Actif] [⚙️] │   │
│  │    Déclenché 12 fois ce mois • Dernière exécution : hier         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 🟢 Enquêtes satisfaction automatiques                [Actif] [⚙️] │   │
│  │    Déclenché 8 fois ce mois • Dernière exécution : il y a 3j     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 🔴 Relances signatures                             [Inactif] [⚙️] │   │
│  │    Non déclenché                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  ÉDITEUR DE WORKFLOW                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│      ┌───────────────┐                                                  │
│      │  🔔 Trigger   │                                                  │
│      │ Fin de session│                                                  │
│      └───────┬───────┘                                                  │
│              │                                                          │
│              ▼                                                          │
│      ┌───────────────┐                                                  │
│      │  ⏱️ Délai     │                                                  │
│      │   1 heure     │                                                  │
│      └───────┬───────┘                                                  │
│              │                                                          │
│              ▼                                                          │
│      ┌───────────────┐                                                  │
│      │  📧 Email     │                                                  │
│      │ Eval à chaud  │                                                  │
│      └───────┬───────┘                                                  │
│              │                                                          │
│              ▼                                                          │
│      ┌───────────────┐                                                  │
│      │  ⏱️ Délai     │                                                  │
│      │   30 jours    │                                                  │
│      └───────┬───────┘                                                  │
│              │                                                          │
│              ▼                                                          │
│      ┌───────────────┐                                                  │
│      │  📧 Email     │                                                  │
│      │ Eval à froid  │                                                  │
│      └───────────────┘                                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Workflows pré-configurés

| Workflow | Déclencheur | Actions |
|----------|-------------|---------|
| **Parcours inscription** | Nouvelle pré-inscription | Email confirmation → Création apprenant → Notif équipe |
| **Rappels session** | J-7 et J-1 | Email convocation + documents |
| **Enquêtes satisfaction** | Fin de session | Email éval à chaud → Délai 30j → Email éval à froid |
| **Relances signatures** | Document non signé +3j | Email relance → +3j → Relance 2 → Notif équipe |
| **Adaptabilité** | Score positionnement < 20% | Générer fiche adaptabilité → Email apprenant → Créer module 0 |
| **Réclamation** | Nouvelle réclamation | Notif équipe → Email accusé réception |

---

## AGENT QUALIOPI IA

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      AGENT QUALIOPI INTELLIGENT                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    MOTEUR D'ANALYSE IA                           │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │    │
│  │  │ Claude  │  │ Règles  │  │ Base de │  │ Machine │            │    │
│  │  │   API   │  │ Métier  │  │ Preuves │  │Learning │            │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    FONCTIONNALITÉS                               │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                  │    │
│  │  📊 DASHBOARD CONFORMITÉ                                         │    │
│  │  • Score global : 87%                                            │    │
│  │  • Indicateurs conformes : 28/32                                 │    │
│  │  • Actions prioritaires : 4                                      │    │
│  │  • Prochaine échéance audit : 15/06/2025                         │    │
│  │                                                                  │    │
│  │  🔍 ANALYSE AUTOMATIQUE                                          │    │
│  │  • Scan des formations (objectifs, évaluations, documents)       │    │
│  │  • Détection des preuves manquantes                              │    │
│  │  • Identification des non-conformités potentielles               │    │
│  │  • Suggestions d'amélioration contextuelles                      │    │
│  │                                                                  │    │
│  │  🚨 ALERTES PROACTIVES                                           │    │
│  │  • Documents expirés ou à renouveler                             │    │
│  │  • Formations sans évaluation complète                           │    │
│  │  • Taux de satisfaction bas (< 80%)                              │    │
│  │  • Échéances administratives approchantes                        │    │
│  │                                                                  │    │
│  │  💬 ASSISTANT CONVERSATIONNEL                                    │    │
│  │  • Questions sur les indicateurs                                 │    │
│  │  • Conseils de mise en conformité                                │    │
│  │  • Aide à la rédaction de documents                              │    │
│  │  • Préparation aux questions d'audit                             │    │
│  │                                                                  │    │
│  │  📄 GÉNÉRATION DE PREUVES                                        │    │
│  │  • Export automatique par indicateur                             │    │
│  │  • Captures d'écran du système                                   │    │
│  │  • Statistiques formatées pour l'audit                           │    │
│  │  • Dossier d'audit complet (ZIP)                                 │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Dashboard Qualiopi

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DASHBOARD QUALIOPI                                    🔔 3 alertes     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │  SCORE GLOBAL   │  │   INDICATEURS   │  │    PROCHAIN     │          │
│  │                 │  │                 │  │     AUDIT       │          │
│  │      87%        │  │    28 / 32      │  │   15/06/2025    │          │
│  │   ████████░░    │  │   conformes     │  │   dans 168j     │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  CONFORMITÉ PAR CRITÈRE                                          │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                  │    │
│  │  Critère 1 - Information    ████████████░░░░  75%  ⚠️           │    │
│  │  Critère 2 - Objectifs      ████████████████  100% ✅           │    │
│  │  Critère 3 - Adaptation     ██████████████░░  90%  ✅           │    │
│  │  Critère 4 - Moyens         ████████████████  N/A  ➖           │    │
│  │  Critère 5 - Qualification  ████████████░░░░  80%  ✅           │    │
│  │  Critère 6 - Environnement  ██████████░░░░░░  65%  ⚠️           │    │
│  │  Critère 7 - Recueil        ████████████████  100% ✅           │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  🚨 ACTIONS PRIORITAIRES                                         │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                  │    │
│  │  1. Mettre à jour le catalogue public (IND 1)        [Résoudre] │    │
│  │  2. Configurer la veille réglementaire (IND 23)      [Résoudre] │    │
│  │  3. Compléter les fiches intervenants (IND 17)       [Résoudre] │    │
│  │  4. Ajouter l'organigramme (IND 9)                   [Résoudre] │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  💬 ASSISTANT QUALIOPI                                           │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                  │    │
│  │  Posez votre question sur Qualiopi...                           │    │
│  │  ┌─────────────────────────────────────────────────────────┐    │    │
│  │  │                                                          │    │    │
│  │  └─────────────────────────────────────────────────────────┘    │    │
│  │                                                                  │    │
│  │  Suggestions :                                                   │    │
│  │  • Comment préparer mon audit initial ?                         │    │
│  │  • Quelles preuves pour l'indicateur 7 ?                        │    │
│  │  • Comment améliorer mon taux de satisfaction ?                 │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## SPÉCIFICATIONS TECHNIQUES

### Nouveaux Modèles Prisma

```prisma
// ============================================
// QUALIOPI - CATALOGUE PUBLIC
// ============================================

model PreInscription {
  id                    String   @id @default(uuid())
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id])
  formationId           String
  formation             Formation @relation(fields: [formationId], references: [id])

  // Partie 1 : Analyse du besoin
  objectifsPro          String?  @db.Text
  contexte              String?  @db.Text
  experiencePrealable   String?  @db.Text
  attentesSpecifiques   String?  @db.Text
  contraintes           String?  @db.Text

  // Partie 2 : Fiche de renseignements
  civilite              String?
  nom                   String
  prenom                String
  dateNaissance         DateTime?
  email                 String
  telephone             String?
  adresse               String?
  codePostal            String?
  ville                 String?

  // Situation professionnelle
  situationPro          SituationPro?
  entreprise            String?
  poste                 String?

  // Handicap (OBLIGATOIRE)
  situationHandicap     Boolean  @default(false)
  besoinsAmenagements   String?  @db.Text

  // Financement
  modeFinancement       ModeFinancement?

  statut                PreInscriptionStatut @default(NOUVELLE)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([organizationId])
  @@index([formationId])
}

enum SituationPro {
  SALARIE
  INDEPENDANT
  DEMANDEUR_EMPLOI
  ETUDIANT
  AUTRE
}

enum ModeFinancement {
  ENTREPRISE
  OPCO
  CPF
  POLE_EMPLOI
  PERSONNEL
  AUTRE
}

enum PreInscriptionStatut {
  NOUVELLE
  EN_TRAITEMENT
  ACCEPTEE
  REFUSEE
}

// ============================================
// QUALIOPI - INDICATEURS DE RÉSULTATS
// ============================================

model IndicateursFormation {
  id                    String   @id @default(uuid())
  formationId           String   @unique
  formation             Formation @relation(fields: [formationId], references: [id])

  tauxSatisfaction      Float?   // Calculé depuis évaluations à chaud
  nombreAvis            Int      @default(0)
  nombreStagiaires      Int      @default(0)
  tauxReussite          Float?   // Pourcentage réussite évaluation finale
  tauxCertification     Float?   // Si formation certifiante

  dernierCalcul         DateTime?

  @@index([formationId])
}

// ============================================
// QUALIOPI - CERTIFICATION RS
// ============================================

// Ajout dans Formation existant :
// isCertifiante         Boolean  @default(false)
// numeroFicheRS         String?
// referentielRSUrl      String?

model TableauCroiseRS {
  id                    String   @id @default(uuid())
  formationId           String
  formation             Formation @relation(fields: [formationId], references: [id])

  competenceRS          String   @db.Text  // Compétence du référentiel
  objectifPedagogique   String   @db.Text  // Objectif de la formation
  correspondance        Int      // 0-100%
  commentaire           String?  @db.Text

  createdAt             DateTime @default(now())

  @@index([formationId])
}

// ============================================
// QUALIOPI - INTERVENANT ENRICHI
// ============================================

// Ajouts dans Intervenant existant :
model IntervenantQualiopi {
  id                        String   @id @default(uuid())
  intervenantId             String   @unique
  intervenant               Intervenant @relation(fields: [intervenantId], references: [id])

  photoUrl                  String?
  cvUrl                     String?
  numeroDeclarationActivite String?

  // Relations
  diplomes                  IntervenantDiplome[]
  ficheMission              FicheMission?

  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
}

model IntervenantDiplome {
  id                    String   @id @default(uuid())
  intervenantQualiopiId String
  intervenantQualiopi   IntervenantQualiopi @relation(fields: [intervenantQualiopiId], references: [id])

  intitule              String
  etablissement         String?
  annee                 Int?
  documentUrl           String?

  @@index([intervenantQualiopiId])
}

model FicheMission {
  id                    String   @id @default(uuid())
  intervenantQualiopiId String   @unique
  intervenantQualiopi   IntervenantQualiopi @relation(fields: [intervenantQualiopiId], references: [id])

  competencesDomaine    String?  @db.Text
  competencesIngenierie String?  @db.Text
  competencesAnimation  String?  @db.Text

  signatureUrl          String?
  signatureDate         DateTime?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

// ============================================
// QUALIOPI - LIEU DE FORMATION
// ============================================

model LieuFormationChecklist {
  id                    String   @id @default(uuid())
  lieuFormationId       String   @unique
  lieuFormation         LieuFormation @relation(fields: [lieuFormationId], references: [id])

  surfaceMinimale       Boolean  @default(false)  // 4m² par personne
  exigencesERP          Boolean  @default(false)  // Sécurité incendie
  ventilation           Boolean  @default(false)
  eclairage             Boolean  @default(false)
  sanitaires            Boolean  @default(false)
  accessibiliteHandicap Boolean  @default(false)
  acceWifi              Boolean  @default(false)
  videoprojecteur       Boolean  @default(false)
  dispositionMobilier   Boolean  @default(false)
  installationAmont     Boolean  @default(false)
  fournituresStagiaires Boolean  @default(false)

  updatedAt             DateTime @updatedAt
}

// ============================================
// QUALIOPI - ORGANIGRAMME
// ============================================

model Organigramme {
  id                    String   @id @default(uuid())
  organizationId        String   @unique
  organization          Organization @relation(fields: [organizationId], references: [id])

  postes                OrganigrammePoste[]

  updatedAt             DateTime @updatedAt
}

model OrganigrammePoste {
  id                    String   @id @default(uuid())
  organigrammeId        String
  organigramme          Organigramme @relation(fields: [organigrammeId], references: [id])

  titre                 String   // Ex: "Gérant", "Référent handicap"
  nom                   String
  prenom                String
  photoUrl              String?
  intervenantId         String?  // Lien optionnel avec Intervenant
  ordre                 Int      @default(0)

  @@index([organigrammeId])
}

// ============================================
// QUALIOPI - VEILLE RÉGLEMENTAIRE
// ============================================

model VeilleCategorie {
  id                    String   @id @default(uuid())
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id])

  type                  VeilleType
  nom                   String
  description           String?  @db.Text

  sources               VeilleSource[]
  articles              VeilleArticle[]

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([organizationId])
}

enum VeilleType {
  LEGALE
  METIER
  INNOVATION
  HANDICAP
}

model VeilleSource {
  id                    String   @id @default(uuid())
  veilleCategorieId     String
  veilleCategorie       VeilleCategorie @relation(fields: [veilleCategorieId], references: [id])

  nom                   String
  url                   String
  active                Boolean  @default(true)

  @@index([veilleCategorieId])
}

model VeilleArticle {
  id                    String   @id @default(uuid())
  veilleCategorieId     String
  veilleCategorie       VeilleCategorie @relation(fields: [veilleCategorieId], references: [id])

  titre                 String
  resume                String?  @db.Text
  url                   String
  datePublication       DateTime
  lu                    Boolean  @default(false)

  createdAt             DateTime @default(now())

  @@index([veilleCategorieId])
}

// ============================================
// QUALIOPI - RÉCLAMATIONS & AMÉLIORATIONS
// ============================================

model Reclamation {
  id                    String   @id @default(uuid())
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id])

  dateReclamation       DateTime @default(now())
  origine               ReclamationOrigine

  clientNom             String?
  formationId           String?
  formation             Formation? @relation(fields: [formationId], references: [id])

  description           String   @db.Text
  datePriseEnCompte     DateTime?
  analyse               String?  @db.Text
  actionsCorrectives    String?  @db.Text
  retourClient          String?  @db.Text
  actionPreventive      String?  @db.Text

  statut                ReclamationStatut @default(NOUVELLE)

  ameliorations         Amelioration[]

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([organizationId])
}

enum ReclamationOrigine {
  EMAIL
  TELEPHONE
  COURRIER
  EN_PERSONNE
  AUTRE
}

enum ReclamationStatut {
  NOUVELLE
  EN_ANALYSE
  EN_COURS
  RESOLUE
}

model Amelioration {
  id                    String   @id @default(uuid())
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id])

  origine               AmeliorationOrigine
  reclamationId         String?
  reclamation           Reclamation? @relation(fields: [reclamationId], references: [id])

  description           String   @db.Text
  responsable           String?
  echeance              DateTime?
  statut                AmeliorationStatut @default(A_FAIRE)
  dateRealisation       DateTime?
  resultat              String?  @db.Text

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([organizationId])
}

enum AmeliorationOrigine {
  RECLAMATION
  EVALUATION
  VEILLE
  AUDIT
  INTERNE
}

enum AmeliorationStatut {
  A_FAIRE
  EN_COURS
  TERMINEE
}

// ============================================
// QUALIOPI - PROCÉDURES OF
// ============================================

model ProcedureOF {
  id                    String   @id @default(uuid())
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id])

  type                  ProcedureType
  titre                 String
  contenu               String   @db.Text  // HTML/JSON TipTap
  version               Int      @default(1)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([organizationId, type])
  @@index([organizationId])
}

enum ProcedureType {
  ACCUEIL_STAGIAIRES
  GESTION_RECLAMATIONS
  EVALUATION
  SOUS_TRAITANCE
  VEILLE
  CUSTOM
}

// ============================================
// MOTEUR D'AUTOMATISATION
// ============================================

model Workflow {
  id                    String   @id @default(uuid())
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id])

  nom                   String
  description           String?
  actif                 Boolean  @default(true)

  trigger               WorkflowTrigger
  triggerConfig         Json?    // Configuration spécifique au trigger

  etapes                WorkflowEtape[]
  executions            WorkflowExecution[]

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([organizationId])
}

enum WorkflowTrigger {
  PRE_INSCRIPTION
  INSCRIPTION_SESSION
  J_MOINS_7
  J_MOINS_1
  DEBUT_SESSION
  FIN_JOURNEE
  FIN_SESSION
  EVALUATION_COMPLETEE
  SCORE_INFERIEUR
  DOCUMENT_NON_SIGNE
  RECLAMATION_RECUE
  J_PLUS_30
  CRON
}

model WorkflowEtape {
  id                    String   @id @default(uuid())
  workflowId            String
  workflow              Workflow @relation(fields: [workflowId], references: [id])

  ordre                 Int
  type                  WorkflowEtapeType
  config                Json     // Configuration de l'étape

  @@index([workflowId])
}

enum WorkflowEtapeType {
  EMAIL
  SMS
  GENERER_DOCUMENT
  CREER_TACHE
  NOTIFICATION
  METTRE_A_JOUR
  CREER_RECLAMATION
  CREER_AMELIORATION
  WEBHOOK
  DELAI
  CONDITION
}

model WorkflowExecution {
  id                    String   @id @default(uuid())
  workflowId            String
  workflow              Workflow @relation(fields: [workflowId], references: [id])

  declencheurId         String?  // ID de l'entité déclencheuse
  declencheurType       String?  // Type de l'entité

  statut                WorkflowExecutionStatut @default(EN_COURS)
  etapeActuelle         Int      @default(0)
  logs                  Json?
  erreur                String?  @db.Text

  debutAt               DateTime @default(now())
  finAt                 DateTime?

  @@index([workflowId])
}

enum WorkflowExecutionStatut {
  EN_COURS
  EN_ATTENTE
  TERMINEE
  ERREUR
}

// ============================================
// QUALIOPI - AUDIT
// ============================================

model AuditQualiopi {
  id                    String   @id @default(uuid())
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id])

  type                  AuditType
  dateAudit             DateTime
  organismeAuditeur     String?

  scoreGlobal           Float?
  indicateurs           AuditIndicateur[]

  observations          String?  @db.Text
  nonConformites        String?  @db.Text
  actionsRequises       String?  @db.Text

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([organizationId])
}

enum AuditType {
  INITIAL
  SURVEILLANCE
  RENOUVELLEMENT
}

model AuditIndicateur {
  id                    String   @id @default(uuid())
  auditQualiopiId       String
  auditQualiopi         AuditQualiopi @relation(fields: [auditQualiopiId], references: [id])

  numeroIndicateur      Int      // 1-32
  statut                AuditIndicateurStatut
  preuveFournie         Boolean  @default(false)
  commentaire           String?  @db.Text

  @@index([auditQualiopiId])
}

enum AuditIndicateurStatut {
  CONFORME
  NON_CONFORME_MINEURE
  NON_CONFORME_MAJEURE
  NON_APPLICABLE
}

// ============================================
// QUALIOPI - BPF
// ============================================

model BPF {
  id                    String   @id @default(uuid())
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id])

  annee                 Int
  statut                BPFStatut @default(BROUILLON)

  // Données collectées automatiquement
  nombreStagiaires      Int      @default(0)
  heuresFormation       Float    @default(0)
  chiffreAffaires       Float    @default(0)

  // Répartitions (JSON)
  repartitionType       Json?    // Par type de formation
  repartitionPublic     Json?    // Par type de public

  dateDeclaration       DateTime?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([organizationId, annee])
  @@index([organizationId])
}

enum BPFStatut {
  BROUILLON
  EN_VERIFICATION
  DECLARE
}

// ============================================
// SATISFACTION MULTIPLES
// ============================================

model EnqueteSatisfaction {
  id                    String   @id @default(uuid())
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id])

  type                  EnqueteType
  sessionId             String?
  formationId           String?

  destinataireEmail     String
  destinataireNom       String?

  statut                EnqueteStatut @default(ENVOYEE)
  token                 String   @unique @default(uuid())

  reponses              Json?
  scoreGlobal           Float?

  envoyeAt              DateTime @default(now())
  reponduAt             DateTime?

  @@index([organizationId])
  @@index([token])
}

enum EnqueteType {
  STAGIAIRE_CHAUD
  STAGIAIRE_FROID
  ENTREPRISE
  FINANCEUR
  FORMATEUR
}

enum EnqueteStatut {
  ENVOYEE
  OUVERTE
  COMPLETEE
  EXPIREE
}
```

### Nouvelles Routes API

```
// Catalogue public
GET    /api/public/catalogue                    # Liste formations publiques
GET    /api/public/catalogue/[id]               # Détails formation
POST   /api/public/pre-inscription              # Soumettre pré-inscription

// Indicateurs
GET    /api/qualiopi/indicateurs                # Dashboard conformité
GET    /api/qualiopi/indicateurs/[num]          # Détail indicateur
POST   /api/qualiopi/indicateurs/calculer       # Recalculer indicateurs

// Tableau croisé RS
POST   /api/qualiopi/tableau-croise             # Générer tableau croisé
GET    /api/qualiopi/tableau-croise/[formationId]

// Intervenants enrichis
PATCH  /api/donnees/intervenants/[id]/qualiopi  # Infos Qualiopi
POST   /api/donnees/intervenants/[id]/diplomes  # Ajouter diplôme
POST   /api/donnees/intervenants/[id]/fiche-mission

// Lieux checklist
PATCH  /api/donnees/lieux/[id]/checklist

// Organigramme
GET    /api/organisation/organigramme
POST   /api/organisation/organigramme
PATCH  /api/organisation/organigramme/postes/[id]

// Veille
GET    /api/outils/veille                       # Toutes les veilles
GET    /api/outils/veille/[type]                # Par type
POST   /api/outils/veille/sources               # Ajouter source
POST   /api/outils/veille/refresh               # Rafraîchir articles

// Réclamations
GET    /api/outils/reclamations
POST   /api/outils/reclamations
PATCH  /api/outils/reclamations/[id]
DELETE /api/outils/reclamations/[id]

// Améliorations
GET    /api/outils/ameliorations
POST   /api/outils/ameliorations
PATCH  /api/outils/ameliorations/[id]

// Procédures
GET    /api/organisation/procedures
POST   /api/organisation/procedures
PATCH  /api/organisation/procedures/[type]

// Workflows / Automatisations
GET    /api/automatisations
POST   /api/automatisations
PATCH  /api/automatisations/[id]
DELETE /api/automatisations/[id]
POST   /api/automatisations/[id]/executer
GET    /api/automatisations/[id]/executions

// Audit
GET    /api/qualiopi/audit/dashboard
POST   /api/qualiopi/audit
GET    /api/qualiopi/audit/[id]
POST   /api/qualiopi/audit/generer-preuves
GET    /api/qualiopi/audit/export-dossier       # ZIP complet

// BPF
GET    /api/bpf
GET    /api/bpf/[annee]
POST   /api/bpf/[annee]/calculer
POST   /api/bpf/[annee]/declarer

// Enquêtes satisfaction
GET    /api/satisfaction/enquetes
POST   /api/satisfaction/enquetes/envoyer
GET    /api/satisfaction/[token]                # Public - répondre
POST   /api/satisfaction/[token]/reponse
GET    /api/satisfaction/statistiques

// Agent Qualiopi IA
POST   /api/agent-qualiopi/analyser
POST   /api/agent-qualiopi/chat
POST   /api/agent-qualiopi/suggestions
```

---

## SUIVI DU DÉVELOPPEMENT

### Phase 1 : Fondations Qualiopi (Indicateurs 1-7)

| Tâche | Indicateur | Statut | Notes |
|-------|------------|--------|-------|
| Catalogue public | IND 1 | ⬜ À faire | |
| Formulaire pré-inscription | IND 1, 4 | ⬜ À faire | |
| Calcul taux satisfaction | IND 2 | ⬜ À faire | |
| Affichage indicateurs | IND 2 | ⬜ À faire | |
| Champs formation certifiante | IND 3 | ⬜ À faire | |
| Upload référentiel RS | IND 3 | ⬜ À faire | |
| Onglet Notes apprenant | IND 5 | ⬜ À faire | |
| Email J-7 automatique | IND 5 | ⬜ À faire | |
| Bouton scénario pédagogique | IND 6 | ⬜ À faire | |
| Tableau croisé RS/Formation | IND 7 | ⬜ À faire | |

### Phase 2 : Parcours Apprenant (Indicateurs 8-12)

| Tâche | Indicateur | Statut | Notes |
|-------|------------|--------|-------|
| Test positionnement | IND 8 | ✅ Existant | |
| Évaluation finale | IND 8 | ✅ Existant | |
| Email convocation | IND 9 | ⬜ À faire | |
| Restructuration espace apprenant | IND 9 | ⬜ À faire | |
| Organigramme OF | IND 9 | ⬜ À faire | |
| Fiche adaptabilité | IND 10 | ⬜ À faire | |
| Module 0 mise à niveau | IND 10 | ⬜ À faire | |
| Document corrélation obj/eval | IND 11 | ⬜ À faire | |
| Ateliers par module | IND 12 | ✅ Existant | |

### Phase 3 : Intervenants & Lieux (Indicateurs 17-19, 21-22)

| Tâche | Indicateur | Statut | Notes |
|-------|------------|--------|-------|
| Enrichir fiche intervenant | IND 17 | ⬜ À faire | |
| Checklist lieu formation | IND 17 | ⬜ À faire | |
| Fiche mission intervenant | IND 17, 21 | ⬜ À faire | |
| Espace intervenant | IND 17 | ⬜ À faire | |
| Questionnaire satisfaction formateur | IND 22 | ⬜ À faire | |
| Agent IA Formateur | IND 22 | ⬜ À faire | |

### Phase 4 : Veille & Qualité (Indicateurs 23-27, 31-32)

| Tâche | Indicateur | Statut | Notes |
|-------|------------|--------|-------|
| Module veille légale | IND 23 | ⬜ À faire | |
| Module veille métier | IND 24 | ⬜ À faire | |
| Module veille handicap | IND 25 | ⬜ À faire | |
| Procédures OF | IND 26 | ⬜ À faire | |
| Contrat sous-traitance | IND 27 | ⬜ À faire | |
| Module réclamations | IND 31 | ⬜ À faire | |
| Module améliorations | IND 32 | ⬜ À faire | |

### Phase 5 : Satisfaction (Indicateur 30)

| Tâche | Indicateur | Statut | Notes |
|-------|------------|--------|-------|
| Enquête stagiaire à chaud | IND 30 | ⬜ À faire | |
| Enquête stagiaire à froid | IND 30 | ⬜ À faire | |
| Enquête entreprise | IND 30 | ⬜ À faire | |
| Enquête financeur | IND 30 | ⬜ À faire | |
| Dashboard satisfaction | IND 30 | ⬜ À faire | |

### Phase 6 : Automatisations

| Tâche | Statut | Notes |
|-------|--------|-------|
| Modèles Workflow | ⬜ À faire | |
| Interface visuelle | ⬜ À faire | |
| Exécuteur de workflows | ⬜ À faire | |
| Templates pré-configurés | ⬜ À faire | |
| Dashboard automatisations | ⬜ À faire | |

### Phase 7 : Agent Qualiopi IA

| Tâche | Statut | Notes |
|-------|--------|-------|
| Dashboard conformité | ⬜ À faire | |
| Moteur d'analyse | ⬜ À faire | |
| Alertes proactives | ⬜ À faire | |
| Chat conversationnel | ⬜ À faire | |
| Génération de preuves | ⬜ À faire | |

### Phase 8 : Audit & BPF

| Tâche | Statut | Notes |
|-------|--------|-------|
| Module préparation audit | ⬜ À faire | |
| Checklist par indicateur | ⬜ À faire | |
| Export dossier audit | ⬜ À faire | |
| Module BPF | ⬜ À faire | |
| Calcul automatique BPF | ⬜ À faire | |

### Phase 9 : Intégrations OPCO

| Tâche | Statut | Notes |
|-------|--------|-------|
| API OPCO EP | ⬜ À faire | |
| API OPCO Atlas | ⬜ À faire | |
| Vérification budgets | ⬜ À faire | |
| Soumission dossiers | ⬜ À faire | |

---

## MÉTRIQUES DE SUCCÈS

### KPIs Produit

- **Taux de conformité moyen** des OF utilisant la plateforme
- **Temps de création** d'une formation complète (objectif : < 30 min)
- **Taux de renouvellement Qualiopi** des clients (objectif : > 90%)
- **NPS** (Net Promoter Score) des utilisateurs

### KPIs Techniques

- **Couverture des 32 indicateurs** : 100%
- **Disponibilité plateforme** : 99.9%
- **Temps de réponse API** : < 200ms
- **Génération IA** : < 30s pour une fiche pédagogique complète

---

## CONCLUSION

Ce document constitue la feuille de route complète pour transformer WORKBOTS Formation en LA plateforme de référence pour les organismes de formation en France.

L'objectif est clair : **permettre à n'importe quel OF de créer des formations de qualité en quelques clics, tout en étant automatiquement conforme à Qualiopi**.

La révolution commence maintenant. 🚀

---

*Document créé le 28/12/2024*
*Dernière mise à jour : 28/12/2024*
*Version : 1.0*
