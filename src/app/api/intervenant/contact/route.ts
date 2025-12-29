// ===========================================
// API INTERVENANT CONTACT - POST /api/intervenant/contact
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/services/email";

export const dynamic = "force-dynamic";

function decodeIntervenantToken(token: string): { intervenantId: string; organizationId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));
    if (!decoded.intervenantId || !decoded.organizationId) return null;
    if (decoded.exp && decoded.exp < Date.now()) return null;
    return { intervenantId: decoded.intervenantId, organizationId: decoded.organizationId };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, subject, message } = body;

    if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    const decoded = decodeIntervenantToken(token);
    if (!decoded) return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    if (!message) return NextResponse.json({ error: "Message requis" }, { status: 400 });

    const { intervenantId, organizationId } = decoded;

    // Récupérer l'intervenant et l'organisation
    const intervenant = await prisma.intervenant.findFirst({
      where: { id: intervenantId, organizationId },
      include: {
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

    if (!intervenant) {
      return NextResponse.json({ error: "Intervenant non trouvé" }, { status: 404 });
    }

    // Envoyer l'email à l'organisation
    if (intervenant.organization.email) {
      const subjectLabels: Record<string, string> = {
        question: "Question générale",
        technique: "Problème technique",
        session: "Question sur une session",
        apprenant: "Question sur un apprenant",
        document: "Demande de document",
        autre: "Autre demande",
      };

      const subjectLabel = subjectLabels[subject] || "Message";

      await sendEmail({
        to: intervenant.organization.email,
        subject: `[Espace Intervenant] ${subjectLabel} - ${intervenant.prenom} ${intervenant.nom}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10B981;">Message d'un intervenant</h2>
            <p><strong>De :</strong> ${intervenant.prenom} ${intervenant.nom}</p>
            <p><strong>Email :</strong> ${intervenant.email}</p>
            <p><strong>Sujet :</strong> ${subjectLabel}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px;">
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              Ce message a été envoyé depuis l'espace intervenant.
            </p>
          </div>
        `,
        text: `Message de ${intervenant.prenom} ${intervenant.nom} (${intervenant.email})\n\nSujet: ${subjectLabel}\n\n${message}`,
        type: "OTHER",
      }, organizationId);
    }

    return NextResponse.json({ success: true, message: "Message envoyé" });
  } catch (error) {
    console.error("Erreur API contact intervenant:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
