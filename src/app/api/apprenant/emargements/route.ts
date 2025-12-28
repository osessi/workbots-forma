// ===========================================
// API EMARGEMENTS APPRENANT - GET /api/apprenant/emargements
// ===========================================
// Récupère les émargements pour l'apprenant

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

    // Récupérer l'inscription pour avoir la formation
    const inscription = await prisma.lMSInscription.findFirst({
      where: inscriptionId
        ? { id: inscriptionId, apprenantId }
        : { apprenantId },
    });

    if (!inscription) {
      return NextResponse.json({
        emargements: [],
        stats: { total: 0, signes: 0, enAttente: 0 },
      });
    }

    // Récupérer les participations aux sessions (simplifié)
    const participations = await prisma.sessionParticipantNew.findMany({
      where: {
        apprenantId,
      },
      include: {
        client: {
          include: {
            session: {
              include: {
                journees: {
                  include: {
                    feuillesEmargement: {
                      include: {
                        signatures: true,
                      },
                    },
                  },
                  orderBy: { date: "asc" },
                },
                formateur: true,
                lieu: true,
              },
            },
          },
        },
        signatures: true,
      },
    });

    // Filtrer par formation
    const filteredParticipations = participations.filter(
      (p) => p.client?.session?.formationId === inscription.formationId
    );

    // Construire la liste des émargements par journée
    const emargements: Array<{
      id: string;
      date: string;
      heureDebut: string;
      heureFin: string;
      sessionNom: string;
      sessionReference: string;
      lieu: string | null;
      formateur: string | null;
      signatureMatin: boolean;
      signatureAprem: boolean;
      feuilleId: string;
    }> = [];

    let totalSignatures = 0;
    let signaturesEffectuees = 0;

    for (const participation of filteredParticipations) {
      const session = participation.client?.session;
      if (!session) continue;

      for (const journee of session.journees) {
        // Trouver la feuille d'émargement pour cette journée
        const feuille = journee.feuillesEmargement[0]; // Prendre la première feuille

        if (feuille) {
          // Vérifier les signatures de l'apprenant
          const signatureMatin = feuille.signatures.some(
            (s) => s.participantId === participation.id && s.periode === "matin"
          );
          const signatureAprem = feuille.signatures.some(
            (s) => s.participantId === participation.id && s.periode === "aprem"
          );

          totalSignatures += 2;
          if (signatureMatin) signaturesEffectuees++;
          if (signatureAprem) signaturesEffectuees++;

          emargements.push({
            id: journee.id,
            date: journee.date.toISOString(),
            heureDebut: journee.heureDebutMatin || "09:00",
            heureFin: journee.heureFinAprem || "17:00",
            sessionNom: session.nom || `Session ${session.reference}`,
            sessionReference: session.reference,
            lieu: session.lieu?.nom || null,
            formateur: session.formateur
              ? `${session.formateur.prenom} ${session.formateur.nom}`
              : null,
            signatureMatin,
            signatureAprem,
            feuilleId: feuille.id,
          });
        }
      }
    }

    // Trier par date (les plus proches en premier)
    emargements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      emargements,
      stats: {
        total: totalSignatures,
        signes: signaturesEffectuees,
        enAttente: totalSignatures - signaturesEffectuees,
      },
    });
  } catch (error) {
    console.error("Erreur API émargements apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des émargements" },
      { status: 500 }
    );
  }
}
