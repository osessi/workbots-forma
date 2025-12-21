// ===========================================
// API GENERATION PAR LOT DE DOCUMENTS
// ===========================================
// Génère tous les documents d'une formation en une seule fois

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DocumentType } from "@prisma/client";

// Types de documents disponibles
const DOCUMENT_TYPES: { type: DocumentType; label: string; description: string }[] = [
  { type: "CONVENTION", label: "Convention de formation", description: "Document contractuel principal" },
  { type: "CONVOCATION", label: "Convocation", description: "Pour chaque participant" },
  { type: "ATTESTATION_PRESENCE", label: "Attestation de présence", description: "Pour chaque participant" },
  { type: "ATTESTATION_FIN", label: "Attestation de fin de formation", description: "Pour chaque participant" },
  { type: "FICHE_PEDAGOGIQUE", label: "Fiche pédagogique", description: "Programme détaillé" },
  { type: "EVALUATION_CHAUD", label: "Questionnaire d'évaluation", description: "Evaluation de la formation" },
  { type: "REGLEMENT_INTERIEUR", label: "Règlement intérieur", description: "Règles de la formation" },
  { type: "CERTIFICAT", label: "Certificat de réalisation", description: "Preuve de réalisation" },
];

// POST - Generer plusieurs documents
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Recuperer la formation avec toutes les donnees necessaires
    const formation = await prisma.formation.findFirst({
      where: {
        id,
        OR: [
          { userId: dbUser.id },
          ...(dbUser.organizationId ? [{ organizationId: dbUser.organizationId }] : []),
        ],
      },
      include: {
        user: true,
        organization: true,
        modules: { orderBy: { ordre: "asc" } },
        sessions: {
          include: {
            participants: true,
            formateur: true,
          },
        },
      },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
    }

    const body = await req.json();
    const { documentTypes, sessionId, participantIds } = body as {
      documentTypes: DocumentType[];
      sessionId?: string;
      participantIds?: string[];
    };

    if (!documentTypes || documentTypes.length === 0) {
      return NextResponse.json(
        { error: "Aucun type de document spécifié" },
        { status: 400 }
      );
    }

    // Filtrer la session si specifiee
    const sessions = sessionId
      ? formation.sessions.filter((s) => s.id === sessionId)
      : formation.sessions;

    if (sessions.length === 0) {
      return NextResponse.json(
        { error: "Aucune session trouvée" },
        { status: 400 }
      );
    }

    // Resultats de generation
    const results: {
      type: DocumentType;
      success: boolean;
      documentId?: string;
      participantId?: string;
      participantName?: string;
      error?: string;
    }[] = [];

    // Recuperer les templates pour chaque type de document
    const templates = await prisma.template.findMany({
      where: {
        documentType: { in: documentTypes },
        isActive: true,
        OR: [
          { isSystem: true },
          ...(dbUser.organizationId ? [{ organizationId: dbUser.organizationId }] : []),
        ],
      },
    });

    // Creer un map des templates par type
    const templateMap = new Map(
      templates.map((t) => [t.documentType, t])
    );

    // Generer les documents
    for (const docType of documentTypes) {
      const template = templateMap.get(docType);

      if (!template) {
        results.push({
          type: docType,
          success: false,
          error: "Template non trouvé",
        });
        continue;
      }

      // Documents qui necessitent un par participant
      const perParticipantTypes: DocumentType[] = [
        "CONVOCATION",
        "ATTESTATION_PRESENCE",
        "ATTESTATION_FIN",
        "CERTIFICAT",
      ];

      if (perParticipantTypes.includes(docType)) {
        // Generer un document par participant
        for (const session of sessions) {
          const participants = participantIds
            ? session.participants.filter((p) => participantIds.includes(p.id))
            : session.participants;

          for (const participant of participants) {
            try {
              // Creer le document
              const document = await prisma.document.create({
                data: {
                  titre: `${getDocumentLabel(docType)} - ${participant.firstName} ${participant.lastName}`,
                  type: docType,
                  formationId: formation.id,
                  templateId: template.id,
                  content: template.content ?? undefined,
                },
              });

              results.push({
                type: docType,
                success: true,
                documentId: document.id,
                participantId: participant.id,
                participantName: `${participant.firstName} ${participant.lastName}`,
              });
            } catch (err) {
              results.push({
                type: docType,
                success: false,
                participantId: participant.id,
                participantName: `${participant.firstName} ${participant.lastName}`,
                error: err instanceof Error ? err.message : "Erreur inconnue",
              });
            }
          }
        }
      } else {
        // Document unique pour la formation
        try {
          const document = await prisma.document.create({
            data: {
              titre: `${getDocumentLabel(docType)} - ${formation.titre}`,
              type: docType,
              formationId: formation.id,
              templateId: template.id,
              content: template.content ?? undefined,
            },
          });

          results.push({
            type: docType,
            success: true,
            documentId: document.id,
          });
        } catch (err) {
          results.push({
            type: docType,
            success: false,
            error: err instanceof Error ? err.message : "Erreur inconnue",
          });
        }
      }
    }

    // Compter les succes et echecs
    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: errorCount === 0,
      message: `${successCount} document(s) généré(s)${errorCount > 0 ? `, ${errorCount} erreur(s)` : ""}`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error("Erreur génération par lot:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération des documents" },
      { status: 500 }
    );
  }
}

// GET - Obtenir les types de documents disponibles et leur statut
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Recuperer la formation
    const formation = await prisma.formation.findFirst({
      where: {
        id,
        OR: [
          { userId: dbUser.id },
          ...(dbUser.organizationId ? [{ organizationId: dbUser.organizationId }] : []),
        ],
      },
      include: {
        sessions: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
    }

    // Compter les documents deja generes
    const existingDocs = await prisma.document.groupBy({
      by: ["type"],
      where: { formationId: id },
      _count: true,
    });

    const existingDocsMap = new Map(
      existingDocs.map((d) => [d.type, d._count])
    );

    // Recuperer les templates disponibles
    const templates = await prisma.template.findMany({
      where: {
        documentType: { in: DOCUMENT_TYPES.map((d) => d.type) },
        isActive: true,
        OR: [
          { isSystem: true },
          ...(dbUser.organizationId ? [{ organizationId: dbUser.organizationId }] : []),
        ],
      },
      select: { documentType: true },
    });

    const availableTemplates = new Set(templates.map((t) => t.documentType));

    // Calculer le nombre de participants
    const totalParticipants = formation.sessions.reduce(
      (sum, s) => sum + s.participants.length,
      0
    );

    // Construire la liste des types avec leur statut
    const documentTypesWithStatus = DOCUMENT_TYPES.map((docType) => {
      const isPerParticipant = [
        "CONVOCATION",
        "ATTESTATION_PRESENCE",
        "ATTESTATION_FIN",
        "CERTIFICAT",
      ].includes(docType.type);

      const expectedCount = isPerParticipant ? totalParticipants : 1;
      const generatedCount = existingDocsMap.get(docType.type) || 0;

      return {
        ...docType,
        hasTemplate: availableTemplates.has(docType.type),
        isPerParticipant,
        expectedCount,
        generatedCount,
        isComplete: generatedCount >= expectedCount,
      };
    });

    return NextResponse.json({
      documentTypes: documentTypesWithStatus,
      formation: {
        id: formation.id,
        titre: formation.titre,
        sessionsCount: formation.sessions.length,
        participantsCount: totalParticipants,
      },
      sessions: formation.sessions.map((s) => ({
        id: s.id,
        dateDebut: s.dateDebut,
        dateFin: s.dateFin,
        participantsCount: s.participants.length,
        participants: s.participants.map((p) => ({
          id: p.id,
          nom: p.lastName,
          prenom: p.firstName,
          email: p.email,
        })),
      })),
    });
  } catch (error) {
    console.error("Erreur récupération types:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des types" },
      { status: 500 }
    );
  }
}

// Helper pour obtenir le label d'un type de document
function getDocumentLabel(type: DocumentType): string {
  return DOCUMENT_TYPES.find((d) => d.type === type)?.label || type;
}
