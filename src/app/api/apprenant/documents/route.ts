// ===========================================
// API DOCUMENTS APPRENANT - GET /api/apprenant/documents
// ===========================================
// Récupère les documents disponibles pour l'apprenant:
// - Documents de la formation
// - Documents de session (convocations, attestations, etc.) - Qualiopi IND 9

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Labels pour les types de documents
const DOCUMENT_LABELS: Record<string, string> = {
  FICHE_PEDAGOGIQUE: "Fiche pedagogique",
  PROGRAMME_FORMATION: "Programme de formation",
  CONVENTION: "Convention de formation",
  CONTRAT_FORMATION: "Contrat de formation",
  CONVOCATION: "Convocation",
  ATTESTATION_PRESENCE: "Attestation de presence",
  ATTESTATION_FIN: "Attestation de fin de formation",
  REGLEMENT_INTERIEUR: "Reglement interieur",
  CONDITIONS_GENERALES_VENTE: "Conditions generales de vente",
  CERTIFICAT: "Certificat",
  EVALUATION_CHAUD: "Evaluation a chaud",
  EVALUATION_FROID: "Evaluation a froid",
  FEUILLE_EMARGEMENT: "Feuille d'emargement",
  AUTRE: "Document",
};

// Décoder et valider le token apprenant
function decodeApprenantToken(token: string): { apprenantId: string; organizationId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));

    if (!decoded.apprenantId || !decoded.organizationId) {
      return null;
    }

    // Vérifier expiration
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }

    return {
      apprenantId: decoded.apprenantId,
      organizationId: decoded.organizationId,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis les query params
    const token = request.nextUrl.searchParams.get("token");
    const inscriptionId = request.nextUrl.searchParams.get("inscriptionId");

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 401 }
      );
    }

    // Décoder le token
    const decoded = decodeApprenantToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    const { apprenantId, organizationId } = decoded;

    // Récupérer l'inscription LMS avec la formation
    const inscription = await prisma.lMSInscription.findFirst({
      where: inscriptionId
        ? { id: inscriptionId, apprenantId }
        : { apprenantId },
      include: {
        formation: {
          include: {
            documents: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    const allDocuments: {
      id: string;
      nom: string;
      description: string | null;
      type: string;
      categorie: string;
      url: string;
      taille: number | null;
      createdAt: string;
    }[] = [];

    // 1. Documents de la formation
    if (inscription) {
      inscription.formation.documents.forEach((doc) => {
        if (doc.fileUrl) {
          allDocuments.push({
            id: doc.id,
            nom: doc.titre,
            description: null,
            type: doc.type,
            categorie: DOCUMENT_LABELS[doc.type] || "Document",
            url: doc.fileUrl,
            taille: doc.fileSize,
            createdAt: doc.createdAt.toISOString(),
          });
        }
      });
    }

    // 2. Documents de session (nouveau système) - Qualiopi IND 9
    // Récupérer les sessions où l'apprenant est inscrit
    const sessionParticipations = await prisma.sessionParticipantNew.findMany({
      where: {
        apprenantId,
        client: {
          session: {
            organizationId,
          },
        },
      },
      include: {
        client: {
          include: {
            session: {
              include: {
                documentsGeneres: {
                  where: {
                    OR: [
                      { participantId: null }, // Documents globaux de la session
                      // Les convocations individuelles seraient filtrées par participantId
                    ],
                  },
                },
              },
            },
          },
        },
      },
    });

    // Ajouter les documents de session
    for (const participation of sessionParticipations) {
      const session = participation.client.session;
      for (const doc of session.documentsGeneres) {
        // Éviter les doublons
        if (!allDocuments.some((d) => d.id === doc.id)) {
          allDocuments.push({
            id: doc.id,
            nom: doc.titre || DOCUMENT_LABELS[doc.type] || "Document",
            description: `Session: ${session.reference || session.id.slice(0, 8)}`,
            type: doc.type,
            categorie: DOCUMENT_LABELS[doc.type] || "Document",
            url: doc.fileUrl || "",
            taille: null,
            createdAt: doc.createdAt.toISOString(),
          });
        }
      }
    }

    // 3. Documents de session (ancien système DocumentSession)
    const oldSessionParticipations = await prisma.sessionParticipant.findMany({
      where: {
        apprenantId,
        client: {
          session: {
            organizationId,
          },
        },
      },
      include: {
        client: {
          include: {
            session: {
              include: {
                documentsGeneres: true,
              },
            },
          },
        },
      },
    });

    for (const participation of oldSessionParticipations) {
      const session = participation.client.session;
      for (const doc of session.documentsGeneres) {
        // Éviter les doublons
        if (!allDocuments.some((d) => d.id === doc.id)) {
          allDocuments.push({
            id: doc.id,
            nom: DOCUMENT_LABELS[doc.type] || "Document",
            description: `Session: ${session.id.slice(0, 8)}`,
            type: doc.type,
            categorie: DOCUMENT_LABELS[doc.type] || "Document",
            url: doc.fileUrl || "",
            taille: null,
            createdAt: doc.createdAt.toISOString(),
          });
        }
      }
    }

    // Trier par date décroissante
    allDocuments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Extraire les catégories uniques
    const categories = [...new Set(allDocuments.map((d) => d.categorie))].filter(Boolean);

    return NextResponse.json({
      documents: allDocuments,
      categories,
    });
  } catch (error) {
    console.error("Erreur API documents apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des documents" },
      { status: 500 }
    );
  }
}
