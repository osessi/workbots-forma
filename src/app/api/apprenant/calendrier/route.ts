// ===========================================
// API CALENDRIER APPRENANT - GET /api/apprenant/calendrier
// ===========================================
// Récupère les événements du calendrier pour l'apprenant

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
      return NextResponse.json({ events: [] });
    }

    // Récupérer les participations aux sessions
    const participations = await prisma.sessionParticipantNew.findMany({
      where: {
        apprenantId,
        client: {
          session: {
            formationId: inscription.formationId,
          },
        },
      },
      include: {
        client: {
          include: {
            session: {
              include: {
                journees: {
                  orderBy: { date: "asc" },
                },
                formateur: true,
                lieu: true,
              },
            },
          },
        },
      },
    });

    // Construire la liste des événements
    const events: Array<{
      id: string;
      date: string;
      heureDebut: string;
      heureFin: string;
      sessionNom: string;
      sessionReference: string;
      lieu: string | null;
      formateur: string | null;
      type: "formation" | "evaluation" | "autre";
    }> = [];

    for (const participation of participations) {
      const session = participation.client.session;

      for (const journee of session.journees) {
        events.push({
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
          type: "formation",
        });
      }
    }

    // Trier par date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Erreur API calendrier apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du calendrier" },
      { status: 500 }
    );
  }
}
