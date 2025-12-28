// ===========================================
// API APPRENANT - POST /api/apprenant/verify-code
// ===========================================
// Vérifie le code OTP et retourne un token de session

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Générer un token de session sécurisé
function generateSessionToken(apprenant: {
  id: string;
  organizationId: string;
  email: string;
}): string {
  const tokenData = {
    apprenantId: apprenant.id,
    organizationId: apprenant.organizationId,
    email: apprenant.email,
    // Token valide 30 jours
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
    // Ajout d'un random pour unicité
    nonce: crypto.randomBytes(8).toString("hex"),
  };
  return Buffer.from(JSON.stringify(tokenData)).toString("base64url");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email et code requis" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = code.trim();

    // Trouver l'apprenant
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
      return NextResponse.json(
        { error: "Code invalide ou expiré" },
        { status: 401 }
      );
    }

    // Trouver le code valide le plus récent
    const authCode = await prisma.apprenantAuthCode.findFirst({
      where: {
        apprenantId: apprenant.id,
        code: normalizedCode,
        usedAt: null, // Non utilisé
        expiresAt: { gt: new Date() }, // Non expiré
      },
      orderBy: { createdAt: "desc" },
    });

    if (!authCode) {
      // Incrémenter le compteur de tentatives pour le dernier code
      const lastCode = await prisma.apprenantAuthCode.findFirst({
        where: {
          apprenantId: apprenant.id,
          usedAt: null,
        },
        orderBy: { createdAt: "desc" },
      });

      if (lastCode) {
        await prisma.apprenantAuthCode.update({
          where: { id: lastCode.id },
          data: { attempts: { increment: 1 } },
        });

        // Bloquer après 5 tentatives
        if (lastCode.attempts >= 4) {
          await prisma.apprenantAuthCode.update({
            where: { id: lastCode.id },
            data: { expiresAt: new Date() }, // Expire le code
          });
          return NextResponse.json(
            { error: "Trop de tentatives. Veuillez demander un nouveau code." },
            { status: 429 }
          );
        }
      }

      return NextResponse.json(
        { error: "Code invalide ou expiré" },
        { status: 401 }
      );
    }

    // Vérifier le nombre de tentatives
    if (authCode.attempts >= 5) {
      return NextResponse.json(
        { error: "Trop de tentatives. Veuillez demander un nouveau code." },
        { status: 429 }
      );
    }

    // Marquer le code comme utilisé
    await prisma.apprenantAuthCode.update({
      where: { id: authCode.id },
      data: { usedAt: new Date() },
    });

    // Générer le token de session
    const token = generateSessionToken({
      id: apprenant.id,
      organizationId: apprenant.organizationId,
      email: apprenant.email,
    });

    console.log(`[APPRENANT AUTH] Connexion réussie pour ${apprenant.email}`);

    return NextResponse.json({
      success: true,
      token,
      apprenant: {
        id: apprenant.id,
        nom: apprenant.nom,
        prenom: apprenant.prenom,
        email: apprenant.email,
      },
      organization: {
        id: apprenant.organization.id,
        name: apprenant.organization.nomCommercial || apprenant.organization.name,
        slug: apprenant.organization.slug,
        logo: apprenant.organization.logo,
        primaryColor: apprenant.organization.primaryColor,
      },
    });
  } catch (error) {
    console.error("Erreur verify-code:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification" },
      { status: 500 }
    );
  }
}
