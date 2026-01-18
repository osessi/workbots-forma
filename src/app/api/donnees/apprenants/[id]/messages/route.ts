// ===========================================
// API: MESSAGES APPRENANT
// GET - Récupérer les messages d'un apprenant
// POST - Répondre à un message
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

// GET - Récupérer les messages d'un apprenant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: apprenantId } = await params;

    // Authentification
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'apprenant existe et appartient à l'organisation
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id: apprenantId,
        organizationId: user.organizationId,
      },
      select: { id: true, nom: true, prenom: true, email: true },
    });

    if (!apprenant) {
      return NextResponse.json(
        { error: "Apprenant non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer toutes les notifications liées à cet apprenant
    // Les messages de contact sont stockés comme notifications de type SYSTEME
    // avec resourceType = "apprenant" et resourceId = apprenantId
    const notifications = await prisma.notification.findMany({
      where: {
        organizationId: user.organizationId,
        resourceType: "apprenant",
        resourceId: apprenantId,
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

    // Récupérer aussi les réponses de l'organisme (stockées dans une table dédiée si elle existe)
    // Pour l'instant, on récupère les messages depuis les notifications
    // et on formatera les réponses depuis les metadata

    // Formater les messages pour l'affichage (Correction 421: avec pièces jointes)
    const messages = notifications.map((notif) => {
      const metadata = notif.metadata as Record<string, any> || {};
      const direction = metadata.direction || "incoming";

      return {
        id: notif.id,
        type: direction, // "incoming" = reçu de l'apprenant, "outgoing" = envoyé par l'organisme
        subject: metadata.subject || "Message",
        content: metadata.messageOriginal || notif.message,
        senderName: direction === "outgoing"
          ? (metadata.senderName || "Organisme")
          : (metadata.apprenantNom || `${apprenant.prenom} ${apprenant.nom}`),
        senderEmail: direction === "outgoing"
          ? (metadata.senderEmail || "")
          : (metadata.apprenantEmail || apprenant.email),
        isRead: notif.isRead,
        readAt: notif.readAt,
        createdAt: notif.createdAt,
        // Réponses associées (si présentes dans metadata)
        replies: metadata.replies || [],
        // Correction 421: Pièces jointes
        attachments: metadata.attachments || [],
      };
    });

    // Compter les messages non lus
    const unreadCount = messages.filter((m) => !m.isRead).length;

    return NextResponse.json({
      messages,
      unreadCount,
      total: messages.length,
    });
  } catch (error) {
    console.error("[API] GET /api/donnees/apprenants/[id]/messages error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Répondre à un message ou envoyer un nouveau message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: apprenantId } = await params;

    // Authentification
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'apprenant existe
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id: apprenantId,
        organizationId: user.organizationId,
      },
      select: { id: true, nom: true, prenom: true, email: true },
    });

    if (!apprenant) {
      return NextResponse.json(
        { error: "Apprenant non trouvé" },
        { status: 404 }
      );
    }

    const body = await request.json();
    // Correction 421: Ajout du support des pièces jointes
    const { messageId, content, subject, attachments } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Le contenu du message est requis" },
        { status: 400 }
      );
    }

    // Correction 421: Valider les pièces jointes si présentes
    const validAttachments = Array.isArray(attachments)
      ? attachments.filter(
          (att: { name?: string; url?: string; size?: number; type?: string }) =>
            att.name && att.url
        )
      : [];

    // Récupérer l'organisation pour l'envoi d'email
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        id: true,
        name: true,
        nomCommercial: true,
        email: true,
      },
    });

    // Si messageId est fourni, c'est une réponse à un message existant
    if (messageId) {
      // Récupérer la notification d'origine
      const notification = await prisma.notification.findFirst({
        where: {
          id: messageId,
          organizationId: user.organizationId,
        },
      });

      if (!notification) {
        return NextResponse.json(
          { error: "Message original non trouvé" },
          { status: 404 }
        );
      }

      // Ajouter la réponse dans les metadata
      const currentMetadata = notification.metadata as Record<string, any> || {};
      const replies = currentMetadata.replies || [];

      // Correction 421: Inclure les pièces jointes dans la réponse
      const newReply = {
        id: `reply_${Date.now()}`,
        content: content.trim(),
        senderName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
        senderEmail: user.email,
        createdAt: new Date().toISOString(),
        attachments: validAttachments,
      };

      replies.push(newReply);

      // Mettre à jour la notification avec la nouvelle réponse
      // Correction 423: Réinitialiser repliesReadByApprenant pour déclencher le badge non lu
      await prisma.notification.update({
        where: { id: messageId },
        data: {
          metadata: {
            ...currentMetadata,
            replies,
            repliesReadByApprenant: false, // Correction 423: Nouvelle réponse = non lu par l'apprenant
            hasNewReply: true, // Correction 423: Indicateur de nouvelle réponse
          },
          // Marquer comme lu côté organisme
          isRead: true,
          readAt: notification.readAt || new Date(),
        },
      });

      // Envoyer un email à l'apprenant avec la réponse
      try {
        const { sendEmail } = await import("@/lib/services/email");
        await sendEmail({
          to: apprenant.email,
          subject: `Réponse à votre message - ${organization?.nomCommercial || organization?.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Réponse à votre message</h2>
              <p>Bonjour ${apprenant.prenom},</p>
              <p>Nous avons répondu à votre message :</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #333;">${content.trim().replace(/\n/g, '<br>')}</p>
              </div>
              <p style="color: #666; font-size: 14px;">
                Réponse de ${newReply.senderName}<br>
                ${organization?.nomCommercial || organization?.name}
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">
                Cet email a été envoyé automatiquement. Pour nous contacter, connectez-vous à votre espace apprenant.
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("[API] Erreur envoi email réponse:", emailError);
        // On ne bloque pas si l'email échoue
      }

      return NextResponse.json({
        success: true,
        reply: newReply,
      });
    } else {
      // Nouveau message de l'organisme vers l'apprenant
      // Créer une nouvelle notification sortante (Correction 421: avec pièces jointes)
      // Correction 422: actionUrl vers l'onglet Messages avec messageId
      const notification = await prisma.notification.create({
        data: {
          organizationId: user.organizationId,
          type: "SYSTEME",
          titre: subject || "Message de l'organisme",
          message: content.trim(),
          resourceType: "apprenant",
          resourceId: apprenantId,
          actionUrl: `/apprenants/${apprenantId}?tab=messages`, // Correction 422: redirection onglet Messages
          isRead: true, // Déjà "lu" car c'est nous qui l'envoyons
          readAt: new Date(),
          metadata: {
            direction: "outgoing",
            subject: subject || "Message de l'organisme",
            messageOriginal: content.trim(),
            senderName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
            senderEmail: user.email,
            sentAt: new Date().toISOString(),
            attachments: validAttachments, // Correction 421
            replies: [],
          },
        },
      });

      // Correction 422: Mettre à jour l'actionUrl avec le messageId
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          actionUrl: `/apprenants/${apprenantId}?tab=messages&messageId=${notification.id}`,
        },
      });

      // Envoyer un email à l'apprenant
      try {
        const { sendEmail } = await import("@/lib/services/email");
        await sendEmail({
          to: apprenant.email,
          subject: subject || `Message de ${organization?.nomCommercial || organization?.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">${subject || "Nouveau message"}</h2>
              <p>Bonjour ${apprenant.prenom},</p>
              <p>Vous avez reçu un nouveau message :</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #333;">${content.trim().replace(/\n/g, '<br>')}</p>
              </div>
              <p style="color: #666; font-size: 14px;">
                ${organization?.nomCommercial || organization?.name}
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">
                Cet email a été envoyé automatiquement. Pour répondre, connectez-vous à votre espace apprenant.
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("[API] Erreur envoi email message:", emailError);
        // On ne bloque pas si l'email échoue
      }

      // Correction 421: Inclure les pièces jointes dans la réponse
      return NextResponse.json({
        success: true,
        message: {
          id: notification.id,
          type: "outgoing",
          subject: subject || "Message de l'organisme",
          content: content.trim(),
          senderName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
          senderEmail: user.email,
          isRead: true,
          createdAt: notification.createdAt,
          attachments: validAttachments,
          replies: [],
        },
      });
    }
  } catch (error) {
    console.error("[API] POST /api/donnees/apprenants/[id]/messages error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
