// ===========================================
// API CONSENTEMENT NEWSLETTER APPRENANT - POST /api/apprenant/newsletter-consent
// ===========================================
// Correction 567: Permet à l'apprenant de donner ou refuser son consentement newsletter

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, consent } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 401 }
      );
    }

    if (typeof consent !== "boolean") {
      return NextResponse.json(
        { error: "Le consentement doit être un booléen" },
        { status: 400 }
      );
    }

    // Décoder le token
    const decoded = decodeApprenantToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    const { apprenantId, organizationId } = decoded;

    // Vérifier que l'apprenant existe
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id: apprenantId,
        organizationId,
      },
    });

    if (!apprenant) {
      return NextResponse.json(
        { error: "Apprenant non trouvé" },
        { status: 404 }
      );
    }

    // Mettre à jour le consentement newsletter
    const updatedApprenant = await prisma.apprenant.update({
      where: { id: apprenantId },
      data: {
        newsletterConsent: consent,
        newsletterConsentDate: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      newsletterConsent: updatedApprenant.newsletterConsent,
      newsletterConsentDate: updatedApprenant.newsletterConsentDate,
    });
  } catch (error) {
    console.error("Erreur API consentement newsletter apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement du consentement" },
      { status: 500 }
    );
  }
}

// GET pour récupérer le statut du consentement
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 401 }
      );
    }

    // Décoder le token
    const decoded = decodeApprenantToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    const { apprenantId, organizationId } = decoded;

    // Récupérer l'apprenant avec le statut du consentement
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id: apprenantId,
        organizationId,
      },
      select: {
        newsletterConsent: true,
        newsletterConsentDate: true,
      },
    });

    if (!apprenant) {
      return NextResponse.json(
        { error: "Apprenant non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      newsletterConsent: apprenant.newsletterConsent,
      newsletterConsentDate: apprenant.newsletterConsentDate,
    });
  } catch (error) {
    console.error("Erreur API récupération consentement newsletter:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du consentement" },
      { status: 500 }
    );
  }
}
