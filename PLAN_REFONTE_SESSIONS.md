# Plan de Refonte - Système de Sessions Automate Forma

## Vision Globale

### Concept Clé
- **Formation** = Base pédagogique (fiche, modules, slides, évaluations) - créée UNE FOIS
- **Session** = Instance de formation (clients, dates, lieux, documents) - créée PLUSIEURS FOIS

### Parcours Utilisateur

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CRÉER UNE FORMATION                          │
├─────────────────────────────────────────────────────────────────────┤
│  Option A: "Créer depuis zéro"                                      │
│  ├─ Avec IA (génération fiche pédago, évaluations, etc.)           │
│  └─ Sans IA (saisie manuelle des champs)                           │
│                                                                     │
│  Option B: "Importer une formation existante"                       │
│  ├─ Upload fiche pédagogique (PDF/DOCX)                            │
│  ├─ Extraction automatique des données                              │
│  └─ Compléter les champs manquants                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        MES FORMATIONS                               │
│  Liste des formations (base pédagogique)                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Formation "Neuromarketing"                      [+ Session] │   │
│  │ 3 sessions • 2 apprenants au total • Dernière: 28/12/2025  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (Clic sur "+ Session")
┌─────────────────────────────────────────────────────────────────────┐
│                    WIZARD NOUVELLE SESSION                          │
│  (Réutilise le DocumentsWizard actuel)                             │
├─────────────────────────────────────────────────────────────────────┤
│  1. Clients & Participants                                          │
│  2. Tarifs & Financement                                           │
│  3. Lieu & Dates                                                    │
│  4. Formateur(s)                                                    │
│  5. Documents (génération automatique)                              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CALENDRIER DES SESSIONS                          │
│  Vue par mois/semaine/jour                                          │
│  Sessions colorées par modalité                                     │
│  Clic = Détails session + Émargement                               │
└─────────────────────────────────────────────────────────────────────┘

```

---

## Phase 1: Refonte du Schéma Prisma

### 1.1 Renommer DocumentSession → Session
Le modèle `DocumentSession` devient simplement `Session` (plus clair).

### 1.2 Ajouter un nom/référence à la Session
```prisma
model Session {
  id                String          @id @default(cuid())

  // Référence unique (ex: "NEURO-2025-001")
  reference         String          @unique
  nom               String?         // Nom personnalisé optionnel

  // Formation parent (base pédagogique)
  formationId       String
  formation         Formation       @relation(fields: [formationId], references: [id], onDelete: Cascade)

  // ... reste inchangé
}
```

### 1.3 Ajouter des statistiques à Formation
```prisma
model Formation {
  // ... existant

  // Stats calculées (dénormalisées pour perf)
  totalSessions     Int             @default(0)
  totalApprenants   Int             @default(0)
  lastSessionDate   DateTime?
}
```

---

## Phase 2: Page "Améliorer ma formation" (Import)

### URL: `/automate/import`

### Flux d'import:
```
1. Upload fichier (PDF, DOCX, ou ZIP)
   └─ Extraction via API (pdf-parse, mammoth, etc.)

2. Analyse IA (optionnel - payant)
   └─ Extraction structurée: titre, objectifs, modules, durée, etc.

3. Formulaire pré-rempli
   └─ L'utilisateur valide/corrige les données extraites

4. Création Formation
   └─ Sans passer par la génération IA (économie de tokens)

5. Import des documents existants
   └─ QCM, supports de cours, etc.
```

### Champs dynamiques (Mode sans IA):
- Titre de la formation
- Type de session (Intra/Inter)
- Modalité (Présentiel/Distanciel/Mixte)
- Durée (heures/jours)
- Tarifs par type de client
- **Modules** (ajout dynamique):
  - Titre du module
  - Durée du module
  - Objectifs spécifiques
  - Contenu (texte libre)
- Objectifs pédagogiques
- Prérequis
- Public cible
- Moyens pédagogiques
- Modalités d'évaluation
- Accessibilité PSH

---

## Phase 3: Adapter le Wizard de Création

### Mode 1: Avec IA (Premium)
- Étape 1: Contexte → Description libre
- Étape 2: Génération fiche pédagogique + modules
- Étape 3: Génération slides (Gamma)
- Étape 4: Génération évaluations (QCM, tests)
- ~~Étape 5: Documents~~ → SUPPRIMÉE (déplacée dans Sessions)

### Mode 2: Sans IA (Gratuit/Tier 1)
- Étape 1: Contexte → Champs structurés
- Étape 2: Fiche pédagogique manuelle + ajout modules
- Étape 3: Upload slides existants (optionnel)
- Étape 4: Upload/création évaluations manuelles
- ~~Étape 5: Documents~~ → SUPPRIMÉE

### Choix du mode au début du wizard:
```
┌─────────────────────────────────────────────────────────────────┐
│     Comment souhaitez-vous créer votre formation ?             │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────┐  ┌───────────────────────────────┐  │
│  │   ✨ Avec l'IA        │  │   📝 Manuellement             │  │
│  │                       │  │                               │  │
│  │ Décrivez votre        │  │ Remplissez les champs         │  │
│  │ formation et l'IA     │  │ structurés et ajoutez         │  │
│  │ génère tout pour vous │  │ vos modules un par un         │  │
│  │                       │  │                               │  │
│  │ ⚡ Rapide             │  │ 💰 Économique                 │  │
│  │ 🎯 Personnalisé       │  │ 🔒 Contrôle total             │  │
│  └───────────────────────┘  └───────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 4: Système de Sessions dans "Mes Formations"

### 4.1 Vue Liste des Formations (refonte)

```
┌─────────────────────────────────────────────────────────────────┐
│ Mes formations                          [+ Créer une formation] │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🎓 Neuromarketing : Exploiter les neurosciences...         │ │
│ │                                                             │ │
│ │ 📅 3 sessions  👥 8 apprenants  ⏱️ 14h                     │ │
│ │                                                             │ │
│ │ Sessions:                                                   │ │
│ │ ├─ Session #1 - Entreprise ABC (10-11 déc) ✅ Terminée     │ │
│ │ ├─ Session #2 - Jean Dupont (23 déc) 🔄 En cours           │ │
│ │ └─ Session #3 - Entreprise XYZ (27-28 déc) 📅 Planifiée    │ │
│ │                                                             │ │
│ │ [Éditer la formation] [+ Nouvelle session] [Archiver]      │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Modal/Page "Nouvelle Session"

Réutilise le `DocumentsWizard` existant mais:
- Reçoit `formationId` en paramètre
- Ne permet pas de modifier la fiche pédagogique
- Génère automatiquement une référence (NEURO-2025-001)

### 4.3 Dossiers et Documents par Session

Structure fichiers:
```
📁 Mes Fichiers
└── 📁 Neuromarketing (Formation)
    ├── 📄 Fiche pédagogique.pdf
    ├── 📄 Slides.pptx
    ├── 📄 QCM Module 1.pdf
    │
    ├── 📁 Session #1 - Entreprise ABC
    │   ├── 📁 Documents de session
    │   │   ├── 📄 Convention.pdf
    │   │   └── 📄 Devis.pdf
    │   ├── 📁 Jean Martin (apprenant)
    │   │   ├── 📄 Convocation.pdf
    │   │   └── 📄 Attestation.pdf
    │   └── 📁 Marie Durand (apprenant)
    │       └── ...
    │
    └── 📁 Session #2 - Jean Dupont
        └── ...
```

---

## Phase 5: Adaptation Calendrier

### Vue Calendrier
- Affiche les `SessionJournee` de toutes les `Session`
- Filtre par formation possible
- Code couleur par modalité OU par formation

### Vue Liste Sessions
- Nouvelle vue liste (pas calendrier)
- Filtres: Formation, Status, Date
- Actions rapides: Émargement, Documents, Dupliquer

---

## Phase 6: Fix Évaluations

### 6.1 Persistance en BDD
Créer un modèle `Evaluation`:
```prisma
model Evaluation {
  id              String          @id @default(cuid())
  formationId     String
  formation       Formation       @relation(...)

  type            EvaluationType  // POSITIONNEMENT, FINALE, QCM_MODULE
  moduleId        String?         // Si QCM par module

  titre           String
  questions       Json            // Array de questions

  createdAt       DateTime
  updatedAt       DateTime
}

enum EvaluationType {
  POSITIONNEMENT
  FINALE
  QCM_MODULE
  ATELIER_MODULE
}
```

### 6.2 Ateliers
Option "Atelier" en plus de "QCM" par module:
- Titre de l'atelier
- Description/consignes
- Durée estimée
- Matériel nécessaire
- Objectifs de l'atelier

### 6.3 Calcul intelligent de la durée
- Total formation = X heures
- Répartition par module selon % ou durée fixe
- Ateliers générés en fonction du temps restant

---

## Migration des Données

### Script de migration:
1. Renommer `DocumentSession` → `Session`
2. Générer les références uniques pour sessions existantes
3. Calculer `totalSessions` et `totalApprenants` pour chaque Formation
4. Migrer `evaluationsData` JSON → Table `Evaluation`

---

## Ordre d'implémentation

1. **Phase 1** - Schema Prisma (1h)
2. **Phase 4** - Sessions dans Mes Formations (3h)
3. **Phase 5** - Calendrier adapté (2h)
4. **Phase 3** - Wizard mode sans IA (2h)
5. **Phase 2** - Import formations (3h)
6. **Phase 6** - Fix évaluations (2h)

Total estimé: ~13h de développement
