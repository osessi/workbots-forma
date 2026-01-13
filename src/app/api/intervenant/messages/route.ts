// ===========================================
// API MESSAGES INTERVENANT - Correction 431
// ===========================================
// GET - Récupérer les messages envoyés par l'intervenant
// POST - Envoyer un message aux apprenants d'une session

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

    // Vérifier expiration
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

// GET - Récupérer les messages d'une session
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") ||
                  request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    }

    const decoded = decodeIntervenantToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
    }

    const { intervenantId, organizationId } = decoded;
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId requis" }, { status: 400 });
    }

    // Vérifier que l'intervenant a accès à cette session
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
    });

    if (!session) {
      return NextResponse.json({ error: "Session non trouvée ou accès refusé" }, { status: 404 });
    }

    // Récupérer les messages de cette session envoyés par cet intervenant
    const messages = await prisma.messageIntervenant.findMany({
      where: {
        sessionId,
        intervenantId,
        organizationId,
      },
      include: {
        lectures: {
          select: {
            apprenantId: true,
            readAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Liste des apprenants de la session
    const apprenants = session.clients.flatMap((client) =>
      client.participants.map((p) => p.apprenant)
    );

    // Formater les messages avec le statut de lecture
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      sujet: msg.sujet,
      contenu: msg.contenu,
      attachments: msg.attachments as Array<{ name: string; url: string; size?: number; type?: string }> || [],
      envoyeATous: msg.envoyeATous,
      destinatairesIds: msg.destinatairesIds,
      createdAt: msg.createdAt,
      // Statistiques de lecture
      nombreDestinataires: msg.envoyeATous ? apprenants.length : msg.destinatairesIds.length,
      nombreLectures: msg.lectures.length,
      lectures: msg.lectures.map((l) => ({
        apprenantId: l.apprenantId,
        readAt: l.readAt,
      })),
    }));

    return NextResponse.json({
      messages: formattedMessages,
      apprenants,
    });
  } catch (error) {
    console.error("[API] GET /api/intervenant/messages error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Envoyer un nouveau message
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") ||
                  request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    }

    const decoded = decodeIntervenantToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
    }

    const { intervenantId, organizationId } = decoded;
    const body = await request.json();
    const { sessionId, sujet, contenu, attachments, destinatairesIds } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId requis" }, { status: 400 });
    }

    if (!contenu || contenu.trim().length === 0) {
      return NextResponse.json({ error: "Le contenu du message est requis" }, { status: 400 });
    }

    // Vérifier que l'intervenant a accès à cette session
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
          select: { titre: true },
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
    });

    if (!session) {
      return NextResponse.json({ error: "Session non trouvée ou accès refusé" }, { status: 404 });
    }

    // Liste des apprenants de la session
    const apprenants = session.clients.flatMap((client) =>
      client.participants.map((p) => p.apprenant)
    );

    // Déterminer les destinataires
    const envoyeATous = !destinatairesIds || destinatairesIds.length === 0;
    const destinatairesFinals = envoyeATous
      ? apprenants.map((a) => a.id)
      : destinatairesIds.filter((id: string) => apprenants.some((a) => a.id === id));

    if (destinatairesFinals.length === 0) {
      return NextResponse.json({ error: "Aucun destinataire valide" }, { status: 400 });
    }

    // Valider les pièces jointes
    const validAttachments = Array.isArray(attachments)
      ? attachments.filter(
          (att: { name?: string; url?: string }) => att.name && att.url
        )
      : [];

    // Créer le message
    const message = await prisma.messageIntervenant.create({
      data: {
        sessionId,
        intervenantId,
        organizationId,
        sujet: sujet?.trim() || null,
        contenu: contenu.trim(),
        attachments: validAttachments.length > 0 ? validAttachments : undefined,
        envoyeATous,
        destinatairesIds: envoyeATous ? [] : destinatairesFinals,
      },
    });

    // Récupérer l'intervenant pour l'email
    const intervenant = await prisma.intervenant.findUnique({
      where: { id: intervenantId },
      select: { nom: true, prenom: true },
    });

    // Récupérer l'organisation pour l'email
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, nomCommercial: true },
    });

    // Envoyer des emails aux destinataires (optionnel, ne bloque pas si erreur)
    try {
      const { sendEmail } = await import("@/lib/services/email");

      const destinatairesEmails = apprenants
        .filter((a) => envoyeATous || destinatairesFinals.includes(a.id))
        .filter((a) => a.email);

      for (const apprenant of destinatairesEmails) {
        await sendEmail({
          to: apprenant.email,
          subject: sujet
            ? `${sujet} - ${session.formation.titre}`
            : `Nouveau message de votre formateur - ${session.formation.titre}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Message de votre formateur</h2>
              <p>Bonjour ${apprenant.prenom},</p>
              <p>Votre formateur <strong>${intervenant?.prenom} ${intervenant?.nom}</strong> vous a envoyé un message pour la formation <strong>${session.formation.titre}</strong>.</p>
              ${sujet ? `<p><strong>Sujet :</strong> ${sujet}</p>` : ""}
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #333; white-space: pre-wrap;">${contenu.trim()}</p>
              </div>
              ${validAttachments.length > 0 ? `
                <p><strong>Pièces jointes :</strong></p>
                <ul>
                  ${validAttachments.map((att: { name: string; url: string }) => `
                    <li><a href="${att.url}" target="_blank">${att.name}</a></li>
                  `).join("")}
                </ul>
              ` : ""}
              <p style="color: #666; font-size: 14px;">
                Connectez-vous à votre espace apprenant pour consulter ce message.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">
                ${organization?.nomCommercial || organization?.name}
              </p>
            </div>
          `,
        });
      }
    } catch (emailError) {
      console.error("[API] Erreur envoi emails message intervenant:", emailError);
      // On ne bloque pas si les emails échouent
    }

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        sujet: message.sujet,
        contenu: message.contenu,
        attachments: message.attachments,
        envoyeATous: message.envoyeATous,
        destinatairesIds: message.destinatairesIds,
        createdAt: message.createdAt,
        nombreDestinataires: destinatairesFinals.length,
        nombreLectures: 0,
      },
    });
  } catch (error) {
    console.error("[API] POST /api/intervenant/messages error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
