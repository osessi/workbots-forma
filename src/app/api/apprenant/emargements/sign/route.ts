// ===========================================
// API SIGNATURE EMARGEMENT - POST /api/apprenant/emargements/sign
// ===========================================
// Permet à l'apprenant de signer une feuille d'émargement

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, feuilleId, periode, signature } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 401 }
      );
    }

    if (!feuilleId || !periode || !signature) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    if (!["matin", "aprem"].includes(periode)) {
      return NextResponse.json(
        { error: "Période invalide" },
        { status: 400 }
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

    // Vérifier que la feuille existe
    const feuille = await prisma.feuilleEmargement.findUnique({
      where: { id: feuilleId },
      include: {
        journee: {
          include: {
            session: {
              include: {
                clients: {
                  include: {
                    participants: {
                      where: { apprenantId },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!feuille) {
      return NextResponse.json(
        { error: "Feuille d'émargement non trouvée" },
        { status: 404 }
      );
    }

    // Trouver le participant correspondant à l'apprenant
    let participantId: string | null = null;
    for (const client of feuille.journee.session.clients) {
      const participant = client.participants.find((p) => p.apprenantId === apprenantId);
      if (participant) {
        participantId = participant.id;
        break;
      }
    }

    if (!participantId) {
      return NextResponse.json(
        { error: "Vous n'êtes pas inscrit à cette session" },
        { status: 403 }
      );
    }

    // Vérifier si la signature existe déjà
    const existingSignature = await prisma.signatureEmargement.findFirst({
      where: {
        feuilleId,
        participantId,
        periode,
      },
    });

    if (existingSignature) {
      return NextResponse.json(
        { error: "Vous avez déjà signé pour cette période" },
        { status: 400 }
      );
    }

    // Créer la signature
    const newSignature = await prisma.signatureEmargement.create({
      data: {
        feuilleId,
        participantId,
        periode,
        signatureData: signature,
        signedAt: new Date(),
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
        userAgent: request.headers.get("user-agent") || null,
      },
    });

    return NextResponse.json({
      success: true,
      signature: {
        id: newSignature.id,
        periode: newSignature.periode,
        signedAt: newSignature.signedAt,
      },
    });
  } catch (error) {
    console.error("Erreur API signature émargement:", error);
    return NextResponse.json(
      { error: "Erreur lors de la signature" },
      { status: 500 }
    );
  }
}
