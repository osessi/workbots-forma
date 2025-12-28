// ===========================================
// API PROFIL APPRENANT - PUT /api/apprenant/profil
// ===========================================
// Permet à l'apprenant de mettre à jour son profil

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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, nom, prenom, telephone, adresse } = body;

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

    // Mettre à jour le profil
    const updatedApprenant = await prisma.apprenant.update({
      where: { id: apprenantId },
      data: {
        nom: nom || apprenant.nom,
        prenom: prenom || apprenant.prenom,
        telephone: telephone !== undefined ? telephone : apprenant.telephone,
        adresse: adresse !== undefined ? adresse : apprenant.adresse,
      },
    });

    return NextResponse.json({
      success: true,
      apprenant: {
        id: updatedApprenant.id,
        nom: updatedApprenant.nom,
        prenom: updatedApprenant.prenom,
        email: updatedApprenant.email,
        telephone: updatedApprenant.telephone,
        adresse: updatedApprenant.adresse,
        entreprise: updatedApprenant.entreprise,
      },
    });
  } catch (error) {
    console.error("Erreur API mise à jour profil apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du profil" },
      { status: 500 }
    );
  }
}
