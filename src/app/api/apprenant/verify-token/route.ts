// ===========================================
// API APPRENANT - GET /api/apprenant/verify-token
// ===========================================
// Vérifie un token d'invitation (magic link) pour première connexion

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token requis" },
        { status: 400 }
      );
    }

    // Chercher le token d'invitation
    const inviteToken = await prisma.apprenantInviteToken.findUnique({
      where: { token },
      include: {
        apprenant: {
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
        },
      },
    });

    if (!inviteToken) {
      return NextResponse.json(
        { error: "Lien invalide ou expiré" },
        { status: 401 }
      );
    }

    // Vérifier l'expiration
    if (new Date() > inviteToken.expiresAt) {
      return NextResponse.json(
        { error: "Ce lien a expiré. Veuillez demander un nouveau code de connexion." },
        { status: 401 }
      );
    }

    // Vérifier si déjà utilisé
    if (inviteToken.usedAt) {
      return NextResponse.json(
        { error: "Ce lien a déjà été utilisé. Veuillez utiliser le système de code de connexion." },
        { status: 401 }
      );
    }

    // Vérifier que l'apprenant est actif
    if (!inviteToken.apprenant.isActive) {
      return NextResponse.json(
        { error: "Votre compte a été désactivé. Contactez l'organisme de formation." },
        { status: 403 }
      );
    }

    // Marquer le token comme utilisé
    await prisma.apprenantInviteToken.update({
      where: { id: inviteToken.id },
      data: { usedAt: new Date() },
    });

    // Générer le token de session
    const sessionToken = generateSessionToken({
      id: inviteToken.apprenant.id,
      organizationId: inviteToken.apprenant.organizationId,
      email: inviteToken.apprenant.email,
    });

    console.log(`[APPRENANT AUTH] Première connexion via magic link pour ${inviteToken.apprenant.email}`);

    return NextResponse.json({
      success: true,
      token: sessionToken,
      apprenant: {
        id: inviteToken.apprenant.id,
        nom: inviteToken.apprenant.nom,
        prenom: inviteToken.apprenant.prenom,
        email: inviteToken.apprenant.email,
      },
      organization: {
        id: inviteToken.apprenant.organization.id,
        name: inviteToken.apprenant.organization.nomCommercial || inviteToken.apprenant.organization.name,
        slug: inviteToken.apprenant.organization.slug,
        logo: inviteToken.apprenant.organization.logo,
        primaryColor: inviteToken.apprenant.organization.primaryColor,
      },
    });
  } catch (error) {
    console.error("Erreur verify-token:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification" },
      { status: 500 }
    );
  }
}
