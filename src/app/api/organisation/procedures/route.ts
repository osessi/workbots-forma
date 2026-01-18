// ===========================================
// API: PROCÉDURES QUALITÉ (Qualiopi IND 26)
// GET /api/organisation/procedures - Liste des procédures
// POST /api/organisation/procedures - Créer une procédure
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { ProcedureType } from "@prisma/client";

// Liste des procédures obligatoires Qualiopi
const PROCEDURES_OBLIGATOIRES = [
  {
    type: "ACCUEIL_INFORMATION" as ProcedureType,
    nom: "Procédure d'accueil et d'information du public",
    description: "Processus d'accueil et d'information des bénéficiaires potentiels",
  },
  {
    type: "POSITIONNEMENT" as ProcedureType,
    nom: "Procédure de positionnement",
    description: "Évaluation des acquis et besoins du bénéficiaire",
  },
  {
    type: "ADAPTATION_PARCOURS" as ProcedureType,
    nom: "Procédure d'adaptation du parcours",
    description: "Personnalisation du parcours de formation",
  },
  {
    type: "EVALUATION" as ProcedureType,
    nom: "Procédure d'évaluation",
    description: "Évaluation des acquis en cours et fin de formation",
  },
  {
    type: "ACCOMPAGNEMENT_HANDICAP" as ProcedureType,
    nom: "Procédure d'accompagnement des personnes en situation de handicap",
    description: "Référent handicap et modalités d'adaptation",
  },
  {
    type: "RECLAMATIONS" as ProcedureType,
    nom: "Procédure de traitement des réclamations",
    description: "Gestion des difficultés et réclamations",
  },
  {
    type: "AMELIORATION_CONTINUE" as ProcedureType,
    nom: "Procédure d'amélioration continue",
    description: "Analyse et amélioration des prestations",
  },
];

// ===========================================
// GET - Liste des procédures
// ===========================================

export async function GET() {
  try {
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const procedures = await prisma.procedure.findMany({
      where: { organizationId: user.organizationId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
        versions: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Identifier les procédures manquantes
    const typesExistants = procedures.map((p) => p.type);
    const proceduresManquantes = PROCEDURES_OBLIGATOIRES.filter(
      (po) => !typesExistants.includes(po.type)
    );

    return NextResponse.json({
      procedures,
      proceduresObligatoires: PROCEDURES_OBLIGATOIRES,
      proceduresManquantes,
      stats: {
        total: procedures.length,
        publiees: procedures.filter((p) => p.isPublished).length,
        obligatoiresCreees: PROCEDURES_OBLIGATOIRES.length - proceduresManquantes.length,
        obligatoiresTotal: PROCEDURES_OBLIGATOIRES.length,
      },
    });
  } catch (error) {
    console.error("[API] GET /api/organisation/procedures error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// POST - Créer une procédure
// ===========================================

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { type, nom, description, content, templateId } = body;

    if (!type || !nom) {
      return NextResponse.json(
        { error: "Type et nom sont requis" },
        { status: 400 }
      );
    }

    // Vérifier si une procédure de ce type existe déjà (sauf PERSONNALISEE)
    if (type !== "PERSONNALISEE") {
      const existing = await prisma.procedure.findUnique({
        where: {
          organizationId_type: {
            organizationId: user.organizationId,
            type,
          },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Une procédure de ce type existe déjà" },
          { status: 409 }
        );
      }
    }

    // Vérifier le template s'il est fourni
    if (templateId) {
      const template = await prisma.template.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        return NextResponse.json(
          { error: "Template non trouvé" },
          { status: 404 }
        );
      }
    }

    const procedure = await prisma.procedure.create({
      data: {
        organizationId: user.organizationId,
        type,
        nom,
        description,
        content: content || {},
        templateId,
        lastModifiedBy: user.id,
      },
    });

    return NextResponse.json(procedure, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/organisation/procedures error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
