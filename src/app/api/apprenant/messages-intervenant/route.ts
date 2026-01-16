// ===========================================
// API MESSAGES INTERVENANT (APPRENANT) - Correction 431
// ===========================================
// GET - Récupérer les messages de l'intervenant pour l'apprenant
// PATCH - Marquer un message comme lu

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

// GET - Récupérer les messages de l'intervenant pour une session
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    }

    const decoded = decodeApprenantToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
    }

    const { apprenantId, organizationId } = decoded;

    // Récupérer les sessions où l'apprenant participe
    const participations = await prisma.sessionParticipantNew.findMany({
      where: {
        apprenantId,
        client: {
          session: {
            organizationId,
            ...(sessionId ? { id: sessionId } : {}),
          },
        },
      },
      select: {
        client: {
          select: {
            sessionId: true,
          },
        },
      },
    });

    const sessionIds = [...new Set(participations.map((p) => p.client.sessionId))];

    if (sessionIds.length === 0) {
      return NextResponse.json({
        messages: [],
        unreadCount: 0,
      });
    }

    // Récupérer les messages pour ces sessions
    const messages = await prisma.messageIntervenant.findMany({
      where: {
        organizationId,
        sessionId: sessionId || { in: sessionIds },
        OR: [
          { envoyeATous: true },
          { destinatairesIds: { has: apprenantId } },
        ],
      },
      include: {
        intervenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            photoUrl: true,
          },
        },
        session: {
          select: {
            id: true,
            reference: true,
            nom: true,
            formation: {
              select: {
                id: true,
                titre: true,
              },
            },
          },
        },
        lectures: {
          where: { apprenantId },
          select: { readAt: true },
        },
        // Inclure les réponses de la conversation
        reponses: {
          where: {
            OR: [
              // Réponses de cet apprenant
              { apprenantId },
              // Réponses de l'intervenant à cet apprenant
              { destinataireApprenantId: apprenantId, typeAuteur: "intervenant" },
            ],
          },
          include: {
            apprenant: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
            intervenant: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Formater les messages avec les réponses
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      sujet: msg.sujet,
      contenu: msg.contenu,
      attachments: (msg.attachments as Array<{ name: string; url: string; size?: number; type?: string }>) || [],
      createdAt: msg.createdAt,
      isRead: msg.lectures.length > 0,
      readAt: msg.lectures[0]?.readAt || null,
      intervenant: {
        id: msg.intervenant.id,
        nom: msg.intervenant.nom,
        prenom: msg.intervenant.prenom,
        photoUrl: msg.intervenant.photoUrl,
      },
      session: {
        id: msg.session.id,
        reference: msg.session.reference,
        nom: msg.session.nom,
        formationTitre: msg.session.formation.titre,
      },
      // Réponses de la conversation
      reponses: msg.reponses.map((r) => ({
        id: r.id,
        contenu: r.contenu,
        attachments: r.attachments as Array<{ name: string; url: string; size?: number; type?: string }> || [],
        createdAt: r.createdAt,
        typeAuteur: r.typeAuteur,
        isReadByApprenant: r.isReadByApprenant,
        apprenant: r.apprenant ? {
          id: r.apprenant.id,
          nom: r.apprenant.nom,
          prenom: r.apprenant.prenom,
        } : null,
        intervenant: r.intervenant ? {
          id: r.intervenant.id,
          nom: r.intervenant.nom,
          prenom: r.intervenant.prenom,
        } : null,
      })),
      // Nombre de réponses de l'intervenant non lues par l'apprenant
      nombreReponsesNonLues: msg.reponses.filter((r) => r.typeAuteur === "intervenant" && !r.isReadByApprenant).length,
    }));

    const unreadCount = formattedMessages.filter((m) => !m.isRead).length;
    // Inclure aussi les réponses de l'intervenant non lues
    const unreadRepliesCount = formattedMessages.reduce((acc, m) => acc + m.nombreReponsesNonLues, 0);

    return NextResponse.json({
      messages: formattedMessages,
      unreadCount,
      unreadRepliesCount,
    });
  } catch (error) {
    console.error("[API] GET /api/apprenant/messages-intervenant error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Marquer un message comme lu + marquer les réponses de l'intervenant comme lues
export async function PATCH(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    }

    const decoded = decodeApprenantToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
    }

    const { apprenantId, organizationId } = decoded;
    const body = await request.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json({ error: "messageId requis" }, { status: 400 });
    }

    // Vérifier que le message existe et que l'apprenant y a accès
    const message = await prisma.messageIntervenant.findFirst({
      where: {
        id: messageId,
        organizationId,
        OR: [
          { envoyeATous: true },
          { destinatairesIds: { has: apprenantId } },
        ],
      },
      include: {
        session: {
          include: {
            clients: {
              include: {
                participants: {
                  where: { apprenantId },
                },
              },
            },
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message non trouvé ou accès refusé" }, { status: 404 });
    }

    // Vérifier que l'apprenant participe à la session
    const participe = message.session.clients.some((c) => c.participants.length > 0);
    if (!participe) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // 1. Créer ou mettre à jour la lecture du message principal (upsert)
    await prisma.messageIntervenantLecture.upsert({
      where: {
        messageId_apprenantId: {
          messageId,
          apprenantId,
        },
      },
      create: {
        messageId,
        apprenantId,
      },
      update: {
        readAt: new Date(),
      },
    });

    // 2. Marquer toutes les réponses de l'intervenant destinées à cet apprenant comme lues
    await prisma.messageReponse.updateMany({
      where: {
        messageId,
        organizationId,
        typeAuteur: "intervenant",
        destinataireApprenantId: apprenantId,
        isReadByApprenant: false,
      },
      data: {
        isReadByApprenant: true,
        readByApprenantAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] PATCH /api/apprenant/messages-intervenant error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
