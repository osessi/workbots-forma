// ===========================================
// API INTERVENANT SUIVI - GET /api/intervenant/suivi
// ===========================================
// Corrections 524-528: Refonte complète du suivi pédagogique
// - Stats KPI: participants, ressources, messages envoyés/reçus
// - Badge messages non lus par apprenant
// - Détails émargements et évaluations

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

    // Vérifier l'accès et récupérer les données de la session
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
        journees: {
          select: {
            id: true,
            heureDebutMatin: true,
            heureFinMatin: true,
            heureDebutAprem: true,
            heureFinAprem: true,
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
                signatures: { select: { id: true, periode: true } },
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
    }

    // Calculer le nombre total de demi-journées planifiées
    let totalHalfDays = 0;
    session.journees.forEach(j => {
      if (j.heureDebutMatin && j.heureFinMatin) totalHalfDays++;
      if (j.heureDebutAprem && j.heureFinAprem) totalHalfDays++;
    });

    // Récupérer les messages de l'intervenant pour cette session
    const messagesEnvoyes = await prisma.messageIntervenant.findMany({
      where: {
        sessionId,
        intervenantId,
      },
      select: {
        id: true,
        attachments: true,
        createdAt: true,
      },
    });

    // Compter les ressources partagées (messages avec attachments)
    const ressourcesPartagees = messagesEnvoyes.filter(m => {
      const attachments = m.attachments as Array<{ name: string; url: string }> | null;
      return attachments && attachments.length > 0;
    }).length;

    // Note: Pour l'instant, les messages des apprenants vers l'intervenant
    // ne sont pas encore implémentés dans le schéma.
    // On initialise à 0 les compteurs de messages reçus.
    const messagesRecus: Array<{ id: string; apprenantId: string; isRead: boolean }> = [];

    // Comptage par apprenant des messages non lus
    const messagesNonLusParApprenant = new Map<string, number>();
    messagesRecus.filter(m => !m.isRead).forEach(m => {
      const current = messagesNonLusParApprenant.get(m.apprenantId) || 0;
      messagesNonLusParApprenant.set(m.apprenantId, current + 1);
    });

    // Récupérer les évaluations de la formation
    const evaluations = await prisma.evaluation.findMany({
      where: {
        formationId: session.formationId,
        isActive: true,
        type: { in: ["POSITIONNEMENT", "FINALE"] },
      },
      select: { id: true, type: true },
    });

    // Récupérer les résultats d'évaluations pour tous les apprenants
    const apprenantIds = session.clients.flatMap(c => c.participants.map(p => p.apprenant.id));
    const evaluationResults = await prisma.evaluationResultat.findMany({
      where: {
        sessionId,
        apprenantId: { in: apprenantIds },
        status: { in: ["termine", "valide"] },
      },
      select: {
        apprenantId: true,
        evaluationId: true,
      },
    });

    // Compter les évaluations complétées par apprenant
    const evalsParApprenant = new Map<string, number>();
    evaluationResults.forEach(r => {
      const current = evalsParApprenant.get(r.apprenantId) || 0;
      evalsParApprenant.set(r.apprenantId, current + 1);
    });

    const totalEvaluations = evaluations.length;

    // Construire les données de suivi pour chaque apprenant
    const apprenants = session.clients.flatMap(client =>
      client.participants.map(participant => {
        const signaturesCount = participant.signatures.length;
        const presenceRate = totalHalfDays > 0
          ? Math.round((signaturesCount / totalHalfDays) * 100)
          : 0;

        const evaluationsCompletes = evalsParApprenant.get(participant.apprenant.id) || 0;
        const messagesNonLus = messagesNonLusParApprenant.get(participant.apprenant.id) || 0;

        // Déterminer le statut basé sur la présence
        let statut: "excellent" | "bon" | "attention" | "critique";
        if (presenceRate >= 90) statut = "excellent";
        else if (presenceRate >= 70) statut = "bon";
        else if (presenceRate >= 50) statut = "attention";
        else statut = "critique";

        return {
          id: participant.apprenant.id,
          nom: participant.apprenant.nom,
          prenom: participant.apprenant.prenom,
          email: participant.apprenant.email,
          signaturesCount,
          totalHalfDays,
          presenceRate,
          evaluationsCompletes,
          evaluationsTotal: totalEvaluations,
          messagesNonLus,
          statut,
        };
      })
    );

    // Trier par nom
    apprenants.sort((a, b) => a.nom.localeCompare(b.nom));

    // Stats globales pour les tuiles KPI
    const stats = {
      participants: apprenants.length,
      ressourcesPartagees,
      messagesEnvoyes: messagesEnvoyes.length,
      messagesRecus: messagesRecus.length,
      messagesNonLus: messagesRecus.filter(m => !m.isRead).length,
      // Émargements totaux
      signaturesTotal: apprenants.reduce((sum, a) => sum + a.signaturesCount, 0),
      signaturesAttendu: apprenants.length * totalHalfDays,
      // Évaluations totales
      evaluationsCompletees: apprenants.reduce((sum, a) => sum + a.evaluationsCompletes, 0),
      evaluationsAttendu: apprenants.length * totalEvaluations,
    };

    return NextResponse.json({ apprenants, stats });
  } catch (error) {
    console.error("Erreur API suivi intervenant:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
