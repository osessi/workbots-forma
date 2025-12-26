// ===========================================
// API ÉMARGEMENT - Accès public via token QR
// ===========================================
// GET /api/emargement/[token] - Récupérer une feuille par token (accès public)
// POST /api/emargement/[token] - Signer une feuille (accès public)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET - Récupérer les infos de la feuille (accès public via QR)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const feuille = await prisma.feuilleEmargement.findUnique({
      where: { token },
      include: {
        journee: {
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
          },
        },
        signatures: {
          select: {
            id: true,
            signataire: true,
            participantId: true,
            intervenantId: true,
            periode: true,
            signedAt: true,
            signatureData: true,
            participant: {
              select: {
                id: true,
                apprenant: {
                  select: {
                    nom: true,
                    prenom: true,
                    email: true,
                  },
                },
              },
            },
            intervenant: {
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
    });

    if (!feuille) {
      return NextResponse.json({ error: "Feuille non trouvée" }, { status: 404 });
    }

    // Vérifier si expirée
    if (feuille.expiresAt && new Date() > feuille.expiresAt) {
      return NextResponse.json({ error: "QR code expiré" }, { status: 410 });
    }

    // Vérifier si fermée
    if (feuille.status !== "active") {
      return NextResponse.json({ error: "Feuille fermée" }, { status: 410 });
    }

    // Extraire tous les participants de la session
    const participants: {
      id: string;
      apprenantId: string;
      nom: string;
      prenom: string;
      email: string;
    }[] = [];

    feuille.journee.session.clients.forEach((client) => {
      client.participants.forEach((p) => {
        participants.push({
          id: p.id,
          apprenantId: p.apprenant.id,
          nom: p.apprenant.nom,
          prenom: p.apprenant.prenom,
          email: p.apprenant.email,
        });
      });
    });

    // Préparer la réponse
    const response = {
      id: feuille.id,
      token: feuille.token,
      status: feuille.status,
      journee: {
        id: feuille.journee.id,
        date: feuille.journee.date,
        heureDebutMatin: feuille.journee.heureDebutMatin,
        heureFinMatin: feuille.journee.heureFinMatin,
        heureDebutAprem: feuille.journee.heureDebutAprem,
        heureFinAprem: feuille.journee.heureFinAprem,
      },
      formation: {
        titre: feuille.journee.session.formation.titre,
      },
      lieu: feuille.journee.session.lieu,
      formateur: feuille.journee.session.formateur,
      participants,
      signatures: feuille.signatures,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur récupération feuille:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Signer la feuille (accès public)
// Supporte maintenant participants ET formateurs
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { participantId, intervenantId, periode, signatureData, email } = body;

    // Validation: soit participantId soit intervenantId requis
    if (!participantId && !intervenantId) {
      return NextResponse.json(
        { error: "participantId ou intervenantId requis" },
        { status: 400 }
      );
    }

    if (!periode) {
      return NextResponse.json(
        { error: "periode est requis" },
        { status: 400 }
      );
    }

    if (!["matin", "apres_midi"].includes(periode)) {
      return NextResponse.json(
        { error: "periode doit être 'matin' ou 'apres_midi'" },
        { status: 400 }
      );
    }

    // Récupérer la feuille
    const feuille = await prisma.feuilleEmargement.findUnique({
      where: { token },
      include: {
        journee: {
          include: {
            session: {
              include: {
                formateur: true,
                clients: {
                  include: {
                    participants: {
                      include: {
                        apprenant: true,
                      },
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
      return NextResponse.json({ error: "Feuille non trouvée" }, { status: 404 });
    }

    // Vérifications
    if (feuille.expiresAt && new Date() > feuille.expiresAt) {
      return NextResponse.json({ error: "QR code expiré" }, { status: 410 });
    }

    if (feuille.status !== "active") {
      return NextResponse.json({ error: "Feuille fermée" }, { status: 410 });
    }

    // Récupérer IP et User-Agent
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;

    // === SIGNATURE FORMATEUR ===
    if (intervenantId) {
      // Vérifier que l'intervenant est bien le formateur de cette session
      if (!feuille.journee.session.formateur || feuille.journee.session.formateur.id !== intervenantId) {
        return NextResponse.json(
          { error: "Formateur non autorisé pour cette session" },
          { status: 403 }
        );
      }

      // Vérification optionnelle par email
      if (email && feuille.journee.session.formateur.email?.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json(
          { error: "Email non correspondant" },
          { status: 403 }
        );
      }

      // Créer ou mettre à jour la signature formateur
      const signature = await prisma.signatureEmargement.upsert({
        where: {
          feuilleId_intervenantId_periode: {
            feuilleId: feuille.id,
            intervenantId,
            periode,
          },
        },
        create: {
          feuilleId: feuille.id,
          signataire: "formateur",
          intervenantId,
          periode,
          signatureData,
          ipAddress,
          userAgent,
        },
        update: {
          signatureData,
          signedAt: new Date(),
          ipAddress,
          userAgent,
        },
      });

      return NextResponse.json({
        success: true,
        signature: {
          id: signature.id,
          signataire: "formateur",
          periode: signature.periode,
          signedAt: signature.signedAt,
        },
      });
    }

    // === SIGNATURE PARTICIPANT ===
    // Vérifier que le participant fait partie de la session
    const allParticipants = feuille.journee.session.clients.flatMap(
      (c) => c.participants
    );
    const participant = allParticipants.find((p) => p.id === participantId);

    if (!participant) {
      return NextResponse.json(
        { error: "Participant non trouvé dans cette session" },
        { status: 403 }
      );
    }

    // Vérification optionnelle par email (sécurité supplémentaire)
    if (email && participant.apprenant.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "Email non correspondant" },
        { status: 403 }
      );
    }

    // Créer ou mettre à jour la signature participant
    const signature = await prisma.signatureEmargement.upsert({
      where: {
        feuilleId_participantId_periode: {
          feuilleId: feuille.id,
          participantId,
          periode,
        },
      },
      create: {
        feuilleId: feuille.id,
        signataire: "participant",
        participantId,
        periode,
        signatureData,
        ipAddress,
        userAgent,
      },
      update: {
        signatureData,
        signedAt: new Date(),
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      signature: {
        id: signature.id,
        signataire: "participant",
        periode: signature.periode,
        signedAt: signature.signedAt,
      },
    });
  } catch (error) {
    console.error("Erreur signature:", error);
    return NextResponse.json(
      { error: "Erreur lors de la signature" },
      { status: 500 }
    );
  }
}
