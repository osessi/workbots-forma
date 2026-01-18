// ===========================================
// Correction 433a: API ADMIN ACCESS - Impersonation
// Permet à un admin d'accéder à l'espace apprenant sans authentification
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import crypto from "crypto";
import { authenticateUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Générer un token de session sécurisé (même format que verify-token)
function generateSessionToken(apprenant: {
  id: string;
  organizationId: string;
  email: string;
}, isAdminAccess: boolean = false): string {
  const tokenData = {
    apprenantId: apprenant.id,
    organizationId: apprenant.organizationId,
    email: apprenant.email,
    // Token admin valide 1 heure seulement (sécurité)
    exp: Date.now() + (isAdminAccess ? 1 : 30 * 24) * 60 * 60 * 1000,
    // Flag pour indiquer accès admin
    isAdminAccess,
    // Ajout d'un random pour unicité
    nonce: crypto.randomBytes(8).toString("hex"),
  };
  return Buffer.from(JSON.stringify(tokenData)).toString("base64url");
}

// POST - Générer un token d'accès admin pour un apprenant
export async function POST(request: NextRequest) {
  try {
    // Authentification de l'admin
    const adminUser = await authenticateUser();
    if (!adminUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!adminUser.organizationId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const { apprenantId } = body;

    if (!apprenantId) {
      return NextResponse.json(
        { error: "L'ID de l'apprenant est requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'apprenant existe et appartient à la même organisation
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id: apprenantId,
        organizationId: adminUser.organizationId,
      },
    });

    if (!apprenant) {
      return NextResponse.json(
        { error: "Apprenant non trouvé ou accès non autorisé" },
        { status: 404 }
      );
    }

    // Générer le token de session admin (valide 1h)
    const sessionToken = generateSessionToken(
      {
        id: apprenant.id,
        organizationId: apprenant.organizationId,
        email: apprenant.email,
      },
      true // isAdminAccess = true
    );

    console.log(`[ADMIN ACCESS] ${adminUser.email} accède à l'espace de ${apprenant.email}`);

    return NextResponse.json({
      success: true,
      token: sessionToken,
      // URL de redirection avec le token
      redirectUrl: `/apprenant?token=${sessionToken}&admin=true`,
    });
  } catch (error) {
    console.error("Erreur admin-access:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de l'accès" },
      { status: 500 }
    );
  }
}
