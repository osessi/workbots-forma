// ===========================================
// API DOCUMENTS APPRENANT - GET /api/apprenant/documents
// ===========================================
// Récupère les documents disponibles pour l'apprenant

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

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

    const { apprenantId } = decoded;

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

    if (!inscription) {
      return NextResponse.json({
        documents: [],
        categories: [],
      });
    }

    // Formater les documents
    const documents = inscription.formation.documents.map((doc) => ({
      id: doc.id,
      nom: doc.titre,
      type: doc.type,
      url: doc.fileUrl,
      taille: doc.fileSize,
      createdAt: doc.createdAt.toISOString(),
    }));

    // Extraire les types uniques comme catégories
    const categories = [...new Set(documents.map((d) => d.type))];

    return NextResponse.json({
      documents,
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
