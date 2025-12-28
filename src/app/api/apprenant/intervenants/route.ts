// ===========================================
// API INTERVENANTS APPRENANT - GET /api/apprenant/intervenants
// ===========================================
// Récupère les intervenants liés à la formation de l'apprenant

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

    const { apprenantId, organizationId } = decoded;

    // Récupérer l'inscription pour avoir la formation
    const inscription = await prisma.lMSInscription.findFirst({
      where: inscriptionId
        ? { id: inscriptionId, apprenantId }
        : { apprenantId },
    });

    if (!inscription) {
      return NextResponse.json({ intervenants: [] });
    }

    // Récupérer les formateurs liés aux sessions de cette formation
    const sessions = await prisma.session.findMany({
      where: {
        formationId: inscription.formationId,
        formateurId: { not: null },
      },
      include: {
        formateur: true,
      },
    });

    // Créer une map pour éviter les doublons
    const intervenantsMap = new Map<string, {
      id: string;
      nom: string;
      prenom: string;
      email: string | null;
      telephone: string | null;
      fonction: string | null;
      specialites: string[];
      structure: string | null;
      role: "formateur" | "tuteur" | "expert";
    }>();

    for (const session of sessions) {
      if (session.formateur && !intervenantsMap.has(session.formateur.id)) {
        intervenantsMap.set(session.formateur.id, {
          id: session.formateur.id,
          nom: session.formateur.nom,
          prenom: session.formateur.prenom,
          email: session.formateur.email,
          telephone: session.formateur.telephone,
          fonction: session.formateur.fonction,
          specialites: session.formateur.specialites || [],
          structure: session.formateur.structure,
          role: "formateur",
        });
      }
    }

    // Convertir la map en tableau
    const intervenants = Array.from(intervenantsMap.values());

    return NextResponse.json({ intervenants });
  } catch (error) {
    console.error("Erreur API intervenants apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des intervenants" },
      { status: 500 }
    );
  }
}
