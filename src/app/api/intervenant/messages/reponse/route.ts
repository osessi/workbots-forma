// ===========================================
// API RÉPONSE INTERVENANT - Conversation avec apprenants
// ===========================================
// POST - Envoyer une réponse à un apprenant

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

// POST - Envoyer une réponse à un apprenant
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
    const { messageId, destinataireApprenantId, contenu, attachments } = body;

    if (!messageId) {
      return NextResponse.json({ error: "messageId requis" }, { status: 400 });
    }

    if (!destinataireApprenantId) {
      return NextResponse.json({ error: "destinataireApprenantId requis" }, { status: 400 });
    }

    if (!contenu || contenu.trim().length === 0) {
      return NextResponse.json({ error: "Le contenu de la réponse est requis" }, { status: 400 });
    }

    // Vérifier que le message appartient à cet intervenant
    const message = await prisma.messageIntervenant.findFirst({
      where: {
        id: messageId,
        intervenantId,
        organizationId,
      },
      include: {
        session: {
          include: {
            formation: {
              select: { titre: true },
            },
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message non trouvé ou accès refusé" }, { status: 404 });
    }

    // Vérifier que l'apprenant destinataire existe
    const apprenant = await prisma.apprenant.findUnique({
      where: { id: destinataireApprenantId },
      select: { id: true, nom: true, prenom: true, email: true },
    });

    if (!apprenant) {
      return NextResponse.json({ error: "Apprenant non trouvé" }, { status: 404 });
    }

    // Valider les pièces jointes
    const validAttachments = Array.isArray(attachments)
      ? attachments.filter(
          (att: { name?: string; url?: string }) => att.name && att.url
        )
      : [];

    // Récupérer les infos de l'intervenant pour l'email
    const intervenant = await prisma.intervenant.findUnique({
      where: { id: intervenantId },
      select: { nom: true, prenom: true },
    });

    // Créer la réponse de l'intervenant
    const reponse = await prisma.messageReponse.create({
      data: {
        messageId,
        typeAuteur: "intervenant",
        intervenantId,
        destinataireApprenantId,
        contenu: contenu.trim(),
        attachments: validAttachments.length > 0 ? validAttachments : undefined,
        organizationId,
        // La réponse de l'intervenant n'est pas lue par l'apprenant par défaut
        isReadByApprenant: false,
        // Pas de lecture intervenant nécessaire pour ses propres réponses
        isReadByIntervenant: true,
        readByIntervenantAt: new Date(),
      },
      include: {
        intervenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    // Envoyer un email de notification à l'apprenant
    try {
      const { sendEmail } = await import("@/lib/services/email");

      if (apprenant.email) {
        const organization = await prisma.organization.findUnique({
          where: { id: organizationId },
          select: { name: true, nomCommercial: true },
        });

        await sendEmail({
          to: apprenant.email,
          subject: `Réponse de ${intervenant?.prenom} ${intervenant?.nom} - ${message.session.formation.titre}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Nouvelle réponse de votre formateur</h2>
              <p>Bonjour ${apprenant.prenom},</p>
              <p>Votre formateur <strong>${intervenant?.prenom} ${intervenant?.nom}</strong> a répondu à votre message pour la formation <strong>${message.session.formation.titre}</strong>.</p>
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
                Connectez-vous à votre espace apprenant pour consulter cette réponse et continuer la conversation.
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
      console.error("[API] Erreur envoi email notification réponse intervenant:", emailError);
      // On ne bloque pas si l'email échoue
    }

    return NextResponse.json({
      success: true,
      reponse: {
        id: reponse.id,
        contenu: reponse.contenu,
        attachments: reponse.attachments || [],
        createdAt: reponse.createdAt,
        typeAuteur: reponse.typeAuteur,
        intervenant: reponse.intervenant,
        destinataireApprenantId: reponse.destinataireApprenantId,
      },
    });
  } catch (error) {
    console.error("[API] POST /api/intervenant/messages/reponse error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
