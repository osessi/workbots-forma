// ===========================================
// API PROFIL INTERVENANT - PUT /api/intervenant/profil
// ===========================================
// Permet à l'intervenant de mettre à jour son profil

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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, nom, prenom, telephone, fonction, structure } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 401 }
      );
    }

    // Décoder le token
    const decoded = decodeIntervenantToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    const { intervenantId, organizationId } = decoded;

    // Vérifier que l'intervenant existe
    const intervenant = await prisma.intervenant.findFirst({
      where: {
        id: intervenantId,
        organizationId,
        isActive: true,
      },
    });

    if (!intervenant) {
      return NextResponse.json(
        { error: "Intervenant non trouvé" },
        { status: 404 }
      );
    }

    // Mettre à jour le profil
    const updatedIntervenant = await prisma.intervenant.update({
      where: { id: intervenantId },
      data: {
        nom: nom || intervenant.nom,
        prenom: prenom || intervenant.prenom,
        telephone: telephone !== undefined ? telephone : intervenant.telephone,
        fonction: fonction !== undefined ? fonction : intervenant.fonction,
        structure: structure !== undefined ? structure : intervenant.structure,
      },
    });

    return NextResponse.json({
      success: true,
      intervenant: {
        id: updatedIntervenant.id,
        nom: updatedIntervenant.nom,
        prenom: updatedIntervenant.prenom,
        email: updatedIntervenant.email,
        telephone: updatedIntervenant.telephone,
        fonction: updatedIntervenant.fonction,
        structure: updatedIntervenant.structure,
        specialites: updatedIntervenant.specialites,
      },
    });
  } catch (error) {
    console.error("Erreur API mise à jour profil intervenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du profil" },
      { status: 500 }
    );
  }
}
