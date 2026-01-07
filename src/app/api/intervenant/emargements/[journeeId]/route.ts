// ===========================================
// API INTERVENANT EMARGEMENT DETAIL - GET /api/intervenant/emargements/[journeeId]
// ===========================================
// Récupère les détails d'une journée d'émargement pour l'intervenant

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Décoder et valider le token intervenant
function decodeIntervenantToken(token: string): { intervenantId: string; organizationId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));

    if (!decoded.intervenantId || !decoded.organizationId) {
      return null;
    }

    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }

    return {
      intervenantId: decoded.intervenantId,
      organizationId: decoded.organizationId,
    };
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ journeeId: string }> }
) {
  try {
    const { journeeId } = await params;
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    }

    const decoded = decodeIntervenantToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
    }

    const { intervenantId, organizationId } = decoded;

    // Récupérer la journée avec ses données
    const journee = await prisma.sessionJourneeNew.findUnique({
      where: { id: journeeId },
      include: {
        session: {
          include: {
            formation: {
              select: { titre: true },
            },
            lieu: true,
            formateur: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
              },
            },
            clients: {
              include: {
                participants: {
                  include: {
                    apprenant: {
                      select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        feuillesEmargement: {
          include: {
            signatures: {
              select: {
                id: true,
                typeSignataire: true,
                participantId: true,
                formateurId: true,
                periode: true,
                signedAt: true,
                signatureData: true,
              },
            },
          },
        },
      },
    });

    if (!journee) {
      return NextResponse.json({ error: "Journée non trouvée" }, { status: 404 });
    }

    // Vérifier que l'intervenant a accès à cette session
    const session = journee.session;
    const isFormateur = session.formateurId === intervenantId;

    // Vérifier aussi si c'est un co-formateur
    const isCoFormateur = await prisma.sessionCoFormateur.findFirst({
      where: {
        sessionId: session.id,
        intervenantId,
      },
    });

    if (!isFormateur && !isCoFormateur) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    if (session.organizationId !== organizationId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Extraire tous les participants
    const participants = session.clients.flatMap((client) =>
      client.participants.map((p) => ({
        id: p.id,
        apprenant: {
          id: p.apprenant.id,
          nom: p.apprenant.nom,
          prenom: p.apprenant.prenom,
          email: p.apprenant.email,
        },
      }))
    );

    // Récupérer la feuille d'émargement (ou créer un token si elle n'existe pas)
    let feuille = journee.feuillesEmargement[0];

    if (!feuille) {
      // Créer une feuille d'émargement si elle n'existe pas
      const newToken = crypto.randomUUID();
      feuille = await prisma.feuilleEmargementNew.create({
        data: {
          journeeId: journee.id,
          token: newToken,
          isActive: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        },
        include: {
          signatures: {
            select: {
              id: true,
              typeSignataire: true,
              participantId: true,
              formateurId: true,
              periode: true,
              signedAt: true,
              signatureData: true,
            },
          },
        },
      });
    }

    // Préparer la réponse
    const response = {
      journee: {
        id: journee.id,
        date: journee.date.toISOString(),
        heureDebutMatin: journee.heureDebutMatin,
        heureFinMatin: journee.heureFinMatin,
        heureDebutAprem: journee.heureDebutAprem,
        heureFinAprem: journee.heureFinAprem,
      },
      formation: {
        titre: session.formation.titre,
      },
      lieu: session.lieu,
      formateur: session.formateur,
      participants,
      feuille: {
        id: feuille.id,
        token: feuille.token,
        status: feuille.isActive ? "active" : "inactive",
        signatures: feuille.signatures.map((s: { id: string; typeSignataire: string; participantId: string | null; formateurId: string | null; periode: string; signedAt: Date | null; signatureData: string | null }) => ({
          id: s.id,
          signataire: s.typeSignataire,
          participantId: s.participantId,
          intervenantId: s.formateurId,
          periode: s.periode,
          signedAt: s.signedAt?.toISOString(),
          signatureData: s.signatureData,
        })),
      },
      intervenantId, // Pour savoir si c'est le formateur connecté
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur API émargement detail:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}
