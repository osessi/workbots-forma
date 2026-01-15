// ===========================================
// API INTERVENANT RELANCE ÉMARGEMENT - POST /api/intervenant/emargements/[journeeId]/relance
// ===========================================
// Correction 508: Envoie une relance aux participants non signés

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/services/email";

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ journeeId: string }> }
) {
  try {
    const { journeeId } = await params;
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    }

    const decoded = decodeIntervenantToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
    }

    const { intervenantId, organizationId } = decoded;

    // Récupérer la journée avec toutes les données nécessaires
    const journee = await prisma.sessionJourneeNew.findUnique({
      where: { id: journeeId },
      include: {
        session: {
          include: {
            formation: {
              select: { titre: true },
            },
            organization: {
              select: {
                id: true,
                name: true,
                nomCommercial: true,
                email: true,
                slug: true,
              },
            },
            formateur: {
              select: {
                id: true,
                nom: true,
                prenom: true,
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
          where: { isActive: true },
          include: {
            signatures: {
              select: {
                id: true,
                participantId: true,
                periode: true,
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

    // Récupérer la feuille d'émargement
    const feuille = journee.feuillesEmargement[0];
    if (!feuille) {
      return NextResponse.json({ error: "Feuille d'émargement non trouvée" }, { status: 404 });
    }

    // Extraire tous les participants
    const participants = session.clients.flatMap((client) =>
      client.participants.map((p) => ({
        id: p.id,
        apprenant: p.apprenant,
      }))
    );

    // Identifier les participants non signés
    const signatures = feuille.signatures;
    const participantsNonSignesMatin = participants.filter(
      (p) => !signatures.some((s) => s.participantId === p.id && s.periode === "matin")
    );
    const participantsNonSignesAprem = participants.filter(
      (p) => !signatures.some((s) => s.participantId === p.id && (s.periode === "apres_midi" || s.periode === "aprem"))
    );

    // Combiner les participants non signés (sans doublons)
    const participantsARelancer = new Map<string, typeof participants[0] & { periodes: string[] }>();

    participantsNonSignesMatin.forEach((p) => {
      if (!participantsARelancer.has(p.id)) {
        participantsARelancer.set(p.id, { ...p, periodes: ["matin"] });
      } else {
        participantsARelancer.get(p.id)!.periodes.push("matin");
      }
    });

    participantsNonSignesAprem.forEach((p) => {
      if (!participantsARelancer.has(p.id)) {
        participantsARelancer.set(p.id, { ...p, periodes: ["après-midi"] });
      } else {
        const existing = participantsARelancer.get(p.id)!;
        if (!existing.periodes.includes("après-midi")) {
          existing.periodes.push("après-midi");
        }
      }
    });

    if (participantsARelancer.size === 0) {
      return NextResponse.json({
        success: true,
        message: "Tous les participants ont déjà signé",
        relances: 0,
      });
    }

    // Formater la date
    const dateFormatee = new Date(journee.date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Construire le lien d'émargement
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.example.com";
    const emargementUrl = `${baseUrl}/emargement/${feuille.token}`;

    // Envoyer les emails de relance
    const relancesEnvoyees: string[] = [];
    const erreurs: string[] = [];

    const organizationName = session.organization.nomCommercial || session.organization.name;
    const formateurNom = session.formateur ? `${session.formateur.prenom} ${session.formateur.nom}` : "L'intervenant";

    for (const [, participant] of participantsARelancer) {
      const periodesManquantes = participant.periodes.join(" et ");

      try {
        await sendEmail({
          to: participant.apprenant.email,
          subject: `Rappel : Émargement en attente - ${session.formation.titre}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">Rappel d'émargement</h2>

              <p>Bonjour ${participant.apprenant.prenom},</p>

              <p>${formateurNom} vous rappelle de signer votre feuille d'émargement pour la formation <strong>${session.formation.titre}</strong>.</p>

              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Date :</strong> ${dateFormatee}</p>
                <p style="margin: 10px 0 0;"><strong>Signature(s) manquante(s) :</strong> ${periodesManquantes}</p>
              </div>

              <p>Cliquez sur le bouton ci-dessous pour accéder à la feuille d'émargement :</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${emargementUrl}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Signer maintenant
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px;">
                Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
                <a href="${emargementUrl}" style="color: #059669;">${emargementUrl}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <p style="color: #9ca3af; font-size: 12px;">
                Cet email a été envoyé par ${organizationName}.
              </p>
            </div>
          `,
        });

        relancesEnvoyees.push(participant.apprenant.email);
      } catch (error) {
        console.error(`Erreur envoi relance à ${participant.apprenant.email}:`, error);
        erreurs.push(participant.apprenant.email);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${relancesEnvoyees.length} relance(s) envoyée(s)`,
      relances: relancesEnvoyees.length,
      erreurs: erreurs.length > 0 ? erreurs : undefined,
    });
  } catch (error) {
    console.error("Erreur API relance émargement:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des relances" },
      { status: 500 }
    );
  }
}
