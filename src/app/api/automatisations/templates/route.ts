// ===========================================
// API: TEMPLATES DE WORKFLOWS
// GET /api/automatisations/templates - Liste des templates
// POST /api/automatisations/templates - Créer depuis un template
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";
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
            <p>Votre avis est très important pour nous.</p>
          `,
        },
        ordre: 1,
        positionX: 250,
        positionY: 200,
      },
    ],
    tags: ["evaluation", "satisfaction", "qualiopi"],
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
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé" },
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
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    if (!user.organizationId) {
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
        organizationId: user.organizationId,
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
