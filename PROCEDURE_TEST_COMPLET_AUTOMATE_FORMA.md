# PROCÉDURE DE TEST COMPLET - AUTOMATE FORMA

> **Objectif** : Tester l'intégralité du SaaS de A à Z avant le lancement commercial
> **Durée estimée** : 3-5 jours de tests intensifs
> **Testeur** : Personne externe au développement

---

## PRÉAMBULE

### Convention de notation
- **OK** : Fonctionnalité validée
- **KO** : Bug identifié (décrire le problème)
- **PARTIEL** : Fonctionne partiellement
- **N/A** : Non applicable ou non testable

### Environnement de test
- [ ] URL de test : _______________
- [ ] Compte testeur créé : _______________
- [ ] Navigateur utilisé : _______________
- [ ] Résolution écran : _______________

---

## PARTIE 1 : AUTHENTIFICATION ET COMPTES

### 1.1 Inscription Organisme
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 1.1.1 | Aller sur la page d'inscription | Page s'affiche correctement | |
| 1.1.2 | Remplir le formulaire avec données valides | Validation des champs | |
| 1.1.3 | Soumettre le formulaire | Email de confirmation reçu | |
| 1.1.4 | Cliquer sur le lien de confirmation | Compte activé, redirection dashboard | |
| 1.1.5 | Tester inscription avec email déjà utilisé | Message d'erreur approprié | |
| 1.1.6 | Tester inscription avec email invalide | Validation côté client | |
| 1.1.7 | Tester inscription avec mot de passe faible | Message d'erreur approprié | |

### 1.2 Connexion
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 1.2.1 | Connexion avec identifiants corrects | Accès au dashboard | |
| 1.2.2 | Connexion avec mauvais mot de passe | Message d'erreur | |
| 1.2.3 | Connexion avec email inexistant | Message d'erreur | |
| 1.2.4 | Tester "Mot de passe oublié" | Email de réinitialisation reçu | |
| 1.2.5 | Réinitialiser le mot de passe via le lien | Nouveau mot de passe fonctionnel | |
| 1.2.6 | Déconnexion | Redirection page connexion | |
| 1.2.7 | Accéder à une page protégée sans connexion | Redirection vers login | |

### 1.3 Gestion du profil utilisateur
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 1.3.1 | Accéder à "Mon compte" | Page profil s'affiche | |
| 1.3.2 | Modifier le prénom/nom | Sauvegarde correcte | |
| 1.3.3 | Modifier l'email | Email de confirmation envoyé | |
| 1.3.4 | Changer le mot de passe | Nouveau mot de passe fonctionnel | |
| 1.3.5 | Upload photo de profil | Photo affichée correctement | |

---

## PARTIE 2 : PARAMÈTRES ORGANISATION

### 2.1 Informations de l'organisation
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 2.1.1 | Accéder aux paramètres organisation | Page s'affiche | |
| 2.1.2 | Modifier le nom de l'organisation | Sauvegarde + mise à jour header | |
| 2.1.3 | Ajouter/modifier le numéro DA | Sauvegarde correcte | |
| 2.1.4 | Ajouter/modifier le SIRET | Validation format + sauvegarde | |
| 2.1.5 | Modifier l'adresse complète | Sauvegarde correcte | |
| 2.1.6 | Upload logo organisation | Logo affiché partout | |
| 2.1.7 | Modifier couleur primaire (marque blanche) | Thème mis à jour | |

### 2.2 Gestion des membres
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 2.2.1 | Voir la liste des membres | Liste affichée avec rôles | |
| 2.2.2 | Inviter un nouveau collaborateur | Email d'invitation envoyé | |
| 2.2.3 | Accepter l'invitation (nouveau compte) | Compte créé et lié à l'organisation | |
| 2.2.4 | Modifier le rôle d'un membre | Rôle mis à jour | |
| 2.2.5 | Désactiver un membre | Accès révoqué | |

### 2.3 Organigramme (Qualiopi IND 9)
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 2.3.1 | Accéder à l'organigramme | Page s'affiche | |
| 2.3.2 | Ajouter le gérant | Poste créé | |
| 2.3.3 | Ajouter référent handicap | Poste créé | |
| 2.3.4 | Ajouter référent pédagogique | Poste créé | |
| 2.3.5 | Modifier un poste existant | Modification sauvegardée | |
| 2.3.6 | Supprimer un poste | Suppression effective | |
| 2.3.7 | Télécharger l'organigramme en PDF | PDF généré correctement | |

### 2.4 Procédures qualité (Qualiopi IND 26)
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 2.4.1 | Accéder aux procédures | Liste des 8 procédures affichée | |
| 2.4.2 | Éditer procédure accueil stagiaires | Éditeur WYSIWYG fonctionne | |
| 2.4.3 | Sauvegarder les modifications | Contenu sauvegardé | |
| 2.4.4 | Télécharger une procédure en PDF | PDF généré correctement | |
| 2.4.5 | Vérifier toutes les 8 procédures | Chacune accessible et éditable | |

---

## PARTIE 3 : CRÉATION DE FORMATIONS

### 3.1 Étape 1 - Contexte
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 3.1.1 | Créer nouvelle formation | Wizard s'ouvre | |
| 3.1.2 | Remplir titre de la formation | Validation temps réel | |
| 3.1.3 | Sélectionner la durée (heures) | Champ fonctionnel | |
| 3.1.4 | Choisir la modalité (présentiel/distanciel/mixte) | Sélection fonctionne | |
| 3.1.5 | Définir le public cible | Champ rempli | |
| 3.1.6 | Définir les prérequis | Champ rempli | |
| 3.1.7 | Renseigner les objectifs pédagogiques | Champ rempli | |
| 3.1.8 | Cocher "Formation certifiante" | Champs RS apparaissent | |
| 3.1.9 | Renseigner numéro fiche RS | Validation format | |
| 3.1.10 | Upload référentiel RS (PDF) | Fichier uploadé | |
| 3.1.11 | Passer à l'étape suivante | Navigation fonctionne | |

### 3.2 Étape 2 - Fiche Pédagogique
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 3.2.1 | Cliquer "Générer avec l'IA" | Loader de génération apparaît | |
| 3.2.2 | Attendre la génération | Contenu généré en <60s | |
| 3.2.3 | Vérifier le contenu généré | Modules cohérents avec le contexte | |
| 3.2.4 | Modifier le titre d'un module | Modification sauvegardée | |
| 3.2.5 | Modifier le contenu d'un module | Éditeur WYSIWYG fonctionne | |
| 3.2.6 | Ajouter un module manuellement | Module ajouté | |
| 3.2.7 | Supprimer un module | Module supprimé | |
| 3.2.8 | Réordonner les modules (drag & drop) | Ordre mis à jour | |
| 3.2.9 | Télécharger fiche pédagogique PDF | PDF généré avec bonne mise en forme | |
| 3.2.10 | Télécharger programme de formation | PDF généré correctement | |
| 3.2.11 | Télécharger scénario pédagogique | PDF avec tableau généré | |
| 3.2.12 | Vérifier absence de virgules manquantes dans PDF | Ponctuation correcte | |

### 3.3 Étape 3 - Slides & Supports
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 3.3.1 | Voir liste des modules | Modules listés | |
| 3.3.2 | Cliquer "Générer PowerPoint" sur un module | Modal options s'ouvre | |
| 3.3.3 | Sélectionner un thème | Thème sélectionné | |
| 3.3.4 | Choisir la police | Police sélectionnée | |
| 3.3.5 | Définir nombre de slides | Option configurable | |
| 3.3.6 | Lancer la génération | Génération démarre | |
| 3.3.7 | Suivre la progression | Statut mis à jour en temps réel | |
| 3.3.8 | Télécharger le PowerPoint généré | PPTX téléchargé correctement | |
| 3.3.9 | Ouvrir le PowerPoint | Fichier non corrompu, contenu lisible | |
| 3.3.10 | Générer support stagiaire (PDF) | PDF version notes généré | |

### 3.4 Étape 4 - Évaluations
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 3.4.1 | Générer test de positionnement | Questions générées | |
| 3.4.2 | Vérifier les questions (pertinence) | Questions cohérentes avec formation | |
| 3.4.3 | Modifier une question | Modification sauvegardée | |
| 3.4.4 | Ajouter une question manuellement | Question ajoutée | |
| 3.4.5 | Supprimer une question | Question supprimée | |
| 3.4.6 | Générer QCM par module | QCM générés pour chaque module | |
| 3.4.7 | Vérifier les réponses correctes | Bonnes réponses identifiées | |
| 3.4.8 | Générer évaluation finale | Évaluation générée | |
| 3.4.9 | Créer un atelier pratique | Atelier créé | |
| 3.4.10 | Télécharger les évaluations en PDF | PDFs générés correctement | |

### 3.5 Étape 5 - Documents
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 3.5.1 | Voir liste des documents disponibles | Documents listés par catégorie | |
| 3.5.2 | Générer convention de formation | Document généré avec variables | |
| 3.5.3 | Vérifier les variables remplacées | Nom OF, titre formation, etc. | |
| 3.5.4 | Éditer la convention | Éditeur WYSIWYG fonctionne | |
| 3.5.5 | Télécharger convention PDF | PDF professionnel généré | |
| 3.5.6 | Générer contrat de formation | Document généré | |
| 3.5.7 | Générer attestation de fin | Document généré | |
| 3.5.8 | Générer règlement intérieur | Document généré | |
| 3.5.9 | Générer convocation | Document généré avec dates | |
| 3.5.10 | Finaliser la formation | Formation créée, statut "brouillon" | |

### 3.6 Gestion des formations
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 3.6.1 | Voir liste "Mes formations" | Formations affichées en grille | |
| 3.6.2 | Filtrer par statut | Filtre fonctionne | |
| 3.6.3 | Rechercher une formation | Recherche fonctionne | |
| 3.6.4 | Ouvrir une formation existante | Wizard s'ouvre avec données | |
| 3.6.5 | Modifier une formation | Modifications sauvegardées | |
| 3.6.6 | Dupliquer une formation | Copie créée | |
| 3.6.7 | Archiver une formation | Statut mis à jour | |
| 3.6.8 | Supprimer une formation | Formation supprimée (confirmation) | |

---

## PARTIE 4 : GESTION DES SESSIONS

### 4.1 Création de session
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 4.1.1 | Créer nouvelle session | Formulaire s'ouvre | |
| 4.1.2 | Sélectionner une formation | Formation liée | |
| 4.1.3 | Définir dates de début/fin | Calendrier fonctionne | |
| 4.1.4 | Choisir la modalité | Option sélectionnée | |
| 4.1.5 | Sélectionner un lieu de formation | Lieu lié | |
| 4.1.6 | Ajouter un formateur principal | Formateur assigné | |
| 4.1.7 | Ajouter co-formateurs | Co-formateurs ajoutés | |
| 4.1.8 | Configurer les journées | Journées créées avec horaires | |
| 4.1.9 | Définir horaires (matin/après-midi) | Horaires sauvegardés | |
| 4.1.10 | Sauvegarder la session | Session créée | |

### 4.2 Ajout de clients à la session
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 4.2.1 | Ajouter un client entreprise | Client lié à la session | |
| 4.2.2 | Sélectionner type de client (entreprise/indépendant/particulier) | Option fonctionne | |
| 4.2.3 | Configurer le financement du client | Financement enregistré | |
| 4.2.4 | Ajouter OPCO si applicable | OPCO lié | |
| 4.2.5 | Définir le montant | Montant sauvegardé | |

### 4.3 Ajout de participants
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 4.3.1 | Ajouter un participant existant | Participant lié | |
| 4.3.2 | Créer nouveau participant | Formulaire apprenant s'ouvre | |
| 4.3.3 | Renseigner informations apprenant | Données sauvegardées | |
| 4.3.4 | Associer à un client | Participant lié au client | |
| 4.3.5 | Envoyer invitation apprenant | Email envoyé | |
| 4.3.6 | Vérifier réception email | Email reçu avec lien | |

### 4.4 Gestion des sessions
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 4.4.1 | Voir liste des sessions | Sessions affichées | |
| 4.4.2 | Filtrer par statut/date | Filtres fonctionnent | |
| 4.4.3 | Voir détails d'une session | Page détails s'ouvre | |
| 4.4.4 | Modifier une session | Modifications sauvegardées | |
| 4.4.5 | Annuler une session | Statut mis à jour | |
| 4.4.6 | Voir calendrier des sessions | Vue calendrier fonctionne | |

---

## PARTIE 5 : ÉMARGEMENT ET PRÉSENCE

### 5.1 Feuilles d'émargement
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 5.1.1 | Générer feuille d'émargement | Feuille créée | |
| 5.1.2 | Voir le QR code généré | QR code visible | |
| 5.1.3 | Télécharger la feuille PDF | PDF avec tableau signatures | |
| 5.1.4 | Scanner le QR code (mobile) | Page d'émargement s'ouvre | |

### 5.2 Signature apprenant
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 5.2.1 | Accéder à la page d'émargement | Page s'affiche | |
| 5.2.2 | Signer pour le matin | Zone signature fonctionne | |
| 5.2.3 | Signer pour l'après-midi | Zone signature fonctionne | |
| 5.2.4 | Valider la signature | Signature enregistrée | |
| 5.2.5 | Vérifier horodatage | Heure correcte enregistrée | |
| 5.2.6 | Vérifier impossibilité de re-signer | Signature verrouillée | |

### 5.3 Signature formateur
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 5.3.1 | Formateur accède à l'émargement | Page accessible | |
| 5.3.2 | Signer comme formateur | Signature enregistrée | |
| 5.3.3 | Voir résumé des présences | Tableau récapitulatif | |

### 5.4 Export et suivi
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 5.4.1 | Télécharger feuille signée PDF | PDF avec toutes signatures | |
| 5.4.2 | Voir historique des signatures | Historique complet | |
| 5.4.3 | Identifier absences | Absents marqués | |

---

## PARTIE 6 : SIGNATURE ÉLECTRONIQUE

### 6.1 Envoi de documents à signer
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 6.1.1 | Sélectionner document à faire signer | Document sélectionné | |
| 6.1.2 | Choisir le signataire | Signataire ajouté | |
| 6.1.3 | Configurer authentification (email/SMS) | Option configurée | |
| 6.1.4 | Envoyer demande de signature | Email envoyé au signataire | |
| 6.1.5 | Vérifier réception email | Email reçu avec lien | |

### 6.2 Processus de signature
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 6.2.1 | Ouvrir le lien de signature | Page de signature s'affiche | |
| 6.2.2 | Vérifier affichage du document | Document visible | |
| 6.2.3 | Recevoir code OTP (si configuré) | Code reçu par email/SMS | |
| 6.2.4 | Saisir le code de vérification | Code validé | |
| 6.2.5 | Cocher consentement | Checkbox cochée | |
| 6.2.6 | Signer (zone de signature) | Signature capturée | |
| 6.2.7 | Valider la signature | Document signé | |
| 6.2.8 | Télécharger document signé | PDF avec certificat | |

### 6.3 Suivi des signatures
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 6.3.1 | Voir liste des documents en attente | Liste affichée | |
| 6.3.2 | Voir statut de chaque document | Statuts corrects | |
| 6.3.3 | Relancer un signataire | Email de relance envoyé | |
| 6.3.4 | Annuler une demande | Demande annulée | |
| 6.3.5 | Télécharger certificat de signature | Certificat PDF généré | |

---

## PARTIE 7 : BASE DE DONNÉES (MES DONNÉES)

### 7.1 Apprenants
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 7.1.1 | Voir liste des apprenants | Liste affichée | |
| 7.1.2 | Créer nouvel apprenant | Formulaire s'ouvre | |
| 7.1.3 | Remplir informations (nom, email, etc.) | Données validées | |
| 7.1.4 | Renseigner situation handicap | Question obligatoire présente | |
| 7.1.5 | Sauvegarder l'apprenant | Apprenant créé | |
| 7.1.6 | Modifier un apprenant | Modifications sauvegardées | |
| 7.1.7 | Ajouter une note interne (IND 5) | Note ajoutée avec date | |
| 7.1.8 | Voir historique des notes | Historique affiché | |
| 7.1.9 | Rechercher un apprenant | Recherche fonctionne | |
| 7.1.10 | Exporter la liste | Export CSV/Excel | |
| 7.1.11 | Supprimer un apprenant | Suppression (avec confirmation) | |

### 7.2 Intervenants
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 7.2.1 | Voir liste des intervenants | Liste affichée | |
| 7.2.2 | Créer nouvel intervenant | Formulaire s'ouvre | |
| 7.2.3 | Remplir informations de base | Données sauvegardées | |
| 7.2.4 | Upload photo de profil | Photo affichée | |
| 7.2.5 | Upload CV (PDF) | CV stocké | |
| 7.2.6 | Ajouter diplôme | Diplôme enregistré | |
| 7.2.7 | Upload justificatif diplôme | Fichier stocké | |
| 7.2.8 | Renseigner numéro DA | Numéro sauvegardé | |
| 7.2.9 | Ajouter spécialités (tags) | Tags ajoutés | |
| 7.2.10 | Générer fiche mission (IND 17) | Document généré | |
| 7.2.11 | Faire signer la fiche mission | Processus signature lancé | |
| 7.2.12 | Voir interventions passées | Historique affiché | |

### 7.3 Entreprises
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 7.3.1 | Voir liste des entreprises | Liste affichée | |
| 7.3.2 | Créer nouvelle entreprise | Formulaire s'ouvre | |
| 7.3.3 | Renseigner raison sociale | Donnée sauvegardée | |
| 7.3.4 | Renseigner SIRET | Validation format | |
| 7.3.5 | Ajouter adresse complète | Adresse sauvegardée | |
| 7.3.6 | Ajouter contact principal | Contact créé | |
| 7.3.7 | Voir salariés de l'entreprise | Liste affichée | |
| 7.3.8 | Modifier une entreprise | Modifications sauvegardées | |

### 7.4 Lieux de formation
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 7.4.1 | Voir liste des lieux | Liste affichée | |
| 7.4.2 | Créer nouveau lieu | Formulaire s'ouvre | |
| 7.4.3 | Renseigner nom et adresse | Données sauvegardées | |
| 7.4.4 | Remplir checklist conformité (IND 17) | Checkboxes fonctionnent | |
| 7.4.5 | Cocher accessibilité handicap | Checkbox cochée | |
| 7.4.6 | Sauvegarder la checklist | Checklist sauvegardée | |
| 7.4.7 | Modifier un lieu | Modifications sauvegardées | |

### 7.5 Financeurs
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 7.5.1 | Voir liste des financeurs | Liste affichée (OPCOs) | |
| 7.5.2 | Créer nouveau financeur | Formulaire s'ouvre | |
| 7.5.3 | Sélectionner type (OPCO, CPF, etc.) | Type sélectionné | |
| 7.5.4 | Renseigner informations contact | Données sauvegardées | |
| 7.5.5 | Modifier un financeur | Modifications sauvegardées | |

---

## PARTIE 8 : ÉVALUATIONS

### 8.1 Test de positionnement
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 8.1.1 | Apprenant reçoit lien positionnement | Email reçu | |
| 8.1.2 | Ouvrir le test | Page test s'affiche | |
| 8.1.3 | Répondre aux questions | Questions défilent | |
| 8.1.4 | Soumettre le test | Test enregistré | |
| 8.1.5 | Voir le score | Score affiché | |
| 8.1.6 | Formateur voit les résultats | Résultats accessibles | |
| 8.1.7 | Si score < seuil → Module 0 proposé | Alerte générée (IND 10) | |

### 8.2 QCM par module
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 8.2.1 | Apprenant accède au QCM | QCM accessible | |
| 8.2.2 | Répondre aux questions | Réponses enregistrées | |
| 8.2.3 | Voir correction | Bonnes réponses affichées | |
| 8.2.4 | Voir score | Score calculé | |
| 8.2.5 | Formateur voit résultats | Résultats agrégés | |

### 8.3 Évaluation finale
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 8.3.1 | Apprenant accède à l'évaluation finale | Évaluation accessible | |
| 8.3.2 | Répondre à toutes les questions | Réponses enregistrées | |
| 8.3.3 | Soumettre l'évaluation | Évaluation enregistrée | |
| 8.3.4 | Voir résultat final | Score et statut réussite | |
| 8.3.5 | Si réussi → Certificat généré | Certificat disponible | |

### 8.4 Évaluation de satisfaction à chaud
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 8.4.1 | Email envoyé en fin de formation | Email reçu par apprenant | |
| 8.4.2 | Ouvrir le questionnaire | Page s'affiche | |
| 8.4.3 | Répondre aux questions (notes 0-10) | Notes enregistrées | |
| 8.4.4 | Soumettre le questionnaire | Réponses sauvegardées | |
| 8.4.5 | Voir taux de satisfaction calculé (IND 2) | Taux mis à jour | |

### 8.5 Évaluation de satisfaction à froid
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 8.5.1 | Email envoyé J+30 | Email reçu | |
| 8.5.2 | Répondre au questionnaire | Réponses enregistrées | |
| 8.5.3 | Questions sur application des acquis | Questions pertinentes | |

### 8.6 Évaluation intervenant
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 8.6.1 | Email envoyé au formateur après session | Email reçu | |
| 8.6.2 | Formateur remplit le questionnaire | Réponses enregistrées | |
| 8.6.3 | Questions sur organisation, stagiaires | Questions pertinentes | |

---

## PARTIE 9 : ESPACE APPRENANT

### 9.1 Connexion apprenant
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 9.1.1 | Recevoir email d'invitation | Email avec lien reçu | |
| 9.1.2 | Cliquer sur le lien | Page de connexion s'ouvre | |
| 9.1.3 | Recevoir code OTP par email | Code 6 chiffres reçu | |
| 9.1.4 | Saisir le code | Connexion réussie | |
| 9.1.5 | Accéder au dashboard | Dashboard apprenant affiché | |

### 9.2 Dashboard apprenant
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 9.2.1 | Voir message de bienvenue | Message personnalisé | |
| 9.2.2 | Voir "Ma formation" | Formation inscrite affichée | |
| 9.2.3 | Voir programme détaillé | Modules listés | |
| 9.2.4 | Voir planning des sessions | Dates et horaires | |
| 9.2.5 | Voir intervenants | Photo + bio affichées | |

### 9.3 Documents apprenant
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 9.3.1 | Accéder à "Mes documents" | Liste documents | |
| 9.3.2 | Télécharger convocation | PDF téléchargé | |
| 9.3.3 | Télécharger règlement intérieur | PDF téléchargé | |
| 9.3.4 | Télécharger CGV | PDF téléchargé | |
| 9.3.5 | Télécharger supports de cours | Supports disponibles | |
| 9.3.6 | Télécharger attestations | Attestations disponibles | |

### 9.4 Évaluations apprenant
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 9.4.1 | Accéder à "Mes évaluations" | Liste évaluations | |
| 9.4.2 | Voir évaluations à faire | Évaluations en attente | |
| 9.4.3 | Voir évaluations terminées | Résultats affichés | |
| 9.4.4 | Accéder au test de positionnement | Lien fonctionne | |

### 9.5 Émargements apprenant
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 9.5.1 | Accéder à "Mes émargements" | Liste émargements | |
| 9.5.2 | Voir signatures effectuées | Historique visible | |
| 9.5.3 | Signer si en attente | Signature possible | |

### 9.6 Profil apprenant
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 9.6.1 | Accéder à "Mon profil" | Profil affiché | |
| 9.6.2 | Modifier informations | Modifications sauvegardées | |
| 9.6.3 | Voir formations passées | Historique visible | |

---

## PARTIE 10 : ESPACE INTERVENANT

### 10.1 Connexion intervenant
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 10.1.1 | Recevoir email d'invitation | Email reçu | |
| 10.1.2 | Cliquer sur le lien | Page connexion s'ouvre | |
| 10.1.3 | Recevoir code OTP | Code reçu | |
| 10.1.4 | Se connecter | Dashboard intervenant | |

### 10.2 Dashboard intervenant
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 10.2.1 | Voir accueil personnalisé | Message bienvenue | |
| 10.2.2 | Voir prochaines sessions | Sessions listées | |
| 10.2.3 | Voir calendrier | Vue calendrier | |

### 10.3 Sessions intervenant
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 10.3.1 | Accéder à "Mes sessions" | Liste sessions | |
| 10.3.2 | Voir détails session | Informations complètes | |
| 10.3.3 | Voir liste apprenants | Apprenants de la session | |
| 10.3.4 | Accéder aux émargements | Feuilles disponibles | |
| 10.3.5 | Signer émargement formateur | Signature enregistrée | |

### 10.4 Programme et documents
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 10.4.1 | Voir programme formation | Programme détaillé | |
| 10.4.2 | Télécharger supports | Supports disponibles | |
| 10.4.3 | Voir fiche mission | Fiche accessible | |
| 10.4.4 | Signer fiche mission | Processus signature | |

### 10.5 Suivi pédagogique
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 10.5.1 | Accéder au suivi | Page suivi | |
| 10.5.2 | Voir résultats évaluations | Notes apprenants | |
| 10.5.3 | Ajouter commentaires | Commentaires sauvegardés | |

### 10.6 Profil intervenant
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 10.6.1 | Accéder à "Mon profil" | Profil affiché | |
| 10.6.2 | Modifier biographie | Modification sauvegardée | |
| 10.6.3 | Upload CV | CV uploadé | |
| 10.6.4 | Ajouter diplôme | Diplôme ajouté | |
| 10.6.5 | Modifier spécialités | Spécialités mises à jour | |

---

## PARTIE 11 : CATALOGUE PUBLIC ET PRÉ-INSCRIPTIONS

### 11.1 Catalogue public
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 11.1.1 | Accéder au catalogue (URL publique) | Catalogue s'affiche | |
| 11.1.2 | Voir liste des formations | Formations visibles listées | |
| 11.1.3 | Filtrer par catégorie | Filtre fonctionne | |
| 11.1.4 | Rechercher une formation | Recherche fonctionne | |
| 11.1.5 | Ouvrir fiche formation | Détails s'affichent | |

### 11.2 Fiche formation publique
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 11.2.1 | Voir objectifs pédagogiques | Objectifs affichés | |
| 11.2.2 | Voir programme détaillé | Programme affiché | |
| 11.2.3 | Voir prérequis | Prérequis affichés | |
| 11.2.4 | Voir modalités d'évaluation | Modalités affichées | |
| 11.2.5 | Voir accessibilité handicap | Info accessibilité | |
| 11.2.6 | Voir taux de satisfaction (IND 2) | Taux affiché | |
| 11.2.7 | Voir tarifs | Tarifs affichés | |
| 11.2.8 | Voir délai d'accès | Délai affiché | |
| 11.2.9 | Voir contact OF | Contact affiché | |
| 11.2.10 | Si certifiante → voir fiche RS | Lien vers RS | |

### 11.3 Pré-inscription
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 11.3.1 | Cliquer "Pré-inscription" | Formulaire s'ouvre | |
| 11.3.2 | Remplir objectifs professionnels | Champ rempli | |
| 11.3.3 | Remplir expérience préalable | Champ rempli | |
| 11.3.4 | Remplir attentes spécifiques | Champ rempli | |
| 11.3.5 | Remplir informations personnelles | Champs remplis | |
| 11.3.6 | Répondre question handicap (obligatoire) | Question présente | |
| 11.3.7 | Sélectionner mode de financement | Option sélectionnée | |
| 11.3.8 | Soumettre le formulaire | Pré-inscription enregistrée | |
| 11.3.9 | Email de confirmation reçu | Email reçu | |

### 11.4 Gestion pré-inscriptions (côté OF)
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 11.4.1 | Voir liste pré-inscriptions | Liste affichée | |
| 11.4.2 | Voir détails pré-inscription | Détails complets | |
| 11.4.3 | Changer statut (en cours, acceptée, refusée) | Statut mis à jour | |
| 11.4.4 | Convertir en apprenant | Apprenant créé | |
| 11.4.5 | Envoyer message au pré-inscrit | Message envoyé | |

---

## PARTIE 12 : CRM

### 12.1 Dashboard CRM
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 12.1.1 | Accéder au CRM | Dashboard s'affiche | |
| 12.1.2 | Voir métriques (CA potentiel, etc.) | Métriques affichées | |
| 12.1.3 | Voir graphiques | Graphiques visibles | |

### 12.2 Gestion des opportunités
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 12.2.1 | Voir pipeline (vue Kanban) | Pipeline affiché | |
| 12.2.2 | Créer nouvelle opportunité | Formulaire s'ouvre | |
| 12.2.3 | Renseigner client | Client lié | |
| 12.2.4 | Renseigner formation | Formation liée | |
| 12.2.5 | Définir montant | Montant sauvegardé | |
| 12.2.6 | Définir probabilité | Probabilité sauvegardée | |
| 12.2.7 | Sauvegarder | Opportunité créée | |
| 12.2.8 | Déplacer dans le pipeline (drag & drop) | Stage mis à jour | |
| 12.2.9 | Marquer comme gagnée | Statut mis à jour | |
| 12.2.10 | Marquer comme perdue | Statut mis à jour | |

### 12.3 Activités CRM
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 12.3.1 | Ajouter un appel | Activité créée | |
| 12.3.2 | Ajouter un email | Activité créée | |
| 12.3.3 | Ajouter une réunion | Activité créée | |
| 12.3.4 | Planifier une relance | Relance planifiée | |
| 12.3.5 | Voir historique activités | Historique affiché | |

---

## PARTIE 13 : AUTOMATISATIONS (MODULE 6)

### 13.1 Liste des workflows
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 13.1.1 | Accéder aux automatisations | Liste affichée | |
| 13.1.2 | Voir workflows actifs | Workflows listés | |
| 13.1.3 | Voir statistiques d'exécution | Stats affichées | |

### 13.2 Création de workflow
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 13.2.1 | Créer nouveau workflow | Builder s'ouvre | |
| 13.2.2 | Choisir un déclencheur | Déclencheur ajouté | |
| 13.2.3 | Configurer le déclencheur | Config sauvegardée | |
| 13.2.4 | Ajouter une action (email) | Action ajoutée | |
| 13.2.5 | Configurer le template email | Template configuré | |
| 13.2.6 | Ajouter une condition | Condition ajoutée | |
| 13.2.7 | Ajouter un délai | Délai configuré | |
| 13.2.8 | Sauvegarder le workflow | Workflow créé | |
| 13.2.9 | Activer le workflow | Workflow actif | |

### 13.3 Test des workflows prédéfinis
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 13.3.1 | Tester workflow pré-inscription | Email envoyé automatiquement | |
| 13.3.2 | Tester workflow J-7 | Rappel envoyé 7j avant | |
| 13.3.3 | Tester workflow fin session | Actions déclenchées | |
| 13.3.4 | Tester workflow J+30 (éval à froid) | Email envoyé à J+30 | |

### 13.4 Suivi des exécutions
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 13.4.1 | Voir historique d'exécution | Historique affiché | |
| 13.4.2 | Voir détails d'une exécution | Étapes détaillées | |
| 13.4.3 | Voir logs d'erreur | Logs accessibles | |

---

## PARTIE 14 : LMS ET PROGRESSION

### 14.1 Inscription LMS
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 14.1.1 | Inscrire apprenant à une formation | Inscription créée | |
| 14.1.2 | Apprenant accède à la formation | Contenu accessible | |

### 14.2 Progression
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 14.2.1 | Suivre un module | Module marqué en cours | |
| 14.2.2 | Compléter un module | Module marqué terminé | |
| 14.2.3 | Voir progression globale (%) | Pourcentage mis à jour | |
| 14.2.4 | Voir temps passé | Temps enregistré | |

### 14.3 Certificats
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 14.3.1 | Formation complétée à 100% | Statut "complété" | |
| 14.3.2 | Certificat généré | Certificat disponible | |
| 14.3.3 | Télécharger certificat | PDF téléchargé | |

---

## PARTIE 15 : CLASSE VIRTUELLE

### 15.1 Création salle virtuelle
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 15.1.1 | Créer nouvelle salle | Salle créée | |
| 15.1.2 | Configurer options (chat, enregistrement) | Options configurées | |
| 15.1.3 | Définir date et durée | Planification sauvegardée | |
| 15.1.4 | Générer lien de participation | Lien généré | |

### 15.2 Session de classe virtuelle
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 15.2.1 | Formateur ouvre la salle | Salle MiroTalk s'ouvre | |
| 15.2.2 | Apprenant rejoint avec le lien | Connexion réussie | |
| 15.2.3 | Audio/vidéo fonctionne | Communication OK | |
| 15.2.4 | Chat fonctionne | Messages échangés | |
| 15.2.5 | Partage d'écran | Partage fonctionne | |
| 15.2.6 | Fermer la session | Session terminée | |

---

## PARTIE 16 : OUTILS QUALIOPI

### 16.1 Veille réglementaire (IND 23-25)
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 16.1.1 | Accéder à la veille | Page veille s'affiche | |
| 16.1.2 | Voir veille légale | Articles listés | |
| 16.1.3 | Voir veille métiers | Articles listés | |
| 16.1.4 | Voir veille innovation | Articles listés | |
| 16.1.5 | Voir veille handicap | Articles listés | |
| 16.1.6 | Marquer article comme lu | Statut mis à jour | |
| 16.1.7 | Ajouter une source | Source ajoutée | |

### 16.2 Réclamations (IND 31)
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 16.2.1 | Accéder aux réclamations | Liste affichée | |
| 16.2.2 | Créer nouvelle réclamation | Formulaire s'ouvre | |
| 16.2.3 | Renseigner origine (email, téléphone) | Origine enregistrée | |
| 16.2.4 | Renseigner description | Description sauvegardée | |
| 16.2.5 | Sauvegarder | Réclamation créée | |
| 16.2.6 | Mettre à jour statut | Statut mis à jour | |
| 16.2.7 | Ajouter analyse | Analyse sauvegardée | |
| 16.2.8 | Ajouter actions correctives | Actions enregistrées | |
| 16.2.9 | Documenter retour client | Retour sauvegardé | |
| 16.2.10 | Lier à une amélioration | Lien créé | |

### 16.3 Améliorations (IND 32)
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 16.3.1 | Accéder aux améliorations | Liste affichée | |
| 16.3.2 | Créer nouvelle amélioration | Formulaire s'ouvre | |
| 16.3.3 | Définir origine (réclamation, évaluation) | Origine sélectionnée | |
| 16.3.4 | Définir responsable | Responsable assigné | |
| 16.3.5 | Définir deadline | Date sauvegardée | |
| 16.3.6 | Mettre à jour statut | Statut mis à jour | |
| 16.3.7 | Documenter résultat | Résultat sauvegardé | |
| 16.3.8 | Voir plan d'amélioration | Plan affiché | |

---

## PARTIE 17 : AGENT QUALIOPI IA (MODULE 8)

### 17.1 Dashboard Qualiopi
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 17.1.1 | Accéder au dashboard Qualiopi | Dashboard s'affiche | |
| 17.1.2 | Voir score de conformité global | Score affiché (%) | |
| 17.1.3 | Voir conformité par critère | 7 critères affichés | |
| 17.1.4 | Voir alertes prioritaires | Alertes listées | |
| 17.1.5 | Voir actions correctives | Actions listées | |

### 17.2 Indicateurs Qualiopi
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 17.2.1 | Voir liste des 32 indicateurs | Indicateurs listés | |
| 17.2.2 | Cliquer sur un indicateur | Détails s'affichent | |
| 17.2.3 | Voir exigence de l'indicateur | Exigence affichée | |
| 17.2.4 | Voir preuves fournies | Preuves listées | |
| 17.2.5 | Voir preuves manquantes | Manques identifiés | |
| 17.2.6 | Ajouter une preuve | Preuve uploadée | |

### 17.3 Agent IA Qualiopi
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 17.3.1 | Accéder au chat Agent | Interface chat s'ouvre | |
| 17.3.2 | Poser question sur indicateur | Réponse pertinente | |
| 17.3.3 | Demander les preuves pour IND X | Preuves suggérées | |
| 17.3.4 | Demander conseils d'amélioration | Conseils donnés | |
| 17.3.5 | Demander génération de rapport | Rapport généré | |

### 17.4 Préparation audit
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 17.4.1 | Accéder à préparation audit | Page audit s'affiche | |
| 17.4.2 | Lancer simulation d'audit | Simulation démarre | |
| 17.4.3 | Voir résultats simulation | Résultats affichés | |
| 17.4.4 | Exporter dossier d'audit | ZIP généré | |

---

## PARTIE 18 : NOTIFICATIONS ET EMAILS

### 18.1 Notifications internes
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 18.1.1 | Recevoir notification (action dans l'app) | Notification affichée | |
| 18.1.2 | Cliquer sur notification | Redirection appropriée | |
| 18.1.3 | Marquer comme lue | Notification marquée | |
| 18.1.4 | Voir historique | Historique affiché | |

### 18.2 Emails transactionnels
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 18.2.1 | Email inscription reçu | Email reçu, formaté | |
| 18.2.2 | Email invitation apprenant | Email reçu avec lien | |
| 18.2.3 | Email convocation | Email reçu avec détails | |
| 18.2.4 | Email rappel J-7 | Email reçu | |
| 18.2.5 | Email signature | Email reçu avec lien | |
| 18.2.6 | Email évaluation satisfaction | Email reçu avec lien | |
| 18.2.7 | Vérifier branding emails | Logo et couleurs OF | |
| 18.2.8 | Vérifier liens dans emails | Liens fonctionnels | |

---

## PARTIE 19 : EXPORTS ET RAPPORTS

### 19.1 Exports de données
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 19.1.1 | Exporter liste apprenants | CSV/Excel généré | |
| 19.1.2 | Exporter liste formations | Export généré | |
| 19.1.3 | Exporter résultats évaluations | Export généré | |
| 19.1.4 | Exporter statistiques satisfaction | Export généré | |

### 19.2 Rapports PDF
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 19.2.1 | Générer rapport de session | PDF complet | |
| 19.2.2 | Générer bilan pédagogique | PDF généré | |
| 19.2.3 | Vérifier mise en forme PDF | Mise en forme correcte | |
| 19.2.4 | Vérifier données dans PDF | Données exactes | |

---

## PARTIE 20 : TESTS DE COHÉRENCE

### 20.1 Mise à jour automatique catalogue
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 20.1.1 | Créer formation et la publier | Formation visible catalogue | |
| 20.1.2 | Modifier une formation publiée | Catalogue mis à jour | |
| 20.1.3 | Dépublier une formation | Formation retirée catalogue | |
| 20.1.4 | Vérifier taux satisfaction affiché | Taux correct et à jour | |

### 20.2 Cohérence des données
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 20.2.1 | Créer apprenant → visible partout | Apprenant dans listes | |
| 20.2.2 | Modifier apprenant → propagation | Modifs partout | |
| 20.2.3 | Supprimer session → impact participants | Gestion correcte | |
| 20.2.4 | Modifier formation → impact sessions | Mises à jour propagées | |

### 20.3 Calculs automatiques
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 20.3.1 | Taux satisfaction = moyenne notes | Calcul correct | |
| 20.3.2 | Progression LMS = modules complétés | Pourcentage exact | |
| 20.3.3 | Score conformité Qualiopi | Calcul cohérent | |

---

## PARTIE 21 : TESTS TECHNIQUES

### 21.1 Performance
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 21.1.1 | Temps de chargement page d'accueil | < 3 secondes | |
| 21.1.2 | Temps génération IA fiche péda | < 60 secondes | |
| 21.1.3 | Temps génération PDF | < 10 secondes | |
| 21.1.4 | Temps génération slides | < 120 secondes | |

### 21.2 Responsive
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 21.2.1 | Navigation mobile | Menu fonctionne | |
| 21.2.2 | Formulaires mobile | Saisie possible | |
| 21.2.3 | Signature mobile | Signature possible | |
| 21.2.4 | Dashboard mobile | Lisible et utilisable | |

### 21.3 Navigateurs
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| 21.3.1 | Chrome | Fonctionne | |
| 21.3.2 | Firefox | Fonctionne | |
| 21.3.3 | Safari | Fonctionne | |
| 21.3.4 | Edge | Fonctionne | |

---

## SYNTHÈSE DES TESTS

### Récapitulatif par partie

| Partie | Total tests | OK | KO | Partiel |
|--------|-------------|----|----|---------|
| 1. Authentification | | | | |
| 2. Paramètres organisation | | | | |
| 3. Création formations | | | | |
| 4. Gestion sessions | | | | |
| 5. Émargement | | | | |
| 6. Signature électronique | | | | |
| 7. Base de données | | | | |
| 8. Évaluations | | | | |
| 9. Espace apprenant | | | | |
| 10. Espace intervenant | | | | |
| 11. Catalogue public | | | | |
| 12. CRM | | | | |
| 13. Automatisations | | | | |
| 14. LMS | | | | |
| 15. Classe virtuelle | | | | |
| 16. Outils Qualiopi | | | | |
| 17. Agent IA Qualiopi | | | | |
| 18. Notifications/emails | | | | |
| 19. Exports/rapports | | | | |
| 20. Tests cohérence | | | | |
| 21. Tests techniques | | | | |
| **TOTAL** | | | | |

### Liste des bugs identifiés

| # | Partie | Test | Description bug | Priorité | Statut |
|---|--------|------|-----------------|----------|--------|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

### Améliorations suggérées

| # | Partie | Suggestion |
|---|--------|------------|
| 1 | | |
| 2 | | |
| 3 | | |

---

## VALIDATION FINALE

- [ ] Tous les tests critiques sont OK
- [ ] Bugs bloquants corrigés
- [ ] Parcours utilisateur fluide
- [ ] Emails reçus et formatés correctement
- [ ] PDFs générés correctement
- [ ] Performance acceptable
- [ ] Mobile utilisable

**Date de validation finale** : _______________

**Testeur** : _______________

**Signature** : _______________

---

*Document créé le 30/12/2025*
*Version : 1.0*
