// ===========================================
// API: Organization by Domain - Récupérer l'organisation par domaine personnalisé
// GET /api/organization/by-domain?domain=xxx
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    if (!domain) {
      return NextResponse.json({ error: "Domaine requis" }, { status: 400 });
    }

    // Chercher l'organisation avec ce domaine personnalisé
    const organization = await prisma.organization.findFirst({
      where: {
        customDomain: domain.toLowerCase(),
        customDomainVerified: true, // Ne retourner que si le domaine est vérifié
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        nomCommercial: true,
        logo: true,
        primaryColor: true,
        secondaryColor: true,
        slug: true,
        // Informations publiques pour le branding
        telephone: true,
        email: true,
        adresse: true,
        ville: true,
        codePostal: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée ou domaine non vérifié" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.nomCommercial || organization.name,
        logo: organization.logo,
        primaryColor: organization.primaryColor,
        secondaryColor: organization.secondaryColor,
        slug: organization.slug,
        contact: {
          phone: organization.telephone,
          email: organization.email,
          address: organization.adresse,
          city: organization.ville,
          postalCode: organization.codePostal,
        },
      },
    });
  } catch (error) {
    console.error("[API] GET /api/organization/by-domain error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
