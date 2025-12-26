// ===========================================
// API SIGNATURE ÉLECTRONIQUE - Envoi Code Vérification
// ===========================================
// POST /api/signatures/[token]/send-code - Envoyer un code de vérification

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// Générer un code à 6 chiffres
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST - Envoyer un code de vérification
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { method = "email" } = body; // "email" ou "sms"

    // Récupérer le document
    const document = await prisma.signatureDocument.findUnique({
      where: { token },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    // Vérifications de statut
    if (document.status === "SIGNED") {
      return NextResponse.json(
        { error: "Ce document a déjà été signé" },
        { status: 400 }
      );
    }

    if (document.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Ce document a été annulé" },
        { status: 410 }
      );
    }

    if (document.status === "EXPIRED" || (document.expiresAt && new Date() > document.expiresAt)) {
      return NextResponse.json(
        { error: "Le délai de signature a expiré" },
        { status: 410 }
      );
    }

    // Vérifier si SMS est demandé mais pas de numéro
    if (method === "sms" && !document.destinataireTel) {
      return NextResponse.json(
        { error: "Numéro de téléphone non disponible pour ce document" },
        { status: 400 }
      );
    }

    // Vérifier les limites de tentatives (max 5 codes par heure)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCodes = await prisma.signatureVerificationCode.count({
      where: {
        documentId: document.id,
        createdAt: { gt: oneHourAgo },
      },
    });

    if (recentCodes >= 5) {
      return NextResponse.json(
        { error: "Trop de demandes de code. Veuillez réessayer dans une heure." },
        { status: 429 }
      );
    }

    // Invalider les anciens codes
    await prisma.signatureVerificationCode.updateMany({
      where: {
        documentId: document.id,
        usedAt: null,
      },
      data: {
        expiresAt: new Date(), // Expire immédiatement
      },
    });

    // Générer un nouveau code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Enregistrer le code
    await prisma.signatureVerificationCode.create({
      data: {
        documentId: document.id,
        code,
        method,
        expiresAt,
      },
    });

    // Envoyer le code selon la méthode
    if (method === "sms" && document.destinataireTel) {
      // TODO: Intégrer un service SMS (Twilio, etc.)
      console.log(`[SIGNATURE] Code SMS ${code} envoyé à ${document.destinataireTel}`);

      // Pour le développement, on simule l'envoi
      // En production, utiliser un service comme Twilio
      /*
      await sendSMS({
        to: document.destinataireTel,
        message: `Votre code de vérification pour signer le document "${document.titre}" est: ${code}. Ce code expire dans 5 minutes.`,
      });
      */
    } else {
      // Envoi par email
      console.log(`[SIGNATURE] Code Email ${code} envoyé à ${document.destinataireEmail}`);

      // TODO: Intégrer l'envoi d'email
      // En production, utiliser Resend, SendGrid, etc.
      /*
      await sendEmail({
        to: document.destinataireEmail,
        subject: `Code de vérification pour signature - ${document.titre}`,
        html: `
          <p>Bonjour ${document.destinataireNom},</p>
          <p>Votre code de vérification pour signer le document "${document.titre}" est:</p>
          <h2 style="font-size: 32px; letter-spacing: 5px; text-align: center;">${code}</h2>
          <p>Ce code expire dans 5 minutes.</p>
          <p>Si vous n'avez pas demandé ce code, veuillez ignorer cet email.</p>
        `,
      });
      */
    }

    // Masquer partiellement l'info de destination
    const maskedDestination = method === "sms"
      ? document.destinataireTel?.replace(/^(\+?\d{2})(\d+)(\d{2})$/, "$1****$3") || ""
      : document.destinataireEmail.replace(/^(.{2})(.*)(@.*)$/, "$1****$3");

    return NextResponse.json({
      success: true,
      message: `Code de vérification envoyé par ${method === "sms" ? "SMS" : "email"}`,
      destination: maskedDestination,
      expiresIn: 300, // 5 minutes en secondes
      // En dev, on renvoie le code pour faciliter les tests
      ...(process.env.NODE_ENV === "development" && { code }),
    });
  } catch (error) {
    console.error("Erreur envoi code vérification:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du code" },
      { status: 500 }
    );
  }
}
