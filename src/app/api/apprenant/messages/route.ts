// ===========================================
// API: MESSAGERIE APPRENANT
// GET - Récupérer les messages de l'apprenant
// POST - Envoyer un nouveau message ou répondre
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

// Décoder et valider le token apprenant (encodé en base64url JSON)
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

// Helper pour récupérer l'apprenant avec son organisation
async function getApprenantWithOrg(apprenantId: string, organizationId: string) {
  const apprenant = await prisma.apprenant.findFirst({
    where: {
      id: apprenantId,
      organizationId: organizationId,
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      organizationId: true,
      organization: {
        select: {
          id: true,
          name: true,
          nomCommercial: true,
          email: true,
        },
      },
    },
  });

  return apprenant;
}

// GET - Récupérer les messages de l'apprenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token requis" }, { status: 401 });
    }

    // Décoder le token
    const decoded = decodeApprenantToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
    }

    // Récupérer l'apprenant
    const apprenant = await getApprenantWithOrg(decoded.apprenantId, decoded.organizationId);
    if (!apprenant) {
      return NextResponse.json({ error: "Apprenant non trouvé" }, { status: 404 });
    }

    // Récupérer toutes les notifications liées à cet apprenant
    // - Messages entrants (de l'apprenant vers l'organisme) avec réponses
    // - Messages sortants (de l'organisme vers l'apprenant)
    const notifications = await prisma.notification.findMany({
      where: {
        organizationId: apprenant.organizationId,
        resourceType: "apprenant",
        resourceId: apprenant.id,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        titre: true,
        message: true,
        metadata: true,
        isRead: true,
        readAt: true,
        createdAt: true,
      },
    });

    // Formater les messages pour l'affichage côté apprenant
    const messages = notifications.map((notif) => {
      const metadata = (notif.metadata as Record<string, unknown>) || {};
      const direction = metadata.direction as string || "incoming";
      const replies = (metadata.replies as Array<{
        id: string;
        content: string;
        senderName: string;
        senderEmail: string;
        createdAt: string;
      }>) || [];

      // Pour les messages "incoming" (envoyés par l'apprenant),
      // les réponses sont celles de l'organisme
      // Pour les messages "outgoing" (envoyés par l'organisme),
      // l'apprenant est le destinataire

      if (direction === "outgoing") {
        // Message de l'organisme vers l'apprenant
        return {
          id: notif.id,
          type: "received" as const, // L'apprenant reçoit
          subject: (metadata.subject as string) || notif.titre || "Message",
          content: (metadata.messageOriginal as string) || notif.message,
          senderName: (metadata.senderName as string) || apprenant.organization.nomCommercial || apprenant.organization.name,
          senderEmail: (metadata.senderEmail as string) || apprenant.organization.email || "",
          isRead: metadata.readByApprenant as boolean || false,
          createdAt: notif.createdAt,
          replies: replies.filter(r => r.senderEmail === apprenant.email), // Réponses de l'apprenant
        };
      } else {
        // Message de l'apprenant vers l'organisme (avec potentiellement des réponses)
        return {
          id: notif.id,
          type: "sent" as const, // L'apprenant a envoyé
          subject: (metadata.subject as string) || notif.titre || "Message",
          content: (metadata.messageOriginal as string) || notif.message,
          senderName: `${apprenant.prenom} ${apprenant.nom}`,
          senderEmail: apprenant.email,
          isRead: true, // L'apprenant a envoyé, donc il l'a "lu"
          createdAt: notif.createdAt,
          // Les réponses sont celles de l'organisme
          replies: replies.map(r => ({
            ...r,
            fromOrganisme: r.senderEmail !== apprenant.email,
          })),
          hasNewReply: replies.length > 0 && !metadata.repliesReadByApprenant,
        };
      }
    });

    // Compter les messages non lus
    // - Messages reçus de l'organisme non lus
    // - Messages envoyés avec nouvelles réponses non lues
    const unreadCount = messages.filter((m) => {
      if (m.type === "received") return !m.isRead;
      if (m.type === "sent" && "hasNewReply" in m) return m.hasNewReply;
      return false;
    }).length;

    return NextResponse.json({
      messages,
      unreadCount,
      total: messages.length,
    });
  } catch (error) {
    console.error("[API] GET /api/apprenant/messages error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Envoyer un message ou répondre
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token requis" }, { status: 401 });
    }

    // Décoder le token
    const decoded = decodeApprenantToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
    }

    // Récupérer l'apprenant
    const apprenant = await getApprenantWithOrg(decoded.apprenantId, decoded.organizationId);
    if (!apprenant) {
      return NextResponse.json({ error: "Apprenant non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const { messageId, content, subject } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Le contenu du message est requis" },
        { status: 400 }
      );
    }

    // Si messageId est fourni, c'est une réponse à un message existant
    if (messageId) {
      // Récupérer la notification d'origine
      const notification = await prisma.notification.findFirst({
        where: {
          id: messageId,
          organizationId: apprenant.organizationId,
          resourceType: "apprenant",
          resourceId: apprenant.id,
        },
      });

      if (!notification) {
        return NextResponse.json(
          { error: "Message non trouvé" },
          { status: 404 }
        );
      }

      // Ajouter la réponse dans les metadata
      const currentMetadata = (notification.metadata as Record<string, unknown>) || {};
      const replies = (currentMetadata.replies as Array<Record<string, unknown>>) || [];

      const newReply = {
        id: `reply_${Date.now()}`,
        content: content.trim(),
        senderName: `${apprenant.prenom} ${apprenant.nom}`,
        senderEmail: apprenant.email,
        createdAt: new Date().toISOString(),
      };

      replies.push(newReply);

      // Mettre à jour la notification avec la nouvelle réponse
      await prisma.notification.update({
        where: { id: messageId },
        data: {
          metadata: {
            ...currentMetadata,
            replies,
            repliesReadByApprenant: true, // L'apprenant a vu ses propres réponses
          } as Prisma.InputJsonValue,
          // Marquer comme non lu pour l'organisme
          isRead: false,
          readAt: null,
        },
      });

      // Envoyer un email à l'organisme
      try {
        if (apprenant.organization.email) {
          const { sendEmail } = await import("@/lib/services/email");
          await sendEmail({
            to: apprenant.organization.email,
            subject: `Nouvelle réponse de ${apprenant.prenom} ${apprenant.nom}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Nouvelle réponse à un message</h2>
                <p><strong>De :</strong> ${apprenant.prenom} ${apprenant.nom} (${apprenant.email})</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #333;">${content.trim().replace(/\n/g, '<br>')}</p>
                </div>
                <p style="color: #666; font-size: 14px;">
                  Connectez-vous à votre espace pour répondre.
                </p>
              </div>
            `,
          });
        }
      } catch (emailError) {
        console.error("[API] Erreur envoi email réponse apprenant:", emailError);
      }

      return NextResponse.json({
        success: true,
        reply: newReply,
      });
    } else {
      // Nouveau message de l'apprenant vers l'organisme
      const notification = await prisma.notification.create({
        data: {
          organizationId: apprenant.organizationId,
          type: "SYSTEME",
          titre: subject || "Message d'un apprenant",
          message: `Nouveau message de ${apprenant.prenom} ${apprenant.nom}`,
          resourceType: "apprenant",
          resourceId: apprenant.id,
          actionUrl: `/automate/apprenants/${apprenant.id}`,
          isRead: false,
          metadata: {
            direction: "incoming",
            subject: subject || "Message",
            messageOriginal: content.trim(),
            apprenantNom: `${apprenant.prenom} ${apprenant.nom}`,
            apprenantEmail: apprenant.email,
            sentAt: new Date().toISOString(),
            replies: [],
          },
        },
      });

      // Envoyer un email à l'organisme
      try {
        if (apprenant.organization.email) {
          const { sendEmail } = await import("@/lib/services/email");
          await sendEmail({
            to: apprenant.organization.email,
            subject: `Nouveau message de ${apprenant.prenom} ${apprenant.nom}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">${subject || "Nouveau message"}</h2>
                <p><strong>De :</strong> ${apprenant.prenom} ${apprenant.nom} (${apprenant.email})</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #333;">${content.trim().replace(/\n/g, '<br>')}</p>
                </div>
                <p style="color: #666; font-size: 14px;">
                  Connectez-vous à votre espace pour répondre.
                </p>
              </div>
            `,
          });
        }
      } catch (emailError) {
        console.error("[API] Erreur envoi email message apprenant:", emailError);
      }

      return NextResponse.json({
        success: true,
        message: {
          id: notification.id,
          type: "sent",
          subject: subject || "Message",
          content: content.trim(),
          senderName: `${apprenant.prenom} ${apprenant.nom}`,
          senderEmail: apprenant.email,
          isRead: true,
          createdAt: notification.createdAt,
          replies: [],
        },
      });
    }
  } catch (error) {
    console.error("[API] POST /api/apprenant/messages error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
