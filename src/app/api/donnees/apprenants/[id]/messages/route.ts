// ===========================================
// API: MESSAGES APPRENANT
// GET - Récupérer les messages d'un apprenant
// POST - Répondre à un message
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// Helper pour créer le client Supabase
async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore
          }
        },
      },
    }
  );
}

// GET - Récupérer les messages d'un apprenant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: apprenantId } = await params;

    // Authentification
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son organisation
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'apprenant existe et appartient à l'organisation
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id: apprenantId,
        organizationId: dbUser.organizationId,
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
        organizationId: dbUser.organizationId,
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

    // Formater les messages pour l'affichage
    const messages = notifications.map((notif) => {
      const metadata = notif.metadata as Record<string, any> || {};
      return {
        id: notif.id,
        type: "incoming", // Message reçu de l'apprenant
        subject: metadata.subject || "Message",
        content: metadata.messageOriginal || notif.message,
        senderName: metadata.apprenantNom || `${apprenant.prenom} ${apprenant.nom}`,
        senderEmail: metadata.apprenantEmail || apprenant.email,
        isRead: notif.isRead,
        readAt: notif.readAt,
        createdAt: notif.createdAt,
        // Réponses associées (si présentes dans metadata)
        replies: metadata.replies || [],
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
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son organisation
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: {
        id: true,
        organizationId: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'apprenant existe
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id: apprenantId,
        organizationId: dbUser.organizationId,
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
    const { messageId, content, subject } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Le contenu du message est requis" },
        { status: 400 }
      );
    }

    // Récupérer l'organisation pour l'envoi d'email
    const organization = await prisma.organization.findUnique({
      where: { id: dbUser.organizationId },
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
          organizationId: dbUser.organizationId,
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

      const newReply = {
        id: `reply_${Date.now()}`,
        content: content.trim(),
        senderName: `${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim() || dbUser.email,
        senderEmail: dbUser.email,
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
          },
          // Marquer comme lu
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
      // Créer une nouvelle notification sortante
      const notification = await prisma.notification.create({
        data: {
          organizationId: dbUser.organizationId,
          type: "SYSTEME",
          titre: subject || "Message de l'organisme",
          message: content.trim(),
          resourceType: "apprenant",
          resourceId: apprenantId,
          actionUrl: `/apprenants/${apprenantId}`,
          isRead: true, // Déjà "lu" car c'est nous qui l'envoyons
          readAt: new Date(),
          metadata: {
            direction: "outgoing",
            subject: subject || "Message de l'organisme",
            messageOriginal: content.trim(),
            senderName: `${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim() || dbUser.email,
            senderEmail: dbUser.email,
            sentAt: new Date().toISOString(),
            replies: [],
          },
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

      return NextResponse.json({
        success: true,
        message: {
          id: notification.id,
          type: "outgoing",
          subject: subject || "Message de l'organisme",
          content: content.trim(),
          senderName: `${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim() || dbUser.email,
          senderEmail: dbUser.email,
          isRead: true,
          createdAt: notification.createdAt,
          replies: [],
        },
      });
    }
  } catch (error) {
    console.error("[API] POST /api/donnees/apprenants/[id]/messages error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
