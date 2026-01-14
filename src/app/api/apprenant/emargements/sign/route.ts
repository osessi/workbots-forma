// ===========================================
// API SIGNATURE EMARGEMENT - POST /api/apprenant/emargements/sign
// ===========================================
// Permet à l'apprenant de signer une feuille d'émargement
// Utilise le NOUVEAU système (FeuilleEmargementNew + SignatureEmargementNew)

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
    // Accepter feuilleId OU journeeId pour créer la feuille automatiquement
    const { token, feuilleId, journeeId, periode, signature } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 401 }
      );
    }

    if ((!feuilleId && !journeeId) || !periode || !signature) {
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

    let feuille;

    if (feuilleId) {
      // Mode classique: utiliser la feuille existante (NOUVEAU système)
      feuille = await prisma.feuilleEmargementNew.findUnique({
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
    } else {
      // Créer la feuille automatiquement si elle n'existe pas
      // Vérifier que la journée existe (NOUVEAU système: SessionJourneeNew)
      const journee = await prisma.sessionJourneeNew.findUnique({
        where: { id: journeeId },
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
      });

      if (!journee) {
        return NextResponse.json(
          { error: "Journée non trouvée" },
          { status: 404 }
        );
      }

      // Vérifier que l'apprenant participe à la session
      let participantFound = false;
      for (const client of journee.session.clients) {
        if (client.participants.length > 0) {
          participantFound = true;
          break;
        }
      }

      if (!participantFound) {
        return NextResponse.json(
          { error: "Vous n'êtes pas inscrit à cette session" },
          { status: 403 }
        );
      }

      // Chercher ou créer la feuille d'émargement (NOUVEAU système)
      const existingFeuille = await prisma.feuilleEmargementNew.findFirst({
        where: { journeeId },
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

      if (existingFeuille) {
        feuille = existingFeuille;
      } else {
        // Créer la feuille automatiquement (NOUVEAU système)
        const newFeuille = await prisma.feuilleEmargementNew.create({
          data: {
            journeeId,
          },
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
        feuille = newFeuille;
      }
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

    // Vérifier si la signature existe déjà (NOUVEAU système)
    const existingSignature = await prisma.signatureEmargementNew.findFirst({
      where: {
        feuilleId: feuille.id,
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

    // Créer la signature (NOUVEAU système)
    const newSignature = await prisma.signatureEmargementNew.create({
      data: {
        feuilleId: feuille.id,
        participantId,
        typeSignataire: "apprenant",
        periode,
        signatureData: signature,
        signedAt: new Date(),
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
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
