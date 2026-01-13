// ===========================================
// API GROUPE APPRENANT - GET /api/apprenant/groupe
// ===========================================
// Récupère les autres apprenants de la même formation

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
    // Correction 430: Utiliser sessionId au lieu de inscriptionId
    const sessionId = request.nextUrl.searchParams.get("sessionId");

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

    // Correction 430: Si sessionId fourni, récupérer les apprenants de la session
    if (sessionId) {
      // Récupérer la session avec ses participants
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          formation: true,
          clients: {
            include: {
              participants: {
                include: {
                  apprenant: true,
                },
              },
              entreprise: true,
            },
          },
        },
      });

      if (!session) {
        return NextResponse.json({
          apprenants: [],
          formationTitre: "",
          totalApprenants: 0,
        });
      }

      // Extraire tous les apprenants de la session
      const apprenants: Array<{
        id: string;
        nom: string;
        prenom: string;
        email: string;
        entreprise: string | null;
      }> = [];

      for (const client of session.clients) {
        for (const participant of client.participants) {
          if (participant.apprenant) {
            apprenants.push({
              id: participant.apprenant.id,
              nom: participant.apprenant.nom,
              prenom: participant.apprenant.prenom,
              email: participant.apprenant.email,
              entreprise: client.entreprise?.raisonSociale || null,
            });
          }
        }
      }

      // Trier pour mettre l'utilisateur actuel en premier
      apprenants.sort((a, b) => {
        if (a.id === apprenantId) return -1;
        if (b.id === apprenantId) return 1;
        return a.nom.localeCompare(b.nom);
      });

      return NextResponse.json({
        apprenants,
        formationTitre: session.formation.titre,
        totalApprenants: apprenants.length,
      });
    }

    // Fallback: comportement original si pas de sessionId
    const inscription = await prisma.lMSInscription.findFirst({
      where: { apprenantId },
      include: {
        formation: true,
      },
    });

    if (!inscription) {
      return NextResponse.json({
        apprenants: [],
        formationTitre: "",
        totalApprenants: 0,
      });
    }

    // Récupérer tous les apprenants inscrits à la même formation
    const inscriptions = await prisma.lMSInscription.findMany({
      where: {
        formationId: inscription.formationId,
      },
      include: {
        apprenant: true,
      },
    });

    // Formater les apprenants
    const apprenants = inscriptions.map((insc) => ({
      id: insc.apprenant.id,
      nom: insc.apprenant.nom,
      prenom: insc.apprenant.prenom,
      email: insc.apprenant.email,
      entreprise: null as string | null,
    }));

    // Trier pour mettre l'utilisateur actuel en premier
    apprenants.sort((a, b) => {
      if (a.id === apprenantId) return -1;
      if (b.id === apprenantId) return 1;
      return a.nom.localeCompare(b.nom);
    });

    return NextResponse.json({
      apprenants,
      formationTitre: inscription.formation.titre,
      totalApprenants: apprenants.length,
    });
  } catch (error) {
    console.error("Erreur API groupe apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du groupe" },
      { status: 500 }
    );
  }
}
