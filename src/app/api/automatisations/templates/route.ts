// ===========================================
// API: TEMPLATES DE WORKFLOWS
// GET /api/automatisations/templates - Liste des templates
// POST /api/automatisations/templates - Créer depuis un template
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { WorkflowTemplate } from "@/types/workflow";

// ===========================================
// TEMPLATES PRÉ-DÉFINIS
// ===========================================

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // Template 1: Parcours inscription complet
  {
    id: "parcours-inscription",
    nom: "Parcours inscription complet",
    description: "Workflow automatique lors d'une nouvelle pré-inscription : envoi email de confirmation, création de l'apprenant, notification à l'équipe.",
    categorie: "INSCRIPTION",
    icone: "UserPlus",
    triggerType: "PRE_INSCRIPTION",
    etapes: [
      {
        type: "ENVOYER_EMAIL",
        nom: "Email de confirmation",
        description: "Envoi d'un email de confirmation au prospect",
        config: {
          destinataire: "apprenant",
          sujet: "Confirmation de votre pré-inscription - {{formation.titre}}",
          contenu: `
            <h2>Bonjour {{apprenant.prenom}},</h2>
            <p>Nous avons bien reçu votre demande de pré-inscription pour la formation <strong>{{formation.titre}}</strong>.</p>
            <p>Notre équipe va étudier votre dossier et reviendra vers vous dans les plus brefs délais.</p>
            <p>Cordialement,<br/>L'équipe {{organisation.nom}}</p>
          `,
        },
        ordre: 0,
        positionX: 250,
        positionY: 100,
      },
      {
        type: "CREER_APPRENANT",
        nom: "Créer l'apprenant",
        description: "Création automatique de la fiche apprenant",
        config: {
          entite: "apprenant",
          donnees: {},
        },
        ordre: 1,
        positionX: 250,
        positionY: 200,
      },
      {
        type: "NOTIFIER_EQUIPE",
        nom: "Notifier l'équipe",
        description: "Notification à l'équipe de la nouvelle pré-inscription",
        config: {
          titre: "Nouvelle pré-inscription",
          message: "{{apprenant.prenom}} {{apprenant.nom}} a fait une pré-inscription pour {{formation.titre}}",
          priorite: "normale",
        },
        ordre: 2,
        positionX: 250,
        positionY: 300,
      },
    ],
    tags: ["inscription", "email", "notification"],
    isPopular: true,
  },

  // Template 2: Rappels J-7 et J-1
  {
    id: "rappels-session",
    nom: "Rappels session (J-7 et J-1)",
    description: "Envoi automatique de rappels avec convocation 7 jours et 1 jour avant le début de la session.",
    categorie: "SESSION",
    icone: "Calendar",
    triggerType: "SESSION_J_MOINS_7",
    etapes: [
      {
        type: "ENVOYER_EMAIL",
        nom: "Rappel J-7",
        description: "Email de rappel 7 jours avant",
        config: {
          destinataire: "apprenant",
          sujet: "Rappel : Votre formation {{formation.titre}} débute dans 7 jours",
          contenu: `
            <h2>Bonjour {{apprenant.prenom}},</h2>
            <p>Votre formation <strong>{{formation.titre}}</strong> débute dans 7 jours.</p>
            <p><strong>Date :</strong> {{session.dateDebut}}</p>
            <p><strong>Lieu :</strong> {{session.lieu}}</p>
            <p>Nous vous invitons à consulter votre espace apprenant pour :</p>
            <ul>
              <li>Consulter le programme de formation</li>
              <li>Lire le règlement intérieur</li>
              <li>Prendre connaissance des CGV</li>
            </ul>
            <p>À très bientôt !</p>
          `,
        },
        ordre: 0,
        positionX: 250,
        positionY: 100,
      },
      {
        type: "GENERER_DOCUMENT",
        nom: "Générer convocation",
        description: "Génération de la convocation",
        config: {
          typeDocument: "CONVOCATION",
          envoyerParEmail: true,
          destinataireEmail: "apprenant",
        },
        ordre: 1,
        positionX: 250,
        positionY: 200,
      },
    ],
    tags: ["rappel", "session", "convocation"],
    isPopular: true,
  },

  // Template 3: Enquêtes satisfaction automatiques
  {
    id: "enquetes-satisfaction",
    nom: "Enquêtes satisfaction automatiques",
    description: "Envoi automatique des enquêtes de satisfaction à chaud (fin de session) et à froid (J+30).",
    categorie: "EVALUATION",
    icone: "ClipboardCheck",
    triggerType: "SESSION_FIN",
    etapes: [
      {
        type: "DELAI",
        nom: "Attendre 1 heure",
        description: "Délai avant envoi évaluation à chaud",
        config: {
          duree: 1,
          unite: "heures",
        },
        ordre: 0,
        positionX: 250,
        positionY: 100,
      },
      {
        type: "ENVOYER_EMAIL",
        nom: "Email éval à chaud",
        description: "Envoi du questionnaire de satisfaction à chaud",
        config: {
          destinataire: "apprenant",
          sujet: "Votre avis nous intéresse - {{formation.titre}}",
          contenu: `
            <h2>Bonjour {{apprenant.prenom}},</h2>
            <p>Votre formation <strong>{{formation.titre}}</strong> vient de se terminer.</p>
            <p>Votre avis est très important pour nous. Merci de prendre quelques minutes pour répondre à notre questionnaire de satisfaction.</p>
            <p><a href="{{lienEspaceApprenant}}/evaluations">Accéder au questionnaire</a></p>
            <p>Merci pour votre participation !</p>
          `,
        },
        ordre: 1,
        positionX: 250,
        positionY: 200,
      },
      {
        type: "DELAI",
        nom: "Attendre 30 jours",
        description: "Délai avant envoi évaluation à froid",
        config: {
          duree: 30,
          unite: "jours",
        },
        ordre: 2,
        positionX: 250,
        positionY: 300,
      },
      {
        type: "ENVOYER_EMAIL",
        nom: "Email éval à froid",
        description: "Envoi du questionnaire d'évaluation à froid",
        config: {
          destinataire: "apprenant",
          sujet: "Évaluation à froid - {{formation.titre}}",
          contenu: `
            <h2>Bonjour {{apprenant.prenom}},</h2>
            <p>Il y a 30 jours, vous avez suivi la formation <strong>{{formation.titre}}</strong>.</p>
            <p>Nous souhaitons savoir si cette formation vous a été utile dans votre quotidien professionnel.</p>
            <p><a href="{{lienEspaceApprenant}}/evaluations">Répondre à l'évaluation à froid</a></p>
            <p>Merci pour votre retour !</p>
          `,
        },
        ordre: 3,
        positionX: 250,
        positionY: 400,
      },
    ],
    tags: ["evaluation", "satisfaction", "qualiopi"],
    isPopular: true,
  },

  // Template 4: Relances signatures
  {
    id: "relances-signatures",
    nom: "Relances signatures",
    description: "Relances automatiques pour les documents non signés après 3 jours.",
    categorie: "DOCUMENT",
    icone: "FileX",
    triggerType: "DOCUMENT_NON_SIGNE",
    triggerConfig: {
      delaiJours: 3,
    },
    etapes: [
      {
        type: "ENVOYER_EMAIL",
        nom: "Relance 1",
        description: "Première relance par email",
        config: {
          destinataire: "apprenant",
          sujet: "Rappel : Document en attente de signature",
          contenu: `
            <h2>Bonjour {{apprenant.prenom}},</h2>
            <p>Un document relatif à votre formation <strong>{{formation.titre}}</strong> est en attente de votre signature.</p>
            <p>Merci de vous connecter à votre espace apprenant pour le signer.</p>
            <p><a href="{{lienEspaceApprenant}}/documents">Accéder aux documents</a></p>
          `,
        },
        ordre: 0,
        positionX: 250,
        positionY: 100,
      },
      {
        type: "DELAI",
        nom: "Attendre 3 jours",
        description: "Attente avant seconde relance",
        config: {
          duree: 3,
          unite: "jours",
        },
        ordre: 1,
        positionX: 250,
        positionY: 200,
      },
      {
        type: "ENVOYER_EMAIL",
        nom: "Relance 2",
        description: "Seconde relance par email",
        config: {
          destinataire: "apprenant",
          sujet: "URGENT : Document en attente de signature",
          contenu: `
            <h2>Bonjour {{apprenant.prenom}},</h2>
            <p><strong>Rappel urgent :</strong> Un document relatif à votre formation est toujours en attente de signature.</p>
            <p>Sans votre signature, nous ne pourrons pas finaliser votre inscription.</p>
            <p><a href="{{lienEspaceApprenant}}/documents">Signer le document maintenant</a></p>
          `,
        },
        ordre: 2,
        positionX: 250,
        positionY: 300,
      },
      {
        type: "NOTIFIER_EQUIPE",
        nom: "Alerter l'équipe",
        description: "Notification si toujours pas signé",
        config: {
          titre: "Document non signé",
          message: "{{apprenant.prenom}} {{apprenant.nom}} n'a toujours pas signé le document après 2 relances",
          priorite: "haute",
        },
        ordre: 3,
        positionX: 250,
        positionY: 400,
      },
    ],
    tags: ["signature", "relance", "document"],
    isPopular: true,
  },

  // Template 5: Adaptabilité (score faible)
  {
    id: "adaptabilite",
    nom: "Adaptabilité parcours",
    description: "Déclenchement automatique lors d'un score de positionnement faible (<20%) pour proposer un accompagnement adapté.",
    categorie: "EVALUATION",
    icone: "AlertTriangle",
    triggerType: "SCORE_INFERIEUR_SEUIL",
    triggerConfig: {
      seuil: 20,
      typeEvaluation: "POSITIONNEMENT",
    },
    etapes: [
      {
        type: "GENERER_DOCUMENT",
        nom: "Générer fiche adaptabilité",
        description: "Génération de la fiche d'adaptabilité personnalisée",
        config: {
          typeDocument: "AUTRE",
          envoyerParEmail: false,
        },
        ordre: 0,
        positionX: 250,
        positionY: 100,
      },
      {
        type: "ENVOYER_EMAIL",
        nom: "Email apprenant",
        description: "Information à l'apprenant sur l'accompagnement proposé",
        config: {
          destinataire: "apprenant",
          sujet: "Accompagnement personnalisé - {{formation.titre}}",
          contenu: `
            <h2>Bonjour {{apprenant.prenom}},</h2>
            <p>Suite à votre test de positionnement, nous avons identifié que certains prérequis nécessitent un renforcement.</p>
            <p>Ne vous inquiétez pas ! Nous vous proposons un accompagnement personnalisé avec un module préparatoire adapté à votre niveau.</p>
            <p>Notre équipe vous contactera prochainement pour en discuter.</p>
            <p>Cordialement,<br/>L'équipe {{organisation.nom}}</p>
          `,
        },
        ordre: 1,
        positionX: 250,
        positionY: 200,
      },
      {
        type: "NOTIFIER_EQUIPE",
        nom: "Alerter l'équipe pédagogique",
        description: "Notification pour mise en place du module 0",
        config: {
          titre: "Score de positionnement faible",
          message: "{{apprenant.prenom}} {{apprenant.nom}} a obtenu un score faible au positionnement ({{evaluation.score}}%). Adaptabilité requise.",
          priorite: "haute",
          roles: ["ORG_ADMIN", "FORMATEUR"],
        },
        ordre: 2,
        positionX: 250,
        positionY: 300,
      },
      {
        type: "CREER_AMELIORATION",
        nom: "Créer action amélioration",
        description: "Traçabilité pour Qualiopi IND 10",
        config: {
          entite: "amelioration",
          donnees: {
            titre: "Mise en place parcours adapté",
            description: "Suite au positionnement de {{apprenant.prenom}} {{apprenant.nom}}, mise en place d'un accompagnement personnalisé.",
            origine: "EVALUATION",
            priorite: "HAUTE",
          },
        },
        ordre: 3,
        positionX: 250,
        positionY: 400,
      },
    ],
    tags: ["adaptabilite", "qualiopi", "positionnement"],
    isPopular: true,
  },

  // Template 6: Traitement réclamation
  {
    id: "traitement-reclamation",
    nom: "Traitement réclamation",
    description: "Workflow automatique lors de la réception d'une réclamation : accusé réception, notification équipe.",
    categorie: "QUALITE",
    icone: "MessageSquareWarning",
    triggerType: "RECLAMATION_RECUE",
    etapes: [
      {
        type: "ENVOYER_EMAIL",
        nom: "Accusé de réception",
        description: "Email d'accusé de réception au réclamant",
        config: {
          destinataire: "apprenant",
          sujet: "Accusé de réception de votre réclamation",
          contenu: `
            <h2>Bonjour,</h2>
            <p>Nous avons bien reçu votre réclamation et nous vous remercions de nous avoir fait part de votre insatisfaction.</p>
            <p>Votre demande a été enregistrée et sera traitée dans les plus brefs délais par notre équipe qualité.</p>
            <p>Nous nous engageons à vous apporter une réponse sous 5 jours ouvrés.</p>
            <p>Cordialement,<br/>L'équipe {{organisation.nom}}</p>
          `,
        },
        ordre: 0,
        positionX: 250,
        positionY: 100,
      },
      {
        type: "NOTIFIER_EQUIPE",
        nom: "Alerter l'équipe qualité",
        description: "Notification urgente à l'équipe",
        config: {
          titre: "Nouvelle réclamation",
          message: "Une nouvelle réclamation a été reçue. Merci de la traiter sous 5 jours.",
          priorite: "urgente",
          roles: ["ORG_ADMIN"],
        },
        ordre: 1,
        positionX: 250,
        positionY: 200,
      },
      {
        type: "CREER_TACHE",
        nom: "Créer tâche de suivi",
        description: "Création d'une tâche de suivi",
        config: {
          entite: "tache",
          donnees: {
            titre: "Traiter réclamation",
            description: "Réclamation à traiter sous 5 jours ouvrés",
          },
        },
        ordre: 2,
        positionX: 250,
        positionY: 300,
      },
    ],
    tags: ["reclamation", "qualiopi", "qualite"],
    isPopular: true,
  },
];

// ===========================================
// SCHÉMA DE VALIDATION
// ===========================================

const createFromTemplateSchema = z.object({
  templateId: z.string(),
  nom: z.string().optional(),
  actif: z.boolean().optional().default(false),
});

// ===========================================
// GET - Liste des templates
// ===========================================

export async function GET(request: NextRequest) {
  try {
    // Authentification
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Filtrer par catégorie si demandé
    const searchParams = request.nextUrl.searchParams;
    const categorie = searchParams.get("categorie");

    let templates = WORKFLOW_TEMPLATES;

    if (categorie) {
      templates = templates.filter((t) => t.categorie === categorie);
    }

    // Grouper par catégorie
    const templatesByCategory = templates.reduce((acc, template) => {
      if (!acc[template.categorie]) {
        acc[template.categorie] = [];
      }
      acc[template.categorie].push(template);
      return acc;
    }, {} as Record<string, WorkflowTemplate[]>);

    return NextResponse.json({
      templates,
      templatesByCategory,
      categories: Object.keys(templatesByCategory),
    });

  } catch (error) {
    console.error("[API] GET /api/automatisations/templates error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// ===========================================
// POST - Créer un workflow depuis un template
// ===========================================

export async function POST(request: NextRequest) {
  try {
    // Authentification
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer l'utilisateur avec son organisation
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Parser les données
    const body = await request.json();
    const data = createFromTemplateSchema.parse(body);

    // Trouver le template
    const template = WORKFLOW_TEMPLATES.find((t) => t.id === data.templateId);

    if (!template) {
      return NextResponse.json(
        { error: "Template non trouvé" },
        { status: 404 }
      );
    }

    // Créer le workflow depuis le template
    const workflow = await prisma.workflow.create({
      data: {
        organizationId: dbUser.organizationId,
        nom: data.nom || template.nom,
        description: template.description,
        icone: template.icone,
        categorie: template.categorie as any,
        triggerType: template.triggerType as any,
        triggerConfig: template.triggerConfig as Prisma.InputJsonValue | undefined,
        actif: data.actif,
        templateSource: template.id,
        etapes: {
          create: template.etapes.map((etape) => ({
            type: etape.type as any,
            nom: etape.nom,
            description: etape.description,
            config: etape.config as Prisma.InputJsonValue,
            ordre: etape.ordre,
            positionX: etape.positionX,
            positionY: etape.positionY,
            conditions: etape.conditions as Prisma.InputJsonValue | undefined,
          })),
        },
      },
      include: {
        etapes: {
          orderBy: { ordre: "asc" },
        },
      },
    });

    // Log
    await prisma.workflowLog.create({
      data: {
        workflowId: workflow.id,
        niveau: "info",
        message: `Workflow créé depuis le template "${template.nom}"`,
      },
    });

    return NextResponse.json(workflow, { status: 201 });

  } catch (error) {
    console.error("[API] POST /api/automatisations/templates error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    // Retourner l'erreur détaillée pour le debug
    const errorMessage = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
