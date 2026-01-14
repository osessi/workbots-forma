// ===========================================
// API EMARGEMENTS APPRENANT - GET /api/apprenant/emargements
// ===========================================
// Corrections 439-441: Émargements basés sur session + affichage demi-journées
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
    // Correction 440: Utiliser sessionId pour filtrer
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

    // Correction 440-441: Récupérer les participations aux sessions filtrées par sessionId
    const participations = await prisma.sessionParticipantNew.findMany({
      where: {
        apprenantId,
        // Filtrer par sessionId si fourni
        ...(sessionId ? {
          client: {
            sessionId: sessionId,
          },
        } : {}),
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
                formation: {
                  select: { titre: true },
                },
              },
            },
          },
        },
        signatures: true,
      },
    });

    if (participations.length === 0) {
      return NextResponse.json({
        emargements: [],
        demiJournees: [],
        stats: { total: 0, signes: 0, enAttente: 0 },
        formationTitre: null,
      });
    }

    // Prendre la première participation (session sélectionnée)
    const participation = participations[0];
    const session = participation.client?.session;

    if (!session) {
      return NextResponse.json({
        emargements: [],
        demiJournees: [],
        stats: { total: 0, signes: 0, enAttente: 0 },
        formationTitre: null,
      });
    }

    // Correction 441: Récupérer les feuilles d'émargement du NOUVEAU système
    // Les journées viennent de SessionJourneeNew, donc on utilise FeuilleEmargementNew
    const feuillesEmargement = await prisma.feuilleEmargementNew.findMany({
      where: {
        journee: {
          sessionId: session.id,
        },
      },
      include: {
        signatures: {
          where: {
            participantId: participation.id,
          },
        },
        journee: true,
      },
    });

    // Créer un map des feuilles par journée
    const feuillesByJourneeId = new Map<string, typeof feuillesEmargement[0]>();
    for (const feuille of feuillesEmargement) {
      feuillesByJourneeId.set(feuille.journeeId, feuille);
    }

    // Correction 441: Construire la liste des demi-journées pour TOUTES les journées
    const demiJournees: Array<{
      id: string;
      journeeId: string;
      jour: number; // Jour 1, Jour 2, etc.
      date: string;
      periode: "matin" | "aprem";
      heureDebut: string;
      heureFin: string;
      statut: "a_venir" | "ouvert" | "signe";
      feuilleId: string | null;
      sessionNom: string;
      sessionReference: string;
      lieu: string | null;
      formateur: string | null;
    }> = [];

    let totalDemiJournees = 0;
    let signeesCount = 0;

    // Parcourir toutes les journées de la session
    session.journees.forEach((journee, index) => {
      const feuille = feuillesByJourneeId.get(journee.id);
      const jourNumero = index + 1;

      // Déterminer les horaires
      const heureDebutMatin = journee.heureDebutMatin || "09:00";
      const heureFinMatin = journee.heureFinMatin || "12:30";
      const heureDebutAprem = journee.heureDebutAprem || "14:00";
      const heureFinAprem = journee.heureFinAprem || "17:30";

      // Correction 441: Déterminer le statut selon les règles d'ouverture
      const now = new Date();
      const journeeDate = new Date(journee.date);

      // Construire les horaires complets pour matin et après-midi
      const [heureDebutMatinH, heureDebutMatinM] = heureDebutMatin.split(":").map(Number);
      const [heureDebutApremH, heureDebutApremM] = heureDebutAprem.split(":").map(Number);

      const dateDebutMatin = new Date(journeeDate);
      dateDebutMatin.setHours(heureDebutMatinH, heureDebutMatinM, 0, 0);

      const dateDebutAprem = new Date(journeeDate);
      dateDebutAprem.setHours(heureDebutApremH, heureDebutApremM, 0, 0);

      // Vérifier les signatures existantes
      const signatureMatin = feuille?.signatures.some((s) => s.periode === "matin") || false;
      const signatureAprem = feuille?.signatures.some((s) => s.periode === "aprem") || false;

      // Demi-journée MATIN
      let statutMatin: "a_venir" | "ouvert" | "signe" = "a_venir";
      if (signatureMatin) {
        statutMatin = "signe";
        signeesCount++;
      } else if (now >= dateDebutMatin) {
        statutMatin = "ouvert";
      }

      demiJournees.push({
        id: `${journee.id}-matin`,
        journeeId: journee.id,
        jour: jourNumero,
        date: journee.date.toISOString(),
        periode: "matin",
        heureDebut: heureDebutMatin,
        heureFin: heureFinMatin,
        statut: statutMatin,
        feuilleId: feuille?.id || null,
        sessionNom: session.nom || `Session ${session.reference}`,
        sessionReference: session.reference,
        lieu: session.lieu?.nom || null,
        formateur: session.formateur
          ? `${session.formateur.prenom} ${session.formateur.nom}`
          : null,
      });
      totalDemiJournees++;

      // Demi-journée APRÈS-MIDI
      let statutAprem: "a_venir" | "ouvert" | "signe" = "a_venir";
      if (signatureAprem) {
        statutAprem = "signe";
        signeesCount++;
      } else if (now >= dateDebutAprem) {
        statutAprem = "ouvert";
      }

      demiJournees.push({
        id: `${journee.id}-aprem`,
        journeeId: journee.id,
        jour: jourNumero,
        date: journee.date.toISOString(),
        periode: "aprem",
        heureDebut: heureDebutAprem,
        heureFin: heureFinAprem,
        statut: statutAprem,
        feuilleId: feuille?.id || null,
        sessionNom: session.nom || `Session ${session.reference}`,
        sessionReference: session.reference,
        lieu: session.lieu?.nom || null,
        formateur: session.formateur
          ? `${session.formateur.prenom} ${session.formateur.nom}`
          : null,
      });
      totalDemiJournees++;
    });

    // Correction 440: Stats basées sur le total de demi-journées de la session
    return NextResponse.json({
      demiJournees,
      stats: {
        total: totalDemiJournees,
        signes: signeesCount,
        enAttente: totalDemiJournees - signeesCount,
      },
      formationTitre: session.formation?.titre || null,
      participantId: participation.id,
    });
  } catch (error) {
    console.error("Erreur API émargements apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des émargements" },
      { status: 500 }
    );
  }
}
