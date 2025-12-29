// ===========================================
// API INTERVENANT - POST /api/intervenant/send-code
// ===========================================
// Envoie un code OTP à 6 chiffres par email pour connexion

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendEmail, generateIntervenantOTPEmail } from "@/lib/services/email";

export const dynamic = "force-dynamic";

// Générer un code à 6 chiffres
function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Trouver l'intervenant par email
    const intervenant = await prisma.intervenant.findFirst({
      where: {
        email: normalizedEmail,
        isActive: true,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            nomCommercial: true,
            slug: true,
            logo: true,
            primaryColor: true,
          },
        },
      },
    });

    if (!intervenant) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      // On simule un envoi réussi
      return NextResponse.json({
        success: true,
        message: "Si un compte existe avec cet email, un code de connexion a été envoyé.",
      });
    }

    // Vérifier le rate limiting (max 3 demandes par 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentCodes = await prisma.intervenantAuthCode.count({
      where: {
        intervenantId: intervenant.id,
        createdAt: { gte: tenMinutesAgo },
      },
    });

    if (recentCodes >= 3) {
      return NextResponse.json(
        { error: "Trop de demandes. Veuillez attendre quelques minutes." },
        { status: 429 }
      );
    }

    // Invalider les anciens codes non utilisés
    await prisma.intervenantAuthCode.updateMany({
      where: {
        intervenantId: intervenant.id,
        usedAt: null,
      },
      data: {
        expiresAt: new Date(), // Expire immédiatement
      },
    });

    // Générer un nouveau code
    const code = generateOTPCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Récupérer l'IP et User-Agent
    const ipAddress = request.headers.get("x-forwarded-for") ||
                      request.headers.get("x-real-ip") ||
                      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Créer le code en base
    await prisma.intervenantAuthCode.create({
      data: {
        intervenantId: intervenant.id,
        code,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Envoyer l'email avec le code
    const orgName = intervenant.organization.nomCommercial || intervenant.organization.name;
    const emailContent = generateIntervenantOTPEmail({
      prenom: intervenant.prenom,
      code,
      organizationName: orgName,
      organizationLogo: intervenant.organization.logo,
      primaryColor: intervenant.organization.primaryColor || undefined,
      expiresInMinutes: 10,
    });

    await sendEmail({
      to: intervenant.email!,
      toName: `${intervenant.prenom} ${intervenant.nom}`,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      type: "VERIFICATION_CODE",
    }, intervenant.organization.id);

    console.log(`[INTERVENANT AUTH] Code OTP envoyé à ${intervenant.email}`);

    return NextResponse.json({
      success: true,
      message: "Code de connexion envoyé par email",
      // En dev, on peut retourner le code pour faciliter les tests
      ...(process.env.NODE_ENV === "development" && { devCode: code }),
    });
  } catch (error) {
    console.error("Erreur send-code intervenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du code" },
      { status: 500 }
    );
  }
}
