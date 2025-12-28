// ===========================================
// API APPRENANT - POST /api/apprenant/send-code
// ===========================================
// Envoie un code OTP à 6 chiffres par email pour connexion

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendEmail, generateApprenantOTPEmail } from "@/lib/services/email";

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

    // Trouver l'apprenant par email
    const apprenant = await prisma.apprenant.findFirst({
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

    if (!apprenant) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      // On simule un envoi réussi
      return NextResponse.json({
        success: true,
        message: "Si un compte existe avec cet email, un code de connexion a été envoyé.",
      });
    }

    // Vérifier le rate limiting (max 3 demandes par 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentCodes = await prisma.apprenantAuthCode.count({
      where: {
        apprenantId: apprenant.id,
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
    await prisma.apprenantAuthCode.updateMany({
      where: {
        apprenantId: apprenant.id,
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
    await prisma.apprenantAuthCode.create({
      data: {
        apprenantId: apprenant.id,
        code,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Envoyer l'email avec le code
    const orgName = apprenant.organization.nomCommercial || apprenant.organization.name;
    const emailContent = generateApprenantOTPEmail({
      prenom: apprenant.prenom,
      code,
      organizationName: orgName,
      organizationLogo: apprenant.organization.logo,
      primaryColor: apprenant.organization.primaryColor || undefined,
      expiresInMinutes: 10,
    });

    await sendEmail({
      to: apprenant.email,
      toName: `${apprenant.prenom} ${apprenant.nom}`,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      type: "VERIFICATION_CODE",
      apprenantId: apprenant.id,
    }, apprenant.organization.id);

    console.log(`[APPRENANT AUTH] Code OTP envoyé à ${apprenant.email}`);

    return NextResponse.json({
      success: true,
      message: "Code de connexion envoyé par email",
      // En dev, on peut retourner le code pour faciliter les tests
      ...(process.env.NODE_ENV === "development" && { devCode: code }),
    });
  } catch (error) {
    console.error("Erreur send-code:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du code" },
      { status: 500 }
    );
  }
}
