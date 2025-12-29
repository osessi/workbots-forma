// ===========================================
// API GROUPE APPRENANT - GET /api/apprenant/groupe
// ===========================================
// Récupère les autres apprenants de la même formation

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

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis les query params
    const token = request.nextUrl.searchParams.get("token");
    const inscriptionId = request.nextUrl.searchParams.get("inscriptionId");

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

    const { apprenantId } = decoded;

    // Récupérer l'inscription de l'apprenant
    const inscription = await prisma.lMSInscription.findFirst({
      where: inscriptionId
        ? { id: inscriptionId, apprenantId }
        : { apprenantId },
      include: {
        formation: true,
      },
    });

    if (!inscription) {
      return NextResponse.json({
        apprenants: [],
        formationTitre: "",
        totalApprenants: 0,
      });
    }

    // Récupérer tous les apprenants inscrits à la même formation
    const inscriptions = await prisma.lMSInscription.findMany({
      where: {
        formationId: inscription.formationId,
      },
      include: {
        apprenant: true,
      },
    });

    // Formater les apprenants
    const apprenants = inscriptions.map((insc) => ({
      id: insc.apprenant.id,
      nom: insc.apprenant.nom,
      prenom: insc.apprenant.prenom,
      email: insc.apprenant.email,
    }));

    // Trier pour mettre l'utilisateur actuel en premier
    apprenants.sort((a, b) => {
      if (a.id === apprenantId) return -1;
      if (b.id === apprenantId) return 1;
      return a.nom.localeCompare(b.nom);
    });

    return NextResponse.json({
      apprenants,
      formationTitre: inscription.formation.titre,
      totalApprenants: apprenants.length,
    });
  } catch (error) {
    console.error("Erreur API groupe apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du groupe" },
      { status: 500 }
    );
  }
}
