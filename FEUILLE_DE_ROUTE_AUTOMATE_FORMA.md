# Feuille de Route - Automate Forma

## Vision du Projet

**Workbots** est une plateforme SaaS multi-tenant destinée aux organismes de formation et formateurs indépendants. Elle automatise la création de contenus pédagogiques grâce à l'IA : fiches pédagogiques, présentations PowerPoint, évaluations et documents administratifs (conventions, contrats, attestations).

---

## Phase 0 : Fondations (Actuel)

### 0.1 Interface Utilisateur Frontend
- [x] Dashboard principal avec métriques
- [x] Page "Mes formations" avec grille 3 colonnes
- [x] Stepper de création de formation (5 étapes)
- [x] Step Contexte (formulaire initial)
- [x] Step Fiche Pédagogique (affichage + édition titre)
- [x] Step Slides & Support (liste modules)
- [x] Step Évaluations (QCM, positionnement, finale)
- [x] Step Documents (entreprise, salariés, indépendants, formateurs)
- [x] Page Mon Compte (profil utilisateur)
- [x] Sidebar avec navigation Lucide icons
- [x] Header avec recherche + dropdown utilisateur
- [x] Thème clair/sombre
- [x] Context global (AutomateContext) pour état partagé

### 0.2 État Actuel
- Frontend fonctionnel en local
- Données mockées (pas de backend)
- Pas d'authentification
- Pas de persistance

---

## Phase 1 : Infrastructure Backend (Semaine 1-2)

### 1.1 Configuration Supabase
- [ ] Créer projet Supabase
- [ ] Configurer PostgreSQL
- [ ] Activer Supabase Auth (email + OAuth)
- [ ] Créer bucket Storage "formations"
- [ ] Configurer les policies de storage par organisation

### 1.2 Schéma de Base de Données
- [ ] Installer Prisma
- [ ] Créer le schéma multi-tenant complet :
  - [ ] Table `organizations` (clients/revendeurs)
  - [ ] Table `users` (avec rôles: super_admin, org_admin, formateur)
  - [ ] Table `formations`
  - [ ] Table `modules`
  - [ ] Table `documents`
  - [ ] Table `templates`
  - [ ] Table `participants`
  - [ ] Table `api_keys`
  - [ ] Table `audit_logs`
  - [ ] Table `global_config`
- [ ] Exécuter migrations initiales
- [ ] Seed data de test

### 1.3 Row Level Security (RLS)
- [ ] Activer RLS sur toutes les tables
- [ ] Policy : Super admin accès total
- [ ] Policy : Org admin voit son organisation
- [ ] Policy : Formateur voit ses données uniquement
- [ ] Policy : Templates globaux visibles par tous
- [ ] Tester l'isolation des données

### 1.4 Variables d'Environnement
- [ ] Créer `.env.local` avec :
  - DATABASE_URL
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_KEY
  - ANTHROPIC_API_KEY (ou OPENAI_API_KEY)
  - AI_PROVIDER
- [ ] Configurer Vercel (environnement production)

---

## Phase 2 : Authentification & Multi-Tenant (Semaine 3-4)

### 2.1 Authentification Supabase
- [ ] Intégrer @supabase/ssr
- [ ] Créer pages auth :
  - [ ] `/auth/login` (email + mot de passe)
  - [ ] `/auth/register` (inscription)
  - [ ] `/auth/forgot-password`
  - [ ] `/auth/callback` (OAuth)
- [ ] Middleware de protection des routes
- [ ] Gestion des sessions (cookies httpOnly)
- [ ] Redirection post-login selon rôle

### 2.2 Gestion des Organisations
- [ ] Création automatique d'organisation à l'inscription (plan gratuit)
- [ ] Page paramètres organisation (pour org_admin)
- [ ] Upload logo organisation
- [ ] Configuration couleur primaire (marque blanche)
- [ ] Gestion des limites (max formateurs, max formations)

### 2.3 Gestion des Utilisateurs
- [ ] Invitation de formateurs par email
- [ ] Attribution des rôles
- [ ] Liste des membres de l'organisation
- [ ] Désactivation/suppression de compte

### 2.4 Multi-Tenant Middleware
- [ ] Créer `src/middleware.ts` pour :
  - Vérifier l'authentification
  - Injecter l'organisation courante
  - Vérifier les permissions par rôle
  - Gérer les sous-domaines (marque blanche)

---

## Phase 3 : Super Admin Dashboard (Semaine 5)

### 3.1 Layout Admin
- [ ] Créer route group `(admin)/admin/`
- [ ] Layout spécifique avec sidebar admin
- [ ] Protection : uniquement super_admin
- [ ] Thème admin distinct

### 3.2 Pages Admin
- [ ] **Dashboard** (`/admin`)
  - Nombre total d'organisations
  - Nombre total d'utilisateurs
  - Formations créées (graphique)
  - Revenus (si billing)

- [ ] **Organisations** (`/admin/organizations`)
  - Liste avec recherche/filtres
  - Détail organisation
  - Modifier plan/limites
  - Désactiver organisation

- [ ] **Utilisateurs** (`/admin/users`)
  - Liste tous les utilisateurs
  - Filtrer par organisation/rôle
  - Détail utilisateur
  - **Bouton "Se connecter"** (impersonation)

- [ ] **Templates** (`/admin/templates`)
  - Liste des templates globaux
  - Créer nouveau template
  - Éditer template existant
  - Activer/désactiver template

- [ ] **Clés API** (`/admin/api-keys`)
  - Configurer clés globales (Anthropic, OpenAI, Gamma)
  - Clés par organisation (override)

- [ ] **Configuration** (`/admin/settings`)
  - Paramètres globaux du SaaS
  - Textes par défaut
  - Emails système

### 3.3 Système d'Impersonation
- [ ] API route POST `/api/admin/impersonate`
- [ ] API route DELETE `/api/admin/impersonate` (arrêter)
- [ ] Cookie sécurisé `impersonating_user_id`
- [ ] Fonction `getCurrentUser()` avec détection impersonation
- [ ] Bandeau orange visible pendant impersonation
- [ ] Audit log de chaque impersonation

---

## Phase 4 : Éditeur de Documents WYSIWYG (Semaine 6-7)

### 4.1 Installation TipTap
- [ ] Installer les packages TipTap :
  - @tiptap/react
  - @tiptap/starter-kit
  - @tiptap/extension-* (table, image, link, color, etc.)
- [ ] Créer extension custom `TemplateVariable`

### 4.2 Composant DocumentEditor
- [ ] Toolbar complète :
  - Formatage texte (gras, italique, souligné)
  - Titres (H1, H2, H3)
  - Alignement (gauche, centre, droite, justifié)
  - Listes (puces, numérotées)
  - Tableaux (insertion, modification)
  - Images (upload, redimensionnement)
  - Liens
  - Couleurs (texte, surlignage)
- [ ] Dropdown "Insérer une variable"
- [ ] Styles CSS pour variables `{{variable}}`
- [ ] Mode lecture seule (prévisualisation)
- [ ] Sauvegarde automatique (debounce)

### 4.3 Système de Variables
- [ ] Définir toutes les variables disponibles :
  - Formation (titre, description, durée, prix...)
  - Entreprise (nom, SIRET, adresse...)
  - Participants (liste)
  - Formateur (nom, entreprise, N° DA...)
  - Dates (jour, début, fin...)
- [ ] Variables conditionnelles (si participant existe)
- [ ] Variables de boucle (pour chaque module...)

### 4.4 Moteur de Rendu
- [ ] Fonction `renderTemplate(content, context)`
- [ ] Remplacement des variables simples
- [ ] Gestion des boucles (modules, participants)
- [ ] Gestion des conditions
- [ ] Preview en temps réel

---

## Phase 5 : Système de Templates (Semaine 8)

### 5.1 CRUD Templates (Admin)
- [ ] Page création template
- [ ] Sélection type de document
- [ ] Éditeur TipTap pour le contenu
- [ ] Liste des variables disponibles selon type
- [ ] Prévisualisation avec données fictives
- [ ] Sauvegarde en base

### 5.2 Templates par Défaut
- [ ] Créer template : **Fiche Pédagogique**
- [ ] Créer template : **Convention de Formation** (Article L.6353-1)
- [ ] Créer template : **Contrat de Formation Professionnelle**
- [ ] Créer template : **Programme de Formation**
- [ ] Créer template : **Attestation de Fin de Formation**
- [ ] Créer template : **Feuille d'Émargement**
- [ ] Créer template : **Règlement Intérieur**
- [ ] Créer template : **Évaluation à Chaud**
- [ ] Créer template : **Évaluation à Froid**

### 5.3 Templates par Organisation
- [ ] Permettre aux org_admin de créer leurs propres templates
- [ ] Héritage : template org surcharge template global
- [ ] Duplication de template global pour personnalisation

---

## Phase 6 : Export Documents (Semaine 9)

### 6.1 Export PDF
- [ ] Installer @react-pdf/renderer
- [ ] Convertisseur TipTap JSON → React-PDF
- [ ] Gestion des styles (fonts, couleurs)
- [ ] Gestion des tableaux
- [ ] Gestion des images
- [ ] En-tête/pied de page personnalisables
- [ ] Numérotation des pages

### 6.2 Export DOCX
- [ ] Installer docx
- [ ] Convertisseur TipTap JSON → docx
- [ ] Styles Word professionnels
- [ ] Tableaux formatés
- [ ] Images intégrées

### 6.3 Prévisualisation
- [ ] Installer @react-pdf-viewer
- [ ] Modal de prévisualisation PDF
- [ ] Prévisualisation DOCX (Google Docs Viewer ou conversion)
- [ ] Téléchargement direct

### 6.4 Stockage
- [ ] Upload automatique dans Supabase Storage
- [ ] Organisation des fichiers : `/org_id/formation_id/document_type/`
- [ ] Génération d'URLs signées (expiration)
- [ ] Historique des versions

---

## Phase 7 : Intégration IA (Semaine 10-11)

### 7.1 Configuration Vercel AI SDK
- [ ] Installer ai, @ai-sdk/anthropic, @ai-sdk/openai
- [ ] Créer `src/lib/ai/config.ts` (multi-provider)
- [ ] Fonction `getAIProvider()` selon config

### 7.2 Prompts Structurés
- [ ] Créer `src/lib/ai/prompts.ts` :
  - Prompt génération fiche pédagogique
  - Prompt génération QCM (5 questions/module)
  - Prompt test de positionnement
  - Prompt évaluation finale
  - Prompt reformulation/amélioration
- [ ] Schémas Zod pour validation des réponses

### 7.3 API Routes Génération
- [ ] POST `/api/ai/generate-fiche`
  - Input : données contexte
  - Output : fiche pédagogique structurée (JSON)

- [ ] POST `/api/ai/generate-qcm`
  - Input : module (titre + contenu)
  - Output : 5 questions avec réponses

- [ ] POST `/api/ai/generate-positionnement`
  - Input : formation complète
  - Output : test de positionnement

- [ ] POST `/api/ai/generate-evaluation`
  - Input : formation + objectifs
  - Output : évaluation finale

### 7.4 Gestion des Erreurs & Fallback
- [ ] Retry automatique (3 tentatives)
- [ ] Fallback vers autre provider si échec
- [ ] Rate limiting par utilisateur
- [ ] Logging des appels (coûts, tokens)

---

## Phase 8 : Intégration Gamma (Slides) (Semaine 12)

### 8.1 Client Gamma API
- [ ] Créer `src/lib/gamma/client.ts`
- [ ] Authentification API
- [ ] Création de présentation
- [ ] Polling status (processing → completed)
- [ ] Téléchargement PPTX/PDF

### 8.2 Options de Personnalisation
- [ ] Créer composant `GammaOptionsModal`
- [ ] Sélection thème (grille visuelle)
- [ ] Style de graphiques (moderne, classique, minimal)
- [ ] Police (Inter, Roboto, Poppins, Montserrat)
- [ ] Couleur principale (picker ou presets)
- [ ] Inclure images (oui/non)
- [ ] Nombre de slides (auto ou fixe)

### 8.3 Workflow Génération Slides
- [ ] Bouton "Générer PowerPoint" par module
- [ ] Ouverture modal options
- [ ] Appel API Gamma
- [ ] Animation de chargement
- [ ] Notification succès/erreur
- [ ] Stockage du fichier
- [ ] Lien de téléchargement

### 8.4 Support Stagiaire
- [ ] Génération version "notes" (sans animations)
- [ ] Export PDF pour distribution
- [ ] Option : inclure exercices/quiz

---

## Phase 9 : Animations & UX (Semaine 13)

### 9.1 Installation Framer Motion
- [ ] Installer framer-motion
- [ ] Créer composants d'animation réutilisables

### 9.2 Loader de Génération
- [ ] Créer `GenerationLoader` avec :
  - Cercle de progression animé
  - Messages rotatifs contextuels
  - Icône centrale selon type
  - Barre de progression (si disponible)
- [ ] Variantes : fiche, slides, qcm, pdf

### 9.3 Animations Interface
- [ ] Transitions de page (fade)
- [ ] Animation des cartes (hover, apparition)
- [ ] Animation dropdown/modal
- [ ] Toast notifications animées
- [ ] Skeleton loaders pour chargement données

### 9.4 Feedback Utilisateur
- [ ] Toast succès/erreur/info
- [ ] Confirmation avant actions destructives
- [ ] Indicateur de sauvegarde automatique
- [ ] Indicateur de connexion/déconnexion

---

## Phase 10 : Formations CRUD Complet (Semaine 14)

### 10.1 Création Formation
- [ ] Connecter Step Contexte → API
- [ ] Sauvegarde en base à chaque étape
- [ ] Génération automatique fiche pédagogique
- [ ] Création des modules depuis fiche

### 10.2 Édition Formation
- [ ] Charger formation existante par ID
- [ ] Navigation entre étapes avec données
- [ ] Modification fiche (éditeur WYSIWYG)
- [ ] Ajout/suppression modules
- [ ] Régénération IA si contexte modifié

### 10.3 Liste & Recherche
- [ ] API GET `/api/formations` avec pagination
- [ ] Filtres : statut, date, recherche texte
- [ ] Tri : date création, titre, statut
- [ ] Cards avec aperçu

### 10.4 Suppression & Archivage
- [ ] Soft delete (archivage)
- [ ] Suppression définitive (avec confirmation)
- [ ] Suppression des fichiers associés

---

## Phase 11 : Documents Administratifs (Semaine 15)

### 11.1 Step Documents Amélioré
- [ ] Connecter à la base de données
- [ ] Sauvegarde participants (salariés, indépendants)
- [ ] Historique des participants (réutilisation)

### 11.2 Génération Convention
- [ ] Sélection template
- [ ] Pré-remplissage depuis données formation
- [ ] Édition dans DocumentEditor
- [ ] Export PDF avec signature électronique (optionnel)

### 11.3 Génération Contrat
- [ ] Même workflow que convention
- [ ] Variables spécifiques contrat

### 11.4 Autres Documents
- [ ] Feuille d'émargement (tableau dates/signatures)
- [ ] Attestation fin de formation
- [ ] Certificat de réalisation

---

## Phase 12 : Tests & Qualité (Semaine 16)

### 12.1 Tests Unitaires
- [ ] Installer Jest + React Testing Library
- [ ] Tests composants UI critiques
- [ ] Tests utilitaires (rendu templates, etc.)
- [ ] Tests API routes

### 12.2 Tests E2E
- [ ] Installer Playwright
- [ ] Scénario : inscription → création formation → génération
- [ ] Scénario : login → édition → export
- [ ] Scénario : admin → impersonation → retour

### 12.3 Tests de Sécurité
- [ ] Vérifier isolation RLS
- [ ] Tester accès non autorisés
- [ ] Audit des permissions

### 12.4 Performance
- [ ] Lighthouse audit
- [ ] Optimisation images (next/image)
- [ ] Lazy loading composants lourds
- [ ] Mise en cache API

---

## Phase 13 : Déploiement Production (Semaine 17)

### 13.1 Préparation
- [ ] Revue de code complète
- [ ] Vérifier toutes les variables d'environnement
- [ ] Configurer domaine personnalisé
- [ ] Configurer SSL

### 13.2 Déploiement Vercel
- [ ] Connecter repo GitHub
- [ ] Configurer build settings
- [ ] Déployer preview
- [ ] Tests sur preview
- [ ] Déployer production

### 13.3 Monitoring
- [ ] Configurer Vercel Analytics
- [ ] Configurer error tracking (Sentry)
- [ ] Alertes uptime
- [ ] Dashboard métriques

### 13.4 Backup & Sécurité
- [ ] Backup automatique BDD (Supabase)
- [ ] Politique de rétention
- [ ] Plan de reprise d'activité

---

## Phase 14 : Fonctionnalités Avancées (Post-Launch)

### 14.1 Billing & Abonnements
- [ ] Intégrer Stripe
- [ ] Plans tarifaires (Starter, Pro, Enterprise)
- [ ] Gestion des limites par plan
- [ ] Facturation automatique
- [ ] Portail client Stripe

### 14.2 Marque Blanche Avancée
- [ ] Sous-domaines personnalisés (client.automate-forma.com)
- [ ] Domaines personnalisés (formations.client.com)
- [ ] Personnalisation complète (logo, couleurs, emails)
- [ ] Suppression mention "Powered by Automate Forma"

### 14.3 API Publique
- [ ] Documentation API (OpenAPI/Swagger)
- [ ] Authentification API keys
- [ ] Webhooks pour événements
- [ ] Rate limiting

### 14.4 Intégrations
- [ ] Export vers LMS (SCORM)
- [ ] Intégration calendrier (Google, Outlook)
- [ ] Signature électronique (DocuSign, Yousign)
- [ ] CRM (HubSpot, Salesforce)

### 14.5 Analytics Avancées
- [ ] Tableau de bord analytics par formation
- [ ] Suivi des évaluations (scores moyens)
- [ ] Rapports exportables
- [ ] Comparaison périodes

### 14.6 Mobile
- [ ] Application mobile (React Native)
- [ ] Notifications push
- [ ] Mode hors-ligne (consultation)

---

## Récapitulatif des Livrables par Phase

| Phase | Durée | Livrable Principal |
|-------|-------|-------------------|
| 0 | ✅ Fait | Frontend fonctionnel (mockup) |
| 1 | 2 sem | Infrastructure Supabase + BDD |
| 2 | 2 sem | Auth + Multi-tenant |
| 3 | 1 sem | Dashboard Super Admin |
| 4 | 2 sem | Éditeur WYSIWYG |
| 5 | 1 sem | Système de Templates |
| 6 | 1 sem | Export PDF/DOCX |
| 7 | 2 sem | Génération IA |
| 8 | 1 sem | Intégration Gamma |
| 9 | 1 sem | Animations UX |
| 10 | 1 sem | CRUD Formations |
| 11 | 1 sem | Documents Admin |
| 12 | 1 sem | Tests |
| 13 | 1 sem | Déploiement |
| **Total** | **17 sem** | **MVP Complet** |

---

## Stack Technique Finale

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- TipTap (éditeur WYSIWYG)
- Framer Motion (animations)
- Lucide React (icons)

### Backend
- Next.js API Routes
- Prisma (ORM)
- Supabase (PostgreSQL + Auth + Storage)
- Vercel AI SDK

### IA & Génération
- Claude (Anthropic) - génération texte
- Gamma API - génération slides
- @react-pdf/renderer - export PDF
- docx - export Word

### Infrastructure
- Vercel (hosting)
- Supabase (BDD + Auth + Storage)
- Stripe (billing, post-MVP)

---

## Contacts & Ressources

- **Documentation Supabase** : https://supabase.com/docs
- **Documentation Prisma** : https://www.prisma.io/docs
- **Documentation TipTap** : https://tiptap.dev/docs
- **Documentation Vercel AI SDK** : https://sdk.vercel.ai/docs
- **Documentation Gamma API** : https://gamma.app/developers

---

*Dernière mise à jour : 10 décembre 2025*
