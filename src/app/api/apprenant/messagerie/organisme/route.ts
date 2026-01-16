// ===========================================
// API MESSAGERIE ORGANISME - APPRENANT
// ===========================================
// GET - Récupérer les messages entre apprenant et organisme
// POST - Envoyer un message à l'organisme

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

// GET - Récupérer les messages avec l'organisme
export async function GET(request: NextRequest) {
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

    // Récupérer les messages de la conversation apprenant <-> organisme
    const messages = await prisma.messageApprenantOrganisme.findMany({
      where: {
        apprenantId,
        organizationId,
      },
      orderBy: { createdAt: "asc" },
    });

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      sujet: msg.sujet,
      contenu: msg.contenu,
      attachments: (msg.attachments as Array<{ name: string; url: string; size?: number; type?: string }>) || [],
      createdAt: msg.createdAt,
      isRead: msg.typeAuteur === "apprenant" || msg.isReadByApprenant,
      typeAuteur: msg.typeAuteur,
    }));

    // Compter les messages non lus de l'organisme
    const unreadCount = messages.filter(
      (m) => m.typeAuteur === "organisme" && !m.isReadByApprenant
    ).length;

    return NextResponse.json({ messages: formattedMessages, unreadCount });
  } catch (error) {
    console.error("[API] GET /api/apprenant/messagerie/organisme error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Envoyer un message à l'organisme
export async function POST(request: NextRequest) {
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
    const { sujet, contenu, attachments } = body;

    if (!contenu || contenu.trim().length === 0) {
      return NextResponse.json({ error: "Le contenu du message est requis" }, { status: 400 });
    }

    // Valider les pièces jointes
    const validAttachments = Array.isArray(attachments)
      ? attachments.filter(
          (att: { name?: string; url?: string }) => att.name && att.url
        )
      : [];

    // Récupérer les infos de l'apprenant et de l'organisme
    const [apprenant, organization] = await Promise.all([
      prisma.apprenant.findUnique({
        where: { id: apprenantId },
        select: { nom: true, prenom: true, email: true },
      }),
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { name: true, nomCommercial: true, email: true },
      }),
    ]);

    if (!apprenant || !organization) {
      return NextResponse.json({ error: "Données non trouvées" }, { status: 404 });
    }

    // Créer le message
    const message = await prisma.messageApprenantOrganisme.create({
      data: {
        apprenantId,
        organizationId,
        sujet: sujet?.trim() || "Sans objet",
        contenu: contenu.trim(),
        attachments: validAttachments.length > 0 ? validAttachments : undefined,
        typeAuteur: "apprenant",
        isReadByApprenant: true,
        isReadByOrganisme: false,
      },
    });

    // Envoyer un email de notification à l'organisme
    try {
      const { sendEmail } = await import("@/lib/services/email");

      if (organization.email) {
        await sendEmail({
          to: organization.email,
          subject: `Nouveau message de ${apprenant.prenom} ${apprenant.nom} - ${sujet || "Sans objet"}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Nouveau message d'un apprenant</h2>
              <p>Vous avez reçu un nouveau message de <strong>${apprenant.prenom} ${apprenant.nom}</strong>.</p>
              <p><strong>Sujet :</strong> ${sujet || "Sans objet"}</p>
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
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">
                Connectez-vous à votre espace pour répondre à ce message.
              </p>
            </div>
          `,
        });
      }
    } catch (emailError) {
      console.error("[API] Erreur envoi email notification:", emailError);
      // On ne bloque pas si l'email échoue
    }

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        sujet: message.sujet,
        contenu: message.contenu,
        attachments: message.attachments || [],
        createdAt: message.createdAt,
        typeAuteur: message.typeAuteur,
        isRead: true,
      },
    });
  } catch (error) {
    console.error("[API] POST /api/apprenant/messagerie/organisme error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Marquer les messages de l'organisme comme lus
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

    // Marquer tous les messages de l'organisme comme lus
    await prisma.messageApprenantOrganisme.updateMany({
      where: {
        apprenantId,
        organizationId,
        typeAuteur: "organisme",
        isReadByApprenant: false,
      },
      data: {
        isReadByApprenant: true,
        readByApprenantAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] PATCH /api/apprenant/messagerie/organisme error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
