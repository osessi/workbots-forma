// ===========================================
// API INTERVENANT ÉVALUATIONS APPRENANTS - GET /api/intervenant/evaluations/apprenants
// ===========================================
// Corrections 514-519: Récupère les évaluations des apprenants de la session

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

function decodeIntervenantToken(token: string): { intervenantId: string; organizationId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));
    if (!decoded.intervenantId || !decoded.organizationId) return null;
    if (decoded.exp && decoded.exp < Date.now()) return null;
    return { intervenantId: decoded.intervenantId, organizationId: decoded.organizationId };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    const decoded = decodeIntervenantToken(token);
    if (!decoded) return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    if (!sessionId) return NextResponse.json({ error: "Session ID requis" }, { status: 400 });

    const { intervenantId, organizationId } = decoded;

    // Vérifier l'accès à la session
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        organizationId,
        OR: [
          { formateurId: intervenantId },
          { coFormateurs: { some: { intervenantId } } },
        ],
      },
      include: {
        formation: {
          select: { id: true },
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
        journees: {
          orderBy: { date: "desc" },
          take: 1,
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
    }

    // Extraire tous les apprenants de la session
    const apprenants = session.clients.flatMap(client =>
      client.participants.map(p => p.apprenant)
    );

    if (apprenants.length === 0) {
      return NextResponse.json({ apprenants: [] });
    }

    const apprenantIds = apprenants.map(a => a.id);

    // Récupérer les évaluations de type POSITIONNEMENT et FINALE (évaluation finale)
    const evaluations = await prisma.evaluation.findMany({
      where: {
        formationId: session.formation.id,
        isActive: true,
        type: {
          in: ["POSITIONNEMENT", "FINALE"],
        },
      },
      select: { id: true, type: true },
    });

    const positionnementId = evaluations.find(e => e.type === "POSITIONNEMENT")?.id;
    const finaleId = evaluations.find(e => e.type === "FINALE")?.id;

    // Récupérer les résultats des évaluations
    const resultats = await prisma.evaluationResultat.findMany({
      where: {
        apprenantId: { in: apprenantIds },
        evaluationId: { in: [positionnementId, finaleId].filter(Boolean) as string[] },
        sessionId: sessionId,
      },
      select: {
        id: true,
        apprenantId: true,
        evaluationId: true,
        status: true,
        score: true,
      },
    });

    // Récupérer les évaluations de satisfaction (à chaud et à froid)
    // Chercher dans le nouveau système (Session) et l'ancien (DocumentSession)
    const satisfactionEvals = await prisma.evaluationSatisfaction.findMany({
      where: {
        apprenantId: { in: apprenantIds },
        // sessionId peut correspondre à Session.id ou DocumentSession.id
      },
      select: {
        id: true,
        apprenantId: true,
        type: true,
        status: true,
        sessionId: true,
      },
    });

    // Filtrer pour la session actuelle ou la DocumentSession correspondante
    // On garde toutes les évaluations car le sessionId peut différer entre systèmes
    const satisfactionByApprenant = new Map<string, { chaud?: typeof satisfactionEvals[0]; froid?: typeof satisfactionEvals[0] }>();

    satisfactionEvals.forEach(sat => {
      const existing = satisfactionByApprenant.get(sat.apprenantId) || {};
      if (sat.type === "CHAUD") {
        existing.chaud = sat;
      } else if (sat.type === "FROID") {
        existing.froid = sat;
      }
      satisfactionByApprenant.set(sat.apprenantId, existing);
    });

    // Déterminer la date de fin de session pour savoir si les évaluations sont disponibles
    const dernierJour = session.journees[0];
    const dateFinSession = dernierJour ? new Date(dernierJour.date) : null;
    const now = new Date();

    // À chaud disponible après la fin de session
    const aChaudDisponible = dateFinSession ? now >= dateFinSession : false;

    // À froid disponible 3 mois après la fin de session
    const dateFroid = dateFinSession ? new Date(dateFinSession) : null;
    if (dateFroid) {
      dateFroid.setMonth(dateFroid.getMonth() + 3);
    }
    const aFroidDisponible = dateFroid ? now >= dateFroid : false;

    // Construire la réponse
    const apprenantsData = apprenants.map(apprenant => {
      // Test de positionnement
      const positionnementResult = positionnementId
        ? resultats.find(r => r.apprenantId === apprenant.id && r.evaluationId === positionnementId)
        : null;

      // Évaluation finale
      const finaleResult = finaleId
        ? resultats.find(r => r.apprenantId === apprenant.id && r.evaluationId === finaleId)
        : null;

      // Satisfaction
      const satisfaction = satisfactionByApprenant.get(apprenant.id) || {};

      return {
        id: apprenant.id,
        nom: apprenant.nom,
        prenom: apprenant.prenom,
        email: apprenant.email,
        positionnement: positionnementId ? {
          status: positionnementResult && (positionnementResult.status === "termine" || positionnementResult.status === "valide")
            ? "completed" as const
            : "pending" as const,
          resultId: positionnementResult?.id,
        } : null,
        evaluationFinale: finaleId ? {
          status: finaleResult && (finaleResult.status === "termine" || finaleResult.status === "valide")
            ? "completed" as const
            : "pending" as const,
          resultId: finaleResult?.id,
          score: finaleResult?.score || undefined,
        } : null,
        satisfactionChaud: {
          status: satisfaction.chaud?.status === "COMPLETED"
            ? "completed" as const
            : !aChaudDisponible
            ? "not_available" as const
            : "pending" as const,
          resultId: satisfaction.chaud?.id,
        },
        satisfactionFroid: {
          status: satisfaction.froid?.status === "COMPLETED"
            ? "completed" as const
            : !aFroidDisponible
            ? "not_available" as const
            : "pending" as const,
          resultId: satisfaction.froid?.id,
        },
      };
    });

    return NextResponse.json({ apprenants: apprenantsData });
  } catch (error) {
    console.error("Erreur API évaluations apprenants:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
