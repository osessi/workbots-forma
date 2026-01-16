// ===========================================
// API RÉPONSE MESSAGE INTERVENANT (APPRENANT)
// ===========================================
// POST - Envoyer une réponse à un message de l'intervenant

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

// POST - Envoyer une réponse
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
    const { messageId, contenu, attachments } = body;

    if (!messageId) {
      return NextResponse.json({ error: "messageId requis" }, { status: 400 });
    }

    if (!contenu || contenu.trim().length === 0) {
      return NextResponse.json({ error: "Le contenu de la réponse est requis" }, { status: 400 });
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
        intervenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        session: {
          include: {
            formation: {
              select: { titre: true },
            },
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

    // Valider les pièces jointes
    const validAttachments = Array.isArray(attachments)
      ? attachments.filter(
          (att: { name?: string; url?: string }) => att.name && att.url
        )
      : [];

    // Récupérer les infos de l'apprenant
    const apprenant = await prisma.apprenant.findUnique({
      where: { id: apprenantId },
      select: { nom: true, prenom: true, email: true },
    });

    // Créer la réponse
    const reponse = await prisma.messageReponse.create({
      data: {
        messageId,
        apprenantId,
        organizationId,
        contenu: contenu.trim(),
        attachments: validAttachments.length > 0 ? validAttachments : undefined,
      },
    });

    // Envoyer un email de notification à l'intervenant
    try {
      const { sendEmail } = await import("@/lib/services/email");

      if (message.intervenant.email) {
        const organization = await prisma.organization.findUnique({
          where: { id: organizationId },
          select: { name: true, nomCommercial: true },
        });

        await sendEmail({
          to: message.intervenant.email,
          subject: `Nouvelle réponse de ${apprenant?.prenom} ${apprenant?.nom} - ${message.session.formation.titre}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Nouvelle réponse à votre message</h2>
              <p>Bonjour ${message.intervenant.prenom},</p>
              <p><strong>${apprenant?.prenom} ${apprenant?.nom}</strong> a répondu à votre message pour la formation <strong>${message.session.formation.titre}</strong>.</p>
              ${message.sujet ? `<p><strong>Sujet original :</strong> ${message.sujet}</p>` : ""}
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
                Connectez-vous à votre espace intervenant pour consulter cette réponse.
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
      console.error("[API] Erreur envoi email notification réponse:", emailError);
      // On ne bloque pas si l'email échoue
    }

    return NextResponse.json({
      success: true,
      reponse: {
        id: reponse.id,
        contenu: reponse.contenu,
        attachments: reponse.attachments || [],
        createdAt: reponse.createdAt,
      },
    });
  } catch (error) {
    console.error("[API] POST /api/apprenant/messages-intervenant/reponse error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
